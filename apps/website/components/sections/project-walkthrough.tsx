import Link from "@/components/ui/tracked-link";
import { offer } from "@nova/shared/business";
import { budgetEuro as euros } from "@/content/budget-comparison";
import "@/styles/project-walkthrough.css";

const projectSteps = [
  {
    title: "Camille présente son salon",
    client: "Elle décrit ses prestations, ses horaires et l’ambiance souhaitée. Elle indique qu’elle veut être contactée par téléphone pour les rendez-vous.",
    zelyweb: "Nous recueillons les informations utiles et confirmons la demande. Si un élément manque pour préparer le site, nous le demandons.",
    payment: "Aucun paiement, aucune commande à cette étape.",
  },
  {
    title: "Elle découvre une première version complète",
    client: "Camille parcourt les cinq pages : Accueil, À propos, Services, Réalisations et Contact. Elle vérifie que la proposition correspond à son activité.",
    zelyweb: "Nous préparons un aperçu gratuit sous sept jours ouvrés après réception des informations nécessaires. Les contenus de démonstration sont identifiés avant leur remplacement par les éléments validés.",
    payment: "L’aperçu est gratuit. Camille reste libre de ne pas commander.",
  },
  {
    title: "La proposition lui plaît : elle règle la création",
    client: "Elle accepte la proposition et paie la création par carte depuis le lien reçu. Elle rassemble ensuite ses remarques pour les ajustements.",
    zelyweb: "Nous transmettons la proposition et son lien de paiement, puis commençons les ajustements après confirmation du règlement.",
    payment: `${euros(offer.creationCents)} HT, soit ${euros(offer.creationTtcCents)} TTC, une seule fois. L’abonnement n’est pas encore activé.`,
  },
  {
    title: "Nous ajustons le site et préparons son adresse",
    client: "Camille précise ses horaires, remplace des photos et regroupe ses corrections. Elle confirme le domaine choisi après vérification de son prix et de sa disponibilité.",
    zelyweb: "Nous traitons jusqu’à trois séries de retours regroupés dans les trente jours suivant le paiement de création. Nous préparons le domaine ; les nouveaux domaines sont enregistrés au nom de Zelyweb et transférables au client sur demande.",
    payment: `Aucun nouveau paiement pour les ajustements inclus. Le domaine est inclus jusqu’à ${euros(offer.domainAnnualCents)} HT/an ; un supplément éventuel nécessite un accord préalable.`,
  },
  {
    title: "Elle valide et active le premier mois",
    client: "Elle relit la version ajustée et donne son accord final. Elle ouvre ensuite l’e-mail d’activation pour activer elle-même l’abonnement sur Stripe.",
    zelyweb: "Nous envoyons l’e-mail d’activation après validation des ajustements. Le site reste en attente de publication jusqu’à confirmation du premier paiement.",
    payment: `${euros(offer.monthlyCents)} HT, soit ${euros(offer.monthlyTtcCents)} TTC, payés immédiatement pour le premier mois, puis prélevés automatiquement chaque mois.`,
  },
  {
    title: "Le site du salon est publié",
    client: "Camille vérifie le site sur son adresse définitive, teste les contacts et partage le lien avec sa clientèle.",
    zelyweb: "Nous publions sous deux jours ouvrés après confirmation du premier paiement si le domaine et ses accès sont prêts. Nous assurons ensuite l’hébergement, la gestion du domaine et une modification regroupée de quinze minutes maximum par mois, non reportable.",
    payment: "L’abonnement continue sans durée minimale d’engagement. La publication ne garantit pas une date d’apparition ni un classement sur Google.",
  },
];

export function ProjectWalkthrough() {
  return (
    <section className="project-example" id="exemple-salon" aria-labelledby="project-example-title">
      <div className="container">
        <header className="project-example-header">
          <div><p className="eyebrow">UN PROJET, CONCRÈTEMENT</p><h2 id="project-example-title">Le site d’un salon.<br /><span>Du premier échange au lancement.</span></h2></div>
          <div><p>Suivons Camille, qui prépare le site de son salon de coiffure. À chaque étape, vous voyez ce qu’elle fait, ce que nous prenons en charge et ce qu’elle paie.</p><p className="project-example-disclaimer">Exemple entièrement fictif : Camille et son salon ne représentent pas un client réel.</p></div>
        </header>
        <ol className="project-example-steps">
          {projectSteps.map((step, index) => (
            <li key={step.title}>
              <div className="project-example-number" aria-hidden="true">0{index + 1}</div>
              <div className="project-example-card">
                <h3>{step.title}</h3>
                <dl><div><dt>CÔTÉ CLIENT</dt><dd>{step.client}</dd></div><div><dt>CÔTÉ ZELYWEB</dt><dd>{step.zelyweb}</dd></div><div className="project-example-payment"><dt>PAIEMENT & CONDITIONS</dt><dd>{step.payment}</dd></div></dl>
              </div>
            </li>
          ))}
        </ol>
        <div className="project-example-footer"><p>Les délais supposent de disposer des informations, validations et accès nécessaires. Toute demande hors périmètre est chiffrée avant intervention.</p><div><Link href="/conseils/checklist-avant-mise-en-ligne-site">La checklist avant publication ↗</Link><Link href="/conditions-generales">Les conditions détaillées ↗</Link></div></div>
      </div>
    </section>
  );
}
