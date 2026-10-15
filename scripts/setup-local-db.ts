import { Client } from "pg";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { hiddenPassword } from "./password-prompt";
import { grantCommercialPermissions } from "./commercial-permissions";

const database = "nova";
const hostname = "127.0.0.1";
const port = 5432;
const root = resolve(import.meta.dirname, "..");
let currentStep = "starting";
async function report(value: Record<string, unknown>) {
  await mkdir(resolve(root, "reports"), { recursive: true });
  await writeFile(resolve(root, "reports/local-database-setup.json"), JSON.stringify({ ...value, updatedAt: new Date().toISOString() }, null, 2));
}
function connection(user: string, password: string, name = database) {
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${hostname}:${port}/${name}?sslmode=disable`;
}
async function setEnv(file: string, example: string | undefined, entries: Record<string, string>) {
  let text = await readFile(file, "utf8").catch(async () => example ? readFile(example, "utf8") : "");
  for (const [key, value] of Object.entries(entries)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    text = pattern.test(text) ? text.replace(pattern, `${key}=${value}`) : text.trimEnd() + `\n${key}=${value}\n`;
  }
  await writeFile(file, text, { mode: 0o600 });
}
async function command(args: string[], env: NodeJS.ProcessEnv) {
  await new Promise<void>((resolveCommand, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolveCommand() : reject(new Error("COMMAND_FAILED")));
  });
}
async function main() {
  await report({ success: false, status: "awaiting_local_credentials" });
  console.log("Configuration PostgreSQL locale · 127.0.0.1:5432 · base nova");
  console.log("Le mot de passe PostgreSQL sera saisi ici, sans affichage. Aucune base n’est supprimée.");
  if (!process.stdin.isTTY) throw new Error("TERMINAL_REQUIRED");
  currentStep = "username_entry";
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let user: string;
  try { user = (await terminal.question("Utilisateur PostgreSQL [postgres] : ")).trim() || "postgres"; }
  finally { terminal.close(); }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(user)) throw new Error("INVALID_USER");
  currentStep = "password_entry";
  const password = await hiddenPassword("Mot de passe PostgreSQL choisi à l’installation (saisie masquée) : ");
  if (!password) throw new Error("EMPTY_PASSWORD");
  currentStep = "postgres_connection";
  const operatorUrl = connection(user, password);
  const system = new Client({ connectionString: connection(user, password, "postgres"), connectionTimeoutMillis: 5000 });
  try {
    await system.connect();
    const existing = await system.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (!existing.rowCount) { await system.query('CREATE DATABASE "nova"'); console.log("Base nova créée."); }
    else console.log("Base nova existante conservée.");
  } finally { await system.end().catch(() => {}); }
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: operatorUrl, DIRECT_URL: operatorUrl };
  currentStep = "migrations";
  await report({ success: false, status: "applying_migrations" });
  await command(["node_modules/prisma/build/index.js", "migrate", "deploy"], env);
  const db = new Client({ connectionString: operatorUrl, connectionTimeoutMillis: 5000 });
  await db.connect();
  currentStep = "runtime_configuration";
  try {
    const suffix = randomBytes(5).toString("hex");
    const users = { website: `nova_web_${suffix}`, admin: `nova_admin_${suffix}`, worker: `nova_worker_${suffix}` };
    const passwords = Object.fromEntries(Object.keys(users).map((name) => [name, randomBytes(32).toString("base64url")]));
    await db.query("BEGIN");
    try {
      // Names and passwords are generated from restricted alphabets, never from SQL user input.
      for (const [name, login] of Object.entries(users)) {
        await db.query(`CREATE ROLE "${login}" LOGIN PASSWORD '${passwords[name]}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
        await db.query(`GRANT CONNECT ON DATABASE "nova" TO "${login}"`);
        await db.query(`GRANT USAGE ON SCHEMA public TO "${login}"`);
      }
      const web = `"${users.website}"`, admin = `"${users.admin}"`, worker = `"${users.worker}"`;
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
      await grantCommercialPermissions(db, users.admin, users.worker);
      await db.query("COMMIT");
    } catch (error) { await db.query("ROLLBACK"); throw error; }
    await setEnv(resolve(root, ".env.local"), undefined, { DATABASE_URL: operatorUrl, DIRECT_URL: "" });
    await setEnv(resolve(root, "apps/website/.env.local"), resolve(root, "apps/website/.env.example"), {
      DATABASE_URL: connection(users.website, passwords.website), DIRECT_URL: "", NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      WORKER_DATABASE_URL: connection(users.worker, passwords.worker),
      LEAD_EMAIL_MODE: "local",
    });
    await setEnv(resolve(root, "apps/admin/.env.local"), resolve(root, "apps/admin/.env.example"), {
      DATABASE_URL: connection(users.admin, passwords.admin), DIRECT_URL: "", BETTER_AUTH_URL: "http://localhost:3001",
    });
    // Preserve security keys already configured; supply missing keys only.
    for (const [file, keys] of [["apps/admin/.env.local", ["BETTER_AUTH_SECRET", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY", "COMMERCIAL_ENCRYPTION_KEY"]],
      ["apps/website/.env.local", ["OUTBOX_ENCRYPTION_KEY", "LOCAL_EMAIL_PREVIEW_TOKEN"]]] as const) {
      const path = resolve(root, file), text = await readFile(path, "utf8");
      const additions: Record<string, string> = {};
      for (const key of keys) if (!new RegExp(`^${key}=.+$`, "m").test(text)) additions[key] = randomBytes(32).toString("base64");
      if (Object.keys(additions).length) await setEnv(path, undefined, additions);
    }
    const commercialText = await readFile(resolve(root, "apps/admin/.env.local"), "utf8");
    const commercialKey = commercialText.match(/^COMMERCIAL_ENCRYPTION_KEY=(.+)$/m)?.[1]?.trim();
    if (!commercialKey) throw new Error("COMMERCIAL_KEY_REQUIRED");
    for (const app of ["admin", "website"]) await setEnv(resolve(root, `apps/${app}/.env.local`), undefined, {
      COMMERCIAL_MODE: "local", COMMERCIAL_PUBLIC_URL: "http://localhost:3001", COMMERCIAL_ENCRYPTION_KEY: commercialKey,
    });
    // Check the actual runtime identities, not just the operator connection.
    for (const [name, login] of Object.entries(users)) {
      const runtime = new Client({ connectionString: connection(login, passwords[name]), connectionTimeoutMillis: 5000 });
      try { await runtime.connect(); await runtime.query(name === "worker" ? 'SELECT count(*) FROM "OutboxEvent"' : 'SELECT count(*) FROM "Lead"'); }
      finally { await runtime.end().catch(() => {}); }
    }
    const count = await db.query('SELECT count(*)::integer AS count FROM "AdminUser"');
    if (count.rows[0].count === 0) {
      currentStep = "admin_creation";
      console.log("La base est connectée. Créez maintenant votre premier compte administrateur.");
      await command(["--import", "tsx", "scripts/create-admin.ts"], env);
    } else console.log("Un compte administrateur existe déjà : il a été conservé.");
    await report({ success: true, status: "complete", host: hostname, port, database, migrationsApplied: true, runtimeConnectionsVerified: true });
    console.log("Configuration terminée. Redémarrez le site et l’administration, puis ouvrez http://localhost:3001.");
  } finally { await db.end().catch(() => {}); }
}
main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  const known = ["TERMINAL_REQUIRED", "INVALID_USER", "EMPTY_PASSWORD", "CANCELLED", "COMMAND_FAILED", "INTERACTIVE_TERMINAL_REQUIRED"];
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : known.includes(message) ? message : "SETUP_INCOMPLETE";
  await report({ success: false, status: "failed", step: currentStep, code,
    ...(currentStep === "admin_creation" ? { databaseConfigured: true, migrationsApplied: true, runtimeConnectionsVerified: true } : {}),
  }).catch(() => {});
  console.error(`Configuration non terminée · étape ${currentStep} · code ${code}. Aucun secret n’est affiché.`);
  process.exitCode = 1;
});
