import Image from "next/image";
import Link from "@/components/ui/tracked-link";
import {
  ArrowUpRight,
  Globe,
  Server,
  Wrench,
  PenTool,
} from "lucide-react";
import { Reveal } from "../animations/reveal";
import { Gallery } from "./gallery";
import { Pricing } from "./pricing";
import { FAQList } from "./faq-list";
import { FinalCTA } from "./final-cta";
export function HomeContent() {
  return (
    <>
      <section id="votre-site" className="nh-section nh-intro">
        <div className="container nh-intro-grid">
          <Reveal>
            <p className="nh-kicker">01 / VOTRE MÉTIER, AU PREMIER PLAN</p>
            <h2>
              Vous avez le
              <br />
              savoir-faire.
              <br />
              <span>Montrons-le.</span>
            </h2>
            <p className="nh-lead">
              Vos clients doivent comprendre en quelques secondes ce que vous
              faites, ce qui vous distingue et comment vous contacter.
            </p>
            <p className="nh-body">
              Artisans, commerçants, professions libérales, indépendants ou
              entreprises : votre site vitrine rassemble l’essentiel de votre
              activité dans cinq pages claires, soignées et faciles à consulter.
              Nous vous accompagnons à distance, partout en France, avec un
              interlocuteur direct pour vos textes, vos visuels et la mise en ligne.
            </p>
            <Link className="nh-inline-link" href="/notre-offre">
              Découvrir ce qui est inclus <ArrowUpRight size={19} />
            </Link>
          </Reveal>
          <Reveal className="nh-intro-visual">
            <div className="nh-intro-photo">
              <Image
                src="/examples/coiffure/hero.jpg"
                alt="Un salon contemporain, photographie d’illustration utilisée dans notre démonstration Maison Camille"
                fill
                sizes="(max-width: 767px) 90vw, 43vw"
              />
            </div>
            <div className="nh-photo-caption">
              <span>UNE ACTIVITÉ. UN UNIVERS.</span>
              <Link href="/exemples/coiffure">
                Maison Camille · Exemple fictif <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="nh-intro-note">
              <span aria-hidden="true">✳︎</span>
              <p>
                Le premier contact
                <br />
                commence souvent <b>ici.</b>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="nh-services nh-section">
        <div className="container">
          <div className="nh-heading">
            <div>
              <p className="nh-kicker">02 / UNE SOLUTION COMPLÈTE</p>
              <h2>
                Un site bien pensé.
                <br />
                <span>La technique en moins.</span>
              </h2>
            </div>
            <p>
              Un interlocuteur pour votre projet.
              <br />
              Du premier échange à la mise en ligne.
            </p>
          </div>
          <div className="nh-service-grid">
            <Reveal className="nh-service-showcase">
              <div className="nh-service-tag">
                <span>À L’AISE SUR TOUS LES ÉCRANS</span>
                <ArrowUpRight size={20} />
              </div>
              <div className="nh-service-desktop">
                <Image
                  src="/examples/previews/bien-etre-desktop.webp"
                  width={1440}
                  height={1000}
                  alt="Démonstration Équilibre & Sens sur ordinateur"
                  sizes="(max-width:767px) 85vw, 40vw"
                />
              </div>
              <div className="nh-service-phone">
                <Image
                  src="/examples/previews/bien-etre-mobile.webp"
                  width={390}
                  height={844}
                  alt="La même démonstration adaptée au téléphone"
                  sizes="(max-width:767px) 26vw, 13vw"
                />
              </div>
              <Link href="/exemples/bien-etre">
                Équilibre & Sens · Exemple fictif <ArrowUpRight size={16} />
              </Link>
            </Reveal>
            <div className="nh-service-list">
              {[
                {
                  Icon: PenTool,
                  title: "Un design à votre image",
                  text: "Vos couleurs, votre activité, votre personnalité. Une présentation qui vous ressemble, sur ordinateur comme sur mobile.",
                },
                {
                  Icon: Globe,
                  title: "Votre adresse sur le web",
                  text: "Un domaine choisi ensemble, géré et payé par Zelyweb jusqu’à 20 € HT/an. Supplément annuel soumis à votre accord au-delà.",
                },
                {
                  Icon: Server,
                  title: "Un site prêt à être consulté",
                  text: "Nous préparons l’hébergement et la mise en ligne. Vous n’avez pas de serveur à choisir ou à configurer.",
                },
                {
                  Icon: Wrench,
                  title: "La gestion technique",
                  text: "Hébergement, domaine et une modification de 15 minutes maximum par mois. Après validation des ajustements, vous activez l’abonnement depuis un e-mail. Le premier mois est payé avant la mise en ligne, prévue sous 2 jours ouvrés si le domaine est prêt.",
                },
              ].map(({ Icon, title, text }, i) => (
                <Reveal className="nh-service-row" key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <Icon size={23} strokeWidth={1.4} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="nh-section nh-examples">
        <div className="container">
          <div className="nh-heading">
            <div>
              <p className="nh-kicker">04 / PAS UN STYLE. LE VÔTRE.</p>
              <h2>
                Des métiers différents.
                <br />
                <span>Des univers qui vous ressemblent.</span>
              </h2>
            </div>
            <p>
              Une sélection de nos démonstrations.
              <br />
              Explorez les pages, imaginez la vôtre.
            </p>
          </div>
          <Gallery compact />
          <div className="nh-gallery-end">
            <p>
              Neuf univers à découvrir.
              <br />
              <span>
                Des exemples fictifs, construits comme de vrais sites.
              </span>
            </p>
            <Link className="button dark" href="/exemples">
              Explorer les 9 exemples <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
      </section>
      <section className="nh-section nh-principles">
        <div className="container nh-principles-grid">
          <Reveal>
            <p className="nh-kicker">05 / UNE COLLABORATION SIMPLE</p>
            <h2>
              Le beau compte.
              <br />
              <span>La confiance aussi.</span>
            </h2>
            <p className="nh-lead">
              Pas besoin de parler technique pour avoir un site dont vous êtes
              fier.
            </p>
            <div className="nh-principle-mark" aria-hidden="true">
              ✳︎
            </div>
          </Reveal>
          <div className="nh-principle-list">
            {[
              [
                "Voir avant de choisir",
                "La première proposition est gratuite. Vous découvrez une direction concrète avant de décider de commander.",
              ],
              [
                "Savoir où vous allez",
                "Le prix, le périmètre et les conditions sont confirmés avant commande. Les options sont discutées avec vous.",
              ],
              [
                "Être accompagné",
                "Vos questions, vos contenus, vos envies : nous échangeons avec vous à chaque étape du projet.",
              ],
              [
                "Rester libre de décider",
                "La proposition vous plaît ? Nous préparons la suite ensemble. Vous restez libre de ne pas commander.",
              ],
            ].map(([title, text], i) => (
              <Reveal key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <Pricing />
      <section className="nh-section nh-faq">
        <div className="container nh-faq-grid">
          <div>
            <p className="nh-kicker">07 / LES RÉPONSES, SIMPLEMENT</p>
            <h2>
              Avant de
              <br />
              <span>vous lancer.</span>
            </h2>
            <p className="nh-body">
              Les questions que vous vous posez sont aussi les bonnes questions
              pour commencer.
            </p>
            <Link className="nh-inline-link" href="/faq">
              Toutes les réponses <ArrowUpRight size={19} />
            </Link>
          </div>
          <FAQList limit={4} />
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
