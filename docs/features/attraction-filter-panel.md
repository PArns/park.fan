# The park page's attraction filter panel

The band above the attractions grid on a park page: search, rider height, the "today" and "traits"
pills, the off-season toggle and the sort. Open this page before changing any of these controls or
how they compose.

| Piece                                         | File                                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| The panel (box, phone row, bottom sheet)      | `components/parks/attraction-filter-panel.tsx`        |
| The height slider                             | `components/parks/rider-height-filter.tsx`            |
| Height rules, pure (`pnpm test:rider-height`) | `lib/utils/rider-height.ts`                           |
| All filter state and composition              | `lib/hooks/use-attraction-filter.ts`                  |
| A pill                                        | `components/parks/filter-toggle.tsx` (`FilterToggle`) |
| Where it is mounted, memoised                 | `components/parks/tabs-with-hash.tsx`                 |

Each pill press sends `attraction_filter_used` with the filter's name (`trackAttractionFilterUsed`),
not under `?sim=`.

## Layout

The panel takes `TILE_GLASS`, the material of the entry-tile row above it: another band of the same
stack over the same photograph. It opens with `ChapterHeading` **inside** the box (as `h3`, no number),
so the heading's closing rule is the line the controls hang under.

Two bands, so the panel does not depend on how long a translated label is:

1. **The controls that carry a value**: search and, when the park publishes rider limits, the height
   slider, divided by a hairline (`CellDivider`, `HAIRLINE_FILL`) where they sit side by side. They
   sit left in their own widths (`@min-[768px]/page:w-[220px]` …), not stretched: a 1200 px search box
   is not a better search box.
2. **The pills**, a wrapping row of two captioned groups: **today** (open now, the off-season toggle)
   and **traits** (wet, fast pass, single rider, covered), then the sort (by land or by shortest wait).

Every control has a caption row (`h-6`) over it, so all controls start and end on one line and say what
they are. Widths follow the page's container (`@min-[768px]/page`, `@min-[1024px]/page`), not the
viewport. Dividers use `HAIRLINE_FILL`, not the `--border` token: in the dark theme that token is white
at 10 %, so an opacity modifier on it composited to nothing and the hairlines were invisible.

### On a phone it is one row and a sheet

Below `sm` the box holds one row: the search field and a **„Filter"** button carrying the number of set
filters (search excluded). Heading, slider, pills and sort are `max-sm:hidden` in the box and render
again in a bottom sheet (`components/ui/sheet.tsx`, `side="bottom"`) the button opens. The box is
`max-sm:p-1.5` around a 36 px row, 50 px with its border, the height of the land headings below it; the
button keeps `h-9` and its 44 px reach through `PHONE_HIT_AREA`. Open on a 390 × 664 phone, the full
panel was 515 px and pushed the first ride 3.9 screens down.

- **CSS decides, not JavaScript.** The server cannot know the width and both branches of `TabsWithHash`
  render the same markup, so phone row and full panel are one tree with `max-sm:`/`sm:` classes, never a
  `matchMedia` branch.
- **One set of controls.** Slider, pills and sort are render functions inside the panel
  (`renderHeight`, `renderPills`, `renderSort`), called once for the box and once for the sheet over the
  state in `useAttractionFilter`.
- **Set filters are chips under the row**, phone only: each is the lit `FilterToggle` of its filter
  with an ×, and pressing it turns that filter off. The wet chip goes straight to off through
  `onClearWet`; cycling would turn „Nur mit Nässe" into „Ohne Nässe".
- A park with no rider limits, no pills and a single ride gets no button; the row is the search alone.

## The pills

A pill whose filter would find nothing in this park is not rendered; most parks have none of these
fields on file.

- **Open now** keeps strictly `OPERATING` rides; `UNKNOWN` is not open.
- **Wet** has three states (`WetMode`: `only`, `hide`, off), because both errands are real. `only`
  demands `mayGetWet === true`; `hide` drops only `=== true`, so the unchecked majority stays.
