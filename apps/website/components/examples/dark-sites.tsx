import { ArrowDown, ArrowUpRight, Check, Sparkles, ShieldCheck, Droplets } from "lucide-react";
import { DemoHeader, DemoContact, DemoFooter, Photo } from "./shared";

const restaurantLinks = [
  { label: "Notre table", href: "#table" },
  { label: "La carte", href: "#carte" },
  { label: "Nous trouver", href: "#contact" },
];
export function RestaurantSite() {
  return <div className="ex-site ex-dark ex-restaurant" id="accueil">
    <DemoHeader slug="restaurant" links={restaurantLinks} cta="Une table pour vous" />
    <section className="braises-hero ex-container">
      <div className="braises-hero-copy">
        <p className="ex-kicker">CUISINE DE SAISON · LE PLAISIR DU FEU</p>
        <h1>Le goût<br />des choses<br /><em>vraies.</em></h1>
        <p>Une cuisine vivante. Des produits choisis.<br />Et le temps de savourer ce qui nous rassemble.</p>
        <a className="ex-button" href="#carte">Découvrir notre cuisine <ArrowUpRight size={17} /></a>
        <span className="braises-signature">À partager, tout simplement.</span>
      </div>
      <div className="braises-hero-scene">
        <Photo slug="restaurant" alt="Salle de restaurant aux tables en bois et lumières tamisées" preload sizes="(max-width: 767px) 100vw, 48vw" />
        <span className="braises-scene-note">LA TABLE<br /><i>Un lieu. Des rencontres.</i></span>
        <div className="braises-food-inset"><Photo slug="restaurant" role="detail" alt="Assiette gastronomique sur fond sombre, sauce et herbes fraîches" /><span>La saison<br />dans l’assiette.</span></div>
      </div>
    </section>
    <div className="dark-ticker"><span>Du produit à l’assiette</span><i>✳</i><span>Le goût avant tout</span><i>✳</i><span>Une cuisine à partager</span></div>
    <section id="table" className="ex-container ex-section braises-story">
      <Photo slug="restaurant" role="about" alt="Chaises en bois et ambiance intimiste d’une salle de restaurant" />
      <div><p className="ex-kicker">UNE TABLE, UNE INTENTION</p><h2>Bien manger.<br /><em>Se sentir bien.</em></h2><p>Nous aimons les belles tablées, les conversations qui durent et cette première bouchée qui fait sourire. Notre cuisine suit le rythme des saisons, avec une attention particulière portée aux produits.</p><p>Dans une salle chaleureuse, on vient pour un déjeuner, une soirée à deux ou le plaisir de se retrouver. Le reste se passe autour de la table.</p><a className="ex-text-link" href="#contact">Préparer votre venue</a></div>
    </section>
    <section id="carte" className="braises-menu ex-section"><div className="ex-container">
      <div className="ex-section-head"><div><p className="ex-kicker">L’INSPIRATION DU MOMENT</p><h2>La saison donne<br /><em>le ton.</em></h2></div><p>Une carte courte, des associations franches et des assiettes pensées pour le plaisir. Carte fictive, présentée à titre d’illustration.</p></div>
      <div className="braises-menu-list">{[
        ["Pour commencer", "Légumes rôtis, crème légère et herbes du jardin", "Le végétal, tout en douceur."],
        ["Autour du feu", "Pièce du moment, jus réduit et garniture de saison", "Une cuisson juste, un goût franc."],
        ["Pour prolonger", "Fruit de saison, biscuit croustillant et crème vanillée", "Une dernière note à partager."],
      ].map(([label,title,note],i)=><article key={label}><span>0{i+1} / {label}</span><div><h3>{title}</h3><p>{note}</p></div><ArrowUpRight size={24} /></article>)}</div>
    </div></section>
    <DemoContact slug="restaurant" title="On vous garde une place ?" intro="Une occasion particulière, une envie de venir à plusieurs ou une question sur la carte ? Ce formulaire illustre une demande de table ; il ne permet aucune réservation réelle." />
    <DemoFooter slug="restaurant" links={restaurantLinks} />
  </div>;
}

