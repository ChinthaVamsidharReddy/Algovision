import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * The browser only ever talks to this origin; /api/* is proxied to the Spring Boot service.
 * That keeps the refresh cookie first-party (SameSite=Lax) and CORS switched off in production.
 */
const apiOrigin = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

const config: NextConfig = {
  // Self-contained server bundle for the Docker image (traced from the monorepo root).
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@algovision/algorithms", "@algovision/trace-schema", "@algovision/viz-engine"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
