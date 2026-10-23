import { adminWorkflow, clientWorkflow, workflowData, checkUpload, requireWorkflowReady } from "../../apps/admin/lib/project-workflow";
import { resendEmail } from "../../apps/admin/lib/operations";
import { GET as downloadReview } from "../../apps/admin/app/api/review-files/[id]/route";
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import sharp from "sharp";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { NextRequest } from "next/server";
import { POST as auth } from "../../apps/admin/app/api/auth/[...all]/route";
import { POST as webhook } from "../../apps/admin/app/api/webhooks/stripe/route";
import { POST as access } from "../../apps/admin/app/api/client/sites/access/route";
import { GET as clientGet, POST as clientPost } from "../../apps/admin/app/api/client/sites/[id]/route";
import { adminService, BusinessError } from "../../apps/admin/lib/service";
import { AdminAccessError } from "../../apps/admin/lib/access";
import { saveSitePresentation, sendSitePresentation, checkoutSite, prepareRevisionEmail, prepareSiteSubscription, sendSiteSubscription, checkoutSiteSubscription, sitePortal, syncSiteSubscription } from "../../apps/admin/lib/site-billing";
import { unseal, seal, digest, CommercialError } from "../../apps/admin/lib/commercial-core";
import { applySiteInbound, storedInboundAttachment } from "../../apps/admin/lib/site-inbound";
import { siteReplyAddress } from "../../apps/admin/lib/site-workflow-mail";
import { stripeClient } from "../../apps/admin/lib/commercial-payment";
import { siteCookie } from "../../apps/admin/lib/site-access";
import { leadRepository } from "../../apps/website/lib/lead-repository";
import { leadSchema } from "@nova/validation";
import { decryptPayload } from "../../apps/website/lib/lead-security";

assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
const db = getDb(), originalFetch = globalThis.fetch;
let cookie = "", projectId = "", orderId = "", token = "";
const h = () => new Headers({ cookie });
let checkoutCount = 0, subscriptionCount = 0, subStatus = "incomplete", invoiceStatus = "open";
const customerId = "cus_site_fixture", subId = "sub_site_fixture";
let checkoutMeta: Record<string, string> = {}, subscriptionMeta: Record<string, string> = {};
let cancelAtEnd = false, intentStatus = "succeeded", invoiceReason = "subscription_create", invoiceId = "in_site_fixture";
const invoice = () => ({ id: invoiceId, object: "invoice", customer: customerId, status: invoiceStatus, amount_paid: invoiceStatus === "paid" ? 3480 : 0, amount_due: 3480, total: 3480, currency: "eur", hosted_invoice_url: "https://invoice.stripe.com/i/fixture", invoice_pdf: "https://pay.stripe.com/invoice/fixture/pdf", billing_reason: invoiceReason, metadata: { siteOrderId: orderId }, parent: { subscription_details: { subscription: subId, metadata: { siteOrderId: orderId } } } });
const subscription = () => ({ id: subId, object: "subscription", livemode: false, customer: customerId, status: subStatus, cancel_at_period_end: cancelAtEnd, metadata: subscriptionMeta, latest_invoice: invoice(), items: { data: [{ quantity: 1, price: { unit_amount: 2900, currency: "eur", recurring: { interval: "month", interval_count: 1 } } }] } });
async function stripeEvent(type: string, object: unknown, eventId = "evt_" + randomUUID()) {
  const payload = JSON.stringify({ id: eventId, object: "event", type, livemode: false, data: { object } });
  return webhook(new Request("http://localhost:3001/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": stripeClient().webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! }) }, body: payload }));
}
function request(body?: unknown, privateToken = token) {
  return new NextRequest(`http://localhost:3001/api/client/sites/${orderId}`, { method: body ? "POST" : "GET", headers: { cookie: `${siteCookie(orderId)}=${privateToken}`, origin: "http://localhost:3001", "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
const ctx = () => ({ params: Promise.resolve({ id: orderId }) });
after(async () => { globalThis.fetch = originalFetch; await db.$disconnect(); });

async function workflowFixture() {
  const source = await db.project.findUniqueOrThrow({ where: { id: projectId }, include: { lead: true } });
  const lead = await db.lead.create({ data: { ...source.lead, id: randomUUID(), requestId: randomUUID(), email: `workflow-${randomUUID()}@example.com` } });
  const project = await db.project.create({ data: { leadId: lead.id, stage: "PAID" } });
  const secret = randomBytes(32).toString("base64url");
  const order = await db.siteOrder.create({ data: { projectId: project.id, mode: "TEST", status: "PAID", creationPaidAt: new Date(), previewUrl: "https://preview.example.com", screenshot: "fixture", message: "Projet de test", tokenHash: digest(secret), tokenEncrypted: seal(secret) } });
  return { order, lead, project };
}

test("présentation privée, aperçu HTML, prix figé, accès et consentement obligatoires", async () => {
  await assert.rejects(saveSitePresentation(new Headers(), {}), AdminAccessError);
  const password = "Billing-Test-Password-42!", user = await db.user.create({ data: { email: "billing-admin@example.com", name: "Admin Paiement", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const login = await auth(new Request("http://localhost:3001/api/auth/sign-in/email", { method: "POST", headers: { origin: "http://localhost:3001", "content-type": "application/json" }, body: JSON.stringify({ email: user.email, password }) }));
  assert.equal(login.status, 200); cookie = login.headers.getSetCookie().map(s => s.split(";")[0]).join("; ");
  const lead = await leadRepository.submit(leadSchema.parse({ company: "Site fictif", sector: "Commerce", city: "Test", services: "Prestation fictive", style: "propose", fullName: "Client Fictif", email: "billing-client@example.com", contactMethod: "email", consent: true, pricingAcknowledged: true, honeypot: "", requestId: randomUUID() }));
  const outbox = await db.outboxEvent.findFirstOrThrow({ where: { leadId: lead.reference } });
  const payload = decryptPayload(outbox.payloadEncrypted!) as { text: string };
  await leadRepository.verify(payload.text.match(/#token=([A-Za-z0-9_-]+)/)![1]);
  await adminService.changeLeadStatus(h(), { id: lead.reference, expected: "NEW", status: "QUALIFIED" });
  projectId = await adminService.convert(h(), lead.reference);
  Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_test_fixture_only", STRIPE_WEBHOOK_SECRET: "whsec_billing_fixture" });
  const image = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#2454ff" } }).jpeg().toBuffer();
  const input = { projectId, expectedVersion: 0, previewUrl: "https://preview.example.com", message: "Votre première version <script>alert(1)</script> est prête.", creationPrice: "350,00", screenshot: "data:image/jpeg;base64," + image.toString("base64") };
  const saved = await saveSitePresentation(h(), input); orderId = saved.id;
  await assert.rejects(prepareRevisionEmail(h(), orderId, "Vos textes sont-ils corrects ?"), CommercialError);
  assert.ok(saved.html.includes("420,00")); assert.ok(!saved.html.includes("<script>"));
  const before = await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } }); token = unseal(before.tokenEncrypted) as string;
  assert.equal((await clientGet(request(), ctx())).status, 401, "Draft inaccessible even with the token");
  await sendSitePresentation(h(), orderId, saved.version);
  await assert.rejects(saveSitePresentation(h(), { ...input, expectedVersion: 1 }), CommercialError);
  const email = await db.commercialEmail.findFirstOrThrow({ where: { siteOrderId: orderId, kind: "SITE_PRESENTATION" }, orderBy: { createdAt: "desc" } });
  const mail = unseal(email.payloadEncrypted!) as { html: string; text: string; attachments: { content_id: string }[] };
  assert.ok(mail.html.includes("lien provisoire")); assert.ok(mail.html.includes("quelques questions")); assert.ok(mail.html.includes("4. Activez"));
  assert.ok(mail.html.includes("cid:site-preview")); assert.equal(mail.attachments[0].content_id, "site-preview");
  assert.ok(!email.payloadEncrypted!.includes(token));
  const exchanged = await access(new NextRequest("http://localhost:3001/api/client/sites/access", { method: "POST", headers: { origin: "http://localhost:3001", "content-type": "application/json" }, body: JSON.stringify({ id: orderId, token }) }));
  assert.equal(exchanged.status, 200); assert.ok(exchanged.headers.getSetCookie()[0].includes("HttpOnly"));
  assert.equal((await clientGet(request(undefined, "invalid"), ctx())).status, 401);
  const publicData = await (await clientGet(request(), ctx())).json(); assert.equal(publicData.creationHtCents, 35000); assert.ok(!JSON.stringify(publicData).includes("tokenEncrypted"));
  assert.equal((await clientPost(request({ action: "pay", name: "Client Fictif", agreement: false, version: saved.version }), ctx())).status, 400);
});

test("checkout serveur sans doublon, facture et carte enregistrée seulement sur preuve Stripe signée", async () => {
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname, fields = new URLSearchParams(String(init?.body));
    if (path === "/v1/customers") return Response.json({ id: customerId });
    if (path === "/v1/tax_rates") return Response.json({ id: "txr_site_fixture" });
    if (path === "/v1/products") return Response.json({ id: "prod_site_fixture" });
    if (path === "/v1/checkout/sessions" && init?.method !== "POST") return Response.json({ data: [], has_more: false });
    if (path === "/v1/checkout/sessions" && fields.get("mode") === "subscription") {
      subscriptionCount++;
      assert.equal(fields.get("line_items[0][price_data][unit_amount]"), "2900");
      assert.equal(fields.get("line_items[0][price_data][recurring][interval]"), "month");
      assert.equal(fields.get("customer"), customerId);
      assert.equal(fields.has("payment_intent_data[setup_future_usage]"), false);
      assert.equal(fields.has("subscription_data[trial_period_days]"), false);
      subscriptionMeta = { siteOrderId: orderId, purpose: "SITE_SUBSCRIPTION", attemptId: fields.get("metadata[attemptId]")!, inviteVersion: fields.get("metadata[inviteVersion]")! };
      assert.equal(fields.get("subscription_data[metadata][attemptId]"), subscriptionMeta.attemptId);
      return Response.json({ id: "cs_subscription_fixture", url: "https://checkout.stripe.com/c/pay/subscription-fixture" });
    }
    if (path === "/v1/checkout/sessions") {
      checkoutCount++;
      assert.equal(fields.get("line_items[0][price_data][unit_amount]"), "35000");
      assert.equal(fields.get("invoice_creation[enabled]"), "true");
      assert.equal(fields.get("payment_intent_data[setup_future_usage]"), "off_session");
      checkoutMeta = { siteOrderId: orderId, attemptId: fields.get("metadata[attemptId]")!, version: fields.get("metadata[version]")! };
      return Response.json({ id: "cs_site_fixture", url: "https://checkout.stripe.com/c/pay/fixture", expires_at: Number(fields.get("expires_at")) });
    }
    if (path === "/v1/payment_intents/pi_site_fixture") return Response.json({ id: "pi_site_fixture", status: intentStatus, customer: customerId, metadata: { siteOrderId: orderId }, amount: 42000, currency: "eur", payment_method: "pm_site_fixture" });
    if (path === "/v1/subscriptions" && init?.method === "POST") throw new Error("Admin must never create or charge a subscription directly");
    if (path === "/v1/subscriptions") return Response.json({ data: [], has_more: false });
    if (path === "/v1/subscriptions/" + subId) return Response.json(subscription());
    if (path === "/v1/invoices/" + invoiceId) return Response.json(invoice());
    if (path === "/v1/billing_portal/configurations") { assert.equal(fields.get("features[subscription_cancel][mode]"), "at_period_end"); return Response.json({ id: "bpc_fixture" }); }
    if (path === "/v1/billing_portal/sessions") { assert.equal(fields.get("customer"), customerId); return Response.json({ url: "https://billing.stripe.com/p/session/fixture" }); }
    throw new Error("Unexpected fixture endpoint: " + path);
  };
  const input = { agreement: true, name: "Client Fictif", version: 1 };
  const urls = await Promise.all([checkoutSite(orderId, input), checkoutSite(orderId, input)]);
  assert.equal(urls[0], urls[1]);
  // Stripe owns request idempotency; the durable attempt must be shared.
  assert.ok(checkoutCount >= 1); assert.equal(await checkoutSite(orderId, input), urls[0]);
  assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).creationPaidAt, null);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/CREATION_ACCEPTED" } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/CREATION_PAID" } }), 0, "An agreement must never announce a payment");
  intentStatus = "requires_payment_method";
  const failedEventId = "evt_" + randomUUID();
  const failedIntent = { id: "pi_site_fixture", metadata: { siteOrderId: orderId } };
  assert.equal((await stripeEvent("payment_intent.payment_failed", failedIntent, failedEventId)).status, 200);
  assert.equal((await stripeEvent("payment_intent.payment_failed", failedIntent, failedEventId)).status, 200);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/PAYMENT_FAILED/pi_site_fixture/" + failedEventId } }), 1);
  intentStatus = "succeeded";
  const session = { id: "cs_site_fixture", payment_status: "paid", amount_total: 42000, currency: "eur", customer: customerId, payment_intent: "pi_site_fixture", metadata: checkoutMeta };
  assert.equal((await stripeEvent("checkout.session.completed", { ...session, amount_total: 1 })).status, 503);
  const eventId = "evt_" + randomUUID(); assert.equal((await stripeEvent("checkout.session.completed", session, eventId)).status, 200); assert.equal((await stripeEvent("checkout.session.completed", session, eventId)).status, 200);
  const paid = await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } }); assert.ok(paid.creationPaidAt); assert.ok(paid.consentText?.includes("420,00")); assert.equal(paid.paymentMethodId, "pm_site_fixture");
  const syncedProject = await db.project.findUniqueOrThrow({ where: { id: projectId }, include: { lead: true } }); assert.equal(syncedProject.stage, "PAID"); assert.equal(syncedProject.lead.status, "PAID");
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-notice/" + orderId + "/CREATION_PAID" } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/CREATION_PAID" } }), 1);
  const owner = unseal((await db.commercialEmail.findFirstOrThrow({ where: { siteOrderId: orderId, kind: "SITE_OWNER_NOTICE", payloadEncrypted: { not: null } } })).payloadEncrypted!) as { to: string[]; subject: string; html: string };
  assert.deepEqual(owner.to, ["contact@zelyweb.com"]); assert.ok(owner.subject.startsWith("[TEST]")); assert.ok(!owner.html.includes(token));
});

