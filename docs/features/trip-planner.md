# Trip planner

A visitor's own plan for one day at one park: which rides, in which order, at
which minute — laid out on a timeline against the park's own wait-time forecast.
Everything lives in the visitor's browser. There is no account system, and the
plan is theirs.

## Where it lives

| Piece                           | File                                                     |
| ------------------------------- | -------------------------------------------------------- |
| Its own page                    | `app/[locale]/trip-planner/page.tsx`                     |
| Localized URL segments          | `lib/planner/segments.ts`                                |
| Store (localStorage + cookie)   | `lib/planner/store.ts`, `lib/planner/actions.ts`         |
| Plan shape                      | `lib/planner/types.ts`                                   |
| Day geometry (minutes → pixels) | `lib/planner/day-grid.ts`, `lib/planner/bar-geometry.ts` |
| Park-local time                 | `lib/planner/park-time.ts`                               |
| The wizard                      | `components/planner/planner-wizard.tsx`                  |
| The panel                       | `components/planner/planner-flyout.tsx`                  |
| The day grid                    | `components/planner/planner-day-grid.tsx`                |
| The page's article              | `app/[locale]/trip-planner/content/<locale>.tsx`         |
| Its frozen day                  | `app/[locale]/trip-planner/_fixtures.ts`                 |
| Its demo wrappers               | `app/[locale]/trip-planner/_demos.tsx`                   |

## The wizard is the way in

`PlannerWizard` asks four questions in the order somebody answers them
(`type Step = 'park' | 'date' | 'setup' | 'headliners'`), then lands on the
park's own page with the panel open. The fourth step lists the park's headliners
for that day (`headlinersToAdd`) and how many of them the day holds.

1. **Which park** — the site's own `/api/search`, filtered to `type === 'park'`.
   The four URL slugs a plan is filed under are **taken from the API's own
   `url`**, never rebuilt from display names: "Netherlands" is not `netherlands`
   in every language, and a guessed path is a plan pointing at a 404.
2. **Which day** — a month grid tinted with that park's own crowd forecast
   (`PlannerMonthCalendar`). It replaced a native `<select>` with sixty
   consecutive options, which could not answer "the Saturday after next" without
   reading every row. The forecast also carries the park's **timezone**, which is
   the only reason this step fetches anything.
3. **Who is coming** — the shortest rider's height and whether the party wants
   to stay dry. Both are flags on the ride list, never filters: a filter would
   quietly shorten the park, and the visitor is the one who knows whether
   grandma is holding the bags at the exit. Lunch is the third answer and is just
   a block in the day.

Picking a park **does not write to the plan**. The date is still unanswered, and
the version before the wizard filed the park under today in the _reader's_ zone —
tomorrow's plan for a Florida park picked from Germany after 18:00.

### The frame, and why it looks like this

Three fixed pieces around one changing one — a photo band, a progress rail, the
step, a footer — so it reads as one object being filled in rather than three
dialogs in a row. Before this it was a shadcn dialog with a title, the line
"Schritt 2 von 3 · Tag" and a pair of buttons: correct, and indistinguishable
from a cookie prompt. Nothing about it said the subject was a day out at a named
park, though the search payload had been carrying that park's own photograph the
whole time.

**The photo band.** The park's own background picture, at the focal point the
media database curates, straight off the search hit. It arrives at the moment the
park is picked, which is the one bit of theatre in here and is earned: choosing
Phantasialand should look different from choosing Efteling.

_No photo is a designed state, not a grey box._ The first step has no park yet,
and "another day at this park" has no photo at all, because a plan stores slugs
rather than asset URLs. Both get a tinted field and the oversized translucent
glyph the site's chapter headings use, at the same height, so nothing moves when
the picture lands. There is a client-safe media manifest that would fill the
second gap (`@/lib/media/hero`, 21 KB) and it is deliberately not used: it holds
a picture for eight of 212 parks, and 21 KB of JavaScript for a decorative band
on 4 % of the catalogue is the wrong side of this project's payload budget.

_The scrim is measured, not chosen._ The first pair of stops
(`from-black/85 via-black/45 to-black/5`) looked right on Phantasialand's night
shot and was not. Rendering six parks, hiding the text and walking the luminance
of the exact box it had occupied put the second line — `text-xs`, so it owes
4.5:1 — at **4.20:1 on Disneyland at the 95th percentile**, with the brightest
pixel under the title down at **2.73:1** against the 3:1 a 20 px semibold
headline owes. At `/95 · /70 · transparent` the same twelve cases (six parks ×
two viewports) read **8.73–14.09:1 at p95 and 5.42–7.39:1 at the single worst
pixel**, and the castle's stonework is still legible.

_The second line's date may not clip._ At 360 px "Brühl, Deutschland · Samstag, 19. September" is wider than the band, and one `truncate` over the pair cuts the
half the reader is there to check. The place gives way; the date keeps its width.

**The rail.** Equal columns, with the connectors measured off them. The first
version was a flex row where each step's connector took the space its own label
did not, so three circles labelled "Park", "Tag" and "Wer kommt mit" came out at
**15 %, 72 % and 92 %** of the row with one connector eleven times the length of
the other — a progress bar reporting the width of its own captions. It is
16.7 / 50 / 83.3 % now, with both connectors identical to the pixel. A
**finished** step is a button, because the commonest correction in a
three-question form is "wrong day" and pressing the day is shorter than pressing
`Zurück`. Nothing leads forward: that is the footer's job, and it is the half
that knows whether the current question has an answer yet.

There is **no footer on the first step**. Picking a park from the list _is_ the
advance, so a `Weiter` button there is a control nobody presses sitting next to a
`Zurück` that leads nowhere.

**The footer is the one row a label sizes**, so it takes `px-3` below `sm`
rather than the step body's `px-5`. Measured at 320 px across six locales the
pair of buttons wants 194–240 px, and French is the outlier: `Retour` +
`Ouvrir le planning` had 231 px and was nine short. Shortening the French was
the wrong repair — „planning" is the term the other nine strings in that locale
use, so buying nine pixels with „plan" would leave one button disagreeing with
the rest of the panel. At `px-3` the row offers 247 px and the widest locale
keeps 7. Measure the **natural** width (`scrollWidth` per control), never the
span the two ends occupy: `justify-between` fills the row whatever fits, so that
span equals the available width right up to the moment it overflows and reads as
"exactly right" the whole way — which is how a first pass at this reported
"fits" for German at precisely 231/231 and flagged all six as overflowing after
the padding changed.

**The step transition is CSS, not GSAP.** `motion-safe:animate-in
slide-in-from-*`, remounted on a `key={step}`. The house rules for GSAP
(`lib/hooks/use-menu-reveal.ts`) exist because a _reveal_ that strands leaves an
invisible element behind; a step swap animates content CSS already has at its
resting state. Same trade `tabs-with-hash.tsx` makes, and it costs no chunk.

**The last step is cards, not checkboxes.** Three native checkboxes in a column
is a form, and the other two steps are a photograph and a tinted calendar — so
the last step read like the settings page of a different application. The height
row's opening value is `RIDER_HEIGHT_DEFAULT_CM`, **typed as a member of
`RIDER_HEIGHT_CHOICES`**: it used to open on 105 cm against a row of round tens,
so switching the question on showed six chips with none of them marked while the
plan already held an answer. `pnpm test:planner-actions` asserts the membership;
the type annotation is what enforces it.

**The first question is typed, so the field takes the focus.** Without
`autoFocus` Radix parks it on the dialog and the first keystroke goes nowhere.
The result list is operated **from the field** — the options carry `tabIndex={-1}`
and the highlight travels as `aria-activedescendant`, the combobox pattern —
because moving focus into the list would take the caret out of a field somebody
is still typing in; Enter picks the highlighted park, and a stray one would
otherwise reach the step's own „Weiter" button. The highlight is held as the
park's **slug**, never an index: an index would have to be reset on every new
result set, which React 19 forbids in an effect body outright, while a slug that
is no longer in the list falls back to the first row on its own — which is also
the right default, since somebody who types three letters and presses Enter means
the top hit.

### What the day card may say

`WizardDayCard` renders only fields of the park's **best-days snapshot** — the
cheap one, ~15 KB of status, crowd level, hours and holiday flags per day,
materialized by the backend and CDN-cached (`/calendar` computes percentiles per
day and takes seconds cold). Ninety days, which is what sets the calendar's
horizon: past the snapshot every cell is a bare number.

Four states, four different sentences: no day picked yet, the park publishes no
hours at all, a closed day, and a day with a forecast. The empty state was the
bug worth fixing — with nothing picked it said "für diesen Tag haben wir noch
keine Prognose", a claim about a day nobody had named.

Hours render **only where the snapshot named the park's timezone**. A clock time
with no zone behind it is this feature's one unforgivable mistake: every minute
in a plan is park-local by construction.

### The panel is a column, not a dialog

A click on the page behind it used to close it. That is right for a modal and
wrong for this: the panel sits **beside** the page — the layout is inset by its
width, the hero and the header respect it — and the whole point is reading the
park on the left while the plan stands on the right. Every click into the text
folded it away. `onInteractOutside` is prevented on the desktop and left alone on
a phone, where the panel really does lie over everything and the tap outside it
is the only way back.

## Everything is park-local

A plan's date and every entry's `startMinute` are in the **park's** zone. The
reader's own offset never enters the planner — `todayInZone` (`park-time.ts`) is
the only door to the fallback, and it is named so a reader can see when the
reader's zone is being used because the park's is not known yet.

## Dragging a ride into the day

A ride card's root is an `<a>`, so every browser makes it draggable for free —
and that free version failed at the two cases that are most of the gesture.
Grabbing the **photo** drags the image, so `text/uri-list` is
`/media/phantasialand/taron.jpg`, which has no `parks` segment and was refused
with no explanation. And a URL names a slug and nothing else, so the drop had to
look the **name** up in the `/plan/day` payload — which answers 404 until the
backend ships, making every drop a silent no on the exact build a visitor would
try it on.

So a drag carries its own payload (`lib/planner/ride-drag.ts`): the park, the
slug and the name, under a private MIME type. `text/uri-list` stays on the drag
and the drop handler still falls back to it — this adds a channel rather than
replacing one.

It is attached by **one capture-phase `dragstart` listener on the document**
(`useRideDragSource`), not a handler per card. `AttractionCard` is a Server
Component rendered in eight places and `onDragStart` is a client prop, so putting
the source on the card would mean a client boundary around every ride grid in the
app — or a wrapper element between the card and its grid, which breaks the
`row-span-3` + `subgrid` chain and slices the title and the wait time off (the
trap `design-system.md` records for the blog spotlight cards). The listener is
armed only while the panel is open, because that is the only time there is
anywhere to drop.

## The backend endpoint, and what happens without it

The forecast a plan is laid out against comes from `/plan/day`. It ships on its
own schedule, so every surface is written to answer honestly when it is not
there:

- **200** → the panel draws bars and a settled context band.
- **404** → the panel **says** there is no forecast for that day, and draws
  neither a bar nor a skeleton. An empty bar track beside an em dash reads as a
  wait of zero; a skeleton that never resolves reads as still loading.

`pnpm check:planner` probes the endpoint first and asserts against whichever
answer it got, so the check is meaningful in both worlds.

The wizard, the month calendar and the day card need none of it: they read the
best-days snapshot, which is live today.

## Showtimes: a listing and a projection are not the same thing

Shows arrive inside `/plan/day` (`lib/planner/shows.ts`), and each entry carries
a `source` the panel may not resolve away:

- `scheduled` — the operator's own listing. Published for today and for days
  already gone, and for nothing else. No source anywhere knows showtimes in
  advance.
- `projected` — the last matching weekday carried forward, with the
  `observedOn` date it was taken from and the `sampleDays` behind it.

So a projection is drawn softer than a listing everywhere it appears: the band
above the grid says „Voraussichtlich" instead of „Als Nächstes", the time in the
gutter is prefixed with a `~`, the rule across the day is dotted rather than
dashed and the name on it is italic and muted. Where several showtimes fold into
one rule, a projection anywhere in the group decides the treatment — the rule
runs one way only, so the softer one is the only one that is not a promise about
the shows it stands for.

**A projected time outside the park's published day is dropped.** The projection
comes off a different date and that date is often the longer one: Phantasialand
closed at 18:00 on 2026-09-03 and its projection came from 2026-08-13, a
late-summer evening — 22 of the 48 showtimes the API returned sat past the
close, the whole Wintertraum and laser run from 18:15 to 21:00, drawn down an
axis that ends at 19:00. A listing is never clipped: an operator publishing a
time for this date outranks an opening hour we derived, which the API says out
loud for `hoursSource: "observed"`, where its window is narrower than the park's
real one.

**And the window that clip is given has to be unfolded.** A park whose day
crosses midnight publishes `closeHour < openHour` — La Ronde is `11 → 1` — so
the two hours multiplied by 60 make a window that runs backwards, `660 → 60`.
Every showtime of the day falls outside that, and because the clip only touches
projections it took the whole projected programme out of the column with no
error anywhere. `showDayHours()` builds the pair through the same
`unfoldedCloseHour` the axis uses, and both call sites go through it rather than
multiplying at the call site — the two rules have to be one rule, or a show
lands beside an axis with no room for it. The times themselves are **not**
unfolded and must not be: the API buckets a performance by its own park-local
calendar date, so a 00:45 show belongs to the following day's `shows` rather
than to this one's past-midnight tail, and every entry in a day's array is an
ordinary 0–1439. `pnpm test:planner-shows` pins the window, the clip and the
listing's exemption from it.

Before this, showtimes were read off the live park payload, which only ever knew
today — so sixty of the sixty-one dates the picker offers drew nothing and the
band had to say „steht erst am Tag selbst fest". That sentence is gone; an empty
`shows` array is now a statement about the park.

