import { loadEnvConfig } from "@next/env";
import { resolve } from "node:path";
import { getDb } from "../apps/website/lib/db";
import { processOutbox } from "../apps/website/lib/outbox";
import { processCommercialOutbox } from "../apps/admin/lib/commercial-mail";
import { outboxFailureReason } from "./outbox-diagnostics";

if (!process.env.NODE_ENV) Object.assign(process.env, { NODE_ENV: "development" });
loadEnvConfig(resolve("apps/website"));
if (process.env.WORKER_DATABASE_URL) process.env.DATABASE_URL = process.env.WORKER_DATABASE_URL;
async function main() {
  const continuous = process.argv.includes("--watch");
  let stopping = false;
  process.on("SIGTERM", () => { stopping = true; });
  process.on("SIGINT", () => { stopping = true; });
  do {
    let cycleError: string | null = null;
    try { const result = await processOutbox(); if (result.failed) cycleError = "LEAD_DELIVERY_FAILED"; console.log(JSON.stringify(result)); }
    catch (error) { cycleError = outboxFailureReason(error); console.error(JSON.stringify({ error: "outbox_processing_unavailable", reason: outboxFailureReason(error) })); if (!continuous) process.exitCode = 1; }
    if (process.env.COMMERCIAL_ENCRYPTION_KEY) {
      try { const result = await processCommercialOutbox(); if (result.failed) cycleError = "COMMERCIAL_DELIVERY_FAILED"; console.log(JSON.stringify({ commercial: result })); }
      catch (error) { cycleError = outboxFailureReason(error); console.error(JSON.stringify({ error: "commercial_outbox_processing_unavailable", reason: outboxFailureReason(error) })); if (!continuous) process.exitCode = 1; }
    }
    if (!process.env.COMMERCIAL_ENCRYPTION_KEY) cycleError ||= "COMMERCIAL_NOT_CONFIGURED";
    try { await getDb().serviceHeartbeat.upsert({ where: { id: "mail-worker" }, create: { id: "mail-worker", lastSeenAt: new Date(), lastSuccessAt: cycleError ? null : new Date(), lastError: cycleError || (!process.env.COMMERCIAL_ENCRYPTION_KEY ? "COMMERCIAL_NOT_CONFIGURED" : null) }, update: { lastSeenAt: new Date(), ...(!cycleError ? { lastSuccessAt: new Date() } : {}), lastError: cycleError || (!process.env.COMMERCIAL_ENCRYPTION_KEY ? "COMMERCIAL_NOT_CONFIGURED" : null) } }); } catch { console.error("worker_heartbeat_unavailable"); }
    if (continuous && !stopping) await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (continuous && !stopping);
}
main().catch((error) => { console.error(JSON.stringify({ error: "outbox_worker_failed", reason: outboxFailureReason(error) })); process.exitCode = 1; })
  .finally(async () => { try { await getDb().$disconnect(); } catch { /* No configured database. */ } });
