# Homepage

The homepage, top to bottom: the hero (headline, search, popular parks, Parky), the visitor's own
parks, what is new, the four tools, the popular parks and four questions. Open this when changing
any of them. Entry point: `app/[locale]/page.tsx`.

The page is written for a first visit: what this is, whether my park is in it, what is new, what
else it does. Everything that explains a tool at length lives on that tool's own page, which the
tool cards link to. On 2026-11-02 the page had 21 sections and was 18,920 px tall on a desktop and
20,530 px on a phone; three quarters of its views come from phones, which stayed 13 seconds.

| #   | Section         | Component                                                              | Data                                                    |
| --- | --------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Hero            | the `<section id="hero">` in `page.tsx`                                | none on the server; the search and Parky in the browser |
| 2   | Your parks      | `NearbyChapter` + `NearbyParksCard showShortWaits`, `FavoritesSection` | `/v1/discovery/nearby`, the favourites cookie           |
| 3   | New on park.fan | `HomeReading`                                                          | the blog manifest, synchronous                          |
| 4   | Four tools      | `HomeTools`                                                            | none                                                    |
| 5   | Popular parks   | `FeaturedParksSlot` in `<Suspense>`                                    | `getGeoStructure` (a week), live status client-side     |
| 6   | Four questions  | `FaqSection`, the page's only `FAQPage`                                | `seo.homepage.faq`                                      |

In a park, `ParkCompassSlot` puts the headliners on a compass right under the hero
([the in-park compass](park-compass.md)); the announcement band (`AnnounceSection`,
[homepage announcement](homepage-announcement.md)) follows when one is running.

## The hero

