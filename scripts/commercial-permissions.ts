import type { Client } from "pg";
export async function grantCommercialPermissions(db: Client, admin: string, worker: string) {
  if (![admin, worker].every((name) => /^[a-z_][a-z0-9_]{0,62}$/i.test(name))) throw new Error("INVALID_RUNTIME_ROLE");
  const a = `"${admin}"`, w = `"${worker}"`;
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "TadapoMail", "TadapoInboundEmail" TO ${a}`);
  await db.query(`GRANT SELECT, UPDATE ON "TadapoMail" TO ${w}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "SiteInboundEmail" TO ${a}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "TadapoOrder", "TadapoInvoice", "TadapoFeedback", "TadapoFile" TO ${a}`);
  await db.query(`GRANT INSERT ON "Lead" TO ${a}`);
  await db.query(`GRANT SELECT ("id", "projectId", "reviewVersion", "stage") ON "TadapoOrder" TO ${w}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "DomainOption", "DomainSelection", "ReviewRound", "ReviewMessage", "ReviewFile", "FinancialEvent" TO ${a}`);
  await db.query(`GRANT SELECT ON "ServiceHeartbeat" TO ${a}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "ServiceHeartbeat" TO ${w}`);
  await db.query(`GRANT SELECT (migration_name, checksum, finished_at, rolled_back_at) ON "_prisma_migrations" TO ${a}, ${w}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "SiteOrder", "BillingInvoice" TO ${a}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "CommercialSettings", "Quote", "PaymentAttempt", "CommercialEmail", "ServiceTemplate", "MessageTemplate" TO ${a}`);
  await db.query(`GRANT SELECT, INSERT ON "ClientMessage", "Conversation", "QuoteAccess", "CommercialWebhook", "ManualPaymentReview" TO ${a}`);
  await db.query(`GRANT UPDATE ("deliveryStatus", "providerId", "smtpMessageId") ON "ClientMessage" TO ${a}`);
  await db.query(`GRANT UPDATE ("needsReply", "updatedAt") ON "Conversation" TO ${a}`);
  await db.query(`GRANT UPDATE ("revokedAt") ON "QuoteAccess" TO ${a}`);
  await db.query(`GRANT SELECT ON "CommercialSettings", "Quote", "QuoteAccess", "Conversation", "CommercialWebhook", "ClientMessage" TO ${w}`);
  await db.query(`GRANT SELECT ("id", "projectId", "creationPaidAt", "firstSubscriptionPaidAt") ON "SiteOrder" TO ${w}`);
  await db.query(`GRANT SELECT ("id", "leadId", "stage") ON "Project" TO ${w}`);
  await db.query(`GRANT SELECT ("id", "deletedAt") ON "Lead" TO ${w}`);
  await db.query(`GRANT UPDATE ("status", "nextReminderAt", "reminderCount", "updatedAt") ON "Quote" TO ${w}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "CommercialEmail" TO ${w}`);
  await db.query(`GRANT UPDATE ("deliveryStatus", "providerId") ON "ClientMessage" TO ${w}`);
  await db.query(`GRANT UPDATE ("needsReply", "updatedAt") ON "Conversation" TO ${w}`);
}
