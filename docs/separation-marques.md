# Deux espaces dans une administration

Choix validés : une administration et un compte opérateur communs ; un espace Zelyweb et un espace Tadapo ; dossiers indépendants même lorsque l'adresse e-mail est identique ; identité légale commune Guillaume Ribeau EI. Les liens clients Zelyweb conservent l'origine Railway actuelle. Les liens Tadapo restent sur tadapo.com.

## Utilisation

Dans la barre latérale, choisir la marque active puis « Ouvrir cet espace ». Le tableau de bord, les demandes, projets, clients, échanges, devis, paiements, e-mails et modèles sont limités à cet espace. Un lien vers un dossier de l'autre espace ne donne pas accès à sa fiche depuis l'espace courant : sélectionner d'abord la marque correspondante. Le compte administrateur reste autorisé à gérer les deux marques ; ce filtre n'est pas un système de permissions pour deux équipes indépendantes.

Les paramètres commerciaux et compteurs des devis sont distincts : `main` pour Zelyweb, `tadapo` pour Tadapo. Les nouveaux devis ont un préfixe DV ou TD. Le client n'a aucun accès à l'administration. Ses accès privés sont limités au dossier de sa marque et au jeton reçu par e-mail, avec des cookies propres à chaque marque. Le paiement d'une commande ne vaut pas vérification de propriété de l'adresse e-mail ; les échanges envoyés manuellement à l'adresse d'une commande Tadapo payée restent possibles sans modifier cet indicateur.

## Devis, messages et paiement

La marque est déterminée depuis le dossier enregistré côté serveur. Elle n'est pas choisie librement dans le formulaire de paiement du client. Elle fixe les coordonnées du vendeur, les conditions par défaut, le logo/lettrage, la couleur, les liens, l'expéditeur et le compte Stripe. Les instantanés des devis envoyés conservent leur marque. Les contenus générés ou envoyés mentionnant l'autre marque sont refusés. Le worker contrôle aussi les messages chiffrés avant un envoi réel.

Les devis Zelyweb utilisent le logo PNG existant. Tadapo utilise son lettrage `tadapo.` orange. Les PDF, les e-mails de devis et de relance et le portail sont cohérents avec cette identité. Les coordonnées légales communes restent présentes.

Le webhook Stripe Zelyweb traite uniquement ses paiements. Le webhook Tadapo traite ses abonnements, suppléments de domaine et devis complémentaires. Les événements de factures complémentaires Tadapo sont archivés dans le bon dossier. Les deux signatures sont indépendantes. Le compte Stripe de chaque marque doit encore recevoir son logo, ses coordonnées commerciales, ses réglages de facturation et son libellé bancaire : le code ne modifie pas ces réglages externes.

## Déploiement

1. Appliquer la migration `20261028120000_brand_templates` par le service migrations. Elle ajoute la marque aux modèles et aux e-mails, rattache les factures/événements aux devis, et attribue les e-mails déjà enregistrés à la marque de leur dossier. Elle ne supprime aucune donnée.
2. Dans l'admin, renseigner les clés et webhooks propres à chaque marque suivant [le guide Stripe](stripe-deux-marques.md). Renseigner `TADAPO_CONTACT_EMAIL=contact@tadapo.com` et un `TADAPO_FROM_EMAIL` autorisé chez Resend. Pour les réponses automatiques, configurer un sous-domaine de réception Tadapo et `TADAPO_REPLY_DOMAIN` ; sinon les réponses arrivent directement à la boîte Tadapo.
3. Dans le service Tadapo, définir `TADAPO_ADMIN_API_URL` avec l'origine HTTPS du service admin (`https://admin-production-1a67.up.railway.app` actuellement). Ce relais serveur expose seulement les routes privées de devis Tadapo, avec leur vérification de jeton et de marque ; il ne relaie pas l'administration ni les routes Zelyweb. Il permet au navigateur de rester sur tadapo.com.
4. Déployer l'admin, Tadapo et le worker après la migration. Recompiler Tadapo après un changement de destination du relais. Garder les commandes réelles fermées jusqu'à une recette test complète des deux comptes Stripe et des domaines e-mail.
5. Les anciennes données sont uniquement des tests selon le propriétaire. Elles ne sont pas purgées automatiquement. Les anciens devis Tadapo sans marque explicite dans leur instantané sont refusés par le portail ; recréer un dossier de test avec cette version. Les jetons/cookies clients ont changé de nom et nécessitent de rouvrir le lien reçu par e-mail. Ne pas réécrire un vrai contrat signé pour modifier sa marque.

Les changements de cette livraison sont locaux. Aucune suppression de données, publication, configuration de compte Stripe ou modification DNS n'est effectuée par ce guide.

## Vérifications reproductibles

- `npm test`, `npm run typecheck`, `npm run lint`.
- `npm run test:integration` : PostgreSQL temporaire, même e-mail dans les deux espaces, refus des accès et actions croisés, modèles séparés, expéditeur et liens Tadapo, paiement du devis par la clé et le webhook Tadapo.
- `npm run test:integration -- --brands-ui` : sélection d'espace dans Chrome, listes indépendantes et portail Tadapo via le relais, desktop et mobile.
- `npx tsx scripts/preview-brand-quotes.ts` : PDF de contrôle fictifs dans `reports/brand-quotes`.

Les fournisseurs sont simulés dans les tests d'intégration ; aucun paiement réel n'est déclenché.

## Correctifs de dépendances de cette livraison

Next.js et ses outils sont alignés en 16.4.3 sur les trois applications. Le fichier lock inclut les versions corrigées de Zod et fast-uri. L’audit npm après installation propre ne signale aucune vulnérabilité.
