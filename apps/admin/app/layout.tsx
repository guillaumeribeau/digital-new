import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
export const metadata: Metadata = { title: { default: "Administration Zelyweb", template: "%s | Zelyweb" }, robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body className={`${body.variable} ${display.variable}`}><a className="skip-link" href="#main">Aller au contenu</a>{children}</body></html>;
}
