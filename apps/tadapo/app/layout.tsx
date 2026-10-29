import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { tadapo } from "@tadapo/lib/config";
import "../styles/globals.css";
import "../styles/commercial.css";
import "../styles/legal.css";
import "../styles/how.css";
import "../styles/animation.css";
import "../styles/demo-previews.css";
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-tadapo-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-tadapo-body", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(tadapo.domain),
  title: { default: "Tadapo — Votre site pro, 0 € de frais de création", template: "%s | Tadapo" },
  description: "Votre site vitrine personnalisé par abonnement, dès 39 € HT/mois avec engagement 12 mois. Première version à valider sous 72 h ouvrées, dossier complet et paiement reçus.",
  openGraph: { type: "website", locale: "fr_FR", siteName: "Tadapo", title: "Tadapo ! Et votre site prend vie.", description: "0 € de frais de création. Un abonnement, un site qui vous ressemble.", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
  robots: { index: tadapo.indexable, follow: true },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body className={`${display.variable} ${body.variable}`}><a className="skip-link" href="#main">Aller au contenu</a>{children}</body></html>;
}
