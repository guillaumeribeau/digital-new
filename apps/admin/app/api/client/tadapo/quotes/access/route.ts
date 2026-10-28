import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@nova/database";
import { z } from "zod";
import { clientBody, commercialResponse, quoteCookie } from "../../../../../../lib/quote-access";
import { CommercialError, digest, publicOrigin } from "../../../../../../lib/commercial-core";
import { limitAuth } from "../../../../../../lib/rate-limit";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const data = z.object({ id: z.uuid(), token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).parse(await clientBody(request, "tadapo"));
    if (!await limitAuth("quote-access:" + data.id, 30)) return Response.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    const access = await getDb().quoteAccess.findFirst({ where: { quoteId: data.id, tokenHash: digest(data.token), revokedAt: null, expiresAt: { gt: new Date() }, quote: { lead: { brand: "tadapo" } } } });
    if (!access) throw new CommercialError("CLIENT_ACCESS_DENIED");
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(quoteCookie(data.id, "tadapo"), data.token, { httpOnly: true, sameSite: "lax", secure: new URL(publicOrigin("tadapo")).protocol === "https:", path: `/api/client/tadapo/quotes/${data.id}`, maxAge: Math.floor((access.expiresAt.getTime() - Date.now()) / 1000) });
    return response;
  } catch (error) { return commercialResponse(error); }
}
