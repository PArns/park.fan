# Homepage hero

The homepage hero: the rotating park photo over the full width, the question and the search on its
lower edge, and over that edge a row of cards that answers the question. Open this when changing the
hero's text, its search field, its card rail, its photo or its motion. Entry point:
`app/[locale]/page.tsx`. Everything under the hero is [the homepage](homepage.md).

```
┌────────────────────────────────────────────────────────────────────────────┐
│ photo (HeroBackground), under the header                ┌─────────────────┐ │
│                                                         │ Silver Star     │ │
│  ● 31 PARKS GERADE OFFEN                                │ EUROPA-PARK …   │ │
│  Wo lohnt sich heute                                    └─────────────────┘ │
│  das Anstehen?                                                              │
│  park.fan zeigt die Wartezeiten von 210 Freizeitparks …                     │
│  ┌──────────────────────────────────────────┐                               │
│  │ 🔍 Europa-Park, Taron, Efteling …        │   list opens under it on focus │
│  └──────────────────────────────────────────┘                               │
│  KURZE ANSTELLZEITEN IN DEINER NÄHE                         Alle anzeigen → │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  ← over the photo's  │
└─│ photo  │─│        │─│        │─│        │─│        │──── lower edge ──────┘
  │ Taron  │ │ …      │ │        │ │        │ │        │
  │ 5 Min  │ │        │ │        │ │        │ │        │
  │ ▬──────│ │        │ │        │ │        │ │        │
  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
  ◎ Standort aktiv
```

## The photo and its scrims

The photo runs under the header (`-mt-12` on the section) and stands as it is: no panel or glass over
it. `HeroBackground` (`components/layout/hero-background.tsx`) paints three scrims in the page's own
`--background`, so the photo runs into the page in either theme and the text above them takes the
theme's foreground: one under the header, one rising from the lower edge behind the headline and
the field, and from `md`, where the text stays at the left, one from the left.

- **Its height:** on a phone as tall as its text, which starts 32 px under the header (`pt-20`);
  from `md` at least `min(40rem, 74svh)`, the text filling it from the bottom (`justify-end`). Its
  bottom padding is the room the card rail takes from it and the gap above the rail: `pb-16`
  against `-mt-10` on a phone, `pb-52` against `-mt-44` (176 px) from `md`, so the cards stand on
  the photo on either.
- **One photo per five minutes** (`pickHeroImage`), the same for every request in that window, so
  the shell stays cacheable. A visitor in a park gets that park's photos as a crossfade
  (`HeroRotationProvider`, `InParkHeroImages`).
- **The crop follows the photo's focal point** (`heroObjectPosition`, from the media database). From
  `md` the photo fills the width, so only the vertical crop can follow it.
- **The photo stands still.** The slow ken-burns zoom it once had went with Parky's arrival in the
  hero: with Parky, his bubble and the card rail moving, it was one motion too many, and every frame
  of it made the search field's glass re-filter what lay under it.
- **The photo resolves out of itself**: the first frame is a ~110 byte preview of the same photo
  (`heroBlurDataUrl`, `lib/media/manifest-hero-lqip.ts`, server-side only), below Chrome's LCP
  entropy floor, so LCP still measures the real photo.

**The caption** (`HeroImageInfoPanel`, from `lg`) stands in the photo's top-right corner under the
header, the part nothing else covers; it links to the park. A photo that is not ours gets its credit
under it, and in that corner alone where there is no caption.

## The text

`HeroTextPanel` holds the open-parks badge (from `md`), the headline, Parky's row (from `lg`), the
intro and the search field; its direct children are the entrance's steps. The headline is 40 px on
a phone (three lines at 390 px in German), 60 px from 640 px and 68 px from 1280 px, `font-black`.

| Value                           | Server seed                      | Client overlay                    |
| ------------------------------- | -------------------------------- | --------------------------------- |
| Open-parks badge + intro counts | `HeroStats` → `getGlobalStats()` | `useGlobalStats` (open count)     |
| The card rail                   | —                                | `useHomeNearbyParks`, client only |
| Popular parks for the rail      | —                                | `/api/parks/popular`, client only |

