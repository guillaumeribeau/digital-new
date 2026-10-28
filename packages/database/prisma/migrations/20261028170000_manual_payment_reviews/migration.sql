CREATE TABLE "ManualPaymentReview" (
  "id" UUID NOT NULL,
  "requestId" UUID NOT NULL,
  "brand" VARCHAR(20) NOT NULL,
  "kind" VARCHAR(30) NOT NULL,
  "resourceId" UUID NOT NULL,
  "status" VARCHAR(10) NOT NULL,
  "mode" VARCHAR(10) NOT NULL,
  "paidAt" TIMESTAMPTZ(3),
  "nextBillingAt" TIMESTAMPTZ(3),
  "reference" VARCHAR(200) NOT NULL,
  "note" VARCHAR(2000) NOT NULL,
  "actorId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManualPaymentReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ManualPaymentReview_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ManualPaymentReview_brand_check" CHECK ("brand" IN ('zelyweb', 'tadapo')),
  CONSTRAINT "ManualPaymentReview_status_check" CHECK ("status" IN ('PAID', 'PENDING', 'FAILED'))
);
CREATE UNIQUE INDEX "ManualPaymentReview_requestId_key" ON "ManualPaymentReview"("requestId");
CREATE INDEX "ManualPaymentReview_brand_resourceId_kind_createdAt_idx" ON "ManualPaymentReview"("brand", "resourceId", "kind", "createdAt");

CREATE FUNCTION nova_guard_manual_payment_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'MANUAL_PAYMENT_REVIEW_IMMUTABLE';
END $$;
CREATE TRIGGER "ManualPaymentReview_immutable" BEFORE UPDATE OR DELETE ON "ManualPaymentReview" FOR EACH ROW EXECUTE FUNCTION nova_guard_manual_payment_review();

-- Retain the existing financial and acceptance guards. A correction from paid
-- to awaiting payment requires an immutable review inserted in this transaction.
CREATE OR REPLACE FUNCTION nova_guard_quote() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE manual_correction boolean;
BEGIN
  IF OLD."status" <> 'DRAFT' AND ROW(OLD."leadId", OLD."projectId", OLD."number", OLD."title", OLD."items", OLD."subtotalCents", OLD."taxCents", OLD."totalCents", OLD."currency", OLD."billingName", OLD."billingAddress", OLD."billingRegistrationNumber", OLD."billingVatNumber", OLD."deliveryTime", OLD."terms", OLD."snapshot", OLD."documentHash", OLD."parentId", OLD."validUntil", OLD."createdAt") IS DISTINCT FROM ROW(NEW."leadId", NEW."projectId", NEW."number", NEW."title", NEW."items", NEW."subtotalCents", NEW."taxCents", NEW."totalCents", NEW."currency", NEW."billingName", NEW."billingAddress", NEW."billingRegistrationNumber", NEW."billingVatNumber", NEW."deliveryTime", NEW."terms", NEW."snapshot", NEW."documentHash", NEW."parentId", NEW."validUntil", NEW."createdAt") THEN
    RAISE EXCEPTION 'ISSUED_QUOTE_IMMUTABLE';
  END IF;
  IF OLD."acceptedAt" IS NOT NULL AND ROW(OLD."acceptedAt", OLD."acceptedName", OLD."acceptanceHash") IS DISTINCT FROM ROW(NEW."acceptedAt", NEW."acceptedName", NEW."acceptanceHash") THEN RAISE EXCEPTION 'ACCEPTANCE_IMMUTABLE'; END IF;
  manual_correction := false;
  IF OLD."status" IN ('PAID', 'COMPLETED') AND NEW."status" = 'ACCEPTED' AND NEW."paidAt" IS NULL THEN
    SELECT EXISTS (
    SELECT 1 FROM "ManualPaymentReview" r JOIN "AdminUser" a ON a.id = r."actorId" JOIN "Lead" l ON l.id = NEW."leadId"
    WHERE r.id::text = current_setting('nova.manual_payment_review', true)
      AND r."resourceId" = NEW.id AND r.kind = 'QUOTE' AND r.brand = l.brand
      AND r.status IN ('PENDING', 'FAILED') AND a.active AND a.role = 'ADMIN'
      AND r.xmin::text = pg_current_xact_id()::text
    ) INTO manual_correction;
  END IF;
  IF OLD."status" <> NEW."status" AND NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" IN ('SENT','CANCELLED','SUPERSEDED')) OR
    (OLD."status" = 'SENT' AND NEW."status" IN ('ACCEPTED','DECLINED','EXPIRED','CANCELLED','SUPERSEDED')) OR
    (OLD."status" = 'ACCEPTED' AND NEW."status" = 'PAID') OR
    (OLD."status" IN ('DECLINED','EXPIRED','CANCELLED') AND NEW."status" IN ('CANCELLED','SUPERSEDED')) OR
    (OLD."status" = 'PAID' AND NEW."status" = 'COMPLETED') OR manual_correction) THEN RAISE EXCEPTION 'INVALID_QUOTE_TRANSITION'; END IF;
  IF NEW."status" = 'PAID' AND OLD."status" <> 'PAID' THEN
    IF NOT EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "quoteId" = NEW."id" AND "status" = 'SUCCEEDED' AND "amountCents" = NEW."totalCents" AND "currency" = NEW."currency" AND "mode" = NEW."paymentMode") THEN RAISE EXCEPTION 'CONFIRMED_PAYMENT_REQUIRED'; END IF;
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_admin(_[a-f0-9]+)?$'
      AND has_table_privilege(rolname, '"Project"', 'UPDATE')
      AND has_table_privilege(rolname, '"AdminUser"', 'SELECT')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT ON "ManualPaymentReview" TO %I', runtime_role);
  END LOOP;
END $$;
