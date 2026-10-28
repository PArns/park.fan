# Optimization: what park.fan costs, and why

The cost track for the Vercel and Cloudflare bill: what the bill is made of, the model that explains
it, the levers still open and the traps that cost earlier sessions their measurements. Read this
page first, then the decision log.

- [decisions.md](decisions.md): one entry per accepted, rejected or deferred change, with the
  measurement that decided it, starting from the 2026-09-01 baseline.
- [compute-audit.md](compute-audit.md): what one origin request costs in Active CPU and memory, per
  route (2026-10-26). Result: no code lever worth a pull request.
- How the edge caches are configured: [CDN caching](../architecture/cdn-caching.md). What the app
  caches itself and what an ISR write costs: [caching strategy](../architecture/caching-strategy.md).
- When production builds run: [deploys](../development/deploys.md).

## What the bill is made of

The week of 18–25 October 2026, per line, is in [compute-audit.md](compute-audit.md#the-bill-for-one-week):
Build CPU minutes, ISR writes, origin transfer and Active CPU are each $2–3.5 a week, memory and
invocations below a dollar. Build CPU minutes were the largest line for 19–26 October, which is what
the [deploy debounce](decisions.md#2026-10-26--accepted-production-deploys-wait-in-github-actions-not-in-vercel)
answers.

On 2026-09-03, the last time the bill was split by what caching can reach, Active CPU, origin
transfer and invocations were about 55 % of it. Two dashboard products were priced against that and
rejected: **Cache Reserve** (~$9 a month against $6–10 of savings) and **Smart Shield + Argo**
($5 a month + $0.10/GB, which per Cloudflare's own docs lowers latency rather than origin requests,
for traffic that is mostly crawlers).

## The model

**Cost ≈ invocations × (CPU + bytes).** Rebuilt from measured invocations, ~150 ms of render and
~57 kB per response, both invoice lines came out within 15 %
([baseline](decisions.md#2026-09-01--baseline-the-bill-is-a-crawler-sweep-of-the-url-surface)). A
change that lowers none of invocations, CPU per invocation or bytes per invocation lowers nothing.

**Invocations follow the URL count, not the audience.** The traffic is a crawler sweep: on
2026-09-01 the ride and calendar routes were 74 % of requests, 87 % missed every cache, and Dutch
outweighed German 6 : 1 on a German-first site. A cached entry is read a second time only if its URL
comes back inside its window, so the hit rate follows requests per URL:

|            |   URLs | Requests a day | Per URL a day | Cloudflare `HIT` |
| ---------- | -----: | -------------: | ------------: | ---------------: |
| Ride pages | 42,912 |        ~30,200 |          0.70 |             10 % |
| Calendar   |  5,718 |        ~21,800 |          3.81 |             22 % |

(2026-09-03.) The calendar's rate doubled when its sitemap was cut, with no change to its window.
A ride URL is crawled about every 42 h, so no window short enough to stay honest fills that cache;
what is left on that route are decisions about the crawl surface, not cache settings. Per render,
the ride route is 55 % of measured CPU, the calendar 25 % and the park page 12 %
([compute audit](compute-audit.md#the-three-most-expensive-routes)).

## Open levers

The two largest are decisions, not refactors, and no code lever comes near them. Open work:
PAR-1122 (the crawl surface, about 43,000 ride URLs that are 7,152 rides × 6 locales, and the AI
crawlers' share of the sweep, plus the measurements only the dashboards give), PAR-1123 (the
frontend code levers and the last on-demand ISR routes), PAR-1124 (a `hasDayCurve` flag, so a ride
page stops asking for a day curve that answers 404 for about 92 % of rides).

Not a lever: the header's mega-menu is the largest fixed part of every page's markup and of its
render time, and it is server-rendered for the link graph on purpose
([header rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md)).

## Traps

- **The CDN tab and the Compute tab measure different things.** A CPU change is invisible in the
  CDN tab by construction; check that a change could reach a line before calling it "no effect".
  Per-route CPU, peak memory and cold-start type need Observability Plus.
- **Read the time the cache needs.** A new window shows up in the hit rate only after its URLs
  come back inside it: about two days on the ride route. The early signal is a rising maximum `age`.
- **A sitemap cut pays off over weeks**, and in the meantime the orphaned URLs are still crawled and
  answer redirects, which cost more than the page they replace unless they are cached and bodyless.
- **"Cache none" on `/contribute` in the Cloudflare dashboard** is mostly Cloudflare's own bot
  challenges (`403`, `cf-mitigated: challenge`, a unique nonce each): uncacheable, and they never
  reach Vercel.
- **Vercel's logs and Observability are not reachable from a runner**, and its log API carries no
  user agent. Everything not read off a dashboard was measured from outside with `curl`; the
  measuring traps are in [CDN caching](../architecture/cdn-caching.md#measuring).
