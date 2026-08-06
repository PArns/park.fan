# Homepage Hero

The homepage hero is a two-column layout over the rotating park photo: live headline and
search on the left, a clickable world map on the right. Every number in it is live.

```
┌─────────────────────────────────────────────┬───────────────────────────┐
│ ● 72 PARKS GERADE OFFEN        (glass pill) │  Parks in Europa   4 / 98 │
│ Wo lohnt sich heute das Anstehen?           │  ┌─────────────────────┐  │
│ park.fan zählt live an 218 Freizeitparks …  │  │  world map + one    │  │
│ ┌─────────────────────────────────────────┐ │  │  bubble per         │  │
│ │ 🔍 Europa-Park, Taron, Efteling …       │ │  │  continent          │  │
│ ├─────────────────────────────────────────┤ │  └─────────────────────┘  │
│ │ PARKS IN DER NÄHE                       │ │  [Deutschland 2 offen] …  │
│ │ Europa-Park   Rust · 98/104   Ø 41 min  │ │  Alle Parks in Europa →   │
│ └─────────────────────────────────────────┘ │                           │
│ ● Europa-Park 41 min  ● Phantasialand 24 …  │                           │
└─────────────────────────────────────────────┴───────────────────────────┘
                                                  xl (≥1280px) only
```

Entry point: `app/[locale]/page.tsx`.

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
  and results render **in place** in the card below it.

Both surfaces share their behavior, so a result can never look or route differently depending
on where it was clicked:

| Shared piece            | Module                                       |
| ----------------------- | -------------------------------------------- |
| Queries + debounce      | `lib/hooks/use-search-results.ts`            |
| Analytics + routing     | `lib/hooks/use-search-navigation.ts`         |
| Row rendering           | `components/search/search-result-items.tsx`  |
| Category grouping/order | `components/search/search-result-groups.tsx` |

**The result list has a fixed height** (`h-60`) whenever it has anything to show. The hero is
vertically centred, so a list that grew and shrank with the result count would move the
headline on every keystroke.

Before anything is typed the list shows `useHeroBrowseParks()`: the visitor's nearby parks
(with photo, live open-attraction counts and Ø wait), the current park's rides when they are
inside one, or — only when the nearby lookup including its GeoIP fallback comes back empty —
the most popular parks, so the list is never blank.

---

## Nearby bubbles

`HeroNearbyBubbles` renders the same `useHeroBrowseParks()` data as pills with a wait-time-
coloured dot (`CROWD_DOT_CLASS` + `waitTimeCrowdTier`, so a pill is green at 20 min and red past
an hour like every other wait time on the site). One shared hook means the bubbles and the
search list never disagree, and React Query dedupes them into a single request.

This replaced the marquee wait-times ticker that used to sit at the bottom of the hero
(`live-wait-ticker.tsx`); `/api/analytics/ticker` still exists for the admin dashboard.

---

## World-map panel

`HeroWorldPanel` (server seed) → `HeroWorldPanelGate` (client gate) → `HeroWorldPanelClient`.

- **Only mounts on `xl` (≥1280px) and only after load + idle.** The map is a decorative
  navigation aid; it must never compete with the hero photo for LCP. Below `xl` the right grid
  column simply does not exist.
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
generator groups the country paths into **one simplified silhouette per continent** (~28 KB
total): speck islands dropped, rings simplified with Douglas-Peucker, coordinates rounded.

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
