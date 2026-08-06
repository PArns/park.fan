# Homepage Hero

The homepage hero is a two-column layout over the rotating park photo: live headline and
search on the left, a clickable world map on the right. Every number in it is live.

```
┌─────────────────────────────────────────────┐┌──────────────────────────┐
│ ● 72 PARKS GERADE OFFEN        (glass pill) ││ Parks in Europa   40/49  │
│                                             ││ ┌──────────────────────┐ │
│ Wo lohnt sich heute das Anstehen?           ││ │  world map, one      │ │
│ park.fan zählt live an 218 Freizeitparks …  ││ │  bubble per          │ │
│                                             ││ │  continent           │ │
│ ┌─────────────────────────────────────────┐ ││ └──────────────────────┘ │
│ │ 🔍 Europa-Park, Taron, Efteling …       │ ││ [Deutschland 7 offen] …  │
│ └─────────────────────────────────────────┘ ││ Alle Parks in Europa →   │
│ ┌─────────────────────────────────────────┐ │└──────────────────────────┘
│ │ 🖼 Toverland          Ø 45 Min.         │ │
│ │ 🖼 Phantasialand      Ø 75 Min.         │ │
│ │ 🖼 Bobbejaanland      Ø 35 Min.         │ │
│ └─────────────────────────────────────────┘ │
│ ● Europa-Park Ø41 min  ● Phantasialand …    │
└─────────────────────────────────────────────┘   xl (≥1280px) only
   │
   └── the FLOATING dropdown is already open here, listing the 3 nearest parks
```

Entry point: `app/[locale]/page.tsx`. Both columns are panels (`HeroTextPanel` /
`GlassCard variant="heavy"`) so the hero reads as one composition rather than text loose on a
photo next to a card.

### The one rule about `backdrop-filter` in here

The hero photo runs a ken-burns transform. **Every animation frame invalidates every
`backdrop-filter` layered over it**, and each one is re-blurred at animation rate. Measured at
6× CPU throttle with the hero on screen:

|                                               | median frame | frames > 20 ms |
| --------------------------------------------- | ------------ | -------------- |
| 22 blurred pills, chips and badges + 2 panels | 50.0 ms      | 125 / 140      |
| panels only, left plate unblurred             | 33.3 ms      | 122 / 129      |
| **shipped** (both panels blurred, 1600 px)    | **66.7 ms**  | 115 / 119      |
| shipped minus the left plate's blur           | 50.0 ms      | 113 / 119      |
| no backdrop filter at all                     | 16.7 ms      | 1 / 129        |
| **shipped, mobile 390 px**                    | **16.7 ms**  | **0 / 129**    |

> **An entrance animation can switch the glass off.** `animation-fill-mode: both` retains the
> final keyframe forever, so a keyframe ending in `transform: translateY(0) scale(1)` leaves an
> identity transform on the element — and an element with a transform isolates its backdrop.
> Both hero panels and the search dropdown then computed as `blur(64px)` and did visibly
> nothing. Use `backwards`: it still hides the element before its turn (the reason the entrance
> is CSS at all) without leaving anything behind. Check by measuring local contrast inside vs
> outside a panel — 0.98 against 7.73 is a real blur; equal numbers mean it is off.

So: **panels may blur, small things on them may not.** A pill sitting on an already-opaque
panel gains nothing from its own filter and costs a full re-blur per frame; the pills, country
chips, continent bubbles and the open-now badge are all plain translucent fills for that reason.
`HeroTextPanel` carries one (it was asked for, and the two plates read as one material), which
is the single most expensive filter on the page — it is the largest surface. It uses
`GlassCard variant="heavy"`, the **same** component and variant as the map panel and the search
dropdown, rather than its own `backdrop-blur-*`: side by side, any difference in radius or tint
reads immediately as one of them being wrong, and a hand-rolled blur had already drifted to
40 px against the panel's 64 px.

The radius is **not** the lever: 64 px, 24 px and 12 px all measure the same. It is the presence
of a filter over a _moving_ backdrop that costs. **Area** is the lever: the left plate is the
largest blurred surface on the page and accounts for ~17 ms per frame on its own.