**They switch off, and a phone has no strip at all.** Shows are the one thing on
the grid nobody put there — a plan is what somebody dragged in, and four dotted
rules across it are context. The switch (`lib/planner/shows-visible.ts`, an
external store on `localStorage` so the decision survives a reload) hides the
rules. It renders only where there is something to switch: on a day the API
answered with no shows, a control that toggles an empty set is a control that
does nothing.

On a **desktop** the switch lives in the band, and the band stays when the shows
are off and says „Spielzeiten ausgeblendet": 22 px is not what is missing there,
and a strip that vanished would take the switch with it.

On a **phone** the band is not drawn (PAR-482, „lass uns das Showband ausblenden").
It used to collapse to its switch when the shows were off and stand 44 px tall
when they were on, `sticky` at the top of the axis' scroller, so the default
state covered 44 px of the day with a sentence the grid already says at every
show. The planner passes it `planner-phone:hidden`; the trip-planner page's demos
render it without a switch and are unaffected. The switch is `PlannerShowsButton`
there, the theatre masks at the end of the foot's optimise row — the mark every
show line in the grid carries, so the button looks like what it hides — with
`aria-pressed` and the primary tint for on. It was a chip „Shows" in the context
band first, which pushed that band's chip row onto a second line at 390 px (60 →
80 px); the optimise row had room once the notification bell went up beside the ×.
The flyout passes it only for a day with shows (`dayHasShowLines` in
`lib/planner/shows.ts`, asked exactly as the grid asks), because the row is drawn
for its trailing control alone where there is nothing to optimise, and a switch
over nothing would leave that row empty.

## The photo behind the panel sits in a NEGATIVE layer

The panel carries the park's own picture — resolved server-side by the
`/plan/day` proxy out of the media database, with the focal point a curator set.
The first version put it in the wrong stacking layer, and the symptom was
reported as "the elements at the top and bottom are far too transparent and
dark".

They were not transparent. They were **underneath**. `PlannerPanelPhoto` is an
`absolute inset-0` layer, and an absolutely positioned element with
`z-index: auto` paints in the positioned layer — above the inline content of
every in-flow sibling. So the header, the context band, the coach hint and the
free-block row were being drawn under a 12 % photograph and a
`from-background/75 via-background/55 to-background/90` wash, which thinned
them. Only the grid looked right, because its blocks are absolutely positioned
too, and only the headliner band held up, because it carried a fill of its own.

Nothing about that is visible to a DOM assertion — every class was correct — so
it is measured off the composited panel instead. Ink against ground at
Phantasialand, before and after `-z-10`:

|                 | 1400 px panel | 390 px phone   |
| --------------- | ------------- | -------------- |
| Kopfzeile       | 1.49 → 8.47:1 | 1.63 → 10.48:1 |
| Kontextband     | 1.45 → 6.02:1 | 1.48 → 5.79:1  |
| Headliner-Bande | 1.29 → 8.44:1 | 4.49 → 11.38:1 |

`SheetContent` carries `isolate` with it: a negative layer keeps going until it
finds a stacking context, and without one it would disappear behind the panel's
own background. `backdrop-filter` already forms one wherever it is supported, so
the `isolate` only matters where it is not — it costs nothing and takes the
browser's word out of the arrangement.

The alternative a judged design pass proposed was the park page's own recipe:
give every chrome row `TILE_GLASS` (75 % fill, 40 px blur). It would have worked
and it was the wrong fix — up to ten nested 40 px backdrop-filters inside one
sheet, live on a phone, re-rasterising while a block is dragged, to paper over a
one-declaration stacking bug. Its own risk note said so.

One thing the audit turned up on the way: the headliner band shipped as
`bg-crowd-high/10 bg-background/70`, two `background-color` declarations on one
element, so the crowd tint never painted at all.

**And the empty panel had no picture at all**, which is the one screen that
needed one. The photo arrives on `/plan/day`, and with nothing planned there is
no active park, so no query and no photo: standing on Toverland's page the panel
opened as a black rectangle over a park page that had a perfectly good picture.
So the beacon that already tells the panel which park the route is about
(`PlannerPageParkBeacon`) carries the photo too — resolved by the **route**,
because `getParkBackgroundImage` reads `@/lib/media`, a 107 KB catalogue that a
Client Component in the layout may not import. The panel branches on the
**active park** rather than falling back field by field, so a day whose query is
still in flight shows nothing rather than briefly showing a different park's
façade.

## A sentence may only point at something that is there

Three strings promised a ride search "unten". `PlannerRideSearch` has exactly one
call site, behind `park && activeDate` **and** a `sm:hidden` wrapper — so it
exists only below 640 px and only with a day open. Mapped against that:

- **`empty.body`** was the `sm:block` half, i.e. displayed at exactly the widths
  where the search does not exist. False in all six states that reach it.
- **`empty.bodyMobile`** was true in one of those six — the rarest, a day whose
  opening hours are unknown. In the state a new visitor actually meets (panel
  opened from the homepage, nothing planned) the search is not mounted at all
  and the sentence pointed at three lines of help text.
- **`empty.bodyGrid`** carries no viewport class, so it was true on a phone and
  false at every width above it — and that desktop state is the most common
  empty state in the panel.
- **`search.dragHint`** named an HTML5 drag _inside the phone-only search_, i.e.
  on the one pointer that has no such gesture, while the desktop string gave a
  tap instruction. The two halves of the guidance were swapped across the very
  breakpoint the search is gated on.

So: the flat branch says nothing at all now — a title, the wizard button and the
three steps, all of which are on screen and true; the grid overlay carries one
sentence per pointer, chosen by CSS rather than by `useMediaQuery` (whose server
snapshot is `false` and would ship the phone's line in every desktop's first
HTML); the desktop half is `coach.drag`, the same key the coach hint uses, so
one gesture has one wording; and the coach stands down while the day is empty so
the two never appear together.

## One chip for every drag

Nothing set a drag image, so the browser snapshotted whatever the gesture
started on and the ways into a plan looked like three different features: a
400 × 36 px row from the panel's list, the whole 405 × 404 px `AttractionCard`
from a park page, and a bare pill from the headliner band.

`setRideDragImage` (`lib/planner/ride-drag.ts`) draws one chip — the ride's photo
at 32 px and its name — and all three call it. It is appended **off-screen rather
than hidden** and removed two frames later: `display: none` produces no snapshot
at all, and removing it in the same tick races WebKit.

**The thumbnail is painted, never loaded.** A drag image is snapshotted
synchronously inside `dragstart`; whatever has not arrived by then is not in the
picture, and the browser never redraws it. The first version cloned the source
`<img>` and set `clone.src = found.currentSrc || found.src`, which is two bugs in
one line. The clone is a request — same URL, warm cache, almost always instant,
and „almost" is the whole story when nothing waits. And `currentSrc` is empty
until an image has actually loaded, so the fallback reached `src`, which on a
`next/image` element is the **last srcset candidate**: `w=3840`, 147 KB, a
rendition the page never asked for. Every card whose photo was still in flight
therefore started a fresh download of the largest copy in existence and drew the
chip with a hole in it.

So the picture is copied into a `<canvas>` with `drawImage` from pixels that are
already decoded — zero network at the call — and the source has to pass
`complete && naturalWidth > 0` or there is no picture at all. The cover geometry
and the curator's focal point are computed here (`coverOffset`) rather than left
to `object-fit`, because a canvas's content _is_ what was drawn onto it. The
backing store is at the device pixel ratio: the OS composites a drag image at the
screen's real resolution, and a 32 px canvas blown up on a retina display is the
one place the seam would show.

**A source with no picture of its own has to ask before the gesture.** The
headliner pill is a bare pill, so there is nothing decoded to copy — it warms the
thumbnail on `pointerenter` (`warmRideDragThumb`), which always precedes the
press that starts a mouse drag and costs nothing for a band nobody points at. The
URL is the optimizer's `w=96&q=75`, which is exactly what `PlannerRideThumb` asks
for at `size={8}`, so a ride that is also a row in the list shares that
rendition's cache entry. Where there is still nothing to draw — a card below
`sm`, which renders no photo at all — the chip is the ride's name and the drag
warms the rendition for next time. An empty grey square would claim a picture
that is not coming.

`check:planner` reads it off `setDragImage` rather than off a screenshot — an
OS-level drag image is not in the page to capture — and asserts the three sources
hand over the same class, the same height and one image each. The count alone was
never the assertion it looked like: the version this replaced also appended
exactly one element per chip. So it walks the canvas's **alpha channel** and
fails on a thumbnail that was never drawn into, and it hovers each control before
dispatching the drag, because a synthetic `dragstart` with no pointer anywhere
near it would measure a chip no mouse can produce.

## Three ways the panel said something it could not know

**A refused drop handed the link back to the browser.** `onDragOver` on the grid
accepts a bare `text/uri-list` optimistically — deliberately, and its own comment
says why: that is the channel a ride card from a park page drags on. But it means
the element has claimed the drop before anyone has seen the payload. `onDrop`
called `preventDefault()` only _after_ `if (!ride) return`, so any link that is
not a ride URL — from this page or another tab — fell through the refusal to the
browser, whose default action for a dropped link is to follow it. The app
navigated away and took the open panel with it. It is prevented first now, before
any refusal, in both handlers (the grid's and the flat list's in the flyout).

**Blocks past the lane budget overlapped in silence.** `packLanes` caps a cluster
at `MAX_LANES` columns — three 112 px columns is the floor at which a name and a
figure still fit on a phone — and rides everything beyond that in the _last_
column, where they overlap. The count came back on `LanePlacement.overflow` and
nothing had ever drawn it, so four rides at one hour rendered as three with the
fourth underneath the third. A fourth column is not the answer; saying how many
are under this one is, so the block the count is reported on (the last placed,
and therefore the one on top) carries a `+N` badge.

**A park nobody measures got an invented wait.** `estimateFor` answers a ride it
cannot find with `ASSUMED_WAIT_MIN = 5`, which is right for its intended case: a
ride with no _history_ in a park that is measured. A park with no _source_ lands
in the same branch and means the opposite — Hansa-Park publishes its wait times
only in its own app on the park WLAN, so no number will ever arrive. And
`/plan/day` for it answers with `rides: []` and a drawn 11–21 axis, which is
byte-for-byte what a measured park with no history looks like.

