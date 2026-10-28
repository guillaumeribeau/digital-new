ALTER TABLE "TadapoOrder" ADD COLUMN "firstVersionAt" TIMESTAMPTZ(3), ADD COLUMN "domainRequest" JSONB, ADD COLUMN "domainRenewal" JSONB, ADD COLUMN "domainRenewalHistory" JSONB NOT NULL DEFAULT '[]';
UPDATE "TadapoOrder" SET "firstVersionAt" = "updatedAt" WHERE stage IN ('PREVIEW_SENT','REVIEW','APPROVED','PUBLISHED');
ALTER TABLE "TadapoFeedback" ADD COLUMN "kind" VARCHAR(20) NOT NULL DEFAULT 'LEGACY', ADD COLUMN "number" INTEGER, ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'RECORDED', ADD COLUMN "periodStart" TIMESTAMPTZ(3), ADD COLUMN "completedAt" TIMESTAMPTZ(3);
-- Preserve historical messages and mark them explicitly; never invent completed review rounds.
CREATE UNIQUE INDEX "TadapoFeedback_orderId_number_key" ON "TadapoFeedback"("orderId","number");
CREATE INDEX "TadapoFeedback_orderId_kind_periodStart_idx" ON "TadapoFeedback"("orderId","kind","periodStart");
CREATE TABLE "TadapoMail" (
 "id" UUID NOT NULL, "orderId" UUID NOT NULL, "key" VARCHAR(250) NOT NULL, "kind" VARCHAR(40) NOT NULL, "payloadEncrypted" TEXT NOT NULL,
 "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "transferredAt" TIMESTAMPTZ(3),
 CONSTRAINT "TadapoMail_pkey" PRIMARY KEY ("id"), CONSTRAINT "TadapoMail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TadapoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TadapoMail_key_key" ON "TadapoMail"("key");
CREATE INDEX "TadapoMail_transferredAt_createdAt_idx" ON "TadapoMail"("transferredAt","createdAt");
CREATE TABLE "TadapoInboundEmail" (
 "id" UUID NOT NULL, "orderId" UUID NOT NULL, "providerId" VARCHAR(200) NOT NULL, "purpose" VARCHAR(20) NOT NULL, "state" VARCHAR(30) NOT NULL, "sender" VARCHAR(300) NOT NULL, "subject" VARCHAR(300) NOT NULL, "content" TEXT NOT NULL,
 "attachments" JSONB NOT NULL DEFAULT '[]', "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "TadapoInboundEmail_pkey" PRIMARY KEY ("id"), CONSTRAINT "TadapoInboundEmail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TadapoOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TadapoInboundEmail_providerId_key" ON "TadapoInboundEmail"("providerId");
CREATE INDEX "TadapoInboundEmail_orderId_createdAt_idx" ON "TadapoInboundEmail"("orderId","createdAt");
DO $$ DECLARE r text; BEGIN
 FOR r IN SELECT rolname FROM pg_roles WHERE rolname ~ '^nova_admin(_[a-f0-9]+)?$' AND has_table_privilege(rolname,'"TadapoOrder"','UPDATE') LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON "TadapoMail", "TadapoInboundEmail" TO %I',r);
 END LOOP;
 FOR r IN SELECT rolname FROM pg_roles WHERE rolname ~ '^nova_worker(_[a-f0-9]+)?$' AND has_table_privilege(rolname,'"CommercialEmail"','INSERT') LOOP
  EXECUTE format('GRANT SELECT, UPDATE ON "TadapoMail" TO %I',r);
  EXECUTE format('GRANT SELECT ("reviewVersion", "stage") ON "TadapoOrder" TO %I',r);
 END LOOP;
 FOR r IN SELECT rolname FROM pg_roles WHERE rolname ~ '^nova_tadapo(_[a-f0-9]+)?$' AND has_table_privilege(rolname,'"TadapoOrder"','UPDATE') LOOP
  EXECUTE format('GRANT INSERT ON "TadapoMail" TO %I',r);
 END LOOP;
END $$;
