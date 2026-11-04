# Homepage

Everything on the homepage under the hero, which has its own page
([homepage hero](homepage-hero.md)). Open this when changing the order or the layout of the stops,
the news board, the tour and its screenshots, the nearby parks and their short waits, the popular
parks' links or the FAQ. Entry point: `app/[locale]/page.tsx`.

The page welcomes a first visit: the hero says what this is and finds a park, the news says what is
new, the tour shows the product on a phone, and only then come the parks near the visitor, the
popular parks and the questions. A visitor who has starred something finds it right under the news. On 2026-11-02 it had 21 sections and was 18,920 px tall on a desktop and
20,530 px on a phone; three quarters of its views came from phones, which stayed 13 seconds.

| #   | Stop            | Layout  | Component                                                            | Data                                                       |
| --- | --------------- | ------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| –   | Hero            | –       | the `<section id="hero">` in `page.tsx`                              | [homepage hero](homepage-hero.md)                          |
| –   | News and guides | stacked | `HomeReading` → `NewsBoard`                                          | the blog manifest and the most-read seed, synchronous      |
| –   | Favourites      | stacked | a `HomeStop` in `page.tsx`, `FavoritesSection`; with favourites only | the favourites cookie                                      |
| –   | The tour        | phone   | `HomeTour` → `ShotStop`                                              | none; screenshots in `public/media/home/`                  |
| –   | Ask Parky       | phone   | `ParkyStop` → `ShotStop`, `ParkyAskLink`                             | none; the screenshot in `public/media/parky/<l>/chat.webp` |
| –   | Near you        | stacked | `NearbyChapter` + `NearbyParksCard showShortWaits`                   | `/v1/discovery/nearby`                                     |
| –   | Popular parks   | beside  | a `HomeStop` in `page.tsx`, `FeaturedParksSlot` + `PopularParkLinks` | `getGeoStructure` (a week), the page-view snapshot         |
| –   | Questions       | beside  | `FaqSection`, the page's only `FAQPage`                              | `seo.homepage.faq`                                         |

In a park, `ParkCompassSlot` puts the headliners on a compass right under the hero
([the in-park compass](park-compass.md)); the announcement band (`AnnounceSection`,
[homepage announcement](homepage-announcement.md)) follows when one is running.

## Stops

