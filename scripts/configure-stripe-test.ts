import { loadEnvConfig } from "@next/env";
import { resolve } from "node:path";
import Stripe from "stripe";
import { stripeEvents } from "../apps/admin/lib/stripe-events";
async function main() {
  loadEnvConfig(resolve("apps/admin"));
  const key = process.env.ZELYWEB_STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) throw new Error("TEST_KEY_REQUIRED");
  const stripe = new Stripe(key, { timeout: 15000, maxNetworkRetries: 1 });
  const matches = (await stripe.webhookEndpoints.list({ limit: 100 })).data.filter(e => e.url === "https://admin-production-1a67.up.railway.app/api/webhooks/stripe" && !e.livemode);
  if (matches.length !== 1 || matches[0].status !== "enabled") throw new Error("ACTIVE_TEST_WEBHOOK_REQUIRED");
  const endpoint = matches[0], missing = endpoint.enabled_events.includes("*") ? [] : stripeEvents.filter(e => !endpoint.enabled_events.includes(e));
  if (process.argv.includes("--apply") && missing.length) await stripe.webhookEndpoints.update(endpoint.id, { enabled_events: [...new Set([...endpoint.enabled_events, ...stripeEvents])] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[] });
  console.log(JSON.stringify({ mode: "TEST", webhook: "active", added: process.argv.includes("--apply") ? missing : [], missing: process.argv.includes("--apply") ? [] : missing }));
}
main().catch(() => { console.error("Configuration Stripe test non vérifiée : contrôler la clé locale et le webhook actif. Aucun secret affiché."); process.exitCode = 1; });
