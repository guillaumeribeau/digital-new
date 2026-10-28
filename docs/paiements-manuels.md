# Suivi manuel des paiements

L’administration peut enregistrer un règlement après vérification dans Stripe ou sur le relevé bancaire. Les états proposés sont **Payé**, **En attente** et **Paiement échoué**. Ce suivi est disponible même sans webhook Stripe.

- **Zelyweb** : ouvrir le projet, puis « Suivi manuel du paiement de création ». Après l’invitation d’activation, un second panneau suit le règlement de l’abonnement.
- **Tadapo** : ouvrir « Commandes et abonnements ». Les commandes non payées sont visibles. La confirmation du premier règlement crée le dossier client et le projet ; les échéances suivantes sont suivies dans ce même panneau.
- **Devis complémentaires** : ouvrir le devis et son panneau de vérification. Le client doit avoir accepté le devis avant de le marquer payé. Une confirmation de règlement ne remplace jamais son accord.
- **Supplément de domaine Tadapo** : après l’accord du client, le règlement dispose de son propre panneau.

Pour un règlement reçu, renseigner la date. Pour un abonnement, renseigner aussi la prochaine échéance couverte par le paiement. Une référence et une note interne peuvent être ajoutées. Chaque enregistrement conserve l’administrateur, la date et les informations de contrôle dans un historique non modifiable. Les dossiers et historiques restent séparés par marque.

Les corrections ne modifient aucune opération Stripe : aucun débit, remboursement, abonnement ou facture n’est créé, et aucun e-mail n’est envoyé par cet enregistrement. Utiliser les actions d’envoi habituelles si un message est nécessaire. Les factures Stripe et leurs PDF ne sont pas générés par une confirmation manuelle.

Sans webhook, vérifier et renseigner manuellement chaque nouvel encaissement, incident de paiement et renouvellement. Une confirmation reste celle de l’administrateur ; elle ne constitue pas une synchronisation Stripe. Les clés API propres à chaque marque restent nécessaires pour proposer les paiements en ligne.

Les modes de test et de production existants sont conservés : un règlement de test ne devient pas un encaissement réel. Une saisie concurrente ou une page périmée est refusée. Un double envoi du même formulaire est traité une seule fois. Le premier règlement et l’engagement initial Tadapo restent dans l’historique lors d’un impayé ultérieur. Un impayé signale le dossier et bloque les contrôles de publication, sans suspendre automatiquement un site déjà publié.

Vérification : `npm run test:integration -- --manual-payments-ui` exerce les changements de statut, les corrections, les dossiers Tadapo avant paiement, la séparation des marques et les formulaires sur ordinateur et mobile.
