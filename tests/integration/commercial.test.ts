import { after, test } from "node:test";
import { workspaceDb } from "../../apps/admin/lib/brand-context";
import { brandSellerDefaults } from "@nova/shared/brands";
import { GET as tadapoQuoteGet, POST as tadapoQuotePost } from "../../apps/admin/app/api/client/tadapo/quotes/[id]/route";
import { POST as tadapoAccess } from "../../apps/admin/app/api/client/tadapo/quotes/access/route";
import { POST as tadapoStripeWebhook } from "../../apps/admin/app/api/webhooks/stripe/tadapo/route";
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getDb, PrismaClient } from "@nova/database";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { Client } from "pg";
import { commercialService, buildSnapshot } from "../../apps/admin/lib/commercial";
import { commercialLocal, CommercialError, digest, seal, unseal, snapshotSchema } from "../../apps/admin/lib/commercial-core";
import { quotePdf } from "../../apps/admin/lib/quote-pdf";
import { stripeClient, checkoutQuote } from "../../apps/admin/lib/commercial-payment";
import { processCommercialOutbox, queueQuoteReminder } from "../../apps/admin/lib/commercial-mail";
import { quoteCookie } from "../../apps/admin/lib/quote-access";
import { POST as auth } from "../../apps/admin/app/api/auth/[...all]/route";
import { POST as access } from "../../apps/admin/app/api/client/quotes/access/route";
import { GET as clientGet, POST as clientPost } from "../../apps/admin/app/api/client/quotes/[id]/route";
import { POST as stripeWebhook } from "../../apps/admin/app/api/webhooks/stripe/route";
import { POST as resendWebhook } from "../../apps/admin/app/api/webhooks/resend/route";
import { leadRepository } from "../../apps/website/lib/lead-repository";
import { decryptPayload, encryptPayload } from "../../apps/website/lib/lead-security";
import { processOutbox } from "../../apps/website/lib/outbox";
import { saveSitePresentation, sendSitePresentation, prepareRevisionEmail, sendRevisionEmail, prepareSiteSubscription, sendSiteSubscription } from "../../apps/admin/lib/site-billing";
import { adminWorkflow, clientWorkflow } from "../../apps/admin/lib/project-workflow";
import { leadSchema } from "@nova/validation";
import { adminService } from "../../apps/admin/lib/service";
import { grantCommercialPermissions } from "../../scripts/commercial-permissions";

assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
assert.equal(new URL(process.env.DATABASE_URL!).hostname, "127.0.0.1");
assert.equal(process.env.NODE_ENV, "test");
const db = getDb(), originalFetch = globalThis.fetch;
const originalEnv = { COMMERCIAL_MODE: process.env.COMMERCIAL_MODE, ZELYWEB_STRIPE_SECRET_KEY: process.env.ZELYWEB_STRIPE_SECRET_KEY, ZELYWEB_STRIPE_WEBHOOK_SECRET: process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET, RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET };
let cookie = "", leadId = "", projectId = "", quoteId = "", revisedId = "", privateToken = "";
const h = () => new Headers({ cookie });
const seller = { legalName: "Entreprise Fictive de Contrôle", address: "1 rue Fictive, Ville Test", registrationNumber: "TEST-000", vatNumber: "", taxNote: "Mention de contrôle", terms: "Conditions fictives de contrôle. Paiement intégral après acceptation.", validityDays: 30, reminderDays: 0 };
const draft = () => ({ leadId, title: "Page supplémentaire fictive", billingName: "Atelier Fictif Commercial", billingAddress: "2 rue du Test, Ville Test", billingRegistrationNumber: "", billingVatNumber: "", deliveryTime: "Sous dix jours après paiement", terms: seller.terms, validityDays: 30,
  items: [{ label: "Page supplémentaire", description: "Contenu fictif", quantity: 1, unitPrice: "120,00", taxBasisPoints: 2000 }] });
