# Homepage hero

The homepage hero: live headline and search on the left, a clickable world map on the right, over
the rotating park photo. Open this when changing the hero's panels, its search, its live counts,
its placeholders or its motion. Entry point: `app/[locale]/page.tsx`.

```
┌─────────────────────────────────────────────┐┌──────────────────────────┐
│ [NEWS] 13. Okt. · Efteling verkauft …   →   ││ ● 72 PARKS WELTWEIT OFFEN│
│                                             ││ Parks in Europa   40/49  │
│ Wo lohnt sich heute das Anstehen?           ││ ┌──────────────────────┐ │
│ park.fan zählt live an 218 Freizeitparks …  ││ │  world map, one      │ │
│                                             ││ │  bubble per continent│ │
│ ┌─────────────────────────────────────────┐ ││ └──────────────────────┘ │
│ │ 🔍 Europa-Park, Taron, Efteling …       │ ││ [Deutschland 7 offen] …  │
│ └─────────────────────────────────────────┘ ││ Alle Parks in Europa →   │
│ ┌─────────────────────────────────────────┐ │└──────────────────────────┘
│ │ 🖼 Toverland          Ø 45 Min.         │ │   only from a 1280 px page
│ │ 🖼 Phantasialand      Ø 75 Min.         │ │
│ └─────────────────────────────────────────┘ │
│ ● Europa-Park Ø41 min  ● Phantasialand …    │
└─────────────────────────────────────────────┘
   the floating dropdown is open at rest, listing the 3 nearest parks
```

Both columns are panels — `HeroTextPanel` and the map's `GlassCard variant="heavy"` — so the hero
reads as one composition.

## Glass over a moving photo

The photo runs a ken-burns pan (`.hero-ken-burns`, `components/layout/hero-background.tsx`), and
**every frame of it invalidates every `backdrop-filter` over it**. Measured at 6× CPU with the hero
on screen:

|                                               | median frame | frames > 20 ms |
| --------------------------------------------- | ------------ | -------------- |
| 22 blurred pills, chips and badges + 2 panels | 50.0 ms      | 125 / 140      |
| **shipped** (both panels blurred, 1600 px)    | **66.7 ms**  | 115 / 119      |
| shipped minus the left plate's blur           | 50.0 ms      | 113 / 119      |
| no backdrop filter at all                     | 16.7 ms      | 1 / 129        |
| **shipped, mobile 390 px**                    | **16.7 ms**  | **0 / 129**    |

- **Panels may blur; small things on them may not.** A pill on an already-opaque panel gains nothing
  from its own filter and costs a re-blur per frame, so pills, country chips, continent bubbles and
  the open-now badge are plain translucent fills. `HeroTextPanel` uses `GlassCard variant="heavy"`,
  the same component and variant as the map panel and the search dropdown — side by side, any
  difference in radius or tint reads as one of them being wrong (a hand-rolled blur had drifted to
  40 px against 64).
- **Area is the lever, not the radius** (64, 24 and 12 px measure the same); the left plate, the
  largest blurred surface, costs ~17 ms per frame on its own. The radius is therefore chosen by eye:
  **24 px over a 62 % fill** (64 px over 75 % turned the photo into an even field of colour). Text
  contrast over the glass, worst case: 11.2–15.1 : 1 (light) and 17.4–19.2 (dark) over real hero
  photos; 5.15 : 1 in dark mode over a forced pure-white backdrop, still AA.
- **The pan is the real lever**: with it stopped, every filter costs nothing (16.7 ms), since a
  static backdrop is filtered once. `prefers-reduced-motion` stops it.
- **The pan waits for load + idle and the entrance window** (`useHeroPanAllowed`, sharing
  `HERO_ENTRANCE_MS` = 1700 with `HeroEntranceGate`), so the hero assembles over a static backdrop;
  its first keyframe is the identity transform, so a late start is invisible. It is **paused**, not
  removed, while the hero is off screen or the tab is hidden (`useActiveOnScreen` →
  `.hero-motion-paused`), so scrolling back up does not snap the photo to `scale(1)`.

