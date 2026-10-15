import Link from "next/link";
import { PageIntro } from "@/components/ui/page-intro";
import { business } from "@nova/shared/business";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Politique de confidentialité", "Utilisation de vos informations par Zelyweb, conservation de vos demandes et exercice de vos droits.", "/politique-confidentialite");
export default function Privacy() {
  return <><PageIntro label="VOS INFORMATIONS" title="La confidentialité." description="Vos informations servent à préparer votre site, échanger avec vous et assurer le suivi de votre demande." />
    <article className="container legal-content">
      <p>Mise à jour : 15 octobre 2026.</p>
      <h2>Responsable du traitement</h2>
      <p>{business.legalName}, {business.address}. Pour toute question ou demande relative à vos données : <a href={`mailto:${business.email}`}>{business.email}</a>.</p>
      <h2>Informations collectées</h2>
      <p>Nous recueillons les coordonnées, les informations professionnelles et les souhaits de site que vous renseignez, puis les échanges liés au projet. Les champs obligatoires sont nécessaires au traitement de votre demande ; les autres sont facultatifs. Aucun fichier n’est transmis par le formulaire initial. Des données techniques de connexion et des identifiants temporaires servent à protéger le formulaire contre les abus.</p>
      <h2>Utilisation et bases juridiques</h2>
      <p>L’examen de votre demande, la préparation de la proposition et les échanges préalables reposent sur les mesures précontractuelles prises à votre demande. Le suivi du site et de l’abonnement repose sur l’exécution du contrat. La facturation et les archives imposées par la loi reposent sur nos obligations légales. La prévention de la fraude et des envois automatisés repose sur notre intérêt légitime à sécuriser le service. Les outils de mesure d’audience soumis à consentement restent conditionnés à votre choix. Le formulaire ne vous inscrit pas à une newsletter.</p>
      <h2>Destinataires et prestataires</h2>
      <p>Guillaume Ribeau et les seuls intervenants habilités accèdent aux informations nécessaires à votre projet. Railway héberge le site et la base de données ; Resend assure les e-mails transactionnels ; Cloudflare Turnstile protège le formulaire ; Upstash fournit les compteurs temporaires de limitation des abus. Stripe traite les paiements par carte lors des commandes. Zelyweb ne conserve pas le numéro complet de votre carte. Les notifications internes peuvent être reçues dans la boîte Gmail utilisée pour le suivi des demandes.</p>
      <h2>Traitements internationaux</h2>
      <p>Certains prestataires peuvent traiter ou rendre accessibles des données hors de l’Espace économique européen, notamment aux États-Unis. Les régions d’hébergement, les accords de traitement et les mécanismes de transfert applicables doivent être vérifiés pour les services utilisés. Vous pouvez demander des précisions à {business.email}. Les engagements de Railway sont accessibles dans son <a href="https://railway.com/legal/dpa">accord de traitement des données</a>.</p>
      <h2>Durées de conservation</h2>
      <ul>
        <li>Demande dont l’adresse e-mail n’a pas été confirmée : 30 jours à compter de la réception.</li>
        <li>Demande sans suite : 12 mois après le dernier échange.</li>
        <li>Données nécessaires au service : pendant la relation contractuelle, puis selon les délais de prescription et obligations légales applicables.</li>
        <li>Copie des fichiers du site destinée à leur récupération : 30 jours après la fin du service.</li>
        <li>Factures et pièces comptables : 10 ans. Les documents contractuels et les éléments nécessaires à la défense de droits suivent leurs propres délais légaux, en archivage à accès restreint.</li>
      </ul>
      <p>Ces échéances font l’objet d’un traitement manuel de suppression ou d’archivage selon la nature des documents. Les liens de confirmation sont valables 24 heures. Les compteurs anti-abus sont temporaires et n’enregistrent pas le contenu de votre demande.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou, selon la base juridique du traitement, l’opposition et la portabilité de vos données. Vous pouvez retirer un consentement à tout moment pour les traitements qui en dépendent. Écrivez à {business.email} ou à notre adresse professionnelle. Nous répondons en principe dans un mois ; une prolongation motivée peut être nécessaire dans les cas prévus par le RGPD. L’effacement reste soumis aux obligations de conservation applicables.</p>
      <p>Vous pouvez adresser une réclamation à la <a href="https://www.cnil.fr/fr/plaintes">CNIL</a>.</p>
      <h2>Cookies et audience</h2>
      <p>Consultez la <Link href="/cookies">page cookies</Link> pour modifier vos préférences. Les outils de mesure d’audience soumis à consentement ne sont activés qu’après accord. Votre demande n’est pas enregistrée dans le stockage de votre navigateur.</p>
    </article></>;
}
