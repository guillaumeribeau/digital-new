"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminWorkflow } from "../lib/project-workflow";
export async function workflowAction(id: string, data: unknown) {
  try { await adminWorkflow(await headers(), id, data); revalidatePath("/projets", "layout"); return { ok: true }; }
  catch { return { error: "Action indisponible. Vérifiez le paiement, les séries ouvertes et le choix du domaine. Un choix client existant ne peut pas être remplacé sans son accord." }; }
}
