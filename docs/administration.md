# Utiliser l’administration NOVA

## Structure

Le dépôt est un monorepo npm : `apps/website` contient le site vitrine conservé, `apps/admin` son administration privée, `packages/database` le schéma/migrations/client Prisma, `packages/validation` le schéma du formulaire, et `packages/shared` les statuts et transitions. Les applications partagent une base mais ont leurs propres processus, origines et identifiants PostgreSQL.

Le dossier local fourni n’avait pas de métadonnées Git accessibles. La restructuration a été réalisée sur ses fichiers ; aucun commit, push ou déploiement distant n’a été effectué.

```sh
npm ci
npm run db:generate
npm run dev
npm run dev:admin
```

Exécuter les deux dernières commandes dans des terminaux distincts : site sur 3000, administration sur 3001. Copier les exemples dans `apps/website/.env.local` et `apps/admin/.env.local`. Pour les migrations, fournir une connexion opérateur à la CLI depuis les variables du terminal ou un `.env.local` à la racine. Les variables du site ne remplacent pas celles de l’administration.

Avec PostgreSQL installé localement sur le port 5432, `npm run db:setup:local` automatise cette préparation dans un terminal interactif : saisie masquée du mot de passe PostgreSQL, création de `nova` si absente, migrations additives, connexions distinctes et restreintes pour le site, l’administration et le worker, écriture des `.env.local` ignorés par Git, puis création du premier administrateur si nécessaire. Les clés déjà configurées et les comptes existants sont conservés. Aucun mot de passe par défaut ni suppression de base n’est utilisé. Chaque exécution crée de nouveaux identifiants d’exécution locaux ; les anciens rôles ne sont pas supprimés automatiquement. Redémarrer les applications après la configuration. Ce script est limité à `127.0.0.1:5432` et ne configure pas Railway.

## Connexion et premier compte

Configurer `BETTER_AUTH_URL` avec l’origine de l’administration (localhost uniquement en développement) et `BETTER_AUTH_SECRET` avec au moins 32 caractères aléatoires. Les sessions utilisent Better Auth et PostgreSQL ; les cookies ne sont pas partagés entre sous-domaines. La durée maximale d’une session est de huit heures. Les lectures vérifient la session en base, le compte autorisé actif et le rôle ADMIN.

Il n’existe aucune inscription publique. Avec des identifiants opérateur autorisés et un terminal interactif :

```sh
npm run admin:create
```

La commande demande l’adresse et le nom, puis un mot de passe de 14 à 128 caractères avec saisie masquée et confirmation. L’utilisateur, le mot de passe haché par Better Auth et l’autorisation administrateur sont créés dans une transaction. Une protection sous verrou interdit un deuxième bootstrap concurrent. La commande refuse de créer un autre compte si un administrateur existe déjà ; pour un compte supplémentaire volontaire, utiliser `npm run admin:create -- --additional`.

Sous Windows, `npm run admin:create:gui` ouvre une fenêtre graphique avec les champs e-mail, nom, mot de passe masqué et confirmation. Elle crée le premier compte avec les mêmes validations et protections que la commande terminal. Les identifiants saisis passent par un canal mémoire vers le script ; aucun fichier temporaire ni argument de commande ne contient le mot de passe. La base doit déjà être configurée. La connexion se fait ensuite par e-mail et mot de passe sur `http://localhost:3001`.

Les commandes de création et de gestion chargent d’abord le `.env.local` racine (identifiants opérateur), puis la configuration de l’administration. Elles utilisent DIRECT_URL si présent, sinon DATABASE_URL. Les identifiants opérateur ne doivent pas être fournis au service administrateur en fonctionnement. Aucune adresse ou mot de passe par défaut n’est livré ; aucun compte de démonstration n’existe en production.

La connexion utilise uniquement l’adresse e-mail et le mot de passe. Après validation, l’administrateur accède directement au tableau de bord. Les anciennes pages `/securite` et `/verification` redirigent vers les paramètres et le tableau de bord. Aucun code TOTP ou de récupération n’est demandé, y compris pour un compte ayant déjà activé un second facteur. Les anciennes colonnes et tables MFA restent en base pour conserver la compatibilité des migrations, mais ne sont plus utilisées par l’authentification.

Le bouton Déconnexion est disponible sur ordinateur et mobile. Une navigation complète après connexion/déconnexion écarte le cache de navigation du compte précédent.

## Récupération et révocation

Les comptes sont gérés uniquement par un opérateur autorisé :

```sh
npm run admin:manage
```

