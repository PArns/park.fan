# A day in the park has a byte budget (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

Someone standing in a park opens the park page on a phone, on a mobile network that drops to 3G
behind a building, and keeps the tab open for most of the day. Two numbers decide whether the page
works for them, and neither is the Lighthouse score: **how long until the first live wait time is
on screen**, and **how many bytes the day costs** (first visit, the 5-minute poll for nine hours,
and coming back to the tab). The park page is held to the budget below. A change that moves one of
these numbers past its ceiling needs a reason in the PR, and the numbers before and after.

## The budget

Park page, Phantasialand, `/de`, 360 × 780, `isMobile`, `hasTouch`, DPR 2, cache disabled, CPU 4×
for the throttled rows. Measured on 2026-09-24 against `pnpm build && pnpm start` on `localhost`
(`main` = `a95fbb6b`), cache-busted URL, park open.

| What                                     |     Measured |      Ceiling |
| ---------------------------------------- | -----------: | -----------: |
| First live wait time, Slow 4G            |       1.96 s |        2.5 s |
| First live wait time, 3G                 |       6.43 s |        7.0 s |
| First visit, on the wire                 |       847 KB |       850 KB |
| … of which JavaScript (gzip)             |       549 KB |       550 KB |
| … of which the document (gzip)           |       105 KB |       110 KB |
| Lean live poll (brotli)                  |       4.5 KB |       5.0 KB |
| Full live poll, `?full=1` (brotli)       |       5.9 KB |       6.5 KB |
| One hour of polling, tab in front        |        66 KB |        70 KB |
| Coming back to the tab                   |       8.5 KB |        10 KB |
| **A day in the park** (projection below) | **1,594 KB** | **1,700 KB** |

The ceilings sit just above today's figures on purpose. They are a floor against regressions, not
a target: the three items under [what the park does not need](#what-the-park-does-not-need) are
where the numbers go down.

"First live wait time" is the first text node matching a wait (`10 min`) that a `MutationObserver`
sees, installed before navigation, in `performance.now()`. The wait times are in the server-rendered
HTML, so on every profile it lands within 150 ms of the first contentful paint: **the document is
the critical path**, and the JavaScript is not. What the JavaScript costs is the time until the
page answers a tap. On 3G, `load` is at 23.4 s, 17 s after the first wait time is visible.

| Profile                         |    FCP | First wait |    DCL |    load |
| ------------------------------- | -----: | ---------: | -----: | ------: |
| Slow 4G (562.5 ms, 1.44 Mbit/s) | 1.83 s |     1.96 s | 4.18 s |  6.55 s |
| 3G (2,000 ms, 400 kbit/s)       | 6.29 s |     6.43 s | 9.28 s | 23.42 s |

The first visit on the wire: script 549 KB · document 105 KB · CSS 59 KB · fetch 74 KB (the API
proxy, uncompressed locally, see below) · fonts 29 KB · images 29 KB. The document itself is
845 KB raw, 68 KB brotli: the flight payload is 40.5 KB brotli of it, the markup 35.0 KB, inline
SVG (332 elements) 7.7 KB and JSON-LD 4.2 KB.

## A day in the park

Nine hours with the tab in front, plus coming back to it twice an hour. The two overlap in real
life (a hidden tab does not poll, see below), so this is the upper bound, which is the one a data
plan has to cover.

| Item                                                           | Per event | Events |      Per day |
| -------------------------------------------------------------- | --------: | -----: | -----------: |
| First visit                                                    |    847 KB |      1 |       847 KB |
| Lean live poll                                                 |    4.5 KB |     90 |       405 KB |
| Full live poll (every 30 min)                                  |    5.9 KB |     18 |       106 KB |
| `/api/parks/near` (neighbouring parks' status, every 5 min)    |    0.5 KB |    108 |        54 KB |
| `weather/nowcast` (every 15 min, the backend's `nextUpdateAt`) |    0.8 KB |     36 |        29 KB |
| Coming back to the tab                                         |    8.5 KB |     18 |       153 KB |
| **Total**                                                      |           |        | **1,594 KB** |

Coming back to the tab after 25 minutes fires five requests: the park `?full=1`, the nowcast,
`/api/parks/near`, `/api/nearby` and `/api/blog-latest/<locale>`. While the tab is hidden nothing
is requested: React Query stops `refetchInterval` when `document.visibilityState` is `hidden`.

A second page view the same day costs the document again (105 KB) and whatever JavaScript the new
route adds; the chunks already fetched come from the browser cache.

## What the park does not need

The three largest items that nobody standing in the park needs, measured, not guessed. Each has
its own ticket in the project "Im Park".

1. **The trip planner's code, on every first visit — 82 KB gzip.** `app/[locale]/layout.tsx`
   imports `PlannerLauncher`, which imports `PlannerFlyout` statically, so the whole planner ships
   with every page before anyone opens it. Four chunks carry it (38.2, 17.2, 14.8 and 11.6 KB
   gzip); they load on `/de/parks` as well as on the park page, and 59–94 % of their functions are
   never called during load. At 3G's 400 kbit/s that is 1.6 s of transfer before `load`.
2. **Day-stable fields in every live poll — 1.36 KB of 4.56 KB brotli, 30 %.** Each attraction in
   `LiveParkSnapshot` carries `name`, `slug`, `land`, `backgroundImage`, `backgroundPosition` and
   `park`, none of which can change between two polls. Over a day that is about 147 KB.
3. **The neighbouring parks' status, every 5 minutes — 108 requests, 54 KB a day.**
   `/api/parks/near` feeds the "parks nearby" overlay and polls as long as the tab is open. For
   someone inside a park it is the second most frequent request of the day, and on a phone each
   request wakes the radio.

Fourth, and already written down: the `parks` translation namespace ships whole (23.7 KB raw of the
route's messages, 11.6 KB brotli in the document), see
[the page render is the bigger half](the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md).

## How to measure it

- Against `pnpm build && pnpm start` on `localhost`, never `next dev`. Cache-busted URL
  (`?cb=<random>`), browser cache disabled over CDP (`Network.setCacheDisabled`).
- Bytes on the wire are CDP's `Network.loadingFinished.encodedDataLength`, not the response body.
- **`next start` does not compress the `/api/*` proxy responses**, pages and static chunks it does
  (gzip). Production sends them through Cloudflare with `content-encoding: br`. So a local poll reads
  41.8 KB on the wire where production sends about 4.5 KB. Weigh an API body with brotli yourself
  (the figures here are brotli quality 4) instead of reading the local transfer size.
- Throttle with CDP `Network.emulateNetworkConditions` and `Emulation.setCPUThrottlingRate` (4×),
  using Chrome's presets: Slow 4G 562.5 ms / 1.44 Mbit/s, 3G 2,000 ms / 400 kbit/s.
- Polls: install `page.clock` before navigation and `runFor(5 * 60_000)`. **The nowcast is the
  exception**: it schedules itself on the backend's `nextUpdateAt` and falls back to 60 s while
  that time is past. With a fake clock it is always past, so the harness sees a nowcast request
  every minute that production never sends. Count it at the backend's cadence (15 minutes).
- A hidden tab: override `document.visibilityState` and dispatch `visibilitychange` **on `window`**
  as well as on `document`, because that is where React Query's `focusManager` listens. Dispatched
  on `document` only, coming back to the tab looks like one request instead of five.
- `node scripts/measure-api-calls.mjs --only park` for the request list; it counts uncompressed
  bodies, so its KB are not wire bytes.
