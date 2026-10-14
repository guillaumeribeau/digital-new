import { PageIntro } from "@/components/ui/page-intro";
import { steps } from "@/lib/content";
import { Reveal } from "@/components/animations/reveal";
import { CTA } from "@/components/ui/cta";
import { FinalCTA } from "@/components/sections/final-cta";
import { pageMetadata } from "@/lib/seo";
import { BrowserMockup } from "@/components/sections/browser-mockup";
export const metadata = pageMetadata(
  "Comment ça marche — De votre idée à votre site",
  "Vous présentez votre activité, nous créons une première proposition gratuite. Après votre validation, nous prenons en charge la mise en ligne.",
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
      <section className="container domain-note">
        <span className="eyebrow">UNE ADRESSE QUI VOUS APPARTIENT</span>
        <h2>
          Le domaine à votre nom.
          <br />
          Les démarches avec nous.
        </h2>
        <p>
          Nous vous aidons à choisir une adresse disponible. Pour l’enregistrer
          à votre nom, nous vous demanderons les informations administratives
          nécessaires et votre validation. Nous préparons ensuite les réglages
          et la mise en ligne. Les modalités de renouvellement et de transfert
          seront confirmées avant commande.
        </p>
      </section>
      <FinalCTA />
    </>
  );
}
