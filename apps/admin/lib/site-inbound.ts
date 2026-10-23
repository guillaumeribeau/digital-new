import { Resend } from "resend";
import { getDb, type Prisma } from "@nova/database";
import { z } from "zod";
import { CommercialError, digest, seal, unseal } from "./commercial-core";
import { addReview } from "./project-workflow";
import { queueOwnerNotification } from "./owner-notifications";

export const receivingApiKey = () => process.env.RESEND_RECEIVING_API_KEY || process.env.RESEND_API_KEY;
export const inboundAttachment = z.object({ id: z.string(), filename: z.string(), contentType: z.string().optional(), archived: z.boolean().optional(), encrypted: z.string().optional() });
type IncomingEmail = { id: string; to: string[]; from: string; subject: string; text?: string | null; html?: string | null; attachments: { id: string; filename?: string | null; content_type?: string }[] };
const address = (s: string) => (s.match(/<([^<>]+)>/)?.[1] || s).trim().toLowerCase();
export async function fetchInboundAttachment(emailId: string, attachmentId: string) {
  const key = receivingApiKey(); if (!key) throw new CommercialError("CONFIGURATION_REQUIRED");
  const attachment = await new Resend(key).emails.receiving.attachments.get({ emailId, id: attachmentId });
  if (attachment.error || !attachment.data) throw new CommercialError("ATTACHMENT_UNAVAILABLE");
  const url = new URL(attachment.data.download_url);
  if (url.protocol !== "https:" || url.username || url.password) throw new CommercialError("ATTACHMENT_UNAVAILABLE");
  const response = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: "error", cache: "no-store" });
  if (!response.ok || Number(response.headers.get("content-length") || 0) > 8 * 1024 * 1024) throw new CommercialError("ATTACHMENT_TOO_LARGE");
  const chunks: Uint8Array[] = []; let size = 0; const reader = response.body?.getReader();
  if (reader) while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 8 * 1024 * 1024) { await reader.cancel(); throw new CommercialError("ATTACHMENT_TOO_LARGE"); } chunks.push(value); }
  return Buffer.concat(chunks);
}
export async function applySiteInbound(email: IncomingEmail) {
  let target: { token: string; purpose: string; version: number | null } | undefined;
  for (const recipient of email.to) {
    const parts = recipient.match(/<([^<>]+)>/)?.[1] || recipient;
    // The token is case-sensitive; only normalize the domain part of the address.
    const match = parts.trim().match(/^(s([0-9]{1,6})|d)-([A-Za-z0-9_-]{43})@(.+)$/);
    if (match && match[4].toLowerCase() === process.env.COMMERCIAL_REPLY_DOMAIN?.toLowerCase()) { target = { purpose: match[1] === "d" ? "DOMAIN" : "REVIEWS", version: match[2] ? Number(match[2]) : null, token: match[3] }; break; }
  }
  if (!target) return false;
  const db = getDb();
  const order = await db.siteOrder.findUnique({ where: { tokenHash: digest(target.token) }, include: { project: { include: { lead: true } } } });
  if (!order) return false;
  if (await db.siteInboundEmail.findUnique({ where: { providerId: email.id } })) return true;
  const attachments: z.infer<typeof inboundAttachment>[] = [];
  let archivedSize = 0;
  for (const file of email.attachments) {
    const item: z.infer<typeof inboundAttachment> = { id: file.id, filename: file.filename || "Pièce jointe", contentType: file.content_type, archived: false };
    if (archivedSize < 16 * 1024 * 1024) {
      try { const bytes = await fetchInboundAttachment(email.id, file.id); if (archivedSize + bytes.length <= 16 * 1024 * 1024) { item.encrypted = seal(bytes.toString("base64")); item.archived = true; archivedSize += bytes.length; } } catch { /* Retain metadata and expose a retrieval warning; never silently discard a file. */ }
    }
    attachments.push(item);
  }
  const content = email.text || (email.html || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ") || "Message sans texte. Consultez les pièces jointes.";
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${order.id}::uuid FOR UPDATE`;
    if (await tx.siteInboundEmail.findUnique({ where: { providerId: email.id } })) return;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id: order.id }, include: { project: { include: { lead: true } }, reviewRounds: { orderBy: { number: "desc" } } } });
    const last = o.reviewRounds[0];
    let state = target!.purpose === "DOMAIN" ? "DOMAIN_MESSAGE" : "DEFERRED";
    if (address(email.from) !== o.project.lead.email.toLowerCase()) state = "UNVERIFIED_SENDER";
    else if (!o.creationPaidAt || o.project.stage === "CANCELLED" || o.project.lead.deletedAt) state = "PROJECT_CLOSED";
    else if (target!.purpose === "REVIEWS") {
      if (o.reviewRounds.length >= 3 || o.finalApprovedAt || o.subscriptionInviteSentAt || o.stripeSubscriptionId || o.creationPaidAt.getTime() + 30 * 86400000 < Date.now()) state = "QUOTE_REQUEST";
      else if (target!.version === o.reviewVersion && last?.status !== "OPEN" && (!last || last.reviewVersion < o.reviewVersion)) {
        await addReview(tx, o, email.id, content.slice(0, 10000), "EMAIL", []); state = "SUBMITTED";
        await tx.siteOrder.update({ where: { id: o.id }, data: { finalApprovedAt: null, finalApprovedVersion: null, finalApprovedName: null } });
      }
    }
    await tx.siteInboundEmail.create({ data: { siteOrderId: o.id, providerId: email.id, purpose: target!.purpose, reviewVersion: target!.version, state, sender: email.from, subject: email.subject || "Réponse client", content, attachments: attachments as Prisma.InputJsonValue } });
    const number = state === "SUBMITTED" ? o.reviewRounds.length + 1 : last?.number;
    await queueOwnerNotification(tx, { siteOrderId: o.id, key: `site-inbound/${email.id}`, mode: o.mode, subject: state === "SUBMITTED" ? `Nouveaux retours par e-mail — série ${number}/3` : state === "QUOTE_REQUEST" ? "Demande supplémentaire reçue par e-mail" : target!.purpose === "DOMAIN" ? "Réponse client concernant le domaine" : "E-mail client conservé hors série", text: `${o.project.lead.businessName} · ${o.project.lead.fullName}\n${number ? `Série ${number}/3\n` : ""}${state === "DEFERRED" ? "Le client attend une version corrigée : aucune nouvelle série n’a été ouverte.\n" : ""}${state === "UNVERIFIED_SENDER" ? "L’expéditeur ne correspond pas au client : vérifier son identité avant traitement.\n" : ""}${content.slice(0, 240)}\n${attachments.length} pièce(s) jointe(s).${attachments.some(f => !f.archived) ? " Certains fichiers sont à récupérer depuis Resend : consultez le dossier." : ""}\nLe message complet est conservé dans l’admin.`, path: `/projets/${o.projectId}`, replyTo: o.project.lead.email });
  }, { timeout: 20000 });
  return true;
}
export async function storedInboundAttachment(id: string, attachmentId: string) {
  const row = await getDb().siteInboundEmail.findUniqueOrThrow({ where: { id }, include: { order: { include: { project: { include: { lead: true } } } } } });
  if (row.order.project.lead.deletedAt) throw new CommercialError("INVALID_ACTION");
  const attachment = z.array(inboundAttachment).parse(row.attachments).find(a => a.id === attachmentId);
  if (!attachment) throw new CommercialError("INVALID_ACTION");
  const bytes = attachment.encrypted ? Buffer.from(z.string().parse(unseal(attachment.encrypted)), "base64") : await fetchInboundAttachment(row.providerId, attachmentId);
  return { filename: attachment.filename, bytes };
}
