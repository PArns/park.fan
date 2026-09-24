# Header navigation

The bar's entries, the panels behind them, and why the panels stop where they do.

Geometry (heights, the logo, the transparent-hero handoff) lives in
[design system → header geometry](../design/design-system.md#header-geometry). This is about what
the bar links to.

---

## What was missing

Before this, the header offered four links: Blog, "Parks entdecken", Wörterbuch, Anleitung. Three
things were wrong with that list.

**"Parks entdecken" pointed at `/parks/europe`.** Not at the discovery index — past it, into one of
its five children. `/parks` itself was reachable from the footer and from inside the hub pages, and
from nowhere in the chrome. `messages/*.json` had been carrying an unused `navigation.parks`
("Alle Parks") the whole time.

**The best-travel-time hub was not linked at all**, and the header _knew_ about it: `isBestTime`
matches the localized segment so the bar can float transparent over that page's hero. It could
name the route and would not link it.

**On a mobile-first render the header contributed no navigation.** The desktop `<nav>` is
`display:none` below its breakpoint — Google still reads links there, so nothing was lost — but the
burger's `SheetContent` is a Radix dialog that unmounts when closed, so those links are not in the
document at all. Everything in the sheet happened to duplicate the desktop nav, so no unique URL
was lost; it is worth knowing that the sheet is invisible to a crawler before putting anything
unique in it.

---

## The parks panel: a full-width band

```
┌──────────────────────────────────────────────────────────┬───────────────────┐
│ NORDAMERIKA 85  ASIEN 72     EUROPA 49    OZEANIEN 5     │ BELIEBTE PARKS    │
│ 🇺🇸 USA     81  🇨🇳 China 57 🇫🇷 Frankr. 10 🇦🇺 Austral. 5 │ ┌─────┐ ┌─────┐   │
│ 🇨🇦 Kanada   2  🇯🇵 Japan  5 🇩🇪 Deutschl. 9              │ │Europa││Phant│   │
│ 🇲🇽 Mexiko   2  …            …             SÜDAMERIKA 1  │ └─────┘ └─────┘   │
├──────────────────────────────────────────────────────────┴───────────────────┤
│ 🇩🇪 DEUTSCHLAND                                     2 weitere Städte →        │
│ RUST            BOTTROP        BRÜHL        GÜNZBURG     HASSLOCH            │
│ Europa-Park     Movie Park     Phantasial.  LEGOLAND     Plopsaland          │
│ Rulantica                                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
   all 28 links in the HTML          fixed set              fetched on hover
```

Full width removed machinery rather than adding it. The first version was a narrow box with a
continent rail that swapped one country list in for another, so four of the five lists were
`display:none` at any moment and the panel needed an `activeContinent`. At the container's width
all 28 links fit side by side: nothing to switch, nothing hidden, the whole geography in one look.

Three kinds of content sit in there, and the difference is the whole design:

|                        | where it comes from             | why                                                 |
| ---------------------- | ------------------------------- | --------------------------------------------------- |
| continents + countries | server-rendered into every page | 28 hub links worth concentrating sitewide weight on |
| the photo rail         | server-resolved, fixed six      | only 14 of 212 parks have a picture at all          |
| cities + parks         | fetched when a country opens    | 356 more sitewide links would buy no discovery      |

**The link split.** Everything in the header is a link on ~35,000 pages:

| Depth                  | raw      | brotli  | sitewide links |
| ---------------------- | -------- | ------- | -------------- |
| continents + countries | 1.3 KB   | 420 B   | 28             |
| + cities               | 7.4 KB   | 1.97 KB | 172            |
| + parks                | 19.9 KB  | 4.67 KB | 384            |
| the whole geo payload  | 168.6 KB | 16.8 KB | —              |

28 hub links concentrate internal weight on the continent and country pages, which is the point of
having geography in a header. The 144 cities and 212 parks below them are already reachable from
those hubs and from the sitemap, so putting them in the template would spread the same weight over
356 more targets and buy no discovery. That is why the detail row is a fetch
(`/api/nav/geo/[continent]/[country]`, once per country per tab) rather than more markup.

**The photo rail is a fixed six, not a thumbnail per park.** The media database holds a picture
for 14 of 212 parks and a `park-background` for nine of them, so a photo on every row would have
been nine pictures and two hundred empty boxes. Six rather than four because the five country
columns are taller than two rows of cards were: at four the rail ended halfway up and left a hole
beside Europe's eleven countries. Which four: the homepage's per-locale
`FEATURED_PARK_SLUGS`, intersected with the parks that have a photo — a second curated list would
be a second thing to keep in sync, and the question "which parks does a German reader want" was
already answered once, with visitor numbers in the comments. Resolved in the layout, because
`@/lib/media` is the 107 KB catalog and the header is a Client Component; only four URLs cross that
boundary. The pictures are requested when a visitor opens the menu and not before — verified: three
photo requests on a plain park page, seven after opening the panel.

**Flags come from the set that already existed.** `components/common/icons/flags.tsx` had 20 of the
23 countries for the locale switcher; `CountryFlag` is a lookup over it, cropped to a fixed 16×12
box because the source viewBoxes range from 5:3 to 1000:700 and a row of un-cropped flags is a row
of different widths. Saudi Arabia, Malaysia and Singapore have artwork now too, so all 23 draw a
flag — a code chip in a row of flags reads as a loading state, not as a country. Malaysia's
fourteen-point star and Singapore's five are computed polygons rather than eyeballed. Saudi
Arabia's shahada is deliberately **not** an approximation of the calligraphy: at 16×12 the
inscription is under 2 px tall and renders as an indistinct white smudge whichever path you draw,
so it is a band, and the sword below it does the identifying. Emoji flags were the short route and
are why that file exists: Windows ships no flag glyphs, so `🇩🇪` renders there as the letters "DE".

Three details that are easy to break again:

- **The panel is positioned against the `<header>`, not against its trigger.** Centred on the
  trigger, a 700 px panel hanging off an entry 276 px from the left edge starts at −36 px.
- **The band carries `overflow-hidden`.** Its rows use `-mx-2` so the hover highlight reaches into
  the column gaps, and at exactly 1024 px — where the container is as wide as the viewport — the
  last column's 8 px of bleed gave the document a horizontal scrollbar.
- **The detail row holds its height** whether or not a country is open. It fills in under the
  pointer as the fetch lands, and a band that resized while somebody was reading it would be worse.

### Hover has to be rested on, not crossed

The detail row sits under the country columns, so the way to it from any country leads over the
countries below it. Switching on `pointerenter` rewrote the row two or three times during that trip
and landed on whichever country happened to be last — the row was effectively unreachable for the
country somebody actually wanted.

Entering a row **arms** the switch; leaving before 140 ms disarms it. Rest on a country and it
commits, cross it on the way somewhere else and it never fires. Focus is exempt: a keyboard user
lands on exactly the country they meant, so it commits immediately.

That gesture also broke the fetch, and the two bugs were the same bug. The effect discarded its
response on cleanup (`cancelled = true`) while leaving the key in `requested` — so skimming past a
country threw its answer away, the guard then refused to ask again, and the row sat on its skeleton
for the rest of the session. Every country on the way down to the detail row is one you skim past,
so it happened constantly. The response is a **cache write keyed by country**: it is the right
answer whatever is hovered by the time it lands, so nothing cancels it any more, and a failed
request drops its key so the next hover can retry instead of caching the failure. Measured over all
23 countries, hovering one, moving on before the answer lands, then coming back: **23 of 23 stayed
empty before, 0 of 23 after**.

## The blog panel: three categories, six posts, no tags

It hangs off a bar entry of its own, labelled **"Backstage"**. It spent one release inside the
"Mehr" panel, as the block the three reading-material sections stood beside — see
["Backstage" comes back out of "Mehr"](#backstage-comes-back-out-of-mehr) for why it did not stay
there.

Fully server-rendered — the blog manifest is a build-time artifact, so there is no fetch and no
loading state, and it is ten links. The six posts (`RECENT_LIMIT`) carry their own cover images,
which is where
this differs from the parks rail: those had to be a curated four because 14 of 212 parks have a
picture, here the coverage is 7 of 7 and the covers are already 16:9 crops.

**One heading over both columns.** There were two — "Neueste Beiträge" over the opener and "Blog"
over the rows — for one list of posts drawn in two shapes, and the second of them repeated the word
that labels the entry the panel hangs from. It is a `MenuSectionHeading` now, the rule the parks and
"Mehr" bands already draw, and it is the panel's link to `/blog` under the same "the heading IS the
link" rule those two follow. The separate "Alle Beiträge" link went with the second heading;
`navigation.allPosts` had no other reader and is out of all six locale files.

**Every row carries its category**, in the same small uppercase accent the opener beside it uses.
The reference is that opener and deliberately not `BlogPostRow`, which sets the category in
`text-muted-foreground` (and the post card in `var(--pk-text-3)`): those are elsewhere on a page,
these two sit side by side in one band, and two tones for one field in one surface is a surface you
read twice. This was the one place the site listed posts without a category at all. The
row is four lines of text instead of three now, so its thumbnail goes 112 × 70 → **128 × 80**: the
old size was tuned to the three-line height, and an image shorter than its own row hangs out of the
bottom of it.

That was a data change before it was a layout one: `getBlogMenu` resolved `category` under an
`index === 0`, so only the opener carried the field at all and a row had nothing to draw. The
comment beside it priced the alternative as "five more strings in the chrome of every page". The
labels are three category names repeated — five of the six rows here read "Guides" — so the measured
cost on a country listing page is **+517 B raw, +36 B gzip-9**. (gzip-9 rather than brotli: the
container has neither the binary nor the module. The park page in the same pair came out 378 B
_smaller_ compressed, which is the re-chunking CLAUDE.md warns about rather than a saving, so the
listing page is the number to read.)

The blog holds 7 posts per locale across **3 categories** (guides 5, behind-the-scenes 1, news 1),
**31 tags** and one author. So the categories are in, the six newest posts are in, and **the tags
are out**. 31 tag pages over 7 posts means most of them are one post's teaser under a second URL;
promoting that set into a template that runs on ~35,000 pages hands sitewide weight to the pages
worth the least and dilutes what the three category hubs get. Tags stay on the posts that carry
them.

The "latest posts" pane changes the template's link set whenever something is published. At a
handful of posts a year that costs nothing. If the front of that list ever turns over weekly, move
the pane to a fetch the way the parks menu did with its cities.

One label, one rule worth repeating: the heading says "Kategorien" out of `navigation`, not out of
`blog`. The layout's chrome namespaces are derived from the import graph, so a single
`useTranslations('blog')` in a header component pulled the whole `blog` namespace into the set that
every page serializes — 6066 B of chrome JSON became 9047 B, times six locales, for one word.

### Flat, not opaque

The band is one glass surface with the bar above it: `bg-popover/95` + `backdrop-blur-xl`, plus the
ring `components/ui/popover.tsx` already carries. "Flat" rules out the pointer-depth tilt and the
layered glass cards the pages use — not the blur. What shows through is the photo the menu is
covering, which is the point of opening over the page rather than replacing it.

`/95`, though, not the `/80` the small popovers use. Those sit over a card or a margin; this one
covers half a park page, and at 80 % the headline, the status badges and a paragraph of body text
read straight through the menu and fought with it, in both themes.

---

## "Mehr": one entry for everything that is reading material

The row ran out of width. Six equal entries (Parks entdecken, Blog, Beste Reisezeit, Wörterbuch,
So funktioniert's, Tagesplaner) plus favorites, search and the three preference buttons in one
48 px bar, measured on `/parks/europe/germany` against the content box of the header row:

| container | locale |                         before |                           after |
| --------- | ------ | -----------------------------: | ------------------------------: |
| 1024 px   | de     |                       +26.3 px |                   **+351.6** px |
| 1024 px   | fr     | **−23.7 px**, document 1032 px | **+346.8** px, document 1024 px |
| 1280 px   | de     |                       +34.3 px |                   **+377.6** px |
| 1280 px   | fr     |                        +0.0 px |                   **+372.8** px |
| 360 px    | de, fr |                       +27.2 px |                        +27.2 px |

French at 1024 px was **over** its box and gave the document a horizontal scrollbar on every page,
and at 1280 px it had nothing left. The nav row itself goes 667 → 342 px in German and 718 → 347 px
in French.

360 px does not move and cannot: the nav is `@min-[1024px]:flex`, so at a phone's width it does not
exist. The ~25 px of slack the
[header geometry requirement](../design/design-system.md#header-geometry) counts there is the
actions row — lockup, search, locale, theme, °C/°F, burger — and none of this touches it. (Since
PAR-434 a phone's row is lockup, search, planner, burger; the three preferences moved into the
sheet.)

Four entries moved one level down, behind a trigger with no page of its own. Three of them are
still there: **Beste Reisezeit**, **Wörterbuch** and **So funktioniert's**, a heading and a line
each. Their lists are separate tickets; the heading IS the link, which is what keeps all three hub
URLs in the HTML of every page. The fourth, the blog, came back out — see below.

**Each of the three is a card** — icon tile, name, one line — and the whole card is the link,
which is what keeps all three hub URLs in the HTML of every page.

**The three are one height, and they are grid items to get it (PAR-290).** A grid item stretches to
its row by default, so they would have agreed all along; each sat in a wrapper `<div>` instead, and
in the dictionary's cell that wrapper holds the card _and_ the category rows, which is why an
`h-full` on the card is the wrong fix — it would stretch the card over the rows there. The wrapper
is gone and the rows are a grid item of their own in the second row, at the column
`sections.findIndex` puts them in. A card is 116.4 px while its hint fits one line and 137.5 px on
two: German wrapped the guide's hint (116.4 / 116.4 / 137.5 at a 1440 px bar), French the
dictionary's (116.4 / 137.5 / 116.4), English none of them, so which edge stuck out was a property
of the translation. Measure this with the webfont loaded — "Geist Fallback" is wider, and a reading
taken before `document.fonts.ready` wraps lines the built page does not. It costs the band 23.1 px
at 1440 px, once, above a list that is ~330 px tall: the card row is the tallest card now, and the
10 px margin over the category list became the grid's 12 px gap.

**One mark, two layouts.** The card's glyph sits in a tinted `size-9` tile above its title; the
footer row's sits inline before the label, in the same accent, because a row is a line and has no
block to hold a tile. The row's label stays muted, which is where its lower rank lives.

**The sections cost four strings in the chrome, and the chrome is serialized by every page.**
`navigation.more` plus one hint per section, measured against the namespace without them when there
were four of each: **+103 B brotli** in English, +128 es, +143 nl, +146 it, +148 de, **+151 fr**
(raw +283 to +325); `navigation.blogHint` has since come out with the blog section. They are in
`navigation` rather than in `bestTime`/`glossary`/`howto` for the reason `BlogMenuPanel` already
carries in its own comment: one `useTranslations('blog')` in a header component once took the
layout's chrome JSON from 6066 B to 9047 B, times six locales, for a single label. A hint that grows
into a paragraph belongs in a lazy namespace, not here.

Two decisions worth keeping:

**It is called "Mehr", not "Entdecken".** "Entdecken" would have stood 101 px from "Parks
entdecken" in the same row, and in French put "Explorer" beside "Explorer les parcs". It is a
catch-all — `/alerts`, `/favorites`, `/fancast` and `/contribute` sit in here too, in the footer
row below — so it is named after being one, and it sits at the END of the row's three entries,
where a catch-all belongs.

**The footer row is `MoreMenuLinks`, and it renders twice.** Three of those pages had no link from
the header at all: measured before it was added, a grep over `components/layout/` found `/fancast`
once (the footer) and `/alerts` once (the favorites panel), and `/contribute` **nowhere**. They are
a row under the panel's closing rule rather than a column of their own, because a column would rank
an upload form with the guide and the dictionary, and because the panel already switches column
shape at 1280 px — a further member would have to be fitted into both layouts, a row is one element
in either. No heading over it: a heading in this panel is a link to a hub page, and these have none
above them.

The same component renders at the foot of the **burger sheet**, and that is not a second surface
for the sake of it — the nav row that carries the panel is `@min-[1024px]:flex`, so without it
those three stay unreachable from the header on every phone. One definition,
`variant="panel" | "sheet"`, differing in type scale and in which entries it carries — the next
paragraph is the one entry that differs.

**`/favorites` is the fourth entry, and the one the sheet does not get (PAR-290).** It is labelled
from `favorites.link` and marked with the `Star` that `FavoritesPageMenuLink` already gives that
URL, so no new string ships. It carries `panelOnly`, because that panel links `/favorites` in every
sheet state — including the empty one, where the branch adds it back deliberately — and an
unconditional entry here would stand under it as a second "Meine Favoriten" in a 300 px column.
That is the duplication the `/alerts` bullet below measured, solved from the same side. In the
panel there is no such pair: this band and the favorites band are never open at once. Measured at
360 px afterwards: `/favorites` appears once, and the panel's four entries stay on one line with
≥525 px of slack at a 1024 px bar in all six locales.

Two things the second host cost, both measured rather than reasoned:

- The sheet row wraps to two lines in **all six locales at 320 and 360 px**, so it needs a `gap-y`:
  without one, two 44 px tap targets abutted at exactly 0 px. It is 4 px in all twelve now.
- `/alerts` was then in that 300 px column **twice** — the favorites panel's own
  `PushAlertsMenuLink` carries the same destination, the same `Bell` and, in all six locales, the
  same string. Measured with one favorite at 360 px: y = 104 and y = 547. The favorites panel's
  copy is therefore suppressed in the sheet (`!isSheet`) and kept in the band, where that panel and
  the "more" panel are never open at the same time.

And the row's alerts label reads `pushAlerts.menu.link`, not a `navigation.alerts` of its own.
The two would be byte-identical in all six locales, both namespaces are already in
`LAYOUT_MESSAGE_NAMESPACES`, and a second copy is the same string serialized on ~35,000 pages
× 6 locales with nothing keeping the two in step.

**`NavMenu.href` is optional for this one entry.** Every other trigger is a real `<a>` that works
without the panel; "Mehr" has nowhere to go, so its label and its chevron are one button rather
than a dead link beside a live one. The link graph does not notice, because the band is `hidden`
and never unmounted — a crawler reads the destinations inside it exactly as it read the four
entries in the bar.

**The sections are a flat `grid-cols-3`, with no threshold under it.** They used to be a 256 px
rail beside the blog block from a bar width of 1280 px, and that rail went out with the block: `w-64`
and `border-r` describe a relationship to a neighbour, and with nothing beside them they draw a
column and a rule into the empty half of a band up to 1280 px wide. The grid needs no breakpoint
because this panel only ever renders inside the nav row, and that row is `@min-[1024px]:flex` on the
same container — a one-column state has no width at which anybody could see it.

**The icon sits above the text, not beside it — a decision made when these cards still lived in a
256 px rail beside the blog block.** Beside the text, that rail's 231 px card left 157 px for a
title and a line: "Beste Reisezeit" still fit, but its hint went to three lines and broke as "und
Monate, Park / für Park." Above it, the text got the full 205 px, every title stayed on one line and
every hint ran to two — the card went 112.6 → 137.5 px. The rail is gone (see "Backstage" below),
but the shape it forced stayed, because it is still the better fit for a three-column grid.

**The hover is the border and nothing else, and that is three measurements rather than a
preference.** Sampled off the rendered pixels at 1024 and 1440 px in both themes:

|                                            | light        | dark         |
| ------------------------------------------ | ------------ | ------------ |
| `hover:border-primary/40` against the card | 1.60 : 1     | 1.81 : 1     |
| `hover:border-primary` against the card    | **3.46 : 1** | **5.31 : 1** |
| label (14 px semibold) on the card         | 19.76 : 1    | 17.65 : 1    |
| hint (13 px) on the card                   | 4.73 : 1     | 7.13 : 1     |

A border owes 3 : 1 and a 14 px semibold label owes 4.5, so the state lives on the border:
`group-hover:text-primary` on the title would run it at `text-primary`'s 3.47 : 1 for exactly as
long as somebody is reading it. The surface stays put with it — `bg-card/50` → `bg-card` measures
19.76 → 19.80 : 1 under the label, a change no eye resolves, and a tint that _is_ visible does
damage instead: `bg-primary/5` took the 13 px hint to 4.47 : 1 on the light card.

---

## "Backstage" comes back out of "Mehr"

The blog is the site's strongest entry point, and behind a catch-all trigger it was visible only to
somebody who opened one. It is a bar entry again, a fourth `NavMenu` beside "Parks entdecken" and
"Tagesplaner" and before "Mehr", opening the panel it already had.

**The label is "Backstage", unchanged in all six locales.** It is an international loanword, so it
needs no transcreation, and it says what the posts are.

`navigation.blog` carries it, and it has **three** readers, not the two a first count of the
components gives: this entry, the phone sheet's link, and `app/[locale]/layout.tsx`, which builds
the `SiteNavigationElement` for `/blog` out of the same key. That third one is right as it stands —
the structured data describes the primary navigation, and the navigation says "Backstage" — but it
means a rename here is a rename in the markup of every page, so it is worth knowing before the next
one. Two keys deliberately do **not** follow: `footer.blog`, which the footer link reads, and
`blog.blog`, which the index page's breadcrumb reads, because a breadcrumb names the page rather
than the menu entry that points at it.

**The width was there, and it was measured rather than assumed.** The 23.7 px of French overflow
that moved four entries out of the bar came from **six** entries; the row stood at +346.8 px of slack
in French at a 1024 px container before this, which is the measurement in the table above. After,
measured the same way on `/parks/europe/germany`, against the content box of the header row:

| container | locale |    before |         after |
| --------- | ------ | --------: | ------------: |
| 1024 px   | de     | +351.6 px | **+249.9 px** |
| 1024 px   | fr     | +346.8 px | **+245.0 px** |
| 1280 px   | de     | +377.6 px |     +269.9 px |
| 1280 px   | fr     | +372.8 px |     +265.0 px |

**The phone sheet already had the link**, first in the list, above "Startseite" — the issue that
asked for this reported it missing after reading the sheet from its `<details>` block downwards. It
renders the same `navigation.blog`, so it says "Backstage" now and is otherwise unchanged.

**No `data-menu-stagger` wrapper around `BlogMenuPanel`.** `useMenuReveal` collects its targets with
`querySelectorAll`, i.e. at any depth, and the panel carries several of its own. Nested, the tween
runs on parent and child, so the block starts 20 px high instead of 10 and three stagger steps late.
That trap is gone with the "Mehr" rail — `NavMenu` hands the panel straight to `MenuBand` — but it is
the reason nothing between the two may grow a stagger attribute.

---

## Motion

The band's columns lift into place when it opens, and the detail row settles again each time it
fills with a different country. `lib/hooks/use-menu-reveal.ts`, following the rules
`use-header-reveal.ts` arrived at (that hook no longer runs — PAR-170 took the header's own stagger
out with the fade it was layered on; the rules it arrived at are why this one is built as it is):

- **CSS owns visibility, GSAP owns motion.** The timeline animates `y` and never `opacity`. The
  panel is shown and hidden by a `hidden` class, so a failed chunk, a blocked import or a
  `prefers-reduced-motion` visitor gets a menu that simply appears — never one that JavaScript
  forgot to reveal. It is also why there is no fade: a fade needs its from-state written before the
  first frame, and a from-state that lands without its tween is a menu that opens empty.
- **Nothing touches the glass.** The surface carries `backdrop-blur-xl`, and a transform or an
  opacity on it — or on any ancestor — makes it a backdrop root for as long as the animation runs,
  so the blur would go flat exactly while somebody watches it appear. Every target is a
  **descendant** of that surface. Verified mid-tween: `transform: none`, `opacity: 1`,
  `backdrop-filter: blur(24px)` throughout.
- **The open restarts, it does not reverse.** Opening a menu is a discrete event, not a state being
  crossed back and forth the way the header's scroll threshold is, and closing snaps — a menu that
  lingers on the way out is a menu in the way.
- **The detail row's re-settle is shorter and flatter** (6 px over 0.25 s against 10 px over 0.4 s).
  It fires on every country somebody rests on, and a full flourish repeated down a column of 23
  countries is the fidget the header's reveal had to be rewritten to stop doing. It earns its place
  because the content genuinely changes; its key includes whether the fetch has landed, so the
  skeleton → cities swap animates rather than snapping.

Measured: **zero GSAP requests on a plain page view, one on the first menu opened** — the chunk is
shared with the header's own reveal, so nobody who never opens a menu pays for it. Under
`prefers-reduced-motion: reduce` the import never happens at all and no transform is written. The
tween clears its inline `transform` when it finishes, so nothing is left on the elements.

---

## Structured data

`SiteNavigationStructuredData` emits an `ItemList` of `SiteNavigationElement` beside the existing
`Organization` and `WebSite` data: five targets of the main navigation, in that list's own order,
then the five continent hubs. Ten items, and it stops there — nine where `showBlog` is false, since
the blog entry hangs off it. It used to say "the five bar entries in
the bar's order", which stopped being true when four of them moved behind the "Mehr" trigger — they
are still in the navigation, one level down, but the bar's order is no longer this one, and the
planner is in the bar and not in the list (PAR-248). Google works the primary navigation out from the markup on its
own, so this is a hint; repeating the 23 country links here would put a second copy of a list the
markup already carries into the head of every page.

---

## Measured

Against a running dev server, park page, `de`, measured for the mega-menu PR and **not** re-measured
since. "Mehr" moved one `/blog` link out of the `<nav>` and into the panel (48 links before it, 47
after, same destinations); "Backstage" put that link back in the `<nav>` as a bar entry, so the count
is 48 again with, once more, the same destinations. Neither change added or removed a URL:

|                                                         |                     before |                      after |
| ------------------------------------------------------- | -------------------------: | -------------------------: |
| crawlable links in `<nav aria-label="Main navigation">` |                          4 |                     **48** |
| city/park links in the nav (the long tail)              |                          0 |                      **0** |
| page weight                                             | 617.6 KB raw / 59.04 KB br | 671.5 KB / **64.69 KB br** |
| of that, the 23 country flags                           |                          — |                 ~4.2 KB br |
| layout chrome messages                                  |                     6066 B |                     6224 B |
| CLS (`measure:cls --late`, mobile)                      |                     0.0000 |                     0.0000 |
| menu photo requests on a plain page view                |                          — |       **0** (6 on opening) |

**+5.65 KB brotli per page** for 44 hub links, both panels, the flags and the photo markup. The band
is absolutely positioned and `hidden`, so it reserves nothing and shifts nothing.

The flags are the single biggest item in that number — 23 inline SVGs, present in the HTML and
again in the RSC payload. They are decorative (`aria-hidden`), so if that sitewide cost ever
stops being worth the scannability, rendering them after mount moves them into the shared JS chunk
and off all 35,000 pages.

The 48 break down as: `/parks` + 5 continents + 23 countries + 6 featured parks, `/blog` + 3
categories + 6 posts, plus Beste Reisezeit, Wörterbuch and Anleitung.

---

## The breakpoint, which was a bug

The nav used to appear at `md` while the search input waits for `lg`. Between 768 and 1023 px the
row therefore carried the full navigation **and** a 256 px search button (`md:w-64` on the button
trigger) **and** no burger, since that hid at `md` too. Measured on `main`: 789 px of content in a
736 px box — the German nav wrapped onto two lines and the document grew a horizontal scrollbar.

Now there is one breakpoint. The search trigger is icon-only below `lg`, the nav starts where the
input does, and under that width everything lives in the burger — including a native
`<details>` that opens the five continents with no JavaScript. Verified at 768/900/1024/1100/1280
in all six locales: no overflow, no wrap.

---

## Related

- [Design system → header geometry](../design/design-system.md#header-geometry)
- [Internationalization → which namespaces reach the client](../i18n/internationalization.md#which-namespaces-reach-the-client)
- [API budget per page](../architecture/api-budget.md)

## Favoriten im Band

Der Stern rechts in der Leiste öffnet dieselbe volle Bandfläche wie „Parks entdecken" und „Mehr",
über die gemeinsame `MenuBand` (`components/layout/menu-band.tsx`, aus `NavMenu` herausgelöst, als
der zweite Auslöser dazukam — zwei Kopien der Glasfläche wären zwei Gelegenheiten, dass Ring, Blur
und Container-Padding auseinanderlaufen).

Warum es das gibt: Favoriten sind der einzige Zustand, den diese Seite über einen Besucher
speichert, und sichtbar waren sie ausschließlich in einem Band zwei Bildschirme unter dem Hero der
Startseite. Von einer Parkseite aus — also von der Seite, auf der man den Stern tatsächlich drückt
— führte kein Weg zurück zu dem, was man gesammelt hat.

Vier Entscheidungen sitzen darin:

- **Der Stern ist immer da, auch bei null Favoriten.** Der Aktionsbereich wird server-gerendert,
  das Cookie ist erst nach dem Mount lesbar, und ein Bedienelement, das nach der Hydration
  auftaucht, schiebt Sprachwahl, Theme-Schalter und Burger zur Seite. 32 px, dafür kein Sprung.
- **Er liegt in der Navigationszeile und öffnet mit derselben Hysterese wie die Nachbarn**
  (`useMenuTrigger`). Eine Zeile, in der ein Eintrag anders reagiert als die daneben, muss man
  zweimal lernen. Er ist einer von zwei Einträgen ohne Link, aus einem anderen Grund als „Mehr" —
  siehe `FavoritesMenu`: „Mehr" ist eine Sammlung ohne eigene Seite, die Favoriten haben eine, die
  jedem Leser etwas anderes antwortet und deshalb keine Adresse ist, die man verlinken kann.
- **Die Anfrage läuft erst beim Öffnen** (`useFavorites({ enabled, poll })`). Der Header rendert
  auf ~35 000 Seiten; ungebremst wäre das ein `/api/favorites`-Call pro Seite für jeden, der je
  etwas markiert hat. Der Query-Key ist derselbe wie auf der Startseite, dort kostet das Öffnen
  also nichts.
- **Eigene Karten, nicht `ParkCard`/`AttractionCard`.** Die beiden lesen die Namespaces `parks` +
  `attractions`; die müssten dann in die Chrome-Payload jeder Seite. Das Panel liest `favorites`,
  `common`, `geo` und `parks.status` — die letzten drei waren schon Chrome, `favorites` (503 B) ist
  dazugekommen und dafür aus 20 Route-Deltas verschwunden. Im Burger-Sheet sind es Zeilen: ein
  Kartenraster in einer 300-px-Spalte ist eine Karte pro Bildschirm.

Bei null Favoriten steht die Anleitung im Panel: drei Schritte plus der echte Stern in der Größe,
in der er auf den Karten sitzt (`components/parks/favorites-how-to.tsx`). Dieselbe Komponente
steckt im leeren Favoritenband der Startseite, damit beide Stellen dieselbe Antwort geben. Sie
nennt **keine** Position für den Stern: auf einer Karte sitzt er in einer Ecke, auf einer Parkseite
nicht, und eine Angabe wäre auf einer von beiden falsch.

**Der leere Zustand ist dasselbe Panel wie der gefüllte, und sah aus wie ein anderes.** Er stand
zentriert, mit `max-w-3xl` darunter: ein 768-px-Block, der in einem 1248 px breiten Band bei x=336
anfing und bei 1104 aufhörte, während die Navigationszeile darüber, die Karten des gefüllten
Zustands und die Seite darunter alle bei 96 beginnen — eine Insel, die sich an nichts ausrichtet,
mit je einem Viertel leerem Glas links und rechts. Dazu eine andere Kopfzeile als der gefüllte
Zustand: dort links „★ Favoriten" und rechts die Links auf die beiden persönlichen Seiten, hier
eine zentrierte Zeile ohne Gegenstück. Wer nichts markiert hat, bekam damit nicht dasselbe Menü zu sehen wie jemand mit
Favoriten. Die Begründung fürs Zentrieren war „linksbündig bliebe rechts eine leere Hälfte" — die
bleibt zentriert auch, nur in zwei Vierteln statt in einer Hälfte und dafür an keiner Kante.

Jetzt: dieselbe Kopfzeile (links „★ Noch keine Favoriten", rechts „Meine Alarme", „Meine
Favoriten" und „Parks entdecken" — als Knopf unter der Anleitung nahm derselbe Link eine
eigene Zeile und stand wieder auf keiner Kante), darunter die drei Schritte als drei Spalten über
die volle Bandbreite, darunter die Parkvorschläge linksbündig. Bei 1248 px sind das ~405 px pro
Schritt für ein bis zwei Zeilen. Gemessen bei 1024/1440/1920 px: Überschrift, Schritte und Chips
beginnen exakt auf der Kante der Navigationszeile, das Panel schrumpft ohne Vorschläge von
207,5 auf 132 px.

## Die Spalte des Bandes ist die Spalte der Leiste

Drei Dinge, die alle drei Panels betrafen und am Favoritenmenü zuerst auffielen, weil es das
einzige mit echten Sätzen darin ist.

**Die Inhaltsspalte des Bandes ist dieselbe wie die der Leiste, und sie war es nicht mehr.** Beide
standen einmal auf Tailwinds `container mx-auto px-4 md:px-0`. Als der Tagesplaner anfing, die
Seite einzurücken, bekam die Leiste Container-Queries gegen die Breite des `<header>` und `px-4`
als Untergrenze statt als etwas, das die Max-Width bei `md` ablöst — das Band behielt die alte
Klasse, die ihre Max-Width aus dem **Fenster** zieht. Danach lag der Inhalt des Bandes bei jedem
Viewport 16 px links neben der Navigationszeile, und mit geöffnetem Planer bei 1920 px sogar
96 px daneben (Leiste 112–1360, Band 16–1456). `MenuBand` trägt jetzt dieselbe Klassenliste;
gemessen sind beide Kanten auf 0,0 px identisch, mit und ohne Planer.

**`white-space` vererbt sich, und die Navigationszeile ist `whitespace-nowrap`.** Sie muss das
sein — ein Menüwort darf in einer 48-px-Leiste nie umbrechen —, aber die Panels hängen im selben
`<nav>`. Beschriftungen und Kartentitel (`truncate`) überleben das; Fließtext nicht. Die
Blog-Teaser liefen einzeilig aus dem Band heraus und wurden vom `overflow-hidden` abgeschnitten,
und der leere Favoritenzustand — der Zustand, den fast jeder Besucher sieht — schob seine drei
Schritte als drei lange Zeilen über den rechten Rand. Die Glasfläche setzt jetzt `whitespace-normal`
zurück: ein Panel ist eine Seite, keine Zeile in der Leiste.

**Jede Karte im Band ist gleich breit** (`planBand` in `lib/utils/favorites-band-plan.ts`).
Vorher bekam jede Gruppe `flexGrow: <ihre Kartenzahl>` und füllte das mit
`repeat(auto-fill, minmax(10.5rem, 1fr))`: die Breite folgte der Anzahl, die Spaltenzahl der
Breite, und die Quantisierung dazwischen zerlegte genau das Verhältnis, auf dem das aufbaute. Drei
markierte Parks neben fünf Bahnen bekamen 336 px — 12 px zu wenig für zwei 168-px-Spalten —, also
zeichnete die Parkgruppe **eine** Spalte mit 336 px breiten Karten und stapelte alle drei
untereinander: Parkkarten doppelt so breit wie die Bahnkarten daneben, und ein Band von 868 px
Höhe, höher als das Fenster, in dem es hängt, für acht Favoriten.

Jetzt werden erst die Spuren gelegt und dann die Gruppen daraus geschnitten. Das Band wird
gemessen, die Kartenbreite einmal daraus abgeleitet (mindestens 168 px, höchstens 248, sonst wird
aus einer Karte im Menü ein Plakat), und jede Gruppe bekommt eine ganze Zahl davon — verteilt
greedy nach `Anzahl / (hat + 1)`, damit fünf Bahnen die vierte Spur gegen drei Parks gewinnen. Was
in `MAX_CARD_ROWS` Reihen nicht hineinpasst, steht in derselben „+N weitere"-Zeile wie vorher, und
damit hängt die Höhe des Bandes an der Reihenzahl statt daran, wie viel jemand markiert hat.
Gemessen bei 1440 px mit 3 Parks + 5 Bahnen + 3 Shows: **868 → 610 px, alle Karten 188 px breit**
statt 336 neben 179; mit je neun Parks und Bahnen 650 px.

Zwei Nebenwirkungen sind Absicht. Die Gruppen stehen nebeneinander oder untereinander, je nach
**gemessener** Breite und nicht mehr nach `lg:` — dieselbe Lehre wie bei der Leiste. Und die
Zeilengruppe (Shows/Restaurants) wächst weiter nicht mit ihrer Anzahl: eine Zeile wird von mehr
Breite nur länger, nicht besser, also bekommt sie 13 rem und den Rest nur, wenn ihn keine
Kartengruppe braucht.

Die Geometrie liegt seit dem Alarm-Panel **außerhalb** der Komponente, in
`lib/utils/favorites-band-plan.ts` — dieselbe Trennung wie bei `weather-chart-axis`, und aus
demselben Grund: sie ist einmal auf eine Art gebrochen, die ein grüner Build nicht zeigt, und
`pnpm test:favorites-band` rechnet sie nach. Der Test hält zwei Aussagen fest: dass jede Karte in
jeder Bandbreite dieselbe Breite bekommt und die Gruppen zusammen ins Band passen, und dass jede
Zusammenstellung, die es vor der Alarmgruppe gab, exakt so geplant wird wie vorher (die alte
Formel steht als Vergleichsimplementierung im Test).

## Die beiden persönlichen Seiten sind aus jedem Zustand erreichbar

`/favorites` und `/alerts` sind `noindex` und stehen in keiner Sitemap. Das Menü ist damit der
einzige Ort, an dem sie überhaupt verlinkt sind – und der Link auf `/favorites` hing an einer
Bedingung: „Alle anzeigen" erschien nur, wenn eine Gruppe über ihre Obergrenze lief. Drei
Favoriten passen in ein Band mit Platz für sechzehn, null erst recht, also sah die Mehrheit der
Besucher den Link nie. Auf dem 300-px-Sheet war der leere Zustand dazu die einzige Fläche im
ganzen Menü ohne einen der beiden Links.

Jetzt trägt jeder der drei Zustände (Band gefüllt, Band leer, Sheet leer) dieselben zwei Links,
als `PushAlertsMenuLink` und `FavoritesPageMenuLink`: Glocke plus „Meine Alarme", Stern plus
„Meine Favoriten". Was die Obergrenze verbirgt, sagt weiterhin die „+N"-Zeile unter der Gruppe –
das ist eine Aussage über die Gruppe, keine darüber, ob die Seite existiert. Der Footer trägt
dieselben zwei Ziele als Textlinks (`footer.favorites`, `footer.alerts`), damit ein Lesezeichen
nicht davon abhängt, dass jemand das Menü öffnet.

Der Tab-Titel beider Seiten trägt seither den Marken-Suffix. Das Locale-Layout setzt
`template: '%s'`, hängt also nichts an; jede Seite trägt ihren vollen Titel selbst. Beide Seiten
benutzen ihren `title` aber auch als `<h1>`, deshalb liegt der Suffix in einem eigenen Schlüssel
(`favoritesPage.metaTitle`, `pushAlerts.overview.metaTitle`) und nicht im `title` – sonst stünde
„– park.fan" in der Überschrift.

## Alarme im Favoritenmenü

Das Menü trug einen Textlink „Meine Alarme" auf `/alerts` und sonst nichts über Alarme. Wer wissen
wollte, was scharf ist — oder einen davon loswerden —, musste die Seite verlassen, auf der er
gerade stand. Im Band steht jetzt eine vierte Gruppe (`components/layout/favorites-menu-alerts.tsx`):
alle Wartezeit-Alarme und Show-Erinnerungen dieses Browsers, parkübergreifend, jede Zeile mit einem
Knopf zum Entfernen daneben.

Vier Entscheidungen dahinter:

- **Das Gatter ist der lokale Spiegel, die Liste ist der Server.** `countPushFollowsLocal()` ist ein
  `localStorage`-Zugriff und entscheidet, ob überhaupt gefragt wird; wer nie eine Glocke gedrückt
  hat, lädt weder den Chunk noch stellt er eine Anfrage. Was wirklich gesetzt ist, sagt danach die
  API (`usePushFollowsList`) — der Spiegel ist ein Cache für Glocken, keine Wahrheit für eine
  Fläche, von der gelöscht wird. Die eine Lücke daraus: ist der Spiegel gelöscht worden, während
  die Push-Anmeldung überlebt hat, bleibt die Gruppe aus. Deshalb steht der Link „Meine Alarme"
  weiterhin bedingungslos in der Kopfzeile des Panels.
- **Nachgeladen, nicht mitgeliefert.** `lib/push/push-follows` reicht bis zum Service Worker und
  zum VAPID-Key; im Chunk, den der Header auf ~35 000 Seiten ausliefert, hat das nichts zu suchen.
  Also `next/dynamic` hinter dem Gatter — dieselbe Teilung, die der Tagesplaner zwischen seinem
  Tab und seinem Panel macht.
- **Auf dem Handy bleibt es beim Link.** Das 300-px-Sheet ist die ganze Navigation; eine Reihe
  Zeilen mit je einem unwiderruflichen Tipp darin gehört nicht hinein, und `/alerts` sagt dasselbe
  mit Platz.
- **Die Übersetzungen bleiben in `pushAlerts.menu`.** Das ist Layout-Chrome und wird auf jeder
  Seite × sechs Sprachen serialisiert. `pushAlerts.overview` hätte zwölf Schlüssel Fließtext
  mitgebracht; die sechs kurzen Schlüssel hier kosteten +1198 B roh über alle sechs Sprachen, rund
  +81 B komprimiert pro Seite. Zwei kamen später dazu — `removeError` und `removeRateLimited`, die
  Sätze für ein abgelehntes DELETE —, aus demselben Grund: `usePushErrorMessage` mitzunehmen hätte
  `pushAlerts.pushErrors` in die Chrome jeder Seite gezogen, und der Löschpfad meldet ohnehin nur
  zwei unterscheidbare Fälle (er registriert nie eine Anmeldung, also fällt die ganze
  `unavailable`-Familie weg). Gemessen über alle neun Schlüssel: `pushAlerts.menu` wächst um
  1048 B roh über sechs Sprachen, die Layout-Chrome von 7488 auf 7654 B pro Seite, komprimiert
  +68 B (deutsch, brotli-11). `/alerts` benutzt den Helfer, weil es dort eine Route zahlt und
  nicht das Layout.

### Eine Zeile geht erst, wenn der Server sie gehen lässt

`removeRideAlert` und `unfollowShow` schrieben den lokalen Spiegel **zuerst** und schickten das
DELETE danach, ohne `response.ok` je zu lesen. Eine 500 nahm die Zeile vom Bildschirm und ließ den
Alarm scharf: er war beim nächsten Öffnen wieder da, ohne dass irgendwo etwas gestanden hätte. Und
weil diese Gruppe am Spiegel hängt, verschwand beim Entfernen des letzten Alarms die ganze Gruppe
im selben Commit wie der Klick — mitsamt ihrem eigenen Spinner und jeder Meldung, die dort hätte
stehen können.

Beide liefern jetzt ein `PushWriteResult` mit denselben Fehlerklassen wie das Schreiben, und die
Reihenfolge ist umgedreht: erst die API, den Spiegel nur bei Erfolg. Eine **404 zählt als Erfolg** —
eine Zeile, die der Server nicht mehr hat, ist genau das, was der Besucher wollte, und ein Fehler
darüber bliebe für immer stehen, weil jeder weitere Versuch wieder 404 antwortet. Der Schreibpfad
liest denselben Status andersherum (`setRideAlert` synchronisiert die Anmeldung neu und probiert
es noch einmal); die Asymmetrie ist Absicht.

Der React-Query-Cache wird davon unberührt **nach** dem DELETE geschrieben und nur bei Erfolg —
beides steckt in `usePushFollowRemoval` (`lib/push/use-push-follow-removal.ts`), das sich diese
Gruppe mit `AlertsOverview` teilt, damit eine Zeile auf beiden Flächen unter derselben Bedingung
verschwindet. `pnpm test:push-follow-delete` hält die Reihenfolge und die Fehlerklassen fest; ein
grüner Build zeigt von beidem nichts.

### Der Lesepfad hatte dieselbe Blindheit eine Ebene tiefer

`fetchRideAlertsRemote` und `fetchShowFollowsRemote` fragten `getExistingPushIdentity()`. Das
antwortet `null` für „nie angemeldet" **und** für ein `getRegistration()`, das geworfen hat
(verweigerter Speicherzugriff, partitionierter Kontext) — beides wurde zu `{ ok: true, items: [] }`,
also zu „dieser Browser hat keine Alarme". `AlertsOverview` rendert daraufhin den Leerzustand
„Noch nichts eingerichtet", und die Alarm-Gruppe im Favoritenband gibt `null` zurück und ist weg.
Genau den Unterschied hält `PushListResult` mit seinem `{ ok: false }` offen, und beide Flächen
haben ihren Weg dafür (`bothFailed` / `failed`) längst; er war nur unerreichbar.

Beide Fetcher lesen jetzt `lookupExistingPushIdentity()`, dasselbe Werkzeug wie die Entfernungen
darüber, und geben einen gescheiterten Lookup als `{ ok: false }` weiter. `getExistingPushIdentity()`
bleibt unverändert und behält genau einen Aufrufer: `identityForWrite`, wo die drei Fälle
zusammenfallen dürfen, weil auf ein `null` ohnehin `ensurePushRegistered()` folgt.
`pnpm test:push-follow-read` hält es fest, mit demselben `LOOKUP_BROKEN`-Navigator, den der
Löschpfad schon benutzt.

## Das Menü schließt sich beim Seitenwechsel

Radix schließt einen Dialog, wenn etwas darin `SheetClose` ruft — ein `<Link>` tut das nicht, der
navigiert. Der Header lebt im Locale-Layout und überlebt die Navigation, also blieb das
Burger-Panel auf dem Handy über der neuen Seite liegen: Tippen auf „Glossar" wechselte die Seite
dahinter und ließ das Panel stehen. Jeder Link darin hatte den Fehler.

Die Desktop-Bänder hatten dieselbe Form desselben Fehlers aus dem anderen Grund: ihr
Außenklick-Handler ignoriert Klicks **innerhalb** des Bandes bewusst — und genau dort sitzen die
Links.

Der offene Zustand ist deshalb überall der **Pfad**, auf dem geöffnet wurde, nicht ein Boolean:

```tsx
const [openedOn, setOpenedOn] = useState<string | null>(null);
const open = openedOn === pathname;
```

Ändert sich `pathname`, ist das Menü im selben Render zu. Ein Boolean plus Effekt täte dasselbe
einen Render später und ist genau das `setState`-im-Effekt, das der Linter zu Recht ablehnt.
`pathname` kommt aus `@/i18n/navigation`, ist also locale-bereinigt — richtig hier, weil ein
Sprachwechsel dieselbe Route neu rendert und das Menü nicht mitten in der Geste zuschlagen soll.

## Ein Fokus, der nirgendwohin geht, hat das Menü nicht verlassen

`useMenuTrigger` schließt auf drei Wegen: Escape, ein `pointerdown` außerhalb, und ein `blur`,
dessen Fokus das Band verlässt. Der dritte stand als `!e.currentTarget.contains(e.relatedTarget)`
da, und `contains(null)` ist `false` — ein Fokus, der **nirgendwohin** geht, las sich damit wie
einer, der nach draußen geht.

Nirgendwohin geht er, sobald das fokussierte Element aufhört fokussierbar zu sein, während es den
Fokus noch hält. Genau das tun die Entfernen-Knöpfe der Alarmgruppe: sie setzen `disabled` für die
Dauer ihres eigenen DELETE. Gemessen mit echtem Zeiger bei 1440 px:

```plain text
focusin   BUTTON[Black Mamba: Alarm entfernen]
focusout  BUTTON[Black Mamba: Alarm entfernen] disabled=true  related=null
```

Das Band ging unter dem Klick zu, der gerade gemacht worden war. Pro Öffnen ließ sich damit genau
ein Alarm entfernen, und die Bestätigung — die Zeile verschwindet, die übrigen rücken nach — sah
niemand, weil sie mit dem Band verschwand.

Die Regel liegt jetzt als `focusLeftMenu` in `lib/utils/menu-focus.ts` (`pnpm test:menu-focus`,
außerhalb des Hooks, weil `use-menu-trigger.ts` über next-intl an `next/navigation` reicht und
damit außerhalb von Next nicht lädt) und verlangt ein benanntes Ziel: ein Fokus, der wirklich geht,
sagt wohin. Es betrifft nicht nur die Alarmgruppe: jeder Knopf in einem Band, der sich selbst
deaktiviert, während er den Fokus hält, hätte dasselbe ausgelöst.

**Und Escape musste dafür erst repariert werden.** Die Regel oben lässt das Band offen stehen, und
nach einer Löschung sitzt der Fokus auf `<body>` — wer keinen Zeiger benutzt, hätte danach ein Band
vor sich gehabt, das er nicht mehr loswird. Escape schloss nämlich keines der drei Bänder, gemessen
an „Parks entdecken" wie an den Favoriten, auf beiden Wegen (per Hover geöffnet und per Fokus):
`onKey` setzt `setOpenedOn(null)` und fokussiert direkt danach
`rootRef.current.querySelector('a, button')` — ein Element **innerhalb** des Wrappers, dessen
`onFocus` im selben Commit `setRequested(true)` ruft und den Schluss überschreibt. Der Fokus gehört
dahin zurück, also bleibt er dort und `closingRef` unterdrückt für die Dauer dieses einen
synchronen `focus()` das Wiederöffnen. Gemessen danach: alle drei Bänder schließen auf Escape, auf
beiden Wegen, und der Fokus steht anschließend auf dem Auslöser.

## Bewegung im Sheet

Das Burger-Menü war die einzige Menüfläche ohne Bewegung. `useSheetReveal`
(`lib/hooks/use-menu-reveal.ts`) staffelt die Zeilen jetzt entlang **derselben Achse**, auf der das
Panel selbst hereinfährt (`x`, nicht `y`) — zwei Bewegungen über Kreuz lesen sich als zwei Dinge,
eine als eine. Regeln wie beim Desktop-Band: CSS (Radix' eigene `data-[state]`-Animation) besitzt
die Sichtbarkeit, GSAP bewegt nur, `prefers-reduced-motion` importiert den Chunk gar nicht erst,
und ohne ihn öffnet das Menü exakt wie vorher.
