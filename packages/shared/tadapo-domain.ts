import { z } from "zod";
import { getDb, type TadapoOrder } from "@nova/database";
import { authorizeTadapo, queueTadapoEmail, tadapoMode, tadapoStripe, tadapoClientLink, TadapoError } from "./tadapo-server";
import type { TadapoOffer } from "./tadapo";
export const domainQuoteInput = z.object({
  domain: z.string().trim().toLowerCase().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),
  kind: z.enum(["new", "existing"]), initialHtCents: z.coerce.number().int().min(0).max(1000000), renewalHtCents: z.coerce.number().int().min(0).max(1000000),
});
export function prepareDomainQuote(input: unknown, offer: TadapoOffer) {
  const d = domainQuoteInput.parse(input);
  const cap = d.kind === "new" && /\.(fr|com)$/.test(d.domain) ? offer.domainAnnualCapCents : 0;
  if (d.kind === "existing" && (d.initialHtCents || d.renewalHtCents)) throw new TadapoError("INVALID_DOMAIN_QUOTE");
  return { ...d, includedHtCents: cap, initialExtraHtCents: Math.max(0, d.initialHtCents - cap), renewalExtraHtCents: Math.max(0, d.renewalHtCents - cap), checkedAt: new Date().toISOString(),
    agreement: "Je confirme ce domaine, à mon nom, et les tarifs annuels d’achat et de renouvellement présentés en euros HT (TVA 20 %). L’achat reste soumis à disponibilité et à un contrôle manuel. Tout changement de tarif nécessite un nouvel accord. Aucun renouvellement supplémentaire n’est prélevé automatiquement." };
}
export type TadapoDomainQuote = ReturnType<typeof prepareDomainQuote>;
export async function acceptTadapoDomain(id: string, token: string | null, version: number) {
  const o = await authorizeTadapo(id, token);
  if (!o.paidAt || !o.domainQuote || version !== o.domainVersion) throw new TadapoError("INVALID_ACTION");
  const count = await getDb().tadapoOrder.updateMany({ where: { id, domainVersion: version, domainAcceptedAt: null }, data: { domainAcceptedAt: new Date() } });
  if (!count.count && !await getDb().tadapoOrder.findFirst({ where: { id, domainVersion: version, domainAcceptedAt: { not: null } } })) throw new TadapoError("INVALID_ACTION");
  return count.count;
}
export async function payTadapoDomain(id: string, token: string | null, version: number) {
  await authorizeTadapo(id, token);
  return getDb().$transaction(async tx => {
  await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
  const o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id } }), quote = o.domainQuote as TadapoDomainQuote | null;
  if (!o.paidAt || !quote || !o.domainAcceptedAt || o.domainVersion !== version || o.domainPaidAt || !quote.initialExtraHtCents || o.mode !== tadapoMode()) throw new TadapoError("INVALID_ACTION");
  const stripe = tadapoStripe(), metadata = { tadapoOrderId: id, purpose: "TADAPO_DOMAIN", domainVersion: String(version) };
  let attempt = o.domainAttempt || 1;
  if (o.domainSessionId) {
    const previous = await stripe.checkout.sessions.retrieve(o.domainSessionId);
    if (previous.status === "open" && o.domainCheckoutUrl) return o.domainCheckoutUrl;
    if (previous.status !== "expired") throw new TadapoError("PAYMENT_PROCESSING");
    attempt++;
  }
  await tx.tadapoOrder.update({ where: { id }, data: { domainAttempt: attempt } });
  const tax = await stripe.taxRates.create({ display_name: "TVA", percentage: 20, inclusive: false, country: "FR" }, { idempotencyKey: `tadapo/domain-tax/${id}/${version}` });
  const s = await stripe.checkout.sessions.create({ mode: "payment", customer: o.stripeCustomerId!, allowed_payment_method_types: ["card"], metadata,
    invoice_creation: { enabled: true, invoice_data: { metadata } }, payment_intent_data: { metadata },
    line_items: [{ quantity: 1, tax_rates: [tax.id], price_data: { unit_amount: quote.initialExtraHtCents, currency: "eur", product_data: { name: `Tadapo · Domaine ${quote.domain} · Première année` } } }],
    success_url: tadapoClientLink(o), cancel_url: tadapoClientLink(o),
  }, { idempotencyKey: `tadapo/domain/${id}/${version}/${attempt}` });
  if (!s.url?.startsWith("https://checkout.stripe.com/")) throw new TadapoError("STRIPE_UNAVAILABLE");
  await tx.tadapoOrder.update({ where: { id }, data: { domainSessionId: s.id, domainCheckoutUrl: s.url } });
  return s.url;
  }, { timeout: 45000 });
}
export async function confirmTadapoDomainPayment(o: TadapoOrder, sessionId: string) {
  const s = await tadapoStripe().checkout.sessions.retrieve(sessionId), quote = o.domainQuote as TadapoDomainQuote | null;
  if (!quote || !o.domainAcceptedAt || s.id !== o.domainSessionId || s.metadata?.purpose !== "TADAPO_DOMAIN" || s.metadata.domainVersion !== String(o.domainVersion) || s.metadata.tadapoOrderId !== o.id || s.customer !== o.stripeCustomerId || s.amount_total !== Math.round(quote.initialExtraHtCents * 1.2) || s.currency !== "eur") throw new TadapoError("PAYMENT_MISMATCH");
  if (s.payment_status !== "paid") return;
  await getDb().$transaction(async tx => {
    const updated = await tx.tadapoOrder.updateMany({ where: { id: o.id, domainVersion: o.domainVersion, domainSessionId: s.id, domainPaidAt: null }, data: { domainPaidAt: new Date() } });
    if (updated.count) await queueTadapoEmail(tx, o, "TADAPO_DOMAIN_PAYMENT", "Votre paiement de domaine Tadapo est confirmé", `Le supplément initial de votre domaine ${quote.domain} a été réglé. L’achat reste effectué manuellement à votre nom après vérification. Ce paiement ne déclenche aucun supplément automatique au renouvellement.`);
  });
  const invoiceId = typeof s.invoice === "string" ? s.invoice : s.invoice?.id;
  if (invoiceId) {
    const invoice = await tadapoStripe().invoices.retrieve(invoiceId);
    if (invoice.customer !== o.stripeCustomerId || invoice.currency !== "eur" || invoice.total !== s.amount_total) throw new TadapoError("PAYMENT_MISMATCH");
    await getDb().tadapoInvoice.upsert({ where: { id: invoice.id }, create: { id: invoice.id, orderId: o.id, status: invoice.status || "paid", amountCents: invoice.total, hostedUrl: invoice.hosted_invoice_url, pdfUrl: invoice.invoice_pdf }, update: { status: invoice.status || "paid", hostedUrl: invoice.hosted_invoice_url, pdfUrl: invoice.invoice_pdf } });
  }
}
