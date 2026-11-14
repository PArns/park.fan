# The trip planner

Which park on which day of a trip of up to 21 days in one region, from the API's `/plan`, or which
dates to travel at all, from `/when`. Orlando is its first region, as chapter 01 of the
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
  assistant](trip-planner/wizard.md#the-trip-planners-assistant). The
  phone's Back button closes the assistant (`useSheetHistory`), and the address keeps what was
  chosen in it.
- **Parks** are cards in the assistant's second step, each a checkbox with a stepper that reads
  "1–2" until the visitor sets a number (`visitSteps`: 1 → 1–2 → 2 → 3).
- **Level 0, the answer** (`plan-result.tsx`). On a phone, top to bottom: the visitor's answers
  („Deine Antworten“, `WizardAnswers`: a chip per step of the assistant, from its own step list, that opens it on that step), the head (`PlanResultHead`: the dates, „17 Tage · 6 Parktage · 8 Tage frei ·
  2 Städte“, and across cities the route strip with each stay's number, city and nights and the
  mode of each move), the peak card (`PlanPeakCard`: the peak wait on the planned days large, how
  much less it is than the average of the trip's days or that the order barely matters, the two as
  bars in primary blue, never in crowd colours, the forecast's error per ride and day and „Wie
  genau ist das?“; the figures stay `shownTotals` and `planSavings`), the parks the trip has no day
  for with their three ways out, the stay suggestion, last year's line once, then the days in the
  chosen view, the parks the split gave a second day and the notes, the tickets and Keep. At `lg`
  the answers, the peak card, the tickets and Keep are a sticky column of 340 px on the left and
  the head and the days take the rest. The figure is the peak wait everywhere (Spitzenwartezeit,
  piekwachttijd, attente de pointe, espera punta, attesa di picco). The edit bar sits above the
  answer.
- **Level 1, the views,** behind Tage | Woche | Monat. The choice is the browser's; before one,
  the Week at `lg` and the Days below. Last year's figures are no marker and no dashed tile: after
  the forecast's 60 days every day has them, so the answer says once from which date
  (`lastYearStart`).
  - **Days** (the `agenda` view, the default on a phone, `plan-agenda-view.tsx`): a park day is a
    `PlanDayCard`, one component for every region. Its head is the park's photo (`photos`, else a
    tinted field with the park's code) with the date, the crowd level (`CrowdLevelBadge`), the park
    and, for a repeat, „2. Tag“; „fest“ with the lock for a pinned day, „neu“ for a park just put on
    a free day. Under it the peak wait, the way from the hotel („24 Min. ab Hotel“, the transfer
    to the gate added), and two sentences on why this day (`dayWhy`): the API's most telling reason
    (`primaryReason`, `tripPlanner.reason`), then the runner-up day in the card's own figure
    (`dayRunnerUp`, the sheet's too): „Am So., 13. Dez. wären es etwa 5 Min. mehr.“, or with
    `runner_up_close` the one sentence „Am Di., 8. Dez. wäre es etwa gleich voll. Dieser Tag passt
    besser zum Rest des Plans.“ Chips for what changes the day (`cardWarnings`): the hotel's early
    slot with its minutes, the evening with its start, and in the crowd ink an early close, a day
    outside its ticket, „5. Parktag am Stück“ (`parkStreakAt`), a long day trip with its mode and
    length, a back-to-back repeat, no hours, no forecast. A press on the photo or the text opens
    the sheet. A morning move's park day says „Erst Hotelwechsel, im Park ab 12:15“ on top.
  - **Free days.** `days[].spare` (API 2.21.1) is a rest day nobody asked for: the planner calls it
    a free day („freier Tag“, sun), never a rest day; „Ruhetag“ with the bed is only a day the
    visitor's rest rule set or a pinned one (`isSpareDay`). A run of free days in one city is one
    `PlanSpareRun` (`withSpareRuns`): „23.–25. Jan. · 3 freie Tage in Tokio“, the days as tiles that
    open their sheet, „Hier braucht der Plan keinen Park“ and up to three parks to add
    (`spareSuggestions`): the API's `spareDayParks` first, on their cheapest day of the run, then
    one more day of a planned park the stay's base reaches, on its quietest open day by the
    calendar. Each names its day, minutes and the way from the city. „Dazu“ puts the park in
    `parks` with one visit more than the plan gives it and pins it to that date (`addParkOnDate`),
    then re-plans; the card turns into a day card with „neu“, the edit bar says „Fuji-Q Highland am
    Mo., 25. Jan. ist jetzt im Plan.“, and Undo takes back the parks with the pins. The head counts
    `totals.spareDays` apart from the rule's rest days (`tripCounts`).
  - **Across cities** a section per stay: its head (`PlanStayHeader`) with the number, city, dates,
    hotel area, the region's stay note and a nights stepper (`setBaseNights`, the Route's), and a
    day that is only the move as a `PlanMoveCard` in the move's dashed ink: the typical times,
    „Osaka ── Zug ── Tokio“, the service, its length, the hotel change's buffer and the leg's notes
    as chips (`useMoveNotes`, the sheet's too). Arrival, departure and the rule's rest days are one
    quiet row each. Without bases the cards stand two to a row at a desk.
  - **Week:** up to seven days a page (three on a phone, by the arrows or a swipe) on one hour
    axis. Each park column is the day planner's own `DayGrid` for that day's hours on the shared
    canvas, so `PlannerGridGround` draws its band, early slot and hour rules; blocks use the day
    planner's ink (`planner-block-ink.tsx`). A block runs from opening to the day guests' close, so
    a short day is visible at once; a party night is hatched after it with its name and „separate
    ticket“. Early Entry is a stripe above the block and Extended Evening Hours one below, only
    where the chosen hotel gets them. A hop day is two blocks with the leg chip between them; a
    rest day one calm block with its bed. A free day gets no hour grid (`weekColumns`,
    `weekTemplate`): alone it is a column of 56 px with its sun, „freier Tag · Ideen“ and a plus
    that opens its sheet; a run is one panel as wide as one and a half park days holding the
    free-day card. The stay band runs on the same columns (`weekHalfTracks`). The scale is half the
    day planner's (`TRIP_WEEK_PX_PER_MIN`).
  - **Month:** the trip in its calendar weeks; a day holds the park's two letters in its crowd tint
    and the minutes, a sun for a free day, a bed for a rest day.
- **Level 2, a day's sheet** (bottom sheet on a phone, right panel at a desk): the one-line reason,
  the runner-up day and what it costs, hours with the hotel's perks, why a short day is short and
  how many hours it loses against the park's usual day in the window, the day's events with their
  status, the drive from the hotel area ("without traffic", the OSRM attribution, the TTC leg to
  Magic Kingdom), the weather where a forecast reaches, and the big rides of that day by name.
  A free day's sheet is titled „freier Tag“ and lists what it could take, with „Dazu“
  (`PlanSpareSuggestions`).
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

- **Route** (`components/trip-regions/wizard/steps/route-step.tsx`), the assistant's step in
  place of Hotel: where the trip lands and where it leaves from as cards, the city first and its
  airports small ("Tokyo · Haneda or Narita"), and "Not decided". A gateway several bases share
  (Charles de Gaulle) pins no base, so its card is the plan's choice (`gatewayChoices`). Under them
  the cities on a line in route order with their nights: "the plan's" until the stepper sets them;
  0 nights makes a city's parks day trips, "Add a city" (chips) names one the plan skips. A trip of
  two nights or fewer sleeps in one city, and the step says so. The URL carries
  `bases=tokyo:4@maihama,fujikawaguchiko:0`, `startBase`, `endBase` and `moveBuffer`; `hotel` and
  `area` are not the region's there and are dropped from a link.
- **Hotels** (`hotels-step.tsx`), the step after it: per city the trip stays in, its `stayNote`
  and its areas as cards (`AreaPicker`, with the minutes to the trip's parks there and the perks,
  which count only with an area chosen), and the hotel change's buffer from
  `stayRules.moveBufferOptions` where the trip changes hotels, the region's `moveOverheadMinutes`
  chosen; Japan's line names the luggage service. Until the plan answers, the cities are those
  nearest the trip's parks (`homeBases`).
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
4. **Changes on request** over it: „Deine Antworten“, a chip per step of the assistant that opens
   it on that step.
5. **Tickets after the plan**, from the ticket card's "Already have tickets? Add them"; a shared
   link is never asked.

## Parky's ideas

The API's best single edits for the plan on screen (`GET …/plan/ideas`, the same query as
`/plan`, at most three: move, swap, add, travel_day, hopper, avoid_party), asked once the plan
answers the query asked last (`usePlanIdeas`), through the same relay. The API cannot tell an
answered default from an unasked one (a free arrival day is left out of the query either way), so
the planner drops a `travel_day` idea where the visitor answered the travel days in the assistant
and a `hopper` idea where they answered hopping (`shownIdeas`; the answers are
`tripWizardAnswered`, per tab: a step left with "Next" answers its questions, a skipped one does
not). Pure logic in `lib/trip-regions/plan-ideas.ts`, tested by `pnpm test:plan-ideas`.

- **Over the plan** (`IdeasStrip` in `planner/plan-ideas.tsx`), between the stay suggestion and
  last year's line: "Parky has 3 ideas for your plan", a card each with the idea in one line
  ("Tokyo Disneyland on Thu, Jan 28 instead of Fri, Jan 22"), the park's own figure ("about 55
  instead of 60 min"), the verb that applies it (Add, Swap, Plan it this way) and "In the chat".
  To swipe on a phone, a grid at a desk.
- **At the day** (`DayHint`), in the card's `hint` slot under the day the idea changes.
- **In the chat** (`AssistantTripIdeaCard`): "In the chat" sends Parky a question about the idea
  (`askParkyAboutIdea`, `assistant_question` with `kind: idea`) and draws the idea under his
  answer with "Add to the plan", then "In the plan: …" with Undo. The card's words are the
  planner's, made where it was pressed: the chat carries none of the planner's messages.
- **Applying** goes through the planner's bridge (`tripPlannerBridge.applyIdea`) from all three:
  the idea's query part set over the state (each parameter replaces its value whole,
  `applyIdea`), as an edit the status band names ("In the plan: …") and its Undo takes back.
