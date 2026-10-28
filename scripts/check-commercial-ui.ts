import { chromium } from "@playwright/test";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { leadRepository } from "../apps/website/lib/lead-repository";
import { decryptPayload } from "../apps/website/lib/lead-security";
import { leadSchema } from "@nova/validation";
import { business } from "@nova/shared/business";

async function main() {
  const connection = new URL(process.env.DATABASE_URL!);
  assert.equal(connection.hostname, "127.0.0.1"); assert.equal(connection.pathname, "/lead_pipeline_test"); assert.equal(process.env.NODE_ENV, "test");
  const db = getDb(), base = process.env.BETTER_AUTH_URL!, password = "Commercial-Browser-Test-42!";
  const user = await db.user.create({ data: { name: "Admin Navigateur Commercial Fictif", email: "commercial-browser-admin@example.com", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } }); await db.adminUser.create({ data: { userId: user.id } });
  const lead = await leadRepository.submit(leadSchema.parse({ company: "Entreprise Client Navigateur Fictive", fullName: "Camille Fictif", email: "commercial-browser-client@example.com", sector: "Artisanat", city: "Ville Fictive", services: "Services de contrôle", style: "propose", contactMethod: "email", consent: true, pricingAcknowledged: true, honeypot: "", requestId: randomUUID() }));
  const event = await db.outboxEvent.findFirstOrThrow({ where: { leadId: lead.reference } }); const email = decryptPayload(event.payloadEncrypted!) as { text: string };
  await leadRepository.verify(email.text.match(/#token=([A-Za-z0-9_-]+)/)![1]);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const errors: string[] = []; await mkdir("reports/commercial", { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: "reduce" });
    const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
    for (const path of ["/clients", "/echanges", "/devis", "/paiements", "/parametres/commercial", "/emails-locaux"]) { await page.goto(base + path); await page.waitForURL("**/connexion"); }
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(user.email); await page.getByLabel("Mot de passe", { exact: true }).fill(password); await page.getByRole("button", { name: "Accéder à mon espace" }).click(); await page.waitForURL(base + "/");
    await page.goto(base + "/parametres/commercial");
    await page.getByRole("button", { name: "Reprendre les informations de cette marque", exact: true }).click();
    assert.equal(await page.getByLabel("Raison sociale / nom de l’entreprise").inputValue(), business.legalName);
    assert.equal(await page.getByLabel("Immatriculation (SIRET ou équivalent)").inputValue(), business.siret);
    assert.equal(await page.getByLabel("N° TVA · facultatif").inputValue(), business.vatNumber);
    assert.ok((await page.getByLabel("Conditions par défaut des devis").inputValue()).includes("14 jours"));
    await page.getByLabel("Raison sociale / nom de l’entreprise").fill("NOVA Démonstration Fictive");
    await page.getByLabel("Adresse de l’entreprise").fill("10 rue du Test, 75000 Ville fictive");
    await page.getByLabel("Immatriculation (SIRET ou équivalent)").fill("DEMO-FICTIF-000");
    await page.getByLabel("Conditions par défaut des devis").fill("Conditions fictives de contrôle. Paiement intégral après acceptation du devis.");
    await page.locator("form").first().getByRole("button", { name: "Enregistrer", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Modification enregistrée" }).waitFor();
    await page.getByText("Ajouter une prestation", { exact: true }).click();
    await page.getByLabel("Nom de la prestation", { exact: true }).fill("Page catalogue fictive"); await page.getByLabel("Description de la prestation", { exact: true }).fill("Description de la prestation fictive.");
    await page.getByLabel("Prix unitaire HT (€)", { exact: true }).fill("90,00"); await page.getByLabel("TVA (%)", { exact: true }).fill("20");
    await page.locator("form").filter({ has: page.locator("#service-label") }).getByRole("button", { name: "Enregistrer", exact: true }).click();
    await page.getByText("Page catalogue fictive", { exact: false }).first().waitFor();
    await page.goto(`${base}/clients/${lead.reference}`);
    await page.getByLabel("Objet de votre message").fill("Question fictive sur la page complémentaire"); await page.getByLabel("Votre message au client").fill("Bonjour, voici un message de contrôle fictif.");
    await page.getByRole("button", { name: "Envoyer le message", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "E-mail ajouté à la file" }).waitFor();
    await page.getByText("Tester une réponse client en local", { exact: true }).click(); await page.getByLabel("Réponse de test", { exact: true }).fill("Réponse fictive : merci, je souhaite recevoir le devis.");
    await page.getByRole("button", { name: "Simuler une réponse client", exact: true }).click(); await page.getByText("Ce client attend votre réponse.", { exact: true }).waitFor();
    await page.getByRole("link", { name: "Nouveau devis complémentaire", exact: true }).click();
    assert.equal(await page.getByLabel("TVA 1 (%)", { exact: true }).inputValue(), "20");
    await page.getByLabel("Intitulé du devis").fill("Page supplémentaire — contrôle navigateur");
    await page.getByLabel("Adresse de facturation", { exact: true }).fill("20 rue du Client, 75000 Ville fictive");
    await page.getByLabel("Nom de la prestation 1", { exact: true }).fill("Création d’une page complémentaire");
    await page.getByLabel("Description 1", { exact: true }).fill("Intégration des contenus et adaptation au site existant.");
    await page.getByLabel("Prix unitaire HT 1 (€)", { exact: true }).fill("120,00"); await page.getByLabel("TVA 1 (%)", { exact: true }).fill("20");
    await page.getByLabel("Délai de réalisation", { exact: true }).fill("10 jours après paiement");
    await page.getByRole("button", { name: "Enregistrer le brouillon", exact: true }).click(); await page.waitForURL(/\/devis\/[a-f0-9-]+$/);
    const quote = await db.quote.findFirstOrThrow({ where: { leadId: lead.reference } }); assert.equal(quote.totalCents, 14400);
    const preview = await context.request.get(`${base}/api/admin/quotes/${quote.id}/pdf`); assert.equal(preview.status(), 200); assert.equal((await preview.body()).subarray(0, 5).toString(), "%PDF-");
    await writeFile("reports/commercial/browser-quote.pdf", await preview.body());
    await page.getByRole("button", { name: "Envoyer le devis au client", exact: true }).click(); await page.getByRole("link", { name: "Créer une nouvelle version", exact: true }).waitFor();
    await page.goto(base + "/emails-locaux"); const link = await page.locator(`a[href*="/client/devis/${quote.id}#token="]`).getAttribute("href"); assert.ok(link);
    const client = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: "reduce" });
    const clientPage = await client.newPage(); clientPage.on("pageerror", (error) => errors.push(error.message));
    assert.equal((await client.request.get(`${base}/api/client/quotes/${quote.id}`)).status(), 401);
    await clientPage.goto(link!); await clientPage.getByRole("heading", { name: quote.title, exact: true }).waitFor(); assert.equal(new URL(clientPage.url()).hash, "");
    await clientPage.getByRole("checkbox", { name: "J’accepte ce devis", exact: false }).check(); await clientPage.getByRole("button", { name: "Accepter le devis", exact: true }).click();
    await clientPage.getByRole("heading", { name: "Votre devis est accepté", exact: true }).waitFor();
    await clientPage.getByRole("button", { name: "Simuler le paiement — test local", exact: true }).click(); await clientPage.getByRole("heading", { name: "Paiement simulé en local", exact: true }).waitFor();
    assert.equal((await db.quote.findUniqueOrThrow({ where: { id: quote.id } })).paymentMode, "LOCAL");
    const doc = await client.request.get(`${base}/api/client/quotes/${quote.id}/pdf`); assert.equal(doc.status(), 200);
    await clientPage.goto(base + "/clients"); await clientPage.waitForURL("**/connexion");
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1050 }); await clientPage.setViewportSize({ width, height: 1050 });
      for (const [path, name] of [[`/clients/${lead.reference}`, "client"], [`/devis/${quote.id}`, "quote"], ["/echanges", "inbox"], ["/paiements", "payments"], ["/parametres/commercial", "settings"]]) {
        await page.goto(base + path); await page.locator(".workspace-main").waitFor(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} width ${width}`); await page.screenshot({ path: `reports/commercial/${name}-${width}.png`, fullPage: true });
      }
      await clientPage.goto(`${base}/client/devis/${quote.id}`); await clientPage.getByRole("heading", { name: quote.title, exact: true }).waitFor(); assert.ok(await clientPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `portal width ${width}`); await clientPage.screenshot({ path: `reports/commercial/portal-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
    await writeFile("reports/commercial/checks.json", JSON.stringify({ realIsolatedDatabase: true, quotesPdf: true, privatePortal: true, emailQueue: true, localReply: true, explicitAcceptance: true, localPayment: true, noRealBankCharge: true, widths: [375, 768, 1024, 1440], errors }, null, 2));
    await client.close(); await context.close(); console.log("Module commercial : écrans, échanges, devis PDF, lien privé, acceptation et paiement local, 4 largeurs — OK.");
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch((error) => { console.error("Commercial browser checks failed:", error); process.exitCode = 1; });
