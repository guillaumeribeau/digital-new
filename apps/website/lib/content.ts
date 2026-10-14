import { brand, firstYearTotal, money } from "@/config/brand.config";
export const faq = [
  [
    "Dois-je payer avant de voir mon site ?",
    "Non. Nous créons une première proposition et nous vous la présentons gratuitement. Vous ne payez la création que si vous décidez de commander sa mise en ligne.",
  ],
  [
    "Que se passe-t-il si la proposition ne me plaît pas ?",
    "Nous échangeons sur ce qui vous convient et ce qui doit évoluer. Vous restez libre de ne pas commander. Le nombre de corrections incluses sera précisé dans l’offre définitive avant toute commande.",
  ],
  [
    "Combien coûte le site ?",
    `La création d’un site vitrine one-page commence à ${money(brand.pricing.creation)} € HT. La gestion technique coûte ${money(brand.pricing.monthly)} € HT par mois. Sur douze mois, cela représente ${money(firstYearTotal)} € HT, création comprise, hors options choisies. Le périmètre et les conditions sont confirmés avant la commande.`,
  ],
  [
    "Pourquoi existe-t-il un abonnement mensuel ?",
    "Il sert à la gestion technique : hébergement, nom de domaine standard et maintenance. Le périmètre exact du support et les conditions de renouvellement du domaine restent à confirmer dans le contrat définitif.",
  ],
  [
    "Dois-je acheter un nom de domaine ?",
    "Nous nous occupons des démarches pour un nom de domaine standard. Nous aurons besoin de certaines informations administratives et de votre validation pour l’enregistrer à votre nom. Un domaine premium ou une situation particulière fera l’objet d’une proposition distincte.",
  ],
  [
    "Qui s’occupe de l’hébergement ?",
    "Nous prenons en charge l’hébergement et la mise en ligne dans le cadre de la gestion technique. Vous n’avez pas à choisir un serveur ou à effectuer des réglages techniques.",
  ],
  [
    "Le site fonctionne-t-il sur téléphone ?",
    "Oui. Nous prévoyons une présentation adaptée au téléphone, à la tablette et à l’ordinateur. Vos services et vos coordonnées restent faciles à consulter.",
  ],
  [
    "Puis-je demander des modifications ?",
    "Oui, nous pouvons étudier vos demandes. Le nombre de corrections incluses, les interventions après publication et les éventuelles options seront précisés avant la commande. Nous n’annonçons pas de modifications illimitées.",
  ],
  [
    "Qui est propriétaire de mon nom de domaine ?",
    "Le domaine a vocation à être enregistré à votre nom avec les informations administratives que vous validez. Les modalités de gestion, de renouvellement et de transfert seront détaillées dans les conditions définitives.",
  ],
  [
    "Que se passe-t-il si je résilie ?",
    "La durée d’engagement, le préavis, la continuité d’hébergement et les conditions de transfert du site et du domaine sont encore à définir. Nous vous communiquerons ces éléments avant toute commande ; aucune modalité n’est présumée ici.",
  ],
  [
    "Combien de temps faut-il pour recevoir ma proposition ?",
    "Nous visons une première proposition sous 72 heures après réception des informations nécessaires. Ce délai est un objectif soumis à confirmation, selon la demande et nos disponibilités.",
  ],
  [
    "Mon site sera-t-il visible sur Google ?",
    "Nous préparons les fondamentaux techniques : structure des titres, métadonnées et affichage mobile. L’indexation et le classement dépendent ensuite des moteurs de recherche et de nombreux facteurs. Nous ne garantissons aucune première position.",
  ],
];
export const steps = [
  {
    title: "Parlez-nous de vous.",
    text: "Votre activité, vos services, vos envies. Quelques questions simples nous aident à comprendre ce qui vous rend unique.",
    detail:
      "Un logo ou des photos ? Nous verrons ensemble les contenus utiles. Vous pouvez commencer même si tout n’est pas encore prêt.",
  },
  {
    title: "Découvrez votre futur site.",
    text: "Nous transformons vos informations en une première proposition concrète. Vous découvrez le résultat gratuitement, avant de décider.",
    detail:
      "Première proposition sous 72 h : un objectif soumis à confirmation et à la réception des informations nécessaires. Nous échangeons avec vous sur la suite.",
  },
  {
    title: "Validez. Nous faisons le reste.",
    text: "Vous souhaitez aller plus loin ? Après validation de l’offre, nous préparons votre site et sa mise en ligne.",
    detail:
      "Domaine, hébergement, réglages techniques : nous nous en occupons. Certaines informations administratives et votre validation seront nécessaires pour enregistrer le domaine à votre nom.",
  },
];
