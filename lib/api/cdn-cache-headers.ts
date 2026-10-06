/**
 * Cache headers for an API route meant to sit in a shared cache. Two caches sit in front of these
 * routes, Vercel's edge and Cloudflare, and Vercel strips `s-maxage` from `Cache-Control` unless a
 * `CDN-Cache-Control` is present; Cloudflare then falls back to its own default TTL (two hours)
 * and serves stale live data. `CDN-Cache-Control` (RFC 9213) reaches both, and `Cache-Control`
 * stays intact for the browser. A route that must not be shared still answers plain `no-store`.
 * See docs/architecture/caching-strategy.md.
 */
export function cdnCacheHeaders(value: string): Record<string, string> {
  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
  };
}