function req(id: string, body?: unknown, token = privateToken) {
  return new NextRequest(`http://localhost:3001/api/client/quotes/${id}`, { method: body ? "POST" : "GET", headers: { origin: "http://localhost:3001", "content-type": "application/json", cookie: `${quoteCookie(id)}=${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
const context = (id: string) => ({ params: Promise.resolve({ id }) });
async function quoteToken(id: string) {
  const record = await db.quoteAccess.findFirstOrThrow({ where: { quoteId: id }, orderBy: { createdAt: "desc" } });
  const token = unseal(record.tokenEncrypted); assert.equal(typeof token, "string"); return token as string;
}
async function resendEvent(payload: unknown, eventId = "msg_" + randomUUID()) {
  const secret = Buffer.from(process.env.RESEND_WEBHOOK_SECRET!.slice(6), "base64"), timestamp = String(Math.floor(Date.now() / 1000)), body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(`${eventId}.${timestamp}.${body}`).digest("base64");
  return resendWebhook(new Request("http://localhost:3001/api/webhooks/resend", { method: "POST", headers: { "svix-id": eventId, "svix-timestamp": timestamp, "svix-signature": "v1," + signature }, body }));
}
after(async () => { globalThis.fetch = originalFetch; for (const [key, value] of Object.entries(originalEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } await db.$disconnect(); });

test("bootstrap réel, client confirmé, entreprise et projet existant", async () => {
  const password = "Commercial-Test-Password-42!", user = await db.user.create({ data: { email: "commercial-admin@example.com", name: "Admin Commercial Fictif", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const response = await auth(new Request("http://localhost:3001/api/auth/sign-in/email", { method: "POST", headers: { origin: "http://localhost:3001", "content-type": "application/json" }, body: JSON.stringify({ email: user.email, password }) }));
  assert.equal(response.status, 200); cookie = response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");
  const created = await leadRepository.submit(leadSchema.parse({ company: "Atelier Fictif Commercial", sector: "Artisanat", city: "Ville Test", services: "Services de contrôle", style: "propose", fullName: "Camille Contrôle", email: "commercial-client@example.com", contactMethod: "email", consent: true, pricingAcknowledged: true, honeypot: "", requestId: randomUUID() }));
  leadId = created.reference;
  const event = await db.outboxEvent.findFirstOrThrow({ where: { leadId } }), payload = decryptPayload(event.payloadEncrypted!) as { text: string };
  assert.equal(await leadRepository.verify(payload.text.match(/#token=([A-Za-z0-9_-]+)/)![1]), true);
  await commercialService.saveSettings(h(), seller);
  await adminService.changeLeadStatus(h(), { id: leadId, expected: "NEW", status: "QUALIFIED" });
  projectId = await adminService.convert(h(), leadId);
  assert.equal((await commercialService.client(h(), leadId))?.project?.id, projectId);
});
test("messages sortants idempotents et réponse locale rattachée au client", async () => {
  await commercialService.localReply(h(), { leadId, requestId: randomUUID(), content: "Réponse de test fictive" });
  assert.equal((await commercialService.client(h(), leadId))?.conversation?.needsReply, true);
  const input = { leadId, requestId: randomUUID(), subject: "Question complémentaire", content: "Bonjour, voici notre réponse fictive." };
  await commercialService.message(h(), input); await commercialService.message(h(), input);
  assert.equal(await db.clientMessage.count({ where: { id: input.requestId } }), 1);
  const email = await db.commercialEmail.findFirstOrThrow({ where: { messageId: input.requestId } });
  assert.ok(!email.payloadEncrypted!.includes(input.content));
  assert.equal((await commercialService.client(h(), leadId))?.conversation?.needsReply, false);
});
test("devis PDF envoyé avec lien privé, aucune fuite et version figée jusque dans PostgreSQL", async () => {
  quoteId = await commercialService.createQuote(h(), draft());
  const quote = await db.quote.findUniqueOrThrow({ where: { id: quoteId } });
  const pdf = await quotePdf(await buildSnapshot(quote)); assert.equal(pdf.subarray(0, 5).toString(), "%PDF-"); assert.equal((await PDFDocument.load(pdf)).getPageCount(), 1);
  await commercialService.sendQuote(h(), quoteId); privateToken = await quoteToken(quoteId);
  const sent = await db.quote.findUniqueOrThrow({ where: { id: quoteId } });
  assert.equal(sent.status, "SENT"); assert.equal(sent.totalCents, 14400);
  assert.equal(sent.documentHash, digest(JSON.stringify(snapshotSchema.parse(sent.snapshot))));
  const message = await db.commercialEmail.findFirstOrThrow({ where: { quoteId } }), payload = unseal(message.payloadEncrypted!) as { text: string; attachments: { content: string }[] };
  assert.ok(payload.text.includes("#token=")); assert.equal(Buffer.from(payload.attachments[0].content, "base64").subarray(0, 5).toString(), "%PDF-");
  assert.equal((await clientGet(new NextRequest(`http://localhost:3001/api/client/quotes/${quoteId}`), context(quoteId))).status, 401);
  const accessible = await clientGet(req(quoteId), context(quoteId)); assert.equal(accessible.status, 200); assert.ok(!JSON.stringify(await accessible.json()).includes("providerId"));
  await assert.rejects(db.quote.update({ where: { id: quoteId }, data: { title: "Altération interdite" } }));
  await assert.rejects(commercialService.createQuote(h(), { ...draft(), title: "Altération" }, quoteId, sent.updatedAt.toISOString()), CommercialError);
  const exchange = await access(new NextRequest("http://localhost:3001/api/client/quotes/access", { method: "POST", headers: { origin: "http://localhost:3001", "content-type": "application/json" }, body: JSON.stringify({ id: quoteId, token: privateToken }) }));
  assert.equal(exchange.status, 200); assert.ok(exchange.headers.getSetCookie()[0].includes("HttpOnly"));
});
test("révision : ancien lien révoqué, acceptation explicite et paiement local sans toucher au projet initial", async () => {
  revisedId = await commercialService.createQuote(h(), { ...draft(), parentId: quoteId, title: "Version corrigée" });
  await commercialService.sendQuote(h(), revisedId);
  assert.equal((await clientGet(req(quoteId), context(quoteId))).status, 401);
  assert.equal((await db.quote.findUniqueOrThrow({ where: { id: quoteId } })).status, "SUPERSEDED");
  privateToken = await quoteToken(revisedId);
  assert.equal((await clientPost(req(revisedId, { action: "simulate" }), context(revisedId))).status, 400);
  const quote = await db.quote.findUniqueOrThrow({ where: { id: revisedId } });
  assert.equal((await clientPost(req(revisedId, { action: "accept", name: "Camille Contrôle", agreement: true, documentHash: "0".repeat(64) }), context(revisedId))).status, 400);
  const accepted = await Promise.all([clientPost(req(revisedId, { action: "accept", name: "Camille Contrôle", agreement: true, documentHash: quote.documentHash }), context(revisedId)), clientPost(req(revisedId, { action: "accept", name: "Camille Contrôle", agreement: true, documentHash: quote.documentHash }), context(revisedId))]);
  assert.deepEqual(accepted.map((response) => response.status), [200, 200]);
  assert.equal(await db.commercialWebhook.count({ where: { key: `quote-owner/${revisedId}/ACCEPTED` } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: `quote-owner/${revisedId}/PAID` } }), 0);
  assert.equal((await clientPost(req(revisedId, { action: "simulate", amount: 1 }), context(revisedId))).status, 200);
  assert.equal((await clientPost(req(revisedId, { action: "simulate" }), context(revisedId))).status, 200);
  assert.equal(await db.paymentAttempt.count({ where: { quoteId: revisedId } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: `quote-owner/${revisedId}/PAID` } }), 1);
  const paid = await db.quote.findUniqueOrThrow({ where: { id: revisedId } }); assert.equal(paid.paymentMode, "LOCAL"); assert.equal(paid.totalCents, 14400);
  assert.equal((await db.project.findUniqueOrThrow({ where: { id: projectId } })).stage, "ACCEPTED");
  await commercialService.changeQuote(h(), revisedId, "complete"); assert.equal((await db.quote.findUniqueOrThrow({ where: { id: revisedId } })).status, "COMPLETED");
});
test("Stripe : montant serveur, session réutilisée, signature, mode et paiement asynchrone confirmés", async () => {
  const id = await commercialService.createQuote(h(), draft()); await commercialService.sendQuote(h(), id); const token = await quoteToken(id), quote = await db.quote.findUniqueOrThrow({ where: { id } });
  assert.equal((await clientPost(req(id, { action: "accept", name: "Camille Contrôle", agreement: true, documentHash: quote.documentHash }, token), context(id))).status, 200);
  Object.assign(process.env, { ZELYWEB_STRIPE_SECRET_KEY: "sk_test_fake_fixture_only", ZELYWEB_STRIPE_WEBHOOK_SECRET: "whsec_fixture_only" });
  let calls = 0, metadata: Record<string, string> = {}, sessionId = "";
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/tax_rates")) return Response.json({ id: "txr_fixture" });
    assert.ok(String(url).includes("api.stripe.com/v1/checkout/sessions")); calls++;
    const fields = new URLSearchParams(String(init?.body)); assert.equal(fields.get("line_items[0][price_data][unit_amount]"), "12000");
    metadata = { quoteId: id, attemptId: fields.get("metadata[attemptId]")!, documentHash: quote.documentHash! }; sessionId = "cs_test_fixture_" + randomUUID();
    return Response.json({ id: sessionId, object: "checkout.session", url: "https://checkout.stripe.com/c/pay/test-fixture", expires_at: Number(fields.get("expires_at")) });
  };
  const url = await checkoutQuote(id); assert.equal(await checkoutQuote(id), url); assert.equal(calls, 1);
  const session = { id: sessionId, object: "checkout.session", currency: "eur", amount_total: 14400, payment_status: "unpaid", metadata };
  async function event(type: string, object: unknown, eventId = "evt_" + randomUUID()) {
    const body = JSON.stringify({ id: eventId, object: "event", type, livemode: false, data: { object } });
    return stripeWebhook(new Request("http://localhost:3001/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": stripeClient().webhooks.generateTestHeaderString({ payload: body, secret: process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET! }) }, body }));
  }
  assert.equal((await stripeWebhook(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "fake" }, body: "{}" }))).status, 400);
  assert.equal((await event("checkout.session.completed", session)).status, 200); assert.equal((await db.quote.findUniqueOrThrow({ where: { id } })).status, "ACCEPTED");
  assert.equal((await event("checkout.session.async_payment_succeeded", { ...session, amount_total: 1, payment_status: "paid" })).status, 503);
  const eventId = "evt_" + randomUUID(); assert.equal((await event("checkout.session.async_payment_succeeded", { ...session, payment_status: "paid" }, eventId)).status, 200);
  assert.equal((await event("checkout.session.async_payment_succeeded", { ...session, payment_status: "paid" }, eventId)).status, 200);
  assert.equal((await db.quote.findUniqueOrThrow({ where: { id } })).paymentMode, "TEST");
  assert.equal(await db.commercialWebhook.count({ where: { key: "stripe/zelyweb/" + eventId } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: `quote-owner/${id}/PAID` } }), 1);
  const ownerEmails = (await db.commercialEmail.findMany({ where: { kind: "SITE_OWNER_NOTICE" } })).map(row => unseal(row.payloadEncrypted!) as { to: string[]; subject: string; text: string; html: string });
  const paidNotice = ownerEmails.find(mail => mail.subject === "[TEST] Devis complémentaire payé");
  assert.ok(paidNotice); assert.deepEqual(paidNotice.to, ["contact@zelyweb.com"]); assert.ok(paidNotice.text.includes(`/devis/${id}`));
  assert.ok(!paidNotice.html.includes("#token="));
  Object.assign(process.env, { ZELYWEB_STRIPE_SECRET_KEY: "", ZELYWEB_STRIPE_WEBHOOK_SECRET: "" }); globalThis.fetch = originalFetch;
});
test("un retour client sur un devis notifie le propriétaire sans annoncer de paiement", async () => {
  const id = await commercialService.createQuote(h(), draft()); await commercialService.sendQuote(h(), id);
  const token = await quoteToken(id);
  assert.equal((await clientPost(req(id, { action: "decline", reason: "Je souhaite modifier le périmètre <script>interdit</script>." }, token), context(id))).status, 200);
  assert.equal(await db.commercialWebhook.count({ where: { key: `quote-owner/${id}/DECLINED` } }), 1);
  assert.equal(await db.commercialWebhook.count({ where: { key: `quote-owner/${id}/PAID` } }), 0);
  const mails = (await db.commercialEmail.findMany({ where: { kind: "SITE_OWNER_NOTICE" } })).map(row => unseal(row.payloadEncrypted!) as { subject: string; html: string });
  const notice = mails.find(mail => mail.subject.includes("Retour client sur un devis")); assert.ok(notice); assert.ok(!notice.html.includes("<script>"));
});

