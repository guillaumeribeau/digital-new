import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.EXAMPLES_BASE_URL || "http://127.0.0.1:3000";
const slugs = [
  "plombier",
  "paysagiste",
  "coiffure",
  "conseil",
  "bien-etre",
  "association",
];
await mkdir("apps/website/public/examples/previews", { recursive: true });
await mkdir("reports/examples", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
const errors = [];
for (const slug of slugs) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push({ slug, error: e.message }));
  const response = await page.goto(base + "/exemples/" + slug, {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200, slug);
  await page.locator("h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(
    await page.locator(".header").count(),
    0,
    "No commercial header",
  );
  assert.equal(
    await page.locator(".footer").count(),
    0,
    "No commercial footer",
  );
  assert.equal(await page.locator(".example-header").count(), 1);
  assert.equal(await page.locator(".example-footer").count(), 1);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const dims = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dims.scroll <= width,
      slug + " overflow " + width + ": " + JSON.stringify(dims),
    );
    results.push({ slug, width, overflow: false });
  }
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".ex-photo img")).every(
      (i) => i.complete && i.naturalWidth > 0,
    ),
  );
  await page.screenshot({
    path: "reports/examples/" + slug + "-desktop-full.png",
    fullPage: true,
  });
  await page.screenshot({ path: "reports/examples/" + slug + "-desktop.png" });
  await page.addStyleTag({
    content: ".example-banner{display:none!important}",
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await sharp(await page.screenshot())
    .webp({ quality: 88 })
    .toFile("apps/website/public/examples/previews/" + slug + "-desktop.webp");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  await sharp(await page.screenshot())
    .webp({ quality: 88 })
    .toFile("apps/website/public/examples/previews/" + slug + "-mobile.webp");
  await page.addStyleTag({
    content: ".example-banner{display:flex!important}",
  });
  await page.screenshot({
    path: "reports/examples/" + slug + "-mobile.png",
    fullPage: true,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
  await page
    .getByRole("navigation", {
      name: "Navigation mobile du site de démonstration",
    })
    .waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ouvrir la navigation" }).waitFor();
  await page.locator(".ex-mobile-menu").waitFor({ state: "detached" });
  await page.locator(".ex-menu-toggle").click();
  await page
    .getByRole("navigation", {
      name: "Navigation mobile du site de démonstration",
    })
    .getByRole("link")
    .first()
    .click();
  await page.locator(".ex-mobile-menu").waitFor({ state: "detached" });
  const submitted = [];
  page.on("request", (req) => {
    if (req.method() === "POST") submitted.push(req.url());
  });
  if (await page.locator(".ex-form").count()) {
    await page.locator(".ex-form button").click();
    await page.getByRole("status").waitFor();
    assert.deepEqual(submitted, []);
  }
  await page.close();
}
assert.deepEqual(errors, []);
await writeFile(
  "reports/examples/checks.json",
  JSON.stringify(
    {
      pages: results,
      errors,
      previews:
        "Captures exactes des démonstrations, sans le bandeau de retour à la galerie",
      forms: "Aucune requête POST lors des clics de démonstration",
    },
    null,
    2,
  ),
);
await browser.close();
console.log(
  "6 sites, 24 contrôles responsive, 12 aperçus et contacts fictifs : OK.",
);
