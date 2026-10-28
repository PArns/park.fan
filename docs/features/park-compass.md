# The in-park compass

For a visitor whom the nearby answer places inside a park: the park's headliners on a compass dial,
the ride the phone points at in a bar under it, and the same rides as a list with direction,
distance and wait. It appears under the homepage hero and at the top of that park's own page. Open
this page before touching the compass, its placement rules or the in-park block on the park page.

The park map on the map tab and in posts: [park map](park-map.md).

| Piece                                        | File                                                     |
| -------------------------------------------- | -------------------------------------------------------- |
| Homepage mount point                         | `components/home/park-compass-slot.tsx`                  |
| Park page mount point                        | `components/parks/park-in-park-block.tsx`                |
| The module, loaded by hand                   | `components/home/use-load-park-compass.ts`               |
| State, bar and list                          | `components/home/park-compass.tsx`                       |
| The dial                                     | `components/home/park-compass-dial.tsx`                  |
| All the arithmetic (`pnpm test:compass`)     | `lib/utils/compass.ts`                                   |
| Device heading                               | `lib/hooks/use-compass-heading.ts`                       |
| When it may be inserted                      | `lib/hooks/use-placed-out-of-sight.ts`                   |
| Shared row (`InParkRow`, `IN_PARK_ROW_LINK`) | `components/parks/in-park-row.tsx`, `live-wait-pill.tsx` |

Every layout-shift figure below comes from Playwright's `layout-shift` entries against
`pnpm build && pnpm start`: `pnpm measure:cls --late` does not reach this block, because it replays
Suspense streaming and the compass is geolocation-driven client state.

## Where it appears, and when

The homepage slot renders for `in_park` answers with at least one in-season headliner
(`splitInParkRides`, the filter the list uses) and for the `?sim=compass` demo. The module is loaded
the moment that is known, so nobody else downloads it.

**It is never inserted under a reader who has scrolled.** The compass is some 1,300 px on a phone
and lands a second or more after load, and no box is held open for it (that would be a screen of
nothing for every visitor at home). Pushing the page down under a scrolled reader scored a layout
shift of 1.0 at y = 1100; compensating with `scrollBy` kept the page visually still but still scored
1.0, because the Layout Instability API counts a node that moved in the document. So the slot waits
for the module, then inserts the compass only where `mayPlace` allows: while the slot lies below the
viewport with at most 10 % of the screen showing below it (`VISIBLE_SLICE`), or with the reader at
the very top of the page.

**The top of the page is an exception on purpose.** In English the hero ends at 680 px on a
390 × 844 phone, so the slot is already on screen and never "below the viewport"; with only the first
rule the compass never appeared on 390–430 px phones in five of six locales (measured 2026-09-28 at
Disneyland Anaheim). At the top the compass pushes the sliver of the next chapter's heading out of
view, which costs, reader at y = 0:

| Viewport   | Hero ends (de / en) | CLS de | CLS en |
| ---------- | ------------------- | ------ | ------ |
| 360 × 740  | 864 / 720 px        | 0.0059 | 0.0292 |
| 390 × 844  | 824 / 680 px        | 0.0283 | 0.1981 |
| 412 × 915  | 824 / 680 px        | 0.1187 | 0.2798 |
| 430 × 932  | 824 / 680 px        | 0.1355 | 0.3000 |
| 768 × 1024 | 1040 / 960 px       | 0.0039 | 0.0659 |
| 1280 × 800 | 1120 / 960 px       | 0.0021 | 0.0072 |

Up to 0.30 is paid once, only on page views from inside a park; the alternative was a compass that
never appeared on the phones most people carry. A scrolled reader is still never moved by it. (A
scrolled reader in a park _is_ moved by „Parks in deiner Nähe", which grows from 661 to 2,057 px when
its card switches to the in-park view; its skeleton is sized for the park list.)

