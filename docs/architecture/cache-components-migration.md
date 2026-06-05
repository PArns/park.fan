# Cache Components Migration (Next 16)

Migrating from the `connection()`-based dynamic-rendering workaround to Next 16
**Cache Components** (`cacheComponents: true`, the successor to `experimental.ppr`).

**Goal:** static, edge-cacheable shells + streamed dynamic "holes" for every route —
removing per-request full renders (the cold-render tail) without blocking on slow
calendar/stats fetches.

## Model

With `cacheComponents: true`, everything is dynamic unless wrapped in `'use cache'`:

- **`'use cache'` + `cacheLife()`** — cached data (replaces `next: { revalidate }`,
  `withServerCache`, `unstable_cache`, and `export const revalidate`).
- **`<Suspense>`** — required around anything dynamic (uncached fetch, `cookies()`,
  `headers()`, `searchParams`, `connection()`, `Date.now()`, `Math.random()`).
- `export const dynamic` / `export const revalidate` / `export const fetchCache` are
  **forbidden** — hard compile error.

## Phases

### Phase 1 — Route config removal (compile gate) ✅ when build compiles
Remove all 20 `export const dynamic` / `revalidate`:
- 8 API route handlers `force-dynamic` → remove (handlers are dynamic by default).
- `featured-parks` `revalidate=300`, `backgrounds` `revalidate=false` → remove (Cache-Control
  headers in next.config already drive the CDN).
- 2 glossary pages `force-static`, `search` `force-dynamic` → remove.
- 7 page `revalidate` + `sitemap.ts` → caching moves to the data layer (Phase 2).

### Phase 2 — Data layer → `'use cache'` + `cacheLife`
Convert the ~20 cached fetchers in `lib/api/*` (currently `withServerCache` /
`next: { revalidate }`) to `'use cache'` + `cacheLife({ revalidate, stale, expire })`
keyed off `CACHE_TTL`. Live endpoints (`cache: 'no-store'`) stay uncached → their
callers must sit behind `<Suspense>`. Retire `server-cache.ts`.

### Phase 3 — Dynamic holes & nondeterminism
Enable the flag, build, and fix prerender errors route-by-route:
- Wrap dynamic sections in `<Suspense>` (most park/geo pages already are).
- `new Date()` / `Date.now()` / `Math.random()` in **server** render → move into a
  `'use cache'` boundary (frozen per cacheLife) or a Suspense hole, or to the client.
  Client-component usage is unaffected.
- `connection()` (park page) → drop; replaced by the natural static-shell + Suspense model.

### Phase 4 — Finalize
Restore full `generateStaticParams`, full build green, push, draft PR, verify
`x-vercel-cache: HIT`/`PRERENDER` on the park page (the core win).

## Dev aid
During Phase 3, geo `generateStaticParams` may be temporarily reduced to speed up
build iteration; restored in Phase 4.
