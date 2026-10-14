import { getAuth } from "../../../../lib/auth";
import { limitAuth } from "../../../../lib/rate-limit";

export const runtime = "nodejs";
const allowed = new Set(["sign-in/email", "sign-out", "get-session"]);
async function handle(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, "");
  if (!allowed.has(path)) return Response.json({ error: "Opération indisponible." }, { status: 404 });
  try {
    if (request.method === "POST") {
      if (request.headers.get("origin") !== new URL(process.env.BETTER_AUTH_URL || "").origin)
        return Response.json({ error: "Origine refusée." }, { status: 403 });
      const reader = request.body?.getReader();
      let size = 0;
      const chunks: Uint8Array[] = [];
      if (reader) while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 20000) { await reader.cancel(); return Response.json({ error: "Requête trop volumineuse." }, { status: 413 }); }
        chunks.push(value);
      }
      const bytes = Buffer.concat(chunks);
      const data: unknown = JSON.parse(bytes.toString("utf8"));
      if (data && typeof data === "object" && (("trustDevice" in data && data.trustDevice === true) ||
        ("method" in data && data.method !== "totp") || ("disableSession" in data && data.disableSession === true)))
        return Response.json({ error: "Option de sécurité non autorisée." }, { status: 400 });
      const header = process.env.TRUSTED_CLIENT_IP_HEADER;
      const ip = header ? request.headers.get(header)?.split(",")[0]?.trim() || "global" : "global";
      if (!(await limitAuth("ip:" + ip, 30))) return Response.json({ error: "Trop de tentatives." }, { status: 429, headers: { "Retry-After": "900" } });
      if (path === "sign-in/email" && data && typeof data === "object" && "email" in data &&
        typeof data.email === "string" && !(await limitAuth("account:" + data.email.trim().toLowerCase(), 5)))
        return Response.json({ error: "Trop de tentatives." }, { status: 429, headers: { "Retry-After": "900" } });
      const rebuilt = new Request(request.url, { method: request.method, headers: request.headers, body: bytes });
      const response = await getAuth().handler(rebuilt);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
    return await getAuth().handler(request);
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Requête invalide." }, { status: 400 });
    console.error("admin_auth_unavailable");
    return Response.json({ error: "Connexion temporairement indisponible." }, { status: 503 });
  }
}
export const GET = handle;
export const POST = handle;
