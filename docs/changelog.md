# Changelog / Recent Updates

Short log of notable changes; details live in the linked docs.

---

## Unreleased – perf: page-wide re-render/flicker sweep (memory & repaint fixes)

Audit of all pages for state/effect patterns that forced unnecessary re-renders, repaints or
leaked resources — the source of intermittent visible flicker.

- **Geolocation context** (`lib/contexts/geolocation-context.tsx`): background auto-refresh
  (60 s in-park / 5 min) no longer pulses `loading` and preserves the `position` object
  identity when coords are unchanged; context `value` memoized. Previously every tick
  re-rendered all geo consumers (hero, nearby card, favorites, banner) 2× with a new
  context reference even when nothing changed.
- **Region/neighbor live overlays** (`use-region-parks`, `use-park-neighbors`): return a plain
  `Record` instead of a `Map` — React Query structural sharing now keeps the identity stable
  across equal polls, so hub/country/nearby card grids stop re-rendering every 5 min for
  byte-identical data.
- **Attraction page**: the "Updating…" refetch indicator now lives in a fixed-height slot
  (same pattern as the park page) — it used to insert/remove a row on every mount refetch,
  5-min poll and tab refocus, shifting the whole live card up/down (CLS).
- **Attraction grid sparklines** (`WaitTimeSparklineCard`): one shared minute clock
  (`lib/hooks/use-minute-now.ts`, `useSyncExternalStore`) replaces one 60 s interval PER
  card — dozens of staggered per-card repaints per minute become a single batched update.
- **Sparkline hover** (`components/parks/sparkline.tsx`): local `onMouseMove`/`onMouseLeave`
  instead of a global `window` listener per instance (~31 on the attraction history grid,
  each doing a forced layout read on every pointer move anywhere on the page).
- **Crowd calendar**: `keepPreviousData` on month navigation — the grid dims instead of
  flashing back to the full skeleton on every prev/next click.
- **Weather**: nowcast banner ticks 1 s only while a banner is visible (was: every second on
  every park page forever, even with no banner); night-scene star field is generated after
  mount (was: SSR/client hydration mismatch that re-created the subtree).
- **Nowcast countdown hydration error** (found via headless smoke test): the
  `typeof window ? Date.now() : 0` state seed in `NowcastUpdateCountdown` (and the nowcast
  banner clock) rendered an epoch-based countdown ("Update in 29738148:20") into any
  server-rendered nowcast — guaranteed hydration text mismatch, React regenerated the whole
  subtree on every load (visible on /howto). Now: deterministic 0 on both server and
  hydration render with a stable "--:--" placeholder; the real clock mounts in an effect.
- **Coaster player** (glossary): progress bar is driven imperatively via refs — `onTick`
  no longer calls `setState` ~60×/s; `pause()` now actually stops the RAF loop (it kept
  rendering at 60 fps while paused/off-screen, and each pause→play stacked an extra RAF
  chain); both three.js scenes release their WebGL context on dispose
  (`forceContextLoss()`) so remounts can't exhaust the browser's context cap.
- **ShowCountdown**: browser-clock only via `useBrowserNow` (was: `new Date()` state seed
  baking the server/build clock into SSR HTML → hydration mismatch on every load).
- **Favorites**: the favorites cookie is parsed once per change event (memoized by raw
  cookie value) instead of once per mounted star (O(stars) JSON.parse per toggle).
- **Blog images**: the build manifest now bakes intrinsic width/height (via sharp, EXIF-aware)
  into every gallery/inline image so the box is reserved before load — `width={0}/height={0}`
  reflowed the article on every image pop-in.
- Smaller: memoized context values (temperature unit, glossary inject, admin), memoized
  glossary term parsing, memoized stats/best-days derivations, stable keys in the live wait
  ticker, `holiday` object in `useTodaySchedule` memoized, blob-URL cleanup in the contribute
  photo dropzone no longer closes over the first render's empty list.

## Unreleased – perf: best-days seed streams instead of blocking park-page TTFB

