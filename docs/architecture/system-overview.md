# System overview

How the park.fan frontend is put together: the rendering model, where data comes from, the park
page's load order and the main directories. Start here before changing anything that crosses a
page, a fetch and a client query.

## Stack and rendering model

- **Next.js 16 App Router, React 19, TypeScript.** Every page sits under the `[locale]` segment
  (six locales: `en`, `de`, `nl`, `fr`, `es`, `it`). Locale handling and the redirects that must
  run before a render live in **`proxy.ts`**; there is no `middleware.ts`.
- **Server Components by default.** Client Components (`'use client'`) are the interactive and live
  parts: search, filters, maps, and everything that polls.
- **`cacheComponents` (PPR) is off** (`next.config.ts`). A page is either prerendered (ISR) or
  `export const dynamic = 'force-dynamic'` behind an edge window. Which route is which, and why:
  [caching strategy](caching-strategy.md#how-each-route-renders).
- **Route handlers under `app/api/*`** relay the API for the browser (CDN-cached, see
  [CDN caching](cdn-caching.md)), render OG images, and serve the cron, webhook and revalidation
  endpoints.

## Data flow

1. **Server render.** Pages read [api.park.fan](https://api.park.fan) through `lib/api/*`. Structure
   (names, ride lists, schedules, FAQ figures) comes from the Vercel Data Cache
   (`fetch` with `next: { revalidate, tags }`); nothing "live" is baked in for longer than the
   client takes to replace it.
2. **Browser.** React Query hooks in `lib/hooks/*` poll `/api/*` relays, or api.park.fan directly
   for requests no cache can share ([the rule](../rules/a-request-no-cache-can-share-goes-to-the-api-directly.md)),
   and lay live values (status, waits, weather, crowd) over the server-rendered seed.
3. **Invalidation.** The backend POSTs cache tags (`geo`, `parks`, `park:<geo path>`,
   `best-days:<slug>`, …) to `/api/revalidate` when data actually changes; time-based windows are
   the fallback. See [backend integration](../api/backend-integration.md#on-demand-revalidation).

API client, proxies and the direct-request switch: [Backend integration](../api/backend-integration.md). What each
route costs in requests and bytes: [API budget per page](api-budget.md).

## Park page load order

The rule is [park page loading priority](../rules/park-page-loading-priority.md): the best-days
calendar and the historical stats load last. How it is wired:

- `useLoadLast` (`lib/hooks/use-load-last.ts`) releases the deferred queries once every other
  React Query fetch has been idle for 300 ms, or after a 5 s safety timeout. The deferred queries
  are listed by key prefix (`DEFERRED_KEY_PREFIXES`) or carry `LOAD_LAST_META`; a new deferred
  query that does neither counts as "other traffic" and starves its siblings.
- The server-rendered best-days seed does not break the rule. `getBestDaysCalendarSeed`
  (`lib/api/integrated-calendar.ts`) reads the Data-Cached snapshot (`BEST_DAYS_REVALIDATE`, 3 days,
  tag `best-days:<slug>`) inside a `<Suspense>` boundary with a 3 s timeout, so a cold fill cannot
  hold the first byte, and it enqueues no client query.
- Weather goes early: `WeatherCard` starts the hourly day-view fetch in parallel with the nowcast;
  only the chart's rendering waits for both.

## Streaming and layout shift

A `<Suspense>` boundary on these pages owes the page the height of what it will render:
[a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md).
The harness that proves a fix is `pnpm measure:cls --late` against `pnpm build && pnpm start` at
`localhost`; its flags and traps are documented in [scripts](../development/scripts.md) and in
`scripts/measure-cls.mjs`.

## Key directories

| Directory                   | Holds                                                                       |
| --------------------------- | --------------------------------------------------------------------------- |
| `app/[locale]`              | Every localized page                                                        |
| `app/api`                   | Route handlers: API relays, OG images, cron, webhooks, `/api/revalidate`    |
| `proxy.ts`                  | Locale routing, redirects decided before a render, response header clean-up |
| `components/`               | UI by area (`parks`, `home`, `blog`, `layout`, `search`, `ui`, …)           |
| `lib/api`                   | API client, fetchers with their cache windows, payload projections          |
| `lib/hooks`                 | React Query hooks for live data                                             |
| `lib/utils`                 | URL building, redirects, breadcrumbs, dates, crowd levels                   |
| `lib/parks`                 | Park sub-page segments and calendar rules                                   |
| `i18n/`, `messages/`        | next-intl routing and request config; translations for all six locales      |
| `content/`, `public/media/` | Blog posts and the media database                                           |
| `docs/code-index/`          | Generated index of every exported component, hook and helper                |

## Related

- [Routing and URLs](routing-and-urls.md)
- [Caching strategy](caching-strategy.md) and [CDN caching](cdn-caching.md)
- [Backend integration](../api/backend-integration.md) and [API budget per page](api-budget.md)
