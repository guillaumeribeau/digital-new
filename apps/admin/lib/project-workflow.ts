import { getDb, type Prisma, type SiteOrder } from "@nova/database";
import { domainToASCII } from "node:url";
import { z } from "zod";
import { authenticate } from "./access";
import { CommercialError, digest, seal, unseal } from "./commercial-core";
import { queueOwnerNotification } from "./owner-notifications";

export function domainName(value: string) {
  if (/[\s/:@?#\\]/.test(value.trim())) throw new CommercialError("INVALID_ACTION");
  const name = domainToASCII(value.trim().toLowerCase().replace(/\.$/, ""));
  if (name.length > 253 || !/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(name)) throw new CommercialError("INVALID_ACTION");
  return name;
}
const cents = z.coerce.number().int().min(0).max(1000000);
const txOrder = async (tx: Prisma.TransactionClient, id: string) => {
  z.uuid().parse(id);
  await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
  const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } }, domainSelection: true } });
  if (o.project.lead.deletedAt || o.project.stage === "CANCELLED") throw new CommercialError("INVALID_ACTION");
  return o;
};
function editable(o: SiteOrder) {
  if (!o.creationPaidAt || o.subscriptionInviteSentAt || o.stripeSubscriptionId) throw new CommercialError("INVALID_ACTION");
}
export async function workflowData(id: string) {
  const o = await getDb().siteOrder.findUniqueOrThrow({ where: { id }, select: { reviewVersion: true, reviewUrl: true, previewUrl: true, finalApprovedAt: true, finalApprovedName: true, creationPaidAt: true, domainReadyAt: true, workflowVersion: true, subscriptionInviteSentAt: true, stripeSubscriptionId: true, subscriptionStatus: true,
    domainOptions: { where: { active: true }, orderBy: { createdAt: "asc" } }, domainSelection: true,
    reviewRounds: { orderBy: { number: "asc" }, include: { messages: { orderBy: { createdAt: "asc" }, include: { files: { select: { id: true, filename: true, sizeBytes: true } } } } } } } });
  const { stripeSubscriptionId, ...publicOrder } = o;
  return { ...publicOrder, locked: !!(o.subscriptionInviteSentAt || stripeSubscriptionId), reviewUrl: o.reviewUrl || o.previewUrl, deadline: o.creationPaidAt ? new Date(o.creationPaidAt.getTime() + 30 * 86400000) : null };
}
export async function adminWorkflow(h: Headers, id: string, input: unknown) {
  const actor = await authenticate(h);
  const d = z.object({ action: z.enum(["options", "close", "version", "email", "domain-ready", "retry-subscription"]), options: z.array(z.object({ domain: z.string(), initialHtCents: cents, renewalHtCents: cents, recommended: z.boolean() })).max(5).optional(), roundId: z.uuid().optional(), message: z.string().trim().min(2).max(10000).optional(), url: z.url().max(1000).optional(), quoteId: z.uuid().optional(), renewalAt: z.iso.date().optional() }).parse(input);
  return getDb().$transaction(async tx => {
    const o = await txOrder(tx, id);
    if (d.action === "options") {
      if (o.subscriptionInviteSentAt || o.domainSelection?.purchasedAt || !d.options?.length || d.options.filter(x => x.recommended).length > 1) throw new CommercialError("INVALID_ACTION");
      if (o.domainSelection && o.domainSelection.kind !== "REQUESTED") throw new CommercialError("DOMAIN_ALREADY_SELECTED");
      const options = d.options.map(v => ({ ...v, domain: domainName(v.domain) }));
      if (new Set(options.map(x => x.domain)).size !== options.length) throw new CommercialError("INVALID_ACTION");
      await tx.domainOption.updateMany({ where: { siteOrderId: id }, data: { active: false } });
      await tx.domainOption.createMany({ data: options.map(v => ({ ...v, siteOrderId: id })) });
    } else if (d.action === "close") {
      editable(o);
      if (!d.roundId) throw new CommercialError("INVALID_ACTION");
      const result = await tx.reviewRound.updateMany({ where: { id: d.roundId, siteOrderId: id, status: "OPEN" }, data: { status: "CLOSED", closedAt: new Date() } });
      if (!result.count) throw new CommercialError("INVALID_ACTION");
    } else if (d.action === "version") {
      editable(o);
      const url = new URL(d.url || "");
      if (url.protocol !== "https:" || url.username || url.password) throw new CommercialError("INVALID_ACTION");
      await tx.siteOrder.update({ where: { id }, data: { reviewUrl: url.href, reviewVersion: { increment: 1 }, finalApprovedAt: null, finalApprovedVersion: null, finalApprovedName: null } });
      await tx.project.update({ where: { id: o.projectId }, data: { previewUrl: url.href } });
    } else if (d.action === "email") {
      editable(o);
      if (!d.message) throw new CommercialError("INVALID_ACTION");
      await addReview(tx, id, crypto.randomUUID(), d.message, "ADMIN", []);
      await tx.siteOrder.update({ where: { id }, data: { finalApprovedAt: null, finalApprovedVersion: null, finalApprovedName: null } });
    } else if (d.action === "retry-subscription") {
      if (!o.stripeSubscriptionId || o.firstSubscriptionPaidAt) throw new CommercialError("INVALID_ACTION");
      const { stripeClient } = await import("./commercial-payment");
      const sub = await stripeClient().subscriptions.retrieve(o.stripeSubscriptionId);
      if (sub.status !== "incomplete_expired" || sub.customer !== o.stripeCustomerId || sub.metadata.siteOrderId !== id) throw new CommercialError("INVALID_ACTION");
      await tx.commercialWebhook.upsert({ where: { key: `site-retired/${id}/${sub.id}` }, create: { key: `site-retired/${id}/${sub.id}`, provider: "INTERNAL" }, update: {} });
      await tx.siteOrder.update({ where: { id }, data: { stripeSubscriptionId: null, subscriptionStatus: null, subscriptionAttempt: null, subscriptionCheckoutSessionId: null, subscriptionCheckoutUrl: null, subscriptionCheckoutExpiresAt: null, billingAlert: false } });
    } else {
      if (!o.creationPaidAt || !o.domainSelection || o.domainSelection.kind === "REQUESTED") throw new CommercialError("INVALID_ACTION");
      const snapshot = o.domainSelection.acceptedSnapshot as { initialHtCents?: number; renewalHtCents?: number };
      const supplement = Math.max(0, (snapshot.initialHtCents || 0) - 2000);
      if (supplement) {
        const quote = d.quoteId && await tx.quote.findFirst({ where: { id: d.quoteId, leadId: o.project.leadId, paymentMode: o.mode, status: { in: ["PAID", "COMPLETED"] }, totalCents: { gte: Math.round(supplement * 1.2) } } });
        if (!quote) throw new CommercialError("PAYMENT_REQUIRED");
      }
      await tx.domainSelection.update({ where: { siteOrderId: id }, data: { status: "READY", purchasedAt: new Date(), renewalAt: d.renewalAt ? new Date(d.renewalAt) : null, supplementQuoteId: d.quoteId || null } });
      await tx.siteOrder.update({ where: { id }, data: { domainReadyAt: new Date() } });
    }
    await tx.activityLog.create({ data: { actorId: actor.id, action: "WORKFLOW_" + d.action.toUpperCase(), projectId: o.projectId, leadId: o.project.leadId } });
  }, { timeout: 20000 });
}
type Upload = { filename: string; mime: string; content: Buffer };
async function addReview(tx: Prisma.TransactionClient, id: string, requestId: string, content: string, author: string, files: Upload[]) {
  const existing = await tx.reviewMessage.findUnique({ where: { requestId }, include: { round: true } });
  if (existing) { if (existing.round.siteOrderId !== id || existing.content !== content) throw new CommercialError("INVALID_ACTION"); return false; }
  let round = await tx.reviewRound.findFirst({ where: { siteOrderId: id, status: "OPEN" } });
  if (!round) {
    const count = await tx.reviewRound.count({ where: { siteOrderId: id } });
    if (count >= 3) throw new CommercialError("REVIEW_LIMIT");
    round = await tx.reviewRound.create({ data: { siteOrderId: id, number: count + 1, status: "OPEN" } });
  }
  await tx.reviewMessage.create({ data: { requestId, roundId: round.id, author, content, files: { create: files.map(f => ({ filename: f.filename, mimeType: f.mime, sizeBytes: f.content.length, encrypted: seal(f.content.toString("base64")) })) } } });
  return true;
}
export async function clientWorkflow(id: string, input: unknown, files: Upload[] = []) {
  if (files.length > 3) throw new CommercialError("INVALID_ACTION");
  const d = z.object({ action: z.enum(["feedback", "approve", "domain"]), requestId: z.uuid().optional(), message: z.string().trim().min(2).max(10000).optional(), version: z.coerce.number().int().optional(), name: z.string().trim().min(2).max(200).optional(), optionId: z.uuid().optional(), domain: z.string().optional(), kind: z.enum(["OPTION", "OWNED", "REQUESTED"]).optional(), agreement: z.literal(true).optional() }).parse(input);
  return getDb().$transaction(async tx => {
    const o = await txOrder(tx, id);
    editable(o);
    if (d.action === "feedback") {
      if (!d.requestId || !d.message || o.creationPaidAt!.getTime() + 30 * 86400000 < Date.now()) throw new CommercialError("REVIEW_CLOSED");
      if (!await addReview(tx, id, d.requestId, d.message, "CLIENT", files)) return;
      await tx.siteOrder.update({ where: { id }, data: { finalApprovedAt: null, finalApprovedVersion: null, finalApprovedName: null } });
    } else if (d.action === "approve") {
      if (!d.name || d.agreement !== true || d.version !== o.reviewVersion || await tx.reviewRound.count({ where: { siteOrderId: id, status: "OPEN" } })) throw new CommercialError("INVALID_ACTION");
      if (o.finalApprovedAt && o.finalApprovedVersion === o.reviewVersion) return;
      await tx.siteOrder.update({ where: { id }, data: { finalApprovedAt: new Date(), finalApprovedVersion: o.reviewVersion, finalApprovedName: d.name } });
    } else {
      if (d.agreement !== true || !d.kind || o.domainSelection?.purchasedAt) throw new CommercialError("INVALID_ACTION");
      const option = d.kind === "OPTION" && d.optionId ? await tx.domainOption.findFirst({ where: { id: d.optionId, siteOrderId: id, active: true } }) : null;
      if (d.kind === "OPTION" && !option) throw new CommercialError("INVALID_ACTION");
      const domain = option?.domain || domainName(d.domain || "");
      const values = { optionId: option?.id || null, domain, kind: d.kind, status: d.kind === "REQUESTED" ? "REQUESTED" : "CONFIRMED", selectedAt: new Date(), acceptedSnapshot: { domain, initialHtCents: option?.initialHtCents || 0, renewalHtCents: option?.renewalHtCents || 0, includedAnnualHtCents: 2000, initialSupplementHtCents: Math.max(0, (option?.initialHtCents || 0) - 2000), renewalSupplementHtCents: Math.max(0, (option?.renewalHtCents || 0) - 2000), checkedAt: option?.checkedAt.toISOString() || null, agreement: "Choix soumis à disponibilité. Supplément initial et annuel approuvé ; facturation complémentaire distincte, sans prélèvement supplémentaire automatique." } };
      await tx.domainSelection.upsert({ where: { siteOrderId: id }, create: { siteOrderId: id, ...values }, update: values });
    }
    const key = d.action === "feedback" ? d.requestId : d.action === "approve" ? String(o.reviewVersion) : digest(JSON.stringify({ optionId: d.optionId, domain: d.domain, kind: d.kind }));
    await queueOwnerNotification(tx, { siteOrderId: id, key: `workflow/${id}/${d.action}/${key}`, mode: o.mode, subject: d.action === "approve" ? "Version du site validée par le client" : d.action === "domain" ? "Choix de domaine reçu" : "Nouveaux retours client", text: `${o.project.lead.businessName}\n${d.message || d.name || "Consultez le choix de domaine dans la fiche projet."}`, path: `/projets/${o.projectId}`, replyTo: o.project.lead.email });
  });
}
export function checkUpload(filename: string, content: Buffer): Upload {
  if (!content.length || content.length > 5 * 1024 * 1024) throw new CommercialError("INVALID_ACTION");
  const mime = content.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png" : content[0] === 255 && content[1] === 216 && content[2] === 255 ? "image/jpeg" : content.subarray(0,4).toString() === "RIFF" && content.subarray(8,12).toString() === "WEBP" ? "image/webp" : content.subarray(0,5).toString() === "%PDF-" ? "application/pdf" : null;
  if (!mime) throw new CommercialError("INVALID_ACTION");
  return { filename: filename.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 180) || "fichier", mime, content };
}
export async function reviewFile(id: string) {
  z.uuid().parse(id);
  const file = await getDb().reviewFile.findUniqueOrThrow({ where: { id }, include: { message: { include: { round: true } } } });
  const content = unseal(file.encrypted);
  if (typeof content !== "string") throw new CommercialError("INVALID_ACTION");
  return { ...file, content: Buffer.from(content, "base64"), siteOrderId: file.message.round.siteOrderId };
}
export async function requireWorkflowReady(tx: Prisma.TransactionClient, o: SiteOrder, publication = false) {
  if (!o.workflowVersion) return;
  const domain = await tx.domainSelection.findUnique({ where: { siteOrderId: o.id } });
  const project = await tx.project.findUniqueOrThrow({ where: { id: o.projectId } });
  if (!o.finalApprovedAt || o.finalApprovedVersion !== o.reviewVersion || !domain || !["CONFIRMED", "READY"].includes(domain.status) || !project.websiteUrl || domainName(new URL(project.websiteUrl).hostname.replace(/^www\./, "")) !== domain.domain.replace(/^www\./, "") || await tx.reviewRound.count({ where: { siteOrderId: o.id, status: "OPEN" } }) || (publication && !o.domainReadyAt)) throw new CommercialError("WORKFLOW_NOT_READY");
}
