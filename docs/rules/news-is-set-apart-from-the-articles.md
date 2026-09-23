# News is set apart from the articles, and it is never hidden for its age (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning.

## The rule

A post in the `news` category (or below it, `news/…`) is **news**; every other post is an **article**. `isNewsPost()` in `lib/blog/listing.ts` is the one place that decides it — never compare the category string at a call site.

Every surface that shows "the newest posts" as a teaser keeps the two apart:

| Surface                       | Articles                                                     | News                                          |
| ----------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Homepage, band under the hero | `BlogTeaserBand` — three cards, `listArticlesByRecency`      | `NewsRow` under the cards                     |
| Homepage, blog chapter        | `LatestBlogSection variant="lead"` — `listArticlesByRecency` | `NewsRow` under the lead block                |
| Header menu (blog panel)      | opener + rows, `recent` in `getBlogMenu()`                   | strip between rows and category pills, `news` |
| Park and ride pages           | the card grid in `blog-posts-sections.tsx`                   | `NewsRow boxed` under the grid                |

News is always drawn a size smaller than the articles, through one component: `NewsList` (`components/blog/news-list.tsx`), wrapped by `NewsRow` on server-rendered pages and used directly by the client-side menu panel.

The blog index, the category and tag pages and `feed.xml` are the archive and list both kinds together — this rule is about the teasers only.

## Why

News is short and will be published far more often than the articles. In one list ordered by date, a busy news month takes every slot a measured guide had — on the homepage, in the header menu on ~35,000 pages, and on the park page the guide was written for.

## Age is shown, never used to hide

With news, how old it is decides whether it is worth a click, so every news item shows its age: `NewsAge` renders the date on the server and adds "vor 3 Tagen" / "3 days ago" after hydration; up to seven days it is drawn in the accent colour.

**News is content and is never filtered out for its age.** Do not add a cut-off to any of the surfaces above: old news moves down because newer news arrives, not because a clock removed it.

The relative half is computed in the browser on purpose. The homepage is cached for a day and the header menu sits on pages cached for longer, so a server-side "heute" would still say "heute" tomorrow. The absolute date stays in the first HTML, on the same line, so the late half does not move anything.
