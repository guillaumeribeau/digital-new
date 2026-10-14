import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { brand } from "@/config/brand.config";
import "@/styles/globals.css";
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
export const metadata: Metadata = {
  ...(brand.domain ? { metadataBase: new URL(brand.domain) } : {}),
  title: {
    default: brand.name + " — Découvrez votre futur site avant de payer",
    template: "%s | " + brand.name,
  },
  description: `Votre site internet clé en main : découvrez une proposition gratuite, puis décidez. Création à ${brand.pricing.creation} € HT et gestion technique à ${brand.pricing.monthly} € HT par mois.`,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: brand.name,
    title: brand.name + " — Votre futur site. Vous le voyez. Vous décidez.",
    description: brand.tagline,
  },
  twitter: {
    card: "summary",
    title: brand.name + " — Votre site internet clé en main",
    description: brand.tagline,
  },
  icons: { icon: "/favicon.svg" },
  robots: brand.domain
    ? { index: true, follow: true }
    : { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={display.variable + " " + body.variable}>
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
