# NOVA — site vitrine et administration

Monorepo Next.js App Router en français pour une marque provisoire de sites vitrines clé en main. NOVA n’est pas un nom validé. Le site propose une démonstration avant commande ; l’administration privée permet la qualification des demandes, le suivi des projets, les échanges clients, les devis PDF et leurs paiements Stripe. La génération/déploiement automatique des sites clients reste à venir.

Guides : [première publication GitHub et Railway](docs/premiere-publication.md), [utilisation de l’administration](docs/administration.md), [relation client et devis](docs/relation-client.md), [services Railway du monorepo](docs/railway-monorepo.md), [pipeline public](docs/lead-pipeline.md).

## Démarrage

Prérequis : Node.js 22.23 ou version compatible avec Prisma 7, npm. Les versions résolues sont enregistrées dans package-lock.json.

```powershell
npm ci
Copy-Item apps/website/.env.example apps/website/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
npm run dev
```

Ouvrir http://localhost:3000. Dans un autre terminal, `npm run dev:admin` ouvre l’administration sur http://localhost:3001. Configurer la base et créer le premier compte avec `npm run admin:create` depuis un contexte opérateur autorisé ; la connexion utilise l’e-mail et le mot de passe. Les polices Space Grotesk et Inter sont intégrées par next/font : le téléchargement intervient lors de la compilation, puis elles sont servies localement. Une connexion aux services npm et Google Fonts est nécessaire pour une première installation/compilation.

