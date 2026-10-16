# Déployer le monorepo sur Railway

## Services indépendants

Le service site vitrine exige les clés réelles `TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` du widget Cloudflare Turnstile, configuré pour le domaine du site. Les clés de test localhost sont refusées en production. Voir [la protection anti-robot](lead-pipeline.md#protection-anti-robot).

Prévoir PostgreSQL, un service site vitrine, un service administration, un processus worker d’e-mails et un service de migrations ponctuel. Les deux applications web sont indépendantes ; le worker reprend le pipeline existant. Les sites clients futurs restent destinés à Vercel, sans intégration active dans cette version.

Installer depuis la racine avec `npm ci`. Pour les services partageant des packages, conserver la racine du dépôt comme contexte d’installation/build ; ne pas limiter le contexte à `apps/admin` ou `apps/website`. Configurer directement les commandes dans les paramètres des nouveaux services. Les fichiers TOML ci-dessous sont des références historiques : Config as Code est déprécié, indisponible pour les nouveaux services et cesse d'être lu le 1er décembre 2026. Utiliser les paramètres ou [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code).

| Service | Configuration | Build | Démarrage |
| --- | --- | --- | --- |
| Site | `railway.website.toml` | `npm run build:website` | `npm run start -- --hostname 0.0.0.0` |
| Administration | `railway.admin.toml` | `npm run build:admin` | `npm run start:admin -- --hostname 0.0.0.0` |
| Worker | `railway.worker.toml` | `npm run db:generate` | `npm run outbox:watch` |

Next.js utilise la variable PORT fournie par Railway. Les patterns de surveillance incluent les packages partagés. Aucun domaine ni service distant n’a été créé automatiquement. Les fichiers TOML préparent la configuration, sans appliquer de migration ni lancer de déploiement depuis la machine locale.

Source : [monorepos Railway](https://docs.railway.com/deployments/monorepo), [configuration Railway](https://docs.railway.com/reference/config-as-code).

## PostgreSQL privé et droits

Créer PostgreSQL dans le même projet/environnement Railway. Les deux services web et le worker utilisent le réseau privé, avec le même nom de base et des utilisateurs LOGIN différents. La référence automatique à DATABASE_URL du service PostgreSQL utilise généralement son utilisateur propriétaire : construire des URL privées avec les utilisateurs d’exécution restreints. Ne pas attribuer le superutilisateur au site ou à l’administration.

Le schéma partagé et ses migrations sont dans `packages/database/prisma`. Les rôles de capacité recommandés :

```sql
-- À exécuter uniquement par le propriétaire, après les migrations.
-- Si un rôle existe déjà, compléter ses privilèges au lieu de le recréer.
CREATE ROLE nova_web NOLOGIN;
CREATE ROLE nova_admin NOLOGIN;
CREATE ROLE nova_worker NOLOGIN;
GRANT USAGE ON SCHEMA public TO nova_web, nova_admin, nova_worker;

GRANT SELECT, INSERT ON "Lead" TO nova_web;
GRANT UPDATE ("status", "emailVerifiedAt", "updatedAt") ON "Lead" TO nova_web;
GRANT SELECT, INSERT, UPDATE ON "EmailVerificationToken", "OutboxEvent" TO nova_web;

GRANT SELECT ON "Lead", "LeadFile" TO nova_admin;
GRANT UPDATE ("status", "updatedAt", "deletedAt") ON "Lead" TO nova_admin;
GRANT SELECT, INSERT, UPDATE ON "Project" TO nova_admin;
GRANT SELECT, INSERT ON "InternalNote", "ActivityLog" TO nova_admin;
GRANT SELECT ON "AdminUser" TO nova_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_user, auth_session,
  auth_account, auth_verification, auth_two_factor, "AuthRateBucket" TO nova_admin;

GRANT SELECT, UPDATE ON "OutboxEvent" TO nova_worker;
GRANT SELECT ("id", "deletedAt") ON "Lead" TO nova_worker;
```

Accorder CONNECT sur la base et attribuer chaque rôle à un utilisateur LOGIN dont le mot de passe est généré et conservé hors Git. Ne pas accorder au site les tables auth, notes, historique ou projets. Le rôle administration ne peut pas modifier emailVerifiedAt et ne lit pas les jetons prospects ou contenus d’outbox. L’historique est SELECT/INSERT uniquement pour le runtime. Les UUID sont générés par Prisma/Better Auth ; aucune séquence n’est utilisée.

Le compte opérateur, distinct des trois runtimes, gère migrations et création/récupération des administrateurs. Vérifier les droits hérités, les droits PUBLIC et le propriétaire des tables ; ne jamais donner aux utilisateurs d’exécution des droits de création/modification du schéma. Les commandes SQL sont des instructions à adapter, non appliquées automatiquement.

## Variables par service

**Site et worker :** les variables existantes de `apps/website/.env.example` : DATABASE_URL, pool/TLS, NEXT_PUBLIC_SITE_URL (origine du site), Resend, clé d’outbox et Redis. Le worker charge cet emplacement en local et les variables injectées par Railway en production. Il doit rester actif ; sans lui les e-mails sont enregistrés mais ne partent pas.

Le worker peut utiliser `WORKER_DATABASE_URL` pour son identité dédiée. Si cette variable est absente, il utilise DATABASE_URL du service worker. Ne pas lui fournir les identifiants opérateur.

**Administration :** `apps/admin/.env.example` : DATABASE_URL avec son utilisateur distinct, pool/TLS, BETTER_AUTH_URL (origine administrative HTTPS), BETTER_AUTH_SECRET, NEXT_SERVER_ACTIONS_ENCRYPTION_KEY stable entre instances, et l’en-tête IP du proxy seulement après vérification de sa garantie. Le module commercial utilise également Resend et Stripe, avec les variables décrites dans [relation-client.md](relation-client.md).

Utiliser un domaine distinct réel lorsque vous l’aurez choisi. Configurer BETTER_AUTH_URL avec cette origine exacte et NEXT_PUBLIC_SITE_URL avec l’origine du site. Ne pas partager les cookies entre sous-domaines. Aucun domaine de marque fictif n’est prédéfini.

La configuration TLS et la taille des pools sont décrites dans [railway-postgresql.md](railway-postgresql.md). Additionner les pools de toutes les instances web, worker et accès opérateur ; leur total doit rester sous la capacité PostgreSQL.

## Migrations et premier accès

1. Sauvegarder la base et vérifier les accès opérateur.
2. Revoir la migration additive `20261013180000_admin` : nouveaux enums/tables et relations, aucune suppression de demandes.
3. Fournir DATABASE_URL ou DIRECT_URL opérateur depuis un contexte autorisé et exécuter `npm run db:migrate:deploy`.
4. Appliquer/vérifier les rôles et privilèges.
5. Construire et démarrer les applications séparément.
6. Exécuter `npm run admin:create` depuis un terminal interactif autorisé capable de joindre la base. Depuis votre machine, le nom privé Railway n’est pas résolvable : utiliser un accès opérateur approprié, éventuellement une connexion publique temporaire chiffrée, puis retirer cet accès si inutile.
7. Ouvrir l’origine administrative et se connecter avec l’e-mail et le mot de passe du compte.
8. Déposer une demande de contrôle autorisée sur le site, confirmer l’e-mail et vérifier sa qualification/conversion dans l’administration.

Ne pas utiliser `db push`, `migrate reset` ou une migration destructive en production. Les applications ne modifient pas le schéma à leur démarrage. Le service de migrations applique les mises à jour, puis les pré-déploiements attendent leur confirmation comme décrit ci-dessous. Une migration échouée empêche la nouvelle version de démarrer ; les anciennes instances continuent selon le fonctionnement Railway. Les migrations doivent rester compatibles avec la version encore en ligne.

Les builds ont besoin d’accéder aux polices Google déjà utilisées par le site et reprises dans l’administration. Ils génèrent Prisma mais ne se connectent pas à la base pour lire les demandes.

## Sauvegarde et restauration

Le module échanges, devis et paiements nécessite aussi les deux migrations commerciales, leurs privilèges et les variables Resend/Stripe décrites dans [relation-client.md](relation-client.md). Sauvegarder sa clé `COMMERCIAL_ENCRYPTION_KEY` et inclure ses tables dans les sauvegardes.

Conserver la stratégie décrite dans [railway-postgresql.md](railway-postgresql.md), en incluant maintenant les tables d’authentification, projets, notes et historique. Sauvegarder séparément BETTER_AUTH_SECRET et OUTBOX_ENCRYPTION_KEY ; la base seule ne permet pas de récupérer les secrets chiffrés.

Restaurer d’abord dans une base distincte, réappliquer les rôles et vérifier les migrations, relations et compteurs. Après restauration, révoquer les sessions administrateur restaurées avant ouverture. Réconcilier l’outbox avec Resend avant de redémarrer le worker pour éviter un renvoi déjà accepté. Aucun test de restauration sur votre base Railway réelle n’a été effectué ici.

## Migrations automatiques : configuration initiale unique

Objectif : un push contenant une migration Prisma déclenche son application sans console ni commande manuelle. Les fichiers SQL sont toujours préparés et vérifiés dans le dépôt ; cette automatisation n’utilise ni `db push`, ni `migrate dev`, ni `migrate reset`.

### 1. Service `migrations`

Créer un service depuis le **même dépôt GitHub, la même branche et le même environnement Railway** que les applications. Conserver la racine du dépôt (Root Directory vide ou `/`). Configurer dans les paramètres du service :

| Paramètre | Valeur |
| --- | --- |
| Build Command | `npm run db:generate` |
| Start Command | `npm run db:migrate:deploy` |
| Restart Policy | Never |
| Replicas | 1 |
| Healthcheck | Aucun |
| Domaine public / volume | Aucun |

Activer l’autodéploiement GitHub. Les Watch Paths doivent inclure `/packages/database/**`, `/prisma.config.ts`, `/package.json` et `/package-lock.json`, ou rester non filtrés. Une migration nouvelle doit déclencher ce service même si les applications changent peu. Le processus se termine avec succès après application : ce n’est pas un serveur à maintenir Online. En cas d’échec, ne pas faire tourner le job en boucle ; corriger la migration ou les droits puis redéployer.

Variables du service migrations uniquement : `NODE_ENV=production`, et `DATABASE_URL` référencée depuis le service PostgreSQL **avec son utilisateur propriétaire**. Si le service s’appelle `Postgres`, la référence Railway usuelle est `${{Postgres.DATABASE_URL}}` ; adapter au nom réel du service et vérifier qu’il s’agit bien de la connexion propriétaire, pas d’une URL `nova_web`, `nova_admin` ou `nova_worker`. Ne pas recopier cette connexion dans les trois services applicatifs. `DIRECT_URL` peut rester absent pour une connexion directe au PostgreSQL privé. Aucun secret Stripe, Resend ou d’authentification n’est nécessaire au service migrations.

### 2. Attente avant de remplacer les applications

Dans **Settings → Deploy → Pre-deploy Command**, renseigner une fois :

| Service | Pre-deploy Command |
| --- | --- |
| Site | `npm run db:migrate:wait` |
| Admin | `npm run db:migrate:wait` |
| Worker e-mail | `npm run db:migrate:wait:worker` |

Conserver les Start Commands existantes. Prévoir un Pre-deploy Timeout Railway de 360 secondes ; le script s’arrête lui-même après 300 secondes par défaut, réglables par `MIGRATION_WAIT_TIMEOUT_SECONDS` (1 à 1800). Si les builds sont en file d’attente longtemps, augmenter les deux délais en gardant le timeout Railway supérieur à celui du script. Le service migrations doit pouvoir s’exécuter pendant que les autres attendent : ne pas configurer une file de déploiement à un seul emplacement occupé par une attente.

Le site et l’admin lisent leur `DATABASE_URL` restreinte. Le worker prend `WORKER_DATABASE_URL` lorsqu’elle existe, sinon `DATABASE_URL`. Chaque vérification compare les migrations SQL embarquées avec les noms, sommes de contrôle, dates de fin et absence de rollback dans `_prisma_migrations`. Elle n’écrit rien dans la base et ne demande pas les identifiants propriétaire. Un déploiement sans modification de schéma passe immédiatement. S’il manque une migration, si son contenu diffère ou si elle a échoué, le script attend puis échoue : Railway ne remplace pas cette application par la nouvelle version.

La migration `20261016180000_migration_readiness` accorde uniquement la lecture des quatre colonnes nécessaires aux rôles `nova_web`, `nova_admin`, `nova_worker` existants (et leurs variantes avec suffixe). Les scripts de création de rôles donnent les mêmes droits aux nouveaux comptes. Pour un nom de rôle personnalisé, le propriétaire doit lui accorder une fois :

```sql
GRANT SELECT (migration_name, checksum, finished_at, rolled_back_at)
ON "_prisma_migrations" TO "nom_du_role_runtime";
```

Appliquer d’abord les paramètres et démarrer le service migrations contenant les deux nouvelles migrations Stripe et de contrôle ; configurer ensuite les attentes sur les trois applications, puis les redéployer. Cette première installation est nécessaire puisque la configuration n’est pas accessible depuis le dépôt seul. Les TOML historiques incluent aussi les commandes d’attente pour les services qui les utilisent encore ; renseigner les paramètres Railway assure leur conservation après la fin de Config as Code. Une gestion IaC complète doit partir d’un import de l’environnement réel, sans recréer ni supprimer les services existants.

### 3. Ensuite

Les changements de schéma sont livrés avec leur migration versionnée dans les commits. Le service migrations les applique et les autres services attendent avant de démarrer. Une panne de connexion ou une migration SQL réellement invalide peut toujours nécessiter une intervention ; l’automatisation n’efface jamais l’historique et ne répare pas une migration échouée en inventant un état réussi.

Vérifications : `npm test` couvre les migrations manquantes, incomplètes, modifiées ou annulées et la sortie en erreur sans fuite de secrets. `npm run test:integration` applique les migrations sur une base temporaire, exécute l’attente réelle et vérifie les droits de lecture sans autorisation de modification de l’historique.

Sources : [commandes avant déploiement](https://docs.railway.com/deployments/pre-deploy-command), [politiques de redémarrage](https://docs.railway.com/deployments/restart-policy), [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code).
