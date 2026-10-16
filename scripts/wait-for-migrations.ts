import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Client } from "pg";

export type ExpectedMigration = { name: string; checksums: string[] };
export type AppliedMigration = { migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null };
const checksum = (text: string) => createHash("sha256").update(text).digest("hex");
export async function expectedMigrations(directory = resolve("packages/database/prisma/migrations")): Promise<ExpectedMigration[]> {
  const dirs = (await readdir(directory, { withFileTypes: true })).filter(d => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  if (!dirs.length) throw new Error("NO_VERSIONED_MIGRATIONS");
  return Promise.all(dirs.map(async d => {
    const sql = await readFile(resolve(directory, d.name, "migration.sql"), "utf8");
    // Prisma tolerates different checkout line endings on Windows and Linux.
    const unix = sql.replace(/\r\n/g, "\n");
    return { name: d.name, checksums: [...new Set([sql, unix, unix.replace(/\n/g, "\r\n")].map(checksum))] };
  }));
}
export function migrationsReady(expected: ExpectedMigration[], applied: AppliedMigration[]) {
  return expected.length > 0 && expected.every(migration => applied.some(row => row.migration_name === migration.name && row.finished_at !== null && row.rolled_back_at === null && migration.checksums.includes(row.checksum)));
}
export async function waitForMigrations() {
  const expected = await expectedMigrations();
  const connectionString = process.argv.includes("--worker") ? process.env.WORKER_DATABASE_URL || process.env.DATABASE_URL : process.env.DATABASE_URL;
  if (!connectionString) throw new Error("MIGRATION_WAIT_DATABASE_REQUIRED");
  const seconds = Number(process.env.MIGRATION_WAIT_TIMEOUT_SECONDS || 300);
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 1800) throw new Error("INVALID_MIGRATION_WAIT_TIMEOUT");
  const deadline = Date.now() + seconds * 1000;
  console.log(`Attente de ${expected.length} migrations avant demarrage (limite ${seconds}s).`);
  do {
    const remaining = Math.max(1, Math.min(5000, deadline - Date.now()));
    const client = new Client({ connectionString, connectionTimeoutMillis: remaining, query_timeout: remaining,
      ...(process.env.DATABASE_SSL_CA ? { ssl: { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true } } : {}),
    });
    try {
      await client.connect();
      const result = await client.query<AppliedMigration>('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"');
      if (migrationsReady(expected, result.rows)) { console.log("Migrations confirmees. Demarrage autorise."); return; }
    } catch {
      // A fresh deployment may start before the migrator grants read access.
      // Never print connection strings, database errors or credentials.
    } finally { await client.end().catch(() => {}); }
    if (Date.now() < deadline) await new Promise(r => setTimeout(r, Math.min(2000, deadline - Date.now())));
  } while (Date.now() < deadline);
  throw new Error("MIGRATIONS_NOT_READY: verifier le service migrations et sa connexion proprietaire. Aucun demarrage autorise.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  waitForMigrations().catch(error => {
    const allowed = ["NO_VERSIONED_MIGRATIONS", "MIGRATION_WAIT_DATABASE_REQUIRED", "INVALID_MIGRATION_WAIT_TIMEOUT"];
    console.error(allowed.includes(error?.message) || error?.message?.startsWith("MIGRATIONS_NOT_READY:") ? error.message : "MIGRATION_READINESS_FAILED");
    process.exitCode = 1;
  });
}
