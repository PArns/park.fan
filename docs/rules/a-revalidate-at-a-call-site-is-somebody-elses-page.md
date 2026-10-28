# A `revalidate` at a call site is somebody else's page (REQUIREMENT)

Never pass a numeric TTL at a call site: call `getGeoStructure()`, not `getGeoStructure(3600)`. The
window belongs to the data, so it lives in `CACHE_TTL` (`lib/api/cache-config.ts`) or in the
helper's default, and it is set from the data's cadence, never as a floor under some page.

- **Next takes the shortest `revalidate` among the fetches a route executes**, and
  `export const revalidate` does not override it: it is a default any shorter fetch beats. So a
  number typed into a component decides how often a whole class of pages rebuilds, and every
  rebuild is an ISR write and a full render.
- **A seed with a client overlay may cache for a long time.** `getGlobalStats` and `getGeoLiveStats`
  are SSR seeds replaced on mount. Where there is no overlay and the value is compared against a
  threshold, stale is wrong rather than old; that is why the hottest-parks heat banner was removed
  instead of slowed down.
- **A parameter is right only when the window belongs to the caller**: then the constant is named
  and its docstring says why (`CACHE_TTL.geoSitemap`, a day for the surfaces that enumerate URLs).
  When the second caller goes, the parameter goes with it.

## Why

`lib/blog/park-resolver.ts` asked for `getGeoStructure(3600)` to resolve `ref:` links and held all
60 blog posts to 24 rebuilds a day; `hero-stats` and `hero-world-panel` did the same to the homepage
with `getGlobalStats(3600)` and `getGeoLiveStats(3600)`. `lib/api/ml.ts` had it backwards, keeping
an hour "so the homepage's window stays at 3600 s" for a figure that changes once a day at 06:00
UTC — that fetch **was** the homepage's window. Fixing these cut regenerations by 87 %
([decision log](../optimization/decisions.md#2026-09-01--accepted-the-isr-clock-5032--657-regenerations-a-day)).

## How to find and prove it

- Grepping components missed the homepage four times. Walk the route's **import graph** and list
  every reachable `revalidate` literal (it over-reports imports that never run; treat it as a
  candidate list).
- `grep -rnE "get[A-Z][A-Za-z]+\(\s*[0-9]" app components lib` finds numeric arguments to helpers.
- Prove the change against `initialRevalidateSeconds` in `.next/prerender-manifest.json`, before and
  after a build.

Background: [caching strategy → Data Cache windows](../architecture/caching-strategy.md#data-cache-windows)
lists every window and the ones that look short but match their data; the measurement is
[decisions → the ISR clock](../optimization/decisions.md#2026-09-01--accepted-the-isr-clock-5032--657-regenerations-a-day).
