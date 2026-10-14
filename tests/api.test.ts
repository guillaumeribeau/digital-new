import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../apps/website/app/api/leads/route";
import { leadRepository } from "../apps/website/lib/lead-repository";
import { sendEmail } from "../apps/website/lib/lead-delivery";
import { leadSchema } from "../apps/website/lib/lead-schema";
import { randomBytes } from "node:crypto";
import { getDb } from "../apps/website/lib/db";
const payload = {
  company: "Atelier Test",
  sector: "Artisanat",
  city: "Lyon",
  description: "Entreprise de plomberie",
  services: "Installation et dépannage",
  hasWebsite: "non",
  website: "",
  style: "graphique",
  colors: "",
  hasLogo: "oui",
  hasPhotos: "non",
  extra: "",
  fullName: "Camille Test",
  email: "test@example.com",
  phone: "0612345678",
  contactMethod: "email",
  consent: true,
  pricingAcknowledged: true,
  honeypot: "",
  requestId: "7a17bfde-1754-40bf-a5cd-1a353b69e3cb",
};
function request(body: unknown, origin = "http://localhost:3000") {
  return new NextRequest("http://localhost:3000/api/leads", {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      "x-forwarded-for": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
}
test("la route refuse une origine tierce", async () =>
  assert.equal(
    (await POST(request(payload, "https://tiers.example"))).status,
    403,
  ));
test("la route refuse le honeypot et les champs invalides", async () => {
  assert.equal(
    (await POST(request({ ...payload, honeypot: "bot" }))).status,
    400,
  );
  assert.equal(
    (await POST(request({ ...payload, consent: false }))).status,
    400,
  );
});
test("sans fournisseur la route ne confirme pas l’envoi", async () => {
  const key = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    const response = await POST(request(payload));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).success, undefined);
  } finally {
    if (key) process.env.RESEND_API_KEY = key;
  }
});
test("la validation du site actuel fonctionne même avant les coordonnées", () => {
  const result = leadSchema.safeParse({ hasWebsite: "oui", website: "" });
  assert.equal(result.success, false);
  if (!result.success)
    assert.ok(result.error.issues.some((i) => i.path[0] === "website"));
});
test("le fournisseur confirme son acceptation et reçoit une clé d’idempotence", async () => {
  const fetchOriginal = globalThis.fetch;
  const previous = {
    key: process.env.RESEND_API_KEY,
    from: process.env.LEAD_FROM_EMAIL,
    to: process.env.LEAD_TO_EMAIL,
  };
  process.env.RESEND_API_KEY = "test-disabled-key";
  process.env.LEAD_FROM_EMAIL = "NOVA <sender@example.com>";
  process.env.LEAD_TO_EMAIL = "internal@example.com";
  try {
    let callCount = 0;
    globalThis.fetch = async (url, init) => {
      callCount++;
      assert.equal(url, "https://api.resend.com/emails");
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.to, ["test@example.com"]);
      assert.equal(body.html, undefined);
      assert.equal((init?.headers as Record<string, string>)["Idempotency-Key"], "nova-outbox/" + payload.requestId);
      return new Response(
        JSON.stringify({ id: "receipt-id" }),
        { status: 200 },
      );
    };
    const message = { from: "sender@example.com", to: ["test@example.com"], subject: "Test", text: "Atelier Test" };
    assert.equal(await sendEmail(message, payload.requestId), "receipt-id");
    assert.equal(callCount, 1);
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [{ id: "only-one" }] }), {
        status: 200,
      });
    await assert.rejects(sendEmail(message, payload.requestId));
  } finally {
    globalThis.fetch = fetchOriginal;
    for (const [key, value] of Object.entries({
      RESEND_API_KEY: previous.key,
      LEAD_FROM_EMAIL: previous.from,
      LEAD_TO_EMAIL: previous.to,
    })) {
      if (value) process.env[key] = value;
      else delete process.env[key];
    }
  }
});

test("la route accepte le brief court et exige un numéro seulement pour le contact téléphonique", async () => {
  const key = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const brief = {
    company: "Atelier Court",
    sector: "Artisanat",
    city: "Lyon",
    services: "Plombier : dépannage",
    style: "coiffure",
    fullName: "Camille Court",
    email: "court@example.com",
    contactMethod: "email",
    consent: true,
    pricingAcknowledged: true,
    honeypot: "",
    requestId: payload.requestId,
  };
  try {
    const response = await POST(request(brief));
    assert.equal(response.status, 503);
    assert.ok(
      (await response.json()).error.includes(
        "Aucune demande n’a été enregistrée",
      ),
    );
    const invalid = await POST(
      request({ ...brief, contactMethod: "telephone", phone: "" }),
    );
    assert.equal(invalid.status, 400);
    assert.ok((await invalid.json()).fields.phone.length > 0);
  } finally {
    if (key) process.env.RESEND_API_KEY = key;
  }
});

test("statut injecté et prise de connaissance manquante refusés", async () => {
  assert.equal((await POST(request({ ...payload, status: "NEW" }))).status, 400);
  assert.equal((await POST(request({ ...payload, pricingAcknowledged: false }))).status, 400);
});

test("soumission enregistrée sans annonce d’envoi et panne PostgreSQL gérée", async () => {
  const names = ["DATABASE_URL", "OUTBOX_ENCRYPTION_KEY", "RESEND_API_KEY", "LEAD_FROM_EMAIL", "LEAD_TO_EMAIL", "NEXT_PUBLIC_SITE_URL"] as const;
  const previous = Object.fromEntries(names.map((key) => [key, process.env[key]]));
  const submit = leadRepository.submit;
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
    OUTBOX_ENCRYPTION_KEY: randomBytes(32).toString("base64"), RESEND_API_KEY: "fake-test-key",
    LEAD_FROM_EMAIL: "sender@example.com", LEAD_TO_EMAIL: "internal@example.com", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
  try {
    globalThis.fetch = async () => Response.json({ success: true });
    leadRepository.submit = async () => ({ reference: payload.requestId });
    const missingToken = await POST(request(payload));
    assert.equal(missingToken.status, 400);
    const response = await POST(request({ ...payload, turnstileToken: "test-token" }));
    assert.equal(response.status, 202);
    assert.equal((await response.json()).emailDelivery, "queued");
    leadRepository.submit = submit;
    const failure = await POST(request({ ...payload, turnstileToken: "test-token" }));
    assert.equal(failure.status, 503);
    const body = await failure.json();
    assert.equal(body.success, undefined);
    assert.ok(!JSON.stringify(body).includes("postgresql"));
  } finally {
    leadRepository.submit = submit;
    globalThis.fetch = originalFetch;
    await getDb().$disconnect();
    for (const key of names) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
