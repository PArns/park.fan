# A runtime file read ships the whole directory it is rooted at (REQUIREMENT)

A `readFileSync(join(process.cwd(), <root>, <variable>))` in code a route reaches bundles **the whole
`<root>` directory** into that route's function, because the tracer cannot resolve the path
statically. The root of the expression decides how many megabytes the function carries, not what
the code opens at runtime. Two fixes, both about the expression:

- **Root the read at a directory built for this function.** `og-assets/`, written by
  `scripts/generate-og-assets.mjs` in `prebuild`, holds one 1200×630 rendition per media photo plus
  the two brand PNGs; `lib/og/background-photo.ts` reads from it. The directory is the list of what
  ships and cannot grow behind anybody's back. A read whose path comes from data (a media path, a
  slug, a frontmatter field) always takes this fix.
- **Or name the file literally.** `join(process.cwd(), 'public', 'logo-dark.png')` traces to that one
  file, `join(process.cwd(), 'public', file)` to all of `public/`. That is why `lib/og/brand-mark.tsx`
  writes one literal branch per asset rather than a loop.

`outputFileTracingIncludes` and `outputFileTracingExcludes` are not the lever: `next build --turbo`
never calls `collectBuildTraces`, the only place either map is applied, so every key in them is
inert under this build.

## Why

It broke a deploy three times, never where the change was made. `api/og/[...path]` failed at
410.24 MB (rooted at `public/`, pulling in a 282 MB tree) and again at 290.96 MB a month later with
nothing about the route changed: `public/media` had grown. `blog/feed.xml` failed the same week from
an `fs.statSync(join(process.cwd(), 'public', …))` that measured an enclosure's size. Rooting the
OG read at `og-assets/` turned 287.0 MB of traced files into 46.8 MB.

## Check

`pnpm measure:function-size` (`scripts/measure-function-size.mjs`) sums
`.next/server/<route>/*.nft.json` per bucket; it printed 287.0 MB against Vercel's 290.96 MB for the
same commit. Run it before and after, never trust the build table or a local `du`.