Which is why the radius is chosen by eye, not by budget. It shipped at 64 px over a 75 % fill and
the photo behind the panels stopped being a photo — an even field of colour with nothing of the
park left in it. It is **24 px over 62 %** now. Text is not what pays for that: the copy clears
12:1 over the raw photo with no panel at all, and the measured floor across the extremes is

| backdrop under the glass | light mode | dark mode |
| ------------------------ | ---------- | --------- |
| a real hero photo        | 11.2–15.1  | 17.4–19.2 |
| forced pure white        | 19.8       | **5.15**  |
| forced pure black        | 7.39       | 19.6      |

The worst case in the table is a photo brighter than any in the library, in dark mode, and it
still passes AA.

**The real lever is the ken-burns animation.** With it stopped, the blurs cost nothing at all
(16.7 ms with every filter still in place) — a static backdrop is filtered once and cached.
So the whole trade-off is: slow zoom on the photo, or unlimited glass. Today we ship both and
pay for it on desktop; mobile is unaffected (16.7 ms, zero slow frames) and
`prefers-reduced-motion` already stops the animation, which takes the cost to zero for the
visitors most likely to need that.

---

## Live numbers: SSR seed + client overlay

Same model as the rest of the site (see [caching](../architecture/caching-strategy.md)) — the
static shell carries an hourly seed, the browser replaces it with live values on mount.

| Value                                 | Server seed                                | Client overlay                     |
| ------------------------------------- | ------------------------------------------ | ---------------------------------- |
| Open-parks badge + intro counts       | `HeroStats` → `getGlobalStats(3600)`       | `useGlobalStats` (5-min poll)      |
| Panel open counts (continent/country) | `HeroWorldPanel` → `getGeoLiveStats(3600)` | `useGeoLiveStats` (5-min poll)     |
| Panel geo structure (names, totals)   | `getGeoStructure()` (24 h)                 | —                                  |
| Nearby bubbles + pre-query list       | —                                          | `useHeroBrowseParks` (client only) |

