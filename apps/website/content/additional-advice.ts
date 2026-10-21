import type { AdviceArticle } from "./advice";
import { offer } from "@nova/shared/business";
import { budgetEuro as euros } from "./budget-comparison";

export const additionalAdviceArticles: AdviceArticle[] = [
  {
    slug: "choisir-nom-domaine-entreprise",
    category: "NOM DE DOMAINE",
    title: "Comment choisir le nom de domaine de votre entreprise ?",
    seoTitle: "Choisir un nom de domaine pour votre entreprise",
    description: "Un domaine facile à retenir, une extension adaptée et un renouvellement anticipé : les points à vérifier avant de choisir votre adresse internet.",
    introduction: "Votre nom de domaine est l’adresse que vous partagez sur vos cartes de visite, vos devis et vos réseaux sociaux. Le bon choix doit être compréhensible à l’oral, facile à écrire et cohérent avec votre entreprise dans la durée.",
    takeaway: "Préparez deux ou trois idées, puis vérifiez ensemble leur disponibilité, leur prix initial et leur renouvellement. Aucun nom n’est réservé tant que son enregistrement n’a pas été confirmé.",
    relatedSlugs: ["recuperer-site-domaine-changer-prestataire", "preparer-creation-site-internet"],
    sections: [
      {
        id: "nom-simple", title: "1. Privilégier un nom que vos clients peuvent répéter",
        paragraphs: ["Partez de votre nom commercial ou d’une variante courte. Prononcez l’adresse à quelqu’un sans l’écrire : doit-il demander où placer les tirets ou comment épeler chaque mot ? Ce petit test permet de repérer une adresse trop compliquée avant de l’imprimer partout.", "Évitez d’accumuler votre métier, plusieurs villes et une longue promesse commerciale. Le domaine aide à vous reconnaître ; vos pages expliqueront vos prestations et votre zone d’intervention."],
        example: { label: "Exemple fictif : un salon de coiffure", text: "Pour un salon imaginaire appelé Maison Camille, une adresse construite autour de ce nom est plus facile à communiquer qu’une longue suite de services et de villes. Cet exemple ne suppose pas qu’un domaine correspondant soit disponible." },
      },
      {
        id: "extension", title: "2. Choisir une extension cohérente avec votre activité",
        paragraphs: ["L’extension est la fin de l’adresse, comme .fr ou .com. Choisissez une adresse que votre clientèle reconnaîtra facilement et que vous souhaitez conserver. Une activité tournée vers la France peut envisager un .fr ; une autre extension peut aussi convenir à son identité.", "L’extension ne remplace ni des contenus utiles ni une présentation claire de votre activité. Réserver plusieurs variantes reste un choix facultatif : demandez leur coût annuel avant de multiplier les adresses."],
        bullets: ["Vérifiez l’orthographe exacte, avec et sans tiret si cela peut prêter à confusion.", "Demandez-vous si le nom restera pertinent en cas de déménagement ou d’élargissement de vos prestations.", "La disponibilité à l’enregistrement ne suffit pas à écarter toute confusion avec une autre entreprise : faites vérifier votre choix si nécessaire."],
      },
      {
        id: "prix-renouvellement", title: "3. Regarder le renouvellement autant que le prix de départ",
        paragraphs: ["Une première année à prix réduit ne donne pas le budget des années suivantes. Comparez le tarif de réservation, celui du renouvellement et les services réellement compris. Certains noms dits premium peuvent coûter beaucoup plus cher qu’une adresse courante.", `Chez Zelyweb, le domaine est géré et payé dans la limite de ${euros(offer.domainAnnualCents)} HT par an dans l’abonnement. Au-delà, un supplément annuel nécessite votre accord préalable, y compris si le prix augmente lors du renouvellement. Aucun nom précis n’est garanti avant sa réservation.`],
        links: [{ label: "Comparer le budget du site sur trois ans", href: "/conseils/budget-site-vitrine-creation-entretien" }],
      },
      {
        id: "gestion", title: "4. Savoir au nom de qui le domaine est enregistré",
        paragraphs: ["Pour les nouveaux domaines réservés dans le cadre de l’offre, Zelyweb est le titulaire enregistré et prend en charge leur gestion. Sur votre demande, nous organisons le changement de titulaire au bénéfice du client et, si nécessaire, le transfert vers un autre fournisseur, selon les règles du domaine concerné.", "Ce fonctionnement est à distinguer d’un domaine déjà enregistré à votre nom : indiquez-nous où il est géré et s’il sert à votre messagerie. Nous préparons les démarches utiles avant toute modification des réglages."],
        links: [{ label: "Comprendre la récupération du domaine et du site", href: "/conseils/recuperer-site-domaine-changer-prestataire" }],
      },
      {
        id: "avant-reservation", title: "5. La petite liste à valider avant de réserver",
        paragraphs: ["Envoyez vos idées dès la préparation du projet, puis attendez la confirmation de réservation avant d’annoncer une adresse définitive. Cela évite de devoir refaire des supports si le premier choix n’est plus disponible."],
        bullets: ["Le nom correspond bien à votre identité et se dicte facilement.", "L’extension et les variantes envisagées sont choisies.", "Le prix initial et le renouvellement sont connus.", "Le titulaire, le gestionnaire et les modalités de récupération sont compris.", "Les éventuelles adresses e-mail existantes ont été signalées."],
      },
    ],
    nextStep: "Vous avez déjà une idée de nom ou un domaine existant ? Indiquez-le dans votre demande : nous vérifierons les possibilités avec vous.",
    nextHref: "/demander-mon-site", nextLabel: "Présenter mon projet",
  },
  {
    slug: "checklist-avant-mise-en-ligne-site",
    category: "MISE EN LIGNE",
    title: "La checklist avant de mettre votre site internet en ligne",
    seoTitle: "Checklist avant la mise en ligne de votre site vitrine",
    description: "Textes, photos, téléphone, formulaire et domaine : les vérifications concrètes à faire avant de valider la publication de votre site vitrine.",
    introduction: "La première version vous plaît, mais la publication mérite une dernière relecture. Le plus utile est de parcourir le site comme un futur client : comprend-il vos services et peut-il réellement vous joindre ? Voici une liste pratique à reprendre avec votre prestataire.",
    takeaway: "Relisez les informations, testez les actions sur téléphone et confirmez la réception d’un message de test. Chez Zelyweb, les ajustements sont validés avant l’activation de l’abonnement et la publication.",
    relatedSlugs: ["site-visible-google-apres-mise-en-ligne", "preparer-creation-site-internet"],
    sections: [
      {
        id: "informations", title: "1. Contrôler les informations qui peuvent faire perdre un contact",
        paragraphs: ["Vérifiez d’abord le nom de l’entreprise, l’adresse e-mail, le téléphone, les horaires et la zone d’intervention. Comparez ces informations sur toutes les pages : un ancien numéro peut se cacher dans un pied de page alors que la page Contact est correcte."],
        bullets: ["Les prestations décrites sont celles que vous proposez réellement.", "Les tarifs affichés, lorsqu’il y en a, sont à jour et leur présentation est validée.", "Les coordonnées et horaires sont cohérents partout.", "Les liens vers vos réseaux sociaux ouvrent les bons profils.", "Aucun texte provisoire ni détail d’une autre activité ne subsiste."],
      },
      {
        id: "visuels", title: "2. Relire les textes et vérifier chaque photo",
        paragraphs: ["Une photo doit représenter ce que sa légende annonce. Relisez les descriptions de prestations et de réalisations, puis vérifiez les noms et l’orthographe. Une démonstration ou une image d’illustration doit être identifiée comme telle lorsqu’elle pourrait être prise pour votre travail.", "Assurez-vous de disposer des autorisations nécessaires pour les contenus fournis, notamment les personnes reconnaissables et les photos de clients. Rassemblez les corrections par page : cela permet de traiter une série de retours sans perdre une remarque dans plusieurs messages."],
        links: [{ label: "Présenter ses réalisations quand on débute", href: "/conseils/presenter-realisations-quand-on-debute" }],
      },
      {
        id: "mobile", title: "3. Faire un vrai parcours sur votre téléphone",
        paragraphs: ["Ouvrez le site sur votre téléphone, puis sur ordinateur. Commencez depuis l’accueil : ouvrez le menu, trouvez une prestation, consultez une réalisation et rejoignez le contact. Faites l’essai sans connaître le chemin à l’avance."],
        bullets: ["Le texte se lit sans zoom et les images ne masquent pas les informations.", "Le menu s’ouvre, se ferme et mène aux bonnes pages.", "Les boutons sont faciles à toucher et leur destination est correcte.", "Les liens téléphone et e-mail proposent la bonne action.", "Les pages importantes restent accessibles depuis le menu ou le pied de page."],
      },
      {
        id: "formulaire", title: "4. Vérifier le formulaire jusqu’à la réception du message",
        paragraphs: ["Envoyez une demande de test avec une adresse à laquelle vous pouvez répondre. Vérifiez la confirmation à l’écran, puis la réception effective dans la boîte prévue, y compris les courriers indésirables. Un message de succès affiché sur le site ne suffit pas à vérifier toute la chaîne.", "Essayez aussi un champ obligatoire vide et une adresse mal formée : les indications doivent aider à corriger la saisie. Après publication, refaites un test depuis le domaine définitif. Si le service d’envoi rencontre une panne, attendez son rétablissement pour confirmer ce point."],
      },
      {
        id: "publication", title: "5. Valider le domaine, les pages pratiques et le départ",
        paragraphs: ["Confirmez l’adresse finale et signalez toute messagerie utilisant déjà le domaine avant de modifier ses réglages. Relisez les pages légales et de confidentialité à partir des informations de votre entreprise et des fonctionnalités réellement présentes.", `Chez Zelyweb, vous réglez la création après acceptation de la première version, puis vous transmettez vos ajustements. Après leur validation, vous activez vous-même l’abonnement depuis l’e-mail reçu : ${euros(offer.monthlyCents)} HT, soit ${euros(offer.monthlyTtcCents)} TTC pour le premier mois, puis chaque mois. La publication intervient sous deux jours ouvrés après confirmation du premier paiement si le domaine et ses accès sont prêts.`],
        example: { label: "Votre feu vert final", text: "« J’ai relu les pages, les coordonnées sont correctes, le formulaire a été testé et je valide cette version. » Conservez une liste des vérifications terminées et de celles qui restent à confirmer après publication." },
        links: [{ label: "Voir le parcours complet d’un salon de coiffure fictif", href: "/comment-ca-marche#exemple-salon" }],
      },
    ],
    nextStep: "Vous voulez comprendre qui fait quoi avant la publication ? Suivez notre exemple de projet, de la demande gratuite au premier mois d’abonnement.",
    nextHref: "/comment-ca-marche#exemple-salon", nextLabel: "Suivre un projet étape par étape",
  },
  {
    slug: "site-visible-google-apres-mise-en-ligne",
    category: "VISIBILITÉ & GOOGLE",
    title: "Mon site sera-t-il visible sur Google dès sa mise en ligne ?",
    seoTitle: "Site en ligne : quand sera-t-il visible sur Google ?",
    description: "Publication, indexation et classement : comprenez les étapes de visibilité d’un nouveau site et les vérifications utiles avec Google Search Console.",
    introduction: "Vous venez de publier votre site et vous le cherchez sur Google sans le trouver. Cela ne signifie pas nécessairement que la publication a échoué. Ouvrir une adresse, apparaître dans les résultats et être bien placé sur une recherche sont trois choses différentes.",
    takeaway: "La mise en ligne rend le site accessible à son adresse. Google doit ensuite découvrir et éventuellement indexer ses pages. Aucune date d’apparition ni position ne peut être garantie.",
    relatedSlugs: ["faire-connaitre-site-apres-publication", "pages-site-petite-entreprise"],
    sections: [
      {
        id: "trois-etapes", title: "1. Distinguer publication, indexation et classement",
        paragraphs: ["La publication permet de consulter le site à son adresse. L’indexation correspond à l’ajout d’une page dans l’index de Google après son exploration. Le classement détermine ensuite les résultats proposés pour une recherche. Google ne garantit ni l’indexation ni une position donnée."],
        table: { caption: "Trois étapes différentes pour un nouveau site", headers: ["Étape", "Ce que cela signifie"], highlightLastRow: false, rows: [["Publication", "Votre adresse permet d’ouvrir le site."], ["Indexation", "Une page est retenue dans l’index de Google."], ["Classement", "Google choisit les résultats selon la recherche." ]] },
        links: [{ label: "Source : fonctionnement de la recherche Google", href: "https://developers.google.com/search/docs/fundamentals/how-search-works?hl=fr" }],
      },
      {
        id: "delais", title: "2. Prévoir un délai sans promettre une date",
        paragraphs: ["Google indique que l’exploration peut prendre de quelques jours à plusieurs semaines. Une demande d’exploration n’assure pas une présence immédiate, ni même une indexation. Répéter les demandes ne remplace pas la vérification de l’état de la page."],
        example: { label: "Exemple fictif : un salon récemment lancé", text: "Le salon partage déjà l’adresse du site sur sa carte de visite et ses réseaux. Ses clients peuvent l’ouvrir directement, même si une recherche générale comme « coiffeur » ne fait pas encore apparaître ses pages." },
        links: [{ label: "Source : demander une nouvelle exploration à Google", href: "https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=fr" }],
      },
      {
        id: "search-console", title: "3. Utiliser Search Console pour comprendre la situation",
        paragraphs: ["Google Search Console permet de suivre l’indexation et les performances de recherche. Après vérification de l’accès au site, l’inspection d’une URL aide à examiner une page précise. Un sitemap peut également être communiqué. Ces outils servent au suivi ; ils ne promettent pas un classement."],
        bullets: ["Vérifier que la bonne adresse du site est suivie.", "Inspecter l’accueil et les pages prioritaires.", "Examiner les motifs signalés pour les pages non indexées.", "Comparer les impressions et les clics au fil du temps."],
        links: [{ label: "Source : démarrer avec Google Search Console", href: "https://developers.google.com/search/docs/monitor-debug/search-console-start?hl=fr" }],
      },
      {
        id: "contenus", title: "4. Préparer des pages qui répondent aux questions des clients",
        paragraphs: ["Expliquez votre métier, vos services et votre zone avec des informations précises. Un visiteur doit pouvoir comprendre ce que vous faites sans deviner la signification d’un slogan. Pour une prestation, indiquez son contenu, son déroulement et la manière de vous contacter.", "Ajoutez des réalisations expliquées et tenez vos informations à jour. Une rubrique de conseils a du sens si elle répond à des questions réellement posées. Publier de nombreux textes similaires ou empiler des noms de villes apporte peu d’aide à la personne qui cherche un professionnel."],
        links: [{ label: "Organiser les pages d’une petite entreprise", href: "/conseils/pages-site-petite-entreprise" }],
      },
      {
        id: "zelyweb", title: "5. Ce que vous pouvez attendre de Zelyweb",
        paragraphs: ["Zelyweb prépare un site vitrine structuré pour présenter votre activité et faciliter les contacts, avec les bases techniques de référencement prévues dans l’offre. La publication du site ne vaut pas une promesse de première page ni une prestation continue de référencement.", "Si vous souhaitez un suivi Search Console, de nouveaux contenus ou un accompagnement SEO régulier, définissons les actions attendues avant de les chiffrer. Pour juger l’utilité du site, regardez aussi les demandes reçues et leur qualité : une position isolée ne raconte pas toute l’activité."],
      },
    ],
    nextStep: "Commencez par un site qui explique clairement vos prestations. Nous pouvons préparer une première proposition à partir de votre activité et de vos priorités.",
    nextHref: "/demander-mon-site", nextLabel: "Préparer mon site vitrine",
  },
  {
    slug: "recuperer-site-domaine-changer-prestataire",
    category: "DOMAINE & AUTONOMIE",
    title: "Peut-on récupérer son site et son domaine en changeant de prestataire ?",
    seoTitle: "Récupérer votre site et votre domaine : comment faire ?",
    description: "Titulaire du domaine, fichiers du site, transfert et hébergement : comprenez les démarches et les modalités de sortie de l’offre Zelyweb.",
    introduction: "Changer de prestataire se prépare avant de fermer l’ancien hébergement. Le site, son adresse et la messagerie sont des éléments distincts. Savoir qui les gère et ce qui sera remis permet d’organiser une transition plus sereine.",
    takeaway: "Chez Zelyweb, les nouveaux domaines sont enregistrés au nom de Zelyweb, puis transférables au client sur demande. Les fichiers du site et le code de transfert du domaine sont remis gratuitement à la sortie, selon les conditions de l’offre et les règles du domaine.",
    relatedSlugs: ["choisir-nom-domaine-entreprise", "quand-refaire-site-entreprise"],
    sections: [
      {
        id: "elements", title: "1. Séparer le site, le domaine et l’hébergement",
        paragraphs: ["Les fichiers constituent le site. Le domaine est son adresse. L’hébergement permet de le rendre accessible. Enfin, une messagerie peut utiliser le même domaine tout en dépendant d’un autre service. Déplacer un élément ne déplace donc pas automatiquement les autres."],
        bullets: ["Qui dispose des fichiers et prépare leur remise ?", "Au nom de qui le domaine est-il enregistré ?", "Quel fournisseur gère son renouvellement ?", "Où seront hébergés le site et les éventuelles boîtes e-mail après la transition ?"],
      },
      {
        id: "titulaire", title: "2. Le titulaire du domaine dans l’offre Zelyweb",
        paragraphs: ["Pour un nouveau domaine réservé dans le cadre de l’offre, Zelyweb est le titulaire enregistré. Cela signifie que le domaine n’est pas enregistré directement au nom du client au départ. Sur demande, Zelyweb organise le changement de titulaire au bénéfice du client et, si nécessaire, son transfert vers un autre bureau d’enregistrement.", "Ces démarches dépendent de l’extension et du fournisseur. Un changement de titulaire et un changement de bureau d’enregistrement sont deux opérations distinctes ; des vérifications ou restrictions peuvent s’appliquer. Nous vérifions l’ordre des démarches avant de les engager. Un domaine déjà détenu par le client doit être examiné selon sa situation existante."],
        links: [{ label: "Source : questions de l’ICANN sur les transferts des extensions génériques", href: "https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en" }],
      },
      {
        id: "fichiers", title: "3. Ce qui est remis lorsque vous quittez Zelyweb",
        paragraphs: ["Les fichiers du site et le code de transfert du domaine sont remis gratuitement, sous réserve des règles et délais applicables au domaine. Une copie des fichiers reste disponible pendant trente jours après la fin du service : demandez-la avant ce terme.", "Les droits d’utilisation du site livré et payé sont précisés dans les conditions de l’offre. Les éléments de tiers, comme certaines images, polices ou bibliothèques, restent soumis à leurs propres licences. La remise des fichiers ne comprend pas automatiquement l’installation chez un autre hébergeur ni son adaptation à une plateforme différente."],
        links: [{ label: "Consulter les conditions détaillées de l’offre", href: "/conditions-generales" }],
      },
      {
        id: "transition", title: "4. Préparer le nouvel hébergement avant de couper l’ancien",
        paragraphs: ["Commencez par choisir votre solution d’accueil avec le futur prestataire et vérifiez sa compatibilité. Organisez ensuite la remise des fichiers, les démarches du domaine et les réglages nécessaires. Signalez les adresses e-mail utilisant ce domaine pour préserver leur fonctionnement.", "Vous pouvez demander la résiliation à tout moment depuis le portail de facturation Stripe ou en contactant Zelyweb ; elle prend effet à la fin de la période mensuelle déjà payée. Prévoyez la transition avant cette échéance pour limiter le risque d’interruption."],
        bullets: ["Demander les fichiers et préciser le futur gestionnaire du domaine.", "Vérifier la compatibilité du nouvel hébergement.", "Préparer le changement de titulaire et le transfert éventuel selon les règles applicables.", "Préserver les réglages de messagerie nécessaires.", "Contrôler le site et le formulaire après la bascule."],
      },
      {
        id: "migration", title: "5. Distinguer récupération gratuite et migration accompagnée",
        paragraphs: [`La migration technique effectuée par Zelyweb est facultative et coûte ${euros(offer.migrationCents)} HT, soit ${euros(offer.migrationTtcCents)} TTC, après vérification de la compatibilité de l’hébergement. Une adaptation importante fait l’objet d’un chiffrage séparé. Les frais éventuels du nouveau fournisseur restent à votre charge.`, "Vous pouvez aussi confier l’installation à votre nouveau prestataire. Le bon moment pour préparer la sortie est celui où l’ancien service fonctionne encore : vous disposez alors du temps nécessaire pour tester la nouvelle version."],
      },
    ],
    nextStep: "Vous possédez déjà un site ou un domaine ? Décrivez votre situation avant toute résiliation afin de préparer la reprise des éléments utiles.",
    nextHref: "mailto:contact@zelyweb.com", nextLabel: "Parler de mon site existant",
  },
  {
    slug: "presenter-realisations-quand-on-debute",
    category: "CONTENU & CONFIANCE",
    title: "Comment présenter ses réalisations quand on débute ?",
    seoTitle: "Présenter vos réalisations quand vous débutez",
    description: "Vous lancez votre entreprise ? Présentez votre méthode, des projets personnels et des démonstrations clairement identifiées, avec des exemples pour plusieurs métiers.",
    introduction: "Votre entreprise vient de démarrer et votre galerie de projets clients est encore courte. Vous pouvez déjà montrer votre manière de travailler et aider vos visiteurs à se projeter. Le principe : expliquer précisément ce que chaque exemple représente.",
    takeaway: "Quelques exemples bien expliqués suffisent pour commencer. Identifiez clairement les démonstrations et les projets personnels, puis remplacez-les progressivement par des réalisations clients publiables.",
    relatedSlugs: ["photos-site-internet-telephone", "pages-site-petite-entreprise"],
    sections: [
      {
        id: "matiere", title: "1. Partir de ce que vous pouvez déjà montrer",
        paragraphs: ["Cherchez d’abord dans vos projets personnels, vos exercices de formation ou vos essais de technique. Une réalisation n’a pas besoin d’être une commande pour illustrer votre démarche, à condition d’indiquer son contexte et votre rôle exact.", "Vous pouvez aussi présenter les étapes d’une prestation : préparation, choix des matériaux, organisation ou contrôle final. Ces explications permettent à un prospect de comprendre comment vous prenez en charge son besoin, même avec peu de références."],
        bullets: ["Un projet personnel décrit comme tel.", "Un exercice ou une démonstration avec son objectif.", "Une présentation de votre méthode et de vos outils.", "Une expérience précédente dont vous pouvez parler, en précisant votre contribution."],
      },
      {
        id: "exemples", title: "2. Trois exemples fictifs pour trouver votre format",
        paragraphs: ["Les exemples suivants sont entièrement fictifs. Ils proposent une façon de raconter un travail ; ils ne décrivent ni des clients réels, ni des prestations effectivement réalisées."],
        advantages: [
          { title: "Paysagiste : un jardin de démonstration", text: "Exemple fictif — Présenter un croquis de petite cour : besoin imaginé, contraintes de circulation, choix de végétaux et entretien envisagé. Légender le plan « proposition de démonstration, non réalisée chez un client »." },
          { title: "Coiffeur : une technique sur tête d’entraînement", text: "Exemple fictif — Montrer les étapes d’une coiffure sur support d’entraînement, avec le matériel et la technique utilisés. Préciser le contexte de l’exercice et éviter de le présenter comme une prestation en salon." },
          { title: "Photographe : une série personnelle", text: "Exemple fictif — Expliquer l’intention d’une série personnelle, le choix de lumière et le traitement des images. La présenter comme un projet personnel, avec les autorisations nécessaires pour les personnes ou lieux photographiés." },
        ],
      },
      {
        id: "fiche", title: "3. Donner un contexte à chaque réalisation",
        paragraphs: ["Une image seule laisse beaucoup de questions. Ajoutez un titre, le type de projet et quelques lignes sur votre démarche. Si vous montrez un avant et un après, précisez ce qui a réellement changé et utilisez une présentation qui permet une comparaison compréhensible."],
        bullets: ["Le contexte : commande, projet personnel ou démonstration.", "Le besoin de départ et les contraintes.", "Votre rôle et les actions effectuées.", "Le résultat observable, sans inventer de chiffres.", "La prochaine étape pour une personne intéressée par une prestation similaire."],
        example: { label: "Une légende utile", text: "« Projet personnel — Réorganisation de mon espace de travail. Objectif : dégager la circulation et ajouter du rangement. J’ai réalisé le plan et le montage présentés sur ces photos. » Une description courte donne déjà des repères concrets." },
      },
      {
        id: "confiance", title: "4. Rassurer grâce à votre méthode et aux informations pratiques",
        paragraphs: ["Si vous avez peu de photos, développez la présentation de vos services et de votre fonctionnement : comment se passe un premier échange, quelles informations servent au devis et comment vous suivez le projet. Votre parcours et vos qualifications réelles peuvent compléter cette présentation.", "Les témoignages doivent correspondre à des retours authentiques et publiables. Vous pouvez demander un avis après une première prestation terminée, puis l’ajouter avec l’accord nécessaire. En attendant, un exemple clairement identifié et une explication précise de votre travail donnent une base utile à votre site."],
      },
      {
        id: "faire-evoluer", title: "5. Faire évoluer votre galerie au fil des projets",
        paragraphs: ["Au terme de chaque mission, rassemblez quelques photos autorisées et notez le besoin initial, ce que vous avez fait et le résultat. Vous aurez une petite fiche prête à publier plutôt qu’une pile d’images sans contexte. Sélectionnez les projets qui représentent les prestations que vous souhaitez développer.", "Chez Zelyweb, vous pouvez transmettre vos contenus pendant la création et regrouper vos retours dans les séries d’ajustements incluses. Après publication, une mise à jour simple peut entrer dans les quinze minutes mensuelles prévues ; un ajout plus important doit être évalué avant intervention."],
        links: [{ label: "Découvrir les sites de démonstration Zelyweb, clairement fictifs", href: "/exemples" }],
      },
    ],
    nextStep: "Vous avez quelques photos, un projet personnel ou simplement une méthode à expliquer ? Nous pouvons partir de cette matière pour construire une première proposition.",
    nextHref: "/demander-mon-site", nextLabel: "Construire ma première présentation",
  },
];
