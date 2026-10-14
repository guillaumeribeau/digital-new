import { Wind, Sun, Sprout } from "lucide-react";
import { DemoHeader, DemoContact, DemoFooter, Photo } from "./shared";
const links = [
  { label: "Les accompagnements", href: "#accompagnements" },
  { label: "La démarche", href: "#demarche" },
  { label: "Prenons contact", href: "#contact" },
];
export function WellnessSite() {
  return (
    <div className="ex-site ex-wellness" id="accueil">
      <DemoHeader slug="bien-etre" links={links} cta="Un premier échange" />
      <section className="wellness-hero ex-container">
        <div>
          <p className="ex-kicker">
            UN TEMPS POUR SOI · UN PAS VERS L’ÉQUILIBRE
          </p>
          <h1>
            Respirer.
            <br />
            <em>Se retrouver.</em>
            <br />
            Avancer.
          </h1>
          <p>
            Dans un quotidien qui va vite, nous vous proposons un espace pour
            ralentir, vous écouter et retrouver ce qui vous fait du bien.
          </p>
          <a className="ex-button" href="#contact">
            Prendre un temps pour moi
          </a>
          <span className="wellness-hero-note">
            À votre rythme. Avec simplicité.
          </span>
        </div>
        <div className="wellness-photo-composition">
          <Photo
            slug="bien-etre"
            alt="Lumière douce traversant un paysage naturel et une forêt"
            preload
            sizes="(max-width:767px) 90vw, 42vw"
          />
          <Photo
            slug="bien-etre"
            role="detail"
            alt="Espace intérieur paisible et lumineux consacré au bien-être"
            className="wellness-small-photo"
            sizes="(max-width:767px) 45vw, 20vw"
          />
          <span className="wellness-round-label">
            SOUFFLER
            <br />
            UN INSTANT
          </span>
        </div>
      </section>
      <section className="wellness-quote">
        <div className="ex-container">
          <p>
            Il n’est pas toujours nécessaire
            <br />
            d’aller plus vite.
            <br />
            <em>Parfois, il suffit de revenir à soi.</em>
          </p>
          <span>ÉQUILIBRE & SENS</span>
        </div>
      </section>
      <section
        id="accompagnements"
        className="wellness-services ex-container ex-section"
      >
        <div className="ex-section-head">
          <div>
            <p className="ex-kicker">LES ACCOMPAGNEMENTS</p>
            <h2>
              Des moments simples.
              <br />
              Une attention essentielle.
            </h2>
          </div>
          <p>
            Nous choisissons ensemble
            <br />
            ce qui correspond à vos attentes.
          </p>
        </div>
        <div className="wellness-service-grid">
          {[
            {
              Icon: Wind,
              t: "Respiration & relaxation",
              p: "Explorer des exercices doux pour faire une pause, porter attention à votre respiration et relâcher le rythme.",
            },
            {
              Icon: Sun,
              t: "Écoute & recentrage",
              p: "Un espace d’échange pour exprimer vos besoins, prendre du recul et repérer ce qui vous ressource.",
            },
            {
              Icon: Sprout,
              t: "Équilibre au quotidien",
              p: "Imaginer des habitudes simples et des temps de pause qui trouvent leur place dans votre vie de tous les jours.",
            },
          ].map(({ Icon, t, p }, i) => (
            <article key={t}>
              <Icon size={34} strokeWidth={1.2} />
              <span className="ex-kicker">0{i + 1}</span>
              <h3>{t}</h3>
              <p>{p}</p>
              <a className="ex-text-link" href="#contact">
                En parler ensemble
              </a>
            </article>
          ))}
        </div>
      </section>
      <section id="demarche" className="wellness-about ex-section">
        <div className="ex-container">
          <Photo
            slug="bien-etre"
            role="about"
            alt="Moment calme dans un environnement consacré à la détente"
          />
          <div>
            <p className="ex-kicker">LA DÉMARCHE</p>
            <h2>
              Vous accueillir
              <br />
              <em>comme vous êtes.</em>
            </h2>
            <p>
              Il n’y a pas une seule façon de se sentir bien. Nous commençons
              par écouter : vos envies, votre rythme, ce que vous souhaitez
              explorer.
            </p>
            <p>
              Sans objectif imposé, nous construisons des moments de respiration
              et de présence qui vous correspondent. Une démarche attentive,
              douce et ancrée dans votre quotidien.
            </p>
            <a className="ex-button" href="#contact">
              Faisons connaissance
            </a>
          </div>
        </div>
      </section>
      <DemoContact
        slug="bien-etre"
        title="Le premier pas peut être tout simple."
        intro="Une question, une envie de prendre du temps pour vous. Nous sommes là pour en parler, sans précipitation."
        form={false}
      />
      <DemoFooter slug="bien-etre" links={links} />
    </div>
  );
}
