import { loadEnvConfig } from "@next/env";
import { resolve } from "node:path";
import { getDb } from "../apps/website/lib/db";
import { processOutbox } from "../apps/website/lib/outbox";
import { processCommercialOutbox } from "../apps/admin/lib/commercial-mail";

if (!process.env.NODE_ENV) Object.assign(process.env, { NODE_ENV: "development" });
loadEnvConfig(resolve("apps/website"));
if (process.env.WORKER_DATABASE_URL) process.env.DATABASE_URL = process.env.WORKER_DATABASE_URL;
async function main() {
  const continuous = process.argv.includes("--watch");
  let stopping = false;
  process.on("SIGTERM", () => { stopping = true; });
  process.on("SIGINT", () => { stopping = true; });
  do {
    try { console.log(JSON.stringify(await processOutbox())); }
    catch { console.error("outbox_processing_unavailable"); if (!continuous) process.exitCode = 1; }
    if (process.env.COMMERCIAL_ENCRYPTION_KEY) {
      try { console.log(JSON.stringify({ commercial: await processCommercialOutbox() })); }
      catch { console.error("commercial_outbox_processing_unavailable"); if (!continuous) process.exitCode = 1; }
    }
    if (continuous && !stopping) await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (continuous && !stopping);
}
main().catch(() => { console.error("outbox_worker_failed"); process.exitCode = 1; })
  .finally(async () => { try { await getDb().$disconnect(); } catch { /* No configured database. */ } });
