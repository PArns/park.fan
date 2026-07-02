# Changelog / Recent Updates

Short log of notable changes; details live in the linked docs.

---

## Unreleased – ISR writes: hourly homepage shell, client-live overlays, on-demand revalidation

Vercel ISR Write Units had climbed back to ~45–100k/day (614k for Jun 19 – Jul 2). Root cause:
the Jun 22 homepage change (static 5-min shell) — 6 locales × up to 288 regenerations/day ×
~600 KB HTML+RSC per write (units are billed **per 8 KB stored**) ≈ the whole bill. On top,
`getGeoStructure(300)` in the featured-parks slot re-wrote the ~114 KB geo Data-Cache entry
every 5 min **and pinned every route embedding the slot** (blog, glossary terms, howto) to a
5-min ISR window — a route's effective window is its **lowest** fetch revalidate. Fix — see
[caching-strategy](architecture/caching-strategy.md):

- `app/[locale]/page.tsx` — homepage `revalidate` **300 → 3600** (~12× fewer shell writes).
  The classic hero photo now re-picks per regeneration (~hourly rotation across visits).
- Every homepage-shell fetch raised to ≥ 3600 so none pins the route: `getGlobalStats` /
  `getGeoLiveStats` (defaults 600→3600), `getTickerData(3600)` seed (the `/api/analytics/ticker`
  proxy keeps its 600s cache for client polls), `lib/api/ml.ts` 1800→3600, featured slot
  `getGeoStructure()` → 24h default.
- The numbers that read as "live" overlay themselves client-side on the baked seed (the
  park/hub-page shell+overlay model): new `LiveContinentOpenCount` (via existing
  `useGeoLiveStats`), new `GlobalStatsLiveCounts` + `useGlobalStats` hook (no-store
  `/api/analytics/realtime`), and featured cards now prerender **status-free** with
  `FeaturedParkCardsLive` → `useRegionParks` overlay (same as hub grids). Fresher than the old
  baked 5-min snapshot, ~zero extra LCP cost (all below the fold, React Query already loaded).
