import { createHmac } from "node:crypto";
const windowMs = 15 * 60 * 1000;
const max = 5;
const local = new Map<string, { count: number; expires: number }>();
export function localLimit(key: string, now = Date.now()) {
  for (const [k, v] of local) if (v.expires <= now) local.delete(k);
  const current = local.get(key);
  if (!current || current.expires <= now) {
    if (local.size >= 10000) return false;
    local.set(key, { count: 1, expires: now + windowMs });
    return true;
  }
  current.count++;
  return current.count <= max;
}
export async function checkRateLimit(ip: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN,
    salt = process.env.RATE_LIMIT_SALT;
  if (!url || !token || !salt) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Rate limiting is not configured");
    return localLimit(ip);
  }
  const key =
    "nova:lead:" + createHmac("sha256", salt).update(ip).digest("hex");
  const script =
    "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]); end; return n";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["EVAL", script, "1", key, String(windowMs)]),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Rate limiting unavailable");
  const result = await response.json();
  if (result.error || typeof result.result !== "number")
    throw new Error("Invalid rate limit response");
  return result.result <= max;
}
