# Checklist de tests manuels — site et administration

Ce parcours permet de suivre un client test depuis sa demande sur le site jusqu’à la mise en ligne, puis de vérifier les échanges et les devis complémentaires.

Commencer en local, avec une adresse e-mail que vous contrôlez et des paiements en mode test. Utiliser deux fenêtres : une normale pour l’administration et une privée pour le client. La base de données et les variables locales doivent déjà être configurées.

Cette checklist décrit les vérifications à effectuer ; elle ne constitue pas un compte rendu de tests exécutés.

## 1. Démarrer les services

Dans trois terminaux distincts, depuis la racine du projet :

```powershell
npm run dev
```

```powershell
npm run dev:admin
```

```powershell
npm run outbox:watch
```

- Site : <http://localhost:3000>
- Administration : <http://localhost:3001>
- Le troisième terminal traite les e-mails en attente.

- [ ] Le site et l’administration sont accessibles.
- [ ] Le worker démarre sans erreur.

## 2. Vérifier le site public

Parcourir l’accueil, l’offre, les exemples, la FAQ et le formulaire sur ordinateur puis sur téléphone.

- [ ] Les liens, images, boutons de demande et le menu mobile fonctionnent.
- [ ] Les neuf témoignages sont accessibles.
- [ ] Le carrousel défile après six secondes lorsque la souris et le focus sont hors de la section.
- [ ] Les boutons précédent, suivant et pause fonctionnent.
- [ ] Le défilement revient au début après la dernière carte.
- [ ] La page ne déborde pas horizontalement.

Avec la préférence système « réduire les animations », le défilement automatique est désactivé ; la navigation manuelle reste disponible.

## 3. Envoyer une demande complète

Dans la fenêtre privée, remplir le formulaire avec une entreprise identifiable, par exemple **TEST — Atelier Martin**.

- [ ] Les champs obligatoires bloquent une étape incomplète.
- [ ] Le téléphone devient obligatoire pour un contact téléphonique.
- [ ] Le choix d’un exemple est conservé entre les étapes.
- [ ] Le récapitulatif correspond aux réponses saisies.
- [ ] Il est possible de revenir modifier les réponses.
- [ ] Les confirmations obligatoires sont nécessaires avant l’envoi.
- [ ] Une confirmation d’enregistrement apparaît après l’envoi.
- [ ] Une seule demande est créée dans l’administration.

## 4. Confirmer l’adresse e-mail

Dans l’administration, ouvrir **Demandes**, puis retrouver la demande test.

- [ ] La demande apparaît en attente de vérification.
- [ ] Les coordonnées, le choix de style et les réponses sont exacts.
- [ ] La qualification et la conversion sont bloquées avant confirmation.

En mode e-mails locaux, ouvrir la boîte de confirmation :

```powershell
npm run emails:local
```

Ouvrir le lien de confirmation reçu dans la fenêtre client.

- [ ] La confirmation réussit.
- [ ] La demande devient confirmée et peut être traitée dans l’administration.
- [ ] Recharger la page de confirmation ne crée pas de nouvelle demande.

## 5. Qualifier et convertir en projet

Retrouver la demande par la recherche, ajouter une note interne, qualifier la demande puis la convertir en projet.

- [ ] La recherche retrouve la bonne demande.
- [ ] La note est enregistrée avec son auteur et sa date.
- [ ] Un seul projet est créé.
- [ ] Les informations du client sont conservées.
- [ ] Les actions apparaissent dans l’historique.
- [ ] Après rechargement, la note et le statut restent enregistrés.

## 6. Préparer et envoyer la proposition

Dans la fiche projet, renseigner le lien HTTPS d’aperçu, le prix, une capture et le message. Cliquer sur **Enregistrer et prévisualiser l’e-mail**.

- [ ] Le destinataire est correct.
- [ ] Les liens et la capture sont corrects.
- [ ] Les montants HT/TTC correspondent au prix saisi.
- [ ] Modifier le message après prévisualisation impose une nouvelle prévisualisation avant envoi.

Envoyer la proposition. Pour les messages commerciaux locaux, consulter <http://localhost:3001/emails-locaux> après connexion administrateur.

- [ ] La proposition apparaît dans la boîte locale ou arrive dans la boîte réelle, selon le mode configuré.
- [ ] Le lien privé s’ouvre dans la fenêtre client sans compte administrateur.
- [ ] Le portail affiche le bon projet et le bon montant.

La boîte commerciale de l’administration et la boîte de confirmation du formulaire public sont deux outils distincts.

## 7. Tester le paiement de création

Ouvrir le lien privé dans la fenêtre client. Vérifier les conditions, le montant et l’acceptation avant paiement. Effectuer d’abord un abandon, puis un paiement réussi en mode test.

- [ ] Les conditions et le montant sont corrects.
- [ ] L’abandon ne marque pas la création comme payée.
- [ ] Le paiement réussi remonte dans l’administration.
- [ ] Recharger la page ne crée pas de second paiement.
- [ ] Avec Stripe, le statut dépend de la confirmation reçue par le serveur, et pas seulement du retour du navigateur.

