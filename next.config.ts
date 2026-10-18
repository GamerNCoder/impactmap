import type { NextConfig } from "next";

// Allow the configured Supabase origin (cloud or local `supabase start`) in addition to *.supabase.co.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const supabaseWs = supabaseOrigin.replace(/^http/, "ws");

// The "near the event" card queries the Overpass API from the visitor's browser, so those hosts
// must be in connect-src. (Weather is fetched server-side and needs no CSP entry.)
const OVERPASS_HOSTS = [
  "https://overpass.osm.ch",
  "https://overpass.kumi.systems",
  "https://overpass.private.coffee",
].join(" ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${supabaseOrigin} ${supabaseWs} ${OVERPASS_HOSTS}`.trim(),
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
