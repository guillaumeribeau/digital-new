import { z } from "zod";
import { type Prisma } from "@nova/database";
import { createTadapoProject } from "@nova/shared/tadapo-fulfillment";
import { tadapoAnniversary, type TadapoOffer } from "@nova/shared/tadapo";
import { authenticate } from "./access";
import { adminBrand, workspaceDb } from "./brand-context";
import { CommercialError, paymentMode } from "./commercial-core";
import { financialStage } from "./operations";
import { manualPaymentKinds } from "./manual-payment-types";

const inputSchema = z.object({
  id: z.uuid(), requestId: z.uuid(), kind: z.enum(manualPaymentKinds),
  status: z.enum(["PAID", "PENDING", "FAILED"]), expectedUpdatedAt: z.iso.datetime(),
  paidOn: z.union([z.iso.date(), z.literal("")]).default(""),
  nextBillingOn: z.union([z.iso.date(), z.literal("")]).default(""),
  reference: z.string().trim().max(200).default(""), note: z.string().trim().max(2000).default(""),
});
function current(row: { updatedAt: Date }, expected: string) {
  if (row.updatedAt.toISOString() !== expected) throw new CommercialError("STALE_QUOTE");
}
function available(lead: { deletedAt: Date | null }, stage?: string) {
  if (lead.deletedAt || stage === "CANCELLED") throw new CommercialError("INVALID_ACTION");
}

