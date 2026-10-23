"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminWorkflow } from "../lib/project-workflow";
import { CommercialError } from "../lib/commercial-core";
export async function workflowAction(id: string, data: unknown) {
  try { await adminWorkflow(await headers(), id, data); revalidatePath("/projets", "layout"); return { ok: true }; }
  catch (e) {
    const messages: Record<string, string> = { REVIEW_WAITING: "Une série attend la version corrigée. Termine-la avant de rouvrir le formulaire.", PRICE_UNCHANGED: "Le tarif est inchangé : aucun e-mail de changement n’est nécessaire.", STALE_QUOTE: "La version ou le tarif a changé. Recharge la fiche avant de continuer.", PAYMENT_REQUIRED: "Vérifie le paiement et le devis de supplément avant de confirmer cette étape." };
    return { error: e instanceof CommercialError && messages[e.message] || "Action indisponible. Vérifie le paiement, les séries ouvertes et le choix du domaine. Un choix confirmé nécessite l’accord du client avant modification." };
  }
}