The headline carries the search term (`home.hero.title`: „Freizeitpark-Wartezeiten live", „Theme
park wait times, live" …), under the kicker (`HeadKicker`) and over one sentence (`home.hero.lead`).
All three are server text in the first HTML; nothing in the hero waits for the API.

- **The text stands on the photo**, as on the landing pages' heads: two theme-aware tints that fade
  into the page carry the contrast. The glass plates the hero had (one for the text, one for a world
  map) re-filtered the ken-burns pan every frame: 66.7 ms median frames at 6× CPU with both, 16.7 ms
  with none. The one piece of glass left is the search field's frame.
- **The pan** (`.hero-ken-burns`, `components/layout/hero-background.tsx`) waits for load, idle and
  the entrance window (`useHeroPanAllowed`), is paused while the hero is off screen or the tab is
  hidden, and stops under `prefers-reduced-motion`.
- **Popular parks** (`HeroPopularParks`): the first four of the header's parks menu
  (`getFeaturedParksMenu`, the parks this locale's readers open most), as plain links in a named
  `<nav>`. A visitor whose park is one of them is one tap away, and the links hand the homepage's
  weight to the park pages a search for „<park> Wartezeiten" should find. Search Console showed the
  homepage at position 7.4 for „europapark wartezeiten live", with 2 clicks from 1,779 impressions.
- **Parky** (`HeroParky`) stands in a column the grid reserves from 1024 px (`@container/page`),
  only while Parky is switched on for everybody: `assistantGate.getForEveryone()`, which reads
  `assistantForEveryone` (`lib/assistant/config.ts`: switched on, `rolloutPercent` 100) on top of the
  gate's own decision. Below 100 % the column stays empty, so the hero never offers a chat the
  widget would refuse. Its question names a park of the locale's market (`home.hero.parkyPrompt`);
  the bubble is a button that calls `openParky`.

### Search: the field alone at rest

`HeroInlineSearch` (`components/search/hero-inline-search.tsx`) shows the field and nothing under
it until it is used (`FIELD_REST`: no rows at rest); the parks near the visitor have a chapter of
their own right under the hero.

- **Below `md`** the field is the `SearchCommand` trigger (`trigger="hero"`), which opens the
  full-screen palette.
- **From `md`** it is `HeroInlineSearchPanel`, a lazy chunk fetched after load and idle and once the
  field is on screen. Focus opens the browse list (nearby, in-park or popular parks, up to six) as a
  dropdown over the page, three characters swap in the results, Escape clears a query and then
  closes the list, and focus stays on the field. The list box is `hidden` while collapsed and eases
  open (`useAnimatedHeight`).
- **The first frame is `HeroSearchShell`**, a working input that hands focus and typed text to the
  panel when it mounts, or to the palette on a phone (`openOnMount`).

`HeroSearchFrame` is the field's glass: one `GlassCard variant="heavy"` from the field's top edge,
which also carries the list when it opens. The field draws no fill or blur of its own
(`HERO_SEARCH_INPUT_CLASS`); the border lights while the field has focus through
`group/hero-search` ([no `:has()`](../rules/no-has-selector-in-the-stylesheet.md)). The shared
search modules (queries, browse list, routing, rows) are listed in
[site search](site-search.md). The hero is the search surface `hero` on both viewports; the events
and their rules are in [site search](site-search.md#what-is-counted).

### Motion

The text column's children come in one after another (`.hero-in-stagger`, `hero-item-in` in
`app/globals.css`): from the left, rising, out of a 12 px blur, with `animation-fill-mode:
backwards`, never `both`, which would keep the last keyframe's transform and filter on the element
for good and make it a backdrop root. The entrance is scoped to `.hero-entering` on the section, and
`HeroEntranceGate` drops the class after `HERO_ENTRANCE_MS` from an inline script, so content that
streams in later does not replay it. The section carries `suppressHydrationWarning` because the
script and React both write its `className`. Parky fades in (`starting:opacity-0`).

## Your parks

`NearbyChapter` frames `NearbyParksCard` (geolocation, else the API's GeoIP guess, after load and
idle) with every state it already has: the prompt, the list of nearby parks with the open ones
first, the in-park view, the error. On the homepage the card passes `showShortWaits`, so the list
of parks is followed by „Jetzt kurz anstehen" (`NearbyShortWaits`): the rides in the open nearby
parks whose live wait is well below their usual one, as the API picks them (`shortWaits`, contract
in the API's [discovery](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/discovery.md#shortwaits)).
The rows are the in-park lists' `InParkRow` with `LiveWaitPill` and „sonst 40 Min". Nothing is drawn
when the list is empty, which is every evening and the whole off-season.

`FavoritesSection` follows in the same flex column and is shown only to a visitor with favourites,
and then above the nearby parks: the inline favourites script in `app/[locale]/layout.tsx` sets
`data-has-favorites` before paint, and `.home-favorites` in `app/globals.css` hides the band
without it and gives it `order: -1` with it. Neither choice moves anything after load.

## New on park.fan, tools, popular parks, questions

- **`HomeReading`**: the three newest articles as `BlogPostCard`s (rows on a phone,
  [the rule](../rules/a-blog-card-is-a-row-on-phones.md)) and the six newest news as `NewsRow`, a size
  below ([news is set apart](../rules/news-is-set-apart-from-the-articles.md)). Synchronous manifest
  data, so it is in the first HTML and changes with every deploy that brings a post.
- **`HomeTools`**: live wait times → the guide page (`howtoPath`), crowd calendar → best time to
  visit, planner → `plannerPath`, Parky → `/parky`; one sentence each (`homeStory.tools`).
- **`FeaturedParksSlot`**: six park cards, the structure server-rendered, the status from the client.
- **`FaqSection`**: four questions (`whatIs`, `liveData`, `whichParks`, `free`), rendered and marked
  up from one array by `FaqList`.

Every chapter opens with `ChapterHeading variant="tile"` and the band padding `STORY_SECTION_Y`
(`components/home/section-chrome.ts`).

## Caching and payload

`revalidate` is a week. The shortest fetch in the render decides the route's window, and the one
fetch left is `getGeoStructure` (`CACHE_TTL.geo`, a week); the AI and families chapters that pinned
it to a day are gone ([PAR-1113](https://linear.app/parkfan/issue/PAR-1113)). Read
`initialRevalidateSeconds` in `.next/prerender-manifest.json` after touching a fetch.

The route ships four message namespaces to the client (`location`, `nearby`, `parkCard`, `parks`;
`i18n/route-namespaces.generated.ts`), down from eleven.

## Where the old chapters went

| Chapter                                          | Now                                    |
| ------------------------------------------------ | -------------------------------------- |
| world map, „Parks weltweit im Überblick"         | Parks entdecken (`/parks`)             |
| three steps, live waits with the top-ten table   | So funktioniert park.fan (`howtoPath`) |
| own forecast, Fancast figures                    | Fancast                                |
| crowd calendar explained, quiet windows          | Beste Reisezeit                        |
| minimum heights                                  | the parks' „mit Kindern" pages         |
| shows and restaurants                            | the park pages                         |
| dictionary with the 3-D player                   | Wörterbuch                             |
| blog band under the hero and blog chapter        | „Neu auf park.fan", once               |
| why park.fan, global and platform stats, founder | removed                                |
| Google preferred source                          | the footer                             |

## Related

- [Caching strategy](../architecture/caching-strategy.md)
- [Site search](site-search.md)
- [The in-park compass](park-compass.md)
- [Design system](../design/design-system.md)
