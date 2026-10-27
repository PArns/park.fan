# The planner panel

The panel is a right-hand sheet beside the page on a desktop and a bottom sheet on a phone
(`components/planner/planner-flyout.tsx`). This page covers how it is opened, what it does to the
page beside it and the desktop panel's chrome; the phone sheet is in [phone](phone.md), the
two-column layout in [two-day view](two-day-view.md).

## Ways in

The **edge tab** (`PlannerEdgeTab`) is drawn on every page whether or not anything is planned,
because the feature has to be findable from a park page. On `planner-phone` it is not drawn at all
(even its 24 × 102 px phone tier lay over card text on a 390 px screen); the way in there is
`PlannerHeaderButton`, a calendar icon beside the burger with the same count badge (geometry in
[header bar → on a phone the preferences live in the menu](../../design/header.md#on-a-phone-the-preferences-live-in-the-menu)).
Both ask `planner-phone`, not a width, so exactly one of them exists at any size, including
844 × 390 on a coarse pointer. The tab steps aside while a header menu band reaches under it
(`useMenuBandOverEdgeTab`). Every way in reports `planner_opened` with a source from the closed
union in `lib/planner/ui-store.ts`. `check:planner` finds whichever launcher is displayed through
`[data-planner-launcher]:visible`.

### A day that is over is asked about

The panel opens on the active day, which after a trip is the trip. So the tab and the header button
ask first: `pastActiveDay()` (`lib/planner/park-time.ts`) answers whether the active day has
entries and lies before today in the park's zone; if so the launcher sets `askingPastDay` instead
of opening, and the panel draws a `ConfirmDialog` (`data-confirm-dialog="planner-past-day"`):
„Dein geplanter Tag ist vorbei", the park and date, „Neuen Tag planen" (the panel with the wizard,
on the page's park where there is one) and „Vergangenen Tag ansehen". Escape and the overlay open
nothing, which is why the second answer is `ConfirmDialog`'s `onCancel` and not
`onOpenChange(false)`.

Only those two launchers ask; every other way in names its day, and an empty day is not a planned
day. The launcher decides for both (`openOrAsk`; the header button's request is told apart by its
source in `answerRequest`). The dialog lives in the panel because the launcher is a lazy message
boundary and may not read the `planner` namespace.

## The panel is a column, not a dialog

On a desktop the panel sits **beside** the page — the layout is inset by its width — so reading the
park on the left while the plan stands on the right is the point. `onInteractOutside` is therefore
prevented on the desktop (a click into the page must not fold it away) and left alone on a phone,
where the sheet lies over everything and the tap outside is a way back. The desktop keeps the
corner ×; the phone sheet draws its own (`hideClose={isPhone}`).

## The panel changes the page's width

Opening sets `--planner-inset` on the document element; the layout wrapper
(`app/[locale]/layout.tsx`) pads by it and is the `@container/page`. Padding an ancestor is not
making the window smaller, so everything that asked the window had to learn it:

- **The header** asks its own width (`@container` on `<header>`), see
  [the header rule](../../rules/the-header-is-48-px.md).
- **The park hero** is `position: fixed`, which resolves against the viewport, so its right edge
  follows the variable itself (`planner-wide:right-[var(--planner-inset,0px)]` in
  `components/parks/park-background.tsx`).
- **The panel's width** is capped so the page keeps `PAGE_MIN_PX` (360, the header's least
  compressible row), applied in `getSnapshot` of `lib/planner/panel-width.ts` so the panel, the
  inset and the tab cannot disagree. At 768 px a stored 448 becomes 408.
- **Tailwind's `container`** sizes itself off the window. `app/globals.css` redefines it with
  `@utility container`: the five media tiers first (for a document with no `page` container, such
  as `/admin`, where a container query is false), then the same five as `@container page`
  queries, which win wherever the page is narrower. In `rem`, so they keep agreeing with `sm:`/`lg:`
  for a reader with a larger default font. Measured on a park page:

  | Window | Panel | Page column | `.container` before | after |
  | ------ | ----- | ----------- | ------------------- | ----- |
  | 1920   | 900   | 1020        | 1020                | 768   |
  | 1720   | 448   | 1272        | 1272                | 1024  |
  | 1440   | 448   | 992         | 992                 | 768   |

### One clock for the three moves

Opening moves the sheet, the page's inset and the edge tab together. They ran at 500 / 300 /
500-or-300 ms, and for a quarter of a second a strip of bare page (up to 170 px at 1440) showed
between the page and the arriving panel. All three are **300 ms both ways** now
(`components/ui/sheet.tsx`, `--planner-inset-ms`); `ease-in-out` sets `--tw-ease`, which
`tw-animate-css` reads, so one class times the animation and the transition. The panel is a pure
`translateX` with no opacity, so the page never reads through it while it moves. The second
column's own 200 ms fade-in sits on a **descendant**: a transform on `SheetContent` or any ancestor
makes it a backdrop root and flattens the glass.

## The photo behind the panel

The panel carries the park's photo (from `/plan/day`). `PlannerPanelPhoto` is an
`absolute inset-0` layer, and with `z-index: auto` it painted above the inline content of every
in-flow sibling — the header, the context band and the free-block row read "far too transparent"
because they were under a 12 % photo and its wash. It sits at `-z-10` inside `SheetContent`'s
`isolate` (a negative layer runs until it finds a stacking context; `backdrop-filter` makes one
where supported, `isolate` everywhere). Ink against ground at Phantasialand before → after:

|                | 1400 px panel | 390 px phone   |
| -------------- | ------------- | -------------- |
| Header row     | 1.49 → 8.47:1 | 1.63 → 10.48:1 |
| Context band   | 1.45 → 6.02:1 | 1.48 → 5.79:1  |
| Headliner band | 1.29 → 8.44:1 | 4.49 → 11.38:1 |

Giving every row `TILE_GLASS` instead would have stacked up to ten 40 px backdrop filters in one
sheet, re-rasterising during a drag, to hide a one-declaration stacking bug. Trap found on the way:
two `bg-*` colour classes on one element (`bg-crowd-high/10 bg-background/70`) means one of them
never paints.

With nothing planned there is no `/plan/day` query, so the photo comes from
`PlannerPageParkBeacon`, resolved by the **route** (`getParkBackgroundImage` reads `@/lib/media`,
which a layout Client Component may not import). The panel branches on the **active park** rather
than falling back field by field, so a day still loading shows nothing rather than another park's
façade.

## The desktop foot

Each day column's foot is one row like the phone's: `PlannerRideSearch inline` beside „Eigener
Block", its list opening under the field only while a query is typed (it reads its own column's
entries by park and date, so a second column searches its own day; the panel-level phone copy is
gated on `isPhone`). Under it the optimise row (see [optimizer](optimizer.md#what-the-foot-shows)):
„Tag optimieren" takes the rest of the row, the undo is a tinted icon
(`data-planner-optimize-undo`), and the plain result sentence is read out but not drawn. The foot's
buttons are `h-9` on a desktop and 32 px on a phone. The push bell sits in the panel header between
„+" and the column switch. The drag coach is the panel's last row (`my-2`). Opacity changes fade,
never cut: [the rule](../../rules/a-fade-is-animated-never-a-cut.md).
