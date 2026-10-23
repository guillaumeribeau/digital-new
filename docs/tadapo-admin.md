# Tadapo — raccordement à l’administration

État du développement au 23 octobre 2026. Cette livraison prépare le code et les tests ; elle n’applique aucune migration sur les bases existantes, ne déploie aucun service et n’active aucun paiement réel.

## Parcours retenu

- Un admin commun, filtres Zelyweb/Tadapo dans demandes, projets et clients, et page `/commandes-tadapo` pour les commandes, abonnements, impayés et résiliations Tadapo.
- Le premier mois est payé à la fin du questionnaire. Les quatre tarifs restent 39/49 € HT pour Essentiel et 69/85 € HT pour Business, selon l’engagement de 12 mois ou l’absence d’engagement. Création : 0 €. Renouvellement mensuel à la date de commande.
- Les réponses, le catalogue accepté, les accords horodatés et une copie HTML des conditions sont conservés dans `TadapoOrder`. Les conditions acceptées sont jointes à la confirmation par e-mail. Un changement du catalogue ne réécrit pas ces données.
- Le dossier `Lead` de marque `tadapo` et son `Project` sont créés après vérification serveur du paiement Stripe. Une page de retour, un simple état `active` ou un montant envoyé par le navigateur ne constituent pas une preuve de paiement. Le paiement ne marque pas l’adresse e-mail comme vérifiée.
- Aucun aperçu gratuit : les anciens liens `/apercu-gratuit` redirigent définitivement vers `/commande`.
- Le client reçoit un lien personnel `/suivi/[id]#token=…`, sans compte ni mot de passe. Le jeton n’est pas placé dans les paramètres de requête ; les requêtes API l’utilisent dans `Authorization`. Il permet les retours, la validation de la version, l’accord de domaine, les factures, le moyen de paiement et la résiliation.
- Les fichiers sont envoyés par e-mail puis rattachés dans l’admin (PDF, PNG, JPEG ou WebP, 5 Mo maximum). Ils sont chiffrés et téléchargeables uniquement après authentification administrateur.

## Réalisation et messages

Étapes manuelles : dossier à compléter → création → version envoyée → corrections si nécessaire → validation du client → mise en ligne. Le passage en création confirme que les contenus sont complets. Sans demande distincte de démarrage anticipé, l’application attend 14 jours avant d’autoriser la création. Le délai de première version annoncé reste 72 h ouvrées après dossier complet, paiement et démarrage autorisé.

Le client peut valider uniquement une version proposée. Un changement de l’adresse de prévisualisation ou l’ouverture d’une nouvelle version retire la validation précédente. La publication exige validation à jour, domaine raccordé, URL définitive et abonnement actif sans alerte.

Les confirmations du paiement initial et du supplément de domaine sont automatiques. Les autres e-mails sont saisis et déclenchés depuis la fiche projet ; changer une étape n’envoie rien. Les messages utilisent `TADAPO_FROM_EMAIL` et `TADAPO_CONTACT_EMAIL` et sont traités par le worker commercial existant. Les réponses vont à la boîte de contact ; elles ne sont pas importées automatiquement dans l’admin.

Les factures et incidents sont synchronisés avec Stripe. Les relances et tentatives de recouvrement se configurent dans le compte Stripe existant. Une alerte apparaît dans l’admin ; aucune suspension de site n’est automatique.

## Domaine

L’opérateur vérifie manuellement la disponibilité, l’achat et le renouvellement en euros HT, puis crée une proposition dans l’admin. Essentiel paie le coût réel ; Business bénéficie d’une prise en charge jusqu’à 20 € HT/an pour un .fr/.com. Le supplément initial est calculé sur le serveur depuis l’offre conservée.

Le client accepte la proposition depuis son lien personnel puis règle séparément le supplément initial éventuel sur Stripe. L’admin ne peut confirmer l’achat sans cet accord et ce paiement. L’achat fournisseur reste manuel, au nom du client. Un domaine existant reste renouvelé auprès de son fournisseur, sans nouvel achat facturé. Le raccordement exige que le domaine corresponde à l’URL définitive.

Une proposition acceptée est figée. Un changement de tarif après accord nécessite une intervention et un nouvel accord ; aucun achat automatique n’est réalisé. Le renouvellement annuel et son supplément éventuel restent suivis manuellement, avec nouvelle information et accord, sans prélèvement automatique supplémentaire.

## Abonnement et résiliation

La demande de résiliation fixe `cancel_at` dans Stripe à la fin de l’engagement initial si celui-ci est encore en cours, sinon à la fin de la période mensuelle courante. Après le terme initial, il n’y a pas de nouvel engagement annuel. La demande et la date prévue sont visibles dans l’admin et sur le lien client.

Le portail Stripe ouvert par Tadapo permet de gérer le moyen de paiement et les factures. La modification et la résiliation d’abonnement y sont désactivées pour empêcher un contournement de l’engagement. La résiliation passe par la route Tadapo. Les demandes exceptionnelles de rétractation et les remboursements sont traités manuellement, par contact et intervention dans Stripe ; la résiliation ordinaire ne remplace pas ce traitement.

