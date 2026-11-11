/**
 * Cache headers for an API route meant to sit in a shared cache. Two caches sit in front of these
 * routes, Vercel's edge and Cloudflare, and Vercel strips `s-maxage` from `Cache-Control` unless a
 * `CDN-Cache-Control` is present; Cloudflare then falls back to its own default TTL (two hours)
 * and serves stale live data. `CDN-Cache-Control` (RFC 9213) reaches both, and `Cache-Control`
 * stays intact for the browser. A route that must not be shared still answers plain `no-store`.
 * See docs/architecture/cdn-caching.md#api-routes.
 */
export function cdnCacheHeaders(value: string): Record<string, string> {
  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
  };
}

/**
 * The headers for an error response from a route under a shared rule in `next.config.ts`. Both
 * keys: a response without a header of its own takes that rule's window, and Cloudflare reads the
 * rule's `CDN-Cache-Control` ahead of the handler's `Cache-Control`, so a failure would be shared.
 */
export const NO_STORE = cdnCacheHeaders('no-store, must-revalidate');