## Vérifications

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:admin-ui
npm run build
```

Les tests serveur n’envoient aucun e-mail réel. Ils couvrent la validation, le consentement, les origines tierces, le honeypot, la limite de débit, l’absence de confirmation sans fournisseur et la réponse attendue de l’adaptateur e-mail simulé.

Pour les contrôles navigateur, lancer le serveur sur http://127.0.0.1:3000 puis npm run test:ui. Le script scripts/qa.mjs utilise Chrome installé au chemin Windows indiqué au début du fichier ; adapter executablePath sur une autre machine. Il contrôle les neuf pages à 375, 768, 1024 et 1440 px, le menu mobile, les filtres, la FAQ, les validations, le récapitulatif, la transmission désactivée et la 404. Captures et résultats sont placés dans reports/ (ignoré par Git). Ce parcours suppose que les clés Resend sont absentes pour vérifier l’absence d’envoi. Ces contrôles ne constituent pas une certification d’accessibilité ou une mesure Lighthouse.

## Architecture

- `apps/website/` : site conservé, avec ses dossiers app, components, lib, config, styles et public.
- `apps/admin/` : interface privée, Better Auth par mot de passe, demandes, projets, échanges, devis et paiements.
- `packages/database/` : client partagé, schéma et migrations Prisma.
- `packages/validation/` : validation Zod du formulaire.
- `packages/shared/` : statuts, libellés et transitions métier.
- `scripts/`, `tests/` : worker, commandes opérateur et vérifications.
- `railway.*.toml` : configurations indépendantes du site, de l’administration et du worker.

Les pages métiers envisagées ne sont pas publiées. Ajouter une route seulement après rédaction de contenus spécifiques et utiles au métier, puis compléter le sitemap et la navigation. Aucune page SEO dupliquée n’est générée.

## Configuration avant production

| Paramètre                        | Action                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| name, tagline                    | Valider la marque dans config/brand.config.ts ; remplacer le logo et le favicon                                               |
| NEXT_PUBLIC_SITE_URL             | URL HTTPS complète du domaine final, sans chemin, par exemple https://votre-domaine.fr                                        |
| contactEmail, phone, socialLinks | Renseigner uniquement des coordonnées et liens réels                                                                          |
| legalIdentity                    | Raison sociale, forme juridique, capital si applicable, siège, immatriculation, TVA si applicable, responsable de publication |
| pricing                          | Les prix provisoires sont 299 € HT + 29 € HT/mois ; total de 647 € HT pour douze mois de gestion                              |
| commitment, cancellation         | Valider l’engagement et les conditions de résiliation                                                                         |
| includedRevisions, support       | Valider les corrections incluses et le périmètre du support                                                                   |
| transfer, domainRenewal          | Valider le transfert du site/domaine et le renouvellement                                                                     |
| Mentions légales                 | Compléter l’éditeur et les coordonnées complètes de l’hébergeur choisi                                                        |
| Confidentialité                  | Compléter responsable, contact des droits, base juridique, durée de conservation, sous-traitants et garanties                 |
| RESEND_API_KEY                   | Clé serveur Resend ; ne jamais la préfixer NEXT_PUBLIC_                                                                       |
| LEAD_FROM_EMAIL                  | Adresse d’envoi sur un domaine vérifié chez Resend                                                                            |
| LEAD_TO_EMAIL                    | Boîte qui recevra les demandes internes                                                                                       |
| UPSTASH_REDIS_REST_URL / TOKEN   | Redis REST partagé pour la protection anti-spam de production                                                                 |
| RATE_LIMIT_SALT                  | Secret aléatoire serveur pour hacher les adresses réseau                                                                      |
| NEXT_PUBLIC_GA_ID                | Propriété Analytics publique ; `G-TDLF1WPKD4` par défaut, chargée uniquement après consentement                              |

Les champs contractuels restent null tant qu’ils ne sont pas validés. Après leur validation, remplacer également les formulations préparatoires des pages offre, FAQ et légales pour présenter les conditions réelles. Aucune clause n’est créée automatiquement à partir de ces champs.

Sans domaine configuré, le site reste noindex et le sitemap ne contient aucune URL fictive. Configurer une URL active puis recompiler produit les canonical, données structurées WebSite et le sitemap. Ne pas activer l’indexation d’une préproduction contenant des placeholders juridiques.

## Formulaire et transmission

Le formulaire utilise React Hook Form et Zod, avec validation par étape et côté serveur. Aucune donnée personnelle ne passe dans l’URL, les événements analytics ou le stockage local. Les saisies restent en mémoire pendant la navigation entre étapes ; un rechargement les efface. L’ajout de fichiers est désactivé faute de stockage sécurisé configuré.

Le parcours comporte trois étapes : activité et principales prestations, choix d’une des quatorze démonstrations ou « Proposez-moi un style » (par défaut), puis coordonnées et récapitulatif modifiable. Le téléphone est facultatif pour un contact par email et requis pour un contact téléphonique, avec la même validation côté serveur. Les couleurs, le logo et les photos sont reportés aux échanges après la demande. Aucun espace de dépôt ou service d’envoi n’est activé par cette simplification.

Le contrôle node scripts/check-lead-form.mjs vérifie les quatre largeurs, les choix visuels, la validation conditionnelle, les modifications du récapitulatif et les réponses d’envoi simulées, sans transmettre d’email réel.

La route exige une origine autorisée, un contenu JSON inférieur à 20 Ko et un honeypot vide. La limitation est de cinq tentatives sur quinze minutes. En développement, le compteur mémoire est adapté à une instance locale. En production, les identifiants Redis REST et le sel sont obligatoires : leur absence ou une panne ferme la transmission. Sur Vercel, l’IP utilisée vient du header de la plateforme x-vercel-forwarded-for. Sur un autre hébergeur, la limite globale de secours doit être remplacée par une adresse client provenant d’un proxy de confiance, jamais d’un header librement envoyé par le navigateur.

Le dépôt Prisma de `lib/lead-repository.ts` enregistre la demande, le jeton de vérification et l’événement d’outbox dans une transaction PostgreSQL. La clé de tentative est unique en base ; un changement des données produit une nouvelle clé. Le formulaire confirme uniquement l’enregistrement. Le worker Resend envoie le lien, puis l’accusé de réception et la notification interne seulement après vérification de l’adresse. Les contenus sont en texte brut et chiffrés dans l’outbox en attente. L’acceptation Resend ne garantit pas la livraison en boîte de réception.

Sans configuration PostgreSQL, Resend, origine et clé d’outbox (ainsi que Redis en production), l’application affiche un état de préparation et renvoie 503. Exécuter les migrations de façon contrôlée et démarrer `npm run outbox:watch` : sans worker, les e-mails restent en attente. Voir [configuration Railway](docs/railway-postgresql.md) et [modèle, sécurité et exploitation du pipeline](docs/lead-pipeline.md). La conservation et les informations définitives de confidentialité restent à compléter avant ouverture.

## Mesure et consentement

Les événements préparés sont cta_click, lead_form_start, lead_form_step, lead_form_submit, lead_form_success et contact_click. Ils n’acceptent que des emplacements prédéfinis et un numéro d’étape. lead_form_success intervient uniquement après la réponse serveur confirmée. Les liens de contact apparaissent après configuration des coordonnées.

Google Analytics 4 utilise directement la propriété Zelyweb `G-TDLF1WPKD4` (remplaçable par `NEXT_PUBLIC_GA_ID`). Aucun conteneur GTM n’est chargé en parallèle. Le SDK et les événements sont chargés seulement après acceptation. Accepter et refuser sont deux actions au même niveau ; les préférences restent accessibles en pied de page. Le refus après acceptation désactive la collecte et recharge la page. Le suivi publicitaire reste refusé et Google signals désactivé. Les cookies Analytics expirent après un an, sans renouvellement automatique.

**Réglage du flux requis avant publication : désactiver Mesure optimisée dans Analytics → Administration → Flux de données → flux Web.** Le site envoie lui-même une seule vue par navigation et les événements du formulaire ; la mesure automatique pourrait provoquer des doublons et transmettre des interactions non filtrées. Les URL transmises excluent les fragments et les paramètres arbitraires ; seuls les UTM de campagne au format restreint sont conservés. Ne jamais mettre de coordonnées dans les noms de campagnes. Les pages de confirmation, les e-mails locaux et les démonstrations sont exclus. `lead_form_success` signifie demande enregistrée, pas e-mail confirmé ni vente. La liaison Google Ads et les pixels des autres régies ne sont pas activés par cette intégration.

Contrôle navigateur sans envoi réel : démarrer le site sur le port 3100, puis `node scripts/check-analytics.mjs` (`QA_BASE_URL` facultatif). Après publication, vérifier un parcours consenti dans Temps réel/DebugView. Utiliser Acquisition de trafic pour comparer source/support/campagne et marquer `lead_form_success` comme événement clé si souhaité. Le choix de conservation des événements dans la propriété Google reste à régler par l’opérateur.

## Déploiement Railway

Les mises à jour PostgreSQL peuvent être appliquées automatiquement par un service `migrations` séparé ; les trois applications attendent la réussite des migrations avant de démarrer. Une configuration initiale des services Railway est requise. Voir les [commandes et variables exactes](docs/railway-monorepo.md#migrations-automatiques--configuration-initiale-unique). La connexion propriétaire reste exclusivement dans le service de migrations ; les applications conservent leurs comptes restreints.

Utiliser les services indépendants et commandes décrits dans [railway-monorepo.md](docs/railway-monorepo.md). Le site, l’administration et PostgreSQL sont prévus sur Railway ; Vercel reste destiné aux sites clients futurs. Le worker existant nécessite son propre processus actif. Les migrations et la création du premier administrateur sont des commandes opérateur contrôlées. Les fichiers `railway.*.toml` préparent ces services sans les créer ni les déployer. Finaliser les informations légales, les droits et la conservation avant ouverture.

Aucun déploiement public n’a été effectué. L’envoi réel, la livraison des e-mails, la configuration Redis et les outils Google n’ont pas été testés avec des comptes de production.

## Sources techniques

### SEO et aperçus Zelyweb

Les métadonnées commerciales utilisent le visuel `/brand/zelyweb-partage.png` (1200 × 630), la favicon PNG de 96 px, sa version SVG et une icône Apple de 180 px. Le visuel conserve le logo fourni et présente un exemple explicitement fictif. `node scripts/generate-brand-assets.mjs` régénère ces fichiers avec Chrome installé (`CHROME_PATH` facultatif). Les grandes images d’aperçu sont autorisées pour Google ; leur affichage dans les résultats reste choisi par le moteur.

Pour Search Console, créer une propriété **Domaine** `zelyweb.com` dans https://search.google.com/search-console, puis ajouter l’enregistrement TXT fourni par Google dans la zone DNS du domaine. Conserver cet enregistrement après validation. Soumettre ensuite `https://zelyweb.com/sitemap.xml` et inspecter l’accueil et l’offre pour demander une indexation après publication. Cette procédure ne nécessite ni balise HTML ni variable Railway.

