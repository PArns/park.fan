# A forecast leaves park.fan only with a key (REQUIREMENT)

park.fan's forecasts (crowd calendar, best days, day plans, yearly predictions, predicted waits,
`bestVisitTimes`) leave the API only to the holder of a data key in `X-API-Key`. The terms say so
(Impressum, `#data-use`); the API enforces it
([backend `docs/frontend/api-keys.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/api-keys.md)).
This site's server holds one too: `API_DATA_KEY`, usage `internal`, sent by `getServerApiHeaders`.
Live and historical data stay open.

## What follows for this repo

- **A server fetch of a mixed route asks for the forecast fields.** Park detail, ride detail,
  `/stats/day` and `/favorites` leave them out unless the URL carries `forecast=true`:
  `withForecast()` in `lib/api/forecast-query.ts`, through `readWithForecast()` or
  `fetchWithForecast()`, which read once more without the flag when the API refuses the site's key
  (401 or 403): a revoked or expired `API_DATA_KEY` costs the pages their forecasts, not the pages. Without the flag the API answers the copy
  Cloudflare cached for a keyless caller, and `bestVisitTimes` silently vanishes from the cards.
  A fetch that shows no forecast leaves the flag off and stays in the shared cache
  (`getParkByGeoPathForAgents`, `getParkByGeoPathFreshWithoutForecasts`). A server with neither
  key leaves it off too (`serverHoldsForecastKey`), because the flag without a key is a 401 and
  the page would fail instead of rendering without forecasts. In direct mode
  (`NEXT_PUBLIC_API_DIRECT`) the favourites come from the browser, which holds no key, so their
  cards carry no best visit times.
- **A relay that carries a forecast answers only this site's pages.** The forecast branches of
  `/api/parks/*` and `/api/favorites` call `isSameOriginRequest()` (`lib/api/forecast-relay.ts`)
  and answer 403 otherwise. Without it the relay is the API without a key. A new branch that
  returns a forecast joins `isForecastRelayPath()`. A script that calls one sends
  `Sec-Fetch-Site: same-origin`, as `check-planner.mjs` does.
- **A forecast MCP tool reads with the caller's key, except from this site's own pages.**
  `FORECAST_TOOL_NAMES` (`lib/agents/tool-descriptors.ts`); `forecastGrant()`
  (`lib/agents/forecast-access.ts`) hands the tool the presented key, and the tool sends that key
  and nothing of the server's to the API (`getBestDaysForApiKey`), which applies revocation, the
  key's parks and its hourly allowance on that read. Nothing here caches a verdict. A WebMCP call
  from a page passes the relays' `isSameOriginRequest()` and reads like the page; forging the
  header there gains what forging it on the relay gains.
- **An error from a relay under a shared rule answers `NO_STORE`**, which sets
  `CDN-Cache-Control` too: Cloudflare reads that header first, and the rule's own would let it
  cache a 403 and serve it to the site's own pages.
- **The two server keys stay apart.** `API_AUTH_KEY` (`x-auth-key`) lifts the API's rate limits
  and makes it believe `X-Forwarded-For`; `API_DATA_KEY` opens the forecasts. Neither reaches a
  data consumer, who gets a `pfk_` key of their own from `/admin/api-keys`. Until the API runs
  with `FORECAST_BYPASS_KEY=off`, `x-auth-key` still opens the forecasts too.

## What it does not stop

The pages render the forecasts, and a relay answer the CDN has cached is served before the
same-origin check runs. A scraper can read both. The key protects the API, which is where bulk
use goes; the pages are covered by the terms. A Cloudflare WAF rule that blocks the forecast
relays for requests without `Sec-Fetch-Site: same-origin` moves the check in front of the cache.

## Check

```bash
pnpm test:forecast-relay
PARKFAN_DATA_KEY=pfk_… pnpm check:agent-ready   # the MCP forecast tool refuses without, answers with
```
