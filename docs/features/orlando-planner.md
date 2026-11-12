# The Orlando trip planner

Chapter 03 of the [Orlando hub](orlando-hub.md): which park on which day of a trip of up to 21
days, from the API's `/plan`, or which dates to travel at all, from `/when`. It replaces the planner
page's "Parks auf Tage verteilen" (`lib/planner/assign.ts`) for Orlando, which ranked crowd levels
in the browser; the search now runs in the API
([trip regions](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/trip-regions.md),
[when to go](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/trip-regions-when.md)).

## Where it lives

| Piece                                                                   | File                                                                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| The component the hub mounts                                            | `components/orlando/planner/orlando-planner.tsx` (`OrlandoPlanner`)                            |
| The state and its URL form                                              | `lib/orlando/plan-query.ts` (`readPlanQuery`, `writePlanQuery`, `orlandoPlannerHref`)          |
| The `/plan` answer, trip arithmetic, edits, filing into the day planner | `lib/orlando/plan.ts`                                                                          |
| Codes to sentences, the saving, the last-year date                      | `lib/orlando/plan-copy.ts`                                                                     |
| Week and Month geometry, short days, swap previews                      | `lib/orlando/plan-week.ts`                                                                     |
| The When mode                                                           | `lib/orlando/plan-when.ts`, `components/orlando/planner/plan-find.tsx`, `plan-when-result.tsx` |
| The `.ics` file                                                         | `lib/orlando/plan-ics.ts`                                                                      |
| Requests through the relay                                              | `lib/orlando/plan-fetch.ts`, hooks in `components/orlando/planner/use-trip-plan.ts`            |
| The chosen view                                                         | `lib/orlando/plan-view.ts` (`parkfan_orlando_view` in localStorage)                            |
| Park photos for the Week view                                           | `lib/orlando/plan-photos.ts` (server only, passed as `photos`)                                 |

`pnpm test:orlando-plan` covers every pure module.

## The state is the address

The planner keeps no state of its own: what the visitor chose is the query string, in the `/plan`
route's own names (`from,to,parks,hotel,area,arrival,departure,blocks,fireworks,rest,hop,split,lock`)
plus `#planner`, and in the When mode `when=<from>_<to>&days=<n>[&within=<region>]` instead of
`from`/`to`. A change is written with `history.replaceState`, which Next's router follows, so
`useSearchParams` sees it and the page does not remount; a query the planner did not write (Parky's
`router.push`, the back button) re-plans the same way and, with `#planner`, scrolls to the chapter
and moves the focus into it. "Copy link" copies the address. Every other page that links into the
planner builds the href with `orlandoPlannerHref`, the one serializer.

- **Defaults stay out of the URL:** `blocks=1`, `fireworks=any`, `split=auto`, `rest=auto`,
  `hop=0`, `arrival`/`departure=free`. `parks` is written once the visitor touches it; until then
  the API's default, the headliners, is asked for.
- **A link is read leniently,** one parameter at a time, so one bad value costs only itself. Parky's
  older `parties=avoid|allow|prefer` reads as `fireworks=any` and is never written.
- **A park's count:** with "split my days for me" on, a park without a number shows "auto" and may
  get a second day; minus pins it to one, plus to two, minus from one removes it.
- **Pins** (`lock=`) outside the trip or on a park not chosen are dropped before a request, since
  the API answers both with a 400.

Reading the query makes a prerendered page render the planner in the browser, so it sits in a
Suspense boundary whose fallback is the same planner with nothing chosen and nothing to press.
Dates are formatted only once the browser's clock is read: Node's and Chrome's ICU write a date
range with different spaces, which cost the planner its hydration once.

## From simple to detailed

The owner's rule for the whole chapter: a visitor is never buried in numbers. The hub's hero action
calls `orlandoPlannerUi.openDates()` (`lib/orlando/planner-ui.ts`): the Dates sheet on a phone, the
dates panel scrolled to and focused at a desk.

The figure under each date in the picker is the lower of the day's picks per resort (`best`, early
closings counted), else the lowest headliner that is open and does not close early, so a party
night never makes a date look quiet (`dateFigure`).

- **Setup.** Dates and parks are the only steps. Hotel (Universal Premier includes Express at
  Universal Studios and Islands of Adventure), hotel area, "Do you want to see Magic Kingdom's
  fireworks?", resort blocks, rest days and park hopping sit under "Fine-tune", with the API's
  defaults chosen and summed up in one line. On a phone the steps are one bottom sheet walked
  Dates → Parks → Plan, with Fine-tune a row of its own; at `lg` the same panels sit inline. Both are
  in the markup and CSS picks one.
