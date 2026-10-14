import { PageIntro } from "@/components/ui/page-intro";
import { brand } from "@/config/brand.config";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Mentions légales",
  "Informations légales du site NOVA. Identité de l’éditeur et coordonnées à compléter avant publication.",
  "/mentions-legales",
);
export default function Legal() {
  return (
    <>
      <PageIntro
        label="INFORMATIONS DU SITE"
        title="Mentions légales."
        description="Document de préparation : les informations de l’éditeur doivent être complétées et vérifiées avant publication commerciale."
      />
      <article className="container legal-content">
        <div className="pending-box">
          <strong>NOVA est un nom provisoire.</strong>
          <p>
            L’identité juridique de l’entreprise n’est pas encore renseignée.
            Les indications « À renseigner » ne constituent pas des informations
            légales définitives.
          </p>
        </div>
        <h2>Éditeur du site</h2>
        <dl>
          {[
            ["Raison sociale", brand.legalIdentity.companyName],
            ["Forme juridique", brand.legalIdentity.legalForm],
            ["Capital social", brand.legalIdentity.capital],
            ["Siège social", brand.legalIdentity.address],
            ["Immatriculation / SIREN", brand.legalIdentity.registrationNumber],
            ["Numéro de TVA", brand.legalIdentity.vatNumber],
            [
              "Responsable de publication",
              brand.legalIdentity.publicationDirector,
            ],
            ["Adresse e-mail", brand.contactEmail],
            ["Téléphone", brand.phone],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "À renseigner avant publication"}</dd>
            </div>
          ))}
        </dl>
        <h2>Hébergement</h2>
        <p>
          {brand.legalIdentity.hostingProvider}. Raison sociale, adresse et
          coordonnées complètes de l’hébergeur : à renseigner selon le
          prestataire retenu.
        </p>
        <h2>Contenus et démonstrations</h2>
        <p>
          Les maquettes présentées illustrent des possibilités de design. Elles
          sont fictives et ne constituent pas des références clients. Les droits
          relatifs aux contenus et à l’identité définitive doivent être vérifiés
          avant publication.
        </p>
        <h2>Conditions commerciales</h2>
        <p>
          Les prix annoncés sont hors taxes. Les conditions de commande,
          d’engagement, de résiliation, de support et de transfert sont encore à
          valider. Elles seront communiquées avant toute commande.
        </p>
      </article>
    </>
  );
}
