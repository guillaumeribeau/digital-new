# Stripe : Zelyweb et Tadapo

Une connexion Stripe, deux comptes marchands distincts, exploités par Guillaume Ribeau EI avec le même SIRET et le même compte bancaire. L'administration et la base restent communes ; les clients disposent de parcours propres à leur marque.

## Configuration par service Railway

| Variable | Admin | Service public Tadapo |
| --- | --- | --- |
| `ZELYWEB_STRIPE_SECRET_KEY` | Compte Zelyweb existant | Inutile |
| `ZELYWEB_STRIPE_WEBHOOK_SECRET` | Webhook Zelyweb existant | Inutile |
| `TADAPO_STRIPE_SECRET_KEY` | Clé du compte Tadapo à renseigner ici | Référence `${{admin.TADAPO_STRIPE_SECRET_KEY}}`, sans seconde saisie |
| `TADAPO_STRIPE_WEBHOOK_SECRET` | Webhook Tadapo | Inutile |
| `TADAPO_CONTACT_EMAIL` | `contact@tadapo.com` | `contact@tadapo.com` |
| `TADAPO_FROM_EMAIL` | Expéditeur Tadapo vérifié chez Resend | Même expéditeur |
| `TADAPO_REPLY_DOMAIN` | Sous-domaine Tadapo vérifié, ou vide | Même valeur |

Conserver la configuration Zelyweb existante. Aucune clé Tadapo ne se rabat sur les clés Zelyweb. Sans clé Tadapo, les opérations financières Tadapo échouent sans utiliser le compte Zelyweb. Le worker envoie les expéditeurs et adresses de réponse contenus dans les messages chiffrés ; il n'a pas besoin des clés Stripe.

### Noms explicites et transition

Dans Railway, renseigner les quatre variables Stripe dans le service **admin** : les deux préfixées `ZELYWEB_` pour le compte Zelyweb, et les deux préfixées `TADAPO_` pour le compte Tadapo. Une clé API commence par `sk_test_` ou `sk_live_` ; un secret de webhook commence par `whsec_`. Le secret de webhook vient de la destination de la même marque et du même environnement que la clé API.

Les anciennes variables `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` de l'admin sont conservées pendant la transition. Les nouveaux champs Zelyweb peuvent les référencer (`${{admin.STRIPE_SECRET_KEY}}` et `${{admin.STRIPE_WEBHOOK_SECRET}}`) pour préserver leurs valeurs sans copier ni afficher les secrets. Les remplacer directement par les clés Zelyweb souhaitées lorsque nécessaire. Le code donne priorité aux noms explicites ; les anciens noms restent un secours Zelyweb uniquement si les nouveaux sont absents. Une nouvelle variable explicitement vide ne reprend pas une ancienne clé.

Les variables ajoutées avec `skipDeploys` sont visibles dans Railway mais nécessitent un déploiement pour être injectées dans les conteneurs. L'ancien `STRIPE_SECRET_KEY` du service public Tadapo reste historique jusqu'au déploiement du nouveau code ; le nouveau code l'ignore entièrement. La page Santé de l'admin affiche les noms propres à chaque marque sans leurs valeurs.

Les réponses Tadapo utilisent directement `contact@tadapo.com` lorsque `TADAPO_REPLY_DOMAIN` est vide. Pour les rattacher automatiquement au dossier, configurer un sous-domaine comme `reponses.tadapo.com` en réception chez Resend, puis renseigner la variable sur les deux services. Ne pas reprendre `reponses.zelyweb.com`. Conserver les MX de la boîte principale. Le webhook Resend existant dans l'admin peut traiter les deux marques.

## Webhooks Stripe

Créer une destination Snapshot depuis chaque compte marchand, pour les événements de `apps/admin/lib/stripe-events.ts`.

| Compte | URL de destination | Secret dans l'admin |
| --- | --- | --- |
| Zelyweb | `https://admin-production-1a67.up.railway.app/api/webhooks/stripe` | `ZELYWEB_STRIPE_WEBHOOK_SECRET` |
| Tadapo | `https://admin-production-1a67.up.railway.app/api/webhooks/stripe/tadapo` | `TADAPO_STRIPE_WEBHOOK_SECRET` |

Chaque route vérifie exclusivement la signature de sa marque et ne traite que ses dossiers. Le domaine technique de réception n'est pas un portail client. Commencer dans l'environnement de test de chaque compte. Les destinations et secrets réels sont distincts des destinations et secrets de test.

## Réglages à effectuer dans Stripe

Depuis le sélecteur de comptes, créer le compte marchand Tadapo sous la connexion existante. Déclarer la même entreprise et le même SIRET ; conserver l'identité légale exacte, puis définir les informations commerciales de la marque.

Dans chaque compte, régler séparément le nom public, le site (`zelyweb.com` ou `tadapo.com`), le logo, les couleurs, le contact d'assistance, le libellé bancaire reconnaissable, les informations légales et fiscales des factures, les reçus et les notifications d'abonnement. Le code utilise le compte propre à la marque pour Checkout, les factures et le portail de facturation. Les produits et tarifs sont générés par les parcours existants ; aucune création manuelle du catalogue n'est nécessaire.

Ne pas placer « Zelyweb » dans les coordonnées commerciales du compte Tadapo, ni inversement. La séparation visuelle dépend aussi de ces réglages Stripe : elle ne peut pas être garantie par les variables de l'application seules. L'identité légale commune reste visible sur les documents qui la nécessitent.

## Recette et mise en service

1. Vérifier une commande test complète sur chaque marque : Checkout, signature du webhook, dossier dans l'admin, e-mail, facture et portail. Vérifier aussi un refus de paiement et une résiliation. Contrôler visuellement l'absence de l'autre marque dans les documents et communications Stripe.
2. Vérifier les e-mails Tadapo, y compris le From, le Reply-To, les liens et les conditions jointes. Les messages déjà enregistrés ne sont pas réécrits ; vérifier les anciennes files de test avant de les renvoyer.
3. Renseigner les clés et secrets réels de chaque compte sur les services concernés, puis redéployer. Garder `TADAPO_ORDERING_ENABLED=false` jusqu'à la fin de la recette et à l'ouverture souhaitée. Cette préparation ne modifie pas Railway et ne crée pas le compte Stripe.
4. Créer de nouveaux dossiers réels. Les commandes et clients Stripe de test ne se convertissent pas en commandes réelles. Aucun abonnement réel existant n'a été déclaré lors de cette préparation.

La nouvelle archive des conditions Tadapo est `tadapo-terms-v6-2026-10-28.json`. Les archives précédentes et instantanés des contrats déjà enregistrés sont conservés.

## Vérification locale

`npm test` vérifie notamment le refus des signatures croisées et l'absence de repli Tadapo vers les clés ou le domaine de réponse Zelyweb. `npm run test:integration` exerce le parcours Tadapo et son webhook dédié avec PostgreSQL temporaire et fournisseurs simulés. Ces tests ne configurent aucun compte fournisseur réel.
