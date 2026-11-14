# The Orlando hub

`/<locale>/orlando` and its month pages `/<locale>/orlando/<yyyy>/<m>`: which of Orlando's sixteen
parks has the shortest lines on which day, a planner for a whole trip, the best time of year and the
questions about the figure. Open this page before changing the hub's route, its chapters, the day sheet, its
ways in or the data it reads. The trip planner in chapter 03 has its own page,
[orlando-planner](orlando-planner.md); the API contract is the API's
`docs/frontend/trip-regions.md` (and `trip-regions-when.md` for `/when`).

## URLs

The route is every region's, `app/[locale]/trip-regions/[region]/[[...date]]/page.tsx`, reached by
a rewrite from the region's segment ([trip regions](trip-regions.md#one-route-folder-rewritten-from-each-regions-segments)),
`force-dynamic` behind its edge window (`next.config.ts`: the hub an hour, a month twelve hours).
"orlando" is the city's name in every language, so Orlando's segment is the same in all six; every
link is built by `tripRegionPath` / `tripRegionMonthHref` (`lib/trip-regions/paths.ts`).

| Request                                | Answer                                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| `/orlando`                             | the next 30 days from Orlando's today; canonical for itself |
| the current month's URL                | 200, canonical pointing at the hub                          |
| one of the next eleven months          | 200, canonical itself, in the sitemap                       |
| a padded month (`/2027/03`)            | 308 to `/2027/3`, from `proxy.ts` (`tripRegionRedirect`)    |
| a month outside the twelve             | 308 to the hub, from `proxy.ts`                             |
| anything else under `/orlando/<a>/<b>` | 404, except the best-time pages, which have their own route |
| any query string (`?from=…#planner`)   | the same page, `noindex`, canonical without the query       |

