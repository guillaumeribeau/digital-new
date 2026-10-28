import { brands } from "@nova/shared/brands";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { money, snapshotSchema } from "./commercial-core";

let fontBytes: Buffer | undefined;
async function asset(name: "Geist.ttf" | "zelyweb-logo.png") {
  for (const directory of ["packages/commercial/assets", "../../packages/commercial/assets"]) {
    // These two assets are explicitly included by admin/next.config.ts.
    try { return await readFile(/* turbopackIgnore: true */ resolve(directory, name)); } catch { /* Repository or Next app cwd. */ }
  }
  throw new Error("PDF_ASSET_UNAVAILABLE");
}
async function font() {
  if (fontBytes) return fontBytes;
  return fontBytes = await asset("Geist.ttf");
}
export async function quotePdf(value: unknown) {
  const quote = snapshotSchema.parse(value);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const face = await pdf.embedFont(await font(), { subset: true });
  pdf.setTitle(`Devis ${quote.number}`); pdf.setAuthor(quote.seller.legalName);
  pdf.setCreationDate(new Date(quote.createdAt)); pdf.setModificationDate(new Date(quote.createdAt));
  const logo = quote.brand === "zelyweb" ? await pdf.embedPng(await asset("zelyweb-logo.png")) : undefined;
  const ink = rgb(.07, .10, .16), blue = quote.brand === "tadapo" ? rgb(.88, .36, .16) : rgb(.14, .33, 1), muted = rgb(.43, .48, .56);
  let page = pdf.addPage([595.28, 841.89]), y = 726;
  const pages = [page];
  function header() {
    if (logo) page.drawImage(logo, { x: 48, y: 767, width: 144, height: 48 });
    else page.drawText("tadapo.", { x: 48, y: 778, size: 32, font: face, color: blue });
    page.drawText("DEVIS COMPLÉMENTAIRE", { x: 315, y: 791, size: 14, font: face, color: blue });
    page.drawText(quote.number, { x: 315, y: 773, size: 10, font: face, color: muted });
    page.drawLine({ start: { x: 52, y: 750 }, end: { x: 543, y: 750 }, thickness: 1, color: rgb(.88, .91, .96) });
  }
  header();
  function ensure(height: number) {
    if (y - height < 65) { page = pdf.addPage([595.28, 841.89]); pages.push(page); header(); y = 726; }
  }
  function text(value: string, size = 10, color = rgb(.12, .16, .24)) {
    const paragraphs = value.replace(/\r/g, "").split("\n");
    for (const paragraph of paragraphs) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? line + " " + word : word;
        if (face.widthOfTextAtSize(candidate, size) > 490 && line) { draw(line); line = word; } else line = candidate;
      }
      draw(line);
    }
    function draw(line: string) {
      ensure(size * 1.5);
      // Split long unbroken identifiers without clipping the right margin.
      while (face.widthOfTextAtSize(line, size) > 490) {
        let cut = line.length;
        while (cut > 1 && face.widthOfTextAtSize(line.slice(0, cut), size) > 490) cut--;
        page.drawText(line.slice(0, cut), { x: 52, y, size, font: face, color }); y -= size * 1.5; line = line.slice(cut);
        ensure(size * 1.5);
      }
      page.drawText(line, { x: 52, y, size, font: face, color }); y -= size * 1.5;
    }
  }
  text(quote.title, 18, ink); y -= 12;
  text("ÉMETTEUR", 9, muted);
  text(`${quote.seller.legalName}\n${quote.seller.address}\nImmatriculation : ${quote.seller.registrationNumber}`);
  if (quote.seller.vatNumber) text("N° TVA : " + quote.seller.vatNumber);
  if (quote.seller.email) text(quote.seller.email);
  y -= 16;
  ensure(110);
  text(`CLIENT\n${quote.buyer.company}\n${quote.buyer.name}\n${quote.buyer.address}\n${quote.buyer.email}`);
  if (quote.buyer.registrationNumber) text("Immatriculation client : " + quote.buyer.registrationNumber);
  if (quote.buyer.vatNumber) text("N° TVA client : " + quote.buyer.vatNumber);
  y -= 14;
  text(`Émis le ${new Date(quote.createdAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} · Valable jusqu’au ${new Date(quote.validUntil).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`);
  y -= 16;
  text("PRESTATIONS", 9, muted); y -= 4;
  for (const item of quote.items) {
    ensure(80);
    text(item.label, 12); if (item.description) text(item.description);
    text(`Quantité : ${item.quantity} · Prix unitaire HT : ${money(item.unitCents)} · TVA : ${item.taxBasisPoints / 100} %`);
    text(`Total HT : ${money(item.subtotalCents)} · Total TTC : ${money(item.totalCents)}`); y -= 12;
  }
  ensure(95);
  page.drawRectangle({ x: 44, y: y - 63, width: 507, height: 80, color: rgb(.95, .97, 1) });
  text(`Total HT : ${money(quote.subtotalCents)}\nTVA : ${money(quote.taxCents)}\nTotal à payer : ${money(quote.totalCents)}`, 13); y -= 12;
  if (quote.seller.taxNote) text(quote.seller.taxNote);
  text("Délai de réalisation : " + quote.deliveryTime); y -= 12;
  // Keep short conditions together; long conditions begin on a fresh page.
  const termsLines = quote.terms.split("\n").reduce((count, line) => count + Math.max(1, Math.ceil(face.widthOfTextAtSize(line, 9) / 460)), 0);
  ensure(Math.min(650, 30 + termsLines * 13.5));
  text("CONDITIONS", 12, blue); text(quote.terms, 9);
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: 52, y: 48 }, end: { x: 543, y: 48 }, thickness: .5, color: rgb(.88, .91, .96) });
    p.drawText(`${quote.number} · ${i + 1}/${pages.length}`, { x: 52, y: 30, size: 8, font: face, color: muted });
    p.drawText(brands[quote.brand].domain, { x: 475, y: 30, size: 8, font: face, color: blue });
  });
  return Buffer.from(await pdf.save());
}
