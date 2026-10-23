-- The mail worker checks that a site proposal is still relevant before sending.
-- Grant only the columns used by this check to existing worker runtime roles.
DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN
    SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_worker(_[a-f0-9]+)?$'
      AND has_table_privilege(rolname, '"OutboxEvent"', 'UPDATE')
      AND has_table_privilege(rolname, '"CommercialEmail"', 'UPDATE')
  LOOP
    EXECUTE format('GRANT SELECT ("id", "projectId", "creationPaidAt", "firstSubscriptionPaidAt") ON "SiteOrder" TO %I', runtime_role);
    EXECUTE format('GRANT SELECT ("id", "leadId", "stage") ON "Project" TO %I', runtime_role);
    EXECUTE format('GRANT SELECT ("id", "deletedAt") ON "Lead" TO %I', runtime_role);
  END LOOP;
END $$;
