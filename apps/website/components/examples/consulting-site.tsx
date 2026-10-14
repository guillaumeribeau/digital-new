import { Compass, Layers, Workflow } from "lucide-react";
import { DemoHeader, DemoContact, DemoFooter, Photo } from "./shared";
const links = [
  { label: "Nos expertises", href: "#expertises" },
  { label: "Notre approche", href: "#approche" },
  { label: "Le cabinet", href: "#cabinet" },
];
export function ConsultingSite() {
  return (
    <div className="ex-site ex-consulting" id="accueil">
      <DemoHeader slug="conseil" links={links} cta="Échangeons" />
      <section className="consulting-hero">
        <div className="ex-container">
          <div className="consulting-hero-copy">
            <p className="ex-kicker">CONSEIL EN STRATÉGIE & ORGANISATION</p>
            <h1>
              Une vision claire.
              <br />
              <em>
                Des décisions
                <br />
                qui avancent.
              </em>
            </h1>
            <p>
              Nous aidons les dirigeants à prendre du recul, à structurer leurs
              priorités et à transformer une ambition en actions concrètes.
            </p>
            <div>
              <a href="#contact" className="ex-button">
                Parlons de vos enjeux
              </a>
              <a href="#approche" className="ex-text-link">
                Notre approche
              </a>
            </div>
          </div>
          <div className="consulting-hero-image">
            <Photo
              slug="conseil"
              alt="Architecture et espace de travail d’un bureau contemporain"
              preload
              sizes="(max-width:767px) 100vw, 48vw"
            />
            <div className="consulting-photo-label">
              <span>HORIZON CONSEIL</span>
              <strong>
                Du recul.
                <br />
                Une direction.
              </strong>
            </div>
          </div>
        </div>
        <div className="consulting-principles ex-container">
          <span>Une lecture indépendante</span>
          <span>Un dialogue avec vos équipes</span>
          <span>Des recommandations concrètes</span>
        </div>
      </section>
      <section
        id="expertises"
        className="consulting-expertise ex-container ex-section"
      >
        <div className="ex-section-head">
          <div>
            <p className="ex-kicker">NOS EXPERTISES</p>
            <h2>
              Vos enjeux.
              <br />
              Notre point de départ.
            </h2>
          </div>
          <p>
            Nous construisons l’accompagnement
            <br />
            autour de votre situation.
          </p>
        </div>
        <div className="consulting-expertise-grid">
          {[
            {
              Icon: Compass,
              t: "Stratégie & développement",
              p: "Clarifier votre positionnement, explorer les possibilités et choisir une trajectoire cohérente avec vos ambitions.",
            },
            {
              Icon: Layers,
              t: "Organisation & pilotage",
              p: "Rendre les responsabilités lisibles, simplifier les façons de travailler et structurer les outils utiles à la décision.",
            },
            {
              Icon: Workflow,
              t: "Accompagnement du changement",
              p: "Donner du sens à la transformation et préparer les étapes avec les personnes qui la feront vivre.",
            },
          ].map(({ Icon, t, p }, i) => (
            <article key={t}>
              <div>
                <span>0{i + 1}</span>
                <Icon size={31} strokeWidth={1.2} />
              </div>
              <h3>{t}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="approche" className="consulting-method ex-section">
        <div className="ex-container">
          <div>
            <p className="ex-kicker">NOTRE APPROCHE</p>
            <h2>
              La méthode compte.
              <br />
              La relation aussi.
            </h2>
            <p>
              Nous privilégions des échanges directs et un cadre de travail
              compris par tous. Un regard extérieur, au service de votre
              réalité.
            </p>
            <Photo
              slug="conseil"
              role="detail"
              alt="Salle de réunion contemporaine avec une table de travail"
            />
          </div>
          <ol>
            {[
              [
                "Comprendre",
                "Nous écoutons les enjeux, rencontrons les personnes concernées et mettons en perspective la situation.",
              ],
              [
                "Construire",
                "Nous élaborons avec vous des pistes d’action, puis nous précisons les priorités et les étapes.",
              ],
              [
                "Accompagner",
                "Nous suivons l’avancement, éclairons les arbitrages et adaptons le travail aux besoins du terrain.",
              ],
            ].map(([t, p], i) => (
              <li key={t}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        id="cabinet"
        className="consulting-about ex-container ex-section"
      >
        <Photo
          slug="conseil"
          role="about"
          alt="Personnes échangeant autour d’une table de réunion"
        />
        <div>
          <p className="ex-kicker">L’ESPRIT DU CABINET</p>
          <h2>
            Un regard neuf.
            <br />
            Une implication concrète.
          </h2>
          <p>
            Nous croyons qu’un bon conseil ne se limite pas à une présentation.
            Il doit permettre de voir plus clair, de décider et de passer à
            l’action.
          </p>
          <p>
            Notre rôle : poser les bonnes questions et vous aider à construire
            des réponses qui tiennent compte de votre organisation.
          </p>
          <a className="ex-text-link" href="#contact">
            Ouvrir la discussion
          </a>
        </div>
      </section>
      <DemoContact
        slug="conseil"
        title="Quel horizon voulez-vous ouvrir ?"
        intro="Présentez-nous votre situation. Un premier échange permet d’identifier vos enjeux et la façon dont nous pourrions vous accompagner."
      />
      <DemoFooter slug="conseil" links={links} />
    </div>
  );
}