"Today" is Orlando's (`tripRegionToday`, `currentTripRegionMonth`, America/New_York), never the server's.
The month rule matches digits only (`:year(\\d{4})/:month(\\d{1,2})`), so
`/orlando/<best-time segment>/<resort>` keeps its own window; `pnpm test:edge-windows` and
`pnpm test:orlando-hub` both assert it. The best-time pages' path is `tripRegionBestTimePath(region,
locale, page?)`, the one function both branches link through.

## Data

`lib/trip-regions/api.ts` reads the region (a day), `/calendar`, `/best-days` and `/when` (an hour) on
the server with the site's data key, through the Data Cache under `trip-region:orlando`. The browser
asks the keyed routes through `app/api/trip-regions/[...path]/route.ts`, which answers this site's
pages only and forwards each route's own query names (`lib/trip-regions/relay.ts`). The shapes are
`lib/trip-regions/types.ts`; everything derived from them is `lib/trip-regions/hub-data.ts`.

- **One figure per surface, with one name.** A square, the first answer, a best-time card and the
  day sheet all print `headlinerWait`, the Spitzenwartezeit (peak wait, piekwachttijd, attente de
  pointe, espera punta, attesa di picco): each big ride's highest wait of the day, averaged over the
  park's big rides. Parks are compared by it; the colour is the park's day against its own normal
  day, the crowd level and nothing else, and the key says so in one line. One baseline per page:
  the hub's cards have no "across the year" figure. There is no hourly curve on the hub.
- **The pick is the API's.** `best` per resort is picked on an hours-weighted cost, so a park that
  closes early for day guests loses to a full day with a similar wait: Animal Kingdom at 45 min,
  open to 19:00, ranks above Magic Kingdom at 40 min on a party night. When `bestWhy` says
  `closes_early_elsewhere`, the first answer adds "(Magic Kingdom closes at 6 pm for an evening
  event)", the phone list "Magic Kingdom closes 18:00" and the day sheet "Ranked above Magic
  Kingdom, where day guests must leave at 6 pm" (`earlyCloseBehind`). The phone list's top chip and
  the day sheet's first row follow `best` too (`rankGroupParks`).
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

| Level | What                        | Where                                                                                   |
| ----- | --------------------------- | --------------------------------------------------------------------------------------- |
| 0     | what the page is for        | the head: the question, one line, „Reise planen“ and „Zum Kalender“                     |
| 0     | the answer                  | under the buttons: the best park per resort on one named day, the quietest days ahead   |
| 1     | the overview                | the matrix or the day list, minutes only; three marks and the colour line; lanes closed |
| 2     | everything else about a day | the day sheet: ranked parks, hours, perks, evenings, seasons, travel, five rides        |
| 3     | the day itself              | „Im Tagesplaner öffnen“ opens the day planner's wizard on that park and date            |

The first phone screen holds the H1 (the search term as its small first line, „Welcher Park an
welchem Tag?“ as its big one), the lead, the two buttons and the answer; the calendar's first day
starts just under it (905 px at 390 × 844, German). The answer names its day ("Sat, Nov 14, Orlando time"),
never "today", because a cached copy outlives midnight. After every pick has closed it is about
tomorrow (`glanceDay`). It names each group with a headliner park (`glanceLines`): a resort of one
park is answered by that park (Universal Studios Hollywood), a group without a headliner (SeaWorld
Orlando, the day trips) stays out. No crowd badge: beside "best park" it read as a contradiction.
Its second row is each of those groups' quietest day in the window, a date said once where they
share it.

## Chapters

Each chapter opens with its heading and then the thing itself, no introduction.

1. **01 Die nächsten 30 Tage** (`HubCalendar`, client; on a month page „Tag für Tag im <month>“). The
   key comes first (`HubLegend`, handed in as `legend`): the peak wait, the ring and the hatching,
   and one line for the colour; under „So liest du den Kalender“ the early close, „Punkt oder leer:
   noch keine Öffnungszeiten“ and last year. A phone gets the resort filter as one row that scrolls
   sideways, then a list of days, per resort the top park and "+n more"; from `lg` a
   `<table role="grid">` with a caption, `scope`d headers, one tab stop and arrow keys. On the hub
   both are server-rendered for the first seven days and the rest of the window loads through the
   relay; a month page server-renders its whole month. Rows never change with the data, so the box
   is the rendered one. The resort filter is urgent, the grid follows through `useDeferredValue`.
   The events sit under it as one closed `<details>` row. A tap opens `HubDaySheet` (bottom sheet
   on a phone, side panel on a desktop); it holds a history entry of its own, so a phone's Back
   closes it. Under the calendar: the forecast's date and the travel times' credit; on the hub the
   accuracy line (`HubAccuracy`, PAR-1316): „Unsere Prognose der Spitzenwartezeit, eine Woche im
   Voraus, lag in den letzten 30 Tagen im Schnitt 16 Min. daneben.“, the lead and the days from the
   open `GET /v1/trip-regions/:region/accuracy`, the minutes rounded. The route starts that read
   before the others, bounded to 1.5 s (`withSeedTimeout`), and the line awaits it in its own
   `<Suspense>`, so a slow answer never holds the calendar; `forecastAccuracy: null` (too few
   measured days) or a failed read draws nothing. Its link opens the accuracy question in chapter 04
   (`FaqLink`, `TRIP_ACCURACY_ID`). Then the month
   index (`HubMonthIndex`, a labelled `<nav>` with the park calendar's chips, all twelve months)
   and each park's crowd calendar (`HubParkIndex`, a labelled `<nav>`, „<park> Andrang-Kalender“).
2. **02 Deine Reise planen**: `PlannerChapterSlot`, `id="planner"`, where `TripRegionPlanner`
   mounts. Empty until the visitor gives dates. The planner itself is
   [orlando-planner](orlando-planner.md)'s.
3. **03 Beste Reisezeit für Orlando <year>** (`HubWhen`): a teaser of the best-time pages, drawn only
   for a region with best-time pages and its words for them. It sends the best-time page's own
   query (`bestTimeWhenQuery`: same range, days, parks, limit and a gap of the trip's length), so
   both read one cached answer. The three quietest 10-day windows for the seven headliner parks
   from `/when`, as three cards with their peak wait and „Diese Reise planen“
   (`?from=&to=#planner`, `rel="nofollow"`), and the link to
   `tripRegionBestTimePath(region, locale)`. The year strip, the weeks and their questions are the
   best-time pages', so the two do not compete for one query.