- **The finale** says "Parky has N ideas for your plan" where it has any.

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
assistant's Tickets step. The step itself lists the
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
| `trip_spare_filled`                                                                   | `from`: card (the Days view and a free day's sheet), week (the Week view's panel); idea and chat once Parky offers parks                                                                                                           |
| `trip_day_moved`, `trip_day_freed`, `trip_park_removed`                               | none: a day put on a free day, a day made free, a park taken out, from a day's „More“                                                                                                                                              |
| `trip_undo`                                                                           | `what`: pin, swap, move, free, remove, add, release, idea                                                                                                                                                                          |
| `trip_idea_shown`                                                                     | `kind` (move, swap, add, travel_day, hopper, avoid_party), `place` (header, day, chat); once per idea and place                                                                                                                    |
| `trip_idea_applied`                                                                   | `kind`, `place`                                                                                                                                                                                                                    |
| `trip_idea_chat`                                                                      | `kind`                                                                                                                                                                                                                             |
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

Every edit is made on the result and kept for its undo: `usePlanState` holds the whole state
before each one (`edit`), so "Undo" takes back every edit in turn, not only its pins. A change of
the answers in the assistant, or a link from outside, starts the history afresh. The pure helpers
are in `lib/trip-regions/plan.ts`: `toggleLock`, `swapLocks`, `moveVisit`, `freeDay`,
`removePark`, `addParkOnDate`, and `PlanEditChange` for what each one did.

