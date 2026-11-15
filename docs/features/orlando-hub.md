# The Orlando hub

`/<locale>/orlando` and its month pages `/<locale>/orlando/<yyyy>/<m>`: a landing page around the
trip planner, then each of Orlando's sixteen parks with its quietest day of the week, the resorts,
the best time of year and the questions about the figure. Every region's hub is built the same way
from its registry entry. Open this page before changing the hub's route, its chapters, its two
states, the day sheet, its ways in or the data it reads. The trip planner in chapter 01 has its own page,
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

- **One figure per surface, with one name**, the Spitzenwartezeit (peak wait, piekwachttijd,
  attente de pointe, espera punta, attesa di picco): each big ride's highest wait of the day,
  averaged over the park's big rides. What a day prints is `shownWait`: within 60 days the park
  calendar's own forecast (`forecastWait`), so the hub and the park page never show two numbers
  for one day; past them `headlinerWait`, last year's measured day. Every ranking stays on the
  API's `headlinerWait` (the forecast times its lead factor within 60 days, PAR-1319). A tile,
  the first answer, the day sheet and the questions all print `shownWait`; the colour and the word
  under it are the park's day against its own normal day, the crowd level and nothing else, and the
  key says so in one line. There is no hourly curve on the hub.
- **The pick is the API's.** `best` per resort is picked on an hours-weighted cost, so a park that
  closes early for day guests loses to a full day with a similar wait: Animal Kingdom at 45 min,
  open to 19:00, ranks above Magic Kingdom at 40 min on a party night. When `bestWhy` says
  `closes_early_elsewhere`, the first answer adds "(Magic Kingdom closes at 6 pm for an evening
  event)" and the day sheet "Ranked above Magic Kingdom, where day guests must leave at 6 pm"
  (`earlyCloseBehind`). The day sheet's first row follows `best` too (`rankGroupParks`). The
  calendar names no pick: it marks each park's own quietest day of the week.
- **An early close is never silent.** `closesEarly` (or a ticketed evening) draws the folded corner
  on a tile and its closing time in bold, puts "closes 6 pm" in its accessible name, and the
  best-days chips carry the close time.
- **A figure without published hours counts.** Past a park's published schedule a day is `UNKNOWN`
  but carries the forecast or last year's figure. It is ranked (`isRankable`: not closed, has a
  figure), its tile says „Zeiten folgen" where the hours would stand, and the sheet says "No hours
  published yet; the figure is the forecast, hours are not counted". Only a closed day or one
  without a figure has no wait, so the month pages past Disney's and Universal's schedules keep
  their content.
- **A resort's busiest days** are the highest mean over its parks with a figure, never the
  hours-weighted pick, so a day most of its parks call quiet is never one of its busiest.
- **School holidays are US ones, and say so.** Lanes, reasons and the best-time pages name "US
  school holidays"; break names go through `translateHolidayName(cleanBreakName(…))`.
- **Past 60 days, last year, said once.** Every ranking reads last year's measured day past 60
  days, so on a month that far out nearly every day is `last_year`. The tiles look like the
  rest; one line above the calendar says „Ab dem 13. Jan.: Werte aus dem Vorjahr …“ from the first
  such day (`tripHub.lastYearFrom`), and the day sheet says it for its day. `long_range` (nothing
  measured a year back) keeps its "outlook" label. A last-year day is never offered as a pick: no
  ring and no star.
- **The storm season** (Orlando's hurricanes, Japan's typhoons) is on the timeline itself, where a
  date is picked: a bar under each date of the week grid and of the phone's week, by
  the planner's own `stormCodeOn` from the region's `weather.storm`, and its name in the grid's
  first column and above the list (`StormKey`). The signal violet (`STORM_SIGNAL_CLASS`), dashed for the
  season, solid for its peak, in `tripPlanner.climate`'s words, and in the date's accessible name.
  Never a crowd tint, and no longer a lane under the calendar, where nobody looking for a date saw it.

