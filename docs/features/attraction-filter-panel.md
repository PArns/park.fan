# The park page's attraction filter panel

`components/parks/attraction-filter-panel.tsx` is the band above the attractions grid on a park
page: **search**, **rider height**, **off season**. `components/parks/rider-height-filter.tsx`
draws the slider, `lib/utils/rider-height.ts` holds its rules (pure, `pnpm test:rider-height`), and
`lib/hooks/use-attraction-filter.ts` composes all three filters over one list.

---

## Why it is a panel

The controls existed before the panel did and none of them knew about the others. The search box
was `md:absolute md:top-0 md:right-0` inside the grid, so on a desktop it floated over the park
photograph beside the rope-drop card and on a phone it was a full-width box wedged above the first
land. The off-season toggle sat next to it in a bare flex row. Nothing said the two were one set of
controls over one list, and there was nowhere to put a third.

It takes `TILE_GLASS` — the material of the entry-tile row directly above it — because that is what
it is: another band of the same stack of objects over the same photograph, not a new kind of thing.

---

## The height filter

**It is only rendered when the park publishes a minimum height on at least one ride.** Roughly a
third of the catalogue has nothing on file, and a control whose every position returns the same
forty rides is worse than no control. `riderHeightRange()` returns `null` there and the panel
collapses to its first row.

### A slider, not a row of chips

The result set can only change at the park's own limits, so three buttons reading "100 / 120 / 140"
would be the complete set of distinct answers. They are still the wrong control: nobody knows their
child's height as one of three numbers, they know it as 118, and a control that offers only the
park's steps makes a parent round it themselves — in the direction that gets the answer wrong half
the time. The limits are drawn on the track as ticks instead, so the steps are visible without
being the only thing on offer.

### What the range is, and what it is not

The track runs from two steps below the park's lowest limit up to its highest. The lower end has to
clear nothing — the filter must be able to say "too small for every ride that has a limit" — and
above the top end the answer stops changing.

`maximumHeight` is **filtered on but does not stretch the track**. Those values are mostly a
coaster's safety ceiling rather than a kiddie ride's cutoff: Phantasialand's are 140, 145, 195, 200
and 205 cm, and honouring the top of that would spend a third of the track between 140 and 205,
where the only thing that can change is whether somebody is too tall for a roller coaster. The
maxima that matter to a child sit below the highest minimum and are inside the range anyway.

### A missing limit is not a ban

`canRideAtHeight` passes an attraction with no height on file, the same `!== false` shape
[`isInSeason`](../api/seasonal-attractions.md) uses and for the same reason: nobody wrote a limit
down, which is not the same as the ride being off limits. Phantasialand has five such rides out of
forty; hiding them would make the filter quietly shorten the park.

### Off is a state

`riderHeight` is `number | null`, and `null` is not "the slider happens to sit at the bottom". The
bottom position is a legitimate answer — a toddler who clears nothing — and it has to be
distinguishable from a visitor who has not touched the control. While it is `null` the thumb rests
on the park's lowest limit, drawn muted, and the readout says "Alle Größen" rather than a number
nobody chose.

### The thumb is drawn, the input is invisible

A native range input styles its thumb through three vendor pseudo-elements that share no cascade,
and the filled part of the track is not addressable at all. So the track, the fill, the ticks and
the thumb are elements, and a transparent `<input type="range">` lies over the row — the same
construction as the admin's one-field TOTP boxes. Pointer, keyboard and screen-reader behaviour
come from the real input; only the paint is ours.

One detail is load-bearing: a native thumb's centre travels from half a thumb-width in to half a
thumb-width short of the end, so a drawn thumb placed at a plain percentage runs ahead of the
pointer at one end and behind it at the other. Every drawn position goes through
`calc(var(--thumb) / 2 + (100% - var(--thumb)) * f)`.

Heights render through `RiderHeight`, i.e. in both units with CSS picking one, like every other
measurement on the site.

---

## How the three filters compose

Height, then season, then search — each reading the previous one's output, so the headliner row,
the land grid and the panel's own "33 of 40" readout cannot disagree.

**The search reaches past the season and does not reach past the height**, and the difference is
what the two filters are about. The season is a property of the ride that the visitor never asked
about, so typing a ride's name has to reach past it (see
[seasonal attractions](../api/seasonal-attractions.md) — filtering the hits made every exact search
for one of Toverland's off-season rides answer "no attractions found"). A rider height is a
statement about the person who would be queuing: a 105 cm child does not become tall enough because
a parent typed "Taron". So the height filter holds, and the empty state names it and offers to
clear it — two filters can empty that grid and only one of them is obviously to blame, since a
search box you just typed into is right there and a height set three scrolls ago is not.

The off-season toggle goes `invisible` while a search runs, because it then governs nothing and
pressing it would appear to do nothing. `invisible` rather than unmounted: a control that came and
went as somebody types would move the whole list under it.

---

## Its height is the ride list's top edge

Every row inside is fixed — `h-9` for the controls (the input scale from `components/ui/button.tsx`)
and `h-6`/`h-5`/`h-4` for the height filter's three lines — and nothing inside appears or disappears
as a visitor types or drags. The value pill, the reset button and the count all keep their box in
every state.

Two things do change the box, and both are the same on either side of hydration: whether the park
publishes rider limits at all, and the breakpoint, because from `md` up the two halves sit side by
side rather than stacked. Which is why **the pre-mount branch of `tabs-with-hash.tsx` renders this
same component** rather than the `h-9` spacer it used to — see
[a streamed section owes the page its height](../architecture/system-overview.md#5-a-streamed-section-owes-the-page-its-height-requirement).
A placeholder would have to write both numbers down a second time, and be wrong about one of them.
Its controls are live for the frame between paint and mount, and what they set survives into the
mounted tree: the state lives in `useAttractionFilter`, above that branch.
