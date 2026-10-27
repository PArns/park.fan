# An ISR route needs both halves, and a page nobody reads back is not an ISR route (REQUIREMENT)

**A change that takes pages out of `next build` says where they render instead, and the default is
`export const dynamic = 'force-dynamic'` behind a `CDN-Cache-Control` window, not on-demand ISR.**
Such a route has no `generateStaticParams`, and `next.config.ts` carries a `CDN-Cache-Control` rule
for every localized segment of it. Routes on this model: park, ride, calendar,
`average-wait-times`, `with-kids`, `glossary/[term]`, `blog/[slug]`, `news/[slug]`. A page that must
not be cached at the edge (`/search`) is not on this model.

**ISR stays where its entries are read back**: the homepage, the hubs, the blog listings and the
indexable tag archives are built and served from their build. Judge a route by its read and write
columns in Vercel Observability → ISR → Routes, in units, never by the build table alone.

**A route that stays ISR needs both halves**, and each fails silently:

1. **Every fetch the route executes carries `next: { revalidate }`.** Next 16 leaves an unqualified
   `fetch` at `no-store`, and one uncached fetch turns the whole route dynamic.
2. **A route whose segments are all dynamic declares `generateStaticParams`** (`[]` is enough).
   Without it the route is not registered in `.next/prerender-manifest.json` at all, whatever its
   `revalidate` says: Next serves it per request and caches nothing.

## Why

**Vercel gives every deployment its own ISR cache**, and the site deploys about ten times a day. The
first request for an unbuilt path in each deployment is a render plus a write; a long-tail URL is
crawled less often than that, so nearly every crawl met an empty cache and the entry was never read
back: in the 12 hours to 2026-10-26, `glossary/[term]` wrote 9.0K units and read 300. Built blog
posts were rewritten too, whenever the backend pushed a cache tag their widgets read: a built page
is no protection from a tag.

A render behind the edge window is cheaper: Cloudflare's "Frontend cache" rule caches by
`CDN-Cache-Control`, Vercel's CDN keeps it as well, and a miss renders out of the Data Cache, which
survives deploys. One glossary render with its write cost as much as 6–16 plain renders.

**The header rule becomes load-bearing.** A localized segment missing from `next.config.ts` is a
render on every request, or a window borrowed from another route's rule.

## Check

- `pnpm test:edge-windows` matches the `next.config.ts` header rules the way Next does, for every
  locale of every route on the model, and checks that the route's own rule decides. A new route on
  the model joins it.
- For an ISR route, diff `.next/prerender-manifest.json` before and after a build: the route must
  appear under `dynamicRoutes`. The build table's `ƒ` looks the same as "absent from the manifest".

Background: [decisions → a page nobody reads back renders per request](../optimization/decisions.md#2026-10-26--accepted-a-page-nobody-reads-back-renders-per-request-not-on-demand-isr)
has the full ISR table, and [caching strategy → what an ISR write costs](../architecture/caching-strategy.md#what-an-isr-write-costs)
the formula; the earlier decisions are
[2026-10-16](../optimization/decisions.md#2026-10-16--accepted-one-prerender-worker-per-core-and-the-tag-archives-nobody-indexes-stay-unbuilt)
and [2026-10-20](../optimization/decisions.md#2026-10-20--accepted-the-glossary-renders-on-demand-and-the-media-check-asks-all-parks-at-once).
