/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** The address the site launched on, before it had its own domain. */
const LEGACY_HOST = "personalsite-six-alpha.vercel.app";

const canonicalOrigin = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(
  /\/$/,
  "",
);
let canonicalHost = "";
try {
  canonicalHost = new URL(canonicalOrigin).host;
} catch {
  // Unset or malformed: no redirect, the site just serves where it is.
}

// Every route that draws a share card reads the same font files at startup, and
// each serverless function only ships the files it is told to.
const cardFonts = ["./app/og/fonts/**"];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Cover images and in-post images are served from Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  outputFileTracingIncludes: {
    "/og": cardFonts,
    "/og/post/[slug]": cardFonts,
    "/api/studio/og/[id]": cardFonts,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  /**
   * One address per page. Once NEXT_PUBLIC_SITE_URL points at the real domain,
   * the old vercel.app address redirects to it permanently, so search engines
   * consolidate on one URL and every link already shared keeps working.
   *
   * It switches itself on with that variable and does nothing while the site is
   * still served from the legacy host, so it cannot redirect to a domain that
   * isn't live yet.
   *
   * /api/cron is left out on purpose: Vercel Cron calls the scheduler on this
   * host, and a redirect there could stop scheduled publishing without a sound.
   */
  async redirects() {
    if (!canonicalHost || canonicalHost === LEGACY_HOST) return [];

    return [
      {
        source: "/:path((?!api/cron).*)",
        has: [{ type: "host", value: LEGACY_HOST }],
        destination: `${canonicalOrigin}/:path`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
