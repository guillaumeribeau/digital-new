"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@nova/database";
import { z } from "zod";
import { authenticate } from "../lib/access";
import { activateSiteSubscription, saveSitePresentation, sendSitePresentation, syncSiteSubscription } from "../lib/site-billing";
export type SiteBillingResult = { error?: string; success?: string; id?: string; version?: number; html?: string };
export async function siteBillingAction(_previous: SiteBillingResult, form: FormData): Promise<SiteBillingResult> {
  try {
    const h = await headers(); await authenticate(h);
    const op = form.get("operation");
    if (op === "preview") return { ...await saveSitePresentation(h, Object.fromEntries(form)), success: "Brouillon enregistré. Vérifiez l’e-mail avant envoi." };
    const id = z.uuid().parse(form.get("id"));
    if (op === "send") await sendSitePresentation(h, id, z.coerce.number().int().parse(form.get("version")));
    else if (op === "activate") {
      if (form.get("confirmed") !== "yes") return { error: "Confirmez que les ajustements sont validés et que le site est prêt à être publié." };
      await activateSiteSubscription(h, id);
    } else if (op === "refresh") {
      const order = await getDb().siteOrder.findUniqueOrThrow({ where: { id } });
      if (order.stripeSubscriptionId) await syncSiteSubscription(id, order.stripeSubscriptionId);
    } else return { error: "Action inconnue." };
    revalidatePath("/", "layout");
    return { success: op === "send" ? "E-mail ajouté à la file d’envoi." : "Suivi Stripe actualisé. Consultez l’état du paiement avant de publier." };
  } catch {
    return { error: "Action indisponible. Vérifiez les informations, la validation du client et la configuration Stripe/e-mail. Une proposition envoyée est figée ; rechargez la fiche si elle a changé." };
  }
}
