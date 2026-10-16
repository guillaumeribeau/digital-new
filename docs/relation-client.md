# Échanges clients, devis et paiements

Le module est intégré à l’administration et à PostgreSQL. Resend assure les e-mails sortants et entrants ; Stripe assure le paiement. Les PDF sont générés dans l’application, sans service de devis supplémentaire.

## Utilisation

1. Ouvrir `/parametres/commercial` et vérifier votre entreprise, l’immatriculation, les mentions fiscales, les conditions et les délais. Les champs manquants reprennent les informations de Guillaume Ribeau EI / Zelyweb ; les valeurs enregistrées restent prioritaires. Le bouton « Reprendre les informations et conditions Zelyweb » permet de préremplir un formulaire existant, puis de l’enregistrer. Ajouter vos prestations et modèles de messages si souhaité.
2. Ouvrir `/clients`, puis une fiche client confirmé. Les échanges, devis et paiements sont regroupés dans cette fiche. `/echanges` présente les conversations et les réponses à traiter.
3. Écrire au client depuis sa fiche. Son bouton « Répondre » habituel dans son logiciel de messagerie utilise une adresse propre à la conversation ; les réponses apparaissent ensuite dans l’administration.
4. Créer un devis complémentaire : adresse de facturation, prestations, quantités, prix HT, TVA, délai et conditions. Vérifier le PDF, puis envoyer.
5. Le client reçoit le PDF et un lien privé vers le devis. Il peut demander une modification ou accepter explicitement le document, puis payer depuis cette même page.
6. L’administration suit le paiement confirmé. Après réalisation, marquer la prestation terminée. Le devis complémentaire ne modifie pas le projet initial.

Un devis envoyé est figé, y compris son émetteur et ses conditions. Pour le changer avant acceptation, créer une nouvelle version : l’ancien lien est révoqué. Un devis accepté ou payé ne se réécrit pas. L’acceptation conserve le nom, la date et l’empreinte du document ; ce mécanisme n’est pas présenté comme une signature électronique qualifiée.

Les montants sont en EUR, calculés en centimes côté serveur. Cette version prend en charge des quantités entières et un règlement intégral ; les acomptes et les remboursements ne sont pas pilotés par cette interface. Stripe génère les factures des paiements par carte ; renseigner les informations légales et fiscales du compte Stripe avant utilisation réelle.

## Informations Zelyweb et offre publiée

`packages/shared/business.ts` contient les coordonnées publiques, les conditions de l’offre et les valeurs par défaut utilisées par le site et l’administration. Les nouvelles lignes de devis et de catalogue proposent une TVA de 20 % ; les lignes existantes et les instantanés des devis envoyés sont conservés. Les PDF incorporent le logo local `packages/commercial/assets/zelyweb-logo.png`, inclus dans les traces de déploiement avec la police, sans téléchargement externe à la génération.

L’offre de cinq pages et ses conditions sont accessibles sur `/conditions-generales` : création 299 € HT / 358,80 € TTC ; abonnement obligatoire à activer par le client avant publication 29 € HT / 34,80 € TTC, sans durée minimale ; domaine jusqu’à 20 € HT/an ; trois séries de retours sous 30 jours ; une modification de 15 minutes maximum par mois ; remise gratuite des fichiers et du code de transfert ; migration facultative à 150 € HT / 180 € TTC vers un environnement compatible. Le parcours de paiement et les invitations sont décrits ci-dessous.

Téléphone professionnel et médiateur de la consommation restent à compléter. Ne pas déclarer d’adhésion fictive. Avant les contrats consommateurs, finaliser ces coordonnées et remettre les informations contractuelles ; une exécution anticipée exige une demande expresse distincte, aucune renonciation automatique n’est ajoutée au portail. Les régions de traitement et garanties internationales des fournisseurs restent à vérifier dans les comptes utilisés.

Les durées de conservation sont une politique **manuelle** : demandes non confirmées 30 jours, demandes sans suite 12 mois après le dernier échange, copie du site 30 jours après la fin du service. Aucune purge automatique ni migration de base n’est ajoutée. La corbeille n’est pas une suppression définitive. Appliquer les échéances aux données et copies concernées en préservant les archives soumises à une obligation légale distincte.

