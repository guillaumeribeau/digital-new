import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { decryptPayload } from "./lead-security";
import { emailPayloadSchema, sendEmail } from "./lead-delivery";
import type { OutboxEvent } from "@nova/database";
import { localEmailMode } from "./local-email";

export async function processOutbox(limit = 20) {
  // Local previews stay queued for the developer; they are never sent or
  // falsely marked delivered by the production worker.
  if (localEmailMode()) return { sent: 0, failed: 0 };
  const db = getDb();
  let sent = 0, failed = 0;
  // Never retry outside Resend's 24h idempotency window. Clear sensitive dead payloads.
  await db.outboxEvent.updateMany({ where: { status: { in: ["PENDING", "PROCESSING"] }, expiresAt: { lte: new Date() } },
    data: { status: "DEAD", payloadEncrypted: null, lockId: null, lockedUntil: null, lastError: "DELIVERY_WINDOW_EXPIRED" } });
  for (let i = 0; i < limit; i++) {
    const lockId = randomUUID();
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + 120000);
    const rows = await db.$queryRaw<OutboxEvent[]>`
      UPDATE "OutboxEvent" SET "status" = 'PROCESSING', "lockId" = ${lockId}::uuid,
        "lockedUntil" = ${lockedUntil}::timestamptz, "attempts" = "attempts" + 1
      WHERE "id" = (
        SELECT "id" FROM "OutboxEvent"
        WHERE ("status" = 'PENDING' AND "availableAt" <= ${now}::timestamptz
          OR "status" = 'PROCESSING' AND "lockedUntil" <= ${now}::timestamptz)
          AND "expiresAt" > ${now}::timestamptz AND "attempts" < 8
        ORDER BY "availableAt" FOR UPDATE SKIP LOCKED LIMIT 1
      ) RETURNING *`;
    const event = rows[0];
    if (!event) break;
    try {
      if (!event.payloadEncrypted) throw new Error("EMPTY_EVENT");
      const payload = emailPayloadSchema.parse(decryptPayload(event.payloadEncrypted));
      const messageId = await sendEmail(payload, event.id);
      await db.outboxEvent.updateMany({ where: { id: event.id, lockId, status: "PROCESSING" }, data: {
        status: "SENT", sentAt: new Date(), providerMessageId: messageId, payloadEncrypted: null,
        lockedUntil: null, lockId: null, lastError: null,
      } });
      sent++;
    } catch {
      const dead = event.attempts >= 8;
      await db.outboxEvent.updateMany({ where: { id: event.id, lockId, status: "PROCESSING" }, data: {
        status: dead ? "DEAD" : "PENDING", lockedUntil: null, lockId: null,
        lastError: "EMAIL_DELIVERY_FAILED", ...(dead ? { payloadEncrypted: null } : {}),
        availableAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** (event.attempts - 1))),
      } });
      failed++;
    }
  }
  // A worker can die during its final attempt. Such an event must not remain PROCESSING forever.
  await db.outboxEvent.updateMany({ where: { status: "PROCESSING", attempts: { gte: 8 }, lockedUntil: { lte: new Date() } },
    data: { status: "DEAD", payloadEncrypted: null, lockId: null, lockedUntil: null, lastError: "ATTEMPTS_EXHAUSTED" } });
  return { sent, failed };
}
