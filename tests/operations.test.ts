import { test } from "node:test";
import assert from "node:assert/strict";
import { publicationDeadline } from "../apps/admin/lib/operations";
import { domainName, checkUpload } from "../apps/admin/lib/project-workflow";
import { campaignQuery } from "../apps/website/components/ui/tracked-link";
test("publication : deux jours ouvrés français, week-end et jours fériés", () => {
  assert.equal(publicationDeadline(new Date("2026-10-16T12:00:00Z")).toISOString().slice(0, 10), "2026-10-20");
  assert.equal(publicationDeadline(new Date("2026-04-30T12:00:00Z")).toISOString().slice(0, 10), "2026-05-05");
  assert.equal(publicationDeadline(new Date("2026-04-03T12:00:00Z")).toISOString().slice(0, 10), "2026-04-08");
});
test("domaines et fichiers clients : format, contenu et taille contrôlés", () => {
  assert.equal(domainName("École.fr"), "xn--cole-9oa.fr");
  for (const value of ["https://test.fr", "test.fr/chemin", "localhost", "127.0.0.1", "test..fr", "-test.fr"]) assert.throws(() => domainName(value));
  assert.equal(checkUpload("../document.pdf", Buffer.from("%PDF-1.7\n")).mime, "application/pdf");
  assert.throws(() => checkUpload("photo.png", Buffer.from("<html>faux fichier</html>")));
  assert.throws(() => checkUpload("gros.pdf", Buffer.alloc(6 * 1024 * 1024)));
});
test("attribution : seuls les paramètres de campagne valides sont conservés", () => {
  assert.equal(campaignQuery("?utm_source=google&utm_medium=cpc&utm_campaign=offre_299&email=client@example.com&token=secret"), "utm_source=google&utm_medium=cpc&utm_campaign=offre_299");
  assert.equal(campaignQuery("?utm_source=client@example.com&utm_campaign=" + "a".repeat(101)), "");
});
