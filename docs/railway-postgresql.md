# Configuration PostgreSQL Railway

Le projet utilise désormais deux applications. Pour leurs commandes indépendantes, le réseau privé et les droits administrateur, commencer par [le guide Railway du monorepo](railway-monorepo.md). Le schéma et les migrations se trouvent maintenant dans `packages/database/prisma/`. Les variables du site sont décrites dans `apps/website/.env.example`, celles de l’administration dans `apps/admin/.env.example`.

## Créer et connecter la base

1. Dans un projet Railway, ajouter le service PostgreSQL officiel, choisir la région adaptée à votre application et attendre son démarrage. Le template inclut PostgreSQL avec TLS et un volume persistant.
2. Dans Variables / Connect, récupérer les variables de connexion sans les copier dans le dépôt ou les logs. Créer une base de préproduction distincte pour les essais.
3. Si Next.js et le worker tournent dans le même environnement Railway, utiliser la connexion du réseau privé par référence de variable. Si Next.js est hébergé ailleurs (par exemple Vercel), activer l’accès externe via le proxy TCP et utiliser `DATABASE_PUBLIC_URL` comme valeur de votre variable serveur `DATABASE_URL`.
4. Configurer le TLS selon le service choisi. `sslmode=require` chiffre la connexion mais ne valide pas nécessairement l’identité du serveur avec les pilotes compatibles libpq. Préférer `sslmode=verify-full` avec la chaîne de confiance correcte quand disponible. Pour une CA fournie au pilote `pg`, renseigner `DATABASE_SSL_CA` avec le PEM et retirer les paramètres SSL de l’URL qui pourraient l’écraser. Tester la connexion dans l’environnement final. Ne jamais définir NODE_TLS_REJECT_UNAUTHORIZED=0. `sslmode=disable` est réservé aux tests locaux isolés.

Le code utilise Prisma 7, `@prisma/adapter-pg` et `pg`, en runtime Node.js. La connexion des commandes Prisma est configurée dans `prisma.config.ts`. `DIRECT_URL` reste vide pour une connexion PostgreSQL directe standard ; si un pooler est ajouté, utiliser DATABASE_URL pour l’application et DIRECT_URL pour la CLI/migration.

`DATABASE_POOL_MAX=3` limite le pool de chaque processus. Le client est réutilisé dans Next.js, y compris lors des rechargements de développement. Ne pas déconnecter Prisma après chaque requête. Dimensionner le total (instances web + workers + administration) sous la limite PostgreSQL et ajouter un pooler si nécessaire. Une connexion privée ne fonctionne pas depuis Vercel ou votre machine locale.

