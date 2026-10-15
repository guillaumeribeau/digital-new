import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, PDFName } from "pdf-lib";
import { business, sellerDefaults, withSellerDefaults } from "@nova/shared/business";
import { quotePdf } from "../apps/admin/lib/quote-pdf";

test("les coordonnées par défaut complètent les champs vides sans remplacer les paramètres enregistrés", () => {
  assert.equal(withSellerDefaults(null).registrationNumber, business.siret);
  const settings = withSellerDefaults({ legalName: "Émetteur conservé", address: "", terms: "Conditions déjà enregistrées", reminderDays: 7 });
  assert.equal(settings.legalName, "Émetteur conservé");
  assert.equal(settings.address, business.address);
  assert.equal(settings.terms, "Conditions déjà enregistrées");
  assert.equal(settings.reminderDays, 7);
});

test("le PDF conserve l’émetteur historique et intègre le logo sur chaque page, même avec des conditions longues", async () => {
  const snapshot = {
    number: "DEV-2026-TEST", title: "Prestation complémentaire de contrôle",
    createdAt: "2026-10-15T12:00:00Z", validUntil: "2026-11-14T12:00:00Z",
    deliveryTime: "Dix jours ouvrés après paiement", terms: sellerDefaults.terms.repeat(4),
    // Older snapshots have no email and must remain readable and immutable.
    seller: { legalName: "Émetteur historique", address: "1 rue du Test, 75000 Ville fictive", registrationNumber: "HISTORIQUE", vatNumber: "", taxNote: "Ancienne mention conservée" },
    buyer: { company: "Entreprise fictive", name: "Client de contrôle", address: "2 rue du Test", email: "client@example.com" },
    items: [{ label: "Page complémentaire", description: "Description de contrôle", quantity: 1, unitCents: 15000, taxBasisPoints: 2000, subtotalCents: 15000, taxCents: 3000, totalCents: 18000 }],
    subtotalCents: 15000, taxCents: 3000, totalCents: 18000,
  };
  const before = JSON.stringify(snapshot);
  const pdf = await PDFDocument.load(await quotePdf(snapshot));
  assert.ok(pdf.getPageCount() > 1);
  assert.equal(pdf.getAuthor(), "Émetteur historique");
  for (const page of pdf.getPages()) {
    const objects = page.node.Resources()?.lookup(PDFName.of("XObject"));
    assert.ok(objects && "keys" in objects && (objects.keys as () => unknown[])().length > 0, "logo incorporé dans les ressources de chaque page");
  }
  assert.equal(JSON.stringify(snapshot), before);
});
