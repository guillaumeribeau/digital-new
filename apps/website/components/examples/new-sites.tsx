import { ArrowUpRight, Check, MoveRight } from "lucide-react";
import { examples } from "@/lib/examples";
import { DemoContact, DemoFooter, DemoHeader, Photo } from "./shared";

const content = {
  electricien: {
    eyebrow: "ÉLECTRICITÉ · RÉNOVATION · ÉCLAIRAGE", title: "Votre intérieur, sous un nouveau jour.",
    intro: "De la rénovation du tableau aux derniers luminaires, un interlocuteur pour penser une installation adaptée à votre quotidien.",
    cta: "Parlons de votre installation", label: "BIEN PENSÉ. BIEN INSTALLÉ.",
    services: [["Rénover", "Repenser les circuits et le tableau électrique lors de la rénovation de votre logement."], ["Éclairer", "Choisir des points lumineux qui mettent en valeur vos pièces et vos usages."], ["Connecter", "Préparer les prises, les commandes et les équipements utiles à votre maison."]],
    about: "Le bon travail commence par les bonnes questions.", story: "Nous prenons le temps de regarder vos équipements, de comprendre votre projet et de vous expliquer les options. Les interventions sont définies dans un devis avant le démarrage.",
    steps: ["Visite et compréhension du besoin", "Proposition détaillée des travaux", "Installation et explication des équipements"],
    photo: "Équipement électrique et installation technique", contact: "Une idée à mettre en lumière ?",
  },
  nettoyage: {
    eyebrow: "ENTRETIEN DES ESPACES PROFESSIONNELS", title: "Le propre change tout.",
    intro: "Des bureaux accueillants, des vitrines soignées et des espaces communs agréables. Nous organisons l’entretien autour de votre activité.",
    cta: "Définir mon besoin", label: "UNE PLACE NETTE POUR VOTRE ACTIVITÉ",
    services: [["Bureaux & commerces", "L’entretien des sols, des surfaces et des espaces d’accueil selon un programme défini ensemble."], ["Parties communes", "Un passage régulier dans les entrées, les escaliers et les espaces partagés de votre immeuble."], ["Remise en état", "Une intervention ponctuelle pour préparer un emménagement ou retrouver des locaux après travaux."]],
    about: "Un lieu propre, une organisation claire.", story: "Chaque espace a ses contraintes. Nous définissons les zones à entretenir, les horaires de passage et les produits adaptés aux surfaces. Vous gardez un contact direct pour ajuster les prestations.",
    steps: ["Évaluation des surfaces et des usages", "Programme et fréquence personnalisés", "Suivi régulier des prestations"],
    photo: "Matériel de nettoyage pour l’entretien des locaux", contact: "Faisons place au propre.",
  },
  "coach-sportif": {
    eyebrow: "COACHING PERSONNEL · MOUVEMENT · ÉNERGIE", title: "Le premier pas, c’est le vôtre.",
    intro: "Reprendre le sport, gagner en force ou retrouver une routine. Un accompagnement construit autour de votre niveau, de vos envies et de votre rythme.",
    cta: "Parlons de mes objectifs", label: "BOUGER. PROGRESSER. RECOMMENCER.",
    services: [["Reprendre confiance", "Des séances progressives pour retrouver vos repères et remettre le mouvement dans votre quotidien."], ["Construire sa force", "Un travail de renforcement adapté à votre expérience, avec une attention portée aux gestes."], ["Trouver son rythme", "Un cadre régulier et des séances variées pour construire des habitudes qui vous correspondent."]],
    about: "Du mouvement, avec du sens.", story: "Une séance commence par un échange. Votre forme du jour, vos préférences et votre progression orientent le programme. Le but : avancer à votre rythme, dans un cadre attentif.",
    steps: ["Un échange sur vos objectifs", "Un programme adapté à votre niveau", "Des bilans pour ajuster la pratique"],
    photo: "Espace d’entraînement et matériel de musculation", contact: "On commence ensemble ?",
  },
  boulangerie: {
    eyebrow: "BOULANGERIE DE QUARTIER · PAINS AU LEVAIN", title: "Du pain. Du temps. Du cœur.",
    intro: "Une croûte qui chante, une mie généreuse et l’odeur du four au petit matin. Ici, on aime les choses simples, faites avec soin.",
    cta: "Préparer ma visite", label: "PÉTRI AVEC SOIN. PARTAGÉ AVEC PLAISIR.",
    services: [["Les pains du quotidien", "Pain de campagne, baguette et pains aux graines : une collection à découvrir au fil des fournées."], ["Les matins gourmands", "Croissants, brioches et douceurs pour accompagner le café et les petits rendez-vous du matin."], ["Les envies de saison", "Des recettes qui évoluent avec les produits et l’inspiration du fournil."]],
    about: "Au fournil, rien ne remplace le temps.", story: "Pétrir, laisser reposer, façonner puis cuire : chaque étape donne au pain sa personnalité. Notre boulangerie imaginaire raconte ce plaisir d’un métier que l’on partage chaque jour au comptoir.",
    steps: ["Des recettes pensées au fournil", "Le temps de la fermentation", "Le plaisir de partager la fournée"],
    photo: "Pains artisanaux à la croûte dorée", contact: "Une envie à partager ?",
  },
  immobilier: {
    eyebrow: "IMMOBILIER RÉSIDENTIEL · ACCOMPAGNEMENT PERSONNEL", title: "La bonne adresse commence par vous.",
    intro: "Vendre un lieu de vie ou trouver le prochain. Une écoute attentive, une présentation soignée et un accompagnement à chaque étape de votre projet.",
    cta: "Parlons de mon projet", label: "DES LIEUX QUI ONT QUELQUE CHOSE À DIRE",
    services: [["Vendre votre bien", "Comprendre les atouts de votre logement et définir ensemble une présentation et une stratégie de vente."], ["Chercher votre adresse", "Préciser vos critères, découvrir les possibilités et organiser des visites qui ont du sens."], ["Valoriser les espaces", "Mettre en lumière les volumes, les détails et les usages qui rendent un lieu singulier."]],
    about: "L’immobilier est une histoire de personnes.", story: "Derrière chaque porte, il y a un projet. Nous prenons le temps d’en comprendre le contexte pour vous proposer un suivi lisible, des échanges directs et des décisions éclairées.",
    steps: ["Comprendre votre projet et vos critères", "Construire une démarche adaptée", "Vous accompagner jusqu’à la signature"],
    photo: "Maison avec jardin illustrant un projet immobilier", contact: "Écrivons la prochaine page.",
  },
} as const;

