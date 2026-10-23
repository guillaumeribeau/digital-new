ALTER TABLE "ReviewRound" ADD COLUMN "reviewVersion" INTEGER NOT NULL DEFAULT 1;
UPDATE "ReviewRound" r SET "reviewVersion" = o."reviewVersion" FROM "SiteOrder" o WHERE r."siteOrderId" = o.id;
ALTER TABLE "DomainSelection" ADD COLUMN "renewalProposal" JSONB;
ALTER TABLE "DomainSelection" ADD COLUMN "renewalHistory" JSONB NOT NULL DEFAULT '[]';
CREATE TABLE "SiteInboundEmail" (
  "id" UUID NOT NULL, "siteOrderId" UUID NOT NULL, "providerId" VARCHAR(200) NOT NULL,
  "purpose" VARCHAR(20) NOT NULL, "reviewVersion" INTEGER, "state" VARCHAR(30) NOT NULL,
  "sender" VARCHAR(300) NOT NULL, "subject" VARCHAR(300) NOT NULL, "content" TEXT NOT NULL,
  "attachments" JSONB NOT NULL DEFAULT '[]', "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteInboundEmail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SiteInboundEmail_siteOrderId_fkey" FOREIGN KEY ("siteOrderId") REFERENCES "SiteOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SiteInboundEmail_providerId_key" ON "SiteInboundEmail"("providerId");
CREATE INDEX "SiteInboundEmail_siteOrderId_createdAt_idx" ON "SiteInboundEmail"("siteOrderId", "createdAt");
DO $$ DECLARE runtime_role text; BEGIN
  FOR runtime_role IN SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_admin(_[a-f0-9]+)?$' AND has_table_privilege(rolname, '"SiteOrder"', 'UPDATE')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON "SiteInboundEmail" TO %I', runtime_role);
  END LOOP;
END $$;
