import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export class CommercialError extends Error {}
export function publicOrigin() {
  const url = new URL(process.env.COMMERCIAL_PUBLIC_URL || process.env.BETTER_AUTH_URL || "");
  if (process.env.COMMERCIAL_MODE === "local" && (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) throw new CommercialError("CONFIGURATION_REQUIRED");
  if (url.username || url.password || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new CommercialError("CONFIGURATION_REQUIRED");
  return url.origin;
}
export function commercialLocal() {
  if (process.env.NODE_ENV === "production" || process.env.COMMERCIAL_MODE !== "local") return false;
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(publicOrigin()).hostname); } catch { return false; }
}
export function paymentMode() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (process.env.COMMERCIAL_MODE === "local" && (!commercialLocal() || key.startsWith("sk_live_"))) return "UNCONFIGURED";
  if (key.startsWith("sk_test_")) return "TEST";
  if (key.startsWith("sk_live_")) return "LIVE";
  return commercialLocal() && !key ? "LOCAL" : "UNCONFIGURED";
}
export function sender() {
  const value = process.env.COMMERCIAL_FROM_EMAIL;
  if (value) return value;
  if (commercialLocal()) return "Zelyweb Local <no-reply@nova.test>";
  throw new CommercialError("CONFIGURATION_REQUIRED");
}
export function replyAddress(token: string) {
  const domain = process.env.COMMERCIAL_REPLY_DOMAIN || (commercialLocal() ? "reponses.nova.test" : "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw new CommercialError("CONFIGURATION_REQUIRED");
  return `r-${token}@${domain}`;
}
function encryptionKey() {
  const key = Buffer.from(process.env.COMMERCIAL_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw new CommercialError("CONFIGURATION_REQUIRED");
  return key;
}
export function seal(value: unknown) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const bytes = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64");
}
export function unseal(value: string): unknown {
  const bytes = Buffer.from(value, "base64"), cipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8"));
}
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export function cents(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(normalized)) throw new CommercialError("INVALID_AMOUNT");
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export { money } from "./commercial-shared";
export const quoteInput = z.object({
  leadId: z.uuid(), parentId: z.uuid().optional(), title: z.string().trim().min(2).max(200),
  billingAddress: z.string().trim().min(5).max(1000), deliveryTime: z.string().trim().min(2).max(1000),
  billingName: z.string().trim().min(2).max(200), billingRegistrationNumber: z.string().trim().max(100).default(""), billingVatNumber: z.string().trim().max(100).default(""),
  terms: z.string().trim().min(10).max(10000), validityDays: z.coerce.number().int().min(1).max(180),
  items: z.array(z.object({ label: z.string().trim().min(2).max(200), description: z.string().trim().max(2000).default(""),
    quantity: z.coerce.number().int().min(1).max(1000), unitPrice: z.string(), taxBasisPoints: z.coerce.number().int().min(0).max(10000) })).min(1).max(30),
});
export function calculate(items: z.infer<typeof quoteInput>["items"]) {
  const lines = items.map((item) => {
    const unitCents = cents(item.unitPrice), subtotalCents = unitCents * item.quantity;
    if (unitCents <= 0 || subtotalCents > 100000000) throw new CommercialError("INVALID_AMOUNT");
    const taxCents = Math.round(subtotalCents * item.taxBasisPoints / 10000);
    return { label: item.label, description: item.description, quantity: item.quantity, unitCents, taxBasisPoints: item.taxBasisPoints, subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
  });
  const subtotalCents = lines.reduce((n, line) => n + line.subtotalCents, 0), taxCents = lines.reduce((n, line) => n + line.taxCents, 0);
  if (subtotalCents + taxCents > 100000000) throw new CommercialError("INVALID_AMOUNT");
  return { lines, subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
export const snapshotSchema = z.object({
  number: z.string(), title: z.string(), createdAt: z.string(), validUntil: z.string(), deliveryTime: z.string(), terms: z.string(),
  seller: z.object({ legalName: z.string().min(2), address: z.string().min(5), registrationNumber: z.string().min(2), vatNumber: z.string(), taxNote: z.string(), email: z.email().optional() }),
  buyer: z.object({ company: z.string(), name: z.string(), email: z.email(), address: z.string(), registrationNumber: z.string().default(""), vatNumber: z.string().default("") }),
  items: z.array(z.object({ label: z.string(), description: z.string(), quantity: z.number().int(), unitCents: z.number().int(), taxBasisPoints: z.number().int(), subtotalCents: z.number().int(), taxCents: z.number().int(), totalCents: z.number().int() })),
  subtotalCents: z.number().int(), taxCents: z.number().int(), totalCents: z.number().int(),
});
export type QuoteSnapshot = z.infer<typeof snapshotSchema>;
export const emailSchema = z.object({ from: z.string(), to: z.array(z.email()).min(1).max(1), subject: z.string().max(300), text: z.string().max(100000),
  html: z.string().max(500000).optional(),
  reply_to: z.string().optional(), headers: z.record(z.string(), z.string()).optional(),
  attachments: z.array(z.object({ filename: z.string().max(150), content: z.string().max(4000000), content_id: z.string().max(100).optional() })).max(1).optional(),
});
export type CommercialEmailPayload = z.infer<typeof emailSchema>;
