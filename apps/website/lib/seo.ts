import type { Metadata } from "next";
import { brand } from "@/config/brand.config";
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
    },
    twitter: { card: "summary", title, description },
  };
}
