# An API route passes only slugs upstream, and says a failure is one (REQUIREMENT)

- **Segments.** A route handler that puts its catch-all segments into a backend URL checks every one
  with `isSlugPath()` (`lib/utils/servable-route.ts`) first, and answers 400 otherwise. Every public
  path the API serves is lowercase alphanumerics and dashes, which is also what
  `assertServableRoute` (`lib/utils/route-guards.ts`) enforces on the pages. The admin proxy, whose
  paths are not slugs, re-encodes its segments instead (`lib/admin/proxy-path.ts`).
- **Secrets.** A route gated on an environment secret fails closed when the secret is unset. Cron
  routes open with `cronUnauthorized(request)` (`lib/security/cron-auth.ts`, a 503 then);
  `/api/revalidate` uses the same `bearerUnauthorized` for its own secret.
- **Failures.** An upstream failure is answered as a non-200 without cache headers, never as
  `200 {}`. A partial answer (some regions failed) is still an answer; an empty one is not.
- **Every error response under a shared header rule carries its own `Cache-Control`**:
  `no-store, must-revalidate` where a retry is cheap, a short window where a failure is expensive to
  repeat (the OG route's 500 carries `s-maxage=300`, at most one render per URL every five minutes).
- **A shared answer is shared.** An answer that is the same for every visitor carries a CDN window
  (`/api/parks/near` and `/api/analytics/{ticker,realtime,geo-live}` take the 60 s of
  `/api/parks/live`), set in the handler and in `next.config.ts` alike (`lib/api/cdn-cache-headers.ts`).
  What depends on the visitor (`/api/nearby`, `/api/favorites`) or is deliberately live (the park
  poll) stays `no-store`.

## Why

- **Segments**: Next matches the raw pathname and percent-decodes each segment afterwards, so `%2F`,
  `%2E%2E` and `%3F` arrive inside one segment, and `new URL()` in `apiFetch` then resolves `..` and
  starts a query at `?`. Until 2026-09-28, `/api/parks/a/b/c/d/attractions/..%2F..%2F…` reached any
  path on api.park.fan with the deployment's `x-auth-key` (a throttle bypass) attached, and the CDN
  cached the answer; `/api/og/[...path]` had the same hole.
- **Secrets**: `` `Bearer ${process.env.CRON_SECRET}` `` is `Bearer undefined` on a deployment
  without the variable, and anybody can send that.
- **Failures**: a 200 with an empty body is cached by the CDN and counted as success by React Query,
  which replaces the last good data and never retries. `/api/parks/live` answered `{}` with
  `s-maxage=60` when every region failed, and every card lost its status for minutes; the nav geo
  route's `{ cities: [] }` was cached by the parks menu as "no cities" for the session. Both answer
  502 now. A response without its own `Cache-Control` takes its path's window from `next.config.ts`,
  so a park-proxy 5xx left with a day at the CDN and a failed OG card with thirty days.
- **Shared answers**: a `no-store` answer is a function invocation per page view and per poll.
