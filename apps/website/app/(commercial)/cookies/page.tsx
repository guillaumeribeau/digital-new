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
          Sans identifiant Google Tag Manager configuré, aucun outil de mesure
          Google n’est chargé. Le site prépare une intégration soumise à votre
          accord préalable.
        </p>
        <h2>La mémorisation de votre choix</h2>
        <p>
          Le choix « accepté » ou « refusé » est conservé dans le stockage local
          de votre navigateur sous la clé nova-consent. Cette préférence ne
          contient aucune coordonnée personnelle. Elle est supprimée lorsque
          vous effacez les données du site.
        </p>
        <h2>Les outils optionnels</h2>
        <p>
          Les éventuels services Google Analytics et Google Ads devront être
          configurés dans le conteneur, avec les réglages de consentement
          appropriés. La liste définitive des traceurs, leurs finalités et leurs
          durées de vie devra être renseignée avant activation.
        </p>
        <h2>Modifier votre choix</h2>
        <p>
          Vous pouvez revenir sur votre préférence. Le refus empêche le
          chargement du conteneur lors des prochaines visites. Si des services
          ont déjà déposé des cookies, vous pouvez également les effacer dans
          les paramètres de votre navigateur.
        </p>
        <ConsentSettings />
      </article>
    </>
  );
}
