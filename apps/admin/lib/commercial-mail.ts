import { getDb, type CommercialEmail } from "@nova/database";
import { randomUUID } from "node:crypto";
import { commercialLocal, CommercialError, emailSchema, publicOrigin, replyAddress, seal, sender, snapshotSchema, unseal } from "./commercial-core";
import { quotePdf } from "./quote-pdf";

export async function queueQuoteReminder(id: string, manual = false) {
  const db = getDb(), quote = await db.quote.findUniqueOrThrow({ where: { id } });
  if (!["SENT", "ACCEPTED"].includes(quote.status) || (quote.status === "SENT" && quote.validUntil <= new Date())) throw new CommercialError("INVALID_ACTION");
  const snapshot = snapshotSchema.parse(quote.snapshot), pdf = await quotePdf(snapshot);
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const current = await tx.quote.findUniqueOrThrow({ where: { id } });
    if (!["SENT", "ACCEPTED"].includes(current.status) || (current.status === "SENT" && current.validUntil <= new Date())) throw new CommercialError("INVALID_ACTION");
    if (current.reminderCount >= 6 && manual) throw new CommercialError("REMINDER_LIMIT");
    if ((!manual && (current.status !== "SENT" || !current.nextReminderAt || current.nextReminderAt > new Date() || current.reminderCount >= 2)) || current.reminderCount >= 6) return;
    if (await tx.commercialEmail.findFirst({ where: { quoteId: id, kind: "REMINDER", status: { in: ["PENDING", "PROCESSING"] } } })) {
      if (manual) throw new CommercialError("REMINDER_PENDING");
      return;
    }
    const access = await tx.quoteAccess.findFirst({ where: { quoteId: id, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
    if (!access) throw new CommercialError("INVALID_ACTION");
    const conversation = await tx.conversation.findUniqueOrThrow({ where: { leadId: current.leadId } });
    const token = unseal(access.tokenEncrypted); if (typeof token !== "string") throw new CommercialError("INVALID_ACTION");
    await tx.commercialEmail.create({ data: { quoteId: id, kind: "REMINDER", expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({ from: sender(), to: [snapshot.buyer.email], reply_to: replyAddress(conversation.replyToken),
      subject: `Rappel · devis ${quote.number}`, text: `Bonjour ${snapshot.buyer.name},\n\nVotre devis ${quote.number} ${current.status === "ACCEPTED" ? "est accepté et attend son règlement" : "attend votre réponse"}.\n\nConsulter, accepter et payer :\n${publicOrigin()}/client/devis/${id}#token=${token}\n\nVous pouvez répondre à cet e-mail pour toute question.\n\n${snapshot.seller.legalName}`, attachments: [{ filename: `${quote.number}.pdf`, content: pdf.toString("base64") }] }) } });
    const settings = await tx.commercialSettings.findUniqueOrThrow({ where: { id: "main" } });
    await tx.quote.update({ where: { id }, data: { reminderCount: { increment: 1 }, nextReminderAt: settings.reminderDays && current.reminderCount < 1 && current.status === "SENT" ? new Date(Date.now() + settings.reminderDays * 86400000) : null } });
  });
}
export async function processCommercialOutbox(limit = 20) {
  publicOrigin();
  if (!commercialLocal() && !process.env.RESEND_API_KEY) throw new CommercialError("CONFIGURATION_REQUIRED");
  const db = getDb();
  await db.quote.updateMany({ where: { status: "SENT", validUntil: { lte: new Date() } }, data: { status: "EXPIRED", nextReminderAt: null } });
  const due = await db.quote.findMany({ where: { status: "SENT", nextReminderAt: { lte: new Date() }, validUntil: { gt: new Date() }, reminderCount: { lt: 2 } }, select: { id: true }, take: 10 });
  for (const quote of due) await queueQuoteReminder(quote.id);
  if (commercialLocal()) return { sent: 0, failed: 0 };
  await db.commercialEmail.updateMany({ where: { status: { in: ["PENDING", "PROCESSING"] }, expiresAt: { lte: new Date() } }, data: { status: "DEAD", payloadEncrypted: null, lockId: null, lockedUntil: null, lastError: "DELIVERY_WINDOW_EXPIRED" } });
  let sent = 0, failed = 0;
  for (let i = 0; i < limit; i++) {
    const lockId = randomUUID(), now = new Date(), lockedUntil = new Date(Date.now() + 120000);
    const rows = await db.$queryRaw<CommercialEmail[]>`UPDATE "CommercialEmail" SET "status" = 'PROCESSING', "lockId" = ${lockId}::uuid, "lockedUntil" = ${lockedUntil}::timestamptz, "attempts" = "attempts" + 1 WHERE "id" = (SELECT "id" FROM "CommercialEmail" WHERE ("status" = 'PENDING' AND "availableAt" <= ${now}::timestamptz OR "status" = 'PROCESSING' AND "lockedUntil" <= ${now}::timestamptz) AND "expiresAt" > ${now}::timestamptz AND "attempts" < 8 ORDER BY "availableAt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
    const event = rows[0]; if (!event) break;
    try {
      if (!event.payloadEncrypted) throw new Error("EMPTY_EVENT");
      if (event.quoteId) {
        const quote = await db.quote.findUniqueOrThrow({ where: { id: event.quoteId } });
        if (["CANCELLED", "SUPERSEDED", "EXPIRED", "DECLINED"].includes(quote.status) || (event.kind === "REMINDER" && ["PAID", "COMPLETED"].includes(quote.status))) {
          await db.commercialEmail.update({ where: { id: event.id }, data: { status: "CANCELLED", payloadEncrypted: null, lockId: null, lockedUntil: null } }); continue;
        }
      }
      const payload = emailSchema.parse(unseal(event.payloadEncrypted));
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json", "Idempotency-Key": "nova-commercial/" + event.id }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000), cache: "no-store" });
      if (!response.ok) throw new Error("DELIVERY_FAILED");
      const result = await response.json() as { id?: string };
      if (typeof result.id !== "string" || !result.id || result.id.length > 200) throw new Error("DELIVERY_FAILED");
      await db.$transaction(async (tx) => {
        await tx.commercialEmail.updateMany({ where: { id: event.id, lockId, status: "PROCESSING" }, data: { status: "SENT", sentAt: new Date(), providerMessageId: result.id, payloadEncrypted: null, lockId: null, lockedUntil: null, lastError: null } });
        const receipts = await tx.commercialWebhook.findMany({ where: { emailId: result.id, deliveryStatus: { not: null } }, orderBy: { createdAt: "desc" }, take: 20 });
        const status = receipts.find((receipt) => ["BOUNCED", "COMPLAINED", "DEAD"].includes(receipt.deliveryStatus!))?.deliveryStatus || receipts[0]?.deliveryStatus || "SENT";
        if (event.messageId) await tx.clientMessage.updateMany({ where: { id: event.messageId, deliveryStatus: "QUEUED" }, data: { deliveryStatus: status, providerId: result.id } });
      }); sent++;
    } catch {
      const dead = event.attempts >= 8;
      await db.commercialEmail.updateMany({ where: { id: event.id, lockId, status: "PROCESSING" }, data: { status: dead ? "DEAD" : "PENDING", lockId: null, lockedUntil: null, lastError: "DELIVERY_FAILED", ...(dead ? { payloadEncrypted: null } : {}), availableAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** (event.attempts - 1))) } });
      if (dead && event.messageId) await db.clientMessage.updateMany({ where: { id: event.messageId, deliveryStatus: "QUEUED" }, data: { deliveryStatus: "DEAD" } });
      failed++;
    }
  }
  await db.commercialEmail.updateMany({ where: { status: "PROCESSING", attempts: { gte: 8 }, lockedUntil: { lte: new Date() } }, data: { status: "DEAD", payloadEncrypted: null, lockId: null, lockedUntil: null, lastError: "ATTEMPTS_EXHAUSTED" } });
  return { sent, failed };
}
