import { loadEnvConfig } from "@next/env";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { Client } from "pg";
import { grantCommercialPermissions } from "./commercial-permissions";

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const envLog = { info() {}, error() {} };
  loadEnvConfig(root, true, envLog, true); const owner = process.env.DATABASE_URL;
  loadEnvConfig(resolve(root, "apps/admin"), true, envLog, true); const adminUrl = process.env.DATABASE_URL;
  const previousKey = process.env.COMMERCIAL_ENCRYPTION_KEY;
  loadEnvConfig(resolve(root, "apps/website"), true, envLog, true); const workerUrl = process.env.WORKER_DATABASE_URL;
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;
  for (const value of [owner, adminUrl, workerUrl]) {
    const url = new URL(value || "");
    if (url.hostname !== "127.0.0.1" || url.pathname !== "/nova" || url.port !== "5432") throw new Error("LOCAL_CONNECTION_REQUIRED");
  }
  const admin = decodeURIComponent(new URL(adminUrl!).username), worker = decodeURIComponent(new URL(workerUrl!).username);
  if (!/^nova_admin_[a-f0-9]+$/.test(admin) || !/^nova_worker_[a-f0-9]+$/.test(worker)) throw new Error("LOCAL_RUNTIME_REQUIRED");
  await new Promise<void>((done, reject) => {
    const child = spawn(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { cwd: root, env: { ...process.env, DATABASE_URL: owner, DIRECT_URL: owner }, windowsHide: true, stdio: "inherit" });
    child.on("error", reject); child.on("exit", (code) => code === 0 ? done() : reject(new Error("MIGRATION_FAILED")));
  });
  const db = new Client({ connectionString: owner, connectionTimeoutMillis: 5000 }); await db.connect();
  try {
    await db.query("BEGIN");
    await grantCommercialPermissions(db, admin, worker);
    await db.query("COMMIT");
  } catch (error) { await db.query("ROLLBACK"); throw error; } finally { await db.end(); }
  const key = previousKey || randomBytes(32).toString("base64");
  const values = { COMMERCIAL_MODE: "local", COMMERCIAL_PUBLIC_URL: "http://localhost:3001", COMMERCIAL_ENCRYPTION_KEY: key,
    COMMERCIAL_FROM_EMAIL: "", COMMERCIAL_REPLY_DOMAIN: "", RESEND_API_KEY: "", RESEND_WEBHOOK_SECRET: "", STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "" };
  for (const app of ["admin", "website"]) {
    const path = resolve(root, `apps/${app}/.env.local`); let text = await readFile(path, "utf8");
    for (const [name, value] of Object.entries(values)) {
      const pattern = new RegExp(`^${name}=.*$`, "m");
      if (!pattern.test(text)) text = text.trimEnd() + `\n${name}=${value}\n`;
      else if (["COMMERCIAL_MODE", "COMMERCIAL_PUBLIC_URL", "COMMERCIAL_ENCRYPTION_KEY"].includes(name)) text = text.replace(pattern, `${name}=${value}`);
    }
    await writeFile(path, text);
  }
  console.log("Module commercial local configuré. Aucun e-mail réel ni débit bancaire n’est déclenché.");
  console.log(`Site : ${publicUrl || "http://localhost:3000"} · Administration : http://localhost:3001`);
}
main().catch(() => { console.error("Configuration commerciale locale incomplète. Vérifiez les connexions locales et les droits opérateur. Aucun secret n’est affiché."); process.exitCode = 1; });
