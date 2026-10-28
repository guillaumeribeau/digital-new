import { NextRequest } from "next/server";
import { clientQuote, commercialResponse } from "../../../../../../../lib/quote-access";
import { quotePdf } from "../../../../../../../lib/quote-pdf";
import { limitAuth } from "../../../../../../../lib/rate-limit";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params, quote = await clientQuote(request, id, "tadapo");
    if (!await limitAuth("quote-pdf:" + id, 30)) return new Response(null, { status: 429 });
    return new Response(new Uint8Array(await quotePdf(quote.snapshot)), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${quote.number}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return commercialResponse(error); }
}
