# Header navigation

What the header bar links to: its entries, the full-width panels behind them (parks, guides, news,
„Mehr", favorites), the phone's burger sheet, and how the panels open and close. Bar geometry
(height, logo, the transparent-hero handoff, the phone row) is in
[header bar](../design/header.md) and
[the header rule](../rules/the-header-is-48-px.md). Why the
panels hold what they hold — the link-graph split, the glass, the favorites card widths, the
alert-removal order — is a standing rule:
[the header menu is three kinds of content](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md).
Code: `components/layout/header.tsx`, `nav-menu.tsx`, `menu-band.tsx`, the `*-menu-panel.tsx` files,
data from `lib/navigation/`.

The alerts group itself (bells, subscriptions, `/alerts`) is described in [ride alerts](ride-alerts.md).

## The bar

From left: the nearby-park chip, **Guides** (`/blog`), **News** (absent while a locale has no
news), **Parks entdecken** (`/parks`), **„Mehr"**, **Tagesplaner**, and the favorites star on the
right. The order is the phone sheet's, so the two menus are learnt once; the homepage has no entry,
the logo is its link. Each entry leads with the glyph its destination carries elsewhere, at 14 px
in the accent (`NavEntryLabel` in `nav-menu.tsx`, `icon` required on `NavMenu`): `Newspaper`,
`Megaphone`, `RollerCoaster`, `Ellipsis`, `CalendarPlus`. The sheet draws the same component at
`size="sheet"`. Measured on `/<locale>/parks/europe/germany`: one line in all six locales at a 1024
and a 1280 px bar, French the tightest at 47 px of slack at 1024.

- **`NavMenu`** is a real `<a>` (works without the panel) plus a chevron button. „Mehr" has no page,
  so `href` is optional and its label and chevron are one button. The bands are `hidden`, never
  unmounted, so their links stay in every page's HTML (`pnpm check:header-links`).
- **One breakpoint**: the nav starts at a 1024 px bar (`@min-[1024px]:flex`); below it everything
  lives in the burger. The search is a field on a 360–1023 px bar and from 1280, and an icon below
  360 and from 1024 to 1279
  ([the search field takes the slack](../design/header.md#the-search-field-takes-the-slack)).
- **The nearby-park chip** (`HeaderNearbyPark`, within `NEAR_PARK_HEADER_RADIUS_M` = 5 km of a park)
  is a 28 px `MapPin` circle below a 1280 px bar, the name in its `aria-label` and `title`; from
  1280 the name shows at `max-w-24`, from 1536 at 140 px. With the name it overflowed the 1024 px
  row in all six locales.
- `SiteNavigationStructuredData` (`components/seo/structured-data.tsx`, items built in
  `app/[locale]/layout.tsx`) lists the main destinations — parks, guides, news where there is any,
  best time, glossary, how-it-works, planner — then the continent hubs. A hint for Google, kept
  short: the country links stay in the markup only.

## How a band opens and closes

`useMenuTrigger` (`lib/hooks/use-menu-trigger.ts`) runs every trigger: hover opens, leaving closes
after 180 ms, click toggles. The open state is **the path it was opened on**
(`openedOn === pathname`, with the locale-stripped `pathname` from `@/i18n/navigation`), so a
navigation closes the band in the same render without a `setState` in an effect, and a locale switch
does not close it mid-gesture. A plain click on a link to the page already showing closes it too
(`closeOnSamePageClick` on `MenuBand`'s root; modifier clicks and new tabs excepted).

- **A blur closes only when focus goes somewhere named outside.** `focusLeftMenu`
  (`lib/utils/menu-focus.ts`, `pnpm test:menu-focus`) requires a `relatedTarget`: a button that
  disables itself while holding focus (the alert remove buttons during their DELETE) fires a
  `focusout` with `related=null`, which used to close the band under the click.
- **Escape closes all bands and returns focus to the trigger.** Focusing the trigger re-ran its
  `onFocus` open in the same commit; `closingRef` suppresses that one synchronous re-open.
- **Typing holds the band open**: while focus is in a text field inside the band (`holdsTextEntry`),
  leaving for the page does not close it; leaving for the bar still does.

`MenuBand` (`components/layout/menu-band.tsx`) is the one glass surface all bands share; its content
column uses the bar's own class list and it resets `whitespace-normal` (see the rule for both).

**Motion** (`lib/hooks/use-menu-reveal.ts`): CSS owns visibility (a `hidden` class), GSAP only moves.
`useMenuReveal` lifts `[data-menu-stagger]` targets 10 px over 0.4 s, `useRowReveal` re-settles the
parks detail row 6 px over 0.25 s each time it fills (its key includes whether the fetch landed, so
skeleton → cities animates), `useSheetReveal` slides the sheet's rows in along `x` — the axis the
sheet itself moves on. Targets are always descendants of the glass. The open restarts and closing
snaps. Zero GSAP requests on a plain page view; under `prefers-reduced-motion` the chunk is never
imported. `useMenuReveal` collects targets at any depth, so **never wrap a panel that has its own
`data-menu-stagger` targets in another one** (the tween ran twice and three steps late).

## The parks panel

`ParksMenuPanel`: five continent columns with their countries, server-rendered into every page; a
detail row of cities and parks fetched per country from `/api/nav/geo/[continent]/[country]` (once
per country per tab); a photo rail. Switching countries arms on enter and commits after
`COUNTRY_DWELL_MS`, so crossing countries on the way down to the detail row does not switch it; how
hover, focus and a failed request behave is in
[the rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md#what-else-is-load-bearing).
The detail row holds its height whether or not a country is open.

- **The photo rail** (`RAIL_SIZE` 6) shows the parks in
  [most read → popular parks](most-read.md#popular-parks), with the brand cover
  (`BlogCoverFallback`) where a park has no photo. Only the URLs cross into the Client Component;
  the pictures load when the band first opens.
- **Flags** are `CountryFlag`, a lookup over `components/common/icons/flags.tsx`, cropped to a fixed
  16×12 box (source viewBoxes range from 5:3 to 1000:700). Every country draws a flag — a code chip
  among flags reads as loading. Emoji flags are out because Windows ships no flag glyphs. Malaysia's
  and Singapore's stars are computed polygons; Saudi Arabia's shahada is a plain band, since at
  16×12 any path is an indistinct smudge.

## The guides panel

`BlogMenuPanel`, data from `getBlogMenu` (`lib/navigation/blog-menu.ts`, server-only, reads
`@/lib/blog/listing`): articles only (news has its own panel). The newest article as an opener and
four rows (`RECENT_LIMIT` 5) in `listArticlesByRecency` order, each printing the date it is sorted
by — „Aktualisiert …" (`navigation.updatedOn`) for an update, the bare date for a publication
(`pnpm test:news-split`; what moves `updatedAt` is [its own rule](../rules/updated-at-is-for-new-content.md)).
Every row carries its category in the opener's accent, and a 128 × 80 thumbnail. Teasers are cut on
the server (`trimExcerpt`), because the text ships in the chrome of every page. One heading over both
columns, a `MenuSectionHeading` linking `/blog`; the categories as a pill row along the bottom with
`MenuAllLink` („All posts", the count). No tags. A third column ranks the most read
(`MostReadMenuColumn`, also in the news panel), fetched from `/api/nav/most-read/[locale]` when the
band first opens (`useMenuBandOpen`); see [most read](most-read.md). If the front of the list ever
turns over weekly, move it to a fetch as the parks panel did with its cities.

**The search field** sits on the heading rule (`MenuSectionHeading`'s `aside`). Two letters or more
swap both columns for the matching articles, best first, down two columns of four
(`BLOG_MENU_SEARCH_LIMIT` 8); the heading shows the hit count and a polite live region says it.
Enter opens the first hit; the first Escape empties the field, the second closes the band. The
columns read a `useDeferredValue` copy of the query. The list and its matching are the
[site search](site-search.md)'s, fetched once per tab on the first pointer or focus and narrowed to
articles (`usePostSearchIndex(armed, 'articles')`); in the chrome the index would cost every page
view, so the chrome only carries the field's four strings.

The entry is labelled with the guides category's own name from `content/blog/categories.json`
(Guides, Gidsen, Guías, Guide) through `navigation.blog`, which three places print (see the rule).

## The news panel

`NewsMenuPanel` (`lib/navigation/news-menu.ts`): see the rule and
[news is set apart](../rules/news-is-set-apart-from-the-articles.md).

## „Mehr"

A catch-all trigger with no page, named „Mehr" rather than „Entdecken" (which would stand beside
„Parks entdecken", and „Explorer" beside „Explorer les parcs"). Why the bar needed it is in the
rule.

### Three hubs, each with what it holds

`MoreMenuPanel` is a flat `grid-cols-3`, one column per hub, each a photo (the hub's link,
name and a two-line hint on it) over a list of what the hub holds:

| Column            | Photo                                  | List                                                                     |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Wörterbuch        | Fenix (Toverland), with the term count | the glossary categories with counts, `/glossar#<category>`               |
| Beste Reisezeit   | Symbolica, the hub's own hero          | its chapters (`lib/best-time/chapters.ts`), then the Fancast card        |
| So funktioniert's | Wintertraum, the guide's own hero      | its chapters (`lib/howto/chapters.ts`), `/so-funktioniert-park-fan#<id>` |

- The lists are fragments on their hub, which a crawler reads as the hub, so they add markup and no
  crawl target (`lib/navigation/glossary-menu.ts` lets categories in, never terms). The chapter lists
  are the arrays the pages render; `pnpm test:hub-chapters` compares them with the pages'
  `<SectionShell id=… index=…>` calls, since a fragment naming no element fails silently.
- Everything is resolved for one locale in the layout (`lib/navigation/more-menu.ts`) and handed to
  the header as props, because the header is a Client Component; chapter labels are data, not
  messages. The chrome carries only `navigation.more`, one hint per hub, `navigation.fancastHint`
  and `navigation.overview` (a hint that grows into a paragraph belongs in a lazy namespace).
- Measured: the band is 591 px tall in all six locales at 1024 and 1440 px, the three lists end
  within a row of each other, no label is cut. The text on the photos sits on a `via-black/65`
  scrim at 45 % (names 4.98–5.91 : 1 over the lightest pixel; the earlier `black/45` midpoint gave
  3.23 : 1); every hint reserves two lines so the names stand level. Cost: about +0.8 KB brotli on
  every page (two production builds, cache-busted, median of three); links in the main `<nav>` went
  79 → 96, distinct pages unchanged.
- **Hover is the border and nothing else**: `hover:border-primary` measures 3.46 : 1 (light) /
  5.31 : 1 (dark) against the card where `/40` gave 1.60 / 1.81; `group-hover:text-primary` on the
  title would drop it to 3.47 : 1, and a visible `bg-primary/5` took the 13 px hint under 4.5 : 1.
  Photos scale under the pointer instead.

### The footer row

`MoreMenuLinks` (`components/layout/more-menu-links.tsx`) is one definition for
two hosts, each entry naming its `hosts`: in the band a row of pills — „Meine Alarme", „Meine
Favoriten", „Fotos hochladen" — and at the foot of the phone sheet 44 px text links — „Meine
Alarme" and „Fancast". `/contribute` is panel-only (nobody opens the phone menu for it; it stays on
every park and ride page's banner), `/favorites` too (the sheet's favorites panel already links it),
`/fancast` sheet-only (the band has its card). The alerts label reads `pushAlerts.menu.link`, not a
second identical `navigation.alerts`. The sheet row has a `gap-y` so two wrapped 44 px targets do
not abut.

## The favorites band

The star opens the same `MenuBand` as its neighbours, with the same `useMenuTrigger` hysteresis
(`FavoritesMenu`, `favorites-menu-panel.tsx`). It exists because favorites were otherwise visible
only on the homepage, and from a park page — where the star is pressed — nothing led back.

- **The star is always rendered**, at zero favorites too: the actions row is server-rendered and the
  cookie is readable only after mount, so a control appearing after hydration would push the
  preferences and the burger aside. It has no link: `/favorites` answers every reader differently.
- **The request runs on opening** (`useFavorites({ enabled: open && counts.total > 0, poll: false })`):
  the header renders on every page, and the homepage shares the query key.
- **Its own cards, not `ParkCard`/`AttractionCard`**, which would pull `parks` and `attractions` into
  every page's chrome; the panel reads `favorites`, `common`, `geo`, `navigation` and
  `pushAlerts.menu`. In the burger sheet the favorites are rows.
- **Card widths** come from `planBand` (`lib/utils/favorites-band-plan.ts`, `MAX_CARD_ROWS` 2,
  `pnpm test:favorites-band`); why, in the rule.
- **The empty state** is the same panel as the filled one: the same header row (left „★ Noch keine
  Favoriten", right the personal links and „Parks entdecken"), the three steps of `FavoritesHowTo`
  (`components/parks/favorites-how-to.tsx`, shared with the homepage's empty band) as three columns
  across the band, and park suggestions left-aligned. The how-to names no position for the star — it
  sits in a corner on a card and elsewhere on a park page.
- **Both personal pages are reachable from every state.** `/favorites` and `/alerts` are `noindex`
  and in no sitemap, so the menu (and the footer, `footer.favorites`, `footer.alerts`) is where they
  are linked: every state carries `PushAlertsMenuLink` and `FavoritesPageMenuLink`, except that the
  sheet suppresses the alerts link (`!isSheet`) because the sheet's footer row already carries it.
  Their tab titles carry the brand through their own keys (`favoritesPage.metaTitle`,
  `pushAlerts.overview.metaTitle`), because `title` is also their `<h1>`.

### The alerts group

A fourth group lists this browser's ride alerts and show reminders across parks, each with a remove
button (`components/layout/favorites-menu-alerts.tsx`), band only — the 300 px sheet keeps the link.
Gated on `countPushFollowsLocal()` (0 on the server) and loaded with `React.lazy`, as
[the rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md) requires, so a
visitor who never pressed a bell loads neither the chunk nor a request; the list itself is the
server's (`usePushFollowsList`). `React.lazy` rather than `next/dynamic`, because the `Suspense`
fallback at the call site reserves as many rows as the local count says. Its strings stay in
`pushAlerts.menu` (layout chrome, +68 B brotli per page for all nine keys) rather than pulling
`pushAlerts.pushErrors` in through `usePushErrorMessage`, which `/alerts` uses because there a route
pays. Removal and a failed identity lookup follow the same rule (`usePushFollowRemoval`, shared with
`AlertsOverview`).

## The phone sheet

The burger opens a Radix sheet, which **unmounts when closed**, so none of its links are in a page's
HTML (the desktop `<nav>` is `display:none` below its breakpoint and still read). Everything in it
duplicates the desktop nav; put nothing unique there. From the top:

- the three preferences (the bar does not carry them on a phone, see
  [header bar → on a phone the preferences live in the menu](../design/header.md#on-a-phone-the-preferences-live-in-the-menu));
- the nearby park (`HeaderNearbyPark variant="sheet"`);
- the newest news post as a `LatestNewsChip` card — label and date, the headline on two lines and
  two to three lines of teaser (the hero's one-line chip left three words of the headline in a 300 px
  column);
- the favorites panel (`variant="sheet"`), before the destinations: a returning visitor's own parks
  are the shortest route out;
- the destinations through `SheetNavLink`, each with its glyph in the accent: Guides, News,
  Startseite (`House`), then `SheetDisclosure`s — Parks entdecken (`/parks` and the continents), and
  each of the three hubs, whose first row is the hub itself („Übersicht", `navigation.overview`) and
  then its categories or chapters with the band's numbers, in the band's order — and the planner.
  The disclosure row is the toggle, not a link beside a chevron;
- the footer row (`MoreMenuLinks variant="sheet"`), **outside** the scrolling list on the sheet's
  bottom edge with `pb-[max(0.25rem,env(safe-area-inset-bottom))]` (the `env()` half reads 0: the
  viewport does not opt into `viewport-fit=cover`, so the browser keeps the page above the home
  indicator).

The sheet's `<nav>` (named by `navigation.mobileNavigation`) and `useSheetReveal`'s root wrap both the list and the
footer, so the footer's links are in the landmark and slide in with the rows. **The list never
scrolls sideways**: `overflow-y: auto` makes `overflow-x` auto too and a favorites row bleeds 8 px
(`-mx-2`), so the list is `-mx-2 px-2 overflow-x-hidden` (verified at 320/360/390 px with three
parks saved). A tap on a link to the page already showing closes the sheet (`closeOnSamePageTap`);
a locale switch keeps it open and a modifier click opens a tab without closing it.

## Related

- [Internationalization → which namespaces reach the client](../i18n/internationalization.md#which-namespaces-reach-the-client)
- [API budget per page](../architecture/api-budget.md)
- [Most read](most-read.md), [site search](site-search.md)
