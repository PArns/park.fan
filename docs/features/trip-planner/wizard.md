# The wizard

`PlannerWizard` (`components/planner/planner-wizard.tsx`) is the way into a new day: four questions
in the order somebody answers them, then the park's own page with the panel open. Open this when
changing a step, the dialog's frame or the day card. The trip planner's assistant, which shares its
cards and its rail, is [further down](#the-trip-planners-assistant).

## The steps

`type Step = 'park' | 'date' | 'setup' | 'headliners'`. Handed a park, the wizard starts on the
date; handed a park and a date (the homepage hero's „Heute planen", via `plannerPageDay`) it starts
on `setup`. The rail shows only the steps that remain.

1. **Which park** — the site's own `/api/search`, filtered to parks (`PlannerParkSearch`). The four
   URL slugs a plan is filed under are **taken from the hit's `url`**, never rebuilt from display
   names: „Netherlands" is not `netherlands` in every language, and a guessed path is a plan
   pointing at a 404. The field takes the focus (`autoFocus`; without it Radix parks focus on the
   dialog and the first keystroke goes nowhere). The list is operated from the field — options carry
   `tabIndex={-1}`, the highlight travels as `aria-activedescendant` — and the highlight is held as
   the park's **slug**, never an index, so a slug that left the result set falls back to the top
   hit without an effect resetting it. Enter picks the highlighted park.
2. **Which day** — `PlannerMonthCalendar`, a month grid tinted with that park's crowd forecast from
   the best-days snapshot. The snapshot also carries the park's **timezone**, which is the only
   reason this step fetches anything. It reaches 90 days; past it every cell is a bare number.
3. **Who is coming** — the shortest rider's height and whether the party wants to stay dry
   (`lib/planner/party.ts`). Both are flags on the ride list, never filters: a filter would quietly
   shorten the park, and only the visitor knows who holds the bags at the exit. Lunch is a block in
   the day. The height row opens on `RIDER_HEIGHT_DEFAULT_CM`, typed as a member of
   `RIDER_HEIGHT_CHOICES`, so it can never open on a value none of the chips marks
   (`pnpm test:planner-actions` asserts it too).
4. **Headliners** — the park's headliners for that day (`headlinersToAdd`) and how many the day
   holds. Where it is tight, the step renders the fit assistant's measured levers and ordered list
   inline; see [the fit-assistant rule](../../rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md)
   and [optimizer → the fit assistant](optimizer.md#the-fit-assistant). Where the party's height or
   „stay dry" answer is what emptied the list (`headlinersSkipped`), a notice in the crowd tint names
   the reason and says the rides can still be added one by one in the panel, where the search flags
   them rather than hiding them.

**Picking a park does not write to the plan.** The date is still unanswered; filing the park under
the reader's today once put a Florida park picked from Germany after 18:00 on the wrong day.

## The frame

A photo band, the step rail, the step and a footer, so it reads as one object being filled in.

- **The photo band** is `DialogHero` (`components/common/dialog-hero.tsx`, shared with other
  dialogs): the park's photo at its curated focal point, from the search hit or, on paths the search
  never touched, from `/plan/day` (`parkBackgroundImage`, held per park slug so a picture of another
  park never shows). No photo is a designed state — a tinted field and the chapter headings'
  translucent glyph, at the same height, so nothing moves when the picture lands. The scrim stops
  (`from-black/95 via-black/70 to-transparent`) are measured: the earlier `/85 · /45 · /5` put the
  `text-xs` line at 4.20:1 on Disneyland at p95; now six parks × two viewports read 8.73–14.09:1 at
  p95. On the second line the place gives way and the date keeps its width.
- **The rail** is `PlannerStepRail` (shared with the fit assistant): equal columns with the
  connectors measured off them, so it does not report the width of its own captions. A finished step
  is a button back to it, because „wrong day" is the commonest correction; nothing leads forward,
  which is the footer's job.
- **No footer on the park step**: picking a park is the advance.
- **The footer takes `px-3` below `sm`** (the body keeps `px-5`): at 320 px the six locales' button
  pairs want 194–240 px and French was nine short; shortening „planning" would disagree with the
  other strings in that locale. Measure each control's `scrollWidth`, never the span of a
  `justify-between` row, which equals the available width right up to the moment it overflows.
- **The step transition is CSS** (`motion-safe:animate-in` + `STEP_MOTION`, remounted on
  `key={step}`), not GSAP: a step swap animates content that is already at rest, so it cannot strand
  an invisible element the way a reveal can.
- **The setup step is cards, not checkboxes**, to match the photo and calendar steps.

## What the day card may say

`WizardDayCard` renders only fields of the park's **best-days snapshot** — the cheap, CDN-cached
materialized one (status, crowd level, hours and holiday flags per day), not `/calendar`, which
computes percentiles and takes seconds cold. Four states, four sentences: no day picked yet, the
park publishes no hours, a closed day, a day with a forecast. With nothing picked it says nothing
about a day. Hours render **only where the snapshot named the park's timezone**.

## Planning the park you are looking at

`PlannerPlanParkCta` („<Park> jetzt planen") renders in both empty states of a day column: the
grid's empty overlay (`emptyAction`) and the no-axis branch.
It asks whether the **day on screen** is already this park's, not whether the store has ever heard
of the park: `openDay` registers a park with no entry and `removeEntry` leaves an empty day behind,
so a stored husk used to silence the offer for good. On Toverland's page with a Phantasialand day
open, the offer is Toverland.

## The parts both assistants share

- **`WizardToggle`** (`components/planner/wizard-toggle.tsx`): one yes/no question as a card, the
  whole card a `button aria-pressed`, with an icon tile, a title, a sentence and the round check.
  The day planner's setup step and the trip planner's assistant use it.
- **`WizardOptionCard`** and **`WizardOptionGroup`** (`components/planner/wizard-option-card.tsx`):
  one answer of several as a card, an icon or a photo, a title, a sentence, the check, and on the
  right the answer's effect (`aside`, „+2 Parktage“). It is the one option card of the planners:
  hotels, gateways, ticket answers and the free-days question all draw it, and a new option card is
  a prop here, not a second component. The group is `role="radiogroup"`, named by the question
  (`labelledBy`), and owns the arrow keys with a roving tabindex as `PlanSegmented` does. `dashed`
  draws an answer that leaves the choice to the plan, `size="tile"` two big cards side by side.
- **`PlannerStepRail`** takes `reachable`: the last step a press may jump to. The day planner leaves
  it at the current step; the trip planner raises it to the last step once the dates are chosen,
  because every step after them is optional. `jumpLabel` names each step's button („Schritt 4,
  Hotels“).
- **`ENTER_BELONGS_TO`** and **`STEP_MOTION`** live beside the rail: Enter means Next only where the
  focused element does not own the key, and a step slides in by CSS under `motion-safe`.

## The trip planner's assistant

`TripWizard` (`components/trip-regions/wizard/trip-wizard.tsx`) asks the hub's trip planner one
question a screen. It is a dialog: the whole height of a phone, a stage of at most 768 px in the
middle of a desk. „Reise planen“ in the planner chapter and the hub (`tripPlannerUi.openStart`)
open it on the dates; the result's ways back in (`PlanEdit`, and the answer chips through
`tripPlannerUi.openStep`) open it on their step. The phone's Back button closes it, as it closed the
sheets before. Every answer writes the planner's state, the address, through `usePlanContext`, so
the assistant is a view on the plan: shared links, Parky and „Copy link“ keep working, and leaving
in the middle keeps every answer given.

### The steps

`lib/trip-regions/wizard-steps.ts` works the steps out of the region's data, never per region by
hand: dates, parks, hotel (a region without bases) or route and hotels per city (Japan, Paris),
tempo, evenings, tickets, then the finale. Each step lists its questions (`TripWizardQuestion`); a
step with one question goes into the option step before it, else the one after. Dates, parks and
tickets never merge. So Japan's evening question, the only one there since Tokyo Disney sells no
hopper, sits in Tempo, and a Paris trip of two nights or fewer has no hotel change, so its hotel per
city sits in the Route (`MIN_NIGHTS_FOR_A_MOVE`). A region without a ticket catalog has no ticket
step. `pnpm test:wizard-steps` pins the four regions' lists.

A step body is a component under `components/trip-regions/wizard/steps/`, registered in
`WIZARD_STEP_BODIES` (`steps/index.tsx`); a step without a body is left out. It receives
`WizardStepProps` (`wizard-step.tsx`): its `questions`, `merged` when it is drawn inside another
step, and `askId`, the id of Parky's question for a radiogroup's name. It draws only those
questions and owns no title, footer or focus. `useWizardAsk` words Parky's question from data where
the step's default (`tripPlanner.wizard.ask.<step>`) is not enough; `useWizardFrame` hands over the
ticket step, the month a month page opens on, the planner's `PlanEdit` and „Plan jetzt zeigen“.

### The band

`WizardGuideBand`: the region's Parky scene (`useRegionScene`, the registry's loader) right-aligned
at its own 2 : 1 and faded into the card's ground on its left (`mask-l-from-65%`), so Parky is
never cropped at 360, 390 or 1280 px. The band is 128 px tall on a phone and 160 px at a desk. On
the left the line over the question (region and step, then region and dates, then „Fertig“) and
the speech bubble, whose tail points at Parky. The bubble stands on the card's ground, not on the
scene, is the dialog's title and takes the focus on every new step, so a screen reader reads the
question first. The evenings step gives the scene's container `dark`, its night version in either
theme.

### The frame

- **Rail:** the step's labels („Daten, Parks, Route, Hotels, Tempo, Tickets“), walked steps as
  buttons, and once the dates are chosen every step.
- **Footer:** the plan ribbon once the trip has dates, then Back, Skip and Next. The first step has
  neither Back nor Skip, and Next waits for the departure; in the When mode it reads „Reisedaten
  suchen“ and leaves for the search's answer. The last step's Next is „Fertig, Plan ansehen“, which
  leads to the finale; a phone hides its Skip there, which would do the same and leaves the label
  no room.
- **Enter** runs the footer's primary control, with `ENTER_BELONGS_TO` as the guard.
- **Leaving for the plan** closes the dialog and puts the answer at the top of the screen with the
  focus in it.

`PlanRibbon` (`plan-ribbon.tsx`) is the plan as one row: a field per day, a park day in its crowd
colour with the park's code (`parkLabel`), a free day empty, a travel day dashed. The row is
`aria-hidden`; the line under it („6 Parktage, 8 frei · Spitze etwa 78 Min.“, the peak from
`planSavings` and `shownTotals` as the result's) is `aria-live` and changes once the API has
answered, not on each press.

### Dates and parks

The dates step is the planner's date grid (`PlanDatesStep`) with a row of month chips over it
(`monthChips`): a trip three months out is one press, not three. Once the arrival is pressed, Parky
asks „Und wann fliegst du zurück?“ (`onPending`).

The parks step draws a card per park, by resort: the photo (`tripPlannerPhotos`) or a tinted field
with the park's code, the card itself a checkbox, and a chosen card's stepper („Tage − 2 +“, the
`visitSteps` of the setup). A park not chosen is paler and names the way there, from the hotel area
or from the nearest city of a region with bases („Etwa 110 Min. mit dem Fernbus ab Tokio“); a park
closed on every day of the trip says so before anyone chooses it. More than four parks outside the
headliners fold behind one row.

Where the plan left chosen parks out (`parksLeftOut`, until the API names the conflict with a code),
Parky says which, and up to three cards make room, each counted as `trip_left_out_fix`: a park on
the travel days, only the parks left out (where they are most of the choice, a Paris weekend's two
Disney parks against Parc Astérix), and a longer trip.

### Days without a park

`SpareDaysQuestion`, from `lib/trip-regions/spare-days.ts`: once the free days outnumber the park
days, or more than three fall in a row (`LONG_FREE_RUN`), the parks step asks what should happen on
them. A free day is one the API marks `spare` (2.21.1), from an older API any rest day nobody
pinned. Four answers, each with its effect on the right: more parks (the API's `spareDayParks`, else
the region's other parks), one more day in each chosen park, free days spread over the trip (what
the plan does already, so chosen to start with), and a shorter trip, last because it changes the
dates. An answer writes the state at once; another answer starts again from the state the question
was asked for, and the figures stay those of that plan while the step is open.

### Tickets and the finale

The tickets step has two big answers: „Noch nicht“, with the plan's ticket card under it
(`PlanTicketsCard`, the result's), and „Ja, schon gekauft“, which opens the planner's ticket step
(`PlanTickets`, counted as `trip_tickets_opened` with `from: wizard`). Back to „Noch nicht“ takes the
tickets entered there out of the plan.

The finale („Dein Plan steht.“) shows the planned parks as `PlannerPolaroids`, the trip in one line
(days, park days, cities), the peak wait against the trip's average in the result's words, the
ribbon from the first day to the last, and short lines from the plan: the cities and their nights,
the parks it had no day for, and that the day planner asks who comes along for each park day.

### What it counts

`trip_wizard_step` (`step`, `via`: next, skip, back, jump, answers) when a step comes on screen;
the first screen of a start is `trip_planner_started`. `trip_wizard_finished` (`skipped` 0, 1, 2,
3+; `early` for „Plan jetzt zeigen“ before the last step), `trip_wizard_closed` (`step`) for an
assistant closed without the plan, `trip_spare_choice` (`choice`). The inventory:
[analytics](../../development/analytics.md#our-own-events).

## The trip planner's option steps

The trip planner's assistant (`TripWizard`) asks Hotel or Route and Hotels, Tempo and Evenings
after the dates and the parks. Each is a body in `components/trip-regions/wizard/steps/`,
registered in `WIZARD_STEP_BODIES`, and draws only the questions `tripWizardSteps` hands it. Every
answer goes through `usePlanContext().update` with the planner's own helpers (`chooseHotel`,
`setGateway`, `setBaseNights`, `setBaseArea`, `setMoveBuffer`, `setSplit`), so the address stays
the state. The pure halves are in `lib/trip-regions/wizard-choices.ts`, pinned by
`pnpm test:wizard-choices`.

- **Hotel** (Orlando, California): the hotel kinds as tiles with the line each region already has
  (`hotelLabel`, `hotelHint`), then the area (`AreaPicker`). A hotel picks its area where none is
  set, and the area's lead says so.
- **Route** (Japan, Paris): arrival and departure as cards, the city first and its gateways small
  (`gatewayChoices`). A gateway several bases share (Charles de Gaulle) is the dashed card that
  leaves the hotel to the plan; without one, the dashed card is "Not decided yet". The cities
  stand on a line with their number (`StayMarker`), a park photo, "by the plan" or "fixed", and a
  nights stepper; between two stays the ride and its notes (`baseLegs`). Cities to add are dashed
  buttons. A trip of one or two nights sleeps in one city, so the others fold away.
- **Hotels** (Japan, Paris): per city the trip stays in, its `stayNote` and `AreaPicker`; then the
  hotel change's minutes as a segment, only where the plan changes hotels. Until the plan answers,
  the cities are the ones nearest the trip's parks (`homeBases`). Parky names the cities.
- **Tempo**: automatic, an own limit or no rest days, each card with a week drawn as a pattern
  (`pacePattern`, park days solid). Then second days and a park on each travel day; a travel
  day's card names the city the trip starts or ends in and the park that closes last on the
  arrival or opens first on the departure (`travelDayFact`). The region's planner guide is linked
  here, the one link that explains the options at length.
- **Evenings**: the evening switch with the places of the trip's resorts as chips, the fireworks
  as two tiles, keeping Disney and Universal days together (three cards once tickets of both
  resorts are entered), and park hopping. Without a hopper, hopping is a locked dashed card. Where
  the API's verdict on a suggested ticket finds a park or an evening only the hopper adds, the card
  says it ("Mit Park Hopper kommt am Fr., 11. Dez. abends EPCOT dazu.") and offers the plan with
  it (`toggleHopper`, as the ticket card does). Japan's single evening question is drawn in Tempo.

### The area picker

A city with more than `AREA_CHIPS_MAX` (4) areas gets a card per area and a schematic map; fewer
get chips with the chosen area's ways under them. A card carries the area's number, its early
slot (`hotelAreas[].perks`, the words of `tripPlanner.marker.early`) and its ways to the trip's
parks from `travel.legs` (`areaWays`, door to door with `legMinutes`, nearest first). Past
`MAX_AREA_WAYS` parks the ways are one line per resort with the nearest and farthest minutes, so
Orlando's seven headliners read as two lines. Where a way is a drive, the OSRM credit stands under
the cards.

The map is an SVG from the API's coordinates, no tiles, so it asks nothing of the network and
both themes come from the tokens. `schematicMap` projects flat, fits the box and nudges places
apart until no two overlap (Maihama and the DisneySea hotels are a kilometre apart, Shinjuku
twenty), so it is a schematic, not to scale. Parks join a city's map only within
`MAP_PARK_MINUTES` of one of its areas: Fuji-Q stays off Tokyo's map, its card still names the
bus.

### Accessibility and the statistic

- Each single choice is a `WizardOptionGroup` named by Parky's question or the heading above it;
  the area chips are pressed buttons in a group named the same way.
- The map is `role="img"` with a name that counts the areas and lists the parks; the cards under
  it are what is operated, and their numbers are the circles'.
- The Tempo patterns are pictures (`aria-hidden`); each card's sentence says the same. The route
  stepper shows the number and is heard as "4 nights".
- A way on an area card is heard as the planner's sentence for its mode ("About 10 min on foot").
- The locked hopping card is text, not a control; only its button is one.
- Answers count as `trip_option_changed` through the state's diff, as before; the hopper button
  counts `trip_hopper_toggled` like the ticket card's.

`PlanOptions` (the radio and checkbox list), `PlanRoute` with its selects, `PlanRouteOptions` and
`PlanRadioGroup` are gone; their keys under `tripPlanner.options` and `tripPlanner.route` that
nothing reads any more went with them.
