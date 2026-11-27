# Homepage hero

The homepage hero: the rotating park photo over the full width, the question and the search on its
lower part, and on the photo a row of cards that answers the question, with the nearest parks as
chips above it while it shows rides. Open this when changing the
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
│  (● Efteling Ø 15 Min.) (● Phantasialand Geschlossen) (● …)  ← over rides   │
│  KURZE ANSTELLZEITEN IN DEINER NÄHE                         Alle anzeigen → │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  ← on the photo,     │
│ │ photo  │ │        │ │        │ │        │ │        │    which fades out   │
│ │ Taron  │ │ …      │ │        │ │        │ │        │    behind them       │
│ │ 5 Min  │ │        │ │        │ │        │ │        │                      │
│ │ ▬──────│ │        │ │        │ │        │ │        │                      │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                      │
│  ◎ Standort aktiv                                                           │
└────────────────────────────────────────────────── the photo ends here ──────┘
  ┌ the park's block, in or next to a park ┐
```

## The photo and its scrims

The photo runs under the header (`-mt-12` on the section) and stands as it is: no panel or glass over
it. `HeroBackground` (`components/layout/hero-background.tsx`) paints three scrims in the page's own
`--background`, so the photo runs into the page in either theme and the text above them takes the
theme's foreground: one under the header, one rising from the photo's foot behind the cards, the
field and the intro (`.hero-foot-scrim` in `app/globals.css`), and from `md`, where the text stays at
the left, one from the left.

- **Its height:** the photo fills one box with the text and the card rail, from under the header
  to the location row under the cards, so the cards stand on it on every viewport. The text's box
  is on a phone as tall as its text, which starts 32 px under the header (`pt-20`), and from `md` at
  least `min(40rem, 74svh)`, the text filling it from the bottom (`justify-end`). Its bottom padding
  is the room the card rail takes from it and the gap above the rail: `pb-16` against `-mt-10` on a
  phone, `pb-52` against `-mt-44` (176 px) from `md`. The park's block, which arrives after load,
  stands under the box, so the photo's crop never changes under the reader.
- **The foot scrim is measured from the foot, in `rem`, not in percent of the photo.** The rail
  and the text above it keep their distance from the foot at every window height: solid behind the
  location row, 90 % at 13rem, 80 % at 24rem (the rail's heading row), 50 % at 36rem (the intro),
  clear at 48rem. The light theme takes 88 % at the heading row, because its link colour reaches
  barely 5:1 on white. Measured on 2026-11-23 over all 53 hero photos at 390, 800, 1024 and 1628 px,
  in both themes, on the brightest tenth of the pixels behind each text: the rail's heading and
  „Alle anzeigen" keep 4.5:1 or better, and so does the intro, but on the brightest photo at 390 px
  (4.3:1) and 800 px (4.0:1), where it had 3.5:1 and 3.3:1 before. The percent scrim stretched
  over the taller box gave the intro 2.7:1 and the link 2.4:1 at 1628 px.
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
| The park chips                  | —                                | `useHeroBrowseParks`, client only |
| The card rail                   | —                                | `useHomeNearbyParks`, client only |
| Popular parks for the rail      | —                                | `/api/parks/popular`, client only |

The seed is cached a week in `lib/api/analytics.ts` and the route is `revalidate = 604800`; the
overlay polls on `LIVE_POLL_QUERY_OPTIONS` (five minutes). A shorter window on any seed fetch would
pin the whole six-locale homepage to it:
[a `revalidate` at a call site is somebody else's page](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md).
The intro is one `t.rich` message with `{parks, number}` / `{attractions, number}` and a `<strong>`
tag; a phone shows the one-line `home.hero.introShort`, and both are in the HTML.

**The column reserves its height from `md`, per language** (`.hero-text-reserve` in
`app/globals.css`): it stands on the photo's lower edge, so a column painted from half-parsed HTML
would grow upwards and move the headline
([a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md)).
One height for all languages left German and English 60 px of empty column above the card rail.
Measured on 2026-11-05, settled: 298 px at 800 px (French 328), 386 px at 1024 px (French 434), and
from 1280 px 397 px in German and English, 457 px in the other four, whose headline takes a third
line. Parky's row is included from 1024 px. A phone reserves nothing: the column is 197–280 px there
and arrives in the first chunk.

## Parky in the hero (desktop)

From a 1024 px window, under the headline, Parky stands 96 px tall beside a speech bubble: „Lass uns
schauen, wo wir uns heute anstellen!" and, smaller, „Klick mich an, ich helfe dir."
(`home.hero.parkyLine`, `home.hero.parkyCta`). Parky and the bubble are one button
(`HeroParky`, `components/home/hero-parky.tsx`) that opens the chat window
(`openParky('hero')`, counted as `assistant_opened` with source `hero`), into which he hops from
here. Below `lg` the row is not there.

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

## The park chips

`HeroNearbyChips` (`components/home/hero-nearby-chips.tsx`) stands under the search field while the
card rail shows rides: the five parks nearest the visitor as chips, each with a dot in its crowd
colour, its name and, while it is open, its average wait („Ø 15 Min."); shut, „Geschlossen", with
the next opening as the tooltip.

- **Only over a rail of rides**: the short waits, or the rides of the park the visitor stands in.
  When the rail shows parks itself („Parks in deiner Nähe", „Beliebte Parks"), the chips would
  repeat its cards, so they fade out (`invisible opacity-0`, kept mounted).
- **The search list's parks, in its order**: `useHeroBrowseParks`, open parks first, then by
  distance, so the chips cost no request of their own. In a park it is that park alone. The row's
  `<nav>` is always „Parks in deiner Nähe" (`nearby.nearbyParks`), not the list's heading: without a
  position that would be „Beliebte Parks", the name of the popular parks' `<nav>` further down.
- **It takes no room.** Whether the rail shows rides is decided by the nearby answer, after load, so
  the row floats (`h-0`, absolute) in the gap under the field, over the empty top of the rail's
  44 px heading row, and fades in and out without moving anything. 8 px under the field and 10 px
  over the rail's heading on a phone (28 px chips), 15 px and 10 px from `md` (32 px chips).
- **Under the text column, not in it**: the column is `max-w-5xl`, too narrow for five chips at
  1280 px; under it the row has the rail's width. Where five do not fit (a phone, a tablet, long
  names of shut parks) it scrolls sideways, to the screen's edges on a phone like the rail, and its
  right edge fades.
- **Glass and a fine border** (`border-foreground/25`), so a chip's edge does not run into the photo.
- **The crowd level is in the text too** (`sr-only`), for a reader who cannot tell the dots apart.
  Clicks count with block `nearby`, like the rail's.

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

- **A short-wait card** shows the ride's own photo, „35 Min kürzer" (usual minus now) on it on a
  blurred badge, since the badge's fill is translucent and the photo busy, the wait as the biggest
  figure and a bar of the wait against the usual one; the bar and „jetzt" take the wait's crowd
  colour (`waitTimeCrowdTier`). A walk-on (`isWalkOnWait`: 5 minutes or less; a posted 13 shows as 13)
  says „Walk-on" in that colour in place of the number, sized to the card (`15cqi`, at most
  `text-3xl`): at 1024 px five cards leave 148 px, and the French „Sans attente" took 189 px at
  `text-3xl`; „jetzt 0 Min" at the foot keeps the minutes, and a screen reader reads
  them there. The API picks the rides and says nothing when there are none, which is every evening
  and the whole off-season; below 15 °C felt at the park it leaves out a ride that gets its riders
  wet, whose queue is short only because of the cold (PAR-1420; contract in the API's
  [discovery](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/discovery.md#shortwaits)).
- **Every card can be starred**: `FavoriteStar` before the title, filled while the ride or park is
  a favourite, the same star as on the park and ride cards. It took the place of the amber star
  that marked a headliner, since a filled star now means a favourite.
- **A park card** shows the park's average wait while it is open with one badge under it, the crowd
  level (its average already says it is open). Shut, the figure says when it opens, on up to two
  lines (`SHUT_FIGURE_CLASS`):
  - later today, in green with the clock time: „Öffnet in 5:27 Stunden (08:00 Uhr)"
    (`nearby.opensTodayAt`, the time in `opensTodayAt` from `useHeroStatusLabels`);
  - in a break, a week or more away, as the park page's panel says it: „Winterpause" or
    „Saisonpause" with its icon, „Öffnet wieder am 25. März", the weeks left as a yellow pill at the
    foot and the panel's yellow edge ([break panel](park-break-panel.md#on-the-homepages-park-cards));
  - otherwise the day and time („Öffnet Samstag, 10:00 Uhr"), or the status („Geschlossen") where no
    opening is known, which is also where the park page shows no break.

  A popular park carries no live data, so its figure leads to its waits.

- **Photos**: a ride gets only its own, never the park's (`withRideCardImage`); without one it gets
  the brand cover (`BlogCoverFallback`). `withNearbyCardImages` attaches them to the short waits and
  the in-park rides, `/api/parks/popular` to the popular parks.
- **Every state has the same card box**: the photo strip, the title, the place line, the figure and
  the foot each have a fixed height, so the skeleton becomes the answer without moving anything. The
  skeleton stays until mount even with a cached answer, because the nearby query seeds from
  `localStorage` and the server rendered the skeleton.
- **The heading row** is `HeroBrowseHeader` (`tone="rail"`), the same as over the search list: its
  link leads to the park's page in a park, to the compass while that is on the page
  ([the in-park compass](park-compass.md)), and to `/parks` otherwise.
- **Under the cards** stands the location row (`HomeLocationRow`), at one height in every state: the
  button while nothing is decided, „Standort aktiv", or how to lift a block. The photo ends with it. The corner banner
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

**Under the browse rows, the visitor's starred parks** („Favoriten", at most four,
`useFavoriteParkRows`), in the hero and in the palette; a park the browse rows already list is left
out. They come from `useFavorites`' query, which the homepage's favourites band has already run, so
the list costs no request there; it does not poll. A click counts as `favorite_park`. „Recently
viewed" is not listed: nothing records which pages a visitor opened.

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

When `/api/nearby` places the visitor inside a park (`in_park`, or the nearest park under 1 km) or
within 5 km of one, `HeroParkActions` (`components/home/hero-park-actions.tsx`) stands under the
card rail, below the photo (`HeroRailParkActions`): four cells, 2×2 on a phone and one row from `md`, the park link carrying the park's name.
The hero's text stays the general one for everybody.

| Cell           | Shows                                                | Leads to                                      |
| -------------- | ---------------------------------------------------- | --------------------------------------------- |
| „Heute planen" | today's date in the park's zone                      | the planner's wizard, park and today answered |
| „Zum Park"     | rides running (`operatingAttractions`)               | the park page                                 |
| Öffnungszeiten | today's hours (`formatHoursRange`), dot for open now | the park's crowd calendar                     |
| Wetter         | nowcast condition and temperature                    | `#weather` on the park page                   |

