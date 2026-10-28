# CDN caching

The two caches in front of the app, Vercel's CDN and Cloudflare: the Cloudflare rules, why a page's
edge window is written as `CDN-Cache-Control`, the windows per route, the purge after a deploy and
how to measure any of it. Open it before changing a header rule in `next.config.ts`, a route
handler's `Cache-Control` or the Cloudflare dashboard. What the app caches itself is in
[caching strategy](caching-strategy.md).

## Two caches, two headers

Cloudflare sits in front of Vercel. `cf-cache-status` is Cloudflare, `x-vercel-cache` is Vercel;
read both. `BYPASS` at Cloudflare with `HIT` at Vercel costs transfer but no CPU; a miss at both on
a `force-dynamic` page is a render. On a Cloudflare `HIT` the `x-vercel-cache` value is the one
frozen into the copy at fill time. Cloudflare's Tiered Cache runs with Smart Topology (dashboard,
2026-09-03).

## Cloudflare rules

These live in the Cloudflare dashboard, not in this repo; this section is their record.

**"Frontend cache"** decides every page:

```
http.host eq "park.fan"
  and not starts_with(http.request.uri.path, "/api/")
  and not starts_with(http.request.uri.path, "/admin/")
```

| Setting                        | Value                                                    |
| ------------------------------ | -------------------------------------------------------- |
| Edge TTL                       | Use cache-control header if present, bypass cache if not |
| Status code TTL                | 308 → 12 h, 301 → 12 h, 404 → 1 h                        |
| Serve stale while revalidating | on                                                       |
| Vary                           | Normalize values                                         |

Cloudflare reads `Cloudflare-CDN-Cache-Control`, then `CDN-Cache-Control`, then `Cache-Control`,
so "bypass if not" only bypasses a response that names no window anywhere: static assets keep their
`immutable` year, pages with a `CDN-Cache-Control` from `next.config.ts` are cached for it, and
`/search` (`no-store`) is bypassed. So **this repo decides what is cached, and it shows in the diff**.
A page under the rule without a window of its own falls back to the page's `no-store` and is not
cached at all, which on a `force-dynamic` route is a render per request (`pnpm test:edge-windows`).

The `/admin/` exclusion has a trailing slash and so does not match `/admin` itself; harmless, since
that page sends `max-age=0, must-revalidate` and carries no data, but drop the slash next time the
rule is edited.

**The `/api/` rule** (listed in the dashboard as "API caching – Frontend") matches
`starts_with "/api/"` and `GET`, and uses the same "use cache-control header if present, bypass
cache if not".
Every `/api` route therefore carries its own window, and a route that must not be shared protects
itself by answering `no-store`.

Traps, each paid for once:

- **Cloudflare's `wildcard` matches across `/`.** A page matcher like `/*/parks/*` also catches
  `/api/parks/<geo>/<park>`; together with an "ignore cache-control" TTL that served the live poll
  two hours old. Keep the `/api/` exclusion.
- **Keep the query string in the cache key.** Next tells RSC payloads from HTML with the `_rsc`
  parameter because CDNs ignore `Vary`; strip it and a prefetch payload is served as a document.
- **Never set Vary to "Bypass caching".** A separate `/_next` rule did, and every `/_next/image`
  (`Vary: Accept`) was `BYPASS`: 20 images, about 994 KB, on every ride page against 57 KB of HTML.
  With "Normalize values" each format (AVIF, WebP, JPEG) gets its own entry, which is what the
  optimizer needs. Next sends `Vary: Accept` even with `images.formats: []`, so the fix is in
  Cloudflare, not in the code.
- **A WAF skip rule lets `POST /api/webhooks/` through** the bot and challenge products only (a
  rate limit on the path still applies). Without it the deploy webhook below meets a challenge.

## Why a page's window is `CDN-Cache-Control`

