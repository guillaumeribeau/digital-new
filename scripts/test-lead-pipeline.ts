import EmbeddedPostgres from "embedded-postgres";
import { randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { readFile, writeFile } from "node:fs/promises";

async function run(args: string[], env: NodeJS.ProcessEnv) {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error("TEST_COMMAND_FAILED")));
  });
}
async function freePort() {
  return new Promise<number>((resolvePort) => {
    const server = createServer(); server.listen(0, "127.0.0.1", () => {
      const address = server.address(); if (!address || typeof address === "string") throw new Error("NO_TEST_PORT");
      server.close(() => resolvePort(address.port));
    });
  });
}
async function ready(url: string) {
  for (let i = 0; i < 60; i++) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (response.ok) return; }
    catch { /* Server is compiling. */ }
    await new Promise((resolveReady) => setTimeout(resolveReady, 500));
  }
  throw new Error("TEST_SERVER_NOT_READY");
}
async function stopServer(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === "win32") await new Promise<void>((resolveStop) => {
    const stop = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    stop.on("exit", () => resolveStop()); stop.on("error", () => resolveStop());
  });
  else child.kill("SIGTERM");
}
async function main() {
  const port = await new Promise<number>((resolvePort) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("NO_TEST_PORT");
      server.close(() => resolvePort(address.port));
    });
  });
  const password = randomBytes(24).toString("hex");
  const directory = resolve("reports", "postgres-test", randomUUID());
  const postgres = new EmbeddedPostgres({ databaseDir: directory, user: "postgres", password, port,
    persistent: true, createPostgresUser: false, postgresFlags: ["-h", "127.0.0.1"],
    onLog: () => {}, onError: () => {} });
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "test", DATABASE_URL:
    `postgresql://postgres:${password}@127.0.0.1:${port}/lead_pipeline_test?sslmode=disable`,
    DIRECT_URL: "", OUTBOX_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    DATABASE_SSL_CA: "", DATABASE_POOL_MAX: "3", VERCEL: "",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000", RESEND_API_KEY: "test-not-a-real-key",
    LEAD_FROM_EMAIL: "NOVA <sender@example.com>", LEAD_TO_EMAIL: "internal@example.com",
    UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", TRUSTED_CLIENT_IP_HEADER: "",
    BETTER_AUTH_URL: "http://localhost:3001", BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
    COMMERCIAL_MODE: "local", COMMERCIAL_PUBLIC_URL: "http://localhost:3001", COMMERCIAL_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    COMMERCIAL_FROM_EMAIL: "NOVA Test <sender@example.com>", COMMERCIAL_REPLY_DOMAIN: "reponses.nova.test",
    STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "", RESEND_WEBHOOK_SECRET: "",
  };
  try {
    await postgres.initialise();
    await postgres.start();
    await postgres.createDatabase("lead_pipeline_test");
    await run(["node_modules/prisma/build/index.js", "migrate", "deploy"], env);
    await run(["--import", "tsx", "scripts/wait-for-migrations.ts"], env);
    await run(["--import", "tsx", "--test", "tests/integration/pipeline.test.ts"], env);
    await run(["--import", "tsx", "--test", "tests/integration/admin.test.ts"], env);
    await run(["--import", "tsx", "--test", "tests/integration/commercial.test.ts"], env);
    await run(["--import", "tsx", "--test", "tests/integration/site-billing.test.ts"], env);
    if (process.argv.includes("--ui") || process.argv.includes("--commercial-ui") || process.argv.includes("--trash-ui") || process.argv.includes("--billing-ui")) {
      const adminPort = await freePort(), websitePort = await freePort();
      const uiEnv: NodeJS.ProcessEnv & { BETTER_AUTH_URL: string; NEXT_PUBLIC_SITE_URL: string } = { ...env, BETTER_AUTH_URL: `http://127.0.0.1:${adminPort}`, NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${websitePort}`, NEXT_PUBLIC_GTM_ID: "", NEXT_TELEMETRY_DISABLED: "1" };
      Object.assign(uiEnv, { LEAD_EMAIL_MODE: "local", LOCAL_EMAIL_PREVIEW_TOKEN: randomBytes(32).toString("hex") });
      Object.assign(uiEnv, { COMMERCIAL_PUBLIC_URL: uiEnv.BETTER_AUTH_URL });
      if (process.argv.includes("--billing-ui")) uiEnv.STRIPE_SECRET_KEY = "sk_test_billing_ui_fixture";
      const nextEnv: NodeJS.ProcessEnv = { ...uiEnv, NODE_ENV: "development", NOVA_UI_TEST: "1" };
      const servers: ChildProcess[] = [];
      const generatedFiles = ["apps/admin/tsconfig.json", "apps/admin/next-env.d.ts", "apps/website/tsconfig.json", "apps/website/next-env.d.ts"];
      const previousFiles = await Promise.all(generatedFiles.map(async (file) => ({ file, text: await readFile(file, "utf8") })));
      try {
        servers.push(spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "apps/admin", "--hostname", "127.0.0.1", "--port", String(adminPort)], { env: nextEnv, windowsHide: true, stdio: "inherit" }));
        servers.push(spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "apps/website", "--hostname", "127.0.0.1", "--port", String(websitePort)], { env: nextEnv, windowsHide: true, stdio: "inherit" }));
        await Promise.all([ready(uiEnv.BETTER_AUTH_URL + "/connexion"), ready(uiEnv.NEXT_PUBLIC_SITE_URL + "/")]);
        if (process.argv.includes("--billing-ui")) await run(["--import", "tsx", "scripts/check-site-billing-ui.ts"], uiEnv);
        else if (process.argv.includes("--trash-ui")) await run(["--import", "tsx", "scripts/check-lead-trash-ui.ts"], uiEnv);
        else {
        if (!process.argv.includes("--commercial-ui")) await run(["--import", "tsx", "scripts/check-admin-ui.ts"], uiEnv);
        await run(["--import", "tsx", "scripts/check-commercial-ui.ts"], uiEnv);
        if (!process.argv.includes("--commercial-ui")) {
          await run(["scripts/check-lead-form.mjs"], { ...uiEnv, QA_BASE_URL: uiEnv.NEXT_PUBLIC_SITE_URL });
          await run(["scripts/check-lead-verification.mjs"], { ...uiEnv, QA_BASE_URL: uiEnv.NEXT_PUBLIC_SITE_URL });
        }
        }
      } finally {
        await Promise.all(servers.map(stopServer));
        // Next rewrites these files for the test output directory. Restore the
        // normal development configuration once the isolated servers stop.
        await Promise.all(previousFiles.map(({ file, text }) => writeFile(file, text)));
      }
    }
  } finally { await postgres.stop(); }
}
main().catch((error) => { console.error("Isolated PostgreSQL integration tests failed:", error); process.exit(1); });