Cold-start latency fix. The best-days SEO seed (`getBestDaysCalendarSeed`) was `await`ed on the
park page's render critical path, so a cold `/best-days` fetch (~0.4–1 s, occasionally slower than
the park snapshot fetch, or hitting the seed timeout) was added straight to first-byte — a
noticeable cold-start regression on `force-dynamic` park pages (no edge-cached HTML).

- `page.tsx`: the seed promise is created but **no longer awaited in the body**. It's consumed only
  inside `<Suspense>` boundaries — the FAQ JSON-LD (`FAQStructuredData` now takes the seed _promise_
  and awaits it itself) and a new streamed `SeededBestDays` server component for the best-days slot.
  The shell (H1, attraction overview, header, FAQ base + Q1) now flushes at **park-fetch speed** and
  the seeded best-days HTML + least-crowded JSON-LD stream into the same response — crawlers still
  receive them in the final document (verified: full-download HTML of a park with data contains the
  best-days text + the 9-question FAQPage incl. least-crowded).
- The visible FAQ Q7 (least crowded) is no longer server-seeded (that required the blocking await);
  it streams in from the client calendar fetch after mount, and the SEO signal lives in the streamed
  JSON-LD. Q0–Q6 + Q1 still render immediately from the park snapshot.
- `BEST_DAYS_SEED_TIMEOUT_MS` 800 ms → 3 s: off the critical path now, so a generous bound just
  lets the seed land in the streamed HTML more often; `after()` still warms the data cache on a miss.
