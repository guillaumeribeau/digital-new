import { LeadVerification } from "@/components/lead-verification";
import type { Metadata } from "next";
import { turnstileConfig } from "@/lib/anti-bot";
import "@/styles/lead-form.css";
export const metadata: Metadata = {
  title: "Confirmer votre demande — NOVA",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export default function VerificationPage() {
  const config = turnstileConfig();
  return <LeadVerification antiBot={config ? { siteKey: config.siteKey, testMode: config.testMode } : null} />;
}
