import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { POST as auth } from "../../apps/admin/app/api/auth/[...all]/route";
import { recordManualPayment } from "../../apps/admin/lib/manual-payments";
import { AdminAccessError } from "../../apps/admin/lib/access";
import { workspaceDb } from "../../apps/admin/lib/brand-context";
import { tadapoOffer, tadapoAnniversary } from "@nova/shared/tadapo";
import { seal } from "../../apps/admin/lib/commercial-core";

const db = getDb();
let cookie = "";
const h = (brand = "zelyweb") => new Headers({ cookie: cookie + "; admin-brand=" + brand });
const today = new Date().toISOString().slice(0, 10);
const nextBillingOn = tadapoAnniversary(new Date(), 1).toISOString().slice(0, 10);
const payment = (row: { id: string; updatedAt: Date }, kind: string, status = "PAID") => ({
  id: row.id, kind, status, expectedUpdatedAt: row.updatedAt.toISOString(), requestId: randomUUID(), paidOn: today, nextBillingOn, reference: "Virement vérifié", note: "Contrôle manuel du relevé",
});
async function lead(brand = "zelyweb") {
  return db.lead.create({ data: { brand, status: "NEW", requestId: randomUUID(), payloadHash: "0".repeat(64), fullName: "Client Paiement", email: "same-manual@example.test", preferredContactMethod: "email", businessName: "Entreprise " + brand,
    businessSector: "Artisan", city: "Paris", services: "Création site", preferredStyle: "moderne", emailVerifiedAt: new Date(), pricingAcknowledgedAt: new Date(), pricingVersion: "test", privacyAcknowledgedAt: new Date(), privacyVersion: "test", source: "test" } });
}
async function site() {
  const client = await lead(), project = await db.project.create({ data: { leadId: client.id, stage: "AWAITING_PAYMENT" } });
  return db.siteOrder.create({ data: { projectId: project.id, previewUrl: "https://example.test", screenshot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=", message: "Présentation", status: "SENT", mode: "LIVE", tokenHash: randomUUID().replaceAll("-", "").padEnd(64, "0"), tokenEncrypted: seal("fixture") } });
}
const brief = { plan: "essentiel", term: "12", company: "Entreprise Tadapo Manuelle", activity: "Artisan", area: "Paris", fullName: "Client Tadapo", email: "same-manual@example.test", phone: "", objectives: "Présenter mon entreprise", services: "Services de proximité", audience: "Particuliers", pages: "", existingWebsite: "", style: "moderne", colors: "", inspirations: "", logo: "non", content: "", domainMode: "help", domain: "" };
async function tadapo() {
  return db.tadapoOrder.create({ data: { requestId: randomUUID(), payloadHash: "1".repeat(64), brief, offerSnapshot: tadapoOffer("essentiel", "12"), consentSnapshot: { earlyStart: true }, mode: "LIVE", tokenHash: randomUUID().replaceAll("-", "").padEnd(64, "0"), tokenEncrypted: seal("fixture") } });
}

before(async () => {
  const user = await db.user.create({ data: { email: "manual-payments-admin@example.test", name: "Admin paiements manuels", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword("ManualPayments-Test-42!") } });
  await db.adminUser.create({ data: { userId: user.id } });
  const response = await auth(new Request("http://localhost:3001/api/auth/sign-in/email", { method: "POST", headers: { origin: "http://localhost:3001", "content-type": "application/json" }, body: JSON.stringify({ email: user.email, password: "ManualPayments-Test-42!" }) }));
  assert.equal(response.status, 200);
  cookie = response.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
});
after(async () => db.$disconnect());

test("paiements manuels : authentification, dates, séparation des marques et historique", async () => {
  const o = await site(), input = payment(o, "SITE_CREATION");
  await assert.rejects(recordManualPayment(new Headers(), input), AdminAccessError);
  await assert.rejects(recordManualPayment(h("tadapo"), input));
  await assert.rejects(recordManualPayment(h(), { ...input, paidOn: "2099-01-01" }));
  await assert.rejects(recordManualPayment(h(), { ...input, paidOn: "2026-02-30" }));
  assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } })).creationPaidAt, null);
  const beforeMails = await db.commercialEmail.count();
  await Promise.all([recordManualPayment(h(), input), recordManualPayment(h(), input)]);
  const updated = await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } });
  assert.ok(updated.creationPaidAt); assert.equal(updated.status, "PAID");
  assert.equal((await db.project.findUniqueOrThrow({ where: { id: o.projectId } })).stage, "PAID");
  assert.equal(await db.manualPaymentReview.count({ where: { resourceId: o.id } }), 1);
  assert.equal(await workspaceDb(h("tadapo")).manualPaymentReview.count({ where: { resourceId: o.id } }), 0);
  assert.equal(await db.commercialEmail.count(), beforeMails);
  await assert.rejects(recordManualPayment(h(), { ...input, requestId: randomUUID(), status: "FAILED" }));
  await recordManualPayment(h(), payment(updated, "SITE_CREATION", "FAILED"));
  const corrected = await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } });
  assert.equal(corrected.creationPaidAt, null); assert.equal(corrected.status, "SENT");
  assert.equal((await db.project.findUniqueOrThrow({ where: { id: o.projectId } })).stage, "AWAITING_PAYMENT");
  assert.equal(await db.manualPaymentReview.count({ where: { resourceId: o.id } }), 2);
  await recordManualPayment(h(), input); // A replay must not undo a later correction.
  assert.equal((await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } })).creationPaidAt, null);
});