These numbers come from a headless container without a GPU, where the compositor is the bottleneck
for everything; the mechanism is certain, the share is worth re-measuring on real hardware.

## Live numbers: server seed, client overlay

The static shell carries a seed; the browser replaces it with live values on mount
([caching](../architecture/caching-strategy.md)).

| Value                                 | Server seed                            | Client overlay                     |
| ------------------------------------- | -------------------------------------- | ---------------------------------- |
| Open-parks badge + intro counts       | `HeroStats` → `getGlobalStats()`       | `useGlobalStats`                   |
| The map panel's worldwide badge       | `HeroWorldPanel` → `getGlobalStats()`  | `useGlobalStats` (same query)      |
| Open counts per continent and country | `HeroWorldPanel` → `getGeoLiveStats()` | `useGeoLiveStats`                  |
| Geo structure (names, totals)         | `getGeoStructure()` (`CACHE_TTL.geo`)  | —                                  |
| Nearby bubbles + pre-query list       | —                                      | `useHeroBrowseParks` (client only) |

The seeds are cached a week in `lib/api/analytics.ts` and the route is `revalidate = 604800`; the
overlays poll on `LIVE_POLL_QUERY_OPTIONS` (five minutes). A shorter window on any seed fetch would
pin the whole six-locale homepage to it:
[a `revalidate` at a call site is somebody else's page](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md).
The intro sentence is one `t.rich` message with `{parks, number}` / `{attractions, number}` and a
`<strong>` tag, so the counts are localized without splitting the sentence.

## Search: in place on a desktop, the palette on a phone

`HeroInlineSearch` (`components/search/hero-inline-search.tsx`) picks the surface once
`useMounted()` is true:

- **below `md`**: the `SearchCommand` trigger and the full-screen `SearchDialog` palette (an inline
  list would push the page down);
- **from `md`**: `HeroInlineSearchPanel`, a lazy desktop-only chunk; the input stays in the hero and
  the results float below it.

**The first frame is `HeroSearchShell`, which looks like the final field exactly.** `useMediaQuery`
is false on the server, so choosing from it painted the mobile trigger on a desktop first. Below
`md` the shell gives way to the palette trigger, so it paints that trigger's pulsing ring
(`md:hidden`) and its `pr-14` (`md:pr-4`) from the first frame. The shell is a working input: it
captures focus and keystrokes and hands them, with the text typed, to the real panel when it mounts,
which is what lets the panel load after load + idle. The resting dropdown is drawn as a skeleton in
the same breath (`HeroSearchRestingCard`, `hidden md:block`).

Both surfaces share their behaviour, so a result never looks or routes differently by where it was
clicked:

| Shared piece                 | Module                                                         |
| ---------------------------- | -------------------------------------------------------------- |
| Queries + debounce           | `lib/hooks/use-search-results.ts`                              |
| Pre-query list               | `lib/hooks/use-hero-browse-parks.ts`                           |
| Analytics + routing          | `lib/hooks/use-search-navigation.ts`                           |
| Result → URL (and `/search`) | `searchResultHref` in `lib/utils/url-utils.ts`                 |
| Row rendering                | `components/search/search-result-items.tsx`                    |
| Category grouping/order      | `components/search/search-result-groups.tsx`                   |
| Panel body                   | `components/search/search-results-panel.tsx`                   |
| Guides and news              | `lib/navigation/post-search.ts`, [site search](site-search.md) |

**The dropdown is open at rest** with the three nearest parks; focusing the field expands it to the
full browse list, the height tweened by GSAP (the content swaps in one render, so CSS has nothing to
interpolate to). There is no closed state on a desktop: Escape steps back one level — a query is
cleared, then an empty field collapses to the three resting rows — and focus stays on the field.
**Results and the browse list never render at once**: `query` empties immediately while
`debouncedQuery` holds the old term for 300 ms, so both branches require the two to agree.

**It floats** (`absolute z-40`) so a growing list never moves the headline:

- The **resting** height is reserved in the flow by a spacer measured from the card with a
  `ResizeObserver` (a constant drifted with every wrapping name or longer locale);
  `--hero-search-rest-h` survives only as the skeleton's estimate. Measured at rest only: a query's
  longer list is meant to expand over the pills.
- The card is capped to the room below the field (`--hero-search-max-h`, written from a
  rAF-throttled scroll/resize listener) and scrolls inside itself.
- The two hero columns are staggered (left up, right column offset down from 1280 px) to give the
  list room. The hero section carries `z-10` and no `overflow-hidden`, so the dropdown paints over
  the sections below; the sticky header (`z-50`) still wins.
- It is real glass because the nearby pills fade out while the field has focus — through
  `peer/hero-search` on the siblings, not a `:has()` rule
  ([no `:has()`](../rules/no-has-selector-in-the-stylesheet.md)). Their text would ghost through the
  blur otherwise.

`onMouseDown` `preventDefault` on the dropdown keeps focus in the input, or a click on a result
would blur-close the list from under it. The list is `hidden` when closed, not unmounted, because
cmdk's `aria-controls` and `aria-activedescendant` point into it; cmdk also hard-codes
`aria-expanded="true"` after spreading props, so that one is corrected on the element in an effect.
The hero's page-wide typing shortcut follows
[a keyboard shortcut waits for an unfocused page](../rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md).

Before anything is typed the list shows `useHeroBrowseParks()`: the nearby parks (photo, live open
count, Ø wait), the current park's rides for a visitor inside one, or — only when nearby including
its GeoIP fallback is empty — the most popular parks. **Thumbnails come from the media database**:
`/v1/search` knows nothing about our photos, so the `/api/search` proxy resolves them
(`lib/utils/search-assets.ts`), as `/api/nearby` does. Rows use the default image loader, not
`backgroundImageLoader` (q50, tuned for full-bleed photos under overlays, mush at 44 px).

## Nearby bubbles

`HeroNearbyBubbles` renders the same `useHeroBrowseParks()` data as pills with a wait-time dot
(`CROWD_DOT_CLASS` + `waitTimeCrowdTier`, the site-wide colour scale); one hook means the bubbles and
the search list never disagree and React Query makes one request. They sit in `HeroBubbleRow`, whose
height does not depend on its contents — one scrollable row below `sm`, exactly two rows above —
because a freely wrapping skeleton row shifted the page when real names replaced it (0.0147 CLS on
a throttled phone). The hero grid needs `grid-cols-1`: an implicit column is sized to its content's
max-content width, and a horizontally scrollable row is wider than a phone.

## In a park, or next to one

When `/api/nearby` places the visitor inside a park (`in_park`, or the nearest park under 1 km) the
headline becomes „Herzlich willkommen im …"; within 5 km the general headline gets a „… ist in deiner
Nähe" line. Both render `HeroParkActions` (`components/home/hero-park-actions.tsx`), a 2×2 block:

| Cell           | Shows                                                | Leads to                                      |
| -------------- | ---------------------------------------------------- | --------------------------------------------- |
| „Heute planen" | today's date in the park's zone                      | the planner's wizard, park and today answered |
| „Zum Park"     | rides running (`operatingAttractions`)               | the park page                                 |
| Öffnungszeiten | today's hours (`formatHoursRange`), dot for open now | the park's crowd calendar                     |
| Wetter         | nowcast condition and temperature                    | `#weather` on the park page                   |

- **The park's slugs come from a ride**: the `in_park` answer carries no URL for the park, so
  `parkGeoFromUrl` reads them off the first ride URL, as `PlannerInParkCta` does.
- **„Heute planen" is the calendar's hand-off**: a `PlannerPageParkBeacon` is mounted with the block;
  the press files today with `plannerPageDay` and requests `page-park-wizard` (source `home-hero`), so
  the wizard opens on „Wer kommt mit". Today already planned: „Plan für heute" opens that day. Shut
  or already closed today: „Besuch planen", which asks for the date, with the next opening under it.
- **No intro sentence in the welcome variant** (it was six lines on a phone). The variant is
  client-only, so the served HTML keeps the general intro; it has three children like the general
  one, so the entrance stagger counts the same places.
- **One request of its own**: the nowcast, under the park page's query key, only for a visitor
  placed in or near a park.

### Under the hero: the headliners on a compass

For `in_park` (and `?sim=compass`), `ParkCompassSlot` puts the park's headliners on a compass right
under the hero, and the badge row carries „Zum Kompass" in the news chip's slot; all of it is in
[the in-park compass](park-compass.md).

## Nothing appears out of nowhere

Every live surface holds a placeholder in **exactly its final box**
(`components/home/hero-skeletons.tsx`). Measured CLS: **0.0095** on desktop and **0** on a throttled
phone, five runs each at 4× CPU / 1.6 Mbps.

| Surface         | Placeholder                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| Open-parks pill | one element whose content swaps (two elements shifted even at equal heights) |
| Nearby pills    | `HeroBubblesSkeleton` in the same `HeroBubbleRow`                            |
| World-map panel | `HeroWorldPanelSkeleton`, from the Suspense fallback and from the gate       |
| Search field    | `HeroSearchShell`, a real input                                              |
| Hero photo      | a 16 px inline preview of the same photo                                     |

- **The plate reserves its own height** (`md:min-h-[var(--hero-plate-min-h)]`, 784 px in
  `app/globals.css`): its later children arrive in a later chunk of the HTML, and on a slow link the
  half-parsed plate painted 328 px tall and grew 456 px (0.10 CLS in two of five runs) — nothing
  after hydration can prevent that. 784 px is the settled height in all six locales from 768 px up
  (fr at 1440 goes to 803); a min-height at or below the real height changes no finished layout.
- **The three states of the resting search card must be one height.** Shell skeleton, the panel's
  pending state and the settled three-park list had drifted to 252 / 288 / 270 px, and the pills
  hopped 19 px twice, seconds after load, with a green build. Both skeletons are now
  `SearchSkeletonList` (its own module, so the shell does not pull in `next/image`), with the row
  padding passed in; the footer hint is a static string; the panel does not measure a resting height
  while its list is pending. `pnpm check:hero-search-rest` compares all three in six locales.
- **The photo resolves out of itself**: a shared brand gradient under every photo changed 59 % of the
  hero box when the rendition landed, against 31 % for the photo's own preview (72 % vs 41 % on a
  second photo). The previews (~110 bytes each) are generated by `generate:media` into
  `lib/media/manifest-hero-lqip.ts`, **server-side only** and read through `heroBlurDataUrl()`
  (`lib/media/hero-lqip.ts`), since a page needs one preview and the table is ~7 KB. At that size the
  preview is below Chrome's LCP entropy floor, so LCP still measures the real photo.