A `force-dynamic` page answers `private, no-cache, no-store, max-age=0, must-revalidate`, and
nothing at the origin can change that. A `headers()` rule overrides `Cache-Control` for a route
handler, never for a dynamic page: deployed to production in August 2026 (confirmed by the
`data-dpl-id` in the HTML changing first), a marker header on the same `source` arrived on the park
URL and `Cache-Control` came back as the page's own. A header set in `proxy.ts` lost the same way.
Do not try again with `Cache-Control`; the only origin-side lever left would be giving up
`force-dynamic`, which brings back the per-URL ISR writes
([caching strategy](caching-strategy.md#what-an-isr-write-costs)). The alternative at Cloudflare, a
rule that ignores `Cache-Control` and sets its own TTL, puts the number in a dashboard nobody can
diff and has to exclude `/api/` by hand, or it serves the live wait-time poll from the page cache.

`CDN-Cache-Control` (RFC 9213) is a different key. Vercel's CDN honours it and forwards it, and
Cloudflare reads it before `Cache-Control`. So pages carry **only** `CDN-Cache-Control` (`edgeCache()`
in `next.config.ts`): the shared caches get the window, and a reader's browser keeps the page's own
`no-store`.

API routes send both headers (`sharedCache()` in `next.config.ts`, `cdnCacheHeaders()` in
`lib/api/cdn-cache-headers.ts`), for a second reason: Vercel strips `s-maxage` and
`stale-while-revalidate` from `Cache-Control` unless a `CDN-Cache-Control` rides along. Before that
fix Cloudflare saw a bare `public`, fell back to its own default TTL and held a ride's live wait for
40 minutes (`age: 2396` on a 5-minute route, 2026-08-25). Check a window by reading `age` off a
second request, not by reading `cf-cache-status`.

A shared copy must carry nothing visitor-specific. The page trees read no `cookies()`, `headers()`
or IP; temperatures are rendered in both units and switched by CSS. `proxy.ts` deletes the
`Set-Cookie` next-intl writes (`NEXT_LOCALE`), because a response with one is never shared-cached;
an explicit language switch persists the cookie from the browser (`lib/i18n/remember-locale.ts`).
The visitor's IP is read only by route handlers under `/api/` (`/api/nearby`, `/api/favorites`,
`/api/contribute/start`, the trips and push relays, the admin session), all `no-store` and outside
the page rule. Give `/api/nearby` an `s-maxage` and one visitor's location answer is served to the
next.

## Edge windows

The windows are in `next.config.ts` (`headers()`), and that file is the reference; this table is the
reasoning. The shape is a **short `s-maxage` with a short `stale-while-revalidate`**: the oldest copy
a reader can be served is the **sum** of the two, and on a long-tail URL the crawler is usually the
only visitor, so a long stale window is exactly what the crawler sees.

| Route                                                                                                | `s-maxage` + SWR | Why                                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Homepage, blog and news (all), glossary, guides, planner, fancast, legal pages, contribute, geo hubs | 1 day + 1 h      | `CONTENT_WINDOW`: content moves with a deploy, and every deploy purges Cloudflare                                           |
| Sitemaps, feeds, `robots.txt`, `llms.txt`, `license.xml`, `rss.xml`, the web manifest                | 1 day + 1 h      | `MACHINE_WINDOW`                                                                                                            |
| Park page                                                                                            | 1 h + 1 h        | today's date sits in its FAQ text and 49 times in its JSON-LD, and the backend's status-flip tag push must not be swallowed |
| Ride page                                                                                            | 1 day + 1 h      | its only self-dating element is an "updated" clock time                                                                     |
| Calendar month (`…/<segment>/:year/:month`)                                                          | 7 days + 1 h     | the HTML is a shell; the grid and today's band are client-loaded with their own windows                                     |
| Calendar hub                                                                                         | 1 h + 1 h        | its title and `<h1>` name the current month, so a day-old copy is wrong on the 1st                                          |
| `average-wait-times`, `with-kids`                                                                    | 1 day + 1 h      | nothing live; the data behind them changes daily                                                                            |
| `/[locale]/search`                                                                                   | `no-store`       | a query-keyed page shared across readers is a privacy question                                                              |

Ride-page arithmetic (2026-09-03), at a crawl interval of about 42 h per ride URL: 48 h + 24 h
SWR allowed a 72-hour-old copy under a title that says "live" for a hit ceiling of about 53 %;
24 h + 1 h caps the age at 25 h for a ceiling of about 36 %. Caching itself costs no ranking: a
`HIT` is the same 200 to Googlebot, only faster. Raising the ride window again wants a Cloudflare
invalidation in `/api/revalidate` first, because nothing reaches Cloudflare between deploys.

What decided the park page and the calendar (measured 2026-09-03):

- **The park page is day-bound in its content**, not in a phrasing: a visible sentence naming the
  weekday („Heute, Donnerstag, 3. September 2026 …", the shape that makes Google print „vor 6 Tagen"
  beside a result), today's date 49 times in its JSON-LD (`AmusementPark`, 36 in the FAQ graph, four
  `Event` blocks) and today's opening hours, none of it client-replaced. Every page that moved to a
  day carries the date zero times. An hour of stale, not a day: 1 h + 24 h would serve the day-old
  FAQ date the hour exists to prevent.
