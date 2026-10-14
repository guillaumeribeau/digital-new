import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createVerificationToken, encryptPayload, decryptPayload } from "../apps/website/lib/lead-security";
import { leadSchema } from "../apps/website/lib/lead-schema";
import { checkRateLimit } from "../apps/website/lib/rate-limit";

test("jetons aléatoires 256 bits, empreintes et expiration 24h", () => {
  const now = new Date();
  const a = createVerificationToken(now), b = createVerificationToken(now);
  assert.notEqual(a.token, b.token);
  assert.match(a.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(a.tokenHash.length, 64);
  assert.equal(a.expiresAt.getTime() - now.getTime(), 86400000);
});
test("outbox chiffrée et authentifiée : altération refusée", () => {
  const previous = process.env.OUTBOX_ENCRYPTION_KEY;
  process.env.OUTBOX_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  try {
    const value = { text: "message fictif", token: "jeton-fictif" };
    const encrypted = encryptPayload(value);
    assert.deepEqual(decryptPayload(encrypted), value);
    assert.ok(!encrypted.includes("jeton-fictif"));
    const bytes = Buffer.from(encrypted, "base64");
    bytes[30] ^= 1;
    assert.throws(() => decryptPayload(bytes.toString("base64")));
  } finally { if (previous === undefined) delete process.env.OUTBOX_ENCRYPTION_KEY; else process.env.OUTBOX_ENCRYPTION_KEY = previous; }
});
test("prise de connaissance tarifaire distincte et obligatoire", () => {
  const result = leadSchema.safeParse({ pricingAcknowledged: false, consent: true });
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.error.issues.some((issue) => issue.path[0] === "pricingAcknowledged"));
});

test("limitation partagée atomique et fermeture en cas de panne", async () => {
  const names = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "RATE_LIMIT_SALT"] as const;
  const previous = Object.fromEntries(names.map((key) => [key, process.env[key]]));
  const fetch = globalThis.fetch;
  Object.assign(process.env, { UPSTASH_REDIS_REST_URL: "https://redis.example.com", UPSTASH_REDIS_REST_TOKEN: "fake", RATE_LIMIT_SALT: "test-salt" });
  try {
    let calls = 0;
    globalThis.fetch = async (_url, init) => {
      calls++;
      const command = JSON.parse(String(init?.body));
      assert.equal(command[0], "EVAL");
      assert.ok(command[1].includes("PEXPIRE"));
      assert.ok(!JSON.stringify(command).includes("203.0.113.1"));
      return new Response(JSON.stringify({ result: calls }));
    };
    for (let i = 0; i < 5; i++) assert.equal(await checkRateLimit("submit:203.0.113.1"), true);
    assert.equal(await checkRateLimit("submit:203.0.113.1"), false);
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await assert.rejects(checkRateLimit("submit:203.0.113.1"));
  } finally {
    globalThis.fetch = fetch;
    for (const key of names) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
