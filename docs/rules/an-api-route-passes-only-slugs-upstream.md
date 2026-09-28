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
