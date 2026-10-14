import { HeartHandshake, Sprout, Users } from "lucide-react";
import { DemoHeader, DemoContact, DemoFooter, Photo } from "./shared";
const links = [
  { label: "L’association", href: "#association" },
  { label: "Nos actions", href: "#actions" },
  { label: "Participer", href: "#contact" },
];
export function CommunitySite() {
  return (
    <div className="ex-site ex-community" id="accueil">
      <DemoHeader
        slug="association"
        links={links}
        cta="Faire partie de l’aventure"
      />
      <section className="community-hero ex-container">
        <div>
          <p className="ex-kicker">UNE ASSOCIATION. DES ENVIES EN COMMUN.</p>
          <h1>
            Moins de chacun
            <br />
            pour soi.
            <br />
            <em>Plus de nous.</em>
          </h1>
          <p>
            Des rencontres, des coups de main et des projets partagés. Nous
            créons des occasions de faire ensemble, tout près de chez nous.
          </p>
          <a className="ex-button" href="#contact">
            Je veux participer
          </a>
          <a className="ex-text-link" href="#actions">
            Découvrir les actions
          </a>
        </div>
        <div className="community-hero-photo">
          <Photo
            slug="association"
            alt="Bénévoles réunis autour d’une action collective"
            preload
            sizes="(max-width:767px) 100vw, 50vw"
          />
          <span className="community-photo-note">
            On a tous
            <br />
            <strong>
              quelque chose
              <br />à partager.
            </strong>
          </span>
        </div>
      </section>
      <div className="community-ticker">
        <span>SE RENCONTRER</span>
        <HeartHandshake size={25} />
        <span>FAIRE ENSEMBLE</span>
        <Sprout size={25} />
        <span>CRÉER DU LIEN</span>
        <Users size={25} />
      </div>
      <section
        id="association"
        className="community-intro ex-container ex-section"
      >
        <p className="ex-kicker">ENSEMBLE & DEMAIN</p>
        <div>
          <h2>
            Le lien
            <br />
            <em>change tout.</em>
          </h2>
          <div>
            <p>
              Nous croyons aux petits gestes qui rapprochent. Un atelier où l’on
              apprend, un jardin où l’on se retrouve, un moment où l’on donne un
              peu de son temps.
            </p>
            <p>
              Notre association imagine des actions accessibles pour faire vivre
              la rencontre et l’entraide. Chacun peut y trouver sa place, avec
              ce qu’il est et ce qu’il aime partager.
            </p>
          </div>
        </div>
        <div className="community-values">
          <span>
            <Users size={24} /> Accueillir
          </span>
          <span>
            <HeartHandshake size={24} /> Partager
          </span>
          <span>
            <Sprout size={24} /> Agir ensemble
          </span>
        </div>
      </section>
      <section id="actions" className="community-actions ex-section">
        <div className="ex-container">
          <div className="ex-section-head">
            <div>
              <p className="ex-kicker">NOS ACTIONS</p>
              <h2>
                De belles raisons
                <br />
                de se retrouver.
              </h2>
            </div>
            <p>
              Des idées d’actions illustrées
              <br />
              dans ce site de démonstration.
            </p>
          </div>
          <div className="community-action-grid">
            <article>
              <Photo
                slug="association"
                role="detail"
                alt="Participants partageant une activité créative en atelier"
              />
              <div>
                <span className="ex-kicker">LES ATELIERS PARTAGÉS</span>
                <h3>Apprendre les uns des autres.</h3>
                <p>
                  Créer, bricoler, découvrir un savoir-faire. Des ateliers où
                  chacun apporte sa curiosité et repart avec un peu plus que ce
                  qu’il était venu chercher.
                </p>
                <a className="ex-text-link" href="#contact">
                  J’aimerais participer
                </a>
              </div>
            </article>
            <article>
              <Photo
                slug="association"
                role="about"
                alt="Personnes participant ensemble à un projet de jardinage"
              />
              <div>
                <span className="ex-kicker">LES PROJETS DE QUARTIER</span>
                <h3>
                  Les mains dans la terre.
                  <br />
                  Les idées en commun.
                </h3>
                <p>
                  Prendre soin d’un espace, planter, échanger. Des projets
                  simples pour faire grandir le lien autant que les plantes.
                </p>
                <a className="ex-text-link" href="#contact">
                  Mettons-nous en lien
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="community-invite ex-container">
        <div>
          <p className="ex-kicker">IL N’Y A PAS DE PETITE PARTICIPATION</p>
          <h2>
            Un peu de temps.
            <br />
            Une idée. Un coup de main.
          </h2>
          <p>
            Vous souhaitez proposer un atelier, rejoindre une action ou
            simplement nous rencontrer ? Nous commençons par une conversation.
          </p>
        </div>
        <a className="ex-button" href="#contact">
          Trouver ma place
        </a>
      </section>
      <DemoContact
        slug="association"
        title="La suite s’écrit ensemble."
        intro="Dites-nous ce qui vous donne envie de participer. Nous imaginons des occasions de nous retrouver autour d’envies communes."
      />
      <DemoFooter slug="association" links={links} />
    </div>
  );
}
