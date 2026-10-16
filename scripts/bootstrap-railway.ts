// One-shot operator task. Never use its owner connection on a web service.
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { promisify } from "node:util";
import pg from "pg";
import { z } from "zod";
import { grantCommercialPermissions } from "./commercial-permissions";

async function main() {
  if (process.env.RAILWAY_BOOTSTRAP !== "1" || !process.env.BOOTSTRAP_PROJECT_ID || process.env.RAILWAY_PROJECT_ID !== process.env.BOOTSTRAP_PROJECT_ID) throw new Error("BOOTSTRAP_CONTEXT_REQUIRED");
  const url = new URL(process.env.DATABASE_URL || "");
  if (!url.hostname.endsWith(".railway.internal") || url.protocol !== "postgresql:") throw new Error("PRIVATE_DATABASE_REQUIRED");
  const role = z.object({ name: z.string().regex(/^nova_(?:web|admin|worker)_[a-f0-9]{10}$/), password: z.string().regex(/^[A-Za-z0-9_-]{40,100}$/) });
  const roles = z.object({ website: role, admin: role, worker: role }).parse(JSON.parse(process.env.BOOTSTRAP_ROLES || ""));
  if (new Set(Object.values(roles).map(item => item.name)).size !== 3) throw new Error("DISTINCT_ROLES_REQUIRED");
  const user = z.object({ name: z.string().min(2).max(100), email: z.email().max(254), password: z.string().min(32).max(1000) }).parse(JSON.parse(process.env.BOOTSTRAP_ADMIN || ""));
  await promisify(execFile)(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], { env: { ...process.env, DIRECT_URL: url.toString() }, timeout: 120000 });
  const db = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
  await db.connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(762401)");
    const counts = await db.query('SELECT (SELECT count(*) FROM "Lead") + (SELECT count(*) FROM auth_user) AS count');
    if (Number(counts.rows[0].count) !== 0) throw new Error("FRESH_DATABASE_REQUIRED");
    const database = (await db.query("SELECT current_database() AS name")).rows[0].name as string;
    if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error("INVALID_DATABASE_NAME");
    for (const item of Object.values(roles)) {
      await db.query(`CREATE ROLE "${item.name}" LOGIN PASSWORD '${item.password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
      await db.query(`GRANT CONNECT ON DATABASE "${database}" TO "${item.name}"`);
      await db.query(`GRANT USAGE ON SCHEMA public TO "${item.name}"`);
    }
    const web = `"${roles.website.name}"`, admin = `"${roles.admin.name}"`, worker = `"${roles.worker.name}"`;
    await db.query(`GRANT SELECT (migration_name, checksum, finished_at, rolled_back_at) ON "_prisma_migrations" TO ${web}, ${admin}, ${worker}`);
    await db.query(`GRANT SELECT, INSERT ON "Lead" TO ${web}`);
    await db.query(`GRANT UPDATE ("status", "emailVerifiedAt", "updatedAt") ON "Lead" TO ${web}`);
    await db.query(`GRANT SELECT, INSERT, UPDATE ON "EmailVerificationToken", "OutboxEvent" TO ${web}`);
    await db.query(`GRANT SELECT ON "Lead", "LeadFile", "AdminUser" TO ${admin}`);
    await db.query(`GRANT UPDATE ("status", "updatedAt", "deletedAt") ON "Lead" TO ${admin}`);
    await db.query(`GRANT SELECT, INSERT, UPDATE ON "Project" TO ${admin}`);
    await db.query(`GRANT SELECT, INSERT ON "InternalNote", "ActivityLog" TO ${admin}`);
    await db.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON auth_user, auth_session, auth_account, auth_verification, auth_two_factor, "AuthRateBucket" TO ${admin}`);
    await db.query(`GRANT SELECT, UPDATE ON "OutboxEvent" TO ${worker}`);
    await db.query(`GRANT SELECT ("id", "deletedAt") ON "Lead" TO ${worker}`);
    await grantCommercialPermissions(db, roles.admin.name, roles.worker.name);
    await db.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
    const id = randomUUID();
    await db.query('INSERT INTO auth_user (id,name,email,"emailVerified","updatedAt") VALUES ($1,$2,$3,true,now())', [id,user.name,user.email]);
    await db.query('INSERT INTO auth_account (id,"userId","accountId","providerId",password,"updatedAt") VALUES ($1,$2::uuid,$2::text,\'credential\',$3,now())', [randomUUID(),id,user.password]);
    await db.query('INSERT INTO "AdminUser" (id,"userId") VALUES ($1,$2)', [randomUUID(),id]);
    await db.query("COMMIT");
    console.log("RAILWAY_BOOTSTRAP_COMPLETED: migrations, restricted roles and administrator ready. No client data transferred.");
  } catch (error) { await db.query("ROLLBACK"); throw error; }
  finally { await db.end(); }
}
main().catch(() => { console.error("RAILWAY_BOOTSTRAP_FAILED: check the operator task configuration. No secret logged."); process.exitCode = 1; });
