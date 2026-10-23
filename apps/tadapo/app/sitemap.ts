import type { MetadataRoute } from "next";
import { tadapo } from "@tadapo/lib/config";
export default function sitemap(): MetadataRoute.Sitemap {
  return tadapo.indexable ? ["/", "/comment-ca-marche", "/mentions-legales", "/conditions-generales", "/confidentialite", "/cookies", "/retractation", "/resiliation", "/domaine-hebergement", "/domaine-existant"].map(path => ({ url: tadapo.domain + path })) : [];
}
