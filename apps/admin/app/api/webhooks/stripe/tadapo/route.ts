import { applyStripeEvent, applyQuoteInvoice } from "../../../../../lib/commercial-payment";
import { applyFinancialEvent } from "../../../../../lib/financial-events";
import { tadapoStripe, applyTadapoStripeEvent } from "@nova/shared/tadapo-server";
import { boundedText } from "../../../../../lib/commercial-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.TADAPO_STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response(null, { status: 400 });
  let event;
  try {
    event = tadapoStripe().webhooks.constructEvent(await boundedText(request), signature, secret);
  } catch { return new Response(null, { status: 400 }); }
  try {
    await applyStripeEvent(event, "tadapo");
    await applyQuoteInvoice(event, "tadapo");
    await applyFinancialEvent(event, "tadapo");
    await applyTadapoStripeEvent(event);
    return Response.json({ received: true });
  } catch {
    console.error("tadapo_stripe_event_processing_failed");
    return new Response(null, { status: 503 });
  }
}
