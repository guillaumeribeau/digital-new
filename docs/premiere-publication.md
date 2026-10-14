# Première publication GitHub → Railway

## État et portée

Le dossier est préparé comme dépôt Git, branche `main`. Les fichiers `.env.local`, clés, sauvegardes, dépendances, builds et rapports sont exclus. Le code et les migrations peuvent être publiés dans un dépôt **privé** `digital-new`. La base locale et les comptes locaux ne sont pas transférés avec Git.

Cette première publication sert à consulter le site et l’administration sur des domaines Railway. Les fonctions dépendant de Resend, Stripe et Turnstile seront activées après configuration réelle. Ne pas utiliser les modes locaux sur les URL publiques.

## GitHub

Créer un dépôt privé vide, sans README ni licence supplémentaires. Depuis GitHub Desktop, ajouter ce dossier existant et utiliser « Publish repository » en gardant l’option privée. Autre possibilité, une fois le dépôt vide créé :

```powershell
git remote add origin https://github.com/VOTRE-COMPTE/digital-new.git
git push -u origin main
```

Utiliser la connexion GitHub dans le navigateur ou le gestionnaire d’identifiants Git ; ne pas mettre de jeton dans l’URL ou les fichiers. Le premier commit local est préparé par l’assistant après vérification des exclusions.

## Services Railway

Créer un projet de préproduction, puis un PostgreSQL neuf. Ajouter deux services depuis le même dépôt GitHub, avec la racine du dépôt comme Root Directory. Choisir ces chemins dans Settings → Railway Config File :

| Service | Configuration | Domaine public |
| --- | --- | --- |
| Site vitrine | `/railway.website.toml` | Générer un domaine Railway |
| Administration | `/railway.admin.toml` | Générer un domaine Railway distinct |
| Worker e-mails | `/railway.worker.toml` | Aucun ; ajouter au moment de configurer Resend |

Les configurations utilisent Railpack et Node 22. Les commandes de démarrage écoutent sur `0.0.0.0` et Next utilise le `PORT` fourni par Railway. Les contrôles HTTP vérifient `/` et `/connexion` ; le contrôle de connexion à PostgreSQL est une étape supplémentaire.

## Base et administrateur

Appliquer les quatre migrations avec `npm run db:migrate:deploy` dans un contexte opérateur Railway utilisant la connexion propriétaire. Créer ensuite trois utilisateurs d’exécution distincts : site, admin et worker. Appliquer les permissions du [guide monorepo](railway-monorepo.md), puis les permissions commerciales de `scripts/commercial-permissions.ts`. Vérifier que les runtimes ne peuvent pas modifier le schéma ni lire les tables privées d’un autre service.

Fournir aux services uniquement leurs URL privées restreintes. Ne pas recopier la connexion locale `127.0.0.1`, et ne pas laisser la connexion propriétaire dans les applications. Créer un nouveau compte avec `npm run admin:create` depuis le contexte opérateur connecté à la **base Railway**. Le compte local n’existe pas automatiquement dans cette base. Retirer les accès opérateur temporaires après configuration.

## Variables pour la première publication

**Administration :**

- `DATABASE_URL` : connexion privée avec le rôle admin restreint.
- `DATABASE_POOL_MAX=3`.
- `BETTER_AUTH_URL` : origine exacte HTTPS du domaine admin généré.
- `BETTER_AUTH_SECRET` : nouvelle valeur aléatoire stable d’au moins 32 caractères.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` : nouvelle clé stable de 32 octets en base64.
- `COMMERCIAL_PUBLIC_URL` : même origine que l’admin.
- `COMMERCIAL_ENCRYPTION_KEY` : nouvelle clé stable de 32 octets en base64, à partager avec le futur worker.
- Laisser `COMMERCIAL_MODE`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` et `RESEND_WEBHOOK_SECRET` vides tant que ces services ne sont pas configurés.

**Site :**

- `DATABASE_URL` : connexion privée avec le rôle site restreint.
- `DATABASE_POOL_MAX=3`.
- Laisser `NEXT_PUBLIC_SITE_URL` vide pour cette prépublication : le site reste sans indexation dans sa configuration actuelle.
- Laisser `LEAD_EMAIL_MODE` vide. Ne pas transférer `LOCAL_EMAIL_PREVIEW_TOKEN`.
- Laisser Resend/Turnstile non configurés : le formulaire reste indisponible et doit l’annoncer sans enregistrer une fausse réussite.

Les clés sont à générer et conserver dans Railway, jamais dans GitHub ou le chat. Les services nécessitent `NODE_ENV=production` (fourni par Railpack).

## Activation ultérieure des formulaires et paiements

Pour activer le formulaire public, configurer l’origine du site, Resend, l’expéditeur, le destinataire interne, `OUTBOX_ENCRYPTION_KEY`, Turnstile avec le domaine Railway autorisé, puis le worker. Le limiteur public actuel nécessite une API Redis compatible Upstash en production ; PostgreSQL pourrait le remplacer dans une évolution, mais ce remplacement n’est pas réalisé ici. Si aucun service supplémentaire n’est souhaité, conserver le formulaire désactivé jusqu’à cette évolution.

Configurer les échanges et paiements suivant [relation-client.md](relation-client.md), en commençant avec Stripe test. Configurer les mentions légales avant d’ouvrir le service aux clients et d’activer l’indexation. Un site public sans indexation reste accessible par son URL.

## Vérifier la publication

1. Build et déploiement des deux services réussis.
2. Site et page de connexion disponibles en HTTPS, affichage correct sur mobile.
3. Accès anonyme aux clients, projets et devis administrateur refusé.
4. Connexion avec le compte créé sur Railway, listes vides sur la base neuve.
5. Formulaire non configuré affichant une indisponibilité explicite.
6. Aucune simulation locale ou clé de paiement réel disponible sur le domaine public.

Documentation officielle : [monorepos Railway](https://docs.railway.com/deployments/monorepo), [configuration par fichier](https://docs.railway.com/config-as-code/reference), [Node.js Railpack](https://railpack.com/languages/node).