/** Administrative records only: no Stripe requests, invoices, mandates or e-mails. */
export async function recordManualPayment(h: Headers, input: unknown) {
  const actor = await authenticate(h), d = inputSchema.parse(input), brand = adminBrand(h);
  const paid = d.status === "PAID", subscription = d.kind.endsWith("SUBSCRIPTION");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (paid && (!d.paidOn || d.paidOn > today)) throw new CommercialError("PAYMENT_DATE_REQUIRED");
  if (paid && subscription && (!d.nextBillingOn || d.nextBillingOn <= d.paidOn || d.nextBillingOn <= today)) throw new CommercialError("BILLING_DATE_REQUIRED");
  const paidAt = paid ? new Date(d.paidOn + "T12:00:00Z") : null;
  const nextBillingAt = paid && subscription ? new Date(d.nextBillingOn + "T12:00:00Z") : null;
  return workspaceDb(h).$transaction(async tx => {
    let mode = "LIVE";
    let projectId: string | null = null;
    let reviewRecorded = false;
    // Lock the parent used by the Stripe handlers too. Replayed submissions must
    // not duplicate payment attempts or turn a later correction back into paid.
    if (d.kind === "QUOTE") {
      await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${d.id}::uuid FOR UPDATE`;
      const q = await tx.quote.findUniqueOrThrow({ where: { id: d.id }, include: { lead: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
      available(q.lead);
      if (!["SENT", "ACCEPTED", "PAID", "COMPLETED"].includes(q.status)) throw new CommercialError("INVALID_ACTION");
      if (await alreadyRecorded(tx, d.requestId, brand, d.kind, d.id)) return;
      current(q, d.expectedUpdatedAt);
      const configured = paymentMode(brand);
      mode = q.paymentMode || q.payments[0]?.mode || (["LIVE", "TEST", "LOCAL"].includes(configured) ? configured : "LIVE");
      if (paid && !q.acceptedAt) throw new CommercialError("QUOTE_NOT_ACCEPTED");
      const review = await tx.manualPaymentReview.create({ data: { requestId: d.requestId, brand, kind: d.kind, resourceId: d.id, status: d.status, mode, paidAt, nextBillingAt, reference: d.reference, note: d.note, actorId: actor.id, createdAt: new Date() } });
      reviewRecorded = true;
      // The database only permits reversing a paid quote when linked to this
      // immutable administrative review in the same transaction.
      await tx.$queryRaw`SELECT set_config('nova.manual_payment_review', ${review.id}, true)`;
      // Retire reusable links locally, preserving the original attempts as history.
      await tx.paymentAttempt.updateMany({ where: { quoteId: q.id, status: { in: ["CREATING", "OPEN"] } }, data: { status: "EXPIRED", expiresAt: new Date() } });
      await tx.paymentAttempt.create({ data: { quoteId: q.id, mode, status: paid ? "SUCCEEDED" : d.status === "FAILED" ? "FAILED" : "OPEN", paidAt, amountCents: q.totalCents, currency: q.currency } });
      await tx.quote.update({ where: { id: q.id }, data: { status: paid ? q.status === "COMPLETED" ? "COMPLETED" : "PAID" : q.acceptedAt ? "ACCEPTED" : "SENT", paidAt, paymentMode: mode } });
      projectId = q.projectId;
    } else if (d.kind === "SITE_CREATION" || d.kind === "SITE_SUBSCRIPTION") {
      if (brand !== "zelyweb") throw new CommercialError("INVALID_ACTION");
      await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${d.id}::uuid FOR UPDATE`;
      const o = await tx.siteOrder.findUniqueOrThrow({ where: { id: d.id }, include: { project: { include: { lead: true } } } });
      available(o.project.lead, o.project.stage);
      if (o.status === "DRAFT") throw new CommercialError("INVALID_ACTION");
      if (await alreadyRecorded(tx, d.requestId, brand, d.kind, d.id)) return;
      current(o, d.expectedUpdatedAt);
      mode = o.mode; projectId = o.projectId;
      if (d.kind === "SITE_CREATION") {
        if (!paid && o.firstSubscriptionPaidAt) throw new CommercialError("CREATION_HAS_SUBSCRIPTION");
        await tx.siteOrder.update({ where: { id: o.id }, data: { creationPaidAt: paidAt, status: paid ? "PAID" : "SENT" } });
        if (paid) await financialStage(tx, o.projectId, "PAID");
        else if (o.project.stage === "PAID") {
          await tx.project.update({ where: { id: o.projectId }, data: { stage: "AWAITING_PAYMENT" } });
          await tx.lead.update({ where: { id: o.project.leadId }, data: { status: "AWAITING_PAYMENT" } });
        }
      } else {
        if (!o.creationPaidAt || !o.subscriptionInviteSentAt) throw new CommercialError("SUBSCRIPTION_NOT_INVITED");
        if (["canceled", "incomplete_expired"].includes(o.subscriptionStatus || "")) throw new CommercialError("SUBSCRIPTION_ENDED");
        await tx.siteOrder.update({ where: { id: o.id }, data: {
          firstSubscriptionPaidAt: paid ? o.firstSubscriptionPaidAt || paidAt : o.firstSubscriptionPaidAt,
          subscriptionStatus: paid ? "active" : d.status === "FAILED" ? "past_due" : "incomplete", billingAlert: !paid,
          ...(paid ? { nextBillingAt } : {}),
        } });
      }
    } else {
      if (brand !== "tadapo") throw new CommercialError("INVALID_ACTION");
      await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id" = ${d.id}::uuid FOR UPDATE`;
      const o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id: d.id }, include: { project: { include: { lead: true } } } });
      if (o.project) available(o.project.lead, o.project.stage);
      if (await alreadyRecorded(tx, d.requestId, brand, d.kind, d.id)) return;
      current(o, d.expectedUpdatedAt);
      mode = o.mode; projectId = o.projectId;
      if (d.kind === "TADAPO_DOMAIN") {
        const domain = o.domainQuote as { initialExtraHtCents?: number } | null;
        if (!o.paidAt || !o.domainAcceptedAt || !domain?.initialExtraHtCents) throw new CommercialError("DOMAIN_NOT_ACCEPTED");
        if (!paid && o.domainPurchasedAt) throw new CommercialError("DOMAIN_ALREADY_PURCHASED");
        await tx.tadapoOrder.update({ where: { id: o.id }, data: { domainPaidAt: paidAt } });
      } else {
        if (o.subscriptionStatus === "canceled") throw new CommercialError("SUBSCRIPTION_ENDED");
        const offer = o.offerSnapshot as unknown as TadapoOffer;
        if (paid) projectId = await createTadapoProject(tx, o, o.stripeCustomerId);
        await tx.tadapoOrder.update({ where: { id: o.id }, data: {
          ...(paid ? { paidAt: o.paidAt || paidAt, projectId, stage: o.paidAt ? o.stage : "CONTENT_PREPARATION", nextBillingAt,
            commitmentEndAt: o.commitmentEndAt || (offer.minimumMonths ? tadapoAnniversary(paidAt!, offer.minimumMonths) : null) } : {}),
          subscriptionStatus: paid ? "active" : d.status === "FAILED" ? "past_due" : "incomplete", billingAlert: !paid,
        } });
      }
    }
    if (!reviewRecorded) await tx.manualPaymentReview.create({ data: { requestId: d.requestId, brand, kind: d.kind, resourceId: d.id, status: d.status, mode, paidAt, nextBillingAt, reference: d.reference, note: d.note, actorId: actor.id, createdAt: new Date() } });
    if (projectId) await tx.activityLog.create({ data: { projectId, actorId: actor.id, action: "MANUAL_PAYMENT_" + d.kind, after: d.status } });
  });
}
async function alreadyRecorded(tx: Prisma.TransactionClient, requestId: string, brand: string, kind: string, resourceId: string) {
  const existing = await tx.manualPaymentReview.findUnique({ where: { requestId } });
  if (!existing) return false;
  if (existing.brand !== brand || existing.kind !== kind || existing.resourceId !== resourceId) throw new CommercialError("INVALID_ACTION");
  return true;
}
