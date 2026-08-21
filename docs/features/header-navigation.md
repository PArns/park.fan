# Header navigation

The bar's five entries, the two panels behind them, and why the panels stop where they do.

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
| the photo rail         | server-resolved, fixed four     | only 14 of 212 parks have a picture at all          |
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

**The photo rail is a fixed four, not a thumbnail per park.** The media database holds a picture
for 14 of 212 parks and a `park-background` for nine of them, so a photo on every row would have
been nine pictures and two hundred empty boxes. Which four: the homepage's per-locale
`FEATURED_PARK_SLUGS`, intersected with the parks that have a photo — a second curated list would
be a second thing to keep in sync, and the question "which parks does a German reader want" was
already answered once, with visitor numbers in the comments. Resolved in the layout, because
`@/lib/media` is the 107 KB catalog and the header is a Client Component; only four URLs cross that
boundary. The pictures are requested when a visitor opens the menu and not before — verified: three
photo requests on a plain park page, seven after opening the panel.

**Flags come from the set that already existed.** `components/common/icons/flags.tsx` had 20 of the
23 countries for the locale switcher; `CountryFlag` is a lookup over it, cropped to a fixed 16×12
box because the source viewBoxes range from 5:3 to 1000:700 and a row of un-cropped flags is a row
of different widths. Saudi Arabia, Malaysia and Singapore have no artwork yet and get a neutral
chip with their code — four parks between them. Emoji flags were the short route and are why that
file exists: Windows ships no flag glyphs, so `🇩🇪` renders there as the letters "DE".

Three details that are easy to break again:

- **The panel is positioned against the `<header>`, not against its trigger.** Centred on the
  trigger, a 700 px panel hanging off an entry 276 px from the left edge starts at −36 px.
- **The band carries `overflow-hidden`.** Its rows use `-mx-2` so the hover highlight reaches into
  the column gaps, and at exactly 1024 px — where the container is as wide as the viewport — the
  last column's 8 px of bleed gave the document a horizontal scrollbar.
- **The detail row holds its height** whether or not a country is open. It fills in under the
  pointer as the fetch lands, and a band that resized while somebody was reading it would be worse.

## The blog panel: three categories, four posts, no tags

Fully server-rendered — the blog manifest is a build-time artifact, so there is no fetch and no
loading state, and it is eight links. The four posts carry their own cover images, which is where
this differs from the parks rail: those had to be a curated four because 14 of 212 parks have a
picture, here the coverage is 7 of 7 and the covers are already 16:9 crops.

The blog holds 7 posts per locale across **3 categories** (guides 5, behind-the-scenes 1, news 1),
**31 tags** and one author. So the categories are in, the four newest posts are in, and **the tags
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

## Structured data

`SiteNavigationStructuredData` emits an `ItemList` of `SiteNavigationElement` beside the existing
`Organization` and `WebSite` data: the five bar entries in the bar's order, then the five continent
hubs. Ten items, and it stops there. Google works the primary navigation out from the markup on its
own, so this is a hint; repeating the 23 country links here would put a second copy of a list the
markup already carries into the head of every page.

---

## Measured

Against a running dev server, park page, `de`:

|                                                         |                     before |                      after |
| ------------------------------------------------------- | -------------------------: | -------------------------: |
| crawlable links in `<nav aria-label="Main navigation">` |                          4 |                     **46** |
| city/park links in the nav (the long tail)              |                          0 |                      **0** |
| page weight                                             | 617.6 KB raw / 59.04 KB br | 666.9 KB / **63.94 KB br** |
| of that, the 22 country flags                           |                          — |                 ~3.9 KB br |
| layout chrome messages                                  |                     6066 B |                     6224 B |
| CLS (`measure:cls --late`, mobile)                      |                     0.0000 |                     0.0000 |
| menu photo requests on a plain page view                |                          — |       **0** (4 on opening) |

**+4.90 KB brotli per page** for 42 hub links, both panels, the flags and the photo markup. The band
is absolutely positioned and `hidden`, so it reserves nothing and shifts nothing.

The flags are the single biggest item in that number — 22 inline SVGs, ~1.97 KB brotli in the HTML
and again in the RSC payload. They are decorative (`aria-hidden`), so if that sitewide cost ever
stops being worth the scannability, rendering them after mount moves them into the shared JS chunk
and off all 35,000 pages.

The 46 break down as: `/parks` + 5 continents + 23 countries + 4 featured parks, `/blog` + 3
categories + 4 posts, plus Beste Reisezeit, Wörterbuch and Anleitung.

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
