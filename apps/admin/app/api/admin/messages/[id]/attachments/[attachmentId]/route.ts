import { NextRequest } from "next/server";
import { getDb } from "@nova/database";
import { Resend } from "resend";
import { z } from "zod";
import { authenticate, AdminAccessError } from "../../../../../../../lib/access";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  try {
    await authenticate(request.headers);
    const { id, attachmentId } = await params; z.uuid().parse(id); z.string().regex(/^[A-Za-z0-9_-]{1,100}$/).parse(attachmentId);
    const message = await getDb().clientMessage.findUnique({ where: { id } });
    const files = z.array(z.object({ id: z.string(), filename: z.string() })).safeParse(message?.attachments);
    const file = files.success ? files.data.find((item) => item.id === attachmentId) : undefined;
    if (!file || !message?.providerId || message.direction !== "INBOUND" || !process.env.RESEND_API_KEY) return new Response(null, { status: 404 });
    const attachment = await new Resend(process.env.RESEND_API_KEY).emails.receiving.attachments.get({ emailId: message.providerId, id: attachmentId });
    if (attachment.error || !attachment.data) return new Response(null, { status: 503 });
    const url = new URL(attachment.data.download_url); if (url.protocol !== "https:") return new Response(null, { status: 503 });
    const response = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: "error", cache: "no-store" });
    if (!response.ok || Number(response.headers.get("content-length") || 0) > 8 * 1024 * 1024) return new Response(null, { status: 413 });
    const chunks: Uint8Array[] = []; let size = 0; const reader = response.body?.getReader();
    if (reader) while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 8 * 1024 * 1024) { await reader.cancel(); return new Response(null, { status: 413 }); } chunks.push(value); }
    return new Response(new Uint8Array(Buffer.concat(chunks)), { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(file.filename), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return new Response(null, { status: error instanceof AdminAccessError ? 401 : 503 }); }
}