test("Resend : réponses et pièces jointes rattachées, signature et doublons contrôlés", async () => {
  process.env.RESEND_WEBHOOK_SECRET = "whsec_" + randomBytes(32).toString("base64");
  const conversation = await db.conversation.findUniqueOrThrow({ where: { leadId } }), emailId = randomUUID();
  globalThis.fetch = async (url) => { assert.ok(String(url).endsWith("/emails/receiving/" + emailId)); return Response.json({ id: emailId, to: [`r-${conversation.replyToken}@reponses.nova.test`], from: "commercial-client@example.com", subject: "Re: prestation complémentaire", text: "Bonjour, voici notre réponse fictive.", html: null, message_id: "<fixture@mail.example.com>", attachments: [{ id: randomUUID(), filename: "document-fictif.pdf", content_type: "application/pdf" }] }); };
  const eventId = "msg_" + randomUUID(), payload = { type: "email.received", created_at: new Date().toISOString(), data: { email_id: emailId } };
  assert.equal((await resendEvent(payload, eventId)).status, 200); assert.equal((await resendEvent(payload, eventId)).status, 200);
  assert.equal(await db.clientMessage.count({ where: { providerId: emailId } }), 1);
  assert.equal((await commercialService.client(h(), leadId))?.conversation?.needsReply, true);
  assert.equal((await resendWebhook(new Request("http://localhost/api/webhooks/resend", { method: "POST", headers: { "svix-id": "fake", "svix-signature": "fake", "svix-timestamp": String(Math.floor(Date.now() / 1000)) }, body: JSON.stringify(payload) }))).status, 400);
  globalThis.fetch = originalFetch;
});
test("outbox : reprise après panne, worker concurrent et preuve de livraison arrivée avant l’accusé d’envoi", async () => {
  process.env.COMMERCIAL_MODE = ""; globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  const first = await processCommercialOutbox(30); assert.ok(first.failed > 0);
  await db.commercialEmail.updateMany({ where: { status: "PENDING" }, data: { availableAt: new Date(0) } });
  const sentKeys = new Set<string>();
  globalThis.fetch = async (_url, init) => {
    const key = new Headers(init?.headers).get("idempotency-key")!; assert.ok(!sentKeys.has(key)); sentKeys.add(key);
    const id = randomUUID();
    assert.equal((await resendEvent({ type: "email.delivered", created_at: new Date().toISOString(), data: { email_id: id } })).status, 200);
    return Response.json({ id });
  };
  const results = await Promise.all([processCommercialOutbox(30), processCommercialOutbox(30)]);
  assert.ok(results.reduce((n, result) => n + result.sent, 0) > 0);
  assert.equal(await db.commercialEmail.count({ where: { status: "PROCESSING" } }), 0);
  assert.ok(await db.clientMessage.count({ where: { deliveryStatus: "DELIVERED" } }) > 0);
  process.env.COMMERCIAL_MODE = "local"; globalThis.fetch = originalFetch;
});
test("catalogue, relances sans doublon, paramètres figés et permissions PostgreSQL des runtimes", async () => {
  await commercialService.saveTemplate(h(), { kind: "service", label: "Prestation catalogue fictive", content: "Description fictive", price: "75.50", taxBasisPoints: 2000 });
  await commercialService.saveTemplate(h(), { kind: "message", label: "Message fictif", subject: "Suivi du projet", content: "Bonjour, voici un suivi fictif." });
  assert.ok((await commercialService.templates(h())).services.length > 0);
  const id = await commercialService.createQuote(h(), draft()); await commercialService.sendQuote(h(), id);
  await queueQuoteReminder(id, true); await assert.rejects(queueQuoteReminder(id, true), CommercialError);
  const before = await db.quote.findUniqueOrThrow({ where: { id } }); await commercialService.saveSettings(h(), { ...seller, legalName: "Nouvel émetteur fictif" });
  assert.deepEqual((await db.quote.findUniqueOrThrow({ where: { id } })).snapshot, before.snapshot);
  const operator = new Client({ connectionString: process.env.DATABASE_URL }); await operator.connect();
  try {
    await operator.query('CREATE ROLE commercial_test_admin NOLOGIN'); await operator.query('CREATE ROLE commercial_test_worker NOLOGIN');
    await operator.query('GRANT USAGE ON SCHEMA public TO commercial_test_admin, commercial_test_worker');
    await grantCommercialPermissions(operator, "commercial_test_admin", "commercial_test_worker");
  } finally { await operator.end(); }
  await db.$transaction(async (tx) => { await tx.$executeRawUnsafe('SET LOCAL ROLE commercial_test_worker'); await tx.$executeRaw`UPDATE "Quote" SET "nextReminderAt" = NOW() WHERE "id" = ${id}::uuid`; });
  for (const role of ["commercial_test_admin", "commercial_test_worker"]) {
    await db.$transaction(async tx => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
      const rows = await tx.$queryRawUnsafe<unknown[]>('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"');
      assert.ok(rows.length >= 7);
    });
    await assert.rejects(db.$transaction(async tx => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
      await tx.$executeRawUnsafe('UPDATE "_prisma_migrations" SET finished_at = NULL');
    }));
  }
  await assert.rejects(db.$transaction(async (tx) => { await tx.$executeRawUnsafe('SET LOCAL ROLE commercial_test_worker'); await tx.$queryRawUnsafe('SELECT * FROM auth_user'); }));
  await assert.rejects(db.$transaction(async (tx) => { await tx.$executeRawUnsafe('SET LOCAL ROLE commercial_test_worker'); await tx.$executeRaw`UPDATE "Quote" SET "title" = 'Intrusion' WHERE "id" = ${id}::uuid`; }));
  await db.$transaction(async tx => { await tx.$executeRawUnsafe('SET LOCAL ROLE commercial_test_worker'); await tx.serviceHeartbeat.upsert({ where: { id: "mail-worker" }, create: { id: "mail-worker", lastSuccessAt: new Date() }, update: { lastSeenAt: new Date() } }); });
  await assert.rejects(db.$transaction(async tx => { await tx.$executeRawUnsafe('SET LOCAL ROLE commercial_test_worker'); await tx.reviewFile.findMany(); }));
  assert.equal(commercialLocal(), true);
});
test("les opérations commerciales fonctionnent avec le rôle PostgreSQL restreint de l’administration", async () => {
  const password = randomBytes(24).toString("base64url"), operator = new Client({ connectionString: process.env.DATABASE_URL });
  await operator.connect();
  try {
    await operator.query(`CREATE ROLE commercial_runtime_admin LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
    await operator.query('GRANT USAGE ON SCHEMA public TO commercial_runtime_admin');
    await operator.query('GRANT SELECT ON "Lead", "Project", "AdminUser", auth_user, auth_session TO commercial_runtime_admin');
    await operator.query('GRANT SELECT, INSERT ON "ActivityLog" TO commercial_runtime_admin');
    await grantCommercialPermissions(operator, "commercial_runtime_admin", "commercial_test_worker");
  } finally { await operator.end(); }
  const url = new URL(process.env.DATABASE_URL!); url.username = "commercial_runtime_admin"; url.password = password;
  const runtime = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href, max: 3, connectionTimeoutMillis: 5000 }) });
  const shared = globalThis as unknown as { leadPrisma: PrismaClient }; const previous = shared.leadPrisma; shared.leadPrisma = runtime;
  try {
    await commercialService.saveSettings(h(), seller);
    await commercialService.message(h(), { leadId, requestId: randomUUID(), subject: "Test droits runtime", content: "Message fictif avec droits restreints." });
    const id = await commercialService.createQuote(h(), draft()); await commercialService.sendQuote(h(), id);
    assert.equal((await commercialService.quote(h(), id))?.status, "SENT");
  } finally { shared.leadPrisma = previous; await runtime.$disconnect(); }
});

test("le worker restreint envoie une proposition sans accéder aux données privées de la commande", async () => {
  const password = randomBytes(24).toString("base64url");
  const operator = new Client({ connectionString: process.env.DATABASE_URL });
  await operator.connect();
  await operator.query(`CREATE ROLE commercial_runtime_worker LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
  await operator.query('GRANT USAGE ON SCHEMA public TO commercial_runtime_worker');
  await grantCommercialPermissions(operator, "commercial_test_admin", "commercial_runtime_worker");
  const order = await db.siteOrder.create({ data: { projectId, status: "SENT", mode: "TEST", previewUrl: "https://preview.example.com", screenshot: "fixture", message: "Proposition de contrôle", tokenHash: digest(randomUUID()), tokenEncrypted: seal("private-test-token") } });
  // Keep the test focused on this proposal in the isolated test database.
  await db.commercialEmail.updateMany({ where: { status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "CANCELLED" } });
  const mail = await db.commercialEmail.create({ data: { siteOrderId: order.id, kind: "SITE_PRESENTATION", expiresAt: new Date(Date.now() + 3600000), payloadEncrypted: seal({ from: "Test <sender@example.com>", to: ["recipient@example.com"], subject: "Proposition fictive", text: "Aucun envoi réel." }) } });
  const url = new URL(process.env.DATABASE_URL!); url.username = "commercial_runtime_worker"; url.password = password;
  const runtime = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href, max: 3, connectionTimeoutMillis: 5000 }) });
  const shared = globalThis as unknown as { leadPrisma: PrismaClient };
  const previous = shared.leadPrisma, previousMode = process.env.COMMERCIAL_MODE;
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("idempotency-key"), "nova-commercial/" + mail.id);
    return Response.json({ id: "test-worker-proposal" });
  };
  process.env.COMMERCIAL_MODE = "";
  shared.leadPrisma = runtime;
  try {
    // Reproduce the old permissions: it fails before contacting Resend.
    await operator.query('REVOKE SELECT ("id", "projectId", "creationPaidAt", "firstSubscriptionPaidAt") ON "SiteOrder" FROM commercial_runtime_worker');
    assert.deepEqual(await processCommercialOutbox(1), { sent: 0, failed: 1 });
    assert.equal(calls, 0);
    assert.equal((await db.commercialEmail.findUniqueOrThrow({ where: { id: mail.id } })).lastError, "EMAIL_STATE_CHECK_FAILED");
    await grantCommercialPermissions(operator, "commercial_test_admin", "commercial_runtime_worker");
    await db.commercialEmail.update({ where: { id: mail.id }, data: { availableAt: new Date(0) } });
    assert.deepEqual(await processCommercialOutbox(1), { sent: 1, failed: 0 });
    const delivered = await db.commercialEmail.findUniqueOrThrow({ where: { id: mail.id } });
    assert.equal(delivered.status, "SENT");
    assert.equal(delivered.lastError, null);
    assert.equal(calls, 1);
    // The check grants no access to payment tokens, client contact details or mutations.
    await assert.rejects(runtime.siteOrder.findUniqueOrThrow({ where: { id: order.id } }));
    await assert.rejects(runtime.lead.findUniqueOrThrow({ where: { id: leadId }, select: { email: true } }));
    await assert.rejects(runtime.project.update({ where: { id: projectId }, data: { stage: "CANCELLED" } }));

    // Exercise the remaining commercial mail branches with the same restricted worker.
    globalThis.fetch = async () => Response.json({ id: randomUUID() });
    const payload = { from: "Test <sender@example.com>", to: ["recipient@example.com"], subject: "Contrôle des droits", text: "Message fictif sans envoi réel." };
    const expiresAt = new Date(Date.now() + 3600000);
    const activeQuote = await db.quote.findFirstOrThrow({ where: { status: "SENT" }, orderBy: { createdAt: "desc" } });
    const message = await db.clientMessage.findFirstOrThrow({ where: { direction: "OUTBOUND" } });
    for (const data of [
      { kind: "SITE_REVISION_REQUEST", siteOrderId: order.id },
      { kind: "SITE_SUBSCRIPTION_INVITE", siteOrderId: order.id },
      { kind: "SITE_OWNER_NOTICE", siteOrderId: order.id },
      { kind: "QUOTE", quoteId: activeQuote.id },
      { kind: "REMINDER", quoteId: activeQuote.id },
      { kind: "MESSAGE", messageId: message.id },
    ]) {
      const queued = await db.commercialEmail.create({ data: { ...data, expiresAt, payloadEncrypted: seal(payload) } });
      assert.deepEqual(await processCommercialOutbox(1), { sent: 1, failed: 0 }, data.kind);
      assert.equal((await db.commercialEmail.findUniqueOrThrow({ where: { id: queued.id } })).status, "SENT", data.kind);
    }
    assert.equal((await db.clientMessage.findUniqueOrThrow({ where: { id: message.id } })).deliveryStatus, "SENT");

    // Obsolete proposals are cancelled without calling the provider.
    let unexpectedCalls = 0;
    globalThis.fetch = async () => { unexpectedCalls++; throw new Error("Provider must not be called"); };
    await db.siteOrder.update({ where: { id: order.id }, data: { creationPaidAt: new Date(), firstSubscriptionPaidAt: new Date() } });
    for (const kind of ["SITE_PRESENTATION", "SITE_SUBSCRIPTION_INVITE"]) {
      const obsolete = await db.commercialEmail.create({ data: { siteOrderId: order.id, kind, expiresAt, payloadEncrypted: seal(payload) } });
      assert.deepEqual(await processCommercialOutbox(1), { sent: 0, failed: 0 });
      assert.equal((await db.commercialEmail.findUniqueOrThrow({ where: { id: obsolete.id } })).status, "CANCELLED");
    }
    assert.equal(unexpectedCalls, 0);

    // Public confirmation, receipt and internal notification use another outbox.
    await operator.query('GRANT SELECT, UPDATE ON "OutboxEvent" TO commercial_runtime_worker');
    await db.outboxEvent.updateMany({ where: { status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "CANCELLED" } });
    globalThis.fetch = async () => Response.json({ id: randomUUID() });
    for (const kind of ["VERIFY_EMAIL", "RECEIPT", "INTERNAL_NOTIFICATION"] as const) {
      const queued = await db.outboxEvent.create({ data: { leadId, kind, expiresAt, payloadEncrypted: encryptPayload(payload) } });
      assert.deepEqual(await processOutbox(1), { sent: 1, failed: 0 }, kind);
      const sent = await db.outboxEvent.findUniqueOrThrow({ where: { id: queued.id } });
      assert.equal(sent.status, "SENT");
      assert.equal(sent.payloadEncrypted, null);
    }
  } finally {
    shared.leadPrisma = previous;
    process.env.COMMERCIAL_MODE = previousMode;
    globalThis.fetch = originalFetch;
    await runtime.$disconnect();
    await operator.end();
  }
});

