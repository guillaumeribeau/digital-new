import { business, offer } from "@nova/shared/business";
type ContractConditions = {
 commitment: string | null;
 cancellation: string | null;
 includedRevisions: number | null;
 support: string | null;
 transfer: string | null;
 domainRenewal: string | null;
};
export const brand = {
  name: "Zelyweb",
  tagline: "Votre site internet, on s’occupe de tout.",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "https://zelyweb.com",
  contactEmail: business.email,
  phone: business.phone as string,
  socialLinks: [] as { label: string; url: string }[],
  legalIdentity: {
    companyName: business.legalName,
    legalForm: business.legalForm,
    capital: "",
    address: business.address,
    registrationNumber: business.siret,
    vatNumber: business.vatNumber,
    publicationDirector: "Guillaume Ribeau",
    hostingProvider: "Railway",
  },
  pricing: {
    creation: offer.creationCents / 100,
    monthly: offer.monthlyCents / 100,
    currency: "EUR",
    commitment: "Sans durée minimale ; abonnement requis à la mise en ligne",
    cancellation: "À tout moment, à la fin de la période mensuelle déjà payée",
    includedRevisions: 3,
    support: "Une modification regroupée de 15 minutes maximum par mois, non reportable",
    transfer: "Fichiers et code de transfert gratuits ; migration facultative à 150 € HT",
    domainRenewal: "20 € HT/an inclus ; supplément annuel accepté au préalable au-delà",
  } satisfies ContractConditions & { creation: number; monthly: number; currency: string },
};
export const firstYearTotal =
  brand.pricing.creation + 12 * brand.pricing.monthly;
export const money = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
