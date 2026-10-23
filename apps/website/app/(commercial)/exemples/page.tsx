import { Gallery } from "@/components/sections/gallery";
import { FinalCTA } from "@/components/sections/final-cta";
import { pageMetadata } from "@/lib/seo";
import { examples } from "@/lib/examples";
export const metadata = pageMetadata(
  "Exemples — 14 sites de démonstration à explorer",
  "Explorez 14 sites vitrines fictifs. Filtrez par secteur, métier et ambiance, puis classez les exemples pour trouver le style de votre futur site.",
  "/exemples",
);
export default function Examples() {
  return (
    <>
      <section className="container portfolio-intro">
        <div className="portfolio-intro-top">
          <p className="eyebrow">
            <span aria-hidden="true">✳︎</span> LES POSSIBILITÉS PRENNENT VIE
          </p>
          <span>{examples.length} MÉTIERS / {examples.length} UNIVERS</span>
        </div>
        <h1>
          Le vôtre pourrait
          <br />
          <span>ressembler à ça.</span>
        </h1>
        <div className="portfolio-intro-bottom">
          <p>
            De vrais sites à parcourir. Des identités qui changent.
            <br />
            Trouvez celle dans laquelle vous vous projetez.
          </p>
          <span>
            DES SITES VITRINES ONE-PAGE
            <br />
            PENSÉS POUR LES PETITES ENTREPRISES
          </span>
        </div>
      </section>
      <section className="container portfolio-gallery-page">
        <div className="portfolio-disclaimer">
          <span>POUR VOUS INSPIRER</span>
          <p>
            Ces entreprises sont fictives. Les photographies sont
            illustratives et les formulaires n’envoient aucun message. Les
            aperçus sont capturés depuis les sites que vous pouvez explorer.
          </p>
        </div>
        <h2 className="sr-only">Les sites de démonstration par métier</h2>
        <Gallery />
      </section>
      <FinalCTA />
    </>
  );
}
