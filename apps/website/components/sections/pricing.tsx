import Link from "@/components/ui/tracked-link";
import { Check } from "lucide-react";
import { brand, money } from "@/config/brand.config";
import { CTA } from "../ui/cta";
export function Pricing() {
  return (
    <section className="pricing-section section">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">06 / LES PRIX, EN CLAIR</p>
            <h2>
              Un beau site.
              <br />
              <span className="blue-text">Un prix qui a du sens.</span>
            </h2>
          </div>
          <p>
            La création d’un côté.
            <br />
            La tranquillité au quotidien de l’autre.
          </p>
        </div>
        <div className="price-grid">
          <div className="price-card creation">
            <span className="eyebrow">POUR DONNER VIE À VOTRE SITE</span>
            <h3>La création.</h3>
            <p className="price-number">
              <span>{money(brand.pricing.creation)} €</span> HT
            </p>
            <p>358,80 € TTC · Après acceptation du premier site</p>
            <ul>
              {[
                "Un site vitrine de cinq pages à votre image",
                "Un design adapté au mobile",
                "Trois séries de retours incluses sous 30 jours",
                "Les fondamentaux techniques du référencement",
              ].map((v) => (
                <li key={v}>
                  <Check size={17} />
                  {v}
                </li>
              ))}
            </ul>
            <CTA placement="pricing" className="dark" />
          </div>
          <div className="price-card management">
            <span className="eyebrow">POUR NOUS CONFIER LA TECHNIQUE</span>
            <h3>La gestion.</h3>
            <p className="price-number">
              <span>{money(brand.pricing.monthly)} €</span> HT
              <span className="per-month"> / mois</span>
            </p>
            <p>34,80 € TTC/mois · Dès la mise en ligne</p>
            <ul>
              {[
                "Hébergement de votre site",
                "Domaine jusqu’à 20 € HT/an",
                "Une modification de 15 min maximum par mois",
                "Sans durée minimale d’engagement",
              ].map((v) => (
                <li key={v}>
                  <Check size={17} />
                  {v}
                </li>
              ))}
            </ul>
            <p className="price-conditions">
              Abonnement obligatoire à activer avant la publication, résiliable à tout moment pour la fin de la période payée. Temps non reportable. Supplément annuel de domaine uniquement avec votre accord. TVA 20 %.
            </p>
          </div>
        </div>
        <p className="pricing-details-link"><Link href="/conditions-generales">Consulter les conditions de l’offre, la résiliation et le transfert →</Link></p>
      </div>
    </section>
  );
}
