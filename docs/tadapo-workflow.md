# Parcours Tadapo après paiement

L’abonnement conserve ses quatre tarifs et démarre à la commande, avec renouvellement mensuel à cette date. Aucun second démarrage d’abonnement après validation du site. Les paiements réels restent fermés tant que `TADAPO_ORDERING_ENABLED` n’est pas explicitement activé avec les clés de production.

## Livraison et retours

Après vérification du paiement Stripe, le client reçoit deux e-mails distincts : confirmation avec les conditions acceptées, puis choix du domaine. L’admin reçoit le résumé de la commande payée. Le questionnaire complet reste conservé dans le dossier.

Dans **Réalisation Tadapo**, confirmer le dossier complet puis renseigner le lien et envoyer la première version. Cette action ouvre les retours et démarre les 30 jours. Trois séries regroupées sont incluses. Chaque série peut être envoyée une seule fois ; les doubles clics et soumissions concurrentes ne créent pas de série supplémentaire. Le client attend la version corrigée. L’admin reçoit un résumé par e-mail ; le message complet reste dans le dossier.

Le bouton **Envoyer la version corrigée et son e-mail** ferme la série reçue, met à jour le lien et ouvre la suivante dans la même transaction. Après la troisième, le client peut valider ou demander un devis supplémentaire. La validation peut intervenir plus tôt. Les demandes hors délai sont orientées vers un devis, tandis que la validation de la version disponible reste possible. La date limite n’est jamais réinitialisée lors d’une correction ou d’un renvoi.

## Domaine

Un domaine est inclus jusqu’à 20 € HT/an, à l’achat et au renouvellement, pour Essentiel et Business. Le client peut proposer un nom disponible chez OVH depuis son suivi, indépendamment des corrections. Aucun achat automatique.

L’admin vérifie les tarifs initiaux et annuels et envoie la proposition. Le suivi affiche le devis complémentaire éventuel, son acceptation et le paiement séparé du supplément initial. L’achat est bloqué sans accord et, si nécessaire, sans confirmation du paiement. Le bouton de confirmation d’achat envoie **Votre nom de domaine est réservé**. Le raccordement est confirmé séparément.

Une hausse de renouvellement produit une proposition datée, un e-mail au client et un nouvel accord explicite, conservé dans l’historique. L’admin est averti de l’accord et facture le supplément séparément avant renouvellement. Aucun supplément récurrent automatique. Les accords et prix déjà acceptés ne sont pas réécrits lors de la mise à jour de l’offre.

## Modifications après publication

Formulaire distinct et historique : **1 modification par mois en Essentiel, 3 en Business**, sans mention de durée. Une demande correspond à une modification. La période suit l’anniversaire mensuel de la commande, y compris les fins de mois ; les demandes non utilisées ne sont pas reportées. Une demande terminée ne libère pas un nouveau crédit dans la même période.

Chaque demande prévient l’admin avec un résumé et confirme sa réception au client. L’admin confirme sa réalisation et déclenche l’e-mail correspondant. Les nouvelles pages, fonctionnalités et demandes hors forfait suivent un devis complémentaire.

## E-mails et PostgreSQL

- Migration : `20261023180000_tadapo_workflow`. Le démarrage `npm run start:tadapo` attend la confirmation de toutes les migrations.
- `TADAPO_FROM_EMAIL` : adresse d’expédition vérifiée ; `TADAPO_CONTACT_EMAIL` : contact.
- `TADAPO_NOTIFICATION_EMAIL` : destinataire interne des résumés, par défaut `TADAPO_CONTACT_EMAIL`.
- `TADAPO_REPLY_DOMAIN` : sous-domaine Tadapo de réception vérifié chez Resend, identique sur Tadapo et l’admin. Aucun repli sur le domaine Zelyweb. Sans cette variable, les réponses arrivent directement à contact@tadapo.com sans rattachement automatique.
- `COMMERCIAL_ENCRYPTION_KEY` doit être identique dans les trois services. Conserver le webhook Resend de l’admin et sa clé de réception.

Les adresses de réponse identifient le dossier, le parcours et la version. Les réponses à une ancienne version, reçues pendant l’attente ou d’un expéditeur différent sont archivées et signalées sans ouvrir de série. Les pièces jointes sont archivées de façon chiffrée jusqu’à la limite de stockage du message ; tout fichier non archivé reste référencé avec une alerte de récupération dans Resend.

Les écritures du parcours et la mise en file des notifications partagent la même transaction. Le rôle public Tadapo peut ajouter des messages chiffrés à `TadapoMail` sans lire les e-mails commerciaux, les notifications internes ou les archives reçues. Le worker transfère les messages vers `CommercialEmail` sous verrou ; les identifiants stables empêchent les doublons. Il écarte les invitations devenues obsolètes et conserve les résumés admin. Les confirmations et invitations peuvent être renvoyées depuis l’admin.

Les contrats existants conservent leurs instantanés de conditions et d’offre. La nouvelle offre est `tadapo-v5-2026-10-23`, avec l’archive `tadapo-terms-v5-2026-10-23.json`. Les anciens messages restent visibles sans être artificiellement transformés en séries clôturées.
