export const demos = [
  {
    id: "plombier",
    category: "Artisanat",
    name: "Flux",
    sector: "Plombier",
    eyebrow: "PLOMBERIE · CHAUFFAGE",
    title: "Le bon geste. Au bon moment.",
    desc: "Une fuite, un projet, une installation. Une solution claire pour votre maison.",
    theme: "flux",
    symbol: "↗︎",
  },
  {
    id: "paysagiste",
    category: "Artisanat",
    name: "Sylve",
    sector: "Paysagiste",
    eyebrow: "PAYSAGES VIVANTS",
    title: "Un jardin qui vous ressemble.",
    desc: "Nous imaginons des espaces à vivre, au rythme des saisons.",
    theme: "sylve",
    symbol: "✳︎",
  },
  {
    id: "coiffure",
    category: "Commerce",
    name: "Studio 03",
    sector: "Salon de coiffure",
    eyebrow: "COIFFURE & EXPRESSION",
    title: "Vos cheveux. Votre signature.",
    desc: "Une coupe, une couleur, un nouveau regard. Prenez un moment pour vous.",
    theme: "studio",
    symbol: "03",
  },
  {
    id: "conseil",
    category: "Indépendants",
    name: "Clair",
    sector: "Cabinet de conseil",
    eyebrow: "CONSEIL EN STRATÉGIE",
    title: "La suite commence ici.",
    desc: "Du recul, une direction et des actions concrètes pour vos projets.",
    theme: "clair",
    symbol: "+",
  },
  {
    id: "bien-etre",
    category: "Professions libérales",
    name: "Équilibre",
    sector: "Professionnel du bien-être",
    eyebrow: "UN TEMPS POUR SOI",
    title: "Revenir à l’essentiel.",
    desc: "Un accompagnement à votre rythme pour retrouver votre équilibre.",
    theme: "equilibre",
    symbol: "○",
  },
  {
    id: "association",
    category: "Associations",
    name: "Ensemble",
    sector: "Association",
    eyebrow: "LE COLLECTIF EN ACTION",
    title: "De petits gestes. De grands liens.",
    desc: "Des rencontres et des initiatives pour faire vivre notre quartier.",
    theme: "ensemble",
    symbol: "✺",
  },
];
export function BrowserMockup({
  index = 0,
  hero = false,
}: {
  index?: number;
  hero?: boolean;
}) {
  const d = demos[index];
  return (
    <div
      className={"browser-mockup " + d.theme + (hero ? " hero-browser" : "")}
    >
      <div className="browser-bar">
        <span className="browser-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="browser-address">
          {d.name.toLowerCase().replaceAll(" ", "")}.exemple
        </span>
        <span className="browser-plus">+</span>
      </div>
      <div className="mock-site">
        <div className="mock-nav">
          <strong>
            {d.name}
            <sup>®</sup>
          </strong>
          <span>
            Le studio &nbsp; Nos services &nbsp; <b>Contact</b>
          </span>
        </div>
        <div className="mock-content">
          <div>
            <span className="mock-eyebrow">{d.eyebrow}</span>
            <p className="mock-title">{d.title}</p>
            <p>{d.desc}</p>
            <span className="mock-button">
              {index === 2
                ? "Prendre rendez-vous"
                : index === 5
                  ? "Nous rejoindre"
                  : "Parlons de votre projet"}
            </span>
          </div>
          <div className="mock-art" aria-hidden="true">
            <span>{d.symbol}</span>
            <div className="art-lines" />
          </div>
        </div>
        <div className="mock-bottom">
          <span>Un savoir-faire qui fait la différence.</span>
          <span>Proximité · Écoute · Soin</span>
        </div>
      </div>
    </div>
  );
}
