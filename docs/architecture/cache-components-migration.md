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

### Phase 3 — Dynamic holes & nondeterminism (IN PROGRESS)
Enable the flag, build, and fix prerender errors route-by-route. **Status: the build
`✓ Compiled successfully` under the flag; the remaining work is the per-render `new Date()`
/ `Date.now()` / `Math.random()` (3062 routes).** Two fix patterns:

1. **Cached** (`lib/utils/server-time.ts` — done): `getCurrentYear` / `getServerNowMs` /
   `getServerToday(tz)` read the clock inside `'use cache'`. Use for display values where a
   few minutes of staleness is fine. Already used by the footer.
2. **Client extraction** (preferred for the cards): the now-dependent bits of `ParkCard`,
   `AttractionCard`, `ShowCard` are rendered in **both** server and client trees, so they
   can't become `async`. Extract the now-using render (the `getScheduleMessage` /
   `closingRemaining` / showtime-today blocks) into a small **Client Component** — client
   renders may use `Date.now()` under cacheComponents, and the live value is already
   client-refreshed (`ParkTime`), so this matches current behaviour exactly.

Concrete remaining items (each is a `new Date()`/random in a server render):

| File | Fix |
| --- | --- |
| `components/parks/park-card.tsx` (`getScheduleMessage`, `Date.now()` closing) | extract `<ParkCardSchedule>` client comp |
| `components/parks/attraction-card.tsx` (`Date.now()` countdown) | extract client time bit |
| `components/parks/show-card.tsx` (`new Date()` today) | extract client showtime bit |
| `components/parks/attraction-history-grid.tsx` (async) | `getServerToday(tz)` |
| `components/parks/daily-wait-time-chart-server.tsx` (async) | `getServerToday(tz)` |
| `components/home/announce-section.tsx` (async) | `getServerNowMs()` |
| `components/home/global-stats-section.tsx` | use data timestamp / `getServerNowMs()` |
| `app/[locale]/page.tsx` (`Math.random()` hero) | cached picker or client |
| `lib/faq/park-faq.ts` (`new Date()` today) | thread `today`; `FAQStructuredData` sync→async (`getTranslations`) |
| `lib/utils/schedule-utils.ts` / `lib/utils/crowd-analysis.ts` | take `nowMs`/`today` param (callers: park-card client comp, best-days/faq sections await `getServerNowMs`) |
| `app/[locale]/parks/.../[park]/page.tsx` | move calendar-range/today `new Date()` into the Suspense holes; drop `connection()` |
| `lib/utils/redirect-utils.ts:32` (`Date.now()`) | verify — likely an in-process TTL, not render |

**Validation:** because these touch live "open now"/countdown/showtime displays across 156
parks, each card change must be checked in the running app (or preview), not just the build.

### Phase 4 — Finalize
Full build green, push, verify `x-vercel-cache: HIT`/`PRERENDER` on the park page (the core win).

### Phase 4 — Finalize
Restore full `generateStaticParams`, full build green, push, draft PR, verify
`x-vercel-cache: HIT`/`PRERENDER` on the park page (the core win).

## Dev aid
During Phase 3, geo `generateStaticParams` may be temporarily reduced to speed up
build iteration; restored in Phase 4.
