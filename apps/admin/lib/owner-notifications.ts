import { type Brand, brandOf, brands } from "@nova/shared/brands";
import { tadapoEmailHtml } from "@nova/shared/tadapo-mail";
import type { Prisma, Quote } from "@nova/database";
import { paymentMode, publicOrigin, seal, sender } from "./commercial-core";
import { billingMoney, billingNoticeEmail } from "./site-billing-shared";

/** Queue in the business transaction so a confirmed step cannot lose its notice. */
export async function queueOwnerNotification(tx: Prisma.TransactionClient, input: {
  brand?: Brand; siteOrderId?: string; quoteId?: string; key: string; mode: string; subject: string; text: string; path: string; replyTo: string;
}) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.key}))`;
  if (await tx.commercialWebhook.findUnique({ where: { key: input.key } })) return;
  const brand = input.brand || "zelyweb";
  const subject = `${input.mode === "TEST" ? "[TEST] " : input.mode === "LOCAL" ? "[SIMULATION] " : ""}${input.subject}`;
  const url = new URL(input.path, publicOrigin()).href;
  await tx.commercialEmail.create({ data: {
    brand, siteOrderId: input.siteOrderId, quoteId: input.quoteId, kind: "SITE_OWNER_NOTICE", expiresAt: new Date(Date.now() + 23 * 3600000),
    payloadEncrypted: seal({ from: sender(brand), to: [brands[brand].email], reply_to: input.replyTo, subject,
      text: `${input.text}\n\nOuvrir le suivi dans l’admin : ${url}`,
      html: brand === "tadapo" ? tadapoEmailHtml("Guillaume", subject, input.text, url, "Ouvrir le suivi dans l’admin") : billingNoticeEmail("Guillaume", subject, input.text, url, "Ouvrir le suivi dans l’admin"),
    }),
  } });
  await tx.commercialWebhook.create({ data: { key: input.key, provider: "INTERNAL" } });
}

export async function queueQuoteOwnerNotification(tx: Prisma.TransactionClient,
  quote: Pick<Quote, "id" | "leadId" | "number" | "totalCents">,
  kind: string, subject: string, text: string, mode?: string) {
  const lead = await tx.lead.findUniqueOrThrow({ where: { id: quote.leadId }, select: { brand: true, fullName: true, businessName: true, email: true } });
  await queueOwnerNotification(tx, {
    brand: brandOf(lead.brand), quoteId: quote.id, key: `quote-owner/${quote.id}/${kind}`, mode: mode || paymentMode(brandOf(lead.brand)), subject,
    text: `${lead.businessName} · ${lead.fullName}\nDevis ${quote.number} · ${billingMoney(quote.totalCents)} TTC\n\n${text}`,
    path: `/devis/${quote.id}`, replyTo: lead.email,
  });
}
