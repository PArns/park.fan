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

## The parks panel: three panes, two kinds of thing

```
┌──────────────┬───────────────────────┬──────────────────────┐
│ Nordamerika  │ Frankreich  Deutschl. │ DEUTSCHLAND          │
│ Asien        │ Ver. Kön.   Spanien   │  RUST                │
│ Europa    ◀  │ Belgien     Niederl.  │   Europa-Park        │
│ Ozeanien     │ Dänemark    Italien   │   Rulantica          │
│ Südamerika   │ Schweden    Österr.   │  BOTTROP             │
│              │ Polen                 │   Movie Park Germany │
│              │                       │  2 weitere Städte    │
└──────────────┴───────────────────────┴──────────────────────┘
   in the HTML       in the HTML            fetched on hover
```

**Panes 1 and 2 are server-rendered into every page** and are always in the document; the four
inactive country lists are `display:none`, not unmounted. A crawler does not hover, so a panel
built on first interaction contributes nothing at all to the link graph — which would defeat the
point of putting the geography in the header. Google indexes CSS-hidden navigation normally.

**Pane 3 is fetched** from `/api/nav/geo/[continent]/[country]` when somebody opens a country, once
per country for the life of the tab.

The split is about links, not bytes:

| Depth                 | raw      | brotli  | sitewide links |
| --------------------- | -------- | ------- | -------------- |
| continents + country  | 1.3 KB   | 420 B   | 28             |
| + cities              | 7.4 KB   | 1.97 KB | 172            |
| + parks               | 19.9 KB  | 4.67 KB | 384            |
| the whole geo payload | 168.6 KB | 16.8 KB | —              |

Everything in the header is a link on ~35,000 pages. 28 hub links concentrate internal weight on
the continent and country pages, which is the point of having them there. The 144 cities and 212
parks below them are already reachable from those hubs and from the sitemap, so putting them in the
template would spread the same weight over 356 more targets and buy no discovery. That is the whole
argument, and it is why pane 3 exists as a fetch rather than as more markup.

Two details that are easy to get wrong again:

- **The panel is positioned against the `<header>`, not against its trigger.** Centred on the
  trigger, a 700 px panel hanging off an entry 276 px from the left edge starts at −36 px. Anchored
  to the header's container it starts where the logo starts, at every width.
- **Pane 3 ends on a whole row.** Its budget counts rows — a city heading _or_ a park — because
  Germany is 7 cities but 9 parks and Rust alone is four rows. `max-height` plus a scrollbar cut
  Haßloch in half against the panel's bottom edge and read as broken rather than as scrollable.
  What does not fit is named: "2 weitere Städte", linking to the country page.

The panel opens on Europe for `de`/`nl`/`fr`/`es`/`it` and on the largest continent otherwise.
Sorted by park count the first entry is North America (85 parks against Europe's 49), and opening a
German reader onto Florida is a worse guess than the one the URL already makes. The nearby-park
query would be a better signal, but it lands after the first paint and would move the panel under
the pointer.

---

## The blog panel: three categories, four posts, no tags

Fully server-rendered — the blog manifest is a build-time artifact, so there is no fetch and no
loading state, and it is eight links.

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
| crawlable links in `<nav aria-label="Main navigation">` |                          4 |                     **40** |
| city/park links in the nav (the long tail)              |                          0 |                      **0** |
| page weight                                             | 617.6 KB raw / 59.04 KB br | 635.6 KB / **60.70 KB br** |
| layout chrome messages                                  |                     6066 B |                     6224 B |
| CLS (`measure:cls --late`, mobile)                      |                     0.0000 |                     0.0000 |

**+1.66 KB brotli per page** for 36 hub links and both panels. The panel is absolutely positioned
and `hidden`, so it reserves nothing and shifts nothing.

The 40 break down as: `/parks` + 5 continents + 23 countries, `/blog` + 3 categories + 4 posts, plus
Beste Reisezeit, Wörterbuch and Anleitung.

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
