import { Gallery } from "@/components/sections/gallery";
import { FinalCTA } from "@/components/sections/final-cta";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Exemples — Neuf vrais sites de démonstration",
  "Explorez neuf sites vitrines : artisanat, commerce, conseil, bien-être, association, restaurant, photographie et automobile. Des univers lumineux et sombres. Des entreprises fictives, de véritables sites.",
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
          <span>09 MÉTIERS / 09 UNIVERS</span>
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
            Ces neuf entreprises sont fictives. Les photographies sont
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