- **At the hero's foot, on every viewport**, where it arrives without moving what is above it. From
  `md` it used to stand under the headline in a „Herzlich willkommen im …" variant, which arrived
  after load and moved the search field: 73 px up in a park, 6 px down next to one from 1024 px and
  142 px at 800 px. Measured with the nearby answer held back 3 s: CLS 0.018 in a park at 1024 px,
  0.030 next to one at 1440 px in French, 0.10 at 800 px; now 0.005 or less, the rest from the
  photo caption and the header. From 1024 px the rail ends below the first screen.
- **The park's slugs come from a ride**: the `in_park` answer carries no URL for the park, so
  `parkGeoFromUrl` reads them off the first ride URL, as `PlannerInParkCta` does.
- **„Heute planen" is the calendar's hand-off**: a `PlannerPageParkBeacon` is mounted with the block;
  the press files today with `plannerPageDay` and requests `page-park-wizard` (source `home-hero`), so
  the wizard opens on „Wer kommt mit". Today already planned: „Plan für heute" opens that day. Shut
  or already closed today: „Besuch planen", which asks for the date, with the next opening under it.
- **One request of its own**: the nowcast, under the park page's query key, only for a visitor
  placed in or near a park.

For `in_park` (and `?sim=compass`), `ParkCompassSlot` puts the park's headliners on a compass right
under the hero (below 1024 px under the news), and the rail's heading row carries „Zum Kompass"; all of it is in
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
