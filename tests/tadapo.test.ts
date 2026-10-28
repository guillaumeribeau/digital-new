import test from "node:test";
import assert from "node:assert/strict";
import { tadapoAgreement, tadapoAnniversary, tadapoOffer, tadapoOrderPath, tadapoSelection, type TadapoPlan, type TadapoTerm } from "../packages/shared/tadapo";
import { tadapoBillingWindow } from '../packages/shared/tadapo-workflow';
import { tadapoBriefSchema } from "../packages/validation/tadapo";
import { prepareTadapoOrder } from "../apps/tadapo/lib/order-contract";
import { domainContribution, lookupDomain } from "../apps/tadapo/lib/domain";
const brief = { plan: "essentiel", term: "12", company: "Atelier Exemple", activity: "Électricité", area: "Le Mans", fullName: "Camille Exemple", email: "camille@example.com", phone: "", objectives: "Recevoir des demandes de devis", services: "Rénovation électrique", audience: "Particuliers", pages: "", existingWebsite: "", style: "Lumineux", colors: "", inspirations: "", logo: "non", content: "", domainMode: "help", domain: "" };
test("le domaine des deux formules est inclus jusqu’à 20 € HT/an, sur un prix en euros approuvé", () => {
  assert.deepEqual(domainContribution("business", "atelier.fr", 2600), { actualHtCents: 2600, includedHtCents: 2000, extraHtCents: 600 });
  assert.equal(domainContribution("business", "atelier.com", 1500).extraHtCents, 0);
  assert.equal(domainContribution("essentiel", "atelier.com", 1500).extraHtCents, 0);
  assert.equal(domainContribution("business", "atelier.net", 1500).extraHtCents, 0);
  for (const price of [-1, 1.5, NaN, Infinity]) assert.throws(() => domainContribution("business", "atelier.fr", price));
});
test("la recherche Vercel conserve les dollars et distingue extension non supportée et domaine pris", async () => {
  let calls = 0;
  const mock = (async (url: string | URL | Request) => {
    calls++;
    return Response.json(String(url).endsWith("/supported") ? ["com", "net"] : { results: [{ domain: "atelier.com", available: true, years: 1, price: 11.25, renewalPrice: 15, premium: false }] });
  }) as typeof fetch;
  const manual = await lookupDomain("atelier.fr", mock);
  assert.equal(manual.status, "manual"); assert.equal(calls, 1);
  const available = await lookupDomain(" ATELIER.COM ", mock);
  assert.equal(available.registrationUsd, 11.25); assert.equal(available.renewalUsd, 15);
  assert.equal(available.status, "available"); assert.equal("extraHtCents" in available, false);
  await assert.rejects(() => lookupDomain("https://example.com/private", mock));
});
test("une réponse fournisseur incomplète ne confirme jamais un prix ou une disponibilité", async () => {
  const mock = (async (url: string | URL | Request) => Response.json(String(url).endsWith("/supported") ? ["com"] : { results: [{ domain: "atelier.com", available: true, years: 1, price: 11.25 }] })) as typeof fetch;
  await assert.rejects(() => lookupDomain("atelier.com", mock), /INVALID_RESPONSE/);
  await assert.rejects(() => lookupDomain("atelier.com", (async () => new Response(null, { status: 503 })) as typeof fetch), /UNAVAILABLE/);
});
test("les quatre formules conservent leurs prix TTC, durées et avantages", () => {
  for (const [plan, term, ht, ttc, minimumMonths] of [["essentiel", "12", 3900, 4680, 12], ["essentiel", "monthly", 4900, 5880, 0], ["business", "12", 6900, 8280, 12], ["business", "monthly", 8500, 10200, 0]] as const) {
    const order = prepareTadapoOrder({ ...brief, plan, term, pages: plan === "business" ? "Accueil, services, contact" : "" });
    assert.equal(order.offerSnapshot.htCents, ht); assert.equal(order.offerSnapshot.ttcCents, ttc);
    assert.equal(order.offerSnapshot.minimumMonths, minimumMonths);
    assert.equal(order.brand, "tadapo"); assert.equal(order.status, "draft");
    assert.equal(order.offerSnapshot.domainAnnualCapCents, 2000);
    assert.equal(order.offerSnapshot.initialRevisionRounds,3);
    assert.doesNotMatch(tadapoAgreement(order.offerSnapshot),/minute/i);
  }
});
test("le brief refuse les prix, statuts et identités privilégiées injectés par le client", () => {
  for (const key of ["price", "htCents", "paid", "status", "brand", "offerSnapshot"]) {
    assert.equal(tadapoBriefSchema.safeParse({ ...brief, [key]: key === "htCents" ? 1 : "fake" }).success, false);
  }
});
test("les paramètres inconnus ne permettent pas de créer une offre arbitraire", () => {
  assert.deepEqual(tadapoSelection("premium", "free"), { plan: "essentiel", term: "12" });
  for (const plan of ["essentiel", "business"] as TadapoPlan[]) for (const term of ["12", "monthly"] as TadapoTerm[]) {
    const url = new URL(tadapoOrderPath(plan, term), "https://tadapo.com");
    assert.deepEqual(tadapoSelection(url.searchParams.get("offre"), url.searchParams.get("engagement")), { plan, term });
    assert.equal(tadapoOffer(plan, term).creationCents, 0);
  }
});
test("le domaine existant ou demandé doit être renseigné, sans prétendre vérifier sa disponibilité", () => {
  assert.equal(tadapoBriefSchema.safeParse({ ...brief, domainMode: "existing", domain: "" }).success, false);
  assert.equal(tadapoBriefSchema.safeParse({ ...brief, domainMode: "new", domain: "https://example.fr" }).success, false);
  assert.equal(tadapoBriefSchema.safeParse({ ...brief, domainMode: "new", domain: "example.fr" }).success, true);
  assert.equal(tadapoBriefSchema.safeParse({ ...brief, existingWebsite: "javascript:alert(1)" }).success, false);
});
test("Business exige une description des pages, contrairement à Essentiel", () => {
  assert.equal(tadapoBriefSchema.safeParse(brief).success, true);
  assert.equal(tadapoBriefSchema.safeParse({ ...brief, plan: "business" }).success, false);
});
test("les anniversaires mensuels sont bornés aux jours réels du mois", () => {
  assert.equal(tadapoAnniversary(new Date("2026-01-31T12:34:56Z"), 1).toISOString(), "2026-02-28T12:34:56.000Z");
  assert.equal(tadapoAnniversary(new Date("2024-02-29T12:34:56Z"), 12).toISOString(), "2025-02-28T12:34:56.000Z");
});
test('la période des modifications change à l’heure anniversaire, y compris après un mois court',()=>{
  const start=new Date('2026-01-31T12:00:00Z');
  assert.equal(tadapoBillingWindow(start,new Date('2026-02-28T11:59:59Z')).start.toISOString(),start.toISOString());
  const february=tadapoBillingWindow(start,new Date('2026-02-28T12:00:00Z'));
  assert.equal(february.start.toISOString(),'2026-02-28T12:00:00.000Z');assert.equal(february.end.toISOString(),'2026-03-31T12:00:00.000Z');
  assert.equal(tadapoBillingWindow(start,new Date('2026-03-31T12:00:00Z')).start.toISOString(),'2026-03-31T12:00:00.000Z');
});