- **The day card's row** (`plan-day-actions.tsx`): **Pin** is a toggle (`aria-pressed`), **Swap**
  opens the swap mode, **More** a sheet (`DayActionsSheet`). Each names the park and the date in
  its label ("Pin Tokyo DisneySea on Tue, Jan 19").
- **Pin** writes `slug@date` (or `rest@date`) to `lock=` and re-plans around it.
- **Swap** (`plan-swap-mode.tsx`) takes the views' place: a band ("Swap Tokyo DisneySea. Pick a
  day. The figure is the peak wait at DisneySea on that day."), the day as it is, and every day of
  its city it can trade with (`swapTargets`). Each target says what it holds now and the parks' own
  figures on their new days, read off the calendar before the press (`swapPreview`'s `parks`):
  "DisneySea 105 min (+5)", for a park day also "Tokyo Disneyland on Tue instead: 60 min (±0)",
  for a free day "The free day moves to Tue." Never the plan's mean. The quietest is marked, a
  short day carries its closing time, the same park and a closed day cannot be picked. The press
  pins both days the other way round and re-plans. A day's sheet opens the same mode.
- **More**: pin, swap, put the park on the quietest free day of its city ("Tue, Jan 20: about 90
  instead of 100 min", or "No free day is quieter"), make the day free (`rest@date`), take the
  park out of the trip ("Both days become free."), or open the day in the day planner.
- **The status band** (`plan-edit-status.tsx`, `role="status"`) replaces the edit bar. After each
  edit it says what changed in words ("Tokyo DisneySea is now on Wed, Jan 20."), that the pinned
  days stay, and the peak wait now, or what the pins cost against the plan without them (the same
  query minus `lock`, usually still cached). "Undo" while there is an edit to take back,
  "Release all" while a day is pinned.

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
checked with Playwright against the API's dev shim. The assistant's walk, the tickets and a
day's edits (pin, undo, the swap mode) run in `pnpm check:planner` (alone:
`pnpm check:planner --orlando`, `scripts/check-planner-orlando.mjs`) against a production
build pointed at the shim (`NEXT_PUBLIC_API_URL=http://localhost:3001`, the API's
`pnpm trip-regions:dev`).