- **The open-parks badge lives in one column at a time**: where the map panel shows (a 1280 px
  `@container/page`) it heads the panel as „N Parks weltweit offen" and the text column hides its
  copy; below that it stays above the headline. Both draw `OpenParksBadge`, and the panel's skeleton
  draws it pending, so the panel header has its real height before the map arrives.

## World-map panel

`HeroWorldPanel` (server seed) → `HeroWorldPanelGate` (client gate) → `HeroWorldPanelClient`.

- **Only from a 1280 px window and only after load + idle** (`useMediaQuery('(min-width: 1280px)')`,
  `useAfterLoad`): a decorative navigation aid must never compete with the photo for LCP. The column
  is `hidden @min-[1280px]/page:block`; the gate renders the skeleton on every viewport, because both
  its hooks are false during SSR and that branch is the server output.
- **Clicks go to the geo routes**: another continent switches the panel in place; the selected
  continent (bubble or landmass) navigates to `/parks/<continent>`; each country chip links to
  `/parks/<continent>/<country>`.
- A continent or country missing from a **successful** `useGeoLiveStats` response has zero open
  parks; only a failed fetch leaves it blank.

### The map data is generated

`lib/geo/world-map-data.ts` is written by
`node scripts/generate-hero-world-map.mjs` from `public/world.svg` (Simplemaps.com, MIT; 152 KB, one
path per country), because neither that file nor the server-only `lib/utils/geo-svg.ts` can reach a
client component. It groups country paths into one simplified silhouette per continent (~38 KB,
committed, not part of `prebuild`): specks dropped, rings simplified with Douglas–Peucker,
coordinates rounded. Russia goes with Asia and Greenland with North America, by landmass and so one
country does not stretch its continent's highlight across the map. **Trap:** Douglas–Peucker on a
closed ring needs the split-at-the-farthest-point variant; the open-polyline form takes first→last
as its baseline, which on a closed ring is one point and collapses every country to a dot. Look at
the rendered map; a green build says nothing.

