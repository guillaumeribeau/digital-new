"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminService, BusinessError } from "../lib/service";
import { AdminAccessError } from "../lib/access";
import { z } from "zod";

const messages: Record<string, string> = {
  STALE_STATUS: "Cette fiche a été modifiée. Rechargez-la avant de réessayer.",
  INVALID_TRANSITION: "Ce changement de statut n’est pas autorisé.",
  USE_PROJECT_STATUS: "Modifiez le suivi depuis le projet associé.", NOT_QUALIFIED: "La demande doit être vérifiée et qualifiée.",
  WEBSITE_URL_REQUIRED: "Renseignez l’URL du site avant de le marquer en ligne.",
  PREVIEW_URL_REQUIRED: "Renseignez le lien de prévisualisation avant d’envoyer la proposition.",
};
export type ActionResult = { error?: string; success?: string };
export async function saveAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const requestHeaders = await headers();
    const id = z.uuid().parse(form.get("id"));
    const operation = form.get("operation");
    if (operation === "lead-status") await adminService.changeLeadStatus(requestHeaders, { id, expected: form.get("expected"), status: form.get("status") });
    else if (operation === "project-stage") await adminService.changeProjectStage(requestHeaders, { id, expected: form.get("expected"), stage: form.get("stage") });
    else if (operation === "note") await adminService.note(requestHeaders, { id, kind: form.get("kind"), content: form.get("content") });
    else if (operation === "links") await adminService.projectLinks(requestHeaders, { id, expectedUpdatedAt: form.get("expectedUpdatedAt"), previewUrl: form.get("previewUrl"), websiteUrl: form.get("websiteUrl") });
    else return { error: "Action inconnue." };
    revalidatePath("/", "layout");
    return { success: "Modification enregistrée." };
  } catch (error) {
    if (error instanceof AdminAccessError) return { error: "Votre accès a expiré ou n’est pas autorisé. Reconnectez-vous." };
    if (error instanceof BusinessError) return { error: messages[error.message] || "Action non autorisée." };
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message || "Vérifiez les informations." };
    console.error("admin_action_failed");
    return { error: "L’enregistrement est temporairement indisponible. Réessayez." };
  }
}
export async function convertAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  let id: string;
  try { id = await adminService.convert(await headers(), z.uuid().parse(form.get("id"))); }
  catch (error) {
    if (error instanceof AdminAccessError) return { error: "Accès non autorisé. Reconnectez-vous." };
    if (error instanceof BusinessError) return { error: messages[error.message] || "Conversion non autorisée." };
    console.error("admin_conversion_failed"); return { error: "La conversion est temporairement indisponible." };
  }
  revalidatePath("/", "layout");
  redirect("/projets/" + id);
}
