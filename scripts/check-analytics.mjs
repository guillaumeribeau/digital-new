import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const base = process.env.QA_BASE_URL || "http://localhost:3100";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: "reduce" });
    let loads = 0;
    await context.route("https://www.googletagmanager.com/**", async route => {
      loads++;
      assert.ok(route.request().url().includes("gtag/js?id=G-TDLF1WPKD4"));
      await route.fulfill({ contentType: "application/javascript", body: "/* Analytics stub: never send QA visits to Google. */" });
    });
    await context.route(/https:\/\/(.*\.)?(google-analytics|analytics\.google)\.com\//, route => route.abort());
    await context.route("https://client.crisp.chat/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
    const page = await context.newPage();
    const commands = () => page.evaluate(() => (window.dataLayer || []).map(command => Array.from(command)));
    await page.goto(base + "/?utm_source=facebook&utm_medium=paid_social&utm_campaign=lancement&email=secret%40example.com#token-secret");
    await page.getByRole("button", { name: "Accepter", exact: true }).waitFor();
    assert.equal(loads, 0, "No script before consent");
    await page.getByRole("button", { name: "Refuser", exact: true }).click();
    await page.reload();
    await page.locator("h1").waitFor();
    assert.equal(loads, 0, "No script after rejection or reload");
    await page.goto(base + "/cookies?utm_source=facebook&utm_medium=paid_social&utm_campaign=lancement&email=secret%40example.com#token-secret");
    await page.getByRole("button", { name: "Gérer mes préférences" }).first().click();
    await page.getByRole("button", { name: "Accepter", exact: true }).click();
    await page.waitForFunction(() => window.dataLayer?.length > 0);
    await page.waitForFunction(() => document.getElementById("zelyweb-ga"));
    const first = await commands();
    assert.equal(first.filter(c => c[0] === "config").length, 1);
    assert.equal(first.find(c => c[0] === "config")[2].send_page_view, false);
    assert.equal(first.find(c => c[0] === "consent")[2].ad_storage, "denied");
    const initialView = first.find(c => c[0] === "event" && c[1] === "page_view");
    assert.ok(initialView[2].page_location.includes("utm_campaign=lancement"));
    assert.ok(!JSON.stringify(first).includes("secret"), "No unknown queries or fragments");
    // Exercise a real Next.js client navigation and its CTA event.
    if (width < 1024) await page.getByRole("button", { name: "Ouvrir le menu", exact: true }).click();
    await page.locator('header a[href="/notre-offre"]:visible').click();
    await page.waitForURL("**/notre-offre");
    await page.waitForFunction(() => window.dataLayer?.some(c => c[1] === "page_view" && c[2]?.page_location?.endsWith("/notre-offre")));
    assert.equal(loads, 1, "One loader across client navigation");
    const views = (await commands()).filter(c => c[0] === "event" && c[1] === "page_view");
    assert.equal(views.length, 2, "One manual page view per route");
    await page.locator('main a[href="/demander-mon-site"]').first().click();
    await page.waitForURL("**/demander-mon-site");
    assert.ok((await commands()).some(c => c[0] === "event" && c[1] === "cta_click"));
    // Excluded initial pages never load Google's SDK, even with saved consent.
    for (const route of ["/confirmer-demande?token=secret#secret", "/exemples/restaurant"]) {
      const before = loads;
      await page.goto(base + route);
      await page.locator("h1").waitFor();
      assert.equal(loads, before, "Excluded route: " + route);
      assert.equal(await page.locator("#zelyweb-ga").count(), 0);
    }
    await page.goto(base + "/cookies");
    await page.getByRole("button", { name: "Gérer mes préférences" }).first().click();
    await page.getByRole("button", { name: "Refuser", exact: true }).click();
    await page.waitForFunction(() => localStorage.getItem("nova-consent") === "rejected" && !document.getElementById("zelyweb-ga"));
    console.log(width + " px: consentement, refus, UTM, navigation, CTA, exclusions et retrait OK");
    await context.close();
  }
} finally { await browser.close(); }
