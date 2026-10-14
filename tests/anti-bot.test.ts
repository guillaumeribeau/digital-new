import { test } from "node:test";
import assert from "node:assert/strict";
import { AntiBotError, turnstileConfig, verifyAntiBot } from "../apps/website/lib/anti-bot";

test("anti-bot: missing, forged, expired, reused, wrong action/hostname and unavailable provider are refused", async () => {
  const values = { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://nova.example.com", TURNSTILE_SITE_KEY: "fake-site-for-unit-tests", TURNSTILE_SECRET_KEY: "fake-secret-for-unit-tests" };
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, values);
  try {
    let calls = 0;
    globalThis.fetch = async (_url, init) => {
      calls++;
      const body = JSON.parse(String(init?.body));
      assert.equal(body.response, "test-token");
      assert.equal(body.secret, values.TURNSTILE_SECRET_KEY);
      return Response.json({ success: true, hostname: "nova.example.com", action: "lead_submit" });
    };
    await assert.rejects(verifyAntiBot(undefined, "lead_submit"), (error: unknown) => error instanceof AntiBotError && error.reason === "REJECTED");
    await assert.rejects(verifyAntiBot("a".repeat(2049), "lead_submit"), AntiBotError);
    assert.equal(calls, 0);
    await verifyAntiBot("test-token", "lead_submit");
    await assert.rejects(verifyAntiBot("test-token", "lead_resend"), AntiBotError);
    globalThis.fetch = async () => Response.json({ success: true, hostname: "foreign.example.com", action: "lead_submit" });
    await assert.rejects(verifyAntiBot("test-token", "lead_submit"), AntiBotError);
    for (const code of ["invalid-input-response", "timeout-or-duplicate"]) {
      globalThis.fetch = async () => Response.json({ success: false, "error-codes": [code] });
      await assert.rejects(verifyAntiBot("test-token", "lead_submit"), (error: unknown) => error instanceof AntiBotError && error.reason === "REJECTED");
    }
    globalThis.fetch = async () => { throw new Error("network-unavailable"); };
    await assert.rejects(verifyAntiBot("test-token", "lead_submit"), (error: unknown) => error instanceof AntiBotError && error.reason === "UNAVAILABLE");
    Object.assign(process.env, { TURNSTILE_SITE_KEY: "1x00000000000000000000AA", TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" });
    assert.equal(turnstileConfig(), null);
    Object.assign(process.env, { NODE_ENV: "development", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
    assert.equal(turnstileConfig()?.testMode, true);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
