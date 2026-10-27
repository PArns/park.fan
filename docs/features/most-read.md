# Most read: the page-view counter, the rankings and where they show

The most read guides of the last 30 days and the most read news of the last 7, per language, plus the
most viewed parks, from park.fan's own page-view counter on api.park.fan. This page is the frontend
half: the beacon, the rankings, the build's snapshot, the surfaces (the popular-park cards and their
hand-picked `FEATURED_PARK_SLUGS` included), the admin view. Open it before touching any of them.

- The rule: [most read is counted per language, by a key every language shares](../rules/most-read-is-counted-per-language.md)
- The API half (why a counter and not Umami, kinds and keys, the per-reader cap, bot filtering,
  storage, endpoints):
  [`docs/frontend/page-views.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/page-views.md)

## The beacon

| Kind         | Where the beacon sits           | Key                         |
| ------------ | ------------------------------- | --------------------------- |
| `article`    | `BlogPostPageBody`, an article  | the post's `translationKey` |
| `news`       | `BlogPostPageBody`, a news post | the post's `translationKey` |
| `park`       | the park page                   | the park's UUID             |
| `attraction` | the ride page                   | the attraction's UUID       |

`PageViewBeacon` (`components/analytics/page-view-beacon.tsx`) sends the view with `sendPageView`
(`lib/analytics/page-views.ts`):

- **after five seconds in the foreground** (`PAGE_VIEW_DWELL_MS`); a tab opened in the background and
  closed unseen counts nothing, and switching away restarts the wait. No `keepalive`.
- **straight to api.park.fan** (`API_ORIGIN`), never through a relay here, because the API's cap and
  bot filter must see the reader's own address and User-Agent.
- **only on production hosts** (`ANALYTICS_HOSTS`, `lib/analytics/opt-out.ts`, the list Umami's
  `data-domains` reads), so previews and local builds never write into the live ranking.
- **not at all** under Do Not Track (each spelling Umami reads), Global Privacy Control, the privacy
  page's analytics opt-out (`analyticsOptedOut`, Umami's `umami.disabled` flag) or automation
  (`navigator.webdriver`).
- **once per tab**, in memory. Nothing goes into browser storage: a flag kept there for a statistic
  would need consent (§ 25 TDDDG), and the API's cap already absorbs a reader who reloads.
- **with the URL's locale**, so a post read in a fallback language counts for the list the reader sees.

The privacy page describes the counter in section 4, „Eigener Aufrufzähler".

## The rankings

`getMostRead(locale)` (`lib/blog/most-read.ts`) asks `/v1/page-views/top` for both kinds in the locale
(`MOST_READ_DAYS`: 30 for articles, 7 for news) for `MOST_READ_ASK_FOR` (40) keys and resolves them
against that locale's blog manifest (`resolveMostRead`). A key the manifest does not know is dropped,
which keeps junk writes off the site; asking for 40 means a handful of junk keys cannot empty a list.

- **Every list is full.** Each holds `MOST_READ_LIMIT` + 1 posts, so a post page can leave itself out
  and still list five. Where fewer posts were read in the window, the newest unread posts follow with
  0 views. That keeps the list's height known before it arrives.
- **A failure is not a list.** If either ranking fails, `getMostRead` throws and
  `/api/nav/most-read/[locale]` answers **502** with `no-store`; a 200 with empty lists would sit in
  every cache for an hour. On a 502 the post foot and the homepage keep the build's snapshot and the
  header column draws nothing.
- `useMostRead` (`lib/hooks/use-most-read.ts`) is the one query key every surface shares, so a tab
  asks once; it returns nothing before hydration is over and retries once.

**The build's snapshot is in the HTML.** A list only the browser fetches is invisible to a crawler
(`/api/` is disallowed in robots), so `prebuild` runs `generate:most-read-seed`
(`scripts/generate-most-read-seed.mjs`), which writes every locale's rankings to
`lib/blog/most-read-seed.generated.ts` (git-ignored). `getMostReadSeed(locale)` resolves it with the
same `resolveMostRead`, the post foot and the homepage render it on the server, and after load the
browser swaps in the current ranking row for row without moving anything.

- It is as old as the deploy, costs no request and adds no `revalidate`, so no page's cache window
  changes.
- It cannot fail the build: a ranking that does not arrive within eight seconds is written empty and
  renders as the newest posts. `pnpm typecheck` and `pnpm test:unit` run it with
  `--offline --if-missing` and never ask the API.
- A post page ships only its own kind (`mostReadSeedOf`), about 1.5 KB. The header column is not
  seeded: its band ships on some 35,000 pages, and its links would change the header's link graph
  everywhere ([the header menu rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md)).

**How old a ranking can be.** Four layers each keep it an hour: Cloudflare in front of the API, the
Data Cache (`CACHE_TTL.pageViews`), the route's `CDN-Cache-Control` (also in `next.config.ts`) and the
browser (`max-age=3600`, with `stale-while-revalidate`). They stack, so a list can be up to three hours
behind; fine for 7- and 30-day windows.

## Where they show

| Surface                 | Component                                         | Loads               |
| ----------------------- | ------------------------------------------------- | ------------------- |
| Header, „Guides" panel  | `MostReadMenuColumn kind="article"`, third column | when the band opens |
| Header, News panel      | `MostReadMenuColumn kind="news"`, third column    | when the band opens |
| Homepage, blog chapter  | `MostReadStream kinds={['article', 'news']}`      | snapshot, then load |
| Foot of every article   | `MostReadStream kinds={['article']}`, without it  | snapshot, then load |
| Foot of every news post | `MostReadStream kinds={['news']}`, without it     | snapshot, then load |

Both draw `MostReadList` (`components/blog/most-read-list.tsx`) with `MostReadRow` rows: the place (a
flame for the leader), one line of context (category, or a news post's age) and the title, as a light
row rather than a card, so the lists do not outweigh the newest posts. Each `<li>` carries its place
as `value`, so a list under the leader's own page reads 2 to 6.

**The height is fixed.** A row is `MOST_READ_ROW_HEIGHT` (68 px: a 16 px context line and two 20 px
title lines) and every list is full, so snapshot rows give way to current ones one for one, and in the
header column `MOST_READ_LIMIT` placeholders of that height do.

- **Header column:** text rows only, and only where the header is 1280 px wide (`@min-[1280px]`); at
  the 1024 tier a third column took a third of the panel's text width. It mounts once its band has
  been opened at that width and puts nothing into the page's HTML before.
- **`MostReadStream`:** each kind under a `MenuSectionHeading` rendered as a real heading (`as`), rows
  with a 64 × 40 cover from `sm` up (`BlogCoverFallback` without one). On the homepage guides and news
  stand side by side from `lg` up; on a phone the rows drop the cover.

## „Meistgelesen" on the leader

`MostReadBadge` marks the one article and the one news post that clearly lead the reader's language:
over the cover in the `/blog` and `/news` streams (`variant="auto"`, the flame alone on a phone,
through `PostStreamEntry`'s `badge` slot), on the homepage's cards and news rows (`markMostRead` on
`BlogPostCard` and `NewsRow`), and beside the kicker of the post's own banner. In the lists the leader
carries the flame in place of its number.

**Who leads** is `mostReadLeader` (`lib/blog/most-read-config.ts`), one question for flame and badge:
the first post, with at least `MOST_READ_LEADER_MIN_VIEWS` (5) views and more than the second. A tie
leads nobody, and neither does a quiet language where one reader would decide.

It arrives after load, so it never takes room of its own: over a cover, or absolutely positioned beside
the banner's kicker. It fades in (`starting:opacity-0`). Park and ride pages do not mark their blog
sections: they would fetch the ranking on the most visited pages for one icon.

## Popular parks

Parks are counted too (`kind=park`, by UUID), and four surfaces show the ones this locale's readers
opened most in the last 30 days (`VIEWED_PARKS_DAYS`), ahead of a hand-picked fallback that fills up
where too few parks were counted. A park counts from three views
(`VIEWED_PARK_MIN_VIEWS`). One resolver, `lib/parks/viewed-parks.ts`: `resolveViewedParks` turns the
ranking's UUIDs into parks through the geo structure (`geoParks`), `rankedFirst` puts them ahead of
the fallback without doubles and at its length.

| Surface                         | Reads                                        | Fallback                                           |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| Footer, four country columns    | the build's snapshot (`viewedParksSeed`)     | the column's hand-picked parks                     |
| Homepage „Beliebte Parks" cards | the snapshot, through `extractFeaturedParks` | `FEATURED_PARK_SLUGS`                              |
| Parks menu, card rail           | the snapshot, with or without a photo        | `FEATURED_PARK_SLUGS` with a photo, then any photo |
| Hero, no park nearby            | live, `/api/parks/popular?locale=`           | the API's request ranking (`getPopularParks`)      |

- **The countries stay fixed.** The footer's columns are Germany, the USA, France and Japan in every
  locale; only the parks under them follow the views. A column keeps its length (five, Japan three).
- **The snapshot is resolved at build time.** `generate:most-read-seed` asks for each locale's park
  ranking (`VIEWED_PARKS_ASK_FOR`, 50, so a country column finds its parks below the few every language
  reads) and the geo structure once, and stores the resolved parks in the same generated file
  (read through `viewedParksSeed`, `lib/parks/viewed-parks-seed.ts`). The footer and the parks menu sit on every page and read no geo;
  a fetch there would put its cache window on all of them.
- **A counted park is never left out for want of a photo** (the American parks have almost none): the
  menu's card shows `BlogCoverFallback`, the homepage's card goes without a picture.
- **Photos are filed by slug**, and a slug can name two parks (`disneyland-park`), so the menu takes a
  counted park's photo only when the photo's park path is the counted park's page.
- **The hero's fallback is live** because the browser fetches it anyway, and only when no park is
  nearby. `getMostViewedParks` answers in the request ranking's shape (`requests` carries the views,
  `url` the API path) and tops up from it. Without `locale` the route still serves the request ranking,
  which the maintenance page polls and `content-urls` uses for the prewarm order.

### The popular-park cards

`FeaturedParksSlot` (`components/home/featured-parks-slot.tsx`) draws the cards as a story chapter
on the homepage and inside `PageBottomSections` at the foot of blog, news and glossary pages. For
the site they are the main internal links into park pages: a most-read park is one click from the
homepage instead of four (home → continent → country → city → park).

- **Server-rendered structure:** the slot reads `getGeoStructure()` at its default window
  (`CACHE_TTL.geo`) and bakes only day-stable fields (name, link, city, photo, translated country).
  A shorter geo window here would pin every host page to it
  ([a `revalidate` at a call site is somebody else's page](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md)).
- **Live data** (status, crowd, wait, schedule) overlays on the client: `FeaturedParkCardsLive` →
  `useLiveParksByRegion`, one `/api/parks/live?regions=…` request for all the cards' regions on the
  5-minute poll. The server-rendered card is status-free.

### Editing the hand-picked list

`FEATURED_PARK_SLUGS` (`components/home/featured-parks-section.ts`) is the fallback and the length:
`extractFeaturedParks()` takes the counted parks first, then the list in its order, until there are
as many cards as the list is long. Each entry carries its reason as a comment (attendance and
language-market search relevance).

- A slug must exist in `/v1/discovery/geo`; one that is not found is dropped with a console warning,
  and the section hides only when no park is found.
- A locale without a list uses `en`.
- **`disneyland-park` is two parks** (Paris and Anaheim). The first match in the structure wins and
  Europe is walked before North America, so it always resolves to Paris. For Anaheim, match by
  path or use another slug.

## The admin

`/admin/popularity` („Beliebtheit", `app/admin/popularity/`) reads `GET /v1/admin/page-views` through
the admin proxy: per kind the total and the leading language, a kind × language table, views per day
(empty days included), and the 25 most viewed pages of each kind with a column per language. „Alle"
ranks over all languages; a language button ranks by that language's views. 7, 30 or 90 days. Parks
and rides come with name and link from the API; posts are named from the German manifest.

## Strings

All in `navigation` (`mostRead`, `mostReadWindow`, `mostReadBadge`, and `blog` for „Guides"), the
chrome namespace every page ships, because the header column and the badge render on every route. The
news label is the news category's (`categories.json`), passed in by the server parent.

## Tests

`pnpm test:most-read` resolves real manifests against a stubbed API: a key is the same post at each
locale's `postPath`, junk keys drop out, a thin ranking fills with the newest posts, places survive
leaving a post out, the leader rule, a failed ranking throws, and the beacon's gates. `pnpm test:viewed-parks`
covers the park resolver.
