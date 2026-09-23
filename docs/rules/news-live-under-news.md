# News posts live under `/news`, and every post URL comes from `postPath` (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning.

## The rule

A news post (`category: news` or `news/…`, see [news is set apart](news-is-set-apart-from-the-articles.md)) is served at `/<locale>/news/<slug>`. Every other post stays at `/<locale>/blog/<slug>`. The news category's listing is the news overview at `/<locale>/news`; `/blog/category/news` no longer exists. The content files do not move: news stays in `content/blog/<locale>/` with its category in the frontmatter.

**No code builds a post URL by hand.** `lib/blog/paths.ts` is client-safe and owns the decision:

| Helper                     | Returns                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `postPath(post)`           | `/news/<slug>` or `/blog/<slug>`, locale-relative           |
| `newsPostPath(slug)`       | `/news/<slug>`, for lists that hold news only (`NewsList`)  |
| `categoryPath(path)`       | `/news` for the news category, `/blog/category/<path>` else |
| `isNewsCategory(category)` | the one test for "is this news"; `isNewsPost` wraps it      |

Cards and rows, prev/next, the header menu, the new-posts toast (its payload carries `path`), the feed, the sitemap, IndexNow, JSON-LD, canonical and hreflang (`buildPostAlternates`), the admin backlinks and markdown cross-references all go through these. A markdown link to `/blog/<slug>` or `/news/<slug>` is rewritten to the post's real URL, so a post that links another the old way does not send readers through a redirect.

## One page, two routes

`app/[locale]/blog/[slug]` and `app/[locale]/news/[slug]` render the same page, `BlogPostPageBody` in `components/blog/blog-post-page.tsx`, with a `section` prop. `/blog/category/[...path]` and `/news` share `BlogCategoryPageBody` the same way. Each route file keeps only its `generateStaticParams`, its metadata call and its `<RouteMessages>`. `listAllUrlSlugsByLocale('blog' | 'news')` splits the static params, deciding on the entry that locale actually serves (its own translation, else the EN fallback).

No post is reachable under both paths. An article under `/news/<slug>` is a 404. A news post under `/blog/<slug>` is a 308 to `/news/<slug>`.

## The 308s are answered by the proxy

Per [a redirect thrown from a render carries the layout as its body](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md), the old URLs are answered in `proxy.ts` by `newsRedirect()` (`lib/blog/news-redirects-rule.ts`), before anything renders:

- `/<locale>/blog/<slug>` of a news post → `/<locale>/news/<slug>`. A slug from another locale goes straight to that locale's canonical slug, so it is one hop.
- `/<locale>/blog/category/news` → `/<locale>/news`.

`proxy.ts` has no file system, and the blog manifest is 400 KB. So `scripts/generate-blog-manifest.mjs` writes a third, small module, `lib/blog/news-redirects.ts` (`NEWS_POST_TARGETS`, gitignored like the other manifests, regenerated in `prebuild`). It maps locale → old slug → news slug, resolved the way the post page resolves a URL. A draft gets no entry.

Both pages keep their own answer behind the proxy (`permanentRedirect` for a news post under `/blog`, `notFound` for an article under `/news`). That net only fires if the map and the routes disagree. `pnpm test:news-redirects` walks every post in every locale and fails when they do.

Two cases take two hops, and both are rare. A bare `/blog/<news-slug>` without a locale is first resolved by next-intl and then 308'd. A renamed slug from `next.config.ts` `redirects()` runs before the proxy. No news slug has been renamed so far.

## What is not here yet

- The overview at `/news` is the old category listing at its new URL. Its own look is PAR-473.
- News posts still send `BlogPosting` structured data (PAR-471) and have no news sitemap (PAR-472).
- A news subcategory (`news/<sub>`) would keep a `/blog/category/news/<sub>` listing while its posts live under `/news`. None exists.
