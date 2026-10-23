-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "brand" VARCHAR(20) NOT NULL DEFAULT 'zelyweb';

-- AlterTable
ALTER TABLE "CommercialEmail" ADD COLUMN     "tadapoOrderId" UUID;

-- CreateTable
CREATE TABLE "TadapoOrder" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "projectId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "brief" JSONB NOT NULL,
    "offerSnapshot" JSONB NOT NULL,
    "consentSnapshot" JSONB NOT NULL,
    "mode" VARCHAR(10) NOT NULL,
    "stage" VARCHAR(40) NOT NULL DEFAULT 'PAYMENT_PENDING',
    "tokenHash" CHAR(64) NOT NULL,
    "tokenEncrypted" TEXT NOT NULL,
    "stripeSessionId" VARCHAR(200),
    "checkoutUrl" VARCHAR(2000),
    "checkoutExpiresAt" TIMESTAMPTZ(3),
    "stripeCustomerId" VARCHAR(200),
    "stripeSubscriptionId" VARCHAR(200),
    "subscriptionStatus" VARCHAR(40),
    "paidAt" TIMESTAMPTZ(3),
    "contentCompleteAt" TIMESTAMPTZ(3),
    "commitmentEndAt" TIMESTAMPTZ(3),
    "cancelRequestedAt" TIMESTAMPTZ(3),
    "cancelEffectiveAt" TIMESTAMPTZ(3),
    "nextBillingAt" TIMESTAMPTZ(3),
    "billingAlert" BOOLEAN NOT NULL DEFAULT false,
    "reviewVersion" INTEGER NOT NULL DEFAULT 1,
    "approvedVersion" INTEGER,
    "approvedAt" TIMESTAMPTZ(3),
    "approvedName" VARCHAR(200),
    "domainQuote" JSONB,
    "domainVersion" INTEGER NOT NULL DEFAULT 0,
    "domainAcceptedAt" TIMESTAMPTZ(3),
    "domainSessionId" VARCHAR(200),
    "domainAttempt" INTEGER NOT NULL DEFAULT 0,
    "domainCheckoutUrl" VARCHAR(2000),
    "domainPaidAt" TIMESTAMPTZ(3),
    "domainPurchasedAt" TIMESTAMPTZ(3),
    "domainReadyAt" TIMESTAMPTZ(3),

    CONSTRAINT "TadapoOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TadapoInvoice" (
    "id" VARCHAR(200) NOT NULL,
    "orderId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountCents" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "hostedUrl" VARCHAR(2000),
    "pdfUrl" VARCHAR(2000),
    "periodEnd" TIMESTAMPTZ(3),

    CONSTRAINT "TadapoInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TadapoFeedback" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "content" VARCHAR(10000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TadapoFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TadapoFile" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "encrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TadapoFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TadapoOrder_requestId_key" ON "TadapoOrder"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "TadapoOrder_projectId_key" ON "TadapoOrder"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "TadapoOrder_tokenHash_key" ON "TadapoOrder"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "TadapoOrder_stripeSessionId_key" ON "TadapoOrder"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TadapoOrder_stripeSubscriptionId_key" ON "TadapoOrder"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "TadapoOrder_domainSessionId_key" ON "TadapoOrder"("domainSessionId");

-- CreateIndex
CREATE INDEX "TadapoOrder_stage_createdAt_idx" ON "TadapoOrder"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "TadapoInvoice_orderId_createdAt_idx" ON "TadapoInvoice"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TadapoFeedback_requestId_key" ON "TadapoFeedback"("requestId");

-- AddForeignKey
ALTER TABLE "CommercialEmail" ADD CONSTRAINT "CommercialEmail_tadapoOrderId_fkey" FOREIGN KEY ("tadapoOrderId") REFERENCES "TadapoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TadapoOrder" ADD CONSTRAINT "TadapoOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TadapoInvoice" ADD CONSTRAINT "TadapoInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TadapoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TadapoFeedback" ADD CONSTRAINT "TadapoFeedback_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TadapoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TadapoFile" ADD CONSTRAINT "TadapoFile_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TadapoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Extend existing admin runtimes. The public Tadapo role is provisioned separately.
DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_admin(_[a-f0-9]+)?$' AND has_table_privilege(rolname, '"SiteOrder"', 'UPDATE')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON "TadapoOrder", "TadapoInvoice", "TadapoFeedback", "TadapoFile" TO %I', runtime_role);
    EXECUTE format('GRANT INSERT ON "Lead" TO %I', runtime_role);
  END LOOP;
END $$;
