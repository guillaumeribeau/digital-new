"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@nova/database";
import { z } from "zod";
import { AdminAccessError, authenticate } from "../lib/access";
import { CommercialError } from "../lib/commercial-core";
import { prepareRevisionEmail, sendRevisionEmail, prepareSiteSubscription, sendSiteSubscription, saveSitePresentation, sendSitePresentation, syncSiteSubscription } from "../lib/site-billing";
export type SiteBillingResult = { error?: string; success?: string; id?: string; version?: number; html?: string; kind?: "creation" | "subscription" | "revisions" };
export async function siteBillingAction(_previous: SiteBillingResult, form: FormData): Promise<SiteBillingResult> {
  try {
    const h = await headers(); await authenticate(h);
    const op = form.get("operation");
    if (op === "preview") return { ...await saveSitePresentation(h, Object.fromEntries(form)), kind: "creation", success: "Brouillon enregistré. Vérifiez l’e-mail avant envoi." };
    const id = z.uuid().parse(form.get("id"));
    if (op === "revisions-preview") return { ...await prepareRevisionEmail(h, id, String(form.get("message") || "")), kind: "revisions", success: "E-mail d’ajustements préparé. Vérifiez les questions avant envoi." };
    if (op === "send") await sendSitePresentation(h, id, z.coerce.number().int().parse(form.get("version")));
    else if (op === "revisions-send") await sendRevisionEmail(h, id, z.coerce.number().int().parse(form.get("version")));
    else if (op === "subscription-preview") {
      if (form.get("confirmed") !== "yes") return { error: "Confirmez que les ajustements sont validés et que le site est prêt à être publié." };
      return { ...await prepareSiteSubscription(h, id), kind: "subscription", success: "E-mail de mise en ligne préparé. Vérifiez-le avant envoi. Aucun prélèvement n’a été déclenché." };
    } else if (op === "subscription-send") await sendSiteSubscription(h, id, z.coerce.number().int().parse(form.get("version")));
    else if (op === "refresh") {
      const order = await getDb().siteOrder.findUniqueOrThrow({ where: { id } });
      if (order.stripeSubscriptionId) await syncSiteSubscription(id, order.stripeSubscriptionId);
    } else return { error: "Action inconnue." };
    revalidatePath("/", "layout");
    return { success: (op === "send" || op === "subscription-send" || op === "revisions-send") ? "E-mail ajouté à la file d’envoi." : "Suivi Stripe actualisé. Consultez l’état du paiement avant de publier." };
  } catch (error) {
    if (error instanceof AdminAccessError) return { error: "Votre session a expiré ou ne permet pas cette action. Reconnectez-vous à l’administration." };
    if (error instanceof z.ZodError) {
      const labels: Record<string, string> = { previewUrl: "Le lien d’aperçu doit être une adresse HTTPS valide.", message: "Le message doit contenir entre 10 et 5 000 caractères.", screenshot: "Ajoutez une capture du site au format PNG, JPEG ou WebP.", creationPrice: "Vérifiez le prix de création.", projectId: "Projet introuvable. Rechargez la fiche.", expectedVersion: "Rechargez la fiche avant de réessayer.", version: "Rechargez la fiche avant de réessayer.", id: "Rechargez la fiche avant de réessayer." };
      return { error: labels[String(error.issues[0]?.path[0])] || "Vérifiez les informations de la présentation." };
    }
    const messages: Record<string, string> = {
      CLIENT_UNVERIFIED: "La demande doit être active et le client doit avoir confirmé son adresse e-mail. Vérifiez sa fiche ; une demande annulée ne peut pas recevoir de proposition.",
      IMMUTABLE_QUOTE: "Cette proposition a déjà été envoyée. Son prix et son contenu sont figés. Rechargez la fiche pour consulter son suivi.",
      STALE_QUOTE: "La proposition a changé ou a déjà été envoyée. Rechargez la fiche avant de réessayer.",
      INVALID_AMOUNT: "Saisissez un prix de création compris entre 1 et 100 000 € HT, avec deux décimales au maximum.",
      CONFIGURATION_REQUIRED: "La configuration commerciale est incomplète ou le mode Stripe ne correspond pas à la proposition. Vérifiez STRIPE_SECRET_KEY, COMMERCIAL_MODE, COMMERCIAL_PUBLIC_URL, COMMERCIAL_FROM_EMAIL et COMMERCIAL_ENCRYPTION_KEY dans le service admin.",
      PAYMENT_REQUIRED: "Le paiement de création et l’accord du client sont requis. Pour préparer l’e-mail d’abonnement, renseignez aussi l’URL définitive HTTPS du site.",
      REVISION_EMAIL_SENT: "L’e-mail d’ajustements a déjà été envoyé ou le projet est passé à l’abonnement. Rechargez la fiche pour consulter son suivi.",
      SUBSCRIPTION_INVITED: "L’invitation a déjà été envoyée ou l’abonnement est déjà démarré. Rechargez la fiche pour consulter son suivi.",
      FINAL_DOMAIN_REQUIRED: "Renseignez une adresse HTTPS valide pour le domaine définitif dans les liens du projet.",
      INVALID_ACTION: "Cette action ne peut pas être effectuée dans l’état actuel. Pour une capture, choisissez une image PNG, JPEG ou WebP moins volumineuse.",
    };
    if (error instanceof CommercialError && Object.hasOwn(messages, error.message)) return { error: messages[error.message] };
    // Never log raw errors: provider messages can contain personal data or secrets.
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    const safeCode = typeof code === "string" && /^(P\d{4}|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|42501|42703|42P01)$/.test(code) ? code : "UNEXPECTED";
    console.error("site_billing_action_failed", safeCode);
    return { error: `L’opération a échoué. Consultez les logs du service admin : site_billing_action_failed (${safeCode}). Aucun nouvel envoi ne doit être supposé réussi sans confirmation.` };
  }
}