## Motion

**The panels never animate** — not transform, opacity or filter. Each makes the panel a backdrop
root for as long as it applies, and a backdrop root has nothing left for its own `backdrop-filter`
to blur, so the glass switched on a beat after the panel arrived. The box stays put; its
**contents** carry the entrance. **Use `animation-fill-mode: backwards`, never `both`**: `both`
keeps the final keyframe (`transform: translateY(0)`, `filter: blur(0)`) on the element forever,
which keeps it a backdrop root — both hero panels and the search dropdown once computed
`blur(64px)` and did nothing (check by local contrast inside vs outside a panel: 0.98 against 7.73
is a real blur).

The entrance is a **CSS keyframe**, not GSAP: an entrance must own the first painted frame, and a
lazily loaded library either flashes or holds the hero blank. With `backwards`, a failed chunk
can never leave the hero invisible.

- **Plate contents**, one at a time (`hero-item-in`): drift in from the outer edge, rise, grow the
  last 3.5 % and resolve out of a 12 px blur over 0.85 s on a near-flat expo curve. `--hero-in-i`
  (position), `--hero-in-from` (where a column's sequence starts) and `--hero-in-x` (which side) carry
  the choreography; `.hero-in-late` on the right column mirrors them so the hero closes toward its
  centre.
- **The map's landmasses** (`hero-map-in`) sweep west to east, ordered by `BUBBLE_ANCHORS`' x
  (derived, not hard-coded); `transform-box: fill-box` grows each about its own box.
- **The continent bubbles** (`hero-pop-in`) pop on arrival only — switching continents remounts two
  bubbles, the two being looked at. `ENTRANCE_MS` (2100, `hero-world-panel-client.tsx`) must outlast
  the last thing on the map, the selected bubble's ring.
- **The selected continent**: `hero-map-lock` blooms its highlight once the sweep reaches it and
  `hero-bubble-ring` sends one ring out — `fill-opacity` and `box-shadow`, not `scale`, because the
  bubbles are centred by the standalone `translate` property.

**The entrance is a window, and it closes.** The badge, headline and intro stream into a dynamic
hole after the static shell; that is a DOM swap, so the arriving elements start their CSS entrance
again. On a throttled link the headline faded a second time around 2.5 s and handed LCP to that
fade (3.31–3.99 s against 3.34–3.38 s). So the entrance is scoped to `.hero-entering` on the hero
section, and `HeroEntranceGate` drops the class after `HERO_ENTRANCE_MS` from an **inline script**,
not an effect — hydration on a throttled phone lands after the swap. If the script is blocked late
content simply animates in. The section carries `suppressHydrationWarning` because the script and
React both write its `className` (only a development-build console message is at stake).

**GSAP is for interaction**: switching continents staggers the new country-chip row in
(`hero-world-panel-client.tsx`). The header's logo handoff over the hero is in
[header bar → one lockup, two copies](../design/header.md#one-lockup-two-copies).
Under `prefers-reduced-motion: reduce` every path bails out entirely, the pan included.

## Related

- [Caching strategy](../architecture/caching-strategy.md)
- [Routing and URLs](../architecture/routing-and-urls.md)
- [Design system](../design/design-system.md)
