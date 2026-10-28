import { chromium } from "@playwright/test";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { commercialService } from "../apps/admin/lib/commercial";
import { brandSellerDefaults } from "@nova/shared/brands";
import { unseal } from "../apps/admin/lib/commercial-core";

async function main() {
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
  const db = getDb(), base = process.env.BETTER_AUTH_URL!, publicTadapo = process.env.NEXT_PUBLIC_TADAPO_SITE_URL!;
  const password = "Brand-Spaces-Test-42!";
  const user = await db.user.create({ data: { email: "brand-ui@example.com", name: "Admin des deux marques", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const source = await db.lead.findFirstOrThrow();
  const { id: sourceId, ...fields } = source;
  assert.ok(sourceId);
  const z = await db.lead.create({ data: { ...fields, brand: "zelyweb", requestId: randomUUID(), businessName: "Client espace bleu", email: "shared-ui@example.com", emailVerifiedAt: new Date() } });
  const t = await db.lead.create({ data: { ...fields, brand: "tadapo", requestId: randomUUID(), businessName: "Client espace orange", email: "shared-ui@example.com", emailVerifiedAt: new Date() } });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  await mkdir("reports/brand-spaces", { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(base + "/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(user.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Accéder à mon espace" }).click();
    await page.waitForURL(base + "/");
    await page.goto(base + "/clients");
    await page.getByText("Client espace bleu", { exact: true }).waitFor();
    assert.equal(await page.getByText("Client espace orange", { exact: true }).count(), 0);
    await page.screenshot({ path: "reports/brand-spaces/zelyweb.png", fullPage: true });
    await page.getByLabel("Marque active").selectOption("tadapo");
    await page.getByRole("button", { name: "Ouvrir cet espace" }).click();
    await page.waitForURL(base + "/");
    await page.goto(base + "/clients");
    await page.getByText("Client espace orange", { exact: true }).waitFor();
    assert.equal(await page.getByText("Client espace bleu", { exact: true }).count(), 0);
    await page.screenshot({ path: "reports/brand-spaces/tadapo.png", fullPage: true });
    await page.goto(base + `/clients/${z.id}`);
    assert.equal(await page.getByRole("heading", { name: "Client espace bleu", exact: true }).count(), 0);
    const cookies = await context.cookies(base);
    const h = new Headers({ cookie: cookies.map(c => `${c.name}=${c.value}`).join("; ") });
    await commercialService.saveSettings(h, brandSellerDefaults("tadapo"));
    const id = await commercialService.createQuote(h, { leadId: t.id, title: "Votre page supplémentaire", billingName: t.businessName, billingAddress: "2 rue du Test", deliveryTime: "Dix jours", terms: brandSellerDefaults("tadapo").terms, validityDays: 30, items: [{ label: "Nouvelle page", quantity: 1, unitPrice: "150", taxBasisPoints: 2000 }] });
    await commercialService.sendQuote(h, id);
    const access = await db.quoteAccess.findFirstOrThrow({ where: { quoteId: id } });
    const token = unseal(access.tokenEncrypted);
    const client = await browser.newContext();
    const portal = await client.newPage();
    for (const width of [1440, 375]) {
      await portal.setViewportSize({ width, height: 1000 });
      await portal.goto(`${publicTadapo}/client/devis/${id}#token=${token}`);
      await portal.getByRole("heading", { name: "Votre page supplémentaire", exact: true }).waitFor();
      assert.ok(!(await portal.locator("body").innerText()).toLowerCase().includes("zelyweb"));
      assert.ok(await portal.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await portal.screenshot({ path: `reports/brand-spaces/portal-tadapo-${width}.png`, fullPage: true });
    }
    await client.close(); await context.close();
    console.log("Espaces Zelyweb/Tadapo, dossiers distincts et portail Tadapo via relais : OK");
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error("Brand UI checks failed", error); process.exitCode = 1; });
