import { domainName, lookupDomain } from "@tadapo/lib/domain";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
// Bound upstream work per process, without storing IP addresses or searched domains.
let windowStart = 0;
let requests = 0;
let active = 0;
export async function GET(request: Request) {
  const parsed = domainName.safeParse(new URL(request.url).searchParams.get("domain"));
  if (!parsed.success) return Response.json({ error: "Indiquez un domaine valide sans https://." }, { status: 400, headers });
  const now = Date.now();
  if (now - windowStart > 60000) { windowStart = now; requests = 0; }
  if (requests >= 30 || active >= 4) return Response.json({ error: "Trop de recherches. Réessayez dans une minute." }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  requests++; active++;
  try { return Response.json(await lookupDomain(parsed.data), { headers }); }
  catch { return Response.json({ error: "La vérification est momentanément indisponible. Le domaine sera vérifié avant toute commande." }, { status: 503, headers }); }
  finally { active--; }
}
