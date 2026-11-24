# The park page's attraction filter panel

The bar above the attractions grid on a park page: the search, a „Filter" button whose dialog holds
the rider height, the "today" and "traits" pills, the off-season toggle and the sort, and the
wait-time alerts at its end. Open this page before changing any of these controls or how they
compose.

| Piece                                         | File                                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| The bar and its dialog                        | `components/parks/attraction-filter-panel.tsx`        |
| The height slider                             | `components/parks/rider-height-filter.tsx`            |
| Height rules, pure (`pnpm test:rider-height`) | `lib/utils/rider-height.ts`                           |
| All filter state and composition              | `lib/hooks/use-attraction-filter.ts`                  |
| A pill                                        | `components/parks/filter-toggle.tsx` (`FilterToggle`) |
| Where it is mounted, memoised                 | `components/parks/tabs-with-hash.tsx`                 |

Each pill press sends `attraction_filter_used` with the filter's name, and the „Filter" button sends
`attraction_filters_opened` when it opens the dialog, both with the park as entity and neither under
`?sim=` ([analytics](../development/analytics.md#filters-and-the-rain-plan)).

## Layout

One bar on every width. It takes `TILE_GLASS`, the material of the entry-tile row above it, and is
`p-1.5` around a 36 px row: 50 px with its border, the height of the land headings below it. From the
left:

1. **The search field**, 260 px from `sm` up and the rest of the row below it.
2. **„Filter"**, an outline button with the number of set filters (search excluded) as a badge. It
   keeps `h-9` on a phone and its 44 px reach through `PHONE_HIT_AREA`.
3. **One chip per set filter**: the lit `FilterToggle` of that filter with an ×, and pressing it turns
   the filter off. The wet chip goes straight to off through `onClearWet`; cycling would turn „Nur
   mit Nässe" into „Ohne Nässe". From `sm` up the chips sit in the row and wrap inside their own box;
   below `sm` they take a line of their own under the row (`order-last basis-full`).
4. **At the right end**, the list's „Stand" (`LiveDataFreshness`, `placement="bar"`, from `sm` up)
   and the `actions` slot, which `TabsWithHash` fills with the wait-time alerts
   (`RideAlertsEntryButton`, `variant="bar"`, the bell alone below `sm`).

The controls are not on the page because almost nobody uses them: 88 `attraction_filter_used` on
8,749 park page views from 26 October to 24 November 2026, one in a hundred, and 42 typed ride
searches. Before the bar, the controls stood on the page as a 330 px panel on a desk, between the
entry tiles and the first ride.

- **CSS decides, not JavaScript.** The server cannot know the width and both branches of `TabsWithHash`
  render the same markup, so the phone row and the desk row are one tree with `max-sm:`/`sm:`
  classes, never a `matchMedia` branch.
- A park with no rider limits, no pills and a single ride gets no button; the row is the search alone.

### The dialog

A centred `Dialog` on every width, opening with `DialogHero` (the `SlidersHorizontal` glyph, the title
and the hint), the band the calendar's day dialog and the planner wizard open with. Under it a section
per kind of control, each with a captioned glyph and divided by the `--border` hairline: rider height
(`RiderHeightFilter` with `icon`), today, traits, order. Only the body scrolls (`max-h-[92svh]`), so
the title and the foot hold still on a short phone.

The filters apply as they are pressed, so the foot has no „apply": its button only closes, and it
carries the number of rides the grid lists (`shownAttractionCount`, „33 Attraktionen anzeigen"), so a
press shows what it did without closing the dialog. Beside it, „Alle zurücksetzen" runs
`resetFilters` from `useAttractionFilter`: every filter back to how the page opened, the search
excepted, since the query stands in the field in front of the visitor. Below `sm` it is the glyph
alone, because both labels side by side are wider than the dialog.

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
closed for good (`ClosedRideMatches`), which the grid never lists. While a search runs, the bar's
chips for the pills go `invisible` (not unmounted, so nothing moves under the field), and the dialog
dims the pills and the sort, because the search reaches past the pills and ranks by match.

## Its height is the ride list's top edge

The row has a fixed height (`h-9` controls from the input scale in `components/ui/button.tsx`), and
nothing appears or disappears as a visitor types. Only the chips change the box, and on first paint
both sides of hydration agree on them: a page opened with `?height=` starts with the height chip, any
other with none. That is why the pre-mount branch of `TabsWithHash` renders this same component
instead of a spacer
([a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md)):
a placeholder would have to restate it, and the closed dialog renders nothing in either branch. Its
controls are live between paint and mount, and what they set survives into the mounted tree because
the state lives in `useAttractionFilter`, above that branch.
