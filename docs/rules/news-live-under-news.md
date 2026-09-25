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

`app/[locale]/blog/[slug]` and `app/[locale]/news/[slug]` render the same page, `BlogPostPageBody` in `components/blog/blog-post-page.tsx`, with a `section` prop. A news post reads exactly like an article: the full-bleed `BlogPostBanner`, the reading time, the header floating over the cover (`isBlogPost` in `components/layout/header.tsx` counts `/news/…`). Only the overview has a look of its own. PAR-473 briefly gave the post page a slimmer head of its own and a "more news from <park>" row, and Patrick took it back on 2026-09-24: the overview is where news looks different, reading a news post stays in the blog style. The overview at `/news` has its own body and its own metadata, `NewsIndexPageBody` and `buildNewsIndexMetadata` (`components/blog/news-index-page.tsx`), and shares nothing with `/blog/category/[...path]` (see _Search engines_ below for why its metadata may not go back through `buildCategoryMetadata`). Each route file keeps only its `generateStaticParams`, its metadata call and its `<RouteMessages>`. `listAllUrlSlugsByLocale('blog' | 'news')` splits the static params, deciding on the entry that locale actually serves (its own translation, else the EN fallback).

No post is reachable under both paths. An article under `/news/<slug>` is a 404. A news post under `/blog/<slug>` is a 308 to `/news/<slug>`.

## The 308s are answered by the proxy

Per [a redirect thrown from a render carries the layout as its body](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md), the old URLs are answered in `proxy.ts` by `newsRedirect()` (`lib/blog/news-redirects-rule.ts`), before anything renders:

- `/<locale>/blog/<slug>` of a news post → `/<locale>/news/<slug>`. A slug from another locale goes straight to that locale's canonical slug, so it is one hop.
- `/<locale>/blog/category/news` → `/<locale>/news`.
- `/<locale>/blog/tag/<slug>` of a tag only news carries in that locale (`news`, `parques-reunidos`) → `/<locale>/news`. The tag archives count articles only (see [news is set apart](news-is-set-apart-from-the-articles.md)), so those archives have nothing left to list; they were in the sitemap while `/blog` listed news. The generator writes the list as `NEWS_ONLY_TAGS` next to `NEWS_POST_TARGETS`, and the tag page redirects too, as the net.

`proxy.ts` has no file system, and the blog manifest is 400 KB. So `scripts/generate-blog-manifest.mjs` writes a third, small module, `lib/blog/news-redirects.ts` (`NEWS_POST_TARGETS`, gitignored like the other manifests, regenerated in `prebuild`). It maps locale → old slug → news slug, resolved the way the post page resolves a URL. A draft gets no entry.

Both pages keep their own answer behind the proxy (`permanentRedirect` for a news post under `/blog`, `notFound` for an article under `/news`). That net only fires if the map and the routes disagree. `pnpm test:news-redirects` walks every post in every locale and fails when they do.

Two cases take two hops, and both are rare. A bare `/blog/<news-slug>` without a locale is first resolved by next-intl and then 308'd. A renamed slug from `next.config.ts` `redirects()` runs before the proxy. No news slug has been renamed so far.

## The overview and a post's park

`/news` is a stream grouped by day, newest first. The day heading is `NewsAge`; every note shows its park (`NewsParkLabel`), title, one line of excerpt and a small cover. Every note is listed, whatever its age.

A note's park comes from `getNewsParkRef()` in `lib/blog/backlinks.ts`: the first `parkLinks` entry, in the order the author wrote them, across all translations with the English one read first. A post without `parkLinks` falls back to the best-scored park it mentions, with the score the park pages rank by. `resolveNewsPark()` (`lib/blog/news-park.ts`) turns that into a name and a park page; a park the geo structure does not know leaves the note without a label, never out of the list.

`pnpm test:news-park` pins that choice against the real manifest.

The park filter is a query parameter on the one static page, `?park=<slug>`, handled by `NewsStream`. Where two parks with news share a slug (Paris and Anaheim both have a `disneyland-park`), the key is slug plus city, so one pill never mixes two parks. After hydration the URL is the filter's only state (`FilterBar` reads `useSearchParams` inside a Suspense boundary around the pills alone): a `useState` of its own survived a navigation to plain `/news` and kept the list filtered under an unfiltered address. It adds no URL of its own: the route stays static and the canonical stays `/news`. It offers only parks that have news. The filter is CSS on a `data-news-filter` attribute, and an inline script sets that attribute from the URL while the HTML is parsed. A shared `?park=` link therefore paints filtered and does not shrink after hydration. An unknown slug in the parameter shows everything.

## Search engines

- **The overview has its own metadata** (`buildNewsIndexMetadata` in `components/blog/news-index-page.tsx`): the title carries the search phrase from `news.metaTitle` ("Freizeitpark-News: …"), the description is `news.metaDescription`, the card is `/api/og/<locale>/news` and the canonical is `/news` whatever `?park=` says. It used to borrow the blog category's metadata, which titled it "News | Blog · park.fan", called it "all blog posts in the category News" and asked for a card at `blog/news`, a post slug that does not exist.
- **A news post names its section as News**, not Blog: the title suffix (`| News · park.fan`) and `article:section` come from the news label (`buildPostMetadata`).
- **Structured data.** A news post sends `NewsArticle` (PAR-471): headline ≤ 110 characters, dates with the Berlin offset, an image list with one image of at least 1200 px (the OG card is added when the cover is narrower). The overview sends a `CollectionPage` whose `ItemList` holds the same `NewsArticle` references (`NewsListingStructuredData`), not the blog's `Blog`/`BlogPosting`. The publisher logo in both is `logo-big.png`, 1024 × 1024: Google does not read an SVG there (PAR-486).
- **Sitemaps.** `/news` is its own entry in `sitemap.xml`, dated by the newest news post (it used to arrive through the category loop, which holds articles only now). The news posts of the last two days are also in `/sitemap-news.xml` (PAR-472, `lib/seo/news-sitemap.ts`). IndexNow submits `/news` per locale.

## What is not here yet

- A news subcategory (`news/<sub>`) would have no listing of its own: the category tree holds articles only, and `/news` lists every news post. None exists.
