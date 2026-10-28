/** Public catalogue. Prices and entitlements used by the UI and future order backend. */
export const tadapoOfferVersion = "tadapo-v6-2026-10-28";
export type TadapoPlan = "essentiel" | "business";
export type TadapoTerm = "12" | "monthly";
export const tadapoPlans = {
  essentiel: { name: "Essentiel", pages: 1, modifications: 1, domainAnnualCapCents: 2000,
    googleBusinessProfile: false, prioritySupport: false,
    tagline: "L’essentiel pour être visible et contacté.",
    monthlyCents: { "12": 3900, monthly: 4900 },
    features: ["Site vitrine une page, design personnalisé", "Version mobile soignée", "Nom de domaine à votre nom, inclus jusqu’à 20 € HT/an", "Hébergement sécurisé et maintenance", "Formulaire de contact et bouton d’appel", "Référencement Google de base", "1 modification par mois"],
  },
  business: { name: "Business", pages: 5, modifications: 3, domainAnnualCapCents: 2000,
    googleBusinessProfile: true, prioritySupport: true,
    tagline: "Plus de place pour raconter votre activité.",
    monthlyCents: { "12": 6900, monthly: 8500 },
    features: ["Site jusqu’à 5 pages, design personnalisé", "Version mobile soignée", "Nom de domaine inclus jusqu’à 20 € HT/an, à votre nom", "Hébergement sécurisé et maintenance", "Formulaire de contact et bouton d’appel", "Référencement Google de base", "3 modifications par mois", "Une page par service + page avis, dans la limite des 5 pages", "Création de votre fiche Google*", "Support prioritaire"],
  },
} as const;
export const tadapoMoney = (cents: number, minimumFractionDigits = 0) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits, maximumFractionDigits: 2 }).format(cents / 100);
export function tadapoOffer(plan: TadapoPlan, term: TadapoTerm) {
  const data = tadapoPlans[plan];
  const htCents = data.monthlyCents[term];
  return { brand: "tadapo" as const, version: tadapoOfferVersion, plan, term,
    name: data.name, htCents, ttcCents: Math.round(htCents * 1.2), creationCents: 0,
    currency: "EUR" as const, interval: "month" as const,
    minimumMonths: term === "12" ? 12 : 0, pages: data.pages,
    modifications: data.modifications, domainAnnualCapCents: data.domainAnnualCapCents,
    googleBusinessProfile: data.googleBusinessProfile, prioritySupport: data.prioritySupport,
    features: [...data.features],
    termsVersion: "2026-10-28-v6", unusedModificationsCarryOver: false,
    initialRevisionRounds: 3, clientHostingProvider: "vercel" as const,
    domainBillingInterval: "year" as const, mailboxIncluded: false, emailForwardingIncluded: false,
  };
}
export type TadapoOffer = ReturnType<typeof tadapoOffer>;
export const tadapoStages = {
  CONTENT_PREPARATION: "Dossier à compléter", CREATION: "En création", PREVIEW_SENT: "Version envoyée",
  REVIEW: "Corrections", APPROVED: "Validation client reçue", PUBLISHED: "En ligne",
} as const;
export function tadapoAgreement(offer: TadapoOffer) {
  return `Je commande l’offre Tadapo ${offer.name} à ${tadapoMoney(offer.htCents, 2)} € HT (${tadapoMoney(offer.ttcCents, 2)} € TTC) par mois, avec 0 € de frais de création. Le premier mois est payé maintenant, puis le prélèvement se renouvelle chaque mois à la date de commande. ${offer.minimumMonths ? "Engagement initial de 12 mois ; une demande de résiliation prend effet au terme initial, puis à une échéance mensuelle." : "Sans engagement de durée ; résiliation à la fin de la période mensuelle payée."} ${offer.pages} page(s) maximum, ${offer.modifications} modification(s) par mois, non reportables. Trois séries de retours regroupés sont incluses dans les 30 jours suivant l’envoi de la première version. Première version sous 72 h ouvrées après dossier complet et paiement. ${offer.domainAnnualCapCents ? "Domaine inclus jusqu’à 20 € HT/an, supplément approuvé séparément." : "Domaine en supplément au prix réel approuvé."} L’achat du domaine est manuel, à mon nom, après accord ; aucun supplément n’est prélevé automatiquement. Ni boîte mail ni redirection e-mail incluses. J’accepte les conditions générales version ${offer.termsVersion}.`;
}
/** Calendar months, clamped to the last day, matching monthly anniversary semantics. */
export function tadapoAnniversary(start: Date, months: number) {
  const value = new Date(start); const day = value.getUTCDate();
  value.setUTCDate(1); value.setUTCMonth(value.getUTCMonth() + months);
  const last = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, last)); return value;
}
export function tadapoSelection(plan: unknown, term: unknown): { plan: TadapoPlan; term: TadapoTerm } {
  return { plan: plan === "business" ? "business" : "essentiel", term: term === "monthly" ? "monthly" : "12" };
}
export function tadapoOrderPath(plan: TadapoPlan, term: TadapoTerm) {
  return `/commande?offre=${plan}&engagement=${term}`;
}
