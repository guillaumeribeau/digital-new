import { Resend } from "resend";
import { applyResendEvent, boundedText } from "../../../../lib/commercial-webhook";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.RESEND_WEBHOOK_SECRET) return new Response(null, { status: 400 });
  const eventId = request.headers.get("svix-id"); if (!eventId || eventId.length > 200) return new Response(null, { status: 400 });
  let payload;
  try {
    payload = new Resend(process.env.RESEND_API_KEY || "verification-only").webhooks.verify({ payload: await boundedText(request), headers: { id: eventId, timestamp: request.headers.get("svix-timestamp") || "", signature: request.headers.get("svix-signature") || "" }, webhookSecret: process.env.RESEND_WEBHOOK_SECRET });
  } catch { return new Response(null, { status: 400 }); }
  try { await applyResendEvent("resend/" + eventId, payload); return Response.json({ received: true }); }
  catch { console.error("resend_event_processing_failed"); return new Response(null, { status: 503 }); }
}
