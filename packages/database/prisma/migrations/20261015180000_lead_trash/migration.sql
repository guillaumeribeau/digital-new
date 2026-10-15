ALTER TABLE "Lead" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
CREATE INDEX "Lead_deletedAt_createdAt_idx" ON "Lead"("deletedAt", "createdAt");

-- Existing restricted admin accounts can only update the new visibility field.
-- Fresh accounts receive this permission from the bootstrap/setup scripts.
DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN
    SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_admin(_[a-f0-9]+)?$'
      AND has_column_privilege(rolname, '"Lead"', 'status', 'UPDATE')
      AND has_table_privilege(rolname, '"AdminUser"', 'SELECT')
  LOOP
    EXECUTE format('GRANT UPDATE ("deletedAt") ON "Lead" TO %I', runtime_role);
  END LOOP;
  FOR runtime_role IN
    SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_worker(_[a-f0-9]+)?$'
      AND has_table_privilege(rolname, '"OutboxEvent"', 'SELECT')
      AND has_table_privilege(rolname, '"OutboxEvent"', 'UPDATE')
  LOOP
    EXECUTE format('GRANT SELECT ("id", "deletedAt") ON "Lead" TO %I', runtime_role);
  END LOOP;
END $$;
