import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const results = [], errors = [];
await mkdir("reports/verification", { recursive: true });
try {
  for (const width of [375, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    page.on("pageerror", (error) => errors.push(error.message));
    let calls = 0, success = false;
    const token = "a".repeat(43);
    await page.route("**/api/leads/verify", async (route) => {
      calls++;
      assert.equal(route.request().postDataJSON().token, token);
      await route.fulfill({ status: success ? 200 : 400, contentType: "application/json",
        body: JSON.stringify(success ? { success: true } : { error: "Lien de contrôle expiré." }) });
    });
    await page.route("**/api/leads/resend", (route) => route.fulfill({ status: 202, contentType: "application/json",
      body: JSON.stringify({ success: true, message: "Si une demande correspond, un lien sera envoyé." }) }));
    await page.goto(base + "/confirmer-demande#token=" + token);
    await page.waitForFunction(() => !window.location.hash);
    assert.equal(calls, 0, "Aucun jeton consommé automatiquement");
    await page.getByRole("button", { name: "Confirmer mon adresse e-mail" }).click();
    await page.getByRole("alert").filter({ hasText: "Lien de contrôle expiré." }).waitFor();
    await page.getByLabel("Référence de votre demande").fill("7a17bfde-1754-40bf-a5cd-1a353b69e3cb");
    await page.getByLabel("Votre adresse e-mail").fill("fictif@example.com");
    await page.locator('.anti-bot[data-verified="true"]').waitFor();
    await page.getByRole("button", { name: "Demander un nouveau lien" }).click();
    await page.getByRole("status").filter({ hasText: "Si une demande correspond" }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `reports/verification/confirmation-${width}.png`, fullPage: true });
    success = true;
    await page.getByRole("button", { name: "Confirmer mon adresse e-mail" }).click();
    await page.getByRole("heading", { name: "Votre demande est confirmée." }).waitFor();
    assert.equal(calls, 2);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    results.push({ width, explicitConfirmation: true, tokenRemoved: true, resend: true, success: true });
    await page.close();
  }
  const context = await browser.newContext();
  for (const path of ["/api/leads", "/api/leads/verify", "/api/leads/resend"]) {
    for (const method of ["GET", "PATCH", "DELETE"]) {
      const response = await context.request.fetch(base + path, { method });
      assert.equal(response.status(), 405, `${method} ${path}`);
    }
  }
  await context.close();
  assert.deepEqual(errors, []);
  await writeFile("reports/verification/checks.json", JSON.stringify({ results, errors, unauthorizedReads: "405" }, null, 2));
  console.log("Confirmation : 4 largeurs, fragment retiré, action explicite, renvoi, erreurs et accès interdits — OK.");
} finally { await browser.close(); }
