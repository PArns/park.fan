# Drag and drop into the planner

How a ride gets from a park page, the headliner band or the panel's ride list onto the day axis,
and what an empty day says about it. Code: `lib/planner/ride-drag.ts`,
`lib/planner/use-ride-drag-source.ts`, the drop handlers in `planner-day-grid.tsx` and
`planner-day-column.tsx`. Moving a block that is already on the axis by pointer is in
[phone → moving a block without a drag](phone.md#moving-a-block-without-a-drag).

## The drag carries its own payload

A ride card's root is an `<a>`, so every browser makes it draggable — and that free version failed
at the commonest grabs: grabbing the **photo** drags the image URL (`/media/…/taron.jpg`, no
`parks` segment), and a ride URL names a slug but not the name. So a drag carries the park, the
slug and the name under `PLANNER_RIDE_MIME` (`application/x-parkfan-ride`). `text/uri-list` stays on
the drag and the drop still falls back to it; this adds a channel, it does not replace one.

The source is **one capture-phase `dragstart` listener on the document** (`useRideDragSource`),
armed only while the panel is open. `AttractionCard` is a Server Component rendered in eight places
and `onDragStart` is a client prop, so a per-card handler would need a client boundary around every
ride grid — or a wrapper element, which breaks the `row-span-3` + `subgrid` chain (the trap in
[blog spotlight cards](../../rules/blog-spotlight-cards.md)).

## One chip for every drag

`setRideDragImage` draws one chip — the ride's photo at 32 px and its name — for all three sources
(panel list row, park-page card, headliner pill), which used to snapshot three different shapes.
The chip is appended **off-screen, not hidden** (`display: none` produces no snapshot) and removed
two frames later (same tick races WebKit).

**The thumbnail is painted, never loaded.** A drag image is snapshotted synchronously in
`dragstart`; anything still loading is missing for good. Cloning the `<img>` was a new request, and
its `src` fallback on a `next/image` is the last srcset candidate (`w=3840`, 147 KB). So the source's
decoded pixels are copied into a `<canvas>` with `drawImage` — only when `complete &&
naturalWidth > 0` — with the cover geometry and the curator's focal point computed by
`coverOffset`, at the device pixel ratio. A source with no picture of its own (the headliner pill
before its thumbnail decoded, a card below `sm` with no photo) asks for one on the first drag
(`warmRideDragThumb`, `w=96&q=75`, the same rendition `PlannerRideThumb` uses at `size={8}`); until
then the chip is the name alone, never an empty grey square.

`check:planner` reads the chip off `setDragImage`, walks the canvas's **alpha channel** (a count of
appended elements cannot tell a drawn thumbnail from an empty one) and hovers each control before
dispatching, since a synthetic `dragstart` with no pointer near it measures a chip no mouse
produces.

## A refused drop is still prevented

`onDragOver` accepts a bare `text/uri-list` optimistically (that is the channel a park-page card
drags on), so the element has claimed the drop before the payload is seen. `onDrop` therefore calls
`preventDefault()` **first**, before any refusal, in both the grid's and the flat list's handlers:
otherwise a dropped non-ride link fell through to the browser, which follows it and navigates away
with the panel.

## What an empty day says

A sentence may only point at something that is on screen: earlier strings promised a ride search
„unten" at the widths where none was mounted, and named an HTML5 drag on the one pointer that has
none. Now the no-axis branch shows a title, the wizard button and three steps, all true; the grid's
empty overlay carries one sentence per arrangement, chosen by CSS (`planner-wide:` /
`planner-phone`, not `useMediaQuery`, whose `false` server snapshot would ship the phone's line in
every desktop's first HTML): `empty.bodyGrid` (search below) on a phone, `coach.drag` (drag from the
park page) on a desktop — the key the drag coach uses, so one gesture has one wording; and the coach
(`PlannerDragCoach`, dismissal stored in `lib/planner/drag-coach.ts`) stands down while the day is
empty so the two never show together.

The empty overlay is a card over the axis. On a desktop it plays the gesture (`PlannerDragDemo`,
keyframes `planner-drag-*` in `app/globals.css`): a hand lifts a ride from a little park-page list,
carries it across the planner's edge and sets it on a slot, where it becomes a block. Under reduced
motion it holds the pose that carries the card across the edge. The card is measured, because it
wraps differently per locale and width.
