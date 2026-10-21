import { PageIntro } from "@/components/ui/page-intro";
import { steps } from "@/lib/content";
import { Reveal } from "@/components/animations/reveal";
import { CTA } from "@/components/ui/cta";
import { FinalCTA } from "@/components/sections/final-cta";
import { pageMetadata } from "@/lib/seo";
import { BrowserMockup } from "@/components/sections/browser-mockup";
import { ProjectWalkthrough } from "@/components/sections/project-walkthrough";
export const metadata = pageMetadata(
  "Comment ça marche — De votre idée à votre site",
  "Suivez un projet de salon de coiffure fictif : aperçu gratuit, paiement de création, ajustements, activation du premier mois et publication avec Zelyweb.",
  "/comment-ca-marche",
);
export default function How() {
  return (
    <>
      <PageIntro
        label="DE L’IDÉE À LA MISE EN LIGNE"
        title="Vous avancez."
        accent="Nous vous guidons."
        description="Pas de serveur à choisir. Pas de réglages techniques à apprendre. Nous vous expliquons chaque étape avec des mots simples."
      />
      <section className="container journey">
        {steps.map((s, i) => (
          <Reveal key={s.title} className="journey-step">
            <div className="journey-index">
              <span>0{i + 1}</span>
              <small>
                {
                  [
                    "LE POINT DE DÉPART",
                    "LE MOMENT DU DÉCLIC",
                    "LE GRAND DÉPART",
                  ][i]
                }
              </small>
            </div>
            <div className="journey-copy">
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              <p className="journey-detail">{s.detail}</p>
              {i === 0 && <CTA placement="process" />}
            </div>
            <div className={"journey-visual journey-visual-" + i}>
              {i === 0 ? (
                <div className="idea-note">
                  <span className="eyebrow">VOTRE ACTIVITÉ</span>
                  <strong>
                    Une histoire
                    <br />à raconter.
                  </strong>
                  <span className="idea-line" />
                  <span className="idea-line short" />
                  <span className="idea-star" aria-hidden="true">
                    ✳︎
                  </span>
                </div>
              ) : i === 1 ? (
                <BrowserMockup index={2} />
              ) : (
                <div className="launch-note">
                  <span aria-hidden="true">✓</span>
                  <strong>
                    Votre site
                    <br />
                    est en ligne.
                  </strong>
                  <small>
                    Un nouveau point de contact
                    <br />
                    pour votre activité.
                  </small>
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </section>
      <ProjectWalkthrough />
      <section className="container domain-note">
        <span className="eyebrow">VOTRE DOMAINE, UNE GESTION CLAIRE</span>
        <h2>
          Votre domaine, choisi ensemble.
          <br />
          Les démarches avec nous.
        </h2>
        <p>
          Nous vérifions avec vous la disponibilité, le prix d’achat et le renouvellement avant réservation. Le domaine est géré et payé par Zelyweb jusqu’à 20 € HT/an ; au-delà, votre accord est nécessaire pour un supplément annuel. Le code de transfert est remis gratuitement à votre départ, sous réserve des règles et délais du registre.
        </p>
        <p>Les nouveaux domaines sont enregistrés au nom de Zelyweb. Sur demande, nous organisons le changement de titulaire au bénéfice du client et, si nécessaire, le transfert vers un autre fournisseur, selon les règles du domaine concerné.</p>
      </section>
      <FinalCTA />
    </>
  );
}
