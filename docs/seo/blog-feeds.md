# Blog feeds

The six RSS 2.0 feeds, one per locale at `/{locale}/blog/feed.xml`: how pages advertise them, what
an item carries, and the WebSub ping. Open it before changing the feed route, a page's
`alternates`, or the cron that pings the hub. Discovery is a standing rule:
[a feed nobody links to is a file with a URL](../rules/a-feed-nobody-links-to-is-a-file-with-a-url.md).

- Route: `app/[locale]/blog/feed.xml/route.ts`; it 404s for a locale without published posts.
- Title, description, URL and the autodiscovery entry: `lib/blog/feed.ts`.
- Hub and ping: `lib/websub.ts`, `app/api/cron/websub/route.ts`, `pnpm ping:websub`.
- `/rss.xml` redirects to the default locale's feed (`app/rss.xml/route.ts`).
- Asserted from outside by `pnpm check:agent-ready` (what it asserts: the rule's check).

## Discovery

Every route that advertises the feed passes `types: blogFeedAlternates(locale)` itself, for the
reason in the rule. Today that is the homepage and the blog index, post, category, tag, author and
news index pages (`components/blog/*-page.tsx`, `app/[locale]/page.tsx`).

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

The feed declares `<atom:link rel="hub" href="https://pubsubhubbub.appspot.com/">` so a subscriber
registers with the hub; the ping makes the hub re-fetch and push only real changes (both halves:
[the rule](../rules/a-feed-nobody-links-to-is-a-file-with-a-url.md)). `/api/cron/websub` pings daily
at 06:15 UTC (`vercel.json`), unconditionally: six conditional GETs a day are not worth keeping
state for. For a post that should arrive within minutes, run `pnpm ping:websub` after the deploy
carrying it is live; before that, the hub re-reads the old feed.
