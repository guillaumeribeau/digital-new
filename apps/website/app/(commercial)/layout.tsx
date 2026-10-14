import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Consent } from "@/components/consent";
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
              name: brand.name,
              url: brand.domain,
              inLanguage: "fr-FR",
              description: brand.tagline,
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <main id="main">{children}</main>
      <Footer />
      <Consent />
    </>
  );
}
