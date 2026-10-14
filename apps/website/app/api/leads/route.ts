import { NextRequest } from "next/server";
import { leadSchema } from "@/lib/lead-schema";
import { leadRepository, IdempotencyConflict } from "@/lib/lead-repository";
import { pipelineConfigured } from "@/lib/lead-security";
import { readLeadRequest, respond, handleLeadError } from "@/lib/lead-http";
import { verifyAntiBot } from "@/lib/anti-bot";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const body = await readLeadRequest(request, "submit");
    // Explicit rejection prevents silent acceptance of privileged client fields.
    if (body && typeof body === "object" &&
      ["status", "emailVerifiedAt", "pricingVersion", "pricingAcknowledgedAt", "id", "source"].some((key) => key in body))
      return respond({ error: "La demande contient des champs non autorisés." }, 400);
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return respond({ error: "Vérifiez les informations de votre demande.",
      fields: parsed.error.flatten().fieldErrors }, 400);
    if (!pipelineConfigured()) return respond({ error:
      "Le service de réception n’est pas encore activé. Aucune demande n’a été enregistrée. Vos informations restent dans le formulaire." }, 503);
    await verifyAntiBot(body && typeof body === "object" && "turnstileToken" in body ? body.turnstileToken : undefined, "lead_submit");
    const result = await leadRepository.submit(parsed.data);
    return respond({ success: true, reference: result.reference, verificationRequired: true, emailDelivery: "queued" }, 202);
  } catch (error) {
    if (error instanceof IdempotencyConflict) return respond({ error:
      "Cette tentative ne correspond plus aux informations initiales. Renouvelez votre demande." }, 409);
    return handleLeadError(error);
  }
}
