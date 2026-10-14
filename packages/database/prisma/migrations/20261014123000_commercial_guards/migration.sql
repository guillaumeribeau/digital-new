-- Tighten the guards without deleting documents or messages.
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_acceptance_check";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_acceptance_check" CHECK ("status" NOT IN ('ACCEPTED', 'PAID', 'COMPLETED') OR ("acceptedAt" IS NOT NULL AND "acceptedName" IS NOT NULL AND "acceptanceHash" IS NOT NULL AND "documentHash" IS NOT NULL AND "acceptanceHash" = "documentHash" AND "snapshot" IS NOT NULL));
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_issued_check" CHECK ("status" NOT IN ('SENT','ACCEPTED','DECLINED','EXPIRED','PAID','COMPLETED') OR ("snapshot" IS NOT NULL AND "documentHash" IS NOT NULL AND "documentHash" ~ '^[a-f0-9]{64}$'));
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_currency_check" CHECK ("currency" = 'eur');
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_values_check" CHECK ("amountCents" > 0 AND "amountCents" <= 100000000 AND "currency" = 'eur' AND "mode" IN ('LIVE','TEST','LOCAL') AND "status" IN ('CREATING','OPEN','FAILED','EXPIRED','SUCCEEDED') AND ("status" <> 'SUCCEEDED' OR "paidAt" IS NOT NULL));
ALTER TABLE "CommercialSettings" ADD CONSTRAINT "CommercialSettings_values_check" CHECK ("counter" >= 0 AND "validityDays" BETWEEN 1 AND 180 AND "reminderDays" BETWEEN 0 AND 30);
CREATE OR REPLACE FUNCTION nova_guard_quote() RETURNS trigger LANGUAGE plpgsql AS $$
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
  IF NEW."status" = 'PAID' AND OLD."status" <> 'PAID' THEN
    IF NOT EXISTS (SELECT 1 FROM "PaymentAttempt" WHERE "quoteId" = NEW."id" AND "status" = 'SUCCEEDED' AND "amountCents" = NEW."totalCents" AND "currency" = NEW."currency" AND "mode" = NEW."paymentMode") THEN RAISE EXCEPTION 'CONFIRMED_PAYMENT_REQUIRED'; END IF;
  END IF;
  RETURN NEW;
END $$;