La commande demande le compte, l’action et une confirmation explicite. Actions : `desactiver`, `reactiver`, `mot-de-passe`. Elle révoque les sessions en cours. La réinitialisation du mot de passe demande une nouvelle saisie masquée. Vérifier l’identité de la personne avant une récupération ; ne pas réinitialiser sur simple demande d’e-mail. La clé BETTER_AUTH_SECRET doit être sauvegardée hors de PostgreSQL.

## Tableau de bord

Les compteurs et dernières demandes sont calculés depuis PostgreSQL, sans données de secours. « Nouvelles demandes » compte NEW ; « À qualifier » compte TO_QUALIFY. Les demandes non vérifiées ont leur indicateur distinct. Les projets en création couvrent l’acceptation, la préparation, la création, la vérification et la proposition prête. Les propositions envoyées couvrent l’envoi et l’attente de validation. Les propositions acceptées incluent les projets validés puis avancés jusqu’à publication. Les projets terminés sont les sites PUBLISHED.

Les actions rapides ouvrent les nouvelles demandes, les projets et les propositions en attente. Une panne de connexion affiche une erreur ; elle ne devient pas un tableau vide avec de faux zéros.

## Demandes et qualification

Une soumission valide du site est enregistrée avec PENDING_VERIFICATION et apparaît immédiatement dans `/demandes`. L’administration ne remplace pas le lien de confirmation prospect. La qualification et la conversion attendent `emailVerifiedAt`.

La liste offre recherche (entreprise, contact, e-mail, activité, secteur et ville), filtre de statut, tri par date et pagination de 20 résultats. La fiche conserve tous les champs transmis, dont les anciens champs facultatifs, les versions tarifaires/confidentialité, les UTM et les dates de vérification. Une information absente est affichée comme non renseignée. Aucun prénom/nom séparé n’est déduit du nom complet.

Après vérification : NEW peut devenir TO_QUALIFY, QUALIFIED, REJECTED ou CANCELLED. TO_QUALIFY peut être qualifiée, refusée ou annulée. REJECTED peut être remise à qualifier. Une demande QUALIFIED peut être convertie en projet, refusée ou annulée. Les statuts finaux ne sont pas réouverts automatiquement.

Les modifications vérifient le statut attendu : une fiche modifiée par quelqu’un d’autre doit être rechargée. Les notes sont du texte, enregistrées avec l’auteur et la date ; leur contenu n’est pas injecté comme HTML ni inscrit dans les logs applicatifs.

## Projets

La conversion d’une demande qualifiée et vérifiée crée un seul Project relié par `leadId` unique. Les coordonnées ne sont pas copiées. Le verrou transactionnel rend les doubles clics idempotents. L’opération et le changement de statut sont historisés.

Étapes : projet accepté → préparation des contenus → création → vérification → proposition prête → proposition envoyée → attente de validation → validation obtenue → attente du paiement → paiement confirmé → mise en ligne → site en ligne. Les étapes intermédiaires ne peuvent pas être sautées. L’annulation est possible avant le statut final.

La prévisualisation HTTPS est nécessaire avant « Proposition envoyée ». Le lien HTTPS du site est nécessaire avant « Site en ligne ». Les liens n’acceptent ni javascript ni identifiants intégrés. L’application ne télécharge pas ces URL et ne déclenche aucun déploiement. Une modification concurrente des liens est refusée grâce à updatedAt.

Le suivi est manuel : marquer une proposition envoyée, une validation obtenue ou un paiement confirmé exige que l’événement ait réellement eu lieu. Aucun e-mail de proposition, paiement Stripe ou appel Vercel n’est exécuté. `vercelProjectId` et `stripeCustomerId` sont seulement des références facultatives prévues au schéma.

Le statut de la demande suit le projet dans la même transaction. Il se modifie alors depuis le projet, pour éviter des états contradictoires. Notes et historique restent internes ; les 100 éléments les plus récents sont affichés et la limite est signalée, sans suppression des éléments plus anciens en base.

Clients regroupe maintenant les échanges, devis complémentaires et paiements. Voir [le guide relation client](relation-client.md) pour le parcours local et la configuration Resend/Stripe. Sites internet et Abonnements affichent un état « À venir » explicite. Les liens définitifs restent consultables dans les projets. Paramètres affiche le compte et les informations de fonctionnement sans révéler les variables secrètes.

## Corbeille des demandes

La fiche d’une demande propose « Mettre à la corbeille », suivi d’une confirmation. Les demandes supprimées sont retirées des demandes actives, des clients et des indicateurs. L’onglet « Corbeille » permet de les rechercher puis de les restaurer, avec leur contenu, leur statut et leur historique. Les actions sont réservées aux administrateurs authentifiés et refusées si la fiche a changé depuis son affichage.