Sources vérifiées le 15 octobre 2026 : [mentions obligatoires](https://entreprendre.service-public.gouv.fr/vosdroits/F37351), [vente à distance et rétractation](https://entreprendre.service-public.gouv.fr/vosdroits/F23455), [médiation de la consommation](https://www.economie.gouv.fr/mediation-conso/vous-etes-un-professionnel/vos-principales-obligations-0), [coordonnées Railway](https://railway.com/legal/terms) et [traitements Railway](https://railway.com/legal/dpa).

## Essai local prêt à l’emploi

La base locale `nova` a reçu les migrations commerciales et les permissions nécessaires. Les applications ont un mode local partagé : e-mails conservés dans la boîte de test et paiement explicitement simulé, sans débit bancaire.

```powershell
npm run dev
# Dans un autre terminal
npm run dev:admin
```

Ouvrir `http://localhost:3001/parametres/commercial`. La boîte de test commerciale est accessible via son bouton, ou `/emails-locaux`, après connexion administrateur. Ouvrir le lien du devis dans une fenêtre privée pour essayer le parcours client. La fiche client permet aussi de simuler une réponse locale.

La boîte `/emails-locaux` concerne ce module ; `npm run emails:local` reste la boîte de confirmation du formulaire public. Une demande du site doit être confirmée avant l’envoi de messages ou de devis.

Sur une nouvelle installation locale déjà configurée avec `db:setup:local`, exécuter `npm run commercial:setup:local`. Cette commande migre uniquement la base locale attendue, applique les rôles restreints et prépare les variables partagées sans effacer les données ni remplacer une clé existante. Redémarrer les deux applications après une modification des variables.

## Chat visiteurs Crisp

La bulle Crisp est intégrée au layout commercial du site avec l’identifiant public `dd23e69b-7b5d-4e66-bb46-50da9ce26e4c`, en français. Aucune variable Railway ni clé secrète n’est nécessaire. Le chargeur officiel est ajouté une seule fois après hydratation ; les navigations conservent la conversation. Les pages de démonstration et l’administration n’intègrent pas le widget ; la page `/confirmer-demande` n’initialise pas le chat afin de ne pas exposer ses liens privés. La bulle est masquée lorsqu’on quitte son périmètre.

La bulle est immédiatement visible ; la fenêtre s’ouvre après cinq secondes une fois le SDK prêt. Un message d’accueil local est affiché avec `message:show`, sans envoyer de message à la place du visiteur. Si Crisp indique l’équipe absente, le message invite à laisser une question et une adresse e-mail. L’ouverture automatique se produit une seule fois par session de navigation (`sessionStorage`), y compris après rechargement ; une ouverture manuelle annule également la sollicitation automatique. Les conversations déjà en cours ne reçoivent pas de nouvel accueil. Le minuteur est annulé lorsqu’on quitte le périmètre du chat. Si le stockage est bloqué, un état en mémoire évite les répétitions pendant la navigation dans l’application.

Répondre depuis [la boîte de réception Crisp](https://app.crisp.chat/) ou son application mobile. Dans les paramètres du workspace Crisp, vérifier le domaine `zelyweb.com`, le profil opérateur, les notifications, la disponibilité, le logo et les couleurs. Les échanges du chat restent dans Crisp, séparés des e-mails et dossiers PostgreSQL ; aucun contenu du formulaire n’est envoyé automatiquement au widget. Les délais manuels de conservation s’appliquent également aux discussions conservées dans Crisp.

La confidentialité et la page cookies décrivent le fournisseur et les cookies techniques du chat, indépendants du consentement à la mesure d’audience. Documentation : [installation Next.js](https://help.crisp.chat/en/article/how-to-install-crisp-chat-widget-on-nextjs-app-xh9yse/), [commandes du widget](https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/dollar-crisp/), [cookies](https://help.crisp.chat/en/article/crisp-cookie-policy-1147xor/).

## Configuration Resend en production

Dans le service administrateur :

| Variable | Valeur attendue |
| --- | --- |
| `COMMERCIAL_PUBLIC_URL` | Origine HTTPS réelle de l’administration, également utilisée par le portail client |
| `COMMERCIAL_MODE` | Vide en production |
| `COMMERCIAL_ENCRYPTION_KEY` | Clé stable de 32 octets en base64, commune avec le worker |
| `COMMERCIAL_FROM_EMAIL` | Adresse d’envoi d’un domaine vérifié dans Resend |
| `COMMERCIAL_REPLY_DOMAIN` | Domaine de réception Resend, sans `@`, protocole ou chemin |
| `RESEND_API_KEY` | Clé serveur permettant de lire les messages entrants et leurs pièces jointes |
| `RESEND_WEBHOOK_SECRET` | Secret de signature du webhook Resend |

Utiliser le sous-domaine de réception fourni par Resend ou un sous-domaine dédié comme `reponses.votre-domaine.fr`. Si vous utilisez un domaine personnalisé, configurer les MX de ce sous-domaine pour Resend, en conservant les MX de votre messagerie principale. Voir la [documentation officielle de réception Resend](https://resend.com/docs/dashboard/receiving/introduction).

Créer un webhook vers `https://VOTRE-ORIGINE-ADMIN/api/webhooks/resend`, pour `email.received`, `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained` et `email.failed`. Reporter son secret uniquement dans l’environnement serveur. Les signatures et doublons sont contrôlés. Une réponse provenant d’une autre adresse que celle du client est signalée comme expéditeur à vérifier. Les pièces jointes entrantes sont téléchargées par une route administrateur protégée, avec une limite de 8 Mo, sans affichage HTML actif. Voir les [webhooks Resend](https://resend.com/docs/webhooks/introduction).

## Configuration Stripe

Ajouter `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` au service administrateur. Commencer avec une clé `sk_test_`. Aucune clé Stripe n’est exposée au navigateur : le client est redirigé vers Stripe Checkout hébergé après acceptation.

Créer un webhook vers `https://VOTRE-ORIGINE-ADMIN/api/webhooks/stripe` pour :

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Le paiement n’est confirmé qu’après un événement signé cohérent avec la session, le montant, la devise, le devis et le mode test/réel. Le retour du navigateur ne constitue pas une preuve de paiement. Voir le [guide Stripe Checkout](https://docs.stripe.com/checkout/fulfillment).

Pour un essai Stripe réel en mode test sur localhost, utiliser la CLI Stripe avec `stripe listen --forward-to localhost:3001/api/webhooks/stripe`, puis son secret de signature local. Le mode commercial local autorise une clé de test mais refuse une clé réelle. Sans clé Stripe, il propose uniquement la simulation locale.

## Worker, migrations et sauvegardes

Le worker existant traite aussi les messages et devis commerciaux :

```powershell
npm run outbox:once
npm run outbox:watch
```

En production, fournir au worker `WORKER_DATABASE_URL`, `COMMERCIAL_PUBLIC_URL`, `COMMERCIAL_ENCRYPTION_KEY`, `COMMERCIAL_FROM_EMAIL`, `COMMERCIAL_REPLY_DOMAIN` et une `RESEND_API_KEY` autorisant l’envoi. Laisser `COMMERCIAL_MODE` vide. Le worker local conserve les messages sans les envoyer.

La file reprend les pannes avec tentatives limitées, bail et clé d’idempotence. Consulter les statuts d’envoi dans les fiches. Les relances automatiques sont désactivées par défaut ; un délai configuré prépare au maximum deux relances avant expiration. Les relances manuelles sont plafonnées à six au total et une relance déjà en attente n’est pas dupliquée. Le worker doit fonctionner pour les expéditions et les relances.

Les migrations additives `20261014120000_commercial` et `20261014123000_commercial_guards` sont appliquées en local. Pour Railway, sauvegarder, exécuter `npm run db:migrate:deploy` depuis une connexion opérateur autorisée, puis appliquer les privilèges commerciaux aux rôles administrateur et worker avec la fonction de `scripts/commercial-permissions.ts`. Ne pas donner la connexion opérateur aux services applicatifs. La migration seule ne confère pas les nouveaux droits aux rôles restreints.

Sauvegarder les nouvelles tables et la clé `COMMERCIAL_ENCRYPTION_KEY` séparément. Ne pas régénérer cette clé au redémarrage : elle protège notamment les liens privés et la file d’e-mails. Après restauration, réconcilier les paiements et envois avec les fournisseurs avant reprise du worker. Aucun déploiement Railway, envoi réel ou encaissement réel n’a été effectué par cette implémentation.

## Vérification

```powershell
npm test
npm run typecheck
npm run lint
npm run test:integration
npm run test:commercial-ui
npm run build:admin
```

Les intégrations utilisent un PostgreSQL temporaire distinct : droits restreints, authentification réelle, devis figés, PDF, révisions, liens privés, acceptation, simulation, signatures et doublons. Les appels Stripe/Resend sont simulés dans ces tests. Le test navigateur couvre le parcours complet et quatre largeurs, avec rapports sous `reports/commercial`. La livraison réelle et les paiements Stripe réels nécessitent un essai après configuration de vos comptes.

## Présentation du site, création et abonnement Stripe

Le bloc « Présentation et paiement du site » se trouve dans `/projets/[id]`. Le client doit avoir confirmé son adresse. Renseigner le lien HTTPS privé, le prix HT (299 € par défaut, TVA 20 %), le message et une capture PNG/JPEG/WebP. La capture est redimensionnée puis enregistrée en base ; elle ne dépend pas d’un disque Railway temporaire. L’aperçu de l’e-mail est obligatoire avant l’envoi. Toute modification exige une nouvelle prévisualisation. L’envoi fige le prix et le contenu, puis ajoute l’e-mail illustré à l’outbox existante (le worker doit tourner).

Le lien de paiement ouvre un portail privé sans compte. Son jeton aléatoire est stocké chiffré et sous forme d’empreinte, transmis dans le fragment de l’URL puis échangé contre un cookie HttpOnly de 30 jours. Conserver ce lien privé : il donne accès au suivi et au portail de facturation. Les pages sont noindex, sans analytics et avec `Referrer-Policy: no-referrer`. Le client accepte explicitement le prix, les CGV et l’enregistrement de la carte. L’abonnement obligatoire est annoncé, mais son activation et son premier paiement nécessitent ensuite une nouvelle action explicite du client. La création est réglée sur Stripe Checkout ; la notification signée est la preuve de paiement, pas la page de retour.

Après le paiement de création, une confirmation automatique est envoyée au client et une notification est adressée à `contact@zelyweb.com`. L’admin propose ensuite l’étape « Paiement reçu : demander les ajustements » : personnaliser les questions préremplies (textes, photos/logo, couleurs/présentation, coordonnées), prévisualiser l’e-mail puis l’envoyer. Il confirme le règlement, rappelle les trois séries de retours sous 30 jours et permet de répondre directement à `contact@zelyweb.com`. Cet e-mail est envoyé manuellement, une seule fois par dossier. Une modification du message exige une nouvelle prévisualisation. L’historique consigne son envoi ; l’outbox le remet au worker, ce n’est pas une preuve de livraison.

Après validation des ajustements, renseigner l’URL définitive HTTPS, confirmer que le site est prêt puis cliquer sur « Préparer l’e-mail de mise en ligne ». Vérifier le logo, le domaine, le prix et les conditions avant d’envoyer l’invitation. Aucun débit n’est déclenché par ces actions. Le client ouvre sa page privée, accepte explicitement les conditions et clique sur « Activer mon abonnement ». Stripe Checkout en mode abonnement encaisse le premier mois immédiatement (29 € HT + TVA 20 %, soit 34,80 € TTC), sans essai gratuit, puis renouvelle mensuellement. La session et la tentative sont réutilisées pour éviter plusieurs abonnements ; un abonnement déjà démarré ou une session complétée empêche une nouvelle activation même si le webhook tarde.

La publication reste bloquée tant que la création et le premier paiement mensuel ne sont pas confirmés par Stripe. La mise en ligne sur le domaine définitif est annoncée sous 2 jours ouvrés après ce premier paiement, si le domaine et ses accès sont prêts. Elle reste une opération manuelle. Le portail permet de régulariser une facture et de résilier à tout moment, avec arrêt à la fin de la période payée. Aucun redémarrage d’un abonnement résilié ni aucune suspension automatique du site.

Les notifications internes à `contact@zelyweb.com` couvrent la création payée, le premier mois confirmé, les échecs de paiement et la résiliation demandée/effective. Elles utilisent des marqueurs d’idempotence et un lien vers la fiche admin, sans jeton client. En test, leur sujet commence par `[TEST]`. Les impayés suivants créent aussi une alerte dans le tableau de bord, `/paiements` et le projet. Les confirmations et notifications sont remises au worker ; la livraison effective dépend de Resend et de sa configuration.

Le portail Stripe propose les factures, la mise à jour de carte et la résiliation en fin de période, sans prorata. Les factures de création et d’abonnement apparaissent dans le projet, celles des devis dans leur fiche. Les devis payés après la création utilisent le même client Stripe. Si une facture de devis est antérieure à la création du client Stripe, elle reste accessible dans la fiche du devis mais ne sera pas regroupée automatiquement dans le nouveau portail.

### Variables et webhook (service admin)

- `STRIPE_SECRET_KEY` : clé serveur de test `sk_test_…`, puis clé réelle `sk_live_…` après activation et recette. Ne jamais mettre cette clé dans Git ou dans une variable `NEXT_PUBLIC_`.
- `STRIPE_WEBHOOK_SECRET` : secret `whsec_…` propre au point de terminaison et au mode Stripe.
- `COMMERCIAL_PUBLIC_URL` : origine publique du service admin, utilisée pour les liens clients et les retours de paiement.
- `COMMERCIAL_FROM_EMAIL`, `COMMERCIAL_ENCRYPTION_KEY`, `RESEND_API_KEY` : à conserver dans l’admin et le worker pour les e-mails commerciaux. Le worker traite la même base et lance `npm run outbox:watch`.

Dans Stripe, ajouter un point de terminaison `${COMMERCIAL_PUBLIC_URL}/api/webhooks/stripe` pour les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`, `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Reporter son secret dans Railway. Configurer dans Stripe les coordonnées de facturation Zelyweb, TVA, logo, factures/reçus, e-mails d’échec et relances automatiques (Billing / récupération des revenus). Les retries bancaires sont gérés par Stripe, pas par un cron de débit maison. L’intégration ne configure pas ces réglages de compte à distance.

Avec le service de migrations automatiques configuré dans [railway-monorepo.md](railway-monorepo.md#migrations-automatiques--configuration-initiale-unique), la migration `20261016170000_site_billing` est appliquée automatiquement avant démarrage. En installation manuelle ou dépannage uniquement, utiliser un compte opérateur propriétaire de la base, pas le rôle runtime restreint :

```sh
cd /app
npm run db:migrate:deploy
```

La version contenant la migration doit être présente dans le service où la commande est exécutée. La migration initiale ajoute `SiteOrder` et `BillingInvoice` ; `20261016200000_subscription_checkout` ajoute les champs d’invitation, d’e-mail d’ajustements, de consentement et de session d’abonnement et donne les droits aux rôles `nova_admin` existants autorisés sur Project. Aucun droit nouveau n’est donné au site public. Ne pas utiliser `db push` ou `migrate reset`.

Tests : `npm run test:integration` pour la base temporaire et les notifications Stripe simulées, `npx tsx scripts/test-lead-pipeline.ts --billing-ui` pour le parcours navigateur et les aperçus d’e-mail (`reports/billing`). Les tests n’envoient aucun e-mail réel et ne débitent aucune carte. La connexion API de test ne remplace pas une recette Checkout + webhook dans l’environnement déployé. Ne pas mélanger des dossiers test et live : les confirmations doivent correspondre au mode Stripe du service.