The seed is cached a week in `lib/api/analytics.ts` and the route is `revalidate = 604800`; the
overlay polls on `LIVE_POLL_QUERY_OPTIONS` (five minutes). A shorter window on any seed fetch would
pin the whole six-locale homepage to it:
[a `revalidate` at a call site is somebody else's page](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md).
The intro is one `t.rich` message with `{parks, number}` / `{attractions, number}` and a `<strong>`
tag; a phone shows the one-line `home.hero.introShort`, and both are in the HTML.

**The column reserves its height from `md`** (`md:min-h-[22.5rem]`, `lg:min-h-[27.25rem]`,
`xl:min-h-[28.25rem]`): it stands on the photo's lower edge, so a column painted from half-parsed
HTML would grow upwards and move the headline
([a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md)).
Measured on 2026-11-04, settled, in all six locales: 352 px at 768 px (Italian 323), 435 px at
1024 px (English 374) and 449 px from 1280 px, Parky's row included. A phone reserves nothing: the
column is 197–280 px there and arrives in the first chunk.

## Parky in the hero (desktop)

From a 1024 px window, under the headline, Parky stands 96 px tall beside a speech bubble: „Lass uns
schauen, wo wir uns heute anstellen!" and, smaller, „Klick mich an, ich helfe dir."
(`home.hero.parkyLine`, `home.hero.parkyCta`). Parky and the bubble are one button
(`HeroParky`, `components/home/hero-parky.tsx`) that opens the chat window
(`openParky('hero')`, counted as `assistant_opened` with source `hero`), into which he hops from
here. Next to a park the park's block takes his place; below `lg` the row is not there.

- **He stands here or in his corner, never both.** The slot registers with `parkyDock`
  (`lib/assistant/parky-dock.ts`) while all of it shows below the sticky header
  (`PARKY_TOP_CLEARANCE`), measured once on mount as well as by the observer. It is in the first
  HTML, since the hero renders with its counts (`HeroStats`, no `<Suspense>`), and Parky's button
  shows 150 ms after the page, so on a load at the top he simply stands here and the corner makes
  no entrance. Once the slot scrolls under the header Parky hops down into the corner, shrinking
  to its size, and back up, growing, when it returns (`parkyDockHop` in
  `lib/assistant/parky-jump.ts`, the arc of the hop into the window, 1.1 s). The hop is drawn
  frame by frame: on the way up it aims at where the slot is now, since the page is still
  scrolling, and no arc rises over the header. Its first frame and the slot giving him up land in
  one paint, and so do its last frame and the slot drawing him, in layout effects, so no frame
  shows him twice or not at all; arriving that way he does not fade in. A landing re-aims his eyes
  (`PARKY_LANDED_EVENT`). The chat window's hop starts and lands in the slot while it is on
  screen. Under reduced motion he changes places without the hop.
- **The slot draws him only while he is there** (`parkyInDock`): on his way, up in the window or
  in the corner it is empty and the bubble faded, so the bubble never speaks for an absent Parky.
- **Calm, as in the chat window** (`ParkyLogo idle calm`): his eyes follow the pointer, he blinks,
  looks around, searches along with an open search and dozes off, but takes no rides. The row is
  `h-28`, room for the hat and the Zs above his drawing.
- **The row reserves its height from `lg`** whether or not Parky comes (the rollout gate decides in
  the browser), so his arrival moves nothing. For a browser outside the rollout it stays empty.

## The card rail

`HeroRail` (`components/home/hero-rail.tsx`) answers the headline. From `md` it stands over the
photo's lower edge, five cards in a row from 1024 px and three from 640 px; on a phone it is a row
that scrolls sideways with the next card in view. What it shows, in order:

| State                                 | Heading                              | Cards                                                     |
| ------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| The nearby answer has `shortWaits`    | „Kurze Anstellzeiten in deiner Nähe" | the rides whose queue is well below its usual length      |
| Nearby parks, none with a short queue | „Parks in deiner Nähe"               | the nearby parks, open ones first, topped up with popular |
| Inside a park                         | „Du bist in …"                       | the park's rides with their waits                         |
| No position and no GeoIP answer       | „Beliebte Parks"                     | the reader's language's most viewed parks                 |

- **A short-wait card** shows the ride's own photo, „35 Min kürzer" (usual minus now) on it, the
  wait as the biggest figure and a bar of the wait against the usual one; the bar and „jetzt" take the
  wait's crowd colour (`waitTimeCrowdTier`). The API picks the rides and says nothing when there are
  none, which is every evening and the whole off-season (contract in the API's
  [discovery](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/discovery.md#shortwaits)).
- **A park card** shows the park's average wait while it is open with one badge under it, the crowd
  level (its average already says it is open); shut, its status as the figure („Öffnet am 6.
  November"). A popular park carries no live data, so its figure leads to its waits.
- **Photos**: a ride gets only its own, never the park's (`withRideCardImage`); without one it gets
  the brand cover (`BlogCoverFallback`). `withNearbyCardImages` attaches them to the short waits and
  the in-park rides, `/api/parks/popular` to the popular parks.
- **Every state has the same card box**: the photo strip, the title, the place line, the figure and
  the foot each have a fixed height, so the skeleton becomes the answer without moving anything. The
  skeleton stays until mount even with a cached answer, because the nearby query seeds from
  `localStorage` and the server rendered the skeleton.
- **The heading row** is `HeroBrowseHeader` (`tone="rail"`), the same as over the search list: its
  link leads to the park's page in a park, to the compass while that is under the hero
  ([the in-park compass](park-compass.md)), and to `/parks` otherwise.
- **Under the cards** stands the location row (`HomeLocationRow`), at one height in every state: the
  button while nothing is decided, „Standort aktiv", or how to lift a block. The corner banner
  (`LocationBanner`) asks from `md` only; a phone has this row instead.
- **Clicks** count as `internal_link_clicked` with block `nearby` and the card's park or ride.

## Search: one field, its list on focus

`HeroInlineSearch` (`components/search/hero-inline-search.tsx`) picks the surface once
`useMounted()` is true:

- **below `md`**: the field is the `SearchCommand` trigger (`trigger="hero"`, a button), which opens
  the full-screen `SearchDialog` palette, where typing happens with the phone's keyboard;
- **from `md`**: `HeroInlineSearchPanel`, a lazy desktop-only chunk loaded after load and idle while
  the field is in view; until then `HeroSearchShell` is a working input that hands its focus and
  typed text to the panel when it mounts.

**At rest the field stands alone.** Focus opens the browse list under it (the same rows the palette
shows, `useHeroBrowseParks`); three characters swap in the results; a blur closes it, and Escape
first clears a query, then closes the list while the field keeps its focus. The list floats
(`absolute z-40`) over the card rail and the page, so nothing in the hero moves when it opens, grows
or shrinks; its height eases (`useAnimatedHeight`) and it is capped to the room below the field
(`--hero-search-max-h`). It is never unmounted, because cmdk's `aria-controls` and
`aria-activedescendant` point into it.

- **The field and its list are one object**: `HeroSearchFrame` is one `GlassCard variant="heavy"`
  from the field's top edge down under the list, with the brand colour as its border and a soft
  ring of it that firms up on focus; the search icon is in the brand colour too. On the photo the
  field is the hero's one control.
- **Type anywhere**: from `md` a printable key with nothing focused starts a search in the field;
  `/` opens the palette on every page instead (`isSearchShortcut`, [site search](site-search.md)).
  Both follow
  [a keyboard shortcut waits for an unfocused page](../rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md).
- **Thumbnails come from the media database**: `/v1/search` knows nothing about our photos, so the
  `/api/search` proxy resolves them (`lib/utils/search-assets.ts`), as `/api/nearby` does.

The hero is the search surface `hero` on both viewports; each field has one session, which the
desktop panel and the phone's palette share. The events and their rules for every surface are in
[site search](site-search.md#what-is-counted).

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

- **From `md` it stands under the headline**, which then grows upwards over the photo; on a phone the
  hero's text stays the general one and the block stands under the card rail, at the hero's foot,
  where it arrives without moving what is above it.
- **The park's slugs come from a ride**: the `in_park` answer carries no URL for the park, so
  `parkGeoFromUrl` reads them off the first ride URL, as `PlannerInParkCta` does.
- **„Heute planen" is the calendar's hand-off**: a `PlannerPageParkBeacon` is mounted with the block;
  the press files today with `plannerPageDay` and requests `page-park-wizard` (source `home-hero`), so
  the wizard opens on „Wer kommt mit". Today already planned: „Plan für heute" opens that day. Shut
  or already closed today: „Besuch planen", which asks for the date, with the next opening under it.
- **No intro sentence in the welcome variant.** The variant is client-only, so the served HTML keeps
  the general intro; it has three children like the general one, so the entrance stagger counts the
  same places.
- **One request of its own**: the nowcast, under the park page's query key, only for a visitor
  placed in or near a park.

For `in_park` (and `?sim=compass`), `ParkCompassSlot` puts the park's headliners on a compass right
under the hero, and the rail's heading row carries „Zum Kompass"; all of it is in
[the in-park compass](park-compass.md).

## Motion

**Containers never animate**, only their contents: transform, opacity and filter each make an element
a backdrop root while they apply, and the search field's glass inside would lose its blur. **Use
`animation-fill-mode: backwards`, never `both`**: `both` keeps the final keyframe on the element
for good, and with it the backdrop root.

- **The text column's children**, one at a time (`hero-item-in`, `.hero-in-stagger`): drift in from
  the left, rise, grow the last 3.5 % and resolve out of a 12 px blur over 0.85 s. `--hero-in-i`
  (position) and `--hero-in-from` (where a sequence starts) carry the choreography; the card rail
  (`.hero-in-late`) starts once the text is under way.
- **The entrance is a CSS keyframe**, not GSAP: it must own the first painted frame, and with
  `backwards` a failed chunk can never leave the hero invisible.
- **The entrance is a window, and it closes.** The badge, headline and intro stream into a dynamic
  hole after the static shell, a DOM swap that would start their entrance again; on a throttled link
  the headline faded a second time and handed LCP to that fade. So the entrance is scoped to
  `.hero-entering` on the section, and `HeroEntranceGate` drops the class after `HERO_ENTRANCE_MS`
  from an **inline script**, not an effect. The section carries `suppressHydrationWarning` because
  the script and React both write its `className`.

The header's logo handoff over the hero is in
[header bar → one lockup, two copies](../design/header.md#one-lockup-two-copies). Under
`prefers-reduced-motion: reduce` every path bails out.

## Related

- [Caching strategy](../architecture/caching-strategy.md)
- [Routing and URLs](../architecture/routing-and-urls.md)
- [Design system](../design/design-system.md)
