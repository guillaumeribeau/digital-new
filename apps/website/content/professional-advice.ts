import type { AdviceArticle } from "./advice";

export const professionalAdviceArticles: AdviceArticle[] = [
  {
    slug: "site-internet-ou-reseaux-sociaux",
    category: "STRATÉGIE & VISIBILITÉ",
    title: "Site internet ou réseaux sociaux : faut-il choisir ?",
    seoTitle: "Site internet ou réseaux sociaux pour votre entreprise ?",
    description: "Réseaux sociaux pour échanger, site pour présenter votre offre : comprenez leur rôle et choisissez vos priorités selon votre activité et votre temps disponible.",
    introduction: "Vous avez déjà une page sur un réseau social et vous vous demandez si un site est utile. Ou vous préparez votre site sans vouloir publier tous les jours. Commencez par les questions de vos clients : où vous découvrent-ils, que veulent-ils vérifier et comment vous contactent-ils ?",
    takeaway: "Les réseaux sociaux peuvent faire découvrir votre activité et entretenir les échanges. Un site rassemble vos informations et présente vos prestations à une adresse que vous pouvez partager partout. Choisissez un fonctionnement que vous pourrez tenir dans la durée.",
    relatedSlugs: ["faire-connaitre-site-apres-publication", "site-internet-bouche-a-oreille"],
    sections: [
      {
        id: "roles", title: "1. Donner un rôle précis à chaque support",
        paragraphs: ["Sur un réseau social, vous pouvez montrer une actualité, répondre à une question ou partager un aperçu de votre travail. Le format se prête aux échanges réguliers. Mais une publication ancienne ne constitue pas toujours le chemin le plus simple vers vos horaires, vos prestations ou votre zone d’intervention.", "Votre site peut servir de point de référence : une adresse à mettre dans votre signature, sur un devis ou dans votre profil. Le visiteur y retrouve une présentation organisée, même s’il ne suit pas votre compte social. Cette présence doit rester à jour pour être utile."],
        table: { caption: "Des usages complémentaires selon le besoin du visiteur", headers: ["Besoin", "Support à préparer"], highlightLastRow: false, rows: [["Découvrir une actualité", "Une publication ou une nouvelle partagée sur votre réseau."], ["Comprendre une prestation", "Une page du site qui décrit son contenu et son déroulement."], ["Vérifier des réalisations", "Une sélection expliquée sur le site, relayée sur vos profils."], ["Vous joindre", "Des coordonnées cohérentes et un contact facile sur chaque support."]] },
      },
      {
        id: "parcours", title: "2. Regarder comment vos clients arrivent jusqu’à vous",
        paragraphs: ["Un professionnel recommandé par un proche peut recevoir une visite de vérification : le prospect connaît déjà son nom et cherche à comprendre son travail. Une personne qui découvre une photo sur un réseau aura peut-être besoin d’informations plus détaillées avant d’appeler.", "Demandez à vos nouveaux contacts comment ils vous ont trouvé. Notez leurs réponses et les questions qui reviennent. Vous pourrez concentrer vos efforts sur les supports qui accompagnent réellement votre activité, plutôt que d’ouvrir plusieurs comptes difficiles à entretenir."],
        example: { label: "Exemple fictif : une entreprise de peinture", text: "Une peintre partage la rénovation d’un escalier sur son profil. Le lien mène à une réalisation expliquée sur son site, avec sa zone d’intervention et un bouton de demande de devis. La publication attire l’attention ; la page apporte les détails nécessaires pour prendre contact." },
      },
      {
        id: "temps", title: "3. Choisir selon le temps que vous pouvez y consacrer",
        paragraphs: ["Préparez d’abord les informations durables : ce que vous proposez, pour qui, dans quelle zone et comment vous joindre. Ensuite, choisissez un réseau que vous utilisez volontiers et un rythme compatible avec votre travail. Vous n’avez pas besoin d’être présent sur toutes les plateformes.", "Conservez vos photos et textes d’origine dans un dossier accessible. Un même projet peut servir à rédiger une fiche sur le site et une publication courte qui y renvoie. Vous gagnez du temps sans recopier une longue présentation dans chaque message."],
        bullets: ["Un site dont les prestations et coordonnées sont à jour.", "Un ou deux profils utiles à votre clientèle, si vous pouvez les suivre.", "Une courte réserve de photos et de sujets issus de votre activité.", "Un moment prévu pour répondre aux demandes reçues."],
      },
      {
        id: "coherence", title: "4. Relier vos supports avec des informations cohérentes",
        paragraphs: ["Utilisez le même nom commercial et vérifiez les coordonnées sur chaque support. Placez l’adresse du site dans vos profils lorsque le service le permet. Depuis le site, ne renvoyez que vers des comptes que vous souhaitez réellement montrer à vos prospects.", "Une publication consacrée à une prestation peut pointer vers sa page plutôt que vers l’accueil. Le visiteur poursuit alors sa lecture sans devoir chercher le service mentionné. Vérifiez aussi que le lien s’ouvre correctement sur téléphone."],
        links: [{ label: "Préparer des pages utiles pour votre entreprise", href: "/conseils/pages-site-petite-entreprise" }],
      },
      {
        id: "priorite", title: "5. Commencer par un socle simple, puis observer les demandes",
        paragraphs: ["Si vous recevez toujours les mêmes questions, commencez par les rendre faciles à trouver sur votre site. Si votre métier se montre bien en images et que vous avez du contenu régulier, un réseau social peut compléter cette présentation. Dans les deux cas, la clarté du contact reste essentielle.", "Chez Zelyweb, le site vitrine présente votre activité en cinq pages et vous découvrez une première version gratuitement avant de décider de commander. L’offre ne comprend pas une animation régulière des réseaux sociaux. Nous pouvons organiser le site pour qu’il serve de destination à vos publications et à vos recommandations."],
      },
    ],
    nextStep: "Vous avez déjà des profils ou vous partez de zéro ? Indiquez-nous comment vos clients vous trouvent aujourd’hui pour préparer une présentation adaptée.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer ma présence sur internet",
  },
  {
    slug: "site-recevoir-demandes-devis-utiles",
    category: "CONTACT & DEVIS",
    title: "Quelles informations afficher pour recevoir des demandes de devis utiles ?",
    seoTitle: "Un site qui facilite les demandes de devis utiles",
    description: "Prestations, zone, déroulement et formulaire : les informations à présenter sur votre site pour aider les prospects à décrire leur projet et vous contacter.",
    introduction: "« Bonjour, combien ça coûte ? » Une demande aussi courte oblige souvent à reprendre tout depuis le début. Votre site peut aider le prospect à mieux expliquer son besoin, à condition de lui donner les bons repères avant le formulaire.",
    takeaway: "Décrivez clairement votre prestation et les informations nécessaires pour l’évaluer. Gardez un premier contact court : l’objectif est de pouvoir répondre utilement, puis d’approfondir le projet avec la personne.",
    relatedSlugs: ["repondre-demandes-contact-site", "presenter-tarifs-site-internet"],
    sections: [
      {
        id: "perimetre", title: "1. Expliquer ce que vous prenez en charge",
        paragraphs: ["Présentez vos prestations avec des mots que vos clients emploient. Pour chacune, indiquez à qui elle s’adresse, ce qu’elle comprend et les principales limites. Un visiteur doit pouvoir reconnaître son besoin sans connaître votre vocabulaire de métier.", "Précisez aussi votre zone d’intervention ou votre fonctionnement à distance. Si vous ne réalisez pas certaines missions, dites-le simplement. Ces repères permettent au prospect de savoir s’il peut vous solliciter et évitent des échanges sur un projet hors de votre périmètre."],
        example: { label: "Exemple fictif : une entreprise d’entretien", text: "« Nettoyage régulier de bureaux et de petits locaux professionnels autour d’Angers. Indiquez la commune, la surface approximative et la fréquence souhaitée pour préparer un premier échange. » Le service et les informations de départ sont immédiatement compréhensibles." },
      },
      {
        id: "informations", title: "2. Dire ce qui permet de préparer une réponse",
        paragraphs: ["Choisissez quelques informations qui changent réellement votre estimation. Pour un artisan, il peut s’agir de la commune, du type d’intervention et d’une dimension approximative. Pour un consultant, du contexte et de l’objectif. Expliquez qu’une réponse inconnue peut être précisée pendant l’échange.", "Le budget ou le calendrier peuvent être utiles, mais un prospect n’a pas forcément une estimation fiable. Proposez de les préciser s’ils sont connus, sans transformer une première demande en dossier technique complet."],
        bullets: ["La prestation ou le problème à traiter.", "Le lieu du projet lorsqu’il conditionne l’intervention.", "Une courte description de la situation actuelle.", "Une échéance éventuelle, en distinguant souhait et contrainte.", "Un moyen de joindre la personne pour compléter sa demande."],
      },
      {
        id: "devis", title: "3. Expliquer comment se déroule votre devis",
        paragraphs: ["Indiquez la prochaine étape après l’envoi : échange téléphonique, demande de précisions ou visite sur place selon votre activité. Précisez si un déplacement ou une étude préalable peut être payant avant de l’organiser. Le visiteur doit comprendre ce qu’il demande en cliquant.", "Si vous affichez un prix de départ, décrivez le périmètre correspondant et les éléments qui peuvent le faire évoluer. Un montant isolé sans explication peut créer un malentendu. Si vous annoncez un délai de réponse, choisissez un délai que vous pouvez réellement tenir."],
        example: { label: "Exemple fictif : une consultante indépendante", text: "« Décrivez votre objectif et votre organisation actuelle. Nous échangeons ensuite pour préciser le besoin avant une proposition détaillée. » Cette formulation décrit la suite sans promettre un prix ou un résultat avant d’avoir étudié le projet." },
      },
      {
        id: "formulaire", title: "4. Garder le formulaire simple et guidant",
        paragraphs: ["Un nom, un moyen de réponse et une description peuvent suffire pour commencer. Ajoutez un champ seulement s’il vous aide à traiter la demande. Près de la zone de texte, une consigne courte peut rappeler les deux ou trois éléments utiles à votre métier.", "Prévoyez une confirmation claire après l’envoi et testez la réception effective du message. Le téléphone peut rester disponible pour les personnes qui préfèrent expliquer leur besoin à l’oral. Les fichiers ou photos pourront être demandés ensuite si le formulaire ne prévoit pas leur envoi."],
        links: [{ label: "Vérifier le formulaire avant la publication", href: "/conseils/checklist-avant-mise-en-ligne-site#formulaire" }],
      },
      {
        id: "ameliorer", title: "5. Ajuster les contenus à partir des demandes reçues",
        paragraphs: ["Après quelques échanges, notez ce que vous devez systématiquement redemander. Si une même question manque dans presque tous les messages, ajoutez un repère sur la page Services ou dans les indications de contact. Évaluez la qualité des échanges autant que leur nombre.", "Le site ne garantit pas un volume de demandes. Il peut en revanche présenter plus clairement votre offre et faciliter le premier échange. Chez Zelyweb, nous construisons cette présentation à partir de vos prestations et des besoins de vos clients ; une fonctionnalité de formulaire spécifique doit être définie et chiffrée selon son périmètre."],
      },
    ],
    nextStep: "Quelles informations vous manquent le plus souvent dans une demande ? Partagez vos exemples pour préparer des pages qui guident vos futurs contacts.",
    nextHref: "/demander-mon-site", nextLabel: "Clarifier mon offre sur mon site",
  },
  {
    slug: "photos-site-internet-telephone",
    category: "PHOTOS & CONTENUS",
    title: "Comment prendre de bonnes photos pour son site avec un téléphone ?",
    seoTitle: "Photos pour votre site : réussir avec un téléphone",
    description: "Lumière, cadrage, détails et fichiers d’origine : une méthode simple pour préparer avec votre téléphone des photos utiles au site de votre entreprise.",
    introduction: "Vous souhaitez montrer votre travail, votre atelier ou vos produits sans organiser immédiatement une séance professionnelle. Un téléphone peut fournir une première série utile si vous préparez les sujets et prenez le temps de vérifier les images.",
    takeaway: "Photographiez ce que vos clients ont besoin de comprendre, avec une lumière régulière et un cadrage simple. Gardez les fichiers d’origine et accompagnez chaque sélection d’une courte explication.",
    relatedSlugs: ["presenter-realisations-quand-on-debute", "preparer-creation-site-internet"],
    sections: [
      {
        id: "sujets", title: "1. Préparer une petite liste avant de photographier",
        paragraphs: ["Listez les images qui aideront à présenter votre activité : une vue d’ensemble, des gestes, des détails et quelques réalisations représentatives. Cherchez à expliquer votre travail plutôt qu’à remplir une galerie. Pour chaque sujet, demandez-vous quelle information le visiteur doit retenir.", "Rangez ce qui détourne l’attention et vérifiez l’arrière-plan avant de commencer. Une vue propre de votre espace, sans documents confidentiels dans le cadre, peut déjà rendre votre présentation plus concrète."],
        bullets: ["Une vue qui situe votre lieu ou votre intervention.", "Un geste ou une étape de votre méthode.", "Un détail qui montre la qualité du travail.", "Une réalisation complète avec son contexte.", "Un portrait professionnel si vous souhaitez vous présenter."],
      },
      {
        id: "lumiere", title: "2. Chercher une lumière simple et garder le téléphone stable",
        paragraphs: ["Nettoyez l’objectif, puis observez la lumière avant de prendre la photo. Près d’une fenêtre, une lumière douce peut rendre les détails plus lisibles. Évitez de placer votre sujet devant une fenêtre très lumineuse si son visage ou son travail deviennent sombres.", "Tenez le téléphone avec les deux mains, vérifiez la netteté sur le sujet et prenez plusieurs vues. Si vous devez montrer un petit détail, rapprochez-vous lorsque c’est possible plutôt que d’utiliser un fort zoom numérique. Regardez ensuite les images en grand pour choisir les plus nettes."],
        example: { label: "Exemple fictif : une céramiste", text: "Elle place une tasse près d’une fenêtre, sur un fond uni, puis photographie l’ensemble, l’anse et la texture. Les trois vues racontent davantage qu’une seule photo éloignée de toute l’étagère." },
      },
      {
        id: "cadrage", title: "3. Prévoir plusieurs cadrages pour les pages du site",
        paragraphs: ["Un bandeau large et une petite carte ne demandent pas la même composition. Prenez une vue horizontale et une vue verticale lorsque le sujet le permet. Laissez un peu d’espace autour de l’élément principal pour pouvoir adapter le recadrage sans le couper.", "Conservez des lignes droites pour les intérieurs et évitez les angles qui déforment inutilement un produit ou une pièce. Si vous préparez un avant et un après, essayez de garder le même point de vue et une lumière comparable. Indiquez ce qui a réellement été modifié."],
        bullets: ["Le sujet reste compréhensible dans une petite image.", "Le cadrage laisse de la place aux adaptations mobile et ordinateur.", "Les couleurs restent proches du rendu réel.", "Les retouches ne modifient pas le résultat présenté.", "Les vues d’ensemble et de détail se complètent."],
      },
      {
        id: "selection", title: "4. Sélectionner et transmettre les fichiers d’origine",
        paragraphs: ["Choisissez quelques images différentes et nettes plutôt que de nombreuses variantes presque identiques. Donnez-leur un nom compréhensible et ajoutez une phrase sur ce qu’elles montrent : type de prestation, étape ou contexte du projet.", "Transmettez les originaux avec un outil qui conserve leur qualité. Une capture d’écran ou une image récupérée depuis un réseau social peut avoir perdu des détails. Gardez une copie avant recadrage ; l’optimisation pour le site pourra être réalisée à partir de ces fichiers."],
        example: { label: "Une sélection facile à utiliser", text: "Un dossier par projet, avec une vue d’ensemble, deux détails et un court texte : « Projet personnel, meuble restauré dans mon atelier ; ponçage et nouvelle finition réalisés par mes soins. » Ce contexte aide à choisir la page et la légende appropriées." },
      },
      {
        id: "publication", title: "5. Vérifier ce qui peut être montré et connaître les limites",
        paragraphs: ["Avant la transmission, vérifiez que les images peuvent être publiées : personnes reconnaissables, lieux privés, informations visibles et autorisations nécessaires. Identifiez les démonstrations ou projets personnels lorsqu’ils pourraient être pris pour une commande client.", "Des photos simples peuvent suffire pour lancer une présentation. Pour des produits très détaillés, des portraits ou des conditions de lumière difficiles, une séance professionnelle peut apporter un résultat plus adapté. Chez Zelyweb, nous pouvons partir des contenus disponibles pour la première proposition ; indiquez-nous ce que vous avez et les images que vous souhaitez remplacer."],
        links: [{ label: "Présenter vos réalisations même avec peu de références", href: "/conseils/presenter-realisations-quand-on-debute" }],
      },
    ],
    nextStep: "Vous disposez déjà de quelques photos ? Décrivez votre activité et les contenus disponibles. Nous verrons comment les intégrer à la première version de votre site.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer mon site avec mes photos",
  },
  {
    slug: "quand-refaire-site-entreprise",
    category: "REFONTE & ÉVOLUTION",
    title: "Quand faut-il refaire le site de son entreprise ?",
    seoTitle: "Quand refaire le site internet de votre entreprise ?",
    description: "Contenu dépassé, contact difficile ou offre qui a changé : repérez les signes utiles pour choisir entre une mise à jour et une refonte de votre site.",
    introduction: "Votre site a quelques années et son apparence ne vous plaît plus autant. Cela suffit-il pour tout refaire ? Examinez d’abord ce qui gêne vos clients et ce qui ne représente plus votre activité. Une correction ciblée peut parfois répondre au besoin.",
    takeaway: "L’âge du site ne décide pas à lui seul d’une refonte. Comparez les problèmes à résoudre, les contenus à conserver et le travail nécessaire avant de choisir entre une mise à jour et une nouvelle version.",
    relatedSlugs: ["recuperer-site-domaine-changer-prestataire", "budget-site-vitrine-creation-entretien"],
    sections: [
      {
        id: "signaux", title: "1. Repérer les problèmes concrets pour vos visiteurs",
        paragraphs: ["Ouvrez votre site sur téléphone et cherchez vos prestations comme si vous le découvriez. Peut-on comprendre votre activité, lire les informations et trouver le contact ? Vérifiez le menu, les boutons et l’envoi du formulaire jusqu’à réception du message.", "Un numéro erroné ou une prestation ancienne demande une correction rapide, mais n’oblige pas nécessairement à refaire toutes les pages. À l’inverse, plusieurs parcours inutilisables et une organisation devenue confuse justifient un examen plus large."],
        bullets: ["Les coordonnées ou les services présentés sont dépassés.", "La lecture et la navigation sont difficiles sur téléphone.", "Le formulaire ou des liens importants ne fonctionnent plus.", "Vos offres actuelles sont absentes ou difficiles à expliquer dans la structure existante.", "Vous ne disposez plus d’un fonctionnement clair pour entretenir le site."],
      },
      {
        id: "objectif", title: "2. Définir ce que la nouvelle version doit améliorer",
        paragraphs: ["Choisissez deux ou trois objectifs observables : rendre une prestation plus claire, simplifier les demandes ou présenter un nouveau positionnement. Rassemblez les retours des clients et les questions reçues. Vous disposerez d’un point de comparaison plus utile qu’un simple souhait de modernisation.", "Si vous mesurez déjà votre audience, regardez les pages consultées et les contacts reçus, en tenant compte des limites de cette mesure. Peu de visites ne prouve pas que le site est mauvais : sa diffusion et la demande pour votre offre peuvent aussi être en cause."],
        example: { label: "Exemple fictif : un cabinet de conseil", text: "Le cabinet proposait trois missions et en développe désormais une quatrième. Si sa présentation reste claire, une mise à jour de la page Services peut suffire. Si toute son offre et sa clientèle ont changé, revoir la structure peut être plus pertinent." },
      },
      {
        id: "choix", title: "3. Comparer mise à jour, évolution et refonte",
        paragraphs: ["Une mise à jour corrige des informations ou remplace des visuels. Une évolution ajoute un besoin précis à une base qui fonctionne. Une refonte revoit plus largement l’organisation, la présentation ou la solution technique. Faites préciser ce que chaque proposition comprend avant de comparer les prix."],
        table: { caption: "Choisir le niveau d’intervention selon le problème", headers: ["Situation", "Piste à étudier"], highlightLastRow: false, rows: [["Horaires et quelques photos à corriger", "Une mise à jour du contenu."], ["Une prestation manque dans une structure adaptée", "Une évolution ciblée."], ["L’offre et le parcours ont profondément changé", "Une refonte de la structure et des contenus."], ["Une fonction ne marche plus", "Un diagnostic et une réparation avant de décider d’une refonte."]] },
      },
      {
        id: "conserver", title: "4. Préparer ce qui doit être conservé lors de la transition",
        paragraphs: ["Avant de fermer l’ancien site, listez les contenus utiles, le domaine, la messagerie et les accès disponibles. Gardez les fichiers d’origine et repérez les adresses déjà partagées sur des supports ou d’autres sites.", "Si les adresses des pages changent, préparez une correspondance entre anciennes et nouvelles pages ainsi que les redirections appropriées. Google recommande aussi de tester la nouvelle version et de suivre la transition ; des fluctuations de visibilité peuvent survenir lors d’un changement d’URL. Une refonte ne garantit pas de conserver chaque position."],
        links: [{ label: "Source : préparer une migration avec changement d’URL", href: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=fr" }, { label: "Organiser la récupération de votre site et de votre domaine", href: "/conseils/recuperer-site-domaine-changer-prestataire" }],
      },
      {
        id: "brief", title: "5. Demander une proposition à partir de votre situation réelle",
        paragraphs: ["Partagez l’adresse actuelle, ce qui fonctionne, ce qui vous gêne et les éléments à conserver. Précisez les fonctionnalités particulières : réservation, boutique, espace client ou plusieurs langues. Ces besoins doivent être examinés séparément d’un site vitrine simple.", "Chez Zelyweb, la première proposition gratuite peut vous aider à visualiser une nouvelle présentation. L’offre de base comprend un site vitrine de cinq pages ; une reprise de fonctionnalités, une migration ou un travail particulier sur les anciennes adresses doit être défini avant commande. Ne résiliez pas votre hébergement actuel avant d’avoir préparé la transition."],
      },
    ],
    nextStep: "Envoyez l’adresse de votre site et décrivez les deux ou trois points que vous souhaitez améliorer. Nous pourrons partir d’un besoin concret pour préparer la proposition.",
    nextHref: "/demander-mon-site", nextLabel: "Présenter mon projet de refonte",
  },
  {
    slug: "faire-connaitre-site-apres-publication",
    category: "LANCEMENT & VISIBILITÉ",
    title: "Comment faire connaître son site après sa publication ?",
    seoTitle: "Faire connaître votre site après sa mise en ligne",
    description: "Signature e-mail, profils, partenaires et contenus : un plan simple pour partager votre nouveau site et suivre les demandes après son lancement.",
    introduction: "Votre site est en ligne : il peut maintenant devenir le point de référence de vos échanges. Commencez par les personnes et les supports déjà liés à votre activité, puis observez ce qui amène des demandes pertinentes. Vous pourrez développer votre visibilité progressivement.",
    takeaway: "Partagez la bonne adresse sur vos supports, choisissez quelques actions adaptées à vos clients et vérifiez les contacts reçus. La publication seule ne garantit ni du trafic ni des demandes.",
    relatedSlugs: ["site-internet-ou-reseaux-sociaux", "site-visible-google-apres-mise-en-ligne"],
    sections: [
      {
        id: "supports", title: "1. Mettre l’adresse sur les supports déjà utilisés",
        paragraphs: ["Ajoutez le site dans votre signature e-mail, vos profils professionnels et vos documents destinés aux clients. Si vous utilisez des cartes ou des supports imprimés, vérifiez d’abord l’orthographe et l’ouverture du lien sur téléphone. Un QR code peut être utile s’il mène à une adresse que vous conserverez.", "Choisissez la destination selon le contexte : l’accueil pour présenter l’entreprise, une page de prestation pour répondre à un besoin précis, une réalisation pour illustrer une recommandation. Le visiteur doit retrouver ce qui lui a été annoncé."],
        bullets: ["Signature des e-mails professionnels.", "Profils et pages professionnelles que vous entretenez.", "Devis, présentations et supports remis aux prospects.", "Annuaires professionnels pertinents où vous êtes déjà inscrit.", "Supports de votre lieu d’accueil lorsque cela correspond à votre activité."],
      },
      {
        id: "reseau", title: "2. Annoncer le lancement avec une raison de visiter",
        paragraphs: ["Une annonce peut expliquer ce que le visiteur trouvera : vos prestations détaillées, des exemples ou les informations de contact. Présentez une page concrète plutôt qu’un simple « voici mon nouveau site ». Vous pouvez ensuite partager un projet ou une réponse à une question récurrente.", "Informez vos partenaires habituels lorsque le site peut leur servir à vous recommander. Proposez un lien dans un contexte utile à leurs lecteurs, sans multiplier les inscriptions sans rapport avec votre métier."],
        example: { label: "Exemple fictif : un traiteur indépendant", text: "Il annonce une page présentant ses formats de réception et les informations utiles pour demander un devis. Un lieu partenaire peut partager ce lien aux organisateurs qui cherchent ce type de prestation. Le contenu répond à une demande concrète." },
      },
      {
        id: "presence-locale", title: "3. Vérifier vos informations locales et vos profils",
        paragraphs: ["Si votre entreprise dispose d’une fiche d’établissement Google et remplit les conditions d’éligibilité, ajoutez ou vérifiez l’adresse du site ainsi que vos informations pratiques. Google permet de renseigner un lien vers le site sur la fiche. Vérifiez aussi les autres profils qui présentent déjà votre activité.", "Une présence locale doit correspondre à votre fonctionnement réel. Le type de fiche et les possibilités disponibles dépendent de l’activité ; ne partez pas du principe qu’une entreprise exclusivement en ligne est éligible. Gardez les coordonnées et horaires cohérents entre les supports."],
        links: [{ label: "Source : modifier les informations d’une fiche d’établissement Google", href: "https://support.google.com/business/answer/3039617?hl=fr" }, { label: "Source : conditions et règles des fiches d’établissement", href: "https://support.google.com/business/answer/13762416?hl=fr" }],
      },
      {
        id: "contenus", title: "4. Enrichir le site selon les questions réellement posées",
        paragraphs: ["Commencez par des pages de services compréhensibles et des réalisations expliquées. Ajoutez ensuite un conseil si une question revient souvent dans vos échanges : préparation d’une intervention, choix d’une prestation ou déroulement d’un projet. Un sujet utile mérite davantage d’attention qu’une série de textes très proches.", "Vous pouvez relayer ce contenu sur un profil ou dans une réponse à un prospect lorsqu’il est pertinent. L’apparition sur Google suit un processus distinct de la publication ; une nouvelle page ne garantit pas une position ni une date d’arrivée dans les résultats."],
        links: [{ label: "Comprendre publication, indexation et visibilité sur Google", href: "/conseils/site-visible-google-apres-mise-en-ligne" }],
      },
      {
        id: "plan", title: "5. Suivre un petit plan d’action plutôt que tout lancer à la fois",
        paragraphs: ["Lors de la première semaine, vérifiez les liens et le contact, puis actualisez vos supports. Ensuite, choisissez une action de diffusion et une amélioration de contenu. Gardez une trace des dates et demandez aux nouveaux contacts comment ils vous ont trouvé.", "Si vous disposez de statistiques, utilisez-les avec leurs limites pour observer les pages consultées et les sources de visite. Les demandes réellement reçues restent un repère utile. Un essai publicitaire peut être étudié séparément après vérification du parcours de contact, avec un budget et un objectif définis ; il n’est pas nécessaire pour commencer à partager votre site."],
        bullets: ["Au lancement : tester, corriger les liens et mettre à jour les supports existants.", "La semaine suivante : partager une page utile sur le canal choisi.", "Puis : expliquer une réalisation ou répondre à une question fréquente.", "À la fin du mois : regarder les demandes et décider de la prochaine action."],
      },
    ],
    nextStep: "Votre site doit d’abord présenter votre activité et rendre le contact facile. Découvrez comment nous préparons cette base, de l’aperçu gratuit à la publication.",
    nextHref: "/comment-ca-marche", nextLabel: "Découvrir le parcours Zelyweb",
  },
];
