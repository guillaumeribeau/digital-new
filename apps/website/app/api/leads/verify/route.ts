import { NextRequest } from "next/server";
import { z } from "zod";
import { leadRepository } from "@/lib/lead-repository";
import { readLeadRequest, respond, handleLeadError } from "@/lib/lead-http";
export const runtime = "nodejs";
const schema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await readLeadRequest(request, "verify"));
    if (!parsed.success || !(await leadRepository.verify(parsed.data.token)))
      return respond({ error: "Ce lien est invalide, expiré ou déjà utilisé. Vous pouvez demander un nouveau lien." }, 400);
    return respond({ success: true }, 200);
  } catch (error) { return handleLeadError(error); }
}
