# Only the wait times leave park.fan without a key (REQUIREMENT)

api.park.fan answers one route without a data key: a park's live wait times
(`/v1/parks/{…}/wait-times`). Everything else, from the park directory and ride data to opening
hours, weather, seasons, statistics, forecasts and the planners, needs a key in `X-API-Key` that
carries the matching permission. A key carries some of 19 permissions in 7 groups
(`lib/developers/permissions.ts`, mirrored from the backend's `src/api-keys/permissions.ts`), and the
park and ride detail leave out the fields a key has no permission for. The terms say so (Impressum,
`#data-use`); the API enforces it
([backend `docs/frontend/api-keys.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/api-keys.md)).
This site's server holds a key with usage `internal`, which reads everything: `API_DATA_KEY`, sent
by `getServerApiHeaders` on every server request.

## What follows for this repo

- **Every server read carries `API_DATA_KEY`.** Without it, or with a revoked one, the API gives the
  site the wait times and nothing else, and the pages fail. Set it in Vercel before the backend that
  enforces the permissions goes out.
- **A server fetch of a mixed route asks for the forecast fields.** Park detail, ride detail,
  `/stats/day` and `/favorites` leave them out unless the URL carries `forecast=true`:
  `withForecast()` in `lib/api/forecast-query.ts`, through `readWithForecast()` or
  `fetchWithForecast()`, which read once more without the flag when the API refuses the forecast
  permission (401 or 403). A server without a key leaves the flag off (`serverHoldsForecastKey`),
  because the flag without a key is a 401.
- **A relay answers only this site's pages, except the wait times.** Every route under `/api/` that
  passes API data on starts with `refuseForeignRequest()` (`lib/api/keyed-relay.ts`), which answers
  403 unless the request is the site's own (`isSameOriginRequest()`). Under `/api/parks/*` only the
  wait-times branch skips it (`isOpenRelayPath()`). Without the check the relay is the API without
  a key. A new relay starts with the same two lines. A script that calls one sends
  `Sec-Fetch-Site: same-origin`, as `check-planner.mjs` does.
- **The browser never calls a keyed route directly.** It holds no key, so nearby and favorites
  always take their relays, also with `NEXT_PUBLIC_API_DIRECT` on
  ([a request no cache can share](a-request-no-cache-can-share-goes-to-the-api-directly.md)). Trips
  and push stay direct: the API serves them without a key.
- **An MCP tool reads with the caller's key, except from this site's own pages.**
  `toolGrant()` (`lib/agents/tool-access.ts`) hands a tool either the page's access or the
  presented key. `KEYED_TOOL_NAMES` (`lib/agents/tool-descriptors.ts`) refuse a caller with neither;
  `get_park_wait_times` answers such a caller from the open wait-times route only. With a key every
  read of the tool carries that key and nothing of the server's (`readWithCallerKey`,
  `lib/api/caller-key.ts`), so the API applies its permissions, parks, revocation and hourly
  allowance. Nothing here caches a verdict. A WebMCP call from a page passes `isSameOriginRequest()`
  and reads like the page; forging the header there gains what forging it on a relay gains.
- **An error from a relay under a shared rule answers `NO_STORE`**, which sets
  `CDN-Cache-Control` too: Cloudflare reads that header first, and the rule's own would let it
  cache a 403 and serve it to the site's own pages.
- **The two server keys stay apart.** `API_AUTH_KEY` (`x-auth-key`) lifts the API's rate limits
  and makes it believe `X-Forwarded-For`; `API_DATA_KEY` opens the data. Neither reaches a data
  consumer, who registers on `/developers/dashboard`, files a request there and picks up the key
  once the owner approved it on `/admin/api-keys`
  ([developer portal](../features/developer-portal.md)). Until the API runs with
  `FORECAST_BYPASS_KEY=off`, `x-auth-key` still opens everything too.

## What it does not stop

The pages render the data, and a relay answer the CDN has cached is served before the same-origin
check runs. A scraper can read both. The key protects the API, which is where bulk use goes; the
pages are covered by the terms. A Cloudflare WAF rule that blocks `/api/*` except the wait times for
requests without `Sec-Fetch-Site: same-origin` moves the check in front of the cache.

## Check

```bash
pnpm test:forecast-relay
pnpm test:developer-key-requests
PARKFAN_DATA_KEY=pfk_… pnpm check:agent-ready   # the keyed MCP tools refuse without, answer with
```
