import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: ["apps/website/", "apps/admin/"] } } },
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "**/next-env.d.ts",
    "packages/database/generated/**",
    "lib/generated/**",
    "next-env.d.ts",
    "reports/**",
    ".npm-cache/**",
    "scripts/qa.mjs",
  ]),
]);
