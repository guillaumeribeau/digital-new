import type { AdviceArticle } from "./advice";
import { offer } from "@nova/shared/business";
import { budgetEuro as euros } from "./budget-comparison";

export const projectAdviceArticles: AdviceArticle[] = [
  {
    slug: "creer-site-soi-meme-ou-professionnel",
    category: "CHOISIR SA SOLUTION",
    title: "Créer son site soi-même ou le confier à un professionnel ?",
    seoTitle: "Créer son site soi-même ou faire appel à un professionnel ?",
    description: "Temps disponible, budget, contenus et gestion technique : comparez les tâches à prévoir pour créer votre site seul ou avec un professionnel.",
    introduction: "Créer votre site vous-même peut sembler une bonne manière de maîtriser votre budget. Le confier à quelqu’un peut vous aider à avancer avec un accompagnement. Pour choisir, regardez ce que vous souhaitez faire personnellement et le temps que vous pouvez réellement y consacrer.",
    takeaway: "Comparez le coût global, le temps de préparation et la gestion après publication. Le bon choix dépend de votre autonomie, de vos besoins et de la disponibilité que vous souhaitez garder pour votre activité.",
    relatedSlugs: ["comparer-devis-creation-site", "entretien-site-internet"],
    sections: [
      {
        id: "taches", title: "1. Identifier le travail au-delà de la mise en page",
        paragraphs: ["Un site demande des textes, des images, une organisation des pages et un contact fonctionnel. Il faut aussi préparer le domaine, l’affichage sur téléphone et la publication. Un outil de création facilite certaines tâches, mais ne décide pas à votre place de la façon de présenter votre entreprise.", "Listez ce que vous savez déjà faire et ce que vous devrez apprendre. Un site vitrine simple peut constituer un projet accessible si vous aimez travailler sur ces sujets et disposez du temps nécessaire."],
      },
      {
        id: "autonomie", title: "2. Choisir l’autonomie lorsque vous souhaitez gérer le projet",
        paragraphs: ["Faire vous-même peut convenir si vous avez un besoin précis, des contenus disponibles et l’envie de tester votre solution. Vous décidez du rythme et apprenez à modifier votre présentation. Prévoyez toutefois un moment pour vérifier les pages et les contacts avant de les partager.", "Examinez aussi les conditions de l’outil : abonnement, domaine, fonctionnalités nécessaires et possibilités de récupération. Le prix de départ ne représente pas forcément le coût du fonctionnement que vous souhaitez."],
        example: { label: "Exemple fictif : une formatrice indépendante", text: "Elle possède ses textes, quelques photos et une présentation très simple. Elle aime expérimenter et peut consacrer plusieurs créneaux au projet. Créer sa première version elle-même peut correspondre à son organisation." },
      },
      {
        id: "deleguer", title: "3. Déléguer lorsque le temps ou l’accompagnement comptent davantage",
        paragraphs: ["Un professionnel peut vous aider à structurer les contenus, préparer le site et organiser la publication selon le périmètre convenu. Vous gardez un rôle essentiel : expliquer votre métier, fournir les informations exactes et valider les éléments présentés.", "Demandez qui fait quoi. La rédaction, les photos, les modifications ou les fonctions particulières ne sont pas incluses de la même façon dans chaque proposition. Un devis clair permet de comparer des prestations plutôt que des montants isolés."],
      },
      {
        id: "comparaison", title: "4. Comparer le coût et l’organisation dans la durée",
        paragraphs: ["Additionnez les frais de création, les abonnements, les options et les interventions prévues. Intégrez aussi le temps nécessaire pour préparer, apprendre et entretenir votre site. Votre disponibilité est une contrainte concrète, même si elle n’apparaît pas sur une facture."],
        table: { caption: "Les questions à poser avant de choisir", headers: ["Point à comparer", "Question utile"], highlightLastRow: false, rows: [["Contenus", "Qui prépare les textes et les images ?"], ["Publication", "Qui règle le domaine et vérifie les contacts ?"], ["Évolution", "Comment seront réalisées les modifications ?"], ["Sortie", "Que pourrez-vous récupérer et dans quelles conditions ?"]] },
        links: [{ label: "Comparer un budget sur trois ans", href: "/conseils/budget-site-vitrine-creation-entretien" }],
      },
      {
        id: "zelyweb", title: "5. Visualiser une proposition avant de décider",
        paragraphs: ["Chez Zelyweb, une description précise de votre activité permet de préparer une première version complète gratuite. Nous préparons les textes et les visuels, que vous validez. Vous restez libre de ne pas commander.", `Si vous acceptez la proposition, la création coûte ${euros(offer.creationCents)} HT, soit ${euros(offer.creationTtcCents)} TTC. Après paiement et ajustements, vous activez l’abonnement de ${euros(offer.monthlyCents)} HT par mois avant publication. Le détail du périmètre vous permet de comparer cette solution avec une création autonome.`],
      },
    ],
    nextStep: "Vous souhaitez voir ce qu’un accompagnement donnerait pour votre activité ? Présentez votre projet pour découvrir une première proposition gratuite.",
    nextHref: "/demander-mon-site", nextLabel: "Découvrir une première proposition",
  },
  {
    slug: "site-internet-bouche-a-oreille",
    category: "CONFIANCE & RECOMMANDATION",
    title: "À quoi sert un site quand les clients viennent déjà du bouche-à-oreille ?",
    seoTitle: "Un site internet quand le bouche-à-oreille fonctionne déjà ?",
    description: "Un site peut compléter les recommandations : présenter vos prestations, montrer votre travail et faciliter le contact des personnes à qui l’on parle de vous.",
    introduction: "Vos clients vous recommandent et vous recevez déjà des appels. Un site peut alors servir à accompagner ces recommandations : la personne qui entend votre nom dispose d’un endroit pour découvrir votre travail et préparer son premier échange.",
    takeaway: "Le site peut prolonger une recommandation en donnant des informations claires et partageables. Son utilité ne se mesure pas uniquement au nombre de personnes qui découvrent votre entreprise depuis Google.",
    relatedSlugs: ["site-internet-ou-reseaux-sociaux", "questions-faq-site-entreprise"],
    sections: [
      {
        id: "verification", title: "1. Aider le prospect à vérifier que vous correspondez à son besoin",
        paragraphs: ["Une recommandation donne un nom, mais rarement tous les détails d’une prestation. Votre futur client peut vouloir connaître votre zone d’intervention, voir des exemples et comprendre votre manière de travailler avant d’appeler.", "Votre site rassemble ces réponses. Il permet aussi de préciser ce que vous ne proposez pas ou les types de projets que vous prenez en charge. La personne recommandée arrive ainsi avec des repères plus précis."],
        example: { label: "Exemple fictif : un menuisier", text: "Une cliente recommande son menuisier à un voisin. Le voisin consulte le site et voit qu’il réalise des bibliothèques sur mesure dans sa commune. Il peut ensuite décrire son projet en faisant référence à une réalisation présentée." },
      },
      {
        id: "partage", title: "2. Donner une adresse facile à transmettre",
        paragraphs: ["Un lien peut accompagner un message, un e-mail ou les coordonnées que votre client partage. La personne n’a pas besoin de rechercher une ancienne publication pour comprendre votre offre.", "Choisissez une adresse lisible et vérifiez que le site présente clairement votre nom. Depuis un téléphone, le visiteur doit pouvoir accéder rapidement à vos services et au moyen de contact souhaité."],
        links: [{ label: "Choisir le nom de domaine de votre entreprise", href: "/conseils/choisir-nom-domaine-entreprise" }],
      },
      {
        id: "questions", title: "3. Répondre aux questions répétées avant le premier appel",
        paragraphs: ["Notez ce que les personnes recommandées vous demandent régulièrement : types d’intervention, délais à prévoir, informations pour un devis ou déroulement d’un rendez-vous. Ces réponses peuvent trouver leur place dans les pages Services et Contact.", "Il ne s’agit pas de supprimer l’échange humain. Une présentation claire permet de consacrer cet échange au projet réel, plutôt qu’à la répétition de toutes les informations générales."],
        bullets: ["Les prestations et leurs principales limites.", "La zone ou le fonctionnement à distance.", "Les étapes d’une prise de contact.", "Les éléments utiles pour préparer une demande."],
      },
      {
        id: "preuves", title: "4. Montrer concrètement votre travail",
        paragraphs: ["Choisissez quelques réalisations avec un court contexte : besoin initial, intervention et résultat observable. Un prospect peut alors se projeter dans un travail similaire au sien, au-delà du simple nom transmis par son proche.", "Votre parcours, votre méthode et des témoignages authentiques publiables peuvent compléter cette présentation. Si vous démarrez, des projets personnels ou des démonstrations clairement identifiés permettent déjà d’expliquer votre démarche."],
        links: [{ label: "Présenter vos réalisations quand vous débutez", href: "/conseils/presenter-realisations-quand-on-debute" }],
      },
      {
        id: "mesurer", title: "5. Observer son utilité sans attendre des chiffres spectaculaires",
        paragraphs: ["Demandez à vos contacts comment ils vous ont connu et s’ils ont consulté le site. Vous pourrez repérer les pages qui les aident et les informations encore manquantes. Quelques échanges mieux préparés peuvent constituer une utilité concrète, même avec une audience modeste.", "Un site ne garantit pas de nouvelles commandes et peut avoir une priorité limitée si votre activité est complète et vos besoins déjà couverts. Chez Zelyweb, l’aperçu gratuit vous permet de voir comment vos services et réalisations pourraient être présentés avant de décider."],
      },
    ],
    nextStep: "Vous travaillez surtout grâce aux recommandations ? Expliquez les questions que vos nouveaux contacts posent pour préparer une présentation qui leur soit utile.",
    nextHref: "/demander-mon-site", nextLabel: "Présenter mon activité",
  },
  {
    slug: "creer-site-sans-textes-logo-photos",
    category: "DÉMARRER SON PROJET",
    title: "Peut-on faire créer son site sans textes, sans logo et sans photos ?",
    seoTitle: "Créer son site sans textes, logo ni photos : par où commencer ?",
    description: "Vous n’avez pas encore de contenus ? Découvrez les informations nécessaires pour démarrer votre site et préparer progressivement les textes et les visuels.",
    introduction: "Vous souhaitez un site, mais votre dossier de contenus est encore vide. Cela ne signifie pas que vous devez tout rédiger ou commander un logo avant de faire une première demande. Vous pouvez commencer par expliquer votre activité avec vos propres mots.",
    takeaway: "Une description précise de votre métier, de vos services et de vos clients constitue le point de départ. Chez Zelyweb, nous préparons une base de textes et de visuels que vous vérifiez avant publication.",
    relatedSlugs: ["quand-preparer-site-lancement-entreprise", "photos-site-internet-telephone"],
    sections: [
      {
        id: "minimum", title: "1. Partir des informations que vous connaissez déjà",
        paragraphs: ["Vous connaissez votre métier même si vous ne savez pas comment l’écrire pour un site. Décrivez ce que vous faites, pour qui et dans quelle zone. Ajoutez votre façon de travailler et l’action que vous attendez des visiteurs : appel, message ou demande de devis.", "Ces informations réelles comptent davantage qu’un long texte publicitaire. Les détails pourront être précisés lors des échanges, mais une description trop vague ne permet pas de préparer une proposition fidèle à votre activité."],
        bullets: ["Votre nom commercial et votre métier.", "Vos principales prestations et leurs limites.", "Votre clientèle et votre zone d’intervention.", "Votre moyen de contact et vos informations pratiques.", "Quelques préférences de style, si vous en avez."],
      },
      {
        id: "textes", title: "2. Construire les textes à partir de vos réponses",
        paragraphs: ["Vous pouvez transmettre des notes simples plutôt qu’un texte finalisé. Une explication orale mise par écrit, une liste de services ou les réponses aux questions habituelles donnent déjà de la matière. Le travail consiste ensuite à organiser ces éléments pour les visiteurs.", "Relisez la proposition pour vérifier les prestations, les qualifications, les délais et les coordonnées. Une formulation agréable ne suffit pas si elle décrit une promesse ou une expérience qui ne correspond pas à votre entreprise."],
        example: { label: "Exemple fictif : une couturière", text: "« Je fais des retouches sur rendez-vous, surtout pour les particuliers autour de mon atelier. Je ne prends pas les travaux de cuir. » Cette explication peut devenir une présentation de service claire, sans inventer une spécialité supplémentaire." },
      },
      {
        id: "logo", title: "3. Distinguer la présentation du nom et la création d’un logo",
        paragraphs: ["Un site peut présenter lisiblement le nom de l’entreprise avec une typographie et des couleurs cohérentes, même sans logo existant. Cela vous permet d’avancer sur les pages et les contenus sans attendre une identité graphique complète.", "La conception d’un logo original et de tous ses fichiers constitue un besoin distinct. Indiquez si vous l’attendez : cette prestation ne doit pas être supposée incluse dans une création de site. Si vous possédez déjà une identité, transmettez ses fichiers disponibles."],
      },
      {
        id: "images", title: "4. Utiliser des visuels adaptés sans inventer des réalisations",
        paragraphs: ["Des images d’illustration peuvent installer une ambiance ou accompagner une explication. Elles doivent rester distinguées des photos de votre travail lorsqu’une confusion est possible. Une galerie de réalisations doit décrire ce que vous avez effectivement réalisé ou identifier clairement les démonstrations.", "Vous pourrez fournir progressivement des photos de votre lieu, de vos gestes ou de projets personnels. Conservez les originaux et les informations nécessaires à leur publication. Quelques images utiles valent mieux qu’une galerie remplie de visuels sans contexte."],
        links: [{ label: "Préparer des photos avec votre téléphone", href: "/conseils/photos-site-internet-telephone" }],
      },
      {
        id: "validation", title: "5. Préparer puis valider la première version",
        paragraphs: ["Chez Zelyweb, une description précise suffit pour lancer la préparation des textes et des visuels. La première version complète gratuite est présentée sous sept jours ouvrés après réception des informations nécessaires. Vous restez libre de ne pas commander.", "Si vous acceptez, la création est payée avant les ajustements. Vous disposez ensuite de trois séries de retours regroupés à transmettre dans les trente jours suivant ce paiement. Les contenus et informations pratiques sont validés avant activation de l’abonnement et publication."],
      },
    ],
    nextStep: "Commencez avec les informations dont vous disposez. Décrivez votre métier et signalez les contenus que vous avez déjà ou souhaitez préparer avec nous.",
    nextHref: "/demander-mon-site", nextLabel: "Démarrer sans dossier complet",
  },
  {
    slug: "entretien-site-internet",
    category: "GESTION & ENTRETIEN",
    title: "Que comprend l’entretien d’un site internet ?",
    seoTitle: "Entretien d’un site internet : que faut-il prévoir ?",
    description: "Hébergement, domaine, vérifications et modifications : distinguez les tâches d’entretien d’un site et ce que prévoit l’abonnement Zelyweb.",
    introduction: "Une fois le site publié, des tâches restent à prévoir : conserver son adresse, garder les informations exactes et vérifier que le contact fonctionne. Le mot « entretien » peut recouvrir des prestations très différentes. Regardez les actions prévues plutôt que le seul intitulé du forfait.",
    takeaway: "Distinguez le fonctionnement technique, les mises à jour de contenu et les évolutions du site. Faites préciser le périmètre, les responsabilités et le coût des interventions qui dépassent le forfait.",
    relatedSlugs: ["budget-site-vitrine-creation-entretien", "adresse-email-professionnelle-domaine"],
    sections: [
      {
        id: "fonctionnement", title: "1. Garder le site accessible et le domaine renouvelé",
        paragraphs: ["L’hébergement permet de rendre le site accessible et le domaine fournit son adresse. Leur gestion est distincte des changements de texte ou de photo. Vérifiez qui gère chaque service, son renouvellement et les informations nécessaires si vous changez de prestataire.", "La messagerie peut dépendre d’un fournisseur séparé. Signalez les adresses qui utilisent votre domaine afin de préserver leurs réglages lors d’une intervention. Un abonnement de site ne comprend pas automatiquement des boîtes e-mail professionnelles."],
      },
      {
        id: "contenus", title: "2. Tenir les informations de l’entreprise à jour",
        paragraphs: ["Horaires, coordonnées, services et réalisations évoluent avec votre activité. Prévoyez de transmettre les changements avant qu’un prospect ne s’appuie sur une information dépassée. Regroupez les corrections avec la page concernée et le texte ou le visuel de remplacement.", "Une petite correction et une nouvelle page complète ne représentent pas le même travail. Demandez ce qui est inclus, le temps disponible et le traitement des demandes supplémentaires."],
        example: { label: "Exemple fictif : un salon", text: "Modifier les horaires et remplacer une photo constitue une demande limitée. Ajouter un catalogue complet de prestations avec une réservation personnalisée demande un périmètre distinct à étudier avant intervention." },
      },
      {
        id: "verifications", title: "3. Définir les vérifications et les services techniques attendus",
        paragraphs: ["Selon la solution, l’entretien peut comprendre des interventions sur les composants techniques, des sauvegardes ou un suivi particulier. Faites détailler les tâches, leur fréquence et la façon de signaler un incident. Le mot « maintenance » seul ne suffit pas à connaître l’engagement du prestataire.", "De votre côté, testez les parcours importants après une modification : navigation, téléphone et formulaire jusqu’à réception du message. Si vous attendez une surveillance permanente, un délai garanti ou un suivi SEO régulier, ces attentes doivent figurer explicitement dans la proposition."],
        links: [{ label: "Reprendre les vérifications de contact", href: "/conseils/checklist-avant-mise-en-ligne-site" }],
      },
      {
        id: "abonnement", title: "4. Ce que comprend l’abonnement Zelyweb",
        paragraphs: [`L’abonnement est de ${euros(offer.monthlyCents)} HT, soit ${euros(offer.monthlyTtcCents)} TTC par mois. Il comprend l’hébergement, la gestion du domaine jusqu’à ${euros(offer.domainAnnualCents)} HT par an et une modification regroupée de quinze minutes maximum par mois. Le temps inutilisé n’est pas reporté.`, "Un supplément annuel de domaine nécessite votre accord préalable. Les demandes dépassant le temps inclus, les nouvelles pages et les fonctionnalités spécifiques sont chiffrées avant intervention. L’abonnement n’inclut pas par défaut une animation des réseaux sociaux ou une production régulière d’articles."],
        links: [{ label: "Consulter le périmètre et les conditions de l’offre", href: "/conditions-generales" }],
      },
      {
        id: "organisation", title: "5. Préparer une organisation simple pour la suite",
        paragraphs: ["Conservez vos contenus d’origine et une liste des services utilisés. Désignez la personne qui valide les changements et transmet les informations pratiques. Un message regroupé avec un résultat attendu facilite le traitement des demandes.", "Chez Zelyweb, l’abonnement est activé après validation des ajustements et avant publication. Il est sans durée minimale d’engagement ; la résiliation prend effet à la fin de la période mensuelle payée. Préparez la récupération du site et du domaine avant de fermer l’ancien service si vous partez ailleurs."],
      },
    ],
    nextStep: "Vous souhaitez savoir comment se répartissent la création et la gestion mensuelle ? Consultez le détail de l’offre et les limites prévues pour chaque intervention.",
    nextHref: "/notre-offre", nextLabel: "Voir l’offre et son fonctionnement",
  },
  {
    slug: "site-vitrine-boutique-reservation",
    category: "DÉFINIR SON BESOIN",
    title: "Site vitrine, boutique ou réservation en ligne : de quoi avez-vous besoin ?",
    seoTitle: "Site vitrine, boutique ou réservation : choisir son besoin",
    description: "Présenter votre activité, vendre des produits ou gérer des rendez-vous : définissez le rôle de votre site et les fonctionnalités réellement nécessaires.",
    introduction: "Un client doit-il vous appeler, acheter directement ou réserver un créneau ? La réponse change le projet à préparer. Commencez par décrire ce parcours avant de choisir une liste d’outils ou de pages.",
    takeaway: "Choisissez la prochaine action attendue du visiteur. Un site vitrine présente et facilite le contact ; une boutique ou un système de réservation demande des fonctions et une gestion supplémentaires.",
    relatedSlugs: ["pages-site-petite-entreprise", "site-recevoir-demandes-devis-utiles"],
    sections: [
      {
        id: "vitrine", title: "1. Présenter et recevoir des contacts avec un site vitrine",
        paragraphs: ["Un site vitrine explique votre activité, vos prestations et votre manière de travailler. Il peut montrer des réalisations, répondre aux questions fréquentes et faciliter un appel ou une demande. Le projet se poursuit ensuite dans un échange avec vous.", "Ce format convient à étudier lorsque vous devez préciser le besoin avant de proposer un prix ou une intervention : travaux sur devis, accompagnement, prestations personnalisées. Le nombre de pages dépend des informations à organiser, pas d’un objectif de remplissage."],
        example: { label: "Exemple fictif : une entreprise de rénovation", text: "Le visiteur consulte des chantiers, vérifie la zone d’intervention et décrit son projet. L’entreprise échange ensuite avec lui pour préparer le devis : aucun achat immédiat n’est nécessaire sur le site." },
      },
      {
        id: "boutique", title: "2. Prévoir la gestion quotidienne d’une boutique",
        paragraphs: ["Une boutique permet de choisir des produits et de passer une commande selon le parcours défini. Elle demande de préparer le catalogue, les variantes, les disponibilités, les paiements et le traitement des commandes. La livraison ou le retrait doit aussi être organisé.", "Demandez-vous qui tiendra ces informations à jour et répondra aux demandes après achat. Un catalogue consultable avec prise de contact n’a pas le même périmètre qu’une boutique qui encaisse et suit les commandes."],
      },
      {
        id: "reservation", title: "3. Définir ce qu’une réservation doit réellement faire",
        paragraphs: ["Un formulaire de demande de rendez-vous ne confirme pas automatiquement un créneau. Une réservation avec disponibilités demande de définir les durées, les personnes ou ressources disponibles et les règles de confirmation. Un acompte éventuel ajoute une étape de paiement à prévoir.", "Si vous utilisez déjà un service de réservation, indiquez-le. Un lien vers ce service peut parfois suffire. Une intégration au site ou une fonction personnalisée doit être vérifiée selon les possibilités de l’outil et votre fonctionnement."],
        example: { label: "Exemple fictif : un studio de bien-être", text: "Le studio possède déjà un agenda en ligne qu’il souhaite conserver. Le site peut présenter les séances et orienter vers cet agenda, après vérification du parcours, plutôt que reconstruire immédiatement toute la réservation." },
      },
      {
        id: "brief", title: "4. Décrire le parcours avant de demander un prix",
        paragraphs: ["Expliquez ce qui doit se passer du premier clic à la fin de l’action. Précisez les outils existants, qui reçoit les notifications et les opérations à réaliser ensuite. Ces réponses permettent de comparer des propositions qui couvrent le même besoin."],
        bullets: ["Que doit pouvoir faire le visiteur sans vous appeler ?", "Le prix ou le créneau peut-il être confirmé automatiquement ?", "Faut-il recevoir un paiement et à quel moment ?", "Quel outil utilisez-vous déjà pour les commandes ou les rendez-vous ?", "Qui gérera les changements et les demandes après publication ?"],
      },
      {
        id: "zelyweb", title: "5. Le périmètre de l’offre vitrine Zelyweb",
        paragraphs: ["L’offre de base Zelyweb comprend cinq pages : Accueil, À propos, Services, Réalisations et Contact, avec les pages légales préparées à partir de vos informations en complément. Elle est destinée à présenter votre activité et faciliter la prise de contact.", "Une boutique, un espace client ou une réservation spécifique ne sont pas inclus dans ce socle. Ils nécessitent une étude et un devis distincts avant réalisation. Signalez ces attentes dès votre demande pour préparer une proposition adaptée, sans supposer qu’une fonction est comprise dans le prix vitrine."],
      },
    ],
    nextStep: "Décrivez ce que vos visiteurs doivent pouvoir faire. Nous pourrons distinguer le site de présentation des fonctionnalités à étudier séparément.",
    nextHref: "/demander-mon-site", nextLabel: "Décrire le parcours de mes clients",
  },
  {
    slug: "presenter-tarifs-site-internet",
    category: "OFFRE & TARIFS",
    title: "Comment présenter ses tarifs sur son site internet ?",
    seoTitle: "Présenter vos tarifs sur votre site internet",
    description: "Prix fixe, fourchette, tarif de départ ou devis : choisissez une présentation qui explique votre prestation et aide le prospect à comprendre son budget.",
    introduction: "Vous souhaitez donner un repère de prix, mais chaque projet peut être différent. La bonne présentation dépend de ce qui est réellement comparable dans votre offre. Un montant est utile lorsqu’il est accompagné d’un périmètre compréhensible.",
    takeaway: "Reliez chaque tarif à une prestation, une unité et des conditions précises. Si le prix dépend du projet, expliquez les facteurs qui le font varier et les informations nécessaires pour établir un devis.",
    relatedSlugs: ["site-recevoir-demandes-devis-utiles", "budget-site-vitrine-creation-entretien"],
    sections: [
      {
        id: "prix-fixe", title: "1. Afficher un prix fixe pour une prestation définie",
        paragraphs: ["Un forfait peut convenir lorsque le contenu est suffisamment stable. Indiquez ce qui est compris, la durée ou la quantité concernée et les principales limites. Un visiteur doit pouvoir comprendre si le montant répond à son besoin sans découvrir ensuite des éléments indispensables facturés séparément.", "Vérifiez la cohérence entre la page tarif, les services et la proposition envoyée. Si un prix change, mettez à jour tous les endroits où il apparaît. Précisez clairement la présentation HT ou TTC correspondant à votre offre et à votre situation."],
      },
      {
        id: "fourchette", title: "2. Donner une fourchette ou un tarif de départ avec son contexte",
        paragraphs: ["Une fourchette peut servir de repère lorsque les variations sont explicables. Présentez les critères : dimensions, durée, nombre de personnes, déplacement ou niveau de personnalisation. Appuyez-vous sur vos prestations réelles plutôt que sur un montant choisi uniquement pour paraître accessible.", "Un prix « à partir de » doit décrire le cas auquel il correspond. Si le prospect ne peut pas reconnaître ce cas, l’indication risque d’apporter peu d’aide. Donnez un exemple de périmètre et expliquez comment obtenir une estimation adaptée."],
        example: { label: "Exemple fictif : une photographe", text: "Plutôt qu’un prix isolé, elle présente un forfait avec durée de séance, lieu prévu, nombre d’images livrées et mode de remise. Les déplacements supplémentaires et les demandes particulières sont précisés avant réservation." },
      },
      {
        id: "devis", title: "3. Expliquer le devis lorsque le projet doit être étudié",
        paragraphs: ["Lorsque la prestation dépend fortement du contexte, le devis peut constituer le meilleur point de départ. Expliquez pourquoi le chiffrage varie et ce que le client doit transmettre. Il saura alors comment avancer même sans prix final affiché.", "Présentez la suite de la demande : échange, visite ou étude selon votre méthode. Si une étape préparatoire est payante, clarifiez-la avant de l’organiser. La page peut rassurer par la transparence du déroulement plutôt que par un montant artificiellement précis."],
      },
      {
        id: "global", title: "4. Rendre le coût global facile à comprendre",
        paragraphs: ["Séparez le paiement initial, les montants récurrents et les options lorsqu’ils existent. Une mensualité seule ne permet pas de comprendre une offre qui comprend aussi une création payante. Indiquez quand chaque paiement commence et ce qu’il couvre.", "Vous pouvez ajouter un exemple de calcul sur une durée annoncée, avec les hypothèses explicites. Les frais variables doivent rester identifiés. Chez Zelyweb, le comparatif sur trois ans distingue ainsi création, abonnement et suppléments éventuels."],
        links: [{ label: "Voir un exemple de présentation du coût sur trois ans", href: "/conseils/budget-site-vitrine-creation-entretien" }],
      },
      {
        id: "relecture", title: "5. Relire la page comme un nouveau prospect",
        paragraphs: ["Demandez à une personne qui connaît peu votre métier ce qu’elle comprend du prix. Peut-elle expliquer la prestation, les exclusions et la prochaine étape ? Ses questions permettront d’identifier les informations manquantes."],
        bullets: ["La prestation et l’unité de facturation sont compréhensibles.", "Les mentions HT et TTC sont cohérentes avec la présentation retenue.", "Les paiements ponctuels et récurrents sont distingués.", "Les options et facteurs de variation sont expliqués.", "Le bouton mène vers une demande ou une action adaptée au tarif présenté."],
      },
    ],
    nextStep: "Vous proposez des forfaits ou travaillez sur devis ? Décrivez votre façon de chiffrer pour préparer une page qui présente vos services avec clarté.",
    nextHref: "/demander-mon-site", nextLabel: "Présenter mes prestations et tarifs",
  },
  {
    slug: "rediger-page-a-propos-entreprise",
    category: "CONTENU & CONFIANCE",
    title: "Comment rédiger une page « À propos » qui inspire confiance ?",
    seoTitle: "Rédiger la page À propos de votre entreprise",
    description: "Présentez votre parcours, votre rôle et votre méthode avec une page À propos concrète, même si votre entreprise vient de démarrer.",
    introduction: "La page « À propos » aide le visiteur à comprendre qui réalisera sa prestation. Elle n’a pas besoin d’un long récit ni d’un discours impressionnant. Une présentation précise de votre rôle et de votre manière de travailler apporte déjà des repères utiles.",
    takeaway: "Expliquez qui vous êtes, ce que vous prenez en charge et comment vous accompagnez vos clients. Appuyez-vous sur des faits réels et reliez votre parcours aux besoins du visiteur.",
    relatedSlugs: ["presenter-realisations-quand-on-debute", "choisir-style-couleurs-site"],
    sections: [
      {
        id: "presentation", title: "1. Commencer par votre rôle et votre activité actuelle",
        paragraphs: ["Présentez votre nom, votre métier et les personnes que vous accompagnez. Si vous exercez seul, expliquez votre rôle direct. Si plusieurs personnes interviennent, précisez l’organisation utile au client plutôt que de laisser deviner qui répondra à sa demande.", "Vous pouvez mentionner votre zone et votre spécialité avec des mots simples. Le premier paragraphe doit permettre de vous situer sans obliger le visiteur à lire toute votre histoire."],
        example: { label: "Exemple fictif : une réparatrice de vélos", text: "« Je suis Léa, réparatrice de vélos à domicile autour de Tours. Je prends en charge l’entretien courant et les réparations après un premier échange sur votre besoin. » Cette introduction précise le métier, la zone et le fonctionnement." },
      },
      {
        id: "parcours", title: "2. Sélectionner les éléments de parcours qui expliquent votre travail",
        paragraphs: ["Choisissez les expériences, formations ou étapes qui éclairent votre prestation actuelle. Vous n’avez pas besoin de reproduire tout votre CV. Expliquez le lien entre ces éléments et ce que vous apportez dans un projet.", "Si vous venez de créer l’entreprise, distinguez cette date de vos expériences précédentes. Précisez votre contribution à un projet réalisé dans une autre structure lorsque vous en parlez. Ne laissez pas penser qu’il s’agissait d’une commande de votre nouvelle entreprise."],
      },
      {
        id: "methode", title: "3. Remplacer les qualités générales par votre méthode",
        paragraphs: ["« À l’écoute » ou « travail de qualité » ne disent pas comment se déroulera la prestation. Décrivez plutôt vos actions : questions de départ, préparation, présentation d’une proposition ou validation des étapes. Le visiteur peut alors imaginer la relation.", "Vous pouvez aussi expliquer les informations que vous demandez au premier contact et la façon dont vous prenez en compte les remarques. Ces détails donnent du sens à votre accompagnement sans promettre un résultat identique pour tous les projets."],
        bullets: ["Comment commence le premier échange ?", "Quelles étapes préparez-vous avant d’intervenir ?", "Que valide le client au fil du projet ?", "Comment se passent les retours et le suivi ?"],
      },
      {
        id: "preuves", title: "4. Ajouter des éléments concrets que vous pouvez montrer",
        paragraphs: ["Un portrait, une photo de votre lieu de travail ou une réalisation expliquée peut accompagner le texte. Choisissez des éléments actuels et publiables. Les qualifications et témoignages mentionnés doivent correspondre à votre situation réelle.", "Vous pouvez montrer un projet personnel ou une démonstration si le contexte est clairement indiqué. Mieux vaut une courte présentation fidèle qu’un compteur, une certification ou une taille d’équipe inventés pour remplir la page."],
        links: [{ label: "Trouver des exemples à montrer quand vous débutez", href: "/conseils/presenter-realisations-quand-on-debute" }],
      },
      {
        id: "trame", title: "5. Une trame courte pour passer à la rédaction",
        paragraphs: ["Préparez une réponse de quelques lignes pour chaque point ci-dessous, puis relisez l’ensemble à voix haute. Supprimez les répétitions avec la page Services et gardez un lien vers les réalisations ou le contact pour poursuivre la visite."],
        bullets: ["Qui je suis et quel est mon métier aujourd’hui.", "À qui je m’adresse et pour quels besoins.", "Les éléments de parcours qui expliquent ma pratique.", "Ma façon d’organiser une prestation.", "La prochaine étape pour une personne intéressée."],
        example: { label: "Vous ne savez pas comment formuler ?", text: "Chez Zelyweb, vous pouvez commencer par vos réponses brutes. Nous préparons une base de texte à partir de vos informations ; vous vérifiez ensuite qu’elle décrit correctement votre parcours, votre activité et vos engagements." },
      },
    ],
    nextStep: "Partagez votre parcours et votre façon de travailler, même sous forme de notes. Nous pourrons préparer une présentation cohérente avec votre activité.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer ma présentation",
  },
  {
    slug: "erreurs-page-accueil-entreprise",
    category: "ACCUEIL & CLARTÉ",
    title: "Quelles erreurs éviter sur la page d’accueil d’une entreprise ?",
    seoTitle: "Page d’accueil d’entreprise : les erreurs à éviter",
    description: "Activité floue, contact caché ou trop d’informations : repérez les erreurs de page d’accueil qui compliquent la découverte de votre entreprise.",
    introduction: "Votre accueil doit aider un visiteur à comprendre votre activité et à trouver la suite de son parcours. Il peut être agréable à regarder tout en laissant des questions essentielles sans réponse. Voici les points à examiner avant de multiplier les effets ou les blocs.",
    takeaway: "Dites rapidement ce que vous faites, pour qui et comment avancer. Organisez l’accueil autour de ces réponses, puis vérifiez le parcours sur téléphone avec une personne qui découvre votre entreprise.",
    relatedSlugs: ["pages-site-petite-entreprise", "site-recevoir-demandes-devis-utiles"],
    sections: [
      {
        id: "activite", title: "1. Un slogan qui ne permet pas de comprendre le métier",
        paragraphs: ["Une phrase comme « Réalisons vos envies » peut convenir à beaucoup d’activités. Ajoutez une présentation concrète du service, de la clientèle et de la zone lorsqu’elle compte. Le visiteur doit pouvoir reconnaître son besoin dès les premières lignes.", "Le nom de l’entreprise peut rester bien visible sans porter seul toute l’explication. Les personnes qui vous découvrent ne connaissent pas encore votre spécialité ni votre fonctionnement."],
        example: { label: "Exemple fictif : une entreprise de jardinage", text: "« Entretien de jardins pour les particuliers autour de Nantes » donne une direction plus précise qu’une promesse générale. La suite de la page peut présenter les interventions, quelques exemples et le contact." },
      },
      {
        id: "action", title: "2. Un contact caché ou des boutons trop vagues",
        paragraphs: ["Choisissez l’action principale que vous souhaitez proposer : demander un devis, appeler ou découvrir une prestation. Donnez au bouton un libellé qui annonce sa destination. Un visiteur ne devrait pas devoir tester plusieurs liens pour trouver comment vous joindre.", "Vérifiez le numéro, l’adresse de destination et le formulaire sur téléphone. Si plusieurs actions sont utiles, organisez-les selon leur importance au lieu de leur donner toutes la même place."],
      },
      {
        id: "contenus", title: "3. Tout raconter sans hiérarchiser les informations",
        paragraphs: ["L’accueil donne une vue d’ensemble et oriente vers les pages détaillées. Présentez vos prestations prioritaires, quelques éléments de votre travail et une introduction à votre méthode. Le détail peut se poursuivre dans Services, Réalisations ou À propos.", "Coupez les paragraphes qui répètent la même idée et évitez de multiplier les choix concurrents. Un titre précis suivi d’une explication courte aide le lecteur à repérer la partie qui l’intéresse."],
        bullets: ["Une présentation claire de l’activité.", "Les services prioritaires et leurs liens.", "Quelques réalisations avec leur contexte.", "Une explication de votre fonctionnement.", "Une prochaine étape facile à trouver."],
      },
      {
        id: "preuves", title: "4. Des visuels et des affirmations sans contexte",
        paragraphs: ["Une grande image peut installer une ambiance sans expliquer votre travail. Accompagnez les photos de réalisations d’une légende utile et distinguez les illustrations des projets clients. Votre visiteur saura ce qu’il regarde.", "Appuyez les affirmations sur des éléments réels : méthode, qualifications pertinentes ou retours authentiques. Vous n’avez pas besoin d’inventer des chiffres pour remplir l’espace. Une réalisation bien expliquée peut donner davantage d’informations qu’une succession de promesses générales."],
        links: [{ label: "Choisir et préparer vos photos", href: "/conseils/photos-site-internet-telephone" }],
      },
      {
        id: "test", title: "5. Valider l’ordinateur sans essayer le téléphone",
        paragraphs: ["Parcourez l’accueil sur un écran étroit : le titre reste-t-il lisible, les boutons accessibles et le menu compréhensible ? Vérifiez qu’une image ou un élément animé ne masque pas une information importante. Testez les liens vers les pages internes.", "Demandez ensuite à une personne qui connaît peu votre entreprise de raconter ce qu’elle a compris et ce qu’elle ferait pour vous contacter. Ses hésitations donnent des pistes concrètes. Cette vérification ne garantit pas des ventes, mais elle aide à repérer les obstacles évitables."],
        links: [{ label: "Reprendre la checklist avant publication", href: "/conseils/checklist-avant-mise-en-ligne-site" }],
      },
    ],
    nextStep: "Vous souhaitez visualiser un accueil adapté à votre métier ? Décrivez votre activité et l’action attendue des visiteurs pour préparer une première proposition gratuite.",
    nextHref: "/demander-mon-site", nextLabel: "Imaginer mon futur accueil",
  },
];
