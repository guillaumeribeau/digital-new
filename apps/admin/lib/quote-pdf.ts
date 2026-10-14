import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { money, snapshotSchema } from "./commercial-core";

let fontBytes: Buffer | undefined;
async function font() {
  if (fontBytes) return fontBytes;
  for (const directory of ["packages/commercial/assets", "../../packages/commercial/assets"]) {
    try { return fontBytes = await readFile(resolve(directory, "Geist.ttf")); } catch { /* Next app / repository cwd. */ }
  }
  throw new Error("PDF_FONT_UNAVAILABLE");
}
export async function quotePdf(value: unknown) {
  const quote = snapshotSchema.parse(value);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const face = await pdf.embedFont(await font(), { subset: true });
  pdf.setTitle(`Devis ${quote.number}`); pdf.setAuthor(quote.seller.legalName);
  pdf.setCreationDate(new Date(quote.createdAt)); pdf.setModificationDate(new Date(quote.createdAt));
  let page = pdf.addPage([595.28, 841.89]), y = 785;
  const pages = [page];
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
      if (y < 65) { page = pdf.addPage([595.28, 841.89]); pages.push(page); y = 785; }
      // Split long unbroken identifiers without clipping the right margin.
      while (face.widthOfTextAtSize(line, size) > 490) {
        let cut = line.length;
        while (cut > 1 && face.widthOfTextAtSize(line.slice(0, cut), size) > 490) cut--;
        page.drawText(line.slice(0, cut), { x: 52, y, size, font: face, color }); y -= size * 1.5; line = line.slice(cut);
        if (y < 65) { page = pdf.addPage([595.28, 841.89]); pages.push(page); y = 785; }
      }
      page.drawText(line, { x: 52, y, size, font: face, color }); y -= size * 1.5;
    }
  }
  text("DEVIS COMPLÉMENTAIRE", 22, rgb(.14, .33, 1)); y -= 12;
  text(`${quote.number} · ${quote.title}`, 14); y -= 12;
  text(`${quote.seller.legalName}\n${quote.seller.address}\nImmatriculation : ${quote.seller.registrationNumber}`);
  if (quote.seller.vatNumber) text("N° TVA : " + quote.seller.vatNumber);
  y -= 16;
  text(`CLIENT\n${quote.buyer.company}\n${quote.buyer.name}\n${quote.buyer.address}\n${quote.buyer.email}`);
  if (quote.buyer.registrationNumber) text("Immatriculation client : " + quote.buyer.registrationNumber);
  if (quote.buyer.vatNumber) text("N° TVA client : " + quote.buyer.vatNumber);
  y -= 14;
  text(`Émis le ${new Date(quote.createdAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} · Valable jusqu’au ${new Date(quote.validUntil).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`);
  y -= 16;
  for (const item of quote.items) {
    text(item.label, 12); if (item.description) text(item.description);
    text(`Quantité : ${item.quantity} · Prix unitaire HT : ${money(item.unitCents)} · TVA : ${item.taxBasisPoints / 100} %`);
    text(`Total HT : ${money(item.subtotalCents)} · Total TTC : ${money(item.totalCents)}`); y -= 12;
  }
  text(`Total HT : ${money(quote.subtotalCents)}\nTVA : ${money(quote.taxCents)}\nTotal à payer : ${money(quote.totalCents)}`, 13); y -= 12;
  if (quote.seller.taxNote) text(quote.seller.taxNote);
  text("Délai de réalisation : " + quote.deliveryTime); y -= 12;
  text("CONDITIONS", 12); text(quote.terms);
  pages.forEach((p, i) => p.drawText(`${quote.number} · ${i + 1}/${pages.length}`, { x: 52, y: 30, size: 8, font: face, color: rgb(.45, .48, .55) }));
  return Buffer.from(await pdf.save());
}
