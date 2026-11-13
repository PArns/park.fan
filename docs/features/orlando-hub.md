# The Orlando hub

`/<locale>/orlando` and its month pages `/<locale>/orlando/<yyyy>/<m>`: which of Orlando's sixteen
parks has the shortest lines on which day, the best time of year, a planner for a whole trip and each
park's best days. Open this page before changing the hub's route, its chapters, the day sheet, its
ways in or the data it reads. The trip planner in chapter 03 has its own page,
[orlando-planner](orlando-planner.md); the API contract is the API's
`docs/frontend/trip-regions.md` (and `trip-regions-when.md` for `/when`).

## URLs

The route is `app/[locale]/orlando/[[...date]]/page.tsx`, `force-dynamic` behind its edge window
(`next.config.ts`: the hub an hour, a month twelve hours). "orlando" is the city's name in every
language, so it has no segment family in `lib/i18n/localized-path.ts` and no rewrite; every link is
built by `orlandoPath` / `orlandoMonthHref` (`lib/orlando/paths.ts`).

| Request                                | Answer                                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| `/orlando`                             | the next 30 days from Orlando's today; canonical for itself |
| the current month's URL                | 200, canonical pointing at the hub                          |
| one of the next eleven months          | 200, canonical itself, in the sitemap                       |
| a padded month (`/2027/03`)            | 308 to `/2027/3`, from `proxy.ts` (`orlandoRedirect`)       |
| a month outside the twelve             | 308 to the hub, from `proxy.ts`                             |
| anything else under `/orlando/<a>/<b>` | 404, except the best-time pages, which have their own route |
| any query string (`?from=…#planner`)   | the same page, `noindex`, canonical without the query       |

"Today" is Orlando's (`orlandoToday`, `currentOrlandoMonth`, America/New_York), never the server's.
The month rule matches digits only (`:year(\\d{4})/:month(\\d{1,2})`), so
`/orlando/<best-time segment>/<resort>` keeps its own window; `pnpm test:edge-windows` and
`pnpm test:orlando-hub` both assert it. The best-time pages' path is `orlandoBestTimePath(locale,
resort?)`, the one function both branches link through.

## Data

`lib/orlando/api.ts` reads the region (a day), `/calendar`, `/best-days` and `/when` (an hour) on
the server with the site's data key, through the Data Cache under `trip-region:orlando`. The browser
asks the keyed routes through `app/api/trip-regions/[...path]/route.ts`, which answers this site's
pages only and forwards each route's own query names (`lib/orlando/relay.ts`). The shapes are
`lib/orlando/types.ts`; everything derived from them is `lib/orlando/hub-data.ts`.

- **One figure per surface.** A square, a chip, the first answer and the day sheet all print
  `headlinerWait`, "the big rides' wait at their busiest". Parks are compared by it; the colour is
  the park's day against its own typical day. There is no hourly curve on the hub.
- **The pick is the API's.** `best` per resort is picked on an hours-weighted cost, so a park that
  closes early for day guests loses to a full day with a similar wait. When `bestWhy` says
  `closes_early_elsewhere`, the first answer adds "(Magic Kingdom closes at 6 pm for an evening
  event)". The phone list's top chip and the day sheet's first row follow `best` too
  (`rankGroupParks`).
- **An early close is never silent.** `closesEarly` (or a ticketed evening) draws the folded corner
  on a square, puts "closes 6 pm" in its accessible name, and the best-days chips carry the close
  time.
- **A figure without published hours counts.** Past a park's published schedule a day is `UNKNOWN`
  but carries the forecast or last year's figure. It is ranked (`isRankable`: not closed, has a
  figure), drawn with a small dot (`NO_HOURS_DOT`), and the sheet says "No hours published yet; the
  figure is the forecast, hours are not counted". Only a closed day or one without a figure is
  empty, so the month pages past Disney's and Universal's schedules keep their content.
- **A resort's busiest days** are the highest mean over its parks with a figure, never the
  hours-weighted pick, so a day most of its parks call quiet is never one of its busiest.
- **School holidays are US ones, and say so.** Lanes, reasons and the best-time pages name "US
  school holidays"; break names go through `translateHolidayName(cleanBreakName(…))`.
- **Three bases.** `forecast` plain, `long_range` labelled "outlook", `last_year` dashed and
  labelled "last year", with a banner where a window has such days. A last-year day is never offered
  as a pick.

## Simple first, more on request

| Level | What                        | Where                                                                            |
| ----- | --------------------------- | -------------------------------------------------------------------------------- |
| 0     | the answer                  | the hero: each resort's shortest line on one named day, the button               |
| 1     | the overview                | the matrix or the day list, minutes only; the one-line key; lanes closed         |
| 2     | everything else about a day | the day sheet: ranked parks, hours, perks, evenings, seasons, travel, five rides |
| 3     | the day itself              | "Plan this day" opens the day planner's wizard on that park and date             |

The first phone screen holds the H1, the lead, the answer and the button. The answer names its day
("Thu 12 Nov, Orlando time"), never "today", because a cached copy outlives midnight. After every
pick has closed it is about tomorrow (`glanceDay`). A resort with one park that has a figure
(SeaWorld) is left out of it.

## Chapters

1. **01 Which park on which day** (`HubCalendar`, client). A phone gets a list of days, per resort
   the top park and "+n more"; from `lg` a `<table role="grid">` with a caption, `scope`d headers,
   one tab stop and arrow keys. On the hub both are server-rendered for the first seven days and the rest
   of the window loads through the relay; a month page server-renders its whole month. Rows never
   change with the data, so the box is the rendered one. The resort filter is urgent, the grid
   follows through `useDeferredValue`. The events sit under it as one closed `<details>` row. A tap
   opens `HubDaySheet` (bottom sheet on a phone, side panel on a desktop). The month index
   (`HubMonthIndex`, a labelled `<nav>` with the park calendar's chips) links all twelve months.
2. **02 Best time to visit Orlando in <year>** (`HubWhen`): a teaser of the best-time pages. It sends
   the best-time page's own query (`bestTimeWhenQuery`: same range, days, parks, limit and a gap of
   the trip's length), so both read one cached answer. The three quietest 10-day windows for the seven headliner parks from `/when`, as a sentence and three
   cards with "Plan these dates" (`?from=&to=#planner`, `rel="nofollow"`), and the link to
   `orlandoBestTimePath(locale)`. The year strip, the weeks and their questions are the best-time
   pages', so the two do not compete for one query.
