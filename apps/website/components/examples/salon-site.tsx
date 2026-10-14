import { DemoHeader, DemoContact, DemoFooter, Photo } from "./shared";
const links = [
  { label: "Le salon", href: "#salon" },
  { label: "Nos gestes", href: "#prestations" },
  { label: "Rendez-vous", href: "#contact" },
];
export function SalonSite() {
  return (
    <div className="ex-site ex-salon" id="accueil">
      <DemoHeader slug="coiffure" links={links} cta="Parlons de vos envies" />
      <section className="salon-hero ex-container">
        <div className="salon-hero-copy">
          <p className="ex-kicker">COIFFURE · COULEUR · EXPRESSION</p>
          <h1>
            Une allure.
            <br />
            <em>La vôtre.</em>
          </h1>
          <p>
            Une coupe qui accompagne votre visage.
            <br />
            Une couleur qui révèle votre caractère.
            <br />
            Un moment qui n’appartient qu’à vous.
          </p>
          <a href="#contact" className="ex-button">
            Prendre le temps d’en parler
          </a>
          <div className="salon-inset">
            <Photo
              slug="coiffure"
              role="detail"
              alt="Geste de coiffure et soin des cheveux au salon"
            />
            <span>
              Le détail
              <br />
              fait la différence.
            </span>
          </div>
        </div>
        <div className="salon-main-photo">
          <Photo
            slug="coiffure"
            alt="Intérieur lumineux et contemporain d’un salon de coiffure"
            preload
            sizes="(max-width: 767px) 100vw, 55vw"
          />
          <span>
            MAISON CAMILLE
            <br />
            <i>Un lieu pour se sentir soi.</i>
          </span>
        </div>
      </section>
      <div className="salon-wordmark" aria-hidden="true">
        MAISON CAMILLE
      </div>
      <section
        id="prestations"
        className="salon-services ex-container ex-section"
      >
        <div>
          <p className="ex-kicker">NOS GESTES</p>
          <h2>
            Écouter.
            <br />
            Imaginer.
            <br />
            <em>Révéler.</em>
          </h2>
          <p>
            Nous partons de vous : vos habitudes, vos envies, la nature de vos
            cheveux. Pour une coiffure qui vit bien, même après le salon.
          </p>
        </div>
        <div className="salon-service-list">
          {[
            [
              "La coupe",
              "Des lignes justes, un mouvement naturel et une coupe pensée pour votre quotidien.",
            ],
            [
              "La couleur",
              "Des nuances qui dialoguent avec votre teint, du changement subtil à une envie plus affirmée.",
            ],
            [
              "Le soin",
              "Un temps dédié à la matière, à la douceur et à l’attention portée à vos cheveux.",
            ],
            [
              "Le coiffage",
              "Une mise en forme pour le plaisir de tous les jours ou pour un moment particulier.",
            ],
          ].map(([t, p], i) => (
            <article key={t}>
              <span>0{i + 1}</span>
              <div>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
              <span aria-hidden="true">+</span>
            </article>
          ))}
        </div>
      </section>
      <section id="salon" className="salon-about">
        <div className="ex-container">
          <Photo
            slug="coiffure"
            role="about"
            alt="Travail sur une coupe et mise en forme des cheveux"
          />
          <div>
            <p className="ex-kicker">LE SALON</p>
            <h2>
              Une parenthèse.
              <br />
              Un nouveau regard.
            </h2>
            <p>
              Maison Camille, c’est l’envie d’un salon où l’on se sent accueilli
              avant même de s’asseoir. Un lieu calme, des échanges simples et le
              goût d’un travail précis.
            </p>
            <p>
              Nous prenons le temps de comprendre ce que vous aimez. Puis nous
              cherchons ensemble ce petit changement qui fait toute la
              différence.
            </p>
            <a href="#contact" className="ex-text-link">
              Préparer votre visite
            </a>
          </div>
        </div>
      </section>
      <DemoContact
        slug="coiffure"
        title="Quelle est votre prochaine envie ?"
        intro="Une idée de coupe, une nouvelle couleur ou simplement une question. Nous commençons par en parler."
      />
      <DemoFooter slug="coiffure" links={links} />
    </div>
  );
}
