import Link from "next/link";
import { PageIntro } from "@/components/ui/page-intro";
import { business, offerSections } from "@nova/shared/business";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Conditions de l’offre", "Création du site Zelyweb, abonnement, domaine, corrections, résiliation et remise des fichiers.", "/conditions-generales");
export default function Conditions() {
  return <><PageIntro label="LE CADRE DE NOTRE COLLABORATION" title="Des conditions claires." description="De la première version gratuite à la récupération de votre site : les prestations, les prix et vos possibilités de départ." />
    <article className="container legal-content">
      <p>Version du 16 octobre 2026. Prestataire : {business.legalName}, {business.address}, SIRET {business.siret}, TVA {business.vatNumber}. Contact : <a href={`mailto:${business.email}`}>{business.email}</a>.</p>
      <p>Ces conditions décrivent l’offre destinée aux professionnels, associations et particuliers. La demande initiale et l’aperçu privé sont gratuits et ne constituent pas une commande payante. Le périmètre, les délais et les conditions applicables sont remis avec la proposition avant acceptation ; un devis complémentaire accepté définit les éventuelles prestations supplémentaires.</p>
      {offerSections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
      <h2>Rétractation des consommateurs</h2>
      <p>Pour un contrat de prestation conclu à distance, le consommateur dispose de 14 jours à compter de sa conclusion pour se rétracter, sans avoir à motiver sa décision. La demande peut être envoyée par une déclaration claire à {business.email} ou par courrier à l’adresse ci-dessus. Les droits éventuellement applicables à certains petits professionnels restent préservés.</p>
      <p>Les prestations payantes ne commencent pas avant l’expiration de ce délai sans demande expresse distincte du client. Si un démarrage anticipé a été expressément demandé et que le client se rétracte, seul le montant proportionné aux prestations effectivement réalisées peut être dû dans les conditions prévues par la loi. La perte du droit de rétractation pour une prestation entièrement exécutée exige les accords et informations préalables prévus par la loi. La seule personnalisation du site ou l’acceptation d’un devis ne supprime pas ce droit.</p>
      <p>Modèle de déclaration : « À l’attention de Guillaume Ribeau EI — Zelyweb, {business.address}, {business.email}. Je vous notifie ma rétractation du contrat portant sur la prestation [description], commandée le [date]. Nom et adresse du client : […]. Date : […]. Signature en cas d’envoi sur papier. »</p>
      <h2>Réclamations et médiation</h2>
      <p>Adressez votre réclamation à {business.email}. Aucun médiateur de la consommation n’est encore désigné. Ses coordonnées devront être communiquées après adhésion effective de Zelyweb, avant la conclusion d’un contrat avec un consommateur. Cette information reste à compléter.</p>
      <h2>Données et conservation</h2>
      <p>Les demandes non confirmées sont conservées 30 jours ; les demandes sans suite, 12 mois après le dernier échange. La copie du site est disponible 30 jours après la fin du service. Ces délais sont traités manuellement, sous réserve des durées légales propres aux documents comptables et contractuels. Consultez la <Link href="/politique-confidentialite">politique de confidentialité</Link>.</p>
      <h2>Droit applicable</h2>
      <p>Le droit français s’applique, sans priver le consommateur des protections impératives dont il bénéficie. Aucune clause ne limite ses droits légaux ni les règles de compétence des juridictions applicables.</p>
    </article></>;
}
