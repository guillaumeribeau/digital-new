import type { Metadata } from "next";
import { TadapoHeader } from "@tadapo/components/header";
import { TadapoFooter } from "@tadapo/components/footer";
import { AnimatedHero } from "@tadapo/components/animated-hero";
import { BenefitsSection, FAQSection, FinalCTA } from "@tadapo/components/home-sections";
import { HowItWorks } from "@tadapo/components/process-section";
import { GuidedTour } from "@tadapo/components/guided-tour";
import { ApproachComparison, ClosingChoices, ContactSection, ExistingSiteBanner, ProjectLandmarks } from "@tadapo/components/commercial-sections";
import { WebsiteShowcase } from "@tadapo/components/showcase";
import { PricingSection } from "@tadapo/components/pricing";
import { Motion } from "@tadapo/components/motion";
import { tadapo } from "@tadapo/lib/config";
import { StickyOffer } from "@tadapo/components/sticky-offer";
import { DomainHostingSection } from "@tadapo/components/domain-hosting";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return <><TadapoHeader /><main id="main"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Tadapo", url: tadapo.domain, inLanguage: "fr-FR" }).replace(/</g, "\\u003c") }} /><AnimatedHero /><Motion><GuidedTour /><WebsiteShowcase /><ProjectLandmarks /><ApproachComparison /><HowItWorks /><PricingSection /><DomainHostingSection /><ExistingSiteBanner /><BenefitsSection /><ContactSection /><FAQSection /><ClosingChoices /><FinalCTA /></Motion></main><TadapoFooter /><StickyOffer /></>;
}
