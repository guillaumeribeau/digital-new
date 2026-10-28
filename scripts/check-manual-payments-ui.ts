import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { getDb } from "@nova/database";
import { seal } from "../apps/admin/lib/commercial-core";

async function main() {
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
  const db = getDb(), base = process.env.BETTER_AUTH_URL!;
  const site = await db.siteOrder.findFirstOrThrow({ where: { creationPaidAt: null, project: { lead: { email: "same-manual@example.test", brand: "zelyweb" } } } });
  const source = await db.tadapoOrder.findFirstOrThrow({ where: { brief: { path: ["company"], equals: "Entreprise Tadapo Manuelle" } } });
  const order = await db.tadapoOrder.create({ data: { requestId: randomUUID(), payloadHash: source.payloadHash, brief: { ...(source.brief as Record<string, string>), company: "Commande Tadapo UI en attente" }, offerSnapshot: source.offerSnapshot!, consentSnapshot: source.consentSnapshot!, mode: "LIVE", tokenHash: randomUUID().replaceAll("-", "").padEnd(64, "0"), tokenEncrypted: seal("fixture") } });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  await mkdir("reports/manual-payments", { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(), errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill("manual-payments-admin@example.test");
    await page.getByLabel("Mot de passe", { exact: true }).fill("ManualPayments-Test-42!");
    await page.getByRole("button", { name: "Accéder à mon espace" }).click();
    await page.waitForURL(base + "/");
    await page.goto(`${base}/projets/${site.projectId}`);
    const creation = page.locator("#manual-site_creation");
    await creation.getByLabel("État du paiement").selectOption("PAID");
    await creation.getByLabel("Référence du règlement (facultatif)").fill("Paiement vérifié depuis l’admin");
    await creation.getByRole("button", { name: "Enregistrer l’état du paiement" }).click();
    await expect(creation.locator("p > strong").first()).toHaveText("Payé");
    await expect.poll(async () => (await db.siteOrder.findUniqueOrThrow({ where: { id: site.id } })).status).toBe("PAID");
    await creation.getByLabel("État du paiement").selectOption("FAILED");
    await creation.getByRole("button", { name: "Enregistrer l’état du paiement" }).click();
    await expect(creation.locator("p > strong").first()).toHaveText("Paiement échoué");
    await creation.getByText("Historique des vérifications manuelles", { exact: true }).click();
    await expect(creation.getByText("Paiement vérifié depuis l’admin", { exact: false })).toBeVisible();
    await creation.screenshot({ path: "reports/manual-payments/zelyweb.png" });
    await page.getByLabel("Marque active").selectOption("tadapo");
    await page.getByRole("button", { name: "Ouvrir cet espace" }).click();
    await page.waitForURL(base + "/");
    await page.goto(base + "/commandes-tadapo?q=Commande%20Tadapo%20UI");
    await page.getByRole("link", { name: "Commande Tadapo UI en attente", exact: true }).click();
    const tadapo = page.locator("#manual-tadapo_subscription");
    await tadapo.getByLabel("État du paiement").selectOption("PAID");
    await tadapo.getByRole("button", { name: "Enregistrer l’état du paiement" }).click();
    await expect(tadapo.locator("p > strong").first()).toHaveText("Payé");
    await expect(page.getByRole("link", { name: "Ouvrir le projet", exact: true })).toBeVisible();
    assert.ok((await db.tadapoOrder.findUniqueOrThrow({ where: { id: order.id } })).projectId);
    await page.getByRole("link", { name: "Ouvrir le projet", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Suivi manuel du paiement Tadapo" })).toBeVisible();
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(page.locator("#manual-tadapo_subscription")).toBeVisible();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `reports/manual-payments/tadapo-${width}.png`, fullPage: true });
    }
    await page.goto(`${base}/projets/${site.projectId}`);
    assert.equal(await page.getByRole("heading", { name: "Suivi manuel du paiement de création" }).count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log("Paiements manuels : formulaires, corrections, historique, commande non payée, séparation et mobile OK");
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
