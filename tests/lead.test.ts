import { test } from "node:test";
import assert from "node:assert/strict";
import { leadSchema } from "../apps/website/lib/lead-schema";
import { localLimit } from "../apps/website/lib/rate-limit";
import { sendEmail } from "../apps/website/lib/lead-delivery";
const valid = {
  company: "Atelier Dupont",
  sector: "Artisanat",
  city: "Lyon",
  description: "Plomberie et rénovation",
  services: "Installations et dépannage",
  hasWebsite: "non",
  website: "",
  style: "graphique",
  colors: "",
  hasLogo: "oui",
  hasPhotos: "non",
  extra: "",
  fullName: "Camille Dupont",
  email: "camille@example.com",
  phone: "0612345678",
  contactMethod: "email",
  consent: true,
  pricingAcknowledged: true,
  honeypot: "",
  requestId: "7a17bfde-1754-40bf-a5cd-1a353b69e3cb",
};
test("une demande complète est valide", () =>
  assert.equal(leadSchema.safeParse(valid).success, true));
test("consentement, email et honeypot sont contrôlés", () => {
  for (const change of [
    { consent: false },
    { email: "incorrect" },
    { honeypot: "spam" },
  ])
    assert.equal(leadSchema.safeParse({ ...valid, ...change }).success, false);
});
test("une URL est obligatoire pour un site existant et interdit javascript", () => {
  assert.equal(
    leadSchema.safeParse({ ...valid, hasWebsite: "oui" }).success,
    false,
  );
  assert.equal(
    leadSchema.safeParse({ ...valid, website: "javascript:alert(1)" }).success,
    false,
  );
});
test("la limite bloque le sixième appel et expire", () => {
  for (let i = 0; i < 5; i++)
    assert.equal(localLimit("test-client", 1000), true);
  assert.equal(localLimit("test-client", 1000), false);
  assert.equal(localLimit("test-client", 901001), true);
});
test("aucune fausse confirmation sans fournisseur", async () => {
  const key = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    await assert.rejects(sendEmail({ from: "sender@example.com", to: ["test@example.com"],
      subject: "Test", text: "Test fictif" }, valid.requestId));
  } finally {
    if (key) process.env.RESEND_API_KEY = key;
  }
});

test("le brief simplifié accepte un contact par email sans téléphone ni contenus", () => {
  const minimal = {
    company: "Atelier Martin",
    sector: "Artisanat",
    city: "Lyon",
    services: "Plomberie : dépannage et rénovation",
    style: "propose",
    fullName: "Camille Martin",
    email: "camille@example.com",
    contactMethod: "email",
    consent: true,
    pricingAcknowledged: true,
    honeypot: "",
    requestId: valid.requestId,
  };
  assert.equal(leadSchema.safeParse(minimal).success, true);
  assert.equal(leadSchema.safeParse({ ...minimal, phone: "" }).success, true);
  assert.equal(
    leadSchema.safeParse({ ...minimal, phone: "incorrect" }).success,
    false,
  );
  assert.equal(
    leadSchema.safeParse({ ...minimal, contactMethod: "telephone" }).success,
    false,
  );
  assert.equal(
    leadSchema.safeParse({
      ...minimal,
      contactMethod: "telephone",
      phone: "06 12 34 56 78",
    }).success,
    true,
  );
  assert.equal(
    leadSchema.safeParse({
      ...minimal,
      contactMethod: "telephone",
      phone: "-------",
    }).success,
    false,
  );
});
test("les six inspirations sont acceptées sans rendre les anciens contenus obligatoires", () => {
  for (const style of [
    "plombier",
    "paysagiste",
    "coiffure",
    "conseil",
    "bien-etre",
    "association",
    "propose",
  ]) {
    const {
      description,
      colors,
      hasLogo,
      hasPhotos,
      extra,
      hasWebsite,
      website,
      phone,
      ...brief
    } = valid;
    void description;
    void colors;
    void hasLogo;
    void hasPhotos;
    void extra;
    void hasWebsite;
    void website;
    void phone;
    assert.equal(
      leadSchema.safeParse({ ...brief, style }).success,
      true,
      style,
    );
  }
  assert.equal(
    leadSchema.safeParse({ ...valid, style: "inexistant" }).success,
    false,
  );
});
