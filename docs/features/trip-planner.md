# Trip planner

A visitor's own plan for one day at one park: which rides, in which order, at
which minute — laid out on a timeline against the park's own wait-time forecast.
Everything lives in the visitor's browser. There is no account system, and the
plan is theirs.

Behind the `planner` feature flag (`flags.ts`), which gates the launcher, the
page, and the two controls that put a ride into a plan.

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

## Push notifications

`lib/planner/use-push-subscription.ts` + `public/sw.js`, VAPID, one topic
(`next-up`). The plan is uploaded **before** subscribing, because a subscription
with no plan behind it has nothing to notify about.

**Delivery is unverified.** This environment has no VAPID key pair and no reach
to a push service, so the wiring is written and typechecked and has never
delivered a notification. `.env.example` documents `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`.

## Checking it

```bash
pnpm test:planner-actions      # the plan operations, pure
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
