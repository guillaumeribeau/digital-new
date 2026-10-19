import { NextRequest } from "next/server";
import { getDb } from "@nova/database";
import { z } from "zod";
import { authenticate } from "../../../../lib/access";
import { clientSite } from "../../../../lib/site-access";
import { reviewFile } from "../../../../lib/project-workflow";
export async function GET(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Resolve metadata only after an admin or a private-client cookie is present.
    if (!r.headers.get("cookie")?.match(/(?:nova-admin|zelyweb-site-)/)) return new Response(null, { status: 401 });
    const id = z.uuid().parse((await params).id);
    const metadata = await getDb().reviewFile.findUniqueOrThrow({ where: { id }, select: { message: { select: { round: { select: { siteOrderId: true } } } } } });
    try { await authenticate(r.headers); } catch { await clientSite(r, metadata.message.round.siteOrderId); }
    const f = await reviewFile(id);
    return new Response(new Uint8Array(f.content), { headers: { "Content-Type": f.mimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.filename)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
