# An ISR route needs both halves, and a page nobody reads back is not an ISR route (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

## Taking pages out of the build decides where they render

**A change that takes pages out of `next build` says where they render instead, and the default
answer is `export const dynamic = 'force-dynamic'` behind their `CDN-Cache-Control` window, not
on-demand ISR.** This is how the writes of October 2026 got in: two build-time optimizations
([2026-10-16](../optimization/decisions.md#2026-10-16--accepted-one-prerender-worker-per-core-and-the-tag-archives-nobody-indexes-stay-unbuilt),
the thin tag archives, and
[2026-10-20](../optimization/decisions.md#2026-10-20--accepted-the-glossary-renders-on-demand-and-the-media-check-asks-all-parks-at-once),
the 1,854 glossary term URLs) returned `[]` or a subset from `generateStaticParams` and wrote
"rendered on its first request and cached from then on, as a built page would be". Both measured
the build and neither priced the writes, because that sentence is false on Vercel.

**Vercel gives every deployment its own ISR cache.** "Each new deployment uses its own ISR cache
and does not reuse the cache from a previous deployment"
([Vercel](https://vercel.com/docs/incremental-static-regeneration)). So the first request for an
unbuilt path in each deployment is a render plus a write, and the site deploys about ten times a
day. A long-tail URL is crawled less often than that, so nearly every crawl lands on an empty cache
and the entry is never read back. One render stores two objects, HTML and RSC, billed in
compressed 8 KB units: `/fr/blog/temps-d-attente-parcs-europe-2026` shows a size range of 24–45
units and 69 written. A `notFound()` and a `permanentRedirect()` are stored the same way, about 3
units each.

Production, ISR → Routes → Units, the 12 hours to 2026-10-26 13:00 Berlin, before the change:

| Route                         | Written | Read |
| ----------------------------- | ------: | ---: |
| `glossary/[term]`             |    9.0K |  300 |
| `…/[park]/average-wait-times` |    6.2K |  182 |
| `blog/tag/[tag]`              |    3.0K | 1.9K |
| `…/[park]/with-kids`          |    1.2K |   32 |
| `blog/[slug]`, per post       |   40–80 |    0 |

The blog posts were built, and still each wait-time post was written again whenever the backend
pushed one of the tags its widgets read (`geo attractions parks park:<geo> weather` on
`/de/blog/walibi-belgium-wartezeiten-tipps`, from its `.meta`). A built page is no protection from
a tag.

**So a page that is not read back from ISR renders per request.** `export const dynamic =
'force-dynamic'`, no `generateStaticParams`, and a `CDN-Cache-Control` rule in `next.config.ts` for
every localized segment of the route. Cloudflare's "Frontend cache" rule caches by that header and
bypasses without it ([docs/optimization/README.md](../optimization/README.md)), Vercel's own CDN
keeps it as well (a force-dynamic park page answered `MISS`, then `HIT` with `age: 22`), and a miss
is a render out of the Data Cache, which survives deploys. The price is in the CPU's favour: one ISR
write unit costs as much as about 112 ms of Active CPU in `iad1` or 6.7 invocations, and a glossary
render with its write (9–17 units) pays for 6–16 renders. Live values arrive in the browser, as on
the park page. Routes on this model: park, ride, calendar, `average-wait-times`, `with-kids`,
`glossary/[term]`, `blog/[slug]`, `news/[slug]`.

**What becomes load-bearing** is the header rule. A localized segment missing from the copies in
`next.config.ts` is a render on every request, or a window borrowed from the ride rule's
`:attraction`; `pnpm test:edge-windows` matches the rules the way Next does, for every locale of
every route on this list, checks that the route's own rule decides, and a new route on the model
joins it. A
page that must not be cached at the edge (`/search`) is not on this model at all.

**ISR stays where its entries are read back**: the homepage, the hubs, the blog listings and the
indexable tag archives are built and served from their build. Two routes still render on demand
into ISR and are the next to move: the thin tag archives (`noindex`) and the single-park cities,
which answer a 308. Judge a route by its read and write columns in
Observability → ISR → Routes, in Units, never by the build table alone.

## The two halves, for a route that stays ISR

`export const revalidate = 86400` does not make a route cached. Two other things decide it, and each fails silently. **First, every fetch the route executes must carry `next: { revalidate }`.** Next 16 leaves an unqualified `fetch` at `no-store`, and one uncached fetch turns the whole route dynamic — the opposite mistake to the one [a `revalidate` at a call site](a-revalidate-at-a-call-site-is-somebody-elses-page.md) describes, and caught by the same walk of the route's import graph. **Second, a route whose segments are all dynamic and which declares no `generateStaticParams` is not registered in `.next/prerender-manifest.json` at all**, whatever its `revalidate` says: Next serves it per request and caches nothing. Measured on `/[locale]/parks/[continent]/[country]/[city]/[park]/average-wait-times` (2026-09-21): without the export the route was absent from `dynamicRoutes` and printed `ƒ` in the build table; with `generateStaticParams` returning `[]` it was `● … 1d` and `{"compute": "blocking", "fallback": null}` — nothing built ahead of time, each URL rendered on its first request and served from that render for the rest of the deployment. That route has since moved to the model above, for the reason above. So the check is the manifest and never the route table: `ƒ` and "absent from `dynamicRoutes`" look the same from the outside as a route that simply has no prerendered paths yet. Prove a change by diffing `.next/prerender-manifest.json` before and after a build, the same artefact the `revalidate` rule is proven against.
