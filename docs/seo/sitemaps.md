# Sitemaps

What park.fan publishes to crawlers as sitemaps, which URLs are deliberately left out, and how
`<lastmod>` is observed rather than stamped. Open it before adding a URL class or touching a
sitemap route, the content-change crawl or the IndexNow cron. The rule behind the dates is
[a `<lastmod>` is observed, never stamped](../rules/a-lastmod-is-observed-never-stamped.md).

## Four entry points

All four are listed in `robots.txt` (`app/robots.txt/route.ts`):

1. `/sitemap.xml` (`app/sitemap.ts`): every page type except rides and calendar months, each
   entry with the full hreflang block (six locales plus `x-default`).
2. `/sitemap-attractions.xml` (`app/sitemap-attractions.xml/route.ts`): a **sitemap index** over
   `/sitemap-attractions/<locale>.xml` (`app/sitemap-attractions/[locale]/route.ts`), each a lean
   `<loc>` list of that locale's ride URLs from `getAttractionPaths()` (7,542 per locale on
   2026-10-27).
3. `/sitemap-calendar.xml` (`app/sitemap-calendar.xml/route.ts`): the same shape over
   `/sitemap-calendar/<locale>.xml`, the crowd-calendar **month** URLs.
4. `/sitemap-news.xml` (`app/sitemap-news.xml/route.ts`, `lib/seo/news-sitemap.ts`): a Google News
   sitemap, see [below](#the-news-sitemap).

The index URLs are the ones submitted in Search Console, and Search Console reports coverage per
child file, so six comparable numbers replace one.

**Why rides and months are indexes, not part of `/sitemap.xml`.** Two ceilings: 50,000 URLs and
50 MB per file. Rides × six locales are about 45,000 URLs, close to the first. With hreflang the
alternate block is seven near-full URLs per entry, which put a single ride file at 49 MiB (98 % of
the second). The calendar months shipped inside `/sitemap.xml` first and took it to 39.5 MB; a
file over the limit is rejected whole, which would have taken parks, hubs, glossary and blog down
with it. Split, each ride child is about 1.2 MiB and `/sitemap.xml` was 5,557 URLs / 5.78 MB on
2026-09-21. The children carry no hreflang: every ride page serves its alternates in its `<head>`,
which Google weighs the same.

## Which calendar months are listed

Three rules, each preventing a specific wrong URL:

- **The current month is skipped.** The route canonicalizes it to the calendar hub, so listing it
  would be a self-made duplicate.
- **One month short of the route's window at each end.** The window is
  `PARK_CALENDAR_MONTH_SPAN` (`lib/parks/calendar-segments.ts`, 3 back, 12 forward) and its
  forward end follows each park's published schedule (`scheduleCoverage.to`). The sitemap is
  cached for a day while the route computes its range from a live clock, so at a month rollover a
  cached file would list a month that now 308s to the hub.
- **The window is measured from today in the park** (`currentParkCalendarMonth(park.timezone)`),
  as the page does it.

Months that fell out of the window keep answering 308 (about 1,260 more at every rollover); that
is an accepted cost ([crawl budget](crawl-budget.md)). The span decides the file size: raising
`back` puts the bytes back.

## What `/sitemap.xml` holds

| URLs                                                                                    | `lastModified`                         |
| --------------------------------------------------------------------------------------- | -------------------------------------- |
| `/{locale}` home, `/fancast`, `/contribute`, the guide, the planner, best time to visit | none (code, not content)               |
| `/en/changelog` (English only, no alternates)                                           | newest entry's date                    |
| `/{locale}/parks`, continent, country and **multi-park** city hubs                      | observed                               |
| `/{locale}/parks/six-flags` and `/universal`, the [brand pages](brand-pages.md)         | observed                               |
| `/{locale}/parks/…/{park}` (with the park's photos as image entries)                    | observed                               |
| `/{locale}/parks/…/{park}/{calendar-segment}` (the calendar hub)                        | none                                   |
| `/{locale}/parks/…/{park}/{stats-segment}`, **displayable parks only**                  | none                                   |
| `/{locale}/parks/…/{park}/{kids-segment}`, **gated parks only**                         | none                                   |
| glossary index and terms                                                                | `GLOSSARY_CONTENT_DATE`                |
| `/{locale}/blog`, `/{locale}/news`, categories, authors, indexable tags (page 1)        | newest post in the list                |
| blog and news posts, **real translations only**                                         | observed, at least `updatedAt ?? date` |

- **The two gated classes** are listed only for parks that have the page, decided by the same
  probe the route 404s on (`parksWithStatsPage()`, `parksWithKidsPage()`); a park whose probe
  fails is left out rather than advertised. They and the calendar hub carry no date because
  their content is recomputed daily on every park at once, and one identical date across a class
  is what gets `lastmod` discounted. Gates and counts: [park sub-pages](park-sub-pages.md).
- **The undated code pages** (home, Fancast, contribute, the guide, the planner, best time) have no
  honest change date: nothing writes one down, and a hand-kept constant would be stale within two
  deploys. `GLOSSARY_CONTENT_DATE` earns its place because the glossary is reviewed as a body of
  text.
- **`changefreq` and `priority`** are ignored by Google. `/sitemap.xml` emits neither; the ride
  and calendar children still carry them.

## What is not in any sitemap (deliberate)

| Page                                            | Reason                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| noindex pages (legal, `/search`, `/compare`, …) | listing a noindex URL is a Search Console error; the list is in [analysis](analysis.md#current-state)          |
| single-park city hubs                           | the city page 308s to its only park                                                                            |
| numbered same-name ride slugs                   | the backend lists one row per name; see [analysis](analysis.md#same-name-ride-rows-and-numbered-slugs)         |
| blog EN-fallback URLs                           | `/de/blog/<en-slug>` canonicalizes to the English original; also left out of hreflang                          |
| tags under `TAG_INDEX_MIN_POSTS` (3)            | rendered `noindex`                                                                                             |
| later listing pages (`/page/<n>`)               | [a listing page is a path with its own canonical](../rules/a-listing-page-is-a-path-with-its-own-canonical.md) |

## The news sitemap

`/sitemap-news.xml` lists posts in the `news` category (and its subcategories) dated the build
day or one of the two days before it, counted in UTC. Google reads news sitemaps for the last 48
hours; the window is counted in whole dates, so a young post is never cut at an hour boundary.
A future-dated post waits for its day.

- **Real translations only**, as in `/sitemap.xml`.
- **`<news:publication_date>` is the frontmatter date with the post's `time` and Berlin's offset**
  (`withZoneOffset()`, [order within a day](../rules/news-is-set-apart-from-the-articles.md#order-within-a-day)).
  A post without a time keeps the bare date; midnight would be invented precision.
- **`<news:name>` is `park.fan`**, matching the Google News Publisher Center.
- **Empty is served, not a 404.** Its URL stays in `robots.txt`. The sitemaps.org XSD wants at
  least one `<url>`, so a strict schema check rejects the empty file; a file with entries
  validates against the sitemaps.org and Google News XSDs.
- **At most 1,000 entries** (`NEWS_SITEMAP_MAX_URLS`), newest first.
- **`revalidate = 3600`**: it reads the post manifest and the date, so a post may linger or wait up
  to an hour after UTC midnight.

`pnpm test:news-sitemap` pins the window, the filters and the escaping; `pnpm check:agent-ready`
fetches every `Sitemap:` line of `robots.txt` from a running site.

## `<lastmod>`: observed, not stamped

The API has **no per-entity content timestamp** (`/v1/sitemap/attractions` answers
`{url, slug}`; a park payload dates only its live readings), so the date is observed:

1. `/api/cron/content-changes` runs daily at 05:30 UTC, fetches every park fresh
   (`lib/seo/content-changes/crawl.ts`) and fingerprints the **stable** half of every park and ride
   (`lib/seo/content-changes/fingerprint.ts`): name, land, height limits, ride profile, curated park
   facts, media versions, blog backlinks. The volatile fields (`queues`, `status`, `crowdLevel`,
   `statistics`, `typicalWaits`, `bestVisitTimes`, `ropeDrop`, `weather`, `schedule`,
   `analytics`, …) are excluded by hand; the exclusion list is the point.
2. The run diffs against the stored snapshot and stamps today on the keys whose fingerprint moved.
   A date only moves forward, and only on a real difference.
3. The snapshot lives in Vercel Blob (`seo/content-changes.json`, a local file in dev), because it
   has to outlive a deploy and an ISR regeneration (`lib/seo/content-changes/store.ts`).
4. `/sitemap.xml` and the ride children read it. A path the crawl has not seen gets **no** tag.
   At build time the snapshot may be unreadable (no Blob token); the sitemaps then prerender
   without dates and pick them up on their next revalidation.
5. **Blog posts** are fingerprinted too, by `contentHash` (frontmatter and body hashed by
   `generate:blog-manifest`), keyed by their locale URL (`/de/blog/…`), since each translation is
   its own text. `updatedAt` moves only for new content, so without this a new title or description
   never reached the sitemap. A post's first sighting takes `updatedAt ?? date` (`firstSeen`), not
   today, and the sitemap prints the later of that and the observed date. IndexNow skips these keys
   in its catalogue list; it submits every post anyway.

On the first full run (September 2026, shipped in 2.12.0) 7,100 of 7,126 ride URLs per locale got a date and `/sitemap.xml` went from
1,662 of 3,480 dated entries to 3,444. Two failure modes are handled explicitly and pinned by
`pnpm test:content-changes`: a park the API did not answer **keeps its dates**
(`retainUncovered`; one timeout would otherwise be 82 false recrawl invitations), and a
`FINGERPRINT_VERSION` bump adopts the new hashes and keeps every date.

**Rejected: let the backend send a date.** `updatedAt` on the backend's attractions and parks is
an `@UpdateDateColumn` that every writer moves, the daily sync and curation included, so it is not
a content date; published as `lastmod` it would be one identical date on every URL. A
content-scoped column would be worth asking for, but it would not remove the crawl: media
versions and blog backlinks are frontend content the backend never sees. Bandwidth is no argument
either: one pass is about 14 MB and takes 1.4 s warm, 5.4 s cold.

### IndexNow submits what moved

`/api/cron/indexnow` (daily 06:00 UTC) submits the catalogue paths whose observed date is within
`RECENT_DAYS` (2), plus the static high-value set and the blog surfaces. An unreadable or empty
snapshot submits everything, and Mondays are a full sweep, so a detector that stopped detecting
cannot silence the route. `?dry=1` builds the list without submitting it.

### The reindex queue reads the dates back

Google takes no ping and no API request for an ordinary page, so the observed dates also drive the
admin's reindex queue (`/admin/traffic/seo`, "Nachindizieren"): the API reads these sitemaps every
day, asks URL Inspection when Google last crawled each recently changed page, and lists the ones
crawled before their change, with clicks, impressions, CTR and position. "Beantragen" opens Search
Console's inspection for the page, where "Indexierung beantragen" is, and the API records the
click. A page requested since its change waits under "Beantragt, wartet auf Google" and cannot be
recorded twice; the panel warns past ten requests in 24 hours. Contract and rules:
`PArns/v4.api.park.fan` `docs/frontend/search-console.md#reindex-queue`.
