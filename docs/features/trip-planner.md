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

`PlannerWizard` asks three questions in the order somebody answers them, then
lands on the park's own page with the panel open.

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

Before this, showtimes were read off the live park payload, which only ever knew
today — so sixty of the sixty-one dates the picker offers drew nothing and the
band had to say „steht erst am Tag selbst fest". That sentence is gone; an empty
`shows` array is now a statement about the park.

**They switch off, and the band stays.** Shows are the one thing on the grid
nobody put there — a plan is what somebody dragged in, and four dotted rules
across it are context. The switch lives in the band (`lib/planner/shows-visible.ts`,
an external store on `localStorage` so the decision survives a reload) and hides
the rules; the band then says so instead of disappearing with them, because a
strip that vanished would take the switch with it and somebody who turned the
shows off by accident would have nothing left to press. It renders only where
there is something to switch: on a day the API answered with no shows, a control
that toggles an empty set is a control that does nothing.

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

## The panel changes the page's width, and four things had to learn that

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

After moving a planner component across the client boundary, or adding a
namespace to one, re-run `pnpm generate:route-namespaces` and
`pnpm generate:message-chunks` — the wizard's `sr-only` weather condition is what
puts `parks.weather` on `/trip-planner`'s list (558 B brotli), and a stale lazy
chunk renders raw keys with a green build behind it.