test("présentation, ajustements, domaines et invitation fonctionnent avec le compte admin restreint", async () => {
  const source = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  const lead = await db.lead.create({ data: { ...source, id: randomUUID(), requestId: randomUUID(), status: "QUALIFIED" } });
  const password = randomBytes(24).toString("base64url"), operator = new Client({ connectionString: process.env.DATABASE_URL });
  await operator.connect();
  await operator.query(`CREATE ROLE billing_runtime_admin LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
  await operator.query('GRANT USAGE ON SCHEMA public TO billing_runtime_admin');
  await operator.query('GRANT SELECT ON "Lead", "LeadFile", "AdminUser", auth_user, auth_session TO billing_runtime_admin');
  await operator.query('GRANT UPDATE ("status", "updatedAt", "deletedAt") ON "Lead" TO billing_runtime_admin');
  await operator.query('GRANT SELECT, INSERT, UPDATE ON "Project" TO billing_runtime_admin');
  await operator.query('GRANT SELECT, INSERT ON "ActivityLog", "InternalNote" TO billing_runtime_admin');
  await grantCommercialPermissions(operator, "billing_runtime_admin", "commercial_test_worker");
  await operator.end();
  const url = new URL(process.env.DATABASE_URL!); url.username = "billing_runtime_admin"; url.password = password;
  const runtime = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href, max: 3, connectionTimeoutMillis: 5000 }) });
  const shared = globalThis as unknown as { leadPrisma: PrismaClient }, previous = shared.leadPrisma;
  const previousStripeKey = process.env.ZELYWEB_STRIPE_SECRET_KEY;
  process.env.ZELYWEB_STRIPE_SECRET_KEY = "sk_test_billing_permissions_fixture";
  shared.leadPrisma = runtime;
  try {
    const id = await adminService.convert(h(), lead.id);
    await adminService.note(h(), { id, kind: "project", content: "Note interne de contrôle des droits." });
    const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#2454ff" } }).jpeg().toBuffer();
    const saved = await saveSitePresentation(h(), { projectId: id, expectedVersion: 0, previewUrl: "https://preview.example.com", message: "Votre proposition fictive est prête.", creationPrice: "299,00", screenshot: "data:image/jpeg;base64," + image.toString("base64") });
    await sendSitePresentation(h(), saved.id, saved.version);
    // Simulate a payment already verified by Stripe; the real webhook has its own tests.
    await db.siteOrder.update({ where: { id: saved.id }, data: { status: "PAID", creationPaidAt: new Date(), stripeCustomerId: "cus_permissions_fixture" } });
    const revisions = await prepareRevisionEmail(h(), saved.id, "Merci de regrouper vos ajustements dans votre espace privé.");
    await sendRevisionEmail(h(), saved.id, revisions.version);
    await adminWorkflow(h(), saved.id, { action: "options", options: [{ domain: "atelier-test.example.com", initialHtCents: 1500, renewalHtCents: 1500, recommended: true }] });
    const option = await db.domainOption.findFirstOrThrow({ where: { siteOrderId: saved.id } });
    await clientWorkflow(saved.id, { action: "domain", kind: "OPTION", optionId: option.id, agreement: true });
    await clientWorkflow(saved.id, { action: "feedback", version: 1, requestId: randomUUID(), message: "Remplacer le titre de présentation." });
    const round = await db.reviewRound.findFirstOrThrow({ where: { siteOrderId: saved.id } });
    await adminWorkflow(h(), saved.id, { action: "deliver", roundId: round.id, expectedVersion: 1, url: "https://preview.example.com/v2", requestId: randomUUID() });
    await clientWorkflow(saved.id, { action: "approve", version: 2, name: "Client Fictif", agreement: true });
    await adminWorkflow(h(), saved.id, { action: "domain-ready" });
    const project = await runtime.project.findUniqueOrThrow({ where: { id } });
    await adminService.projectLinks(h(), { id, expectedUpdatedAt: project.updatedAt.toISOString(), previewUrl: project.previewUrl, websiteUrl: "https://atelier-test.example.com" });
    const invitation = await prepareSiteSubscription(h(), saved.id);
    await sendSiteSubscription(h(), saved.id, invitation.version);
    assert.ok((await db.siteOrder.findUniqueOrThrow({ where: { id: saved.id } })).subscriptionInviteSentAt);
    assert.equal(await db.commercialEmail.count({ where: { siteOrderId: saved.id, kind: { in: ["SITE_PRESENTATION", "SITE_REVISION_REQUEST", "SITE_SUBSCRIPTION_INVITE"] } } }), 3);
    assert.ok(await runtime.serviceHeartbeat.count() >= 0);
    assert.equal((await runtime.activityLog.count({ where: { projectId: id } })) > 0, true);
    await assert.rejects(runtime.lead.update({ where: { id: lead.id }, data: { email: "forbidden@example.com" } }));
    await assert.rejects(runtime.activityLog.deleteMany({ where: { projectId: id } }));
  } finally {
    shared.leadPrisma = previous;
    if (previousStripeKey === undefined) delete process.env.ZELYWEB_STRIPE_SECRET_KEY;
    else process.env.ZELYWEB_STRIPE_SECRET_KEY = previousStripeKey;
    await runtime.$disconnect();
  }
});

test("le compte web restreint enregistre et confirme une demande sans accès aux tables privées", async () => {
  const password = randomBytes(24).toString("base64url"), operator = new Client({ connectionString: process.env.DATABASE_URL });
  await operator.connect();
  try {
    await operator.query(`CREATE ROLE public_runtime_web LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
    await operator.query('GRANT USAGE ON SCHEMA public TO public_runtime_web');
    await operator.query('GRANT SELECT, INSERT ON "Lead" TO public_runtime_web');
    await operator.query('GRANT UPDATE ("status", "emailVerifiedAt", "updatedAt") ON "Lead" TO public_runtime_web');
    await operator.query('GRANT SELECT, INSERT, UPDATE ON "EmailVerificationToken", "OutboxEvent" TO public_runtime_web');
  } finally { await operator.end(); }
  const url = new URL(process.env.DATABASE_URL!); url.username = "public_runtime_web"; url.password = password;
  const runtime = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href, max: 3, connectionTimeoutMillis: 5000 }) });
  const shared = globalThis as unknown as { leadPrisma: PrismaClient }, previous = shared.leadPrisma;
  shared.leadPrisma = runtime;
  try {
    const submitted = await leadRepository.submit(leadSchema.parse({ company: "Test droits site", sector: "Artisanat", city: "Ville Test", services: "Prestations fictives", style: "propose", fullName: "Client Test", email: "permissions-web@example.com", contactMethod: "email", consent: true, pricingAcknowledged: true, honeypot: "", requestId: randomUUID() }));
    const event = await db.outboxEvent.findFirstOrThrow({ where: { leadId: submitted.reference, kind: "VERIFY_EMAIL" } });
    const payload = decryptPayload(event.payloadEncrypted!) as { text: string };
    await leadRepository.verify(payload.text.match(/#token=([A-Za-z0-9_-]+)/)![1]);
    assert.equal((await db.lead.findUniqueOrThrow({ where: { id: submitted.reference } })).status, "NEW");
    assert.equal(await db.outboxEvent.count({ where: { leadId: submitted.reference, kind: { in: ["RECEIPT", "INTERNAL_NOTIFICATION"] } } }), 2);
    await assert.rejects(runtime.siteOrder.findMany());
    await assert.rejects(runtime.user.findMany());
    await assert.rejects(runtime.lead.update({ where: { id: submitted.reference }, data: { deletedAt: new Date() } }));
  } finally { shared.leadPrisma = previous; await runtime.$disconnect(); }
});


