-- Runtime services only read migration completion. Schema modification remains
-- exclusive to the owner connection in the dedicated migrations service.
DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN
    SELECT rolname FROM pg_roles
    WHERE rolname ~ '^nova_(web|admin|worker)(_[a-f0-9]+)?$'
      AND has_schema_privilege(rolname, 'public', 'USAGE')
  LOOP
    EXECUTE format('GRANT SELECT (migration_name, checksum, finished_at, rolled_back_at) ON "_prisma_migrations" TO %I', runtime_role);
  END LOOP;
END $$;
