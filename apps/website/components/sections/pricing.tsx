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
            <p>À partir de · Paiement si vous commandez</p>
            <ul>
              {[
                "Un site vitrine one-page à votre image",
                "Un design adapté au mobile",
                "Vos services, vos contenus et vos contacts",
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
            <p>Un coût récurrent, annoncé dès le départ</p>
            <ul>
              {[
                "Hébergement de votre site",
                "Nom de domaine standard",
                "Maintenance technique",
                "Gestion de la mise en ligne",
              ].map((v) => (
                <li key={v}>
                  <Check size={17} />
                  {v}
                </li>
              ))}
            </ul>
            <p className="price-conditions">
              Sous réserve des conditions contractuelles définitives.
              Engagement, résiliation, support et renouvellement à confirmer
              avant commande.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
