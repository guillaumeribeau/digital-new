import { NextRequest } from "next/server";
import { clientBody, commercialResponse } from "../../../../../lib/quote-access";
import { clientSite } from "../../../../../lib/site-access";
import { CommercialError } from "../../../../../lib/commercial-core";
import { checkoutSite, sitePortal } from "../../../../../lib/site-billing";
import { limitAuth } from "../../../../../lib/rate-limit";
import { billingAgreement } from "../../../../../lib/site-billing-shared";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params, order = await clientSite(request, id);
    return Response.json({ id, version: order.version, company: order.project.lead.businessName, previewUrl: order.previewUrl, screenshot: order.screenshot, message: order.message, mode: order.mode, creationHtCents: order.creationHtCents, paid: !!order.creationPaidAt, agreement: billingAgreement(order.creationHtCents), subscriptionStatus: order.subscriptionStatus, invoices: order.invoices.map(i => ({ id: i.id, amountCents: i.amountCents, status: i.status, url: i.hostedUrl, pdf: i.pdfUrl })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return commercialResponse(error); }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; await clientSite(request, id);
    const body = await clientBody(request);
    if (!await limitAuth("site-action:" + id, 30)) return Response.json({ error: "Trop de tentatives." }, { status: 429 });
    const url = body.action === "pay" ? await checkoutSite(id, body) : body.action === "portal" ? await sitePortal(id) : null;
    if (!url) throw new CommercialError("INVALID_ACTION");
    return Response.json({ url }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return commercialResponse(error); }
}
