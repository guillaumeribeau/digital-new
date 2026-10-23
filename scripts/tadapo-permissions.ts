import type { Client } from "pg";
/** Run by the database owner, never by the public application. */
export async function grantTadapoPermissions(db: Client, role: string) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/i.test(role)) throw new Error("INVALID_RUNTIME_ROLE");
  const r = `"${role}"`;
  await db.query(`GRANT USAGE ON SCHEMA public TO ${r}`);
  await db.query(`GRANT SELECT, INSERT, UPDATE ON "TadapoOrder", "TadapoFeedback" TO ${r}`);
  await db.query(`GRANT SELECT ON "TadapoInvoice" TO ${r}`);
  await db.query(`GRANT SELECT ("id", "leadId", "previewUrl", "websiteUrl") ON "Project" TO ${r}`);
  await db.query(`GRANT UPDATE ("stage", "updatedAt") ON "Project" TO ${r}`);
  await db.query(`GRANT SELECT ("id", "deletedAt") ON "Lead" TO ${r}`);
  await db.query(`GRANT SELECT (migration_name, checksum, finished_at, rolled_back_at) ON "_prisma_migrations" TO ${r}`);
}
