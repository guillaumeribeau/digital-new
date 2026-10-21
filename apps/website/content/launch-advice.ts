import type { AdviceArticle } from "./advice";

export const launchAdviceArticles: AdviceArticle[] = [
  {
    slug: "rediger-page-services-entreprise",
    category: "SERVICES & CONTENUS",
    title: "Comment rédiger une page Services qui explique vraiment votre offre ?",
    seoTitle: "Rédiger une page Services claire pour votre entreprise",
    description: "Besoin du client, contenu, limites et prochaine étape : une trame pratique pour présenter vos prestations sans jargon ni longue liste de services.",
    introduction: "Vos clients ne connaissent pas forcément les noms techniques de vos prestations. Pour les aider à choisir, votre page Services doit relier ce que vous faites à leur situation. Quelques explications concrètes permettent de dépasser une simple liste de métiers ou de savoir-faire.",
    takeaway: "Pour chaque service, expliquez à qui il s’adresse, ce qu’il comprend, comment il se déroule et comment vous contacter. Gardez les détails qui aident à reconnaître un besoin et à préparer un échange.",
    relatedSlugs: ["presenter-zone-intervention-site", "site-recevoir-demandes-devis-utiles"],
    sections: [
      {
        id: "besoin", title: "1. Partir de la situation de votre client",
        paragraphs: ["Décrivez le problème ou le projet auquel vous répondez avant d’énumérer vos techniques. Un visiteur peut chercher à remettre un jardin en état sans connaître le nom des interventions nécessaires. Votre texte doit l’aider à reconnaître qu’il est au bon endroit.", "Choisissez les prestations que vous souhaitez réellement développer. Regroupez celles qui répondent à un même besoin, puis donnez un titre compréhensible. Une liste très longue avec des termes proches peut rendre le choix plus difficile."],
        example: { label: "Exemple fictif : une assistante indépendante", text: "Au lieu d’afficher seulement « gestion administrative », elle précise : « Vous manquez de temps pour préparer vos documents et suivre vos dossiers ? Je vous accompagne sur les tâches définies ensemble, à distance. » Elle détaille ensuite les tâches effectivement proposées." },
      },
      {
        id: "perimetre", title: "2. Décrire le contenu et les principales limites",
        paragraphs: ["Indiquez les actions prises en charge, les livrables éventuels et les conditions pratiques utiles. Précisez votre zone ou le fonctionnement à distance. Si un élément souvent attendu n’est pas compris, expliquez-le avant la demande.", "Distinguez une possibilité d’une prestation systématique. Une intervention complémentaire ou une option ne doit pas sembler comprise dans tous les projets. Vous pourrez ensuite préciser le périmètre définitif dans la proposition."],
        bullets: ["Le public et les situations concernés.", "Les actions comprises dans la prestation présentée.", "Les éléments à fournir ou à préparer par le client.", "Les principales exclusions et options.", "La zone et les modalités d’intervention."],
      },
      {
        id: "deroulement", title: "3. Expliquer les étapes sans surcharger la page",
        paragraphs: ["Présentez le premier échange, la préparation, l’intervention et la suite si ces étapes correspondent à votre méthode. Le visiteur doit comprendre comment commencer et ce qui sera décidé plus tard.", "Évitez les délais ou résultats automatiques lorsque le contexte doit d’abord être étudié. Vous pouvez indiquer les facteurs dont dépend l’organisation : disponibilité, éléments transmis, accès ou validation d’un devis."],
      },
      {
        id: "concret", title: "4. Ajouter un exemple qui rend la prestation compréhensible",
        paragraphs: ["Une réalisation expliquée, une photo légendée ou une courte situation peut montrer à quoi sert le service. Décrivez le contexte et votre rôle exact. Identifiez les exemples fictifs et les projets personnels lorsqu’ils ne correspondent pas à une commande.", "Choisissez un exemple représentatif plutôt qu’un cas exceptionnel qui créerait une attente trompeuse. Un lien vers une réalisation permet d’en savoir plus sans allonger toute la page Services."],
      },
      {
        id: "trame", title: "5. Utiliser une fiche simple pour chaque prestation",
        paragraphs: ["Préparez les réponses ci-dessous pour vos services prioritaires. Relisez ensuite la page comme une personne qui découvre votre métier et vérifiez que le bouton de contact correspond à la prochaine étape annoncée."],
        bullets: ["Pour qui et pour quel besoin ?", "Que prenez-vous en charge ?", "Comment se déroule le premier échange ?", "Quels éléments permettent d’estimer le projet ?", "Où peut-on voir un exemple et comment vous joindre ?"],
        links: [{ label: "Préparer une demande de devis utile", href: "/conseils/site-recevoir-demandes-devis-utiles" }],
      },
    ],
    nextStep: "Décrivez vos principales prestations, même sous forme de notes. Nous pourrons les organiser dans une première présentation adaptée à vos visiteurs.",
    nextHref: "/demander-mon-site", nextLabel: "Présenter mes services",
  },
  {
    slug: "questions-faq-site-entreprise",
    category: "QUESTIONS & RÉPONSES",
    title: "Quelles questions mettre dans la FAQ de votre entreprise ?",
    seoTitle: "Créer une FAQ utile pour le site de votre entreprise",
    description: "Choisissez les questions qui reviennent avant une commande et rédigez des réponses précises sur les prestations, les délais, les devis et le fonctionnement.",
    introduction: "Une FAQ peut aider un prospect qui hésite encore à vous contacter. Elle est surtout utile lorsqu’elle répond aux questions réellement posées dans vos échanges. Vous n’avez pas besoin d’un grand nombre de réponses pour commencer.",
    takeaway: "Partez des questions de vos clients, donnez une réponse directe et indiquez la suite lorsque le cas doit être étudié. La FAQ complète les pages de service sans remplacer leurs informations essentielles.",
    relatedSlugs: ["rediger-page-services-entreprise", "presenter-tarifs-site-internet"],
    sections: [
      {
        id: "collecter", title: "1. Recueillir les questions avant de les inventer",
        paragraphs: ["Relisez quelques échanges récents et notez les demandes qui reviennent avant un rendez-vous ou un devis. Demandez-vous aussi ce que les clients découvrent trop tard : document à préparer, zone desservie ou fonctionnement d’une intervention.", "Sélectionnez les questions auxquelles une réponse générale peut réellement aider. Les situations très particulières pourront rester traitées lors du contact plutôt que d’allonger la FAQ avec de nombreux cas rares."],
      },
      {
        id: "sujets", title: "2. Couvrir les hésitations qui empêchent d’avancer",
        paragraphs: ["Les bons sujets dépendent de votre métier. Commencez par les prestations, les informations nécessaires, le déroulement et les modalités pratiques. Une réponse doit permettre de comprendre si l’on peut vous solliciter et comment préparer la suite."],
        bullets: ["Intervenez-vous dans ma commune ou à distance ?", "Que faut-il préparer pour obtenir une proposition ?", "Comment se passe le premier rendez-vous ?", "Quels éléments font varier le prix ?", "Comment sont définis le calendrier et les étapes ?"],
        example: { label: "Exemple fictif : un atelier de réparation", text: "À la question « Puis-je venir sans rendez-vous ? », l’atelier explique son fonctionnement réel et indique comment décrire l’objet avant de se déplacer. Cette réponse rend un service concret au visiteur." },
      },
      {
        id: "reponse", title: "3. Donner la réponse avant les explications",
        paragraphs: ["Commencez par une phrase qui répond à la question, puis ajoutez les conditions importantes. Si la réponse dépend du projet, expliquez de quoi elle dépend et les informations à transmettre pour la préciser.", "Évitez les réponses qui renvoient toutes vers « contactez-nous » sans rien expliquer. Vous pouvez guider le contact tout en donnant un premier repère. Pour un délai, distinguez une organisation habituelle d’un engagement confirmé pour une commande."],
      },
      {
        id: "emplacement", title: "4. Placer les réponses près de la décision concernée",
        paragraphs: ["Quelques questions peuvent être intégrées dans la page Services ou près du contact. Une page dédiée devient intéressante lorsque les sujets sont nombreux et faciles à regrouper. L’essentiel reste que le visiteur trouve la réponse au bon moment.", "Ne cachez pas uniquement dans la FAQ une information nécessaire pour comprendre le prix ou le périmètre. La page de prestation doit déjà présenter le contenu de l’offre ; la FAQ apporte des précisions et traite les hésitations complémentaires."],
      },
      {
        id: "actualiser", title: "5. Garder une FAQ courte, juste et à jour",
        paragraphs: ["Lorsqu’une prestation ou une condition change, relisez les réponses concernées. Supprimez les contradictions avec vos autres pages et ajoutez une nouvelle question seulement si elle mérite une réponse distincte.", "Une FAQ n’est pas une garantie de visibilité sur Google. Évaluez d’abord son utilité dans vos échanges : les personnes comprennent-elles mieux la préparation et le déroulement ? Les questions restantes vous aideront à améliorer les contenus."],
      },
    ],
    nextStep: "Rassemblez les questions que vos prospects posent le plus souvent. Elles pourront servir à préparer une présentation claire et quelques réponses utiles sur votre site.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer les réponses de mon site",
  },
  {
    slug: "presenter-zone-intervention-site",
    category: "ZONE & CLIENTÈLE",
    title: "Comment présenter sa zone d’intervention sur son site ?",
    seoTitle: "Présenter votre zone d’intervention sur votre site",
    description: "Villes, rayon de déplacement et prestations à distance : expliquez où vous travaillez sans multiplier les listes de communes ou les pages similaires.",
    introduction: "Un visiteur peut apprécier vos réalisations tout en se demandant si vous intervenez chez lui. Votre zone doit être facile à comprendre et correspondre à votre fonctionnement réel. Une formulation précise évite des demandes hors secteur et des déplacements mal anticipés.",
    takeaway: "Indiquez votre secteur habituel, les cas à vérifier et les éventuelles prestations à distance. Donnez des informations utiles aux clients plutôt qu’une succession de noms de villes.",
    relatedSlugs: ["rediger-page-services-entreprise", "site-recevoir-demandes-devis-utiles"],
    sections: [
      {
        id: "secteur", title: "1. Définir votre secteur habituel avec des repères simples",
        paragraphs: ["Vous pouvez présenter une ville de départ et les environs, un ensemble de communes ou un secteur géographique compréhensible. Choisissez la formulation qui correspond à votre organisation quotidienne plutôt qu’une couverture théorique très large.", "Si vous utilisez un rayon, précisez ce qu’il représente dans votre fonctionnement. Certaines distances ou conditions d’accès demandent un échange : mieux vaut le dire que laisser entendre que toutes les adresses sont traitées de façon identique."],
        example: { label: "Exemple fictif : une entreprise de jardinage", text: "« Nous intervenons habituellement à Alençon et dans les communes voisines. Indiquez la commune et le type de travaux pour vérifier la possibilité d’un déplacement hors secteur. » Le client sait quelle information transmettre." },
      },
      {
        id: "prestations", title: "2. Distinguer les zones selon les prestations",
        paragraphs: ["Une même entreprise peut limiter ses petites interventions à proximité tout en acceptant des projets plus importants plus loin. Présentez cette différence sur la page Services, puis confirmez la faisabilité au moment de la demande.", "Si certaines missions sont réalisées à distance, expliquez lesquelles et comment se passent les échanges. Une prestation en visioconférence et une visite sur place ne demandent pas les mêmes informations pratiques."],
      },
      {
        id: "conditions", title: "3. Expliquer les conditions de déplacement avant le devis",
        paragraphs: ["Indiquez les éléments à vérifier : adresse ou commune, type de mission, disponibilité et éventuels frais à préciser. Vous n’avez pas besoin de chiffrer chaque cas sur le site, mais le prospect doit comprendre comment la zone sera confirmée.", "Ne présentez pas un accueil sur place si vos clients ne peuvent pas réellement s’y rendre. Distinguez un atelier, une adresse de correspondance et un lieu recevant du public pour que les indications de visite restent exactes."],
      },
      {
        id: "pages-locales", title: "4. Éviter les pages de villes presque identiques",
        paragraphs: ["Changer uniquement le nom d’une commune dans plusieurs textes apporte peu d’informations au lecteur. Google cite parmi les pratiques abusives certaines pages ciblant des villes ou régions et redirigeant les visiteurs vers la même destination sans utilité propre.", "Une page locale mérite un contenu distinct lorsqu’elle répond à un vrai besoin : modalités particulières, informations pratiques ou réalisations pertinentes dans ce secteur. Une seule présentation claire de la zone peut suffire lorsque les conditions sont les mêmes partout."],
        links: [{ label: "Source : règles Google sur les pages satellites", href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=fr#doorway-abuse" }],
      },
      {
        id: "coherence", title: "5. Vérifier la cohérence sur l’ensemble du site",
        paragraphs: ["Relisez l’accueil, les services et le contact pour éviter des secteurs différents selon les pages. Les exemples de réalisations ne doivent pas laisser penser qu’une zone exceptionnelle constitue votre secteur habituel.", "Dans le formulaire, demandez la commune lorsque cette information vous aide réellement à répondre. Vos retours sur les demandes reçues permettront de préciser le texte si des personnes restent régulièrement dans le doute."],
      },
    ],
    nextStep: "Décrivez votre secteur habituel et les prestations réalisées à distance ou hors zone. Nous pourrons rendre ces informations faciles à trouver dans votre site.",
    nextHref: "/demander-mon-site", nextLabel: "Présenter mon secteur d’activité",
  },
  {
    slug: "adresse-email-professionnelle-domaine",
    category: "DOMAINE & MESSAGERIE",
    title: "Faut-il une adresse e-mail professionnelle liée à son domaine ?",
    seoTitle: "Adresse e-mail professionnelle et domaine : comprendre",
    description: "Domaine, boîte e-mail et formulaire sont des services distincts. Comprenez ce qu’il faut préparer pour une adresse professionnelle et préserver votre messagerie.",
    introduction: "Vous souhaitez une adresse du type « contact » suivie du domaine de votre entreprise. Réserver le domaine constitue une première étape, mais ne crée pas automatiquement la boîte e-mail. Le site et la messagerie doivent être préparés selon les services réellement nécessaires.",
    takeaway: "Distinguez l’adresse du site, la boîte qui reçoit les messages et le service qui envoie les e-mails du formulaire. Une messagerie professionnelle doit être définie séparément si elle n’est pas incluse dans l’offre choisie.",
    relatedSlugs: ["choisir-nom-domaine-entreprise", "recuperer-site-domaine-changer-prestataire"],
    sections: [
      {
        id: "distinctions", title: "1. Séparer le domaine, le site et la boîte e-mail",
        paragraphs: ["Le domaine sert d’adresse commune, tandis que l’hébergement rend le site accessible et qu’un service de messagerie gère les boîtes e-mail. Ces éléments peuvent dépendre de fournisseurs différents.", "Dans les réglages du domaine, les enregistrements MX orientent les messages entrants vers les serveurs de messagerie. Ils expliquent pourquoi un changement de gestion du domaine doit tenir compte du courrier existant, même si le site semble indépendant."],
        links: [{ label: "Source : rôle des enregistrements MX", href: "https://www.cloudflare.com/learning/dns/dns-records/dns-mx-record/" }],
      },
      {
        id: "usages", title: "2. Choisir une adresse selon les personnes qui répondront",
        paragraphs: ["Une adresse générale peut servir au premier contact et une adresse nominative à un interlocuteur précis. Demandez-vous qui doit consulter les messages et comment assurer la continuité en cas d’absence.", "Préparez aussi les usages : réception uniquement, envoi depuis un téléphone, accès partagé ou plusieurs personnes. Une simple redirection et une vraie boîte avec envoi ne répondent pas forcément au même besoin. Faites préciser le fonctionnement avant de choisir le service."],
        example: { label: "Exemple fictif : un petit atelier", text: "L’atelier veut que deux personnes puissent suivre les demandes générales. Il doit prévoir l’organisation de cette réception et des réponses, plutôt que créer une adresse sans décider qui la consultera." },
      },
      {
        id: "formulaire", title: "3. Ne pas confondre la messagerie et les e-mails du formulaire",
        paragraphs: ["Un formulaire peut utiliser un service d’envoi pour transmettre une demande vers votre boîte existante. Cela ne signifie pas que ce service fournit une boîte que vous pouvez ouvrir pour lire et rédiger vos e-mails quotidiens.", "Après configuration, testez le parcours complet : envoi depuis le site, réception, lecture et possibilité de répondre au bon interlocuteur. Vérifiez également les courriers indésirables. Une confirmation affichée à l’écran ne démontre pas à elle seule la réception du message."],
      },
      {
        id: "transition", title: "4. Signaler la messagerie avant tout changement du domaine",
        paragraphs: ["Si vous utilisez déjà des adresses liées au domaine, indiquez le fournisseur et les boîtes concernées avant la mise en ligne ou un transfert. Gardez les réglages nécessaires disponibles pour la personne qui prépare la transition.", "Ne supprimez pas l’ancien service tant que le futur fonctionnement n’a pas été vérifié. Si la messagerie change elle aussi de fournisseur, la reprise des messages et des accès constitue un travail distinct à organiser explicitement."],
      },
      {
        id: "offre", title: "5. Vérifier le périmètre avant de commander",
        paragraphs: ["L’offre vitrine Zelyweb prévoit le site, son hébergement et la gestion du domaine dans la limite annoncée. Elle ne comprend pas automatiquement des boîtes e-mail professionnelles. Mentionnez ce besoin dès votre demande pour qu’il soit étudié séparément.", "Si votre boîte actuelle vous convient, elle peut rester l’adresse de réception à examiner pour le formulaire. L’important est de disposer d’un contact fiable, consulté et correctement testé, plutôt que de multiplier les adresses sans organisation."],
      },
    ],
    nextStep: "Indiquez si vous possédez déjà un domaine et une messagerie. Ces informations permettront de préparer le contact du site et les démarches à prévoir sans les confondre.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer le contact de mon site",
  },
  {
    slug: "repondre-demandes-contact-site",
    category: "CONTACT & SUIVI",
    title: "Comment organiser les réponses aux demandes reçues sur son site ?",
    seoTitle: "Organiser le suivi des demandes de contact de votre site",
    description: "Réception, premier échange et suivi : une méthode simple pour traiter les demandes du formulaire sans perdre les informations utiles à vos projets.",
    introduction: "Le formulaire fonctionne et les premières demandes arrivent. Pour leur donner une suite, il faut savoir qui les lit, quelles informations demander et comment suivre le prochain échange. Une organisation légère peut suffire pour commencer.",
    takeaway: "Désignez un responsable, répondez selon votre disponibilité réelle et gardez une prochaine action pour chaque demande. Le site facilite le premier contact ; le suivi du projet reste à organiser dans votre activité.",
    relatedSlugs: ["site-recevoir-demandes-devis-utiles", "questions-faq-site-entreprise"],
    sections: [
      {
        id: "reception", title: "1. Vérifier qui reçoit et consulte les messages",
        paragraphs: ["Choisissez une boîte suivie régulièrement et une personne responsable de la première réponse. Si plusieurs personnes y accèdent, définissez comment éviter deux réponses contradictoires ou un message que chacun pense traité par l’autre.", "Après la publication et les changements de configuration, faites un envoi de test jusqu’à la réception effective. Gardez un moyen de contact visible pour signaler un problème si le formulaire ne permet pas d’aboutir."],
      },
      {
        id: "premiere-reponse", title: "2. Confirmer la lecture et préciser la prochaine étape",
        paragraphs: ["Votre premier message peut reprendre le besoin compris, demander une précision et proposer la suite. Il n’est pas nécessaire de rédiger immédiatement une proposition complète si des éléments essentiels manquent.", "Annoncez uniquement un délai ou un rendez-vous que vous pouvez tenir. Un accusé de réception automatique indique que la demande a été enregistrée ; il ne remplace pas la lecture et la prise en charge réelles."],
        example: { label: "Exemple fictif : une demande de chantier", text: "« Bonjour, merci pour votre demande concernant la rénovation de votre entrée. Pouvez-vous préciser la commune et la surface approximative ? Ces éléments me permettront de vous proposer la suite de l’échange. » La réponse reste ciblée sur le besoin reçu." },
      },
      {
        id: "precisions", title: "3. Compléter le besoin avec quelques questions ciblées",
        paragraphs: ["Vérifiez la prestation attendue, la localisation si elle compte et les contraintes connues. Demandez seulement les informations qui permettent de décider de la prochaine étape. Le détail technique peut venir lors d’un échange adapté.", "Si vous ne prenez pas le projet en charge, une réponse claire évite de laisser le prospect attendre. Si la demande relève d’un autre service de votre entreprise, indiquez qui poursuivra la conversation."],
      },
      {
        id: "suivi", title: "4. Garder une trace simple des actions à faire",
        paragraphs: ["Un tableau ou votre outil habituel peut regrouper la date, le sujet, la personne responsable et la prochaine action. Le but est de savoir ce qui attend une réponse, un rendez-vous ou une décision, sans recopier inutilement toutes les informations partout."],
        table: { caption: "Un suivi minimal à adapter à votre activité", headers: ["État", "Action à prévoir"], highlightLastRow: false, rows: [["Nouvelle demande", "Lire et attribuer le suivi."], ["Précision demandée", "Noter la question et la date de l’échange."], ["Proposition envoyée", "Prévoir la suite convenue avec la personne."], ["Terminée ou sans suite", "Mettre à jour le suivi pour ne plus la laisser en attente."]] },
      },
      {
        id: "ameliorer", title: "5. Utiliser les échanges pour améliorer le site",
        paragraphs: ["Repérez les informations que vous redemandez presque toujours. Une indication près du formulaire ou une précision sur la page Services peut aider les prochaines personnes à mieux préparer leur message.", "Le volume de demandes ne suffit pas à mesurer leur intérêt. Regardez si les besoins correspondent à votre offre et si les prospects comprennent la suite. Un formulaire personnalisé, une automatisation ou une connexion à un outil de suivi doit être défini séparément du site vitrine de base."],
      },
    ],
    nextStep: "Décrivez votre façon de traiter une nouvelle demande. Nous pourrons préparer un site qui donne les bons repères avant le premier échange.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer un contact utile",
  },
  {
    slug: "preparer-retours-premiere-version-site",
    category: "AJUSTEMENTS & VALIDATION",
    title: "Comment préparer ses retours sur la première version de son site ?",
    seoTitle: "Première version du site : préparer vos retours",
    description: "Relisez le contenu, précisez les changements et regroupez vos remarques : une méthode pratique pour ajuster la première version de votre site avec Zelyweb.",
    introduction: "Vous découvrez votre futur site et plusieurs idées vous viennent à la fois. Pour transformer ces impressions en ajustements utiles, commencez par distinguer les corrections indispensables, les préférences et les nouvelles demandes. Une liste précise facilite les échanges.",
    takeaway: "Pour chaque remarque, indiquez la page, l’élément concerné et le résultat souhaité. Regroupez vos retours et relisez la version ajustée avant de donner votre validation finale.",
    relatedSlugs: ["checklist-avant-mise-en-ligne-site", "choisir-style-couleurs-site"],
    sections: [
      {
        id: "lecture", title: "1. Faire une première visite comme un futur client",
        paragraphs: ["Commencez par l’accueil, puis cherchez une prestation et le contact. Notez ce qui n’est pas clair avant de vous concentrer sur les détails de couleur ou d’espacement. Essayez aussi le site sur téléphone.", "Relisez ensuite les informations réelles : coordonnées, horaires, services, parcours et photos. Une erreur de numéro ou une prestation inexistante mérite une correction prioritaire, même si la présentation vous plaît."],
      },
      {
        id: "remarques", title: "2. Transformer une impression en demande précise",
        paragraphs: ["« Je n’aime pas cette partie » peut ouvrir un échange, mais ne précise pas ce qui doit changer. Expliquez ce qui vous gêne et l’objectif recherché : rendre une prestation plus visible, corriger une formulation ou utiliser une autre photo.", "Si vous avez le contenu de remplacement, transmettez-le avec la remarque. Une capture peut aider à situer l’élément, mais accompagnez-la d’une explication écrite."],
        example: { label: "Exemple de retour concret", text: "« Page Services, bloc Entretien : remplacer la première phrase par ce texte et préciser que je n’interviens pas le dimanche. » La page, le contenu et le résultat attendu sont identifiés." },
      },
      {
        id: "regrouper", title: "3. Regrouper les remarques et clarifier qui valide",
        paragraphs: ["Rassemblez les retours dans une seule liste organisée par page. Si plusieurs personnes participent, confrontez leurs remarques avant l’envoi pour éviter de demander deux changements opposés.", "Une personne peut centraliser les décisions finales. Les corrections de contenu, les préférences de présentation et les besoins nouveaux restent alors faciles à distinguer et à traiter."],
        bullets: ["Page et titre du bloc concerné.", "Texte ou visuel actuel à modifier.", "Correction ou objectif souhaité.", "Fichier de remplacement, si disponible.", "Question à discuter si vous hésitez encore."],
      },
      {
        id: "perimetre", title: "4. Distinguer les ajustements d’un nouveau besoin",
        paragraphs: ["Corriger des textes, remplacer des photos ou ajuster les couleurs peut relever des retours de création prévus. Ajouter des pages, une boutique ou changer entièrement la direction du projet constitue une demande différente à examiner avant réalisation.", "Chez Zelyweb, la première version complète est gratuite avant commande. Après acceptation et paiement de la création, trois séries de retours regroupés sont incluses, à transmettre dans les trente jours suivant ce paiement. Les demandes hors périmètre nécessitent un devis complémentaire accepté."],
      },
      {
        id: "valider", title: "5. Relire les changements avant le feu vert final",
        paragraphs: ["Comparez la version ajustée avec votre liste, puis vérifiez que les textes et visuels fonctionnent ensemble. Refaites le parcours principal et confirmez les coordonnées. Une remarque corrigée ne dispense pas de relire l’ensemble de la page.", "Après validation des ajustements, vous recevez l’e-mail permettant d’activer vous-même l’abonnement. Le premier mois est payé avant la publication. Cette validation sert à confirmer la version prête à être mise en ligne, avec le domaine et les accès nécessaires."],
        links: [{ label: "Voir toutes les étapes sur un projet fictif de salon", href: "/comment-ca-marche#exemple-salon" }],
      },
    ],
    nextStep: "Vous voulez savoir comment se déroule le projet avant de commencer ? Consultez le parcours complet, de la demande gratuite à la publication.",
    nextHref: "/comment-ca-marche", nextLabel: "Comprendre les étapes du projet",
  },
  {
    slug: "comparer-devis-creation-site",
    category: "DEVIS & CHOIX",
    title: "Comment comparer plusieurs devis de création de site internet ?",
    seoTitle: "Comparer des devis de création de site internet",
    description: "Contenus, fonctionnalités, paiements, gestion et sortie : les points à vérifier pour comparer des devis de site sur un périmètre réellement équivalent.",
    introduction: "Deux propositions peuvent annoncer un site de cinq pages et couvrir des travaux très différents. Avant de choisir un montant, vérifiez ce qui sera préparé, ce que vous devrez fournir et le fonctionnement après publication. Une comparaison utile commence par ces questions.",
    takeaway: "Mettez les devis sur une base commune : contenu, fonctionnalités, délais, coût récurrent et conditions de sortie. Un prix plus élevé ou plus faible doit être examiné avec les prestations correspondantes.",
    relatedSlugs: ["budget-site-vitrine-creation-entretien", "site-vitrine-boutique-reservation"],
    sections: [
      {
        id: "perimetre", title: "1. Vérifier ce que le mot « site » recouvre",
        paragraphs: ["Comparez les pages, les langues, les formulaires et les fonctions prévues. Une boutique, un agenda de réservation ou un espace client ne se résument pas à une page supplémentaire. Décrivez le parcours attendu pour que chaque proposition puisse répondre au même besoin.", "Vérifiez aussi la préparation des textes et des images. Certains projets reposent sur des contenus finalisés fournis par le client ; d’autres prévoient une aide à leur préparation. Cette différence peut modifier le travail et le calendrier."],
      },
      {
        id: "collaboration", title: "2. Comparer la façon de travailler et de valider",
        paragraphs: ["Demandez qui sera votre interlocuteur, comment sont présentées les versions et combien de séries de retours sont prévues. Repérez le moment où le périmètre est accepté et celui où les modifications supplémentaires sont chiffrées.", "Un délai annoncé peut dépendre des informations transmises, des validations ou des accès au domaine. Faites préciser son point de départ et les éléments nécessaires plutôt que de comparer uniquement une date."],
        example: { label: "Exemple fictif de différence de périmètre", text: "Une proposition comprend l’intégration de textes prêts à publier ; une autre inclut leur préparation à partir d’entretiens. Les montants ne couvrent donc pas exactement le même travail, même si le nombre de pages est identique." },
      },
      {
        id: "cout", title: "3. Additionner le prix initial et les coûts dans la durée",
        paragraphs: ["Séparez la création, l’hébergement, le domaine et les interventions récurrentes. Regardez les renouvellements et les options nécessaires à votre fonctionnement. Comparez les montants sur une durée choisie avec les mêmes hypothèses.", "Vérifiez les échéances de paiement et l’engagement éventuel. Un abonnement accessible ne remplace pas la lecture du coût initial et du périmètre inclus. À l’inverse, un prix de création seul ne décrit pas forcément les frais des années suivantes."],
        links: [{ label: "Voir un calcul détaillé sur trois ans", href: "/conseils/budget-site-vitrine-creation-entretien" }],
      },
      {
        id: "suite", title: "4. Prévoir les modifications et la récupération du site",
        paragraphs: ["Demandez comment seront traitées les mises à jour et les incidents, sans supposer qu’une surveillance ou des interventions illimitées sont comprises. Les nouvelles pages et fonctions doivent avoir un mode de chiffrage clair.", "Clarifiez le titulaire du domaine, les fichiers remis à la sortie et les éventuels services dépendants du fournisseur. La remise des fichiers, leur installation ailleurs et leur adaptation technique sont des opérations distinctes."],
        links: [{ label: "Comprendre la récupération du site et du domaine", href: "/conseils/recuperer-site-domaine-changer-prestataire" }],
      },
      {
        id: "grille", title: "5. Votre grille de comparaison avant décision",
        paragraphs: ["Pour chaque ligne, notez ce qui est inclus, exclu ou encore à préciser. Les zones floues méritent une réponse avant de commander. Le choix peut ensuite tenir compte du budget, de l’accompagnement et des fonctions réellement utiles."],
        table: { caption: "Les informations à relever sur chaque proposition", headers: ["Poste", "À vérifier"], highlightLastRow: false, rows: [["Création", "Pages, contenus, fonctions et ajustements."], ["Organisation", "Interlocuteur, validations et point de départ des délais."], ["Budget", "Paiement initial, récurrence et options nécessaires."], ["Gestion", "Modifications incluses et interventions supplémentaires."], ["Sortie", "Domaine, fichiers et migration éventuelle."]] },
      },
    ],
    nextStep: "Vous connaissez déjà votre besoin ? Consultez le périmètre Zelyweb pour le comparer à vos autres propositions, ligne par ligne.",
    nextHref: "/notre-offre", nextLabel: "Examiner l’offre Zelyweb",
  },
  {
    slug: "quand-preparer-site-lancement-entreprise",
    category: "LANCEMENT & ORGANISATION",
    title: "Quand préparer son site pendant le lancement de son entreprise ?",
    seoTitle: "Lancement d’entreprise : quand préparer votre site ?",
    description: "Offre, contenus, domaine et publication : organisez la préparation de votre site autour des informations disponibles et des étapes de lancement de votre activité.",
    introduction: "Vous préparez votre entreprise et plusieurs chantiers avancent en même temps. Le site peut être travaillé avant que tout soit finalisé, mais certaines informations doivent être confirmées avant publication. Un calendrier simple aide à distinguer préparation et mise en ligne.",
    takeaway: "Commencez lorsque vous pouvez expliquer votre activité et votre clientèle. Gardez du temps pour les contenus, les retours et le domaine, puis validez les informations finales avant de partager le site.",
    relatedSlugs: ["preparer-retours-premiere-version-site", "checklist-avant-mise-en-ligne-site"],
    sections: [
      {
        id: "direction", title: "1. Clarifier le rôle du site dans votre lancement",
        paragraphs: ["Choisissez ce que le site doit permettre au départ : présenter une offre, montrer une méthode ou préparer les demandes de devis. Cette priorité aide à décider ce qui doit être prêt pour la première publication.", "Si votre offre change encore fortement, commencez par une description et une structure de pages. Vous pourrez préparer le projet sans considérer chaque texte ou tarif comme définitif."],
      },
      {
        id: "preparation", title: "2. Préparer les contenus en parallèle des autres démarches",
        paragraphs: ["Rassemblez les prestations, les coordonnées prévues et les éléments de parcours. Notez les informations à confirmer pour éviter qu’un contenu provisoire soit publié par erreur. Quelques photos personnelles ou une démonstration clairement identifiée peuvent servir de matière de départ.", "Vous n’avez pas besoin d’attendre un dossier parfait pour échanger avec un prestataire. Expliquez cependant ce qui manque et à quel moment vous pensez pouvoir le valider. Cela permet d’organiser les étapes au lieu de découvrir le blocage en fin de projet."],
        example: { label: "Exemple fictif : une tapissière qui s’installe", text: "Elle peut préparer la présentation de ses services et de ses projets personnels pendant l’aménagement de l’atelier. Elle confirme ensuite l’adresse de réception, les horaires et les photos définitives avant la publication." },
      },
      {
        id: "dependances", title: "3. Repérer ce qui peut retarder la publication",
        paragraphs: ["Le domaine doit être disponible ou accessible, les coordonnées vérifiées et la version du site validée. Si un ancien prestataire gère déjà des services, prévoyez le temps de préparer les accès et la transition.", "Distinguez une date souhaitée d’une date confirmée avec toutes ses conditions. Gardez une marge pour relire et corriger plutôt que d’envoyer le dernier contenu juste avant une annonce ou l’impression de supports."],
        bullets: ["Disponibilité du nom et validation du domaine.", "Informations professionnelles et moyens de contact définitifs.", "Contenus publiables et visuels choisis.", "Retours regroupés et validation finale.", "Activation et paiements prévus avant la mise en ligne."],
      },
      {
        id: "zelyweb", title: "4. Comprendre les étapes de préparation chez Zelyweb",
        paragraphs: ["La première version complète gratuite est préparée sous sept jours ouvrés après réception des informations nécessaires. Si vous l’acceptez, vous payez la création avant les ajustements et disposez de trois séries de retours regroupés à transmettre dans les trente jours suivant ce paiement.", "Après validation, vous activez vous-même l’abonnement et payez le premier mois. La publication intervient sous deux jours ouvrés après confirmation de ce paiement si le domaine et ses accès sont prêts. Ces étapes ne constituent pas une promesse de mise en ligne à une date fixe indépendamment de vos validations."],
        links: [{ label: "Suivre un exemple de projet de salon de coiffure", href: "/comment-ca-marche#exemple-salon" }],
      },
      {
        id: "diffuser", title: "5. Préparer la diffusion après les derniers tests",
        paragraphs: ["Avant l’annonce, ouvrez le domaine définitif sur téléphone, vérifiez les coordonnées et envoyez une demande de test jusqu’à réception. Vous pourrez ensuite ajouter l’adresse sur vos profils et supports.", "Le site peut évoluer avec votre activité : prévoyez les premières réalisations et les informations à actualiser. L’apparition dans Google suit un processus distinct de la publication ; le lancement peut déjà s’appuyer sur le partage direct de votre adresse."],
      },
    ],
    nextStep: "Indiquez votre étape de lancement et les informations déjà disponibles. Nous pourrons préparer la première proposition en identifiant ce qui reste à confirmer.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer mon lancement",
  },
  {
    slug: "choisir-style-couleurs-site",
    category: "STYLE & IDENTITÉ",
    title: "Comment choisir le style et les couleurs de son site professionnel ?",
    seoTitle: "Choisir le style et les couleurs de votre site professionnel",
    description: "Ambiance, couleurs, typographie et références : préparez une direction visuelle cohérente avec votre activité sans compliquer la lecture ni le contact.",
    introduction: "Vous avez des préférences visuelles sans forcément connaître les mots pour les expliquer. Pour préparer le style du site, partez de votre activité, de vos clients et des contenus à montrer. Les couleurs viennent accompagner cette présentation.",
    takeaway: "Choisissez quelques références et expliquez ce qui vous plaît dans chacune. Une direction simple, lisible et cohérente est plus facile à ajuster qu’une accumulation d’effets sans objectif commun.",
    relatedSlugs: ["photos-site-internet-telephone", "preparer-retours-premiere-version-site"],
    sections: [
      {
        id: "ambiance", title: "1. Décrire l’ambiance avec des exemples concrets",
        paragraphs: ["Expliquez ce que vous souhaitez faire ressentir et ce que cela signifie pour votre activité. « Sobre » peut vouloir dire peu de couleurs, beaucoup d’espace ou une présentation très structurée. Ajoutez des références pour éviter les interprétations différentes.", "Pensez aussi à vos visiteurs et aux informations qu’ils viennent chercher. Le style d’un portfolio de photographie et celui d’un service de dépannage peuvent partager des qualités de clarté tout en mettant l’accent sur des contenus différents."],
        example: { label: "Exemple fictif : une ébéniste", text: "Elle souhaite une présentation calme qui laisse de la place aux matières et aux photos de détail. Elle montre deux références et précise qu’elle apprécie leurs espaces et leurs légendes, sans demander de copier leur identité." },
      },
      {
        id: "existant", title: "2. Partir des éléments déjà utilisés par votre entreprise",
        paragraphs: ["Si vous possédez un logo, des documents ou une identité, transmettez les fichiers et indiquez ce qui doit être conservé. La cohérence entre les supports aide à reconnaître votre entreprise.", "Sans identité existante, une présentation typographique du nom et quelques choix visuels peuvent permettre de commencer. La création d’un logo original ou d’une charte complète reste un besoin distinct à définir, sans le supposer compris dans le site."],
      },
      {
        id: "lecture", title: "3. Choisir les couleurs avec leur usage, pas seulement leur teinte",
        paragraphs: ["Distinguez les fonds, les textes et les éléments d’action. Une couleur peut plaire sur une grande image mais rendre un petit texte difficile à lire. Vérifiez les associations dans les vraies pages, notamment sur téléphone.", "Gardez les boutons et les liens reconnaissables et ne faites pas dépendre une information importante uniquement de sa couleur. Les messages et libellés doivent rester compréhensibles par leur texte et leur présentation."],
        bullets: ["Le texte reste lisible sur chaque fond.", "Les titres permettent de repérer les parties de la page.", "Les boutons se distinguent sans concurrencer tous les autres éléments.", "Les photographies et les couleurs du site fonctionnent ensemble.", "La présentation reste utilisable sur un petit écran."],
      },
      {
        id: "references", title: "4. Préparer deux ou trois références commentées",
        paragraphs: ["Pour chaque site de référence, notez précisément ce qui vous intéresse : taille des photos, disposition, ambiance, lisibilité ou navigation. Indiquez aussi ce qui ne vous convient pas. Une liste courte mais expliquée fournit une direction plus utile qu’un grand dossier d’images sans commentaire.", "Ces références servent à communiquer vos préférences. Elles ne remplacent pas vos contenus et ne doivent pas conduire à reproduire l’identité ou les éléments d’un autre professionnel."],
      },
      {
        id: "validation", title: "5. Évaluer une vraie page avant de figer les choix",
        paragraphs: ["Regardez la proposition avec vos textes et vos photos. Vérifiez d’abord que le métier et les prestations se comprennent, puis affinez les préférences visuelles. Une belle combinaison de couleurs ne compense pas un contact introuvable.", "Chez Zelyweb, la première version gratuite permet de visualiser cette direction avant commande. Après acceptation et paiement de la création, les ajustements de couleurs et de présentation entrent dans les retours prévus selon leur périmètre. Un changement complet de direction doit être étudié séparément."],
        links: [{ label: "Regrouper des retours précis sur la première version", href: "/conseils/preparer-retours-premiere-version-site" }],
      },
    ],
    nextStep: "Partagez quelques préférences et références en expliquant ce que vous aimez. Nous pourrons préparer une première direction adaptée à votre activité.",
    nextHref: "/demander-mon-site", nextLabel: "Imaginer le style de mon site",
  },
];
