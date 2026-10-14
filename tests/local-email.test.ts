import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { localEmailMode } from "../apps/website/lib/local-email";
import { pipelineConfigured } from "../apps/website/lib/lead-security";
import { sendEmail } from "../apps/website/lib/lead-delivery";
import { GET as mailbox } from "../apps/website/app/api/local-emails/route";
import { processOutbox } from "../apps/website/lib/outbox";

test("local email mode: recording without Resend, no external send, authenticated preview, production disabled", async () => {
  const values = { NODE_ENV: "development", LEAD_EMAIL_MODE: "local", LOCAL_EMAIL_PREVIEW_TOKEN: randomBytes(32).toString("hex"),
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000", DATABASE_URL: "local-test-only",
    OUTBOX_ENCRYPTION_KEY: randomBytes(32).toString("base64"), RESEND_API_KEY: "", LEAD_FROM_EMAIL: "", LEAD_TO_EMAIL: "" };
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    assert.equal(localEmailMode(), true);
    assert.equal(pipelineConfigured(), true);
    assert.deepEqual(await processOutbox(), { sent: 0, failed: 0 });
    await assert.rejects(sendEmail({ from: "test@nova.test", to: ["test@example.com"], subject: "Test", text: "Test" }, "local-test"), /LOCAL_EMAIL_PREVIEW_ONLY/);
    assert.equal((await mailbox(new Request("http://localhost:3000/api/local-emails"))).status, 401);
    assert.equal((await mailbox(new Request("http://localhost:3000/api/local-emails", { headers: { authorization: "Bearer invalid" } }))).status, 401);
    Object.assign(process.env, { NEXT_PUBLIC_SITE_URL: "http://example.com" });
    assert.equal(localEmailMode(), false);
    Object.assign(process.env, { NEXT_PUBLIC_SITE_URL: "http://localhost:3000", NODE_ENV: "production" });
    assert.equal(localEmailMode(), false);
    assert.equal(pipelineConfigured(), false);
    assert.equal((await mailbox(new Request("http://localhost:3000/api/local-emails"))).status, 404);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
