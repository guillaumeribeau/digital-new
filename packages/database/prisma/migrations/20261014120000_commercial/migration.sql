-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'SUPERSEDED', 'PAID', 'COMPLETED');

-- CreateTable
CREATE TABLE "CommercialSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "legalName" VARCHAR(200) NOT NULL DEFAULT '',
    "address" VARCHAR(1000) NOT NULL DEFAULT '',
    "registrationNumber" VARCHAR(100) NOT NULL DEFAULT '',
    "vatNumber" VARCHAR(100) NOT NULL DEFAULT '',
    "taxNote" VARCHAR(1000) NOT NULL DEFAULT '',
    "terms" TEXT NOT NULL DEFAULT '',
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "reminderDays" INTEGER NOT NULL DEFAULT 0,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CommercialSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "replyToken" VARCHAR(64) NOT NULL,
    "needsReply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "direction" VARCHAR(20) NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "sender" VARCHAR(300) NOT NULL,
    "deliveryStatus" VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    "providerId" VARCHAR(200),
    "smtpMessageId" VARCHAR(500),
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "projectId" UUID,
    "number" VARCHAR(50) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(200) NOT NULL,
    "items" JSONB NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'eur',
    "billingAddress" VARCHAR(1000) NOT NULL,
    "billingName" VARCHAR(200) NOT NULL DEFAULT '',
    "billingRegistrationNumber" VARCHAR(100) NOT NULL DEFAULT '',
    "billingVatNumber" VARCHAR(100) NOT NULL DEFAULT '',
    "deliveryTime" VARCHAR(1000) NOT NULL,
    "terms" TEXT NOT NULL,
    "snapshot" JSONB,
    "documentHash" CHAR(64),
    "parentId" UUID,
    "validUntil" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "sentAt" TIMESTAMPTZ(3),
    "acceptedAt" TIMESTAMPTZ(3),
    "acceptedName" VARCHAR(200),
    "acceptanceHash" CHAR(64),
    "paidAt" TIMESTAMPTZ(3),
    "paymentMode" VARCHAR(10),
    "nextReminderAt" TIMESTAMPTZ(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAccess" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "tokenEncrypted" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "mode" VARCHAR(10) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'CREATING',
    "amountCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "stripeSessionId" VARCHAR(200),
    "checkoutUrl" VARCHAR(2000),
    "expiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMPTZ(3),

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialEmail" (
    "id" UUID NOT NULL,
    "quoteId" UUID,
    "messageId" UUID,
    "kind" VARCHAR(40) NOT NULL,
    "payloadEncrypted" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockId" UUID,
    "lockedUntil" TIMESTAMPTZ(3),
    "providerMessageId" VARCHAR(200),
    "sentAt" TIMESTAMPTZ(3),
    "lastError" VARCHAR(100),

    CONSTRAINT "CommercialEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialWebhook" (
    "key" VARCHAR(250) NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "emailId" VARCHAR(200),
    "deliveryStatus" VARCHAR(30),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialWebhook_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ServiceTemplate" (
    "id" UUID NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "unitCents" INTEGER NOT NULL,
    "taxBasisPoints" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_leadId_key" ON "Conversation"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_replyToken_key" ON "Conversation"("replyToken");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMessage_providerId_key" ON "ClientMessage"("providerId");

-- CreateIndex
CREATE INDEX "ClientMessage_conversationId_createdAt_idx" ON "ClientMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");

-- CreateIndex
CREATE INDEX "Quote_leadId_createdAt_idx" ON "Quote"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_status_nextReminderAt_idx" ON "Quote"("status", "nextReminderAt");

-- CreateIndex
CREATE INDEX "Quote_parentId_idx" ON "Quote"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteAccess_tokenHash_key" ON "QuoteAccess"("tokenHash");

-- CreateIndex
CREATE INDEX "QuoteAccess_quoteId_idx" ON "QuoteAccess"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_stripeSessionId_key" ON "PaymentAttempt"("stripeSessionId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_quoteId_createdAt_idx" ON "PaymentAttempt"("quoteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialEmail_providerMessageId_key" ON "CommercialEmail"("providerMessageId");

-- CreateIndex
CREATE INDEX "CommercialEmail_status_availableAt_idx" ON "CommercialEmail"("status", "availableAt");

-- CreateIndex
CREATE INDEX "CommercialWebhook_emailId_idx" ON "CommercialWebhook"("emailId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMessage" ADD CONSTRAINT "ClientMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAccess" ADD CONSTRAINT "QuoteAccess_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialEmail" ADD CONSTRAINT "CommercialEmail_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialEmail" ADD CONSTRAINT "CommercialEmail_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ClientMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Financial documents are immutable after issue, including direct runtime SQL.
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_amounts_check" CHECK ("subtotalCents" > 0 AND "taxCents" >= 0 AND "totalCents" = "subtotalCents" + "taxCents" AND "totalCents" <= 100000000);
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_acceptance_check" CHECK ("status" NOT IN ('ACCEPTED', 'PAID', 'COMPLETED') OR ("acceptedAt" IS NOT NULL AND "acceptedName" IS NOT NULL AND "acceptanceHash" = "documentHash" AND "snapshot" IS NOT NULL));
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_payment_check" CHECK ("status" NOT IN ('PAID', 'COMPLETED') OR ("paidAt" IS NOT NULL AND "paymentMode" IN ('LIVE', 'TEST', 'LOCAL')));
CREATE FUNCTION nova_guard_quote() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."status" <> 'DRAFT' AND ROW(OLD."leadId", OLD."projectId", OLD."number", OLD."title", OLD."items", OLD."subtotalCents", OLD."taxCents", OLD."totalCents", OLD."currency", OLD."billingName", OLD."billingAddress", OLD."billingRegistrationNumber", OLD."billingVatNumber", OLD."deliveryTime", OLD."terms", OLD."snapshot", OLD."documentHash", OLD."parentId", OLD."validUntil", OLD."createdAt") IS DISTINCT FROM ROW(NEW."leadId", NEW."projectId", NEW."number", NEW."title", NEW."items", NEW."subtotalCents", NEW."taxCents", NEW."totalCents", NEW."currency", NEW."billingName", NEW."billingAddress", NEW."billingRegistrationNumber", NEW."billingVatNumber", NEW."deliveryTime", NEW."terms", NEW."snapshot", NEW."documentHash", NEW."parentId", NEW."validUntil", NEW."createdAt") THEN
    RAISE EXCEPTION 'ISSUED_QUOTE_IMMUTABLE';
  END IF;
  IF OLD."acceptedAt" IS NOT NULL AND ROW(OLD."acceptedAt", OLD."acceptedName", OLD."acceptanceHash") IS DISTINCT FROM ROW(NEW."acceptedAt", NEW."acceptedName", NEW."acceptanceHash") THEN RAISE EXCEPTION 'ACCEPTANCE_IMMUTABLE'; END IF;
  IF OLD."status" <> NEW."status" AND NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" IN ('SENT','CANCELLED','SUPERSEDED')) OR
    (OLD."status" = 'SENT' AND NEW."status" IN ('ACCEPTED','DECLINED','EXPIRED','CANCELLED','SUPERSEDED')) OR
    (OLD."status" = 'ACCEPTED' AND NEW."status" = 'PAID') OR
    (OLD."status" IN ('DECLINED','EXPIRED','CANCELLED') AND NEW."status" IN ('CANCELLED','SUPERSEDED')) OR
    (OLD."status" = 'PAID' AND NEW."status" = 'COMPLETED')) THEN RAISE EXCEPTION 'INVALID_QUOTE_TRANSITION'; END IF;
  IF NEW."status" = 'PAID' AND OLD."status" <> 'PAID' AND NOT EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "quoteId" = NEW."id" AND "status" = 'SUCCEEDED' AND "amountCents" = NEW."totalCents" AND "currency" = NEW."currency" AND "mode" = NEW."paymentMode") THEN RAISE EXCEPTION 'CONFIRMED_PAYMENT_REQUIRED'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "Quote_immutable" BEFORE UPDATE ON "Quote" FOR EACH ROW EXECUTE FUNCTION nova_guard_quote();
