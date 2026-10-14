"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { commercialService } from "../lib/commercial";
import { cents, CommercialError } from "../lib/commercial-core";
import { AdminAccessError } from "../lib/access";
import { queueQuoteReminder } from "../lib/commercial-mail";
import { authenticate } from "../lib/access";

export type CommercialActionResult = { error?: string; success?: string; redirectTo?: string };
function failure(error: unknown): CommercialActionResult {
  const messages: Record<string, string> = {
    CONFIGURATION_REQUIRED: "Configurez les services d’e-mail et de paiement avant cette action.",
    SELLER_REQUIRED: "Renseignez votre entreprise, son adresse et son immatriculation dans les paramètres commerciaux.",
    CLIENT_UNVERIFIED: "Le client doit confirmer son adresse e-mail avant l’envoi d’un message ou d’un devis.",
    IMMUTABLE_QUOTE: "Ce devis est figé. Créez une nouvelle version si nécessaire.", STALE_QUOTE: "Le devis ou le message a changé. Rechargez la page.",
    INVALID_AMOUNT: "Renseignez des prix positifs avec deux décimales maximum, dans la limite de 1 000 000 € TTC par devis.",
    INVALID_ACTION: "Cette action n’est pas disponible dans l’état actuel.",
    REMINDER_PENDING: "Une relance est déjà en attente d’envoi. Aucun doublon n’a été créé.", REMINDER_LIMIT: "Ce devis a déjà fait l’objet de six relances. Contactez le client directement.",
  };
  if (error instanceof AdminAccessError) return { error: "Reconnectez-vous avec votre compte administrateur." };
  if (error instanceof CommercialError) return { error: messages[error.message] || "L’opération n’est pas disponible." };
  if (error instanceof z.ZodError) return { error: error.issues[0]?.message || "Vérifiez les informations." };
  console.error("commercial_action_failed"); return { error: "Le service est temporairement indisponible. Réessayez." };
}
export async function commercialAction(_previous: CommercialActionResult, form: FormData): Promise<CommercialActionResult> {
  try {
    const h = await headers(), operation = form.get("operation");
    if (operation === "settings") await commercialService.saveSettings(h, Object.fromEntries(form));
    else if (operation === "message") await commercialService.message(h, Object.fromEntries(form));
    else if (operation === "local-reply") await commercialService.localReply(h, Object.fromEntries(form));
    else if (operation === "template") await commercialService.saveTemplate(h, { ...Object.fromEntries(form), taxBasisPoints: cents(String(form.get("taxPercent") || "0")) });
    else if (operation === "archive-template") await commercialService.archiveTemplate(h, z.uuid().parse(form.get("id")), String(form.get("kind")));
    else if (operation === "send-quote") await commercialService.sendQuote(h, z.uuid().parse(form.get("id")));
    else if (operation === "cancel" || operation === "complete") await commercialService.changeQuote(h, z.uuid().parse(form.get("id")), operation);
    else if (operation === "remind") { await authenticate(h); await queueQuoteReminder(z.uuid().parse(form.get("id")), true); }
    else throw new CommercialError("INVALID_ACTION");
    revalidatePath("/", "layout");
    return { success: operation === "send-quote" || operation === "message" || operation === "remind" ? "E-mail ajouté à la file d’envoi." : "Modification enregistrée." };
  } catch (error) { return failure(error); }
}
export async function createQuoteAction(_previous: CommercialActionResult, form: FormData): Promise<CommercialActionResult> {
  try {
    const id = await commercialService.createQuote(await headers(), { ...Object.fromEntries(form), parentId: form.get("parentId") || undefined, items: JSON.parse(String(form.get("items"))) },
      form.get("quoteId") ? z.uuid().parse(form.get("quoteId")) : undefined, form.get("expectedUpdatedAt") ? String(form.get("expectedUpdatedAt")) : undefined);
    revalidatePath("/", "layout"); return { redirectTo: "/devis/" + id };
  } catch (error) { return failure(error); }
}
