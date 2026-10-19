"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { resendEmail } from "../lib/operations";
export async function resendAction(id: string, requestId: string) {
  try { await resendEmail(await headers(), id, requestId); revalidatePath("/emails"); return { ok: true }; } catch { return { error: "Renvoi indisponible : envoi déjà en attente, contenu ancien non conservé ou étape dépassée." }; }
}
