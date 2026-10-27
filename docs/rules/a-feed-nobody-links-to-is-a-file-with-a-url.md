# A feed nobody links to is a file with a URL (REQUIREMENT)

Every route that advertises the blog feed (`/{locale}/blog/feed.xml`) passes its own
`types: blogFeedAlternates(locale)` (`lib/blog/feed.ts`) in its metadata's `alternates`. The helper
returns the whole `types` object, in the array-of-descriptors form that carries a `title`, and
`undefined` where the locale publishes nothing (the feed 404s there, and a broken feed is recorded
against the whole site). The footer carries a visible link to the feed inside the same `showBlog`
guard. Park and glossary pages get none on purpose: a page's feed should be its own main feed.

- **A feed item carries the excerpt, never the rendered body.** A body would import `@/lib/blog` and
  with it every post body ([blog manifest is split](blog-manifest-is-split.md)), and a rendered widget
  fence would freeze today's wait times in every subscriber's archive, which is what the fences exist
  to prevent.
- **WebSub is two halves**: the feed declares the hub, and `/api/cron/websub` (plus
  `pnpm ping:websub` for the minutes after a publication) tells it to look. A declared hub that is
  never pinged is as slow as polling.

## Why

The discovery link was written by hand in four `page.tsx` files, so the category pages added later had
none, and neither did the homepage. It cannot be set once centrally: **Next replaces the whole
`alternates` object at the nearest segment that declares one** instead of merging into it, and every
locale route declares its own (`contribute/thanks`, which sets only `canonical`, ships no hreflang
links although the locale layout declares `languages`). And no page rendered a link a person could
click until the footer did.

## Check

`pnpm check:agent-ready` (needs a running site) fetches all six feeds and asserts that they serve as
RSS, carry items, name themselves, declare a hub and size every enclosure, and that the homepage,
blog index, category and tag pages carry the autodiscovery link. Background:
[blog feeds](../seo/blog-feeds.md) (what an item contains, ordering, the enclosure size).
