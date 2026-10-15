import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { localEmailMode } from "./local-email";
import { turnstileConfig } from "./anti-bot";

export const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const PRICING_VERSION = "5-pages-299-29-v2-2026-10-15";
export const PRIVACY_VERSION = "retention-manuelle-v2-2026-10-15";

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function createVerificationToken(now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: tokenHash(token), expiresAt: new Date(now.getTime() + TOKEN_LIFETIME_MS) };
}
function encryptionKey() {
  const key = Buffer.from(process.env.OUTBOX_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw new Error("INVALID_OUTBOX_ENCRYPTION_KEY");
  return key;
}
export function encryptPayload(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}
export function decryptPayload(value: string): unknown {
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"));
}
export function pipelineConfigured() {
  try {
    encryptionKey();
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    return Boolean(turnstileConfig() && process.env.DATABASE_URL && (localEmailMode() || (process.env.RESEND_API_KEY &&
      process.env.LEAD_FROM_EMAIL && process.env.LEAD_TO_EMAIL)) &&
      (url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:")) &&
      (process.env.NODE_ENV !== "production" || (process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN && process.env.RATE_LIMIT_SALT)));
  } catch { return false; }
}