- Measured (local prod build, real API): cold-park page TTFB is now gated by the park snapshot fetch
  (e.g. 0.42 s) instead of park + seed serialized; a park whose snapshot fetch is itself slow cold
  (~0.9 s) is unchanged (that's the park fetch, not the seed). No hydration errors; forecast intact.

## Unreleased – SEO: park best-days now read the precomputed /best-days endpoint

Follow-up to the "core content in first HTML" work, now that the backend ships the precomputed
best-days endpoint (PArns/v4.api.park.fan#94). The best-days section, crowd FAQ and header
"Prognose heute" forecast previously derived their data from the ~2.25 MB `/calendar` response
(≈98 % unused `influencingHolidays`, 10–20 s cold ML compute) guarded by a seed timeout.

- `lib/api/integrated-calendar.ts`: `getBestDaysCalendar` / `getBestDaysCalendarSeed` now fetch
  `GET /v1/parks/.../best-days` (a materialized Redis snapshot, ~15 KB, p99 < 300 ms). Dropped
  `unstable_cache` + `projectBestDaysCalendar` — the small body fits Next's fetch data cache
  directly (plain `next: { revalidate, tags: ['best-days:<slug>'] }`; the backend fires
  `revalidateTag` after each forecast warmup). Seed timeout is now a formality (800 ms).
- New `getBestDaysSnapshotFresh` + `/api/parks/.../best-days` proxy branch; `useParkBestDaysCalendar`
  (client) switched to it — no more `from`/`to` window (the endpoint returns the rolling today→+90d
  window), so `getCalendarWindow` / `lib/hooks/use-calendar-window.ts` are gone.
- The `/best-days` snapshot includes a stats-quality `byDayOfWeek` aggregate, so the **SSR seed now
  renders the proper "quietest weekdays" ranking + best weekend day** in the first HTML (previously
  the seed fell back to the calendar-derived approximation).
- `park-header-stats.tsx`: "today" for the forecast is derived from the browser clock in the park
  timezone (`date === todayStr`) — the lean endpoint deliberately omits the `isToday` flag (a baked
  flag goes stale in the CDN cache).
- The calendar **grid tab** still uses the full `/calendar` endpoint (it needs hours + weather per
  day); with the backend payload diet its default body is now ~50 KB instead of ~2.25 MB.
- Loading-priority REQUIREMENT untouched: the client best-days query stays `useLoadLast`-deferred.

## Unreleased – SEO: park pages ship their core content in the first HTML again

Competitor SERP analysis (July 2026, "phantasialand wartezeiten" & co.) found the park page's
initial HTML contained **no attraction names, no attraction links and no best-days text** — the
attractions tab mount-gated everything behind a skeleton, and the best-days/FAQ calendar content
was client-only. wartezeiten.app/queue-times serve exactly this content statically. Changes
(see [SEO analysis](seo/analysis.md)):

- **NEW `AttractionWaitOverview`** — the pre-mount/no-JS state of the attractions tab is now a
  server-rendered semantic list of EVERY attraction (name + link + snapshot wait/status),
  grouped by land, with the park-wide Ø/peak/operating summary and a visible "Datenstand"
  timestamp. The interactive cards replace it after mount; crawlers index 40 ride names + 40
  internal links per park instead of a pulse skeleton.
- **Best-days SSR seed** — `getBestDaysCalendarSeed` (timeout-guarded `getBestDaysCalendar`,
  month-aligned window, `after()` keeps a cold fill alive) lets the "Beste Reisezeit" section
  and the least-crowded FAQ render server-side when the (72 h SWR) cache is warm. The client queries
  stay `useLoadLast`-deferred — the loading-priority requirement is untouched (the seed is
  props, not a page query).
- **FAQ**: "Wann ist {park} am wenigsten los?" now also lands in the FAQPage **JSON-LD**
  (shared `getLeastCrowdedDays` derivation, so markup and visible answer can't diverge), and
  Q1 renders today's concrete opening hours server-side (force-dynamic page, per-request clock).
- Fixes: German evergreen opening-hours FAQ no longer reads "von das {park}"; attraction-page
  H1 text no longer concatenates as "Taron– Aktuelle Wartezeit"; the neighbouring-holidays
  header panel renders once (responsive classes) instead of twice in the HTML.
- Deliberately NOT changed: `PARK_REVALIDATE` stays 1 day — a shorter snapshot window would
  re-create the ISR/data-cache write volume documented in
  [caching-strategy](architecture/caching-strategy.md); freshness is signalled honestly via the
  rendered "Datenstand" instead.

## Unreleased – Hottest-parks banner: centered layout for a partial heat wave

The homepage heat banner ([`HottestParksSection`](../components/home/hottest-parks-section.tsx))
switched from a fixed 3-column grid to a **centered flex-wrap** row of fixed-width (`w-72`)
cards. When only 1–2 parks in DE/FR/IT/NL/BE cross the 35 °C threshold, the cards now stay
centered instead of left-aligning and leaving an empty trailing column. Three cards still fill
`max-w-4xl` exactly; the ≥ 35 °C visibility trigger is unchanged.

## Unreleased – Blog: German-first launch (welcome post live in DE only)

The rewritten founder-story welcome post goes **published for DE**; EN stays draft until the
translations are polished. To make a single-locale launch clean, blog visibility is now
**locale-scoped** (`hasPublishedPosts(locale?)` in `lib/blog/index.ts`):

- Header/footer nav, blog index, category/tag/author pages and the RSS feed exist **only in
  locales that actually list posts** — /de/blog is live while /en/blog & co. stay 404 instead
  of presenting an empty index.
- `buildPostAlternates` emits only **published** translations (draft URLs 404, hidden ones are
  unlisted — neither belongs in hreflang); the DE post self-canonicalizes with `x-default` on
  itself until translations exist.
- `app/sitemap.ts` blog section iterates only blog-live locales (incl. blog-scoped hreflang
  alternates for index/category/tag/author entries).

## Unreleased – SEO: hub + attraction pages join the sitemaps

SERP checks (July 2026) showed the missing long-tail surface: queue-times/wartezeiten.app rank
their per-ride pages for "taron wartezeit"-style queries and country overviews rank for
"freizeitparks deutschland" — page types park.fan HAS but kept out of the sitemap (old
crawl-budget decision, explicitly marked "revisit"). Changes — see
[sitemaps](seo/sitemaps.md):

- `app/sitemap.ts`: continent + country hubs and **multi-park** city hubs added (single-park
  cities 308 to their park and stay excluded).
- **NEW `/sitemap-attractions.xml`** (`app/sitemap-attractions.xml/route.ts`, daily ISR):
  ~5.8k attractions × 6 locales as lean `<loc>`-only entries (full alternates would approach
  the 50 MB sitemap limit; the pages carry hreflang themselves). Referenced from robots.txt.
- `lib/content-urls.ts` `getAttractionPaths`: variant filter now mirrors the attraction page
  exactly — numbered-suffix slugs are only dropped when the base slug exists in the same park
  (previously over-excluded legit slugs like `spindeln-nyhet-2026`); also fixes the IndexNow
  URL set.

---

## Unreleased – SEO: heal re-slugged geo URLs (google.de showed English/no German pages)

The API's umlaut transliteration change re-slugged German cities (`bruhl` → `bruehl`,
`gunzburg` → `guenzburg`), so every previously indexed Phantasialand + Legoland-Deutschland
URL (park, attractions, city hub) returned **404** — Google dropped the German flagship pages
and google.de fell back to English results; visit share skewed to the US. hreflang, canonicals,
sitemap alternates and `Content-Language` were verified correct — the missing piece was
redirects for the old URLs:

- **`findRelocatedParkRedirect`** (`lib/utils/redirect-utils.ts`) — generic safety net: the
  park slug is the stable key; if the API lookup for a park/attraction URL 404s but the slug
  exists elsewhere in the geo structure, the page issues a **308** to the canonical path.
  Runs only after a confirmed API miss, so it can never bounce a working URL. Heals any
  future city/country re-slug automatically. Wired into the park page and attraction page
  (body + `generateMetadata` canonical). Handles duplicate park slugs (`disneyland-park`
  exists in Paris **and** Anaheim) by preferring continent/country matches.
- **Static 301s** in `next.config.ts`, derived from the GSC coverage export (2026-07-06,
  2,388 known 404s) diffed against `/v1/discovery/geo`:
  - rule 6 relocated cities: `bruhl`→`bruehl`, `gunzburg`→`guenzburg`, `cocoyoc`→`oaxtepec`,
    `glendale`→`phoenix`, `valencia`→`santa-clarita`, `willis`→`spring`
  - rule 7 renamed parks: 6× `six-flags-hurricane-harbor-*`→`hurricane-harbor-*` (the three
    still-existing six-flags water parks are deliberately NOT matched), `universals-*`→
    `universal-*`, `toverland`→`attractiepark-toverland`, `lotte-world`→`lotte-world-adventure`,
    `disneys-animal-kingdom-theme-park`→`disney-animal-kingdom`, `adventure-island`→
    `adventure-island-tampa`, `universal-studios`@bull-creek→`universal-studios-hollywood`@LA,
    resort URLs `walt-disney-world`→Orlando hub, `disneyland-paris`→`disneyland-park`
  - rule 8 pre-`/parks` URL scheme: `/{locale}/{continent}/…` → `/{locale}/parks/{continent}/…`
  - rule 9 doubled locale prefixes (`/de/de/…`), rule 10 `/manifest.json` → `/manifest.webmanifest`
- **Cross-locale glossary slugs** (≈38 % of the sampled 404s, legacy of next-intl
  auto-alternates): the term page now resolves a slug from ANY locale via `findTermByAnySlug`
  and 308s to the locale-correct slug — e.g. `/nl/glossaire/harnais-epaules` →
  `/nl/woordenboek/schouderbeugels`-style chains end on real content instead of 404.
- Docs: [routing-and-urls](architecture/routing-and-urls.md#redirect-logic-404-prevention)
  examples updated to current slugs; [SEO analysis](seo/analysis.md) notes the incident.
- Known backend data bug (flagged, needs API fix): `universal-studios-hollywood` is listed
  under BOTH `bull-creek` and `los-angeles` in `/v1/discovery/geo` → duplicate sitemap
  entries and split signals.

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
