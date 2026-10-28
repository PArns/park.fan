# News posts live under `/news`, and every post URL comes from `postPath` (REQUIREMENT)

A news post ([what counts as news](news-is-set-apart-from-the-articles.md)) is served at
`/<locale>/news/<slug>`; every other post at `/<locale>/blog/<slug>`. The news category's listing is
the overview at `/<locale>/news`; `/blog/category/news` no longer exists. The content files do not
move: news stays in `content/blog/<locale>/` with its category in the frontmatter. No post is
reachable under both paths.

**No code builds a post URL by hand.** `lib/blog/paths.ts` is client-safe and owns the decision:

| Helper                     | Returns                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `postPath(post)`           | `/news/<slug>` or `/blog/<slug>`, locale-relative           |
| `newsPostPath(slug)`       | `/news/<slug>`, for lists that hold news only (`NewsList`)  |
| `categoryPath(path)`       | `/news` for the news category, `/blog/category/<path>` else |
| `isNewsCategory(category)` | the one test for "is this news"; `isNewsPost` wraps it      |

Cards, prev/next, the header menu, the new-posts toast, the feed, the sitemap, IndexNow, JSON-LD,
canonical and hreflang (`buildPostAlternates`), the admin backlinks and markdown cross-references all
go through these. A markdown link to `/blog/<slug>` or `/news/<slug>` is rewritten to the post's real
URL, so an old-style link does not send readers through a redirect.

## One page, two routes

`app/[locale]/blog/[slug]` and `app/[locale]/news/[slug]` render the same `BlogPostPageBody`
(`components/blog/blog-post-page.tsx`) with a `section` prop: a news post reads exactly like an
article (the PO reverted a slimmer news head on 2026-09-24). Each route file keeps only its
`generateStaticParams`, its metadata call and its `<RouteMessages>`; `listAllUrlSlugsByLocale('blog' |
'news')` splits the params by the entry each locale actually serves. An article under `/news/<slug>`
is a 404; a news post under `/blog/<slug>` is a 308.

## The 308s are answered by the proxy

Per [a redirect thrown from a render carries the layout as its body](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md),
`proxy.ts` answers the old URLs with `newsRedirect()` (`lib/blog/news-redirects-rule.ts`) before
anything renders:

- `/<locale>/blog/<slug>` of a news post → `/<locale>/news/<slug>`, straight to that locale's
  canonical slug when the slug is another locale's, so it is one hop.
- `/<locale>/blog/category/news` → `/<locale>/news`.
- `/<locale>/blog/tag/<slug>` of a tag only news carries in that locale → `/<locale>/news`, because
  the tag archives count articles only.

`proxy.ts` has no file system and the manifest is large, so `scripts/generate-blog-manifest.mjs`
writes a small module, `lib/blog/news-redirects.ts` (`NEWS_POST_TARGETS`, `NEWS_ONLY_TAGS`,
git-ignored, regenerated in `prebuild`). Both pages keep their own answer behind the proxy
(`permanentRedirect` / `notFound`) as a net. Two rare cases take two hops: a bare `/blog/<news-slug>`
without a locale, and a slug renamed in `next.config.ts` `redirects()`, which runs before the proxy.

## The overview

`/news` is a stream grouped by day (`PostStreamGroups`, `components/blog/post-stream.tsx`), 20 notes
a page with `/news/page/<n>` after the first ([listing pages](a-listing-page-is-a-path-with-its-own-canonical.md)).
Every note shows its park (`NewsParkLabel`), title, two lines of excerpt and its cover, and is listed
whatever its age.

- **A note's park** is `getNewsParkRef()` (`lib/blog/backlinks.ts`): the first `parkLinks` entry
  across all translations, English first, else the best-scored park the post mentions.
  `resolveNewsPark()` (`lib/blog/news-park.ts`) turns it into a name and a link; an unknown park
  leaves the note without a label, never out of the list.
- **The park filter** is `?park=<slug>` on the static page it is on, handled by `NewsStream`. It adds
  no URL: the canonical stays the page's own. The filter is CSS on `data-news-filter`, set by an
  inline script while the HTML is parsed, so a shared link paints filtered; after hydration the URL is
  its only state (`useSearchParams` in a Suspense boundary around the pills). Two parks sharing a
  slug (`disneyland-park`) are keyed by slug plus city.

## Search engines

- **The overview has its own metadata** (`buildNewsIndexMetadata`, `components/blog/news-index-page.tsx`):
  title from `news.metaTitle`, description `news.metaDescription`, OG card `/api/og/<locale>/news`,
  canonical the page's own URL whatever `?park=` says. It used to borrow the blog category's, which
  asked for an OG card at a post slug that does not exist.
- **A news post names its section as News** in the title suffix and `article:section`
  (`buildPostMetadata`).
- **Structured data**: a news post sends `NewsArticle` (headline ≤ 110 characters, Berlin-offset
  dates, one image at least 1200 px wide, the OG card added when the cover is narrower); the overview
  a `CollectionPage` with an `ItemList` of the same references (`NewsListingStructuredData`). The
  publisher logo is `public/logo-big.png`, 1024 × 1024, because Google does not read an SVG there.
- **Sitemaps**: `/news` is its own `sitemap.xml` entry, dated by the newest news post; the last two
  days of news are in `/sitemap-news.xml` (`lib/seo/news-sitemap.ts`). IndexNow submits `/news` per
  locale.

A news subcategory (`news/<sub>`) would have no listing of its own; none exists.

## Check

`pnpm test:news-redirects` walks every post in every locale and fails when the proxy map and the
routes disagree; `pnpm test:news-park` pins the park choice against the real manifest.
