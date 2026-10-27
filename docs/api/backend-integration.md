# Backend integration

How the frontend talks to [api.park.fan](https://api.park.fan): where the client and
its configuration live, how crowd levels from the API are displayed, the
`/api/revalidate` webhook the backend calls, and favourites. Open it before adding an
API call or changing how an API value is rendered. What each field means is owned by
the backend's
[client contracts](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/README.md);
this page and the others in `docs/api/` cover only the frontend's side.

## Where the client lives

- All API calls go through the typed client in `lib/api/*` (`client.ts` is the fetch
  wrapper, `types.ts` the response types: `ParkStatus`, `AttractionStatus`, `CrowdLevel`,
  calendar day status). Server reads use the fetchers (`parks.ts`, `discovery.ts`,
  `stats.ts`, `integrated-calendar.ts`, …), each owning its Data Cache window and tags. The
  modules and what each exports are in the code index: [lib/api](../code-index/lib-api.md).
- The browser polls the relays under `app/api/*` (`/api/parks/[...path]`, `/api/parks/live`,
  `/api/search`, `/api/analytics/*`, `/api/weather/hourly`, `/api/og/*` …; listed in
  [app/api](../code-index/app-api.md)). A relay passes only slugs upstream and reports a
  failure as a non-200 without cache headers —
  [the rule](../rules/an-api-route-passes-only-slugs-upstream.md); the CDN windows it answers
  with are in [CDN caching](../architecture/cdn-caching.md).
- **Base URL:** `NEXT_PUBLIC_API_URL`, default `https://api.park.fan`
  (`API_ORIGIN` in `lib/api/client.ts`). No secrets in code or docs.
- Per-visitor requests no cache can share (nearby, favourites, trips, push) go to the
  API directly through `browserApiUrl()` when `NEXT_PUBLIC_API_DIRECT=1` —
  [the rule](../rules/a-request-no-cache-can-share-goes-to-the-api-directly.md).
- Which endpoint a page calls, and what it costs: [API budget](../architecture/api-budget.md).
  Cache windows and tags per fetcher: [caching strategy](../architecture/caching-strategy.md#data-cache-windows).
- A URL the API returns is converted with `convertApiUrlToFrontendUrl()` before it is
  linked — [routing and URLs](../architecture/routing-and-urls.md).

## Crowd levels

The levels and their semantics are the backend's
([crowd-level rule](https://github.com/PArns/v4.api.park.fan/blob/main/docs/rules/crowd-levels.md)).
On this side:

- **`moderate` displays as "Normal"** in every locale, coloured as the typical day
  (`common.crowd.moderate`, `parks.crowdLevels.moderate`, `attractions.crowdLevels.moderate`); the badge colours are in the
  [design tokens](../design/tokens.md#crowd-levels).
- **`unknown` is not a tier.** `CrowdLevelBadge` renders it as a neutral grey
  "Keine Prognose / no forecast" chip; never map it into the coloured ladder or
  substitute `moderate`. It can arrive on the park's live level, a ride's
  `crowdLevel`, a calendar day and its hours, and `/v1/search` results' `load`.
- **`closed`** is accepted by the badge as its own chip (calendar days).
- **Never re-derive a level in the frontend.** Read the gated value the payload carries
  (`analytics.statistics.crowdLevel`, `avgCrowdLevel`, a day's `crowdLevel`); a live
  park level is a baseline-weighted mean over the headliners reporting now and cannot
  be rebuilt from the waits on screen.
- **A `0`-minute wait is a walk-on, not missing data**; only an absent wait is "no
  data".

## On-demand revalidation

What `POST /api/revalidate` takes, and what the backend sends when, is in
[caching strategy](../architecture/caching-strategy.md#invalidation). The rest of the
contract is in `app/api/revalidate/route.ts`: `Authorization: Bearer $REVALIDATE_SECRET`
(**503** until the secret is set), at most 50 entries per array, **400** when neither
`tags` nor `paths` has one. A park's own tag is `park:<continent>/<country>/<city>/<slug>`
(`parkCacheTag`, `lib/api/park-live-projection.ts`), with a hand-written twin in the
API — change both.

## Favorites

Stored in a **cookie** in the browser, enriched by the API.

- `lib/utils/favorites.ts` reads and writes the cookie (parks, attractions, shows,
  restaurants — IDs only, no secrets); cookie name and lifetime live there.
- `lib/api/favorites.ts` holds the types and `getFavorites()`, which asks the API's
  `/v1/favorites` for the full entities (with optional `lat`/`lng` for distances), from
  the browser directly where `NEXT_PUBLIC_API_DIRECT=1`, else through
  `app/api/favorites/route.ts`.
- Wait-derived fields of a park we cannot read are stripped there
  (`stripUnreadableWaitStats`) — see [parks without wait times](parks-without-wait-times.md).

## Related

- [Calendar status](calendar-status-closed.md) — how the calendar renders `UNKNOWN`, `CLOSED` and `scheduleCoverage`
- Open requests to the API are Linear issues (team PAR, label `backend`).
- [API docs (Swagger)](https://api.park.fan/api)
