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

## Motion

The band's columns lift into place when it opens, and the detail row settles again each time it
fills with a different country. `lib/hooks/use-menu-reveal.ts`, following the rules
`use-header-reveal.ts` arrived at:

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
`Organization` and `WebSite` data: the five bar entries in the bar's order, then the five continent
hubs. Ten items, and it stops there. Google works the primary navigation out from the markup on its
own, so this is a hint; repeating the 23 country links here would put a second copy of a list the
markup already carries into the head of every page.

---

## Measured

Against a running dev server, park page, `de`:

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

## Favoriten im Band

Der Stern rechts in der Leiste öffnet dieselbe volle Bandfläche wie „Parks entdecken" und „Blog",
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
  zweimal lernen. Er ist der einzige Eintrag ohne Link — siehe `FavoritesMenu`: Favoriten haben
  kein Ziel, das für alle dasselbe zeigt.
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

**Jede Karte im Band ist gleich breit** (`planBand` in `components/layout/favorites-menu-panel.tsx`).
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

## Bewegung im Sheet

Das Burger-Menü war die einzige Menüfläche ohne Bewegung. `useSheetReveal`
(`lib/hooks/use-menu-reveal.ts`) staffelt die Zeilen jetzt entlang **derselben Achse**, auf der das
Panel selbst hereinfährt (`x`, nicht `y`) — zwei Bewegungen über Kreuz lesen sich als zwei Dinge,
eine als eine. Regeln wie beim Desktop-Band: CSS (Radix' eigene `data-[state]`-Animation) besitzt
die Sichtbarkeit, GSAP bewegt nur, `prefers-reduced-motion` importiert den Chunk gar nicht erst,
und ohne ihn öffnet das Menü exakt wie vorher.
