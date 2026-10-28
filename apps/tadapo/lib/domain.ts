import { z } from "zod";
import { tadapoPlans, type TadapoPlan } from "@nova/shared/tadapo";

export const domainName = z.string().trim().toLowerCase().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/);
const resultSchema = z.object({ domain: z.string(), available: z.boolean(), years: z.number().optional(), price: z.number().finite().nonnegative().optional(), renewalPrice: z.number().finite().nonnegative().optional(), premium: z.boolean().optional() });
export type DomainLookup = {
  domain: string; status: "available" | "unavailable" | "manual";
  provider: "vercel" | "manual"; checkedAt: string;
  registrationUsd?: number; renewalUsd?: number; premium?: boolean;
};
/** Public search only: never purchases, renews or alters a domain. */
export async function lookupDomain(input: string, request: typeof fetch = fetch): Promise<DomainLookup> {
  const domain = domainName.parse(input);
  const checkedAt = new Date().toISOString();
  const options = { cache: "no-store" as const, signal: AbortSignal.timeout(8000) };
  const supportedResponse = await request("https://api.vercel.com/v1/registrar/tlds/supported", options);
  if (!supportedResponse.ok) throw new Error("DOMAIN_PROVIDER_UNAVAILABLE");
  const supported = z.array(z.string()).parse(await supportedResponse.json());
  if (!supported.some(tld => domain.endsWith(`.${tld}`))) return { domain, status: "manual", provider: "manual", checkedAt };
  const response = await request("https://api.vercel.com/v1/registrar/domains/search", { ...options, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domains: [domain] }) });
  if (!response.ok) throw new Error("DOMAIN_PROVIDER_UNAVAILABLE");
  const data = z.object({ results: z.array(resultSchema) }).parse(await response.json());
  const result = data.results.find(value => value.domain === domain);
  if (!result || (result.available && (result.years !== 1 || result.price === undefined || result.renewalPrice === undefined))) throw new Error("DOMAIN_PROVIDER_INVALID_RESPONSE");
  return { domain, status: result.available ? "available" : "unavailable", provider: "vercel", checkedAt, ...(result.available ? { registrationUsd: result.price, renewalUsd: result.renewalPrice, premium: result.premium } : {}) };
}
/** Use only an approved EUR quote; USD search results are never treated as euros. */
export function domainContribution(plan: TadapoPlan, domain: string, actualHtCents: number) {
  if (!Number.isSafeInteger(actualHtCents) || actualHtCents < 0 || !domainName.safeParse(domain).success) throw new Error("INVALID_DOMAIN_QUOTE");
  const cap = tadapoPlans[plan].domainAnnualCapCents;
  return { actualHtCents, includedHtCents: Math.min(actualHtCents, cap), extraHtCents: Math.max(0, actualHtCents - cap) };
}
