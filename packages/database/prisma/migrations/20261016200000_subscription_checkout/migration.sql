ALTER TABLE "SiteOrder"
  ADD COLUMN "revisionEmailVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "revisionEmailMessage" VARCHAR(5000),
  ADD COLUMN "revisionEmailSentAt" TIMESTAMPTZ(3),
  ADD COLUMN "subscriptionInviteVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "subscriptionWebsiteUrl" VARCHAR(1000),
  ADD COLUMN "subscriptionInviteSentAt" TIMESTAMPTZ(3),
  ADD COLUMN "subscriptionConsentAt" TIMESTAMPTZ(3),
  ADD COLUMN "subscriptionConsentText" TEXT,
  ADD COLUMN "subscriptionCheckoutSessionId" VARCHAR(200),
  ADD COLUMN "subscriptionCheckoutUrl" VARCHAR(2000),
  ADD COLUMN "subscriptionCheckoutExpiresAt" TIMESTAMPTZ(3);

CREATE UNIQUE INDEX "SiteOrder_subscriptionCheckoutSessionId_key"
  ON "SiteOrder"("subscriptionCheckoutSessionId");