## Simple first, more on request

| Level | What                        | Where                                                                                                          |
| ----- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0     | what the page is for        | the head: the question, one line, „Reise planen“, „Zum Kalender“ and what the planner asks                     |
| 0     | the answer                  | under the buttons: the best park per resort on one named day, the quietest days ahead                          |
| 1     | the overview                | a week: tiles with wait, level, hours, season icons; each park's quietest day ringed and starred; lanes closed |
| 2     | everything else about a day | the day sheet: ranked parks, hours, perks, evenings, seasons, travel, five rides                               |
| 3     | the day itself              | „Im Tagesplaner öffnen“ opens the day planner's wizard on that park and date                                   |

The first phone screen holds the H1 (the search term as its small first line, „Welcher Park an
welchem Tag?“ as its big one), the lead, the two buttons and the answer; the calendar's first day
starts just under it (905 px at 390 × 844, German). The answer names its day ("Sat, Nov 14, Orlando time"),
never "today", because a cached copy outlives midnight. After every pick has closed it is about
tomorrow (`glanceDay`). It names each group with a headliner park (`glanceLines`): a resort of one
park is answered by that park (Universal Studios Hollywood), a group without a headliner (SeaWorld
Orlando, the day trips) stays out. No crowd badge: beside "best park" it read as a contradiction.
Its second row is each of those groups' quietest day in the window, a date said once where they
share it.

## Two states

The hub is a landing page until it has a plan (`HubTripProvider`,
`components/trip-regions/hub/hub-trip-state.tsx`; the rules are pure in
`lib/trip-regions/hub-trip.ts` and pinned in `pnpm test:orlando-hub`).

| State        | When                                                                           | Head                                                                                                              | Chapter 01                       |
| ------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| landing page | the served HTML, and in the browser while the query holds no dates             | „Reise planen“, „Zum Kalender“, „Nur die Reisedaten sind Pflicht …“                                               | the four steps and Parky's offer |
| with a plan  | `from` and `to` in the query (a shared link, Parky's, one planned on the page) | „Zu deinem Plan“ (still `data-landing-action`), „Neue Reise planen“, „Dein Plan für … gespeichert. Reise löschen“ | „Deine Reise“ and the planner    |

- **Only chapter 01 changes.** The calendar, the resorts, the best time and the questions are open
  in both states, in full, with no fold and no toggle: with a plan, „Deine Reise“ stands at the top
  and the chapters follow it as they do on the landing page, so the swap after hydration moves
  nothing below chapter 01. The questions keep their own accordion, one question at a time.
- **The server always renders the landing page.** The plan exists only in the browser, so the
  provider reads the query after hydration (`useMounted`); a crawler and a page without script get
  the landing page with every link open. The swap happens in chapter 01 and below.
- **A remembered plan comes back.** On a visit without any query, the trip this browser remembers
  (`remembered-trip.ts`) goes back into the address bar, once, if it has not ended in the region's
  today (`restorableTrip`); the planner reads it as a link from outside. A query of its own
  (`?parks=` from a park's tile) keeps its intent and restores nothing.
- **The planner's inline view shows only with something to show** (dates or a `when=` search,
  `HubPlannerOnly`): the assistant is a dialog outside that box, and its empty state would repeat
  the four steps.
- **Every start goes through one place**, `startPlanner` in `hub-hero-action.tsx`:
  `tripPlannerUi.openStart(source)` with `hero` (the head), `landing` (chapter 01, the closing
  band) or `restart` („Neue Reise planen“, which first clears the trip with `clearTrip`, the
  clearing „Reise löschen“ uses, without its undo). Each counts as `trip_hub_action`; the clear
  counts no `trip_option_changed`.
- **A trip can be deleted** from the head's line and from the result („Reise löschen“, asked in
  place, with „Rückgängig“ for a few seconds after). It clears every store of the region's trip on
  this device and puts the hub back on its landing page; the stores and the undo are
  [orlando-planner](orlando-planner.md#keeping-a-plan)'s.

## Chapters

Each chapter opens with its heading and then the thing itself.

1. **01 So plant der Reiseplaner deine Tage in Orlando** (`PlannerChapterSlot`, `id="planner"`,
   the region's `nav.inRegion` in the title; with a plan „Deine Reise“). On the landing page `HubHowItWorks`: four steps (dates; a few questions, all
   optional; the plan day by day; changing it, with Parky too), each a screenshot from the region's
   `hub.howItWorks` in the page's language (`<base>-<locale>`, else `-en`, else `-de`,
   `hubShot` in `lib/trip-regions/hub-media.ts`), an `<h3>` and a sentence; swiped sideways on a
   phone, four columns from `md`. Under them Parky's offer to plan the trip in the chat, with
   „Reise planen“ and „Lieber im Chat“ (`ParkyInterviewStart` with its `action`; without Parky only
   the button stands, since the line offers the chat). That only the dates are required is said
   once, under the head's buttons, and not again here. The planner itself is
   [orlando-planner](orlando-planner.md)'s; the screenshots are the media database's
   (`public/media/reiseplaner/`), with their alt texts and focus in the sidecars.
