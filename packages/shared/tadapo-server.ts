import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { z } from "zod";
import { getDb, Prisma, type TadapoOrder } from "@nova/database";
import { tadapoBriefSchema } from "@nova/validation/tadapo";
import { tadapoAgreement, tadapoAnniversary, tadapoOffer, tadapoOfferVersion, type TadapoOffer } from "./tadapo";
import { seal, unseal } from "./secure-payload";
import termsArchive from "./tadapo-terms-2026-10-23.json";

export class TadapoError extends Error {}
export const digestTadapo = (value: string) => createHash("sha256").update(value).digest("hex");
export function tadapoOrigin() {
  const url = new URL(process.env.NEXT_PUBLIC_TADAPO_SITE_URL || "https://tadapo.com");
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol === "http:"))) throw new TadapoError("CONFIGURATION_REQUIRED");
  return url.origin;
}
export function tadapoMode() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (key.startsWith("sk_test_")) return "TEST";
  if (key.startsWith("sk_live_")) return "LIVE";
  throw new TadapoError("ORDERING_NOT_OPEN");
}
export function tadapoStripe() {
  tadapoMode(); return new Stripe(process.env.STRIPE_SECRET_KEY!, { timeout: 10000, maxNetworkRetries: 1, httpClient: Stripe.createFetchHttpClient() });
}
export function tadapoSender() {
  const from = process.env.TADAPO_FROM_EMAIL, reply = process.env.TADAPO_CONTACT_EMAIL;
  if (!from || !reply || !z.email().safeParse(reply).success || !process.env.RESEND_API_KEY) throw new TadapoError("EMAIL_NOT_CONFIGURED");
  return { from, reply_to: reply };
}
export const tadapoCheckoutSchema = z.object({
  requestId: z.uuid(), brief: tadapoBriefSchema, offerVersion: z.literal(tadapoOfferVersion),
  agreement: z.literal(true), privacy: z.literal(true), earlyStart: z.boolean(), honeypot: z.literal("").default(""),
}).strict();
export function tadapoClientLink(order: TadapoOrder) {
  const token = unseal(order.tokenEncrypted);
  if (typeof token !== "string") throw new TadapoError("INVALID_TOKEN");
  return `${tadapoOrigin()}/suivi/${order.id}#token=${token}`;
}
export async function queueTadapoEmail(tx: Prisma.TransactionClient, order: TadapoOrder, kind: string, subject: string, message: string, requestId?: string) {
  const brief = tadapoBriefSchema.parse(order.brief);
  const consent = order.consentSnapshot as { termsHtml?: string };
  return tx.commercialEmail.create({ data: { tadapoOrderId: order.id, kind, manualRequestId: requestId,
    expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({ ...tadapoSender(), to: [brief.email], subject,
      text: `Bonjour ${brief.fullName},\n\n${message}\n\nVotre lien personnel : ${tadapoClientLink(order)}\n\nRépondez à cet e-mail pour transmettre vos contenus ou poser une question.\nTadapo · Guillaume Ribeau EI`,
      ...(kind === "TADAPO_PAYMENT" && consent.termsHtml ? { attachments: [{ filename: "conditions-tadapo-acceptees.html", content: Buffer.from(consent.termsHtml).toString("base64") }] } : {}) }) } });
}
/** A request id permanently identifies one accepted offer. A retry reuses the same Stripe session. */
export async function checkoutTadapo(input: unknown) {
  const data = tadapoCheckoutSchema.parse(input), mode = tadapoMode();
  if (mode === "LIVE" && process.env.TADAPO_ORDERING_ENABLED !== "true") throw new TadapoError("ORDERING_NOT_OPEN");
  tadapoSender(); tadapoOrigin();
  const hash = digestTadapo(JSON.stringify(data));
  let order = await getDb().tadapoOrder.findUnique({ where: { requestId: data.requestId } });
  if (!order) {
    const token = randomBytes(32).toString("base64url"), now = new Date();
    try {
      order = await getDb().tadapoOrder.create({ data: { requestId: data.requestId, payloadHash: hash, mode,
        brief: data.brief, offerSnapshot: tadapoOffer(data.brief.plan, data.brief.term), tokenHash: digestTadapo(token), tokenEncrypted: seal(token),
        consentSnapshot: { acceptedAt: now.toISOString(), agreement: tadapoAgreement(tadapoOffer(data.brief.plan, data.brief.term)), privacyVersion: "2026-10-23", earlyStart: data.earlyStart,
          termsVersion: termsArchive.version, termsHtml: `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Conditions Tadapo acceptées</title><body>${termsArchive.html.replaceAll("__TADAPO_CONTACT_EMAIL__", process.env.TADAPO_CONTACT_EMAIL!).replaceAll('href="/', `href="${tadapoOrigin()}/`)}</body></html>`,
          earlyStartText: "Je demande expressément que la prestation commence avant la fin du délai de rétractation applicable. Les conséquences sont décrites dans les conditions générales et la page Rétractation." },
        checkoutExpiresAt: new Date(now.getTime() + 23 * 3600000) } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      order = await getDb().tadapoOrder.findUniqueOrThrow({ where: { requestId: data.requestId } });
    }
  }
  if (order.payloadHash !== hash || order.mode !== mode) throw new TadapoError("REQUEST_CONFLICT");
  if (order.paidAt) throw new TadapoError("ALREADY_PAID");
  if (order.checkoutExpiresAt! <= new Date()) throw new TadapoError("CHECKOUT_EXPIRED");
  if (order.checkoutUrl) return { url: order.checkoutUrl };
  const offer = order.offerSnapshot as unknown as TadapoOffer, stripe = tadapoStripe();
  const tax = await stripe.taxRates.create({ display_name: "TVA", percentage: 20, inclusive: false, country: "FR" }, { idempotencyKey: `tadapo/tax/${order.id}` });
  const metadata = { tadapoOrderId: order.id, purpose: "TADAPO_SUBSCRIPTION", offerVersion: offer.version };
  const session = await stripe.checkout.sessions.create({ mode: "subscription", customer_email: data.brief.email,
    client_reference_id: order.id, allowed_payment_method_types: ["card"], billing_address_collection: "required",
    line_items: [{ quantity: 1, tax_rates: [tax.id], price_data: { currency: "eur", unit_amount: offer.htCents,
      recurring: { interval: "month" }, product_data: { name: `Tadapo ${offer.name}`, description: offer.minimumMonths ? "Engagement initial 12 mois · paiement mensuel" : "Sans engagement de durée" } } }],
    metadata, subscription_data: { metadata },
    success_url: `${tadapoOrigin()}/suivi/${order.id}?retour=paiement#token=${unseal(order.tokenEncrypted)}`,
    cancel_url: `${tadapoOrigin()}/commande?offre=${offer.plan}&engagement=${offer.term}&retour=annule`,
    expires_at: Math.floor(order.checkoutExpiresAt!.getTime() / 1000),
  }, { idempotencyKey: `tadapo/checkout/${order.id}` });
  if (!session.url?.startsWith("https://checkout.stripe.com/")) throw new TadapoError("STRIPE_UNAVAILABLE");
  await getDb().tadapoOrder.update({ where: { id: order.id }, data: { stripeSessionId: session.id, checkoutUrl: session.url } });
  return { url: session.url };
}

export async function authorizeTadapo(id: string, token: string | null) {
  if (!z.uuid().safeParse(id).success || !token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new TadapoError("UNAUTHORIZED");
  const order = await getDb().tadapoOrder.findUnique({ where: { id }, include: { project: { select: { previewUrl: true, websiteUrl: true, lead: { select: { deletedAt: true } } } } } });
  if (!order || order.project?.lead.deletedAt || !timingSafeEqual(Buffer.from(order.tokenHash, "hex"), Buffer.from(digestTadapo(token), "hex"))) throw new TadapoError("UNAUTHORIZED");
  return order;
}
export async function tadapoPublicView(id: string, token: string | null) {
  const o = await authorizeTadapo(id, token);
  const invoices = await getDb().tadapoInvoice.findMany({ where: { orderId: id }, orderBy: { createdAt: "desc" }, take: 50 });
  return { id: o.id, stage: o.stage, offer: o.offerSnapshot, paid: !!o.paidAt, contentComplete: !!o.contentCompleteAt,
    previewUrl: o.project?.previewUrl, websiteUrl: o.project?.websiteUrl, reviewVersion: o.reviewVersion,
    approved: o.approvedVersion === o.reviewVersion, subscriptionStatus: o.subscriptionStatus, billingAlert: o.billingAlert,
    commitmentEndAt: o.commitmentEndAt, cancelRequestedAt: o.cancelRequestedAt, cancelEffectiveAt: o.cancelEffectiveAt,
    nextBillingAt: o.nextBillingAt, domainQuote: o.domainQuote, domainVersion: o.domainVersion, domainAccepted: !!o.domainAcceptedAt,
    domainPaid: !!o.domainPaidAt, domainReady: !!o.domainReadyAt, invoices };
}
const objectId = (value: string | { id: string } | null | undefined) => typeof value === "string" ? value : value?.id;
export const tadapoInvoiceSubscription = (invoice: Stripe.Invoice) => objectId(invoice.parent?.subscription_details?.subscription);

/** Called only after Stripe signature validation. Retrieve current objects to tolerate event reordering. */
export async function applyTadapoStripeEvent(event: Stripe.Event) {
  const relevant = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "invoice.paid", "invoice.payment_failed", "invoice.payment_action_required", "invoice.finalized", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"];
  if (!relevant.includes(event.type)) return;
  const object = event.data.object as unknown as { id: string; metadata?: Record<string, string> };
  let orderId = object.metadata?.tadapoOrderId;
  if (!orderId && event.type.startsWith("invoice.")) {
    const invoice = event.data.object as Stripe.Invoice;
    const subId = tadapoInvoiceSubscription(invoice);
    orderId = invoice.parent?.subscription_details?.metadata?.tadapoOrderId;
    if (!orderId && subId) orderId = (await getDb().tadapoOrder.findUnique({ where: { stripeSubscriptionId: subId } }))?.id;
    if (!orderId && subId) orderId = (await tadapoStripe().subscriptions.retrieve(subId)).metadata.tadapoOrderId;
  }
  if (!z.uuid().safeParse(orderId).success) return;
  const existing = await getDb().tadapoOrder.findUnique({ where: { id: orderId } });
  if (!existing || existing.mode !== (event.livemode ? "LIVE" : "TEST") || existing.mode !== tadapoMode()) throw new TadapoError("MODE_MISMATCH");
  const stripe = tadapoStripe();
  if (object.metadata?.purpose === "TADAPO_DOMAIN") {
    if (event.type.startsWith("checkout.session.") || event.type.startsWith("invoice.")) {
      const { confirmTadapoDomainPayment } = await import("./tadapo-domain");
      if (!existing.domainSessionId) throw new TadapoError("CHECKOUT_NOT_RECORDED");
      await confirmTadapoDomainPayment(existing, event.type.startsWith("checkout.session.") ? object.id : existing.domainSessionId);
    }
    return;
  }
  // Reconcile from the server-created Checkout session, never trust the return URL or an active flag alone.
  if (!existing.stripeSessionId) throw new TadapoError("CHECKOUT_NOT_RECORDED");
  const session = await stripe.checkout.sessions.retrieve(existing.stripeSessionId);
  if (session.metadata?.tadapoOrderId !== existing.id || session.livemode !== event.livemode) throw new TadapoError("PAYMENT_MISMATCH");
  const subId = objectId(session.subscription);
  if (!subId) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  if (sub.livemode !== event.livemode || session.mode !== "subscription" || sub.metadata.tadapoOrderId !== existing.id || objectId(sub.customer) !== objectId(session.customer)) throw new TadapoError("PAYMENT_MISMATCH");
  const offer = existing.offerSnapshot as unknown as TadapoOffer;
  const item = sub.items.data[0];
  if (!item || sub.items.data.length !== 1 || item.quantity !== 1 || item.price.unit_amount !== offer.htCents || item.price.currency !== "eur" || item.price.recurring?.interval !== "month" || item.price.recurring.interval_count !== 1) throw new TadapoError("PAYMENT_MISMATCH");
  const invoice = event.type.startsWith("invoice.") ? await stripe.invoices.retrieve(object.id) : null;
  if (invoice && (tadapoInvoiceSubscription(invoice) !== sub.id || objectId(invoice.customer) !== objectId(sub.customer))) throw new TadapoError("PAYMENT_MISMATCH");
  const firstPaid = session.payment_status === "paid" && session.amount_total === offer.ttcCents && session.currency === "eur";
  if (session.payment_status === "paid" && !firstPaid) throw new TadapoError("PAYMENT_MISMATCH");
  await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id" = ${existing.id}::uuid FOR UPDATE`;
    const key = `stripe/tadapo/${event.id}`;
    if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
    let o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id: existing.id } });
    const start = new Date(sub.start_date * 1000);
    const update = { stripeCustomerId: objectId(sub.customer), stripeSubscriptionId: sub.id, subscriptionStatus: sub.status,
      nextBillingAt: new Date(item.current_period_end * 1000), billingAlert: ["past_due", "unpaid", "incomplete", "incomplete_expired"].includes(sub.status),
      ...(sub.cancel_at ? { cancelEffectiveAt: new Date(sub.cancel_at * 1000) } : {}) };
    if (!o.paidAt && firstPaid) {
      const brief = tadapoBriefSchema.parse(o.brief);
      const lead = await tx.lead.create({ data: { brand: "tadapo", requestId: o.requestId, payloadHash: o.payloadHash, status: "PAID",
        fullName: brief.fullName, email: brief.email.toLowerCase(), phone: brief.phone.slice(0, 25) || null,
        preferredContactMethod: "email", businessName: brief.company, businessSector: brief.activity.slice(0, 100), city: brief.area,
        services: brief.services.slice(0, 1500), preferredStyle: brief.style.slice(0, 50), projectDescription: brief.objectives,
        pricingAcknowledgedAt: o.createdAt, privacyAcknowledgedAt: o.createdAt, pricingVersion: offer.version, privacyVersion: "2026-10-23", source: "tadapo-order" } });
      const project = await tx.project.create({ data: { leadId: lead.id, stage: "CONTENT_PREPARATION", stripeCustomerId: update.stripeCustomerId } });
      o = await tx.tadapoOrder.update({ where: { id: o.id }, data: { ...update, paidAt: start, projectId: project.id, stage: "CONTENT_PREPARATION",
        commitmentEndAt: offer.minimumMonths ? tadapoAnniversary(start, offer.minimumMonths) : null } });
      const consent = o.consentSnapshot as { agreement?: string; earlyStart?: boolean; earlyStartText?: string };
      await queueTadapoEmail(tx, o, "TADAPO_PAYMENT", "Votre commande Tadapo est confirmée", `Votre premier mois a été réglé.\n\n${consent.agreement}\n\nDémarrage anticipé demandé : ${consent.earlyStart ? "oui" : "non"}. ${consent.earlyStartText}\n\nConditions : ${tadapoOrigin()}/conditions-generales\n\nEnvoyez votre logo, vos photos et vos textes en réponse. La première version est prévue sous 72 h ouvrées après dossier complet et paiement. Vos factures sont accessibles par votre lien personnel.`);
    } else await tx.tadapoOrder.update({ where: { id: o.id }, data: update });
    if (invoice) await tx.tadapoInvoice.upsert({ where: { id: invoice.id }, create: { id: invoice.id, orderId: o.id, amountCents: invoice.total, status: invoice.status || "draft", hostedUrl: invoice.hosted_invoice_url, pdfUrl: invoice.invoice_pdf, periodEnd: new Date(invoice.period_end * 1000) }, update: { status: invoice.status || "draft", hostedUrl: invoice.hosted_invoice_url, pdfUrl: invoice.invoice_pdf } });
    await tx.commercialWebhook.create({ data: { key, provider: "stripe" } });
  });
}

