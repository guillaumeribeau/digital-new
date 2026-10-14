const testSiteKeys = new Set(["1x00000000000000000000AA", "2x00000000000000000000AB", "1x00000000000000000000BB", "2x00000000000000000000BB", "3x00000000000000000000FF"]);
const testSecretKeys = new Set(["1x0000000000000000000000000000000AA", "2x0000000000000000000000000000000AA", "3x0000000000000000000000000000000AA"]);
export class AntiBotError extends Error {
  constructor(public reason: "REJECTED" | "UNAVAILABLE") { super(reason); }
}
export function turnstileConfig() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    const local = process.env.NODE_ENV !== "production" && url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const siteKey = process.env.TURNSTILE_SITE_KEY || (local ? "1x00000000000000000000AA" : "");
    const secret = process.env.TURNSTILE_SECRET_KEY || (local ? "1x0000000000000000000000000000000AA" : "");
    if (!siteKey || !secret) return null;
    const testMode = testSiteKeys.has(siteKey) || testSecretKeys.has(secret);
    if (testMode && (!local || !testSiteKeys.has(siteKey) || !testSecretKeys.has(secret))) return null;
    return { siteKey, secret, testMode, hostname: url.hostname };
  } catch { return null; }
}
export async function verifyAntiBot(token: unknown, action: "lead_submit" | "lead_resend") {
  const config = turnstileConfig();
  if (!config) throw new AntiBotError("UNAVAILABLE");
  if (typeof token !== "string" || !token || token.length > 2048) throw new AntiBotError("REJECTED");
  let result: { success?: boolean; hostname?: string; action?: string; "error-codes"?: string[] };
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: config.secret, response: token }),
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) throw new Error("PROVIDER_UNAVAILABLE");
    result = await response.json();
  } catch { throw new AntiBotError("UNAVAILABLE"); }
  if (!result || result.success !== true) {
    const unavailable = result?.["error-codes"]?.some((code) => ["internal-error", "invalid-input-secret", "missing-input-secret"].includes(code));
    throw new AntiBotError(unavailable ? "UNAVAILABLE" : "REJECTED");
  }
  // Cloudflare dummy keys return synthetic hostname/action values. They are
  // only permitted on loopback outside production; real keys require both.
  if (!config.testMode && (result.hostname !== config.hostname || result.action !== action)) throw new AntiBotError("REJECTED");
}
