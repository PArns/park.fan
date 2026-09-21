# Blog feeds

Six RSS 2.0 feeds, one per locale, at `/{locale}/blog/feed.xml`. An excerpt per
item, a cover enclosure, and a WebSub hub so a new article reaches a subscriber
without waiting for their reader's next poll.

- Route: `app/[locale]/blog/feed.xml/route.ts`
- Identity and the autodiscovery link: `lib/blog/feed.ts`
- Hub and ping: `lib/websub.ts`, `app/api/cron/websub/route.ts`, `pnpm ping:websub`
- Asserted from outside by `pnpm check:agent-ready`

## Discovery: the link cannot be declared once

Autodiscovery ([RSS Advisory Board](https://www.rssboard.org/rss-autodiscovery))
is the only standardized route from an HTML page to a feed: `rel="alternate"`,
`type="application/rss+xml"`, an `href`, in the `<head>`. Without it a reader has
nothing but a guessed path, and a person has nothing at all.

The obvious place for it is the locale layout, and that does not work. **Next
replaces the whole `alternates` object at the nearest segment that declares one
rather than merging into it.** The proof is a page that predates any of this:
`app/[locale]/contribute/thanks/page.tsx` sets only `alternates.canonical`, the
locale layout sets `alternates.languages`, and the served page carries a
canonical link and **no hreflang links whatsoever**. Every one of the 25 locale
routes declares its own `alternates`, so every route that should advertise the
feed has to carry it itself.

That is how the category pages lost theirs. Four blog routes spelled the same
literal out by hand; the fifth was added later and never given one, and nothing
anywhere could notice. `blogFeedAlternates(locale)` is the fix — it returns the
whole `types` object, so a call site cannot half-build it:

```ts
alternates: {
  canonical,
  languages: { … },
  types: blogFeedAlternates(locale as Locale),
}
```

It returns `undefined` where the locale publishes nothing, because the route
404s under the same condition and a reader records a broken feed against the
site rather than against the one locale.

Where the link goes, and why not everywhere: the blog index, a post, category,
tag and author pages — plus the **homepage**, which is where a reader or crawler
looks for a site's feed first. Park and glossary pages deliberately have none;
the spec asks for a page's own main feed, and a park page has no feed.

`types` is passed as an array of descriptors rather than a bare string, which is
what carries `title` into the markup. With one feed per page that is a courtesy.
The spec makes it the thing readers disambiguate by the moment a page offers
two.

**The `<head>` is not enough on its own.** The link was there for the blog index
the whole time and no visitor could act on it, because no page rendered a link
a person could click. The footer now carries one, inside the same `showBlog`
guard the feed itself 404s under.

## What an item contains

`description` is the excerpt, written by hand in frontmatter — never the
rendered body. An item once carried the whole article as `content:encoded`
(rendered by a since-deleted `feed-content.tsx`), which broke the deployment;
see "Why not the full article" below. The feed still carries 15 items — sized
for full articles, and generous now that an item is an excerpt.

`coverEnclosure()`'s byte count comes from the media manifest
(`getMediaImageBySrc(clean)?.bytes`), which answers for the **source** photo,
not the `-16x9`/`-4x3`/`-1x1` crop a cover usually points at — an approximate
length, and deliberately so; see the same section.

## Why not the full article

The feed used to render the body, for exactly the reasons you'd want that:
`ref:efteling/baron-1898` links and live-widget fences only mean something
inside this app, so a naive dump of the markdown would have shipped dead hrefs
and frozen wait-time tables into every subscriber's archive. `feed-content.tsx`
resolved `ref:` links against the geo structure and swapped each widget fence
for a link back to the live post.

Two things in that path each blew up this route's Vercel Function:

**The body import.** Loading a post's markdown has exactly one door,
`getPostByTranslationKey` from `@/lib/blog` — and `@/lib/blog` pulls in
`manifest-bodies.ts`, every post body in every locale, as one generated module
(`docs/development/scripts.md` reserves that import for the post page alone).
One import here was enough for Next's function tracer to fold the whole thing
into this route.

**The cover's byte count.** `coverEnclosure()` used to `fs.statSync` a path
built from `path.join(process.cwd(), 'public', …)` to get the crop's exact
size. Next's tracer cannot resolve a dynamic filesystem path built like that,
and falls back to bundling the **entire** directory the join is rooted at —
all of `/public`, the same failure mode already documented for
`/api/og/[...path]` in `next.config.ts`. That alone put roughly 256 MB of ride
photos into an RSS handler.

Neither is worth what it costs. A reader gets a teaser and a link regardless of
which one broke the build, so the fix was to stop doing both: read the excerpt
already sitting in the listing, and answer the enclosure length from the media
manifest instead of the filesystem.

## Three things the feed used to get wrong

**Order.** `listPosts` sorts featured-first, which is right for a page and wrong
for a feed. `lastBuildDate` was read off `posts[0]`, so pinning an older post
moved the channel's timestamp backwards and told every subscriber the feed had
gotten older. Items are strictly newest-first now, and `lastBuildDate` is the
newest date in the feed.

**Invented elements.** Items ended with `<readingTime>`, an element in no
namespace, plus a `<comments>` pointing at the post itself and a `<source>`
naming this very feed — `source` means "republished from elsewhere", so every
item claimed to be a repost of itself.

**`length="0"`.** RSS requires a byte count on an enclosure; it used to say `0`
for every cover. It now reads `getMediaImageBySrc(clean)?.bytes` — the media
database's own number for the **source** photo, not the build-time crop a
cover usually points at (see "Why not the full article" above for why this
route does not stat the file itself). Approximate beats `0`.

The channel description was a two-branch ternary that gave German its own
sentence and handed the English one to the other four locales. All six are
written out.

## WebSub

Both halves are needed. The feed declares
`<atom:link rel="hub" href="https://pubsubhubbub.appspot.com/">`, which is how a
subscriber learns there is a hub and registers with it. Then the publisher pings
the hub, which re-fetches, diffs, and pushes **only** real changes. A feed that
names a hub and never pings it is no faster than polling — the hub has no other
way to find out.

`/api/cron/websub` pings daily at 06:15 UTC, unconditionally: a ping for an
unchanged feed costs the hub one conditional GET of a public document, and six
requests a day is not worth keeping state to avoid. What a schedule cannot do is
deliver a post minutes after publication, so `pnpm ping:websub` fires the same
ping by hand — after the deploy carrying the post is live, or the hub re-reads
the old feed and finds nothing.

## Checks

`pnpm check:agent-ready` (needs a running site) fetches all six feeds and
asserts, per locale, that they serve as RSS, carry items, name themselves,
declare a hub, ship a description per item, and sized every enclosure — then
that the homepage, blog index, category and tag pages each carry the
autodiscovery link, and that `/rss.xml` still redirects.

None of that is visible from the site, which is the point: a feed can lose its
link, start serving HTML, or drop every item's excerpt through a green build,
and the first symptom would be a subscriber seeing nothing new for weeks.