- **The calendar month** has 5,718 URLs against the ride route's 42,912, 3.81 requests per URL per
  day against 0.70, and was the only route whose hit rate moved (12 % → 22 %): a wider window
  converts into hits only where the same URL comes back inside it. A month URL names its month, so
  standing never makes it show the wrong one.
- **The calendar hub** renders the current month in its `<title>`, its `<h1>` and eight places in
  the markup, none client-replaced, so a copy made on 30 September would be served on 1 October
  under a heading that says September. A month-free title would let the hub take a day; it was not
  judged worth an SEO title change.

### API routes

Every cacheable `/api` route is listed in `next.config.ts` with **exactly** the value its handler
returns, after the blanket `/api/:path*` `no-store` rule; a route whose handler answers `no-store`
is not listed. Both halves are needed because the two runtimes disagree: on Vercel a handler's
`Cache-Control` wins over a `headers()` rule, under `next dev` and `next start` the rule wins. Two
sources resolving in opposite directions is how the attraction detail served 600 s for months while
the config said 300. Change one half, change the other. A rule matches a path, never a query string,
so a response that needs its own window gets its own path (`…/calendar/hourly`, `…/ride-stats`).

Windows with a reason worth knowing:

- **Live park poll** (`/api/parks/<geo>/<park>`): 30 s shared (`LIVE_POLL_CACHE_CONTROL`), because
  every visitor of a park gets the same bytes and the API moves every five minutes. Failures and a
  simulated `?state=` answer `no-store`.
- **Attraction detail** (`…/attractions/:attraction`): 300 s + 60 s SWR. 300 s is the backend's own
  window (`HttpCacheInterceptor(300)`), and SWR adds to the age a reader can be served, so 300 + 300
  would have shown a ten-minute-old wait under "live".
- **Region cards, nearby status, analytics, search** (`/api/parks/live`, `/api/parks/near`,
  `/api/analytics/*`, `/api/search`): 60 s; the same answer for everybody asking the same thing.
- **Errors** answer `NO_STORE` (`lib/api/cdn-cache-headers.ts`), or they would inherit the route's
  shared window ([the rule](../rules/an-api-route-passes-only-slugs-upstream.md)).

## A deploy purges Cloudflare

After every production deploy, `app/api/webhooks/vercel-deploy/route.ts` deletes everything
Cloudflare holds for the host `park.fan` (`POST /zones/:zone/purge_cache` with
`{"hosts":["park.fan"]}`). Without it a deploy stays invisible for as long as a page's edge window
runs.

- **Purge, not invalidate.** An invalidation keeps the entries, and with stale-while-revalidate
  Cloudflare serves each once more per PoP while it refreshes; for a news post that reader is the
  one who came for it. A purge costs one origin fetch per page and PoP: a build-served answer for
  the homepage, hubs and listings, a render for the `force-dynamic` pages, never an ISR write.
- **The host, not the zone.** `api.park.fan` is in the same zone, and its cache is the backend's.
- **When.** On Vercel's `deployment.promoted` webhook, which fires once the production domains point
  at the new deployment (after the automatic promote and after `vercel promote`). At build time
  park.fan still serves the old deployment, and Cloudflare would refill from it. Merges in a row
  become one build ([deploys](../development/deploys.md)), so they purge once.
