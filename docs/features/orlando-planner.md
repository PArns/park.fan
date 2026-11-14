# The trip planner

Which park on which day of a trip of up to 21 days in one region, from the API's `/plan`, or which
dates to travel at all, from `/when`. Orlando is its first region, as chapter 03 of the
[Orlando hub](orlando-hub.md); Southern California, Japan and Paris follow from the same code, each
with its own entry in the registry ([trip regions](trip-regions.md)). The region's own rules (its
hotels, its ticket step, the fireworks question, keeping Disney and Universal days together) are
fields of that entry, and its own words are `tripRegions.<slug>.planner`. In German it is the Reiseplaner, in English the trip planner,
though the English navigation still calls the one-park planner "Trip planner" as well; these docs
call that one the day planner ([its docs](trip-planner/README.md)).

It replaces the planner page's "Parks auf Tage verteilen" (`lib/planner/assign.ts`) for Orlando,
which ranked crowd levels in the browser; the search now runs in the API
([trip regions](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/trip-regions.md),
[when to go](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/trip-regions-when.md)).

## Where it lives

| Piece                                                                   | File                                                                                                            |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| The component the hub mounts                                            | `components/trip-regions/planner/trip-region-planner.tsx` (`TripRegionPlanner`)                                 |
| The state and its URL form                                              | `lib/trip-regions/plan-query.ts` (`readPlanQuery`, `writePlanQuery`, `plannerHrefOn`)                           |
| The `/plan` answer, trip arithmetic, edits, filing into the day planner | `lib/trip-regions/plan.ts`                                                                                      |
| Tickets: the catalog, the step's drafts, what the answer's fields say   | `lib/trip-regions/plan-tickets.ts`, `components/trip-regions/planner/plan-tickets.tsx`, `plan-tickets-card.tsx` |
| Codes to sentences, the saving, the last-year date                      | `lib/trip-regions/plan-copy.ts`                                                                                 |
| Week and Month geometry, short days, swap previews                      | `lib/trip-regions/plan-week.ts`                                                                                 |
| The When mode                                                           | `lib/trip-regions/plan-when.ts`, `components/trip-regions/planner/plan-find.tsx`, `plan-when-result.tsx`        |
| The `.ics` file                                                         | `lib/trip-regions/plan-ics.ts`                                                                                  |
| Requests through the relay                                              | `lib/trip-regions/plan-fetch.ts`, hooks in `components/trip-regions/planner/use-trip-plan.ts`                   |
| The chosen view                                                         | `lib/trip-regions/plan-view.ts` (`parkfan_orlando_view` in localStorage)                                        |
| Park photos for the Week view                                           | `lib/trip-regions/plan-photos.ts` (server only, passed as `photos`)                                             |

`pnpm test:orlando-plan` covers every pure module.

## The state is the address

