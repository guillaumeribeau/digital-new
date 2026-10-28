import { type Brand } from "@nova/shared/brands";
import { tadapoEmailHtml } from "@nova/shared/tadapo-mail";
import { billingNoticeEmail } from "./site-billing-shared";

export function quoteEmailHtml(brand: Brand, name: string, subject: string, text: string, url: string) {
  return brand === "tadapo" ? tadapoEmailHtml(name, subject, text, url, "Consulter mon devis Tadapo")
    : billingNoticeEmail(name, subject, text, url, "Consulter mon devis Zelyweb");
}
