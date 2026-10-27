# The planner on a phone

On a phone the panel is a bottom sheet with its own axis scale, 44 px touch targets and gestures
that do not depend on a drag landing. Open this when changing anything under `planner-phone:` or
`planner-landscape:`, the sheet's detents or the grip. Measurements below were taken in Chromium
with `hasTouch`; see [checks](checks.md#the-touch-pass) for why that matters.

## Which windows count as a phone

`planner-phone` (`PLANNER_PHONE_QUERY` in `lib/planner/use-grid-scale.ts`, the CSS variant in
`app/globals.css`) is `(width < 40rem), (height < 31.25rem) and (pointer: coarse)`: a narrow window,
or a flat one on a touch screen. Its complement is `planner-wide`, which negates
`(pointer: coarse)` (so `pointer: none` is wide) and must stay an exact complement. Never
`(max-width: 639px)`: Tailwind's breakpoints are rem and move with the reader's default font size.
A desktop window dragged flat (1440 × 480, fine pointer) stays wide. `planner-landscape`
(`PLANNER_LANDSCAPE_QUERY`) refines it with `(width >= 35.5rem)`; see
[a landscape phone is a row](#a-landscape-phone-is-a-row).

## The axis has a phone scale

`buildDayGrid(openHour, closeHour, pxPerMin)` gets its scale from **one** hook,
`usePlannerPxPerMin()`, so every axis in the panel reads the same day at the same scale.
`PX_PER_MIN_COARSE` is 1.8 against the desktop's 1.2 (`PX_PER_MIN`): a 20-minute queue goes from 24
to 36 px, the difference between a bar and something with a name on it. Everything derived reads
`grid.pxPerMin`, never the constant; `MIN_BLOCK_PX` (20) is stated at 1.2 and scaled by
`minBlockPxFor`, and `MIN_BLOCK_MIN` states the same floor in minutes for the lane packer.
`pnpm test:planner-grid` asserts at 1.8 too that a duration is a height and `minuteAt` inverts
`yFor`. The axis floor is 200 px (`max-sm:min-h-[200px]`): 111 minutes at 1.8, the same day the
old 140 px floor showed at 1.2.

## The grip and the gesture

A block's height is a queue and can be 20 px, so the drag grip grows its target with an `after:`
pseudo-element that reaches past the block (`planner-phone:after:h-11`). A clip applies to
hit-testing as much as to paint, so the block's ink — photo, fill, category bar — lives in one
`absolute inset-0 overflow-hidden rounded-[inherit]` layer and the controls are its siblings. The
grip's column and the resize edge **tile** rather than overlap (a full-width resize strip over the
grip made short free blocks resizable but not movable).

- **Auto-scroll edge**: `Math.min(EDGE_PX, box.height / 4)` (`EDGE_PX` 48 in
  `planner-day-grid.tsx`), so half the scroller stays neutral at every height; at a 140 px scroller
  the old fixed 48 px edges left 44 px where a finger could hold still.
- **Pointer capture**: `capturePointer` (`lib/planner/pointer-capture.ts`) wraps
  `setPointerCapture`, which throws `NotFoundError` for an inactive pointer, and returns the document
  when the claim fails — capture is what retargets `pointermove`/`pointerup`, so without a fallback
  the gesture never ends and `--pl-drag-dy` stays on the block.

## Moving a block without a drag

The grip is the only pointer path on a phone: the block's body gates itself on `(pointer: fine)`,
because `touch-none` on a box that covers most of the grid would stop the plan scrolling where it is
read. So the action row a selected block docks into (`PlannerGridActions`) carries **±15 minutes**
(`NUDGE_MIN` = `SNAP_MIN_FINE`) for every entry except a show. It is the same `moveEntry`, clamped
with `clampStart` against the same `rideFloor().hardMin` the drag obeys.

**A finger drags in fives, like a mouse**: `DRAG_SNAP_MIN` (5) for both pointers. The old coarse
step (`SNAP_MIN_COARSE`, 30) meant a phone could only land on :00 or :30 and a pull under 27 px
moved nothing; it remains only the arrow-key step on a coarse pointer. Measured with a touch pointer:
90 px moves a block 50 minutes, which `check:planner` asserts.

## Every target is 44 px

`check:planner` sweeps the open sheet (`jedes Ziel im Sheet ist 44 px hoch`) — every `button`,
`label`, `a[href]` and `select` — because a list of controls only knows the ones somebody thought
of (a first pass raised seven; a real coarse pointer found seventeen more). Two counting rules:

- **A checkbox inside a `<label>` is not a target; the label is.**
- **A bounding box is not a target either**: controls that carry their 44 px in an `after:` overhang
  are measured by walking outward with `elementFromPoint`.

Where a control grows, it grows honestly and the row's padding comes off. An overhang is only safe
over a row that takes no press: an overhang inside the grid's scroller travels with the scroll and
steals the taps of the blocks passing under it (blocks select on a plain `onClick`). A separate
check guards the header's rightmost control against being covered, asked as
`click({ trial: true })` so Playwright names the intercepting element.

## Every row of controls is drawn at 32 px

44 px to the eye made the sheet's rows too tall on a 664 px window, so every row of controls is
**drawn** at 32 px and keeps a 44 px target through an `::after` overhang, defined once in
`lib/planner/touch-target.ts`: `PHONE_TARGET_32` reaches 6 px above and below, `PHONE_TARGET_32_UP`
puts all 12 px above (two rows of overhangs may not stack closer than 12 px). Where the overhangs go
is the design:

- The header row reaches 6 px up into the grabber's 16 px strip and 6 px down into `pb-1.5`.
- The headliner pills are drawn 26 px (the 16 px thumbnail 4 px from the border all round) and reach
  12 px up into the heading and 6 px down. A scroller clips hit-testing, so the pill row carries
  14 px of padding above and 8 below and hands it back with negative margins; the absolutely placed
  overhang needs `-top-[13px]` and `-bottom-[7px]`. The band's heading keeps its own line.
- The optimise buttons and the shows switch reach only **up**, 12 px; the summary line under them
  carries nothing to press and is as tall as its text. The shows switch is 36 px wide and reaches
  4 px to each side. The headliner button says `optimize.headlinersShort` („Headliner planen") and
  is `w-min`, so both labels take two lines and the call to action grows into the rest; the row does
  not wrap (a wrapping flex row breaks before it shrinks). All six locales fit at 360 px with the
  row at 45 px. On a day with nothing to optimise the row (`OptimizeRow`) is drawn for the shows
  switch alone, and only on a day that has shows.

Measured afterwards: header 61 → 55 px, headliner band 96 → 70, optimise row 53 → 45, summary
45 → 29; the axis is 347 px at 390 × 664 and 323 px at 360 × 640. In the context band „Ferien
nebenan" is a palm icon on a phone (words kept as `sr-only` and `title`), which keeps the chip row
on one line at 360 px.

## A landscape phone is a row

At 844 × 390 the stacked sheet left the axis **16 px** (343 px of chrome in a 359 px sheet); two
hours of day is 216 px at 1.8, so no order of those rows fits above the axis. `planner-landscape`
puts the chrome **beside** it (PAR-168, two columns, chosen over dropping rows). It refines
`planner-phone` and has no complement: a `planner-landscape:` class only says something the phone
branch left open.

- The sheet body is carried by two wrappers that are `display: contents` at every other size, so
  portrait and desktop are the same boxes in the same order — verified row by row against `main`.
- The left column is `20rem` (`16rem` below 40rem, so a 568 × 320 SE keeps 312 px of axis width)
  and scrolls; the context band moves into it via `withBand` on `PlannerDayColumn` (the third gate
  after `withHead` and `withFoot`). `PLANNER_LANDSCAPE_QUERY` answers that one question a class
  cannot.
- The ride search, the sheet's only `shrink` child, came out 0 px tall in the scrolling column, so
  it is `planner-landscape:shrink-0`; its `32svh` cap stays, deliberately a scroller inside a
  scroller.
- The left column is `order-first`, not first in the document: visual order runs left to right
  while tab and screen reader run right to left (WCAG 2.4.3), because reordering the children per
  size would remount them on every rotation (search query, scroll position and selection lost). The
  reading order stays the day, then what can be done to it.
- The row is drawn only with a day chosen; otherwise the sheet stays a stack.

| Window            | Axis visible before                           | after                       |
| ----------------- | --------------------------------------------- | --------------------------- |
| 844 × 390, coarse | **16 px**, covered by `data-planner-optimize` | **269 px**, nothing over it |
| 568 × 320, coarse | 3 px on screen                                | 252 px                      |
| 390 × 844, coarse | unchanged                                     | unchanged                   |

`check:planner` asserts two hours visible (`AXIS_MIN_LANDSCAPE_PX`, 216), nothing over the axis,
the chrome beside rather than above it (so deleting rows cannot pass), and `axisVisible === axis`
(`elementFromPoint` answers `null` outside the window, so an axis pushed off the sheet reported
"nothing over me"). 568 × 320 runs as its own pass.

## The bottom sheet

**iOS zooms in on a text field under 16 px and never zooms back out**, and the sheet is fixed to
the layout viewport, so one tap into the ride search left the sheet's right edge past the screen and
its grabber above it — invisible in Chromium. Under `(pointer: coarse)` every text field inside
`[data-planner-sheet]` renders at 16 px (`app/globals.css`), keyed on the pointer because an iPad
zooms too.

**Measuring the sheet's width or bottom edge: use a reference element, not the viewport.** With a
modal's scroll lock installed, `document.documentElement.clientWidth` and what a `fixed inset-x-0`
element resolves to legitimately differ by a scrollbar's width, so an assertion against the
viewport fails for a reason unrelated to the sheet. `check:planner` measures the sheet against a
reference element positioned the same way. (On the site the lock moves to `<html>` as
`data-scroll-locked`, which reserves the gutter on a fine pointer: `ScrollLockGutter`,
`app/globals.css`.)

### Detents and the grabber

The grabber follows the finger and snaps to one of three detents on release: `large` (where it
opens, under the site header), `full` and `medium` (half the screen, to see the page the rides come
from). Nearest wins; a flick over `SHEET_FLICK_PX_PER_MS` (0.5) moves one detent on from where the
drag started; a flick down from `medium` or a release `SHEET_DISMISS_PX` (90) below it closes; a tap
steps up one detent and from the top back to `large`. A landscape phone has no `medium`. The drag
writes `bottom` and `height` on the element, never a `transform` (which would make the glass a
backdrop root). At rest the detents are `--planner-sheet-large` / `--planner-sheet-medium` in
`app/globals.css`; the drag measures those very values with a probe (`sheetDetentHeights()`) rather
than recomputing them. The sheet has a definite `h-*` beside its `max-h-*`, because `medium` is
measured from the top of a `large` box. Snapping, opening and closing run on the iOS curve,
`cubic-bezier(0.32, 0.72, 0, 1)` over 400 ms; the desktop panel keeps 300 ms.

**The grabber is the header.** The pill sits in a 16 px strip at the top of the sheet header and the
grabber is a button laid **behind** the header (`absolute inset-0`, the row painting over it), so a
press lands on it wherever no control is. The × (`SheetClose`, `data-planner-sheet-close`) is the
last control of the park/date row, with the push bell beside it when something is planned; it is
drawn 32 px wide and its target reaches through the padding to the edge. The planner passes
`hideClose={isPhone}` because `SheetContent`'s own corner × would sit on the day picker. (From
PAR-188 to PAR-483 the phone sheet had no ×, and a tap on the handle pulled the sheet to full height
where the outside shield is 0 px — no visible way out; `check:planner` now asserts exactly one
close button at 390 × 844 and 844 × 390 that takes a press while the sheet is pulled up, and the
corner × at 1400 px.) On a window under 50rem tall — every iPhone
in Safari — `large` opens over the site header, 12 px under the top edge (`SHEET_SHORT_QUERY`),
`full` is not offered and a tap toggles between half and large.

### The sheet is as tall as what is on screen

Detents written in `svh` are layout-viewport heights; a pinch, the keyboard, an in-app browser or a
toolbar leaves less on screen, and iOS takes the difference off the top — grabber and × first
(measured at page scale 1.3: 195 px of the sheet outside the view). `useSheetViewport()`
(`lib/planner/use-sheet-viewport.ts`) reads `window.visualViewport` while the phone sheet is open and
keeps `--planner-viewport` (the height on screen) and `--planner-viewport-lift` (how far the bottom
of what is on screen sits above the layout viewport's bottom) on `<html>`, where the detents are
declared, falling back to `100svh` and `0px`. The lift is measured against a fixed `top: 0; bottom:
0` probe, not `innerHeight`, whose meaning under zoom differs across engines; the drag reads the
same numbers. At page scale 1 nothing changed. `check:planner` sets the scale with
`Emulation.setPageScaleFactor` and asserts the sheet and its × lie inside the visual viewport; a
visual viewport **panned** down (iOS, focused field) cannot be produced headless and wants a look on
a real iPhone.

### The action bar, search mode and undo

- **The selected block's action bar is two lines** (name and deselect × first, controls second,
  about 105 px at 390 px instead of four wrapped lines over 200 px): the seven icon buttons are one
  dropdown, delete is a bin on every size (the block's corner ✕ stays as a shortcut), and every icon
  button is `size-8` with `gap-1`, 44 px on a coarse pointer. A selected block is scrolled clear of
  the bar (the scroller gets the bar's height as bottom padding), following the **click**, not the
  selection — a drag selects on `pointerdown`, and moving the day under a held grip would move the
  drop target.
- **Search mode** (`phoneSearch` in `planner-flyout.tsx`, a portrait phone with any pointer): at rest
  the ride search is one 45 px row, the 32 px field and „Eigener Block"; a tap into the field hides
  the axis and the foot (kept mounted) and the search fills the sheet under the header, its list
  scrolling under a fixed field. „Fertig" empties the field and gives the day back. Leaving the field
  does not end the mode, because a tap on a row blurs the field before the click lands. The block is
  `shrink-0`. A landscape phone keeps the list in its own column; dragging a row out of the list is
  what a portrait window gives up (a row's click files the ride at the next free slot).
- **Undo sits in the optimise row**, an icon left of the shows switch while there is something to
  undo; the result sentence is read out but not drawn, except an alert, which carries „Anpassen".
- **The rest of the room went to the axis**: the missing-headliner band is one row of pills
  scrolled sideways, and the ride search drops its tap hint once the day has a ride in it.
