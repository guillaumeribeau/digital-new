import { PageIntro } from "@/components/ui/page-intro";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Politique de confidentialité",
  "Comment les informations de votre demande de site sont utilisées. Politique à compléter avec les informations définitives de l’entreprise.",
  "/politique-confidentialite",
);
export default function Privacy() {
  return (
    <>
      <PageIntro
        label="VOS INFORMATIONS"
        title="La confidentialité."
        description="Nous utilisons les informations de votre demande pour comprendre votre projet et vous recontacter. Cette politique doit être finalisée avant l’activation du service."
      />
      <article className="container legal-content">
        <div className="pending-box">
          <strong>Version préparatoire — à compléter avant publication.</strong>
          <p>
            Identité du responsable de traitement, contact pour l’exercice des
            droits, durées de conservation et prestataires effectifs restent à
            renseigner. Le service de réception doit être configuré avec la
            base de données, les e-mails, la protection anti-spam et le
            processeur des envois avant son ouverture.
          </p>
        </div>
        <h2>Les informations demandées</h2>
        <p>
          Nous recueillons les informations sur votre entreprise, votre
          activité, vos préférences de site et vos coordonnées. Les champs
          facultatifs sont signalés. Aucun fichier n’est envoyé par ce
          formulaire.
        </p>
        <h2>La finalité du traitement</h2>
        <p>
          Nous utilisons ces informations pour examiner votre demande de
          démonstration, préparer une proposition et échanger avec vous au sujet
          de ce projet. Le formulaire ne vous inscrit pas à une newsletter.
        </p>
        <h2>La base juridique</h2>
        <p>
          La base juridique appropriée pour la réponse à une demande
          précontractuelle et les traitements éventuels doit être confirmée avec
          le responsable de traitement. Le formulaire recueille votre accord
          pour être recontacté au sujet de la demande ; il ne recueille aucun
          consentement publicitaire.
        </p>
        <h2>Les destinataires et prestataires</h2>
        <p>
          Seules les personnes chargées de votre demande ont vocation à recevoir
          son contenu. L’intégration prévoit un service transactionnel Resend et
          une base PostgreSQL sur Railway et une protection anti-spam par Redis.
          Le formulaire utilise également Cloudflare Turnstile pour vérifier
          les requêtes et limiter les envois automatisés.
          Les prestataires effectivement
          activés, leurs lieux de traitement, les accords de sous-traitance et
          les garanties applicables doivent être précisés avant l’ouverture du
          service.
        </p>
        <h2>La durée de conservation</h2>
        <p>
          La durée de conservation des demandes dans PostgreSQL et les boîtes
          e-mail est à définir avant activation. Les liens de confirmation sont
          valables 24 heures. Les contenus des e-mails en attente sont chiffrés
          et effacés après leur prise en charge ou l’arrêt des tentatives.
          Le système de
          limitation de débit prévoit des compteurs temporaires de 15 minutes,
          associés à un identifiant d’adresse réseau haché. Les demandes ne sont
          pas enregistrées dans le stockage du navigateur.
        </p>
        <h2>Vos droits et votre contact</h2>
        <p>
          Les modalités d’accès, de rectification, d’effacement, de limitation
          et d’opposition, ainsi que le contact du responsable, sont à compléter
          selon les bases juridiques retenues. Vous pouvez adresser une
          réclamation à l’autorité de contrôle compétente, notamment la CNIL en
          France.
        </p>
        <h2>Mesure d’audience</h2>
        <p>
          Aucun outil Google n’est actif sans identifiant configuré et sans
          votre accord. Les événements préparés ne contiennent ni nom, ni
          adresse e-mail, ni téléphone, ni contenu de la demande.
        </p>
      </article>
    </>
  );
}
