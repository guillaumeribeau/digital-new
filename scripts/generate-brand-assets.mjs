import { chromium } from "@playwright/test";
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";

// Code-native composition: keep the supplied logo and actual demonstration intact.
const root = "apps/website/public";
await mkdir(`${root}/brand`, { recursive: true });
const icon = await readFile(`${root}/favicon.svg`);
await Promise.all([
  sharp(icon).resize(96, 96).png().toFile(`${root}/favicon.png`),
  sharp(icon).resize(180, 180).png().toFile(`${root}/apple-touch-icon.png`),
]);
const dataImage = async (file, type) =>
  `data:image/${type};base64,${(await readFile(file)).toString("base64")}`;
const logo = await dataImage(`${root}/pics/Logo moderne zelyweb fond transparent.png`, "png");
const preview = await dataImage(`${root}/examples/previews/restaurant-desktop.webp`, "webp");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="fr"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#f6f5f0;color:#141719;font-family:Arial,sans-serif;width:1200px;height:630px;overflow:hidden}
    .canvas{position:relative;width:100%;height:100%;padding:48px 56px;border-bottom:12px solid #0047ff}
    .logo{width:244px;height:auto;display:block}.label{font-size:13px;letter-spacing:2px;font-weight:700;margin-top:35px;color:#0047ff}
    h1{font-size:62px;line-height:1.04;letter-spacing:-3px;margin:18px 0 21px;font-weight:750;width:650px}
    h1 span{color:#0047ff}p{font-size:21px;line-height:1.45;max-width:530px;margin:0}
    .pill{display:inline-block;background:#dcf600;border-radius:24px;padding:12px 19px;font-size:16px;font-weight:700;margin-top:27px}
    .preview{position:absolute;left:755px;top:109px;width:550px;height:415px;transform:rotate(-6deg);border:8px solid #fff;border-radius:16px;background:#171613;overflow:hidden;box-shadow:0 25px 50px #14224a30}
    .bar{height:22px;background:#fff;color:#777;font-size:10px;padding:4px 8px}.preview img{width:100%;display:block}
    footer{position:absolute;bottom:36px;left:56px;right:56px;display:flex;justify-content:space-between;font-size:15px;color:#4a5055}
    .example{position:absolute;right:38px;top:538px;font-size:12px;color:#60656a}
  </style><div class="canvas"><img class="logo" src="${logo}" alt="Zelyweb">
  <div class="label">CRÉATION DE SITES VITRINES · FRANCE</div>
  <h1>Votre futur site.<br><span>Voyez-le avant<br>de payer.</span></h1>
  <p>Une première version complète offerte.<br>Vous découvrez. Vous décidez.</p>
  <div class="pill">5 pages · Un interlocuteur direct</div>
  <div class="preview"><div class="bar">● ● ● &nbsp; Aperçu de site</div><img src="${preview}" alt="Exemple fictif de site restaurant"></div>
  <div class="example">Exemple fictif · L’Atelier des Braises</div>
  <footer><span>Professionnels partout en France</span><strong>zelyweb.com</strong></footer></div></html>`);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
  await page.screenshot({ path: `${root}/brand/zelyweb-partage.png` });
  console.log("Favicon 96 px, icône Apple 180 px et visuel de partage 1200 × 630 générés.");
} finally {
  await browser.close();
}
