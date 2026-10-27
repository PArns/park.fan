# A day in the park has a byte budget (REQUIREMENT)

Someone standing in a park opens the park page on a phone, on a network that drops to 3G behind a
building, and keeps the tab open most of the day. Two numbers decide whether the page works for
them, and neither is the Lighthouse score: **how long until the first live wait time is on screen**,
and **how many bytes the day costs**. The park page is held to the ceilings below; a change that
moves a number past its ceiling needs a reason in the pull request, with the numbers before and
after.

| What                                     | Measured (2026-09-24) |      Ceiling |
| ---------------------------------------- | --------------------: | -----------: |
| First live wait time, Slow 4G            |                1.96 s |        2.5 s |
| First live wait time, 3G                 |                6.43 s |        7.0 s |
| First visit, on the wire                 |                847 KB |       850 KB |
| … of which JavaScript (gzip)             |                549 KB |       550 KB |
| … of which the document (gzip)           |                105 KB |       110 KB |
| Lean live poll (brotli)                  |                4.5 KB |       5.0 KB |
| Full live poll, `?full=1` (brotli)       |                5.9 KB |       6.5 KB |
| One hour of polling, tab in front        |                 66 KB |        70 KB |
| Coming back to the tab                   |                8.5 KB |        10 KB |
| **A day in the park** (projection below) |          **1,594 KB** | **1,700 KB** |

Phantasialand, `/de`, 360 × 780, `isMobile`, `hasTouch`, DPR 2, cache disabled, CPU 4× for the
throttled rows, against `pnpm build && pnpm start` on `localhost`, cache-busted URL, park open. The
ceilings sit just above the measurements on purpose: they guard against regressions and are not a
target. The table predates the planner split below; re-measure before lowering a ceiling.

## Why these numbers

- **The document is the critical path.** The wait times are in the server-rendered HTML, so on every
  profile the first one lands within 150 ms of the first contentful paint. The JavaScript decides
  when the page answers a tap: on 3G, `load` is at 23.4 s, 17 s after the first wait is visible.
- **A day is the upper bound a data plan has to cover**: first visit 847 KB, 90 lean polls (405 KB),
  18 full polls every 30 minutes (106 KB), the neighbouring parks' status (9 KB), the nowcast every
  15 minutes (29 KB) and coming back to the tab twice an hour (144 KB). A hidden tab requests
  nothing: React Query stops `refetchInterval` while `document.visibilityState` is `hidden`.
- Three items nobody in the park needs were cut after the measurement: the trip planner's code is
  fetched only once the panel is wanted (`PlannerLauncher`, about −57 KB of script on the park
  page), each ride's `park` key no longer leaves the poll, and `/api/parks/near` is polled every
  30 minutes only while its section is on screen (`useParkNeighbors(…, active)`). The `parks`
  translation namespace still ships whole
  ([the page render is the bigger half](the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md)).
  The other day-stable fields in the poll (`name`, `slug`, `land`, the photo fields) stay, because
  they let a ride that appeared since the render draw at all.

## How to measure it

- Against `pnpm build && pnpm start` on `localhost`, never `next dev`. Cache-busted URL
  (`?cb=<random>`), browser cache disabled over CDP (`Network.setCacheDisabled`).
- "First live wait time" is the first text node matching a wait (`10 min`) that a `MutationObserver`,
  installed before navigation, sees.
- Bytes on the wire are CDP's `Network.loadingFinished.encodedDataLength`, not the body size.
- **`next start` does not compress the `/api/*` proxy responses** (pages and static chunks it does);
  production sends them brotli through Cloudflare. A local poll reads 41.8 KB on the wire where
  production sends about 4.5 KB, so weigh an API body with brotli yourself (quality 4 here).
- Throttle with CDP `Network.emulateNetworkConditions` and `Emulation.setCPUThrottlingRate` (4×),
  Chrome's presets: Slow 4G 562.5 ms / 1.44 Mbit/s, 3G 2,000 ms / 400 kbit/s.
- Polls: install `page.clock` before navigation and `runFor(5 * 60_000)`. The nowcast schedules
  itself on the backend's `nextUpdateAt` and falls back to 60 s once that is past, which under a fake
  clock is always; count it at the backend's 15 minutes.
- A hidden tab: override `document.visibilityState` and dispatch `visibilitychange` on `window` as
  well as `document`, where React Query's `focusManager` listens.
- `node scripts/measure-api-calls.mjs --only park` lists the requests; it counts uncompressed bodies.