test("premier mois refusé bloque la publication ; régularisation, factures, retard de webhook et portail", async () => {
  await assert.rejects(prepareRevisionEmail(new Headers(), orderId, "Vos textes sont-ils corrects ?"), AdminAccessError);
  const revisionMail = unseal((await db.commercialEmail.findFirstOrThrow({ where: { siteOrderId: orderId, kind: "SITE_REVIEW_INVITE" } })).payloadEncrypted!) as { reply_to: string; html: string; text: string };
  assert.ok(revisionMail.reply_to.startsWith("s1-")); assert.ok(revisionMail.text.includes("première"));
  assert.equal(await db.commercialEmail.count({ where: { siteOrderId: orderId, kind: "SITE_REVIEW_INVITE" } }), 1);
  assert.equal(await db.commercialEmail.count({ where: { siteOrderId: orderId, kind: "SITE_DOMAIN_INVITE" } }), 1);
  let project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  await adminService.projectLinks(h(), { id: projectId, expectedUpdatedAt: project.updatedAt.toISOString(), previewUrl: "https://preview.example.com", websiteUrl: "https://site.example.com" });
  await db.project.update({ where: { id: projectId }, data: { stage: "PAID" } });
  await assert.rejects(checkoutSiteSubscription(orderId, { agreement: true, version: 0 }), CommercialError);
  await assert.rejects(prepareSiteSubscription(h(), orderId), CommercialError);
  await adminWorkflow(h(), orderId, { action: "options", options: [{ domain: "site.example.com", initialHtCents: 2500, renewalHtCents: 3000, recommended: true }] });
  const domain = (await workflowData(orderId)).domainOptions[0];
  await clientWorkflow(orderId, { action: "domain", kind: "OPTION", optionId: domain.id, agreement: true });
  const requestId = randomUUID();
  await Promise.all([clientWorkflow(orderId, { action: "feedback", version: 1, requestId, message: "Modifier le texte accueil" }, [checkUpload("photo.pdf", Buffer.from("%PDF-1.7\nfixture"))]), clientWorkflow(orderId, { action: "feedback", version: 1, requestId, message: "Modifier le texte accueil" }, [checkUpload("photo.pdf", Buffer.from("%PDF-1.7\nfixture"))])]);
  let workflow = await workflowData(orderId); assert.equal(workflow.reviewRounds.length, 1); assert.equal(workflow.reviewRounds[0].messages.length, 1);
  await assert.rejects(clientWorkflow(orderId, { action: "approve", name: "Client Fictif", version: 1, agreement: true }), CommercialError);
  await adminWorkflow(h(), orderId, { action: "deliver", roundId: workflow.reviewRounds[0].id, expectedVersion: 1, url: "https://preview.example.com/v2", requestId: randomUUID() });
  const originalPaidAt = (await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).creationPaidAt;
  await db.siteOrder.update({ where: { id: orderId }, data: { creationPaidAt: new Date(Date.now() - 31 * 86400000) } });
  await assert.rejects(clientWorkflow(orderId, { action: "feedback", requestId: randomUUID(), message: "Hors délai" }), CommercialError);
  await db.siteOrder.update({ where: { id: orderId }, data: { creationPaidAt: originalPaidAt } });
  for (let n = 2; n <= 3; n++) {
    await clientWorkflow(orderId, { action: "feedback", version: n, requestId: randomUUID(), message: "Série suivante " + n });
    const open = (await workflowData(orderId)).reviewRounds.find(r => r.status === "OPEN")!;
    await adminWorkflow(h(), orderId, { action: "deliver", roundId: open.id, expectedVersion: n, url: "https://preview.example.com/v" + (n + 1), requestId: randomUUID() });
  }
  await assert.rejects(clientWorkflow(orderId, { action: "feedback", version: 4, requestId: randomUUID(), message: "Quatrième série refusée" }), CommercialError);
  await clientWorkflow(orderId, { action: "approve", name: "Client Fictif", version: 4, agreement: true });
  await adminWorkflow(h(), orderId, { action: "version", url: "https://preview.example.com/v5" });
  await assert.rejects(prepareSiteSubscription(h(), orderId), CommercialError);
  await assert.rejects(clientWorkflow(orderId, { action: "approve", name: "Client Fictif", version: 4, agreement: true }), CommercialError);
  await clientWorkflow(orderId, { action: "approve", name: "Client Fictif", version: 5, agreement: true });
  await clientWorkflow(orderId, { action: "feedback", version: 1, requestId, message: "Modifier le texte accueil" });
  workflow = await workflowData(orderId); assert.equal(workflow.reviewVersion, 5); assert.ok(workflow.finalApprovedAt, "Un ancien retour rejoué ne doit pas annuler un nouvel accord");
  await assert.rejects(db.$transaction(async tx => requireWorkflowReady(tx, await tx.siteOrder.findUniqueOrThrow({ where: { id: orderId } }), true)), CommercialError);
  await assert.rejects(adminWorkflow(h(), orderId, { action: "domain-ready" }), CommercialError);
  const paidDomainQuote = await db.quote.create({ data: { leadId: project.leadId, number: "DOM-" + randomUUID(), title: "Supplément domaine", snapshot: { fixture: true }, documentHash: "f".repeat(64), acceptanceHash: "f".repeat(64), acceptedName: "Client Fictif", acceptedAt: new Date(), status: "PAID", paymentMode: "LOCAL", paidAt: new Date(), items: [], subtotalCents: 500, taxCents: 100, totalCents: 600, billingAddress: "Adresse fictive", deliveryTime: "2 jours", terms: "Fixture", validUntil: new Date(Date.now() + 86400000) } });
  await assert.rejects(adminWorkflow(h(), orderId, { action: "domain-ready", quoteId: paidDomainQuote.id }), CommercialError);
  await db.quote.update({ where: { id: paidDomainQuote.id }, data: { paymentMode: "TEST" } });
  await adminWorkflow(h(), orderId, { action: "domain-ready", quoteId: paidDomainQuote.id, renewalAt: "2027-10-19" });
  assert.equal((workflow.domainSelection!.acceptedSnapshot as { renewalSupplementHtCents: number }).renewalSupplementHtCents, 1000);
  const invite = await prepareSiteSubscription(h(), orderId);
  assert.ok(invite.html.includes("2 jours ouvrés")); assert.ok(invite.html.includes("site.example.com"));
  assert.equal(subscriptionCount, 0, "Preview must not create a Stripe session or charge");
  await assert.rejects(sendSiteSubscription(h(), orderId, invite.version + 1), CommercialError);
  await sendSiteSubscription(h(), orderId, invite.version);
  await assert.rejects(sendSiteSubscription(h(), orderId, invite.version), CommercialError);
  assert.equal(await db.commercialEmail.count({ where: { siteOrderId: orderId, kind: "SITE_SUBSCRIPTION_INVITE" } }), 1);
  const mail = unseal((await db.commercialEmail.findFirstOrThrow({ where: { siteOrderId: orderId, kind: "SITE_SUBSCRIPTION_INVITE" } })).payloadEncrypted!) as { html: string; text: string };
  assert.ok(mail.html.includes("Activer mon abonnement")); assert.ok(mail.text.includes("fin de période payée"));
  assert.equal(subscriptionCount, 0, "Sending must not charge or create a subscription");
  assert.equal((await clientPost(request({ action: "subscribe", agreement: false, version: invite.version }), ctx())).status, 400);
  const subscriptionInput = { agreement: true, version: invite.version };
  const urls = await Promise.all([checkoutSiteSubscription(orderId, subscriptionInput), checkoutSiteSubscription(orderId, subscriptionInput)]);
  assert.equal(urls[0], urls[1]);
  const pending = await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } });
  assert.ok(pending.subscriptionConsentAt); assert.ok(pending.subscriptionConsentText?.includes("premier mois"));
  assert.equal(pending.firstSubscriptionPaidAt, null);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/SUBSCRIPTION_ACCEPTED" } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/SUBSCRIPTION_ACTIVE" } }), 0);
  const started = subscriptionCount; await checkoutSiteSubscription(orderId, subscriptionInput); assert.equal(subscriptionCount, started);
  // Subscription webhooks can precede checkout.session.completed.
  assert.equal((await stripeEvent("customer.subscription.created", subscription())).status, 200);
  const session = { id: "cs_subscription_fixture", subscription: subId, customer: customerId, payment_status: "paid", amount_total: 3480, currency: "eur", metadata: subscriptionMeta };
  assert.equal((await stripeEvent("checkout.session.completed", { ...session, amount_total: 1 })).status, 503);
  assert.equal((await stripeEvent("checkout.session.completed", session)).status, 200);
  await assert.rejects(adminService.changeProjectStage(h(), { id: projectId, expected: "PAID", stage: "PUBLISHING" }), BusinessError);
  assert.equal((await stripeEvent("invoice.payment_failed", invoice())).status, 200);
  const unpaid = await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } }); assert.equal(unpaid.billingAlert, true); assert.equal(unpaid.firstSubscriptionPaidAt, null);
  invoiceStatus = "paid"; subStatus = "active";
  assert.equal((await stripeEvent("invoice.paid", invoice())).status, 200);
  await syncSiteSubscription(orderId, subId);
  const active = await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } }); assert.ok(active.firstSubscriptionPaidAt); assert.equal(active.billingAlert, false);
  await adminService.changeProjectStage(h(), { id: projectId, expected: "PAID", stage: "PUBLISHING" });
  await adminService.changeProjectStage(h(), { id: projectId, expected: "PUBLISHING", stage: "PUBLISHED" });
  assert.equal(await sitePortal(orderId), "https://billing.stripe.com/p/session/fixture");
  assert.equal(await db.billingInvoice.count({ where: { siteOrderId: orderId } }), 1);
  assert.equal((await stripeEvent("invoice.payment_failed", { ...invoice(), status: "open" })).status, 200);
  assert.equal((await db.billingInvoice.findUniqueOrThrow({ where: { id: "in_site_fixture" } })).status, "paid", "Late failure cannot regress a paid invoice");
  invoiceStatus = "open"; subStatus = "past_due";
  assert.equal((await stripeEvent("invoice.payment_failed", invoice())).status, 200);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/SUBSCRIPTION_ACTIVE" } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/PAYMENT_FAILED/in_site_fixture" } }), 1);
  cancelAtEnd = true;
  const cancellationEvent = "evt_" + randomUUID();
  assert.equal((await stripeEvent("customer.subscription.updated", subscription(), cancellationEvent)).status, 200);
  assert.equal((await stripeEvent("customer.subscription.updated", subscription(), cancellationEvent)).status, 200);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/CANCELLATION/" + subId + "/REQUESTED" } }), 1);
  assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).cancelAtPeriodEnd, true);
  project = await db.project.findUniqueOrThrow({ where: { id: projectId } }); assert.equal(project.stage, "PUBLISHED", "No automatic suspension");
  assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).billingAlert, true);
});


