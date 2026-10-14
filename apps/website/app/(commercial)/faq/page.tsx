import { PageIntro } from "@/components/ui/page-intro";
import { FAQList } from "@/components/sections/faq-list";
import { FinalCTA } from "@/components/sections/final-cta";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "FAQ — Vos questions, nos réponses",
  "Prix, abonnement, nom de domaine, modifications, délais : comprenez notre offre de site vitrine clé en main avant de décider.",
  "/faq",
);
export default function FAQ() {
  return (
    <>
      <PageIntro
        label="ON PREND LE TEMPS DE VOUS RÉPONDRE"
        title="Tout simplement."
        accent="Tout comprendre."
        description="Les bonnes questions méritent des réponses claires. Voici ce qu’il faut savoir avant de nous confier votre projet."
      />
      <section className="container faq-page">
        <FAQList />
        <div className="pending-box">
          <span className="eyebrow">EN TOUTE TRANSPARENCE</span>
          <p>
            Certaines modalités commerciales sont encore à définir. Elles seront
            présentées et validées avant toute commande. Aucun engagement
            contractuel ne résulte d’une simple demande de démonstration.
          </p>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
