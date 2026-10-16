-- CreateTable
-- Runtime grants for existing restricted administrator roles are added below.
CREATE TABLE "SiteOrder" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "creationHtCents" INTEGER NOT NULL DEFAULT 29900,
    "monthlyHtCents" INTEGER NOT NULL DEFAULT 2900,
    "previewUrl" VARCHAR(1000) NOT NULL,
    "screenshot" TEXT NOT NULL,
    "message" VARCHAR(5000) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "mode" VARCHAR(10) NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "tokenEncrypted" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3),
    "consentAt" TIMESTAMPTZ(3),
    "consentText" TEXT,
    "acceptedName" VARCHAR(200),
    "creationPaidAt" TIMESTAMPTZ(3),
    "stripeCustomerId" VARCHAR(200),
    "stripeSessionId" VARCHAR(200),
    "checkoutAttempt" UUID,
    "checkoutUrl" VARCHAR(2000),
    "checkoutExpiresAt" TIMESTAMPTZ(3),
    "paymentMethodId" VARCHAR(200),
    "stripeSubscriptionId" VARCHAR(200),
    "subscriptionAttempt" UUID,
    "subscriptionStatus" VARCHAR(40),
    "firstSubscriptionPaidAt" TIMESTAMPTZ(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "billingAlert" BOOLEAN NOT NULL DEFAULT false,
    "lastInvoiceUrl" VARCHAR(2000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SiteOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" VARCHAR(200) NOT NULL,
    "siteOrderId" UUID,
    "quoteId" UUID,
    "status" VARCHAR(30) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "hostedUrl" VARCHAR(2000),
    "pdfUrl" VARCHAR(2000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteOrder_projectId_key" ON "SiteOrder"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteOrder_tokenHash_key" ON "SiteOrder"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "SiteOrder_stripeCustomerId_key" ON "SiteOrder"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteOrder_stripeSessionId_key" ON "SiteOrder"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteOrder_stripeSubscriptionId_key" ON "SiteOrder"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "BillingInvoice_siteOrderId_createdAt_idx" ON "BillingInvoice"("siteOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingInvoice_quoteId_idx" ON "BillingInvoice"("quoteId");

-- AddForeignKey
ALTER TABLE "SiteOrder" ADD CONSTRAINT "SiteOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_siteOrderId_fkey" FOREIGN KEY ("siteOrderId") REFERENCES "SiteOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN
    SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_admin(_[a-f0-9]+)?$'
      AND has_table_privilege(rolname, '"Project"', 'UPDATE')
      AND has_table_privilege(rolname, '"AdminUser"', 'SELECT')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON "SiteOrder", "BillingInvoice" TO %I', runtime_role);
  END LOOP;
END $$;
