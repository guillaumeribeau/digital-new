import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { calculate, cents, CommercialError, commercialLocal, paymentMode, seal, unseal } from "../apps/admin/lib/commercial-core";
import { commercialService } from "../apps/admin/lib/commercial";
import { AdminAccessError } from "../apps/admin/lib/access";
import { GET as clientGet } from "../apps/admin/app/api/client/quotes/[id]/route";
import { POST as stripeWebhook } from "../apps/admin/app/api/webhooks/stripe/route";
import { POST as resendWebhook } from "../apps/admin/app/api/webhooks/resend/route";
import { NextRequest } from "next/server";

test("calcul des devis en centimes: virgules, arrondis par ligne, plafonds et montants invalides", () => {
  assert.equal(cents("12,30"), 1230); assert.equal(cents("0.01"), 1);
  for (const value of ["-1", "1.001", "NaN", "Infinity", "1e4", ""]) assert.throws(() => cents(value), CommercialError);
  const totals = calculate([{ label: "Prestation fictive", description: "", quantity: 3, unitPrice: "12,30", taxBasisPoints: 2000 }]);
  assert.equal(totals.subtotalCents, 3690); assert.equal(totals.taxCents, 738); assert.equal(totals.totalCents, 4428);
  assert.equal(calculate([{ label: "Test", description: "", quantity: 1, unitPrice: "0.03", taxBasisPoints: 2000 }]).taxCents, 1);
  assert.throws(() => calculate([{ label: "Test", description: "", quantity: 1000, unitPrice: "9999999", taxBasisPoints: 2000 }]), CommercialError);
});
test("charges e-mail commerciales chiffrées et authentifiées", () => {
  const previous = process.env.COMMERCIAL_ENCRYPTION_KEY; process.env.COMMERCIAL_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  try {
    const content = { token: "private-link-test", text: "message fictif" }, encrypted = seal(content);
    assert.deepEqual(unseal(encrypted), content); assert.ok(!encrypted.includes(content.token));
    const bytes = Buffer.from(encrypted, "base64"); bytes[30] ^= 1;
    assert.throws(() => unseal(bytes.toString("base64")));
  } finally { if (previous === undefined) delete process.env.COMMERCIAL_ENCRYPTION_KEY; else process.env.COMMERCIAL_ENCRYPTION_KEY = previous; }
});
test("aucun accès anonyme aux clients, messages, devis, paramètres ou PDF client", async () => {
  for (const action of [() => commercialService.clients(new Headers()), () => commercialService.inbox(new Headers()), () => commercialService.quotes(new Headers()), () => commercialService.settings(new Headers()), () => commercialService.payments(new Headers()), () => commercialService.message(new Headers(), {})]) await assert.rejects(action(), AdminAccessError);
  const response = await clientGet(new NextRequest("http://localhost:3001/api/client/quotes/00000000-0000-4000-8000-000000000001"), { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }) });
  assert.equal(response.status, 401);
  assert.equal((await stripeWebhook(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }))).status, 400);
  assert.equal((await resendWebhook(new Request("http://localhost/api/webhooks/resend", { method: "POST", body: "{}" }))).status, 400);
});
test("la simulation commerciale est impossible en production et hors loopback", () => {
  const keys = ["NODE_ENV", "COMMERCIAL_MODE", "COMMERCIAL_PUBLIC_URL", "ZELYWEB_STRIPE_SECRET_KEY"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    Object.assign(process.env, { NODE_ENV: "development", COMMERCIAL_MODE: "local", COMMERCIAL_PUBLIC_URL: "http://localhost:3001", ZELYWEB_STRIPE_SECRET_KEY: "" });
    assert.equal(commercialLocal(), true); assert.equal(paymentMode(), "LOCAL");
    Object.assign(process.env, { ZELYWEB_STRIPE_SECRET_KEY: "sk_live_fake_for_test" }); assert.equal(paymentMode(), "UNCONFIGURED");
    Object.assign(process.env, { ZELYWEB_STRIPE_SECRET_KEY: "" });
    Object.assign(process.env, { NODE_ENV: "production" }); assert.equal(commercialLocal(), false); assert.equal(paymentMode(), "UNCONFIGURED");
    Object.assign(process.env, { NODE_ENV: "development", COMMERCIAL_PUBLIC_URL: "https://admin.example.com" }); assert.equal(commercialLocal(), false);
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
