import { brand } from "@/config/brand.config";
import { ProjectJourney } from "@/components/sections/project-journey";
import { HomeContent } from "@/components/sections/home-content";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Création de site vitrine : voyez avant de payer",
  `Professionnels partout en France : découvrez votre site vitrine complet avant de payer. Création ${brand.pricing.creation} € HT + abonnement requis ${brand.pricing.monthly} € HT/mois à la mise en ligne.`,
  "/",
);
import "@/styles/home.css";
import { Hero } from "@/components/sections/hero";
export default function Home() {
  return (
    <div className="home-redesign">
      {brand.domain && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${brand.domain}/#organization`,
              name: brand.name,
              legalName: brand.legalIdentity.companyName,
              url: brand.domain,
              logo: new URL("/pics/Logo moderne zelyweb fond transparent.png", brand.domain).href,
              email: brand.contactEmail,
              vatID: brand.legalIdentity.vatNumber,
              description: "Création de sites vitrines pour les professionnels partout en France. Première version complète présentée gratuitement avant commande, accompagnement à distance.",
              knowsLanguage: "fr",
              contactPoint: {
                "@type": "ContactPoint",
                email: brand.contactEmail,
                contactType: "customer service",
                availableLanguage: "French",
                areaServed: "FR",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Hero />
      <ProjectJourney />
      <HomeContent />
    </div>
  );
}
