import { chromium } from "@playwright/test";
import { getDb } from "@nova/database";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { leadRepository } from "../apps/website/lib/lead-repository";
import { leadSchema } from "@nova/validation";

async function main() {
  // This fixture is explicitly confined to the disposable loopback integration database.
  const url = new URL(process.env.DATABASE_URL!);
  assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.pathname, "/lead_pipeline_test"); assert.equal(process.env.NODE_ENV, "test");
  const db = getDb();
  const adminBase = process.env.BETTER_AUTH_URL!;
  const websiteBase = process.env.NEXT_PUBLIC_SITE_URL!;
  const password = "Browser-Test-Password-42!";
  const user = await db.user.create({ data: { email: "browser-admin@example.com", name: "Admin Contrôle", emailVerified: true } });
  await db.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: await hashPassword(password) } });
  await db.adminUser.create({ data: { userId: user.id } });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const errors: string[] = [];
  await mkdir("reports/admin", { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of ["/", "/demandes", "/projets", "/parametres", "/clients", "/sites", "/abonnements"]) {
      await page.goto(adminBase + path); await page.waitForURL("**/connexion");
    }
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(user.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Accéder à mon espace" }).click();
    await page.waitForURL(adminBase + "/");
    await page.getByRole("heading", { name: "Tout commence ici." }).waitFor();

    // Submit the unchanged public form to the real local Next.js API / same PostgreSQL.
    const website = await context.newPage();
    await website.goto(websiteBase + "/demander-mon-site");
    await website.getByLabel("Nom de votre entreprise", { exact: true }).fill("Atelier Navigateur Fictif");
    await website.getByLabel("Votre secteur d’activité").selectOption("Artisanat");
    await website.getByLabel("Votre ville").fill("Ville Contrôle");
    await website.getByLabel("Votre métier et vos principales prestations").fill("Services de contrôle sans données personnelles");
    await website.getByRole("button", { name: "Continuer", exact: true }).click();
    await website.getByRole("button", { name: "Continuer", exact: true }).click();
    await website.getByLabel("Nom et prénom", { exact: true }).fill("Contact Contrôle");
    await website.getByLabel("Votre adresse e-mail").fill("browser-prospect@example.com");
    await website.getByRole("checkbox").nth(0).check(); await website.getByRole("checkbox").nth(1).check();
    await website.locator('.anti-bot[data-verified="true"]').waitFor();
    await website.getByRole("button", { name: "Envoyer ma demande gratuitement" }).click();
    await website.locator(".form-success").waitFor();
    const lead = await db.lead.findFirstOrThrow({ where: { businessName: "Atelier Navigateur Fictif" } });
    await page.goto(adminBase + "/demandes?q=Atelier+Navigateur");
    await page.getByText("Atelier Navigateur Fictif", { exact: true }).waitFor();
    await page.getByRole("link", { name: "Ouvrir →", exact: true }).click();
    await page.getByText("La qualification attend", { exact: false }).waitFor();
    const unauthorizedMailbox = await context.request.get(websiteBase + "/api/local-emails");
    assert.equal(unauthorizedMailbox.status(), 401);
    await website.goto(websiteBase + "/emails-locaux#key=" + process.env.LOCAL_EMAIL_PREVIEW_TOKEN);
    await website.getByRole("heading", { name: "E-mails de test locaux", exact: true }).waitFor();
    const confirmationPromise = context.waitForEvent("page");
    const verificationResponse = context.waitForEvent("response", response => response.url().endsWith("/api/leads/verify"));
    await website.getByRole("link", { name: "Ouvrir le lien de confirmation" }).click();
    const confirmation = await confirmationPromise;
    await confirmation.waitForFunction(() => !window.location.hash);
    const verified = await verificationResponse;
    assert.equal(verified.status(), 200, (await verified.json()).error);
    await confirmation.getByRole("heading", { name: "Votre demande est confirmée." }).waitFor();
    await confirmation.close();
    await page.reload();
    await page.getByLabel("Nouveau statut").selectOption("QUALIFIED");
    await page.getByRole("button", { name: "Modifier le statut" }).click();
    await page.getByRole("button", { name: "Transformer en projet" }).waitFor();
    let actionRequest: { url: string; headers: Record<string, string>; body: Buffer } | undefined;
    page.on("request", (request) => {
      if (request.headers()["next-action"] && request.postDataBuffer()) actionRequest = { url: request.url(), headers: request.headers(), body: request.postDataBuffer()! };
    });
    await page.getByLabel("Votre note").fill("Note navigateur fictive");
    await page.getByRole("button", { name: "Ajouter la note" }).click();
    await page.getByText("Note navigateur fictive", { exact: true }).waitFor();
    const capturedAction = actionRequest;
    assert.ok(capturedAction);
    await page.getByRole("button", { name: "Transformer en projet" }).click();
    await page.waitForURL("**/projets/*");
    const project = await db.project.findUniqueOrThrow({ where: { leadId: lead.id } });
    await page.getByLabel("URL de prévisualisation HTTPS").fill("https://demo.example.com");
    await page.getByLabel("URL du site définitif HTTPS").fill("https://site.example.com");
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Modification enregistrée" }).waitFor();
    await page.getByLabel("Prochaine étape").selectOption("CONTENT_PREPARATION");
    await page.getByRole("button", { name: "Valider cette étape" }).click();
    await page.getByLabel("Prochaine étape").selectOption("CREATION");
    await page.getByRole("button", { name: "Valider cette étape" }).click();
    await page.getByLabel("Prochaine étape").selectOption("REVIEW");
    assert.equal((await db.project.findUniqueOrThrow({ where: { id: project.id } })).stage, "CREATION");

    // Seed additional local fixtures through the real repository to exercise pagination.
    for (let i = 0; i < 22; i++) await leadRepository.submit(leadSchema.parse({ company: `Contrôle Pagination ${i}`, sector: "Commerce", city: "Ville Contrôle", services: "Services fictifs", style: "propose", fullName: "Contact Test", email: "pagination@example.com", contactMethod: "email", consent: true, pricingAcknowledged: true, honeypot: "", requestId: randomUUID() }));
    await page.goto(adminBase + "/demandes?q=Contrôle+Pagination");
    await page.getByRole("link", { name: "Suivant" }).click();
    await page.getByText("Page 2 sur 2", { exact: false }).waitFor();
    assert.equal(await page.locator("tbody tr").count(), 2);
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1050 });
      for (const [path, name] of [["/", "dashboard"], ["/demandes", "leads"], [`/demandes/${lead.id}`, "lead-detail"], ["/projets", "projects"], [`/projets/${project.id}`, "project-detail"], ["/clients", "empty"]]) {
        await page.goto(adminBase + path);
        await page.locator(".workspace-main").waitFor();
        await page.screenshot({ path: `reports/admin/${name}-${width}.png`, fullPage: true, caret: "initial" });
        const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
        if (!fits) console.log("Overflow elements", await page.evaluate(() => Array.from(document.querySelectorAll("body *")).filter((element) => element.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(element).position !== "absolute").map((element) => ({ tag: element.tagName, class: element.className, right: Math.round(element.getBoundingClientRect().right) })).slice(0, 15)));
        assert.ok(fits, `${name} width ${width}`);
      }
    }
    // Replay a real Server Action without credentials after sign-out.
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.getByRole("button", { name: "Déconnexion" }).click();
    await page.waitForURL("**/connexion");
    const noteCount = await db.internalNote.count();
    const anonymous = await browser.newContext();
    const replay = await anonymous.request.post(capturedAction.url, { headers: {
      "next-action": capturedAction.headers["next-action"], "content-type": capturedAction.headers["content-type"], origin: adminBase,
    }, data: capturedAction.body });
    assert.equal(await db.internalNote.count(), noteCount);
    assert.ok(!(await replay.text()).includes("Atelier Navigateur Fictif"));
    await anonymous.close();
    await page.goto(adminBase + "/demandes"); await page.waitForURL("**/connexion");
    await page.screenshot({ path: "reports/admin/login-1440.png", fullPage: true, caret: "initial" });
    await page.setViewportSize({ width: 375, height: 1050 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: "reports/admin/login-375.png", fullPage: true, caret: "initial" });
    assert.deepEqual(errors, []);
    await writeFile("reports/admin/checks.json", JSON.stringify({ widths: [375, 768, 1024, 1440], realLocalDatabase: true, formIntegration: true, passwordOnlyLogin: true, notes: true, conversion: true, projectTracking: true, pagination: true, privateRoutes: true, actionReplayDenied: true, errors }, null, 2));
    console.log("Administration : parcours réel local, connexion par mot de passe, formulaire, notes, conversion, production, pagination, 4 largeurs et protections — OK.");
    await context.close();
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch((error) => { console.error("Admin UI tests failed:", error); process.exitCode = 1; });