/** No generic Stripe portal cancellation: it would bypass the 12-month commitment. */
export async function cancelTadapo(id: string, token: string | null) {
  const order = await authorizeTadapo(id, token);
  if (!order.paidAt || !order.stripeSubscriptionId || order.mode !== tadapoMode()) throw new TadapoError("INVALID_ACTION");
  const stripe = tadapoStripe(), sub = await stripe.subscriptions.retrieve(order.stripeSubscriptionId);
  if (sub.status === "canceled") return;
  const periodEnd = sub.items.data[0]?.current_period_end;
  if (!periodEnd) throw new TadapoError("INVALID_ACTION");
  const end = Math.max(periodEnd, Math.floor((order.commitmentEndAt?.getTime() || 0) / 1000));
  await stripe.subscriptions.update(sub.id, { cancel_at: end, proration_behavior: "none" }, { idempotencyKey: `tadapo/cancel/${id}/${end}` });
  await getDb().tadapoOrder.update({ where: { id }, data: { cancelRequestedAt: order.cancelRequestedAt || new Date(), cancelEffectiveAt: new Date(end * 1000) } });
}

export async function tadapoPaymentMethodLink(id: string, token: string | null) {
  const order = await authorizeTadapo(id, token);
  if (!order.paidAt || !order.stripeCustomerId || order.mode !== tadapoMode()) throw new TadapoError("INVALID_ACTION");
  const stripe = tadapoStripe();
  const configuration = await stripe.billingPortal.configurations.create({ business_profile: { headline: "Tadapo · Factures et moyen de paiement" },
    features: { payment_method_update: { enabled: true }, invoice_history: { enabled: true }, subscription_cancel: { enabled: false }, subscription_update: { enabled: false }, customer_update: { enabled: false } } }, { idempotencyKey: "tadapo/portal/v1" });
  return (await stripe.billingPortal.sessions.create({ customer: order.stripeCustomerId, configuration: configuration.id, return_url: tadapoClientLink(order), flow_data: { type: "payment_method_update" } })).url;
}

