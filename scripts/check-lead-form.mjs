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
await mkdir("reports/form", { recursive: true });
for (const width of [375, 768, 1024, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const [style, exampleName] = ({
    375: ["restaurant", "L’Atelier des Braises"],
    768: ["photographe", "Noé Laurent Studio"],
    1024: ["automobile", "Atelier Minuit"],
    1440: ["coiffure", "Maison Camille"],
  })[width];
  await page.route("**/client.crisp.chat/**", route => route.fulfill({contentType:"application/javascript",body:""}));
  let posts = 0,
    lastPayload,
    success = false;
  await page.route("**/api/leads", async (route) => {
    posts++;
    lastPayload = route.request().postDataJSON();
    await route.fulfill({
      status: success ? 200 : 503,
      contentType: "application/json",
      body: JSON.stringify(
        success
          ? { success: true, reference: "qa-local-reference" }
          : {
              error:
                "Envoi de contrôle refusé. Aucune demande réelle transmise.",
            },
      ),
    });
  });
  await page.goto(base + "/demander-mon-site");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .getByText("Nom de l’entreprise : indiquez au moins 2 caractères.")
    .waitFor();
  assert.equal(await page.locator(".form-sidebar ol>li").count(), 3);
  await page
    .getByLabel("Nom de votre entreprise", { exact: true })
    .fill("Atelier QA");
  await page.getByLabel("Votre secteur d’activité").selectOption("Artisanat");
  await page.getByLabel("Votre ville").fill("Lyon");
  await page
    .getByLabel("Votre métier et vos principales prestations")
    .fill("Plombier : rénovation et dépannage");
  // Let on-blur validation settle before scrolling to the mobile submit button.
  await page.getByLabel("Votre métier et vos principales prestations").blur();
  await page.waitForFunction(() => !document.getElementById("sector-error"));
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.addStyleTag({
    content: ".header,.skip-link,nextjs-portal{display:none}",
  });
  await page
    .locator(".form-layout")
    .screenshot({ path: "reports/form/activity-" + width + ".png" });
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  assert.ok(
    await page
      .getByRole("radio", { name: /Proposez-moi un style/ })
      .isChecked(),
  );
  assert.equal(await page.locator(".lead-inspiration-card").count(), 9);
  await page
    .locator(".lead-inspiration-photo img")
    .evaluateAll(async (imgs) => {
      await document.fonts.ready;
      await Promise.all(
        imgs.map(async (img) => {
          img.loading = "eager";
          await img.decode();
        }),
      );
    });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.getByText(exampleName, { exact: true }).click();
  await page
    .locator(".form-layout")
    .screenshot({ path: "reports/form/inspiration-" + width + ".png" });
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel("Nom et prénom", { exact: true }).fill("Camille QA");
  await page.getByLabel("Votre adresse e-mail").fill("qa@example.com");
  assert.ok(
    await page
      .getByRole("radio", { name: "Par e-mail", exact: true })
      .isChecked(),
  );
  await page.locator('.anti-bot[data-verified="true"]').waitFor();
  await page
    .getByRole("button", { name: "Envoyer ma demande gratuitement" })
    .click();
  await page
    .getByText("Votre accord est nécessaire pour traiter la demande.")
    .waitFor();
  assert.equal(posts, 0);
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("radio", { name: "Par téléphone", exact: true }).check();
  assert.equal(
    await page.locator('label[for="phone"]').innerText(),
    "Votre téléphone",
  );
  await page.locator('.anti-bot[data-verified="true"]').waitFor();
  await page
    .getByRole("button", { name: "Envoyer ma demande gratuitement" })
    .click();
  await page
    .getByText("Indiquez un numéro pour être contacté par téléphone.")
    .waitFor();
  assert.equal(posts, 0);
  await page.getByRole("radio", { name: "Par e-mail", exact: true }).check();
  await page.waitForFunction(() => !document.getElementById("phone-error"));
  assert.ok(
    (await page.locator('label[for="phone"]').innerText()).includes(
      "facultatif",
    ),
  );
  await page
    .getByRole("button", { name: "Modifier", exact: true })
    .first()
    .click();
  assert.equal(
    await page
      .getByLabel("Nom de votre entreprise", { exact: true })
      .inputValue(),
    "Atelier QA",
  );
  await page
    .getByLabel("Votre métier et vos principales prestations")
    .fill("Plombier : salles de bains et dépannage");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  assert.ok(
    await page.locator(`input[name="style"][value="${style}"]`).isChecked(),
  );
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  assert.equal(
    await page.getByLabel("Votre adresse e-mail").inputValue(),
    "qa@example.com",
  );
  await page
    .getByText("Plombier : salles de bains et dépannage", { exact: true })
    .waitFor();
  await page.locator('.anti-bot[data-verified="true"]').waitFor();
  await page
    .getByRole("button", { name: "Envoyer ma demande gratuitement" })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Envoi de contrôle refusé." })
    .waitFor();
  assert.equal(posts, 1);
  assert.equal(lastPayload.phone, "");
  assert.equal(lastPayload.style, style);
  assert.equal(lastPayload.contactMethod, "email");
  for (const field of [
    "description",
    "colors",
    "hasLogo",
    "hasPhotos",
    "extra",
    "hasWebsite",
    "website",
  ])
    assert.equal(lastPayload[field], undefined, field);
  assert.equal(await page.locator(".form-success").count(), 0);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .locator(".form-layout")
    .screenshot({ path: "reports/form/contact-" + width + ".png" });
  // Exercise the success UI through a locally intercepted response; no external mail is sent.
  success = true;
  await page.getByRole("radio", { name: "Par téléphone", exact: true }).check();
  await page
    .getByLabel("Votre téléphone", { exact: true })
    .fill("06 12 34 56 78");
  await page.locator('.anti-bot[data-verified="true"]').waitFor();
  await page
    .getByRole("button", { name: "Envoyer ma demande gratuitement" })
    .click();
  await page.locator(".form-success").waitFor();
  assert.equal(posts, 2);
  assert.equal(lastPayload.phone, "06 12 34 56 78");
  assert.equal(lastPayload.contactMethod, "telephone");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  results.push({
    width,
    steps: 3,
    inspiration: true,
    optionalPhone: true,
    review: true,
    validation: true,
    mockedSubmission: true,
  });
  await page.close();
}
assert.deepEqual(errors, []);
await writeFile(
  "reports/form/checks.json",
  JSON.stringify({ results, errors }, null, 2),
);
await browser.close();
console.log(
  "Formulaire : 3 étapes, 4 largeurs, choix visuel, téléphone conditionnel, récapitulatif et envois simulés — OK.",
);
