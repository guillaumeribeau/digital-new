import { offer } from "@nova/shared/business";
import { budgetComparison as comparison, budgetEuro as euros } from "@/content/budget-comparison";

export function BudgetComparison() {
  return (
    <section className="budget-comparison" aria-labelledby="comparison-title">
      <p className="eyebrow">CRÉATION + 36 MOIS DE GESTION</p>
      <h2 id="comparison-title">Deux budgets, sur la même durée.</h2>
      <p className="budget-scenario-note"><strong>Comparaison illustrative.</strong> L’offre Zelyweb est comparée à un scénario d’agence fictif : {euros(comparison.agencyCreationCents)} HT de création et {euros(comparison.agencyMonthlyCents)} HT/mois. Ce n’est ni un devis réel ni une moyenne des prix du marché.</p>
      <div className="budget-total-cards">
        <div className="budget-total-card budget-total-zelyweb"><p className="eyebrow">ZELYWEB</p><p className="budget-total">{euros(comparison.zelywebTotalCents)} <span>HT sur 3 ans</span></p><p>{euros(offer.creationCents)} HT + 36 × {euros(offer.monthlyCents)} HT</p><p className="budget-total-ttc">{euros(comparison.zelywebTotalTtcCents)} TTC</p></div>
        <div className="budget-total-card"><p className="eyebrow">AGENCE · SCÉNARIO FICTIF</p><p className="budget-total">{euros(comparison.agencyTotalCents)} <span>HT sur 3 ans</span></p><p>{euros(comparison.agencyCreationCents)} HT + 36 × {euros(comparison.agencyMonthlyCents)} HT</p><p className="budget-total-ttc">{euros(comparison.agencyTotalTtcCents)} TTC, TVA supposée de 20 %</p></div>
      </div>
      <div className="budget-saving"><strong>{euros(comparison.savingCents)} HT d’écart</strong><span>en faveur de Zelyweb, uniquement dans cet exemple sur trois ans.</span></div>
      <p className="budget-scenario-footnote">Calcul à tarifs constants, hors options et supplément de domaine. Les 36 mensualités commencent à l’activation de l’abonnement. Cette durée de comparaison n’est pas une durée d’engagement.</p>
    </section>
  );
}
