# A forecast leaves park.fan only with a key (REQUIREMENT)

park.fan's forecasts (crowd calendar, best days, day plans, yearly predictions, predicted waits,
`bestVisitTimes`) leave the API only to this site's server, which sends `x-auth-key`, or to the
holder of a data key in `X-API-Key`. The terms say so (Impressum, `#data-use`);
the API enforces it ([backend `docs/frontend/api-keys.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/api-keys.md)).
Live and historical data stay open.

## What follows for this repo

- **A server fetch of a mixed route asks for the forecast fields.** Park detail, ride detail,
  `/stats/day` and `/favorites` leave them out unless the URL carries `forecast=true`:
  `withForecast()` in `lib/api/forecast-query.ts`. Without the flag the API answers the copy
  Cloudflare cached for a keyless caller, and `bestVisitTimes` silently vanishes from the cards.
  A fetch that shows no forecast leaves the flag off and stays in the shared cache
  (`getParkByGeoPathForAgents`).
- **A relay that carries a forecast answers only this site's pages.** The forecast branches of
  `/api/parks/*` and `/api/favorites` call `isSameOriginRequest()` (`lib/api/forecast-relay.ts`)
  and answer 403 otherwise. Without it the relay is the API without a key. A new branch that
  returns a forecast joins `isForecastRelayPath()`. A script that calls one sends
  `Sec-Fetch-Site: same-origin`, as `check-planner.mjs` does.
- **A forecast MCP tool needs a key, except from this site's own pages.** `FORECAST_TOOL_NAMES`
  (`lib/agents/tool-descriptors.ts`); `mayReadForecasts()` checks the key against
  `/v1/api-keys/verify` without the server's own key, which the API would accept for anything.
- **The server key never reaches a data consumer.** It lifts the API's rate limits and makes it
  believe `X-Forwarded-For`; a consumer gets a `pfk_` key from `/admin/api-keys`.

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
