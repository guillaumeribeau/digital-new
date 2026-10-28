# Tadapo — vitrine et commandes

Tadapo est une application indépendante dans apps/tadapo, avec un parcours payant raccordé à l’administration commune. Le premier mois est payé après le questionnaire ; les demandes gratuites sont supprimées.

Le fonctionnement et les étapes de configuration sont documentés dans [Tadapo et administration](tadapo-admin.md). Les commandes réelles et le déploiement restent soumis à validation.

## Lancement et vérification

Utiliser npm run dev:tadapo (port 3002) et npm run dev:admin (port 3001). Configurer les variables à partir des fichiers .env.example des deux applications. Les contrôles sont npm run typecheck, npm run lint, npm test, npm run test:integration, npm run test:integration -- --tadapo-ui, npm run build:tadapo, npm run build:admin et npm run test:tadapo-ui. Les tests Stripe ne créent aucun paiement réel.

## Animations GSAP

L’identité visuelle, les contenus commerciaux, les tarifs et les routes sont conservés. Aucun changement n’est nécessaire dans Zelyweb ni dans les dépendances : GSAP et `@gsap/react` sont déjà déclarés par l’application TADAPO.

- `components/animation/use-hero-motion.ts` : entrée élastique des titres/lettres, dessin SVG du soulignement, matériaux graphiques issus des vrais blocs HTML du mockup, assemblage, écrans ordinateur/tablette/mobile, révélation du zéro. Timeline avec labels `materials`, `assemble`, `responsive`, `offer`, pin et scrub réversibles. Durée de défilement proportionnée à l’écran, plafonnée à 2 600 px. Le texte principal, le header et le CTA restent accessibles. Les liens de l’offre visuellement masquée sont également inertes pour le clavier.
- Hero épinglée seulement à partir de 1 024 px de largeur et 650 px de hauteur, sans préférence de mouvement réduit. Fenêtres étroites, mobiles et écrans de moins de 650 px de hauteur : entrée courte puis assemblage des vrais blocs du site au scroll, sans pin. Réaction très légère à la souris via une couche indépendante de la timeline. Les listeners, les tweens et le pin sont nettoyés au démontage et au changement des media queries.
- `section-motion.ts` : entrées en cascade des cartes, ligne de progression et activation des étapes au scroll, révélation typographique du dernier CTA. Les formes du parcours n’utilisent plus de flottement CSS permanent.
- `use-showcase-motion.ts` : GSAP Flip transforme le même écran entre ordinateur et mobile. Les changements d’exemple utilisent profondeur, image et texte en cascade. Les liens vers les démonstrations restent actifs.
- `animated-amount.tsx` : interpolation visuelle des prix, sans modifier le catalogue, la valeur accessible finale ni les liens de commande. Les changements rapides remplacent l’animation en cours. Mouvement réduit : mise à jour immédiate.
- `details-motion.ts` : hauteur/opacité des FAQ améliorées à partir des éléments natifs `details`/`summary`. Souris, clavier, inversion pendant une transition et fonctionnement sans JavaScript sont préservés. Les hauteurs sont libérées à la fin de la transition.
- `styles/animation.css` : micro-interactions, soulignement des liens, mouvements discrets au survol et règles de mouvement réduit. Pas de curseur personnalisé, de détournement du scroll ni de bibliothèque de smooth scrolling.

`scripts/check-tadapo.mjs` vérifie aussi les prix animés avec changements rapides, GSAP Flip, la FAQ au clavier, le retour du scroll, le nettoyage après navigation/redimensionnement et un changement de préférence de mouvement réduit. La prévisualisation ne déploie aucune nouvelle version sur Railway.

## Démonstrations et indexation

Courant, Studio Alba et Pollen sont fictifs. Leurs formulaires ne transmettent rien. Les photos proviennent des ressources Pexels documentées dans le dépôt. L’indexation globale reste désactivée par défaut ; commande, suivi et démonstrations restent noindex.

Configuration des comptes marchands distincts : [Stripe Zelyweb et Tadapo](stripe-deux-marques.md).
