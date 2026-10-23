"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateTadapo } from "../lib/tadapo";
export async function tadapoAction(_previous: { error?: string; success?: string }, form: FormData): Promise<{ error?: string; success?: string }> {
  try {
    await updateTadapo(await headers(), Object.fromEntries(form));
    revalidatePath("/projets", "layout"); revalidatePath("/commandes-tadapo");
    return { success: "Enregistré." };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return { error: code === "EARLY_START_NOT_ACCEPTED" ? "Le client n’a pas demandé de démarrage anticipé. Attendez la fin du délai de 14 jours." : code === "DOMAIN_IMMUTABLE" ? "Le devis de domaine a déjà été accepté et ne peut plus être modifié." : "Action impossible. Vérifiez l’étape, le paiement, la validation du client et le domaine, puis actualisez." };
  }
}
