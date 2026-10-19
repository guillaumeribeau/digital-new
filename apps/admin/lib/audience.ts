import { JWT } from "google-auth-library";
import { createHash } from "node:crypto";
import { authenticate } from "./access";
import { audiencePeriod, audienceProperty, audienceRequests, parseAudience, type AudienceReport } from "./audience-report";
export type AudienceState = { state: "ready"; data: AudienceReport; updatedAt: Date } | { state: "unconfigured" | "denied" | "unavailable"; property: string };
const cache = new Map<string, { data: AudienceReport; at: number }>();
const pending = new Map<string, Promise<AudienceState>>();
export async function getAudience(h: Headers, range?: string): Promise<AudienceState> {
  await authenticate(h);
  const property = process.env.GA4_PROPERTY_ID || audienceProperty;
  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL || "", key = (process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!/^\d{1,20}$/.test(property) || !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(email) || !key.includes("BEGIN PRIVATE KEY")) return { state: "unconfigured", property: audienceProperty };
  const period = audiencePeriod(range), fingerprint = createHash("sha256").update(property + email + key).digest("hex"), id = `${fingerprint}/${period.start}/${period.end}`;
  const existing = cache.get(id);
  if (existing && Date.now() - existing.at < 300000) return { state: "ready", data: existing.data, updatedAt: new Date(existing.at) };
  if (pending.has(id)) return pending.get(id)!;
  const task = (async (): Promise<AudienceState> => {
    try {
      const auth = new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/analytics.readonly"], eagerRefreshThresholdMillis: 60000, transporterOptions: { timeout: 10000, retry: false } });
      const token = await auth.getAccessToken(); if (!token.token) return { state: "denied", property };
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:batchRunReports`, { method: "POST", headers: { Authorization: "Bearer " + token.token, "Content-Type": "application/json" }, body: JSON.stringify({ requests: audienceRequests(period) }), signal: AbortSignal.timeout(15000), cache: "no-store" });
      if (!response.ok) return { state: [401, 403].includes(response.status) ? "denied" : "unavailable", property };
      const data = parseAudience(await response.json(), period), at = Date.now();
      if (cache.size > 12) cache.clear(); cache.set(id, { data, at });
      return { state: "ready", data, updatedAt: new Date(at) };
    } catch { return { state: "unavailable", property }; }
  })();
  pending.set(id, task);
  try { return await task; } finally { pending.delete(id); }
}
