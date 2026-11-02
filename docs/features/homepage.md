# Homepage

Everything on the homepage under the hero, which has its own page
([homepage hero](homepage-hero.md)). Open this when changing the order of the chapters, the news
block, the tour and its screenshots, the nearby parks and their short waits, the popular parks'
links or the FAQ. Entry point: `app/[locale]/page.tsx`.

The page welcomes a first visit: the hero says what this is and finds a park, the news says what is
new, the tour shows the product on a phone, and only then come the visitor's own parks, the popular
parks and the questions. On 2026-11-02 it had 21 sections and was 18,920 px tall on a desktop and
20,530 px on a phone; three quarters of its views came from phones, which stayed 13 seconds.

| #   | Chapter          | Component                                                              | Data                                                    |
| --- | ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Hero             | the `<section id="hero">` in `page.tsx`                                | [homepage hero](homepage-hero.md)                       |
| 2   | Neu auf park.fan | `HomeReading`                                                          | the blog manifest, synchronous                          |
| 3   | The tour         | `HomeTour`                                                             | none; screenshots in `public/home/` and `public/parky/` |
| 4   | Your parks       | `NearbyChapter` + `NearbyParksCard showShortWaits`, `FavoritesSection` | `/v1/discovery/nearby`, the favourites cookie           |
| 5   | Popular parks    | `FeaturedParksSlot` with `PopularParkLinks` inside                     | `getGeoStructure` (a week), the page-view snapshot      |
| 6   | Questions        | `FaqSection`, the page's only `FAQPage`                                | `seo.homepage.faq`                                      |

In a park, `ParkCompassSlot` puts the headliners on a compass right under the hero
([the in-park compass](park-compass.md)); the announcement band (`AnnounceSection`,
[homepage announcement](homepage-announcement.md)) follows when one is running.

## What people search for

Search Console, 90 days to 2026-10-31: almost every query that finds park.fan is one of two shapes,
„<park> wartezeiten" (live, aktuell, heute; „<park> wait times", „queue times") and „<park>
auslastung", „andrang kalender", „prognose", „wie voll ist … heute" („crowd calendar", „how busy is
… today"). The generic ones the homepage itself ranks for are „freizeitpark wartezeiten" (1,491
impressions, position 4.7), „wartezeiten" (2,039, 7.7), „freizeitpark auslastung" and „wartezeiten
app". The page answers in those words:

- the tour's headings are the search terms (`homeStory.tour.<stop>.title`: „Wartezeiten live, für
  jede Bahn", „Wie voll wird es? Der Andrang-Kalender", „Prognose: …");
- `PopularParkLinks` links each popular park's waits and its calendar, the two pages those queries
  want, with the park's name in the link text;
- the FAQ asks whether park.fan works on a phone without an app (`mobileQ`).

## What is new comes first

`HomeReading` draws the six newest news posts (`NewsRow`), then the three newest articles as
`BlogPostCard`s (rows on a phone, [the rule](../rules/a-blog-card-is-a-row-on-phones.md)). News stays
a size below the articles ([news is set apart](../rules/news-is-set-apart-from-the-articles.md)) but
stands first: the hero already lists the parks near the visitor, and the news is what changes from
one visit to the next. The manifest is read synchronously, so the chapter is in the first HTML and
changes with every deploy that brings a post.

## The tour

`HomeTour` shows four stops, each a few lines beside a screenshot in a phone (`ShotRow` and
`PhoneShot` in `components/marketing/`, shared with Parky's page):

| Stop     | Screenshot                                  | Leads to           |
| -------- | ------------------------------------------- | ------------------ |
| live     | Europa-Park's page, the headliners          | the guide page     |
| calendar | Europa-Park's crowd calendar, the month     | best time to visit |
| ride     | Silver Star's day with the forecast         | the trip planner   |
| parky    | Parky's chat (`public/parky/<l>/chat.webp`) | Parky's page       |

- **The screenshots are per locale** and from the real pages, taken by
  `scripts/capture-home-shots.mjs` (`public/home/<locale>/{park,calendar,ride}.webp`, 1170 × 1992,
  an iPhone 13 at 3×). They show live data, so take them while the park is open; Parky's comes from
  `capture-parky-shots.mjs`.
- **Motion**: each stop rises in (`Reveal`), carries its number as a large gradient glyph, and its
  phone glides 48 px against the page while it scrolls past (`ShotRow drift`, `.pk-shot-drift` in
  `app/globals.css`, a scroll-driven animation on the standalone `translate`, so the frame's tilt
  stays). Nothing moves while the page stands still, and none of it runs under
  `prefers-reduced-motion` or without `animation-timeline`.
- **Room**: the tour takes `py-24 sm:py-32` against the other chapters' `STORY_SECTION_Y`, and
  `overflow-hidden`, so the phones' glow does not widen a phone's page.

## Your parks

`NearbyChapter` frames `NearbyParksCard` (geolocation, else the API's GeoIP guess, after load and
idle) with all its states: the prompt, the nearby parks with the open ones first, the in-park view,
the error. On the homepage the card passes `showShortWaits`, so the parks are followed by „Jetzt
kurz anstehen" (`NearbyShortWaits`): the rides in the open nearby parks whose live wait is well below
their usual one, as the API picks them (`shortWaits`, contract in the API's
[discovery](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/discovery.md#shortwaits)).
Nothing is drawn when the list is empty, which is every evening and the whole off-season.

`FavoritesSection` follows in the same flex column and shows only for a visitor with favourites, and
then above the nearby parks: the inline favourites script in `app/[locale]/layout.tsx` sets
`data-has-favorites` before paint, and `.home-favorites` in `app/globals.css` hides the band without
it and gives it `order: -1` with it, so neither choice moves anything after load.

## Popular parks and their links

`FeaturedParksSlot` draws six park cards and, as its `children`, `PopularParkLinks`: twelve parks,
the build's page-view snapshot first (`viewedParksSeed`), then the parks menu's picks, each with
a link to its page („Wartezeiten") and to its crowd calendar („Andrang-Kalender",
`PARK_CALENDAR_SEGMENTS`). The links need no API, so the Suspense fallback
(`FeaturedParksSkeleton`) draws them too and the band keeps its height when the cards arrive.

## Questions

`FaqSection`: five questions (`whatIs`, `liveData`, `whichParks`, `free`, `mobile`), rendered and
marked up from one array by `FaqList`. Everything else a visitor might ask is on the guide page.

## Caching and payload

`revalidate` is a week: every fetch in the render (`getGlobalStats`, `getGeoLiveStats`,
`getGeoStructure`) is cached a week, and the AI and families chapters that pinned the route to a day
are gone ([PAR-1113](https://linear.app/parkfan/issue/PAR-1113)). Read `initialRevalidateSeconds` in
`.next/prerender-manifest.json` after touching a fetch.

## Where the old chapters went

| Chapter                                          | Now                              |
| ------------------------------------------------ | -------------------------------- |
| three steps, live waits with the top-ten table   | the tour, and the guide page     |
| own forecast, Fancast figures                    | Fancast                          |
| crowd calendar explained, quiet windows          | the tour, and best time to visit |
| minimum heights                                  | the parks' „mit Kindern" pages   |
| shows and restaurants                            | the park pages                   |
| dictionary with the 3-D player                   | the glossary                     |
| blog band under the hero and blog chapter        | „Neu auf park.fan", once         |
| why park.fan, global and platform stats, founder | removed                          |
| Google preferred source                          | the footer                       |
