import Link from "@/components/ui/tracked-link";
import { DemoMotion } from "@/components/examples/demo-motion";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "@/styles/examples.css";
import "@/styles/examples-dark.css";
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--example-serif",
  display: "swap",
});
const sans = Manrope({
  subsets: ["latin"],
  variable: "--example-sans",
  display: "swap",
});
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={"example-shell " + serif.variable + " " + sans.variable}>
      <aside
        className="example-banner"
        aria-label="Information sur la démonstration"
      >
        <Link href="/exemples">Retour à la galerie</Link>
        <p>
          Site de démonstration <span>· Entreprise fictive</span>
        </p>
        <span className="example-banner-tag">ONE-PAGE</span>
      </aside>
      <main id="main">
        <DemoMotion>{children}</DemoMotion>
      </main>
    </div>
  );
}
