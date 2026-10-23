import { business } from "@nova/shared/business";
export const tadapo = {
  name: "Tadapo", domain: (process.env.NEXT_PUBLIC_TADAPO_SITE_URL || "https://tadapo.com").replace(/\/$/, ""),
  indexable: process.env.NEXT_PUBLIC_TADAPO_INDEXABLE === "true",
  contact: process.env.TADAPO_CONTACT_EMAIL || business.email,
};
