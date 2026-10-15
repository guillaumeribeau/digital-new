import { chromium } from "@playwright/test";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { leadRepository } from "../apps/website/lib/lead-repository";
import { leadSchema } from "@nova/validation";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.pathname, "/lead_pipeline_test");
  assert.equal(process.env.NODE_ENV, "test");
  const db = getDb(), base = process.env.BETTER_AUTH_URL!;
  const password = "Trash-Browser-Test-42!";
  const user = await db.user.create({ data: { email: "trash-admin@example.com", name: "Admin Corbeille", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const errors: string[] = [];
  await mkdir("reports/trash", { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(user.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Accéder à mon espace" }).click();
    await page.waitForURL(base + "/");
    for (const width of [375, 768, 1024, 1440]) {
      const businessName = `Demande Corbeille ${width}`;
      const { reference } = await leadRepository.submit(leadSchema.parse({ company: businessName, sector: "Artisanat", city: "Lyon", services: "Services de test", style: "propose", fullName: "Camille Test", email: "test@example.com", contactMethod: "email", consent: true, pricingAcknowledged: true, honeypot: "", requestId: randomUUID() }));
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + "/demandes/" + reference);
      await page.getByRole("button", { name: "Mettre à la corbeille" }).click();
      await page.getByRole("dialog").waitFor();
      await page.getByRole("button", { name: "Annuler", exact: true }).click();
      assert.equal((await db.lead.findUniqueOrThrow({ where: { id: reference } })).deletedAt, null);
      await page.getByRole("button", { name: "Mettre à la corbeille" }).click();
      await page.screenshot({ path: `reports/trash/confirm-${width}.png` });
      await page.getByRole("button", { name: "Confirmer la suppression" }).click();
      await page.waitForURL(base + "/demandes?notice=trashed");
      assert.ok((await db.lead.findUniqueOrThrow({ where: { id: reference } })).deletedAt);
      assert.equal(await page.locator("tbody tr").filter({ hasText: businessName }).count(), 0);
      await page.getByRole("link", { name: /^Corbeille / }).click();
      await page.getByRole("heading", { name: "La corbeille." }).waitFor();
      await page.locator('input[name="view"][value="trash"]').waitFor({ state: "attached" });
      await page.getByLabel("Rechercher", { exact: true }).fill(businessName);
      await page.getByRole("button", { name: "Appliquer", exact: true }).click();
      assert.equal(new URL(page.url()).searchParams.get("view"), "trash");
      await page.getByRole("link", { name: "Voir et restaurer →", exact: true }).click();
      await page.getByRole("button", { name: "Restaurer la demande" }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `reports/trash/restore-${width}.png`, fullPage: true });
      await page.getByRole("button", { name: "Restaurer la demande" }).click();
      await page.getByRole("button", { name: "Mettre à la corbeille" }).waitFor();
      assert.equal((await db.lead.findUniqueOrThrow({ where: { id: reference } })).deletedAt, null);
      await page.getByText("Demande restaurée", { exact: true }).waitFor();
      console.log(`Trash ${width}px: cancel, delete, filter and restore OK`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