- **NEW `/api/revalidate`** (POST, `Authorization: Bearer $REVALIDATE_SECRET`, body
  `{"tags":[...],"paths":[...]}`) — on-demand `revalidateTag`/`revalidatePath`, so the backend
  can push "data actually changed" instead of the frontend re-writing on a timer. See
  [backend-integration](api/backend-integration.md#on-demand-revalidation).

---

## Unreleased – "Hottest parks" heat banner on the homepage

A Saisonstart-style homepage section that surfaces the **3 hottest parks** in
**Germany, France, Italy, the Netherlands and Belgium** during a heat wave, each with a
park link and a temperature card (max temp + the heat-warning triangle). It is
**data-driven**: it renders only while at least one park that is **operating today** is
at/above the heat threshold (`HEAT_WARNING_THRESHOLD_C`, 35 °C) and **disappears
automatically** when the heat passes — no manual end date. Includes a °C/°F toggle and an
explanatory heat-tips paragraph; water parks (Rulantica) and off-season / seasonal-event
venues are excluded. See [hottest-parks-heat-banner](features/hottest-parks-heat-banner.md).

- `lib/api/weather-hottest.ts` (new) — `getHottestParks()` derives the biggest parks
  operating today in DE/FR/IT/NL/BE from the geo tree and ranks them by cached per-park
  nowcast (today's max temperature). Frontend aggregation; swappable for a backend endpoint.
- `components/home/hottest-parks-section.tsx` (new) — server component, reuses `<Temp>`,
  `TemperatureUnitToggle`, `getWeatherConfig`, `<HeatWarningBadge>` and country translation;
  renders `null` when no park qualifies.
- `app/[locale]/page.tsx` — section mounted after `AnnounceSection`, in `Suspense` with a
  `null` fallback (no skeleton flash for a usually-absent section).
- `messages/*.json` — `home.hottestParks.*` (all 6 locales).

---

## Unreleased – Heat warning threshold raised to 35 °C

The heat warning now triggers at **≥ 35 °C (95 °F)** (was > 30 °C). Single constant
`HEAT_WARNING_THRESHOLD_C` in `components/parks/heat-warning-badge.tsx` plus the tooltip
copy in `messages/*.json`. Severe-weather day warnings are unchanged.

---

## Unreleased – Heat warning badge on the weather card

Temperatures above **30 °C (86 °F)** now show a real road-sign style warning triangle — red
border, white background and a black "!" (SVG) — next to the affected temperature. It appears
next to the current temperature at the top of the weather card, on the peak-temperature label of
the hourly nowcast chart, and on every day in the bottom forecast strip whose max temperature
crosses the threshold. The threshold is checked on the Celsius source value, so it triggers
identically regardless of the user's °C/°F unit choice.

The same triangle also flags **severe-weather days** in the forecast strip — thunderstorms,
heavy rain (code 65/67/82 or ≥ 25 mm/day), heavy snowfall (code 75/86 or ≥ 10 cm/day) and
storm-force wind (≥ 60 km/h). When a day is both hot and severe, a single triangle carries a
tooltip that lists every reason.

- `components/parks/heat-warning-badge.tsx` (new) — `HeatWarningBadge` (SVG warning triangle) +
  `isHeatWarning()` helper and the shared `HEAT_WARNING_THRESHOLD_C` constant.
- `lib/utils/weather-utils.ts` — `getDayWeatherWarning()` classifies a forecast day as severe.
- `components/parks/weather-card.tsx` / `weather-forecast-strip.tsx` / `weather-hourly-chart.tsx`
  — render the badge.
- `messages/*.json` — `parks.weather.heatWarning` + `parks.weather.weatherWarning.*` tooltip
  labels (all 6 locales).

---

## Unreleased – Homepage sections server-rendered into the 5-min shell

The homepage's data sections — **Featured Parks** ("beliebte Parks"), **Global/Platform Stats** and
**"Parks open now"** — now render **server-side into the 5-min static shell** instead of fetching
their data client-side. This removes the React Query hooks (`use-global-stats`, `use-park-backgrounds`,
the homepage's `useGeoLiveStats`, and the featured-parks poll) and their no-store `/api/...`
round-trips from the home bundle — less client JS competing with the render-blocking CSS at first
paint, and the content now lands in the prerendered HTML (better LCP, SEO, no-JS). Data is at most
5 min stale: the section fetches (`getGlobalStats(300)` / `getGeoLiveStats(300)` /
`getGeoStructure(300)`) share the shell's revalidate window. See
[caching-strategy](architecture/caching-strategy.md).

- `components/home/global-stats-section.tsx` → `async` server component; park/ride backgrounds are
  resolved on the server (`lib/utils/park-assets`) instead of via the deleted `use-park-backgrounds`
  client mirror.
- `components/home/live-activity-{section,grid}.tsx` → per-continent open counts come from the server
  `getGeoLiveStats(300)` fetch (props), so the grid ships no client JS. `useGeoLiveStats` stays for the
  geo pages.
- `components/home/featured-parks-slot.tsx` → `FeaturedParksSlot` (full section) + `PopularParksGrid`
  (compact, howto pages) are now server components that render `extractFeaturedParks(getGeoStructure(300))`
  directly. The client poll returned that _same_ 300s-cached data, so server-rendering costs no
  freshness. Deleted `featured-parks-section-client.tsx` + the `/api/featured-parks/[locale]` route
  (its only caller was the poll). Applied across the homepage, blog context module, glossary term
  pages and the 6 howto pages.
- `lib/api/analytics.ts`: `getGlobalStats` / `getGeoLiveStats` take an optional `revalidate` (default
  600); the homepage passes **300** to pin them to the shell's window.

---

## Unreleased – No more scrollbar flicker when opening popups

Opening any Radix popup (language switcher dropdown, dialog, popover, command palette,
mobile sheet) made the whole page flicker horizontally: `react-remove-scroll` locks the
body and hides the vertical scrollbar while the popup is open, so on classic-scrollbar
systems (Windows/Linux) the content area — including the sticky header and `w-screen`
full-bleed sections — widened by the scrollbar's width and snapped back on close.

- **Fix** (`app/globals.css`): `html:has(body[data-scroll-locked]) { scrollbar-gutter: stable }`
  reserves the scrollbar's space **only while a popup is open**, so hiding the scrollbar no
  longer changes the page width. It is deliberately _not_ permanent — during normal scrolling
  the browser's native scrollbar renders as-is (correct theme colour, no forced always-visible
  bar). The `body[data-scroll-locked]` rule also zeroes the `margin-right`/`padding-right` that
  `react-remove-scroll` adds to compensate for the removed scrollbar — the reserved gutter
  already covers that, so otherwise it would shift the page the other way.
- No-op on overlay-scrollbar systems (e.g. macOS without "always show scrollbars"), which
  never had the flicker.
- **Dark scrollbar in dark mode** (`app/globals.css`): some platforms (notably macOS) colour
  the native scrollbar from the _OS_ appearance, not the page — and `color-scheme: dark`
  doesn't reliably override it — so a dark site on a light/auto macOS showed a light/white
  scrollbar. `.dark { scrollbar-color: … transparent }` now sets the colour explicitly
  (driven by the theme class, so it matches the chosen theme from the first paint). Light
  mode keeps the native scrollbar.

---

## Unreleased – Glassier popups (dropdowns & popovers)

Dropdown menus (e.g. the language switcher) and popovers were flat opaque boxes. They now
match the site's glass aesthetic: a translucent, `backdrop-blur-xl` surface
(`supports-[backdrop-filter]` keeps an opaque fallback), softer `rounded-xl` corners, a
richer `shadow-xl` with a subtle ring, and menu items get `rounded-md` + a color
transition on hover. Shared via `components/ui/dropdown-menu.tsx` +
`components/ui/popover.tsx`, so every dropdown/popover benefits.

---

## Unreleased – Park page load order: weather first, best travel time last

Two loading fixes on the park page, plus a stale-cache fix that made the hourly weather
day view randomly disappear.

- **Hourly day view sometimes missing (stale-day cache race)**: `/api/weather/hourly`
  used `forecast_days=1` ("today at upstream fetch time") behind two
  stale-while-revalidate cache layers (Next data cache `revalidate: 900` + CDN
  `s-maxage=900`). The Next data cache serves a stale entry (any age) while it
  revalidates in the background — so the first visitors after midnight could receive
  YESTERDAY's hours. `WeatherHourlyChart` hides data that isn't "today" in the park
  timezone, so the chart silently vanished on those pages and reappeared on reload.
  Fix: the client (`useWeatherHourly`) now sends the park-local date (browser clock,
  computed at fetch time) as `&date=`, and the route maps it to Open-Meteo
  `start_date`/`end_date`. Every cache key (CDN request URL + Next data-cache upstream
  URL) now rolls over with the park-local day, so a stale serve can never deliver the
  wrong day.
- **Weather loaded too late (nowcast→hourly waterfall)**: the hourly fetch was gated on
  the nowcast having arrived. It now starts in parallel on mount; only the _rendering_
  of the day view still requires a nowcast.
- **Best travel time ALWAYS loads last (requirement)**: the best-days calendar +
  historical stats are the page's largest/slowest requests (cold compute 10–20 s) and
  competed with the live/weather queries. New `useLoadLast` gate
  (`lib/hooks/use-load-last.ts`) defers `useParkBestDaysCalendar` +
  `useParkHistoricalStats` until every other React Query fetch on the page has settled
  (300 ms network-idle grace, 5 s safety timeout so the sections can't be starved).
  Consumers (`ParkBestDaysSection`, `ParkStatsSection`) now gate their skeletons on
  `isPending` instead of `isLoading` — a deferred (disabled) query is pending but not
  fetching, so `isLoading` would have flashed the empty fallback. Requirement
  documented in [system-overview](architecture/system-overview.md) and `CLAUDE.md`.

---

## Unreleased – Hourly day view in the weather card

Weather-app style detail view for today inside the park weather card: smoothed temperature
curve with min/max labels, rain bars per hour, a "now" marker (past hours dimmed) and
per-hour tooltips (time, temp, condition, precip, rain probability), plus an axis with
weather icons every 3 h. Shown only when the park has a live nowcast.

- **Data**: the backend exposes no hourly temperatures (daily weather + ~6 h nowcast only),
  so `/api/weather/hourly` proxies Open-Meteo — the backend's own upstream source, already
  attributed in the card. The proxy keeps requests first-party (no visitor IPs to a third
  party), validates `lat`/`lon`/`tz`, rounds coords to ~1 km and caches 15 min
  (`revalidate: 900` + `s-maxage=900`), so all visitors of a park share one upstream call.
  If/when the backend grows an hourly endpoint, only the route handler needs to change.
- **Types**: `WeatherHourlyPoint` / `WeatherHourlyToday` in `lib/api/types.ts`.
- **Hook**: `useWeatherHourly` (client-only, 15 min stale, 30 min refetch to roll the chart
  over to the new day after midnight); enabled only when a nowcast exists.
- **Component**: `components/parks/weather-hourly-chart.tsx`; hides itself when the data no
  longer belongs to "today" in the park timezone (midnight gap until the next refetch).
- **Park page**: passes `latitude`/`longitude`/`timezone` to `WeatherCard` (new optional
  props — other `WeatherCard` consumers are unaffected).
- **i18n**: `parks.weather.hourlyTitle` / `parks.weather.nowLabel` in all 6 locales.

---

## Unreleased – Rope-drop recommendations

Surfaces the API's precomputed rope-drop data (backend PR #67): is it worth arriving at park
opening for a headliner, and until when does the advantage last.

- **Types**: `RopeDropInfo` / `RopeDropHeadliner` in `lib/api/types.ts`; `ropeDrop` on
  `ParkAttraction` + `AttractionResponse`, `ropeDropHeadliners` on `ParkWithAttractions`.
  Only set for tier1/tier2 headliners in parks with a schedule — and present even when
  `worth: false`, so always check `worth`, not just existence.
- **Attraction cards**: `<RopeDropBadge>` (sunrise icon, emerald = high / teal = moderate)
  shown when `worth: true`, regardless of live status (the tip matters most pre-opening).
- **Attraction detail**: `<RopeDropCard>` — savings headline (open wait vs. day peak),
  advantage window as concrete park-local time via `rideByUtc` (offset fallback when null),
  quieter evening alternative via `bestSlotUtc` when the day's trough isn't at opening,
  weekend/weekday breakdown, low-confidence hint. Muted "no need to rush" note when
  `worth: false`.
- **Park page**: `<RopeDropHeadliners>` strip above the headliners section (chips linking to
  each attraction, minutes saved); data arrives pre-filtered/sorted from the API.
- **Inverse recommendation ("better later")**: when `worth: false` but the line is already long
  right at opening (≥30 min) and the day's trough sits ≥2 h later (`isEveningBetter` in
  `lib/utils/rope-drop.ts`), cards get an indigo moon badge and the detail page an
  "Better later than at opening" panel pointing at the typical trough time (`bestSlotUtc`).
- **Backend PR #69 fields**: `bestSlotWait` (expected wait at the trough), `endOfDayWorth` /
  `endOfDaySavings` (server-side "better later" verdict with pre-closing line-drain guard) —
  all optional in the frontend types. `isEveningBetter` prefers the server verdict and keeps
  the local heuristic as fallback for cached recommendations predating the fields. When
  `bestSlotWait` is present, the evening panel shows an opening/peak/evening stat trio and the
  badge hint + alternative lines say "typically only ~X min". `/v1/favorites` now also carries
  `ropeDrop`, so favorites cards light up without further frontend changes.
- **i18n**: `attractions.ropeDrop.*` + `parks.ropeDropSection.*` in all 6 locales.
- Rope-drop values are recomputed daily server-side — no extra polling; the fields ride along
  on the existing park/attraction responses.

---

## 2.10.1 (2026-06-10) – SEO review fixes

Full-code SEO review; fixed everything actionable. See [seo/analysis.md](seo/analysis.md).

- **robots.txt**: `Allow: /api/og/` so Google can crawl the OG images; stopped disallowing
  `/_next/` (Google renders pages and needs JS/CSS/optimized images).
- **Sitemap**: removed noindex legal pages (Search-Console conflict), added `/parks` and
  `/search`; blog entries/hreflang now only for locales with a real translation.
- **Blog EN-fallbacks** (`/de/blog/<en-slug>` etc.): canonical now points to the EN original;
  no longer advertised via hreflang, sitemap, or IndexNow.
- **Localized 404**: new `app/[locale]/not-found.tsx` (translated, inside the site chrome)
  instead of the bare English root fallback.
- **Icons**: real 180×180 `apple-touch-icon.png` (iOS ignores SVG), manifest icons with
  correct sizes (192/512 generated from `logo-big.png`; `logo.png` was 569×683).
- **HowTo page**: Article JSON-LD added.
- **Maintenance page**: auto-recovers via 15 s health poll — previously a reloaded
  `/maintenance` showed the outage screen forever.
- **`SITE_URL`** from `i18n/config.ts` is now the single base-URL source for canonicals,
  hreflang, JSON-LD and IndexNow (was hardcoded in ~25 places).

---

## 2.10.0 (2026-06-07) – ISR cost & cold-load overhaul

Park/attraction routes were the dominant Vercel ISR-write source (write-heavy, read-light), and
cold parks loaded slowly. Reworked the render split so the server shell stays SEO-complete and cheap
while everything live/heavy loads client-side with skeletons.

### Caching / cost

- **7-day shell TTL** for park + attraction (`PARK_MAX_AGE`/`ATTRACTION_MAX_AGE = 604800`), down from
  daily — ~7× fewer time-based ISR writes. Required lifting every nested `'use cache'` MIN
  (`getCurrentYear`, `getParkSlugIndex` + `getGeoStructure`, `getParksNearLocation`) off its 1-day
  floor; verified via `next build`'s per-route `revalidate` column.
- **Lean ISR snapshot** — `leanParkForShell` strips the heavy `statistics.history` sparkline series
  from the cached/serialized shell (the live no-store poll keeps it) → smaller size-weighted writes.
- **Attraction detail client-side** — `history`/`hourlyForecast` load via the CDN-cached
  `/api/parks/.../attractions/<slug>` route, off the ISR shell.

### Cold-load

- **Prebuild top ~20 popular parks** (`generateStaticParams`) so the highest-traffic parks are warm
  with full SEO HTML on preview + prod from the first request; long-tail + attractions stay on-demand.
  (Prebuilding all ~156 overran a fresh Vercel build — too many cold park-detail fetches.)
- **Prewarm cron** (`vercel.json`, every 6 h) warms the rest of the popular set in prod + recovers
  after eviction.

### Other

- Disabled operating-park hover prefetch (prefetching a park triggered an ISR write).
- Fixed the `/api/parks/.../attractions/<slug>` CDN cache header (was clobbered by the blanket
  `/api` no-store rule).

See [caching-strategy](architecture/caching-strategy.md).

---

## 2.9.1 (2026-06-06) – Post-PPR front-end weight trim

Follow-up to the Cache Components migration after RUM showed FCP slipping into "needs
improvement". Measured on the live homepage: ~444 KB gzip JS (24 chunks), one 28 KB-gzip
render-blocking stylesheet (not inlined), and a redundant font preload.

### Performance

- **Geist_Mono dropped** — `font-mono` is aliased to Geist Sans in `globals.css`, removing a
  ~30 KB render-blocking font preload on every route. Number-heavy live spots (nowcast
  countdown) keep fixed-width digits via `tabular-nums`.
- **framer-motion code-split** — the homepage `FlipClock` countdown is now a `next/dynamic`
  import, so framer-motion (~40 KB gzip) leaves the initial bundle and only loads when an
  announcement countdown is actually live.

### Known tradeoff

- The single render-blocking stylesheet (~28 KB gzip) is **not** inlined: `optimizeCss`
  (Beasties) is Webpack-only and we keep Turbopack for `next build` (build speed). Critical-CSS
  extraction also previously caused FOUC. `build:webpack` remains for an inlined-CSS build if
  ever needed.

### Follow-ups (audited, not yet done)

- ML sparkline still pulls **recharts (~100 KB)** for one line — migrate to the lightweight
  SVG `Sparkline` (needs a custom y-domain + active-dot).
- Header `SearchCommand` ships **cmdk** on every page though the dialog only opens on click —
  lazy-load the `CommandDialog`.

---

## 2.9.0 (2026-06-05) – Next.js 16 Cache Components (PPR)

Full migration to `cacheComponents: true` (Partial Prerendering). Pages now ship as a static,
edge-cached shell with the slow/live data streamed in via `<Suspense>` holes — the park page
serves `x-vercel-cache: PRERENDER` instead of dynamic SSR (TTFB drops from ~650 ms to the edge
cache). Details: [cache-components-migration](architecture/cache-components-migration.md).

### Caching

- All API fetchers moved to `'use cache'` + `cacheLife`/`cacheTag` (replaces `withServerCache`,
  `unstable_cache`, and `next: { revalidate }`). `lib/api/server-cache.ts` removed.
- The best-days calendar keeps `unstable_cache` for its **projected** result — the raw upstream
  response (~2.25 MB) exceeds Next's 2 MB fetch-cache cap, which would otherwise leave the
  `'use cache'` boundary uncached.
- Cached time helpers (`lib/utils/server-time.ts`); client-only `Date.now()`/`Math.random()`
  guarded behind Suspense or `typeof window`.

### Routing

- Park route gains `generateStaticParams` (top parks prebuilt, long tail on-demand ISR) — under
  Cache Components every dynamic route must enumerate ≥1 param, else `await params` in a
  param-less placeholder shell counts as uncached data outside `<Suspense>`.

### Fixes

- Non-existent parks/attractions now return **404**, not 500 — a throw across a `'use cache'`
  boundary bypasses the caller's `catch` and surfaced as a 500.
- **Skeleton fallbacks** for the deferred, client-rendered card time bits (park-card
  schedule/countdown, show-card showtimes, attraction-card best-time) — no layout shift.

### Performance

- Weather-background canvas animation pauses when off-screen (`IntersectionObserver`).
- `dns-prefetch` for the analytics origin (the only third-party the browser contacts).

## 2.8.0 (2026-04-25) – Codebase Refactoring

### Shared Hooks (`lib/hooks/use-mounted.ts`)

- **`useMounted()`** — returns `true` after hydration (replaces `useState + useEffect` pattern across 5 components).
- **`useBrowserTimezone()`** — returns browser timezone string after mount.
- **`useBrowserNow(intervalMs)`** — returns a `Date` refreshed every `intervalMs` ms; pass `null` for one-shot (no interval). Replaces `setInterval` in `PeakHourBadge` and `ParkTimeInfo`.

### FAQ Helpers (`lib/faq/`)

- **`lib/faq/attraction-faq.ts`** — `buildAttractionFaqItems()` extracts FAQ Q1–Q4 logic from `AttractionFaqSection` and `AttractionFaqStructuredData`.
- **`lib/faq/park-faq.ts`** — `buildParkFaqItems()` (Q1–Q6) and `getParkArticleForms()` shared by `ParkFAQSection` and `faq-structured-data`.

### Shared Sparkline (`components/parks/sparkline.tsx`)

- Generic `<Sparkline points[] formatTooltip />` component with global-mousemove tooltip (portal to `document.body`).
- `WaitTimeSparkline` and `HourlyP90Sparkline` are now thin wrappers.

### Duration Formatting (`lib/i18n/time.ts`)

- **`formatDuration(diffMs, t)`** — formats milliseconds as `"Xh Ym"` / `"Xh"` / `"Ym"`. Used in `PeakHourBadge` and `ParkTimeInfo`.

### Howto Page Split (`app/[locale]/howto/`)

- `page.tsx` — metadata shell only (~236 lines).
- `_howto-ui.tsx` — shared UI atoms: `Section`, `SubSection`, `DemoBadge`, `InfoBox`, `TipBox`, `PersonaCard`, `Li`.
- `_mock-components.tsx` — demo components: `MockParkHeader`, `MockAttractionCards`, etc.
- `_live-calendar.tsx` — async server component that fetches live Phantasialand calendar data.
- `content/[locale].tsx` — per-locale content (de/en/es/fr/it/nl).

### Dead Code Removed

- `components/search/hero-search-button.tsx` — unused
- `components/home/scroll-indicator.tsx` — unused
- `components/common/truncated-text.tsx` — unused
- Removed dead `FeaturedParksSection` async function from `featured-parks-section.tsx`
- Removed `'use client'` from `glossary-background.tsx` and `glossary-inject-term.tsx`

---

## 2.7.0 (2026-03-15) – Glossary System

### Complete Glossary Launch

- **90 terms** across 7 categories: wait-times, crowd-levels, park-operations, planning, attractions, coasters, coaster-elements
- All terms with full definitions in 6 languages (EN/DE/FR/IT/NL/ES) — multi-paragraph format (`\n\n` separator), locale-appropriate park references
- Localized URL segments: `/glossary`, `/glossar`, `/glossaire`, `/glossario`, `/woordenlijst`, `/glosario`

### Design & UX

- **Random hero background** on all glossary pages (`GlossaryBackground` component, no Ken Burns animation)
- **Glass UI**: unified glass panel on overview (breadcrumb above panel; title + description + search inside); glass cards on detail page
- **Type-to-search**: typing anywhere on overview focuses the search input; ESC clears + blurs
- **Category filter pills** with instant client-side filtering
- **Detail page**: 2-column layout, multi-paragraph definition rendering, primary-color back button
- **Homepage extras on detail pages**: `NearbyParksCard`, `FavoritesSection`, `FeaturedParksSection` below each term

### Navigation

- **Header**: removed "Startseite" from desktop nav; reordered to Parks entdecken → Glossar → Anleitung
- **Homepage hero**: added glossary link ("Wichtige Freizeitparkbegriffe") next to the howto link in all 6 locales
- **Howto page**: removed `max-w-4xl` constraint — now full container width like other pages

### SEO & Indexing

- Glossary added to sitemap: 6 overview pages (priority 0.7) + ~540 term pages (priority 0.5)
- IndexNow aligned to sitemap scope: home, howto, glossary overview, parks, attractions
- Improved `generateMetadata` on both overview and detail pages: keyword-rich titles, `overviewKeywords` meta tag, locale-specific `termTitleSuffix`
- Schema.org: `DefinedTermSet` + `DefinedTerm` with `inLanguage`, `termCode`, localized descriptions

### Bug Fixes

- **Language switcher 404**: now extracts pathname from hreflang `<link>` tags instead of using full production URL — works on localhost and production
- **Breadcrumb double-locale** (`/de/de/glossar`): fixed by removing locale prefix from breadcrumb URL (next-intl `Link` adds it automatically)

→ [Glossary System](features/glossary.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.6.4 (2026-03-05) – SEO: Featured Parks, Split Sitemaps, ItemList

### Featured Parks Section (Homepage)

- New `FeaturedParksSection` component on homepage — 6 locale-specific park cards with live data (status, crowd level, wait times, opening hours).
- Parks resolved from existing `geoData` (no extra API call; `CACHE_TTL.geo = 120s`).
- Locale configs based on TEA 2024 attendance data + language-market wait-time search relevance.
- Translated country names via `tGeo('countries.*')`.
- Positioned after FavoritesSection — first "browse parks" content above the fold.

### Sitemap Split (Next.js-native via `generateSitemaps()`)

- Single `app/sitemap.ts` with `generateSitemaps()` — three sub-sitemaps: `/sitemap/0.xml` (home+parks), `/sitemap/1.xml` (attractions), `/sitemap/2.xml` (geo hub pages).
- Geo hub pages (continent/country/city) were completely missing from any sitemap before — now covered with correct priorities (0.6–0.8).
- Attraction variant slugs (e.g. `taron-2`) excluded — noindex pages pointing to canonical base slug.
- Single-park city pages excluded — they 301-redirect to the park page.
- `robots.txt` references single sitemap index `/sitemap.xml` (auto-generated by Next.js).

### ItemList Structured Data

- Added `ItemListStructuredData` to `/parks` overview page (continents). All listing levels now have ItemList schema.

### Docs

- New: [docs/seo/featured-parks.md](seo/featured-parks.md) — how to update park lists, slug collision notes, SEO rationale.
- New: [docs/seo/sitemaps.md](seo/sitemaps.md) — full sitemap strategy, priorities, exclusions.
- Updated: [docs/seo/analysis.md](seo/analysis.md) — completed items marked done, open items updated.

→ [SEO Analysis](seo/analysis.md) · [Featured Parks](seo/featured-parks.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.5.12 (2026-02-08) – Docs vs Code alignment

- **URL helpers:** Added `getParkUrlFromAttractionUrl()` in `lib/utils/url-utils.ts`; use in `nearby-parks-card` instead of manual `split('/attractions/')`. Park URLs from API now always go through `convertApiUrlToFrontendUrl()`.
- **Translation helpers:** Replaced `t(\`countries.${slug}\`)` / `t(\`continents.${x}\`)`with`translateCountry`/`translateContinent`across geo pages (parks, continent, country, city, park, attraction). Missing keys are now logged via`logMissingTranslation`.

→ [Translation System](i18n/translations.md), [Routing & URLs](architecture/routing-and-urls.md), [Notes for Sessions](development/notes-for-sessions.md)

---

## 2.5.5 (2026-01-25) – 404 prevention

- Redirect logic for malformed URLs (e.g. missing city segment).
- Nearby Parks use `convertApiUrlToFrontendUrl(url)` instead of building from name fields.

→ [Routing & URLs](architecture/routing-and-urls.md), [Troubleshooting](troubleshooting/common-issues.md)

---

## 2.5.6 (2026-01-25) – Link prefetch

- Prefetch only when `status === 'OPERATING'` for park/attraction links.
- `prefetch={false}` for header/footer and discovery/geo cards.

→ [Routing & URLs – Link Prefetching](architecture/routing-and-urls.md#link-prefetching)

---

## P50 / "Normal" display

- API returns `moderate` for typical day (P50 baseline); frontend displays **"Normal"** (green) in all locales.

→ [Backend Integration – Crowd Levels](api/backend-integration.md#crowd-levels-p50--normal), [Backend P50 doc](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/p50-crowd-levels.md)

---

## Related

- [README](README.md) – Doc index
- [Conventions](development/conventions.md) – Key rules
