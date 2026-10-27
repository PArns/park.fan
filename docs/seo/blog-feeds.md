# Blog feeds

The six RSS 2.0 feeds, one per locale at `/{locale}/blog/feed.xml`: how pages advertise them, what
an item carries, and the WebSub ping. Open it before changing the feed route, a page's
`alternates`, or the cron that pings the hub. Discovery is a standing rule:
[a feed nobody links to is a file with a URL](../rules/a-feed-nobody-links-to-is-a-file-with-a-url.md).

- Route: `app/[locale]/blog/feed.xml/route.ts`; it 404s for a locale without published posts.
- Title, description, URL and the autodiscovery entry: `lib/blog/feed.ts`.
- Hub and ping: `lib/websub.ts`, `app/api/cron/websub/route.ts`, `pnpm ping:websub`.
- `/rss.xml` redirects to a feed (`next.config.ts`).
- Asserted from outside by `pnpm check:agent-ready`.

## Discovery

Next replaces the whole `alternates` object at the nearest segment that declares one, so the feed
link cannot be set once in the locale layout; every route that advertises it passes
`types: blogFeedAlternates(locale)` itself. Today that is the homepage and the blog index, post,
category, tag, author and news index pages (`components/blog/*-page.tsx`,
`app/[locale]/page.tsx`). Park and glossary pages have none: a page's feed should be its own main
feed. `blogFeedAlternates` returns the whole `types` object as an array of descriptors (which is
what carries `title` into the markup) and `undefined` where the locale publishes nothing. The
footer carries a visible link to the feed inside the same `showBlog` guard.

## What an item contains

- **Order:** strictly newest first (`newestPublishedFirst`), not `listPosts`' featured-first
  order; `lastBuildDate` is the newest publication or `updatedAt` in the feed. Reading it off
  `posts[0]` once moved the channel's timestamp backwards whenever an older post was pinned.
- **15 items** (`MAX_ITEMS`); older posts live on the listings and in the sitemap.
- **`description` is the hand-written `excerpt`**, never the rendered body (see below).
- **Only elements RSS or the declared namespaces define:** `title`, `link`, `guid`, `pubDate`,
  `dc:creator` (resolved author name), `description`, `category` per tag, `enclosure`. An item once
  ended with a namespace-less `<readingTime>` and a `<source>` naming this very feed, which
  declared every item a repost of itself.
- **`enclosure`** is the cover, content-versioned (`versionedPath`) so a reader does not keep an
  old crop after a focal point moves. Its `length` is `getMediaImageForPath(clean)?.bytes` from
  the media manifest: the **source** photo's size, not the crop's, so it is approximate (it used to
  be `0` everywhere).
- The channel description is written out for all six locales (`BLOG_FEED_DESCRIPTION`).

## Why the feed carries the excerpt, not the article

The full article was tried and broke the deployment twice over:

- **The body import.** Rendering a post goes through `@/lib/blog`, which pulls in
  the generated `lib/blog/manifest-bodies.ts`, every post body of every locale, and Next's tracer folds all of it into
  the function ([blog manifest is split](../rules/blog-manifest-is-split.md)).
- **The cover's byte count.** An `fs.statSync` on `path.join(process.cwd(), 'public', …)` made the
  tracer bundle all of `/public`, about 256 MB of photos, into the RSS handler
  ([a runtime file read ships the directory it is rooted at](../rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md)).

A full body would also need `ref:` links resolved and every live-widget fence replaced by a link
to the post: a reader archives an item on arrival, so a rendered wait-time table would sit frozen
in every subscriber's client. A reader gets a teaser and a link either way.

## WebSub

Both halves are needed. The feed declares `<atom:link rel="hub" href="https://pubsubhubbub.appspot.com/">`
so a subscriber registers with the hub; the publisher then pings the hub, which re-fetches and
pushes only real changes. A declared hub that is never pinged is as slow as polling.
`/api/cron/websub` pings daily at 06:15 UTC (`vercel.json`), unconditionally: six conditional GETs
a day are not worth keeping state for. For a post that should arrive within minutes, run
`pnpm ping:websub` after the deploy carrying it is live; before that, the hub re-reads the old
feed.

## Checks

`pnpm check:agent-ready` (needs a running site) fetches all six feeds and asserts, per locale, that
they serve as RSS, carry items, name themselves, declare a hub, ship a description per item and
size every enclosure; then that the homepage, blog index, category and tag pages carry the
autodiscovery link, and that `/rss.xml` still redirects.
