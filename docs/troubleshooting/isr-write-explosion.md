# ISR Write Explosion — Root Cause & Fix (Jun 2026)

## Symptom

Vercel ISR **Write Units** exploded from ~0 (≤ Jun 1) to 220–410K/day (Jun 3–7),
83K units/12h. Writes ≫ reads on every park/attraction route. Persisted even with
**no deploy for 24h**. Only **16** time-based revalidations in 12h → writes are NOT
TTL churn.

## Root cause

`0f57934` (#118, **Jun 2**) _"make park & attraction pages static (ISR)"_ flipped the
park + attraction pages from `ƒ Dynamic` (per-request, **zero ISR writes**) to
`◐ Partial Prerender` (static shell persisted to the ISR durable store) by adding
`generateStaticParams` + `revalidate`. This turned on an ISR **write per unique URL ×
6 locales** across the whole catalog.

Follow-up perf PRs (#129/#134/#142/#145/#146) only reduced write _frequency_ (7d TTL)
and _size_ (lean shells). The write driver is neither — it's the **number of unique
cold renders** (catalog × 6 locales) + **Vercel ISR eviction** (working set ≫ cache →
re-MISS → re-write).

## Proof (local `next build && next start`, `NEXT_PRIVATE_DEBUG_CACHE=1`)

One **cold** attraction request writes **2 entries**:

1. `FileSystemCache: set /<locale>/.../<attraction>` — the page **shell** (per-locale).
2. `DefaultCacheHandler: set [...["continent","country","city","park"]]` — the
   `getParkByGeoPath` **`use cache`** data entry (per-park, **shared across all 6
   locales AND all that park's attractions**, 7d revalidate).

- **Warm repeat hit** = cache HIT, **0 writes** (6.7ms vs 236ms). → caching works;
  it's a cold-URL-volume problem, not a cache-key bug.
- **2nd locale** of same park reuses the shared data entry (HIT) and only writes its
  own shell. → the ×6 multiplier is **shell-only**.

## Why "few requests → 1K write units"

Write **units are size-weighted** and PPR stores **multiple files per render**
(`.html` + `.rsc` + several `.segment.rsc` + `.meta`). Stored shell sizes:

| Route                                 | HTML      | RSC   | ~per cold render                         |
| ------------------------------------- | --------- | ----- | ---------------------------------------- |
| Homepage `/en`                        | 400KB     | —     | heavy + **5min TTL** (constant rewriter) |
| Park `europa-park`                    | 416KB     | 244KB | **~660KB+**                              |
| Country `north-america/united-states` | **596KB** | —     | fat hub (see #130)                       |
| Attraction `blue-fire`                | 196KB     | —     | smaller, but most numerous               |

So a handful of cold renders of fat park/hub pages = many hundreds–1K write units.
`.next/server/app` = **1.1GB across 2773 prerendered pages** (~400KB avg).

The park-page RSC is fat (244KB) because the full park (all ~95 attractions) is
serialized as `initialData` for `LiveParkData`.

## Fix shipped (June 2026): off Cache Components → classic static/dynamic

The billing is **per 8 KB written**, and under `cacheComponents: true` you cannot have
_content-first first paint_ + _0 ISR writes_ for param-dependent pages (the trilemma:
content in the shell ⇒ prerender ⇒ per-URL write; 0 writes ⇒ dynamic ⇒ Suspense skeleton
or build error). `'use cache'` requires `cacheComponents`, so the fix was:

1. **`cacheComponents` OFF** (`next.config.ts`). Back to the classic App Router model.
2. **All `'use cache'` → `fetch` `next: { revalidate, tags }`** (the non-deprecated Data
   Cache; `unstable_cache` is deprecated). Shared per-URL (e.g. per-park, not per-locale),
   so the structure snapshot is cached cross-request and the backend isn't hammered.
   - Exception: `getBestDaysCalendar` keeps `unstable_cache` — its raw calendar is ~2.25 MB,
     over the 2 MB fetch-cache cap, so it caches the _projected_ ~13 KB result.
   - `lib/utils/server-time.ts` helpers became plain (`new Date()` is legal without PPR).
3. **Park + attraction + home → `export const dynamic = 'force-dynamic'`** → rendered per
   request, **zero ISR shell writes**, full structure server-rendered into the first HTML
   (content-first, no skeleton). `generateStaticParams` removed.
4. **Content pages stay SSG** (glossary, glossary/[term], legal, hubs continent/country/city,
   howto) via `generateStaticParams` — cheap static, never the write problem.

### Verified locally (`next build && next start`, `NEXT_PRIVATE_DEBUG_CACHE=1`)

- Build route table: park / attraction / home = `ƒ Dynamic`; hubs/glossary/legal = `●/○`.
- Hitting many distinct park/attraction URLs → **0 `FileSystemCache: set`** (no per-URL ISR
  shell writes). Cold park TTFB ~20–60 ms; structure HTML has `<h1>` + JSON-LD.

### Gotchas hit during the migration

- **best-days must NOT be server-fetched on the park page.** Its calendar is a large,
  lazily-computed backend response (cold compute **10–20 s**); awaiting it in the page body
  blocked the whole dynamic render's TTFB. It stays **client-loaded** (skeleton → trickles
  in) via `useParkBestDaysCalendar` → the CDN-cached `/api/.../calendar` route.
- **Hydration mismatch** on the live "updating" indicator (`isFetching`): on a force-dynamic
  page the server render and the client's refetch-on-mount disagree. Fixed by gating the
  indicator on `useMounted()` in `live-park-data.tsx` + `live-attraction-data.tsx`.
- Hero image: deterministic per-5-min window (`Math.floor(Date.now()/300000) % HERO_IMAGES`)
  — observably "cached 5 min" without cache infra, server-rendered for LCP.

### Pre-existing dev warnings (NOT from this migration, separate follow-ups)

- `NavigationProgress` `useInsertionEffect must not schedule updates` (patches `pushState`
  then `setState` synchronously — from #141).
- "Each child in a list should have a unique key" near `<LiveParkData>` (TabsWithHash/render
  structure, unchanged by this work).

## Regression #2 (Jun 22 2026): the 5-min homepage shell — fixed Jul 2026

Write units climbed back to **45–100k/day** (614k for Jun 19–Jul 2) after #169/#170 made the
homepage a **static 5-min shell**. Same billing math as above, different route:

- Homepage shell = **~500 KB HTML + ~264 KB RSC per locale** (~96 units/regeneration at 8 KB/unit)
  × 6 locales × up to 288 windows/day ≈ the observed daily bill. High frequency × fat shell —
  cardinality (6) didn't matter this time.
- **Fetch pinning spread it further:** a static route's effective revalidate is the MIN of its
  fetch revalidates. `getGeoStructure(300)` inside the featured-parks slot pinned **blog,
  glossary-term and howto pages** to 5 min as well, and re-wrote the ~114 KB geo Data-Cache
  entry 288×/day.

**Fix (Jul 2026):** homepage `revalidate` 300 → **3600**; every shell fetch raised to ≥ 3600
(`getGlobalStats`/`getGeoLiveStats`/`getTickerData(3600)` seed/`ml.ts`/featured `getGeoStructure()`
default 24h); everything that reads as "live" overlays client-side on the baked seed
(`useGeoLiveStats`, new `useGlobalStats`, featured cards via `useRegionParks` — hub-page pattern).
Verified via `prerender-manifest.json`: homepage + /parks = 3600, hubs 86400, blog `false`
(fully static again), glossary 86400. Plus **`/api/revalidate`** (secret-protected
`revalidateTag`/`revalidatePath`) so the backend can invalidate on real changes instead of timers.
Details: [caching-strategy](../architecture/caching-strategy.md).

**Lesson:** before giving any route a static shell, price it: writes/day ≈ locales ×
(86400 / revalidate) × (stored bytes / 8 KB) × utilization — and audit every fetch in the render
path for a lower revalidate that silently pins the route.

## Notes

- Production serves `x-vercel-mitigated: challenge` (Vercel WAF/BotID, HTTP 429) to
  non-browser clients → `scripts/isr-cache-probe.mjs` can't run against prod; diagnose
  via local `next start`.
- Residual writes are now the small, shared **Data Cache** entries (fetch `next:{revalidate}`,
  ~1 per park/region/day) — orders of magnitude below the per-locale ISR shell storm.
