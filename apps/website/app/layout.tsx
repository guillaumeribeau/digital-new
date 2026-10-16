import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { brand } from "@/config/brand.config";
import { socialImage } from "@/lib/seo";
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
    default: brand.name + " — Création de site vitrine, voyez avant de payer",
    template: "%s | " + brand.name,
  },
  description: `Création de sites vitrines pour les professionnels partout en France. Voyez votre site avant de payer : ${brand.pricing.creation} € HT à la commande, puis abonnement requis à ${brand.pricing.monthly} € HT/mois à la publication.`,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: brand.name,
    title: brand.name + " — Votre futur site. Vous le voyez. Vous décidez.",
    description: brand.tagline,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name + " — Votre site internet clé en main",
    description: brand.tagline,
    images: [socialImage],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  robots: brand.domain
    ? { index: true, follow: true, googleBot: { "max-image-preview": "large" } }
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
