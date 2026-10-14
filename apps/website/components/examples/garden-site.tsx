import { DemoHeader, DemoContact, DemoFooter, Photo } from "./shared";
const links = [
  { label: "Notre savoir-faire", href: "#savoir-faire" },
  { label: "Notre regard", href: "#regard" },
  { label: "Votre projet", href: "#contact" },
];
export function GardenSite() {
  return (
    <div className="ex-site ex-garden" id="accueil">
      <DemoHeader
        slug="paysagiste"
        links={links}
        cta="Imaginons votre jardin"
      />
      <section className="garden-hero">
        <Photo
          slug="paysagiste"
          alt="Jardin paysager verdoyant aménagé autour d’une maison"
          preload
          sizes="100vw"
        />
        <div className="garden-hero-shade" />
        <div className="ex-container garden-hero-content">
          <p className="ex-kicker">PAYSAGES & JARDINS À VIVRE</p>
          <h1>
            Le jardin,
            <br />
            une autre façon
            <br />
            <em>d’habiter.</em>
          </h1>
          <div>
            <p>
              Des espaces sensibles et vivants.
              <br />
              Des lieux où l’on aime rester.
            </p>
            <a className="ex-button" href="#savoir-faire">
              Découvrir notre univers
            </a>
          </div>
        </div>
        <span className="garden-hero-footnote">
          LES JARDINS D’ARTHUR · CRÉATION & ENTRETIEN
        </span>
      </section>
      <section className="garden-intro ex-container ex-section">
        <p className="ex-kicker">L’EXTÉRIEUR MÉRITE AUTANT QUE L’INTÉRIEUR</p>
        <div>
          <h2>
            Un jardin ne se regarde pas seulement.
            <br />
            <em>Il se vit.</em>
          </h2>
          <p>
            Prendre le café au soleil. Trouver un coin d’ombre. Voir les saisons
            changer. Nous dessinons votre jardin à partir de ces moments
            simples, de votre terrain et de vos envies.
          </p>
        </div>
      </section>
      <section id="savoir-faire" className="garden-services ex-section">
        <div className="ex-container">
          <div className="garden-service-photo">
            <Photo
              slug="paysagiste"
              role="detail"
              alt="Terrasse et espace extérieur aménagé pour profiter du jardin"
            />
            <span>01 / DES ESPACES À PARTAGER</span>
          </div>
          <div className="garden-service-copy">
            <p className="ex-kicker">NOTRE SAVOIR-FAIRE</p>
            <h2>
              Composer avec le lieu.
              <br />
              Révéler ses possibilités.
            </h2>
            {[
              [
                "Imaginer & concevoir",
                "Une composition adaptée à votre terrain, à vos usages et aux ambiances que vous aimez.",
              ],
              [
                "Aménager & planter",
                "Végétaux, cheminements, terrasses : nous donnons forme à un extérieur cohérent et accueillant.",
              ],
              [
                "Entretenir & accompagner",
                "Des gestes attentifs au fil des saisons pour préserver le caractère et la vitalité de votre jardin.",
              ],
            ].map(([t, p], i) => (
              <article key={t}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="regard" className="garden-about ex-section">
        <div className="ex-container">
          <div>
            <p className="ex-kicker">NOTRE REGARD</p>
            <h2>
              Le goût des lieux.
              <br />
              <em>Le respect du vivant.</em>
            </h2>
            <p>
              Chaque jardin commence par une rencontre. Avec vous, avec un
              paysage, avec une lumière particulière.
            </p>
            <p>
              Nous cherchons l’équilibre entre les lignes et les matières, les
              envies et les contraintes. Des aménagements qui trouvent
              naturellement leur place, plutôt qu’un décor imposé au terrain.
            </p>
            <a href="#contact" className="ex-text-link">
              Parlons de votre extérieur
            </a>
          </div>
          <Photo
            slug="paysagiste"
            role="about"
            alt="Végétation et composition d’un jardin verdoyant"
          />
        </div>
      </section>
      <DemoContact
        slug="paysagiste"
        title="Et si nous imaginions votre jardin ?"
        intro="Un terrain, une terrasse, une envie de changement. Racontez-nous ce qui vous ferait aimer encore davantage votre extérieur."
      />
      <DemoFooter slug="paysagiste" links={links} />
    </div>
  );
}
