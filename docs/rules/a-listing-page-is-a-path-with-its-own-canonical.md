# A listing page is a path with its own canonical (REQUIREMENT)

Every blog listing (the index, a category, a tag, an author) and the news overview shows
`POSTS_PER_PAGE` (20) posts and puts the rest on later pages at `<listing>/page/<n>`. The helpers are
in `lib/blog/pagination.ts`, the page row is `ListingPagination`
(`components/blog/listing-pagination.tsx`).

- **A path, never `?page=`.** A query parameter would render the static listing per request. The
  routes are `/blog/page/[n]`, `/blog/tag/[tag]/page/[n]`, `/blog/authors/[author]/page/[n]` and
  `/news/page/[n]`, each with `generateStaticParams` from `laterPageNumbers` and
  `dynamicParams = false`. The category route is a catch-all, so its page is the tail of
  `[...path]` (`splitPageSegments`, `pagedSegments`).
- **Not scroll-only loading.** Googlebot does not scroll or press "load more". A "load more" button
  may come later, only on top of these URLs, each chunk keeping its URL and its `<a href>` in the
  HTML.
- **Its own canonical, `index, follow`.** Pointing page 2 at page 1 tells Google the posts there are
  not worth reaching. The title adds `blog.pagination.pageLabel` ("Seite 2") through `pagedTitle`.
- **hreflang only where the page exists.** A tag's counts differ between locales, so
  `listingAlternates` takes a `pathFor` that answers `null` where `hasPage` says no, and
  `buildTagAlternates(locale, slug, page)` asks the target tag's own count.
- **Plain links**: previous, the numbers and next are `<a>` elements in the server HTML, `rel="prev"`
  and `rel="next"` on the arrows.
- **`/page/1` is a 404, not a redirect.** Page 1 is the listing's own URL, and a redirect from the
  render would carry the layout as its body ([redirect rule](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)).
- **Out of the sitemap.** Every post is in the sitemap under its own URL, and a later page's contents
  shift with every new post, so its `<lastmod>` would change at every publication
  ([a `<lastmod>` is observed](a-lastmod-is-observed-never-stamped.md)).

Not pages: the site search (`/api/nav/posts/[locale]`) and the `/news` park filter add no URL, and
the canonical stays the page they are on.

## Why

Until October 2026 the four blog listings sliced at 12 posts and linked nothing after them. `/de/blog`
reached 12 of 45 articles, the guides category 12 of 39, and six tags hid the rest. The comment beside
the slice said older posts stayed reachable through the sidebar's category tree, which was only true
while every category held fewer than 13.

## Check

`pnpm test:listing-pagination` cuts every listing of every locale into its pages and checks that they
hold the listing again, each post once.
