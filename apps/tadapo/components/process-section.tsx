import Link from "next/link";
import { ArrowUpRight, Check, Globe2, LockKeyhole, MousePointer2, Sparkles } from "lucide-react";
import { tadapoMoney, tadapoOffer } from "@nova/shared/tadapo";
import { demos } from "@tadapo/lib/demos";
import { SitePreview } from "./site-preview";

export function ProcessIllustration({ scene }: { scene: number }) {
  const offer = tadapoOffer("business", "12");
  return <div className={`process-illustration process-scene-${scene}`} aria-hidden="true">
    {scene === 0 && <><div className="process-mini-form"><span className="mini-form-eyebrow">VOTRE FUTUR SITE</span><strong>Racontez-nous votre activité.</strong><div>Nom de votre entreprise <span>Atelier Martin</span></div><div>Votre métier <span>Artisan électricien</span></div><div className="mini-form-progress"><i /><i /><i /><i /></div></div><span className="process-float float-one">Formule Business <Check size={13} /></span><span className="process-float float-two"><MousePointer2 size={14} /> Quelques questions, simplement</span></>}
    {scene === 1 && <><div className="process-checkout"><div><LockKeyhole size={20} /><span>Votre premier mois</span></div><strong>{tadapoMoney(offer.htCents)} € <small>HT</small></strong><p>Site Business · engagement 12 mois</p><div className="mini-card-number">•••• •••• •••• 4242</div><span className="mini-checkout-button">Valider ma commande <ArrowUpRight size={13} /></span></div><span className="process-float float-one"><LockKeyhole size={13} /> Paiement sécurisé</span><span className="process-float float-two">0 € de frais de création</span></>}
    {scene === 2 && <><div className="process-demo"><SitePreview demo={demos[0]} /></div><span className="process-float float-one"><Sparkles size={13} /> Votre première version</span><span className="process-float float-two"><Check size={14} /> À découvrir et à valider par vous</span></>}
    {scene === 3 && <><div className="process-published"><div className="published-address"><LockKeyhole size={12} /> votre-entreprise.fr</div><Globe2 size={65} strokeWidth={1} /><strong>Votre nouvelle adresse<br />est prête à vivre.</strong><span><Check size={13} /> Ordinateur + mobile</span></div><span className="process-float float-one">Après votre validation <Check size={13} /></span><span className="process-float float-two">Et on continue de vous accompagner</span></>}
  </div>;
}

export const processSteps = [
  { title: "Votre formule. Votre activité.", label: "Formule et questionnaire", description: "Essentiel ou Business, avec ou sans engagement. Présentez votre entreprise, vos services et vos envies dans un questionnaire guidé.", note: "Un récapitulatif clair avant de vous engager." },
  { title: "Vous confirmez le départ.", label: "Commande et premier mois", description: "Vous relisez votre offre et les conditions, puis réglez votre premier mois. La création est à 0 € : votre abonnement finance votre nouveau site.", note: "Le premier mois est réglé sur Stripe à la fin du questionnaire." },
  { title: "Votre site prend forme.", label: "Création et validation", description: "Nous préparons une première version à vos couleurs sous 72 h ouvrées après réception du paiement et d’un dossier complet. Vous la découvrez et nous faites vos retours.", note: "Vous validez la direction avant la publication." },
  { title: "Une belle adresse. Et la suite.", label: "Publication et accompagnement", description: "Après vos retours et votre validation, le site est publié sur votre domaine. Hébergement, maintenance et modifications mensuelles suivent selon votre formule.", note: "1 modification par mois avec Essentiel, 3 avec Business." },
];

export function HowItWorks() {
  return <section id="comment-ca-marche" className="process-section t-section"><div className="t-container">
    <div className="section-heading process-heading reveal"><p className="t-eyebrow">VOUS SAVEZ TOUJOURS OÙ VOUS EN ÊTES</p><h2>De votre idée à votre site.<br /><span>En quatre étapes très concrètes.</span></h2><p>Un parcours simple, une première version à valider,<br />puis un site que l’on fait vivre avec vous.</p></div>
    <div className="process-track" aria-hidden="true"><i />{processSteps.map((step, index) => <span key={step.label}>{index + 1}</span>)}</div><ol className="process-grid">{processSteps.map((step, index) => <li className={`process-card process-card-${index + 1} reveal`} key={step.label}><div className="process-card-top"><span>0{index + 1}</span><span>{step.label}</span></div><ProcessIllustration scene={index} /><h3>{step.title}</h3><p>{step.description}</p><div className="process-note"><Check size={14} /><span>{step.note}</span></div></li>)}</ol>
    <div className="process-bottom"><p>Les 72 h ouvrées concernent la première version à valider, avant vos retours et la mise en ligne. Les week-ends et jours fériés sont exclus. Illustrations du parcours : aucune opération de paiement n’est réalisée ici.</p><Link className="t-button" href="/comment-ca-marche">Voir toutes les étapes en détail <ArrowUpRight size={18} /></Link></div>
  </div></section>;
}
