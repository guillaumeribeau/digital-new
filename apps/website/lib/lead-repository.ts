import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { Prisma, type Lead as StoredLead } from "@nova/database";
import { type Lead } from "./lead-schema";
import { createVerificationToken, encryptPayload, tokenHash, PRICING_VERSION, PRIVACY_VERSION } from "./lead-security";
import { verificationEmail, verifiedEmails, type EmailPayload } from "./lead-delivery";

type Transaction = Prisma.TransactionClient;
export class IdempotencyConflict extends Error {}
function fingerprint(lead: Lead) {
  return tokenHash(JSON.stringify(Object.entries(lead).filter(([key]) => key !== "honeypot")
    .sort(([a], [b]) => a.localeCompare(b))));
}
function outbox(leadId: string, kind: "VERIFY_EMAIL" | "RECEIPT" | "INTERNAL_NOTIFICATION", payload: EmailPayload, now: Date) {
  return { id: randomUUID(), leadId, kind, payloadEncrypted: encryptPayload(payload),
    createdAt: now, availableAt: now, expiresAt: new Date(now.getTime() + 23 * 60 * 60 * 1000) };
}
async function queueVerification(tx: Transaction, lead: StoredLead, now: Date) {
  const { token, ...record } = createVerificationToken(now);
  await tx.emailVerificationToken.create({ data: { ...record, leadId: lead.id, createdAt: now } });
  await tx.outboxEvent.create({ data: outbox(lead.id, "VERIFY_EMAIL", verificationEmail(lead, token), now) });
}
export const leadRepository = {
  async submit(input: Lead) {
    const db = getDb();
    const lead = { ...input, email: input.email.toLowerCase() };
    const hash = fingerprint(lead);
    const existing = await db.lead.findUnique({ where: { requestId: lead.requestId } });
    if (existing) {
      if (existing.payloadHash !== hash) throw new IdempotencyConflict();
      return { reference: existing.id };
    }
    try {
      return await db.$transaction(async (tx) => {
        const now = new Date();
        const stored = await tx.lead.create({ data: {
          id: randomUUID(), requestId: lead.requestId, payloadHash: hash,
          status: "PENDING_VERIFICATION", fullName: lead.fullName, email: lead.email,
          phone: lead.phone || null, preferredContactMethod: lead.contactMethod,
          businessName: lead.company, businessSector: lead.sector, city: lead.city,
          services: lead.services, preferredStyle: lead.style,
          projectDescription: lead.description || null, preferredColors: lead.colors || null,
          hasWebsite: lead.hasWebsite || null, currentWebsite: lead.website || null,
          hasLogo: lead.hasLogo || null, hasPhotos: lead.hasPhotos || null,
          additionalInformation: lead.extra || null, pricingAcknowledgedAt: now,
          pricingVersion: PRICING_VERSION, privacyAcknowledgedAt: now, privacyVersion: PRIVACY_VERSION,
          source: "showcase-form", utmSource: lead.utmSource || null,
          utmMedium: lead.utmMedium || null, utmCampaign: lead.utmCampaign || null,
        } });
        await queueVerification(tx, stored, now);
        return { reference: stored.id };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const winner = await db.lead.findUnique({ where: { requestId: lead.requestId } });
        if (winner?.payloadHash === hash) return { reference: winner.id };
        if (winner) throw new IdempotencyConflict();
      }
      throw error;
    }
  },
  async verify(token: string) {
    return getDb().$transaction(async (tx) => {
      const record = await tx.emailVerificationToken.findUnique({ where: { tokenHash: tokenHash(token) } });
      if (!record) return false;
      await tx.$queryRaw`SELECT "id" FROM "Lead" WHERE "id" = ${record.leadId}::uuid FOR UPDATE`;
      const activeLead = await tx.lead.findFirst({ where: { id: record.leadId, deletedAt: null }, select: { id: true } });
      if (!activeLead) return false;
      const now = new Date();
      const consumed = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { usedAt: now },
      });
      if (consumed.count !== 1) return false;
      const updated = await tx.lead.updateMany({
        where: { id: record.leadId, deletedAt: null, status: "PENDING_VERIFICATION", emailVerifiedAt: null },
        data: { status: "NEW", emailVerifiedAt: now },
      });
      if (updated.count !== 1) return false;
      await tx.emailVerificationToken.updateMany({ where: { leadId: record.leadId, usedAt: null }, data: { revokedAt: now } });
      await tx.outboxEvent.updateMany({ where: { leadId: record.leadId, kind: "VERIFY_EMAIL", status: "PENDING" },
        data: { status: "CANCELLED", payloadEncrypted: null } });
      const lead = await tx.lead.findUniqueOrThrow({ where: { id: record.leadId } });
      const emails = verifiedEmails(lead);
      await tx.outboxEvent.createMany({ data: [outbox(lead.id, "RECEIPT", emails.receipt, now),
        outbox(lead.id, "INTERNAL_NOTIFICATION", emails.internal, now)] });
      return true;
    });
  },
  async resend(reference: string, email: string) {
    await getDb().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Lead" WHERE "id" = ${reference}::uuid FOR UPDATE`;
      const lead = await tx.lead.findUnique({ where: { id: reference } });
      if (!lead || lead.deletedAt || lead.email !== email.toLowerCase() || lead.status !== "PENDING_VERIFICATION") return;
      const now = new Date();
      const recent = await tx.emailVerificationToken.findFirst({ where: { leadId: reference }, orderBy: { createdAt: "desc" } });
      if (recent && now.getTime() - recent.createdAt.getTime() < 60000) return;
      const count = await tx.emailVerificationToken.count({ where: {
        leadId: reference, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      } });
      if (count >= 4) return;
      const sending = await tx.outboxEvent.count({ where: { leadId: reference, kind: "VERIFY_EMAIL", status: "PROCESSING" } });
      if (sending) return;
      await tx.emailVerificationToken.updateMany({ where: { leadId: reference, usedAt: null }, data: { revokedAt: now } });
      await tx.outboxEvent.updateMany({ where: { leadId: reference, kind: "VERIFY_EMAIL", status: { in: ["PENDING", "DEAD"] } },
        data: { status: "CANCELLED", payloadEncrypted: null } });
      await queueVerification(tx, lead, now);
    });
  },
};