test("devis de chaque marque : reçu, refusé, en attente ; aucun accord client fabriqué", async () => {
  for (const brand of ["zelyweb", "tadapo"]) {
    const client = await lead(brand);
    const q = await db.quote.create({ data: { leadId: client.id, number: "MANUAL-" + randomUUID(), status: "ACCEPTED", title: "Prestation", items: [], subtotalCents: 10000, taxCents: 2000, totalCents: 12000, billingAddress: "Paris", deliveryTime: "10 jours", terms: "Conditions", validUntil: new Date(Date.now() + 86400000), paymentMode: "LIVE", snapshot: {}, documentHash: "0".repeat(64), acceptanceHash: "0".repeat(64), acceptedAt: new Date(), acceptedName: client.fullName } });
    await assert.rejects(recordManualPayment(h(brand === "tadapo" ? "zelyweb" : "tadapo"), payment(q, "QUOTE")));
    await recordManualPayment(h(brand), payment(q, "QUOTE"));
    let current = await db.quote.findUniqueOrThrow({ where: { id: q.id } });
    assert.equal(current.status, "PAID"); assert.deepEqual(current.acceptedAt, q.acceptedAt);
    await assert.rejects(db.quote.update({ where: { id: q.id }, data: { status: "ACCEPTED", paidAt: null } }), /INVALID_QUOTE_TRANSITION/);
    const review = await db.manualPaymentReview.findFirstOrThrow({ where: { resourceId: q.id } });
    await assert.rejects(db.manualPaymentReview.update({ where: { id: review.id }, data: { note: "Historique modifié" } }), /MANUAL_PAYMENT_REVIEW_IMMUTABLE/);
    assert.equal((await db.paymentAttempt.findFirstOrThrow({ where: { quoteId: q.id } })).amountCents, 12000);
    await recordManualPayment(h(brand), payment(current, "QUOTE", "FAILED"));
    current = await db.quote.findUniqueOrThrow({ where: { id: q.id } });
    assert.equal(current.paidAt, null); assert.equal(current.status, "ACCEPTED");
    await recordManualPayment(h(brand), payment(current, "QUOTE", "PENDING"));
    assert.equal(await db.manualPaymentReview.count({ where: { resourceId: q.id } }), 3);
  }
});

test("un devis envoyé sans acceptation ne peut pas devenir payé par une saisie admin", async () => {
  const client = await lead();
  const q = await db.quote.create({ data: { leadId: client.id, number: "SENT-" + randomUUID(), status: "SENT", title: "Prestation", items: [], subtotalCents: 10000, taxCents: 2000, totalCents: 12000, billingAddress: "Paris", deliveryTime: "10 jours", terms: "Conditions", validUntil: new Date(Date.now() + 86400000), snapshot: {}, documentHash: "0".repeat(64), paymentMode: "LIVE" } });
  await assert.rejects(recordManualPayment(h(), payment(q, "QUOTE")), /QUOTE_NOT_ACCEPTED/);
  assert.equal(await db.manualPaymentReview.count({ where: { resourceId: q.id } }), 0);
  assert.equal(await db.paymentAttempt.count({ where: { quoteId: q.id } }), 0);
  assert.equal((await db.quote.findUniqueOrThrow({ where: { id: q.id } })).acceptedAt, null);
});