The distinguishing bit is a property of the park, so it comes from the API:
`context.liveWaitTimes`, the same curated flag the park payload carries (backend
PR #226). It is read through the app's one reader, `hasReadableWaitTimes()`,
which treats an **absent** field as available — this app deploys independently of
the API, so a response predating the field behaves exactly as it did. Where the
source is unreadable the estimate is `missing: 'no-source'` with no figure at
all, and the block says so; `pnpm test:planner-estimate` pins both directions,
including that a ride the payload _does_ carry still reports its number.

## The tab is on every page, so it has a phone tier

The edge tab is drawn on **every** page whether or not anything is planned, which
is right — the feature has to be findable from a park page — and on a phone it
was a permanent strip down the right edge at 34 × 130 px in German and 136 in
French, against a 390 px screen. Below `sm` everything in it steps down one size:
the padding, the two gaps, the icon and the word. Measured 34 × 130 → **28 × 102**
(de) and 136 → 107 (fr), with 640 px and up unchanged to the pixel.

It is deliberately not reduced to the icon alone, which would halve it again and
turn the one control that opens the feature into a glyph nobody has seen before.
The word is also the button's accessible name, so hiding it would need an
`aria-label` saying the same thing twice.

## The axis is the park's day, and the canvas is not

`buildDayGrid` answers a question about the **park** — when it opens, when it
shuts, plus half an hour either side for the arrival and for a queue joined near
closing. A plan is not bound by that: `clampStart` lets a block START up to
fifteen minutes before the park shuts, so a sixty-minute free block reaches
forty-five minutes past `closeMin` against a canvas that ends thirty past it. A
hotel check-in written at 18:30 for an hour ran off the bottom of the grid, drawn
over the gutter label that says when the day ends.

`growGridForSpans` widens the canvas until it contains the plan. Three things
make it honest:

- **`openMin` and `closeMin` never move.** They are what the opening-hours band
  is drawn from and what every placement rule (`clampStart`, `rideFloor`) reads,
  so the room that appears is outside opening hours by construction — and is
  hatched like every other minute out there, which is the right drawing of "you
  have planned something for a time the park is shut".
- **Only the extension is rounded**, out to the full hour: the ticks down the
  gutter stay whole numbers, and the axis grows in steps a reader notices once
  instead of by the minute. The base canvas already carries a deliberate
  half-hour pad, and rounding _that_ would add empty axis to every plan that
  fits.
- **It is fed from the committed entries, never from a drag in flight.** `yFor`
  measures from `gridStartMin`, so a canvas that grew mid-gesture would move
  every other block under the pointer. It settles when the block lands.

## Every ride block carries its photo

There used to be a floor — 48 px first, which at 1.2 px per minute is a
forty-minute queue, then 28 — and both were the same mistake in two sizes. A plan
is mostly made of twenty-to-thirty-five-minute blocks, so the picture appeared on
a headliner's worst hour and nowhere else: a four-ride day with four photographs
in the payload drew zero of them. A ten-minute block is a thin band of a
picture, which is a small thing rather than a wrong one; the block beside it
having none was the actual inconsistency.

Which is why the opacity dropped from 0.30 to **0.20** in the same change — the
two are one decision. A photo on one block in a column of six is an accent and
can afford to be strong; a photo on all six is the column's texture, and at 0.30
a lit wooden track was the loudest thing in a panel whose subject is a number.
The floor under it is the text, not the picture: the name and the wait are
`text-crowd-*`, a thin orange on a busy hour, and they keep the drop shadow at
every height.

The headliner band followed. A pill was a word in a rounded box — which is what a
_filter chip_ looks like — while these are rides, the same objects the list
draws with a photograph each. Twenty-four of Phantasialand's thirty-four have no
picture in the media database, so `PlannerRideThumb`'s coaster mark is the common
case rather than the exception and the box is the same size either way; a band
where half the pills carried a thumbnail and half did not would read as a loading
state. It also fixed the drag: the pill now holds a decoded image, so the chip
has pixels to copy without asking the network for any.

## Where a figure came from, and whether anybody checked it

Four fields on `/plan/day` say how much a number is worth, and each answers a
different question.

`tier` names the day's regime and has always been drawn: it decides the block's
lower edge, which ends hard on a measurement and fades over 10 px on a
composition and 22 on a long-range one. What it does NOT cover is that a day is
not all one regime. **`hours[].source` names the hours that depart from it**, and
it is not an edge case: 50 of Phantasialand's 254 hourly points on 2026-09-04
are `composed` under a `measured` day, because the 24-hour window the model
measures does not span the whole operating day. So the edge is drawn from
`PlannerEstimate.tier` — the hour's own source where it names one, the day's
otherwise — and the ghost under a dragged block reads it too, since dragging out
of a measured hour into a composed one is exactly the move whose edge has to
change while the pointer is down. An absent `source` means "the day's tier" and
never "unknown".

**`accuracy.basis` says whether anybody has ever measured how wrong the forecast
is at this distance**, and it behaves as documented again. It was typed and left
unread because on 2026-09-02 and -03 the API answered `unmeasured` for TODAY, so
applying its own rule — never present an unmeasured day as a plannable day —
would have refused every day the planner has. Re-measured on 2026-09-04 across
six lead times at Phantasialand: 0, 1, 3, 16 and 41 days all answer `measured`
with a `typicalError`; 87 days answers `unmeasured` with none. It is also what
the `long_range` tier turned into in practice — the same six probes never
returned that tier, and a day three months out is `tier: 'composed'` with
`basis: 'unmeasured'` — so the band reads the basis rather than waiting for a
tier the API has stopped sending.

There is one trap in it, and it fires on the days whose numbers are the best on
the panel: **a day that has already happened also answers `unmeasured`.** Nothing
predicted it, so nothing verified a prediction — while its figures are
measurements. Reading the basis there would put „nobody has checked these
numbers" under the only numbers in the panel that are facts, so `tier ===
'observed'` wins and the check pins it.

`accuracy.typicalError` is the day's own typical error in minutes (8.9 for
today, 14.3 at sixteen days). It is a TYPICAL error and not a bound — half the
days fall further out — so it is worded as „typisch 9 Min. daneben" and never as
a `±` interval that contains the answer, which is the rule `expectedError`
already carries per ride in the selection bar. It is folded INTO the tier's own
sentence rather than standing beside it, and that is a height decision: a
separate span measured 60 → 75.5 px on a 390 px phone, i.e. the grid stepping
down by that much the moment the payload landed. `accuracy.sampleSize` is typed
and unread — it grows with the lead time (50,759 for today, 1,155,876 at sixteen
days) because a composed day is scaled from a far wider historical window, so it
describes the method rather than the day.

**`context.hoursSource: 'observed'`** means the opening hours were derived from
hours somebody recorded rather than published, which happens past a park's
publication horizon — Heide Park answers it with 10:00–16:00 and
`status: UNKNOWN` for 2026-11-30. The window is narrower than the truth by
construction, so the hours chip carries a „(gemessen)" suffix and a title that
says the day may be longer. A suffix and not a badge for the same reason as
above: a badge measured 92 → 120 px in the 448 px panel.

Checked by `pnpm test:planner-estimate` (the hour-versus-day rule, pure) and by
five browser assertions in `check:planner` against a stubbed payload — the
interesting values are a park past its publication horizon and a date three
months out, neither of which is reproducible on a given morning.

## Two days side by side

The panel is resizable up to 900 px and a wide one drew **one** column with 500 px
of empty hour rules beside it. Two columns is what that width is for: "and what
if we went Saturday instead", side by side, rather than one day hidden behind a
picker.

**Two, and the number is measured.** Canvas here means the block area right of
the hour gutter, read off the rendered panel. A default 448 px panel gives one
column **395 px** of it; at `PANEL_WIDTH_MAX` (900) each of two columns gets
**397**. So at the top of the range two columns are two whole planners rather
than two compromises. A third would have to share the hour gutter, and the gutter
carries the weather rail, the showtime chips and the now pill — all three per
(park, date) — so a shared one costs the second park its weather and its
showtimes.

The floor is `TWO_COLUMN_MIN_WIDTH` = `PANEL_WIDTH_MIN * 2 + 1` (681): the same
minimum a single column has, applied twice. Below it the second column is **not
drawn** — but it is remembered, so narrowing the panel puts the arrangement away
and widening it brings the same day back rather than making somebody build it
again.

**The switch asks a different question from the column, and for a while it did
not.** Both hung on the panel's own width, so at the 448 px every visitor starts
on there was no switch at all: the only way to discover that the planner has two
columns was to drag the edge past 681 for reasons of one's own. The switch is
offered on the **window** now — `TWO_COLUMN_MIN_VIEWPORT`, the 681 above plus
`PAGE_MIN_PX`, so 1041 — read through `useMediaQuery`, and the press is what
widens the panel, via the same `plannerPanelWidth.commit` the edge drag uses.
Measured: at 1041 px of window the switch is there and one press takes the panel
448 → 681 px with two columns in it; at 1040 it is not there at all, because
`fitToViewport` caps the panel at `innerWidth - PAGE_MIN_PX` and the cap would
take that width back in the same frame. The number is derived from both floors
rather than typed, so it moves when either does.

The press only ever raises the width, and only to the floor: a panel already at
780 px keeps 780, and closing the second column leaves the width where it is —
both would otherwise undo a drag nobody asked to have undone. Pressed at a narrow
panel with a day remembered, it widens and brings **that** day back instead of
opening tomorrow over it. A phone is excluded on its own account (`isPhone`), not
because its number is small: the sheet is the width of the screen there and no
drag makes it wider. That gate cannot fire today — 639 px cannot also be 1041 —
and is kept because the two thresholds are independent.

**Which chrome moved, and why it is about what a control speaks for.** With one
column the panel header answered both per-day questions — one park name, one day
picker — and that stops working the moment there are two, because the header has
no way to say which of them it means. So the park chooser and the day picker sit
on the column now (`PlannerColumnHead`), and the rest of the day's chrome came
with them into `PlannerDayColumn`: the context band, the party chips, the
showtime strip, the axis, and the action row a selected block docks into. What
stayed panel-level is what follows the **primary** column — the ride search, the
headliner band, the free-block row, the totals — because those are how a day gets
filled and a plan has exactly one active day.

Two things are per column rather than per panel and both would be real bugs
shared:

- **The selection.** Entry ids are unique only within one (park, date) —
  `makeId` counts collisions among that day's entries alone — so `taron-1`
  legitimately exists in a Saturday column and a Sunday column of the same park,
  which is exactly the case two columns are for. A panel-level `selectedId` would
  highlight both blocks and delete whichever one the action row was handed. The
  Delete-key effect moved with it, and is inert in a column with nothing
  selected, so exactly one listener is ever bound.
- **The queries.** Each column runs its own `/plan/day` and its own live poll,
  keyed by (park, date). Two columns of the same park on two dates therefore
  share the park-level ones — the best-days snapshot has no date in its key and
  the live poll is gated on `isToday` — and pay twice only for what really is per
  day.

The state is **not** part of `PlannerState`. `trip-sync.ts` casts the whole plan
onto the wire in `payloadOf`, so a field added there ships to `PUT /api/trips`
unasked, and whether somebody has a second column open is a property of this
browser rather than of their day at Phantasialand — the same reasoning, and the
same shape, as `panel-width.ts` and `shows-visible.ts`. It is stored rather than
held in component state because the panel unmounts every time it closes, and an
arrangement that vanished then would not be an arrangement.

The second column opens on the **day after** the active one, same park: that is
the move two columns are for, and opening on the same date twice is the one
arrangement that says nothing. Either column's park is one press away from there.

## Three things move together, and they were on three clocks

Opening the planner moves three boxes at once: the panel slides in from the
right, the page beside it reflows to `--planner-inset`, and the edge tab rides
the panel's left edge. They were timed **separately** — the sheet at 500 ms
(`components/ui/sheet.tsx`), the page at 300 (`--planner-inset-ms`,
`app/[locale]/layout.tsx`) and the tab at 500-on-open / 300-on-close — and the
slowest of the three was the one the eye follows.

Traced frame by frame at 1440 px with the page's right edge and the panel's left
edge sampled in the same `requestAnimationFrame`:

| t      | Seite rechts | Panel links | Lücke  |
| ------ | ------------ | ----------- | ------ |
| 283 ms | 1302         | 1402        | 100    |
| 358 ms | 1065         | 1235        | 170    |
| 432 ms | 995          | 1075        | **80** |
| 508 ms | 992          | 1027        | 35     |
| 668 ms | 992          | 992         | 0      |

The page finished its inset at ~432 ms and the panel arrived at 668, so for a
quarter of a second there was a strip of bare page background between them, up to
170 px wide. That is what "die fade in und out animation" was about: there is no
fade in it at all — the panel is a pure `translateX`, deliberately, because an
opacity on it would let the page read straight through a panel whose glass is
already flat while it moves — and what looked wrong was the seam.

One number fixes it: **300 ms both ways, everywhere**. The easing was already
shared and it is worth knowing why — `tw-animate-css` defines `--animate-in` as
`enter … var(--tw-ease, ease) …`, and `ease-in-out` on the element sets
`--tw-ease`, so the one class times the animation and the transition together.
Re-measured after: `sheet === page === header === tab` on every sampled frame,
and the whole move takes ~320 ms instead of ~670.

The second column gets a 200 ms `fade-in slide-in-from-right-4` of its own,
because a 389 px block appearing in one frame is a jump. It is on a **descendant**
of the panel, which is the one place in here a transform is free: the glass is
`SheetContent`'s, and a transform on that — or on any ancestor of it — makes it a
backdrop root and flattens the blur.

## The day can sort itself, and what it is sorting for is written down

Two buttons under the axis (`PlannerOptimizeActions`): one adds the park's
headliners and orders the result, the other only re-orders what is already
there. They run the same engine (`lib/planner/optimize.ts`) and differ in one
argument, and they are two controls rather than one because they answer
different questions — "fill my day" and "is this the best order" — which a
single button would have to guess between.

What the engine minimises is three things in a fixed order, and the order
between them is the design:

1. **Rides that do not fit before the park closes, in four tiers.** A plan with
   one ride fewer that actually happens beats a plan with one more that does
   not, and _which_ ride is left out is decided worst-first: an entry the
   visitor already had, then a headliner being added, then anything else, and
   then **which** of them by `Candidate.dropWeight`. Overflow used to be a plain
   count, so which rides ended up in the hatched hours was a coin toss — and on
   a day holding Black Mamba and Taron, pressing "plan every headliner" lost
   that toss for both of them, which is the screenshot the first three tiers
   came from. The tiers are disjoint (an existing headliner counts once, in the
   first), so what the second decides is who gets the good slots among the rides
   being **added**, which is the question the button asks. Packed into one
   comparable number (`((entries × 32 + headliners) × 32 + total) × 1024 +
weight`, `MAX_STOPS` being 24) rather than added as Pareto axes, because a
   new axis is a bigger change to the search than to the ordering, and it was
   the ordering that was wrong.

   **Counting them was not enough, and the fourth tier is why.** The three
   counts say how many fall out and never which, so among the plans that drop
   the same number the choice fell through to queued minutes — and cost
   minimisation drops the most expensive ride by construction. The most
   expensive ride at a park is the one with the longest queue, which is the one
   the most people are there for. Systematically, the button sacrificed the
   flagship. Measured on the day it was reported, Phantasialand on Saturday
   2026-09-12 (nine hours, ten headliners, a lunch break at 12:30): asked for
   all ten it gave up **F.L.Y. and Taron** and kept both Winja's, and asked for
   nine it gave up **Taron in nine of the ten** ways of leaving one out. The
   margin was five minutes — the same eight rides with Taron in place of
   Winja's Force queue 280 against 275, on a forecast whose own
   `accuracy.typicalError` at that lead time is 14.3.

   So the weight ranks the added headliners, hardest to lose first, and it has
   two sources. **What the visitor said** — `OptimizeInput.priority`, the order
   the conflict dialog hands back — beats everything, because no payload knows
   which coaster somebody drove four hours for. Where they said nothing it is
   the ride's own expected queue, longest first, which is the only figure in the
   payload that measures how much of a draw a ride is; ranks rather than the
   minutes themselves, since the gaps between the figures are inside the model's
   own error. Same day after the change: nine of the ten are planned, Taron and
   F.L.Y. among them, and what is given up is Colorado Adventure.

   **And the set is decided before the order, because the beam cannot do it.**
   Overflow only appears on the last stop of an order, so every prefix scores
   `overflow: 0` and is ranked on cost alone — by the time the tier that decides
   who falls out has anything to say, the prefix that would have kept the
   expensive ride was pruned an hour of park ago. `peeled()` therefore sets
   aside the least important headliners and re-runs the search over what is
   left, then scores the result **in the original context** with the rides it
   set aside appended, so `better` compares the rounds on exactly the terms it
   compares everything else. On a day that holds everything it never runs.

2. **Total minutes queued.** That is what the visitor asked for.
3. **The clock at which the last queue is joined.** Between two plans that cost
   the same, the one that leaves the evening free wins.

There is no tunable weight in that, deliberately. A λ trading "queue minutes"
against "hanging about" would be a number nobody could defend, and the first
person to disagree with it would be right.

**The schedule is contiguous, so the ORDER is the only free variable.** A ride
starts as soon as the one before it lets go: its start, plus what the block
occupies, plus the walk. The clock follows from the sequence, which is why the
search is over permutations rather than over (permutation × start times). The
one exception is a deliberate wait, and it needs no weight either: idling `d`
minutes and then queueing `w(t+d)` beats queueing `w(t)` now whenever
`d + w(t+d) < w(t)` — the same ride, less queueing, and **free earlier**. That
inequality is the whole rule for sending somebody off for a coffee at 14:00 to
ride Taron at 15:00, and it can never make the day longer.

**Rope drop is not a special case.** Nothing in the code knows the phrase. "The
biggest ride first, at opening" is what minimising the sum produces on a park
where the curve says so — and is not what it produces where the curve says
otherwise. Taron's day is flat (60/60/54/53/59 by hour) while Chiapas climbs 22
minutes; a hard-coded rope-drop rule would give both the same advice.

**Free blocks and ticked-off rides are fixed.** A lunch at 13:00 is a decision,
not a queue to be shuffled, and a ride that is ticked off already happened. Both
keep their minute and the rides are planned around them; only undone ride
entries move.

### The leg chip judges against what the search builds against

The chip between two blocks grades its gap on a four-rung ladder (`legBetween`,
`lib/planner/leg.ts`): `broken` against the certifiable floor, then `tight` /
`good` / `generous` against the assumed ceiling, with the boundary set by the
previous ride's own `uncertaintyMinutes`. On a day somebody laid out themselves
that ladder works. On a day this engine just packed, it reports the engine.

The reason is that the search reserves the ceiling too, so the slack a planned
day leaves over is mostly the remainder on `SNAP_MIN_FINE`, plus whatever a
ride's own opening hour or a deliberate wait adds to it. Measured over 14 parks ×
14 dates of real `/plan/day` payloads — 169 planned days, 1369 legs, 2026-09-13 —
the slack is median 6 minutes (p25 2, p75 10, max 26, where the grid alone caps
at 14) against a band of median 15 (p25 12, p75 18, max 44). So the rung is
decided before the geography gets a word in, and which rung it is follows from
what the optimiser reserves:

|            | reserves wait + band (before PAR-169) | reserves the wait (now) |
| ---------- | ------------------------------------- | ----------------------- |
| `tight`    | 0 of 157 (0.0 %)                      | **144 of 162 (88.9 %)** |
| `good`     | 144 (91.7 %)                          | 18 (11.1 %)             |
| `generous` | 13 (8.3 %)                            | 0 (0.0 %)               |

The two columns have different denominators because the two engines file
different plans — 1366 legs against 1369 over the same 169 days — not because
legs went missing between them.

Those 162 are the legs whose ride reports a spread at all, and that is mostly a
property of the **date**: `tier: measured` (today and tomorrow) carries
`uncertaintyMinutes` on every ride, `composed` on almost none — 13 of 2846 rides
between lead 2 and lead 45 in the same corpus. Where it is absent the ladder caps
at `good` by design, so the other 1207 legs read "Umstieg gut" with the `°`,
100.0 % of them. The same packed day therefore reads amber throughout for
tomorrow and green throughout for the day after.

The grid subtracts a few more before `legBetween` ever sees them: a block within
`LIVE_WINDOW_MIN` of now is re-based on the live wait and passed on with
`uncertaintyMinutes: null` (`planner-day-grid.tsx`), since a queue read off the
park's own board carries no forecast error, and `estimateFor` reports none for a
custom block, an assumed wait or a park with no readable source. Today's next
hour is therefore capped at `good` as well — which is the same reading a
`composed` day gets, for a different reason.

**The threshold stays at the whole band.** Lowering it only moves which single
rung a packed day collapses onto — at ¼ band the same corpus reads 4.7 % tight
and 92.1 % good — while costing the population where the rungs separate. Same
169 days, same code, headliners at a fixed cadence instead of packed: at a
60-minute cadence the band legs go 42.1 % tight / 27.6 % good / 22.8 % generous,
with 8.5 % of all legs `broken`; at 90 minutes, 2.9 / 23.5 / 71.6. `PAR-174`
carries the full tables, and `pnpm test:planner-leg` pins the three points that
tell the thresholds apart: the snap remainder against a real band is `tight`,
four fifths of a band is still `tight`, and a whole band is `good`. Four fifths
rather than three: slack 11 of 15 reads `tight` under the whole band and under a
¾ threshold alike, so it would sit there green while pinning neither.

### …and it is drawn in the gap a reader can see, not in the gap between two queues

The chip hangs in the space between one block and the next, and for as long as it
existed that space was measured from the END of the first queue to the START of
the second. That is not the space on screen. A block is drawn at
`minBlockPxFor` even where its queue is shorter — twenty pixels is the smallest
box a line of text sits in — so a short queue's box hangs into the gap below it,
and the chip was placed in a gap that was partly already covered.

It did not matter while the optimiser reserved the wait plus the band. Since
PAR-169 it reserves the wait, the blocks stand close together, and the difference
became the whole gap. Measured over 46 planned park-days from `/plan/day`, 267
legs, 2026-09-14:

| axis               | between the queues        | as drawn                          |
| ------------------ | ------------------------- | --------------------------------- |
| 1.2 px/min         | min 12, median 24, max 54 | min **12**, median **16**, max 48 |
| 1.8 px/min (phone) | min 18, median 36, max 81 | min 18, median 24, max 72         |

Against a 21 px chip that is nine of nine cut on a packed Phantasialand day at
1440 px and eight of nine at 390 px.

`lib/planner/leg-chip.ts` holds the arithmetic, pure and away from the component
for the reason `weather-chart-axis.ts` is: it broke once in a way a green build
showed nothing of. `legChipPlacement` takes the leg's own height and the
overhang, and answers where the chip's top edge goes and whether it is the short
form. Two numbers are **rendered rather than typed** — `LEG_CHIP_PX` 21 and
`LEG_CHIP_COMPACT_PX` 12, measured in the app's own stylesheet at both scales in
all six languages, where the height follows the type and not the words. The 18
that stood in the component before was a guess and three pixels under the thing
it was measuring.

Three decisions sit underneath it.

**What the short chip drops is the distance and the slack**, so the minutes and
the verdict — the two things the gap is about — survive in every state, and the
distance stays in the `title` where it always was. The rule is Patrick's, taken
against dropping the chip (the warning would go exactly when the day is tight)
and against raising it over the blocks (it would cover a ride's name on nearly
every leg of a packed day).

**The short chip's outline is a `ring-1 ring-inset`, not a border**, and that is
what makes it 12 px rather than 14: a ring is a box-shadow and costs no height,
where a border is two more pixels. Twelve is not a round number picked for looks
— it is the smallest gap a planned day produces, 34 of those 267 legs, so a 14 px
chip would still have been cut on 12.7 % of them. The colour is `current`, i.e.
the verdict's own `text-*` class from `TRANSFER_CHIP_CLASS`, so there is no
second per-verdict map to drift from the first. Shrinking the TYPE to 9 px would
also have measured 12 and was refused: a chip that is hard to read is not fixed
by making it smaller.

**The wrapper is `flex`**, and that is load-bearing rather than tidy. The chip is
`inline-flex`, so in a block wrapper it is an inline box sitting on a line box's
baseline: measured at 1440×1000, a 12 px chip in a wrapper positioned at
`top: 10px` painted at 18. The offset is the leading above the baseline, so it
varies with the chip's own height and would have silently undone any position
computed in pixels. A flex item has no baseline to sit on.

Three things this does not cover, all named where the code is. A day somebody
**drags** has no floor under the gap at all — two blocks can overlap, the room is
then negative, and the chip is centred on it rather than favouring one side. A
block with **no figure** is drawn at a flat 40 px while `spanMinutes` counts
`MIN_BLOCK_MIN` for it, so its drawn bottom is 20 px below where the lane packing
thinks it ends and the room goes negative there too; that disagreement predates
this and is PAR-227, and it is also why the corpus above — which filtered parks
with no readable wait times out — states a floor for days that have figures in
them rather than for every day. And the repair button on a `broken` leg keeps its
21 px: it is a target rather than a label, its text is already down to a deficit
and one word, and a broken leg has by definition too little room for anything.

The gap itself comes from `drawnBoxPx` (`day-grid.ts`), which is the same
function `planner-block.tsx` sizes its own box with — including the third case, a
block with no figure, which is a stated 40 px and used to live in that component
and nowhere else. A hand-written twin there would agree on the day it was written
and on no other. `pnpm test:planner-leg` pins the placement and `pnpm
test:planner-grid` the box — but a unit test cannot see a stylesheet, so the two
heights are pinned where a browser is: `pnpm check:planner` reads the rendered
chip and fails if it is not `LEG_CHIP_PX` or `LEG_CHIP_COMPACT_PX`, which is what
keeps "rendered rather than typed" true after somebody edits a padding class.

### A queue is joined before closing, and never after

Two halves of one rule, and the planner had both of them wrong in opposite
directions.

`PlanDayContext.closeHour` is the hour the park's closing time **falls in**, not
the last hour it is open: Phantasialand shuts at 18:00 and the API answers 18.
`buildDayGrid` read it the other way and added sixty minutes, so a nine-hour day
was planned against a ten-hour one — and the optimiser filled the extra hour.
The reported plan queued Winja's Fear at **18:15** and finished at 18:55, a
quarter of an hour after the gates shut.

Which is not a rounding error but a whole hour of plan, on most parks. Measured
across the catalogue's own calendars, **3,046 of 3,540 operating park-days close
exactly on the hour (86.0 %)**; 486 close at half past and 8 at quarter to. So
the hour is the closing time six days in seven and the API's truncation is real
for the seventh, and the two facts point opposite ways. `DayGrid` therefore
carries two numbers: `closeMin` is the **certifiable** end — nothing the app
files by itself may start past it — and `closeSlackMin` (60) is where the park
may or may not still be open. The slack is drawn (the ground's hatched feather
moved from the band's last hour, which is certainly open, to the strip below it)
and reachable by a drag, because the person dragging knows their own park; it is
never planned into. Same hard/soft split `rideFloor` makes at the other end of
the day.

The other half is what keeps the fix from costing anything. A queue may be
**joined** right up to the last minute, and what happens after that is the park
emptying a line it has already let you into — so `fits` is decided on the
**start** and never on the end. It used to read `freeAt <= closeMin` and refused
a forty-minute queue at 17:45 in a park shutting at 18:00, which is a slot a
visitor takes on purpose and one of the best on the day.

Two things follow from the pair. A queue nobody joins costs nobody anything, so
the wait and the idle in front of a stop that does not fit are **out** of the
totals — with them in, two plans that give up different rides came out at the
same number of queued minutes, cost could not tell them apart, and the choice
fell through to the clock, which prefers the short walk. That is also what makes
"Wartezeit ist Laufwegen vorzuziehen" true rather than merely intended: a walk
costs `planCost` nothing and only moves the clock, so with one slot left and two
rides for it the shorter queue wins however far away it is — measured down to a
five-minute difference against a kilometre of walking, where before the fix the
near ride won up to fifteen. And `nowFloor` is no longer capped at the end of
the day: the cap beat the lower bound the function exists to impose, so at 17:58
in a park shutting at 18:00 it answered **17:45** and "plan every headliner"
filed a forty-minute queue thirteen minutes before the press.

### Where it cannot choose for you, it asks — and it asks properly

Ten headliners and room for nine is a decision, and the app can rank a catalogue
but it cannot know which ride somebody travelled for. The first version of this
was one dialog with ten ticked rows. What it could not do is the thing a visitor
actually wants at that moment, which is to **try something**: the day was too
short, the list was the only lever, and the hour of lunch sitting in the middle
of it was not on the screen at all.

So it is `PlannerFitAssistant` now — its own dialog, its own three steps, opened
by **both** buttons the moment a press would leave something out
(`needsFitHelp`), and nothing is written until the last one.

**1 · Stellschrauben.** What could change so the day holds everything, and every
row is a measured difference between two plans rather than a piece of advice.
`fitLevers` re-runs the whole optimiser once per free block with that block gone,
and once with it cut to half an hour, and offers only what actually buys a ride:

| Park          | Day        | With the break | Lever                   | After |
| ------------- | ---------- | -------------- | ----------------------- | ----- |
| Phantasialand | 2026-09-12 | 9 of 10        | ohne Mittagessen        | 10/10 |
| Movie Park    | 2026-09-20 | 9 of 10        | Mittagessen auf 30 Min. | 10/10 |
| Phantasialand | 2026-10-03 | 8 of 10        | ohne Mittagessen        | 9/10  |
| Phantasialand | 2026-10-31 | 8 of 10        | Mittagessen auf 30 Min. | 9/10  |
| Phantasialand | 2026-11-01 | 9 of 10        | —                       | —     |

So „Ohne Mittagessen · Dann passt der ganze Plan" is printed on the two days
where it is true and „Dann passen 9 von 10" on the two where it helps and is not
enough, and on 2026-11-01 the step says the blocks are not the problem. Cutting
short is offered **before** dropping, and where the short version already solves
the day the longer answer is not offered at all — nobody skips lunch to buy what
half an hour already bought. A lever is a toggle, not a command: pressing it
again puts the break back, which is what makes the step something to experiment
in. The step is skipped entirely on a day with no free block.

**2 · Wichtigkeit.** The whole list, in `fitOrder` and never a sort of its own,
so what is at the bottom of the screen is what the engine gives up first. Two
answers per row: the **checkbox** says whether the ride is wanted at all, and the
**pin** moves it to the top of the order — `OptimizeInput.priority`, which is
what decides who falls out. Both recompute against the same optimiser that will
run on the press, so pinning the flagship visibly moves the „fällt weg" mark onto
another name. Measured on Phantasialand's 2026-10-03: by default Crazy Bats and
River Quest go; pin those two and it is Winja's Fear and Colorado Adventure; put
Taron last and Taron goes.

**3 · Ergebnis.** How many rides, when the last queue is left, what it costs in
queueing, and what is being left out **by name** — because the press is about to
take rides out of somebody's day and „zwei passen nicht" is the sentence this
whole dialog exists to replace.

**And solving it may not take the screen away.** Reported after the first
version shipped: start unticking rides and the list disappears. In the wizard it
literally did — the whole band hung on `headlinerConflict`, so the ride that made
the day fit also removed the thing that had just been used to fit it, with no way
back. In the dialog it was quieter and the same shape: the „fällt weg" marks went
out, the count line changed a number, and nothing said the problem was over. So
the band at the top of the dialog and the block in the wizard both carry a
**state** now — the crowd tint with a warning mark while something is left out,
`status-operating` with a check and „So passen alle 10 Bahnen in den Tag" once
nothing is. The wizard's block appears while the day is short and stays for as
long as anything has been answered (`fitChoiceTouched`, derived rather than
latched, so a change of park or date cannot leave it standing); a day that holds
everything and has been left alone still gets a toggle and no form. Step one gets
a third sentence for the same reason: „an den Blöcken liegt es nicht" is true
while the day is short and a lie the moment somebody has already made it fit, and
coming back to that screen after unticking a ride is exactly when it was read.

Two rules underneath it. **A ticked wish is re-planned rather than parked**: the
assistant hands every ride it has a payload row for to the engine as something
being ADDED, whatever it is today, which is what turns "which of them falls out"
from a remainder into a decision. `optimizeDay` on its own may never delete an
entry — it parks it past the gate instead, see `OVERFLOW_STRIDE` — and this is
the one place that rule is relaxed, not behind anybody's back but in front of a
list where the ride is named. And **the visitor's order beats the park's
curation**: `isWanted` counts a ride named in `priority` as one of the rides
somebody is there for, so a pinned filler is no longer dropped ahead of an
unpinned headliner. That changes nothing for any call site that existed before
it, since the only thing that ever passed `priority` was a list of headliners.

The probe that decides whether to ask costs one extra search — 5–50 ms on the
days this was reported — and is thrown away, so what lands on the axis is always
a plan built for the set that was actually agreed. On a day that holds everything
nothing is asked at all, which is the common case and the one a dialog would
teach people to dismiss: over 35 park-days at six parks, five were tight.

**The wizard carries the same question one step earlier, on a step of its own.**
"Headliner einplanen" used to be a fourth toggle beside lunch, riders and water
rides — three answers about the party and one that rebuilds the whole day, with a
hint that had to admit in passing that not all of them would fit. It is step four
now (`park → date → setup → headliners`), it runs the same probe against the same
day with the lunch block where the wizard would put it, and where it is tight it
renders the assistant's own two pieces inline: the measured levers and the
ordered list. Pulling „Ohne Mittagessen" there is the wizard's lunch block being
dropped — `finish` reads the block back out of `evaluateFit`'s answer rather than
off a second piece of state, so the day that is filed is the day that was shown.

**And the block on the axis says so too.** A ride filed at 18:45 in a park that
shuts at 18:00 used to be drawn exactly like the nine above it, with the only
mention of the problem a clause in a grey eleven-pixel line. It carries the crowd
tint and a sentence now, in two shapes because the axis has two lines: past
`closeMin + closeSlackMin` it is „Liegt nach Parkschluss", and inside the hatched
hour — where the API's truncated closing HOUR means the park may well still be
running — it is „Kann schon nach Parkschluss liegen". Free blocks get neither:
telling somebody their dinner is after closing time is the app having an opinion
about dinner. The result line under the buttons is the other half: where
something was left out it is a bordered warning with the mark, and it carries an
„Anpassen" button back into the assistant, because a notice about a problem with
no control beside it is a notice nobody can answer.

### Why it is a heuristic, and what that cost

The search is a beam of 192 prefixes carrying a small Pareto front per (visited
set, last ride) — two partial plans over the same rides ending on the same ride
are only comparable where one is worse at both queued minutes and the clock —
followed by Or-opt and 2-opt until nothing improves any more. An exact
enumeration is out because the cost is time-dependent: what a ride costs depends
on when the rides before it finished, so the subproblems Held–Karp needs do not
exist.

Which leaves the question of how much the shortcut gives away, and it is
measured rather than argued. On eight rides across four lands with six different
turning points, scoring all 40,320 orders through the optimiser's own scheduler
takes **1.66 s** and settles on 172 queued minutes finishing at 16:05. The beam
plus the local search reach the same 172 and the same 16:05 in **8.2 ms**.
`scripts/test-planner-optimize.mjs` keeps that comparison running at five and
seven rides, where a full enumeration is cheap enough for every run — and it
brute-forces through `scoreOrder`, the scheduler, never through the search,
because comparing the search against plans the search produced would be it
marking its own homework.

At the sizes somebody actually presses the button at, it stays inside a click:

| Stops      | 10    | 14    | 18    | 24 (`MAX_STOPS`) |
| ---------- | ----- | ----- | ----- | ---------------- |
| Wall clock | 23 ms | 26 ms | 32 ms | 56 ms            |

Europa-Park, the largest catalogue this is asked about, has thirteen headliners.

### What it says afterwards, and how to take it back

The day is scored before and after by the same function, so "18 Min. weniger
Warten" is a difference between two figures produced the same way rather than a
claim. Where a press adds rides no saving is printed at all: the day is longer
by construction, and reporting the bigger total as a loss would be arithmetic
answering a question nobody asked.

Three refusals, and each of them is visible:

- **A park whose wait times nobody can read gets no buttons.** At Hansa-Park
  every ride costs the same assumed nothing, so every order is as good as every
  other; `canOptimize` says no and the row is not drawn. Offering it there would
  be a promise that pressing it changes something.
- **Pressing twice does nothing the second time.** `optimizeDay` scores the plan
  that is already there the same way and returns `null` for a day it cannot
  improve, so the panel says so instead of reshuffling to the same total.
- **An entry that no longer fits is not silently dropped.** A ride the visitor
  put there themselves is placed where the sequence puts it, past closing rather
  than parked on the park's last minute; `growGridForSpans` widens the canvas to
  hold it and the minutes out there are hatched, so the plan reads as "and these
  two do not fit". Deleting somebody's own plan behind their back would be the
  worse answer.
- **A ride the button ADDS is never filed out there.** The same placement is
  wrong for a ride nobody asked for individually. Those are left out instead —
  still counted in `overflow`, which is taken before the filter, so the sentence
  under the button says how many, and one press away if a ride is deleted to
  make room.
  Which is why the headliner button does **not** always disappear after a press:
  Phantasialand has ten headliners and a nine-hour day, so the last one has
  nowhere to go, and the button stays as a standing offer with `optimize.overflow`
  underneath it saying why.
- **Nothing is planned before now, on a day that is today.** The optimiser had
  no clock at all, so a day sorted from a park page at 09:43 came back with a
  ride at 10:00 and the one before it at 09:15 — a queue nobody can join. The
  clock raises every candidate's floor, snapped up to the quarter hour, which is
  the same lever a ride's own published opening pulls — and it is the SOFT floor
  it raises (`rideFloor`), never the hard one, so a drag into the recorded
  morning stays legal.
- **And a slot the clock has already reached is not re-planned at all.** The
  floor alone gets this exactly backwards: raising a candidate's earliest minute
  to "now" is precisely what MOVES a 10:00 block into the afternoon. So an entry
  whose slot has started leaves the search and joins `ctx.fixed`, where a
  ticked-off ride and a lunch break already sit, and `applyPlan` — which moves
  and adds and never removes — then leaves its minute alone. A slot that has
  _begun_ counts: at 14:00 somebody is standing in the queue a block gives
  13:30–14:25, and an optimiser allowed to move that block is telling them to
  leave a queue and rejoin it. Being a fixed block rather than merely excluded is
  what makes the next ride wait until that queue is through. The comparison is
  **strict** (`<`), and that is not a detail: the floor snaps up to the quarter
  hour, so a press at 14:00 files the next ride AT 14:00 — with `<=` that ride
  counted as elapsed the instant it was planned, `movable` dropped below two, and
  the whole bar unmounted one render after the press, taking the sentence it had
  just written and its undo with it. `check:planner` found that against a fixed
  clock. A block starting exactly now is somebody arriving, not queueing.
- **A day in the past is not planned at all.** The month calendar lets a past day
  be opened again as soon as something was planned on it, and `/plan/day` answers
  200 for it with a full ride set, so until this rule the panel drew both buttons
  on yesterday. `buildContext` and `scoreCurrent` refuse `phase: 'past'` outright
  and the two automatic controls are not rendered. What stays is every hand
  control — drag, resize, tick off, delete, a free block — because a walked day
  is a **record**, and writing down that you actually rode Taron at 13:00 is the
  reason it is kept at all. That is also why this is not a blanket guard in the
  store: a refusal behind a live-looking control is the failure mode the rest of
  this section exists to avoid.

`applyPlan` commits the whole re-plan in **one** write. Every
`plannerStore.update` stringifies the entire multi-park plan, writes
localStorage, rewrites the cookie and notifies every subscriber on the page, so
re-planning thirteen headliners one at a time would be thirteen of that — plus
twelve intermediate states in which the day is half old and half new, each of
them rendered.

The undo beside the result sentence is **one level**, and it exists for the same
arithmetic: "plan every headliner" can turn a three-ride afternoon into eleven
blocks, and taking that back by hand is eleven drags. `restoreDay` replaces the
day rather than merging into it, because an entry added since the snapshot has to
go — otherwise undo would leave the day holding both versions. The snapshot lives
in component state, so it lasts exactly as long as the open panel does: an undo
somebody could still press tomorrow would be a promise about a plan they have
since edited.

The clock is **one value**, not a date beside a minute: `DayClock` in
`lib/planner/park-time.ts` is `past` / `today + nowMinute` / `future`, produced
only by `dayClock(date, timeZone, now = Date.now())` and passed into the pure
module as `OptimizeInput.clock`. Two fields would be two facts that must agree,
and the bug this replaced was exactly that — a minute for today and nothing at
all for yesterday. Omitting it means `future`, so every rule keyed to it reduces
to its pre-clock form and a plan for next Saturday reckons the way it always did.

The same clock reaches **four** places that file a block at a minute they pick
themselves, and all four were filing into the morning at 14:00: the optimiser,
a headliner pill, a ride-search row and the free-block button. They share one
answer — `rideFloor(grid, ride, clock).softMin`, or `nowFloor(grid, clock)` where
there is no ride.

**Those four all hold a `DayGrid`, and that is what made the fifth invisible.**
`nowFloor` takes a grid, so a surface without one cannot ask it — and three
surfaces reach `addEntry`/`addCustomEntry` with no `startMinute` at all, whereupon
`nextFallbackStart` in `lib/planner/actions.ts` answered `10 * 60` on an empty
day whatever the clock said. The ride page's "In den Plan" / "Nochmal" button is
the one a visitor meets first (`AddToPlannerButton` never loads `/plan/day`, so
there is no grid to hold), and pressed at 15:20 it filed a queue five hours into
a morning that has gone. The other two are the same panels as above on a day
whose payload has not arrived: `addFreeBlock` passes
`grid ? nextFreeStart(…, nowFloor(…)) : undefined`, so the break lands at 10:00
directly under the comment promising it never would, and the flat drop target in
`planner-day-column` has no grid by definition.

So the fallback carries the floor itself: `nowFloorMinute(date, timezone, now)`
reads `dayClock` through `resolveTimeZone` and, on today, snaps the current
minute **up** to `SNAP_MIN_FINE`. It is a `Math.max` against the spread, so it
only ever raises — an afternoon plan added to in the morning keeps "last entry +
60" — and `past`/`future` return `0`, which reduces the expression to the one
that was there before. An explicit `startMinute` still wins, so a drag into the
recorded morning stays legal, for the reason the soft/hard split exists at all.
`addEntry` and `addCustomEntry` take a defaulted `now`, the same shape
`parkToday`, `parkMinuteNow` and `dayClock` use, which is what lets
`pnpm test:planner-actions` put the day at 15:20 rather than read the wall clock.

One consequence is worth naming rather than discovering: the floor is **not**
capped at the end of the day, for `nowFloor`'s own reason — past the last slot,
a minute the day has no room for is the true answer. So the hourly spread runs
into `clampMinute`'s 25:00 ceiling sooner on today than on a future date, and
enough presses late in the evening put several blocks on that ceiling. They draw
side by side (`byStart`'s tie-break), which reads as "these do not fit today",
and that is the honest reading — where the previous behaviour filed all of them
into a morning that had gone and looked like an ordinary plan.

And **one filter, not four copies of it.** `movableEntries` is exported because
the same three-clause predicate was written out in `buildContext`, in
`isExecutable`, in `scoreCurrent` and in the bar that draws the buttons, and
every failure this rule had to fix was two of those copies disagreeing:
`isExecutable` walked a set holding an entry that was also in `ctx.fixed`, so it
compared a block against itself and the overlap test was true for every day —
"pressing twice does nothing" could never fire on today. `scoreCurrent` summed a
morning the plan had not seen, so the saving printed was the morning's queues,
except that the guard around it then failed and the status line rendered empty
instead. And the bar counted rides the engine refused, so it offered a button for
a day with nothing left to sort. The clock therefore goes to `scoreCurrent` too —
as a **membership** rule and never as a floor, since that function's whole job is
to score the day where the blocks actually are.

Checked by `pnpm test:planner-optimize` — the brute-force comparison above, plus
the properties a visitor would notice if they broke: the lunch break stays put,
the ticked-off ride is not re-planned, a ride that opens at 11:00 is not queued
for at 09:15, a collapse five hours out is not waited for, and the same day
produces the same plan twice. The three rules above have their own blocks there
(§12b for the floor, §12b2 for the elapsed slot and the past day, §12c for the
added ride that does not fit, §12 for the headliners taking the slots; the floor
itself is pinned in `pnpm test:planner-grid` §13b), and `pnpm check:planner`
asserts all of it in a browser: after pressing "alle Headliner einplanen" on
Phantasialand no block starts past the gate and a second press adds nothing; a
past day offers neither control while the free-block row stays; and — with
`page.clock.setFixedTime` at 14:00 park-local, so the assertion means the same
whatever hour the run starts — a press leaves the 10:00 and 13:00 blocks exactly
where they were.

## The panel changes the page's width, and five things had to learn that

Opening the panel sets `--planner-inset` on the document element and the layout
wrapper pads by it. Padding an ancestor is not the same as making the window
smaller, and each of these found that out separately:

- **The header's breakpoints** were viewport queries in a box that had shrunk —
  see the header-geometry requirement in `CLAUDE.md`. `@container` on the
  `<header>`, same two thresholds. Its inner ROW was the same bug one level down
  and outlived the fix: Tailwind's `container` utility is a set of **viewport**
  media queries, so with the panel open it held a 1536 px max-width inside a
  992 px box and the logo sat flush against the edge. The row carries the same
  four thresholds as container queries now.
- **The park hero** is `position: fixed`, which resolves against the viewport, so
  the padding never reached it: the photo spanned the full 1440 px behind a glass
  panel and read straight through it. Its right edge follows the same variable
  now (`sm:right-[var(--planner-inset,0px)]`), which is `0px` while the planner
  is shut.
- **The panel's own width** is capped so the page keeps `PAGE_MIN_PX` (360),
  measured off the header's least compressible row. At 768 px the stored 448
  becomes 408.
- **The attraction cards** were the reported symptom and were never the problem:
  measured across the whole scrolled page at five widths, the rightmost card is
  always exactly 16 px inside the panel's edge.

And then the same bug once more, on **every page in the app**. Tailwind's
`container` utility is `width: 100%` plus a max-width tier picked from how wide
the WINDOW is, and 69 call sites use it — nearly all of them the bare
`container mx-auto`. So it is answered once, in `app/globals.css`, by an
`@utility container` that keeps the five media tiers and adds the same five as
`@container page (…)` queries after them: same specificity, later declaration,
so the page's own box wins wherever it is narrower. Measured on a park page,
`.container` against the page column it sits in:

| Window | Panel | Page column | `.container` before | after |
| ------ | ----- | ----------- | ------------------- | ----- |
| 1920   | 900   | 1020        | 1020                | 768   |
| 1720   | 448   | 1272        | 1272                | 1024  |
| 1440   | 448   | 992         | 992                 | 768   |

Every "after" is what the same number would get as a window width, and with the
panel shut all three are unchanged (1536 / 1536 / 1280). The media tiers stay,
and they go first, as the answer for a document with **no** `page` container:
`/admin` and `/dev/blog-editor` render their own `<html>` outside
`app/[locale]/layout.tsx`, and a container query with no matching container is
false rather than unbounded — a container-only utility would put every
`.container` there full-bleed. `rem` in both halves, because Tailwind's
breakpoints are rem and an `@min-[1024px]` would quietly stop agreeing with the
`sm:`/`lg:` utilities beside it for a reader who has raised their default font
size.

## Standing in a park, planning that park

Two gates hid the "<Park> jetzt planen" button, and both had to go:

- It asked whether the store had ever HEARD of the park (`!state.parks[slug]`).
  `openDay` registers a park and adds no entry, `removeEntry` leaves an empty day
  behind, and only `clearDay` prunes — so one visit to the calendar's plan button
  left a husk that silenced the offer for good. It asks whether the day on screen
  is already this park's now, which also answers the case the old test could not
  express: on Toverland's page with a Phantasialand day open, the right offer is
  Toverland.
- It lived in the panel's no-axis empty branch, which is reached only when
  `buildDayGrid` returns `null` — and an axis exists for every open day. So the
  container was unreachable the moment anything was active, and the reader got
  the grid's own "Noch nichts geplant" overlay, which offered nothing.
  `PlannerPlanParkCta` is its own component and renders in both.

The wizard already starts on the calendar when it is handed a park
(`useState<Step>(initialPark ? 'date' : 'park')`, a two-step rail) — nothing to
change there.

## Push notifications

`lib/planner/use-push-subscription.ts` + `public/sw.js`, VAPID, one topic
(`next-up`). The plan is uploaded **before** subscribing, because a subscription
with no plan behind it has nothing to notify about.

**"On" is a statement about the server, and neither local signal makes it.** The
switch opened on `existing && getTripId()` — a push subscription somewhere on
this origin, plus a trip id stored at some point. The browser keeps **one**
subscription for the whole origin and shares it with ride alerts and followed
shows, so the first half only says that something on this site uses push; and
the trip id survives a failed `POST /api/push/subscriptions` exactly as well as
a successful one. So one network hiccup after the plan was stored left both
halves standing with nothing joining them, and every later mount read `on` — the
switch this file's own rule forbids, on and doing nothing, with no notification
ever arriving and no reason for the visitor to touch it. There is no read to ask
instead: `/v1/push/subscriptions` answers `POST` and `DELETE` only, and the two
push GETs that do exist (`ride-alerts`, `show-follows`) list a browser's own
rows without naming the subscription's `tripId`. What replaces the guess is the
server's own 2xx, remembered against **the exact pair it was given for**
(`lib/planner/push-arming.ts`, `parkfan_push_armed`) — written after the POST
answers and nowhere else, cleared by switching off. Both halves expire it
without anybody clearing anything: a rotated endpoint or a trip id replaced by a
404 no longer matches, and `off` is then the honest answer, because the
subscription the server holds is pointing at something this browser no longer
has. And the failure paths of `enable()` deliberately do **not** clear it — the
record describes a pair, not an attempt, and a second tab may have armed the
same one. `pnpm test:push-arming` pins that, plus the wiring, since a record
nothing reads decides nothing.

**Delivery is unverified.** This environment has no VAPID key pair and no reach
to a push service, so the wiring is written and typechecked and has never
delivered a notification. `.env.example` documents `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`.

## The page explains itself with the planner's own components

The planner page was a directory and three cards: nothing for a search engine to
index, and nothing for a first-time reader to learn from. Under the directory
now sit six numbered chapters — what a block's height is, where its minutes come
from, that a ride opens later than its park, that the walk between two rides
costs time, how a showtime differs from a projected one, and what the planner
does not know.

Two rules decide how the pictures in it are made, and they are the guide page's:

- **The exhibits are the production components.** `PlannerDayGrid`,
  `PlannerShowBand`, `PlannerGridActions` and `PlannerContextBand` are rendered
  directly, so a restyle reaches the explanation the same day it reaches the
  panel. A redrawn lookalike starts lying at the first change, and a screenshot
  is a lookalike that cannot even be dragged.
- **Every number is one the API actually returned, and it is dated.**
  `_fixtures.ts` holds the answer `/plan/day` gave on 4 September 2026 for
  Saturday 12 September at Phantasialand, verbatim: the hourly curves, the
  `expectedError` of 15.4 minutes on the headliners and 10.9 on the rest, the
  `opensAt` of 10:00 on most rides against a park that opens at 09:00, and the
  projected showtimes with the dates they were observed on. The caption under
  each figure says which day it is.

The date being in the **past** is deliberate and load-bearing twice. It keeps the
exhibit honest — the prose can name a figure the demo draws, which the blog's
live widgets may never do — and it keeps the exhibit inert, because
`PlannerDayGrid` gates its weather query on the forecast horizon and a day in
September 2026 is outside it. So the page prerenders, ships no request, and holds
still.

The demo is genuinely operable and writes nothing: `_demos.tsx` keeps the entries
in component state instead of the planner's store, so a reader can drag a block
into another hour, watch its height and both transfers recompute, and still find
their own plan untouched. `check:planner` asserts exactly that, along with the
six chapters, their unbroken numbering, seven blocks and at least one leg in the
figure, no raw message keys, and the same in French — the article is six modules
and a missing one is only a build error for the locale that lost it.

One thing it deliberately does not carry: `FAQPage` structured data. Google
retired FAQ rich results for every site on 2026-05-07, so there is none to win,
and a new page does not get the markup in order to try.

## The phone is a second scale, and the grip was being clipped

A block's height is a queue and a queue can be twenty pixels, so the panel has
always had one control that must not be measured by the block: the drag grip.
It grows its touch target with an `after:` pseudo-element that deliberately
reaches PAST the block — `max-sm:after:h-11`, 44 px around the middle of a box
that may be shorter than that.

It never worked, for one word. The block's bordered box carried
`overflow-hidden`, and a clip applies to a pseudo-element for **hit-testing** as
much as for paint — so the effective target was 44 px wide by the block's own
height, which on the shortest block in a day is 20. The clip is there for the
ink (a photo at `inset-0`, a tint that would otherwise square off the rounded
corners), so the ink is what gets clipped now: one `absolute inset-0
overflow-hidden rounded-[inherit]` layer holding the photo, the fill and the
category bar, and the controls as its siblings. The resize edge's target had to
stop being `w-full` at the same time — once both could escape their box, a
full-width 44 px strip sat on top of the grip's 44 px strip on every block
shorter than 44, so the shortest free block could be resized and not moved. They
tile now: the grip's column, then everything right of it.

Two more things were wrong in the same gesture and neither is a hit area.

**The auto-scroll edge was bigger than the axis.** `EDGE_PX` is 48 at each end
and the phone's scroller had a 140 px floor, so 96 of 140 px triggered
auto-scroll and the neutral band was 44 — a finger holding still anywhere near
either end pulled the day out from under itself, and `minuteUnderPointer`
re-reads the canvas rect every frame, so the target minute went with it. The
edge is `Math.min(EDGE_PX, box.height / 4)` now: half the box stays neutral at
every height, and from 192 px up the constant takes over unchanged.

**`setPointerCapture` could throw and take the gesture with it.** It raises
`NotFoundError` for a pointer id that is not currently active; the release side
had been wrapped against that since it was written and the claim side had not,
so the throw landed uncaught in a React handler before `dragState` was set. It
is wrapped now — and the wrapper RETURNS where the listeners go, because capture
is what retargets `pointermove`/`pointerup` to the handle: without it a
handle-bound `pointerup` never fires, the rAF loop runs on and `--pl-drag-dy`
stays on the block. A failed claim binds to the document instead.

### The axis has a phone scale, and it comes from one place

`buildDayGrid(openHour, closeHour, pxPerMin)` has taken the third parameter
since it was written and none of its six callers used it. They all do now,
through `usePlannerPxPerMin()` — **one** hook, because the six axes are read as
the same day and two of them at different scales would put 09:00 at two heights
in one panel. `PX_PER_MIN_COARSE` is 1.8 against the desktop's 1.2: a
20-minute queue goes from 24 px to 36, which is the difference between a bar and
something with a name on it, and a coarse snap step goes from 36 px to 54.

Everything derived reads `grid.pxPerMin` and never the constant, which is what
makes a second scale safe — `pnpm test:planner-grid` now asserts both invariants
at 1.8 as well: a duration is a height, and `minuteAt` is exactly `yFor`
inverted. Two things had to move with it. `MIN_BLOCK_PX` is stated at 1.2 and
scaled by the axis in `minBlockPxFor`, or the box floor would quietly drop from
16.7 minutes to 11.1 on the taller axis; and `MIN_BLOCK_MIN` exists so the lane
packer can state the same floor in minutes and stop depending on the scale at
all.

The scale switch is `(width < 40rem)` and **never** `(max-width: 639px)` —
Tailwind's breakpoints are rem, so `max-sm:` moves with the reader's default
font size and a px query does not. At 20 px / 700 px the panel would lay itself
out as a phone and get handed the desktop axis.

A taller axis shows fewer hours unless something pays for it, so three things
did, in the same change: the sheet opens at `92svh` instead of `85` (+59 px at
844), the ride search's cap comes down from `46svh` to `32` (it was taller than
the axis — the field report said so), and the chrome above gives back the handle
row, the header's padding, the column head and the weekend chip, which duplicates
the date picker two rows above it. The axis floor is 200 px, chosen so the floor
keeps its DAY: 140 px was 116.7 minutes at 1.2 and would be 77.8 at 1.8, while
200 at 1.8 is 111 — the same day to within six minutes.

**Raising the resting height took the handle's job away, and the check said so.**
`check:planner` asserts that pulling the sheet up raises its ceiling by more than
40 px, which was true while the sheet rested at 85svh and the handle pulled to
96: 93 px of travel at 844. At 92svh the same handle moved it 34 px — under half
a 15-minute block on the phone axis — and the assertion went red on the branch
while staying green on `main`. That is the check being right rather than brittle,
so the fix raises the pulled-up value to **`100svh`** instead of putting the
resting height back: the resting height is where the 59 px came from, and it is
what Patrick asked for in as many words.

What 100svh costs is the modal overlay. Pulled up there is no shield left beside
the sheet, so tapping outside is no longer a way out and what remains has to be
real: the handle brings the sheet back down by drag **or** tap, which is why the
tap toggles rather than only dismissing. At rest the shield is back.

**The × was gone from the phone sheet from PAR-188 to PAR-483, and it is back.**
PAR-188 took it off on the reasoning that three ways out of a bottom sheet were one
too many: the handle drags the sheet away, the shield beside it closes it on a tap,
and the × was parked in the corner a thumb reaches worst. What the field then found
is that the first thing anybody does with a handle is tap it, a tap pulls the sheet
up to 100svh, and at 100svh the shield is 0 px tall — so the only exit left was a
90 px drag that nothing on screen names ("der Planer lässt sich nicht schließen").
The × now sits in the handle row, `SheetClose` with `data-planner-sheet-close`,
right of the handle, and the push bell moved to the left margin to make room. It is
not `SheetContent`'s own corner button, because on a phone that corner is the sheet
header's day picker, which is what PAR-188 was about in the first place; the planner
still passes `hideClose={isPhone}` and draws its own. The desktop panel keeps the
corner ×: a side panel has no handle, and its outside press is deliberately
swallowed, so there the × and Escape are the whole list. `check:planner` asserts
exactly one close button at 390 × 844 (44 px, in the handle row), that it takes a
press while the sheet is pulled up, the same single button at 844 × 390, and the
corner × at 1400 px. The handle's label says what a press does and nothing more:
„Planer vergrößern oder verkleinern" (PAR-203).

### Every target in the sheet is 44 px, and three of them are not what they measure

The seven controls the first pass raised were the seven somebody had looked at.
A sight check with a real coarse pointer then found seventeen more in the same
sheet — so the floor is a **sweep** now (`jedes Ziel im Sheet ist 44 px hoch` in
`check:planner`), walking every `button`, `label`, `a[href]` and `select` in the
open sheet. A list only ever knows about the controls somebody thought of.

Two rules decide what the sweep counts, and a hand count got both wrong on 3 of
those 17:

- **A checkbox inside a `<label>` is not a target — the label is.** Nineteen
  16×16 boxes were reported in the fit assistant, whose rows are 64 px tall and
  clickable end to end. The sweep skips an input that has a label ancestor and
  measures the label instead.
- **A bounding box is not a target either.** The grip, the resize edge, the sheet
  handle and the party chip keep a small box on purpose and carry the 44 px in an
  `after:` pseudo-element, which `getBoundingClientRect` cannot see. The sweep
  walks outward from the box edges with `elementFromPoint`, like the grip probe
  beside it.

Where the target is grown, it is grown **honestly** — the control gets the
height, and the row's phone padding comes off, since padding that was giving a
28 px button air is axis spent on nothing once the button is 44. The column head
goes 32 → 44 px and the sheet header 36 → 44, which is 20 px for the panel's
primary navigation: the park, the day, the plan list. A door at 44 px onto a list
of 28 px rows is half a fix, so the park list and the month calendar behind those
two buttons are raised with them.

**Exactly one control keeps a pseudo-element, and the one that nearly got a
second is the instructive half.** The party chip rides in
`PlannerContextBand`'s reserved `min-h-[60px]` box, where growing it costs 16 px
and draws a 44 px pill among 20 px badges — so the target reaches down into the
band's own prose row, which carries text and no target. The show strip looked
like the same case (`min-h-[22px]`, and taller means covering more of the axis)
and is not: it is `sticky top-0` **inside the grid's scroller**, so an overhang
travels with the scroll across the blocks — and a block is selected by a plain
`onClick` on its `<li>` with no pointer-type gate, so the corner of whatever
block passed underneath would have toggled the shows instead of opening its
action row. The strip grows instead, which costs the axis nothing (it is scrolled
content, not part of the scroller's box) and costs coverage, which scrolling
recovers where a stolen tap does not.

One entry in that list was not a size at all. `SheetContent` drew its close
button `max-sm:size-11` at `right-2`, covering the rightmost 52 px of the header
row, while the row reserved `pr-7` plus the header's `px-3` — 40 px. "Einen Tag
planen" sat 12 of its 28 px under the ×, and the fix was `max-sm:pr-14`. Dropping
the × from the phone sheet takes both sides of that away: there is nothing to
clear, so the row carries `pr-7` where `!isPhone` and nothing where the sheet is
a phone's, and the 56 px go back to the head. The clearance is keyed on the same
value as `hideClose` rather than on a width, because what it clears is the button
that value decides. A sweep skips a control that is covered at its own centre
(that is a different defect), so the overlap has a named check of its own, asked
as `click({ trial: true })` because "receives events" is the question and
Playwright names the intercepting element when the answer is no. It measures the
**rightmost** control of the header whatever that is today, so it keeps working
over a header that no longer has a × in it — it is the header's own controls it
guards now.

### A plan may not depend on a gesture landing

The grip is one 44 px strip and it is the only pointer path a phone has: the
block's body gates itself on `(pointer: fine)` deliberately, because `touch-none`
on a box that covers most of the grid would stop the plan scrolling exactly where
it is read. So the action row a selected block docks into carries **±15 minutes**
for every entry, not only for free blocks. It is the same write (`moveEntry`) and
the caller clamps it — `clampStart` against the same `rideFloor().hardMin` the
drag obeys, so a press cannot put a block anywhere a drag could not.

15 and not the drag's 30: `SNAP_MIN_COARSE` is half an hour because fifteen
minutes under a sliding finger reads as jitter, and a press is not sliding.

The row wraps below `sm` (`max-sm:flex-wrap`, label on its own line) because a
free block now carries four icons, two durations, two moves and a delete beside a
label — over 400 px in a 390 px screen.

### A landscape phone is a row, because the chrome is taller than the sheet

`planner-phone` reaches a landscape phone since PAR-76 — `(height < 31.25rem) and
(pointer: coarse)` is the second half of that switch — so 844 × 390 gets the
bottom sheet, the grab handle and the 44 px targets. It still had no day.
Measured on `main` @ `1a0c17d7`, direct children of the open sheet with a height:

```plain
Griff 44 · sheet-header 45 · Kontextband 61 · Optimize 61 · Headliner 96
· Summary 37 · Push 30   =  343 px Chrome in einem 359 px hohen Sheet
```

Sixteen pixels of axis, all of them under the optimize row. **Two hours of day is
216 px** at `PX_PER_MIN_COARSE`, so no order of those rows fits above the axis:
they have to stand beside it. That is PAR-168, and Patrick picked the arrangement
(way B, two columns) over the alternative of naming rows a flat window does not
get.

The switch is a third variant, `planner-landscape`, and it **refines
`planner-phone` rather than standing beside it**: same two terms plus
`(width >= 40rem)`, so everything the phone branch says still holds here and a
`planner-landscape:` class only ever says something it left open. There is
deliberately no complement — an arrangement that holds everywhere except one size
is written unprefixed and the one size overrides it. The JS twin is
`PLANNER_LANDSCAPE_QUERY`, beside `PLANNER_PHONE_QUERY` in
`lib/planner/use-grid-scale.ts`, and it answers the one question a class cannot:
which side of the row draws the context band.

The sheet's body is carried by two wrappers that are `display: contents` at every
other size. That is what makes the arrangement free: with no box, the sheet's
flex children are the same boxes in the same order as before, so portrait and
desktop cannot move. Measured against `main` @ `1a0c17d7` on the same dev server,
the axis' visible height and whether anything is painted over it:

| Fenster           | Sheet                 | vorher                                          | nachher                    |
| ----------------- | --------------------- | ----------------------------------------------- | -------------------------- |
| 844 × 390, coarse | 829 × 359 bei (0, 31) | **16 px**, verdeckt von `data-planner-optimize` | **269 px**, nichts darüber |
| 390 × 844, coarse | 375 × 776 bei (0, 68) | 253 px                                          | 253 px                     |
| 1440 × 900, fine  | 448 × 900 bei x=992   | 464 px                                          | 464 px                     |
| 1440 × 480, fine  | 448 × 480 bei x=992   | 44 px                                           | 44 px                      |

The lower three are identical row for row and not only in the total — the sheet's
whole child list, each box's height and top, compared before and after.

What the row looks like at 844 × 390: the left column is `20rem` and scrolls
(616 px of content in 269), the axis takes the 509 px beside it and **269 px of
height**, i.e. two and a half hours. The context band moves left with the rest —
`withBand` on `PlannerDayColumn`, the third gate of its kind after `withHead` and
`withFoot`, and for the same reason: 61 px above a 270 px axis is a quarter of
the day, 61 px beside it is nothing.

One class had to change with it. The ride search is the sheet's only `shrink`
child, so in the left column it absorbed the whole overflow and came out **0 px
tall** while its inner element still reported a box. `planner-landscape:shrink-0`:
in a column that scrolls, nothing has to give way, so nothing may. Its `32svh`
cap stays, which makes it a scroller inside a scroller — deliberate, because
without the cap the park's whole ride list expands into the column and pushes the
totals and the push toggle past anything a thumb will reach.

The left column is `order-first` rather than first in the document, and that is a
trade worth stating: `order` moves the box and not the document, so the visual
order runs left to right while tab and screen reader run right to left
(WCAG 2.4.3). Reordering the children for one size means React unmounts and
remounts them on every rotation — the ride search loses its query, the column its
scroll position and its selected block. So the reading order is the one every
other size gives: the day, then what can be done to it.

The row is only drawn where a day has been chosen. Every row it puts on the left
hangs on a park and a date, so without one the left column would be 320 px of
empty box and a divider beside the empty state; there the sheet stays the stack it
has always been.

`check:planner` asserts all three of those now rather than printing the axis
height: two hours visible (`AXIS_MIN_LANDSCAPE_PX`), nothing over the axis, and
the chrome beside rather than above it — the last one because two hours could
also be bought by deleting rows, and the check should be able to tell the two
apart. The covering assertion also gained `axisVisible === axis`: without it an
axis pushed past the sheet's own bottom edge reports "nothing is over me",
because `elementFromPoint` answers `null` outside the window.

### The phone sheet, measured against an iPhone screenshot (PAR-482)

The report was three sentences — buttons outside the view, a planner that will not
close, no warning when every headliner is too tall for the children — and the first
two turned out to be one bug that no Chromium run could have shown.

**iOS zooms in on a text field under 16 px and never zooms back out.** The ride
search and a free block's label were `text-sm`, so one tap into either left the page
at 16/14 = 1.14×. The sheet is `position: fixed` against the layout viewport, so at
that zoom its right edge ran past the screen (every row cut mid-word, which read as
an overflow) and its top — the handle and the header — above it. The screenshot
gives the zoom away: the search field is 110 image pixels tall where a 1× render of
the same screen gives about 94. In Chromium nothing overflowed at 320, 360 or 390 px
in German or French, `scrollWidth === clientWidth` on every page behind the sheet.
The admin had hit the same zoom before and carries a rule for it; the planner gets
its own in `app/globals.css`: under `(pointer: coarse)`, every text field inside
`[data-planner-sheet]` renders at 16 px. Keyed on the pointer and not the width,
because the zoom is a touch-screen behaviour and hits an iPad too.

**The selected block's action bar was the biggest thing in the sheet.** With
`max-sm:flex-wrap` and 44 px targets it wrapped into four lines — the name, two
moves, seven icon buttons, the durations and a bare "×" — about 200 px docked over a
scroller of about 240 (measured: 210 px at 390 × 844 with a free block selected), so
the block being edited was usually underneath it. It is two
lines now, about 105 px at 390: the name and the deselect "×" first, the controls spread
across the second. The seven icon buttons became one dropdown (the trigger shows the
current icon), delete is a bin in the bar on every size again (the block's corner ✕
from PAR-313 stays as the shortcut), and every icon button is one class, `size-8`
with `gap-1` inside a group and 44 px on a coarse pointer (PAR-326). A block selected
under the bar is scrolled clear of it (PAR-332): the scroller gets the bar's height
as bottom padding while a block is selected, so even the last block of the day can
rise above it, and the column scrolls by as much as the bar covers. The scroll follows
the CLICK and not the selection, because a drag selects its block on `pointerdown`
and moving the day under a finger that is still holding the grip would move the drop
target with it.

**„Tag optimieren" is a call to action where it would change something (PAR-493).**
It was a grey ghost button at the top of the foot, two rows away from the total it
lowers, and nobody saw it. The foot now reads headliner band, free block, optimise,
summary — so the button stands directly over „Wartezeit 3:45 Std." — and the panel
runs the optimiser once before anybody presses it, with the same input and the same
`scoreCurrent` before-figure `run` uses. Where the answer beats the plan on screen by
at least five minutes, or brings a ride back inside the day, the button is filled with
the primary colour, takes the rest of its row and says what the press is worth
(„70 Min. weniger Warten") on a second line. The figure is on the five-minute grid,
and so is the result line after the press, so the promise and the report cannot
disagree. The search is memoised on the grid's numbers rather than the grid object,
because the panel rebuilds that object on every render and one search is 5–50 ms.

**The rest of the room went to the axis.** The missing-headliner band is one row of
pills scrolled sideways on a phone instead of two capped rows with a scroller of
their own, and the ride search drops its two-line tap hint once the day has a ride in
it — by then the tap has done what the sentence says. On a phone the headliner button
beside the call to action takes the wizard's shorter label („Headliner einplanen"), so
the two share one row at 360 px in German. Measured with Europa-Park, eight rides and a
lunch block: the axis went from 319 to 366 px at 390 × 844 and from 262 to 311 at
360 × 800.

**The grabber works like an iOS sheet's.** It used to commit on release against a
distance and do nothing while the finger moved, with two heights to choose between —
the sheet could be pulled bigger and never smaller. Now it follows the finger and snaps
to one of three detents on release: `large` (where it opens, under the header), `full`
(100svh) and `medium` (half the screen, to see the page the rides come from). The
nearest detent wins; a flick (over 0.5 px/ms) moves one detent on from where the drag
started even over a short distance; a flick down from `medium`, or a release 90 px under
it, closes the sheet; a tap steps up one detent and from `full` back to `large`. A
landscape phone has no `medium`, half of 390 px is not a day. The drag writes `bottom`
and `height` straight onto the element — never a `transform`, which would make the glass
a backdrop root and flatten its blur — so below its `large` box the sheet slides down
with its lower half past the screen, the way iOS draws a medium detent. At rest the
detents are classes on the CSS variables `--planner-sheet-large` and
`--planner-sheet-medium` (`app/globals.css`), and the drag measures those very values
with a probe element (`sheetDetentHeights()`) rather than recomputing them from
`innerHeight`, which on iOS differs from `svh` whenever the toolbar collapses; the sheet has a definite `h-*` now beside its `max-h-*`, because `medium` is
measured from the top of a `large` box and a short day with `h-auto` would have slid off
the screen. Snapping, opening and closing run on the iOS sheet curve,
`cubic-bezier(0.32, 0.72, 0, 1)` over 400 ms (PAR-190's first half); the desktop panel
keeps its 300 ms, timed against the page's inset. `check:planner` drags the grabber
halfway, asserts the sheet is already following, releases at `medium` and taps back to
`large`.

**The grabber is the header, and a short window gives up the site header.** The
grabber had a 44 px row of its own with the bell and the × in its margins, so a
phone spent 89 px on chrome before the park name. The pill now sits in a 16 px strip
at the top of the sheet header, and the grabber is a button laid BEHIND the header
(`absolute inset-0`, the row painting over it), so a press lands on it wherever no
control is — the strip, the row's side padding — and a control is never under it. The
× is the last control of the park/date row with the bell beside it (the day picker
folds its calendar icon away on a phone, its chevrons are 32 px wide and the row's
gaps 4 px to pay for them: the park name keeps 127 px at 390 and 97 at 360). The × is
drawn 32 px wide so its disc sits 12 px from the sheet's edge, like the park button
on the left, and its target reaches through the row's padding to the edge. The bell
was at the end of the optimise row for a while; it went up when the shows switch
needed that place (see the section on shows). 61 px instead of 89. On a window under
50rem tall — which is every iPhone in Safari, whose visible page is 660–750 px — `large`
opens over the site header too, 12 px under the top edge (the `@media` twin of
`--planner-sheet-large`), and `full` is not offered there, being a
12 px sliver above it; a tap then toggles between half and large. Taller windows keep
the header visible. Measured with Europa-Park, eight rides and a lunch block: the axis
is 264 px at 390 × 664, 382 px at 390 × 844 (366 before) and 316 px at 844 × 390 (269).
`check:planner` grabs the strip rather than the handle's centre, which is under the
day picker now, and asserts the landscape sheet at 378 px.

**Every row of controls in the phone sheet is drawn at 32 px.** The park and date
buttons, the headliner pills, "Headliner einplanen", "Tag optimieren" and the bell were
44 px tall to a finger and 44 px tall to the eye, and on a 664 px window that was the
report: "die Headliner-Pillen sind viel zu hoch, die CTAs auch", then "die Datums- und
Parkanzeige hat noch viel Platz nach oben und unten". They are drawn at 32 now and keep
a 44 px target with an `::after` overhang, which is the party chip's trade that the
section on targets above explains, written down once in `lib/planner/touch-target.ts`:
`PHONE_TARGET_32` reaches 6 px above and below, `PHONE_TARGET_32_UP` puts all 12 px
above. Where the overhangs go is the design:

- the header row's reach 6 px up into the grabber's 16 px strip (the pill sits in the
  10 px above that, where a press still lands on the grabber) and 6 px down into the
  header's `pb-1.5`;
- the pills are the exception: drawn 26 px, so the 16 px thumbnail sits 4 px from
  the pill's border above and below as it does on the left ("oben zu groß"), and the
  box around them keeps 4 px on every side of the pills too. Their reach goes 12 px
  up into the heading, which is text, and 6 px down, 1 px into the band's padding and
  clear of the optimise buttons' reach from below. A scroller clips its children for
  hit-testing as well as for paint, so the pill row carries 14 px of padding above and
  8 below and hands it back with negative margins, and an absolute box is placed from
  the padding edge, so the bordered pill needs `-top-[13px]` and `-bottom-[7px]`. The
  band's heading keeps its own line: folded into the pill row it took 150 of the
  356 px the pills scroll in, which left two of them on screen;
- the two optimise buttons and the shows switch beside them reach only UP, 12 px,
  through their row's top padding and 3 px into the band, stopping short of the pills'
  reach. A third 44 px row of targets under this one would cost the foot about 43 px
  however the padding is shared out, so the summary line under it carries nothing to
  press and is as tall as its text. The shows switch is drawn 36 px wide and reaches
  4 px to each side, into the row's gap and its padding. On a phone the headliner
  button says a shorter label (`optimize.headlinersShort`, „Headliner planen") and is
  `w-min`: as wide as its longest word, so the label always takes two lines like the
  call to action beside it and the call to action grows into the rest (a box does not
  shrink to text that has wrapped). The row does not wrap on a phone either: a
  wrapping flex row breaks the line before it shrinks anything, and at 360 px that
  put the last control on a line of its own. It was the crown alone for a while; the
  report was that nobody reads a crown as "add the headliners". Where there is nothing
  to gain, "Tag optimieren" is tinted like the headliner button rather than grey. All
  six locales fit at 360 px with the row at 45. On a day with nothing to optimise the
  row is drawn for the shows switch alone, and only on a day that has shows
  (`dayHasShowLines`), in the same frame (`OptimizeRow`), so the switch keeps its
  place in the tree when the buttons arrive.

Measured with `elementFromPoint` on every one of them: 32 + 6 + 6, 32 + 12 + 0 or, for
the pills, 26 + 12 + 6, i.e. 44. Header 61 → 55 px, band 96 → 70 px, the optimise row
53 → 45 px, the summary line 45 → 29 px, and the show band, 44 px over the top of the
axis, gone. The axis is 347 px at 390 × 664 and 323 px at 360 × 640, with the context band on one
line and the search at rest in one row (see below).

**Undo sits in the button row, and a search gets the sheet.** On a phone the undo
after „Tag optimieren" is an icon at the end of the optimise row, left of the shows
switch, drawn only while there is something to undo, and the sentence that reports
the press is read out but not drawn there („worauf bezieht sich das?": with the undo
gone from it, it stood under the row with nothing to say what it was about). A
report that is an alert stays drawn, because it carries „Anpassen". The wide
arrangement keeps the sentence and the undo as a link in it. The call to action takes the rest of the row in both of its states.
The ride search was the block the sheet squeezes, so with a day in it the rows a
query found sat under the search's own head, and on an iPhone under the keyboard
as well: „da kann man nix drin suchen". A tap into the field now turns on a search
mode (portrait only): the axis and the foot are hidden, kept mounted, and the search
fills the sheet right under the header, its list scrolling under a field that stays
put. „Fertig" beside the field, where iOS puts it, empties the field and gives the
day back. Leaving the field does not end the mode, because a tap on a row blurs the
field before the row's click lands, and a layout that jumped back on blur would
move the row out from under that click. At rest on a portrait phone the block is
one row — the field and „Eigener Block" beside it — and the ride list is drawn only
in search mode: the list at rest was what the sheet squeezed away, and at
390 × 664 the block was handed about 100 px, which cut the free-block row in half
and showed no ride at all („Eigener Block abgeschnitten"). The row is 45 px, the
field 32 px like every other control in the sheet, the free-block button reaches
44 px into the row's own 6 px padding, and the block is `shrink-0` so the sheet
cannot clip it. The axis is 347 px at 390 × 664 and 323 px at 360 × 640 with it.
A landscape phone keeps the list, in its own column, and so does a narrow window
under a mouse: both halves ask `(pointer: coarse)` as well, because a mouse drags
rows out of that list onto the axis, and search mode would hide the axis it drops
on. In the context band „Ferien nebenan" is a palm
on a phone (26 px instead of 97, the words stay as `sr-only` and `title`), which
brings the chip row back to one line at 360 px: the band is 60 px there again, 20 px
that go to the axis.

**A party that fits no headliner is told so (PAR-484).** `headlinersToAdd` drops a
headliner that is too tall for the smallest rider or wet for a party that wants to
stay dry, and an empty list used to land in the same branch as "every headliner is
already planned": „Für diesen Tag fehlt keine große Bahn mehr" over a family whose
children fit none of them. The wizard now counts `headlinersSkipped` and, where that
is what emptied the list, draws a notice in the crowd tint naming the reason (height,
water or both) and the way on: the rides can still be added one by one in the panel,
where the search flags them rather than hiding them.

## Checking it

```bash
pnpm test:planner-actions      # the plan operations, pure
pnpm test:planner-estimate     # what a block is expected to cost, and from which regime
pnpm test:planner-grid         # minutes → pixels, and the axis
pnpm test:planner-leg          # what the chip between two rides says
pnpm test:planner-park-time    # the zone rules
pnpm test:planner-weather-rail # the band down the edge of the day
pnpm test:planner-ride-drag    # the drag payload and its two fallbacks
pnpm test:planner-month-grid   # the month matrix
pnpm check:planner             # drives it in a browser — needs a running site
```

It also carries a **390×844 pass**: that the grip's touch target really is 44 px
tall (`elementFromPoint` at both ends of it, because a bounding box cannot see a
pseudo-element), that a drag with `pointerType: 'touch'` moves the block — every
earlier drag assertion in that file ran on a mouse, which is a path a finger
never takes — that the ±15 button is 44 px and moves a quarter hour, and that the
axis gets its 200 px floor.

**That pass opens the page with `hasTouch`, and nothing it asserts means anything
without it.** A 390×844 viewport on its own is a mouse in a narrow window:
measured, `{coarse: false, fine: true, hover: true, maxTouch: 0}`. Everything in
the planner that decides by pointer type — the snap step, the block body's
`(pointer: fine)` gate, every `hover:` style — therefore answered the desktop way,
and the assertions were written against a phone that did not exist. Not
hypothetically: `Griff ist auf dem Handy treffbar` was green on `main` while a
real coarse pointer missed the same grip by 22 px, and the touch drag moved a
block zero minutes there and passed. **A dispatched touch pointer is not the same
thing as being a touch device** — the event says touch, `matchMedia` and CSS
still say mouse. `isMobile` is deliberately left off beside it: it adds the mobile
viewport meta and text autosizing, which move the very numbers this pass measures,
and the planner's phone layout is `max-sm:` against the window rather than
viewport scaling. The first assertion in the pass asks the browser what it is
(`die Handy-Seite ist ein Grobzeiger`) rather than trusting the option.

`check:planner` is the one that catches what the others cannot: whether the store
rehydrates, whether the launcher appears, whether the sheet opens on the right
edge (the bottom one on a phone), whether a tick survives a reload, and whether
any surface is rendering a raw message key. It also runs one **static** check
before the browser starts — that every `quality` a planner image asks for is in
`next.config.ts`'s `images.qualities`. Next 16 answers an unconfigured quality
with a 400 from the image optimizer, so the picture is simply absent in
production while `next dev` serves it and prints a warning nobody reads; three
planner surfaces shipped `quality={70}` and `quality={80}` against a configured
`[50, 60, 75, 85, 90]`, i.e. every photograph the feature has.

### Opening the panel is a step of its own, and a failed one is a ❌

Every flow in that file starts by pressing the edge tab and waiting for the
sheet, and for as long as it existed those were two bare calls. Both throw, and
a throw at the top level of an ES module ends the run: twice on 2026-09-13, with
roughly 300 green assertions behind it and all 40 flows after it unmeasured. The
press is the fragile half — `waitUntil: 'domcontentloaded'` resolves before React
has wired the tab, so the press lands on a painted button with no handler on it
and the wait then expires over a sheet nobody asked for. It only reproduced while
the machine was busy with something else, which is the run with the most to lose.

`openSheet(page, where)` is the only way in now, at all 39 places, and three
things about it are load-bearing. **The repeat is the mechanism, not the
timeout**: a longer single wait only postpones the same press on a dead button,
so a press that produced nothing is followed by `settleHydration` and another
one, three at most. **A press that landed is read off
`html[data-planner-open]`, not off the sheet** — the `planner` namespace is its
own 15 KB chunk, so for the length of that fetch a landed press has no
`[data-slot="sheet-content"]` to show for itself, and a guard reading the sheet
would press a toggle twice and close the panel it was waiting for. **And the
success is waited for on `[data-state="open"]`**, because a sheet on its way out
stays visible for 300 ms while carrying `closed`. An attribute with no sheet
behind it after three waits is reported as what it is: the press worked and the
chunk never arrived, which `useLazyMessages` does not retry.

A failure is a named ❌ carrying the presses and what the last one said, and the
call site then leaves its own block (`step: { … break step; }`, closing its page
on the way out) so the rest of the run still executes. Successes are counted
rather than asserted — 39 green rows about opening would bury the assertions
about what is _in_ the panel — and the count rides with the balance:
`ℹ️ Planer 53× geöffnet`, with the repeats and the failures beside it. That
figure is the one that says whether the run got as far as the flows it reports
on. Add a bare `locator(LAUNCHER).click()` and it stops being true.

The balance itself is now unconditional: `uncaughtException` and
`unhandledRejection` print the stack and then the balance, and every exit leaves
through `exitAfterFlush`, because `process.exit()` does not wait for a pending
write and stdout is a pipe whenever this runs from a script. Measured on
Node 24: a rejected top-level `await` arrives as an `uncaughtException`, not as
an `unhandledRejection`. What is **not** hardened is every other interaction —
56 bare `.click()` calls inside an already-open sheet, plus two bare
`waitFor`s (one for the sheet going away after `Escape`, one for a search hit) —
so a throw there still ends the run, with a balance but without the flows after
it.

After moving a planner component across the client boundary, or adding a
namespace to one, re-run `pnpm generate:route-namespaces` and
`pnpm generate:message-chunks` — the wizard's `sr-only` weather condition is what
puts `parks.weather` on `/trip-planner`'s list (558 B brotli), and a stale lazy
chunk renders raw keys with a green build behind it.
