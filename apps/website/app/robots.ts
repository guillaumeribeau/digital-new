import type { MetadataRoute } from "next";
import { brand } from "@/config/brand.config";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      ...(brand.domain ? { allow: "/", disallow: "/api/" } : { disallow: "/" }),
    },
    ...(brand.domain
      ? { sitemap: brand.domain.replace(/\/$/, "") + "/sitemap.xml" }
      : {}),
  };
}
