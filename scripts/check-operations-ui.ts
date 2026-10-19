import { chromium } from "@playwright/test";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { digest, seal } from "../apps/admin/lib/commercial-core";
async function main() {
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
  const db = getDb(), base = process.env.BETTER_AUTH_URL!, website = process.env.NEXT_PUBLIC_SITE_URL!, email = `operations-${randomUUID()}@example.com`, password = "Operations-Fictitious-42!";
  const user = await db.user.create({ data: { name: "Admin de contrôle", email, emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const lead = await db.lead.create({ data: { requestId: randomUUID(), payloadHash: "0".repeat(64), fullName: "Client Démonstration", email: "workflow-client@example.com", preferredContactMethod: "email", businessName: "Atelier Démonstration", businessSector: "Artisan", city: "Ville Fictive", services: "Données de contrôle", preferredStyle: "propose", emailVerifiedAt: new Date(), pricingAcknowledgedAt: new Date(), pricingVersion: "test", privacyAcknowledgedAt: new Date(), privacyVersion: "test", source: "test", utmSource: "controle", utmMedium: "cpc", utmCampaign: "nouveau-parcours" } });
  const project = await db.project.create({ data: { leadId: lead.id, stage: "PAID", websiteUrl: "https://atelier-demo.fr" } }), token = randomBytes(32).toString("base64url");
  const order = await db.siteOrder.create({ data: { projectId: project.id, mode: "TEST", status: "PAID", creationPaidAt: new Date(), previewUrl: "https://preview.example.com", message: "Votre site de contrôle est prêt.", screenshot: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", tokenHash: digest(token), tokenEncrypted: seal(token) } });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  await mkdir("reports/operations", { recursive: true }); const errors: string[] = [];
  try {
    const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await admin.newPage(); page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "/connexion"); await page.getByLabel("Adresse e-mail", { exact: true }).fill(email); await page.getByLabel("Mot de passe", { exact: true }).fill(password); await page.getByRole("button", { name: "Accéder à mon espace" }).click(); await page.waitForURL(base + "/");
    for (const path of ["/audience", "/sites", "/abonnements", "/emails", "/campagnes", "/sante", "/paiements", "/securite"]) {
      const r = await page.goto(base + path); assert.equal(r?.status(), 200, path); assert.ok(!(await page.locator("body").innerText()).includes("Nous n’avons pas pu charger"), path);
      await page.screenshot({ path: `reports/operations/${path.slice(1)}.png`, fullPage: true, caret: "initial" });
    }
    await page.goto(`${base}/projets/${project.id}`);
    await page.getByRole("group", { name: "Option 1", exact: true }).getByLabel("Domaine", { exact: true }).fill("atelier-demo.fr");
    await page.getByRole("group", { name: "Option 1", exact: true }).getByLabel("Prix initial HT (€)").fill("15");
    await page.getByRole("group", { name: "Option 1", exact: true }).getByLabel("Renouvellement annuel HT (€)").fill("24");
    await page.getByRole("button", { name: "Enregistrer les propositions" }).click(); await page.getByRole("status").getByText("Enregistré.").waitFor();
    const client = await browser.newContext({ viewport: { width: 390, height: 844 } }), portal = await client.newPage(); portal.on("pageerror", e => errors.push(e.message));
    await portal.goto(`${base}/client/site/${order.id}#token=${token}`); await portal.getByRole("heading", { name: "Ajustements et domaine" }).waitFor();
    await portal.getByRole("radio", { name: "atelier-demo.fr", exact: false }).check(); await portal.getByRole("checkbox", { name: "J’approuve le choix", exact: false }).check(); await portal.getByRole("button", { name: "Confirmer mon choix de domaine" }).click(); await portal.getByText("Choix reçu, configuration à faire", { exact: false }).waitFor();
    await portal.getByLabel("Mes modifications regroupées").fill("Remplacer le titre de la page d’accueil.");
    await portal.getByRole("button", { name: "Enregistrer les retours" }).click(); await portal.getByRole("heading", { name: "Série 1", exact: false }).waitFor();
    await page.reload(); await page.getByRole("button", { name: "Clôturer et compter cette série" }).click(); await page.getByRole("heading", { name: "Série 1 · Terminée" }).waitFor();
    await portal.reload(); await portal.getByLabel("Votre nom", { exact: true }).fill("Client Démonstration"); await portal.getByRole("checkbox", { name: "J’ai vérifié cette version", exact: false }).check(); await portal.getByRole("button", { name: "Je valide cette version pour la mise en ligne" }).click(); await portal.getByText("Version validée par Client Démonstration", { exact: false }).waitFor();
    for (const width of [390, 820, 1440]) { await portal.setViewportSize({ width, height: 950 }); assert.equal(await portal.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); await portal.screenshot({ path: `reports/operations/client-${width}.png`, fullPage: true, caret: "initial" }); await page.setViewportSize({ width, height: 950 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); await page.screenshot({ path: `reports/operations/admin-${width}.png`, fullPage: true, caret: "initial" }); }
    const publicPage = await client.newPage(); await publicPage.setViewportSize({ width: 1440, height: 1000 }); await publicPage.goto(website + "/?utm_source=controle&utm_medium=cpc&utm_campaign=nouveau-parcours&email=ignore@example.com");
    await publicPage.locator('a[href*="/notre-offre"][href*="utm_source"]').first().waitFor(); await publicPage.locator('a[href*="/notre-offre"][href*="utm_source"]').first().click(); await publicPage.waitForURL(/notre-offre/);
    assert.equal(new URL(publicPage.url()).searchParams.get("utm_campaign"), "nouveau-parcours"); assert.equal(new URL(publicPage.url()).searchParams.has("email"), false);
    assert.deepEqual(errors, []); await client.close(); await admin.close(); console.log("UI exploitation : pages privées, domaines, retours, accord versionné, mobile/tablette/desktop et attribution UTM validés.");
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
