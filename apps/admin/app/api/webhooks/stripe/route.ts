import { stripeClient, applyStripeEvent } from "../../../../lib/commercial-payment";
import { boundedText } from "../../../../lib/commercial-webhook";
import { applySiteBillingEvent } from "../../../../lib/site-billing-webhook";
import { zelywebStripeWebhookSecret } from "../../../../lib/commercial-core";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = zelywebStripeWebhookSecret(), signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response(null, { status: 400 });
  let event;
  try {
    const text = await boundedText(request);
    event = stripeClient().webhooks.constructEvent(text, signature, secret);
  } catch { return new Response(null, { status: 400 }); }
  try { await applyStripeEvent(event); await applySiteBillingEvent(event); return Response.json({ received: true }); }
  catch { console.error("stripe_event_processing_failed"); return new Response(null, { status: 503 }); }
}