Sources : [PostgreSQL Railway](https://docs.railway.com/databases/postgresql), [Prisma Config](https://docs.prisma.io/docs/orm/reference/prisma-config-reference), [TLS PostgreSQL](https://www.postgresql.org/docs/current/libpq-ssl.html).

## Variables

Copier `.env.example` en `.env.local` pour le développement et fournir les valeurs réelles dans le gestionnaire de secrets de l’hébergeur pour la production.

| Variable | Usage |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL du site et du worker, jamais publique |
| `DIRECT_URL` | Facultative, connexion CLI directe si pooler / rôle migrations distinct |
| `DATABASE_POOL_MAX` | Taille du pool par processus, défaut 3 |
| `DATABASE_SSL_CA` | CA PEM facultative pour le runtime `pg` |
| `NEXT_PUBLIC_SITE_URL` | Origine finale HTTPS autorisée et base des liens e-mail |
| `RESEND_API_KEY` | Clé serveur d’envoi transactionnel |
| `LEAD_FROM_EMAIL` | Expéditeur du domaine vérifié chez Resend |
| `LEAD_TO_EMAIL` | Destinataire interne des demandes vérifiées |
| `OUTBOX_ENCRYPTION_KEY` | Secret base64 de 32 octets, identique sur le site et le worker |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis REST partagé anti-spam |
| `RATE_LIMIT_SALT` | Secret aléatoire HMAC des compteurs réseau |
| `TRUSTED_CLIENT_IP_HEADER` | Facultatif, uniquement un en-tête écrasé par un proxy de confiance |

Générer les secrets dans un environnement privé : `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Ne pas les partager dans le chat. Conserver OUTBOX_ENCRYPTION_KEY hors de PostgreSQL ; sa perte empêche le déchiffrement des envois en attente. Une rotation exige de vider/rechiffrer l’outbox avant remplacement.

Le worker doit démarrer avec `npm run outbox:watch` et accéder aux mêmes secrets. Il peut être un service séparé Railway utilisant le même code. Aucune création de service ni automatisation de déploiement n’a été réalisée par cette implémentation.

## Installer et appliquer les migrations

Node.js 22.23 ou une version compatible Prisma 7 / Next.js est nécessaire.

```sh
npm ci
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run build
```

`npm ci` et le build génèrent le client, sans appliquer de migration. La migration initiale ajoute les tables, enums, relations et index. Exécuter `db:migrate:deploy` une seule fois depuis un contexte opérateur contrôlé, avec le rôle propriétaire et après revue/sauvegarde. Ne pas utiliser `migrate reset`, `db push --accept-data-loss` ou `migrate dev` en production. Aucune migration de production n’est lancée automatiquement.

La CLI charge `.env*` avec `@next/env`. En production elle privilégie DIRECT_URL lorsqu’il est présent. Utiliser une connexion migrations dédiée et éviter de fournir les identifiants propriétaire au service web. Les paramètres CA du runtime ne sont pas automatiquement appliqués à la CLI : configurer également sa connexion TLS et tester `prisma migrate status` dans le contexte opérateur.

## Accès séparés

Créer des utilisateurs LOGIN avec des mots de passe générés dans un gestionnaire de secrets, associés à des rôles de capacités. Ne pas garder le superutilisateur Railway pour le site. Exemple de capacités, à adapter sous contrôle du propriétaire :

```sql
CREATE ROLE nova_web NOLOGIN;
CREATE ROLE nova_worker NOLOGIN;
CREATE ROLE nova_admin NOLOGIN;
GRANT USAGE ON SCHEMA public TO nova_web, nova_worker, nova_admin;
GRANT SELECT, INSERT ON "Lead" TO nova_web;
GRANT UPDATE ("status", "emailVerifiedAt", "updatedAt") ON "Lead" TO nova_web;
GRANT SELECT, INSERT, UPDATE ON "EmailVerificationToken", "OutboxEvent" TO nova_web;
GRANT SELECT, UPDATE ON "OutboxEvent" TO nova_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Lead", "LeadFile",
  "EmailVerificationToken", "OutboxEvent" TO nova_admin;
```

Accorder CONNECT sur la base aux rôles concernés puis attribuer chaque rôle à son utilisateur LOGIN distinct. Ces commandes ne créent pas de mot de passe et ne sont pas appliquées par les migrations. Les privilèges du site sont nécessaires à la transaction de confirmation ; la restriction métier des transitions est dans le serveur. Pour isoler aussi cette règle face à une compromission des identifiants web, ajouter une fonction SQL/trigger dédiée contrôlant les transitions du rôle web avant mise en service. Le compte administration n’est jamais utilisé par le navigateur.

Révoquer la création de schéma pour PUBLIC si elle est accordée, vérifier les privilèges hérités et empêcher les utilisateurs d’exécution de créer/modifier le schéma. Appliquer les droits des nouvelles tables à chaque migration ; ne pas donner automatiquement tous les droits sur toutes les futures tables au site. Les notes internes et l’historique futur seront réservés à l’administration.

## Configurer Resend et tester un parcours complet

1. Vérifier votre domaine d’envoi (SPF/DKIM) dans Resend, créer une clé d’envoi et configurer l’expéditeur/destinataire interne.
2. Configurer PostgreSQL, Redis, origine HTTPS et clé de chiffrement ; démarrer le worker. Le formulaire reste en préparation si la configuration requise manque.
3. Dans la préproduction, déposer une demande de contrôle autorisée. Vérifier une ligne PENDING_VERIFICATION, un jeton et un événement d’outbox, sans notification interne.
4. Observer le passage de l’événement à SENT et le message dans Resend. La réception dépend aussi du fournisseur et de la boîte ; vérifier les indésirables.
5. Ouvrir le lien et cliquer sur « Confirmer mon adresse e-mail ». Vérifier NEW, emailVerifiedAt et les deux événements supplémentaires, puis leur prise en charge.
6. Vérifier le refus d’un second usage, d’un lien expiré, le renvoi limité et les messages génériques. Simuler une panne Resend en préproduction : la demande doit rester enregistrée avec une reprise différée.
7. Contrôler les méthodes GET/PATCH/DELETE des trois routes : 405 et aucune donnée prospect. Tester une origine étrangère : 403. Ne pas inclure des tokens/adresses dans les journaux de reverse proxy ou analytics.

Les tests automatisés n’envoient aucun e-mail réel et ne valident pas vos identifiants Railway/Resend. Le test externe ci-dessus reste à effectuer une fois ces services configurés.

## Sauvegarder et restaurer

Activer les sauvegardes Railway adaptées au plan, définir leur rétention et envisager PITR. Tester une restauration dans un service distinct avant d’avoir besoin d’un secours. Une restauration sur la base active est une opération destructrice à planifier, avec arrêt des écritures et du worker.

Pour une sauvegarde logique, utiliser un client PostgreSQL de version compatible et un compte dédié. Fournir les variables PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD et PGSSLMODE dans un environnement privé, puis :

```sh
pg_dump --format=custom --no-owner --file=lead-backup.dump
```

Chiffrer le fichier, le stocker hors de l’application avec des accès restreints et une rétention définie. Pour un exercice de restauration, pointer ces mêmes variables vers une **nouvelle base vide de test**, puis :

```sh
pg_restore --no-owner --no-acl --dbname=restore_test lead-backup.dump
```

Réappliquer les rôles/privilèges (non inclus ici), vérifier les tables, relations, compteurs et `_prisma_migrations`. Conserver séparément la clé de chiffrement. Ne pas démarrer le worker sur une base restaurée avant réconciliation avec Resend : certains événements peuvent sembler en attente alors que les e-mails ont déjà été acceptés. Mesurer le temps de restauration et documenter les objectifs de perte et de reprise.

Sources : [guide Railway sauvegarde/restauration](https://docs.railway.com/guides/postgres-backups-restores), [PITR Railway](https://docs.railway.com/volumes/point-in-time-recovery).
