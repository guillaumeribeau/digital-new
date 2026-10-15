import Link from "next/link";
import { PageIntro } from "@/components/ui/page-intro";
import { brand } from "@/config/brand.config";
import { business } from "@nova/shared/business";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Mentions légales", "Identité et coordonnées de Zelyweb, activité de Guillaume Ribeau EI, et hébergement du site.", "/mentions-legales");
export default function Legal() {
  return <><PageIntro label="INFORMATIONS DU SITE" title="Mentions légales." description="L’identité de votre interlocuteur et les informations relatives à zelyweb.com." />
    <article className="container legal-content">
      <h2>Éditeur du site</h2>
      <dl>{[
        ["Nom commercial", business.brand], ["Entrepreneur", business.legalName],
        ["Statut", business.legalForm], ["Adresse professionnelle", business.address],
        ["SIREN", business.siren], ["SIRET", business.siret],
        ["TVA intracommunautaire", business.vatNumber], ["Directeur de la publication", "Guillaume Ribeau"],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p>Contact : <a href={`mailto:${business.email}`}>{business.email}</a>.</p>
      {brand.phone ? <p>Téléphone : {brand.phone}</p> : <p>Le numéro de téléphone professionnel sera ajouté dès sa mise en service. Vous pouvez nous joindre par e-mail.</p>}
      <h2>Hébergement</h2>
      <p>Railway Corporation, 548 Market St, Suite 68956, San Francisco, California 94104, États-Unis. Téléphone : +1 415 707 7675. E-mail : team@railway.com. <a href="https://railway.com/legal/terms" target="_blank" rel="noopener noreferrer">Coordonnées de l’hébergeur</a>.</p>
      <h2>Contenus et démonstrations</h2>
      <p>Les démonstrations illustrent des possibilités de design. Les entreprises qui y figurent sont fictives ; elles ne constituent pas des références clients. Les textes, visuels et logiciels restent soumis aux droits de leurs auteurs et à leurs licences. Leur consultation n’autorise pas leur réutilisation sans accord ou licence applicable.</p>
      <h2>Conditions de l’offre et réclamations</h2>
      <p>Consultez les <Link href="/conditions-generales">conditions de l’offre</Link> pour les prix HT et TTC, la création, l’abonnement et la récupération de votre site. Toute réclamation peut être adressée à {business.email}.</p>
      <h2>Médiation de la consommation</h2>
      <p>Zelyweb n’a pas encore désigné de médiateur de la consommation. Ses coordonnées seront publiées après adhésion effective et devront être communiquées avant toute commande d’un consommateur.</p>
      <h2>Données personnelles</h2>
      <p>La <Link href="/politique-confidentialite">politique de confidentialité</Link> présente les traitements, les durées de conservation et les modalités d’exercice de vos droits.</p>
    </article></>;
}