- **What it does not reach.** A change between deploys (a curated correction from the backend), a
  browser's own copy, and an instant rollback, which sends no `deployment.promoted`; promote the old
  deployment instead, or purge by hand.

Purge by hostname is on every Cloudflare plan; the Free plan allows 5 such requests a minute
([Cloudflare](https://developers.cloudflare.com/cache/how-to/purge-cache/)).

### Setup

1. Cloudflare: an API token with **Zone → Cache Purge → Purge** on the zone `park.fan`; the zone ID
   is on the zone's overview page.
2. Vercel, project park.fan, Production: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`. Without
   them the route answers 503.
3. Vercel, team settings → Webhooks: event **Deployment Promoted**, project park.fan, URL
   `https://park.fan/api/webhooks/vercel-deploy`; its secret goes into
   `VERCEL_DEPLOY_WEBHOOK_SECRET`. The route answers 403 when `x-vercel-signature` does not match
   and ignores a delivery whose `payload.deployment.id` is not the deployment answering it
   (`VERCEL_DEPLOYMENT_ID`). Vercel signs no timestamp, so a captured delivery can be replayed, but
   only until the next deploy.
4. Redeploy, so the variables reach a deployment; its promote is the first run.

**Checking it.** The webhook's delivery log in Vercel shows Cloudflare's answer (`"success": true`).
A cached URL then answers `MISS` once (`EXPIRED` with Tiered Cache) and `HIT` after, with an `age`
that starts at the purge and a `data-dpl-id` in the HTML naming the new deployment. A 403 challenge
page in the delivery log means the WAF stopped Vercel's request.

**Known limit:** only a failed purge is logged (`Cloudflare purge_cache <status>`, with the zone and
the token's prefix and length), and a cloud container gets Cloudflare's `403` challenge, so the check
above has to run from an ordinary network. That a promote really purges is not proven yet: PAR-1125.

## Measuring

`scripts/check-cdn-cache.sh [headers|cache|hitrate|redirect] [base-url]` reads the `/*/parks/*`
family from outside. Two kinds of measurement, and mixing them up is the usual mistake:

- **What the origin declares** (`headers`) needs a cache-buster (`?cb=$RANDOM`), or you read
  Cloudflare's copy. A stale copy lies in the direction that makes you stop looking.
- **What Cloudflare does** (`cache`, `hitrate`) must not have one: the second fetch of the same URL
  is the measurement.

Traps:

- park.fan sits behind a Cloudflare challenge; from a shell every request answers 403 unless
  `CDN_CHECK_QUERY` carries the bypass fragment from the runner playbook (never in this public
  repo). That fragment is part of the cache key, so `cache` and `hitrate` then read the bypass URL's
  entry, not a visitor's.
- `hitrate` samples 40 random sitemap URLs, which under a crawler sweep are almost all the
  once-a-sweep long tail. It is a lower bound: compare before and after on the same sample, never
  read it as the site's hit rate. Cloudflare's own Caching → Overview read 62 % served by Cloudflare
  on 2026-09-03, while the sample said 10 %; 7.78k of those 13.35k requests were `api.park.fan`.
- `curl -I` sends `HEAD`, which does not reliably fill Cloudflare's cache: 20 image URLs read 1/20
  `HIT` by `HEAD` and 10/10 by `GET`. `HEAD` for headers, `GET` for cache behaviour.
- `--compressed` does not tell the wire size of a response that ignores `Accept-Encoding`, such as
  a redirect thrown from a render.
- When polling for a deploy, match the number that changes: `*86400*` matched an unchanged
  `stale-while-revalidate=86400` and reported a deploy that had not landed.
- Vercel logs and the Observability tab are not reachable from a runner; everything here is
  measured with `curl` from outside, from a single Cloudflare colo.

## Related

- [Caching strategy](caching-strategy.md): rendering per route, Data Cache windows, ISR writes
- [Optimization](../optimization/README.md): what the edge hit rate does to the bill
- [Deploys](../development/deploys.md): when production builds run
