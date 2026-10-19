-- AlterTable
ALTER TABLE "SiteOrder" ADD COLUMN     "disputeStatus" VARCHAR(50),
ADD COLUMN     "domainReadyAt" TIMESTAMPTZ(3),
ADD COLUMN     "finalApprovedAt" TIMESTAMPTZ(3),
ADD COLUMN     "finalApprovedName" VARCHAR(200),
ADD COLUMN     "finalApprovedVersion" INTEGER,
ADD COLUMN     "nextBillingAt" TIMESTAMPTZ(3),
ADD COLUMN     "refundedCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewUrl" VARCHAR(1000),
ADD COLUMN     "reviewVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "workflowVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CommercialEmail" ADD COLUMN     "deliveryStatus" VARCHAR(30),
ADD COLUMN     "lastHttpStatus" INTEGER,
ADD COLUMN     "manualRequestId" UUID,
ADD COLUMN     "resendOfId" UUID,
ADD COLUMN     "siteOrderId" UUID;

-- CreateTable
CREATE TABLE "DomainOption" (
    "id" UUID NOT NULL,
    "siteOrderId" UUID NOT NULL,
    "domain" VARCHAR(253) NOT NULL,
    "initialHtCents" INTEGER NOT NULL,
    "renewalHtCents" INTEGER NOT NULL,
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "checkedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainSelection" (
    "id" UUID NOT NULL,
    "siteOrderId" UUID NOT NULL,
    "optionId" UUID,
    "domain" VARCHAR(253) NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "acceptedSnapshot" JSONB NOT NULL,
    "selectedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchasedAt" TIMESTAMPTZ(3),
    "renewalAt" TIMESTAMPTZ(3),
    "supplementQuoteId" UUID,

    CONSTRAINT "DomainSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRound" (
    "id" UUID NOT NULL,
    "siteOrderId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ReviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMessage" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "author" VARCHAR(20) NOT NULL,
    "content" VARCHAR(10000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFile" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "mimeType" VARCHAR(50) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "encrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialEvent" (
    "id" VARCHAR(200) NOT NULL,
    "siteOrderId" UUID,
    "quoteId" UUID,
    "purpose" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    "kind" VARCHAR(20) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "chargeId" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "FinancialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHeartbeat" (
    "id" VARCHAR(50) NOT NULL,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessAt" TIMESTAMPTZ(3),
    "lastError" VARCHAR(100),

    CONSTRAINT "ServiceHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DomainOption_siteOrderId_active_idx" ON "DomainOption"("siteOrderId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DomainSelection_siteOrderId_key" ON "DomainSelection"("siteOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRound_siteOrderId_number_key" ON "ReviewRound"("siteOrderId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewMessage_requestId_key" ON "ReviewMessage"("requestId");

-- CreateIndex
CREATE INDEX "ReviewMessage_roundId_createdAt_idx" ON "ReviewMessage"("roundId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialEvent_siteOrderId_createdAt_idx" ON "FinancialEvent"("siteOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialEvent_quoteId_createdAt_idx" ON "FinancialEvent"("quoteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialEmail_manualRequestId_key" ON "CommercialEmail"("manualRequestId");

-- CreateIndex
CREATE INDEX "CommercialEmail_siteOrderId_createdAt_idx" ON "CommercialEmail"("siteOrderId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommercialEmail" ADD CONSTRAINT "CommercialEmail_siteOrderId_fkey" FOREIGN KEY ("siteOrderId") REFERENCES "SiteOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainOption" ADD CONSTRAINT "DomainOption_siteOrderId_fkey" FOREIGN KEY ("siteOrderId") REFERENCES "SiteOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainSelection" ADD CONSTRAINT "DomainSelection_siteOrderId_fkey" FOREIGN KEY ("siteOrderId") REFERENCES "SiteOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainSelection" ADD CONSTRAINT "DomainSelection_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "DomainOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRound" ADD CONSTRAINT "ReviewRound_siteOrderId_fkey" FOREIGN KEY ("siteOrderId") REFERENCES "SiteOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMessage" ADD CONSTRAINT "ReviewMessage_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ReviewRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFile" ADD CONSTRAINT "ReviewFile_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ReviewMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEvent" ADD CONSTRAINT "FinancialEvent_siteOrderId_fkey" FOREIGN KEY ("siteOrderId") REFERENCES "SiteOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "SiteOrder" ALTER COLUMN "workflowVersion" SET DEFAULT 1;
UPDATE "CommercialSettings" SET "reminderDays" = 0;
UPDATE "Quote" SET "nextReminderAt" = NULL WHERE "nextReminderAt" IS NOT NULL;
UPDATE auth_user u SET "twoFactorEnabled" = false WHERE "twoFactorEnabled" = true
  AND NOT EXISTS (SELECT 1 FROM auth_two_factor t WHERE t."userId" = u.id);

DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_admin(_[a-f0-9]+)?$'
      AND has_table_privilege(rolname, '"Project"', 'UPDATE')
      AND has_table_privilege(rolname, '"AdminUser"', 'SELECT')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON "DomainOption", "DomainSelection", "ReviewRound", "ReviewMessage", "ReviewFile", "FinancialEvent" TO %I', runtime_role);
    EXECUTE format('GRANT SELECT ON "ServiceHeartbeat" TO %I', runtime_role);
  END LOOP;
  FOR runtime_role IN SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_worker(_[a-f0-9]+)?$'
      AND has_table_privilege(rolname, '"OutboxEvent"', 'UPDATE')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON "ServiceHeartbeat" TO %I', runtime_role);
  END LOOP;
END $$;

UPDATE "CommercialEmail" e SET "deliveryStatus" = (
  SELECT w."deliveryStatus" FROM "CommercialWebhook" w
  WHERE w."emailId" = e."providerMessageId" AND w."deliveryStatus" IS NOT NULL
  ORDER BY CASE WHEN w."deliveryStatus" IN ('BOUNCED','COMPLAINED','DEAD') THEN 0 ELSE 1 END, w."createdAt" DESC LIMIT 1
) WHERE e."providerMessageId" IS NOT NULL;
