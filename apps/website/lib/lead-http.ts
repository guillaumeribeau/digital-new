import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit";
import { AntiBotError } from "./anti-bot";

export const respond = (data: unknown, status: number, headers: Record<string, string> = {}) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
export class RequestRejected extends Error {
  constructor(public response: NextResponse) { super("REQUEST_REJECTED"); }
}
export async function readLeadRequest(request: NextRequest, scope: string): Promise<unknown> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const port = request.nextUrl.port || "3000";
  const allowed = configured ? [new URL(configured).origin] : process.env.NODE_ENV !== "production"
    ? ["http://localhost:" + port, "http://127.0.0.1:" + port] : [];
  if (!allowed.includes(request.headers.get("origin") || ""))
    throw new RequestRejected(respond({ error: "Cette demande ne peut pas être acceptée." }, 403));
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || ""))
    throw new RequestRejected(respond({ error: "Format de demande non valide." }, 415));
  if (Number(request.headers.get("content-length") || 0) > 20000)
    throw new RequestRejected(respond({ error: "Votre demande est trop volumineuse." }, 413));
  // Only trust a header explicitly guaranteed to be overwritten by the hosting proxy.
  const trustedHeader = process.env.VERCEL ? "x-vercel-forwarded-for" : process.env.TRUSTED_CLIENT_IP_HEADER;
  const ip = trustedHeader ? request.headers.get(trustedHeader)?.split(",")[0]?.trim() || "global"
    : process.env.NODE_ENV === "production" ? "global" : request.headers.get("x-forwarded-for") || "local";
  if (!(await checkRateLimit(scope + ":" + ip)))
    throw new RequestRejected(respond({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, 429, { "Retry-After": "900" }));
  const reader = request.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  if (reader) while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 20000) {
      await reader.cancel();
      throw new RequestRejected(respond({ error: "Votre demande est trop volumineuse." }, 413));
    }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new RequestRejected(respond({ error: "Votre demande est illisible." }, 400)); }
}
export function handleLeadError(error: unknown) {
  if (error instanceof AntiBotError) return respond({ error: error.reason === "REJECTED"
    ? "La vérification anti-robot est manquante, expirée ou refusée. Réessayez ; vos informations sont conservées."
    : "La vérification anti-robot est temporairement indisponible. Aucune demande n’a été enregistrée. Réessayez plus tard." }, error.reason === "REJECTED" ? 400 : 503);
  if (error instanceof RequestRejected) return error.response;
  console.error("lead_pipeline_unavailable"); // No body, email, token, SQL or connection string.
  return respond({ error: "Le service est temporairement indisponible. Réessayez plus tard." }, 503);
}
