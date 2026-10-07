# News is set apart from the articles, and it is never hidden for its age (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning.

## The rule

A post in the `news` category (or below it, `news/…`) is **news**; every other post is an **article**. `isNewsCategory()` in `lib/blog/paths.ts` is the one place that decides it (`isNewsPost()` in `lib/blog/listing.ts` wraps it) — never compare the category string at a call site. News posts also have their own URL, see [news lives under `/news`](news-live-under-news.md).

**Two sections that never share a post.** Everything under `/blog` lists articles only, everything under `/news` news only, and neither is a corner of the other:

| Surface                                      | Lists                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `/blog` index, category, tag and author page | articles — `listArticles` (`lib/blog/listing.ts`)                                |
| Category tree, tag cloud, tag archives       | articles — `buildCategoryTree` and `listTags` count no news post                 |
| Prev/next and "more from" under a post       | the post's own section: articles, or news for a news post (`listNewsByDate`)     |
| `/news` overview                             | news — `listNewsByDate`, see [news lives under `/news`](news-live-under-news.md) |
| Header                                       | two entries: „Backstage" (`BlogMenuPanel`, articles) and News (`NewsMenuPanel`)  |

A news post keeps the tag pills whose archive exists under `/blog/tag/…` and drops the rest (a tag only news carries has no archive, since the archives count articles). Its sidebar shows no blog category tree or tag cloud.

`pnpm test:news-split` walks the manifest in every locale and fails when a news post reaches an article list, a news branch reaches the category tree, a tag archive counts a news post, or either menu lists the other section.

The one place both kinds still meet is `feed.xml`: it is the site's single subscription, named "park.fan Blog" with a description that promises the news, and a reader who subscribed once should not lose half of it. The [new-posts toast](../features/new-posts-toast.md) is not a listing either: it announces what arrived since the last visit, news included, and must never filter with `isNewsPost`.

## Teasers keep the two apart

Every surface that shows "the newest posts" as a teaser keeps the two apart:

| Surface                       | Articles                                                     | News                                            |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Homepage, hero                | —                                                            | `LatestNewsChip` beside the open-parks badge    |
| Homepage, band under the hero | `BlogTeaserBand` — three cards, `listArticlesByRecency`      | `NewsRow` under the cards                       |
| Homepage, blog chapter        | `LatestBlogSection variant="lead"` — `listArticlesByRecency` | `NewsRow` under the lead block                  |
| Header menu                   | „Backstage": opener + rows, `recent` in `getBlogMenu()`      | its own entry: `NewsMenuPanel`, `getNewsMenu()` |
| Phone menu (burger sheet)     | the „Backstage" link                                         | the News link and a `LatestNewsChip` card       |
| Park and ride pages           | the card grid in `blog-posts-sections.tsx`                   | `NewsRow boxed` under the grid                  |

**The hero chip is the only news above the fold, on any screen.** The hero is `min-h-dvh`, so the band under it, with its `NewsRow`, starts below the first screen even on a desktop; on a phone that band is not drawn at all (`lg` only — three full cards between the hero and the first chapter would be a screen and a half of blog), and the next news is the blog chapter's `NewsRow` near the foot of the page. So a desktop reader who scrolls meets the newest post twice, in the chip and in the band, and that is accepted: the chip is the headline, the band the list. The chip (`components/blog/latest-news-chip.tsx`) is one line by construction: from a 34 rem row it sits on the badge's line and never wraps, below that it stands under the badge — decided by the row's own width (`@container/badges`), not by the badge, whose width changes when the count arrives. Measured: on the badge's line from a 768 px window up in all six locales, the plate not a pixel taller there. In the phone menu it is a small card instead (`variant="card"`): label and date, the headline in two lines and two to three lines of the teaser. The chip there, even with a second line for the headline, left three words of it in the 300 px sheet and nothing to tell what the news was about. It shows its age as the date, formatted in UTC, and not through `NewsAge`, whose relative half grows after hydration and would slide a truncated headline sideways. Both chips take their data from `getNewsMenu()` through `latestNewsFrom()`, so they cannot disagree about which post is the newest.

On the teaser surfaces news is drawn a step below the articles (a 112 px cover, a semibold title, no teaser), but with its own accent label, through one component: `NewsList` (`components/blog/news-list.tsx`), wrapped by `NewsRow` on server-rendered pages.

The header's News entry is drawn differently from the blog's on purpose: one lead with cover and teaser, then the headlines on a time line, each led by its age. An article is picked by topic and length, a news item by what happened and when (`lib/navigation/news-menu.ts`). It used to be a strip of three at the bottom of the blog panel, which filed news as one more blog category.

## Order within a day

News runs newest first, and a day can carry several: four on 2026-09-23, four on 2026-10-01. The
date alone does not order them, and the comparator that sorted on it never returned 0, so a day's
posts came out in whatever order the engine's sort left them, and the hero chip could name the
first post of the morning as the latest. Every news post therefore carries `time: 'HH:MM'`, the
minute it went out, in Europe/Berlin, the same in all six files.

`lib/blog/published-at.ts` is the one place that reads it: `publishedAt()` is the sortable stamp
(`2026-10-01T09:23`), `newestPublishedFirst()` the comparator every listing, the feed and the news
sitemap use, `withZoneOffset()` the timestamp in `datePublished` and `<news:publication_date>`.
A post without a time sorts before every timed post of its day. Equal stamps return 0, so a stable
sort keeps them in manifest order.

The times of the news posts before 2026-10-07 are the minute each reached `main`, read off the
first-parent history. Two of them were merged after the day in their `date` (the Hollywood Drift
post on 2026-09-30, the Golden Ticket post on 2026-10-03); each is the only news of its day, so the
time orders nothing there.

`pnpm check:blog-updated-at` fails a news group without a time, with a value that is not a quoted
`HH:MM` (unquoted, YAML may read `09:23` as 563), or with six files that disagree.
`pnpm test:news-split` checks the order in every locale.

## Why

News is short and will be published far more often than the articles. In one list ordered by date, a busy news month takes every slot a measured guide had — on the homepage, in the header menu on ~35,000 pages, and on the park page the guide was written for.

## Age is shown, never used to hide

With news, how old it is decides whether it is worth a click, so every news item shows its age: `NewsAge` renders the date on the server and adds "vor 3 Tagen" / "3 days ago" after hydration; up to seven days it is drawn in the accent colour.

**News is content and is never filtered out for its age.** Do not add a cut-off to any of the surfaces above: old news moves down because newer news arrives, not because a clock removed it.

The relative half is computed in the browser on purpose. The homepage is cached for a day and the header menu sits on pages cached for longer, so a server-side "heute" would still say "heute" tomorrow. The absolute date stays in the first HTML, on the same line, so the late half does not move anything.