Inside, the compass keeps its height as data arrives: the status line always has its second line
(calibration, „Standort wird genauer bestimmt …", the coarse-fix warning, or nothing), the hint under
the bar is always there, and the bar is a fixed 76 px with every line truncated.

## On the park page

A visitor standing in the park gets the same compass on that park's page, directly under the title
card, from `ParkInParkBlock`, in place of the old headliner list. Under it, on the title card's glass
(`GlassCard` `tile`), sit „Jetzt kürzer als später" (`NextBestRides`) and the five nearest other rides,
labelled `h3` under a visually hidden `h2` („In deiner Nähe"). If the compass chunk does not arrive,
the headliners stay in that panel. Nothing in the block stands on the bare photo; over a bright photo
it was unreadable.

The block reads the in-park answer through `useInParkBlock` and fetches the compass module only once
that answer places the visitor in this park; the lists wait for the module, so the page moves once.
Where the browser has scroll anchoring (`useScrollAnchoring`: Chromium, Firefox) the block goes in at
once, because anchoring absorbs an insertion above the reader. Where it has none (WebKit, so every
iPhone) it waits for `usePlacedOutOfSight`, the homepage's rule. The rows are the compass list's rows
(`InParkRow`, `IN_PARK_ROW_LINK`, `LiveWaitPill`), also drawn by the homepage's in-park view and the
nowcast banner's covered rides.

Measured inside Phantasialand against the previous headliner list (Chromium, 15 s, both builds side by
side): CLS at y = 0 went from 0.44 to 0.38 on 390 × 844 and from 0.50 to 0.42 on 412 × 915, because
„Jetzt kürzer als später" no longer arrives late above the lists; at y = 1100 neither block moves
anything on screen. WebKit was not measured.

Cost for a visitor in the park: the compass chunk (13.2 KB gzip), the dial's photo (3.5 KB) and
`/positions` (0.7 KB brotli); first visit at 360 × 780 went from 876.8 to 898.4 KB in the park and
865.6 to 867.0 KB outside it, on the [byte budget](../rules/a-day-in-the-park-has-a-byte-budget.md)'s
harness.

## Back from the pocket

A visitor keeps the park page open with the phone in a pocket. On the `visibilitychange` that brings
the tab back, the block must stand where it stood and then catch up, with no flash of „away" and no
second permission prompt:

- **The position.** The geolocation provider reads a fix no older than 30 s (`FRESH_MAX_AGE_MS`,
  `lib/contexts/geolocation-context.tsx`) on return and on the 60-second in-park tick; the 5-minute
  tick outside a park keeps 8 minutes. That is about 60 low-accuracy lookups an hour in a park with
  the tab in front, none while hidden.
- **The nearby answer.** A position-keyed answer does not refetch on focus (that request would carry
  the pre-pocket coordinates); the new fix's key fetches by itself, and an unmoved fix older than five
  minutes is refetched 6 s after the return (`RETURN_REFETCH_DELAY_MS`, `lib/hooks/use-nearby-parks.ts`).
  The GeoIP answer still refetches on focus.
- **Seeding a new key.** The localStorage entry still paints any key within 10 km, but seeds one
  (counts as fresh, no request) only when the move since it was asked cannot have crossed the 1 km
  in-park radius of a park it names (`readSeedEntry`, `answerSurvivesMove`, `lib/nearby/nearby-cache.ts`).
  Walking inside the park keeps the 5-minute cadence; walking in or out asks at once.
- **A failed request** keeps the last answer (`heldNearby` in `resolveInParkBlock`,
  `lib/utils/in-park-block.ts`), as the park's live poll keeps its last state; it used to take the
  block off the page until the next poll.
- **The compass** keeps an iOS motion grant for the page (`iosGrantedThisPage`). The „as of" line over
  the ride list says nothing about age during a poll's first attempt (`liveDataHint`), and the poll
  times out after 15 s (`LIVE_POLL_TIMEOUT_MS`).

The in-park answer is 2.6 KB brotli (38 rides at Phantasialand).

## The dial

A bezel („Lünette", 43–49.5 of a 100-unit drawing) with 5° ticks and the four letters upright in it;
a face cut from the park's own hero photo, blurred and dimmed, with a faint eight-point rose; the rides
at their true bearing, distance as radius (range ring at 37.5). Numerals and a heading figure were
dropped: nobody in a park acts on „120°", and they left the rides a 194 px circle on a 360 px phone.

**One blue.** Blue is the reader and the way to the ride in focus (arrow, cone, lit arc, dashed
route). North and the rose are the foreground colour; a blue north ray made two blue spikes for a
reader facing north.

**A marker says what the ride is doing.**

| Ride                    | Marker                                            |
| ----------------------- | ------------------------------------------------- |
| open with a posted wait | the minutes on an opaque disc in the wait colours |
| open, no wait posted    | a green ring with a dot                           |
| breakdown (`DOWN`)      | an orange ring with a warning sign                |
| refurbishment           | a ring with a wrench                              |
| closed                  | a 16 px hollow ring                               |

The wait discs use `CROWD_SOLID_CLASS` (`lib/utils/crowd-level-styles.ts`): the dark theme's
`--badge-crowd-*` tones, opaque, in both themes. The light `badge-crowd-*` fill measured 2.1–3.2 : 1
under white 12 px bold text over the face (4.5 needed); the solid tones measure 5.4–7.9 : 1. Every
marker's hit area is 44 px (`::after`); markers are kept 34 px apart centre to centre
(`MARKER_SPACING_PX`).

**Names.** `dialLabel` shortens („Chiapas", „Big Thunder…"), `placeLabels` places them like map pin
labels: eight positions around the marker, outward first, then further out and onto the bezel, never
over a marker, another label or the reader, with a hairline to the marker. The pinned ride chooses
first, then the nearest, so names do not jump as the reader turns.

## The bar and the list

**The bar follows the eyes.** With a live heading it names the ride in the view cone: `rideAhead`
takes the ride nearest the heading within 30° (the drawn cone is ±26°), holds it against a challenger
nearer by less than 4°, and switches only after 300 ms (`AHEAD_DWELL_MS`). Without the angle limit it
called a ride 116° off „Vor dir"; without the dwell, four headliners within 10° changed the bar ten
times in five seconds of sway. With nothing in the cone the bar names the nearest ride, and says so.

**A tap pins.** A tap on a marker pins that ride (a pin badge, „Fixiert" in the bar) whichever way the
phone turns; a second tap or the ✕ releases it, a tap on another marker pins that one. A pinned ride
that leaves the list is forgotten, and the component is keyed by park. The bar links to the ride.

**Held still while walking.** A row overtakes the one above only when nearer by more than max(15 m,
half the fix's accuracy) (`stableOrder`); the plain sort reordered a quarter of the fixes on a 160 m
walk, and a row is a link. The range ring grows at once and shrinks only when the farthest ride is
under three quarters of the step below (`stableRange`).

**The list** puts a ride's status on its second line as text („126 m · Geschlossen"), so the name
keeps the row; waits are the solid pills. A closed park gets one line under the title instead:
„Alle Top-Attraktionen haben gerade geschlossen. Öffnet am …".

## Without a compass, and when it is unsure

An arrow drawn north-up reads as „go this way". So without a live heading (desktop, iOS before the
tap, a denied prompt, a dead stream) there are no arrows: chips show the compass point („SW"), rows
say „Richtung Südwesten", and the dial stays north up and says so.

- **iOS**: „Kompass einschalten" with a line explaining Safari's motion prompt; after a denial,
  „Nochmal fragen". The grant is kept for the page, not the component, because the park page's block
  unmounts the compass whenever its nearby answer drops out for a moment.
- **A stream that stops** (no event for 3 s, or none within 1.5 s of listening again;
  `STREAM_LOST_MS`, `FIRST_READING_MS`) drops back to north up instead of a frozen arrow under a live
  dot.
- **Calibration**: when Safari's own accuracy is over 25° or unknown, the line asks the reader to move
  the phone in a figure eight (`compassUnreliable`).
- **Held upright**, beyond 65° of tilt (`STEEP_BETA`) the heading is taken from the back of the phone
  (the W3C compass-heading formula).

## True north

A phone's compass points at magnetic north (Safari's `webkitCompassHeading`, Chrome's absolute
`alpha`); bearings to rides are true north. `/positions` sends the park's declination from the World
Magnetic Model (the `geomagnetism` package, server side, in `app/api/parks/[...path]/route.ts`) at the
middle of its rides, and the compass adds it to every reading: 2.2° at Disneyland Paris, about 11° at
Disneyland Anaheim.

## Where the reader stands

A high-accuracy fix while the compass is on screen and the tab in front, adopted only when it moved
more than max(3 m, a third of its accuracy) or is much better than the last; every fix used to re-run
both layouts for a metre of GPS noise. Until a fix arrives the line says „Standort wird genauer
bestimmt …"; over 40 m (`COARSE_FIX_M`) it warns that the arrows may be off. Closer to a ride than
max(20 m, the fix's accuracy), its chip is a pin and its row says „Du bist da".

## What a frame costs

The heading is written into `--heading` only on the elements that turn (`data-heading`, collected
after every commit), each on its own compositing layer, and not at all for changes under 0.25°
(`HEADING_EPSILON_DEG`). On the panel root it restyled 387 elements and repainted the blurred photos
every frame, and never stopped, since magnetometer noise moves a still phone's heading on every
sample. Three seconds of rotation: style recalculation went from 1520 ms to 188 ms, frames from 134 to 181.

## Data

`/api/parks/<geo>/<park>/positions` returns `{ positions: { slug, latitude, longitude }[], declination }`,
day-cached and listed in `next.config.ts` with the handler's own value (see
[API budget](../architecture/api-budget.md#ride-positions-for-the-in-park-compass-88-kb--07-kb)). The
face and the panel's glass share one 256 px rendition of the park photo, 2.9 KB as AVIF.

## The hero pill

While the compass is on the homepage, the hero's badge row carries „Zum Kompass" in the news chip's
slot (30 px, a 44 px target); it scrolls the section under the sticky header and focuses it. The hero
learns of the compass from `useCompassPresent` (`lib/home/compass-presence.ts`), set by the slot when
the compass is actually in, not from its own nearby answer, because under `?sim=compass` the hero stays
on the device's real position.

## The demo

`?sim=compass` (Phantasialand) or `?sim=compass:<preset>` lays a real park's live answer around the
device, in production too. The European presets are closed at night; `compass:disneylandanaheim` and
`compass:magickingdom` are open then, with waits, breakdowns and refurbishments. The banner says what
it is and offers „Standort nutzen" and „Demo beenden". See
[flags and debug](../development/flags-and-debug.md#the-compass-demo-works-in-production-simcompass).

## Analytics

Five Umami events: `compass_viewed` and `compass_heading_on` once per page view,
`compass_ride_pinned`, `compass_ride_opened` (`from`: bar or list) and `compass_pill_clicked`. None
fires under `?sim=`; Umami records the page, so homepage and park page need no property. Pricing:
[analytics](../development/analytics.md#the-in-park-compass).

## Decided against

- **Removing the bezel**: it stayed, because looking like a compass was the point; it lost the
  numerals and the heading figure instead.
- **„Dein Ziel" instead of „Fixiert"**: „Fixiert" is the product owner's word; the ✕ and the hint
  under the bar do what the renaming was meant to.
- **Pinning from the list**: list rows stay links to the ride; the bar links too.