2. **02 Die nächsten 30 Tage** (`HubCalendar`, client; on a month page „Tag für Tag im <month>“),
   with one line under the title: „Bei jedem Park ist sein ruhigster Tag der Woche markiert“. The
   question a visitor brings is which day to give each park, since a trip visits every park once,
   not the same park five times. The key comes first (`HubLegend`, handed in as `legend`): the peak
   wait, the ring with the star (each park's quietest day of the week) and one line for the colour;
   under „So liest du den Kalender“ the early close. Then a week at a time, because a wall of thirty
   similar numbers decided nothing:
   - **The week.** Seven days from the window's first (the region's today on the hub), so the first
     week is the one ahead („Sa., 14. – Fr., 20. Nov.“); the last week holds what is left and keeps
     the columns' width (`hubWeeks`). ‹ and › page, from `sm` a chip per week jumps; the arrow keys
     page from any of them, Home and End go to the ends. A week past the first is named in the
     fragment (`#calendar-2026-11-28`, `hubWeekFragment`), so a reload or a shared link shows it,
     and a shared link lands on the chapter; the date finds its week even a day later, when the
     weeks start a day later (`hubWeekFromFragment`). „Nächste Woche: 21.–27. Nov.“ under the grid
     pages on and goes back up to the week's first day.
   - **Every day is in the served HTML.** The hub hands the whole window to the client (no relay
     request); each column and each list day carries its week's class (`HUB_WEEK_CELL`,
     `HUB_WEEK_ITEM`) and one `data-week` shows seven, so a crawler and a reader without script
     have all 30 days, paging changes one attribute, and the rows are memoised past it.
   - **The tile is the crowd calendar's** (`CalendarDayTile`, `density="compact"`, the park
     calendar's `ParkCalendarDay` draws the same component at full size): tinted by the park's
     level, the wait (`shownWait`), the level in words (none for a figure without a level, never
     „Keine Prognose“ beside a forecast), the day guest's hours with an early close in bold under
     the folded corner, „Zeiten folgen“ without published hours, the season icons (quiet for a
     season most of the window runs in, `quietSeasons`), „Geschlossen“.
   - **Each park's quietest day of the week** (`quietestDay`: the lowest printed wait, `shownWait`,
     a tie to the lower `headlinerWait`, then the longer day, then the earlier date; one for every
     park with an open day, never a last-year day) is ringed in the text colour (`HUB_CELL_BEST`)
     and starred, and named beside the park with its wait („★ Mi., 18. · 30 Min“, `QuietestNote`,
     one per week, so paging shows the week's). The ring is the strongest mark on the grid, so a
     row reads at a glance.
   - **From `lg`** a `<table role="grid">` with a caption naming the week, `scope`d headers, one tab
     stop and arrow keys within the week: parks by resort down the side, each with its quietest
     day under its name, seven tiles across. Above the tiles each date (a button to the day), the
     storm bar and „Ferien & Feiertage“ with the signal dot of a public holiday or a school break,
     that row only where a day of the window fills it, so a week never adds one. A park whose whole
     window says one thing (Saisonpause, no hours yet, open without a forecast, `parkState`) is one
     line instead of seven tiles.
   - **A phone** gets the same grid at its width (`PhoneWeek`): a card per resort with the week's
     dates (a button each, the storm bar, a dot for a holiday), then each park's name with its
     quietest day and its seven days as 44 px tiles (`CalendarDayTile`, `density="mini"`: the wait
     without its unit, the star in the corner, the rest in the tile's accessible name and the day
     sheet).

   The resort filter and the week are urgent, the grid follows through `useDeferredValue`. The
   events sit under it as one closed `<details>` row over the whole window. A tap opens
   `HubDaySheet` (bottom sheet on a phone, side panel on a desktop); it holds a history entry of
   its own, so a phone's Back closes it. Under the calendar: the forecast's date and the travel
   times' credit; on the hub the accuracy line (`HubAccuracy`, PAR-1316): „Unsere Prognose der
   Spitzenwartezeit, eine Woche im Voraus, lag in den letzten 30 Tagen im Schnitt 16 Min.
   daneben.“, the lead and the days from the open `GET /v1/trip-regions/:region/accuracy`, the
   minutes rounded. The route starts that read before the others, bounded to 1.5 s
   (`withSeedTimeout`), and the line awaits it in its own `<Suspense>`, so a slow answer never holds
   the calendar; `forecastAccuracy: null` (too few measured days) or a failed read draws nothing.
   Its link opens the accuracy question in chapter 05 (`FaqLink`, `TRIP_ACCURACY_ID`). Then the
   month index (`HubMonthIndex`, a labelled `<nav>` with the park calendar's chips, all twelve
   months).

3. **03 Die Resorts rund um Orlando** (`HubResorts`): one card per API group, in the order of the
   region's `hub.resorts` (a group it does not list follows): the photo (`hub.resorts[].photo`) with
   the name over it, or a tinted panel of the same height with the name for a group without one (never a picture
   another card shows), two sentences
   (`tripRegions.<slug>.hub.resorts.<group>.lead`), each park as a link to its crowd calendar
   („<park> Andrang-Kalender“, the links `HubParkIndex` used to carry: every park with quiet days in
   the window, every headliner when `/best-days` fails) and one sentence on where to stay (`.stay`).
   Each park link is a row with a chevron, 44 px high on a phone. A card without its words keeps
   its name and links. The grid has as many columns as cards, up
   to four, so two resorts fill the row. Every sentence is a fact of the API (parks,
   water parks, perks, hotel areas, `stayNote`, travel legs) or of the region's existing copy;
   nothing is invented for a card.
4. **04 Beste Reisezeit für Orlando <year>** (`HubWhen`): a teaser of the best-time pages, drawn only
   for a region with best-time pages and its words for them. It sends the best-time page's own
   query (`bestTimeWhenQuery`: same range, days, parks, limit and a gap of the trip's length), so
   both read one cached answer. Under the title one line says what the cards are („Die drei
   ruhigsten Reisen über 10 Tage“, the length read off the first window). Then a year line
   (`yearLine` in `hub-data.ts`): the months of the searched range as a ruled track and each
   window as a bar under its numbered dot, decoration beside the cards. Then the three quietest
   windows for the headliner parks from `/when`, as three cards with their place, their dates,
   their peak wait as the large figure, the first reason the window was picked (left out where all
   three share it) and „Diese Reise planen“ (`?from=&to=#planner`, `rel="nofollow"`). A card names
   no basis: that a date past the forecast reads last year is the accuracy question's in chapter
   05 and the best-time page's. The link under the cards („Alle
   Wochen des Jahres vergleichen“) goes to `tripRegionBestTimePath(region, locale)` in other words
   than the chapter's title, which the closing band already links. The year strip, the weeks and
   their questions are the best-time pages', so the two do not compete for one query.
5. **05 Fragen zum Andrang in Orlando** (`HubFaq` → `FaqList`), ten questions, the method folded
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
6. **`LandingNextSteps`** „Reiseplaner für Orlando“, the page's one closing call: the region's
   Parky picture (`hub.scene`, beside the words from `md`, above them on a phone), one sentence
   on what the planner does, then „Reise planen“ (it starts the planner like the head's button;
   with a plan it reads „Zu deinem Plan“ and leads to it), the best-time page and the region's
   travel guide. There is no card before it: a second „Reise planen“ block directly above the band said
   the same thing twice.

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
  served HTML. The landing chapters are Server Components: the four steps with their screenshots as
  `<img>` with alt text, the resorts with their links. The served HTML is always the landing page,
  so no plan or hidden step reaches a crawler. The planner comes before the
  calendar; the answer stays in the first screen. The hub and the month pages are in `app/sitemap.ts` with hreflang and no `lastmod`: each forecast
  warmup rebuilds every month at once, a stamp rather than an observed change
  ([a lastmod is observed](../rules/a-lastmod-is-observed-never-stamped.md)).
- Internal links: hub → each park's crowd calendar ("<park> Crowd Calendar", in its resort's card
  in chapter 03, `HubResorts`; every headliner park when `/best-days` fails, so a failed read never
  takes the links away) and,
  from the first answer, the picked parks' calendars; park pages and calendars → the planner (the
  band, `rel="nofollow"` since it carries a plan); every page → `/orlando#planner` (the footer);
  month ↔ month; hub → the best-time pages (chapter 04 and the band); hub → the region's travel
  guide, the band's last destination, found by the post's `translationKey` in the region's
  `regionGuide` and drawn only while the post is served, so a draft waiting for its region's
  `live` costs no 404; the guide links back to the hub in its intro. The day planner is linked from
  the footer and, client-side, from the day sheet.

