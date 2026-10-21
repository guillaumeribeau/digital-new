import { business, offer } from "@nova/shared/business";

export const budgetEuro = (cents: number) => new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 ? 2 : 0,
}).format(cents / 100);

// Editorial example, not a market benchmark or a named agency's quote.
const agencyCreationCents = 250000;
const agencyMonthlyCents = 3900;
const months = 36;
const zelywebTotalCents = offer.creationCents + months * offer.monthlyCents;
const agencyTotalCents = agencyCreationCents + months * agencyMonthlyCents;
const ttc = (ht: number) => Math.round(ht * (1 + business.taxBasisPoints / 10000));

export const budgetComparison = {
  months,
  agencyCreationCents,
  agencyMonthlyCents,
  zelywebTotalCents,
  agencyTotalCents,
  savingCents: agencyTotalCents - zelywebTotalCents,
  zelywebTotalTtcCents: offer.creationTtcCents + months * offer.monthlyTtcCents,
  agencyTotalTtcCents: ttc(agencyTotalCents),
  annualRows: [1, 2, 3].map(year => ({
    year,
    zelyweb: offer.creationCents + year * 12 * offer.monthlyCents,
    agency: agencyCreationCents + year * 12 * agencyMonthlyCents,
  })),
};

export const zelywebBudgetAdvantages = [
  { title: "Voir avant de payer", text: "Une première version complète est préparée gratuitement sur un aperçu privé. Vous décidez ensuite de commander." },
  { title: "Un budget accessible", text: `${budgetEuro(offer.creationCents)} HT de création, puis ${budgetEuro(offer.monthlyCents)} HT/mois de gestion. Les options sont chiffrées avant intervention.` },
  { title: "Un interlocuteur direct", text: "Vous échangez avec Zelyweb sur votre activité, vos contenus et vos demandes, à distance partout en France." },
  { title: "La technique prise en charge", text: `Hébergement et domaine jusqu’à ${budgetEuro(offer.domainAnnualCents)} HT/an sont compris dans l’abonnement obligatoire.` },
  { title: "Des ajustements prévus", text: "Trois séries de retours regroupés sous 30 jours après paiement, puis une modification de 15 minutes maximum par mois, non reportable." },
  { title: "Sans durée minimale", text: "Vous pouvez demander la résiliation à tout moment, avec effet à la fin de la période mensuelle déjà payée." },
];
