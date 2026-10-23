import { NextRequest } from "next/server";
import { clientSite } from "../../../../../../lib/site-access";
import { clientBody, commercialResponse } from "../../../../../../lib/quote-access";
import { checkUpload, clientWorkflow, workflowData } from "../../../../../../lib/project-workflow";
import { CommercialError, publicOrigin } from "../../../../../../lib/commercial-core";
import { limitAuth } from "../../../../../../lib/rate-limit";
export const runtime = "nodejs";
export async function GET(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await clientSite(r, id); return Response.json(await workflowData(id), { headers: { "Cache-Control": "private, no-store" } }); } catch (e) { return commercialResponse(e); }
}
export async function POST(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; await clientSite(r, id);
    if (!await limitAuth("workflow:" + id, 30)) return Response.json({ error: "Trop de tentatives." }, { status: 429 });
    if (r.headers.get("content-type")?.startsWith("multipart/form-data")) {
      if (r.headers.get("origin") !== publicOrigin()) throw new CommercialError("CLIENT_ACCESS_DENIED");
      const reader = r.body?.getReader(), chunks: Uint8Array[] = []; let size = 0;
      if (reader) while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 16 * 1024 * 1024) { await reader.cancel(); throw new CommercialError("INVALID_ACTION"); } chunks.push(value); }
      const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": r.headers.get("content-type")! } }).formData();
      const files = form.getAll("files").filter((v): v is File => v instanceof File && v.size > 0);
      if (files.length > 3) throw new CommercialError("INVALID_ACTION");
      await clientWorkflow(id, { action: "feedback", requestId: form.get("requestId"), message: form.get("message"), version: form.get("version") }, await Promise.all(files.map(async f => checkUpload(f.name, Buffer.from(await f.arrayBuffer())))));
    } else await clientWorkflow(id, await clientBody(r));
    return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return commercialResponse(e); }
}
