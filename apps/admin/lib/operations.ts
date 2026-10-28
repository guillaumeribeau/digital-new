import { workspaceDb } from "./brand-context";
import { leadStatusForStage } from "@nova/shared";
import { type Prisma, type ProjectStage } from "@nova/database";
import { z } from "zod";
import { authenticate } from "./access";
import { CommercialError, seal } from "./commercial-core";
export async function resendEmail(h: Headers, id: string, requestId: string) {
  await authenticate(h); z.uuid().parse(id); z.uuid().parse(requestId);
  return workspaceDb(h).$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "CommercialEmail" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (await tx.commercialEmail.findUnique({ where: { manualRequestId: requestId } })) return;
    const e = await tx.commercialEmail.findUniqueOrThrow({ where: { id }, include: { quote: true, siteOrder: { include: { project: { include: { lead: true } } } } } });
    if (["PENDING", "PROCESSING", "CANCELLED"].includes(e.status) || ["SITE_OWNER_NOTICE","TADAPO_OWNER_NOTICE"].includes(e.kind) || e.quote && !["SENT", "ACCEPTED"].includes(e.quote.status) || e.siteOrder && (e.siteOrder.project.lead.deletedAt || e.siteOrder.project.stage === "CANCELLED" || e.kind === "SITE_PRESENTATION" && !!e.siteOrder.creationPaidAt || e.kind === "SITE_REVISION_REQUEST" && !!e.siteOrder.subscriptionInviteSentAt || e.kind === "SITE_SUBSCRIPTION_INVITE" && !!e.siteOrder.firstSubscriptionPaidAt)) throw new CommercialError("INVALID_ACTION");
    let payload = e.payloadEncrypted;
    if (!payload && e.siteOrder) { const { rebuildSiteEmail } = await import("./site-billing"); payload = seal(rebuildSiteEmail(e.siteOrder, e.kind)); }
    if (!payload) throw new CommercialError("INVALID_ACTION");
    if (await tx.commercialEmail.findFirst({ where: { resendOfId: id, status: { in: ["PENDING", "PROCESSING"] } } })) throw new CommercialError("REMINDER_PENDING");
    await tx.commercialEmail.create({ data: { brand: e.brand, tadapoOrderId: e.tadapoOrderId, siteOrderId: e.siteOrderId, quoteId: e.quoteId, kind: e.kind, payloadEncrypted: payload, resendOfId: id, manualRequestId: requestId, expiresAt: new Date(Date.now() + 23 * 3600000) } });
  });
}
export async function financialStage(tx: Prisma.TransactionClient, projectId: string, stage: "PREVIEW_SENT" | "AWAITING_PAYMENT" | "PAID") {
  const earlier: ProjectStage[] = stage === "PREVIEW_SENT" ? ["ACCEPTED", "CONTENT_PREPARATION", "CREATION", "REVIEW", "PREVIEW_READY"] : stage === "AWAITING_PAYMENT" ? ["PREVIEW_SENT", "AWAITING_APPROVAL", "APPROVED"] : ["ACCEPTED", "CONTENT_PREPARATION", "CREATION", "REVIEW", "PREVIEW_READY", "PREVIEW_SENT", "AWAITING_APPROVAL", "APPROVED", "AWAITING_PAYMENT"];
  const changed = await tx.project.updateMany({ where: { id: projectId, stage: { in: earlier } }, data: { stage } });
  if (changed.count) { const project = await tx.project.findUniqueOrThrow({ where: { id: projectId }, select: { leadId: true } }); await tx.lead.update({ where: { id: project.leadId }, data: { status: leadStatusForStage(stage) } }); }
}
// Calendar days are used for the review period; publication uses French business days.
export function publicationDeadline(paid: Date) {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(paid);
  const result = new Date(local + "T12:00:00Z"); let remaining = 2;
  while (remaining) { result.setUTCDate(result.getUTCDate() + 1); if (![0, 6].includes(result.getUTCDay()) && !frenchHoliday(result)) remaining--; }
  return result;
}
function frenchHoliday(date: Date) {
  const y = date.getUTCFullYear(), a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31), day = (h + l - 7 * m + 114) % 31 + 1;
  const easter = Date.UTC(y, month - 1, day), dayStart = Date.UTC(y, date.getUTCMonth(), date.getUTCDate());
  return [1, 39, 50].some(offset => easter + offset * 86400000 === dayStart) || ["01-01", "05-01", "05-08", "07-14", "08-15", "11-01", "11-11", "12-25"].includes(date.toISOString().slice(5, 10));
}
