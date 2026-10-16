import type { Metadata } from "next";
import { brand } from "@/config/brand.config";
export const socialImage = {
  url: "/brand/zelyweb-partage.png",
  width: 1200,
  height: 630,
  alt: "Zelyweb — Création de sites vitrines partout en France. Voyez votre site avant de payer. Aperçu de démonstration fictive.",
};
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    ...(brand.domain ? { alternates: { canonical: path } } : {}),
    openGraph: {
      title: title + " | " + brand.name,
      description,
      ...(brand.domain ? { url: brand.domain + path } : {}),
      type: "website",
      locale: "fr_FR",
      siteName: brand.name,
      images: [socialImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}
