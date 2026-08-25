/**
 * Cache headers for an API route that is meant to sit in a shared cache.
 *
 * There are two caches in front of these routes, not one: Vercel's edge, and Cloudflare in front
 * of it (park.fan's zone has a rule making `/api/*` GETs eligible with edge TTL "use cache-control
 * header if present, bypass if not" — see docs/architecture/caching-strategy.md). Only the first
 * of them ever sees `s-maxage`.
 *
 * Vercel strips `s-maxage` and `stale-while-revalidate` out of `Cache-Control` before the response
 * leaves its edge **unless the response also carries a `CDN-Cache-Control`** — documented on
 * vercel.com/docs/caching/cdn-cache. So a route that sets only `Cache-Control` reaches Cloudflare
 * as a bare `public`: a header that is *present* but names no TTL, which is the one input that
 * makes that Cloudflare rule fall back to its own default edge TTL (2 h) instead of the route's.
 *
 * Measured on the ride detail (`…/attractions/<slug>`, intended 5 min): `cf-cache-status: HIT`
 * with `age: 2396`. That response carries the ride page's live wait time since
 * `useLiveAttractionData` stopped polling the whole park for it, so Hagrid's read 35 min on its own
 * page while the park page's cards — which poll `/api/parks/<geo>/<park>`, `no-store`, so
 * `cf-cache-status: BYPASS` — read the 60 min the API was actually serving.
 *
 * `CDN-Cache-Control` is the RFC 9213 targeted header: Vercel honours it for its own edge AND
 * forwards it downstream, so both caches get the same explicit window and `Cache-Control` survives
 * intact for the browser.
 *
 * A route that must not be shared (per-visitor, or genuinely live) still answers a plain
 * `no-store` — nothing here applies to it, and both caches bypass on their own.
 */
export function cdnCacheHeaders(value: string): Record<string, string> {
  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
  };
}
