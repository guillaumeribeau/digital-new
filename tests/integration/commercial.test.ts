import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getDb, PrismaClient } from "@nova/database";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PDFDocument } from "pdf-lib";
import { Client } from "pg";
import { commercialService, buildSnapshot } from "../../apps/admin/lib/commercial";
import { commercialLocal, CommercialError, digest, unseal, snapshotSchema } from "../../apps/admin/lib/commercial-core";
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
import { decryptPayload } from "../../apps/website/lib/lead-security";
import { leadSchema } from "@nova/validation";
import { adminService } from "../../apps/admin/lib/service";
import { grantCommercialPermissions } from "../../scripts/commercial-permissions";

assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
assert.equal(new URL(process.env.DATABASE_URL!).hostname, "127.0.0.1");
assert.equal(process.env.NODE_ENV, "test");
const db = getDb(), originalFetch = globalThis.fetch;
const originalEnv = { COMMERCIAL_MODE: process.env.COMMERCIAL_MODE, STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET, RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET };
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
  assert.equal((await clientPost(req(revisedId, { action: "simulate", amount: 1 }), context(revisedId))).status, 200);
  assert.equal((await clientPost(req(revisedId, { action: "simulate" }), context(revisedId))).status, 200);
  assert.equal(await db.paymentAttempt.count({ where: { quoteId: revisedId } }), 1);
  const paid = await db.quote.findUniqueOrThrow({ where: { id: revisedId } }); assert.equal(paid.paymentMode, "LOCAL"); assert.equal(paid.totalCents, 14400);
  assert.equal((await db.project.findUniqueOrThrow({ where: { id: projectId } })).stage, "ACCEPTED");
  await commercialService.changeQuote(h(), revisedId, "complete"); assert.equal((await db.quote.findUniqueOrThrow({ where: { id: revisedId } })).status, "COMPLETED");
});
test("Stripe : montant serveur, session réutilisée, signature, mode et paiement asynchrone confirmés", async () => {
  const id = await commercialService.createQuote(h(), draft()); await commercialService.sendQuote(h(), id); const token = await quoteToken(id), quote = await db.quote.findUniqueOrThrow({ where: { id } });
  assert.equal((await clientPost(req(id, { action: "accept", name: "Camille Contrôle", agreement: true, documentHash: quote.documentHash }, token), context(id))).status, 200);
  Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_test_fake_fixture_only", STRIPE_WEBHOOK_SECRET: "whsec_fixture_only" });
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
    return stripeWebhook(new Request("http://localhost:3001/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": stripeClient().webhooks.generateTestHeaderString({ payload: body, secret: process.env.STRIPE_WEBHOOK_SECRET! }) }, body }));
  }
  assert.equal((await stripeWebhook(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "fake" }, body: "{}" }))).status, 400);
  assert.equal((await event("checkout.session.completed", session)).status, 200); assert.equal((await db.quote.findUniqueOrThrow({ where: { id } })).status, "ACCEPTED");
  assert.equal((await event("checkout.session.async_payment_succeeded", { ...session, amount_total: 1, payment_status: "paid" })).status, 503);
  const eventId = "evt_" + randomUUID(); assert.equal((await event("checkout.session.async_payment_succeeded", { ...session, payment_status: "paid" }, eventId)).status, 200);
  assert.equal((await event("checkout.session.async_payment_succeeded", { ...session, payment_status: "paid" }, eventId)).status, 200);
  assert.equal((await db.quote.findUniqueOrThrow({ where: { id } })).paymentMode, "TEST");
  assert.equal(await db.commercialWebhook.count({ where: { key: "stripe/" + eventId } }), 1);
  Object.assign(process.env, { STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "" }); globalThis.fetch = originalFetch;
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
