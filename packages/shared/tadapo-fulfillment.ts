import { type Prisma, type TadapoOrder } from "@nova/database";
import { tadapoBriefSchema } from "@nova/validation/tadapo";

/** Called with the order locked, after a payment has been confirmed. */
export async function createTadapoProject(tx: Prisma.TransactionClient, order: TadapoOrder, stripeCustomerId: string | null) {
  if (order.projectId) return order.projectId;
  const brief = tadapoBriefSchema.parse(order.brief);
  const offer = order.offerSnapshot as { version: string };
  const lead = await tx.lead.create({ data: { brand: "tadapo", requestId: order.requestId, payloadHash: order.payloadHash, status: "PAID",
    fullName: brief.fullName, email: brief.email.toLowerCase(), phone: brief.phone.slice(0, 25) || null,
    preferredContactMethod: "email", businessName: brief.company, businessSector: brief.activity.slice(0, 100), city: brief.area,
    services: brief.services.slice(0, 1500), preferredStyle: brief.style.slice(0, 50), projectDescription: brief.objectives,
    pricingAcknowledgedAt: order.createdAt, privacyAcknowledgedAt: order.createdAt, pricingVersion: offer.version, privacyVersion: "2026-10-23", source: "tadapo-order" } });
  const project = await tx.project.create({ data: { leadId: lead.id, stage: "CONTENT_PREPARATION", stripeCustomerId } });
  return project.id;
}
