# The crowd calendar

A park's wait-time calendar: one URL per month with a day grid of crowd levels, opening hours,
holidays and weather, a dialog per day, a two-day comparison and the "best time to visit" chapter on
top. Open this page before changing the calendar route, its month window, the grid, the day dialog,
the best-days section or the park page's old `#calendar` links. What it does not repeat:

- how a day's `status` and `crowdLevel` render and how `scheduleCoverage.to` cuts the window:
  [calendar status](../api/calendar-status-closed.md);
- what the calendar requests cost, the hourly curve's own route and the lean park payload:
  [API budget](../architecture/api-budget.md);
- which months are in the sitemap: [sitemaps](../seo/sitemaps.md#which-calendar-months-are-listed);
- the edge windows of the hub and the months: [CDN caching](../architecture/cdn-caching.md#edge-windows);
- the localized segment and its rewrite: [routing](../architecture/routing-and-urls.md#park-sub-pages).

## URLs and the month window

`app/[locale]/parks/[continent]/[country]/[city]/[park]/wait-time-calendar/[[...date]]/page.tsx`,
`force-dynamic`. The segment is localized (`PARK_CALENDAR_SEGMENTS`, `lib/parks/calendar-segments.ts`):
the hub is `…/<park>/wartezeiten-kalender`, a month `…/wartezeiten-kalender/2026/9`. Every link is
built by `parkCalendarPath` or `parkCalendarMonthHref`, which links the current month as the hub.

"Now" is the month in the **park's** timezone (`currentParkCalendarMonth(park.timezone)`), on the
server, in the proxy and in the inline redirect alike. The window is `PARK_CALENDAR_MONTH_SPAN`:
three months back, but never before the first complete month of the archive (`CALENDAR_DATA_START`,
2025-12-26, so January 2026), and twelve forward, cut at the month `scheduleCoverage.to` falls in.
`parkCalendarMonthsBack` / `parkCalendarMonthsForward` are the one source for the route, the month
index, the stepper, the sitemap and the proxy.

| Request                                       | Answer                                                          |
| --------------------------------------------- | --------------------------------------------------------------- |
| the hub                                       | the current month; canonical for it                             |
| the current month's own URL                   | 200, canonical pointing at the hub                              |
| a month in the window                         | 200, canonical itself                                           |
| a zero-padded month (`/2026/09`)              | 308 to `/2026/9`                                                |
| a well-formed month outside the window        | 308 to the hub, mostly from `proxy.ts` (`parkCalendarRedirect`) |
| anything else under the segment (`/2026/13`)  | 404                                                             |
| a stale geo path, a renamed or relocated park | 308 to the new park path, segment and month kept                |
| a park that closed for good                   | 308 to the park page                                            |

The proxy answers every month that is outside the window for any timezone and any coverage, so
only the edge months that depend on this park's zone or `scheduleCoverage.to` reach the render
([a redirect thrown from a render carries the layout as its body](../rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)).
`pnpm test:calendar-month` pins the window, both proxy edges and the month summary.

## What the page renders

Top to bottom: the park's title header (the `<h1>` names the month), the park header card with
`ParkTodayPanel` and `ParkNavTiles current="calendar"`, the best-days chapter, then
`ParkCalendarPanel`. The page ships `leanParkForCalendarShell(park)`, not the full park
([the page render is the bigger half of the API budget](../rules/the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md)).
Structured data: a `Dataset` for the month, a sub-page node pointing at the park and the
breadcrumbs, all keyed on the canonical URL.

**The best-days chapter** is one `<Suspense>` (`SeededBestDays`) holding two server fetches, both
bounded and `null` on a timeout:

- `getBestDaysCalendarSeed` → `ParkBestDaysSection`, which puts the "best time to visit" text into
  the first HTML and then runs its client queries behind `useLoadLast`
  ([park page loading priority](../rules/park-page-loading-priority.md)); a `null` seed falls back
  to its skeleton and the client fetch.
- `getCalendarMonthSeed` → `ParkCalendarMonthSummary`, sentences about the month on screen
  (`summarizeCalendarMonth`, `lib/parks/calendar-month-summary.ts`). It is what makes one month's
  HTML differ from the next, since the grid renders on the client. It names a quietest or busiest
  day only with at least `MIN_RATED_DAYS` (8) rated open days and at most `MAX_NAMED_DAYS` (3) tied
  at the extreme, and only a day that beats the month's median.

The same `ParkBestDaysSection` renders compact in a post's `best-days-widget`.

**`ParkCalendarPanel`** (client) holds the chapter heading, the month stepper, the legend, the
comparison switch, the grid and, under it, the month index. The stepper's two links live here and
not in the grid, so they are in the first byte; they stop where the window ends rather than point at
a 404. `ParkCalendarMonthIndex` (server) links every month of the window as a labelled `<nav>`, so
every month is one hop from every other.

**`ParkCalendarGrid`** is `ssr: false`: it formats against the browser clock and picks a week grid
(desktop) or a two-column list (phones) from the viewport. Its loading box is the grid's real height
for that month (`calendarGridReservation`, `lib/parks/calendar-grid-geometry.ts`;
[a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md)).
It fetches the month through `useCalendarData` (`/api/parks/<geo>/<park>/calendar?from=&to=`, fresh
for an hour in the browser, previous month kept on screen while the next loads). "Today" is the
park's date (`parkDayOf`).

## The day dialog

`ParkCalendarDayDetail`, a Radix dialog, so it works on touch where a tooltip does not. It opens on
a tap, or from a fragment on a month URL: `#2026-12-24` (`parkCalendarDayHash`) opens that day if it
is a real day of that month (`parkCalendarDayFromHash`). A fragment never reaches the server, so the
month stays one URL. The chevrons and ←/→ step a day; crossing into the next or previous month
navigates to that month's URL without scrolling to the top (`suppressScrollToTopFor`), and the
dialog shows the old day dimmed until the new month lands.

It shows the schedule (open, closed, not yet published; estimated hours marked), the ticket price,
the crowd level with the headliner forecast or, for a past day, the actual waits, local and
neighbouring-country holidays (names through `translateHolidayName`), the weather, an hour-by-hour
crowd chart for today and tomorrow only (`useCalendarDayHourly`, asked only while the dialog is
open), and "plan this day" for an open day from today on, which opens the trip planner.

**Comparing two days.** With the comparison switch on, two picks open `ParkCalendarComparison`. The
picks live in `dayComparisonStore` (`lib/parks/day-comparison-store.ts`), a module store keyed by
park slug, because a month change remounts the grid and a query parameter would re-render the route
on every pick.

## Ways in

- The park's nav tiles and the twelve-month outlook on the park page (`OutlookMonthStrip`: a month
  name links its month, a day its `#YYYY-MM-DD`).
- **Old `#calendar` links.** The calendar was once a tab of the park page, and `#calendar` and
  `#calendar-YYYY-MM` are still in search indexes and bookmarks. `CalendarHashRedirect`, an inline
  script on the park page, sends them to the calendar page with `location.replace` before the page
  hydrates, so the park page does not first start its own queries. It computes the park's current
  month in the browser, because the park page is cached, and sends a month outside the window to the
  hub. `useTabHashRouting` does the same after hydration, for client navigations, `hashchange` and a
  blocked script.

Tests: `pnpm test:calendar` (day and hourly helpers), `pnpm test:calendar-month`,
`pnpm test:calendar-park-projection`.
