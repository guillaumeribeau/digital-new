import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const errors = [],
  results = [];
await mkdir("reports/hero", { recursive: true });
for (const width of [375, 768, 1024, 1440]) {
  for (const reduced of [true, false]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(base);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("h1").count(), 1);
    const text = (await page.locator("h1").innerText())
      .replace(/\s+/g, " ")
      .trim();
    assert.ok(
      text.includes("On crée votre site.") &&
        text.includes("Il vous plaît ?") &&
        text.includes("Vous payez."),
      text,
    );
    const cta = page.getByRole("link", {
      name: "Découvrir mon futur site gratuitement",
      exact: true,
    });
    assert.equal(await cta.getAttribute("href"), "/demander-mon-site");
    assert.ok(await cta.isVisible());
    assert.equal(
      await page
        .getByRole("link", { name: "Voir des exemples", exact: true })
        .getAttribute("href"),
      "/exemples",
    );
    await page.locator(".rx-mini-photo img").evaluate(async (img) => {
      await document.fonts.ready;
      await img.decode();
    });
    assert.ok(
      await page
        .locator(".rx-mini-photo img")
        .evaluate((img) => img.naturalWidth > 0),
    );
    assert.equal(await page.locator(".rx-mini-service").count(), 3);
    if (!reduced) {
      await page.waitForFunction(
        () =>
          document.querySelector(".rx-animation-controls button:last-child")
            ?.disabled === false,
      );
      const ctaDuring = await cta.boundingBox();
      assert.ok(
        ctaDuring && ctaDuring.y < 900,
        "CTA visible during animation at " + width,
      );
      await page.addStyleTag({ content: "nextjs-portal{display:none}" });
      await page.screenshot({
        path: "reports/hero/assembly-" + width + ".png",
      });
      await page.locator('.rx-hero[data-phase="ready"]').waitFor();
      await page
        .getByRole("button", { name: "Rejouer la construction du site" })
        .click();
      await page.locator('.rx-hero[data-phase="compose"]').waitFor();
      await page.getByRole("button", { name: "Terminer l’animation" }).click();
      await page.locator('.rx-hero[data-phase="ready"]').waitFor();
      assert.ok(
        await page
          .getByRole("button", { name: "Terminer l’animation" })
          .isDisabled(),
      );
    } else {
      assert.ok(
        !(await page
          .getByRole("button", { name: "Rejouer la construction du site" })
          .isVisible()),
      );
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(() => scrollY === 0);
    if (!reduced && width > 900)
      await page.waitForFunction(
        () =>
          Number(
            getComputedStyle(document.querySelector(".rx-completion")).opacity,
          ) < 0.2,
      );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Initial overflow " + width,
    );
    await page.addStyleTag({ content: "nextjs-portal{display:none}" });
    await page.screenshot({
      path:
        "reports/hero/" +
        (reduced ? "reduced" : "finished") +
        "-" +
        width +
        ".png",
    });
    const before = await page
      .locator(".rx-stage")
      .evaluate((el) => el.getBoundingClientRect().width);
    const completion = page.locator(".rx-completion");
    await completion.evaluate((el) => el.scrollIntoView({ block: "center" }));
    if (!reduced && width > 900)
      await page.waitForFunction(
        () =>
          Number(
            getComputedStyle(document.querySelector(".rx-completion")).opacity,
          ) > 0.98,
      );
    const after = await page
      .locator(".rx-stage")
      .evaluate((el) => el.getBoundingClientRect().width);
    if (!reduced && width > 900)
      assert.ok(after > before + 10, "Preview grows on desktop scroll");
    assert.ok(await completion.isVisible());
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Scroll overflow " + width,
    );
    await page.screenshot({
      path:
        "reports/hero/scroll-" + (reduced ? "reduced-" : "") + width + ".png",
    });
    assert.ok((await page.locator("#votre-site").count()) === 1);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (reduced)
      await page
        .locator(".rx-hero")
        .screenshot({ path: "reports/hero/full-" + width + ".png" });
    results.push({ width, reduced, overflow: false, cta: true, photo: true });
    await page.close();
  }
}
const nojs = await browser.newPage({
  javaScriptEnabled: false,
  viewport: { width: 375, height: 900 },
});
await nojs.goto(base);
assert.ok(await nojs.locator("h1").isVisible());
assert.ok(
  await nojs
    .getByRole("link", {
      name: "Découvrir mon futur site gratuitement",
      exact: true,
    })
    .isVisible(),
);
assert.ok(await nojs.locator(".rx-mini-site").isVisible());
await nojs.close();
assert.deepEqual(errors, []);
await writeFile(
  "reports/hero/checks.json",
  JSON.stringify({ results, errors, noJavaScript: true }, null, 2),
);
await browser.close();
console.log(
  "Hero : 4 largeurs × 2 modes, montage GSAP, scroll, CTA et HTML sans JavaScript — OK.",
);