3. **03 Plan your trip**: `PlannerChapterSlot`, `id="planner"`, where `OrlandoPlanner` mounts. Empty
   until the visitor gives dates.
4. **04 Best days for each park** (`HubBestDays`): per park three quiet days as chips, "more" opens
   the reasons and the busiest days, and "<park> Crowd Calendar" links the park's calendar.
5. **05 How the forecast works** (`HubMethod`): a summary and five `<details>`.
6. **Questions** (`HubFaq` → `FaqList`): answers built from the same data; a question whose data is
   missing is left out.
7. **`LandingNextSteps`**: plan the trip, the Epic Universe Crowd Calendar, the best-time page.

The intro carries the window in sentences per resort (`HubMonthSummary`): quietest dates with their
park, the busiest, the events. It is what makes one month's HTML differ from the next.

On the hub alone, the lead and the intro's first paragraph (`orlando.lead`, `orlando.opening`) are the
opening about Orlando itself. Each figure in them has a source: the park counts are the region
route's `parks[]` (eight theme parks and four water parks in Orlando, Discovery Cove, three day
trips), and the minutes are the API's travel matrix without traffic, the Magic Kingdom transfer from
`regions.ts` included. A change to the region or a new matrix is a reason to re-read both strings.

## SEO

- Title and H1 carry each locale's term ("Orlando Crowd Calendar", „Orlando Besucherkalender“,
  "Orlando drukte-kalender", "Calendrier d'affluence Orlando", "Calendario de afluencia de Orlando",
  "Calendario affluenza Orlando"); the description carries the verdict, each resort's quietest date.
- Structured data: `BreadcrumbList`, a `Dataset` for the window (`ParkDatasetStructuredData` with
  Orlando's centre), `FAQPage` only from `FaqList`. No `Event` for festivals: they are third-party
  events without offers, and an `expected` season is no announcement
  ([analysis](../seo/analysis.md#no-event-from-the-show-list)).
- Everything below the answer that is "more" is a `<details>` or a hidden tab panel, so it is in the
  served HTML. The hub and the month pages are in `app/sitemap.ts` with hreflang and no `lastmod`: each forecast
  warmup rebuilds every month at once, a stamp rather than an observed change
  ([a lastmod is observed](../rules/a-lastmod-is-observed-never-stamped.md)).
- Internal links: hub → each park's crowd calendar ("<park> Crowd Calendar") and park page; park
  pages and calendars → the planner (the band, `rel="nofollow"` since it carries a plan); every
  page → `/orlando#planner` (the footer); month ↔ month; hub → day planner and best-time pages.

## Ways in

- The More menu's wide tile and the phone sheet's link (`lib/navigation/more-menu.ts`,
  `components/layout/more-menu-panel.tsx`, `components/layout/header.tsx`).
- `TripPlannerBand` (`components/orlando/trip-planner-band.tsx`), from every page about the
  region's parks into the planner. Which parks: the region route's `parks[]`, reduced by
  `tripRegionLinks` (`lib/orlando/trip-links.ts`) and read by `getTripRegionLinks` with a 1.5 s
  bound, so a slow read costs the band and never the page; no slug list here. Its variants:

  | Variant  | Where                                       | The link                                                                                 |
  | -------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
  | `park`   | a region park's page and crowd calendar     | „Magic Kingdom in deine Orlando-Reise einplanen": `parks=<slug>`, on a month page `when` |
  | `place`  | a city or country listing with region parks | „Reiseplaner öffnen": the bare chapter, the API's headliners                             |
  | `post`   | the end of a post about region parks        | one park as `park`, several preselected under „Reiseplaner öffnen"                       |
  | `search` | `/search` for a query that names the region | the bare chapter, as the palette's first row                                             |

  A month page of a park calendar sends its month as the When mode's search (`monthSearchRange`:
  from the park's today, at most a year ahead, nothing where the rest of the month is shorter than
  the ten-day trip). A link that carries a plan is `rel="nofollow"` and not prefetched, as the hub's
  own "Plan these dates" links are.

- The footer's tools: „Reiseplaner" (en "Trip planner") beside the day planner, which the English
  footer now calls "Day planner" as the panel does. The bare `/orlando#planner`, built without a
  region read, since the footer is on every page.
- `OrlandoHomeStop` on the homepage, data-free beyond the region's park list, because the homepage
  keeps a day at the edge.
- Parky's `plan_vacation` links `/orlando?from=…&to=…&parks=…#planner`.

## Checks

`pnpm test:orlando-hub` (window, redirects, relay allow-list, the pick and its clause, tomorrow
after close, lanes, summaries, ranges), `pnpm test:edge-windows`, and against a running build
`pnpm check:landing-pages` and `pnpm check:semantic-html`, which list `/de/orlando`, `/en/orlando`
and next month's page.
