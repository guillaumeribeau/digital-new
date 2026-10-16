import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { POST as authPost } from "../../apps/admin/app/api/auth/[...all]/route";
import { authenticate, AdminAccessError } from "../../apps/admin/lib/access";
import { adminService, BusinessError } from "../../apps/admin/lib/service";
import { leadRepository } from "../../apps/website/lib/lead-repository";
import { leadSchema } from "@nova/validation";
import { decryptPayload } from "../../apps/website/lib/lead-security";
import { limitAuth } from "../../apps/admin/lib/rate-limit";
import { processOutbox } from "../../apps/website/lib/outbox";

const db = getDb();
const password = "Fictitious-Test-Password-42!";
let cookie = "", userId = "", adminId = "";
const authenticated = () => new Headers({ cookie });
function updateCookie(response: Response) {
  const jar = new Map(cookie.split("; ").filter(Boolean).map((item) => [item.slice(0, item.indexOf("=")), item.slice(item.indexOf("=") + 1)]));
  for (const value of response.headers.getSetCookie()) { const pair = value.split(";")[0]; const split = pair.indexOf("="); const name = pair.slice(0, split), content = pair.slice(split + 1); if (content) jar.set(name, content); else jar.delete(name); }
  cookie = Array.from(jar, ([name, value]) => `${name}=${value}`).join("; ");
}
async function call(path: string, body: unknown = {}) {
  const response = await authPost(new Request("http://localhost:3001/api/auth/" + path, { method: "POST",
    headers: { origin: "http://localhost:3001", "content-type": "application/json", cookie }, body: JSON.stringify(body) }));
  updateCookie(response);
  return response;
}
const input = (company = "Atelier Administratif Fictif") => leadSchema.parse({ company, sector: "Artisanat", city: "Ville Test", services: "Prestations fictives", style: "propose", fullName: "Contact Fictif", email: "contact@example.com", contactMethod: "email", consent: true, pricingAcknowledged: true, honeypot: "", requestId: randomUUID() });
after(async () => db.$disconnect());

