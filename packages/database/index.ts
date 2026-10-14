import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";
export * from "./generated/client";

const shared = globalThis as unknown as { leadPrisma?: PrismaClient };

export function getDb() {
  if (shared.leadPrisma) return shared.leadPrisma;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  const max = Number(process.env.DATABASE_POOL_MAX || 3);
  if (!Number.isInteger(max) || max < 1 || max > 20)
    throw new Error("INVALID_DATABASE_POOL_MAX");
  // TLS is configured through the URL / CA. Never disable certificate checks globally.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 30000,
    ...(process.env.DATABASE_SSL_CA
      ? { ssl: { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true } }
      : {}),
  });
  shared.leadPrisma = new PrismaClient({ adapter });
  return shared.leadPrisma;
}
