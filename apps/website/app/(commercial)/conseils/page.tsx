import { ArrowUpRight } from "lucide-react";
import Link from "@/components/ui/tracked-link";
import { CTA } from "@/components/ui/cta";
import { adviceArticles, advicePath } from "@/content/advice";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Conseils pour préparer votre site vitrine professionnel",
  "Budget, domaine, contenus, publication et visibilité sur Google : des guides simples pour préparer le site internet de votre petite entreprise avec Zelyweb.",
  "/conseils",
);

export default function AdviceIndex() {
  return (
    <>
      <section className="container advice-intro">
        <p className="eyebrow">LES CONSEILS ZELYWEB</p>
        <h1>Votre site commence<br /><span>par les bonnes questions.</span></h1>
        <p>Quel budget prévoir ? Quel domaine choisir ? Comment préparer la publication et comprendre votre visibilité sur Google ? Des guides concrets pour avancer, sans avoir à parler technique.</p>
      </section>
      <section className="container advice-library" aria-labelledby="guides-title">
        <div className="advice-library-heading">
          <h2 id="guides-title">{adviceArticles.length} guides pour avancer.</h2>
          <span>DE L’IDÉE À LA VIE DU SITE</span>
        </div>
        <div className="advice-cards">
          {adviceArticles.map((article, index) => (
            <Link className="advice-card" href={advicePath(article.slug)} key={article.slug}>
              <div className="advice-card-top"><span>{String(index + 1).padStart(2, "0")}</span><ArrowUpRight size={25} aria-hidden="true" /></div>
              <p className="eyebrow">{article.category}</p>
              <h3>{article.title}</h3>
              <p className="advice-card-description">{article.description}</p>
              <span className="advice-card-link">Lire le guide <ArrowUpRight size={17} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="advice-invitation">
        <div className="container">
          <div><p className="eyebrow">UNE IDÉE EN TÊTE ?</p><h2>Parlons de votre activité.</h2><p>Quelques informations suffisent pour préparer une première proposition gratuite. Vous la découvrez avant de décider de commander.</p></div>
          <CTA placement="page">Découvrir mon futur site</CTA>
        </div>
      </section>
    </>
  );
}
