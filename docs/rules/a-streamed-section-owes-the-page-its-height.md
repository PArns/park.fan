# A streamed section owes the page its height (REQUIREMENT)

A `<Suspense>` fallback reserves the height its content will take, per breakpoint, measured off the
real thing. `fallback={null}` is honest only when nothing renders below it. The park page buys TTFB
by streaming its slow parts, and the bill arrives as CLS, charged to whatever the visitor is looking
at when the boundary resolves. The same holds for anything that arrives after the first paint: a
client-only branch, a late query, a web font.

## The cases behind it

- **Synchronous data belongs inline, not behind a boundary.** The park page's blog section had
  `fallback={null}` and did no async work at all (`hasPublishedPosts` and `getPostsForPark` read the
  generated manifest), so the boundary deferred nothing and inserted 467 px out of thin air.
- **A fallback renders whatever needs no data**, not a grey box shaped like it. The best-days header
  is data-free and its height depends on how the park name wraps; sized `Skeleton` blocks were
  66–120 px short until the fallback rendered the real `ParkBestDaysHeader`.
- **On a prerendered route a boundary defers nothing.** The project runs no PPR, so the prerender
  waits for the boundary anyway and the resolved markup sits in the shipped `.html`, sorted to the
  end of the stream in a `<div hidden id="S:1">` and grafted in by `$RC()`. That is how the glossary
  term page, while it was still prerendered, dropped 396–1463 px into the column two seconds after
  paint. It renders per request now, and its rides are awaited inline out of the Data Cache, with no
  boundary.
- **Reserve the outcome most visitors get, not nothing.** `FavoritesSection` rendered `null` until it
  could read the cookie, and a 232 px band arrived on the homepage, every blog route and every
  glossary term. The pre-mount branch now holds the empty state's box with its two lines `invisible`.
  Test the answer, not its presence: `useFavorites` answers `{ parks: [], … }`, so a
  `!favoritesData` guard never fires.
- **Two states that never coexist still need one height.** The coaster player's 57 px transport bar
  hung on `ready && !failed` and appeared when three.js booted, on all 42 term pages that have one.
  It is mounted from the first render now, disabled until `ready`, and the dynamic-import
  placeholder reserves the same row.
- **When the open question is whether a block exists at all, answer it before the first byte.** 48 %
  of the 212 parks render no nearby section, so a fixed reservation would collapse ~500 px on half
  the catalog. `ParkPageShell` renders `NearbyParksSection` inline instead (its proximity fetch has
  its own one-week `revalidate`, which `force-dynamic` leaves alone, so the boundary had only been
  holding back a Data Cache read). Phantasialand's calendar, desktop, `--late --scroll=3192`:
  0.2472 → 0.0058; warm TTFB unchanged (19.9 → 19.5 ms).
- **A strip that is never in the first HTML holds a box, or goes where a box already is.** The rain
  and storm nowcast is fetched client-side by construction (`useWeatherNowcast`), and on parks with
  an alert it landed 2.5 s after paint and pushed the page down 134 px (0.1476 for a phone reader at
  `y=1300`). Reserving a box put an empty band on the 95 % of parks with no alert. Now
  `NowcastAlertToggle` (from `useNowcastAlert`) says it as one line in the today panel's fixed 45 px
  title row, and `NowcastAlertBanner` opens only on a press, which is not a layout shift
  (`hadRecentInput`). The toggle is `-my-[3px]` against its own padding and border so it never
  grows that row.
- **The geometry may not depend on data; the content may.** The header's "Auslastung heute" metric
  rendered only once it had a value, and every input deciding that lands after paint, so the band
  moved 340 → 419 px at 2 s. It is unconditional now, with a badge, a loading pill or an em dash in
  the same box. The same holds for **how** cells lay out: `crowdNow` and `forecastToday` sat in a
  `flex-wrap` row, and a value growing at ~4.4 s tipped the pair onto two rows (16 px). They are
  stacked at every width.
- **An order is geometry too.** Cloudflare serves the park page from a cache up to two hours old,
  and the first poll re-sorted the headliner grid by the live wait: 0.4967 on desktop at `y=1400`
  with one headliner shut between seed and poll (Cloudflare reported P75 0.588). `useAttractionFilter`
  ranks the headliners once, from the data the page painted with; later polls change what a card
  says, not where it stands.
- **A web font is late content too.** Geist is `display: swap`, and a label at a wrap edge changes
  its line count when Geist lands (~440 ms): „Wartezeiten-Kalender" grew the park tile row
  132 → 148 px. The row (`ParkTileGrid`) holds two lines for every label.
- **A placeholder matches the real thing per breakpoint, and in its tags.** `ParkCard` is a 100 px
  row below `sm` and 366 px above; one 360 px placeholder over-reserved a phone 2.4× and the featured
  grid collapsed 1284 px. The geometry diff pairs children by tag once their classes differ, so a
  `<div>` standing in for a `<p>`, or one child too many, misaligns the comparison (the featured
  parks skeleton read as a 731 px insertion nothing could account for).

Accepted: the school-holiday warning under the best-days grid is not reserved, because it renders on
few parks (6 of 27 sampled) and a reservation would leave an empty band on the rest. The header's
holiday band (`ParkHolidayRow`) needs none: it reads `initialData.schedule`, which
`leanParkForShell` keeps whole, so it is in the first HTML at full height.

## How to prove a fix

- **Diff the three states a visitor can observe**: fallback, server seed, settled client queries.
  The delta in block geometry is the shift. Seed → settled measured 0, so the client queries were
  never it.
- **Score it with `pnpm measure:cls --late`**, which replays the shell immediately and the streamed
  tail 1.5 s later, nothing throttled. It reproduced Cloudflare's 0.538 for the glossary page to
  within 0.005 on every run, where CPU throttling measured the same page 0.000 and 0.088 in two
  consecutive runs.
- **A score belongs to a reader position.** `--late` measures the top of the page and just under the
  block that grows most, and prints `y=` on every line: from `y=0` three park pages Cloudflare
  scores 0.98 read 0.0001–0.0002, while Islands of Adventure reads 1.3421 at `y=3346`.
- **Against `pnpm build && pnpm start`, at `localhost`**, never `next dev` and never `127.0.0.1`:
  both report a confident 0.0000 (`assertMeasurable` now refuses those runs). Why, and the
  harness's other flags, are in the header of `scripts/measure-cls.mjs`.
