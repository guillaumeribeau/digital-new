import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { tadapoMode, tadapoStripe } from "../packages/shared/tadapo-server";
import { tadapoReplyDomain } from "../packages/shared/tadapo-mail";
import { paymentMode, zelywebStripeKey, zelywebStripeWebhookSecret } from "../apps/admin/lib/commercial-core";
import { POST as zelywebWebhook } from "../apps/admin/app/api/webhooks/stripe/route";
import { POST as tadapoWebhook } from "../apps/admin/app/api/webhooks/stripe/tadapo/route";
import terms from "../packages/shared/tadapo-terms-v6-2026-10-28.json";
import { tadapoOffer } from "../packages/shared/tadapo";

test("les nouvelles conditions Tadapo sont indépendantes et versionnées", () => {
  assert.doesNotMatch(terms.html, /zelyweb/i);
  assert.equal(tadapoOffer("essentiel", "monthly").termsVersion, terms.version);
});

test("les variables Zelyweb explicites sont prioritaires sur les anciens noms", () => {
  const keys = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ZELYWEB_STRIPE_SECRET_KEY", "ZELYWEB_STRIPE_WEBHOOK_SECRET"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.STRIPE_SECRET_KEY = "sk_test_legacy_fixture";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_legacy_fixture";
    delete process.env.ZELYWEB_STRIPE_SECRET_KEY;
    delete process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET;
    assert.equal(zelywebStripeKey(), "sk_test_legacy_fixture");
    assert.equal(zelywebStripeWebhookSecret(), "whsec_legacy_fixture");
    process.env.ZELYWEB_STRIPE_SECRET_KEY = "sk_test_zelyweb_fixture";
    process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET = "whsec_zelyweb_fixture";
    assert.equal(zelywebStripeKey(), "sk_test_zelyweb_fixture");
    assert.equal(zelywebStripeWebhookSecret(), "whsec_zelyweb_fixture");
    process.env.ZELYWEB_STRIPE_SECRET_KEY = "";
    process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET = "";
    assert.equal(zelywebStripeKey(), "");
    assert.equal(zelywebStripeWebhookSecret(), "");
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});

test("les comptes Stripe et signatures des deux marques restent indépendants", async () => {
  const keys = ["ZELYWEB_STRIPE_SECRET_KEY", "ZELYWEB_STRIPE_WEBHOOK_SECRET", "TADAPO_STRIPE_SECRET_KEY", "TADAPO_STRIPE_WEBHOOK_SECRET", "COMMERCIAL_MODE", "TADAPO_REPLY_DOMAIN", "COMMERCIAL_REPLY_DOMAIN"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.COMMERCIAL_MODE = "";
    process.env.ZELYWEB_STRIPE_SECRET_KEY = "sk_live_zelyweb_fixture";
    delete process.env.TADAPO_STRIPE_SECRET_KEY;
    assert.throws(() => tadapoMode(), /ORDERING_NOT_OPEN/);
    assert.throws(() => tadapoStripe(), /ORDERING_NOT_OPEN/);
    process.env.TADAPO_STRIPE_SECRET_KEY = "sk_test_tadapo_fixture";
    assert.equal(paymentMode(), "LIVE");
    assert.equal(tadapoMode(), "TEST");

    process.env.COMMERCIAL_REPLY_DOMAIN = "reponses.zelyweb.com";
    delete process.env.TADAPO_REPLY_DOMAIN;
    assert.equal(tadapoReplyDomain(), undefined, "Tadapo ne reprend pas le domaine de réponse Zelyweb");
    process.env.TADAPO_REPLY_DOMAIN = "reponses.tadapo.com";
    assert.equal(tadapoReplyDomain(), "reponses.tadapo.com");

    process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET = "whsec_zelyweb_fixture";
    process.env.TADAPO_STRIPE_WEBHOOK_SECRET = "whsec_tadapo_fixture";
    // An irrelevant signed event checks authentication without touching the database.
    const payload = JSON.stringify({ id: "evt_brand_auth", type: "test.brand_isolation", livemode: false, data: { object: {} } });
    const stripe = new Stripe("sk_test_signing_fixture");
    const request = (secret: string) => new Request("https://example.test/api/webhooks/stripe", {
      method: "POST", body: payload,
      headers: { "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload, secret }) },
    });
    assert.equal((await tadapoWebhook(request(process.env.TADAPO_STRIPE_WEBHOOK_SECRET))).status, 200);
    assert.equal((await zelywebWebhook(request(process.env.TADAPO_STRIPE_WEBHOOK_SECRET))).status, 400);
    assert.equal((await tadapoWebhook(request(process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET))).status, 400);
    delete process.env.TADAPO_STRIPE_WEBHOOK_SECRET;
    assert.equal((await tadapoWebhook(request(process.env.ZELYWEB_STRIPE_WEBHOOK_SECRET))).status, 400);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