**Both server fetches must stay at `revalidate ≥ 3600`.** A static route's ISR window is the
MINIMUM of its fetch revalidates, so a single 300s fetch here would pin the whole 6-locale
homepage back to a 5-minute shell — the exact write regression documented in
[caching](../architecture/caching-strategy.md#update-jul-2026--hourly-homepage-shell--client-live-overlays-write-regression-fix).
Verify with `next build`'s revalidate column: `/[locale]` must read **1h**.

The intro sentence is a `t.rich` message with `{parks, number}` / `{attractions, number}`
placeholders and a `<strong>` tag, so the counts are localized and emphasized without splitting
the sentence into fragments.

---

## In-place search (desktop) vs palette (mobile)

`HeroInlineSearch` picks the surface by viewport:

- **< md** — the existing `SearchCommand` trigger + full-screen `SearchDialog` palette. No
  inline list: on a phone the result list would push the whole page down.
- **≥ md** — `HeroInlineSearchPanel` (lazy chunk, desktop-only): the input stays in the hero
  and the results **float** below it.

**Neither is what the first frame paints.** `useMediaQuery` is false on the server and on the
first client render, so picking the surface straight from it made the desktop hero paint the
_mobile_ trigger first — a field carrying a ⌘K badge and a pulsing ring that vanished a moment
later. Both viewports now start on `HeroSearchShell`, which looks like neither trigger in
particular and like the final field exactly; the surface is chosen once `useMounted()` is true.
The resting dropdown is drawn as a skeleton in the same breath (`HeroSearchRestingCard`,
`hidden md:block` so CSS decides, not a hook), so the card fades in where a box already is
instead of dropping into an empty gap.

Both surfaces share their behavior, so a result can never look or route differently depending
on where it was clicked — including the list they show before anything is typed:

| Shared piece            | Module                                       |
| ----------------------- | -------------------------------------------- |
| Queries + debounce      | `lib/hooks/use-search-results.ts`            |
| Pre-query list          | `lib/hooks/use-hero-browse-parks.ts`         |
| Analytics + routing     | `lib/hooks/use-search-navigation.ts`         |
| Row rendering           | `components/search/search-result-items.tsx`  |
| Category grouping/order | `components/search/search-result-groups.tsx` |
| Panel body              | `components/search/search-results-panel.tsx` |

**The dropdown is open at rest** and lists the three nearest parks — the hero's default state is
an answer, not an empty field. **Focusing the field expands it** to the full browse list, tweened
from the height it had (GSAP: the content swaps in one render, so there is nothing for CSS to
interpolate towards `height: auto`). It has no closed state on desktop at all: Escape steps back
one level — a query is cleared first, an already-empty field collapses to the three resting rows
— and focus stays on the field either way.

> The spacer keeps reserving the **resting** height while expanded, so a growing list moves the
> card over the pills rather than pushing them down. Measured: the pills sit at the same viewport
> offset at rest, focused, and with 27 result rows on screen.

> **Results and the browse list must never render at once.** `query` empties immediately while
> `debouncedQuery` holds the old term for another 300 ms, and the two branches keyed off
> different ones — so for that window the card rendered the full result list _and_ the browse
> list, ballooned to its cap and snapped back. Escape hit it every time. Both branches now
> require the two to agree.

**It floats** (`absolute z-40`) rather than sitting in the hero's flow, so a growing result list
never moves the headline. Two consequences that have to be held together:

- The **resting** height is reserved in the flow by a spacer div, **measured** from the card by
  a ResizeObserver rather than hardcoded, so the nearby pills sit _below_ the open list instead
  of underneath it. It started as a constant that happened to match one locale's three rows;
  anything changing the card's height — a park name wrapping, a longer heading in another
  language, a fourth row — then moved the card without moving the pills and the gap drifted or
  closed. `--hero-search-rest-h` survives only as the pre-measurement estimate the shell's
  skeleton paints with. Measured **at rest only**: once a query grows the list the card is meant
  to expand over the pills, so the last resting height stays reserved.
- The card is capped to the room left below the field (`--hero-search-max-h`, written onto the
  node from a rAF-throttled scroll/resize listener), so a long list ends at the bottom of the
  screen and scrolls inside itself rather than running off the page.

The two hero columns are **staggered** (`items-start`, left column up, right column `xl:mt-24`)
precisely to give that open list room, and neither column forces the other's height.

Also worth knowing:

- The hero section carries **`z-10`** (and no `overflow-hidden`) so the dropdown paints over the
  sections below it. The sticky header is `z-50` and still wins.
- It is real glass, which works only because the panel fades the nearby pills out via
  `:has(input:focus)` while the field is focused. Their high-contrast text ghosts straight
  through the blur otherwise, and the alternative was a near-opaque sheet.

It opens on focus and closes on blur; `onMouseDown` preventDefault on the dropdown keeps focus
in the input, or clicking a result would blur-close the list out from under the click. Escape
closes it and **keeps focus on the field** — the ARIA combobox pattern.

The list is `hidden` when closed, not unmounted: cmdk's `aria-controls` and
`aria-activedescendant` point into that subtree and were left dangling by unmounting. cmdk also
hard-codes `aria-expanded="true"` _after_ spreading our props, so that one is corrected on the
element in an effect — a prop cannot win against it.

Before anything is typed the list shows `useHeroBrowseParks()`: the visitor's nearby parks
(with photo, live open-attraction counts and Ø wait), the current park's rides when they are
inside one, or — only when the nearby lookup including its GeoIP fallback comes back empty —
the most popular parks, so the list is never blank.

**Result thumbnails come from the media database.** The backend's `/v1/search` knows nothing
about our photos, so the `/api/search` proxy resolves them (`lib/utils/search-assets.ts`), the
same way `/api/nearby` does for its park list. Rows use the default image optimizer, **not**
`backgroundImageLoader` — that one is tuned for full-bleed photos under gradient overlays (q50)
and turns a 44 px thumbnail to mush.

---

## Nearby bubbles

`HeroNearbyBubbles` renders the same `useHeroBrowseParks()` data as pills with a wait-time-
coloured dot (`CROWD_DOT_CLASS` + `waitTimeCrowdTier`, so a pill is green at 20 min and red past
an hour like every other wait time on the site). One shared hook means the bubbles and the
search list never disagree, and React Query dedupes them into a single request.

This replaced the marquee wait-times ticker that used to sit at the bottom of the hero
(`live-wait-ticker.tsx`); `/api/analytics/ticker` still exists for the admin dashboard.

They render into `HeroBubbleRow`, whose height does not depend on its contents — one scrollable
row below `sm`, exactly two rows above it. The skeleton cannot know how long "Chimelong Ocean
Kingdom" is, so a freely-wrapping row changed height when the real pills replaced it and pushed
the page down (0.0147 CLS on a throttled phone). Note also the `grid-cols-1` on the hero grid:
an implicit grid column is sized to its content's max-content width, and a horizontally
scrollable row is wider than a phone — without it the whole hero overflowed the viewport.

---

## Nothing appears out of nowhere

Every live surface in the hero resolves at its own pace after load, and rendering nothing until
each one lands made the hero assemble itself piece by piece in front of the visitor. Each one
now holds a placeholder in **exactly its final box** (`components/home/hero-skeletons.tsx`), so
the layout is settled from first paint. Measured CLS is **0.0095** on desktop and **0** on a
throttled phone, over five runs each at 4× CPU / 1.6 Mbps.

### A skeleton in the flow does not help if the flow has not arrived

The plate's later children — the search block, the pill row — sit in a later chunk of the HTML
response than its opening tag. On a slow link the browser paints the half-parsed plate in
between: it came up 328 px tall and grew 456 px when the rest of the markup landed. That is
**0.10 CLS in two runs out of five**, and nothing that runs after hydration can prevent it —
only markup the browser has already seen can.

So the plate reserves its own height, `md:min-h-[var(--hero-plate-min-h)]`, from the breakpoint
where the dropdown's resting list starts occupying the flow. 784 px is the measured settled
height in **all six locales at every width from 768 px up** (only fr at 1440 goes to 803, where
the headline takes a third line), and it is stable because every piece above it is fixed-size —
including `HeroBubbleRow`, whose height deliberately does not depend on its pills. A min-height
at or below the real height changes no finished layout; it only stops the box starting short.
With it, all five runs measure 0.0095.

| Surface         | Placeholder                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| Open-parks pill | The pill itself renders either way; only its content swaps (see below)      |
| Nearby pills    | `HeroBubblesSkeleton` in the same `HeroBubbleRow`                           |
| World-map panel | `HeroWorldPanelSkeleton`, rendered by the Suspense fallback AND by the gate |
| Search field    | `HeroSearchShell` — a real input, see below                                 |

The open-parks pill is one element whose **content** swaps, not a skeleton replaced by a badge:
two separate elements measured a small but real shift even at identical heights.

`HeroWorldPanelGate` renders its skeleton even below `xl`, where the panel will never appear —
both its hooks are false during SSR, so that branch is the server output, and the parent column
is `hidden xl:block` so a narrow viewport pays only for the markup.

**The search field is a working input before its chunk exists.** `HeroSearchShell` captures
focus and keystrokes and hands them — with the text already typed — to the real panel the
instant it mounts. That is what lets the panel load after load+idle instead of during
hydration: a visitor faster than the chunk loses nothing, and one who never touches the field
never pays for it.

---

## World-map panel

`HeroWorldPanel` (server seed) → `HeroWorldPanelGate` (client gate) → `HeroWorldPanelClient`.

- **Only mounts on `xl` (≥1280px) and only after load + idle.** The map is a decorative
  navigation aid; it must never compete with the hero photo for LCP. Below `xl` the column is
  hidden in CSS (`hidden xl:block`) and only the skeleton's markup ships — see below for why the
  gate renders it on every viewport.
- **Clicks go to the geo routes.** Clicking another continent switches the panel in place;
  clicking the selected continent (bubble or landmass) navigates to `/parks/<continent>`, and
  each country chip links to `/parks/<continent>/<country>`.
- Open counts come from `useGeoLiveStats`. A continent or country missing from a **successful**
  geo-live response has zero open parks — that is a `0`, not "unknown"; only a failed fetch
  leaves it blank.

### The map data is generated

`lib/geo/world-map-data.ts` is written by `node scripts/generate-hero-world-map.mjs` from
`public/world.svg` (Simplemaps.com, MIT). The source is 152 KB with one path per country and
`lib/utils/geo-svg.ts` is server-only (`fs`), so neither can reach a client component. The
generator groups the country paths into **one simplified silhouette per continent** (~38 KB
total, committed, not part of `prebuild`): speck islands dropped, rings simplified with
Douglas-Peucker, coordinates rounded.

Russia is grouped with Asia and Greenland with North America — both by landmass, and both to
stop one country stretching its continent's highlight across the map.

> Douglas-Peucker on a **closed** ring needs the split-at-the-farthest-point variant the script
> uses. The textbook open-polyline form takes first→last as its baseline, which for a closed
> ring is the same point — a degenerate baseline that collapses every country to a dot. A green
> build tells you nothing here; look at the rendered map.

---

## Related

- [Caching Strategy](../architecture/caching-strategy.md)
- [Routing & URLs](../architecture/routing-and-urls.md)
- [Design System](../design/design-system.md)

---

## Motion: CSS for the entrance, GSAP for interaction

The hero's entrance is a **CSS keyframe**, not GSAP, and that split is deliberate.

### The panels themselves never animate

Not transform, not opacity, not filter. Each of the three establishes a **backdrop root** for as
long as it is applied, and an element that is a backdrop root has nothing left for its own
`backdrop-filter` to blur. A panel that animates therefore has no working glass _while it
animates_: the blur visibly switched on the moment the entrance finished, a beat after the panel
had already arrived. It looks like a bug because it is one, and no amount of tuning the keyframe
fixes it — the fix is that the box stays put and its **contents** carry the entrance.

The same trap with a longer fuse: `animation-fill-mode: both` retains the final keyframe forever,
so `transform: translateY(0)` or `filter: blur(0)` stays on the element after the animation is
over and the backdrop root never goes away. Use **`backwards`** — it applies the 0% frame during
the delay and hands the element back to its own styles at the end.

### What does animate

- **Plate contents, one at a time** — `hero-item-in`: they drift in from the outside edge, rise,
  grow the last 3.5 % into place and resolve out of a 12 px blur, over 0.85 s on a near-flat expo
  curve. Most of the distance is covered in the first third and the rest is a settle, which is
  the difference between cinematic and slow. The blur is on content, which has no
  `backdrop-filter` of its own.

  Three custom properties carry the choreography, so no component needs to know its place in it:
  `--hero-in-i` per position (`nth-child`), `--hero-in-from` for where a column's sequence starts,
  and `--hero-in-x` for which side it drifts in from. `.hero-in-late` on the right column sets the
  last two to mirrored values, so the hero reads left to right and closes toward its own centre
  instead of everything sliding the same way.

- **The map's landmasses** — `hero-map-in`: a west-to-east sweep, so the map draws itself instead
  of switching on. The order is derived from `BUBBLE_ANCHORS`' x coordinates, not hard-coded, so
  retuning an anchor keeps its continent in the right place in the sweep. `transform-box: fill-box`
  is what makes each landmass grow about its own bounding box rather than the viewBox origin.
- **The continent bubbles** — `hero-pop-in`, landing on a map that is already there. On arrival
  only: switching continents remounts two bubbles, and a pop there would fire on exactly the two
  the visitor is looking at. `ENTRANCE_MS` in `hero-world-panel-client.tsx` has to outlast the
  **last** thing on the map, currently the selected bubble's ring — get it wrong and the class
  comes off mid-flight and things jump.
- **The selected continent** — `hero-map-lock` blooms its highlight once the sweep has reached
  it, and `hero-bubble-ring` sends one ring out from its bubble. Both animate properties that
  are not transform/opacity/filter (`fill-opacity`, `box-shadow`), which is also why the ring is
  not a `scale`: the bubbles are centred on their anchor by the standalone `translate` property
  and a scale there would fight it.
  An entrance animation has to own the very first painted frame. A lazily-loaded library cannot:
  either the hero paints and is then hidden again when the library arrives — a flash — or it stays
  blank until the chunk lands. Both are worse than the pop they would be fixing. A CSS keyframe with
  `backwards` gives it a hidden start state without any JavaScript, so there is no code path where a
  failed chunk leaves the hero invisible.

### The entrance is a window, and it has to close

The hero's badge, headline and intro live in a dynamic hole: the static shell paints a fallback
with the same markup minus the live counts, and the real content is streamed in behind it. That
replacement is a **DOM swap, not a React re-render**, so the arriving elements are new elements —
and a new element starts its CSS entrance from the top.

On a fast link that lands inside the entrance and nobody notices. On a throttled one the hole
resolved around 2.5 s in and the headline visibly faded a **second** time, which also handed the
page its LCP to that second fade:

|                               | LCP, 4 runs at 4× CPU / 1.6 Mbps |
| ----------------------------- | -------------------------------- |
| entrance replayed on the swap | 3.31 / 3.49 / 3.84 / 3.99 s      |
| entrance closed before it     | 3.36 / 3.34 / 3.38 / 3.34 s      |

So the entrance is scoped to `.hero-entering` on the hero section and `HeroEntranceGate` drops
that class once the choreography is over. It is an **inline script, not an effect**: the window
has to close before the swap, the swap has no fixed time, and on a throttled phone hydration
itself lands after it — a `useEffect` timer starts counting too late to ever win. Parsed inline,
the timer starts at roughly the moment the hero paints, the same clock the CSS animation runs on.
If the script is blocked the class stays and late content animates in, which is the behaviour it
replaces; nothing is hidden that only JavaScript can reveal.

**GSAP earns its place on interaction**, in two places:

- **Switching continents** replaces the whole country-chip row, and letting the new set flick in
  staggered reads as the panel answering the click rather than the content teleporting
  (`hero-world-panel-client.tsx`).
- **The header solidifying** on a hero page (`lib/hooks/use-header-reveal.ts`). The existing CSS
  crossfade is untouched and stays the source of truth — `backdrop-filter` is deliberately kept
  out of its transition list, because animating it re-rasterized the blur of the whole page
  behind the bar on every frame. GSAP layers a stagger over it and animates **`y` only, never
  `opacity`**: a failed chunk then means a plain fade with everything visible, never a header
  that JavaScript forgot to reveal. Nothing touches the `<header>` element itself — it carries
  `backdrop-blur-md`, so a transform or opacity on it would cost the bar its blur for exactly as
  long as it was fading in.

  It is **one timeline, played and reversed**, not a flourish re-run per scroll. The 50 px
  threshold is crossed every time the visitor scrolls up and back down; restarting there turned
  the header into a fidget, whereas reversing simply continues the same motion from wherever it
  currently is.

### The corner anchors do not cross-fade, they move

There are two logo lockups in the markup: one parked at `left-6` while the header floats over the
hero, one in the bar's flex flow once it solidifies. They sit at different x positions and
different sizes, so fading one out while the other faded in looked like exactly that — one thing
vanishing, a second, bigger thing appearing somewhere else.

They now travel the same path in the same 500 ms: the outgoing lockup slides to where the
incoming one lives and grows to its size, the incoming one starts small at the corner. At the
midpoint both are the same size in the same place, so the eye reads one logo moving. Measured
mid-transition: `dx = 0.0 px, dh = 0.0 px`.

Both numbers come from `offsetLeft`/`offsetHeight`, never `getBoundingClientRect()` — those are
layout values and ignore the transforms, so the measurement cannot feed back into itself. The
container is centred, so the distance depends on the viewport and is re-measured on resize.
`motion-reduce:transform-none!` drops the movement for reduced motion; the `!` is required
because an inline style otherwise wins.

The locale + theme cluster on the right does the same thing with two differences: it is measured
from the **right** edges (`offsetLeft + offsetWidth`) and moves from `origin-right`, and it needs
no scale at all — both copies hold the same two controls at the same size, and only the corner one
wraps them in a frosted pill. That pill dissolving while the pair glides is the whole effect.
Measured in the solid state, both right edges land on the same pixel.

In both cases the chunk loads while the visitor is already looking at the thing being animated,
and if the import fails the content is in the DOM regardless — nothing is hidden up front waiting
for a library to reveal it.

Both paths bail out completely under `prefers-reduced-motion: reduce` — no animation, not a
shortened one. Same for the ken-burns photo (see the `backdrop-filter` section above: for those
visitors it also takes the hero's rendering cost to zero).
