import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * Baseline security headers. Vercel already sends HSTS, so this covers what the
 * platform does not: framing, referrer leakage, MIME sniffing and unused device
 * permissions.
 *
 * There is deliberately **no Content-Security-Policy** here yet. A CSP for this
 * page has to allow the Spotify embed, YouTube thumbnails (i.ytimg.com), the
 * BeatStars artwork CDN and audio stream, and the direct-to-Supabase upload PUT
 * — and a wrong directive breaks one of those silently, with no error the
 * visitor or the logs would show. It is worth adding, but as its own change
 * with its own pass on the preview deploy, not bundled in here.
 */
const securityHeaders = [
  // Clickjacking. This governs who may frame *us*; it has no bearing on the
  // Spotify iframe, which is us framing them.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /**
   * Only features this site never uses *and* never delegates. Permissions-Policy
   * cascades into iframes, and a feature left unmentioned keeps its default
   * allowlist of `self` — which is what lets the Spotify embed's own
   * `allow="autoplay; encrypted-media; …"` still work. Naming `autoplay` or
   * `encrypted-media` here would revoke that delegation and kill playback, so
   * don't "complete" this list.
   */
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Drops `x-powered-by: Next.js`. Payload appends its own marker separately.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withPayload(nextConfig);