4. **04 Fragen zum Andrang in Orlando** (`HubFaq` → `FaqList`), ten questions, the method folded
   in, every answer built from the page's data or the region's words: first up to six on the
   window, in this order of worth (the quietest and busiest days per resort, the events with their
   nights and dates, the party nights, Epic Universe on weekends, the drive between the resorts
   with the hotel distances, the early slots, the region's fixed questions in `hub.faq.questions`,
   then the weekdays, each park's mean, the breaks and holidays with their effect, the usual hours),
   then four on the figure (`tripHub.faq`: what the peak wait is, why a longer one can be green,
   where the figures come from, how far and how well the forecast reaches, with the measured error
   when the API has it and the note that it is the planner's „Wie genau ist das?“). The list stays
   within 800 words (`HUB_WORDS_MAX`); a question that would pass it is left out. Then the links to
   Fancast and how park.fan works. A question whose data or words are missing is left out; with
   none, no chapter and no `FAQPage`. The facts behind the shared questions are pure functions in
   `lib/trip-regions/hub-facts.ts` (`weekdayFacts`, `usualHours`, `breakFacts`, `parkMeans`,
   `parkClosures`, each reading the forecast's days or, past it, last year's).
5. **`LandingNextSteps`** „Reiseplaner für Orlando“: plan the trip, the best-time page.

A month page asks only about its month: its quietest and busiest days, its events, its party
nights, its weekdays, its breaks and holidays, Epic Universe on its weekends and its usual hours,
within 500 words (`MONTH_WORDS_MAX`); where that stays under 250 (a month with no events and no
breaks), each park's mean and the closed days follow. A month past the forecast says once, in its
first answer, that its figures are last year's measured days. The four questions on the figure
stay on the hub, so twelve month pages never repeat one block of answers. With the events lane and
the answer box under the head, that is what makes one month's HTML differ from the next.

The hub's lead says what the page holds („Ein Kalender für alle 16 Parks rund um Orlando und ein
Planer für deine Reisetage.“). The hotel distances in the drive-time answer
(`hub.faq.distance.a`: every theme park under half an hour from Lake Buena Vista, LEGOLAND just
under an hour, Busch Gardens about an hour and a half) are the API's travel matrix without traffic,
written into the copy; a change to the region or a new matrix is a reason to re-read that answer.

## SEO

- Title and H1 carry each locale's term ("Orlando Crowd Calendar", „Orlando Andrang-Kalender“,
  "Orlando drukte-kalender", "Calendrier d'affluence Orlando", "Calendario de afluencia de Orlando",
  "Calendario affluenza Orlando"): in the H1 as its first line, inside the element, with the
  question („Welcher Park an welchem Tag?“) as its second (`LandingHero question`). A month page asks
  the same question; its month is in the first line, and a second mention read twice in the H1
  („… Dezember 2026: Welcher Park an welchem Tag im Dezember 2026?“). The hub's `<title>` carries
  the years its month index spans (`{years}`, `tripRegionYears`: „Orlando Andrang-Kalender
  2026–2027 & Reiseplaner“, one year from January), read per request in park time; a month's
  title names its month, in German with „Andrang“ („Orlando im Dezember 2026: Andrang bei Disney &
  Universal“), the word German searches use. German calls the calendar „Andrang-Kalender“
  everywhere. The description carries the verdict, each resort's quietest date.
