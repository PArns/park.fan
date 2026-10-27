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
  and closed unseen counts nothing; switching away restarts the wait. No `keepalive`: the view goes
  out while the page is in front, not as it unloads.
- **straight to api.park.fan** (`API_ORIGIN`), never through a relay route here: the API caps a
  reader by address and drops bots by User-Agent, and both have to be the reader's own. CORS for
  park.fan and the preflight cache (two hours) are the API's (`buildCorsOptions`).
- **only on production's hosts** (`ANALYTICS_HOSTS`, `lib/analytics/opt-out.ts`, the same list
  Umami's `data-domains` reads), so a preview or a local build never writes into the live ranking.
- **not at all** under Do Not Track (each spelling Umami reads), Global Privacy Control, after the
  analytics opt-out on the privacy page (`analyticsOptedOut`, the same `umami.disabled` flag Umami
  reads) or from automation (`navigator.webdriver`). The API refuses `DNT: 1` and `Sec-GPC: 1` on
  its own as well.
- **once per tab**, in memory. Nothing is written to the browser's storage: a flag kept there for a
  statistic would need consent (§ 25 TDDDG), and the API's cap (three views per reader and page, a
  reader being an address, an IPv6 /64, plus a User-Agent) already holds one who reloads.
- **with the URL's locale.** A post read in a language it was not written in (the reader's locale
  falls back to another one's text) counts for the language of the URL, which is the list the
  reader sees.

