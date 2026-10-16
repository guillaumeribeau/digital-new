import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { expectedMigrations, migrationsReady, type AppliedMigration } from "../scripts/wait-for-migrations";

test("le deploiement exige chaque migration terminee avec le bon checksum", async () => {
  const expected = await expectedMigrations();
  assert.ok(expected.length >= 7);
  const rows: AppliedMigration[] = expected.map(m => ({ migration_name: m.name, checksum: m.checksums[0], finished_at: new Date(), rolled_back_at: null }));
  assert.equal(migrationsReady(expected, rows), true);
  assert.equal(migrationsReady(expected, rows.slice(1)), false);
  assert.equal(migrationsReady(expected, rows.map((r, i) => i ? r : { ...r, finished_at: null })), false);
  assert.equal(migrationsReady(expected, rows.map((r, i) => i ? r : { ...r, rolled_back_at: new Date() })), false);
  assert.equal(migrationsReady(expected, rows.map((r, i) => i ? r : { ...r, checksum: "wrong" })), false);
  assert.equal(migrationsReady(expected, [...rows.map(r => ({ ...r, rolled_back_at: new Date() })), ...rows]), true);
  assert.equal(migrationsReady([], []), false);
});

test("base indisponible : attente bornee, echec du deploiement et secrets absents des logs", () => {
  const secret = "never-print-this-migration-password";
  const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/wait-for-migrations.ts"], {
    env: { ...process.env, DATABASE_URL: `postgresql://test:${secret}@127.0.0.1:1/missing`, MIGRATION_WAIT_TIMEOUT_SECONDS: "1" },
    encoding: "utf8", timeout: 10000, windowsHide: true,
  });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("MIGRATIONS_NOT_READY"));
  assert.ok(!(result.stdout + result.stderr).includes(secret));
});