test("notifications propriétaire : mensualités confirmées, reprises de webhook et absence de liens clients", async () => {
  invoiceReason = "subscription_cycle"; invoiceId = "in_site_cycle_fixture";
  invoiceStatus = "paid"; subStatus = "active"; cancelAtEnd = false;
  const eventId = "evt_" + randomUUID();
  assert.equal((await stripeEvent("invoice.paid", invoice(), eventId)).status, 200);
  assert.equal((await stripeEvent("invoice.paid", invoice(), eventId)).status, 200);
  assert.equal((await stripeEvent("invoice.paid", invoice())).status, 200);
  assert.equal((await stripeEvent("invoice.finalized", invoice())).status, 200);
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-owner/" + orderId + "/SUBSCRIPTION_PAYMENT/" + invoiceId } }), 1);
  const mails = await db.commercialEmail.findMany({ where: { siteOrderId: orderId, kind: "SITE_OWNER_NOTICE", payloadEncrypted: { not: null } } });
  for (const row of mails) {
    const mail = unseal(row.payloadEncrypted!) as { to: string[]; subject: string; text: string; html: string };
    assert.deepEqual(mail.to, ["contact@zelyweb.com"]);
    assert.ok(mail.subject.startsWith("[TEST]"));
    assert.ok(!mail.text.includes(token)); assert.ok(!mail.html.includes("#token="));
    assert.ok(mail.text.includes("/projets/"));
  }
  const monthly = mails.map(m => unseal(m.payloadEncrypted!) as { subject: string; text: string }).filter(m => m.subject.includes("Facture d’abonnement réglée"));
  assert.equal(monthly.length, 1); assert.ok(monthly[0].text.includes("34,80"));
});

