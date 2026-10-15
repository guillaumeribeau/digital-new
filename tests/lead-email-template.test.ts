import { test } from "node:test";
import assert from "node:assert/strict";
import { emailPayloadSchema, verificationEmail, verifiedEmails } from "../apps/website/lib/lead-delivery";
import type { Lead } from "@nova/database";

test("verification email includes an escaped HTML design, logo and the same one-click token as its text fallback", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://zelyweb.com";
  try {
    const email = verificationEmail({ id: "test-reference", fullName: '<script>alert("x")</script>', email: "client@example.com" }, "a".repeat(43));
    assert.ok(email.html);
    assert.match(email.html, /Confirmer ma demande/);
    assert.match(email.html, /<img[^>]+alt="Zelyweb"/);
    assert.match(email.html, /https:\/\/zelyweb.com\/pics\//);
    assert.match(email.html, /&lt;script&gt;/);
    assert.doesNotMatch(email.html, /<script>/);
    const href = email.html.match(/href="([^"]+\/confirmer-demande[^"]+)"/)?.[1];
    assert.ok(href);
    assert.equal(new URL(href).hash, "#token=" + "a".repeat(43));
    assert.ok(email.text.includes(href));
    assert.equal(emailPayloadSchema.parse({ ...email, from: "Zelyweb <send@example.com>" }).html, email.html);
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  }
});

test("confirmation email escapes business names and contains no activation link", () => {
  const lead = { id: "test-reference", fullName: "Camille", email: "client@example.com", businessName: '<img src=x onerror="alert(1)">', preferredStyle: "propose" } as Lead;
  const { receipt } = verifiedEmails(lead);
  assert.ok(receipt.html);
  assert.match(receipt.html, /Vous n’avez plus rien à valider/);
  assert.match(receipt.html, /&lt;img src=x/);
  assert.doesNotMatch(receipt.html, /<img src=x/);
  assert.doesNotMatch(receipt.html, /confirmer-demande|#token=/);
  assert.match(receipt.text, /Votre adresse e-mail est vérifiée/);
});
