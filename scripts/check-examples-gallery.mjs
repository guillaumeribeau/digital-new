import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const base = process.env.EXAMPLES_BASE_URL || "http://127.0.0.1:3000";
const errors = [];
const results = [];
for (const width of [375, 768, 1024, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/client.crisp.chat/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  const response = await page.goto(base + "/exemples", {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  assert.equal(await page.locator(".portfolio-project").count(), 14);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".portfolio-preview img")).every(
      (i) => i.complete && i.naturalWidth > 0,
    ),
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "gallery overflow " + width,
  );
  await page.screenshot({
    path: "reports/examples/gallery-" + width + ".png",
    fullPage: true,
  });
  await page.screenshot({
    path: "reports/examples/gallery-top-" + width + ".png",
  });
  for (const [name, count] of [
    ["Artisanat", 4],
    ["Commerce", 3],
    ["Indépendants", 4],
    ["Professions libérales", 2],
    ["Associations", 1],
    ["Tous", 14],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    assert.equal(await page.locator(".portfolio-project").count(), count);
  }
  await page.getByLabel("Rechercher un métier").fill("electricien");
  assert.equal(await page.locator(".portfolio-project").count(), 1);
  await page.getByLabel("Ambiance", { exact: true }).selectOption("dark");
  assert.equal(await page.locator(".portfolio-project").count(), 0);
  await page.getByRole("button", { name: "Réinitialiser", exact: true }).click();
  await page.getByLabel("Ambiance", { exact: true }).selectOption("dark");
  assert.equal(await page.locator(".portfolio-project").count(), 4);
  await page.getByRole("button", { name: "Réinitialiser", exact: true }).click();
  await page.getByLabel("Trier par", { exact: true }).selectOption("newest");
  assert.equal(await page.locator(".portfolio-project h3").first().innerText(), "Adresse Singulière");
  await page.getByLabel("Trier par", { exact: true }).selectOption("name");
  const names = await page.locator(".portfolio-project h3").allTextContents();
  assert.deepEqual(names, [...names].sort((a,b) => a.localeCompare(b,"fr")));
  await page.getByLabel("Trier par", { exact: true }).selectOption("sector");
  const sectors = await page.locator(".portfolio-sector").allTextContents();
  assert.deepEqual(sectors, [...sectors].sort((a,b) => a.localeCompare(b,"fr")));
  await page.getByRole("button", { name: "Réinitialiser", exact: true }).click();
  await page
    .getByRole("link", {
      name: "Explorer le site de démonstration Atelier Martin Plomberie",
    })
    .click();
  await page
    .getByRole("heading", { name: "La plomberie, sans mauvaise surprise." })
    .waitFor();
  assert.equal(await page.locator(".header").count(), 0);
  await page.getByRole("link", { name: "Retour à la galerie" }).click();
  await page
    .getByRole("heading", { name: "Le vôtre pourrait ressembler à ça." })
    .waitFor();
  results.push({
    width,
    filters: true,
    search: true,
    sorting: true,
    photos: true,
    navigation: true,
    overflow: false,
  });
  await page.close();
}
assert.deepEqual(errors, []);
await writeFile(
  "reports/examples/gallery-checks.json",
  JSON.stringify({ results, errors }, null, 2),
);
await browser.close();
console.log(
  "Galerie : 4 largeurs, filtres, recherche, classements, navigation et captures chargées — OK.",
);
