import { LeadForm } from "@/components/lead-form";
import { pipelineConfigured } from "@/lib/lead-security";
import { pageMetadata } from "@/lib/seo";
import { turnstileConfig } from "@/lib/anti-bot";
export const metadata = pageMetadata(
  "Demander mon site — Première proposition gratuite",
  "Parlez-nous de votre activité. Nous imaginons votre futur site et vous découvrez une première proposition avant de commander.",
  "/demander-mon-site",
);
export const dynamic = "force-dynamic";
export default function RequestPage() {
  const config = turnstileConfig();
  return (
    <section className="container form-page">
      <LeadForm enabled={pipelineConfigured()} antiBot={config ? { siteKey: config.siteKey, testMode: config.testMode } : null} />
    </section>
  );
}
