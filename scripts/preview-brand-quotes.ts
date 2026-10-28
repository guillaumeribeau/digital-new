import { mkdir, writeFile } from "node:fs/promises";
import { brandSellerDefaults, type Brand, brands } from "@nova/shared/brands";
import { quotePdf } from "../apps/admin/lib/quote-pdf";

async function main() {
  await mkdir("reports/brand-quotes", { recursive: true });
  for (const brand of ["zelyweb", "tadapo"] as Brand[]) {
    const snapshot = {
      brand, number: brand === "tadapo" ? "TD-2026-000001" : "DV-2026-000001", title: "Une page supplémentaire pour votre site",
      createdAt: "2026-10-28T12:00:00Z", validUntil: "2026-11-27T12:00:00Z", deliveryTime: "Sous 10 jours ouvrés après paiement et réception des contenus",
      terms: brandSellerDefaults(brand).terms, seller: { ...brandSellerDefaults(brand), email: brands[brand].email },
      buyer: { company: "Atelier Exemple", name: "Camille Exemple", email: "client@example.com", address: "2 rue du Test, 75000 Paris" },
      items: [{ label: "Page supplémentaire", description: "Présentation du service et formulaire de contact", quantity: 1, unitCents: 15000, taxBasisPoints: 2000, subtotalCents: 15000, taxCents: 3000, totalCents: 18000 }],
      subtotalCents: 15000, taxCents: 3000, totalCents: 18000,
    };
    await writeFile(`reports/brand-quotes/${brand}.pdf`, await quotePdf(snapshot));
  }
}
main().catch(() => { console.error("BRAND_QUOTE_PREVIEW_FAILED"); process.exitCode = 1; });
