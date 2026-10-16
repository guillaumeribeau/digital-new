import { chromium } from "@playwright/test";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { unseal } from "../apps/admin/lib/commercial-core";

async function main() {
  assert.equal(new URL(process.env.DATABASE_URL!).pathname, "/lead_pipeline_test");
  const db = getDb(), base = process.env.BETTER_AUTH_URL!;
  const password = "Billing-Browser-Test-42!", email = "billing-ui-" + randomUUID() + "@example.com";
  const user = await db.user.create({ data: { name: "Admin test paiement", email, emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const lead = await db.lead.create({ data: { requestId: randomUUID(), payloadHash: "0".repeat(64), fullName: "Camille Fictif", email: "client-paiement-fictif@example.com", preferredContactMethod: "email", businessName: "Atelier Fictif", businessSector: "Commerce", city: "Ville Fictive", services: "Contrôle de la présentation", preferredStyle: "restaurant", emailVerifiedAt: new Date(), pricingAcknowledgedAt: new Date(), pricingVersion: "test", privacyAcknowledgedAt: new Date(), privacyVersion: "test", source: "test" } });
  const project = await db.project.create({ data: { leadId: lead.id } });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  await mkdir("reports/billing", { recursive: true });
  const errors: string[] = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    await ctx.route("https://zelyweb.com/pics/**", route => route.fulfill({ path: resolve("apps/website/public/pics/Logo moderne zelyweb fond transparent.png") }));
    const page = await ctx.newPage(); page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(email); await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Accéder à mon espace" }).click(); await page.waitForURL(base + "/");
    await page.goto(`${base}/projets/${project.id}`);
    const card = page.locator("#stripe");
    await card.getByLabel("Lien d’aperçu privé HTTPS").fill("https://preview.example.com");
    await card.getByLabel("Prix de création HT (€)").fill("350,00");
    await card.getByLabel("Capture du site").setInputFiles(resolve("apps/website/public/examples/previews/restaurant-desktop.webp"));
    await card.getByRole("button", { name: "Enregistrer et prévisualiser l’e-mail" }).click();
    await card.getByText("Brouillon enregistré. Vérifiez l’e-mail avant envoi.").waitFor();
    await card.locator("iframe").waitFor();
    await card.screenshot({ path: "reports/billing/admin-presentation.png" });
    const iframe = card.frameLocator("iframe");
    await iframe.getByText("Découvrez votre site.", { exact: false }).waitFor();
    const srcdoc = await card.locator("iframe").getAttribute("srcdoc"); assert.ok(srcdoc);
    await writeFile("reports/billing/email-apercu.html", srcdoc);
    const mail = await ctx.newPage();
    for (const width of [375, 640]) {
      await mail.setViewportSize({ width, height: 1000 }); await mail.setContent(srcdoc!);
      await mail.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
      assert.equal(await mail.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await mail.screenshot({ path: `reports/billing/email-${width}.png`, fullPage: true });
    }
    await card.getByLabel("Message personnel").fill("Une modification après aperçu nécessite une nouvelle prévisualisation.");
    assert.equal(await card.getByRole("button", { name: "Envoyer cet e-mail au client" }).isDisabled(), true);
    await card.getByRole("button", { name: "Enregistrer et prévisualiser l’e-mail" }).click();
    await card.getByRole("button", { name: "Envoyer cet e-mail au client" }).waitFor({ state: "visible" });
    await card.getByRole("button", { name: "Envoyer cet e-mail au client" }).click();
    await page.getByText("Proposition envoyée · paiement attendu", { exact: false }).waitFor();
    const order = await db.siteOrder.findUniqueOrThrow({ where: { projectId: project.id } });
    assert.equal(await db.commercialEmail.count({ where: { kind: "SITE_PRESENTATION" } }) > 0, true);
    const token = unseal(order.tokenEncrypted);
    const client = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const portal = await client.newPage(); portal.on("pageerror", e => errors.push(e.message));
    await portal.goto(`${base}/client/site/${order.id}#token=${token}`);
    await portal.getByRole("heading", { name: "Valider votre commande" }).waitFor();
    assert.equal(await portal.evaluate(() => location.hash), "");
    assert.equal(await portal.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.ok((await portal.locator("body").innerText()).includes("420,00"));
    await portal.screenshot({ path: "reports/billing/client-mobile.png", fullPage: true });
    await portal.setViewportSize({ width: 1440, height: 1000 });
    await portal.screenshot({ path: "reports/billing/client-desktop.png", fullPage: true });
    // Simulated signed-payment outcome in this isolated database; no real Stripe call.
    await db.siteOrder.update({ where: { id: order.id }, data: { status: "PAID", creationPaidAt: new Date(), stripeCustomerId: "cus_ui_fixture" } });
    await page.reload();
    await card.getByRole("button", { name: "Prévisualiser l’e-mail d’ajustements" }).click();
    const revisions = card.frameLocator('iframe[title="Aperçu de l’e-mail d’ajustements"]');
    await revisions.getByRole("heading", { name: "Paiement reçu : préparons vos ajustements" }).waitFor();
    const revisionsHtml = await card.locator('iframe[title="Aperçu de l’e-mail d’ajustements"]').getAttribute("srcdoc");
    await writeFile("reports/billing/email-ajustements.html", revisionsHtml!);
    await card.getByLabel("Questions et message pour les ajustements").fill("Voici mes questions personnalisées pour vos textes et photos.");
    assert.equal(await card.getByRole("button", { name: "Envoyer les questions et la confirmation au client" }).isDisabled(), true);
    await card.getByRole("button", { name: "Prévisualiser l’e-mail d’ajustements" }).click();
    await card.getByRole("button", { name: "Envoyer les questions et la confirmation au client" }).click();
    await card.getByText("E-mail d’ajustements ajouté à la file d’envoi.", { exact: false }).waitFor();
    await db.project.update({ where: { id: project.id }, data: { websiteUrl: "https://atelier-fictif.example.com" } });
    await page.reload();
    await card.getByRole("checkbox", { name: "Les ajustements sont validés", exact: false }).check();
    await card.getByRole("button", { name: "Préparer l’e-mail de mise en ligne" }).click();
    const invitationHtml = await card.locator('iframe[title="Aperçu de l’e-mail de mise en ligne"]').getAttribute("srcdoc");
    assert.ok(invitationHtml?.includes("2 jours ouvrés"));
    await writeFile("reports/billing/email-abonnement.html", invitationHtml!);
    for (const [kind, html] of [["ajustements", revisionsHtml!], ["abonnement", invitationHtml!]]) {
      for (const width of [375, 640]) {
        await mail.setViewportSize({ width, height: 1000 }); await mail.setContent(html);
        await mail.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
        assert.equal(await mail.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await mail.screenshot({ path: `reports/billing/email-${kind}-${width}.png`, fullPage: true });
      }
    }
    await card.getByRole("button", { name: "Envoyer l’e-mail d’activation au client" }).click();
    await card.getByText("Invitation envoyée · activation", { exact: false }).waitFor();
    await portal.reload();
    await portal.getByRole("heading", { name: "Votre site est prêt à être lancé." }).waitFor();
    await portal.setViewportSize({ width: 390, height: 844 });
    assert.equal(await portal.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await portal.screenshot({ path: "reports/billing/client-subscription-mobile.png", fullPage: true });
    await card.screenshot({ path: "reports/billing/admin-subscription.png" });
    await client.close();
    assert.deepEqual(errors, []);
    console.log("UI paiement : préparation, prix personnalisé, prévisualisation, protection contre les changements, e-mail en file locale et accès privé sans compte validés.");
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
