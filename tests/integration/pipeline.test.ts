import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getDb } from "../../apps/website/lib/db";
import { leadSchema } from "../../apps/website/lib/lead-schema";
import { leadRepository, IdempotencyConflict } from "../../apps/website/lib/lead-repository";
import { decryptPayload, tokenHash } from "../../apps/website/lib/lead-security";
import { processOutbox } from "../../apps/website/lib/outbox";
import { POST } from "../../apps/website/app/api/leads/route";
import { POST as verify } from "../../apps/website/app/api/leads/verify/route";
import { POST as resend } from "../../apps/website/app/api/leads/resend/route";

const db = getDb();
const originalFetch = globalThis.fetch;
after(async () => { globalThis.fetch = originalFetch; await db.$disconnect(); });
function input() {
  return leadSchema.parse({ company: "Atelier Fictif", sector: "Artisanat", city: "Ville Test",
    services: "Prestations fictives", style: "propose", fullName: "Personne Test",
    email: "prospect@example.com", contactMethod: "email", consent: true,
    pricingAcknowledged: true, honeypot: "", requestId: randomUUID() });
}
function request(path: string, body: unknown) {
  return new NextRequest("http://localhost:3000" + path, { method: "POST", headers: {
    origin: "http://localhost:3000", "content-type": "application/json", "x-forwarded-for": randomUUID(),
  }, body: JSON.stringify(body) });
}
async function reset() { await db.lead.deleteMany(); }
async function tokenFor(id: string) {
  const event = await db.outboxEvent.findFirstOrThrow({ where: { leadId: id, kind: "VERIFY_EMAIL", status: "PENDING" }, orderBy: { createdAt: "desc" } });
  const payload = decryptPayload(event.payloadEncrypted!) as { text: string };
  const link = payload.text.match(/http:\/\/localhost:3000\/confirmer-demande#token=([A-Za-z0-9_-]+)/);
  assert.ok(link);
  return link[1];
}

test("soumission réelle : transaction, données facultatives et statut imposé", async () => {
  await reset();
  globalThis.fetch = async () => Response.json({ success: true });
  const withoutToken = await POST(request("/api/leads", input()));
  assert.equal(withoutToken.status, 400);
  assert.equal(await db.lead.count(), 0);
  const response = await POST(request("/api/leads", { ...input(), turnstileToken: "test-token" }));
  assert.equal(response.status, 202);
  const result = await response.json();
  assert.equal(result.emailDelivery, "queued");
  const lead = await db.lead.findUniqueOrThrow({ where: { id: result.reference } });
  assert.equal(lead.status, "PENDING_VERIFICATION");
  assert.equal(lead.firstName, null);
  assert.equal(lead.lastName, null);
  assert.equal(lead.phone, null);
  assert.equal(lead.projectDescription, null);
  assert.ok(lead.pricingAcknowledgedAt);
  assert.equal(await db.outboxEvent.count(), 1);
  const token = await tokenFor(lead.id);
  const record = await db.emailVerificationToken.findFirstOrThrow();
  assert.equal(record.tokenHash, tokenHash(token));
  const event = await db.outboxEvent.findFirstOrThrow();
  assert.ok(!event.payloadEncrypted!.includes(token));
  assert.equal((await POST(request("/api/leads", { ...input(), status: "PAID" }))).status, 400);
});
test("doubles soumissions concurrentes et plusieurs demandes légitimes par e-mail", async () => {
  await reset();
  const lead = input();
  const results = await Promise.all(Array.from({ length: 5 }, () => leadRepository.submit(lead)));
  assert.equal(new Set(results.map((r) => r.reference)).size, 1);
  assert.equal(await db.lead.count(), 1);
  assert.equal(await db.outboxEvent.count(), 1);
  await assert.rejects(leadRepository.submit({ ...lead, company: "Autre Entreprise" }), IdempotencyConflict);
  await leadRepository.submit(input());
  assert.equal(await db.lead.count(), 2);
});
test("jeton : usage unique atomique, NEW et seulement deux notifications", async () => {
  await reset();
  const { reference } = await leadRepository.submit(input());
  const token = await tokenFor(reference);
  const results = await Promise.all([leadRepository.verify(token), leadRepository.verify(token)]);
  assert.deepEqual(results.sort(), [false, true]);
  const lead = await db.lead.findUniqueOrThrow({ where: { id: reference } });
  assert.equal(lead.status, "NEW");
  assert.ok(lead.emailVerifiedAt);
  assert.equal(await db.outboxEvent.count({ where: { kind: { in: ["RECEIPT", "INTERNAL_NOTIFICATION"] } } }), 2);
  assert.equal((await verify(request("/api/leads/verify", { token }))).status, 400);
});
test("jeton expiré refusé, renvoi borné, anciens jetons révoqués et réponse générique", async () => {
  await reset();
  const { reference } = await leadRepository.submit(input());
  const token = await tokenFor(reference);
  await db.emailVerificationToken.updateMany({ data: { expiresAt: new Date(0), createdAt: new Date(Date.now() - 120000) } });
  assert.equal(await leadRepository.verify(token), false);
  await leadRepository.resend(reference, "prospect@example.com");
  assert.equal(await db.emailVerificationToken.count(), 2);
  assert.equal(await leadRepository.verify(token), false);
  await leadRepository.resend(reference, "prospect@example.com");
  assert.equal(await db.emailVerificationToken.count(), 2);
  for (let i = 0; i < 4; i++) {
    await db.emailVerificationToken.updateMany({ data: { createdAt: new Date(Date.now() - 120000) } });
    await leadRepository.resend(reference, "prospect@example.com");
  }
  assert.equal(await db.emailVerificationToken.count(), 4);
  const exists = await resend(request("/api/leads/resend", { reference, email: "prospect@example.com", turnstileToken: "test-token" }));
  const missing = await resend(request("/api/leads/resend", { reference: randomUUID(), email: "absent@example.com", turnstileToken: "test-token" }));
  assert.equal(exists.status, 202);
  assert.deepEqual(await exists.json(), await missing.json());
  assert.equal(exists.status, missing.status);
});
test("panne e-mail : demande conservée, nouvelle tentative et reprise multi-worker", async () => {
  await reset();
  const { reference } = await leadRepository.submit(input());
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  assert.deepEqual(await processOutbox(), { sent: 0, failed: 1 });
  assert.equal(await db.lead.count(), 1);
  let event = await db.outboxEvent.findFirstOrThrow();
  assert.equal(event.status, "PENDING");
  assert.equal(event.sentAt, null);
  await db.outboxEvent.update({ where: { id: event.id }, data: { availableAt: new Date(0) } });
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ id: "fake-provider-id" })); };
  await Promise.all([processOutbox(), processOutbox()]);
  assert.equal(calls, 1);
  event = await db.outboxEvent.findFirstOrThrow();
  assert.equal(event.status, "SENT");
  assert.equal(event.payloadEncrypted, null);
  assert.equal((await db.lead.findUniqueOrThrow({ where: { id: reference } })).status, "PENDING_VERIFICATION");
});
test("rollback si préparation e-mail échoue : aucun enregistrement partiel", async () => {
  await reset();
  const key = process.env.OUTBOX_ENCRYPTION_KEY;
  process.env.OUTBOX_ENCRYPTION_KEY = "invalid";
  try { await assert.rejects(leadRepository.submit(input())); }
  finally { process.env.OUTBOX_ENCRYPTION_KEY = key; }
  assert.equal(await db.lead.count(), 0);
  assert.equal(await db.emailVerificationToken.count(), 0);
});

test("e-mail non confirmé, bail expiré et fin de fenêtre sans faux succès", async () => {
  await reset();
  await leadRepository.submit(input());
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [] }));
  assert.deepEqual(await processOutbox(), { sent: 0, failed: 1 });
  let event = await db.outboxEvent.findFirstOrThrow();
  assert.equal(event.status, "PENDING");
  await db.outboxEvent.update({ where: { id: event.id }, data: {
    status: "PROCESSING", lockedUntil: new Date(0), lockId: randomUUID(),
  } });
  globalThis.fetch = async () => new Response(JSON.stringify({ id: "fake-resumed-id" }));
  assert.deepEqual(await processOutbox(), { sent: 1, failed: 0 });
  await leadRepository.submit(input());
  event = await db.outboxEvent.findFirstOrThrow({ where: { status: "PENDING" } });
  await db.outboxEvent.update({ where: { id: event.id }, data: { expiresAt: new Date(0) } });
  assert.deepEqual(await processOutbox(), { sent: 0, failed: 0 });
  assert.equal((await db.outboxEvent.findUniqueOrThrow({ where: { id: event.id } })).status, "DEAD");
});
