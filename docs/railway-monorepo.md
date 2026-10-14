# Déployer le monorepo sur Railway

## Services indépendants

Le service site vitrine exige les clés réelles `TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` du widget Cloudflare Turnstile, configuré pour le domaine du site. Les clés de test localhost sont refusées en production. Voir [la protection anti-robot](lead-pipeline.md#protection-anti-robot).

Prévoir PostgreSQL, un service site vitrine, un service administration et un processus worker d’e-mails. Les deux applications web sont indépendantes ; le worker reprend le pipeline existant. Les sites clients futurs restent destinés à Vercel, sans intégration active dans cette version.

Installer depuis la racine avec `npm ci`. Pour les services partageant des packages, conserver la racine du dépôt comme contexte d’installation/build ; ne pas limiter le contexte à `apps/admin` ou `apps/website`. Sélectionner le fichier de configuration Railway adapté dans chaque service :

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
GRANT UPDATE ("status", "updatedAt") ON "Lead" TO nova_admin;
GRANT SELECT, INSERT, UPDATE ON "Project" TO nova_admin;
GRANT SELECT, INSERT ON "InternalNote", "ActivityLog" TO nova_admin;
GRANT SELECT ON "AdminUser" TO nova_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_user, auth_session,
  auth_account, auth_verification, auth_two_factor, "AuthRateBucket" TO nova_admin;

GRANT SELECT, UPDATE ON "OutboxEvent" TO nova_worker;
```

Accorder CONNECT sur la base et attribuer chaque rôle à un utilisateur LOGIN dont le mot de passe est généré et conservé hors Git. Ne pas accorder au site les tables auth, notes, historique ou projets. Le rôle administration ne peut pas modifier emailVerifiedAt et ne lit pas les jetons prospects ou contenus d’outbox. L’historique est SELECT/INSERT uniquement pour le runtime. Les UUID sont générés par Prisma/Better Auth ; aucune séquence n’est utilisée.

Le compte opérateur, distinct des trois runtimes, gère migrations et création/récupération des administrateurs. Vérifier les droits hérités, les droits PUBLIC et le propriétaire des tables ; ne jamais donner aux utilisateurs d’exécution des droits de création/modification du schéma. Les commandes SQL sont des instructions à adapter, non appliquées automatiquement.

## Variables par service

**Site et worker :** les variables existantes de `apps/website/.env.example` : DATABASE_URL, pool/TLS, NEXT_PUBLIC_SITE_URL (origine du site), Resend, clé d’outbox et Redis. Le worker charge cet emplacement en local et les variables injectées par Railway en production. Il doit rester actif ; sans lui les e-mails sont enregistrés mais ne partent pas.

Le worker peut utiliser `WORKER_DATABASE_URL` pour son identité dédiée. Si cette variable est absente, il utilise DATABASE_URL du service worker. Ne pas lui fournir les identifiants opérateur.

**Administration :** `apps/admin/.env.example` : DATABASE_URL avec son utilisateur distinct, pool/TLS, BETTER_AUTH_URL (origine administrative HTTPS), BETTER_AUTH_SECRET, NEXT_SERVER_ACTIONS_ENCRYPTION_KEY stable entre instances, et l’en-tête IP du proxy seulement après vérification de sa garantie. Aucun secret Resend, aucune clé d’outbox ni clé Stripe/Vercel n’est nécessaire pour cette première version.

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

Ne pas utiliser `db push`, `migrate reset` ou une migration destructive en production. Aucune migration n’est lancée au démarrage des services. Une base non migrée doit être corrigée avant l’ouverture ; l’application ne masque pas la panne avec de faux résultats.

Les builds ont besoin d’accéder aux polices Google déjà utilisées par le site et reprises dans l’administration. Ils génèrent Prisma mais ne se connectent pas à la base pour lire les demandes.

## Sauvegarde et restauration

Le module échanges, devis et paiements nécessite aussi les deux migrations commerciales, leurs privilèges et les variables Resend/Stripe décrites dans [relation-client.md](relation-client.md). Sauvegarder sa clé `COMMERCIAL_ENCRYPTION_KEY` et inclure ses tables dans les sauvegardes.

Conserver la stratégie décrite dans [railway-postgresql.md](railway-postgresql.md), en incluant maintenant les tables d’authentification, projets, notes et historique. Sauvegarder séparément BETTER_AUTH_SECRET et OUTBOX_ENCRYPTION_KEY ; la base seule ne permet pas de récupérer les secrets chiffrés.

Restaurer d’abord dans une base distincte, réappliquer les rôles et vérifier les migrations, relations et compteurs. Après restauration, révoquer les sessions administrateur restaurées avant ouverture. Réconcilier l’outbox avec Resend avant de redémarrer le worker pour éviter un renvoi déjà accepté. Aucun test de restauration sur votre base Railway réelle n’a été effectué ici.
