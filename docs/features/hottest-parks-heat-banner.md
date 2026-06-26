# Feature concept: "Hottest parks" heat banner on the homepage

> Status: **implemented** (frontend aggregation = doc's Option B; countries **DE / FR / IT / NL / BE**;
> ranking by today's **max** temperature). See `components/home/hottest-parks-section.tsx` and
> `lib/api/weather-hottest.ts`. The data source can later be swapped to the backend endpoint
> (Option A) without touching the section component.
> A homepage section in the spirit of the existing **Saisonstart** announcement
> ([`AnnounceSection`](../../components/home/announce-section.tsx)) that surfaces the
> hottest theme parks in **Germany, France, the Netherlands and Belgium** during a
> heat wave, each with a park link and a compact temperature card.
> It appears **only while a real heat wave is on** and disappears automatically once
> no park in those countries is at/above the threshold (the "Ablaufdatum").

---

## 1. Goal & behaviour

- **Headline:** "Die heißesten Parks in Deutschland, Frankreich, Niederlande und Belgien"
  (localised for all 6 locales).
- **Content:** the **top 3** parks across DE / FR / NL / BE ranked by today's
  maximum temperature, each shown as a card with:
  - park name + **link to the park page**,
  - a **temperature / weather card** (today's max, min, current temp, weather icon),
  - the **heat warning triangle** we just shipped (reused, see §4) when ≥ 35 °C.
- **Visibility / "Ablaufdatum" (the key requirement):** the section is **data-driven**,
  not date-driven. It renders **only if at least one** park in those four countries
  currently has a max temperature **≥ 35 °C**. The moment that is no longer true, the
  section returns `null` and vanishes from the page — no manual expiry date needed.
  - Threshold reuses [`HEAT_WARNING_THRESHOLD_C`](../../components/parks/heat-warning-badge.tsx)
    (currently 35 °C) so the banner and the per-park warning triangle stay in sync.
  - Optional **safety window** (`startAt` / `endAt`, like the announce frontmatter) can
    bound it to the warm season (e.g. May–September) so we don't pay for weather lookups
    in winter when the answer is always "no". This is an optimisation, not the expiry
    mechanism.

---

## 2. Can we do it with existing features? — Yes, with one caveat

**Yes.** Everything on the rendering side already exists and is reused (§4). The single
real design decision is **how to get the temperature for many parks at once**, because:

> ⚠️ **Weather is not part of the geo structure.** `getGeoStructure()`
> ([`lib/api/discovery.ts`](../../lib/api/discovery.ts)) returns the
> continent → country → city → park tree, but **no temperature**. Per-park weather is
> fetched individually (park detail page, nowcast endpoint). There is currently **no
> bulk / "hottest parks" endpoint** on api.park.fan.

So we need a way to rank parks by temperature. Two options:

### Option A — Backend endpoint (recommended)

Add a small endpoint to the backend
([`v4.api.park.fan`](https://github.com/park-fan/v4.api.park.fan)):

```
GET /v1/weather/hottest?countries=de,fr,nl,be&minTempC=35&limit=3
→ [
    { continent, country, city, parkSlug, parkName, countryName,
      temperatureMaxC, temperatureMinC, currentTempC, weatherCode },
    ...
  ]   // already filtered ≥ minTempC, sorted desc, capped at limit
```

- The backend already ingests weather per park, so it can rank server-side cheaply.
- Frontend does **one cached fetch** (`revalidate: 300–900`), renders the cards, and
  returns `null` on an empty array → the data-driven expiry falls out for free.
- Cleanest, cheapest, most accurate. **Requires backend work in the other repo.**

### Option B — Frontend aggregation (no backend changes)

Ship entirely in this repo:

1. Keep a **curated candidate list** of the major parks in DE/FR/NL/BE (~15–25 slugs —
   e.g. Europa-Park, Phantasialand, Heide-Park, Disneyland Paris, Parc Astérix, Walibi
   Holland, Efteling, Toverland, Walibi Belgium, Plopsaland, Bobbejaanland …). Reuses the
   same idea as the hardcoded `FEATURED_PARK_SLUGS`
   ([`featured-parks-section.tsx`](../../components/home/featured-parks-section.tsx)).
2. Server-side, fetch each candidate's weather in parallel (the per-park nowcast carries
   `temperatureMaxC`), behind a shared cache (`revalidate: 1800`, one shared tag) so the
   ~20 lookups run **once per window, shared across all 6 locales** — temperature is
   language-independent.
3. Rank by `temperatureMaxC`, filter ≥ 35 °C, take top 3, render. Empty → `null`.

- No backend dependency; ships now.
- Costs ~20 cached weather lookups per refresh window (acceptable, and skippable in
  winter via the optional season window in §1).
- Coverage limited to the curated list (a small park having a freak 36 °C day wouldn't be
  caught — fine for a "headline" banner).

**Recommendation:** **Option A** if we're willing to touch the backend (better long-term);
**Option B** to ship immediately with zero backend coupling. Both share the exact same UI
and expiry logic, so we can start with B and swap the data source to A later without
touching the component.

---

## 3. Placement & rendering pattern

- Insert a new `<HottestParksSection locale={locale} />` in
  [`app/[locale]/page.tsx`](../../app/[locale]/page.tsx) **right after `<AnnounceSection>`**
  (line ~216), wrapped in `<Suspense fallback={null}>` so it streams and never blocks LCP.
  `null` fallback (not a skeleton) because the section is usually absent — we don't want to
  flash a placeholder for a section that won't render 90 % of the year.
- Server Component, same as `AnnounceSection` / `FeaturedParksSlot`. The data fetch is
  cached (ISR), so it sits inside the static shell.
- Honors the **park-page loading-priority rule** indirectly: this is the homepage, not a
  park page, so `useLoadLast` doesn't apply, but we still keep it non-blocking via Suspense.

---

## 4. Reused components (no re-implementation)

Per the repo convention ("always reuse existing components"):

| Need                                      | Reuse                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Temperature, dual-unit °C/°F              | [`<Temp>`](../../components/common/unit-display.tsx) — pure, server-safe                  |
| Weather icon + colour                     | [`getWeatherConfig(code)`](../../lib/utils/weather-utils.ts)                              |
| ≥ 35 °C warning triangle                  | [`<HeatWarningBadge>` / `isHeatWarning()`](../../components/parks/heat-warning-badge.tsx) |
| Park link card                            | [`<ParkCard variant="compact">`](../../components/parks/park-card.tsx)                    |
| Banner shell / heading / background       | pattern from [`AnnounceSection`](../../components/home/announce-section.tsx)              |
| Server "now" for the optional date window | [`getServerNowMs()`](../../lib/utils/server-time.ts)                                      |

The **full `WeatherCard`** is intentionally _not_ reused here — it is client-heavy
(React Query nowcast/hourly/live hooks) and park-detail-specific. For a homepage headline
we want a lightweight, server-rendered temperature chip: `<ParkCard compact>` + `<Temp>` +
`getWeatherConfig` icon + the heat triangle.

---

## 5. i18n

New keys under `home.*` in all 6 `messages/*.json`
([structure ref](../../messages/de.json)):

```jsonc
"home": {
  "hottestParks": {
    "title": "Die heißesten Parks in Deutschland, Frankreich, Niederlande und Belgien",
    "subtitle": "Hitzewelle in den Parks — die drei heißesten Ziele heute",
    "tempToday": "Heute bis {temp}",      // e.g. "Heute bis 38°"
    "viewPark": "Zum Park"
  }
}
```

The four country names are part of the headline string per locale (translated naturally,
not string-concatenated). If we later want it data-driven (only name countries that
actually have a hot park), we can switch to an ICU list — noted as a follow-up.

---

## 6. Proposed file plan (Option B, shippable now)

```
components/home/hottest-parks-section.tsx   # new — server component, fetch + rank + render
lib/api/weather-hottest.ts                  # new — candidate list + cached parallel fetch + rank
                                            #       (Option A: replace body with single endpoint call)
app/[locale]/page.tsx                       # +1 line: <Suspense><HottestParksSection/></Suspense>
messages/*.json                             # + home.hottestParks.* (6 locales)
docs/changelog.md                           # changelog entry
```

The `lib/api/weather-hottest.ts` boundary is deliberate: the component depends only on its
`getHottestParks(countries, minTempC, limit)` function, so swapping Option B → Option A is a
one-file change.

---

## 7. Open questions for sign-off

1. **Data source: Option A (backend endpoint) or Option B (frontend curated list)?**
   B ships now with no backend work; A is cleaner and covers every park.
2. **Threshold:** reuse 35 °C (= the warning-triangle threshold), or a separate banner
   threshold? Reusing keeps banner ↔ triangle consistent.
3. **Ranking metric:** today's **max** temperature (recommended for a "hottest day"
   headline) vs **current** temperature.
4. **Season guard:** add the optional May–September `startAt`/`endAt` window to skip
   weather lookups in winter? (Pure cost optimisation.)
5. **Count:** fixed top 3, or "up to 3" (show 1–2 if only that many qualify)?

```

```
