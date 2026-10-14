import { timingSafeEqual } from "node:crypto";
import { localEmailMode } from "../../../lib/local-email";
import { decryptPayload } from "../../../lib/lead-security";
import { emailPayloadSchema } from "../../../lib/lead-delivery";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const host = new URL(request.url).hostname;
  if (!localEmailMode() || !["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    return new Response(null, { status: 404 });
  }
  const expected = Buffer.from(process.env.LOCAL_EMAIL_PREVIEW_TOKEN || "");
  const actual = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer /, "") || "");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return new Response(null, { status: 401 });
  }
  const events = await getDb().outboxEvent.findMany({
    where: { status: "PENDING", payloadEncrypted: { not: null }, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }, take: 30,
  });
  return Response.json({ emails: events.map((event) => ({
    id: event.id, kind: event.kind, createdAt: event.createdAt,
    ...emailPayloadSchema.parse(decryptPayload(event.payloadEncrypted!)),
  })) }, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
