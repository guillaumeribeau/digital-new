import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const errors = [];
await mkdir("reports/journey", { recursive: true });
try {
  for (const width of [375, 768, 1024, 1440]) {
    for (const reduced of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(process.env.QA_BASE_URL || "http://127.0.0.1:3000");
      const section = page.locator(".pj-section");
      assert.ok(await section.evaluate((el) => el.previousElementSibling?.classList.contains("rx-hero")));
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      assert.equal(await section.getByRole("button").count(), 4);
      assert.equal(await page.locator(".nh-process").count(), 0);
      for (let i = 0; i < 4; i++) {
        const card = section.getByRole("button").nth(i);
        await card.click();
        await page.waitForTimeout(950);
        assert.equal(await card.getAttribute("aria-pressed"), "true");
        assert.equal(await section.getAttribute("data-step"), String(i));
        assert.equal(await section.locator('.pj-card[aria-pressed="true"]').count(), 1);
        await section.locator(".pj-theatre").screenshot({ path: `reports/journey/scene-${width}-${i}-${reduced ? "reduce" : "motion"}.png` });
      }
      await section.getByRole("button").nth(0).focus();
      await page.keyboard.press("Enter");
      assert.equal(await section.getAttribute("data-step"), "0");
      await page.waitForTimeout(950);
      assert.equal(await section.getByRole("link", { name: "Imaginer mon futur site" }).getAttribute("href"), "/demander-mon-site");
      assert.ok(await section.locator("img").evaluate((img) => img.complete && img.naturalWidth > 0));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (width >= 768 && !reduced) {
        const pos = await section.evaluate((el) => el.getBoundingClientRect().top + scrollY);
        await page.evaluate((top) => scrollTo(0, top - innerHeight * .75 + 10), pos);
        await page.waitForTimeout(300);
        assert.equal(await section.getAttribute("data-step"), "0");
        const bottom = await section.evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
        await page.evaluate((end) => scrollTo(0, end - innerHeight * .65 + 10), bottom);
        await page.waitForTimeout(300);
        assert.equal(await section.getAttribute("data-step"), "3");
      }
      await page.waitForTimeout(950);
      await page.locator(".pj-card:focus").evaluateAll((elements) => elements.forEach((el) => el.blur()));
      await section.screenshot({ path: `reports/journey/section-${width}-${reduced ? "reduce" : "motion"}.png`, animations: "disabled" });
      await page.close();
    }
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto(process.env.QA_BASE_URL || "http://127.0.0.1:3000");
  assert.equal(await page.locator(".pj-card").count(), 4);
  assert.ok(await page.locator(".pj-section").innerText().then((text) => text.includes("La première proposition est gratuite.")));
  await page.close();
  assert.deepEqual(errors, []);
  console.log("Parcours vérifié : 4 formats, animations réduites, cartes, clavier, défilement et contenu sans JavaScript.");
} finally { await browser.close(); }
