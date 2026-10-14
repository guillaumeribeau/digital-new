import { brand } from "@/config/brand.config";
import { ProjectJourney } from "@/components/sections/project-journey";
import { HomeContent } from "@/components/sections/home-content";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Découvrez votre futur site avant de payer",
  `Sites vitrines clé en main pour artisans, commerçants et indépendants. Première proposition gratuite. Création à ${brand.pricing.creation} € HT, gestion à ${brand.pricing.monthly} € HT/mois.`,
  "/",
);
import "@/styles/home.css";
import { Hero } from "@/components/sections/hero";
export default function Home() {
  return (
    <div className="home-redesign">
      <Hero />
      <ProjectJourney />
      <HomeContent />
    </div>
  );
}
