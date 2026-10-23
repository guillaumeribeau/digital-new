import { financialStage } from "./operations";
import { requireWorkflowReady } from "./project-workflow";
import { randomBytes, randomUUID } from "node:crypto";
import sharp from "sharp";
import { getDb, type SiteOrder, type Prisma } from "@nova/database";
import { z } from "zod";
import { authenticate } from "./access";
import { cents, CommercialError, digest, paymentMode, publicOrigin, seal, sender, unseal } from "./commercial-core";
import { stripeClient } from "./commercial-payment";
import { billingAgreement, billingMoney, billingNoticeEmail, creationTtc, presentationEmail, subscriptionAgreement, subscriptionInvitationEmail, revisionRequestEmail } from "./site-billing-shared";
import { queueOwnerNotification } from "./owner-notifications";
import { business } from "@nova/shared/business";
import { queueReviewInvitation } from "./site-workflow-mail";

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
/** Rebuild a legacy email whose encrypted transport payload was cleared after delivery.
 * Prices, messages, screenshot and invitation URL still come from the frozen order. */
export function rebuildSiteEmail(o: SiteOrder & { project: { lead: { fullName: string; businessName: string; email: string } } }, kind: string) {
  const common = { from: sender(), to: [o.project.lead.email], reply_to: business.email };
  if (kind === "SITE_PRESENTATION") return { ...common, subject: "Votre site Zelyweb est prêt à être découvert", text: `${o.message}\n\nAperçu : ${o.previewUrl}\nValider et payer la création : ${orderLink(o)}`, html: presentationEmail(emailData(o, o.project.lead, true)), attachments: [{ filename: "votre-site.jpg", content: o.screenshot.split(",")[1], content_id: "site-preview" }] };
  if (kind === "SITE_REVISION_REQUEST" && o.revisionEmailMessage) return { ...common, subject: "Paiement reçu : préparons les ajustements de votre site", text: `${o.revisionEmailMessage}\n\nSuivi : ${orderLink(o)}`, html: revisionRequestEmail({ name: o.project.lead.fullName, message: o.revisionEmailMessage, paymentUrl: orderLink(o), creationHtCents: o.creationHtCents, test: o.mode !== "LIVE" }) };
  if (kind === "SITE_SUBSCRIPTION_INVITE" && o.subscriptionWebsiteUrl) return { ...common, subject: "Votre site est prêt : activez votre abonnement Zelyweb", text: `Votre site est prêt. Activez votre abonnement : ${orderLink(o)}\nDomaine : ${o.subscriptionWebsiteUrl}`, html: subscriptionInvitationEmail(invitationData(o)) };
  throw new CommercialError("INVALID_ACTION");
}
export async function resendCurrentSiteEmail(h: Headers, id: string, requestId: string) {
  const actor = await authenticate(h); z.uuid().parse(id); z.uuid().parse(requestId);
  await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (await tx.commercialEmail.findUnique({ where: { manualRequestId: requestId } })) return;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } }); modeCheck(o);
    if (o.status === "DRAFT" || o.firstSubscriptionPaidAt || o.project.lead.deletedAt || o.project.stage === "CANCELLED") throw new CommercialError("INVALID_ACTION");
    if (o.creationPaidAt && !o.subscriptionInviteSentAt && o.workflowVersion) {
      if (await tx.reviewRound.count({ where: { siteOrderId: id, OR: [{ status: "OPEN" }, { reviewVersion: { gte: o.reviewVersion } }] } })) throw new CommercialError("REVIEW_WAITING");
      await queueReviewInvitation(tx, o, await tx.reviewRound.count({ where: { siteOrderId: id } }), requestId);
      return;
    }
    const kind = o.subscriptionInviteSentAt ? "SITE_SUBSCRIPTION_INVITE" : o.creationPaidAt && o.revisionEmailSentAt ? "SITE_REVISION_REQUEST" : !o.creationPaidAt ? "SITE_PRESENTATION" : null;
    if (!kind) throw new CommercialError("INVALID_ACTION");
    if (await tx.commercialEmail.findFirst({ where: { kind, status: { in: ["PENDING", "PROCESSING"] }, OR: [{ siteOrderId: id }, { siteOrderId: null }] } })) throw new CommercialError("REMINDER_PENDING");
    await tx.commercialEmail.create({ data: { siteOrderId: id, kind, manualRequestId: requestId, payloadEncrypted: seal(rebuildSiteEmail(o, kind)), expiresAt: new Date(Date.now() + 23 * 3600000) } });
    await tx.activityLog.create({ data: { actorId: actor.id, action: "SITE_EMAIL_RESENT", projectId: o.projectId, leadId: o.project.leadId } });
  });
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
    await tx.commercialEmail.create({ data: { siteOrderId: id, kind: "SITE_PRESENTATION", expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({
      from: sender(), to: [order.project.lead.email], reply_to: business.email,
      subject: "Votre site Zelyweb est prêt à être découvert",
      text: `Bonjour ${order.project.lead.fullName},\n\n${order.message}\n\nDécouvrir votre site : ${order.previewUrl}\n\nValider et payer la création (${billingMoney(creationTtc(order.creationHtCents))} TTC) : ${orderLink(order)}\n\nÉtapes : 1. Découvrez votre site sur son lien provisoire. 2. Validez et payez uniquement la création. 3. Vous recevrez une confirmation, puis un e-mail avec quelques questions sur vos modifications ; répondez-y directement ou transmettez-nous déjà vos demandes. Trois séries de retours regroupés sont incluses dans les 30 jours après paiement (textes, photos, couleurs et présentation ; nouvelles pages ou fonctionnalités sur devis). 4. Après validation des ajustements, vous recevrez un e-mail pour activer vous-même l’abonnement obligatoire de 34,80 € TTC/mois (29 € HT, TVA 20 %), puis prélèvements mensuels automatiques. Mise en ligne sous 2 jours ouvrés après le premier paiement, si le domaine est prêt. Hébergement, domaine jusqu’à 20 € HT/an (supplément annuel accepté au préalable au-delà) et une modification de 15 minutes maximum par mois non reportable. Résiliation à tout moment, effective en fin de période payée.\n\nGuillaume · Zelyweb`,
      html: presentationEmail(emailData(order, order.project.lead, true)),
      attachments: [{ filename: "votre-site.jpg", content: order.screenshot.split(",")[1], content_id: "site-preview" }],
    }) } });
    await tx.siteOrder.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
    await financialStage(tx, order.projectId, "PREVIEW_SENT");
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
    const updated = await tx.siteOrder.update({ where: { id }, data: {
      consentAt: o.consentAt || new Date(), acceptedName: o.acceptedName || data.name, consentText: o.consentText || billingAgreement(o.creationHtCents),
      ...(!reuse ? { checkoutAttempt: randomUUID(), stripeSessionId: null, checkoutUrl: null, checkoutExpiresAt: new Date(Date.now() + 23 * 3600000) } : {}),
    }, include: { project: { include: { lead: true } } } });
    await queueOwnerNotification(tx, { siteOrderId: id, key: "site-owner/" + id + "/CREATION_ACCEPTED", mode: o.mode, subject: "Commande de création acceptée — paiement en attente", text: `${o.project.lead.businessName} · ${o.project.lead.fullName}\n\nLe client a accepté la commande de ${billingMoney(creationTtc(o.creationHtCents))} TTC et les conditions. Le paiement reste à confirmer par Stripe. Cet accord ne vaut pas confirmation de règlement.`, path: `/projets/${o.projectId}#stripe`, replyTo: o.project.lead.email });
    await financialStage(tx, o.projectId, "AWAITING_PAYMENT");
    return updated;
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
    custom_text: { submit: { message: "La création est payée aujourd’hui. Après les ajustements, vous recevrez un e-mail pour activer vous-même l’abonnement de 34,80 € TTC/mois, avant la mise en ligne." } },
    success_url: `${publicOrigin()}/client/site/${id}?paiement=retour`, cancel_url: `${publicOrigin()}/client/site/${id}`,
    expires_at: Math.floor(order.checkoutExpiresAt!.getTime() / 1000),
  }, { idempotencyKey: "site-checkout/" + order.checkoutAttempt });
  if (!session.url) throw new CommercialError("CONFIGURATION_REQUIRED");
  await getDb().siteOrder.update({ where: { id }, data: { stripeSessionId: session.id, checkoutUrl: session.url } });
  return session.url;
}