La simulation locale ne valide pas les webhooks Stripe. Vérifier cette partie avec Stripe en mode test pour contrôler l’intégration réelle.

## 8. Tester les ajustements et le domaine

Après paiement de la création :

1. Côté administrateur, préparer les propositions de domaine.
2. Côté client, sélectionner un domaine et confirmer les suppléments affichés, le cas échéant.
3. Envoyer un retour dans **Mes modifications regroupées**, avec une pièce jointe autorisée.
4. Côté administrateur, vérifier le texte et le fichier, puis clôturer la série.
5. Côté client, valider la version finale.

- [ ] Les choix de domaine et les montants sont identiques des deux côtés.
- [ ] Le retour et sa pièce jointe remontent dans la fiche du projet.
- [ ] Une série encore ouverte empêche la validation finale.
- [ ] La clôture d’une série est visible côté client.
- [ ] La validation finale affiche le nom et la date.
- [ ] Une nouvelle version demande une nouvelle validation.

## 9. Tester l’abonnement et la publication

Une fois les ajustements validés et le domaine préparé, prévisualiser puis envoyer l’invitation d’activation. Côté client, activer l’abonnement en mode test.

- [ ] L’e-mail d’activation contient les bons liens et montants.
- [ ] L’administration distingue l’invitation envoyée du premier paiement confirmé.
- [ ] La publication reste bloquée tant que les prérequis ne sont pas remplis.
- [ ] Le premier paiement confirmé remonte dans la fiche du projet.
- [ ] Après publication effective, le lien définitif ouvre le bon site et le statut est cohérent.

**La mise en ligne du site client reste une intervention à réaliser : changer un statut dans l’administration ne déploie pas automatiquement un site.**

## 10. Tester les échanges et un devis complémentaire

Envoyer un message depuis la fiche client, puis répondre depuis la messagerie client, ou utiliser la simulation de réponse locale.

- [ ] Le message sortant apparaît dans la bonne conversation.
- [ ] La réponse remonte dans **Échanges** et dans la bonne fiche client.
- [ ] Les réponses à traiter sont identifiables.

Créer ensuite un devis complémentaire, vérifier son PDF, l’envoyer, l’accepter et le payer en mode test.

- [ ] Les prestations, quantités, montants HT/TTC et conditions sont corrects.
- [ ] Les montants du PDF correspondent à ceux du portail client.
- [ ] Le client doit accepter explicitement le devis avant paiement.
- [ ] Le paiement confirmé apparaît dans l’administration.
- [ ] Une nouvelle version d’un devis envoyé avant acceptation révoque l’ancien lien.
- [ ] Le devis complémentaire ne modifie pas le projet initial.

## 11. Vérifications complémentaires

| Test | Résultat attendu | Validation |
| --- | --- | --- |
| Ouvrir `/demandes` ou `/clients` sans connexion | Redirection vers la connexion | ☐ |
| Se déconnecter puis revenir sur une page privée | Données administrateur inaccessibles | ☐ |
| Ouvrir un portail client sans son accès privé, dans une nouvelle session | Aucune donnée client affichée | ☐ |
| Recharger après une action ou cliquer deux fois | Aucun doublon de projet, d’envoi ou de paiement | ☐ |
| Mettre une demande test sans projet, devis ou échanges dans la corbeille, puis la restaurer | Retrait des listes actives, puis récupération du contenu et du statut | ☐ |
| Consulter `/sante` et les e-mails | Worker actif ; aucun échec définitif inexpliqué | ☐ |
| Tester sur téléphone | Formulaires, PDF, portail et boutons utilisables | ☐ |

## 12. Vérifications après déploiement

Le parcours local valide le fonctionnement interne. Refaire un parcours avec les services déployés et Stripe en mode test pour vérifier les connexions réelles.

- [ ] Une demande du site déployé arrive dans l’administration déployée.
- [ ] L’e-mail de confirmation arrive dans une boîte réelle et son lien pointe vers le bon domaine.
- [ ] Les e-mails commerciaux arrivent avec les bons liens et pièces jointes.
- [ ] Une réponse depuis une messagerie réelle remonte dans l’administration.
- [ ] Les paiements de création, de devis et d’abonnement en mode test remontent via les webhooks.
- [ ] Le worker reste actif et traite les messages en attente.
- [ ] Les portails et la connexion fonctionnent sur téléphone.

## Périmètre à connaître

- Les témoignages sont actuellement dans le code ; ils ne se gèrent pas depuis l’administration.
- Le chat Crisp se traite dans Crisp, séparément des échanges e-mail de l’administration.
- Une clé fournisseur indiquée comme présente dans `/sante` ne prouve pas que le fournisseur est joignable.
- Un e-mail accepté par le fournisseur n’est pas nécessairement livré en boîte de réception.

## Compte rendu

Pour chaque anomalie, noter : l’étape, l’URL, la référence du dossier test, les actions réalisées, le résultat attendu et le résultat obtenu. Ajouter une capture si utile, sans partager les liens privés ou les secrets.

| Date | Environnement | Navigateur / appareil | Étape | Résultat / anomalie |
| --- | --- | --- | --- | --- |
| | | | | |
