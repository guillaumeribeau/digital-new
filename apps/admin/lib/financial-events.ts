import Stripe from "stripe";
import { getDb } from "@nova/database";
import { stripeClient } from "./commercial-payment";
import { CommercialError, paymentMode } from "./commercial-core";
import { queueOwnerNotification } from "./owner-notifications";
export async function applyFinancialEvent(event: Stripe.Event) {
  const refund = ["charge.refunded", "refund.created", "refund.updated", "refund.failed"].includes(event.type);
  if (!refund && !event.type.startsWith("charge.dispute.")) return;
  const stripe = stripeClient(), mode = event.livemode ? "LIVE" : "TEST";
  if (mode !== paymentMode()) throw new CommercialError("INVALID_ACTION");
  const raw = event.data.object as Stripe.Charge | Stripe.Refund | Stripe.Dispute;
  const dispute = !refund ? await stripe.disputes.retrieve(raw.id) : null;
  const currentRefund = refund && event.type.startsWith("refund.") ? await stripe.refunds.retrieve(raw.id) : null;
  const chargeRef = dispute?.charge || currentRefund?.charge || (event.type === "charge.refunded" ? raw.id : null);
  if (!chargeRef) return;
  const charge = await stripe.charges.retrieve(typeof chargeRef === "string" ? chargeRef : chargeRef.id);
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!intentId || charge.currency !== "eur" || charge.livemode !== event.livemode) return;
  const intent = await stripe.paymentIntents.retrieve(intentId);
  const creationPayment = !!intent.metadata.siteOrderId;
  let siteOrderId = intent.metadata.siteOrderId, quoteId = intent.metadata.quoteId;
  if (!siteOrderId && !quoteId) {
    const payments = await stripe.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: intentId }, limit: 10 });
    const ref = payments.data[0]?.invoice;
    if (ref) { const invoice = await stripe.invoices.retrieve(typeof ref === "string" ? ref : ref.id); siteOrderId = invoice.metadata?.siteOrderId || invoice.parent?.subscription_details?.metadata?.siteOrderId || ""; quoteId = invoice.metadata?.quoteId || ""; }
  }
  if (!siteOrderId && !quoteId) return;
  const order = siteOrderId ? await getDb().siteOrder.findUnique({ where: { id: siteOrderId }, include: { project: { select: { leadId: true, lead: { select: { businessName: true } } } } } }) : null;
  const quote = quoteId ? await getDb().quote.findUnique({ where: { id: quoteId } }) : null;
  const customer = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (order && (order.mode !== mode || customer !== order.stripeCustomerId) || quote && quote.paymentMode !== mode || !order && !quote) throw new CommercialError("INVALID_ACTION");
  const id = dispute?.id || "refund/" + charge.id;
  await getDb().$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    const latestCharge = await stripe.charges.retrieve(charge.id);
    const latestDispute = dispute ? await stripe.disputes.retrieve(dispute.id) : null;
    const status = latestDispute?.status || (currentRefund?.status === "failed" ? "failed" : latestCharge.amount_refunded === latestCharge.amount ? "full" : "partial");
    const previous = await tx.financialEvent.findUnique({ where: { id } });
    const data = { siteOrderId: order?.id, quoteId: quote?.id, purpose: quote ? "COMPLEMENTARY" : creationPayment ? "CREATION" : "SUBSCRIPTION", kind: dispute ? "DISPUTE" : "REFUND", status, amountCents: latestDispute?.amount || latestCharge.amount_refunded, currency: charge.currency, chargeId: charge.id };
    await tx.financialEvent.upsert({ where: { id }, create: { id, ...data }, update: data });
    if (order) {
      await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${order.id}::uuid FOR UPDATE`;
      const total = await tx.financialEvent.aggregate({ where: { siteOrderId: order.id, kind: "REFUND" }, _sum: { amountCents: true } });
      await tx.siteOrder.update({ where: { id: order.id }, data: { refundedCents: total._sum.amountCents || 0, ...(dispute ? { disputeStatus: latestDispute!.status } : {}) } });
    }
    if (!previous || previous.status !== status || previous.amountCents !== data.amountCents) await queueOwnerNotification(tx, { siteOrderId: order?.id, quoteId: quote?.id, replyTo: "contact@zelyweb.com", key: `finance/${id}/${status}/${data.amountCents}`, mode, subject: dispute ? "Litige Stripe : état mis à jour" : "Remboursement Stripe : état mis à jour", text: `${order?.project.lead.businessName || quote?.number}\n${dispute ? "Litige" : "Remboursement"} : ${status}. Montant : ${(data.amountCents / 100).toFixed(2)} € TTC.\nConsultez Stripe pour toute intervention. Aucune suspension automatique du site.`, path: order ? `/projets/${order.projectId}#stripe` : `/clients/${quote!.leadId}` });
  }, { timeout: 20000 });
}