const photographerLinks = [
  { label: "Les séries", href: "#series" },
  { label: "Le regard", href: "#regard" },
  { label: "Un projet ?", href: "#contact" },
];
export function PhotographerSite() {
  return <div className="ex-site ex-dark ex-photographer" id="accueil">
    <DemoHeader slug="photographe" links={photographerLinks} cta="Parlons d’une image" />
    <section className="noe-hero ex-container">
      <div className="noe-hero-meta"><p className="ex-kicker">PHOTOGRAPHIE D’ARCHITECTURE & D’ESPACES</p><span>REGARD INDÉPENDANT<br />DISPONIBLE POUR VOS PROJETS</span></div>
      <h1>La lumière.<br /><em>Le silence.</em></h1>
      <div className="noe-hero-bottom"><p>Photographier les lieux.<br />Révéler ce qui les rend singuliers.</p><a href="#series" aria-label="Découvrir les séries photographiques"><ArrowDown size={30} /></a><span>NOÉ LAURENT<br />PHOTOGRAPHE</span></div>
      <Photo slug="photographe" alt="Façade géométrique d’un immeuble photographiée en noir et blanc" preload sizes="100vw" />
      <div className="noe-caption"><span>01 / LIGNES URBAINES</span><span>ARCHITECTURE · LUMIÈRE · MATIÈRE</span></div>
    </section>
    <section id="series" className="ex-section ex-container noe-series">
      <div className="ex-section-head"><div><p className="ex-kicker">UNE SÉLECTION DE REGARDS</p><h2>Ce que les lieux<br /><em>racontent.</em></h2></div><p>Des lignes, des ombres et des détails. Trois directions visuelles pour regarder autrement les espaces qui nous entourent.</p></div>
      <div className="noe-series-grid">
        <article><Photo slug="photographe" role="detail" alt="Façades en noir et blanc, lignes répétées et ombres profondes" /><div><h3>Habiter la lumière</h3><span>01 / ESPACES & OMBRES</span></div></article>
        <article><Photo slug="photographe" role="about" alt="Détail abstrait d’une façade moderne aux motifs géométriques" /><div><h3>La géométrie du calme</h3><span>02 / FORMES & MATIÈRES</span></div></article>
      </div>
    </section>
    <section id="regard" className="noe-statement ex-container ex-section"><p className="ex-kicker">LE REGARD</p><h2>Une image n’explique pas tout.<br /><em>Elle donne envie de regarder.</em></h2><div><span>ARCHITECTES<br />CRÉATEURS DE LIEUX<br />MARQUES & ÉDITIONS</span><p>Mon approche part de l’écoute : comprendre votre intention, observer les lieux, puis chercher le point de vue qui leur ressemble. Des images précises, sensibles, pensées pour votre communication et vos publications. Les photographies de cette démonstration sont des illustrations créditées, sans lien avec un photographe réel.</p></div></section>
    <DemoContact slug="photographe" title="Et si on regardait ensemble ?" intro="Un lieu à révéler, une série à imaginer ou un projet à raconter. Quelques mots suffisent pour ouvrir la conversation dans cette démonstration." />
    <DemoFooter slug="photographe" links={photographerLinks} />
  </div>;
}

const automotiveLinks = [
  { label: "Les soins", href: "#soins" },
  { label: "L’atelier", href: "#atelier" },
  { label: "Votre projet", href: "#contact" },
];
export function AutomotiveSite() {
  return <div className="ex-site ex-dark ex-automotive" id="accueil">
    <DemoHeader slug="automobile" links={automotiveLinks} cta="Parlons de votre véhicule" />
    <section className="minuit-hero">
      <Photo slug="automobile" alt="Coupé noir aux lignes soignées devant la porte d’un atelier automobile" preload sizes="100vw" />
      <div className="minuit-hero-shade" />
      <div className="ex-container minuit-hero-copy"><p className="ex-kicker"><span /> PRÉPARATION & ESTHÉTIQUE AUTOMOBILE</p><h1>Chaque<br />reflet<br /><em>compte.</em></h1><p>La précision du geste.<br />Le plaisir de retrouver votre véhicule.</p><a className="ex-button" href="#soins">Découvrir les soins <ArrowUpRight size={18} /></a></div>
      <div className="minuit-hero-bottom ex-container"><span>ATELIER MINUIT / LE SOIN DU DÉTAIL</span><span>01 — NETTOYER<br />02 — CORRIGER<br />03 — PROTÉGER</span></div>
    </section>
    <section id="soins" className="ex-section ex-container">
      <div className="ex-section-head"><div><p className="ex-kicker">À CHAQUE VÉHICULE, SON ATTENTION</p><h2>Le détail fait<br /><em>la différence.</em></h2></div><p>Nous observons l’état du véhicule et vos attentes avant de proposer un soin adapté. De l’entretien soigné à une préparation plus approfondie.</p></div>
      <div className="minuit-care-grid">{[
        { Icon:Droplets, title:"Retrouver l’essentiel", label:"01 / NETTOYAGE", text:"Un nettoyage intérieur et extérieur attentif aux matières, aux recoins et aux finitions." },
        { Icon:Sparkles, title:"Révéler la matière", label:"02 / CORRECTION", text:"Une préparation et un polissage étudiés selon l’état de la carrosserie et le résultat recherché." },
        { Icon:ShieldCheck, title:"Préserver le résultat", label:"03 / PROTECTION", text:"Des solutions de protection et des conseils d’entretien pour prendre soin du véhicule au quotidien." },
      ].map(({Icon,title,label,text})=><article key={label}><span>{label}</span><Icon size={34} strokeWidth={1.2}/><h3>{title}</h3><p>{text}</p><a href="#contact" className="ex-text-link">Échanger sur ce soin <ArrowUpRight size={15}/></a></article>)}</div>
    </section>
    <section id="atelier" className="minuit-workshop ex-section"><div className="ex-container">
      <div className="minuit-workshop-photos"><Photo slug="automobile" role="detail" alt="Polissage d’une carrosserie dans un atelier de préparation automobile" /><Photo slug="automobile" role="about" alt="Détail du phare et de la carrosserie brillante d’une voiture noire" /></div>
      <div><p className="ex-kicker">L’ATELIER</p><h2>Du temps.<br />De la méthode.<br /><em>Du soin.</em></h2><p>Chaque surface mérite un geste adapté. Nous privilégions une préparation méthodique, des échanges clairs et l’attention portée à ce que l’on voit comme à ce que l’on ne voit pas.</p><ul>{["Un échange avant toute intervention", "Une préparation adaptée à votre véhicule", "Des conseils pour prolonger le soin"].map(text=><li key={text}><Check size={16}/>{text}</li>)}</ul></div>
    </div></section>
    <DemoContact slug="automobile" title="Votre véhicule, notre prochaine attention." intro="Présentez votre véhicule et le soin que vous imaginez. Ce formulaire est un exemple fictif : aucun devis réel n’est demandé et aucun rendez-vous n’est pris." />
    <DemoFooter slug="automobile" links={automotiveLinks} />
  </div>;
}
