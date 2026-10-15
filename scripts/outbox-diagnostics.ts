const reasons: Record<string, string> = {
  DATABASE_NOT_CONFIGURED: "DATABASE_URL_MISSING",
  INVALID_DATABASE_POOL_MAX: "DATABASE_POOL_MAX_INVALID",
  P1000: "DATABASE_AUTHENTICATION_FAILED",
  "28P01": "DATABASE_AUTHENTICATION_FAILED",
  AuthenticationFailed: "DATABASE_AUTHENTICATION_FAILED",
  P1001: "DATABASE_UNREACHABLE",
  ECONNREFUSED: "DATABASE_UNREACHABLE",
  ENOTFOUND: "DATABASE_UNREACHABLE",
  DatabaseNotReachable: "DATABASE_UNREACHABLE",
  P1002: "DATABASE_TIMEOUT",
  P2024: "DATABASE_TIMEOUT",
  ETIMEDOUT: "DATABASE_TIMEOUT",
  SocketTimeout: "DATABASE_TIMEOUT",
  P1010: "DATABASE_PERMISSION_DENIED",
  "42501": "DATABASE_PERMISSION_DENIED",
  DatabaseAccessDenied: "DATABASE_PERMISSION_DENIED",
  P2021: "DATABASE_TABLE_MISSING",
  "42P01": "DATABASE_TABLE_MISSING",
  P2022: "DATABASE_COLUMN_MISSING",
  "42703": "DATABASE_COLUMN_MISSING",
  TlsConnectionError: "DATABASE_TLS_ERROR",
};

// Only predefined diagnostic labels may reach the logs. Database errors can
// contain connection strings, SQL parameters and email contents.
export function outboxFailureReason(error: unknown): string {
  const seen = new Set<object>();
  function inspect(value: unknown, depth: number): string | undefined {
    if (!value || typeof value !== "object" || depth > 5 || seen.has(value)) return;
    seen.add(value);
    const record = value as Record<string, unknown>;
    for (const key of ["code", "originalCode", "kind", "message"]) {
      const label = record[key];
      if (typeof label === "string" && Object.hasOwn(reasons, label)) return reasons[label];
    }
    for (const key of ["cause", "meta", "driverAdapterError"]) {
      const reason = inspect(record[key], depth + 1);
      if (reason) return reason;
    }
  }
  return inspect(error, 0) || "UNCLASSIFIED_WORKER_ERROR";
}
