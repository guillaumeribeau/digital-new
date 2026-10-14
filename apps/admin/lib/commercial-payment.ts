import { getDb } from "@nova/database";
import Stripe from "stripe";
import { z } from "zod";
import { commercialLocal, CommercialError, paymentMode, publicOrigin, snapshotSchema } from "./commercial-core";

export function stripeClient() {
  if (!["TEST", "LIVE"].includes(paymentMode())) throw new CommercialError("CONFIGURATION_REQUIRED");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { timeout: 10000, maxNetworkRetries: 1, httpClient: Stripe.createFetchHttpClient() });
}
export async function acceptQuote(id: string, input: unknown) {
  const data = z.object({ name: z.string().trim().min(2).max(200), agreement: z.literal(true), documentHash: z.string().regex(/^[a-f0-9]{64}$/) }).parse(input);
  await getDb().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id } });
    if (quote.documentHash !== data.documentHash) throw new CommercialError("STALE_QUOTE");
    if (quote.status === "ACCEPTED") return;
    if (quote.status !== "SENT") throw new CommercialError("IMMUTABLE_QUOTE");
    if (quote.validUntil <= new Date()) throw new CommercialError("EXPIRED_QUOTE");
    await tx.quote.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedName: data.name, acceptanceHash: quote.documentHash, nextReminderAt: null } });
  });
}
export async function declineQuote(id: string, input: unknown) {
  const data = z.object({ reason: z.string().trim().min(2).max(2000) }).parse(input);
  await getDb().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id }, include: { lead: true } });
    if (quote.status !== "SENT" || quote.validUntil <= new Date()) throw new CommercialError("IMMUTABLE_QUOTE");
    await tx.quote.update({ where: { id }, data: { status: "DECLINED", nextReminderAt: null } });
    const conversation = await tx.conversation.findUniqueOrThrow({ where: { leadId: quote.leadId } });
    await tx.clientMessage.create({ data: { conversationId: conversation.id, direction: "INBOUND", subject: `Modification du devis ${quote.number}`, content: data.reason, sender: quote.lead.email, deliveryStatus: "RECEIVED" } });
    await tx.conversation.update({ where: { id: conversation.id }, data: { needsReply: true } });
  });
}
export async function checkoutQuote(id: string) {
  const mode = paymentMode(); if (!["TEST", "LIVE"].includes(mode)) throw new CommercialError("CONFIGURATION_REQUIRED");
  const result = await getDb().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id } });
    if (quote.status !== "ACCEPTED" || quote.acceptanceHash !== quote.documentHash) throw new CommercialError("PAYMENT_REQUIRED");
    const existing = await tx.paymentAttempt.findFirst({ where: { quoteId: id, mode, status: { in: ["CREATING", "OPEN"] }, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
    if (existing?.checkoutUrl) return { quote, attempt: existing, url: existing.checkoutUrl };
    const attempt = existing || await tx.paymentAttempt.create({ data: { quoteId: id, mode, amountCents: quote.totalCents, currency: quote.currency, expiresAt: new Date(Date.now() + 24 * 3600000) } });
    return { quote, attempt, url: undefined };
  });
  if (result.url) return result.url;
  const snapshot = snapshotSchema.parse(result.quote.snapshot);
  const session = await stripeClient().checkout.sessions.create({
    mode: "payment", customer_email: snapshot.buyer.email, client_reference_id: result.quote.id,
    line_items: [{ price_data: { currency: "eur", unit_amount: result.quote.totalCents, product_data: { name: `${result.quote.number} — ${result.quote.title}` } }, quantity: 1 }],
    metadata: { quoteId: id, attemptId: result.attempt.id, documentHash: result.quote.documentHash! },
    payment_intent_data: { metadata: { quoteId: id, attemptId: result.attempt.id } },
    success_url: `${publicOrigin()}/client/devis/${id}?retour=paiement`, cancel_url: `${publicOrigin()}/client/devis/${id}`,
    expires_at: Math.floor(result.attempt.expiresAt!.getTime() / 1000),
  }, { idempotencyKey: "nova-quote/" + result.attempt.id });
  if (!session.url || !session.url.startsWith("https://checkout.stripe.com/")) throw new CommercialError("CONFIGURATION_REQUIRED");
  await getDb().paymentAttempt.updateMany({ where: { id: result.attempt.id, status: "CREATING" }, data: { status: "OPEN", stripeSessionId: session.id, checkoutUrl: session.url, expiresAt: new Date(session.expires_at * 1000) } });
  return session.url;
}
export async function simulateQuotePayment(id: string) {
  if (!commercialLocal() || paymentMode() !== "LOCAL") throw new CommercialError("INVALID_ACTION");
  await getDb().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id } });
    if (quote.status === "PAID" && quote.paymentMode === "LOCAL") return;
    if (quote.status !== "ACCEPTED") throw new CommercialError("PAYMENT_REQUIRED");
    await tx.paymentAttempt.create({ data: { quoteId: id, mode: "LOCAL", status: "SUCCEEDED", amountCents: quote.totalCents, currency: quote.currency, paidAt: new Date() } });
    await tx.quote.update({ where: { id }, data: { status: "PAID", paidAt: new Date(), paymentMode: "LOCAL" } });
  });
}
export async function applyStripeEvent(event: Stripe.Event) {
  const relevant = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"];
  if (!relevant.includes(event.type)) return;
  const session = event.data.object as Stripe.Checkout.Session;
  if (!z.uuid().safeParse(session.metadata?.attemptId).success) return;
  await getDb().$transaction(async (tx) => {
    const key = "stripe/" + event.id;
    if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
    const attempt = await tx.paymentAttempt.findUnique({ where: { id: session.metadata!.attemptId } });
    if (!attempt) return;
    await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${attempt.quoteId}::uuid FOR UPDATE`;
    if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: attempt.quoteId } });
    const mode = event.livemode ? "LIVE" : "TEST";
    if (attempt.mode !== mode || paymentMode() !== mode || session.metadata?.quoteId !== quote.id || session.metadata?.documentHash !== quote.documentHash || session.currency !== attempt.currency || session.amount_total !== attempt.amountCents || (attempt.stripeSessionId && attempt.stripeSessionId !== session.id)) throw new CommercialError("INVALID_ACTION");
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) && session.payment_status === "paid") {
      if (!["ACCEPTED", "PAID", "COMPLETED"].includes(quote.status)) throw new CommercialError("INVALID_ACTION");
      await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "SUCCEEDED", stripeSessionId: session.id, paidAt: new Date() } });
      if (quote.status === "ACCEPTED") await tx.quote.update({ where: { id: quote.id }, data: { status: "PAID", paidAt: new Date(), paymentMode: mode } });
    } else if (["checkout.session.async_payment_failed", "checkout.session.expired"].includes(event.type) && attempt.status !== "SUCCEEDED") {
      await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: event.type.endsWith("expired") ? "EXPIRED" : "FAILED" } });
    }
    await tx.commercialWebhook.create({ data: { key, provider: "STRIPE" } });
  });
}