The planner keeps no state of its own: what the visitor chose is the query string, in the `/plan`
route's own names
(`from,to,parks,hotel,area,arrival,departure,blocks,fireworks,rest,hop,ticket,hopper,tickets,split,lock`)
plus `#planner`, and in the When mode `when=<from>_<to>&days=<n>[&within=<region>]` instead of
`from`/`to`. A change is written with `history.replaceState`, which Next's router follows, so
`useSearchParams` sees it and the page does not remount; a query the planner did not write (Parky's
`router.push`, the back button) re-plans the same way and, with `#planner`, scrolls to the chapter
and moves the focus into it. "Copy link" copies the address. Every other page that links into the
planner builds the href with `plannerHrefOn`, the one serializer. The mounted planner also publishes its state to
Parky (`lib/trip-regions/planner-bridge.ts`), whose changes go through the same `update`, and keeps
the last trip per region in this browser (`lib/trip-regions/remembered-trip.ts`); see
[Parky → the trip planner](assistant.md#the-trip-planner).

- **Defaults stay out of the URL:** `fireworks=any`, `split=auto`, `rest=auto`, `hop=0`,
  `arrival`/`departure=free`, and `blocks` until the visitor sets it (absent, the API keeps resorts
  together on plan first and mixes owned tickets' resorts only where that saves 3 min a ride). `parks` is written once the visitor touches it; until then
  the API's default, the headliners, is asked for.
- **A link is read leniently,** one parameter at a time, so one bad value costs only itself. Parky's
  older `parties=avoid|allow|prefer` reads as `fireworks=any` and is never written. `tickets` is
  read one item at a time against the region's catalog: an unknown product or a length it does not
  sell drops that item, and the answer says one was left out. A region answer without a catalog
  (Cloudflare keeps the region up to a day after an API deploy) keeps them by their syntax alone, and
  the plan route checks them.
- **A park's count:** with "split my days for me" on, a park without a number shows "auto" and may
  get a second day; minus pins it to one, plus to two, minus from one removes it.
- **Pins** (`lock=`) outside the trip or on a park not chosen are dropped before a request, since
  the API answers both with a 400.

Reading the query makes a prerendered page render the planner in the browser, so it sits in a
Suspense boundary whose fallback is the same planner with nothing chosen and nothing to press.
Dates are formatted only once the browser's clock is read: Node's and Chrome's ICU write a date
range with different spaces, which cost the planner its hydration once.

## From simple to detailed

The owner's rule for the whole chapter: a visitor is never buried in numbers, and the flow goes
from simple to advanced. The first screen asks only for what a plan cannot do without: the dates,
and the parks, which start chosen (the region's headliners). Once the departure date is picked
the plan is there, and everything else is a change to it. The hub's hero action calls
`tripPlannerUi.openStart()` (`lib/trip-regions/planner-ui.ts`): the Dates sheet on a phone, the
dates panel scrolled to and focused at a desk. The flow and why, step by step, is in
[the flow](#the-flow-simple-first).

The figure under each date in the picker is the lower of the day's picks per resort (`best`, early
closings counted), else the lowest headliner that is open and does not close early, so a party
night never makes a date look quiet (`dateFigure`).

- **The questions** are the assistant's, a dialog that „Reise planen“ opens: one question a
  screen, asked by Parky, the dates the only required one, the plan as a ribbon in its footer from
  the departure date on, and a finale. Which steps a region gets, the step bodies, the free-days
  question and the conflict cards: [the trip planner's
  assistant](trip-planner/wizard.md#the-trip-planners-assistant). Until the Hotel, Tempo and
  Evenings steps have their own bodies, the interim Tempo step holds the hotel and its area, a park
  on the travel days, rest days, second park days (the split), evenings, park hopping, Magic
  Kingdom's fireworks and resort blocks (`PlanOptions`), each with the API's default chosen. The
  phone's Back button closes the assistant (`useSheetHistory`), and the address keeps what was
  chosen in it.
- **Parks** are cards in the assistant's second step, each a checkbox with a stepper that reads
  "1–2" until the visitor sets a number (`visitSteps`: 1 → 1–2 → 2 → 3).
- **Level 0, the answer.** The dates and what they hold, the parks the trip has no day for (one
  sentence with three buttons: a park on the travel days, other parks, a longer trip), then the
  days in the chosen view, and under them one line: the peak wait on the planned days against the
  average of the trip's days ("Peak wait on your days about 41 min, 6 min less than the average of
  your trip days."), or that the order barely matters; "How accurate is this?" holds the average
  and the forecast's measured error. The figure is the peak wait everywhere (Spitzenwartezeit,
  piekwachttijd, attente de pointe, espera punta, attesa di picco). Then the parks `split=auto`
  gave a second day, the rules the plan had to loosen, "Change parks" and "More options", and the
  tickets. On a phone this is the first thing after the dates.
- **Level 1, the views,** behind Agenda | Week | Month. The choice is the browser's; before one,
  the Week at `lg` and the Agenda below. At most three facts per element: the park, its minutes and
  one marker (an early close first, then a rest day, the hotel's early slot, its evening). Last
  year's figures are no marker and no dashed tile: after the forecast's 60 days every day has
  them, so the answer says once from which date (`lastYearStart`).
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
  - **List** (the `agenda` view, the default on a phone): the days once, one row each with the
    park, its minutes and one marker; a rest day says so once, and a pinned day carries a lock.
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
  ``plannerUi.requestOpen(`${region}-hub`, 'page-park-wizard')`` (`orlando-hub`), as the homepage
  hero does.

## Trips across cities

A region with bases (Japan, Paris; the API's
[bases](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/trip-regions.md#bases-a-trip-across-several-cities))
sleeps in more than one place. The visitor gives the ends, the plan gives the middle.

- **The Route** (`plan-route.tsx`), folded away under its summary like More options, a row of its
  own on a phone: "Arrival" and "Departure" offer the gateways per base ("Tokyo · Haneda or
  Narita") and "Not decided". A gateway several bases list (Charles de Gaulle) pins no base, so it
  reads "Charles de Gaulle, or not decided" (`gatewayChoices`). Under them the plan's cities in
  route order with their nights, "the plan's" until the visitor sets them with the parks' stepper
  ("set"); 0 nights makes a city's parks day trips, "Add a city" names one the plan skips. The URL
  carries `bases=tokyo:4@maihama,fujikawaguchiko:0`, `startBase`, `endBase` and `moveBuffer`;
  `hotel` and `area` are not the region's there and are dropped from a link.
- **More options** add the hotel area per city of the plan (its perks and the ways to the parks
  count only with one) and the hotel change's buffer from `stayRules.moveBufferOptions`, the
  region's `moveOverheadMinutes` chosen; Japan's line names the luggage service.
- **The answer** says the cities and hotel changes beside the park days and the API's
  `staySuggestion` with "Plan it this way". The list has a section per stay (its number, city,
  nights, dates and the region's stay note) with the move between sections; a day is listed where
  it is spent (`staySections`). The Week view has the stay band over the columns
  (`PlanStayBand`: two halves a day, two primary tints by the stay's number, never crowd colours),
  the move on the hour axis, the park hours a morning move takes hatched, and a travel day as one
  dashed block. The Month view ends each date's cell in the stay band (`PlanMonthStayBand` with
  `monthStayCells`): the city named where its stay begins and at the start of each week row, the
  cell split with an arrow on a hotel change; under the grid the numbered stays with their cities
  and `tripPlanner.month.stayKey`. The
  day's sheet has the move's route, typical times and stops, the buffer and
  the leg's notes (`moveNote.<code>` of the region first).
- **Names** come from the region's words (`base.<key>`, `gateway.<code>`, `area.<key>`,
  `stayNote.<key>`), else the API's English ones (`plan-place-words.tsx`).

## The flow, simple first

Built for a first-time visitor who wants to know which park on which day (PAR-1309):

1. **Dates.** The only question before a plan: the parks start chosen and are shown beside the
   dates, not asked. "No dates yet? Find the best time" is one line under the calendar.
2. **The plan at once.** The departure date closes the sheet, the answer scrolls into view and
   takes the focus: four taps and one sheet on a phone instead of seven taps and three.
3. **The answer:** what did not fit with its three ways out, the days once in the chosen view, one
   line on the peak wait.
4. **Changes on request** under it: Change parks, Change the route (across cities), More options.
5. **Tickets after the plan**, from the ticket card's "Already have tickets? Add them"; a shared
   link is never asked.

## Evenings, tickets and the season

- **Tickets** ([below](#tickets)). Park hopping (`hop`) is offered only with a hopper: an owned
  ticket with one, or plan first's per resort (`hopper=`, and older links' `ticket=hopper`). A link
  that asks for hopping without one gets a sentence saying it does not count (`hop_needs_hopper`).
- **Evenings** (`evenings=1`, the default): after a park that closes early the plan may add an
  evening at a second park or a venue (`region.venues`: Disney Springs, CityWalk). It is "+ evening:
  EPCOT" in the answer and the Agenda, a block after the park block in the Week view (a second park
  in the park colours, a venue calm and dashed, the move as a leg chip), and in the day's sheet a
  section with the reason, the highlight and its time, the way there, the alternatives and the
  venue's official page.
- **Heat and the hurricane season** are short chips ("hot", "hurricane season", "peak hurricane
  season") in the day's sheet and on the When mode's cards. A card whose ranking the season's terms
  pushed down says "ranked lower: hurricane season" beside its unchanged minutes. The Dates grid
  and the Month view mark the storm season as a violet segment of the signal bar (`--signal-storm`,
  `STORM_SIGNAL_CLASS`), dashed and solid at the peak, from the region's `weather.storm`
  (`stormCodeOn`); the legend names both, and the line under the grid says for a peak date that the
  best-time search ranks it lower. Japan's rainy season is a line there, never a mark.
- **School breaks** are named for whose they are: "No US school holidays", "US school holidays".

## Tickets

Tickets come after the plan: "Already have tickets? Add them" under the plan's tickets opens the
ticket step, as a sheet on a phone and in place at a desk (`DeskTickets`). The step itself lists the
resorts against the ticket catalog the admin keeps
(`GET /v1/trip-regions/orlando/tickets`, read by `PlannerChapterSlot` through the Data Cache under
the tag `trip-tickets:orlando`, which the API revalidates after every edit; five minutes otherwise,
`CACHE_TTL.tripTickets`). While that route fails or is slower than 1.5 s, the region's own `tickets`
stand in. The browser gets the catalog without the notes and the optimizer's rules. The contract:
the API's
[trip regions → tickets](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/trip-regions.md#tickets).
Without a catalog the step and the card are not drawn, plan first works as before, and a link's
`tickets` still plans: the plan route validates them.

- **No question.** Opening the step is the answer (`trip_tickets_answered` with `yes`, once, kept
  in `parkfan_<region>_tickets_asked`). Without tickets the plan suggests what to buy, and a link
  someone shares is never asked about tickets.
- **The products.** Each resort lists every ticket of its operators by name, with their rule in
  one line, whatever the market it is sold in: a visitor may buy a UK ticket as readily as a US
  one. A product the operators' own shops (`ticketMarkets.home`, `us`) do not sell carries a tag
  with where it is sold, "UK shop" or "International shop" (`marketLabel`,
  `tripPlanner.tickets.market`). The tag is information, never a filter, and claims no residency
  rule: the catalog has no field for one. Fields appear only where a
  product varies (days, the hopper as Yes / No / Not sure, water parks or Volcano Bay, the first
  day). Universal's two UK 14-day tickets are one entry that the first day resolves (`onSale`);
  "Not sure which" plans the strictest product of its length; the Disney and Universal Combo
  Ticket, as attractiontickets.com sells it, fills in both 14-day tickets at once, and a first day
  picked for one half is the other's too. Under the fields, the window in dates. Only a complete
  ticket is written to `tickets=`; a first day the product is not sold for is said in the field and
  never written.
- **The trip.** Tickets with first days give empty trip dates their range (earliest first day to
  the latest window's end, at most 21 days); the Dates grid draws each window as a bar with a key.
  "Find the best dates" is off while a first day is fixed. A ticket the dates miss holds the
  request back and says so, with "Change dates" and "Change ticket".
- **Plan first** (no owned ticket for a resort): at Level 0 one sentence ("3 days Universal from
  Tue, Feb 9, then 4 days Disney from Fri, Feb 12.") and "Ticket details", a sheet on a phone and in
  place at a desk: per resort its ticket and window, what the hopper adds (by date, from the
  verdict's lists; "Worth adding" only where the API recommends it), the Hogwarts Express line where
  both Universal parks are planned, "Show the plan with Park Hopper" (`hopper=<resort>`), the shop
  link and "Use these as your tickets" (written with `blocks=1`, so the days stay). The API
  suggests from every market, so a long stay may get a UK 14-day ticket itself, its shop link tagged
  "UK shop". On a trip of ten days or more, a line offers the 14-day tickets the UK shops sell
  ("Plan with these"), to every visitor.
- **Where to buy.** A suggestion's details and the 14-day alternatives list the product's `links`
  in the admin's order: the store of the visitor's own country first (the region of the browser's
  first language, `visitorCountry`), then those for their locale or market (`orderTicketLinks`);
  the official shop keeps its place. Every link is shown to every visitor. A link to a seller's
  country store (its `store`) is named by it, with the store's currency: "Attraction Tickets ·
  UK (£)", "· Irland (€)" (`ticketStoreName`: the short country name and the currency symbol from
  `Intl`, so a new store needs no string). Other links sold in a market other than the operators'
  own (its `markets`, on the official link the product's) carry the same tag as the step, "UK shop"
  (`linkMarket`). Under two or more links a muted line says that prices differ by the shop's
  country and that it pays to compare them all (`tripPlanner.tickets.links.compare`). Every link opens in a
  new tab with `referrerPolicy="origin"` and no `noreferrer`, so the seller sees `https://park.fan/`
  and never the trip's path (the site's own policy is `same-origin`); a sponsored link is
  `rel="sponsored nofollow noopener"` and carries a visible "Partner link" label that explains the
  commission on hover, focus or a tap (`ticketLinkAttributes`, `PartnerLabel`). The imprint and the
  privacy page say the same.
- **Owned** ("Your tickets"): each ticket's window, the days the plan uses ("8 of 14 days", or
  "used on 5 of its 14 days" for an every-day ticket), why days stay unused, whether Disney and
  Universal days mix (`meta.mixing`), a day outside the window with "Leave this visit out" and
  "Change ticket", the pass warnings with the operator's blockout and reservation pages, and
  `product_archived` for a product that left the catalog (its rules still apply). Both owned
  and suggested tickets: "Tickets" with "Yours" and "To buy".
- **The ticket day.** "Disney day 2 of 4" in the Week view's column header ("day 2 of 4" on a
  phone) and the day's sheet, after its hours; an every-day ticket counts the day of its window. The
  Agenda cards keep their three facts and mark only a day outside its ticket.
- **Fine-tune** has no ticket question any more. With owned tickets for both Disney and Universal,
  "Disney days and Universal days" offers three answers: mixed only where it saves time (the API's
  default), always together (`blocks=1`), mixed wherever the lines are shorter (`blocks=0`).

## Analytics

The planner's events go to our own statistic through `trackSiteEvent` and its gates
([site analytics](site-analytics.md), [the inventory](../development/analytics.md)), the `trip_*`
ones through `trackTripEvent` (`useTripEvents()` in the planner's context), which adds `region`: the
region's slug, `orlando` for now. Each one is in `SiteEventMap` and has its line in the admin's
`EVENT_INFO`. The properties that take more than a
literal are built in `lib/trip-regions/plan-analytics.ts` and pinned by `pnpm test:orlando-plan`; the
Orlando part of `pnpm check:planner` reads the key ones from the page (`window.__parkfanEventLog`).

Every name is snake_case in the past tense, every value is one of a few, and nothing a visitor typed
or picked as a date goes out: a trip's length is a bucket, its parks a count. No event carries an
entity, because none of them means one park. Every `trip_*` event carries `region` besides the
properties below; `trip_plan_requested` then has eight, the statistic's limit, and the others have
room to spare.

### The funnel

Six steps, each an event the flow really fires, in the order a visitor meets them (PAR-1309; the
admin MCP's `trip_planner_report` reads exactly these names):

| Step         | Event(s)                                                                         | Fires                                                                                                         |
| ------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1. started   | `trip_planner_started`                                                           | the hub's hero or landing, the planner's own „Reise planen“, „Neu starten“, or a link with a plan or a search |
| 2. requested | `trip_plan_requested`                                                            | every distinct request once the controls are still, a pin or a swap included                                  |
| 3. shown     | `trip_plan_shown`                                                                | the answer to that request on screen, once                                                                    |
| 4. changed   | `trip_wizard_step` with `via: answers`, `trip_option_changed` with `by: visitor` | the assistant opened again on a step from the result, or an option of the plan changed                        |
| 5. tickets   | `trip_tickets_opened`                                                            | the ticket step opened, every time, from wherever it was pressed                                              |
| 6. kept      | `trip_days_saved`, `trip_ics_exported`, `trip_link_copied`                       | the days copied to the day planner, the `.ics` file, the link                                                 |

Steps 4 and 5 are optional: a plan that suits needs neither, so the report reads them as shares of
step 3, not as a drop-off. `trip_tickets_answered` (the question before the plan) is no longer sent.

### Every `trip_*` event and its properties

Each carries `region` besides these. A value is one of the listed, never free text, a date or an id.

| Event                                                                                 | Properties                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trip_planner_started`                                                                | `source`: hero, button, link, landing, restart (dates, no longer sent: the dates are picked inside the assistant)                                                                                                                  |
| `trip_plan_requested`                                                                 | `mode` (dates, when), `days` (1-4, 5-7, 8-10, 11-14, 15-21), `parks` (a count; 0 the headliners), `tickets` (none, owned), `hopper` (none, some, all), `blocks` (default, on, off), `rest` (auto, none, max)                       |
| `trip_plan_shown`                                                                     | `mode`, `outcome` (ok, relaxed, error), `relaxed` (blocks, streak, ticket_window), `status` (0: no answer), `unplaced` (count), `left_out` (count of `parksLeftOut`), `stays` (cities, across cities only), `windows` (a search's) |
| `trip_edit_opened`                                                                    | no longer sent: the result opens the assistant on a step, `trip_wizard_step` with `via: answers`                                                                                                                                   |
| `trip_wizard_step`, `trip_wizard_finished`, `trip_wizard_closed`, `trip_spare_choice` | the assistant's own, in [the assistant](trip-planner/wizard.md#what-it-counts)                                                                                                                                                     |
| `trip_option_changed`                                                                 | `option`: hotel, area, arrival, departure, rest, split, evenings, hop, blocks, fireworks, parks, visits, cities, nights, stay_area, start_base, end_base, move_buffer; `value` (below); `by`: visitor, parky                       |
| `trip_left_out_fix`                                                                   | `fix`: travel_days, parks, longer; `left_out`: 1, 2, 3+                                                                                                                                                                            |
| `trip_tickets_opened`                                                                 | `from`: ask, card, adopt, ticket_problem, outside_ticket; `first` (true the first time in this browser)                                                                                                                            |
| `trip_find_toggled`                                                                   | `to`: find, known                                                                                                                                                                                                                  |
| `trip_find_period`                                                                    | `period`: next12, year, spring, summer, autumn, custom; `school_breaks` (true, false). Never which holidays                                                                                                                        |
| `trip_calendar_mode`                                                                  | `mode`: all or a resort key of the region; `from_default` (true when it left the default view)                                                                                                                                     |
| `trip_view_changed`                                                                   | `view`: agenda (the list), week, month                                                                                                                                                                                             |
| `trip_accuracy_opened`                                                                | `surface`: plan                                                                                                                                                                                                                    |
| `trip_stay_suggestion`                                                                | `action`: shown (once per suggestion on screen), applied                                                                                                                                                                           |
| `trip_window_planned`                                                                 | `rank` of the window a search found                                                                                                                                                                                                |
| `trip_day_opened`                                                                     | `kind` (arrival, park, hop, rest, departure, travel), `view` (list, agenda, week, month)                                                                                                                                           |
| `trip_day_pinned`                                                                     | `pinned`                                                                                                                                                                                                                           |
| `trip_day_swapped`, `trip_day_sent`, `trip_evening_link_clicked`, `trip_link_copied`  | none                                                                                                                                                                                                                               |
| `trip_days_saved`, `trip_ics_exported`                                                | `days`                                                                                                                                                                                                                             |
| `trip_ticket_added`                                                                   | `entry`, `resort`, `via` (picker, combo)                                                                                                                                                                                           |
| `trip_ticket_removed`                                                                 | `entry`, `resort`                                                                                                                                                                                                                  |
| `trip_ticket_start`                                                                   | `entry`, `resort`, `start` (set, open)                                                                                                                                                                                             |
| `trip_ticket_details_opened`                                                          | `surface` (sheet, inline)                                                                                                                                                                                                          |
| `trip_hopper_toggled`                                                                 | `resort`, `on`                                                                                                                                                                                                                     |
| `trip_tickets_adopted`, `trip_long_stay_used`                                         | `count`                                                                                                                                                                                                                            |
| `trip_outside_ticket_action`                                                          | `action` (leave_out, change_ticket)                                                                                                                                                                                                |

`trip_option_changed` is built from a diff of the state before and after each change
(`tripOptionChanges` in `lib/trip-regions/plan-analytics.ts`), one event per option, in
`usePlanState`; Parky's changes through the planner bridge count as `by: parky` (his own count stays
`assistant_plan_changed`). Dates, pins, tickets and the hopper are not options: their own events
count them. `value` only from small closed sets: `move_buffer` 30, 60, 90, 120 or default; `rest`
auto, none, max; on or off for arrival, departure, split, evenings, hop, fireworks; blocks on, off
or default; `hotel` the region's hotel kind; `parks` added or removed; `start_base` and `end_base`
set or open. No base key, no city count, no date.

`planner_opened` names where the day planner was opened from the trip planner: `<region>-trip-day`
("Open in the day planner" in a day's sheet), `<region>-trip-first` ("Open the first day" after
copying the days); `<region>-hub` stays the hub's day sheet.

`ticket_link_clicked` is a purchase link followed, middle click included. `product` (the catalog
id), `seller`, `host`, `kind` (official, sponsored, plain), `position` in the list the visitor saw
(1-based), `locale_match` (ordered first for the visitor's locale or market), `surface` (suggestion,
long_stay, owned) and `ticket_mode` (plan_first, owned, mixed). Eight is the statistic's limit, so
the region and the resort are left out: the product's slug belongs to one region's catalog and one
resort. The admin's event
page breaks it down by seller, product and host.

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

"No dates yet? Find the best time" under the calendar switches to it, and "I know my dates" back. Finding takes a period (the next
twelve months, next year, its spring, summer or autumn, or a range of one's own, each clipped to the
year the API looks ahead), a trip length of 3–21 days (10 to start) and, if wanted, only the school
holidays of a region. The regions are exactly those the holiday data has, read from the open route
`/school-breaks` through the relay (`useSchoolBreaks`), grouped by country with the reader's own
first; nothing is hard-coded, and the picker says how far the stored holidays reach ("School holiday
data runs to 3 Jul 2027"). Parks and Fine-tune stay as they are.

- **Level 0:** the three best windows as cards: the dates, "Peak wait about 38 min", how far below
  the period's average, one reason, and the parks the window has no day for. A window in the storm
  season's peak says why it ranks lower ("Peak hurricane season: ranked lower for the storm risk,
  even with short waits"): the API adds 10 minutes per visit to a window that touches the peak.
  Heat and the season outside its peak stay a short "ranked lower" list. One line under the title
  says from which week the figures are last year's, never each card.
- **Level 1:** the year strip, a bar per week, its height the minutes, in primary ink with the
  windows' weeks full (a comparison inside the period, so never the crowd tints, which mean a
  day against its park's normal day), the windows marked under it, and no week faded for being
  last year's. A screen reader reads it as a list of weeks.
- **Level 2:** a window's reasons, warnings (party nights with their count, school breaks, hurricane
  season, a water park closed), events and its day-by-day sketch.
- **Level 3:** "Plan these dates" sets `from`/`to`, drops the search and shows the plan.

A window with no school-holiday period long enough says so and lists the region's periods.

## Keeping a plan

"Copy to the day planner" files every park day as a reserved day in one store write
(`reserveDays`, the write Parky's `planner_reserve_trip` uses; a day that already holds a plan stays
as it is), and "Open the first day" opens the day planner on the first of them
(`setActive`). "Add to calendar (.ics)" builds the file in the browser: one event per park day, timed
with `TZID=America/New_York` and a `VTIMEZONE` where the hours are known, all-day where not, with
the minutes, the reason and the link. "Copy link" copies the address.

## Honest states

Nothing is planned until dates are chosen; the empty chapter says so and is never a sample. A trip
too short for the chosen parks is planned with what fits, and the parks left out are named
(`parksLeftOut`). A problem the API would answer with a 400 (repeat visits the visitor pinned that
outnumber the days, a trip over 21 days, more fixed nights than the trip has) is caught before the
request and said in a sentence with the way out. The API ranks every day after the
forecast's 60 days on the same weekday a year back as measured, so the answer says once from which
date the plan does ("From 12 January, the plan uses last year's measured waits on the same
weekday"), or that all of it does, with the reason: that far ahead the long-range forecast barely
tells the days apart. The date grid and the finder say the same once each, the grid from its first
such date, the finder from the strip's first such week (`lastYearFrom`).

**Which number a day shows.** Within the forecast's days a day shows `forecastWait`, the forecast
as the park's own calendar shows it, so a day never reads one number in the planner and another on
the park page; after them it shows last year's measured day (`shownWait`, `shownWaitOn`,
`shownDayWait` in `lib/trip-regions/plan-week.ts`). Every number derived from the days is in that
figure too, so the screen adds up: the line under the plan and its average day (`shownTotals`, the
visits' mean against the same parks' open days of the trip, as the API compares them), the edit
bar's cost of the pins (both plans in the shown figure, or both in the API's, never one of each),
a swap's difference and the day sheet's runner-up. What ranks stays the API's `headlinerWait`, the
forecast times its lead factor: the picks, the plan, the order of the windows and whether the order
of the days matters (`orderMatters`). Where the shown difference and the ranked cost point
different ways, the screen shows the shown one and the order stays the API's. Savings the API
works out against plans that are not on screen (the stay suggestion, mixing tickets) stay its
own. A failed request
keeps the last plan on screen, dimmed, with a retry.

## Checks

`pnpm test:orlando-plan`; keyboard path, focus return to the pressed day after a sheet closes,
44 px targets in every sheet and view on a phone, and no horizontal scroll at 320 and 390 px were
checked with Playwright against the API's dev shim. The tickets run in `pnpm check:planner`
(alone: `pnpm check:planner --orlando`, `scripts/check-planner-orlando.mjs`) against a production
build pointed at the shim (`NEXT_PUBLIC_API_URL=http://localhost:3001`, the API's
`pnpm trip-regions:dev`).
