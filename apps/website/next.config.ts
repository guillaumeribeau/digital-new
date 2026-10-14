import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.NOVA_UI_TEST === "1" ? ".next/integration" : ".next",
  poweredByHeader: false,
  transpilePackages: ["@nova/database", "@nova/shared", "@nova/validation"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/confirmer-demande",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};
export default config;
