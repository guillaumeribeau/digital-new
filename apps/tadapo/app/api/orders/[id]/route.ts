import { z } from "zod";
import { cancelTadapo, tadapoFeedback, tadapoPaymentMethodLink, tadapoPublicView } from "@nova/shared/tadapo-server";
import { acceptTadapoDomain, payTadapoDomain } from "@nova/shared/tadapo-domain";
import { orderError, orderRateLimit, privateHeaders, readOrderBody } from "@tadapo/lib/order-http";
export const runtime = "nodejs";
const token = (request: Request) => request.headers.get("authorization")?.replace(/^Bearer /, "") || null;
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await orderRateLimit(request, "client-read", 300);
    return Response.json(await tadapoPublicView((await params).id, token(request)), { headers: privateHeaders });
  } catch (error) { return orderError(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await readOrderBody(request);
    await orderRateLimit(request, "client-action", 60);
    const data = z.object({ action: z.enum(["approve", "feedback", "cancel", "payment-method", "domain-accept", "domain-pay", "domain-request", "domain-renewal", "extra-request", "monthly"]) }).passthrough().parse(body);
    const { id } = await params, secret = token(request);
    if (data.action === "cancel") await cancelTadapo(id, secret);
    else if (data.action === "payment-method") return Response.json({ url: await tadapoPaymentMethodLink(id, secret) }, { headers: privateHeaders });
    else if (data.action === "domain-accept" || data.action === "domain-pay") {
      const { version } = z.object({ version: z.number().int().min(1), agreement: z.literal(true) }).parse(data);
      if (data.action === "domain-pay") return Response.json({ url: await payTadapoDomain(id, secret, version) }, { headers: privateHeaders });
      await acceptTadapoDomain(id, secret, version);
    } else await tadapoFeedback(id, secret, body);
    return Response.json({ success: true }, { headers: privateHeaders });
  } catch (error) { return orderError(error); }
}
