# News is set apart from the articles, and it is never hidden for its age (REQUIREMENT)

A post in the `news` category (or below it, `news/…`) is **news**; every other post is an
**article**. `isNewsCategory()` in `lib/blog/paths.ts` is the one place that decides it
(`isNewsPost()` in `lib/blog/listing.ts` wraps it); never compare the category string at a call site.
News has its own URL: [news lives under `/news`](news-live-under-news.md).

**Two sections that never share a post:**

| Surface                                      | Lists                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `/blog` index, category, tag and author page | articles: `listArticles` (`lib/blog/listing.ts`)                             |
| Category tree, tag cloud, tag archives       | articles: `buildCategoryTree` and `listTags` count no news post              |
| Prev/next and "more from" under a post       | the post's own section (`listNewsByDate` for a news post)                    |
| `/news` overview                             | news: `listNewsByDate`                                                       |
| Header                                       | two entries: „Guides" (`BlogMenuPanel`, articles) and News (`NewsMenuPanel`) |

A news post keeps only the tag pills whose archive exists and shows no blog category tree or tag
cloud. Two places deliberately see both: `feed.xml`, the site's single subscription, and the
[new-posts toast](../features/new-posts-toast.md), which announces everything since the last visit
and must never filter with `isNewsPost`.

## Teasers keep the two apart

| Surface                   | Articles                                                     | News                                                |
| ------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| Homepage, hero            | the newest guide, a post row in the search list              | the newest news post, the row beside it             |
| Homepage, news and guides | `NewsBoard`, four rows (three on a phone), `getMostReadSeed` | `NewsBoard`, six rows (three on a phone) above them |
| Header menu               | „Guides": opener + rows, `recent` in `getBlogMenu()`         | its own entry: `NewsMenuPanel`, `getNewsMenu()`     |
| Phone menu (burger sheet) | the „Guides" link                                            | the News link and a `LatestNewsCard`                |
| Park and ride pages       | the card grid in `blog-posts-sections.tsx`                   | `NewsRow boxed` under the grid                      |

- **On the homepage no news stands above the fold**: the hero's cards answer its question, and the
  news board is the first stop under it. In the phone menu the newest news post is a small card (`LatestNewsCard`,
  `components/blog/latest-news-card.tsx`) that shows the date in UTC rather than `NewsAge`, whose
  relative half grows after hydration and would move the lines under it. It takes the first post of
  `listNewsByDate()` through `getNewsMenu()` and `latestNewsFrom()`.
- **On the teaser surfaces news is drawn a step below the articles** (a 112 px cover, a semibold
  title, no teaser, its own accent label) through one component: `NewsList`
  (`components/blog/news-list.tsx`), wrapped by `NewsRow` on server-rendered pages.
- **The homepage draws both on one board** (`components/home/news-board.tsx`), news above the
  articles, each group under its own label. The step holds there too: a news row has a semibold
  title and no teaser, an article a bold, larger title with one. No covers on either, because most
  news runs without one, and a column of the same brand fallback said nothing. The news stands by
  day with the day's `NewsAge` in a column on the left, as on `/news`.
- **The header's News entry is drawn as news**: one lead with cover and teaser, then the headlines on
  a time line, each led by its age (`lib/navigation/news-menu.ts`). An article is picked by topic, a
  news item by what happened and when.

## Order within a day

News runs newest first, and a day can carry several posts. Every news post carries `time: 'HH:MM'`,
the minute it went out in Europe/Berlin, the same in all six files. `lib/blog/published-at.ts` is the
one place that reads it: `publishedAt()` is the sortable stamp, `newestPublishedFirst()` the
comparator every listing, the feed and the news sitemap use, `withZoneOffset()` the timestamp in
`datePublished` and `<news:publication_date>`. A post without a time sorts before every timed post of
its day; equal stamps return 0, so a stable sort keeps manifest order. Before the field, the
comparator never returned 0 and the hero chip could name the first post of the morning as the
latest.

## Age is shown, never used to hide

Every news item shows its age: `NewsAge` renders the date on the server and adds "vor 3 Tagen" after
hydration, drawn in the accent colour up to seven days. **News is never filtered out for its age**:
old news moves down because newer news arrives, not because a clock removed it. The relative half is
computed in the browser because the homepage is cached for a day and the header for longer, so a
server-side "heute" would still say "heute" tomorrow; the absolute date stays in the first HTML on
the same line, so the late half moves nothing.

## A news post reuses a photo rather than going without

A news post about a park carries a photo of that park. Pick the cover in this order:

1. a motif from the park's collection (`public/media/<park>/`) that no news post uses yet;
2. a photo from a seasonal collection that fits the story (`public/media/halloween-2026/`);
3. a photo of the park that other posts already use, the one whose last news use is oldest.

Only a post with no photo in the media database for its park runs without a cover; then the site
draws the brand fallback ([`BlogCoverFallback`](../features/blog-cover-fallback.md)), a different hue
per slug. A reused photo takes its `alt` from the sidecar and gets a caption of its own, written for
this post. The covers in use and how often:
`grep -rh -A1 '^coverImage:' content/blog/de/*.md | grep src | sort | uniq -c`.

Until November 2026 a photo could stand on one news post only. Disneyland Paris has one photo in
the media database, so the three Paris news items after the Halloween one (the castle bridge,
Indiana Jones, the Rainforest Café) ran on the brand fallback, which shows nothing of the park. Patrick decided that the castle on a second post beats no picture
([#1211](https://github.com/PArns/park.fan/pull/1211)).

## Why

News is short and is published far more often than the articles. In one list ordered by date, a busy
news month takes every slot a measured guide had: on the homepage, in the header on ~35,000 pages,
and on the park page the guide was written for.

## Check

`pnpm test:news-split` walks the manifest in every locale and fails when a news post reaches an
article list, a news branch reaches the category tree, a tag archive counts a news post, a menu lists
the other section, or a day is out of order. `pnpm check:blog-updated-at` fails a news group without
a quoted `HH:MM` `time` (unquoted, YAML may read `09:23` as 563) or with six files that disagree.
