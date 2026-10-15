/** Public business information shared by the website and the administration. No credentials. */
export const business = {
  brand: "Zelyweb",
  legalName: "Guillaume Ribeau EI — Zelyweb",
  legalForm: "Entrepreneur individuel au régime micro-entreprise",
  address: "17 rue des Maréchaux, 72190 Sargé-lès-le-Mans, France",
  siret: "91123105800015",
  siren: "911231058",
  vatNumber: "FR95911231058",
  email: "contact@zelyweb.com",
  phone: "",
  mediator: "",
  taxBasisPoints: 2000,
  taxNote: "TVA applicable au taux de 20 %.",
  version: "2026-10-15",
} as const;

export const offer = {
  creationCents: 29900, creationTtcCents: 35880,
  monthlyCents: 2900, monthlyTtcCents: 3480,
  migrationCents: 15000, migrationTtcCents: 18000,
  domainAnnualCents: 2000,
  pages: ["Accueil", "À propos", "Services", "Réalisations", "Contact"],
} as const;

export const offerSections = [
  { title: "Votre site vitrine de cinq pages", text: "Accueil, À propos, Services, Réalisations et Contact, adaptés au mobile, à la tablette et à l’ordinateur. Les mentions légales et la confidentialité s’ajoutent à ces cinq pages à partir des informations fournies par le client. L’offre comprend l’intégration de ces informations, sans prestation de conseil juridique personnalisé. Boutique, espace client et fonctionnalités spécifiques font l’objet d’un devis distinct." },
  { title: "Une première version complète avant de payer", text: "Une description précise de votre activité et des éléments à faire apparaître suffit pour démarrer. Zelyweb prépare les textes et les visuels ; vous pouvez aussi fournir vos contenus. La première version complète est présentée gratuitement sur un aperçu privé sous sept jours ouvrés après réception des informations nécessaires. Vous restez libre de ne pas commander." },
  { title: "Création et ajustements", text: "La création coûte 299 € HT, soit 358,80 € TTC (TVA 20 %), payables par carte via Stripe après acceptation de la première version et avant les ajustements. Trois séries de retours regroupés sont incluses, à transmettre dans les 30 jours suivant le paiement. Elles portent sur les textes, photos, couleurs et ajustements de présentation. Les nouvelles pages, fonctionnalités ou changements complets de direction nécessitent un devis complémentaire accepté avant réalisation." },
  { title: "Abonnement à la mise en ligne", text: "L’abonnement de 29 € HT, soit 34,80 € TTC par mois (TVA 20 %), est obligatoire pour la mise en ligne chez Zelyweb. Il commence à la publication, après les ajustements. Sans durée minimale d’engagement, il comprend l’hébergement, le nom de domaine dans la limite indiquée ci-dessous et une modification regroupée de 15 minutes maximum par mois. Le temps inutilisé n’est pas reporté. Les demandes dépassant ce temps sont chiffrées séparément avant intervention." },
  { title: "Choix et renouvellement du domaine", text: "Le nom souhaité est vérifié selon sa disponibilité et son prix d’achat et de renouvellement avant toute réservation. Zelyweb gère et paie le domaine dans la limite de 20 € HT par an. Un prix supérieur, notamment pour un domaine premium ou lors d’un renouvellement, nécessite votre accord préalable sur un supplément annuel. Aucun domaine précis n’est garanti avant sa réservation." },
  { title: "Résiliation et récupération du site", text: "Vous pouvez demander la résiliation à tout moment à contact@zelyweb.com ; elle prend effet à la fin de la période mensuelle déjà payée. Zelyweb remet gratuitement les fichiers du site et le code de transfert du domaine, sous réserve des règles et délais du registre et du bureau d’enregistrement. Certains domaines peuvent être temporairement bloqués au transfert. Les éventuels frais du nouveau prestataire restent à votre charge. Une copie des fichiers reste disponible pendant 30 jours après la fin du service : demandez-la avant ce terme et prévoyez un nouvel hébergement pour éviter une interruption." },
  { title: "Migration technique facultative", text: "La remise des fichiers et du code de transfert est gratuite. Si vous confiez à Zelyweb la migration technique vers un hébergement compatible, cette intervention facultative coûte 150 € HT, soit 180 € TTC. Le périmètre est vérifié avant commande ; une adaptation importante ou un environnement incompatible fait l’objet d’un devis distinct." },
  { title: "Vos contenus et vos droits", text: "Le client valide les textes, visuels et informations professionnelles avant publication et garantit les autorisations nécessaires pour les contenus qu’il fournit. Après règlement intégral, il peut utiliser, faire modifier et héberger ailleurs le site livré pour son activité. Les licences des polices, images, logiciels et autres composants tiers restent applicables et ne sont pas cédées en exclusivité. L’offre ne garantit aucun classement dans les moteurs de recherche." },
] as const;

// Complementary quotes have their own scope: the base offer’s revisions do not
// automatically apply to every additional service.
export const defaultQuoteTerms = `Le présent devis concerne uniquement les prestations complémentaires détaillées ci-dessus. Il ne modifie pas l’abonnement ni l’offre initiale, sauf mention explicite.
Prix exprimés en euros ; TVA applicable à 20 %. Paiement par carte via Stripe après acceptation du devis et avant le démarrage des prestations. Le délai indiqué court après réception du paiement et des informations nécessaires.
Les corrections incluses et les livrables sont ceux précisés dans le devis. Toute prestation supplémentaire nécessite un accord écrit sur son prix et son délai avant réalisation.
Le client garantit les droits sur les contenus fournis et valide les contenus avant publication. Après règlement intégral, les livrables peuvent être utilisés, modifiés et hébergés pour son activité, sous réserve des licences des composants tiers.
Consommateurs : droit de rétractation de 14 jours à compter de la conclusion du contrat, à exercer par une déclaration claire à contact@zelyweb.com ou à l’adresse de Zelyweb. Aucun démarrage avant la fin de ce délai sans demande expresse distincte. En cas de démarrage expressément demandé, seule la part légalement due des prestations réalisées peut être facturée en cas de rétractation. La perte du droit suppose une prestation entièrement exécutée et les accords et informations requis par la loi ; elle ne résulte pas de la seule acceptation du devis.
Réclamations : contact@zelyweb.com. Les coordonnées du médiateur compétent doivent être communiquées aux consommateurs après adhésion effective de Zelyweb, avant la conclusion de leur contrat.`;

export const sellerDefaults = {
  legalName: business.legalName, address: business.address,
  registrationNumber: business.siret, vatNumber: business.vatNumber,
  taxNote: business.taxNote, terms: defaultQuoteTerms, validityDays: 30, reminderDays: 0,
};

/** Fill only missing fields. Existing saved settings and signed snapshots win. */
type SellerSettings = { [K in keyof typeof sellerDefaults]: typeof sellerDefaults[K] extends number ? number : string };
export function withSellerDefaults<T extends Partial<SellerSettings>>(saved: T | null) {
  const result = { ...sellerDefaults, ...saved };
  for (const key of ["legalName", "address", "registrationNumber", "vatNumber", "taxNote", "terms"] as const) {
    if (!result[key]?.trim()) result[key] = sellerDefaults[key];
  }
  return result;
}
