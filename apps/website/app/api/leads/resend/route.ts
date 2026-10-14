import { NextRequest } from "next/server";
import { z } from "zod";
import { leadRepository } from "@/lib/lead-repository";
import { readLeadRequest, respond, handleLeadError } from "@/lib/lead-http";
import { verifyAntiBot } from "@/lib/anti-bot";
export const runtime = "nodejs";
const schema = z.object({ reference: z.uuid(), email: z.email().max(254), turnstileToken: z.string().max(2048).optional() }).strict();
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await readLeadRequest(request, "resend"));
    if (!parsed.success) return respond({ error: "Vérifiez votre référence et votre adresse e-mail." }, 400);
    await verifyAntiBot(parsed.data.turnstileToken, "lead_resend");
    await leadRepository.resend(parsed.data.reference, parsed.data.email);
    return respond({ success: true, message:
      "Si une demande en attente correspond à ces informations et que le délai de renvoi est respecté, un nouveau lien sera envoyé." }, 202);
  } catch (error) { return handleLeadError(error); }
}
