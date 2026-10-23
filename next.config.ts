import type { NextConfig } from "next";

/**
 * Security headers, defense in depth for a fully static app:
 * - CSP locks what can load: own origin + the pollinations image endpoint, and
 *   nothing else. Inline scripts/styles stay ('unsafe-inline') because Next's
 *   static export injects inline bootstraps and React ships inline styles;
 *   the allowlist still kills every remote/inline-file injection path.
 * - The admin route (/subhan) additionally carries X-Robots-Tag noindex.
 * - Development CSP adds 'unsafe-eval' for Turbopack HMR only.
 */
const cspFor = (dev: boolean) =>
  [
    "default-src 'self'",
    "img-src 'self' data: https://image.pollinations.ai",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://image.pollinations.ai",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

const hardening = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), display-capture=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspFor(process.env.NODE_ENV === "development") },
          ...hardening,
        ],
      },
      {
        source: "/subhan",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
