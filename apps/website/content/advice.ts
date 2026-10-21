import { offer } from "@nova/shared/business";
import { additionalAdviceArticles } from "./additional-advice";
import { professionalAdviceArticles } from "./professional-advice";
import { projectAdviceArticles } from "./project-advice";
import { launchAdviceArticles } from "./launch-advice";
import { budgetComparison as comparison, budgetEuro as euros, zelywebBudgetAdvantages } from "./budget-comparison";

export type AdviceSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: { label: string; href: string }[];
  example?: { label: string; text: string };
  table?: { caption: string; headers: string[]; rows: string[][]; highlightLastRow?: boolean };
  advantages?: { title: string; text: string }[];
};

export type AdviceArticle = {
  slug: string;
  category: string;
  title: string;
  seoTitle: string;
  description: string;
  introduction: string;
  takeaway: string;
  budgetComparison?: boolean;
  relatedSlugs?: string[];
  sections: AdviceSection[];
  nextStep: string;
  nextHref: string;
  nextLabel: string;
};

export const adviceArticles: AdviceArticle[] = [
  {
    slug: "budget-site-vitrine-creation-entretien",
    category: "BUDGET & TARIFS",
    title: "Combien coûte un site internet sur 3 ans ? Zelyweb et un scénario d’agence",
    seoTitle: "Coût d’un site sur 3 ans : Zelyweb et scénario d’agence",
    description: `Création et 36 mois de gestion : ${euros(comparison.zelywebTotalCents)} HT chez Zelyweb. Comparez prix et prestations avec un scénario d’agence fictif, détaillé poste par poste.`,
    introduction: "Le prix de départ ne dit pas tout. Pour mesurer le budget d’un site vitrine, additionnez sa création, son hébergement, son domaine et les interventions prévues pendant son utilisation. Voici une comparaison sur trois ans, avec des hypothèses explicites et les avantages concrets de Zelyweb.",
    takeaway: `Dans cet exemple, Zelyweb représente ${euros(comparison.zelywebTotalCents)} HT sur trois ans, contre ${euros(comparison.agencyTotalCents)} HT pour l’agence fictive. L’écart de ${euros(comparison.savingCents)} HT dépend des hypothèses retenues ; les devis réels doivent être comparés selon leur contenu.`,
    budgetComparison: true,
    relatedSlugs: ["creer-site-soi-meme-ou-professionnel", "entretien-site-internet"],
    sections: [
      {
        id: "hypotheses", title: "1. Ce que nous comparons vraiment",
        paragraphs: [
          "La base est un site vitrine de cinq pages, adapté au téléphone, à la tablette et à l’ordinateur. Nous supposons une utilisation continue pendant trente-six mois et des tarifs inchangés sur la période. Les montants HT servent à comparer les coûts ; les montants TTC sont également indiqués.",
          `Pour l’agence fictive, nous choisissons ${euros(comparison.agencyCreationCents)} HT de création et ${euros(comparison.agencyMonthlyCents)} HT par mois. Dans ce scénario, cette gestion comprend l’hébergement, le domaine dans une limite équivalente et une modification regroupée de quinze minutes maximum par mois. Nous supposons également trois séries de retours lors de la création.`,
          "Ces choix permettent de comparer un socle de prestations similaire. Ils ne décrivent aucune agence réelle et ne signifient pas que les agences proposent toutes ces prix ou ces conditions. Une offre plus coûteuse peut aussi inclure davantage de conception, de contenus ou de fonctionnalités : ces différences doivent être examinées sur le devis.",
        ],
      },
      {
        id: "prix-trois-ans", title: "2. Le tableau des coûts sur trois ans",
        paragraphs: [
          "Le domaine et l’hébergement étant supposés compris dans les deux gestions mensuelles, nous ne les ajoutons pas une seconde fois. La comparaison ne comprend ni page supplémentaire, ni fonctionnalité spécifique, ni supplément de domaine.",
        ],
        table: {
          caption: "Création et 36 mensualités à tarifs constants ; colonne agence entièrement hypothétique",
          headers: ["Poste", "Zelyweb", "Agence fictive"],
          rows: [
            ["Création du site, HT", euros(offer.creationCents), euros(comparison.agencyCreationCents)],
            ["Gestion mensuelle, HT", euros(offer.monthlyCents), euros(comparison.agencyMonthlyCents)],
            ["36 mois de gestion, HT", euros(36 * offer.monthlyCents), euros(36 * comparison.agencyMonthlyCents)],
            ["Total sur 3 ans, TTC", euros(comparison.zelywebTotalTtcCents), euros(comparison.agencyTotalTtcCents)],
            ["Total sur 3 ans, HT", euros(comparison.zelywebTotalCents), euros(comparison.agencyTotalCents)],
          ],
        },
        example: { label: "Comment lire l’écart", text: `${euros(comparison.agencyTotalCents)} − ${euros(comparison.zelywebTotalCents)} = ${euros(comparison.savingCents)} HT. C’est la différence dans ce scénario, sans présumer du tarif que vous proposerait une agence réelle.` },
      },
      {
        id: "prestations", title: "3. Les prestations, au-delà du prix",
        paragraphs: [
          "Les prestations communes ci-dessous sont des hypothèses pour l’agence fictive. Les modalités qui ne découlent pas du budget retenu restent à vérifier sur un devis réel : elles ne sont pas présentées comme moins favorables par défaut.",
        ],
        table: {
          caption: "Périmètre Zelyweb et hypothèses de comparaison pour une agence fictive",
          highlightLastRow: false,
          headers: ["Prestation", "Zelyweb", "Agence fictive"],
          rows: [
            ["Pages et affichage", "5 pages, mobile, tablette et ordinateur", "Même périmètre supposé"],
            ["Hébergement", "Inclus dans l’abonnement", "Inclus par hypothèse"],
            ["Domaine", `Jusqu’à ${euros(offer.domainAnnualCents)} HT/an, supplément accepté au-delà`, "Même limite supposée"],
            ["Ajustements de création", "3 séries regroupées sous 30 jours après paiement", "Même périmètre supposé"],
            ["Modification mensuelle", "15 minutes maximum, regroupées, non reportables", "Même périmètre supposé"],
            ["Accompagnement", "Interlocuteur direct, échanges à distance", "Organisation à vérifier sur devis"],
            ["Aperçu avant paiement", "Première version complète gratuite avant commande", "Conditions à vérifier sur devis"],
            ["Engagement", "Sans durée minimale, résiliation en fin de période payée", "Conditions à vérifier sur devis"],
          ],
        },
      },
      {
        id: "annee-par-annee", title: "4. Comment le budget évolue, année après année",
        paragraphs: [
          "La première année additionne le prix de création et douze mensualités. Les années suivantes ajoutent uniquement la gestion mensuelle dans notre exemple. Le tableau donne les montants cumulés depuis le début, pas une facture annuelle supplémentaire.",
        ],
        table: {
          caption: "Budget cumulé HT, hors options ; comparaison avec le même scénario fictif",
          headers: ["Durée", "Zelyweb", "Agence fictive"],
          rows: comparison.annualRows.map(row => [`Création + ${row.year * 12} mois`, euros(row.zelyweb), euros(row.agency)]),
        },
        bullets: [
          "Les trois ans servent de durée de comparaison : vous ne signez pas un engagement de trois ans chez Zelyweb.",
          "L’abonnement Zelyweb démarre quand vous l’activez avant la publication, après validation des ajustements.",
          "Si vos besoins évoluent, ajoutez au prévisionnel les options et interventions que vous acceptez.",
        ],
      },
      {
        id: "avantages-zelyweb", title: "5. Ce que vous gagnez avec Zelyweb",
        paragraphs: [
          "Le coût compte, mais votre façon de décider et de travailler sur le projet compte aussi. L’offre Zelyweb réunit ces six points, avec un périmètre défini avant la commande.",
        ],
        advantages: zelywebBudgetAdvantages,
      },
      {
        id: "limites-options", title: "6. Les limites à prévoir dans votre budget",
        paragraphs: [
          "Un site vitrine présente votre activité : une boutique, un espace client, de nouvelles pages ou une fonctionnalité spécifique nécessitent un devis distinct. Une intervention dépassant le temps mensuel inclus est également chiffrée avant réalisation. Le temps de modification non utilisé n’est pas reporté.",
          `Un domaine dont le coût dépasse ${euros(offer.domainAnnualCents)} HT par an nécessite votre accord préalable sur le supplément annuel, y compris lors d’un renouvellement. Ces montants ne sont pas inclus dans le comparatif.`,
          `En fin de service, les fichiers du site et le code de transfert du domaine sont remis gratuitement, sous réserve des règles de transfert du domaine. Une migration technique réalisée par Zelyweb vers un hébergement compatible est facultative et coûte ${euros(offer.migrationCents)} HT, soit ${euros(offer.migrationTtcCents)} TTC ; une adaptation importante est chiffrée séparément.`,
          "Pour comparer un devis à cette offre, vérifiez le contenu, les délais, les modalités de paiement, les renouvellements et les conditions de sortie. Le prix le plus adapté est celui d’un périmètre qui répond réellement à votre activité.",
        ],
      },
    ],
    nextStep: "Vous souhaitez voir ce que ce budget permet pour votre activité ? Décrivez votre projet pour découvrir une première proposition gratuite, avant de décider de commander.",
    nextHref: "/demander-mon-site", nextLabel: "Découvrir mon futur site",
  },
  {
    slug: "preparer-creation-site-internet",
    category: "PRÉPARER SON PROJET",
    title: "Que préparer avant de faire créer son site internet ?",
    seoTitle: "Que préparer avant la création de votre site internet ?",
    relatedSlugs: ["creer-site-sans-textes-logo-photos", "photos-site-internet-telephone"],
    description: "Une liste pratique pour préparer votre site vitrine : activité, prestations, coordonnées, textes, photos et exemples de styles, sans jargon technique.",
    introduction: "Vous n’avez pas besoin d’un dossier parfait pour démarrer. Quelques informations précises sur votre activité permettent déjà de préparer une première proposition. L’essentiel est d’expliquer ce que vous faites et ce que vos visiteurs doivent pouvoir comprendre.",
    takeaway: "Commencez par votre activité, vos principales prestations, votre zone d’intervention et vos coordonnées. Chez Zelyweb, une description précise suffit pour lancer la première proposition ; textes et visuels peuvent être préparés avec vous.",
    sections: [
      {
        id: "objectif", title: "1. Choisir une action principale pour vos visiteurs",
        paragraphs: [
          "Avant les couleurs ou les photos, demandez-vous à quoi le site doit servir. Souhaitez-vous recevoir des demandes de devis, être contacté par téléphone ou présenter vos réalisations avant un rendez-vous ? Choisir une action principale aide à organiser les pages et les boutons.",
          "Décrivez aussi les personnes auxquelles vous vous adressez : particuliers, professionnels, associations, clients locaux ou clients à distance. Un site destiné à des propriétaires qui cherchent un artisan ne présente pas les mêmes informations qu’un site de consultant.",
        ],
        example: { label: "Un objectif concret", text: "« Je suis paysagiste. Je veux montrer mes chantiers et recevoir des demandes pour l’entretien de jardins dans ma zone d’intervention. » Cette phrase donne déjà une direction au site." },
      },
      {
        id: "activite", title: "2. Décrire vos prestations avec des mots simples",
        paragraphs: [
          "Listez trois à cinq prestations prioritaires. Pour chacune, indiquez à qui elle s’adresse, ce qu’elle comprend et comment se déroule la prise de contact. Précisez votre zone d’intervention et les éventuelles limites : déplacements, disponibilité, types de projets acceptés.",
          "Vous pouvez écrire comme vous expliquez votre travail à un client. Il n’est pas nécessaire de rédiger un texte publicitaire ou d’employer des mots techniques pour paraître professionnel. Des informations concrètes sont plus utiles qu’une longue liste de qualités générales.",
        ],
        bullets: ["Votre nom commercial et votre métier.", "Vos prestations principales et celles que vous ne proposez pas.", "Votre ville, votre secteur d’intervention ou votre fonctionnement à distance.", "Votre manière de travailler et les étapes habituelles d’un projet."],
      },
      {
        id: "visuels", title: "3. Rassembler les visuels que vous avez déjà",
        paragraphs: [
          "Si vous possédez un logo, des photos de votre activité ou des réalisations, rassemblez les fichiers d’origine. Une image récupérée depuis une messagerie ou une capture d’écran peut avoir perdu en qualité. Donnez une courte explication pour chaque photo : ce qu’elle montre et la prestation concernée.",
          "Vous n’avez pas encore de logo ou de belles photos ? Cela ne bloque pas la première demande Zelyweb. Signalez simplement ce dont vous disposez. Nous pouvons préparer des textes et des visuels, puis ajuster la présentation avec vous. Les images d’illustration doivent rester distinctes des photos de vos propres réalisations.",
        ],
        bullets: ["Logo et couleurs existantes, si vous en avez.", "Photos de votre travail, de votre lieu ou de votre équipe que vous êtes autorisé à publier.", "Exemples de réalisations accompagnés d’un contexte.", "Deux ou trois sites dont vous appréciez la présentation, en expliquant pourquoi."],
      },
      {
        id: "coordonnees", title: "4. Vérifier les informations qui seront publiées",
        paragraphs: [
          "Une faute dans le numéro de téléphone ou une ancienne adresse e-mail peut faire perdre des contacts. Préparez une liste unique et relisez-la : nom de l’entreprise, coordonnées professionnelles, horaires éventuels et zone desservie. Indiquez aussi le moyen de contact à privilégier.",
          "Les informations d’identité de l’entreprise servent également à préparer les pages légales. Dans l’offre Zelyweb, les mentions légales et la confidentialité sont intégrées à partir des informations que vous fournissez, en complément des cinq pages du site. Cette intégration ne remplace pas un conseil juridique adapté à votre situation.",
        ],
      },
      {
        id: "existant", title: "5. Signaler un domaine ou un site déjà existant",
        paragraphs: [
          "Si vous avez déjà un nom de domaine, précisez lequel et où il est géré. Indiquez si des adresses e-mail professionnelles utilisent ce domaine : c’est important pour préparer une mise en ligne sans perturber votre messagerie.",
          "Si vous remplacez un site, partagez son adresse et indiquez les contenus à conserver, les coordonnées à corriger et ce qui ne vous convient plus. Ne supprimez pas l’ancien site avant d’avoir organisé la transition. Les accès nécessaires seront traités au moment approprié ; ne placez pas de mots de passe dans une description de projet.",
        ],
      },
      {
        id: "brief", title: "6. Votre point de départ en six réponses",
        paragraphs: ["Pour commencer, répondez simplement aux questions ci-dessous. Vous pourrez compléter les textes, les photos et les détails pendant les échanges. Le formulaire Zelyweb vous guide d’abord sur votre activité, le style et vos coordonnées."],
        bullets: ["Quel est votre métier et à qui vous adressez-vous ?", "Quelles prestations souhaitez-vous mettre en avant ?", "Dans quelle zone travaillez-vous ?", "Quelle action attendez-vous des visiteurs ?", "Quel style aimez-vous et quels contenus possédez-vous déjà ?", "Comment souhaitez-vous être contacté ?"],
        example: { label: "Pour organiser les ajustements", text: "Regroupez vos remarques dans une seule liste : page concernée, élément à modifier et résultat souhaité. Chez Zelyweb, trois séries de retours regroupés sont incluses dans les trente jours suivant le paiement de création." },
      },
    ],
    nextStep: "Vous pouvez commencer avec les informations dont vous disposez. Expliquez votre activité et nous préparerons la première direction ensemble.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer ma demande gratuite",
  },
  {
    slug: "pages-site-petite-entreprise",
    category: "CONTENU & STRUCTURE",
    title: "Quelles pages mettre sur le site d’une petite entreprise ?",
    seoTitle: "Les 5 pages d’un site vitrine de petite entreprise",
    relatedSlugs: ["rediger-page-services-entreprise", "rediger-page-a-propos-entreprise"],
    description: "Accueil, À propos, Services, Réalisations et Contact : découvrez le rôle de chaque page et les informations à prévoir pour votre petite entreprise.",
    introduction: "Un site utile n’a pas besoin de multiplier les pages. Il doit permettre de comprendre votre activité, d’évaluer votre travail et de vous contacter facilement. Pour une petite entreprise, cinq pages bien organisées constituent un point de départ à adapter aux besoins réels des visiteurs.",
    takeaway: `L’offre Zelyweb s’organise autour de cinq pages : ${offer.pages.join(", ")}. Les informations légales et de confidentialité s’ajoutent à cette structure.`,
    sections: [
      {
        id: "accueil", title: "1. Accueil : expliquer votre activité dès le premier écran",
        paragraphs: [
          "L’accueil donne une vue d’ensemble. Votre visiteur doit comprendre votre métier, les personnes que vous accompagnez et votre zone d’intervention. Une phrase précise vaut mieux qu’un slogan que l’on pourrait retrouver sur n’importe quel site.",
          "Présentez ensuite vos principales prestations, quelques éléments concrets de votre travail et un moyen de vous contacter. L’accueil oriente vers les autres pages ; il n’a pas besoin de répéter tout leur contenu. Sur téléphone, le bouton de contact doit rester facile à trouver.",
        ],
        example: { label: "Exemple de présentation", text: "« Entretien et création de jardins pour les particuliers autour du Mans » renseigne immédiatement sur le service, le public et la zone, sans obliger le visiteur à chercher ces informations." },
      },
      {
        id: "a-propos", title: "2. À propos : montrer qui se trouve derrière l’entreprise",
        paragraphs: [
          "Cette page présente votre parcours et votre manière de travailler. Expliquez pourquoi vous exercez ce métier, ce que vous prenez en charge et comment vous accompagnez vos clients. Une photo de vous ou de votre équipe peut rendre cette présentation plus concrète.",
          "Vous venez de vous lancer ? Vous pouvez décrire votre méthode, votre formation ou vos expériences pertinentes sans inventer des années d’activité. Pour une entreprise individuelle, une présentation courte et personnelle est souvent plus utile qu’un discours qui laisse imaginer une grande équipe.",
        ],
        bullets: ["Votre rôle et votre parcours pertinent.", "Le déroulement des échanges avec vos clients.", "Vos qualifications réelles lorsqu’elles concernent les prestations.", "Votre façon de préparer et de suivre les projets."],
      },
      {
        id: "services", title: "3. Services : aider le visiteur à reconnaître son besoin",
        paragraphs: [
          "Pour chaque prestation, décrivez le problème auquel vous répondez et ce qui est inclus. Précisez les conditions pratiques utiles : intervention sur place ou à distance, zone desservie, prise de rendez-vous ou préparation d’un devis.",
          "Évitez une simple succession de noms de services. Un client ne connaît pas forcément vos termes de métier : donnez un exemple d’utilisation et indiquez la prochaine étape. Si le tarif dépend du projet, expliquez les informations nécessaires pour le chiffrer.",
        ],
        example: { label: "Une fiche de prestation simple", text: "Pour qui ? Pour quel besoin ? Que comprend l’intervention ? Comment demander un devis ? Répondre à ces quatre questions aide le visiteur à décider s’il doit vous contacter." },
      },
      {
        id: "realisations", title: "4. Réalisations : donner du contexte à votre travail",
        paragraphs: [
          "Choisissez des projets représentatifs plutôt qu’une galerie très longue. Accompagnez chaque réalisation d’un court texte : le besoin de départ, la prestation effectuée et ce qui a été livré. Des photos avant et après peuvent aider lorsque leur comparaison est pertinente.",
          "Publiez uniquement les contenus que vous êtes autorisé à utiliser. Si vous n’avez pas encore de projets clients présentables, vous pouvez montrer des démonstrations ou des projets personnels clairement identifiés. Ils illustrent une possibilité sans être présentés comme une commande client.",
          "Les témoignages, lorsqu’ils sont authentiques et publiables, peuvent compléter les exemples. Une réalisation expliquée reste utile même sans note, compteur ou promesse de résultat commercial.",
        ],
      },
      {
        id: "contact", title: "5. Contact : faciliter la prochaine étape",
        paragraphs: [
          "Indiquez les moyens de vous joindre et ce qui permet de traiter une demande. Un formulaire court peut recueillir le nom, un moyen de réponse et une description du besoin. Chaque champ doit avoir une utilité ; demander trop d’informations au premier échange peut compliquer la prise de contact.",
          "Selon votre activité, ajoutez les horaires, la zone d’intervention ou une adresse professionnelle pertinente. Vérifiez le formulaire sur téléphone et assurez-vous que les messages arrivent dans la bonne boîte. Si vous annoncez un délai de réponse, choisissez un délai que vous pouvez réellement tenir.",
        ],
      },
      {
        id: "complements", title: "Et les pages légales, la FAQ ou la boutique ?",
        paragraphs: [
          "Les informations légales et de confidentialité ne remplacent pas l’une de ces cinq pages. Zelyweb les ajoute à partir des informations fournies par le client. Le contenu à prévoir dépend de votre situation et des outils effectivement utilisés sur le site.",
          "Une FAQ peut d’abord prendre place dans la page Services si elle répond à quelques questions récurrentes. Une page dédiée à une prestation, une rubrique de conseils ou une autre langue peuvent ensuite être envisagées si elles répondent à un besoin précis.",
          "Une boutique, un espace client ou un système de réservation spécifique demande un périmètre différent. Ces fonctionnalités ne sont pas incluses dans l’offre vitrine de base et doivent être étudiées et chiffrées avant réalisation. Le nombre de pages, à lui seul, ne garantit ni des ventes ni une position dans Google.",
        ],
      },
    ],
    nextStep: "Pour visualiser différentes façons d’organiser ces informations, parcourez les démonstrations Zelyweb. Chaque exemple est identifié comme fictif.",
    nextHref: "/exemples", nextLabel: "Explorer les exemples de sites",
  },
  ...additionalAdviceArticles,
  ...professionalAdviceArticles,
  ...projectAdviceArticles,
  ...launchAdviceArticles,
];

export const advicePath = (slug: string) => `/conseils/${slug}`;
export const getAdvice = (slug: string) => adviceArticles.find(article => article.slug === slug);