Une demande associée à un projet, un devis ou des échanges ne peut pas être placée dans la corbeille. Les liens de validation et le renvoi d’e-mails sont inactifs tant qu’une demande est dans la corbeille ; le worker ignore ses messages en attente. Un envoi déjà en cours chez le fournisseur ne peut pas être rappelé. La restauration rend de nouveau utilisables les liens et messages qui n’ont pas expiré. Aucune suppression définitive ni purge automatique n’est réalisée.

Avant de déployer cette version sur Railway, appliquer `npm run db:migrate:deploy` avec la connexion opérateur PostgreSQL. La migration `20261015180000_lead_trash` ajoute le champ nullable `Lead.deletedAt` et complète les droits des rôles `nova_admin`/`nova_worker` existants. Pour des rôles portant d’autres noms, accorder `UPDATE ("deletedAt") ON "Lead"` à l’administration et `SELECT ("id", "deletedAt") ON "Lead"` au worker. Les scripts de création de nouveaux rôles incluent ces droits. Appliquer la migration avant de redéployer le site, l’administration et le worker.

Le contrôle `npx tsx scripts/test-lead-pipeline.ts --trash-ui` utilise une base locale jetable et teste l’annulation, la suppression, les filtres de corbeille et la restauration à 375, 768, 1024 et 1440 pixels. Les captures sont enregistrées dans `reports/trash`.

## Sécurité et limites

Chaque lecture et chaque mutation passe par le contrôle serveur ; le layout est un confort supplémentaire, pas la seule protection. Les actions sont validées avec Zod et les accès Prisma sont paramétrés. Les routes de création du site refusent les statuts privilégiés comme auparavant.

Les endpoints Better Auth exposés sont limités à la connexion, la déconnexion, la lecture de session et la double authentification TOTP/codes de secours. L’inscription publique et la modification arbitraire de compte ne sont pas exposées. Les opérations de configuration MFA exigent aussi un administrateur actif. Les POST exigent l’origine exacte et limitent le corps à 20 Ko, y compris sans Content-Length.

Un compteur PostgreSQL atomique limite 30 opérations d’authentification par adresse sur 15 minutes et cinq connexions par compte sur cette période. Les clés sont HMAC, les compteurs temporaires. Le compteur mémoire est désactivé. En cas de panne PostgreSQL, aucune connexion n’est annoncée.

TRUSTED_CLIENT_IP_HEADER doit désigner uniquement un en-tête garanti comme entièrement remplacé par le proxy. Sans cette garantie, laisser vide : la quota global conservatrice s’applique. Aucune origine joker, aucun secret partagé avec le navigateur, aucun cache public de données administrateur.

La durée de conservation des demandes, notes, historique et traces de connexion doit être fixée par le responsable avant production. L’administration n’ajoute aucune purge destructive. Les pièces jointes des retours privés sont chiffrées en PostgreSQL et leur téléchargement exige la session du bon client ou d’un administrateur. Les pièces jointes des échanges Resend conservent leur circuit existant. Aucun téléchargement public n’est ajouté.

## Vérifications

```sh
npm test
npm run test:integration
npm run test:admin-ui
npm run typecheck
npm run lint
npm run db:validate
npm run build:website
npm run build:admin
```

Les tests d’intégration créent une base PostgreSQL isolée sur loopback, appliquent les migrations et testent le pipeline, les accès privés, la connexion par mot de passe, les notes, la conversion concurrente, les filtres et le suivi. Le scénario navigateur lance les deux applications locales, soumet le vrai formulaire et teste les actions serveur, la connexion sans second facteur et les largeurs 375/768/1024/1440. Les identités fictives n’existent que dans cette base de test. Aucun e-mail réel n’est envoyé. Les serveurs sont arrêtés à la fin ; captures et contrôles sont dans `reports/admin`, ignoré par Git.

La connexion à votre Railway réel et la livraison Resend nécessitent vos services configurés. Elles ne sont pas validées par une base locale. Les contrôles effectués comprennent 19 tests unitaires, 7 tests du pipeline et 8 tests d’administration/PostgreSQL, les builds des deux applications, le lint/TypeScript et les parcours navigateur sur quatre largeurs. L’audit des dépendances de production ne signale pas de vulnérabilité ; cinq alertes restent dans l’outillage ESLint existant.

