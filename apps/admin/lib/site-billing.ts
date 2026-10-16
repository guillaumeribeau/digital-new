import { randomBytes, randomUUID } from "node:crypto";
import sharp from "sharp";
import { getDb, type SiteOrder, type Prisma } from "@nova/database";
import { z } from "zod";
import { authenticate } from "./access";
import { cents, CommercialError, digest, paymentMode, publicOrigin, seal, sender, unseal } from "./commercial-core";
import { stripeClient } from "./commercial-payment";
import { billingAgreement, billingMoney, billingNoticeEmail, creationTtc, presentationEmail } from "./site-billing-shared";
import { business } from "@nova/shared/business";

export const previewInput = z.object({
  projectId: z.uuid(), expectedVersion: z.coerce.number().int().min(0),
  previewUrl: z.url().max(1000).refine(s => { const u = new URL(s); return u.protocol === "https:" && !u.username && !u.password; }, "Un aperçu HTTPS est requis."),
  message: z.string().trim().min(10).max(5000), creationPrice: z.string(),
  screenshot: z.string().max(230000),
});
const logoUrl = "https://zelyweb.com/pics/Logo%20moderne%20zelyweb%20fond%20transparent.png";
export const orderLink = (o: SiteOrder) => `${publicOrigin()}/client/site/${o.id}#token=${unseal(o.tokenEncrypted)}`;
export const modeCheck = (o: SiteOrder) => {
  if (!["TEST", "LIVE"].includes(paymentMode()) || o.mode !== paymentMode()) throw new CommercialError("CONFIGURATION_REQUIRED");
};
function emailData(order: SiteOrder, lead: { fullName: string; businessName: string }, inline: boolean) {
  return { name: lead.fullName, company: lead.businessName, message: order.message, previewUrl: order.previewUrl,
    paymentUrl: orderLink(order), creationHtCents: order.creationHtCents, screenshot: inline ? "cid:site-preview" : order.screenshot,
    logoUrl, test: order.mode !== "LIVE" };
}
export async function saveSitePresentation(h: Headers, input: unknown) {
  await authenticate(h);
  const data = previewInput.parse(input), ht = cents(data.creationPrice);
  if (ht < 100 || ht > 10000000) throw new CommercialError("INVALID_AMOUNT");
  const bytes = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data.screenshot);
  if (!bytes) throw new CommercialError("INVALID_ACTION");
  const img = await sharp(Buffer.from(bytes[2], "base64"), { limitInputPixels: 16000000 }).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
  if (img.length > 170000) throw new CommercialError("INVALID_ACTION");
  const token = randomBytes(32).toString("base64url");
  return getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id" = ${data.projectId}::uuid FOR UPDATE`;
    const project = await tx.project.findUniqueOrThrow({ where: { id: data.projectId }, include: { lead: true, siteOrder: true } });
    if (!project.lead.emailVerifiedAt || project.lead.deletedAt || project.stage === "CANCELLED") throw new CommercialError("CLIENT_UNVERIFIED");
    const old = project.siteOrder;
    if (old?.status && old.status !== "DRAFT") throw new CommercialError("IMMUTABLE_QUOTE");
    if ((old?.version || 0) !== data.expectedVersion) throw new CommercialError("STALE_QUOTE");
    const values = { previewUrl: data.previewUrl, message: data.message, screenshot: "data:image/jpeg;base64," + img.toString("base64"), creationHtCents: ht, mode: paymentMode(), tokenHash: digest(token), tokenEncrypted: seal(token) };
    const order = old ? await tx.siteOrder.update({ where: { id: old.id }, data: { ...values, version: { increment: 1 } } }) : await tx.siteOrder.create({ data: { projectId: data.projectId, ...values } });
    await tx.project.update({ where: { id: data.projectId }, data: { previewUrl: data.previewUrl } });
    return { id: order.id, version: order.version, html: presentationEmail(emailData(order, project.lead, false)) };
  });
}
export async function sendSitePresentation(h: Headers, id: string, version: number) {
  const actor = await authenticate(h); publicOrigin(); sender();
  await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const order = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    modeCheck(order);
    if (order.version !== version || order.status !== "DRAFT") throw new CommercialError("STALE_QUOTE");
    if (!order.project.lead.emailVerifiedAt || order.project.lead.deletedAt) throw new CommercialError("CLIENT_UNVERIFIED");
    await tx.commercialEmail.create({ data: { kind: "SITE_PRESENTATION", expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({
      from: sender(), to: [order.project.lead.email], reply_to: business.email,
      subject: "Votre site Zelyweb est prêt à être découvert",
      text: `Bonjour ${order.project.lead.fullName},\n\n${order.message}\n\nDécouvrir votre site : ${order.previewUrl}\n\nValider et payer la création (${billingMoney(creationTtc(order.creationHtCents))} TTC) : ${orderLink(order)}\n\nTrois séries d’ajustements après paiement, puis abonnement obligatoire de 34,80 € TTC/mois à la mise en ligne.\n\nGuillaume · Zelyweb`,
      html: presentationEmail(emailData(order, order.project.lead, true)),
      attachments: [{ filename: "votre-site.jpg", content: order.screenshot.split(",")[1], content_id: "site-preview" }],
    }) } });
    await tx.siteOrder.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
    await tx.activityLog.create({ data: { actorId: actor.id, action: "SITE_PRESENTATION_SENT", projectId: order.projectId, leadId: order.project.leadId } });
  });
}
export async function checkoutSite(id: string, input: unknown) {
  const data = z.object({ agreement: z.literal(true), name: z.string().trim().min(2).max(200), version: z.number().int() }).parse(input);
  const order = await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    modeCheck(o);
    if (o.status !== "SENT" || o.version !== data.version || o.project.stage === "CANCELLED") throw new CommercialError("INVALID_ACTION");
    const reuse = o.checkoutAttempt && o.checkoutExpiresAt && o.checkoutExpiresAt.getTime() > Date.now() + 60000;
    if (!reuse && o.stripeCustomerId) {
      const sessions = await stripeClient().checkout.sessions.list({ customer: o.stripeCustomerId, limit: 100 });
      if (sessions.data.some(s => s.metadata?.siteOrderId === id && s.payment_status === "paid")) throw new CommercialError("PAYMENT_REQUIRED");
    }
    return tx.siteOrder.update({ where: { id }, data: {
      consentAt: o.consentAt || new Date(), acceptedName: o.acceptedName || data.name, consentText: o.consentText || billingAgreement(o.creationHtCents),
      ...(!reuse ? { checkoutAttempt: randomUUID(), stripeSessionId: null, checkoutUrl: null, checkoutExpiresAt: new Date(Date.now() + 23 * 3600000) } : {}),
    }, include: { project: { include: { lead: true } } } });
  }, { timeout: 20000 });
  if (order.checkoutUrl) return order.checkoutUrl;
  const stripe = stripeClient();
  const customer = order.stripeCustomerId || (await stripe.customers.create({ email: order.project.lead.email, name: order.project.lead.businessName, metadata: { siteOrderId: id } }, { idempotencyKey: "site-customer/" + id })).id;
  await getDb().siteOrder.update({ where: { id }, data: { stripeCustomerId: customer } });
  const tax = await stripe.taxRates.create({ display_name: "TVA", percentage: 20, inclusive: false, country: "FR" }, { idempotencyKey: "zelyweb-vat20/" + order.checkoutAttempt });
  const session = await stripe.checkout.sessions.create({
    mode: "payment", customer, allowed_payment_method_types: ["card"], billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" }, invoice_creation: { enabled: true, invoice_data: { metadata: { siteOrderId: id } } },
    line_items: [{ price_data: { currency: "eur", unit_amount: order.creationHtCents, product_data: { name: "Création du site vitrine — 5 pages" } }, tax_rates: [tax.id], quantity: 1 }],
    payment_intent_data: { setup_future_usage: "off_session", metadata: { siteOrderId: id } },
    metadata: { siteOrderId: id, attemptId: order.checkoutAttempt!, version: String(order.version) },
    custom_text: { submit: { message: "La création est payée aujourd’hui. Avec votre accord préalable, Zelyweb déclenchera l’abonnement de 34,80 € TTC/mois à la mise en ligne, après les ajustements." } },
    success_url: `${publicOrigin()}/client/site/${id}?paiement=retour`, cancel_url: `${publicOrigin()}/client/site/${id}`,
    expires_at: Math.floor(order.checkoutExpiresAt!.getTime() / 1000),
  }, { idempotencyKey: "site-checkout/" + order.checkoutAttempt });
  if (!session.url) throw new CommercialError("CONFIGURATION_REQUIRED");
  await getDb().siteOrder.update({ where: { id }, data: { stripeSessionId: session.id, checkoutUrl: session.url } });
  return session.url;
}

