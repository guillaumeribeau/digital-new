import { CTA } from "../ui/cta";
export function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="container">
        <div>
          <p className="eyebrow">LE DÉCLIC, C’EST MAINTENANT.</p>
          <h2>
            Et si nous donnions
            <br />
            vie à <em>votre idée ?</em>
          </h2>
          <p>Commencez par voir. Décidez ensuite.</p>
          <CTA className="yellow" placement="final" />
          <small>Demande gratuite · Aucun paiement à cette étape</small>
        </div>
        <span className="final-star" aria-hidden="true">
          ✳︎
        </span>
      </div>
    </section>
  );
}