Sources : [Better Auth / Next.js](https://better-auth.com/docs/integrations/next), [Better Auth / E-mail et mot de passe](https://better-auth.com/docs/authentication/email-password).


## Double authentification

Ouvrir Sécurité (`/securite`) après connexion. Saisir son mot de passe, scanner le QR local dans une application TOTP, sauvegarder les codes de secours et confirmer un code à six chiffres. Le QR n’est transmis à aucun service d’image externe. L’activation n’est effective qu’après cette vérification ; les anciens accès sans second facteur ne donnent alors plus accès à l’admin. Les codes de secours ne s’utilisent qu’une fois.

Aux connexions suivantes, le mot de passe conduit à `/verification` ; aucune session utilisable n’est conservée avant le code TOTP ou de secours. Cinq échecs consécutifs de second facteur verrouillent le compte pendant quinze minutes, en plus des limites IP. L’option de confiance de l’appareil est refusée. La double authentification reste à activer individuellement depuis ce menu.

En cas de perte du téléphone ET des codes de secours, un opérateur autorisé peut lancer `npm run admin:manage`, choisir `reset-mfa` et confirmer. Cette opération révoque toutes les sessions et challenges du compte et retire le second facteur ; l’administrateur doit ensuite le reconfigurer. Aucun endpoint public de récupération MFA n’est exposé. Les indicateurs historiques sans secret MFA sont normalisés par la migration pour éviter de bloquer un compte qui n’avait jamais réellement configuré son application.

Les tests d’intégration couvrent l’activation vérifiée, le challenge après mot de passe, les codes de secours à usage unique et la révocation du compte. Voir `docs/relation-client.md` pour les nouveaux écrans de suivi, fichiers privés, campagnes et santé.


## Audience Google Analytics dans l’admin

La page `/audience` lit Google Analytics Data API pour la propriété Zelyweb `559264383`. Elle affiche visiteurs uniques mesurés sur la période, sessions, pages vues, évolution quotidienne, quinze premières sources et pages, ainsi que les événements de boutons/contact/formulaire déjà instrumentés. Les périodes sont 7, 30 ou 90 jours, jusqu’au jour courant dans Europe/Paris ; les chiffres du jour peuvent être incomplets. Les rapports sont limités aux hôtes `zelyweb.com` et `www.zelyweb.com`. Les sites clients et le localhost ne sont pas agrégés.

La lecture exige un administrateur actif, même si un rapport est déjà en cache. Le serveur utilise la bibliothèque officielle `google-auth-library`, un scope OAuth `analytics.readonly` et un compte de service dédié. Le jeton n’est jamais envoyé au navigateur. Aucun changement de base n’est nécessaire pour ce branchement.

Configuration dans Google Cloud puis Railway **service admin uniquement** :

1. Sélectionner/créer un projet Google Cloud et activer **Google Analytics Data API** (`analyticsdata.googleapis.com`).
2. Dans IAM et administration → Comptes de service, créer un compte dédié (par exemple `zelyweb-analytics`). Aucun rôle de gestion du projet Cloud n’est nécessaire pour lire la propriété Analytics.
3. Copier l’adresse du compte de service. Dans Google Analytics → Administration → Gestion des accès à la propriété **559264383**, ajouter cette adresse avec le rôle **Lecteur**.
4. Créer une clé JSON pour ce compte de service. Conserver ce fichier privé hors du dépôt. Dans Railway → admin → Variables, définir `GA4_PROPERTY_ID=559264383`, `GA4_SERVICE_ACCOUNT_EMAIL` avec le champ `client_email`, et `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` avec le champ `private_key` du JSON. Les retours PEM réels et les séquences littérales `\n` sont pris en charge. Aucune variable `NEXT_PUBLIC_` pour ces identifiants.
5. Redéployer l’admin, puis ouvrir Audience et clics. Ne transmettre ni le fichier JSON ni la clé privée dans la conversation. L’adresse du compte de service et le numéro de propriété peuvent être communiqués pour l’assistance.

Sans identifiants, sans permission ou lors d’une panne Google, un message explicite remplace les rapports. Aucune valeur de démonstration n’est affichée. Un zéro est présenté uniquement après une réponse de rapports valide. Les données réussies sont mises en cache cinq minutes en mémoire par propriété, identifiants et période. Aucun rapport expiré n’est présenté comme une lecture fraîche ; plusieurs requêtes simultanées partagent la même lecture. Les seuils de confidentialité/échantillonnage indiqués par Google sont signalés.

Les clics sont les événements déjà suivis (`cta_click`, `contact_click`, `lead_form_start`, `lead_form_step`, `lead_form_submit`, `lead_form_success`), pas tous les clics de la page. Les compteurs d’événements peuvent compter plusieurs actions par visiteur. Les visiteurs uniques de la période ne sont pas obtenus en additionnant les visiteurs quotidiens. Le consentement et les bloqueurs réduisent potentiellement l’audience mesurée ; la base des demandes reste une mesure distincte. Aucun nouveau traceur ni contournement du consentement n’est introduit.

Références : [API Google Analytics](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart) et [dimensions/métriques](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema).
