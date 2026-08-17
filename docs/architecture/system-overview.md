# System Architecture

## Overview

The park.fan frontend is a **Next.js 16** App Router application with Server Components as the default. It consumes the REST API from [api.park.fan](https://api.park.fan) and presents wait times, ML predictions, park schedules, and analytics.

---

## Components

### 1. Next.js App (React 19)

- **App Router** with `[locale]` as root segment
- **Server Components** as default – only a few Client Components (`'use client'`) for Theme, Locale-Switcher, Search
- **ISR (Incremental Static Regeneration)** for geo pages and park details
- **API Routes** under `/api/*` for proxy (Search, Parks), OG images, Favorites, Nearby

### 2. lib/api – Type-Safe API Client

- **`client.ts`** – Base fetch with error handling
- **`types.ts`** – TypeScript types from API
- **`parks.ts`**, **`discovery.ts`**, **`search.ts`**, **`analytics.ts`** – domain API functions
- **`convertApiUrlToFrontendUrl()`** – API URL → frontend route conversion

### 3. Data Flow

1. **Page request** → Server Component loads data via `lib/api/*`
2. **API** → `https://api.park.fan/v1/...` (or `NEXT_PUBLIC_API_URL`)
3. **Rendering** → HTML with SEO, JSON-LD, meta tags
4. **Client** → Hydration, theme, search, favorites

### 4. Park page loading priority (REQUIREMENT)

On the park detail page, the **best-travel-time data ("Beste Reisezeit": best-days
calendar + historical stats) must ALWAYS load LAST — everything else loads first.**

- These are the largest and slowest park requests (cold backend compute can take
  10–20 s); they must never compete with the fast, user-visible live data (park
  status, wait times, weather nowcast, hourly weather) for bandwidth or backend
  capacity.
- Enforced centrally by `lib/hooks/use-load-last.ts` (`useLoadLast`), which holds
  back `useParkBestDaysCalendar` and `useParkHistoricalStats` until every other
  React Query fetch on the page has settled (plus a safety timeout so the sections
  can never be starved). **Any new consumer of calendar/stats data on the park page
  must go through these hooks** so the rule cannot be bypassed (queries with the
  same key would otherwise start the fetch early).
- The SERVER-side best-days seed (`getBestDaysCalendarSeed` in the park page) does
  NOT bypass this rule: it reads the 24h data-cached snapshot during the per-request
  render (timeout-guarded, so a cold fill can't block TTFB) and reaches the
  components as plain props for the SSR/pre-mount render only — it never enqueues a
  client query, and the deferred hooks above still fetch in the required order.
- Conversely: weather must load EARLY. The hourly day-view fetch runs in parallel
  with the nowcast (no waterfall); only its _rendering_ is gated on the nowcast.

### 5. A streamed section owes the page its height (REQUIREMENT)

Everything above buys TTFB by letting slow content stream in behind the shell. The
bill for that arrives as CLS, and it is charged to whatever the visitor is looking at
when the boundary resolves — so **a `<Suspense>` boundary on the park page needs a
fallback that reserves the height its content will take**. Two rules follow, both
learned from Cloudflare RUM reporting 8 % of park-page views in the red with a worst
sample of 0.998:

- **`fallback={null}` is only honest when nothing renders below.** The blog section
  had one and did no async work at all — `hasPublishedPosts` and `getPostsForPark`
  read the generated manifest synchronously, so the boundary deferred nothing and
  inserted 467 px (phone) out of thin air. A section whose data is synchronous should
  not be behind a boundary; render it inline and it is in the first HTML at full
  height.
- **The fallback should render whatever needs no data, not a grey box shaped like it.**
  The best-days header (park name, subtitle, three links) is data-free, and its height
  depends on how the title wraps — one line on a desktop, two on a phone. Sized
  `Skeleton` blocks were 66–120 px short until the fallback started rendering the real
  `ParkBestDaysHeader`. Only the three data cards stay placeholders.

Measure with the three states a visitor can actually observe — fallback, server seed,
settled client queries — and compare block geometry between them; the delta IS the
shift. The client queries were never the problem: seed → settled measures 0.

What is left is deliberate. The school-holiday warning under the best-days grid
(46 px desktop / 86 px phone) depends on the data the boundary is waiting for and only
appears on 6 of 27 sampled parks, so reserving it would leave an empty band on the
other 21. "Parks in der Nähe" keeps its `fallback={null}` for the same kind of reason:
**48 % of the 212 parks show no nearby section at all** (the API answers `in_park` for
a big park, or has no neighbour inside 100 km), so a fixed three-card reservation would
collapse ~500 px on half the catalog — a new shift to fix an old one. Its own fetch
cannot start before `park.latitude` exists, so it cannot be overlapped either.

---

## Routing Structure

| Route                                          | Description    | Revalidate |
| ---------------------------------------------- | -------------- | ---------- |
| `/[locale]`                                    | Homepage       | 60s        |
| `/[locale]/parks/[continent]`                  | Continents     | 1h         |
| `/[locale]/parks/[continent]/[country]`        | Countries      | 1h         |
| `/[locale]/parks/[continent]/[country]/[city]` | Cities         | 30min      |
| `/[locale]/parks/.../[park]`                   | Park detail    | 5min       |
| `/[locale]/parks/.../[park]/[attraction]`      | Attraction     | 5min       |
| `/[locale]/search`                             | Search         | Dynamic    |
| `/[locale]/datenschutz`                        | Privacy policy | Static     |
| `/[locale]/impressum`                          | Imprint        | Static     |

Details: [Routing & URLs](routing-and-urls.md)

---

## Key Directories

| Directory      | Purpose                              |
| -------------- | ------------------------------------ |
| `app/[locale]` | All localizable pages                |
| `app/api`      | API routes (Proxy, OG, Favorites, …) |
| `components/`  | Layout, Parks, Common, Search, UI    |
| `lib/api`      | API client, types, Discovery         |
| `lib/utils`    | URL, Redirect, Breadcrumb, Calendar  |
| `i18n/`        | Routing, config, request (next-intl) |
| `messages/`    | Translations (en, de, nl, fr, es)    |

---

## Related

- [Routing & URLs](routing-and-urls.md)
- [Caching Strategy](caching-strategy.md)
- [API Integration](api-integration.md)