- **Fast pass** asks exactly what `FastPassBadge` asks, and is labelled with the park's own product
  name when it sells exactly one („VirtualLine"). There is no "without" state: absent means "nobody
  checked or none sold", and the payload does not separate the two.
- **Single rider** keeps rides with a single-rider line.
- **Covered** keeps indoor rides and rides with a roofed queue, and is offered only when the park has
  curated enough of its rides (`coveredOfferReady`, the nowcast banner's gate): three marked rides among
  ninety unchecked would read, in the rain, as the whole list.
- **Off season** shows the rides out of season ([seasonal attractions](../api/seasonal-attractions.md)).
- **Sort** by land (default) or by shortest wait, which flattens the grid into one list.

## The height filter

Rendered only when the park publishes a minimum height on at least one ride: `riderHeightStops()`
returns `null` otherwise (or when fewer than two stops result), and a control whose every position
returns the same rides is worse than none. The park page can open with a height set from `?height=`
(`initialRiderHeightFromParam`), which a park's "with kids" page links with.

**A slider, not three chips.** A parent knows their child as 118 cm, not as "one of 100, 120 or 140",
and chips would make them round, half the time in the wrong direction. The slider moves in **stops**,
one per height at which the park's answer changes: each enforced minimum, a lead-in stop 10 cm below
the lowest (so it can say "too small for everything"), and the first height too tall for each kiddie
ride (`maximumHeight` + 1, rounded up to the 5 cm grid). A maximum at or above the highest minimum adds
no stop: those are mostly a coaster's safety ceiling, and honouring them would spend a third of the
track on whether somebody is too tall for a roller coaster. A height between stops rounds down, the
direction that under-promises.

**A missing limit is not a ban.** `canRideAtHeight` passes a ride with no height on file, the same
`!== false` shape the season check uses: nobody wrote a limit down, and hiding those rides would
quietly shorten the park.

**Off is a state.** `riderHeight` is `number | null`, and the bottom stop is a legitimate answer (a
toddler who clears nothing). While `null`, the thumb rests at the left end with a hollow head and **no
fill**, and the readout says so; a thumb parked part-way along with a filled bar read as a value nobody
chose. A click at the resting position fires no `change`, so `onPointerDown` switches the filter on.

**The thumb is drawn, the input is invisible.** A native range thumb styles through three vendor
pseudo-elements and its fill not at all, so track, fill, ticks and thumb are elements under a
transparent `<input type="range">` (the same construction as the admin's one-field TOTP boxes); the
input keeps pointer, keyboard and screen-reader behaviour, counts in stop indexes and carries the
height in `aria-valuetext`. A native thumb's centre travels from half a thumb-width in to half a
thumb-width short of the end, so every drawn position goes through
`calc(var(--thumb) / 2 + (100% - var(--thumb)) * f)`. Heights render through `RiderHeight` (both units,
CSS picks one).

## How the filters compose

In declaration order (`useAttractionFilter`): **height, then the pills, then season, then search**,
each reading the previous output, so the headliner row, the land grid and the panel's counts agree.
Every control's own state is urgent and the grid reads `useDeferredValue` copies
([an interaction may not rebuild the grid in its own commit](../rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)).

**The search reaches past the pills and the season, not past the height.** Typing a ride's name asks
for that ride, shut or dry; filtering the hits once made every exact search for one of Toverland's
off-season rides answer "no attractions found". A rider height is a statement about the person
queuing: a 105 cm child does not grow because a parent typed "Taron". So the height holds, and the
empty state names it and offers to clear it. The search also looks through the park's rides that
closed for good (`ClosedRideMatches`), which the grid never lists. While a search runs, the pills go
`invisible` (not unmounted, so nothing moves under the field) and the sort dims, because the search
ranks by match.

## Its height is the ride list's top edge

Every row inside has a fixed height (`h-6` captions, `h-9` controls from the input scale in
`components/ui/button.tsx`, `h-5`/`h-4` for the track and its scale), and nothing appears or disappears
as a visitor types or drags. Only two things change the box, and both are the same on either side of
hydration: whether the park publishes rider limits and which pills it has, and the container width.
That is why the pre-mount branch of `TabsWithHash` renders this same component instead of a spacer
([a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md)):
a placeholder would have to restate both, and be wrong about one. Its controls are live between paint
and mount, and what they set survives into the mounted tree because the state lives in
`useAttractionFilter`, above that branch.
