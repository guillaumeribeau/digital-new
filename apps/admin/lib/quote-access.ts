import { getDb } from "@nova/database";
import { NextRequest } from "next/server";
import { z } from "zod";
import { CommercialError, digest, publicOrigin } from "./commercial-core";

export const quoteCookie = (id: string) => "nova-quote-" + id;
export async function clientQuote(request: NextRequest, id: string) {
  z.uuid().parse(id);
  const token = request.cookies.get(quoteCookie(id))?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new CommercialError("CLIENT_ACCESS_DENIED");
  const access = await getDb().quoteAccess.findFirst({ where: { quoteId: id, tokenHash: digest(token), revokedAt: null, expiresAt: { gt: new Date() } }, include: { quote: true } });
  if (!access || ["DRAFT", "CANCELLED", "SUPERSEDED"].includes(access.quote.status)) throw new CommercialError("CLIENT_ACCESS_DENIED");
  return access.quote;
}
export async function clientBody(request: NextRequest) {
  if (request.headers.get("origin") !== publicOrigin()) throw new CommercialError("CLIENT_ACCESS_DENIED");
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) throw new CommercialError("INVALID_ACTION");
  const reader = request.body?.getReader(); let length = 0; const chunks: Uint8Array[] = [];
  if (reader) while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.length; if (length > 20000) { await reader.cancel(); throw new CommercialError("INVALID_ACTION"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function commercialResponse(error: unknown) {
  const denied = error instanceof CommercialError && error.message === "CLIENT_ACCESS_DENIED";
  const messages: Record<string, string> = { REVIEW_LIMIT: "Les trois séries incluses sont terminées. Contactez Guillaume pour une prestation complémentaire.", REVIEW_CLOSED: "La période des retours inclus est terminée. Contactez Guillaume par e-mail.", WORKFLOW_NOT_READY: "La version et le domaine doivent être validés avant cette étape.", SUBSCRIPTION_ALREADY_STARTED: "Une activation est déjà en cours. Actualisez dans quelques instants ou consultez votre portail de facturation.", PAYMENT_REQUIRED: "Le paiement n’est pas disponible à cette étape.", INVALID_ACTION: "Cette action n’est pas disponible.", CONFIGURATION_REQUIRED: "Le service n’est pas encore configuré.", IMMUTABLE_QUOTE: "Le devis ne peut plus être modifié ou accepté.", EXPIRED_QUOTE: "La date de validité du devis est dépassée.", STALE_QUOTE: "Le devis a changé. Actualisez la page.", CLIENT_ACCESS_DENIED: "Ce lien privé est invalide ou expiré. Ouvrez le lien reçu par e-mail." };
  const known = error instanceof CommercialError || error instanceof z.ZodError || error instanceof SyntaxError;
  if (!known) console.error("commercial_request_failed");
  return Response.json({ error: error instanceof CommercialError ? messages[error.message] || "L’opération n’est pas disponible." : known ? "Vérifiez les informations saisies." : "Le service est temporairement indisponible." }, { status: denied ? 401 : known ? 400 : 503, headers: { "Cache-Control": "private, no-store" } });
}
