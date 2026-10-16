import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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
import { saveSitePresentation, sendSitePresentation, checkoutSite, activateSiteSubscription, sitePortal, syncSiteSubscription } from "../../apps/admin/lib/site-billing";
import { unseal, CommercialError } from "../../apps/admin/lib/commercial-core";
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
let checkoutMeta: Record<string, string> = {};
const invoice = () => ({ id: "in_site_fixture", object: "invoice", customer: customerId, status: invoiceStatus, amount_paid: invoiceStatus === "paid" ? 3480 : 0, amount_due: 3480, total: 3480, currency: "eur", hosted_invoice_url: "https://invoice.stripe.com/i/fixture", invoice_pdf: "https://pay.stripe.com/invoice/fixture/pdf", billing_reason: "subscription_create", metadata: { siteOrderId: orderId }, parent: { subscription_details: { subscription: subId, metadata: { siteOrderId: orderId } } } });
const subscription = () => ({ id: subId, object: "subscription", livemode: false, customer: customerId, status: subStatus, cancel_at_period_end: false, metadata: { siteOrderId: orderId }, latest_invoice: invoice(), items: { data: [{ price: { unit_amount: 2900, currency: "eur" } }] } });
async function stripeEvent(type: string, object: unknown, eventId = "evt_" + randomUUID()) {
  const payload = JSON.stringify({ id: eventId, object: "event", type, livemode: false, data: { object } });
  return webhook(new Request("http://localhost:3001/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": stripeClient().webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! }) }, body: payload }));
}
function request(body?: unknown, privateToken = token) {
  return new NextRequest(`http://localhost:3001/api/client/sites/${orderId}`, { method: body ? "POST" : "GET", headers: { cookie: `${siteCookie(orderId)}=${privateToken}`, origin: "http://localhost:3001", "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
const ctx = () => ({ params: Promise.resolve({ id: orderId }) });
after(async () => { globalThis.fetch = originalFetch; await db.$disconnect(); });

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
  assert.ok(saved.html.includes("420,00")); assert.ok(!saved.html.includes("<script>"));
  const before = await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } }); token = unseal(before.tokenEncrypted) as string;
  assert.equal((await clientGet(request(), ctx())).status, 401, "Draft inaccessible even with the token");
  await sendSitePresentation(h(), orderId, saved.version);
  await assert.rejects(saveSitePresentation(h(), { ...input, expectedVersion: 1 }), CommercialError);
  const email = await db.commercialEmail.findFirstOrThrow({ where: { kind: "SITE_PRESENTATION" }, orderBy: { createdAt: "desc" } });
  const mail = unseal(email.payloadEncrypted!) as { html: string; text: string; attachments: { content_id: string }[] };
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
    if (path === "/v1/checkout/sessions") {
      checkoutCount++;
      assert.equal(fields.get("line_items[0][price_data][unit_amount]"), "35000");
      assert.equal(fields.get("invoice_creation[enabled]"), "true");
      assert.equal(fields.get("payment_intent_data[setup_future_usage]"), "off_session");
      checkoutMeta = { siteOrderId: orderId, attemptId: fields.get("metadata[attemptId]")!, version: fields.get("metadata[version]")! };
      return Response.json({ id: "cs_site_fixture", url: "https://checkout.stripe.com/c/pay/fixture", expires_at: Number(fields.get("expires_at")) });
    }
    if (path === "/v1/payment_intents/pi_site_fixture") return Response.json({ id: "pi_site_fixture", status: "succeeded", payment_method: "pm_site_fixture" });
    if (path === "/v1/subscriptions" && init?.method === "POST") { subscriptionCount++; assert.equal(fields.get("items[0][price_data][unit_amount]"), "2900"); return Response.json(subscription()); }
    if (path === "/v1/subscriptions") return Response.json({ data: [], has_more: false });
    if (path === "/v1/subscriptions/" + subId) return Response.json(subscription());
    if (path === "/v1/invoices/in_site_fixture") return Response.json(invoice());
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
  const session = { id: "cs_site_fixture", payment_status: "paid", amount_total: 42000, currency: "eur", customer: customerId, payment_intent: "pi_site_fixture", metadata: checkoutMeta };
  assert.equal((await stripeEvent("checkout.session.completed", { ...session, amount_total: 1 })).status, 503);
  const eventId = "evt_" + randomUUID(); assert.equal((await stripeEvent("checkout.session.completed", session, eventId)).status, 200); assert.equal((await stripeEvent("checkout.session.completed", session, eventId)).status, 200);
  const paid = await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } }); assert.ok(paid.creationPaidAt); assert.ok(paid.consentText?.includes("420,00")); assert.equal(paid.paymentMethodId, "pm_site_fixture");
  assert.equal(await db.commercialWebhook.count({ where: { key: "site-notice/" + orderId + "/CREATION_PAID" } }), 1);
});

test("premier mois refusé bloque la publication ; régularisation, factures, retard de webhook et portail", async () => {
  let project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  await adminService.projectLinks(h(), { id: projectId, expectedUpdatedAt: project.updatedAt.toISOString(), previewUrl: "https://preview.example.com", websiteUrl: "https://site.example.com" });
  await db.project.update({ where: { id: projectId }, data: { stage: "PAID" } });
  await activateSiteSubscription(h(), orderId); await activateSiteSubscription(h(), orderId); assert.equal(subscriptionCount, 1);
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
  project = await db.project.findUniqueOrThrow({ where: { id: projectId } }); assert.equal(project.stage, "PUBLISHED", "No automatic suspension");
  assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: orderId } })).billingAlert, true);
});