export async function activateSiteSubscription(h: Headers, id: string) {
  await authenticate(h);
  const order = await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: true } }); modeCheck(o);
    if (!o.creationPaidAt || !o.consentAt || !o.stripeCustomerId || !o.paymentMethodId || o.project.stage === "CANCELLED" || !o.project.websiteUrl) throw new CommercialError("PAYMENT_REQUIRED");
    const retry = o.subscriptionStatus === "incomplete_expired" && !o.firstSubscriptionPaidAt;
    return tx.siteOrder.update({ where: { id }, data: retry ? { subscriptionAttempt: randomUUID(), stripeSubscriptionId: null } : { subscriptionAttempt: o.subscriptionAttempt || randomUUID() } });
  });
  if (order.stripeSubscriptionId) return;
  const stripe = stripeClient();
  const existing = (await stripe.subscriptions.list({ customer: order.stripeCustomerId!, status: "all", limit: 100 })).data.find(s => s.metadata.siteOrderId === id && !["incomplete_expired", "canceled"].includes(s.status));
  if (existing) { await syncSiteSubscription(id, existing.id); return; }
  const tax = await stripe.taxRates.create({ display_name: "TVA", percentage: 20, inclusive: false, country: "FR" }, { idempotencyKey: "site-monthly-tax/" + id });
  const product = await stripe.products.create({ name: "Zelyweb — Hébergement, domaine et gestion" }, { idempotencyKey: "site-monthly-product/" + id });
  const subscription = await stripe.subscriptions.create({
    customer: order.stripeCustomerId!, default_payment_method: order.paymentMethodId!, payment_behavior: "allow_incomplete",
    collection_method: "charge_automatically", metadata: { siteOrderId: id },
    items: [{ price_data: { currency: "eur", product: product.id, recurring: { interval: "month" }, unit_amount: order.monthlyHtCents }, tax_rates: [tax.id] }],
    expand: ["latest_invoice"],
  }, { idempotencyKey: "site-subscription/" + order.subscriptionAttempt });
  const invoice = typeof subscription.latest_invoice === "object" ? subscription.latest_invoice : null;
  await getDb().siteOrder.update({ where: { id }, data: { stripeSubscriptionId: subscription.id } });
  await syncSiteSubscription(id, subscription.id);
  if (invoice?.hosted_invoice_url && invoice.status !== "paid") {
    await queueSiteNotice(id, "ACTION_REQUIRED", "Une dernière validation bancaire est nécessaire", `Votre banque demande une action pour le premier paiement de votre abonnement. Terminez le règlement avant la mise en ligne :\n${invoice.hosted_invoice_url}`);
  }
}
export async function queueSiteNotice(id: string, kind: string, subject: string, text: string) {
  await getDb().$transaction(async tx => {
    const key = "site-notice/" + id + "/" + kind;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    await tx.commercialEmail.create({ data: { kind: "SITE_BILLING", expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({ from: sender(), to: [o.project.lead.email], reply_to: business.email, subject, html: billingNoticeEmail(o.project.lead.fullName, subject, text, orderLink(o)), text: `Bonjour ${o.project.lead.fullName},\n\n${text}\n\nVotre suivi et vos factures :\n${orderLink(o)}\n\nGuillaume · Zelyweb` }) } });
    await tx.commercialWebhook.create({ data: { key, provider: "STRIPE" } });
  });
}
export async function syncSiteSubscription(id: string, subscriptionId: string) {
  const stripe = stripeClient();
  await getDb().$transaction(async tx => {
  await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["latest_invoice"] });
  const invoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
  const order = await tx.siteOrder.findUniqueOrThrow({ where: { id } }); modeCheck(order);
  if ((typeof sub.customer === "string" ? sub.customer : sub.customer.id) !== order.stripeCustomerId || sub.metadata.siteOrderId !== id || sub.items.data.length !== 1 || sub.items.data[0].price.unit_amount !== order.monthlyHtCents || sub.items.data[0].price.currency !== "eur" || sub.livemode !== (order.mode === "LIVE")) throw new CommercialError("INVALID_ACTION");
    await tx.siteOrder.update({ where: { id }, data: {
      stripeSubscriptionId: sub.id, subscriptionStatus: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end,
      billingAlert: !["active", "trialing"].includes(sub.status) || !!(invoice && invoice.status !== "paid"),
      ...(invoice?.status === "paid" && invoice.amount_paid === creationTtc(order.monthlyHtCents) && invoice.currency === "eur" && !order.firstSubscriptionPaidAt ? { firstSubscriptionPaidAt: new Date() } : {}),
      ...(invoice?.hosted_invoice_url ? { lastInvoiceUrl: invoice.hosted_invoice_url } : {}),
    } });
    if (invoice) await storeBillingInvoice(tx, invoice, id);
  }, { timeout: 20000 });
}
export async function storeBillingInvoice(tx: Prisma.TransactionClient, invoice: { id: string; status: string | null; amount_paid: number; amount_due: number; hosted_invoice_url?: string | null; invoice_pdf?: string | null }, siteOrderId?: string, quoteId?: string) {
  const data = { siteOrderId, quoteId, status: invoice.status || "draft", amountCents: invoice.amount_paid || invoice.amount_due, hostedUrl: invoice.hosted_invoice_url, pdfUrl: invoice.invoice_pdf };
  await tx.billingInvoice.upsert({ where: { id: invoice.id }, create: { id: invoice.id, ...data }, update: data });
}
export async function sitePortal(id: string) {
  const order = await getDb().siteOrder.findUniqueOrThrow({ where: { id } }); modeCheck(order);
  if (!order.stripeCustomerId || !order.creationPaidAt) throw new CommercialError("PAYMENT_REQUIRED");
  const stripe = stripeClient();
  const config = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Votre suivi Zelyweb", privacy_policy_url: "https://zelyweb.com/politique-confidentialite", terms_of_service_url: "https://zelyweb.com/conditions-generales" },
    features: { invoice_history: { enabled: true }, payment_method_update: { enabled: true }, subscription_cancel: { enabled: true, mode: "at_period_end", proration_behavior: "none" } },
  }, { idempotencyKey: "zelyweb-portal-config-v1/" + order.mode });
  return (await stripe.billingPortal.sessions.create({ customer: order.stripeCustomerId, configuration: config.id, return_url: `${publicOrigin()}/client/site/${id}` })).url;
}
