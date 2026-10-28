import { business, defaultQuoteTerms, sellerDefaults } from "./business";

export type Brand = "zelyweb" | "tadapo";
export function brandOf(value: unknown): Brand {
  if (value === "zelyweb" || value === "tadapo") return value;
  throw new Error("INVALID_BRAND");
}
export const brands = {
  zelyweb: { name: "Zelyweb", domain: "zelyweb.com", email: "contact@zelyweb.com", color: "#2454ff" },
  tadapo: { name: "Tadapo", domain: "tadapo.com", email: "contact@tadapo.com", color: "#e15b2a" },
} as const;
type SellerDefaults = { legalName: string; terms: string; address: string; registrationNumber: string; vatNumber: string; taxNote: string; validityDays: number; reminderDays: number };
export function brandSellerDefaults(brand: Brand): SellerDefaults {
  const name = brands[brand].name;
  return { ...sellerDefaults, legalName: `Guillaume Ribeau EI — ${name}`,
    terms: defaultQuoteTerms.replaceAll("contact@zelyweb.com", brands[brand].email).replaceAll("Zelyweb", name) };
}
export function sellerForBrand(brand: Brand, saved: Partial<SellerDefaults> | null) {
  const defaults = brandSellerDefaults(brand), result = { ...defaults, ...saved };
  for (const key of ["legalName", "address", "registrationNumber", "vatNumber", "taxNote", "terms"] as const) {
    if (!result[key]?.trim()) result[key] = defaults[key];
  }
  return { ...result, email: brands[brand].email };
}
export function assertBrandContent(brand: Brand, text: string) {
  const other = brand === "tadapo" ? /zelyweb/i : /tadapo/i;
  if (other.test(text)) throw new Error("CROSS_BRAND_CONTENT");
}
export const legalBusiness = { ...business, legalName: "Guillaume Ribeau EI" };
