import { workspaceDb } from "../../../../../../lib/brand-context";
import { unseal } from "@nova/shared/secure-payload";
import { authenticate } from "../../../../../../lib/access";
import { z } from "zod";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate(request.headers);
    const file = await workspaceDb(request.headers).tadapoFile.findUniqueOrThrow({ where: { id: z.uuid().parse((await params).id) } });
    const bytes = unseal(file.encrypted); if (typeof bytes !== "string") throw new Error();
    return new Response(Buffer.from(bytes, "base64"), { headers: { "Content-Type": file.mimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
