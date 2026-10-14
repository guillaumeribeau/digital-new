import { loadEnvConfig } from "@next/env";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { localEmailMode } from "../apps/website/lib/local-email";

loadEnvConfig(resolve("apps/website"), true);
if (!process.env.NODE_ENV) Object.assign(process.env, { NODE_ENV: "development" });
if (!localEmailMode()) throw new Error("LOCAL_EMAIL_MODE_NOT_CONFIGURED");
const url = new URL("/emails-locaux", process.env.NEXT_PUBLIC_SITE_URL);
url.hash = new URLSearchParams({ key: process.env.LOCAL_EMAIL_PREVIEW_TOKEN! }).toString();
const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Start-Process $env:NOVA_LOCAL_EMAIL_URL"], {
  env: { ...process.env, NOVA_LOCAL_EMAIL_URL: url.href }, windowsHide: true, stdio: "ignore",
});
child.on("error", () => { console.error("Impossible d’ouvrir la boîte locale."); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code || 0; });