## Configuration nécessaire avant activation

1. Sauvegarder la base puis appliquer la migration additive `20261023120000_tadapo_orders` par le service de migrations existant. Conserver les pré-déploiements d’attente des migrations. La migration étend les rôles `nova_admin` existants ; pour un rôle personnalisé, réappliquer `grantCommercialPermissions` depuis un contexte opérateur.
2. Créer un compte PostgreSQL dédié au service public Tadapo. Lui accorder CONNECT à la base et appliquer `grantTadapoPermissions` dans `scripts/tadapo-permissions.ts`. Ce rôle n’accède ni aux comptes administrateurs, ni aux notes, ni aux fichiers privés ou aux e-mails commerciaux. Le webhook reste sur l’admin, dont le rôle peut créer les dossiers après paiement.
3. Configurer le service Railway Tadapo depuis la racine du monorepo : build `npm run build:tadapo`, démarrage `npm run start:tadapo -- --hostname 0.0.0.0` (Next utilise le port injecté par Railway), pré-déploiement `npm run db:migrate:wait`. Surveiller `apps/tadapo`, `packages`, `package.json` et `package-lock.json`. Ne pas créer un second webhook sur la vitrine.
4. Sur Tadapo et l’admin, définir `NEXT_PUBLIC_TADAPO_SITE_URL`, `TADAPO_CONTACT_EMAIL`, `TADAPO_FROM_EMAIL`, `STRIPE_SECRET_KEY` et `RESEND_API_KEY`. L’expéditeur doit appartenir à un domaine vérifié chez Resend ; l’adresse de contact doit être surveillée. L’adresse Tadapo exacte reste à fournir par le propriétaire.
5. Conserver la même `COMMERCIAL_ENCRYPTION_KEY` sur Tadapo, l’admin et le worker. Sauvegarder cette clé séparément de la base. Le worker existant utilise les expéditeurs contenus dans les messages chiffrés ; ses identifiants PostgreSQL restent distincts.
6. Sur Tadapo, configurer `DATABASE_URL` restreinte, Redis REST et `RATE_LIMIT_SALT` selon `.env.example`. `TADAPO_TRUSTED_IP_HEADER` est facultatif : ne le renseigner que si le proxy garantit son remplacement. Sans header fiable, la protection est globale. Sans Redis configuré en production, les routes publiques refusent les opérations.
7. Utiliser le webhook signé existant de l’admin `/api/webhooks/stripe`, avec sa clé `STRIPE_WEBHOOK_SECRET`. Les événements déjà listés dans `apps/admin/lib/stripe-events.ts` couvrent sessions Checkout, factures et abonnements. Les métadonnées `tadapoOrderId` et `purpose` séparent les marques et les paiements de domaine.
8. Tester d’abord avec des clés `sk_test_`, puis effectuer une recette sur le compte Stripe et le domaine Resend réels de test. Aucune session distante Stripe ni aucun envoi réel n’a été créé par les tests du dépôt.
9. Avant activation réelle : mettre à jour Next.js après le signalement de sécurité émis par la compilation ; finaliser les informations contractuelles encore signalées dans les pages légales, notamment la médiation si applicable et les durées de conservation ; faire valider le déploiement et les paiements réels par le propriétaire. Garder `TADAPO_ORDERING_ENABLED=false` jusque-là. Fermer les nouvelles commandes ne bloque pas la gestion des abonnements existants.

L’indexation reste indépendante et désactivée par défaut. Les routes de commande, démonstrations et suivi personnel restent `noindex`.

## Vérifications

`npm test`, `npm run lint`, `npm run typecheck`, `npm run build:tadapo`, `npm run build:admin`, `npm run test:integration` et `npm run test:integration -- --tadapo-ui`.

Les tests d’intégration démarrent un PostgreSQL jetable, appliquent les vraies migrations et simulent uniquement les réponses Stripe/Resend. Ils couvrent doubles soumissions, accords obligatoires, montants contrôlés, webhook signé, répétitions et ordre des événements, droits PostgreSQL, création du projet, envois manuels, domaine, fichiers privés et engagement. Le contrôle navigateur vérifie l’admin authentifié, le suivi client mobile, l’ajout d’un document et la publication manuelle. `npm run test:tadapo-ui` couvre aussi les quatre formats, animations, formulaires et la suppression du parcours gratuit.

Les clauses jointes aux commandes sont archivées dans `packages/shared/tadapo-terms-2026-10-23.json`, depuis les textes affichés. Lors d’une évolution des conditions, créer une nouvelle version d’archive et d’offre ; `scripts/archive-tadapo-terms.ts` sert à générer l’archive de cette livraison. Ne pas modifier rétroactivement les instantanés des commandes existantes.

Références techniques : [Checkout Stripe](https://docs.stripe.com/api/checkout/sessions/create), [résiliation Stripe](https://docs.stripe.com/billing/subscriptions/cancel), [métadonnées de Checkout](https://support.stripe.com/questions/using-metadata-with-checkout-sessions).