## Analytics

What the hub counts (the events in [analytics](../development/analytics.md)): `trip_hub_action`
for the head's two ways in (`plan`, `calendar`, on the hub or a month) and for the landing's
„Reise planen“ in chapter 01 (`plan`); `trip_planner_started` tells them apart by
its `source` (`hero`, `landing`, `restart`), `trip_deleted {from: head}` for „Reise löschen“ in the
head, `internal_link_clicked`
from the blocks `trip_answer` (the first answer's park calendars) and `trip_parks` (the resorts'
park links), each with the park as entity, `trip_hub_filter` when a resort chip changes the calendar,
`trip_accuracy_opened {surface: hub}` for the accuracy line, and `faq_opened` with the question's
message `key` beside its place, since the questions shown depend on the data. Page types for hub,
month and best-time pages are the analytics core's (`sitePageTypeOf`).

## Ways in

- The header's planner band and the phone sheet's „Planen" rows (`lib/navigation/planner-menu.ts`,
  `components/layout/planner-menu-panel.tsx`, `components/layout/header.tsx`).
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
- `TripRegionsHomeStop` on the homepage, one tile per region from the planner band's data and no
  forecast, because the homepage keeps a day at the edge.
- Parky's `plan_vacation` links `/orlando?from=…&to=…&parks=…#planner`.

## Checks

`pnpm test:orlando-hub` (window, redirects, relay allow-list, the pick and its clause, tomorrow
after close, lanes, summaries, ranges, the calendar's weeks and fragment, each park's quietest
day, the quiet seasons), `pnpm test:trip-clear`, `pnpm test:edge-windows`, and against a running build
`pnpm check:landing-pages` and `pnpm check:semantic-html`, which list `/de/orlando`, `/en/orlando`
and next month's page.
