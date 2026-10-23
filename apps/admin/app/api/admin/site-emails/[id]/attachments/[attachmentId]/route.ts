import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticate, AdminAccessError } from "../../../../../../../lib/access";
import { storedInboundAttachment } from "../../../../../../../lib/site-inbound";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  try {
    await authenticate(request.headers);
    const { id, attachmentId } = await params;
    z.uuid().parse(id); z.string().regex(/^[A-Za-z0-9_-]{1,200}$/).parse(attachmentId);
    const file = await storedInboundAttachment(id, attachmentId);
    return new Response(new Uint8Array(file.bytes), { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(file.filename), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return new Response(null, { status: error instanceof AdminAccessError ? 401 : 503 }); }
}
