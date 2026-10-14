import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.NOVA_UI_TEST === "1" ? ".next/integration" : ".next",
  poweredByHeader: false,
  outputFileTracingIncludes: { "/*": ["../../packages/commercial/assets/*"] },
  transpilePackages: ["@nova/database", "@nova/shared", "@nova/validation"],
  experimental: { serverActions: { bodySizeLimit: "256kb" } },
  async headers() { return [{ source: "/:path*", headers: [
    { key: "Cache-Control", value: "private, no-store" },
    { key: "X-Robots-Tag", value: "noindex, nofollow" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "no-referrer" },
  ] }]; },
};
export default config;
