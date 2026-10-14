import { Check, Droplets, Wrench, Bath, ClipboardList } from "lucide-react";
import { DemoHeader, DemoContact, DemoFooter, Photo } from "./shared";
const links = [
  { label: "Nos prestations", href: "#prestations" },
  { label: "L’atelier", href: "#atelier" },
  { label: "Contact", href: "#contact" },
];
export function PlumberSite() {
  return (
    <div className="ex-site ex-plumber" id="accueil">
      <div className="plumber-utility">
        <div className="ex-container">
          <span>PLOMBERIE · INSTALLATION · RÉNOVATION</span>
          <span>Le soin du travail, du premier échange aux finitions.</span>
        </div>
      </div>
      <DemoHeader slug="plombier" links={links} cta="Demander un devis" />
      <section className="plumber-hero ex-container">
        <div className="plumber-hero-copy">
          <p className="ex-kicker">VOTRE MAISON EST ENTRE DE BONNES MAINS</p>
          <h1>
            La plomberie,
            <br />
            sans mauvaise
            <br />
            <em>surprise.</em>
          </h1>
          <p>
            Une fuite à réparer, une salle de bains à repenser, un équipement à
            remplacer. Nous vous aidons à trouver la bonne solution, simplement.
          </p>
          <a className="ex-button" href="#contact">
            Parlons de votre besoin
          </a>
          <div className="plumber-reassurance">
            <span>
              <Check size={15} /> Un devis expliqué
            </span>
            <span>
              <Check size={15} /> Un chantier soigné
            </span>
          </div>
        </div>
        <div className="plumber-hero-image">
          <Photo
            slug="plombier"
            alt="Salle de bains contemporaine avec équipements et robinetterie"
            preload
            sizes="(max-width: 767px) 100vw, 52vw"
          />
          <div className="plumber-image-label">
            <Droplets size={25} />
            <div>
              <strong>Le confort, jusque dans les détails.</strong>
              <span>Atelier Martin Plomberie</span>
            </div>
          </div>
        </div>
      </section>
      <section id="prestations" className="plumber-services ex-section">
        <div className="ex-container">
          <div className="ex-section-head">
            <div>
              <p className="ex-kicker">NOS PRESTATIONS</p>
              <h2>
                Pour les imprévus.
                <br />
                Et les projets qui comptent.
              </h2>
            </div>
            <p>
              Du petit dépannage à la rénovation,
              <br />
              une attention constante à votre confort.
            </p>
          </div>
          <div className="plumber-service-grid">
            {[
              {
                Icon: Wrench,
                title: "Dépannage & réparation",
                text: "Fuites, robinets, canalisations ou équipements défectueux : nous identifions le problème et vous expliquons l’intervention à prévoir.",
              },
              {
                Icon: Droplets,
                title: "Installation & remplacement",
                text: "Un nouvel évier, une robinetterie ou des sanitaires : nous préparons une installation adaptée à votre intérieur et à vos usages.",
              },
              {
                Icon: Bath,
                title: "Rénovation de salle de bains",
                text: "Nous vous accompagnons pour repenser votre espace, choisir les équipements et organiser les travaux de plomberie.",
              },
            ].map(({ Icon, title, text }, i) => (
              <article key={title}>
                <div>
                  <Icon size={31} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#contact">Décrire mon besoin</a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="atelier" className="plumber-about ex-section">
        <div className="ex-container">
          <Photo
            slug="plombier"
            role="about"
            alt="Travail de plomberie et intervention sur une installation"
          />
          <div>
            <p className="ex-kicker">L’ESPRIT DE L’ATELIER</p>
            <h2>
              Un métier technique.
              <br />
              Une relation simple.
            </h2>
            <p>
              Nous aimons les choses bien faites. Celles que l’on ne remarque
              plus au quotidien, parce qu’elles fonctionnent comme elles le
              devraient.
            </p>
            <p>
              Nous prenons le temps d’écouter, de vous expliquer les options et
              de préparer chaque intervention. Votre projet mérite autant de
              clarté que de soin.
            </p>
            <div className="plumber-about-point">
              <ClipboardList size={27} />
              <div>
                <strong>Avant de commencer, nous posons les choses.</strong>
                <p>
                  Le besoin, les étapes, le périmètre du devis. Vous savez où
                  vous allez.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="plumber-feature">
        <div className="ex-container">
          <div>
            <p className="ex-kicker">DE L’IDÉE AUX FINITIONS</p>
            <h2>
              Votre salle de bains,
              <br />
              pensée pour votre quotidien.
            </h2>
            <p>
              Un espace pratique, des équipements bien choisis et une
              installation soignée. Nous construisons votre projet autour de vos
              usages.
            </p>
            <a className="ex-button" href="#contact">
              Échanger sur mon projet
            </a>
          </div>
          <Photo
            slug="plombier"
            role="detail"
            alt="Détails d’un aménagement de salle de bains et de sa robinetterie"
          />
        </div>
      </section>
      <DemoContact
        slug="plombier"
        title="Un besoin ? Nous en parlons."
        intro="Décrivez votre situation ou votre projet. Ce premier échange nous aide à préparer une réponse adaptée."
      />
      <DemoFooter slug="plombier" links={links} />
    </div>
  );
}