- Structured data: `BreadcrumbList`, a `Dataset` for the window (`ParkDatasetStructuredData` with
  Orlando's centre), `FAQPage` only from `FaqList`. No `Event` for festivals: they are third-party
  events without offers, and an `expected` season is no announcement
  ([analysis](../seo/analysis.md#no-event-from-the-show-list)).
- Everything below the answer that is "more" is a `<details>` or a hidden tab panel, so it is in the
  served HTML. The hub and the month pages are in `app/sitemap.ts` with hreflang and no `lastmod`: each forecast
  warmup rebuilds every month at once, a stamp rather than an observed change
  ([a lastmod is observed](../rules/a-lastmod-is-observed-never-stamped.md)).
- Internal links: hub → each park's crowd calendar ("<park> Crowd Calendar", `HubParkIndex`; every
  headliner park when `/best-days` fails, so a failed read never takes the links away) and,
  from the first answer, the picked parks' calendars; park pages and calendars → the planner (the
  band, `rel="nofollow"` since it carries a plan); every page → `/orlando#planner` (the footer);
  month ↔ month; hub → the best-time pages (chapter 03 and the band). The day planner is linked from
  the footer and, client-side, from the day sheet.

## Analytics

What the hub counts (the events in [analytics](../development/analytics.md)): `trip_hub_action`
for the head's two ways in (`plan`, `calendar`, on the hub or a month), `internal_link_clicked`
from the blocks `trip_answer` (the first answer's park calendars) and `trip_parks` (the park
index), each with the park as entity, `trip_hub_filter` when a resort chip changes the calendar,
`trip_accuracy_opened {surface: hub}` for the accuracy line, and `faq_opened` with the question's
message `key` beside its place, since the questions shown depend on the data. Page types for hub,
month and best-time pages are the analytics core's (`sitePageTypeOf`).

## Ways in

- The More menu's wide tile and the phone sheet's link (`lib/navigation/more-menu.ts`,
  `components/layout/more-menu-panel.tsx`, `components/layout/header.tsx`).
- `TripPlannerTile` and `TripPlannerBand` (`components/trip-regions/`), from every page about the
  region's parks into the planner. Which parks: the region route's `parks[]`, reduced by
  `tripRegionLinks` (`lib/trip-regions/trip-links.ts`, which keeps the live regions of the
  registry, so a region the API curates before its hub exists gets no links) and read by `getTripRegionLinks` with a 1.5 s
  bound, so a slow read costs the way in and never the page; no slug list here. Where each stands:

  | Way in             | Where                                       | The link                                                                                                                          |
  | ------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
  | the tile           | a region park's page and crowd calendar     | „Magic Kingdom einplanen": `parks=<slug>`, on a month page `when` ([the tile](trip-regions.md#the-planner-tile-on-a-parks-pages)) |
  | the band, `place`  | a city or country listing with region parks | „Reiseplaner öffnen": the bare chapter, the API's headliners; one band per region the listing holds                               |
  | the band, `post`   | the end of a post about region parks        | one park as on the tile, several preselected under „Reiseplaner öffnen"; one band per region                                      |
  | the band, `search` | `/search` for a query that names the region | the bare chapter, as the palette's first row                                                                                      |

  Each also links the bare hub by its name (`nav.calendar`), a followed link. A month
  page of a park calendar sends its month as the When mode's search (`monthSearchRange`: from the
  park's today, at most a year ahead, nothing where the rest of the month is shorter than the
  ten-day trip). A link that carries a plan is `rel="nofollow"` and not prefetched
  (`plannerLinkRel`), as the hub's own "Plan these dates" links are.

- The footer's tools: „Reiseplaner" (en "Trip planner") beside „Tagesplaner" ("Day planner"), the
  first live region's planner from the registry (`lib/trip-regions/registry.ts`), so the footer on
  every page spends no region read.
- The search palette's first row and the top of `/search`, for a query that names the region or a
  resort ([site search](site-search.md#a-trip-regions-planner-comes-first)).
- The day planner's plan list (its overview and the planner page), once the plan holds a day at a
  region park: one line per plan with those parks chosen
  ([trip planner](trip-planner/README.md#a-plan-in-a-trip-region-leads-to-the-trip-planner)).
- `TripRegionHomeStop` on the homepage, data-free beyond the region's park list, because the homepage
  keeps a day at the edge.
- Parky's `plan_vacation` links `/orlando?from=…&to=…&parks=…#planner`.

## Checks

`pnpm test:orlando-hub` (window, redirects, relay allow-list, the pick and its clause, tomorrow
after close, lanes, summaries, ranges), `pnpm test:edge-windows`, and against a running build
`pnpm check:landing-pages` and `pnpm check:semantic-html`, which list `/de/orlando`, `/en/orlando`
and next month's page.
