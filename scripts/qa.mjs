import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("reports", { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
const errors = [];
const pages = [
  "/",
  "/notre-offre",
  "/exemples",
  "/comment-ca-marche",
  "/faq",
  "/demander-mon-site",
  "/mentions-legales",
  "/politique-confidentialite",
  "/cookies",
];
for (const width of [375, 768, 1024, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of pages) {
    const response = await page.goto("http://127.0.0.1:3000" + path);
    assert.equal(response.status(), 200, path);
    await page.locator("h1").waitFor();
    assert.equal(await page.locator("h1").count(), 1, path + " has one h1");
    const dims = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    assert.ok(
      dims.scroll <= width,
      path + " overflow at " + width + ": " + JSON.stringify(dims),
    );
    results.push({ path, width, status: response.status(), overflow: false });
  }
  await page.goto("http://127.0.0.1:3000");
  await page.locator("main img").evaluateAll(async (images) => {
    await document.fonts.ready;
    await Promise.all(
      images.map(async (image) => {
        image.loading = "eager";
        await image.decode();
      }),
    );
  });
  assert.ok(
    await page
      .locator("main img")
      .evaluateAll((images) => images.every((image) => image.naturalWidth > 0)),
  );
  await page.screenshot({
    path: "reports/home-" + width + ".png",
    fullPage: true,
  });
  await page.screenshot({ path: "reports/hero-" + width + ".png" });
  if (width === 375) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("navigation", { name: "Navigation mobile" }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Ouvrir le menu" }).waitFor();
  }
  await page.close();
}
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:3000/exemples");
assert.equal(await page.locator(".demo-card").count(), 9);
await page.getByRole("button", { name: "Artisanat", exact: true }).click();
assert.equal(await page.locator(".demo-card").count(), 3);
await page.getByRole("button", { name: "Associations", exact: true }).click();
assert.equal(await page.locator(".demo-card").count(), 1);
await page.goto("http://127.0.0.1:3000/faq");
await page.locator("summary").first().click();
assert.equal(await page.locator("details[open]").count(), 1);
await page.locator("summary").first().click();
assert.equal(await page.locator("details[open]").count(), 0);
await page.goto("http://127.0.0.1:3000/demander-mon-site");
await page.getByRole("button", { name: "Continuer", exact: true }).click();
await page
  .getByText("Nom de l’entreprise : indiquez au moins 2 caractères.")
  .waitFor();
await page
  .getByLabel("Nom de votre entreprise", { exact: true })
  .fill("Atelier Test");
await page.getByLabel("Votre secteur d’activité").selectOption("Artisanat");
await page.getByLabel("Votre ville").fill("Lyon");

await page
  .getByLabel("Votre métier et vos principales prestations")
  .fill("Plombier : installation et dépannage");
await page.getByRole("button", { name: "Continuer", exact: true }).click();
assert.ok(
  await page.getByRole("radio", { name: /Proposez-moi un style/ }).isChecked(),
);
await page.getByText("Maison Camille", { exact: true }).click();
await page.getByRole("button", { name: "Continuer", exact: true }).click();
await page.getByLabel("Nom et prénom", { exact: true }).fill("Camille Test");
await page.getByLabel("Votre adresse e-mail").fill("camille@example.com");
await page.getByRole("checkbox").nth(0).check();
await page.getByRole("checkbox").nth(1).check();
await page
  .getByRole("heading", { name: "Votre demande en un coup d’œil" })
  .waitFor();
assert.equal(await page.getByLabel("Votre téléphone").inputValue(), "");
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: "reports/form-summary.png", fullPage: true });
// In production, unconfigured origin or rate limiting can reject before delivery.
const rejectedSubmission = page.waitForResponse(
  (response) =>
    response.url().endsWith("/api/leads") &&
    response.request().method() === "POST",
);
await page
  .getByRole("button", { name: "Envoyer ma demande gratuitement" })
  .click();
const rejectedResponse = await rejectedSubmission;
assert.ok(
  [403, 429, 503].includes(rejectedResponse.status()),
  "Unconfigured delivery must never report success",
);
const rejectedBody = await rejectedResponse.json();
assert.equal(typeof rejectedBody.error, "string");
await page.getByRole("alert").filter({ hasText: rejectedBody.error }).waitFor();
assert.equal(await page.locator(".form-success").count(), 0);
assert.ok(!page.url().includes("camille"));
await page.setViewportSize({ width: 375, height: 900 });
await page.screenshot({ path: "reports/form-mobile.png", fullPage: true });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.goto("http://127.0.0.1:3000/page-inexistante");
await page
  .getByRole("heading", { name: "Cette page a pris un autre chemin." })
  .waitFor();
const animated = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
animated.on("pageerror", (e) => errors.push(e.message));
await animated.goto("http://127.0.0.1:3000");

await animated
  .getByRole("link", {
    name: "Découvrir mon futur site gratuitement",
    exact: true,
  })
  .waitFor();
await animated.getByRole("button", { name: "Terminer l’animation" }).click();
await animated.locator('.rx-hero[data-phase="ready"]').waitFor();
await animated
  .getByRole("button", { name: "Rejouer la construction du site" })
  .click();
await animated.locator('.rx-hero[data-phase="compose"]').waitFor();
await animated.locator('.rx-hero[data-phase="ready"]').waitFor();
assert.equal(
  await animated.locator(".rx-mini-services .rx-mini-service").count(),
  3,
);
assert.equal(
  await animated
    .getByRole("link", { name: "Voir des exemples", exact: true })
    .getAttribute("href"),
  "/exemples",
);
await animated.close();
assert.deepEqual(errors, []);
await writeFile(
  "reports/qa.json",
  JSON.stringify(
    {
      routes: results,
      interactions: [
        "mobile-menu",
        "gallery-filter",
        "faq",
        "form-validation",
        "inspiration-choice",
        "form-complete",
        "disabled-real-submission",
        "404",
      ],
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
console.log("36 contrôles de pages et 8 parcours interactifs : OK.");
