# Passerelle des demandes NOVA

## Protection anti-robot

Cloudflare Turnstile protège l’envoi de la demande et le renvoi des liens de confirmation. Chaque jeton est validé par le serveur via Siteverify avant toute écriture ; avec les clés réelles, le domaine et l’action (`lead_submit` ou `lead_resend`) doivent correspondre. Les jetons manquants, invalides, expirés ou déjà utilisés sont refusés. Une panne du fournisseur bloque l’envoi tout en conservant le formulaire. Le jeton Turnstile n’est ni enregistré dans la demande ni journalisé. Le widget est renouvelé après chaque tentative, expiration ou changement d’étape.

Pour activer la protection réelle : dans le tableau de bord Cloudflare, ouvrir Turnstile, créer un widget Managed et autoriser le domaine du site (sans protocole ni port). Fournir `TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` dans `apps/website/.env.local` ou dans le service site vitrine Railway, puis redémarrer le site. La clé secrète reste côté serveur ; elle ne doit jamais porter le préfixe `NEXT_PUBLIC_`. L’administration et le worker n’ont pas besoin de ces clés.

En développement sur localhost, si les deux clés sont absentes, les clés officielles de test Cloudflare sont utilisées. Le widget indique « mode de test local » : ce mode permet de tester le parcours, mais ne bloque pas les robots réels. Les clés de test sont refusées en production et sur un domaine non local. Aucun contournement de vérification serveur n’est utilisé, même avec les clés de test.

Le champ piège, la limitation de débit, la validation serveur et la confirmation d’e-mail restent actifs. Turnstile complète ces protections ; il ne garantit pas l’absence totale de spam.