export async function prepareRevisionEmail(h: Headers, id: string, message: string) {
  await authenticate(h);
  const text = z.string().trim().min(10).max(5000).parse(message);
  return getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } }); modeCheck(o);
    if (!o.creationPaidAt || o.project.stage === "CANCELLED" || o.project.lead.deletedAt) throw new CommercialError("PAYMENT_REQUIRED");
    if (o.revisionEmailSentAt || o.subscriptionInviteSentAt || o.stripeSubscriptionId) throw new CommercialError("REVISION_EMAIL_SENT");
    const saved = await tx.siteOrder.update({ where: { id }, data: { revisionEmailMessage: text, revisionEmailVersion: { increment: 1 } } });
    return { id, version: saved.revisionEmailVersion, html: revisionRequestEmail({ name: o.project.lead.fullName, message: text, paymentUrl: orderLink(o), creationHtCents: o.creationHtCents, test: o.mode !== "LIVE" }) };
  });
}
export async function sendRevisionEmail(h: Headers, id: string, version: number) {
  const actor = await authenticate(h);
  await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } }); modeCheck(o);
    if (!o.creationPaidAt || o.project.stage === "CANCELLED" || o.project.lead.deletedAt) throw new CommercialError("PAYMENT_REQUIRED");
    if (o.revisionEmailSentAt || o.subscriptionInviteSentAt || o.stripeSubscriptionId) throw new CommercialError("REVISION_EMAIL_SENT");
    if (o.revisionEmailVersion !== version || !o.revisionEmailMessage) throw new CommercialError("STALE_QUOTE");
    const input = { name: o.project.lead.fullName, message: o.revisionEmailMessage, paymentUrl: orderLink(o), creationHtCents: o.creationHtCents, test: o.mode !== "LIVE" };
    await tx.commercialEmail.create({ data: { siteOrderId: id, kind: "SITE_REVISION_REQUEST", expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({ from: sender(), to: [o.project.lead.email], reply_to: business.email, subject: "Paiement reçu : préparons les ajustements de votre site", html: revisionRequestEmail(input), text: `${input.test ? "MODE TEST — aucun débit réel.\n\n" : ""}Bonjour ${input.name},\n\nVotre paiement de création de ${billingMoney(creationTtc(input.creationHtCents))} TTC est confirmé.\n\n${input.message}\n\nEnvoyez vos retours et fichiers depuis votre espace privé, choisissez votre domaine et validez la version finale. Vous pouvez aussi répondre directement à cet e-mail. Trois séries de retours regroupés sont incluses dans les 30 jours suivant le paiement : textes, photos, couleurs et présentation. Toute nouvelle page, fonctionnalité ou changement complet de direction fait l’objet d’un devis séparé.\n\nAprès validation des ajustements, vous recevrez un e-mail pour activer l’abonnement de 34,80 € TTC/mois. Mise en ligne sous 2 jours ouvrés après confirmation du premier paiement, si le domaine et ses accès sont prêts.\n\nSuivi : ${input.paymentUrl}\nGuillaume · Zelyweb` }) } });
    await tx.siteOrder.update({ where: { id }, data: { revisionEmailSentAt: new Date() } });
    await tx.activityLog.create({ data: { actorId: actor.id, action: "SITE_REVISION_REQUEST_SENT", projectId: o.projectId, leadId: o.project.leadId } });
  });
}
function subscriptionReady(o: SiteOrder & { project: { stage: string; websiteUrl: string | null; lead?: { deletedAt: Date | null; emailVerifiedAt: Date | null } } }) {
  modeCheck(o);
  if (!o.creationPaidAt || !o.stripeCustomerId || o.project.stage === "CANCELLED" || !o.project.websiteUrl || o.project.lead?.deletedAt || (o.project.lead && !o.project.lead.emailVerifiedAt)) throw new CommercialError("PAYMENT_REQUIRED");
  let url: URL;
  try { url = new URL(o.project.websiteUrl); } catch { throw new CommercialError("FINAL_DOMAIN_REQUIRED"); }
  if (url.protocol !== "https:" || url.username || url.password) throw new CommercialError("FINAL_DOMAIN_REQUIRED");
}
function invitationData(o: SiteOrder & { project: { lead: { fullName: string; businessName: string } } }) {
  return { name: o.project.lead.fullName, company: o.project.lead.businessName, websiteUrl: o.subscriptionWebsiteUrl!, paymentUrl: orderLink(o), monthlyHtCents: o.monthlyHtCents, test: o.mode !== "LIVE" };
}
export async function prepareSiteSubscription(h: Headers, id: string) {
  await authenticate(h);
  return getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    subscriptionReady(o);
    await requireWorkflowReady(tx, o);
    if (o.stripeSubscriptionId || o.subscriptionInviteSentAt) throw new CommercialError("SUBSCRIPTION_INVITED");
    const order = await tx.siteOrder.update({ where: { id }, data: { subscriptionWebsiteUrl: o.project.websiteUrl, subscriptionInviteVersion: { increment: 1 } }, include: { project: { include: { lead: true } } } });
    return { id, version: order.subscriptionInviteVersion, html: subscriptionInvitationEmail(invitationData(order)) };
  });
}
export async function sendSiteSubscription(h: Headers, id: string, version: number) {
  const actor = await authenticate(h); sender();
  await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    subscriptionReady(o);
    await requireWorkflowReady(tx, o);
    if (o.stripeSubscriptionId || o.subscriptionInviteSentAt) throw new CommercialError("SUBSCRIPTION_INVITED");
    if (!o.subscriptionWebsiteUrl || o.subscriptionInviteVersion !== version || o.project.websiteUrl !== o.subscriptionWebsiteUrl) throw new CommercialError("STALE_QUOTE");
    const input = invitationData(o);
    await tx.commercialEmail.create({ data: { siteOrderId: id, kind: "SITE_SUBSCRIPTION_INVITE", expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({ from: sender(), to: [o.project.lead.email], reply_to: business.email, subject: "Votre site est prêt : activez votre abonnement Zelyweb", html: subscriptionInvitationEmail(input), text: `Bonjour ${input.name},\n\nLes ajustements sont validés. Activez votre abonnement de ${billingMoney(creationTtc(o.monthlyHtCents))} TTC/mois (${billingMoney(o.monthlyHtCents)} HT, TVA 20 %) :\n${input.paymentUrl}\n\nDomaine définitif : ${input.websiteUrl}\n\nPremier mois payé immédiatement lors de votre activation sur Stripe, puis prélèvements mensuels automatiques. Mise en ligne sous 2 jours ouvrés après confirmation du premier paiement, si le domaine et ses accès sont prêts. Hébergement, un domaine jusqu’à 20 € HT/an (supplément annuel accepté au préalable au-delà), une modification de 15 minutes maximum par mois, non reportable. Résiliation à tout moment depuis le portail client, effective en fin de période payée. Remise gratuite des fichiers et du code de transfert, sous réserve des règles du registre. Migration technique facultative et payante.\n\nConditions : https://zelyweb.com/conditions-generales\nGuillaume · Zelyweb` }) } });
    await tx.siteOrder.update({ where: { id }, data: { subscriptionInviteSentAt: new Date() } });
    await tx.activityLog.create({ data: { actorId: actor.id, action: "SITE_SUBSCRIPTION_INVITED", projectId: o.projectId, leadId: o.project.leadId } });
  });
}
export async function checkoutSiteSubscription(id: string, input: unknown) {
  const data = z.object({ agreement: z.literal(true), version: z.number().int() }).parse(input);
  const order = await getDb().$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    subscriptionReady(o);
    await requireWorkflowReady(tx, o);
    if (!o.subscriptionInviteSentAt || o.subscriptionInviteVersion !== data.version || o.stripeSubscriptionId || o.firstSubscriptionPaidAt) throw new CommercialError("INVALID_ACTION");
    const reuse = o.subscriptionAttempt && o.subscriptionCheckoutExpiresAt && o.subscriptionCheckoutExpiresAt.getTime() > Date.now() + 60000;
    if (!reuse) {
      const stripe = stripeClient();
      const subs = await stripe.subscriptions.list({ customer: o.stripeCustomerId!, status: "all", limit: 100 });
      if (subs.data.some(s => s.metadata.siteOrderId === id && !["canceled", "incomplete_expired"].includes(s.status))) throw new CommercialError("SUBSCRIPTION_ALREADY_STARTED");
      const sessions = await stripe.checkout.sessions.list({ customer: o.stripeCustomerId!, limit: 100 });
      if (sessions.data.some(s => s.metadata?.siteOrderId === id && s.metadata?.purpose === "SITE_SUBSCRIPTION" && s.status === "complete" && s.payment_status === "paid")) throw new CommercialError("SUBSCRIPTION_ALREADY_STARTED");
    }
    const updated = await tx.siteOrder.update({ where: { id }, data: { subscriptionConsentAt: o.subscriptionConsentAt || new Date(), subscriptionConsentText: o.subscriptionConsentText || subscriptionAgreement(o.monthlyHtCents), ...(!reuse ? { subscriptionAttempt: randomUUID(), subscriptionCheckoutSessionId: null, subscriptionCheckoutUrl: null, subscriptionCheckoutExpiresAt: new Date(Date.now() + 23 * 3600000) } : {}) } });
    await queueOwnerNotification(tx, { siteOrderId: id, key: "site-owner/" + id + "/SUBSCRIPTION_ACCEPTED", mode: o.mode, subject: "Accord d’abonnement donné — paiement en attente", text: `${o.project.lead.businessName} · ${o.project.lead.fullName}\n\nLe client a accepté les conditions de l’abonnement à ${billingMoney(creationTtc(o.monthlyHtCents))} TTC/mois. Il doit encore terminer l’activation et le paiement sur Stripe. La publication reste bloquée tant que le premier paiement n’est pas confirmé.`, path: `/projets/${o.projectId}#stripe`, replyTo: o.project.lead.email });
    return updated;
  }, { timeout: 20000 });
  if (order.subscriptionCheckoutUrl) return order.subscriptionCheckoutUrl;
  const stripe = stripeClient();
  const tax = await stripe.taxRates.create({ display_name: "TVA", percentage: 20, inclusive: false, country: "FR" }, { idempotencyKey: "site-checkout-monthly-tax/" + id });
  const metadata = { siteOrderId: id, purpose: "SITE_SUBSCRIPTION", attemptId: order.subscriptionAttempt!, inviteVersion: String(order.subscriptionInviteVersion) };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription", customer: order.stripeCustomerId!, allowed_payment_method_types: ["card"], billing_address_collection: "required", customer_update: { address: "auto", name: "auto" },
    line_items: [{ price_data: { currency: "eur", unit_amount: order.monthlyHtCents, recurring: { interval: "month" }, product_data: { name: "Zelyweb — Hébergement, domaine et gestion" } }, tax_rates: [tax.id], quantity: 1 }],
    metadata, subscription_data: { metadata },
    custom_text: { submit: { message: "Premier mois payé immédiatement, puis renouvellement mensuel automatique. Résiliation à tout moment, effective en fin de période payée. Mise en ligne sous 2 jours ouvrés après paiement, si le domaine est prêt." } },
    success_url: `${publicOrigin()}/client/site/${id}?paiement=retour`, cancel_url: `${publicOrigin()}/client/site/${id}`,
    expires_at: Math.floor(order.subscriptionCheckoutExpiresAt!.getTime() / 1000),
  }, { idempotencyKey: "site-subscription-checkout/" + order.subscriptionAttempt });
  if (!session.url) throw new CommercialError("CONFIGURATION_REQUIRED");
  await getDb().siteOrder.updateMany({ where: { id, subscriptionAttempt: order.subscriptionAttempt }, data: { subscriptionCheckoutSessionId: session.id, subscriptionCheckoutUrl: session.url } });
  return session.url;
}
export async function queueOwnerBillingNotice(id: string, kind: string, subject: string, text: string) {
  await getDb().$transaction(async tx => {
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    await queueOwnerNotification(tx, { siteOrderId: id, key: "site-owner/" + id + "/" + kind, mode: o.mode, subject, text: `${o.project.lead.businessName} · ${o.project.lead.fullName}\n\n${text}`, path: `/projets/${o.projectId}#stripe`, replyTo: o.project.lead.email });
  });
}
export async function queueSiteNotice(id: string, kind: string, subject: string, text: string) {
  await getDb().$transaction(async tx => {
    const key = "site-notice/" + id + "/" + kind;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    if (await tx.commercialWebhook.findUnique({ where: { key } })) return;
    const o = await tx.siteOrder.findUniqueOrThrow({ where: { id }, include: { project: { include: { lead: true } } } });
    await tx.commercialEmail.create({ data: { siteOrderId: id, kind: "SITE_BILLING", expiresAt: new Date(Date.now() + 23 * 3600000), payloadEncrypted: seal({ from: sender(), to: [o.project.lead.email], reply_to: business.email, subject, html: billingNoticeEmail(o.project.lead.fullName, subject, text, orderLink(o)), text: `Bonjour ${o.project.lead.fullName},\n\n${text}\n\nVotre suivi et vos factures :\n${orderLink(o)}\n\nGuillaume · Zelyweb` }) } });
    await tx.commercialWebhook.create({ data: { key, provider: "STRIPE" } });
  });
}
export async function syncSiteSubscription(id: string, subscriptionId: string) {
  const stripe = stripeClient();
  if (await getDb().commercialWebhook.findUnique({ where: { key: `site-retired/${id}/${subscriptionId}` } })) return;
  await getDb().$transaction(async tx => {
  await tx.$queryRaw`SELECT "id" FROM "SiteOrder" WHERE "id" = ${id}::uuid FOR UPDATE`;
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["latest_invoice"] });
  const invoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
  const order = await tx.siteOrder.findUniqueOrThrow({ where: { id } }); modeCheck(order);
  if ((order.stripeSubscriptionId && order.stripeSubscriptionId !== sub.id) || (sub.metadata.purpose === "SITE_SUBSCRIPTION" && (!order.subscriptionInviteSentAt || !order.subscriptionConsentAt || sub.metadata.attemptId !== order.subscriptionAttempt || Number(sub.metadata.inviteVersion) !== order.subscriptionInviteVersion))) throw new CommercialError("INVALID_ACTION");
  if ((typeof sub.customer === "string" ? sub.customer : sub.customer.id) !== order.stripeCustomerId || sub.metadata.siteOrderId !== id || sub.items.data.length !== 1 || sub.items.data[0].price.unit_amount !== order.monthlyHtCents || sub.items.data[0].price.currency !== "eur" || sub.items.data[0].quantity !== 1 || sub.items.data[0].price.recurring?.interval !== "month" || sub.items.data[0].price.recurring.interval_count !== 1 || sub.livemode !== (order.mode === "LIVE")) throw new CommercialError("INVALID_ACTION");
    await tx.siteOrder.update({ where: { id }, data: {
      nextBillingAt: sub.items.data[0]?.current_period_end ? new Date(sub.items.data[0].current_period_end * 1000) : null,
      stripeSubscriptionId: sub.id, subscriptionStatus: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end,
      billingAlert: !["active", "trialing"].includes(sub.status) || !!(invoice && invoice.status !== "paid"),
      ...(invoice?.status === "paid" && invoice.amount_paid === creationTtc(order.monthlyHtCents) && invoice.currency === "eur" && !order.firstSubscriptionPaidAt ? { firstSubscriptionPaidAt: new Date() } : {}),
      ...(invoice?.hosted_invoice_url ? { lastInvoiceUrl: invoice.hosted_invoice_url } : {}),
    } });
    if (invoice) await storeBillingInvoice(tx, invoice, id);
  }, { timeout: 20000 });
  const current = await getDb().siteOrder.findUniqueOrThrow({ where: { id } });
  if (current.firstSubscriptionPaidAt) await queueOwnerBillingNotice(id, "SUBSCRIPTION_ACTIVE", "Abonnement activé : site à mettre en ligne", `Le premier paiement mensuel de ${billingMoney(creationTtc(current.monthlyHtCents))} TTC est confirmé. Mise en ligne sous 2 jours ouvrés si le domaine est prêt. Domaine : ${current.subscriptionWebsiteUrl || "Consulter la fiche projet"}.`);
  // Read current subscription state in the locked transaction above, never the stale event payload.
  if (current.cancelAtPeriodEnd || current.subscriptionStatus === "canceled") await queueOwnerBillingNotice(id, "CANCELLATION/" + subscriptionId + (current.subscriptionStatus === "canceled" ? "/ENDED" : "/REQUESTED"), current.subscriptionStatus === "canceled" ? "Abonnement terminé" : "Résiliation d’abonnement demandée", "Consultez le portail Stripe pour la date de fin. Le renouvellement s’arrête en fin de période payée. Prévoir la remise gratuite des fichiers et du code de transfert du domaine. Aucune suspension automatique du site.");
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
