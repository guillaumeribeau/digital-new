import { NextRequest } from "next/server";
import { clientBody, clientQuote, commercialResponse } from "../../../../../../lib/quote-access";
import { CommercialError, paymentMode, snapshotSchema } from "../../../../../../lib/commercial-core";
import { acceptQuote, checkoutQuote, declineQuote, simulateQuotePayment } from "../../../../../../lib/commercial-payment";
import { limitAuth } from "../../../../../../lib/rate-limit";
import { getDb } from "@nova/database";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params, quote = await clientQuote(request, id, "tadapo");
    const latestPayment = await getDb().paymentAttempt.findFirst({ where: { quoteId: id }, orderBy: { createdAt: "desc" }, select: { status: true } });
    return Response.json({ id, status: quote.status === "SENT" && quote.validUntil <= new Date() ? "EXPIRED" : quote.status,
      snapshot: snapshotSchema.parse(quote.snapshot), documentHash: quote.documentHash, acceptedAt: quote.acceptedAt, acceptedName: quote.acceptedName,
      paymentMode: quote.paymentMode || paymentMode("tadapo"), paymentStatus: latestPayment?.status, paidAt: quote.paidAt }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return commercialResponse(error); }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; await clientQuote(request, id, "tadapo");
    const body = await clientBody(request, "tadapo");
    if (!await limitAuth("quote-action:" + id, 30)) return Response.json({ error: "Trop de tentatives." }, { status: 429 });
    if (body.action === "accept") await acceptQuote(id, body);
    else if (body.action === "decline") await declineQuote(id, body);
    else if (body.action === "pay") return Response.json({ url: await checkoutQuote(id) }, { headers: { "Cache-Control": "private, no-store" } });
    else if (body.action === "simulate") await simulateQuotePayment(id);
    else throw new CommercialError("INVALID_ACTION");
    return Response.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return commercialResponse(error); }
}