export function NewDemoSite({ slug }: { slug: keyof typeof content }) {
  const data = content[slug];
  const example = examples.find(example => example.slug === slug)!;
  const links = [{ label: slug === "boulangerie" ? "La fournée" : "Nos services", href: "#services" }, { label: "Notre approche", href: "#approche" }, { label: "Faisons connaissance", href: "#contact" }];
  return <div className={`ex-site ex-new ex-${example.theme}`} id="accueil">
    <DemoHeader slug={slug} links={links} cta={slug === "boulangerie" ? "Nous trouver" : "Parlons-en"} />
    <section className="new-hero ex-container">
      <div className="new-hero-copy"><p className="ex-kicker">{data.eyebrow}</p><h1>{data.title}</h1><p>{data.intro}</p><a className="ex-button" href="#contact">{data.cta}<ArrowUpRight size={18} /></a><span className="new-hero-note">{example.shortName} · Un savoir-faire, une rencontre</span></div>
      <div className="new-hero-visual"><Photo slug={slug} alt={data.photo} preload /><div className="new-photo-caption"><span>01 / {example.sector}</span><strong>{example.tagline}</strong></div></div>
    </section>
    <div className="new-ribbon"><span>{data.label}</span><span aria-hidden="true">✳</span><span>{example.shortName}</span></div>
    <section id="services" className="ex-section ex-container new-services"><div className="ex-section-head"><div><p className="ex-kicker">{slug === "boulangerie" ? "À LA SORTIE DU FOUR" : "POUR VOTRE PROJET"}</p><h2>{slug === "boulangerie" ? "Le goût des choses simples." : "Ce que nous faisons pour vous."}</h2></div><a className="ex-text-link" href="#contact">Échangeons <MoveRight size={18} /></a></div><div className="new-service-grid">{data.services.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p><a href="#contact" aria-label={`Parlons de votre projet : ${title}`}><ArrowUpRight size={22} /></a></article>)}</div></section>
    <section id="approche" className="new-about"><div className="ex-container"><div className="new-about-art"><span aria-hidden="true">✳</span><p>{example.tagline}</p><span>{example.shortName}</span></div><div><p className="ex-kicker">NOTRE FAÇON DE FAIRE</p><h2>{data.about}</h2><p>{data.story}</p><ul>{data.steps.map(step => <li key={step}><Check size={18} />{step}</li>)}</ul></div></div></section>
    <DemoContact slug={slug} title={data.contact} intro="Présentez votre besoin dans ce formulaire de démonstration. Cette entreprise est fictive : aucune demande n’est transmise et aucun rendez-vous n’est réservé." />
    <DemoFooter slug={slug} links={links} />
  </div>;
}