test("aucune lecture ou mutation anonyme et inscription publique interdite", async () => {
  await assert.rejects(adminService.dashboard(new Headers()), AdminAccessError);
  await assert.rejects(adminService.leads(new Headers(), {}), AdminAccessError);
  await assert.rejects(adminService.note(new Headers(), { id: randomUUID(), kind: "lead", content: "Intrusion" }), AdminAccessError);
  await assert.rejects(adminService.convert(new Headers(), randomUUID()), AdminAccessError);
  await assert.rejects(adminService.setLeadDeleted(new Headers(), {}), AdminAccessError);
  assert.equal((await call("sign-up/email", { email: "intrus@example.com", password })).status, 404);
  assert.equal((await call("update-user", { name: "Intrus" })).status, 404);
});
test("connexion par mot de passe avec acces immediat aux donnees", async () => {
  await db.lead.deleteMany();
  const user = await db.user.create({ data: { email: "admin-test@example.com", name: "Admin Fictif", emailVerified: true } });
  userId = user.id;
  const admin = await db.adminUser.create({ data: { userId } }); adminId = admin.id;
  await db.account.create({ data: { userId, accountId: userId, providerId: "credential", password: await hashPassword(password) } });
  const response = await call("sign-in/email", { email: user.email, password });
  assert.equal(response.status, 200);
  assert.equal((await authenticate(authenticated())).id, adminId);
  await adminService.dashboard(authenticated());
  const session = await db.session.findFirstOrThrow({ where: { userId } });
  assert.equal(session.mfaVerifiedAt, null);
  for (const path of ["two-factor/enable", "two-factor/verify-totp", "two-factor/verify-backup-code"]) {
    assert.equal((await call(path, { password, code: "000000" })).status, 404);
  }
});
test("formulaire → administration : vérification, qualification, notes et conversion concurrente", async () => {
  const { reference } = await leadRepository.submit(input());
  assert.equal((await adminService.leads(authenticated(), {})).total, 1);
  const pending = await adminService.lead(authenticated(), reference);
  assert.equal(pending?.status, "PENDING_VERIFICATION");
  await assert.rejects(adminService.changeLeadStatus(authenticated(), { id: reference, expected: "PENDING_VERIFICATION", status: "QUALIFIED" }), BusinessError);
  const event = await db.outboxEvent.findFirstOrThrow({ where: { leadId: reference } });
  const payload = decryptPayload(event.payloadEncrypted!) as { text: string };
  const token = payload.text.match(/#token=([A-Za-z0-9_-]+)/)![1];
  assert.equal(await leadRepository.verify(token), true);
  await adminService.changeLeadStatus(authenticated(), { id: reference, expected: "NEW", status: "TO_QUALIFY" });
  await adminService.note(authenticated(), { id: reference, kind: "lead", content: "Note interne fictive" });
  await adminService.changeLeadStatus(authenticated(), { id: reference, expected: "TO_QUALIFY", status: "QUALIFIED" });
  const ids = await Promise.all([adminService.convert(authenticated(), reference), adminService.convert(authenticated(), reference)]);
  assert.equal(ids[0], ids[1]);
  assert.equal(await db.project.count(), 1);
  const lead = await adminService.lead(authenticated(), reference);
  assert.equal(lead?.status, "IN_PROGRESS");
  assert.equal(lead?.internalNotes[0].content, "Note interne fictive");
  assert.equal(lead?.activityLogs.length, 4);
  assert.equal(lead?.project?.id, ids[0]);
  await assert.rejects(adminService.changeLeadStatus(authenticated(), { id: reference, expected: "IN_PROGRESS", status: "PAID" }), BusinessError);
});
test("recherche, filtres, pagination et indicateurs PostgreSQL", async () => {
  const data = input("Autre Entreprise Fictive");
  await leadRepository.submit(data);
  const result = await adminService.leads(authenticated(), { q: "administratif", status: "IN_PROGRESS", sort: "asc" });
  assert.equal(result.total, 1);
  assert.equal((await adminService.leads(authenticated(), { status: "PENDING_VERIFICATION" })).total, 1);
  assert.equal((await adminService.leads(authenticated(), { page: 2 })).rows.length, 0);
  assert.equal((await adminService.projects(authenticated(), { q: "administratif", status: "ACCEPTED" })).total, 1);
  const dashboard = await adminService.dashboard(authenticated());
  assert.equal(dashboard.total, 2); assert.equal(dashboard.inCreation, 1); assert.equal(dashboard.completed, 0);
});
test("suivi de production, liens HTTPS, conflits et historique transactionnel", async () => {
  let project = await db.project.findFirstOrThrow();
  await assert.rejects(adminService.changeProjectStage(authenticated(), { id: project.id, expected: "ACCEPTED", stage: "PAID" }), BusinessError);
  await assert.rejects(adminService.projectLinks(authenticated(), { id: project.id, expectedUpdatedAt: project.updatedAt.toISOString(), previewUrl: "javascript:alert(1)", websiteUrl: "" }));
  await adminService.projectLinks(authenticated(), { id: project.id, expectedUpdatedAt: project.updatedAt.toISOString(), previewUrl: "https://preview.example.com", websiteUrl: "https://site.example.com" });
  await assert.rejects(adminService.projectLinks(authenticated(), { id: project.id, expectedUpdatedAt: project.updatedAt.toISOString(), previewUrl: "https://other.example.com", websiteUrl: "" }), BusinessError);
  await adminService.note(authenticated(), { id: project.id, kind: "project", content: "Projet fictif à suivre" });
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_admin_fixture";
  // Production-flow fixture: publication requires confirmed creation and first monthly payment.
  await db.siteOrder.create({ data: { projectId: project.id, previewUrl: "https://preview.example.com", screenshot: "fixture", message: "Fixture", mode: "TEST", tokenHash: randomUUID().replaceAll("-", "").padEnd(64, "0"), tokenEncrypted: "fixture", creationPaidAt: new Date(), firstSubscriptionPaidAt: new Date(), subscriptionStatus: "active" } });
  for (const stage of ["CONTENT_PREPARATION", "CREATION", "REVIEW", "PREVIEW_READY", "PREVIEW_SENT", "AWAITING_APPROVAL", "APPROVED", "AWAITING_PAYMENT", "PAID", "PUBLISHING", "PUBLISHED"]) {
    project = await db.project.findUniqueOrThrow({ where: { id: project.id } });
    await adminService.changeProjectStage(authenticated(), { id: project.id, expected: project.stage, stage });
  }
  const detail = await adminService.project(authenticated(), project.id);
  assert.equal(detail?.stage, "PUBLISHED"); assert.equal(detail?.notes.length, 1);
  assert.equal((await db.lead.findUniqueOrThrow({ where: { id: project.leadId } })).status, "PUBLISHED");
  assert.equal((await adminService.dashboard(authenticated())).completed, 1);
  assert.equal(await db.activityLog.count({ where: { projectId: project.id, action: "PROJECT_STAGE_CHANGED" } }), 11);
  process.env.STRIPE_SECRET_KEY = previousStripeKey || "";
});
test("corbeille : retrait des listes, arrêt de la validation et des envois, restauration avec historique", async () => {
  const before = await adminService.dashboard(authenticated());
  const { reference } = await leadRepository.submit(input("Demande à restaurer"));
  const lead = await db.lead.findUniqueOrThrow({ where: { id: reference } });
  const event = await db.outboxEvent.findFirstOrThrow({ where: { leadId: reference, kind: "VERIFY_EMAIL" } });
  const payload = decryptPayload(event.payloadEncrypted!) as { text: string };
  const token = payload.text.match(/#token=([A-Za-z0-9_-]+)/)![1];
  const mutation = { id: reference, expectedUpdatedAt: lead.updatedAt.toISOString(), deleted: true, confirmed: true };
  await assert.rejects(adminService.setLeadDeleted(authenticated(), { ...mutation, confirmed: false }));
  await adminService.setLeadDeleted(authenticated(), mutation);
  assert.equal((await adminService.leads(authenticated(), { q: "Demande à restaurer" })).total, 0);
  assert.equal((await adminService.leads(authenticated(), { q: "Demande à restaurer", view: "trash" })).total, 1);
  assert.equal((await adminService.dashboard(authenticated())).total, before.total);
  assert.equal(await leadRepository.verify(token), false);
  await db.emailVerificationToken.updateMany({ where: { leadId: reference }, data: { createdAt: new Date(Date.now() - 120000) } });
  await leadRepository.resend(reference, lead.email);
  assert.equal(await db.emailVerificationToken.count({ where: { leadId: reference } }), 1);
  await assert.rejects(adminService.note(authenticated(), { id: reference, kind: "lead", content: "Note sur demande supprimée" }), BusinessError);
  const originalFetch = globalThis.fetch;
  const sent: string[] = [];
  globalThis.fetch = async (_url, options) => {
    sent.push(String(options?.body));
    return new Response(JSON.stringify({ id: randomUUID() }), { status: 200 });
  };
  try { await processOutbox(100); } finally { globalThis.fetch = originalFetch; }
  assert.ok(sent.every((body) => !body.includes(reference)));
  assert.equal((await db.outboxEvent.findUniqueOrThrow({ where: { id: event.id } })).attempts, 0);
  await assert.rejects(adminService.setLeadDeleted(authenticated(), mutation), BusinessError);
  const deleted = await db.lead.findUniqueOrThrow({ where: { id: reference } });
  await adminService.setLeadDeleted(authenticated(), { ...mutation, deleted: false, expectedUpdatedAt: deleted.updatedAt.toISOString() });
  assert.equal((await adminService.leads(authenticated(), { q: "Demande à restaurer" })).total, 1);
  assert.equal(await leadRepository.verify(token), true, "Le clic pendant la suppression ne consomme pas le jeton");
  const restored = await adminService.lead(authenticated(), reference);
  assert.equal(restored?.deletedAt, null);
  assert.deepEqual(restored?.activityLogs.map((log) => log.action).sort(), ["LEAD_RESTORED", "LEAD_TRASHED"]);
});

test("corbeille : les projets et échanges liés empêchent la suppression", async () => {
  const project = await db.project.findFirstOrThrow();
  const linked = await db.lead.findUniqueOrThrow({ where: { id: project.leadId } });
  await assert.rejects(adminService.setLeadDeleted(authenticated(), { id: linked.id, expectedUpdatedAt: linked.updatedAt.toISOString(), deleted: true, confirmed: true }),
    (error: unknown) => error instanceof BusinessError && error.message === "LEAD_HAS_RELATED_RECORDS");
  const { reference } = await leadRepository.submit(input("Demande avec échanges"));
  await db.conversation.create({ data: { leadId: reference, replyToken: randomUUID() } });
  const lead = await db.lead.findUniqueOrThrow({ where: { id: reference } });
  await assert.rejects(adminService.setLeadDeleted(authenticated(), { id: reference, expectedUpdatedAt: lead.updatedAt.toISOString(), deleted: true, confirmed: true }), BusinessError);
  assert.equal((await db.lead.findUniqueOrThrow({ where: { id: reference } })).deletedAt, null);
});

test("reconnexion sans challenge pour un ancien compte MFA et compte revoque", async () => {
  assert.equal((await call("sign-out")).status, 200);
  await assert.rejects(adminService.dashboard(authenticated()), AdminAccessError);
  await db.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  const response = await call("sign-in/email", { email: "admin-test@example.com", password });
  assert.equal(response.status, 200);
  assert.notEqual((await response.json()).twoFactorRedirect, true);
  await adminService.dashboard(authenticated());
  assert.equal((await authenticate(authenticated())).id, adminId);
  await db.adminUser.update({ where: { id: adminId }, data: { active: false } });
  await assert.rejects(adminService.dashboard(authenticated()), (error: unknown) => error instanceof AdminAccessError && error.reason === "FORBIDDEN");
});

test("limitation atomique partagée et origine étrangère refusée", async () => {
  const results = await Promise.all(Array.from({ length: 12 }, () => limitAuth("concurrent-test", 5)));
  assert.equal(results.filter(Boolean).length, 5);
  const response = await authPost(new Request("http://localhost:3001/api/auth/sign-in/email", { method: "POST", headers: { origin: "https://foreign.example.com", "content-type": "application/json" }, body: JSON.stringify({ email: "admin-test@example.com", password }) }));
  assert.equal(response.status, 403);
  await assert.rejects(authenticate(new Headers({ cookie: "nova-admin.session_token=forged" })), AdminAccessError);
});

test("permissions PostgreSQL : site isolé des tables privées et audit immuable", async () => {
  await db.$executeRawUnsafe('CREATE ROLE nova_test_web NOLOGIN');
  await db.$executeRawUnsafe('CREATE ROLE nova_test_admin NOLOGIN');
  await db.$executeRawUnsafe('CREATE ROLE nova_test_worker NOLOGIN');
  await db.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO nova_test_web, nova_test_admin, nova_test_worker');
  await db.$executeRawUnsafe('GRANT SELECT, INSERT ON "Lead" TO nova_test_web');
  await db.$executeRawUnsafe('GRANT SELECT, UPDATE ON "OutboxEvent" TO nova_test_worker');
  await db.$executeRawUnsafe('GRANT SELECT ("id", "deletedAt") ON "Lead" TO nova_test_worker');
  await db.$executeRawUnsafe('GRANT SELECT ON "Lead" TO nova_test_admin');
  await db.$executeRawUnsafe('GRANT UPDATE ("status", "updatedAt", "deletedAt") ON "Lead" TO nova_test_admin');
  await db.$executeRawUnsafe('GRANT SELECT, INSERT ON "ActivityLog" TO nova_test_admin');
  const forbidden = async (role: "nova_test_web" | "nova_test_admin" | "nova_test_worker", sql: string) => {
    await assert.rejects(db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
      return tx.$queryRawUnsafe(sql);
    }));
  };
  await forbidden("nova_test_web", 'SELECT * FROM "InternalNote"');
  await forbidden("nova_test_web", 'SELECT * FROM auth_session');
  await forbidden("nova_test_web", 'SELECT * FROM "Project"');
  await forbidden("nova_test_worker", 'SELECT * FROM "Lead"');
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE "nova_test_worker"');
    await tx.$queryRawUnsafe('SELECT event."id" FROM "OutboxEvent" event JOIN "Lead" lead ON lead."id" = event."leadId" WHERE lead."deletedAt" IS NULL FOR UPDATE OF event SKIP LOCKED');
  });
  await forbidden("nova_test_admin", 'UPDATE "ActivityLog" SET "action" = \'FORGED\'');
  await forbidden("nova_test_admin", 'UPDATE "Lead" SET "emailVerifiedAt" = NULL');
});