test("fichiers privés, renvoi manuel sans doublon, remboursements et litiges sans suspension", async () => {
  const file = await db.reviewFile.findFirstOrThrow({ where: { message: { round: { siteOrderId: orderId } } } });
  const fileCtx = { params: Promise.resolve({ id: file.id }) };
  assert.equal((await downloadReview(new NextRequest(`http://localhost:3001/api/review-files/${file.id}`), fileCtx)).status, 401);
  const download = await downloadReview(new NextRequest(`http://localhost:3001/api/review-files/${file.id}`, { headers: { cookie: `${siteCookie(orderId)}=${token}` } }), fileCtx);
  assert.equal(download.status, 200); assert.ok(download.headers.get("content-disposition")?.startsWith("attachment"));
  const mail = await db.commercialEmail.findFirstOrThrow({ where: { siteOrderId: orderId, kind: "SITE_BILLING" } });
  await db.commercialEmail.update({ where: { id: mail.id }, data: { status: "SENT" } });
  const requestId = randomUUID();
  await Promise.all([resendEmail(h(), mail.id, requestId), resendEmail(h(), mail.id, requestId)]);
  assert.equal(await db.commercialEmail.count({ where: { resendOfId: mail.id } }), 1);
  await assert.rejects(resendEmail(new Headers(), mail.id, randomUUID()), AdminAccessError);
  await assert.rejects(resendEmail(h(), mail.id, randomUUID()), CommercialError);
  const previousFetch = globalThis.fetch; let refunded = 12000, disputeStatus = "needs_response";
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path === "/v1/charges/ch_workflow_fixture") return Response.json({ id: "ch_workflow_fixture", livemode: false, customer: customerId, payment_intent: "pi_site_fixture", currency: "eur", amount: 42000, amount_refunded: refunded });
    if (path === "/v1/disputes/dp_workflow_fixture") return Response.json({ id: "dp_workflow_fixture", charge: "ch_workflow_fixture", amount: 42000, status: disputeStatus });
    return previousFetch(url, init);
  };
  try {
    assert.equal((await stripeEvent("charge.refunded", { id: "ch_workflow_fixture" })).status, 200);
    assert.equal((await stripeEvent("charge.refunded", { id: "ch_workflow_fixture" })).status, 200);
    assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).refundedCents, 12000);
    refunded = 42000;
    assert.equal((await stripeEvent("charge.refunded", { id: "ch_workflow_fixture", amount_refunded: 12000 })).status, 200);
    assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).refundedCents, 42000);
    assert.equal(await db.financialEvent.count({ where: { siteOrderId: orderId, kind: "REFUND" } }), 1);
    assert.equal((await stripeEvent("charge.dispute.created", { id: "dp_workflow_fixture" })).status, 200);
    disputeStatus = "won";
    assert.equal((await stripeEvent("charge.dispute.closed", { id: "dp_workflow_fixture", status: "needs_response" })).status, 200);
    assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).disputeStatus, "won");
    assert.equal((await db.project.findUniqueOrThrow({ where: { id: projectId } })).stage, "PUBLISHED");
  } finally { globalThis.fetch = previousFetch; }
});

