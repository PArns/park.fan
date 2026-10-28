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

| Surface                       | Articles                                                    | News                                            |
| ----------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| Homepage, hero                | —                                                           | `LatestNewsChip` in the badge row               |
| Homepage, band under the hero | `BlogTeaserBand`, three cards, `listArticlesByRecency`      | `NewsRow` under the cards                       |
| Homepage, blog chapter        | `LatestBlogSection variant="lead"`, `listArticlesByRecency` | `NewsRow` under the lead block                  |
| Header menu                   | „Guides": opener + rows, `recent` in `getBlogMenu()`        | its own entry: `NewsMenuPanel`, `getNewsMenu()` |
| Phone menu (burger sheet)     | the „Guides" link                                           | the News link and a `LatestNewsChip` card       |
| Park and ride pages           | the card grid in `blog-posts-sections.tsx`                  | `NewsRow boxed` under the grid                  |

- **The hero chip is the only news above the fold**, on any screen. It is one line by construction
  (`components/blog/latest-news-chip.tsx`): on the badge's line from a 34 rem row, under it below
  that, decided by the row's own width (`@container/badges`). In the phone menu it is a small card
  (`variant="card"`). Both chips show the date in UTC rather than `NewsAge`, whose relative half
  grows after hydration and would slide a truncated headline sideways, and both take their post from
  `getNewsMenu()` through `latestNewsFrom()`, so they agree on which post is newest.
- **On the teaser surfaces news is drawn a step below the articles** (a 112 px cover, a semibold
  title, no teaser, its own accent label) through one component: `NewsList`
  (`components/blog/news-list.tsx`), wrapped by `NewsRow` on server-rendered pages.
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

## A news cover image is used once

No `coverImage.src` appears twice among the news posts; the same image twice is worse than none.
Check with
`grep -rh -A1 '^coverImage:' content/blog/de/*.md | grep src | sort | uniq -c` before writing. If the
image is taken, use another motif from the park's collection or `public/media/halloween-2026/`; if
there is none, the post runs without a cover and the site draws the brand fallback
([`BlogCoverFallback`](../features/blog-cover-fallback.md)), a different hue per slug.

## Why

News is short and is published far more often than the articles. In one list ordered by date, a busy
news month takes every slot a measured guide had: on the homepage, in the header on ~35,000 pages,
and on the park page the guide was written for.

## Check

`pnpm test:news-split` walks the manifest in every locale and fails when a news post reaches an
article list, a news branch reaches the category tree, a tag archive counts a news post, a menu lists
the other section, or a day is out of order. `pnpm check:blog-updated-at` fails a news group without
a quoted `HH:MM` `time` (unquoted, YAML may read `09:23` as 563) or with six files that disagree.
