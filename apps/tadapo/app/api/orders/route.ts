import { checkoutTadapo } from "@nova/shared/tadapo-server";
import { orderError, orderRateLimit, privateHeaders, readOrderBody } from "@tadapo/lib/order-http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await readOrderBody(request);
    await orderRateLimit(request, "checkout", 10);
    return Response.json(await checkoutTadapo(body), { headers: privateHeaders });
  } catch (error) { return orderError(error); }
}
