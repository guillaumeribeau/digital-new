import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Consent } from "@/components/consent";
import { CrispChat } from "@/components/crisp-chat";
import { brand } from "@/config/brand.config";
export default function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {brand.domain && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${brand.domain}/#website`,
              name: brand.name,
              url: brand.domain,
              inLanguage: "fr-FR",
              description: brand.tagline,
              publisher: { "@id": `${brand.domain}/#organization` },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <main id="main">{children}</main>
      <Footer />
      <Consent />
      <CrispChat />
    </>
  );
}
