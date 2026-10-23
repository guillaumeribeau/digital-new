import { getDb, type Prisma, type SiteOrder } from "@nova/database";
import { domainToASCII } from "node:url";
import { z } from "zod";
import { authenticate } from "./access";
import { CommercialError, digest, seal, unseal } from "./commercial-core";
import { queueOwnerNotification } from "./owner-notifications";
import { domainSupplementText, queueDomainInvitation, queueReviewInvitation, queueWorkflowEmail } from "./site-workflow-mail";

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
export async function workflowData(id: string, admin = false) {
  const o = await getDb().siteOrder.findUniqueOrThrow({ where: { id }, select: { reviewVersion: true, reviewUrl: true, previewUrl: true, finalApprovedAt: true, finalApprovedName: true, creationPaidAt: true, domainReadyAt: true, workflowVersion: true, subscriptionInviteSentAt: true, stripeSubscriptionId: true, subscriptionStatus: true,
    domainOptions: { where: { active: true }, orderBy: { createdAt: "asc" } }, domainSelection: true,
    reviewRounds: { orderBy: { number: "asc" }, include: { messages: { orderBy: { createdAt: "asc" }, include: { files: { select: { id: true, filename: true, sizeBytes: true } } } } } } } });
  const { stripeSubscriptionId, ...publicOrder } = o;
  const inbound = admin ? await getDb().siteInboundEmail.findMany({ where: { siteOrderId: id }, orderBy: { createdAt: "desc" }, take: 100 }) : [];
  return { ...publicOrder, receivingConfigured: admin ? !!(process.env.COMMERCIAL_REPLY_DOMAIN && process.env.RESEND_WEBHOOK_SECRET && process.env.RESEND_RECEIVING_API_KEY) : undefined, reviewExpired: !!o.creationPaidAt && o.creationPaidAt.getTime() + 30 * 86400000 < Date.now(), locked: !!(o.subscriptionInviteSentAt || stripeSubscriptionId), reviewUrl: o.reviewUrl || o.previewUrl,
    inboundEmails: inbound.map(e => ({ ...e, attachments: z.array(z.object({ id: z.string(), filename: z.string(), archived: z.boolean().optional() })).parse(e.attachments) })),
    deadline: o.creationPaidAt ? new Date(o.creationPaidAt.getTime() + 30 * 86400000) : null };
}
export async function adminWorkflow(h: Headers, id: string, input: unknown) {
  const actor = await authenticate(h);
  const d = z.object({ action: z.enum(["options", "close", "version", "deliver", "email", "review-resend", "domain-invite", "domain-reserved", "domain-email", "domain-renewal", "domain-ready", "retry-subscription"]), requestId: z.uuid().optional(), expectedVersion: z.number().int().optional(), renewalHtCents: cents.optional(), options: z.array(z.object({ domain: z.string(), initialHtCents: cents, renewalHtCents: cents, recommended: z.boolean() })).max(5).optional(), roundId: z.uuid().optional(), message: z.string().trim().min(2).max(10000).optional(), url: z.url().max(1000).optional(), quoteId: z.uuid().optional(), renewalAt: z.iso.date().optional() }).parse(input);
  return getDb().$transaction(async tx => {
    const o = await txOrder(tx, id);
    const previousMail = d.requestId && await tx.commercialEmail.findUnique({ where: { manualRequestId: d.requestId } });
    if (previousMail) { if (previousMail.siteOrderId !== id) throw new CommercialError("INVALID_ACTION"); return; }
    if (["review-resend", "domain-invite", "domain-email", "domain-renewal", "domain-reserved"].includes(d.action) && (!o.creationPaidAt || !d.requestId)) throw new CommercialError("INVALID_ACTION");
    if (d.action === "review-resend") {
      editable(o);
      if (await tx.reviewRound.count({ where: { siteOrderId: id, OR: [{ status: "OPEN" }, { reviewVersion: { gte: o.reviewVersion } }] } })) throw new CommercialError("REVIEW_WAITING");
      await queueReviewInvitation(tx, o, await tx.reviewRound.count({ where: { siteOrderId: id } }), d.requestId, d.message);
    } else if (d.action === "domain-invite") {
      await queueDomainInvitation(tx, o, d.requestId);
    } else if (d.action === "domain-email") {
      if (!d.message) throw new CommercialError("INVALID_ACTION");
      await queueWorkflowEmail(tx, o, { key: d.requestId!, requestId: d.requestId, kind: "SITE_DOMAIN_UPDATE", purpose: "domain", subject: "Votre nom de domaine Zelyweb : suivi", text: d.message });
    } else if (d.action === "domain-renewal") {
      if (!o.domainSelection?.purchasedAt || d.renewalHtCents === undefined || !d.renewalAt) throw new CommercialError("INVALID_ACTION");
      const previous = o.domainSelection.acceptedSnapshot as { renewalHtCents?: number };
      if (previous.renewalHtCents === d.renewalHtCents) throw new CommercialError("PRICE_UNCHANGED");
      const proposal = { id: d.requestId!, previousHtCents: previous.renewalHtCents || 0, renewalHtCents: d.renewalHtCents, renewalAt: d.renewalAt, proposedAt: new Date().toISOString(), approvedAt: null };
      const history = Array.isArray(o.domainSelection.renewalHistory) ? o.domainSelection.renewalHistory : [];
      await tx.domainSelection.update({ where: { siteOrderId: id }, data: { renewalProposal: proposal, renewalHistory: [...history, { ...proposal, event: "PROPOSED" }] } });
      await queueWorkflowEmail(tx, o, { key: d.requestId!, requestId: d.requestId, kind: "SITE_DOMAIN_RENEWAL", purpose: "domain", subject: "Votre domaine : changement de tarif au renouvellement", text: `Le tarif de renouvellement de ${o.domainSelection.domain} change pour l’échéance du ${d.renewalAt}. Ancien prix : ${((previous.renewalHtCents || 0) / 100).toFixed(2)} € HT/an. Nouveau prix : ${(d.renewalHtCents / 100).toFixed(2)} € HT/an. La prise en charge reste de 20 € HT/an ; le nouveau supplément est de ${(Math.max(0, d.renewalHtCents - 2000) / 100).toFixed(2)} € HT/an. Acceptez ce changement dans votre espace domaine. Aucun supplément ne sera prélevé automatiquement. Tout supplément sera facturé séparément avant renouvellement.` });
    } else if (d.action === "options") {
      if (o.subscriptionInviteSentAt || o.domainSelection?.purchasedAt || !d.options?.length || d.options.filter(x => x.recommended).length > 1) throw new CommercialError("INVALID_ACTION");
      if (o.domainSelection && o.domainSelection.kind !== "REQUESTED") throw new CommercialError("DOMAIN_ALREADY_SELECTED");
      const options = d.options.map(v => ({ ...v, domain: domainName(v.domain) }));
      if (new Set(options.map(x => x.domain)).size !== options.length) throw new CommercialError("INVALID_ACTION");
      await tx.domainOption.updateMany({ where: { siteOrderId: id }, data: { active: false } });
      await tx.domainOption.createMany({ data: options.map(v => ({ ...v, siteOrderId: id })) });
      if (d.requestId) await queueWorkflowEmail(tx, o, { key: d.requestId, requestId: d.requestId, kind: "SITE_DOMAIN_OPTIONS", purpose: "domain", subject: "Votre domaine : tarifs vérifiés et choix à confirmer", text: `Nous avons vérifié les propositions suivantes :\n\n${options.map(v => `${v.domain}\n${domainSupplementText(v.initialHtCents, v.renewalHtCents)}`).join("\n\n")}\n\nConfirmez votre choix et les tarifs dans votre espace domaine. Un supplément initial sera réglé sur devis séparé avant réservation. La disponibilité reste à confirmer lors de l’achat.` });
    } else if (d.action === "close") {
      editable(o);
      if (!d.roundId) throw new CommercialError("INVALID_ACTION");
      const result = await tx.reviewRound.updateMany({ where: { id: d.roundId, siteOrderId: id, status: "OPEN" }, data: { status: "CLOSED", closedAt: new Date() } });
      if (!result.count) throw new CommercialError("INVALID_ACTION");
    } else if (d.action === "version" || d.action === "deliver") {
      editable(o);
      if (d.expectedVersion !== undefined && d.expectedVersion !== o.reviewVersion) throw new CommercialError("STALE_QUOTE");
      const open = await tx.reviewRound.findFirst({ where: { siteOrderId: id, status: "OPEN" } });
      if (d.action === "deliver" && (!open || open.id !== d.roundId || !d.requestId || d.expectedVersion === undefined)) throw new CommercialError("INVALID_ACTION");
      if (d.action === "version" && open) throw new CommercialError("REVIEW_WAITING");
      const url = new URL(d.url || "");
      if (url.protocol !== "https:" || url.username || url.password) throw new CommercialError("INVALID_ACTION");
      if (open) await tx.reviewRound.update({ where: { id: open.id }, data: { status: "CLOSED", closedAt: new Date() } });
      const updated = await tx.siteOrder.update({ where: { id }, data: { reviewUrl: url.href, reviewVersion: { increment: 1 }, finalApprovedAt: null, finalApprovedVersion: null, finalApprovedName: null }, include: { project: { include: { lead: true } } } });
      await tx.project.update({ where: { id: o.projectId }, data: { previewUrl: url.href } });
      await queueReviewInvitation(tx, updated, await tx.reviewRound.count({ where: { siteOrderId: id } }), d.requestId, d.message);
    } else if (d.action === "email") {
      editable(o);
      if (!d.message) throw new CommercialError("INVALID_ACTION");
      await addReview(tx, o, crypto.randomUUID(), d.message, "ADMIN", []);
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
        const quoteId = d.quoteId || o.domainSelection.supplementQuoteId;
        const quote = quoteId && await tx.quote.findFirst({ where: { id: quoteId, leadId: o.project.leadId, paymentMode: o.mode, status: { in: ["PAID", "COMPLETED"] }, totalCents: { gte: Math.round(supplement * 1.2) } } });
        if (!quote) throw new CommercialError("PAYMENT_REQUIRED");
      }
      const reserved = d.action === "domain-reserved";
      await tx.domainSelection.update({ where: { siteOrderId: id }, data: { status: reserved ? "RESERVED" : "READY", purchasedAt: o.domainSelection.purchasedAt || new Date(), renewalAt: d.renewalAt ? new Date(d.renewalAt) : o.domainSelection.renewalAt, supplementQuoteId: d.quoteId || o.domainSelection.supplementQuoteId } });
      if (!reserved) await tx.siteOrder.update({ where: { id }, data: { domainReadyAt: new Date() } });
      if (reserved) await queueWorkflowEmail(tx, o, { key: d.requestId!, requestId: d.requestId, kind: "SITE_DOMAIN_RESERVED", purpose: "domain", subject: "Votre nom de domaine est réservé", text: `Le nom de domaine ${o.domainSelection.domain} est réservé pour votre projet. Sa configuration technique sera réalisée séparément. Cette confirmation ne signifie pas encore que votre site est en ligne.\n\n${domainSupplementText(snapshot.initialHtCents || 0, snapshot.renewalHtCents || 0)}${d.renewalAt ? `\nProchain renouvellement : ${d.renewalAt}.` : ""}` });
    }
    await tx.activityLog.create({ data: { actorId: actor.id, action: "WORKFLOW_" + d.action.toUpperCase(), projectId: o.projectId, leadId: o.project.leadId } });
  }, { timeout: 20000 });
}
type Upload = { filename: string; mime: string; content: Buffer };
export async function addReview(tx: Prisma.TransactionClient, o: SiteOrder, requestId: string, content: string, author: string, files: Upload[]) {
  const id = o.id;
  const existing = await tx.reviewMessage.findUnique({ where: { requestId }, include: { round: true } });
  if (existing) { if (existing.round.siteOrderId !== id || existing.content !== content) throw new CommercialError("INVALID_ACTION"); return false; }
  if (o.finalApprovedAt) throw new CommercialError("REVIEW_CLOSED");
  const last = await tx.reviewRound.findFirst({ where: { siteOrderId: id }, orderBy: { number: "desc" } });
  if (last?.status === "OPEN" || (last && last.reviewVersion >= o.reviewVersion)) throw new CommercialError("REVIEW_WAITING");
  let round;
  {
    const count = await tx.reviewRound.count({ where: { siteOrderId: id } });
    if (count >= 3) throw new CommercialError("REVIEW_LIMIT");
    round = await tx.reviewRound.create({ data: { siteOrderId: id, number: count + 1, reviewVersion: o.reviewVersion, status: "OPEN" } });
  }
  await tx.reviewMessage.create({ data: { requestId, roundId: round.id, author, content, files: { create: files.map(f => ({ filename: f.filename, mimeType: f.mime, sizeBytes: f.content.length, encrypted: seal(f.content.toString("base64")) })) } } });
  return true;
}
export async function clientWorkflow(id: string, input: unknown, files: Upload[] = []) {
  if (files.length > 3) throw new CommercialError("INVALID_ACTION");
  const d = z.object({ action: z.enum(["feedback", "approve", "domain", "extra-request", "domain-renewal"]), requestId: z.uuid().optional(), message: z.string().trim().min(2).max(10000).optional(), version: z.coerce.number().int().optional(), name: z.string().trim().min(2).max(200).optional(), optionId: z.uuid().optional(), domain: z.string().optional(), kind: z.enum(["OPTION", "OWNED", "REQUESTED"]).optional(), agreement: z.literal(true).optional() }).parse(input);
  return getDb().$transaction(async tx => {
    const o = await txOrder(tx, id);
    if (!o.creationPaidAt) throw new CommercialError("PAYMENT_REQUIRED");
    if (["feedback", "approve"].includes(d.action)) editable(o);
    if (d.action === "feedback") {
      if (!d.requestId || !d.message || o.creationPaidAt!.getTime() + 30 * 86400000 < Date.now()) throw new CommercialError("REVIEW_CLOSED");
      const previous = await tx.reviewMessage.findUnique({ where: { requestId: d.requestId }, include: { round: true } });
      if (previous) { if (previous.round.siteOrderId !== id || previous.content !== d.message) throw new CommercialError("INVALID_ACTION"); return; }
      if (d.version !== o.reviewVersion) throw new CommercialError("STALE_QUOTE");
      if (!await addReview(tx, o, d.requestId, d.message, "CLIENT", files)) return;
      await tx.siteOrder.update({ where: { id }, data: { finalApprovedAt: null, finalApprovedVersion: null, finalApprovedName: null } });
    } else if (d.action === "approve") {
      if (!d.name || d.agreement !== true || d.version !== o.reviewVersion || await tx.reviewRound.count({ where: { siteOrderId: id, status: "OPEN" } })) throw new CommercialError("INVALID_ACTION");
      if (await tx.reviewRound.count({ where: { siteOrderId: id, reviewVersion: { gte: o.reviewVersion } } })) throw new CommercialError("REVIEW_WAITING");
      if (o.finalApprovedAt && o.finalApprovedVersion === o.reviewVersion) return;
      await tx.siteOrder.update({ where: { id }, data: { finalApprovedAt: new Date(), finalApprovedVersion: o.reviewVersion, finalApprovedName: d.name } });
    } else if (d.action === "extra-request") {
      if (!d.requestId || !d.message) throw new CommercialError("INVALID_ACTION");
      const providerId = `portal-extra/${d.requestId}`;
      const existing = await tx.siteInboundEmail.findUnique({ where: { providerId } });
      if (existing) { if (existing.siteOrderId !== id || existing.content !== d.message) throw new CommercialError("INVALID_ACTION"); return; }
      await tx.siteInboundEmail.create({ data: { siteOrderId: id, providerId, purpose: "EXTRA", state: "QUOTE_REQUEST", sender: o.project.lead.email, subject: "Demande supplémentaire sur devis", content: d.message } });
    } else if (d.action === "domain-renewal") {
      const p = z.object({ id: z.uuid(), renewalHtCents: cents, renewalAt: z.string(), approvedAt: z.string().nullable() }).parse(o.domainSelection?.renewalProposal);
      if (!d.requestId || d.requestId !== p.id || d.agreement !== true || !d.name) throw new CommercialError("STALE_QUOTE");
      if (p.approvedAt) return;
      const snapshot = o.domainSelection!.acceptedSnapshot as Record<string, Prisma.JsonValue>;
      const approved = { ...p, approvedAt: new Date().toISOString(), approvedName: d.name };
      const history = Array.isArray(o.domainSelection!.renewalHistory) ? o.domainSelection!.renewalHistory : [];
      await tx.domainSelection.update({ where: { siteOrderId: id }, data: { renewalProposal: approved, renewalHistory: [...history, { ...approved, event: "APPROVED" }], acceptedSnapshot: { ...snapshot, renewalHtCents: p.renewalHtCents, renewalSupplementHtCents: Math.max(0, p.renewalHtCents - 2000) } } });
    } else {
      if (d.agreement !== true || !d.kind || o.domainSelection?.purchasedAt) throw new CommercialError("INVALID_ACTION");
      const option = d.kind === "OPTION" && d.optionId ? await tx.domainOption.findFirst({ where: { id: d.optionId, siteOrderId: id, active: true } }) : null;
      if (d.kind === "OPTION" && !option) throw new CommercialError("INVALID_ACTION");
      const domain = option?.domain || domainName(d.domain || "");
      const values = { optionId: option?.id || null, domain, kind: d.kind, status: d.kind === "REQUESTED" ? "REQUESTED" : "CONFIRMED", selectedAt: new Date(), acceptedSnapshot: { domain, initialHtCents: option?.initialHtCents || 0, renewalHtCents: option?.renewalHtCents || 0, includedAnnualHtCents: 2000, initialSupplementHtCents: Math.max(0, (option?.initialHtCents || 0) - 2000), renewalSupplementHtCents: Math.max(0, (option?.renewalHtCents || 0) - 2000), checkedAt: option?.checkedAt.toISOString() || null, agreement: "Choix soumis à disponibilité. Supplément initial et annuel approuvé ; facturation complémentaire distincte, sans prélèvement supplémentaire automatique." } };
      await tx.domainSelection.upsert({ where: { siteOrderId: id }, create: { siteOrderId: id, ...values }, update: values });
    }
    const key = ["feedback", "extra-request", "domain-renewal"].includes(d.action) ? d.requestId : d.action === "approve" ? String(o.reviewVersion) : digest(JSON.stringify({ optionId: d.optionId, domain: d.domain, kind: d.kind }));
    const count = d.action === "feedback" ? await tx.reviewRound.count({ where: { siteOrderId: id } }) : null;
    await queueOwnerNotification(tx, { siteOrderId: id, key: `workflow/${id}/${d.action}/${key}`, mode: o.mode, subject: d.action === "approve" ? "Version du site validée par le client" : d.action === "domain" ? "Choix de domaine reçu" : d.action === "extra-request" ? "Demande de devis supplémentaire" : d.action === "domain-renewal" ? "Nouveau tarif de renouvellement accepté" : `Nouveaux retours client — série ${count}/3`, text: `${o.project.lead.businessName} · ${o.project.lead.fullName}\n${count ? `Série ${count}/3 · ${files.length} fichier(s)\n` : ""}${d.message ? d.message.slice(0, 240) : d.name || "Consultez le choix de domaine dans la fiche projet."}\nLe détail complet est conservé dans le dossier.`, path: `/projets/${o.projectId}`, replyTo: o.project.lead.email });
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
  if (!o.finalApprovedAt || o.finalApprovedVersion !== o.reviewVersion || !domain || !["CONFIRMED", "RESERVED", "READY"].includes(domain.status) || !project.websiteUrl || domainName(new URL(project.websiteUrl).hostname.replace(/^www\./, "")) !== domain.domain.replace(/^www\./, "") || await tx.reviewRound.count({ where: { siteOrderId: o.id, status: "OPEN" } }) || (publication && !o.domainReadyAt)) throw new CommercialError("WORKFLOW_NOT_READY");
}