Sources : [validation serveur Cloudflare](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [clés de test Cloudflare](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Tester sans fournisseur d’e-mails en local

L’assistant `npm run db:setup:local` configure `LEAD_EMAIL_MODE=local` et une clé `LOCAL_EMAIL_PREVIEW_TOKEN` dans `apps/website/.env.local`. Après modification des variables, redémarrer `npm run dev`. Ce mode exige le développement et une URL de site HTTP sur localhost ; il reste désactivé en production.

1. Ouvrir `http://localhost:3000/demander-mon-site` et envoyer une demande.
2. La demande apparaît immédiatement dans l’administration avec le statut « En attente de vérification ».
3. Exécuter `npm run emails:local` pour ouvrir la boîte e-mail de test dans le navigateur. Cliquer sur « Actualiser » si nécessaire.
4. Ouvrir le lien de confirmation du message, puis cliquer sur « Confirmer mon adresse e-mail ».
5. Actualiser la demande dans l’administration : elle peut maintenant être qualifiée et transformée en projet.

Aucun e-mail réel n’est envoyé en mode local. La boîte affiche les 30 messages en attente les plus récents et exige la clé locale, transmise dans un fragment retiré avant l’appel API. Les messages restent chiffrés en base ; le worker conserve les messages en attente sans simuler une livraison. La page et l’API de cette boîte ne sont pas disponibles en production. Pour l’envoi réel, retirer le mode local et configurer Resend, l’expéditeur et le destinataire interne.

Depuis l’ajout de l’administration, le site se trouve dans `apps/website`, le schéma partagé dans `packages/database/prisma` et la validation dans `packages/validation`. Voir [administration](administration.md) pour les transitions de qualification/production désormais implémentées et [déploiement du monorepo](railway-monorepo.md) pour les services séparés. Les indications ci-dessous décrivent la responsabilité du pipeline public ; les autres transitions sont privées et historisées.

## Parcours

Le formulaire existant reste organisé en trois étapes. Il utilise le même schéma Zod côté navigateur et serveur. Une case obligatoire supplémentaire atteste la prise de connaissance de l’offre : première proposition gratuite, 299 € HT après validation, gestion technique à 29 € HT/mois sans engagement de durée, domaine/hébergement/mise en ligne pris en charge. Cette case n’est pas un consentement marketing.

`POST /api/leads` valide le JSON, l’origine, le honeypot, les tarifs et les coordonnées. Une transaction Prisma crée `Lead`, `EmailVerificationToken` et `OutboxEvent`. La réponse 202 confirme uniquement l’enregistrement et indique `emailDelivery: queued`. Une indisponibilité de Resend après l’enregistrement ne supprime pas la demande. Une indisponibilité PostgreSQL renvoie 503 sans succès annoncé.

Le processeur d’outbox transmet le lien via Resend, avec un e-mail HTML et sa version texte. Le jeton figure dans le fragment de l’URL, pas dans la requête HTTP ni le Referer. La page `/confirmer-demande` retire ce fragment et appelle automatiquement `POST /api/leads/verify` : le clic sur le lien suffit, sans seconde action ni défi anti-robot. Une requête en cours est réutilisée lors du rejeu des effets React pour ne consommer le jeton qu’une fois. Après validation, l’outbox reçoit l’accusé de réception et la notification interne. Le formulaire de renvoi n’apparaît qu’en cas d’échec. La page est noindex, utilise une politique no-referrer et n’active pas Google Tag Manager. Un scanner exécutant JavaScript et ouvrant le lien complet peut aussi déclencher cette validation automatique.

La confirmation consomme atomiquement le jeton, renseigne `emailVerifiedAt`, passe de `PENDING_VERIFICATION` à `NEW` et crée deux événements : accusé de réception et notification interne. Aucun e-mail interne n’est créé avant cette étape.

`POST /api/leads/resend` exige la référence UUID et l’adresse e-mail. Une réponse identique est renvoyée pour une demande absente, vérifiée ou limitée. Le renvoi impose une minute entre les liens et au maximum trois renvois en plus du premier envoi par période glissante de 24 heures. Les anciens jetons sont révoqués. Un envoi déjà en traitement reporte le renvoi.

## Données et adaptation du formulaire

| Formulaire | PostgreSQL |
| --- | --- |
| `fullName` | `fullName` ; `firstName` et `lastName` restent null |
| `company`, `sector`, `city` | `businessName`, `businessSector`, `city` |
| `email`, `phone`, `contactMethod` | `email` normalisé en minuscules, `phone`, `preferredContactMethod` |
| `services`, `style` | `services` (texte), `preferredStyle` (code du choix) |
| `description`, `colors`, `extra` | `projectDescription`, `preferredColors`, `additionalInformation` |
| `hasWebsite`, `website`, `hasLogo`, `hasPhotos` | champs facultatifs correspondants |
| `pricingAcknowledged`, `consent` | dates serveur et versions tarifaire/information de traitement |
| UTM de la page du formulaire | `utmSource`, `utmMedium`, `utmCampaign`, facultatifs et limités à 200 caractères |

`businessType` et `siret` ne sont pas recueillis et restent null. Les textes facultatifs vides deviennent null. Aucun prénom, nom séparé ou contenu de projet absent n’est déduit. La source est fixée par le serveur à `showcase-form`. Les UTM sont indicatifs, non fiables et ne servent jamais au contrôle d’accès.

Les identifiants de demande sont des UUID générés côté serveur. `requestId`, UUID de tentative côté formulaire, porte une contrainte unique et une empreinte du contenu validé. Le même contenu et la même clé renvoient la même référence, y compris lors de soumissions concurrentes. Une clé réutilisée avec un autre contenu renvoie 409. Une modification du formulaire génère une nouvelle clé. L’e-mail n’est pas unique : plusieurs demandes restent possibles.

Le schéma et la migration sont dans `prisma/`. Index : statut/date, e-mail, date de création, jetons/date et outbox/statut/date. Les relations jetons, fichiers et événements sont supprimées en cascade lors de la suppression d’une demande.

## Statuts et future administration

`PENDING_VERIFICATION → NEW` est la seule transition implémentée. Les autres statuts sont réservés : `QUALIFIED`, `REJECTED`, `IN_PROGRESS`, `PREVIEW_SENT`, `APPROVED`, `PAID`, `PUBLISHED`, `CANCELLED`.

Le site ne fournit aucune API GET, PATCH ou DELETE de demandes. Les méthodes non implémentées renvoient 405. Les champs privilégiés envoyés au endpoint de création sont refusés ; les données stockées sont construites explicitement côté serveur.

La future administration utilisera un rôle PostgreSQL distinct. Ajouter par migrations des tables `LeadNote` et `LeadAction` référencées par `leadId`, avec auteur, date et événement, plutôt que mélanger notes internes et informations prospect. Les futures références Stripe, événements de paiement idempotents et URL de démonstration ne sont pas implémentés. Conserver un propriétaire unique du schéma et synchroniser la génération Prisma dans les deux applications.

## Outbox et exploitation

Les contenus immuables des e-mails sont chiffrés en AES-256-GCM avec `OUTBOX_ENCRYPTION_KEY`, 32 octets aléatoires en base64. Le modèle de jeton ne stocke qu’une empreinte SHA-256 d’un secret aléatoire de 256 bits. Le secret du lien existe uniquement dans le contenu chiffré de l’outbox jusqu’à l’envoi. La clé doit être conservée hors de la base et sauvegardée dans un gestionnaire de secrets.

Exécuter `npm run outbox:watch` comme processus serveur permanent, ou `npm run outbox:once` régulièrement avec un ordonnanceur externe autorisé. Le code ne configure aucun déploiement ni ordonnanceur. Le worker charge les mêmes variables que Next.js via `@next/env`. Il doit pouvoir joindre PostgreSQL et Resend. **Sans worker actif, les demandes restent enregistrées mais les e-mails ne partent pas.**

Le worker réclame un événement avec `FOR UPDATE SKIP LOCKED`, lui attribue un bail de deux minutes et une clé de verrou unique, puis envoie hors transaction. Plusieurs workers peuvent fonctionner ensemble. Un arrêt brutal rend le bail récupérable. La prise en charge est confirmée uniquement après une réponse Resend valide contenant un identifiant. Acceptation ne signifie pas livraison en boîte de réception.

Chaque événement utilise `nova-outbox/<UUID>` comme clé Resend. Les erreurs imposent un délai exponentiel depuis 30 secondes, plafonné à une heure, pour huit tentatives maximum. La fenêtre de reprise est limitée à 23 heures depuis la création, sous les 24 heures d’idempotence Resend. Les horodatages des baux et reprises utilisent la même horloge applicative ; synchroniser les horloges des instances en production.

États : `PENDING`, `PROCESSING`, `SENT`, `DEAD`, `CANCELLED`. Les contenus chiffrés sont effacés après acceptation, annulation ou abandon. Les événements DEAD nécessitent une investigation opérateur. Ne pas rejouer automatiquement un ancien événement : vérifier d’abord les journaux Resend, car une réponse perdue peut correspondre à un envoi accepté. Un nouveau lien de vérification peut être demandé via le renvoi limité. Pour les notifications finales, réconcilier manuellement avant tout nouvel envoi ; aucune interface de reprise administrateur n’est créée.

Surveiller le nombre d’événements DEAD, l’âge du plus ancien PENDING, les baux expirés et le fonctionnement du worker. Les logs applicatifs contiennent uniquement des codes d’erreur et des compteurs, sans adresses, corps, jetons ou identifiants de connexion.

## Protections et conservation

Le JSON est limité à 20 Ko même sans Content-Length. Le contrôle d’origine ne remplace pas l’anti-spam ; un client non navigateur peut le reproduire. Redis applique atomiquement cinq tentatives par quinze minutes, par IP et opération, avec HMAC et TTL. En production, une panne Redis ferme les endpoints ; aucun repli mémoire n’est utilisé.

Vercel fournit son en-tête garanti. Sur un autre hébergeur, renseigner `TRUSTED_CLIENT_IP_HEADER` uniquement après avoir vérifié que le proxy remplace entièrement l’en-tête transmis par le client. Sans cette garantie, laisser vide : une limite globale conservatrice s’applique. Ne jamais choisir arbitrairement `x-forwarded-for`. Les renvois sont également bornés en base sous verrou de la demande.

Les données de connexion ne doivent jamais utiliser un préfixe NEXT_PUBLIC_. Prisma paramètre les requêtes, y compris les verrous SQL. Le fournisseur ne reçoit aucun paramètre analytics. Aucune inscription marketing n’est effectuée.

Avant ouverture, le responsable doit fixer la conservation des demandes non vérifiées, confirmées et des métadonnées d’envoi, la procédure d’effacement, la base juridique et les informations définitives des prestataires. Ces choix ne sont pas inventés ; aucune purge de prospects n’est programmée. Prévoir aussi le délai de disparition des données dans les sauvegardes. La suppression relationnelle ne supprime pas les e-mails déjà présents chez le fournisseur ou dans les boîtes.

## Fichiers

Le formulaire actuel ne téléverse aucun fichier. `LeadFile` prépare uniquement des références privées (`objectKey`, nom d’affichage, MIME, taille). Aucun endpoint d’upload ou de téléchargement public n’existe.

Avant activation : sélectionner un bucket objet privé S3 compatible accessible depuis Railway, vérifier l’identité et l’autorisation de dépôt, limiter taille/nombre/types, vérifier signatures binaires et MIME, générer des clés aléatoires indépendantes du nom transmis, refuser SVG/HTML exécutables, scanner les fichiers et utiliser des liens signés courts après autorisation. Ne pas utiliser le disque éphémère ni stocker les binaires PostgreSQL. Ajouter les règles d’effacement des objets ; la cascade DB seule ne supprime pas le bucket.

## Tests

```sh
npm test
npm run test:integration
npm run lint
npm run typecheck
npm run db:validate
npm run build
```

Les tests d’intégration lancent un PostgreSQL embarqué isolé sur loopback et un port libre, appliquent `prisma migrate deploy`, puis testent le pipeline avec des identités fictives et Resend simulé. Ils ne lisent pas votre DATABASE_URL. Le processus PostgreSQL est arrêté à la fin ; les fichiers de contrôle restent dans `reports/postgres-test/`, ignoré par Git. L’exécution native peut demander une autorisation hors sandbox sous Windows. Aucun utilisateur système n’est créé.

Avec un serveur Next.js local de test : `npm run test:lead-ui` contrôle 375, 768, 1024 et 1440 pixels et intercepte tous les appels de création. `npm run test:verification-ui` contrôle les mêmes largeurs, le retrait du fragment, la confirmation automatique avec un seul appel, l’absence de défi supplémentaire après validation, les liens incomplets, les erreurs, le renvoi et les méthodes interdites. `QA_BASE_URL` permet de choisir l’origine locale. Les appels d’écriture sont simulés ; ne jamais utiliser ces scénarios avec des secrets de production. Le test de livraison réelle et du réseau Railway reste une étape de configuration externe.

Sources : [Resend et idempotence](https://resend.com/changelog/idempotency-keys), [Prisma et pools](https://docs.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/connection-pool).