export async function tadapoFeedback(id: string, token: string | null, input: unknown) {
  await authorizeTadapo(id, token);
  const data = z.object({ action: z.enum(["approve", "feedback"]), version: z.number().int().min(1), requestId: z.uuid(), name: z.string().trim().min(2).max(200), message: z.string().trim().max(10000).default("") }).strict().parse(input);
  await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.tadapoOrder.findUniqueOrThrow({ where: { id } });
    if (!o.paidAt || !["PREVIEW_SENT", "REVIEW", "APPROVED"].includes(o.stage) || o.reviewVersion !== data.version) throw new TadapoError("INVALID_ACTION");
    const content = data.action === "approve" ? `Validation par ${data.name}` : data.message;
    const previous = await tx.tadapoFeedback.findUnique({ where: { requestId: data.requestId } });
    if (previous) { if (previous.orderId !== id || previous.content !== content || previous.version !== data.version) throw new TadapoError("REQUEST_CONFLICT"); return; }
    if (data.action === "feedback" && data.message.length < 2) throw new TadapoError("MESSAGE_REQUIRED");
    await tx.tadapoFeedback.create({ data: { requestId: data.requestId, orderId: id, version: data.version, content } });
    await tx.tadapoOrder.update({ where: { id }, data: data.action === "approve" ? { stage: "APPROVED", approvedAt: new Date(), approvedVersion: data.version, approvedName: data.name } : { stage: "REVIEW", approvedAt: null, approvedVersion: null, approvedName: null } });
    await tx.project.update({ where: { id: o.projectId! }, data: { stage: data.action === "approve" ? "APPROVED" : "REVIEW" }, select: { id: true } });
  });
}