- **Level 0, the answer.** The saving in minutes per ride ("Big rides on your days: about 41 min a
  ride. The same parks on an average day of your trip: 47 min."), the forecast's error where the API
  names it, or "the order barely matters" when `orderMatters` is false; no hours total. Then the
  parks `split=auto` gave a second day (`meta.split`: "We added a second day at Magic Kingdom
  Park"), the rules the plan had to loosen, the parks it could not place, and one line per day. On a phone this
  is the first thing after "Plan".
- **Level 1, the views,** behind Agenda | Week | Month. The choice is the browser's; before one,
  the Week at `lg` and the Agenda below. At most three facts per element: the park, its minutes and
  one marker (an early close first, then a rest day, the hotel's early slot, its evening).
  - **Week:** up to seven columns a page (three on a phone, by the arrows or a swipe) on one hour
    axis. Each column is the day planner's own `DayGrid` for that day's hours on the shared canvas,
    so `PlannerGridGround` draws its band, early slot and hour rules; blocks use the day planner's
    ink (`planner-block-ink.tsx`). A block runs from opening to the day guests' close, so a short
    day is visible at once; a party night is hatched after it with its name and "separate ticket".
    Early Entry is a stripe above the block and Extended Evening Hours one below, only where the
    chosen hotel gets them. A hop day is two blocks with the leg chip between them; a rest day one
    calm block. The scale is half the day planner's (`TRIP_WEEK_PX_PER_MIN`).
  - **Month:** the trip in its calendar weeks; a day holds the park's two letters in its crowd tint
    and the minutes, or a bed for a rest day.
  - **Agenda:** one card per day at Level 1.
- **Level 2, a day's sheet** (bottom sheet on a phone, right panel at a desk): the one-line reason,
  the runner-up day and what it costs, hours with the hotel's perks, why a short day is short and
  how many hours it loses against the park's usual day in the window, the day's events with their
  status, the drive from the hotel area ("without traffic", the OSRM attribution, the TTC leg to
  Magic Kingdom), the weather where a forecast reaches, and the big rides of that day by name.
  The rides come from the day planner's `/plan/day`, asked only when the sheet opens; their minutes
  are left out, because they come from another model than the day's figure and two numbers for
  one wait on one sheet read as one of them wrong. Then Pin, Swap and "Plan this day".
- **Level 3, the day planner.** "Plan this day" publishes the park (`plannerPagePark` and a
  `PlannerPageParkBeacon`), leaves the date in `plannerPageDay` and asks for the wizard with
  `plannerUi.requestOpen('orlando-hub', 'page-park-wizard')`, as the homepage hero does.

## Evenings, tickets and the season

- **Tickets.** "Do you have a Park Hopper (park-to-park) ticket?" is `ticket=hopper`. Park hopping
  (`hop`) is offered only with it, and a link that asks for hopping without one gets a sentence
  saying it does not count (the API's `hop_needs_hopper`).
- **Evenings** (`evenings=1`, the default): after a park that closes early the plan may add an
  evening at a second park or a venue (`region.venues`: Disney Springs, CityWalk). It is "+ evening:
  EPCOT" in the answer and the Agenda, a block after the park block in the Week view (a second park
  in the park colours, a venue calm and dashed, the move as a leg chip), and in the day's sheet a
  section with the reason, the highlight and its time, the way there, the alternatives and the
  venue's official page.
- **Heat and the hurricane season** are short chips ("hot", "hurricane season", "peak hurricane
  season") in the day's sheet and on the When mode's cards. A card whose ranking the season's terms
  pushed down says "ranked lower: hurricane season" beside its unchanged minutes.
- **School breaks** are named for whose they are: "No US school holidays", "US school holidays".

## Editing a plan

- **Pin** writes `slug@date` (or `rest@date`) to `lock=` and re-plans around it.
- **Swap** lists the trip's other days, each priced before the press from the calendar: the two
  parks' waits on their new days less those on their old ones. A park moved onto a short day is
  named with the hours it loses. The press pins both days the other way round and re-plans.
- **The edit bar** says what the pins cost per ride against the plan without them (the same query
  minus `lock`, usually still cached), with Undo and "Release all".

Owner's decision: **an earlier closing time always counts.** The API prices a day by the hours a
day guest really gets; the planner shows it everywhere a day is: the Week block's end, the
"closes 6 pm" marker, the sheet's sentence, the swap preview.

## The When mode

Step 1 is a choice: "I know my dates" or "Find the best dates". Finding takes a period (the next
twelve months, next year, its spring, summer or autumn, or a range of one's own, each clipped to the
year the API looks ahead), a trip length of 3–21 days (10 to start) and, if wanted, only the school
holidays of a region. The regions are exactly those the holiday data has, read from the open route
`/school-breaks` through the relay (`useSchoolBreaks`), grouped by country with the reader's own
first; nothing is hard-coded, and the picker says how far the stored holidays reach ("School holiday
data runs to 3 Jul 2027"). Parks and Fine-tune stay as they are.

- **Level 0:** the three best windows as cards: the dates, "Big rides about 38 min", how far below
  the period's average, one reason, and "based on last year's crowds" where that is what it is.
- **Level 1:** the year strip, a bar per week, its height the minutes and its tint where the week
  falls among the period's weeks (a comparison inside the period, said in the legend, never the
  crowd calendar's level), the windows marked under it. A screen reader reads it as a list of weeks.
- **Level 2:** a window's reasons, warnings (party nights with their count, school breaks, hurricane
  season, a water park closed), events and its day-by-day sketch.
- **Level 3:** "Plan these dates" sets `from`/`to`, drops the search and shows the plan.

A window with no school-holiday period long enough says so and lists the region's periods.

## Keeping a plan

"Add all days to my planner" files every park day as a reserved day in one store write
(`reserveDays`, the write Parky's `planner_reserve_trip` uses; a day that already holds a plan stays
as it is). "Add to calendar (.ics)" builds the file in the browser: one event per park day, timed
with `TZID=America/New_York` and a `VTIMEZONE` where the hours are known, all-day where not, with
the minutes, the reason and the link. "Copy link" copies the address.

## Honest states

Nothing is planned until dates are chosen; the empty chapter says so and is never a sample. A
problem the API would answer with a 400 (more visits than days, a trip over 21 days) is caught
before the request and said in a sentence with the way out. A trip past the forecast is planned on
last year's measured days with a banner naming when the forecast should reach it. A failed request
keeps the last plan on screen, dimmed, with a retry.

## Checks

`pnpm test:orlando-plan`; keyboard path, focus return to the pressed day after a sheet closes,
44 px targets in every sheet and view on a phone, and no horizontal scroll at 320 and 390 px were
checked with Playwright against the API's dev shim.
