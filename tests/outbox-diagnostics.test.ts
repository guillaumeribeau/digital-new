import { test } from "node:test";
import assert from "node:assert/strict";
import { outboxFailureReason } from "../scripts/outbox-diagnostics";

test("worker diagnostics distinguish missing configuration, authentication and database permissions", () => {
  assert.equal(outboxFailureReason(new Error("DATABASE_NOT_CONFIGURED")), "DATABASE_URL_MISSING");
  assert.equal(outboxFailureReason({ code: "P1000", message: "secret connection string" }), "DATABASE_AUTHENTICATION_FAILED");
  assert.equal(outboxFailureReason({ code: "P2010", meta: { code: "42501", message: "private SQL" } }), "DATABASE_PERMISSION_DENIED");
  assert.equal(outboxFailureReason({ meta: { driverAdapterError: { cause: { kind: "DatabaseNotReachable" } } } }), "DATABASE_UNREACHABLE");
});

test("unknown errors and cyclic causes never expose raw error contents", () => {
  const error = { code: "private-code", message: "postgresql://user:secret@host/db", cause: {} };
  error.cause = error;
  for (const value of [error, null, "secret", new Error("client@example.com"), { code: "__proto__" }]) {
    assert.equal(outboxFailureReason(value), "UNCLASSIFIED_WORKER_ERROR");
  }
});