test("deux espaces : meme email, dossiers et modeles independants, devis Tadapo et paiement sur son seul compte", async () => {
  const envKeys = ["NEXT_PUBLIC_TADAPO_SITE_URL", "TADAPO_STRIPE_SECRET_KEY", "TADAPO_STRIPE_WEBHOOK_SECRET", "TADAPO_FROM_EMAIL", "TADAPO_CONTACT_EMAIL", "TADAPO_REPLY_DOMAIN", "ZELYWEB_STRIPE_SECRET_KEY"];
  const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const fetchBefore = globalThis.fetch;
  try {
    Object.assign(process.env, { NEXT_PUBLIC_TADAPO_SITE_URL: "http://localhost:3002", TADAPO_FROM_EMAIL: "Tadapo <contact@tadapo.test>", TADAPO_CONTACT_EMAIL: "contact@tadapo.test", TADAPO_REPLY_DOMAIN: "reponses.tadapo.test" });
    const source = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
    const { id: oldId, ...copy } = source;
    assert.equal(oldId, leadId);
    const other = await db.lead.create({ data: { ...copy, brand: "tadapo", requestId: randomUUID(), emailVerifiedAt: new Date() } });
    const ht = new Headers({ cookie: cookie + "; admin-brand=tadapo" });
    await workspaceDb(ht).financialEvent.findMany();
    await workspaceDb(ht).billingInvoice.findMany();
    assert.equal(other.email, source.email);
    assert.equal(await commercialService.client(h(), other.id), null);
    assert.equal(await commercialService.client(ht, source.id), null);
    assert.equal((await commercialService.client(ht, other.id))?.id, other.id);
    assert.ok((await commercialService.clients(ht)).rows.every(row => row.brand === "tadapo"));
    assert.ok((await commercialService.clients(h())).rows.every(row => row.brand === "zelyweb"));
    await commercialService.saveSettings(ht, brandSellerDefaults("tadapo"));
    assert.ok((await commercialService.settings(ht)).terms.includes("Tadapo"));
    assert.ok(!(await commercialService.settings(ht)).terms.includes("Zelyweb"));
    const template = await commercialService.saveTemplate(ht, { kind: "message", label: "Modele propre", subject: "Bonjour", content: "Votre projet avance" });
    assert.ok(!(await commercialService.templates(h())).messages.some(row => row.id === template.id));
    assert.ok((await commercialService.templates(ht)).messages.some(row => row.id === template.id));
    await assert.rejects(commercialService.message(h(), { leadId: other.id, requestId: randomUUID(), subject: "Bonjour", content: "Envoi depuis le mauvais espace" }));
    const id = await commercialService.createQuote(ht, { ...draft(), leadId: other.id, terms: brandSellerDefaults("tadapo").terms });
    await commercialService.sendQuote(ht, id);
    const quote = await db.quote.findUniqueOrThrow({ where: { id } });
    const snapshot = snapshotSchema.parse(quote.snapshot);
    assert.equal(snapshot.brand, "tadapo"); assert.ok(!JSON.stringify(snapshot).toLowerCase().includes("zelyweb"));
    assert.equal(await commercialService.quote(h(), id), null);
    const token = await quoteToken(id);
    const email = await db.commercialEmail.findFirstOrThrow({ where: { quoteId: id, kind: "QUOTE" } });
    const mail = unseal(email.payloadEncrypted!) as { from: string; reply_to: string; text: string };
    assert.ok(mail.from.includes("Tadapo")); assert.ok(mail.reply_to.endsWith("@reponses.tadapo.test"));
    assert.ok(mail.text.includes("http://localhost:3002/client/devis/")); assert.ok(!mail.text.toLowerCase().includes("zelyweb"));
    const request = (brand: "zelyweb" | "tadapo", body?: unknown) => new NextRequest(`http://localhost:${brand === "tadapo" ? 3002 : 3001}/api/client/quotes/${id}`, {
      method: body ? "POST" : "GET", headers: { origin: `http://localhost:${brand === "tadapo" ? 3002 : 3001}`, "content-type": "application/json", cookie: `${quoteCookie(id, brand)}=${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal((await clientGet(request("zelyweb"), context(id))).status, 401);
    assert.equal((await tadapoQuoteGet(request("tadapo"), context(id))).status, 200);
    assert.equal((await access(new NextRequest("http://localhost:3001/api/client/quotes/access", { method: "POST", headers: { origin: "http://localhost:3001", "content-type": "application/json" }, body: JSON.stringify({ id, token }) }))).status, 401);
    assert.equal((await tadapoAccess(new NextRequest("http://localhost:3002/api/client/tadapo/quotes/access", { method: "POST", headers: { origin: "http://localhost:3002", "content-type": "application/json" }, body: JSON.stringify({ id, token }) }))).status, 200);
    const zelyQuote = await commercialService.createQuote(h(), draft()); await commercialService.sendQuote(h(), zelyQuote);
    const zelyToken = await quoteToken(zelyQuote);
    const cross = new NextRequest("http://localhost:3002/api/client/tadapo/quotes/" + zelyQuote, { headers: { cookie: `${quoteCookie(zelyQuote, "tadapo")}=${zelyToken}` } });
    assert.equal((await tadapoQuoteGet(cross, context(zelyQuote))).status, 401);
    assert.equal((await tadapoQuotePost(request("tadapo", { action: "accept", name: "Camille Test", agreement: true, documentHash: quote.documentHash }), context(id))).status, 200);
    Object.assign(process.env, { TADAPO_STRIPE_SECRET_KEY: "sk_test_tadapo_separation", TADAPO_STRIPE_WEBHOOK_SECRET: "whsec_tadapo_separation", ZELYWEB_STRIPE_SECRET_KEY: "sk_test_zelyweb_separation" });
    let fields = new URLSearchParams();
    globalThis.fetch = async (url, init) => {
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer sk_test_tadapo_separation");
      if (String(url).includes("tax_rates")) return Response.json({ id: "txr_brand" });
      fields = new URLSearchParams(String(init?.body));
      return Response.json({ id: "cs_separate", url: "https://checkout.stripe.com/separate", expires_at: Math.floor(Date.now() / 1000) + 1800 });
    };
    assert.equal(await checkoutQuote(id), "https://checkout.stripe.com/separate");
    assert.equal(fields.get("success_url"), `http://localhost:3002/client/devis/${id}?retour=paiement`);
    assert.equal(fields.get("metadata[brand]"), "tadapo");
    const event = { id: "evt_separate_brands", type: "checkout.session.completed", livemode: false, data: { object: { id: "cs_separate", metadata: { attemptId: fields.get("metadata[attemptId]"), quoteId: id, documentHash: quote.documentHash }, amount_total: quote.totalCents, currency: "eur", payment_status: "paid" } } };
    const payload = JSON.stringify(event), signature = stripeClient("tadapo").webhooks.generateTestHeaderString({ payload, secret: process.env.TADAPO_STRIPE_WEBHOOK_SECRET! });
    assert.equal((await tadapoStripeWebhook(new Request("http://localhost:3001/api/webhooks/stripe/tadapo", { method: "POST", body: payload, headers: { "stripe-signature": signature } }))).status, 200);
    assert.equal((await db.quote.findUniqueOrThrow({ where: { id } })).status, "PAID");
  } finally {
    globalThis.fetch = fetchBefore;
    for (const key of envKeys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