Bots are dropped by the API, by User-Agent; the cap stores no address (an HMAC under a secret that
lives in the API's environment). The privacy page says so in section 4, „Eigener Aufrufzähler".

## Where the rankings come from

`getMostRead(locale)` (`lib/blog/most-read.ts`) asks `/v1/page-views/top` for both kinds in the
locale (`MOST_READ_DAYS`: 30 for articles, 7 for news, the only windows the API serves besides 90)
for 40 keys, and resolves them against that locale's manifest. A key the manifest does not know is
dropped, which is what keeps a junk write to the API off the site; 40 rather than six, so a handful
of junk keys cannot empty a list.

**Every list is full.** Each holds one post more than it shows (`MOST_READ_LIMIT` + 1), so a post
page can leave itself out and still list five. Where fewer posts were read in the window (a quiet
language, the first hours after a deploy), the newest unread posts follow with 0 views: a tie at
the bottom of the ranking, broken by recency. That keeps the list's height known before it arrives
(see below) and never leaves a language with half a list. A row carries only what it draws: key,
path, title, category or date, cover and views.

**A failure is not a list.** If either ranking fails, `getMostRead` throws and the route answers
**502** with `no-store`, so no cache keeps it; a 200 with empty lists would sit at the edge, at
Cloudflare and in the browser for an hour. On a 502 the post foot and the homepage keep the
build's snapshot (below) and the header column draws nothing (`useMostRead` retries once).

`/api/nav/most-read/[locale]` serves both lists to the browser. `useMostRead`
(`lib/hooks/use-most-read.ts`) is the one query key every surface shares, so a tab asks once, and it
hands back nothing before hydration is over.

**The build's snapshot is in the HTML.** A list that only the browser fetches is invisible to a
crawler that does not run the request (`/api/` is disallowed in robots), and the post foot is where
a post links its section's most read. So `pnpm prebuild` runs `generate:most-read-seed`
(`scripts/generate-most-read-seed.mjs`): it asks the API for every locale's two rankings once and
writes keys and counts to `lib/blog/most-read-seed.generated.ts` (git-ignored, like the manifests).
`getMostReadSeed(locale)` resolves them against the manifest with the same `resolveMostRead`, and the
post foot and the homepage render that into the server's HTML. After load the browser swaps in the
current ranking row for row; both are full lists of fixed-height rows, so the swap moves nothing.

- **It is stale on purpose.** It is as old as the deploy, and the homepage shell or an ISR post page
  keeps it for its own window. It costs no request and no `revalidate`, so no page's cache window
  changes.
- **It cannot fail the build.** A ranking the API does not give within eight seconds is written
  empty, and an empty ranking renders as the newest posts. `pnpm typecheck` and `pnpm test:unit`
  write an empty one with `--offline --if-missing` and never ask the API.
- **A post page ships one kind** (`mostReadSeedOf`), about 1.5 KB of rows in its payload. The header
  column is not seeded: its band ships on some 35,000 pages, and those links would change the
  header's link graph everywhere ([the header menu rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md)).

**How old a ranking can be.** Each layer keeps it an hour: Cloudflare in front of the API (its
`Cache-Control`), the Data Cache (`CACHE_TTL.pageViews`), the route's own `CDN-Cache-Control`
(also in `next.config.ts`), and the browser (`max-age=3600`). They stack, so a list can be up to
three hours behind, and a browser that comes back within a day may show its stale copy once while
it fetches the next (`stale-while-revalidate`). For a 7- and a 30-day ranking that is fine.

## Where they show

| Surface                 | Component                                         | Loads               |
| ----------------------- | ------------------------------------------------- | ------------------- |
| Header, „Guides" panel  | `MostReadMenuColumn kind="article"`, third column | when the band opens |
| Header, News panel      | `MostReadMenuColumn kind="news"`, third column    | when the band opens |
| Homepage, blog chapter  | `MostReadStream kinds={['article', 'news']}`      | snapshot, then load |
| Foot of every article   | `MostReadStream kinds={['article']}`, without it  | snapshot, then load |
| Foot of every news post | `MostReadStream kinds={['news']}`, without it     | snapshot, then load |

Both draw `MostReadList` (`components/blog/most-read-list.tsx`): the rule with the label and the
window, and the rows, `MostReadRow`: the place (a flame for the leader), one line of context (the
category, or a news post's age) and the title, as a light row and not as a card. The lists are a
side note to the posts they rank, so they must not outweigh the newest posts or look like one more
grid beside the park and ride sections. Each `<li>` carries its place as `value`, so a list under
the leader's own page reads 2 to 6, not 1 to 5.

**The height is fixed.** A row has a fixed height (`MOST_READ_ROW_HEIGHT`, 68 px: a 16 px context
line and two 20 px title lines), and every list is full. On the post foot and the homepage the
snapshot's rows give way to the current ones one for one; in the header column, which has no
snapshot, `MOST_READ_LIMIT` placeholders of that height do. Nothing below moves either way.

- **Header column:** text rows only, so the column stays narrow beside the panel's covers, and only
  where the header is 1280 px wide (`@min-[1280px]`): at the 1024 tier a third column took a third
  of the news wire's and the guides' text width. It mounts once its band has been opened at that
  width and puts nothing into the page's HTML before.
- **`MostReadStream`** (homepage, post foot): each kind under a `MenuSectionHeading` rendered as a
  real heading (`as`), the rows with a 64 × 40 cover from `sm` up. On the homepage guides and news
  stand side by side from `lg` up and one under the other below; on a phone the rows drop the cover.

## „Meistgelesen" on the leader

`MostReadBadge` marks the one article and the one news post that clearly lead the reader's
language, wherever they are listed: over the cover in the `/blog` and `/news` streams
(`variant="auto"`, the flame alone on a phone, through `PostStreamEntry`'s `badge` slot), on the
homepage's cards and news rows (`markMostRead` on `BlogPostCard` and `NewsRow`), and beside the
kicker of the post's own banner. In the most-read lists the leader carries the flame in place of
its number.

**Who leads** is `mostReadLeader` (`lib/blog/most-read-config.ts`), one question for the flame and
the badge: the first post, with at least `MOST_READ_LEADER_MIN_VIEWS` (5) views and more than the
second. A tie leads nobody, and nor does a quiet language where one reader would decide.

It arrives after load, so it never takes room of its own: over a cover, or in the banner absolutely
positioned beside the kicker, where it can neither add height nor make a long kicker wrap. It fades
in (`starting:opacity-0`). Park and ride pages do not mark their blog sections: they would fetch the
ranking on the most visited pages for one icon.

## The admin

`/admin/popularity` („Beliebtheit") reads `GET /v1/admin/page-views` through the admin proxy
(`useAdminQuery`): per kind the total and the leading language, a table of kind × language, the
views per day (every day of the window, empty ones included), and the 25 most viewed pages of each
kind with a column per language. „Alle" ranks them over all languages; a language button ranks them
by that language's views, so a page read mostly in Dutch is found too. 7, 30 or 90 days. Parks and rides come with name and link
from the API; posts are named from the German manifest, which the server page hands to the view.

## Strings

All in `navigation` (`mostRead`, `mostReadWindow`, `mostReadBadge`, and `blog` for „Guides"), the
chrome namespace every page already ships, because the header column and the badge render on every
route. The news label is the news category's (`categories.json`), passed in by the server parent,
as the header's News entry does.

## Tests

`pnpm test:most-read` resolves real manifests against a stubbed API: a key is the same post at each
locale's own `postPath`, junk keys drop out, a thin ranking is filled with the newest posts, places
survive leaving a post out, the leader rule, a failed ranking throws, and the beacon's gates (host,
automation, Do Not Track, GPC, opt-out, once per tab, no relay, no `keepalive`).
