-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('PENDING_VERIFICATION', 'NEW', 'QUALIFIED', 'REJECTED', 'IN_PROGRESS', 'PREVIEW_SENT', 'APPROVED', 'PAID', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutboxKind" AS ENUM ('VERIFY_EMAIL', 'RECEIPT', 'INTERNAL_NOTIFICATION');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DEAD', 'CANCELLED');

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "requestId" UUID NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "firstName" VARCHAR(200),
    "lastName" VARCHAR(200),
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(25),
    "preferredContactMethod" VARCHAR(20) NOT NULL,
    "businessName" VARCHAR(200) NOT NULL,
    "businessType" VARCHAR(200),
    "businessSector" VARCHAR(100) NOT NULL,
    "siret" VARCHAR(14),
    "city" VARCHAR(200) NOT NULL,
    "hasWebsite" VARCHAR(10),
    "currentWebsite" VARCHAR(500),
    "projectDescription" VARCHAR(1500),
    "services" VARCHAR(1500) NOT NULL,
    "preferredStyle" VARCHAR(50) NOT NULL,
    "preferredColors" VARCHAR(200),
    "hasLogo" VARCHAR(20),
    "hasPhotos" VARCHAR(20),
    "additionalInformation" VARCHAR(2000),
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "pricingAcknowledgedAt" TIMESTAMPTZ(3) NOT NULL,
    "pricingVersion" VARCHAR(50) NOT NULL,
    "privacyAcknowledgedAt" TIMESTAMPTZ(3) NOT NULL,
    "privacyVersion" VARCHAR(50) NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "utmSource" VARCHAR(200),
    "utmMedium" VARCHAR(200),
    "utmCampaign" VARCHAR(200),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "kind" "OutboxKind" NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "payloadEncrypted" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(3),
    "lockId" UUID,
    "sentAt" TIMESTAMPTZ(3),
    "providerMessageId" VARCHAR(200),
    "lastError" VARCHAR(100),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFile" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "objectKey" VARCHAR(500) NOT NULL,
    "originalName" VARCHAR(200) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_requestId_key" ON "Lead"("requestId");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_leadId_createdAt_idx" ON "EmailVerificationToken"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_leadId_kind_idx" ON "OutboxEvent"("leadId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "LeadFile_objectKey_key" ON "LeadFile"("objectKey");

-- CreateIndex
CREATE INDEX "LeadFile_leadId_idx" ON "LeadFile"("leadId");

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFile" ADD CONSTRAINT "LeadFile_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
