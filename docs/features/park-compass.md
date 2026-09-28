# The in-park compass

Under the homepage hero, for a visitor the nearby answer places inside a park: the park's
headliners on a compass dial, the ride the phone points at in a bar under it, and the same rides
as a list with the way to go, the distance and the wait. Code: `components/home/park-compass-slot.tsx`
(mount point), `park-compass.tsx` (state, bar, list), `park-compass-dial.tsx` (the dial),
`lib/utils/compass.ts` (all the arithmetic, `pnpm test:compass`), `lib/hooks/use-compass-heading.ts`.

The first version is described in [homepage-hero.md](homepage-hero.md#under-the-hero-the-headliners-on-a-compass);
this page is what it became after a design, an architecture and a usability review on 2026-09-27,
with the numbers each change was held to.

## Where it appears, and when

The slot renders for `in_park` answers with at least one in-season headliner (`splitInParkRides`,
the same filter the list uses) and for the `?sim=compass` demo. The compass module is loaded by
hand the moment that is known, so nobody else downloads it.

**It is only ever put in below the viewport.** The compass is some 1,300 px on a phone and lands
a second or more after load. No box is held open for it, since that would be a screen of nothing
for every visitor at home. A reader who had scrolled past the slot had the page pushed down under
them, a layout shift of 1.0 at y = 1100. The browser's scroll anchoring did not absorb it. A
`scrollBy` in a `ResizeObserver` kept the page visually still (a reference heading stayed at 52 px),
but the Layout Instability API scored it 1.0 all the same, because it counts a node that moved in
the document whatever the scroll did.

So the slot waits until the module is there and the slot lies below the viewport, with at most
10 % of the screen showing below it (`VISIBLE_SLICE`). On a 390 × 844 phone the next section
starts at 798 px, so at the top of the page 46 px of it are in view; waiting for zero would mean
never.

| viewport  | reader at | before | now                                   |
| --------- | --------- | ------ | ------------------------------------- |
| 390 × 844 | y = 0     | 0.0545 | 0.0545                                |
| 390 × 844 | y = 1100  | 1.0    | 0 (the compass comes back at the top) |
| 360 × 740 | y = 0     | 0      | 0                                     |
| 360 × 740 | y = 1100  | 1.0    | 0                                     |

Inside, the compass keeps its height as its data arrives. The status line under the title always
has its second line (calibration, „Standort wird genauer bestimmt …", or the coarse-fix warning,
or nothing), the hint under the bar is always there, and the bar is a fixed 76 px with every line
truncated. Each of these used to appear or change height a second after the compass did and move
the list under the reader. `pnpm measure:cls --late` does not reach this block (it replays
Suspense streaming, and this is geolocation-driven client state), so the table comes from
Playwright's `layout-shift` entries against `pnpm build && pnpm start`, with the device placed at
Cologne Cathedral under `?sim=compass:disneylandparis`.

## The dial

A bezel (the „Lünette", 43–49.5 of a 100-unit drawing) with 5° ticks and the four letters upright
in its middle (a north triangle under the N covered the letter once the bezel narrowed); a face cut out of the park's own hero photo, blurred and
dimmed, with a faint eight-point rose; the rides on the face at their true bearing, distance as
the radius. The first bezel ran 40–49.5 with numerals every 30° and the heading as a figure on the
ring. That left the rides a 194 px circle on a 360 px phone, where 13 pairs of Phantasialand's
markers sat closer than they are wide. Nobody in a park acts on „120" or „100°", so both went, and
the range ring moved out from 34 to 37.5.

**One blue.** Blue is the reader and the way to the ride in focus: the arrow, the cone, the lit
arc, the dashed route. North and the rose are the foreground colour. With a blue north ray, a
reader facing north saw two blue spikes leave the centre.

**A marker says what the ride is doing.**

| ride                    | marker                                            |
| ----------------------- | ------------------------------------------------- |
| open with a posted wait | the minutes on an opaque disc in the wait colours |
| open, no wait posted    | a green ring with a dot                           |
| breakdown (`DOWN`)      | an orange ring with a warning sign                |
| refurbishment           | a ring with a wrench                              |
| closed                  | a 16 px hollow ring, nothing in it                |

The wait discs are `CROWD_SOLID_CLASS`: the dark theme's `--badge-crowd-*` tones, opaque, in both
themes. `badge-crowd-*` is a 60 % fill of the light theme's pale tones under white text, which
measured 2.1–3.2 : 1 over the face in the light theme (12 px bold needs 4.5) and let the view cone
show through the number; the solid tones measure 5.4–7.9 : 1. A breakdown used to be the same grey
dash as a closed ride, so a reader turning towards a broken-down ride got no warning from the
dial. Every marker's hit area is 44 px (`::after`), whatever it draws; markers are kept 34 px
apart centre to centre, worked out from the measured dial width. The first version's fixed
10-unit gap was less than a marker on any dial under 340 px.

**Names.** `dialLabel` shortens („Chiapas", „Big Thunder…", „Pirates…"), `placeLabels` places them
like map pin labels: eight places around the marker, outward first, then a step further out and
onto the bezel, never over a marker (each at its own drawn size), another label or the reader,
with a hairline to the marker. The pinned ride chooses first, then the nearest. The order used to
follow the ride ahead, and one or two names jumped every time the reader turned.

## The bar and the list

**The bar follows the eyes.** With a compass it names the ride in the view cone: `rideAhead` takes
the ride nearest the heading within 30° (the drawn cone is ±26°), holds it against a challenger
nearer by less than 4°, and the change is taken only after it has held for 300 ms. The first
version had no angle limit and said „Vor dir" about a ride 116° off with its own arrow pointing
backwards; without the wait, Disneyland's east side (four headliners within 10°) changed the bar
ten times in five seconds of simulated sway. With nothing in the cone the bar names the nearest
ride, and says so.

**A tap pins.** A tap on a marker pins that ride (a pin badge on the marker, „Fixiert" in the bar)
and it stays whichever way the phone turns; a tap on it again, or the ✕ in the bar, lets go; a tap
on another marker pins that one. A pinned ride that leaves the list is forgotten, and the
component is keyed by park, so a pin never carries over to another park. The bar is a link to the
ride.

**Held still while walking.** A row only overtakes the one above it when it is nearer by more than
max(15 m, half the fix's accuracy) (`stableOrder`); on a simulated 160 m walk the plain sort
reordered a quarter of the fixes, up to five rows at a time, and a row is a link. The range ring
grows at once and shrinks only when the farthest ride is under three quarters of the step below
(`stableRange`); it flipped 300 → 400 → 500 m on the same walk, moving every marker each time.

**The list** puts a ride's status on its second line as text („126 m · Geschlossen"), so the name
keeps the row: the red badges took the name column down to 70 px at 360 px, and a closed park was
ten identical red pills. A closed park gets one line under the title instead: „Alle
Top-Attraktionen haben gerade geschlossen. Öffnet am …". Waits are the solid badges.

## Without a compass, and when it is unsure

An arrow drawn north-up reads as „go this way" to anybody holding the phone. So without a live
heading (a desktop, iOS before the tap, a denied prompt, a stream that died) there are no arrows:
the chips show the compass point („SW") and the rows say „Richtung Südwesten". The dial stays north
up and says so.

- **iOS**: „Kompass einschalten", with the line „Safari fragt einmal nach Zugriff auf Bewegung und
  Ausrichtung. Bis dahin ist Norden oben." After a denial, „Nochmal fragen".
- **A stream that stops** (no event for 3 s, or none within 1.5 s of listening again) drops back to
  north up. It used to stay „active" forever, a frozen arrow under a pulsing live dot.
- **Calibration**: Safari reports its own error; over 25° or unknown, the line says „Kompass
  unsicher. Beweg das Handy ein paar Mal in Form einer 8." (`compassUnreliable`).
- **Held upright**, the top edge points at the sky; beyond 65° of tilt the heading is taken from
  the back of the phone (the W3C compass-heading formula). The two agree at the hand-over for a
  phone held level side to side.

## True north

A phone's compass points at magnetic north (Safari's `webkitCompassHeading`, Android's rotation
vector behind Chrome's absolute `alpha`); the bearings to the rides are true north. `/positions`
sends the park's declination from the World Magnetic Model (WMM2025, the `geomagnetism` package,
server side) at the middle of its rides, and the compass adds it to every reading. 2.2° at
Disneyland Paris, about 1–3° across western Europe, about 11° at Disneyland Anaheim, where every
arrow and every „vor dir" was off by that much.

## Where the reader stands

A high-accuracy fix while the compass is on screen and the tab in front, adopted only when it
moved more than max(3 m, a third of its accuracy) or is much better than the last; every fix used
to re-run both layouts for a metre of GPS noise. Until a fix arrives the line says „Standort wird
genauer bestimmt …", over 40 m „Standort ungenau (± 65 m). Die Pfeile können danebenliegen.". Closer
to a ride than max(20 m, the fix's accuracy), its chip is a pin and its row says „Du bist da"
instead of an arrow that would point anywhere.

## What a frame costs

The heading is written into `--heading` on exactly the elements that turn (`data-heading`,
collected after every commit), each on its own compositing layer (`will-change: transform`), and
not at all for changes under 0.25°. It used to go on the panel root: every frame restyled the 387
elements under it and repainted the blurred photos, 45 fps measured, and it never stopped, since
magnetometer noise moves a still phone's heading on every sample. Three seconds of rotation, the
„before" column from the review's `next dev` run, the „now" column against `pnpm build && pnpm
start` (186 ms and 179 frames under `next dev`):

|                     | before  | now    |
| ------------------- | ------- | ------ |
| frames              | 134     | 181    |
| style recalculation | 1520 ms | 188 ms |

## Data

`/api/parks/<geo>/<park>/positions`: `{ positions: { slug, latitude, longitude }[], declination }`,
day-cached, listed in `next.config.ts` with the handler's own value (it answered `no-store` under
`next start` before). See [API budget](../architecture/api-budget.md#ride-positions-for-the-in-park-compass-88-kb--07-kb).
The face and the panel's glass share one 256 px rendition of the park photo, 2.9 KB as AVIF.

## The hero pill

While the compass is on the page, the hero's badge row carries „Zum Kompass" in the news chip's
slot (same 30 px, a 44 px target). It scrolls the section under the sticky header and focuses it.
The hero learns of the compass from `useCompassPresent`, set by the slot when the compass is
actually in, not from its own nearby answer: under `?sim=compass` the hero stays on the device's
real position.

## The demo

`?sim=compass` (Phantasialand) or `?sim=compass:<preset>` lays a real park's live answer around the
device, in production too. The European presets are closed at night, when every marker is an empty
ring; `compass:disneylandanaheim` and `compass:magickingdom` are open then, with waits, breakdowns
and refurbishments to look at. See
[flags and debug](../development/flags-and-debug.md#the-compass-demo-works-in-production-simcompass).
The banner says what it is, offers „Standort nutzen" and „Demo beenden", and after a denied prompt
says the reader now stands still at one point in the park.

## Is it used

Five Umami events, four of them without a property: `compass_viewed` and `compass_heading_on`
once per page view, `compass_ride_pinned`, `compass_ride_opened` (`from`: bar or list) and
`compass_pill_clicked`. None fires under `?sim=`. Pricing and the reasoning are in
[analytics](../development/analytics.md#the-in-park-compasss-five-events-sep-2026).

## What the review asked for and did not get

- **Strip the bezel entirely** (design): the bezel stayed, because making the compass look like a
  compass was the point of the redesign; it lost the numerals and the heading figure instead,
  which is what took the room.
- **„Dein Ziel" instead of „Fixiert"** (usability): „Fixiert" is the word the product owner uses;
  the ✕ and the hint under the bar do what the renaming was meant to.
- **Pinning from the list** (design): list rows stay links to the ride; the bar now links too.