Alternative : pour une propriété **Préfixe de l’URL** `https://zelyweb.com/`, choisir la vérification par balise HTML et renseigner `GOOGLE_SITE_VERIFICATION` dans le service Railway du site avec uniquement la valeur `content` fournie par Google, puis reconstruire et déployer avant de valider. Cette variable est facultative et ne remplace pas le TXT d’une propriété Domaine. Aucune validation de propriété n’est effectuée automatiquement par le projet.

Référence : [validation de propriété Search Console](https://support.google.com/webmasters/answer/9008080?hl=fr).

- [Documentation Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [Resend : envois groupés et idempotence](https://resend.com/changelog/batch-idempotency-keys)
- [API REST Redis Upstash](https://upstash.com/docs/redis/features/restapi)
- [Headers de requête Vercel](https://vercel.com/docs/headers/request-headers)
- [CNIL : retrait du consentement](https://www.cnil.fr/fr/cnil-direct/question/cookies-est-il-possible-de-finalement-refuser-les-cookies-dun-site-web-apres)

La référence commerciale fournie n’a pas pu être consultée par l’outil de navigation. L’interface, les compositions et les textes de ce projet ont été créés à partir du cahier des charges.

## Interaction WebMCP facultative

La galerie propose filter_site_demonstrations si le navigateur fournit document.modelContext. Cet outil valide un secteur et utilise le même filtre que l’interface, sans accéder aux coordonnées ni transmettre une demande. Il est nettoyé au démontage. Aucun contexte WebMCP compatible n’était disponible pour la vérification réelle ; les contrôles de l’interface et la compilation restent indépendants de cette API facultative.

## Les quatorze démonstrations complètes

Les quatorze routes sous /exemples/ sont des sites React one-page complets, dont /exemples/electricien, /exemples/nettoyage, /exemples/coach-sportif, /exemples/boulangerie et /exemples/immobilier. Chaque composition dispose de son identité graphique, de sa navigation par ancres, de ses prestations, de sa présentation, de son contact et de son pied de page. Les formulaires de démonstration ne font aucune requête et ne conservent aucune donnée ; leurs coordonnées en .example et leur numéro à zéro sont explicitement fictifs. Le bandeau de retour à la galerie identifie toujours les exemples.

Les groupes de routes app/(commercial) et app/(demonstrations) séparent les layouts sans changer les URL commerciales existantes. Le header, le footer et les outils de consentement de la marque ne sont pas affichés dans les démonstrations. Les démonstrations sont pré-générées et noindex ; elles ne sont pas ajoutées au sitemap commercial.

32 photographies Pexels sont stockées dans public/examples/ : trois pour chacun des neuf premiers métiers et une pour chacun des cinq nouveaux. Le fichier public/examples/credits.json conserve les pages sources, les auteurs, la licence et les empreintes SHA256. Les crédits sont aussi consultables dans chaque pied de page. Les photographies sont illustratives : aucune personne représentée n’est présentée comme membre d’une entreprise fictive ou comme cliente réelle.

La galerie affiche les captures des véritables pages, au format desktop et mobile. Pour les régénérer après une modification, démarrer l’application sur http://127.0.0.1:3000 puis lancer :

```powershell
npm run examples:capture
npm run examples:check
```

La première commande vérifie les quatorze pages à quatre largeurs, le chargement des photographies, les navigations mobiles et l’absence de transmission des formulaires. Elle produit les vingt-huit fichiers WebP utilisés dans public/examples/previews/ et les captures intégrales dans reports/examples/. Le bandeau d’information est retiré uniquement des captures destinées à la galerie ; les pages consultables le conservent. La seconde commande contrôle la galerie, ses filtres par secteur et ambiance, sa recherche par métier, ses classements, les allers-retours vers les sites et le chargement de tous les aperçus. Les scripts utilisent Chrome installé ; CHROME_PATH permet de choisir un autre exécutable. EXAMPLES_BASE_URL permet de changer l’origine utilisée par les scripts de capture et de contrôle de galerie.
