import { createHmac } from "node:crypto";
import { TadapoError, tadapoOrigin } from "@nova/shared/tadapo-server";
import { ZodError } from "zod";
const local = new Map<string, { count: number; until: number }>();
export const privateHeaders = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
export async function orderRateLimit(request: Request, purpose: string, max: number) {
  const header = process.env.TADAPO_TRUSTED_IP_HEADER;
  const ip = header ? (request.headers.get(header) || "global").slice(0, 200) : "global";
  const identity = `${purpose}/${ip}`;
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN, salt = process.env.RATE_LIMIT_SALT;
  if (process.env.NODE_ENV === "production" || url) {
    if (!url || !token || !salt) throw new TadapoError("CONFIGURATION_REQUIRED");
    const key = "tadapo:" + createHmac("sha256", salt).update(identity).digest("hex");
    const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]); end; return n", "1", key, "900000"]), signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!r.ok) throw new TadapoError("CONFIGURATION_REQUIRED");
    const result = await r.json();
    if (typeof result.result !== "number" || result.error) throw new TadapoError("CONFIGURATION_REQUIRED");
    if (result.result > max) throw new TadapoError("RATE_LIMIT");
    return;
  }
  const now = Date.now();
  for (const [key, value] of local) if (value.until < now) local.delete(key);
  const bucket = local.get(identity) || { count: 0, until: now + 900000 };
  bucket.count++; local.set(identity, bucket);
  if (bucket.count > max) throw new TadapoError("RATE_LIMIT");
}
export async function readOrderBody(request: Request) {
  if (request.headers.get("origin") !== tadapoOrigin()) throw new TadapoError("ORIGIN");
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new TadapoError("FORMAT");
  const reader = request.body?.getReader(); if (!reader) throw new TadapoError("BODY");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 24000) { await reader.cancel(); throw new TadapoError("TOO_LARGE"); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new TadapoError("BODY"); }
}
export function orderError(error: unknown) {
  const code = error instanceof TadapoError ? error.message : error instanceof ZodError ? "INVALID_INPUT" : "UNAVAILABLE";
  const status = code === "UNAUTHORIZED" ? 401 : code === "RATE_LIMIT" ? 429 : code === "ORIGIN" ? 403 : code === "TOO_LARGE" ? 413 : ["REQUEST_CONFLICT", "CHECKOUT_EXPIRED", "ALREADY_PAID"].includes(code) ? 409 : ["FORMAT", "BODY", "INVALID_INPUT", "INVALID_ACTION", "MESSAGE_REQUIRED"].includes(code) ? 400 : 503;
  const message = status === 503 ? "Le service de commande est momentanément indisponible. Aucun succès de paiement n’est confirmé. Réessayez dans un instant." : code === "CHECKOUT_EXPIRED" ? "Cette tentative a expiré. Actualisez la page pour recommencer." : status === 401 ? "Ce lien personnel est invalide." : status === 429 ? "Trop de tentatives. Réessayez dans quelques minutes." : "Vérifiez vos informations et actualisez la page avant de réessayer.";
  return Response.json({ code, error: message }, { status, headers: privateHeaders });
}
