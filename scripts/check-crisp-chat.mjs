import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [], errors = [];
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    let loads = 0;
    // Exercise the integration without creating visitors/messages in the real
    // owner's inbox or depending on a third-party network during the check.
    await page.route("https://client.crisp.chat/l.js", async (route) => {
      loads++;
      await route.fulfill({ contentType: "application/javascript", body: `
        window.__crispConfig = { id: window.CRISP_WEBSITE_ID, locale: window.CRISP_RUNTIME_CONFIG.locale };
        window.__crispCommands = [];
        window.__crispEvents = {};
        window.__crispState = { available: ${width === 1440}, ongoing: false, opened: false };
        const queue = Array.from(window.$crisp);
        window.$crisp = {
          is(state) { return state === "website:available" ? window.__crispState.available : state === "session:ongoing" ? window.__crispState.ongoing : state === "chat:opened" ? window.__crispState.opened : false; },
          push(command) {
            window.__crispCommands.push(command);
            const [action, name, value] = command;
            if (action === "on") window.__crispEvents[name] = value;
            if (action === "off") delete window.__crispEvents[name];
            if (action === "do" && (name === "chat:open" || name === "chat:close")) {
              window.__crispState.opened = name === "chat:open";
              window.__crispEvents[window.__crispState.opened ? "chat:opened" : "chat:closed"]?.();
            }
          }
        };
        queue.forEach(command => window.$crisp.push(command));
        window.CRISP_READY_TRIGGER?.();
      ` });
    });
    await page.addInitScript(() => localStorage.setItem("nova-consent", "rejected"));
    await page.goto(base + "/confirmer-demande");
    await page.getByRole("alert").filter({ hasText: "Le lien de confirmation est incomplet" }).waitFor();
    assert.equal(loads, 0, "Aucun fournisseur de chat sur la page de confirmation");
    await page.goto(base + "/exemples/plombier");
    await page.locator("h1").waitFor();
    assert.equal(loads, 0, "Les sites de démonstration restent sans chat Zelyweb");
    await page.goto(base + "/");
    await page.waitForFunction(() => window.__crispConfig);
    const countOpens = () => page.evaluate(() => window.__crispCommands.filter(command => command[1] === "chat:open").length);
    assert.equal(await countOpens(), 0, "La bulle est visible sans ouvrir immédiatement la fenêtre");
    assert.equal(loads, 1);
    assert.deepEqual(await page.evaluate(() => window.__crispConfig), {
      id: "dd23e69b-7b5d-4e66-bb46-50da9ce26e4c", locale: "fr",
    });
    // Next Link navigation must preserve the session, including under StrictMode.
    if (width < 768) await page.getByRole("button", { name: "Ouvrir le menu", exact: true }).click();
    await page.locator('header a[href="/notre-offre"]:visible').click();
    await page.waitForURL("**/notre-offre");
    assert.equal(loads, 1, "Une seule initialisation après navigation");
    assert.equal(await page.locator('script[src="https://client.crisp.chat/l.js"]').count(), 1);
    await page.waitForFunction(() => window.__crispCommands.some(command => command[1] === "chat:open"));
    assert.equal(await countOpens(), 1);
    const greetings = await page.evaluate(() => window.__crispCommands.filter(command => command[1] === "message:show"));
    assert.equal(greetings.length, 1);
    assert.ok(greetings[0][2][1].includes("Écrivez-moi"));
    assert.equal(greetings[0][2][1].includes("actuellement absent"), width !== 1440);
    await page.evaluate(() => window.$crisp.push(["do", "chat:close"]));
    await page.evaluate(() => history.pushState({}, "", "/confirmer-demande"));
    await page.waitForFunction(() => window.__crispCommands.at(-1)?.[1] === "chat:hide");
    await page.evaluate(() => history.pushState({}, "", "/notre-offre"));
    await page.waitForFunction(() => window.__crispCommands.at(-1)?.[1] === "chat:show");
    assert.equal(loads, 1, "La réapparition du chat ne recrée pas la session");
    await page.waitForTimeout(5500);
    assert.equal(await countOpens(), 1, "La fermeture est respectée pendant la navigation");
    assert.ok(await page.evaluate(() => window.__crispCommands.every(([action]) => action !== "set")), "Aucune identité ou donnée de formulaire envoyée automatiquement");
    for (const path of ["/cookies", "/politique-confidentialite"]) {
      await page.goto(base + path);
      await page.waitForFunction(() => window.__crispConfig);
      assert.ok((await page.locator("main").innerText()).includes("Crisp"));
    }
    assert.equal(await countOpens(), 0, "Un rechargement ne relance pas l’ouverture automatique");
    await page.waitForTimeout(5500);
    assert.equal(await countOpens(), 0);
    await page.evaluate(() => window.$crisp.push(["do", "chat:open"]));
    assert.equal(await page.evaluate(() => window.__crispCommands.filter(command => command[1] === "message:show").length), 0, "Pas de doublon du message d’accueil");
    await page.evaluate(() => sessionStorage.removeItem("zelyweb-chat-welcomed"));
    await page.reload();
    await page.waitForFunction(() => window.__crispConfig);
    await page.evaluate(() => {
      window.$crisp.push(["do", "chat:open"]);
      window.$crisp.push(["do", "chat:close"]);
    });
    await page.waitForTimeout(5500);
    assert.equal(await countOpens(), 1, "L’ouverture manuelle puis la fermeture annulent le minuteur");
    await page.evaluate(() => sessionStorage.removeItem("zelyweb-chat-welcomed"));
    await page.reload();
    await page.waitForFunction(() => window.__crispConfig);
    await page.evaluate(() => { window.__crispState.ongoing = true; });
    await page.waitForTimeout(5500);
    assert.equal(await countOpens(), 0, "Une conversation existante ne reçoit pas de sollicitation automatique");
    results.push({ width, protectedRoutes: true, singleLoad: true, locale: "fr", analyticsIndependent: true, notices: true });
    await context.close();
  }
  assert.deepEqual(errors, []);
  await mkdir("reports/crisp", { recursive: true });
  await writeFile("reports/crisp/checks.json", JSON.stringify({ provider: "stubbed, no live messages", results, errors }, null, 2));
  console.log("Crisp : identifiant, français, navigation sans doublon, routes privées exclues et mentions — OK.");
} finally { await browser.close(); }
