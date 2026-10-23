# Zelyweb : suivi après paiement

Le paiement de création est confirmé uniquement par le webhook Stripe signé. Le worker envoie trois e-mails distincts : confirmation du paiement, première série de retours, choix du domaine. Les marqueurs transactionnels empêchent les doublons en cas de nouvelle livraison du webhook.

## Retours

Le client transmet une série regroupée dans le portail privé, avec trois fichiers maximum de 5 Mo. La série est verrouillée dès son envoi. Il reçoit la version corrigée lorsque Guillaume renseigne son URL et confirme « Terminer la série et envoyer la version corrigée » dans l’admin. Cette action clôture la série, incrémente la version et prépare l’e-mail suivant dans une seule transaction.

Chaque nouvelle version peut être validée immédiatement. Trois séries sont incluses pendant les trente jours suivant le paiement. Après la troisième, les nouvelles demandes passent par le formulaire de demande de devis. Une soumission issue d’une ancienne version est refusée ; rejouer une soumission déjà enregistrée ne crée ni série ni notification supplémentaire.

Les notifications à Guillaume contiennent l’entreprise, le client, le numéro de série, un résumé et un lien vers la fiche privée. Les détails et fichiers restent dans le dossier.

## Réponses e-mail

Les e-mails de retours utilisent une adresse de réponse contenant un jeton privé et le numéro de version. Les e-mails de domaine utilisent une adresse distincte. Le webhook Resend vérifie sa signature avant de récupérer le message et de le rattacher au dossier.

Une réponse à l’invitation courante peut soumettre une série si aucune série n’attend de corrections. Les réponses reçues pendant les corrections, après validation ou depuis une ancienne invitation sont archivées sans ouvrir de série. Une adresse d’expéditeur différente est signalée pour vérification ; un e-mail ne peut jamais valider le site ni accepter un tarif.

Les pièces jointes sont archivées chiffrées dans la limite de 8 Mo par fichier et 16 Mo par message. Les métadonnées des autres fichiers sont conservées avec une alerte et un lien de récupération via Resend. Il faut les récupérer avant l’expiration de la conservation chez le fournisseur. L’archive interne n’est pas exposée au portail client.

Variables de l’admin :

- `COMMERCIAL_REPLY_DOMAIN` : domaine ou sous-domaine de réception configuré chez Resend, avec ses enregistrements DNS de réception. Ne pas remplacer les MX d’une boîte mail existante.
- `RESEND_RECEIVING_API_KEY` : clé autorisée à lire les e-mails entrants et leurs pièces jointes. À défaut, le code utilise `RESEND_API_KEY`, qui doit disposer de ces droits. Une clé limitée à l’envoi ne suffit pas.
- `RESEND_WEBHOOK_SECRET` : signature du webhook `/api/webhooks/resend`, abonné notamment à `email.received`.

La clé d’envoi du worker peut rester limitée à l’envoi. Ne jamais mettre une clé de réception sur le site public. Les réponses à d’anciens e-mails dont le Reply-To est `contact@zelyweb.com` continuent à arriver dans cette boîte : elles peuvent être consignées manuellement dans l’admin.

## Domaine indépendant

Le lien de l’e-mail ouvre l’onglet domaine du portail. Le client recherche chez OVH, transmet son choix ou indique un domaine déjà possédé. Son choix ne réserve rien et aucun achat automatique n’est effectué.

Guillaume vérifie disponibilité, tarif initial et tarif de renouvellement ; il peut envoyer jusqu’à trois propositions depuis l’interface. Le plafond inclus est de 20 € HT/an pour l’achat et le renouvellement. Les suppléments initial et annuel sont affichés séparément et acceptés par le client. Un devis du supplément initial doit être payé avant de confirmer la réservation. La réservation et la configuration sont deux étapes distinctes.

L’admin permet de renvoyer l’invitation domaine, d’envoyer une confirmation de réservation et d’envoyer un message libre propre au domaine. Ces actions n’affectent pas les séries de corrections.

Le renouvellement reste manuel : l’admin permet de renseigner le nouveau tarif lorsque le fournisseur le modifie. Le client reçoit alors un e-mail demandant son nouvel accord. Propositions et accords sont conservés dans l’historique. Aucun supplément n’est prélevé automatiquement ; son règlement séparé et l’opération fournisseur restent à effectuer avant l’échéance. Un tarif inchangé ne déclenche pas cet e-mail de changement.

## Mise en service

Déployer la migration `20261023150000_zelyweb_reviews_domains` depuis le service migrations propriétaire avant le démarrage de l’admin. Elle ajoute les archives d’e-mails, la version des séries et l’historique de renouvellement, puis étend uniquement les droits du runtime admin existant. Les rôles publics ne reçoivent aucun accès à ces archives.

Tester une commande Stripe de test, vérifier les trois e-mails, répondre à l’invitation et vérifier le dossier et les fichiers avant toute activation réelle. L’abonnement Zelyweb reste activé séparément par le client après validation finale et choix du domaine.
