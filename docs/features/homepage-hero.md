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
│ ● Europa-Park Ø41 min  ● Phantasialand …    │└──────────────────────────┘
└─────────────────────────────────────────────┘   xl (≥1280px) only
   │
   └── on focus, a FLOATING dropdown expands over the page below
```

Entry point: `app/[locale]/page.tsx`. Both columns are panels (`HeroTextPanel` /
`GlassCard variant="heavy"`) so the hero reads as one composition rather than text loose on a
photo next to a card. The left plate deliberately has **no** `backdrop-blur`: it covers most of
the hero, and a backdrop filter that large over the ken-burns photo means re-filtering the
backdrop every animation frame. The legibility scrim behind it does that work instead.

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

**The dropdown floats** (`absolute top-full z-40`) rather than sitting in the hero's flow. The
hero is vertically centred, so an in-flow list moved the headline on every keystroke as the
result count changed. Floating also lets it size to its content instead of a fixed height.

Two consequences worth knowing:

- The hero section carries **`z-10`** (and no `overflow-hidden`) so the dropdown paints over the
  sections below it. The sticky header is `z-50` and still wins.
- The dropdown is opaquer than the map panel. It lands on the nearby-park pills, not on the
  photo, and pill text ghosts through anything below ~97% even under `backdrop-blur-3xl`.

It opens on focus and closes on blur; `onMouseDown` preventDefault on the dropdown keeps focus
in the input, or clicking a result would blur-close the list out from under the click.

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
the layout is settled from first paint and the measured CLS is **0** on desktop and on a
throttled phone.

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
