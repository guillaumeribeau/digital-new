import type { MetadataRoute } from "next";
import { brand } from "@/config/brand.config";
import { adviceArticles, advicePath } from "@/content/advice";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!brand.domain) return [];
  return [
    "/",
    "/notre-offre",
    "/exemples",
    "/comment-ca-marche",
    "/faq",
    "/demander-mon-site",
    "/conseils",
    ...adviceArticles.map(({ slug }) => advicePath(slug)),
    "/conditions-generales",
    "/mentions-legales",
    "/politique-confidentialite",
    "/cookies",
  ].map((path) => ({
    url: brand.domain.replace(/\/$/, "") + path,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
