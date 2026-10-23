import { publicOrigin } from "../../../../../../lib/commercial-core";
import { authenticate } from "../../../../../../lib/access";
import { attachTadapoFile } from "../../../../../../lib/tadapo";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate(request.headers);
    if (request.headers.get("origin") !== publicOrigin()) return new Response(null, { status: 403 });
    // Bound the multipart stream before parsing it.
    const reader = request.body?.getReader(); if (!reader) return new Response(null, { status: 400 });
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 6 * 1024 * 1024) { await reader.cancel(); return new Response(null, { status: 413 }); } chunks.push(value); }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const f = form.get("file"); if (!(f instanceof File)) return new Response(null, { status: 400 });
    await attachTadapoFile(request.headers, (await params).id, f.name, Buffer.from(await f.arrayBuffer()));
    return Response.json({ success: true });
  } catch { return new Response(null, { status: 400 }); }
}
