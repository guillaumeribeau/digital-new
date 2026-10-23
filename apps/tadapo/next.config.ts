import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.TADAPO_UI_TEST === "1" ? ".next/integration" : ".next",
  poweredByHeader: false,
  transpilePackages: ["@nova/database", "@nova/shared", "@nova/validation"],
  async redirects() { return [{ source: "/apercu-gratuit", destination: "/commande", permanent: true }]; },
  async headers() {
    return [{ source: "/suivi/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] }, { source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default config;
