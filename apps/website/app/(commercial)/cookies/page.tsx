import { PageIntro } from "@/components/ui/page-intro";
import { ConsentSettings } from "@/components/consent";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Cookies et préférences",
  "Choisissez vos préférences de mesure d’audience. Aucun traceur Google n’est activé sans configuration et sans votre accord.",
  "/cookies",
);
export default function Cookies() {
  return (
    <>
      <PageIntro
        label="VOTRE CHOIX"
        title="Cookies & préférences."
        description="Votre demande de site reste accessible quel que soit votre choix concernant la mesure d’audience."
      />
      <article className="container legal-content">
        <h2>La configuration actuelle</h2>
        <p>
          Google Analytics 4 mesure la fréquentation, les pages consultées,
          la provenance des visites et les interactions avec les boutons et le
          formulaire. Il est chargé uniquement après votre acceptation. Sans
          votre accord, aucune requête vers Google Analytics n’est déclenchée
          par cette intégration.
        </p>
        <h2>La mémorisation de votre choix</h2>
        <p>
          Le choix « accepté » ou « refusé » est conservé dans le stockage local
          de votre navigateur sous la clé nova-consent. Cette préférence ne
          contient aucune coordonnée personnelle. Elle est supprimée lorsque
          vous effacez les données du site.
        </p>
        <h2>Les cookies de mesure</h2>
        <p>
          Google Analytics utilise les cookies _ga et _ga_TDLF1WPKD4 pour distinguer
          les visiteurs et leurs sessions. Leur expiration est configurée à un an,
          sans renouvellement à chaque visite. Les fonctions de personnalisation
          publicitaire et Google signals sont désactivées dans notre intégration.
          Aucun pixel publicitaire Meta, Google Ads ou autre n’est installé par
          ce suivi.
        </p>
        <p>
          Les événements personnalisés ne contiennent pas les coordonnées ni les
          textes saisis dans les formulaires. Les pages de confirmation des demandes
          et les démonstrations ne sont pas mesurées. Les liens de campagne peuvent
          utiliser des paramètres UTM pour identifier leur provenance.
          Consultez les <a href="https://policies.google.com/privacy?hl=fr">informations de confidentialité de Google</a>.
        </p>
        <h2>La messagerie Crisp</h2>
        <p>
          Crisp fournit la bulle de discussion et utilise des cookies techniques
          de session, notamment sous le préfixe crisp-client, pour reconnaître
          votre conversation entre les pages et lors de vos retours. Leur durée
          par défaut est de six mois, renouvelée lors d’une nouvelle visite.
          Cette durée concerne l’identifiant de session, distinct de la durée
          de conservation des messages.
        </p>
        <p>
          La bulle reste visible et la fenêtre s’ouvre après cinq secondes.
          Une préférence technique dans le stockage de session du navigateur
          mémorise que l’accueil a déjà été présenté ou que vous avez ouvert
          le chat. Elle évite de vous solliciter à nouveau pendant la navigation
          et ne contient aucune coordonnée personnelle.
        </p>
        <p>
          Le chat est indépendant de votre choix concernant la mesure d’audience.
          Aucun nom, e-mail ou contenu du formulaire de demande n’est transmis
          automatiquement à Crisp par notre intégration. Vous pouvez supprimer
          la session en effaçant les cookies du site dans votre navigateur.
          Consultez la <a href="https://help.crisp.chat/en/article/crisp-cookie-policy-1147xor/">politique de cookies de Crisp</a>.
        </p>
        <h2>Modifier votre choix</h2>
        <p>
          Vous pouvez revenir sur votre préférence. Le refus empêche le
          chargement de Google Analytics lors des prochaines visites. Si des services
          ont déjà déposé des cookies, vous pouvez également les effacer dans
          les paramètres de votre navigateur.
        </p>
        <ConsentSettings />
      </article>
    </>
  );
}
