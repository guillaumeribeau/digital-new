import type { MetadataRoute } from "next";
import { tadapo } from "@tadapo/lib/config";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, ...(tadapo.indexable ? { sitemap: tadapo.domain + "/sitemap.xml" } : {}) };
}