test("séries verrouillées, livraison atomique, e-mails par version et validation anticipée", async () => {
  const { order } = await workflowFixture();
  const first = { action: "feedback", version: 1, requestId: randomUUID(), message: "Changer le titre" };
  await clientWorkflow(order.id, first);
  await assert.rejects(clientWorkflow(order.id, { ...first, requestId: randomUUID(), message: "Ajout pendant les corrections" }), CommercialError);
  const round = (await workflowData(order.id)).reviewRounds[0];
  const deliver = { action: "deliver", roundId: round.id, expectedVersion: 1, url: "https://preview.example.com/corrected", message: "Le titre est corrigé.", requestId: randomUUID() };
  await Promise.all([adminWorkflow(h(), order.id, deliver), adminWorkflow(h(), order.id, deliver)]);
  const current = await workflowData(order.id); assert.equal(current.reviewVersion, 2); assert.equal(current.reviewRounds[0].status, "CLOSED");
  assert.equal(await db.commercialEmail.count({ where: { siteOrderId: order.id, kind: "SITE_REVIEW_INVITE" } }), 1);
  const mail = unseal((await db.commercialEmail.findFirstOrThrow({ where: { siteOrderId: order.id, kind: "SITE_REVIEW_INVITE" } })).payloadEncrypted!) as { subject: string; reply_to: string; text: string };
  assert.ok(mail.subject.includes("2/3")); assert.ok(mail.reply_to.startsWith("s2-")); assert.ok(mail.text.includes("corrected"));
  await assert.rejects(clientWorkflow(order.id, { action: "feedback", version: 1, requestId: randomUUID(), message: "Ancien formulaire" }), CommercialError);
  await clientWorkflow(order.id, { action: "approve", version: 2, agreement: true, name: "Client Fictif" });
  await assert.rejects(clientWorkflow(order.id, { action: "feedback", version: 2, requestId: randomUUID(), message: "Après accord final" }), CommercialError);
  await clientWorkflow(order.id, { action: "extra-request", requestId: randomUUID(), message: "Une nouvelle page sur devis" });
  assert.equal(await db.siteInboundEmail.count({ where: { siteOrderId: order.id, state: "QUOTE_REQUEST" } }), 1);
  assert.equal((await workflowData(order.id)).inboundEmails.length, 0, "Les courriers internes ne sont jamais exposés au portail client");
});

