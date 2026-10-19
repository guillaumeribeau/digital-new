import type { Prisma, Quote } from "@nova/database";
import { business } from "@nova/shared/business";
import { paymentMode, publicOrigin, seal, sender } from "./commercial-core";
import { billingMoney, billingNoticeEmail } from "./site-billing-shared";

/** Queue in the business transaction so a confirmed step cannot lose its notice. */
export async function queueOwnerNotification(tx: Prisma.TransactionClient, input: {
  siteOrderId?: string; quoteId?: string; key: string; mode: string; subject: string; text: string; path: string; replyTo: string;
}) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.key}))`;
  if (await tx.commercialWebhook.findUnique({ where: { key: input.key } })) return;
  const subject = `${input.mode === "TEST" ? "[TEST] " : input.mode === "LOCAL" ? "[SIMULATION] " : ""}${input.subject}`;
  const url = new URL(input.path, publicOrigin()).href;
  await tx.commercialEmail.create({ data: {
    siteOrderId: input.siteOrderId, quoteId: input.quoteId, kind: "SITE_OWNER_NOTICE", expiresAt: new Date(Date.now() + 23 * 3600000),
    payloadEncrypted: seal({ from: sender(), to: [business.email], reply_to: input.replyTo, subject,
      text: `${input.text}\n\nOuvrir le suivi dans l’admin : ${url}`,
      html: billingNoticeEmail("Guillaume", subject, input.text, url, "Ouvrir le suivi dans l’admin"),
    }),
  } });
  await tx.commercialWebhook.create({ data: { key: input.key, provider: "INTERNAL" } });
}

export async function queueQuoteOwnerNotification(tx: Prisma.TransactionClient,
  quote: Pick<Quote, "id" | "leadId" | "number" | "totalCents">,
  kind: string, subject: string, text: string, mode = paymentMode()) {
  const lead = await tx.lead.findUniqueOrThrow({ where: { id: quote.leadId }, select: { fullName: true, businessName: true, email: true } });
  await queueOwnerNotification(tx, {
    quoteId: quote.id, key: `quote-owner/${quote.id}/${kind}`, mode, subject,
    text: `${lead.businessName} · ${lead.fullName}\nDevis ${quote.number} · ${billingMoney(quote.totalCents)} TTC\n\n${text}`,
    path: `/devis/${quote.id}`, replyTo: lead.email,
  });
}
