type ContractConditions = {
 commitment: string | null;
 cancellation: string | null;
 includedRevisions: number | null;
 support: string | null;
 transfer: string | null;
 domainRenewal: string | null;
};
export const brand = {
  name: "NOVA",
  tagline: "Votre site internet, on s’occupe de tout.",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "",
  contactEmail: "",
  phone: "",
  socialLinks: [] as { label: string; url: string }[],
  legalIdentity: {
    companyName: "",
    legalForm: "",
    capital: "",
    address: "",
    registrationNumber: "",
    vatNumber: "",
    publicationDirector: "",
    hostingProvider: "Vercel (hébergeur envisagé, à confirmer)",
  },
  pricing: {
    creation: 299,
    monthly: 29,
    currency: "EUR",
    commitment: null,
    cancellation: null,
    includedRevisions: null,
    support: null,
    transfer: null,
    domainRenewal: null,
  } satisfies ContractConditions & { creation: number; monthly: number; currency: string },
};
export const firstYearTotal =
  brand.pricing.creation + 12 * brand.pricing.monthly;
export const money = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
