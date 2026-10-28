"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordManualPayment } from "../lib/manual-payments";
import { AdminAccessError } from "../lib/access";
import { CommercialError } from "../lib/commercial-core";

export async function manualPaymentAction(_previous: { error?: string; success?: string }, form: FormData): Promise<{ error?: string; success?: string }> {
  try {
    await recordManualPayment(await headers(), Object.fromEntries(form));
    revalidatePath("/", "layout");
    return { success: "État du paiement enregistré. Aucun débit ni e-mail n’a été déclenché." };
  } catch (error) {
    const messages: Record<string, string> = {
      STALE_QUOTE: "Le dossier a changé. Actualisez la page avant de réessayer.",
      PAYMENT_DATE_REQUIRED: "Indiquez la date du règlement reçu, au plus tard aujourd’hui.",
      BILLING_DATE_REQUIRED: "Indiquez la prochaine échéance, après la date du règlement.",
      QUOTE_NOT_ACCEPTED: "Le client doit d’abord accepter le devis. Son accord ne peut pas être remplacé par une confirmation de paiement.",
      SUBSCRIPTION_NOT_INVITED: "Envoyez d’abord l’invitation d’activation de l’abonnement.",
      SUBSCRIPTION_ENDED: "Cet abonnement est terminé. Vérifiez le dossier avant de le réactiver.",
      CREATION_HAS_SUBSCRIPTION: "Un abonnement payé existe déjà. Corrigez son suivi avant celui de la création.",
      DOMAIN_NOT_ACCEPTED: "Le client doit accepter le supplément du domaine avant son règlement.",
      DOMAIN_ALREADY_PURCHASED: "Le domaine est déjà acheté. Son paiement initial reste dans l’historique.",
    };
    if (error instanceof AdminAccessError) return { error: "Reconnectez-vous à l’administration." };
    if (error instanceof CommercialError) return { error: messages[error.message] || "Cette modification n’est pas possible dans l’état actuel du dossier." };
    if (error instanceof z.ZodError) return { error: "Vérifiez les dates et les informations saisies." };
    console.error("manual_payment_update_failed");
    return { error: "Modification indisponible. Actualisez la page et réessayez." };
  }
}