Every chapter under the hero is a stop (`components/home/home-stop.tsx`), with no band or frame
around it. Its heading is `ChapterHeading variant="stop"`
([chapter headings](../design/chapter-headings.md#variants)): the number where there is one, the
kicker, an `<h2>` worded as people search, a lead and the stop's link. A stop has one of three
layouts:

- **Stacked** (`HomeStop stacked`): the heading over the content, the content at the page's full
  width. For what wants every column: the news board, the nearby parks (three cards a row), the
  favourites. A heading beside these left half the page to a few lines of text.
- **Beside** (`HomeStop`): from a 1024 px page the heading takes five twelfths and stays in view
  (`sticky`) while the content scrolls past; `reverse` swaps the sides and the tracks with them, so
  the content keeps the wide one. Only where both columns fill: the popular parks, whose twelve
  links stand under the heading (`aside`, after the cards on a phone), and the questions. The
  content column is its own `@container/page`, so a card grid inside asks for two columns, not
  three.
- **Phone** (`ShotStop`): the heading beside a screenshot on a phone (`ShotRow`), alternating
  sides. The tour and Parky.

- **Separation is room and a hairline**: `py-16 sm:py-24` per stop, and `STOP_DIVIDER_CLASS`, a
  line that fades out at both ends, where a new group begins (the parks near you, popular parks,
  the questions). The chapter headers before them (a 68 px plate, a pill, the title, a hint and a rule
  over every chapter) took about 200 px each and said what the content under them showed.
- **The tour and Parky are one run**: `ShotStop` draws no hairline, and on a phone its room is
  half a `HomeStop`'s (`py-8 sm:py-24`), 64 px between two stops: text and phone stack to more
  than a screen, and 128 px between two of them read as a hole.
- **The tour runs on from the news board**: no hairline between them, and the tour's first stop
  has no room of its own on top (`ShotStop flushTop`), so the news stop's room below is the whole
  gap, 64 px on a phone and 96 px from 640 px. With a line and both stops' room it was 129 px and
  193 px. The favourites, where they show, stand between the two the same way (`HomeStop
flushTop`), so each gap is the room under the stop above.
- **Only the tour is numbered.** A number must not skip
  ([the rule](../rules/a-chapter-opens-the-same-way-everywhere.md)), and the favourites show for few
  visitors; the other stops open with their kicker. The news board has none: it is the first stop
  under the hero, and its title already says news and guides.

## What people search for

Search Console, 90 days to 2026-10-31: almost every query that finds park.fan is one of two shapes,
„<park> wartezeiten" (live, aktuell, heute; „<park> wait times", „queue times") and „<park>
auslastung", „andrang kalender", „prognose", „wie voll ist … heute" („crowd calendar", „how busy is
… today"). The generic ones the homepage itself ranks for are „freizeitpark wartezeiten" (1,491
impressions, position 4.7), „wartezeiten" (2,039, 7.7), „freizeitpark auslastung" and „wartezeiten
app". The page answers in those words:

- every stop's `<h2>` is worded as people search: „Freizeitpark-News und Guides", the tour's
  „Wartezeiten live, für jede Bahn", „Der Andrang-Kalender: wie voll es wird, Tag für Tag",
  „Prognose: …", then „Freizeitparks in deiner Nähe", „Wartezeiten und Andrang in den
  beliebtesten Parks" and „Freizeitpark-Wartezeiten, kurz erklärt";
- `PopularParkLinks` links each popular park's waits and its calendar, the two pages those queries
  want, with the park's name in the link text;
- the FAQ asks whether park.fan works on a phone without an app (`mobileQ`).

## What is new comes first: the news board

`HomeReading` puts the six newest news posts and the four most read articles of the last 30 days
(`getMostReadSeed`, the newest where the build did not reach the API) on one board (`NewsBoard`,
`components/home/news-board.tsx`), the articles under the news on a narrow page and beside them from
a 1024 px page. Four articles are about as tall as six news posts over five days: 611 px against
585 px on a 1440 px window.

- **A phone shows three of each** (`PHONE_ROWS`, below `sm`): stacked, the two groups make one long
  column before the tour. The rows past the cut are hidden in CSS, and the row the cut ends in drops
  the rule `divide-y` draws under it.
- **The news stands by day, as on `/news`**: each day's date and age (`NewsAge`, „vorgestern · 31.
  Okt. 2026") in a column on the left, that day's posts beside it. Stacked on a phone.
- **The articles** are ranked by reads, so their date stands beside the reading time over the
  title, not in a column.
- **Every post has a small cover** on the right, the brand fallback where it has no photo, its hue
  from the slug so two posts of one day still read as two.
- **News stays a step below the articles** ([the rule](../rules/news-is-set-apart-from-the-articles.md)):
  a semibold title and no teaser, against a bold, larger title with a two-line teaser.
- **The board follows the theme** like every card, so nothing inside needs a colour of its own. A
  pulsing dot in front of „News" says the group is what just happened.

The stop stands first because the hero already lists the parks near the visitor, and the news is
what changes from one visit to the next. The manifest is read synchronously, so the board is in the
first HTML and changes with every deploy that brings a post.

## The tour

`HomeTour` shows three stops, each its heading beside a screenshot in a phone
(`ShotStop`; `ShotRow` and `PhoneShot` in `components/marketing/`, shared with Parky's page):

| Stop     | Screenshot                              | Leads to           |
| -------- | --------------------------------------- | ------------------ |
| live     | Europa-Park's page, the headliners      | the guide page     |
| calendar | Europa-Park's crowd calendar, the month | best time to visit |
| ride     | Silver Star's day with the forecast     | the trip planner   |

- **The screenshots are per locale** and from the real pages, taken by
  `scripts/capture-home-shots.mjs` (`public/media/home/<locale>/{park,calendar,ride}.webp`, 1206 × 2436,
  an iPhone 17's screen under its status bar at 3×, `scripts/lib/phone-device.mjs`). `PhoneShot`
  draws the status bar and its island above the picture, so the frame has the phone's proportions
  and the page's header starts below the island. They show live data, so take them while the park is open.
- **Motion**: each stop rises in (`Reveal`), and its
  phone glides 48 px against the page while it scrolls past (`ShotRow drift`, `.pk-shot-drift` in
  `app/globals.css`, a scroll-driven animation on the standalone `translate`, so the frame's tilt
  stays). Nothing moves while the page stands still, and none of it runs under
  `prefers-reduced-motion` or without `animation-timeline`.
- **Room**: `overflow-hidden` on each `ShotStop` keeps the phone's glow from widening a phone's
  page.

## Near you

`NearbyChapter` (stacked) frames `NearbyParksCard` (geolocation, else the API's GeoIP guess, after load and
idle) with all its states: the prompt, the nearby parks with the open ones first, the in-park view,
the error. The stop holds the `<h2>` and the location button (`HomeLocationRow`) under its lead,
so the card (`nested`) draws no title of its own, only its hint line, and starts flush with the
heading. On the homepage the card passes `showShortWaits`, so the parks are followed by „Jetzt
kurz anstehen" (`NearbyShortWaits`): the rides in the open nearby parks whose live wait is well below
their usual one, as the API picks them (`shortWaits`, contract in the API's
[discovery](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/discovery.md#shortwaits)).
Nothing is drawn when the list is empty, which is every evening and the whole off-season.

## Favourites

The favourites are a stop of their own (`FavoritesSection heading="none"` in a `HomeStop`), right
under the news and shown only for a visitor with favourites: for them it is what they came back
for, and for anybody else an empty state about a feature they have not used. The inline favourites
script in `app/[locale]/layout.tsx` sets `data-has-favorites` before paint, and `.home-favorites` in
`app/globals.css` hides the band without it, so the choice moves nothing after load.

## Popular parks and their links

The stop holds `FeaturedParksSlot heading="none"`, six park cards, and, as its `aside`, under the
heading, `PopularParkLinks`: twelve parks, the build's page-view snapshot first
(`viewedParksSeed`), then the parks menu's picks, each with a link to its page („Wartezeiten") and to
its crowd calendar („Andrang-Kalender", `PARK_CALENDAR_SEGMENTS`). The cards run far taller than
the heading, so the links fill the heading's column instead of leaving it empty; on a phone they
follow the cards. They need no API and stand outside the `<Suspense>`.

## Questions

`FaqSection`: five questions (`whatIs`, `liveData`, `whichParks`, `free`, `mobile`), rendered and
marked up from one array by `FaqList`. Everything else a visitor might ask is on the guide page,
which the stop links.

## Ask Parky

Straight after the tour, `ParkyStop`: „Nicht gefunden, was du suchst? Frag Parky", for whoever has
not found what they came for or does not quite know what that is, beside Parky's chat on a phone
(`public/media/parky/<l>/chat.webp`, from `capture-parky-shots.mjs`). Its link, `ParkyAskLink`, opens the
chat where Parky shows for the visitor (`openParky`) and otherwise leads to Parky's page. It never
invites a visitor the rollout left out (`assistantGate.invite`); that stays Parky's page's call.
Once the stop reaches the middle of the screen, `ParkyHello` reports `home_parky_seen`, and the live
Parky in the corner hops and says „Hey, cool! Das bin ja ich!" (`HELLO` in `lib/assistant/reactions.ts`,
once a session like every answer).

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
| blog band under the hero and blog chapter        | the news board, once             |
| why park.fan, global and platform stats, founder | removed                          |
| Google preferred source                          | the footer                       |
