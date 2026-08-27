# Blog feeds

Six RSS 2.0 feeds, one per locale, at `/{locale}/blog/feed.xml`. Full posts, a
cover enclosure, and a WebSub hub so a new article reaches a subscriber without
waiting for their reader's next poll.

- Route: `app/[locale]/blog/feed.xml/route.ts`
- Identity and the autodiscovery link: `lib/blog/feed.ts`
- Body → feed HTML: `lib/blog/feed-content.tsx`
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

`description` stays the excerpt. `content:encoded` carries the whole article —
the namespace was declared and unused for as long as the feed existed.

Rendering the body for a feed is not rendering it for the site, and
`feed-content.tsx` exists because three things in a post body only mean
something inside this app:

**Widget fences are live tables.** A feed item is archived by the reader the
moment it arrives and never re-fetched, so rendering today's numbers into one
freezes them in every subscriber's client forever — the same mistake as typing a
wait time into a post, which is why the fences exist. Each fence becomes a link
to the live table, in place, because the prose around it refers to it.

**`ref:` links are a private protocol.** `ref:efteling/baron-1898` is a dead
href anywhere but here. They are resolved against the geo structure —
`resolvePark` only, never `resolveAttraction`: a ride URL is its park's href
plus the slug, and the attraction payload is 425 KB of data no feed renders. One
geo fetch covers every ride an article names. A ref that does not resolve loses
its anchor and keeps its label.

**Relative paths resolve against the reader's host.** Everything is absolute,
and image URLs keep their `?v=` content version, because a reader caches an
image by its address and a retargeted crop would otherwise keep the old framing
in every subscriber's client.

Two smaller decisions in the same file. `react-markdown`'s default
`urlTransform` strips protocols it does not recognise, so every entity link
arrived as `href=""` until the transform was overridden — the site renderer has
the same guard for the same reason. And an image-only paragraph is unwrapped,
decided from the **hast node** rather than the rendered children: with a
`components` map the child element's type is the component, so the `<figure>`
does not exist yet and a `child.type === 'figure'` test matches nothing.

`react-dom/server` is imported dynamically. Next rejects a static import of it
anywhere in the App Router graph.

**The feed carries 15 items, not 40.** Forty was free while an item was an
excerpt and is not now that it carries the article: nine posts already weigh
~390 KB per locale, so forty would be roughly 1.7 MB fetched by every
subscriber's reader on every poll. Everything older stays where an archive
belongs — the blog index, the category pages and the sitemap.

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

**`length="0"`.** RSS requires a byte count on an enclosure. It is measured off
the file, not read from the media database: a frontmatter cover is usually a
build-time crop, and the database's `bytes` describes the **source** photo. For
Voltron's cover the difference is 89 KB against 290 KB.

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
declare a hub, ship a body per item, froze no widget, left no unresolved `ref:`,
and sized every enclosure — then that the homepage, blog index, category and tag
pages each carry the autodiscovery link, and that `/rss.xml` still redirects.

None of that is visible from the site, which is the point: a feed can lose its
link, start serving HTML, or drop every body through a green build, and the
first symptom would be a subscriber seeing nothing new for weeks.
