import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());
export default defineConfig({
  schema: "packages/database/prisma/schema.prisma",
  migrations: { path: "packages/database/prisma/migrations" },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