test("domaine séparé, plafond initial et annuel, renvoi idempotent, réservation et changement de renouvellement", async () => {
  const { order } = await workflowFixture();
  await clientWorkflow(order.id, { action: "feedback", version: 1, requestId: randomUUID(), message: "Corriger le titre" });
  await clientWorkflow(order.id, { action: "domain", kind: "REQUESTED", domain: "domaine-fictif.fr", agreement: true });
  assert.equal((await workflowData(order.id)).reviewRounds.length, 1, "Le domaine reste accessible pendant les corrections");
  const resend = { action: "domain-invite", requestId: randomUUID() };
  await Promise.all([adminWorkflow(h(), order.id, resend), adminWorkflow(h(), order.id, resend)]);
  assert.equal(await db.commercialEmail.count({ where: { siteOrderId: order.id, kind: "SITE_DOMAIN_INVITE" } }), 1);
  await adminWorkflow(h(), order.id, { action: "options", requestId: randomUUID(), options: [{ domain: "domaine-fictif.fr", initialHtCents: 1500, renewalHtCents: 3000, recommended: true }] });
  const option = (await workflowData(order.id)).domainOptions[0];
  await clientWorkflow(order.id, { action: "domain", kind: "OPTION", optionId: option.id, agreement: true });
  const snap = (await workflowData(order.id)).domainSelection!.acceptedSnapshot as { initialSupplementHtCents: number; renewalSupplementHtCents: number };
  assert.equal(snap.initialSupplementHtCents, 0); assert.equal(snap.renewalSupplementHtCents, 1000);
  await adminWorkflow(h(), order.id, { action: "domain-reserved", requestId: randomUUID(), renewalAt: "2027-10-23" });
  assert.equal((await workflowData(order.id)).domainSelection!.status, "RESERVED");
  assert.equal((await workflowData(order.id)).domainReadyAt, null);
  await assert.rejects(clientWorkflow(order.id, { action: "domain", kind: "REQUESTED", domain: "autre.fr", agreement: true }), CommercialError);
  await adminWorkflow(h(), order.id, { action: "domain-ready" });
  await assert.rejects(adminWorkflow(h(), order.id, { action: "domain-renewal", requestId: randomUUID(), renewalHtCents: 3000, renewalAt: "2027-10-23" }), CommercialError);
  const changeId = randomUUID();
  await adminWorkflow(h(), order.id, { action: "domain-renewal", requestId: changeId, renewalHtCents: 4000, renewalAt: "2027-10-23" });
  await clientWorkflow(order.id, { action: "domain-renewal", requestId: changeId, agreement: true, name: "Client Fictif" });
  const updated = (await workflowData(order.id)).domainSelection!;
  assert.ok((updated.renewalProposal as { approvedAt: string }).approvedAt);
  assert.equal((updated.acceptedSnapshot as { renewalSupplementHtCents: number }).renewalSupplementHtCents, 2000);
  assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: order.id } })).stripeSubscriptionId, null);
});

