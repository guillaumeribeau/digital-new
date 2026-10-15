import { brand } from "@/config/brand.config";
import Link from "next/link";
import Image from "next/image";
import "@/styles/offer-onepage.css";
import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import { PageIntro } from "@/components/ui/page-intro";
import { Pricing } from "@/components/sections/pricing";
import { FinalCTA } from "@/components/sections/final-cta";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Notre offre — Un site vitrine clé en main",
  `Un site professionnel de cinq pages, adapté au mobile. Création à ${brand.pricing.creation} € HT, (358,80 € TTC), hébergement et gestion à ${brand.pricing.monthly} € HT/mois (34,80 € TTC). Découvrez le périmètre.`,
  "/notre-offre",
);
export default function Offer() {
  return (
    <>
      <PageIntro
        label="L’OFFRE, SANS PETITES LIGNES CACHÉES"
        title="Tout ce qu’il faut."
        accent="Rien de compliqué."
        description="Un site vitrine pour présenter votre activité, inspirer confiance et faciliter le premier contact. Nous créons. Nous mettons en ligne. Nous gérons la technique."
      />

      <section className="offer-onepage" aria-labelledby="onepage-title">
        <div className="container offer-onepage-grid">
          <div className="offer-onepage-visual">
            <div className="offer-onepage-visual-label">
              <span>CINQ PAGES. VOTRE ACTIVITÉ.</span>
              <span>DESKTOP + MOBILE</span>
            </div>
            <div className="offer-onepage-composition">
              <Link
                href="/exemples/plombier"
                className="offer-onepage-desktop"
                aria-label="Explorer le site de démonstration Atelier Martin Plomberie"
              >
                <Image
                  src="/examples/previews/plombier-desktop.webp"
                  width={1440}
                  height={1000}
                  alt="Capture réelle du site fictif Atelier Martin Plomberie : présentation des services et photographie de salle de bains"
                  sizes="(max-width: 900px) 85vw, 45vw"
                />
              </Link>
              <Link
                href="/exemples/plombier"
                className="offer-onepage-mobile"
                aria-label="Voir la version mobile d’Atelier Martin Plomberie"
              >
                <Image
                  src="/examples/previews/plombier-mobile.webp"
                  width={390}
                  height={844}
                  alt="Version mobile de la même démonstration de plomberie"
                  sizes="(max-width: 767px) 25vw, 12vw"
                />
              </Link>
              <span className="offer-onepage-note">
                Votre métier.
                <br />
                <strong>Votre première impression.</strong>
                <ArrowUpRight size={20} />
              </span>
            </div>
            <div className="offer-onepage-caption">
              <div>
                <span>ARTISAN PLOMBIER · EXEMPLE FICTIF</span>
                <p>Atelier Martin Plomberie</p>
              </div>
              <Link
                href="/exemples/plombier"
                aria-label="Parcourir la démonstration de plomberie"
              >
                <ArrowUpRight size={23} />
              </Link>
            </div>
            <p className="offer-onepage-disclaimer">
              Aperçus capturés depuis notre démonstration. Aucun client réel
              n’est présenté.
            </p>
          </div>
          <div className="offer-onepage-copy">
            <p className="eyebrow">LE BON FORMAT POUR VOTRE ACTIVITÉ</p>
            <h2 id="onepage-title">
              Cinq pages.
              <br />
              <span>La bonne impression.</span>
            </h2>
            <p className="offer-onepage-lead">
              Tout ce que vos futurs clients ont besoin de savoir, dans cinq pages
              qu’ils ont envie de parcourir.
            </p>
            <p className="offer-onepage-description">
              Nous adaptons le design à votre métier et organisons vos contenus
              pour une lecture fluide, sur ordinateur, tablette et téléphone.
            </p>
            <div className="offer-onepage-content">
              {[
                [
                  "Vous découvrir",
                  "Votre identité, votre activité et ce qui vous distingue.",
                ],
                [
                  "Comprendre vos services",
                  "Vos prestations présentées clairement, avec des visuels adaptés.",
                ],
                [
                  "Vous contacter",
                  "Vos coordonnées et un moyen simple de faire le premier pas.",
                ],
              ].map(([title, text], index) => (
                <div key={title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="offer-onepage-link" href="/exemples">
              Explorer les 6 univers <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LE PÉRIMÈTRE DE VOTRE PROJET</p>
            <h2>Nous posons les choses.</h2>
          </div>
        </div>
        <div className="scope-grid">
          <article className="scope-card included">
            <Check />
            <h3>Ce qui est inclus</h3>
            <ul>
              {[
                "Cinq pages : Accueil, À propos, Services, Réalisations, Contact",
                "Un design adapté à votre activité",
                "Un affichage mobile et tablette",
                "La présentation de vos services",
                "Vos coordonnées et moyens de contact",
                "Un formulaire de contact",
                "Les fondamentaux techniques du référencement",
                "Textes et visuels préparés à partir de votre activité",
                "Trois séries de retours sous 30 jours après paiement",
                "Mentions légales et confidentialité intégrées à partir de vos informations",
                "Une première version complète sous sept jours ouvrés",
              ].map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </article>
          <article className="scope-card">
            <X />
            <h3>Ce qui n’est pas inclus</h3>
            <ul>
              {[
                "Une boutique e-commerce",
                "Un espace client ou une plateforme métier",
                "Un site avec de nombreuses pages",
                "Une campagne publicitaire",
                "Une garantie de classement Google",
                "La création d’un logo ou une séance photo",
              ].map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </article>
          <article className="scope-card">
            <Plus />
            <h3>Les options, sur demande</h3>
            <p>
              Un besoin différent ? Nous pouvons étudier les contenus
              supplémentaires, les pages additionnelles ou une fonctionnalité
              spécifique.
            </p>
            <p>
              Leur faisabilité et leur prix font l’objet d’une proposition
              distincte, validée avant commande. Aucun supplément obligatoire
              n’est ajouté ici.
            </p>
          </article>
        </div>
        <div className="pending-box">
          <span className="eyebrow">VOTRE COLLABORATION AVEC ZELYWEB</span>
          <h3>Vous découvrez. Vous validez. Nous ajustons.</h3>
          <p>La première version complète est gratuite sur aperçu privé. Après acceptation, vous réglez la création, puis nous réalisons jusqu’à trois séries de retours regroupés dans les 30 jours. Les textes, photos, couleurs et ajustements de présentation sont inclus ; les nouvelles fonctionnalités sont chiffrées séparément.</p>
          <p>L’abonnement commence à la publication. À votre départ, les fichiers et le code de transfert du domaine sont remis gratuitement. La migration technique par Zelyweb est facultative : 150 € HT, soit 180 € TTC.</p>
          <Link href="/conditions-generales">Lire les conditions de l’offre</Link>
        </div>
      </section>
      <Pricing />
      <FinalCTA />
    </>
  );
}
