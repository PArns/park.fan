# A listing page is a path with its own canonical (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

Every blog listing (the index, a category, a tag, an author) and the news overview shows `POSTS_PER_PAGE` posts, 20, and puts the rest on later pages at `<listing>/page/<n>`. The helpers are in `lib/blog/pagination.ts`, the page row is `ListingPagination` (`components/blog/listing-pagination.tsx`), and `pnpm test:listing-pagination` cuts every listing of every locale into its pages and checks that they hold the listing again, each post once.

**Why it exists.** Until October 2026 the four blog listings sliced at `BLOG_POSTS_PER_PAGE` (12) and linked nothing after it. `/de/blog` reached 12 of 45 articles, the guides category 12 of 39, the author page 12 of 45, and six tags with more than 12 articles each hid the rest. The comment beside the slice said older posts stayed reachable through the sidebar's category tree, which was only true while every category held fewer than 13.

**What a later page is:**

- **A path, never `?page=`.** A query parameter renders the static listing per request. The routes are `/blog/page/[n]`, `/blog/tag/[tag]/page/[n]`, `/blog/authors/[author]/page/[n]` and `/news/page/[n]`, each with a `generateStaticParams` from `laterPageNumbers` and `dynamicParams = false`. The category route is a catch-all, so its page is the tail of `[...path]` (`splitPageSegments`, `pagedSegments` for the static params).
- **Not infinite scroll on its own.** Googlebot does not scroll and does not press "load more"; posts that only arrive after an interaction are not crawled. A "load more" button may come later, but only on top of these URLs: each chunk keeps its own URL and its `<a href>` stays in the HTML.
- **Its own canonical, `index, follow`.** Pointing page 2 at page 1 tells Google the posts on page 2 are not worth reaching, which is the problem this solves. The title adds `blog.pagination.pageLabel` ("Seite 2") through `pagedTitle`, the description stays.
- **hreflang only where the page exists.** A locale's listing may be shorter (a tag's counts differ between locales: `freizeitpark` holds 40, `theme-park` 37), so `listingAlternates` takes a `pathFor` that answers `null` where `hasPage` says no, and `buildTagAlternates(locale, slug, page)` asks the target tag's own count.
- **Plain links.** Previous, the numbers and next are `<a>` elements in the server HTML, `rel="prev"` and `rel="next"` on the two arrows.
- **`/page/1` is a 404, not a redirect.** Page 1 is the listing's own URL and nothing links `/page/1`; a `permanentRedirect()` from the render would answer with the layout as its body ([redirect rule](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)).
- **Out of the sitemap.** Every post is in the sitemap under its own URL, and a later page's contents move by one with every new post, so its `<lastmod>` would change with every publication ([a `<lastmod>` is observed](a-lastmod-is-observed-never-stamped.md)). Crawlers reach the pages through the links above.

**Counter-example:** the site search (`/api/nav/posts/[locale]`: the header menu's field and the fields over `/blog` and `/news`) and the `/news` park filter are not pages. They add no URL, and the canonical stays the page they are on. The park filter filters the page it is on and offers that page's parks.