test("abonnement Zelyweb : invitation requise, renouvellement manuel et impayé bloquant", async () => {
  let o = await site();
  await assert.rejects(recordManualPayment(h(), payment(o, "SITE_SUBSCRIPTION")));
  o = await db.siteOrder.update({ where: { id: o.id }, data: { creationPaidAt: new Date(), status: "PAID", subscriptionInviteSentAt: new Date() } });
  await recordManualPayment(h(), payment(o, "SITE_SUBSCRIPTION"));
  o = await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } });
  const firstPaid = o.firstSubscriptionPaidAt;
  assert.ok(firstPaid); assert.equal(o.subscriptionStatus, "active"); assert.equal(o.stripeSubscriptionId, null);
  await recordManualPayment(h(), payment(o, "SITE_SUBSCRIPTION", "FAILED"));
  o = await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } });
  assert.equal(o.billingAlert, true); assert.equal(o.subscriptionStatus, "past_due"); assert.deepEqual(o.firstSubscriptionPaidAt, firstPaid);
  await recordManualPayment(h(), payment(o, "SITE_SUBSCRIPTION"));
  o = await db.siteOrder.findUniqueOrThrow({ where: { id: o.id } });
  assert.equal(o.billingAlert, false); assert.deepEqual(o.firstSubscriptionPaidAt, firstPaid);
  await assert.rejects(recordManualPayment(h(), { ...payment(o, "SITE_SUBSCRIPTION"), nextBillingOn: today }));
  o = await db.siteOrder.update({ where: { id: o.id }, data: { subscriptionStatus: "canceled" } });
  await assert.rejects(recordManualPayment(h(), payment(o, "SITE_SUBSCRIPTION")));
});

test("Tadapo : premier règlement manuel crée un seul dossier, sans Stripe ni e-mail", async () => {
  const o = await tadapo(), input = payment(o, "TADAPO_SUBSCRIPTION"), mailCount = await db.commercialEmail.count();
  await assert.rejects(recordManualPayment(h(), input));
  await Promise.all([recordManualPayment(h("tadapo"), input), recordManualPayment(h("tadapo"), input)]);
  let current = await db.tadapoOrder.findUniqueOrThrow({ where: { id: o.id }, include: { project: { include: { lead: true } } } });
  assert.ok(current.paidAt); assert.ok(current.projectId); assert.equal(current.project?.lead.brand, "tadapo");
  assert.equal(current.project?.lead.email, brief.email); assert.equal(current.stage, "CONTENT_PREPARATION");
  assert.equal(current.stripeSubscriptionId, null); assert.equal(current.subscriptionStatus, "active");
  assert.equal(await db.project.count({ where: { lead: { requestId: o.requestId } } }), 1);
  assert.equal(await db.commercialEmail.count(), mailCount);
  assert.deepEqual(current.commitmentEndAt, tadapoAnniversary(current.paidAt!, 12));
  await recordManualPayment(h("tadapo"), payment(current, "TADAPO_SUBSCRIPTION", "FAILED"));
  current = await db.tadapoOrder.findUniqueOrThrow({ where: { id: o.id }, include: { project: { include: { lead: true } } } });
  assert.equal(current.billingAlert, true); assert.equal(current.subscriptionStatus, "past_due"); assert.ok(current.paidAt);
  await assert.rejects(recordManualPayment(h("tadapo"), payment(current, "TADAPO_DOMAIN")));
  const domain = await db.tadapoOrder.update({ where: { id: o.id }, data: { domainQuote: { initialExtraHtCents: 1000 }, domainAcceptedAt: new Date() } });
  await recordManualPayment(h("tadapo"), payment(domain, "TADAPO_DOMAIN"));
  assert.ok((await db.tadapoOrder.findUniqueOrThrow({ where: { id: o.id } })).domainPaidAt);
});