test("réponses e-mail archivées avec pièces jointes, doublons, attentes et identité contrôlés", async () => {
  const { order, lead } = await workflowFixture(); const emailId = randomUUID(), fileId = randomUUID();
  const previous = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("/attachments/") ? Response.json({ id: fileId, download_url: "https://attachments.example.com/file" }) : new Response("%PDF-1.7 fichier fictif");
  try {
    const email = { id: emailId, to: [siteReplyAddress(order, "reviews")], from: lead.email, subject: "Mes retours", text: "Changer la couleur", attachments: [{ id: fileId, filename: "plan.pdf", content_type: "application/pdf" }] };
    await Promise.all([applySiteInbound(email), applySiteInbound(email)]);
    assert.equal((await workflowData(order.id)).reviewRounds.length, 1);
    const row = await db.siteInboundEmail.findUniqueOrThrow({ where: { providerId: emailId } }); assert.equal(row.state, "SUBMITTED");
    const file = await storedInboundAttachment(row.id, fileId); assert.ok(file.bytes.toString().includes("fichier fictif"));
    const adminView = await workflowData(order.id, true); assert.equal(adminView.inboundEmails.length, 1); assert.ok(!JSON.stringify(adminView).includes('"encrypted"'));
    await applySiteInbound({ ...email, id: randomUUID(), text: "Un complément pendant les corrections", attachments: [] });
    assert.equal(await db.siteInboundEmail.count({ where: { siteOrderId: order.id, state: "DEFERRED" } }), 1);
    await applySiteInbound({ ...email, id: randomUUID(), from: "autre@example.com", attachments: [] });
    assert.equal(await db.siteInboundEmail.count({ where: { siteOrderId: order.id, state: "UNVERIFIED_SENDER" } }), 1);
    assert.equal((await workflowData(order.id)).reviewRounds[0].messages.length, 1);
    await applySiteInbound({ ...email, id: randomUUID(), to: [siteReplyAddress(order, "domain")], attachments: [] });
    assert.equal(await db.siteInboundEmail.count({ where: { siteOrderId: order.id, state: "DOMAIN_MESSAGE" } }), 1);
    const ownerMails = await db.commercialEmail.count({ where: { siteOrderId: order.id, kind: "SITE_OWNER_NOTICE" } }); assert.equal(ownerMails, 4);
  } finally { globalThis.fetch = previous; }
});

test("reprise d’activation : aucun abonnement actif relancé et anciens événements neutralisés", async () => {
  const source = await db.project.findUniqueOrThrow({ where: { id: projectId }, include: { lead: true } });
  const copy = { ...source.lead, id: randomUUID(), requestId: randomUUID(), email: "retry-site@example.com" };
  const lead = await db.lead.create({ data: copy });
  const p = await db.project.create({ data: { leadId: lead.id, websiteUrl: "https://retry.example.com" } });
  const o = await db.siteOrder.create({ data: { projectId: p.id, workflowVersion: 0, mode: "TEST", status: "PAID", creationPaidAt: new Date(), previewUrl: "https://preview.example.com", screenshot: "fixture", message: "fixture", tokenHash: "1".repeat(64), tokenEncrypted: "fixture", stripeCustomerId: "cus_retry_fixture", stripeSubscriptionId: "sub_retry_fixture", subscriptionStatus: "incomplete_expired", subscriptionInviteSentAt: new Date(), subscriptionAttempt: randomUUID(), subscriptionConsentAt: new Date() } });
  const previousFetch = globalThis.fetch; let status = "active", calls = 0;
  globalThis.fetch = async (url, init) => {
    if (new URL(String(url)).pathname === "/v1/subscriptions/sub_retry_fixture") { calls++; return Response.json({ id: "sub_retry_fixture", status, customer: "cus_retry_fixture", metadata: { siteOrderId: o.id } }); }
    return previousFetch(url, init);
  };
  try {
    await assert.rejects(adminWorkflow(h(), o.id, { action: "retry-subscription" }), CommercialError);
    status = "incomplete_expired";
    const results = await Promise.allSettled([adminWorkflow(h(), o.id, { action: "retry-subscription" }), adminWorkflow(h(), o.id, { action: "retry-subscription" })]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } })).stripeSubscriptionId, null);
    const before = calls; await syncSiteSubscription(o.id, "sub_retry_fixture"); assert.equal(calls, before);
    assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } })).subscriptionStatus, null);
  } finally { globalThis.fetch = previousFetch; }
});
