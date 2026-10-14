import { NextRequest } from "next/server";
import { commercialService, buildSnapshot } from "../../../../../../lib/commercial";
import { quotePdf } from "../../../../../../lib/quote-pdf";
import { commercialResponse } from "../../../../../../lib/quote-access";
import { AdminAccessError } from "../../../../../../lib/access";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params, quote = await commercialService.quote(request.headers, id); if (!quote) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(await quotePdf(await buildSnapshot(quote))), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${quote.number}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (error) { if (error instanceof AdminAccessError) return new Response(null, { status: 401 }); return commercialResponse(error); }
}
