import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@nova/database";
import { z } from "zod";
import { clientBody, commercialResponse } from "../../../../../lib/quote-access";
import { CommercialError, digest, publicOrigin } from "../../../../../lib/commercial-core";
import { siteCookie } from "../../../../../lib/site-access";
import { limitAuth } from "../../../../../lib/rate-limit";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const data = z.object({ id: z.uuid(), token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).parse(await clientBody(request));
    if (!await limitAuth("site-access:" + data.id, 30)) return Response.json({ error: "Trop de tentatives." }, { status: 429 });
    const order = await getDb().siteOrder.findFirst({ where: { id: data.id, tokenHash: digest(data.token), status: { in: ["SENT", "PAID"] } } });
    if (!order) throw new CommercialError("CLIENT_ACCESS_DENIED");
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(siteCookie(data.id), data.token, { httpOnly: true, sameSite: "lax", secure: new URL(publicOrigin()).protocol === "https:", path: "/api/client/sites/" + data.id, maxAge: 30 * 86400 });
    return response;
  } catch (error) { return commercialResponse(error); }
}
