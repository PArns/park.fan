# An API route passes only slugs upstream, and says a failure is one (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

## Segments

**A route handler that puts its catch-all segments into a backend URL checks every one with
`isSlugPath()` (`lib/utils/servable-route.ts`) first, and answers 400 otherwise.** Next matches the
raw pathname and percent-decodes each segment afterwards, so `%2F`, `%2E%2E` and `%3F` arrive inside
a single segment, and `new URL()` in `apiFetch` then resolves `..` and starts a query at `?`. Until
2026-09-28, `/api/parks/a/b/c/d/attractions/..%2F..%2F…` reached any path on api.park.fan with the
deployment's `x-auth-key` (a throttle bypass) attached, and the route cached the answer at the CDN;
`/api/og/[...path]` had the same hole. The admin proxy was closed against it earlier with a
different guard (`lib/admin/proxy-path.ts`, re-encoding the segments), because admin paths are not
slugs. Every public path the API serves is: lowercase alphanumerics and dashes, which is also what
`assertServableRoute` enforces on the pages.

## Secrets

**A route gated on an environment secret fails closed when the secret is unset.**
`` `Bearer ${process.env.CRON_SECRET}` `` is `Bearer undefined` on a deployment without the
variable, and anybody can send that. The cron routes open with `cronUnauthorized(request)`
(`lib/security/cron-auth.ts`), which answers 503 then; `/api/revalidate` does the same for its own
secret.

## Failures

**An upstream failure is answered as a failure, without cache headers.** A 200 with an empty body
is cached by the CDN and counted as success by React Query, which replaces the last good data and
never retries:

- `/api/parks/live` answered `{}` with `s-maxage=60` when every region failed, and every featured
  and region card lost its status for up to three minutes. It answers 502 now.
- `/api/nav/geo/<continent>/<country>` answered `{ cities: [] }`, which the parks menu cached as
  "no cities" for the session, against its own intent of asking again on the next hover. It answers
  502, and the menu throws on `!r.ok`.

A partial answer (some regions failed) is still an answer; an empty one is not.

**And the failure says `no-store` itself.** A response without a `Cache-Control` of its own takes
the window the rule for its path in `next.config.ts` declares. Until 2026-09-28 every 5xx of the
park proxy went out bare, so a backend hiccup on `…/calendar` or `…/positions` left with a header
allowing a day at the CDN and a failed OG card with one allowing thirty days; whether a cache then
keeps a 5xx is down to its own status-code rules, which is not something to lean on. The nav geo
route's old `200 { cities: [] }` had no such doubt: a 200 with a day's window, i.e. "this country
has no cities" for everybody for a day. Every error response of a route under a shared rule
carries a `Cache-Control` of its own: `no-store, must-revalidate` where a retry is cheap, a short
window where a failure is expensive to repeat. The OG route is the second kind: a card that fails
every time would otherwise be rendered for every crawler that asks, so its 500 carries
`s-maxage=300` — at most one render per URL every five minutes, and not a month of a frozen error.

## A shared answer is shared

The other direction costs function time: an answer that is the same for every visitor and answers
`no-store` is a function invocation per page view and per poll. `/api/parks/near` (the park's own
coordinates, one URL per park) and `/api/analytics/{ticker,realtime,geo-live}` (one URL for every
homepage and hub visitor) were. How much a window saves follows the requests per URL inside it:
the analytics URLs collapse well, a park's `near` URL only for parks with several visitors a
minute. Both carry the 60 s window of
`/api/parks/live` now, in the handler and in `next.config.ts` alike (the two halves must match —
see `lib/api/cdn-cache-headers.ts`). What stays `no-store` is what depends on the visitor
(`/api/nearby`, which geolocates the request IP; `/api/favorites`) or is deliberately live (the
park poll).
