# Most read: the page-view counter, the rankings and where they show

The most read guides of the last 30 days and the most read news of the last 7, per language, from
park.fan's own page-view counter on api.park.fan. **PAR-1089.** The backend half (table, cap,
endpoints) is documented in the API repo, `docs/frontend/page-views.md`.

## Why our own counter and not Umami

Umami already counts every page view, but its numbers sit behind a paid API outside our cache, and
the dashboard is where they belong. The counter here is deliberately narrow: four kinds, a key per
page, a language, a day, a number. It answers "what is read most, in which language", for the lists
on the site and for the admin. A general event store ("URL, tag, metadata") would be a second Umami.

## What is counted

| Kind         | Where the beacon sits           | Key                         |
| ------------ | ------------------------------- | --------------------------- |
| `article`    | `BlogPostPageBody`, an article  | the post's `translationKey` |
| `news`       | `BlogPostPageBody`, a news post | the post's `translationKey` |
| `park`       | the park page                   | the park's UUID             |
| `attraction` | the ride page                   | the attraction's UUID       |

**The key is the same in every language.** `/de/blog/phantasialand-tipps` and
`/fr/blog/phantasialand-temps-d-attente-conseils` are one `translationKey`; a park or a ride is one
UUID whatever its URL. The language travels **beside** the key (`locale`), so every ranking can be
per language while the admin still adds a post's six languages up.

`PageViewBeacon` (`components/analytics/page-view-beacon.tsx`) sends the view with
`sendPageView` (`lib/analytics/page-views.ts`):

- **after five seconds in the foreground** (`PAGE_VIEW_DWELL_MS`). A tab opened in the background
  and closed unseen counts nothing; switching away restarts the wait.
- **straight to api.park.fan** (`API_ORIGIN`), never through a relay route here: the API caps a
  reader by address and drops bots by User-Agent, and both have to be the reader's own. CORS for
  park.fan and the preflight cache (two hours) are the API's (`buildCorsOptions`).
- **not at all** under Do Not Track, after the analytics opt-out on the privacy page
  (`analyticsOptedOut`, `lib/analytics/opt-out.ts`, the same switch Umami reads) or from automation
  (`navigator.webdriver`).
- **once per tab**, in memory. Nothing is written to the browser's storage: a flag kept there for a
  statistic would need consent (§ 25 TDDDG), and the API's cap (three views per address, page,
  language and UTC day) already holds a reader who reloads.

Bots are dropped by the API, by User-Agent; the cap stores no address (an HMAC under a secret that
lives in the API's environment). The privacy page says so in section 4, „Eigener Aufrufzähler".

## Where the rankings come from

`getMostRead(locale)` (`lib/blog/most-read.ts`) asks `/v1/page-views/top` for both kinds in the
locale (`MOST_READ_DAYS`: 30 for articles, 7 for news) and resolves the keys against that locale's
manifest. A key the manifest does not know is dropped, which is what keeps a junk write to the API
off the site. A list with fewer than three known posts is empty, and every surface then draws
nothing. Each list holds one post more than it shows (`MOST_READ_LIMIT` + 1), so a post page can
leave itself out and still list five.

`/api/nav/most-read/[locale]` serves both lists. It is fetched by the browser, never rendered into a
page: the homepage shell is a week old (`revalidate = 604800`) and the header band ships on every
page. **One hour** everywhere: the API's `Cache-Control` on the ranking, `CACHE_TTL.pageViews` on
the Data Cache, and the `sharedCache` rule for the route in `next.config.ts`. `useMostRead`
(`lib/hooks/use-most-read.ts`) is the one query key every surface shares, so a tab asks once.

## Where they show

| Surface                 | Component                                         | Loads               |
| ----------------------- | ------------------------------------------------- | ------------------- |
| Header, „Guides" panel  | `MostReadMenuColumn kind="article"`, third column | when the band opens |
| Header, News panel      | `MostReadMenuColumn kind="news"`, third column    | when the band opens |
| Homepage, blog chapter  | `MostReadStream kinds={['article', 'news']}`      | after load          |
| Foot of every article   | `MostReadStream kinds={['article']}`, without it  | after load          |
| Foot of every news post | `MostReadStream kinds={['news']}`, without it     | after load          |

Both draw the same row, `MostReadRow` (`components/blog/most-read-row.tsx`): the place (a flame
for the first), one line of context (the category, or a news post's age) and the title, as a light
row and not as a card. The lists are a side note to the posts they rank, so they must not outweigh
the newest posts or look like one more grid beside the park and ride sections.

- **Header column:** text rows only, so the column stays narrow beside the panel's covers. Closed
  and never opened, it puts nothing into the page's HTML. A language without a list draws no column,
  and the panel keeps its two.
- **`MostReadStream`** (homepage, post foot): each kind under a `MenuSectionHeading` rendered as a
  real heading (`as`), the rows with a 64 × 40 cover from `sm` up. On the homepage guides and news
  stand side by side from `lg` up and one under the other below; on a phone the rows drop the cover,
  so five of them stay short. Until the ranking arrives the block holds its height with placeholder
  rows of the rows' own height (`MOST_READ_ROW_HEIGHT`).

## „Meistgelesen" on the leader

`MostReadBadge` marks the one article and the one news post at the top of the reader's language
wherever they are listed: over the cover in the `/blog` and `/news` streams (`variant="auto"`, the
flame alone on a phone, through `PostStreamEntry`'s `badge` slot), on the homepage's cards and news
rows (`markMostRead` on `BlogPostCard` and `NewsRow`), and on the post's own kicker line. In the
most-read lists the first place carries the flame in place of its number. It arrives after
load, so it is always laid over a cover or put on a line that already exists, and fades in
(`starting:opacity-0`). Park and ride pages do not mark their blog sections: they would fetch the
ranking on the most visited pages for one icon.

## The admin

`/admin/popularity` („Beliebtheit") reads `GET /v1/admin/page-views` through the admin proxy: per
kind the total and the leading language, a table of kind × language, the views per day, and the 25
most viewed pages of each kind with a column per language. Parks and rides come with name and link
from the API; posts are named from the German manifest, which the server page hands to the view.

## Strings

All in `navigation` (`mostRead`, `mostReadNews`, `mostReadWindow`, `mostReadBadge`, and `blog` for
„Guides"), the chrome namespace every page already ships, because the header column and the badge
render on every route.
