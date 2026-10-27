# OG images

The 1200×630 social preview cards every page's metadata points at, rendered on request by
`app/api/og/[...path]/route.tsx`. Open this page before changing a card, adding a page whose card
needs its own headline, or touching what the OG function reads off disk or how long its answers
are cached.

| Piece                                   | Job                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `lib/utils/og-image.ts`                 | `getOgImageUrl(segments)`, the URL every page puts into its metadata        |
| `app/api/og/[...path]/route.tsx`        | Parses the path, picks the card, renders it with `next/og`                  |
| `lib/og/blog-og.tsx`, `glossary-og.tsx` | The blog, news and glossary-term cards, both through `lib/og/text-card.tsx` |
| `lib/og/background-photo.ts`            | The photo behind a card, read off `og-assets/` as a data URI                |
| `lib/og/brand-mark.tsx`                 | The marker and wordmark (`OgBrandLockup`), read the same way                |
| `lib/og/jpeg.ts`                        | `ogAsJpeg`: re-encodes the PNG `next/og` emits                              |
| `scripts/generate-og-assets.mjs`        | Writes `og-assets/` in `prebuild` (`pnpm generate:og-assets`)               |
| `scripts/render-og.mjs`                 | `pnpm og:preview`, a contact sheet of every template                        |

## URLs

`getOgImageUrl(['de', 'europe', 'germany'])` is
`<NEXT_PUBLIC_BASE_URL>/api/og/de/europe/germany/og.jpg` (base defaults to `https://park.fan`). The
route drops a trailing `og.jpg` (`OG_IMAGE_FILENAME`), and also the legacy `og.png`, which every
page indexed before the switch to JPEG and every cached social preview still carry. Both are served
directly: a redirect would add a hop to the expensive requests. A blog post's metadata prefers its
`seo.ogImage`, then a raster cover, and only then the card (`components/blog/blog-post-page.tsx`).

## Which card a path gets

Checked in this order:

| Path after `/api/og/`                                   | Card                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `<locale>/blog[/…]`                                     | `renderBlogOg`: index, post (`<slug>`), `category/<path>`, `tag/<tag>` |
| `<locale>/news`                                         | `renderBlogOg` with `section: 'news'`                                  |
| `<locale>/<glossary segment>/<term>`                    | `renderGlossaryTermOg`; an unknown term falls through                  |
| `<locale>`                                              | home: tagline, total park count, a random hero photo                   |
| `<locale>/<key of genericPages>`                        | generic: the page's title from its namespace, a random hero photo      |
| `<locale>/<continent>[/<country>[/<city>]]`             | region: name, park count, the region's outline (`getRegionGeoSVG`)     |
| `<locale>/<continent>/<country>/<city>/<park>[/<ride>]` | place: name and location over the park's or ride's photo               |

A two-segment path whose second segment is not a key of `genericPages` is read as a continent, and
an unknown continent renders an empty headline over "0 parks". **A new page that calls
`getOgImageUrl([locale, '<segment>'])` adds its segment to `genericPages`**, with the
`{ namespace, key }` of its title, or `{ literal }` for an English-only page such as the changelog.
Old segments stay (`howto` beside `how-park-fan-works`), because shared URLs keep being fetched.

The geo segments reach backend URLs, so anything that is not slug-shaped is a 400 before a fetch
([an API route passes only slugs upstream](../rules/an-api-route-passes-only-slugs-upstream.md)); an
unknown park or ride is a 404. The blog, news and glossary branches run before that check and fetch
nothing upstream.

**No live data on any card.** Status, crowd level and wait time were taken off: a platform shows a
cached preview for days, so the figures were wrong by the time anybody saw them, and they were what
held the cards to a five-minute window. A place card fetches the park only for its name and photo;
the 159 KB geo document is fetched by the region, home and `/parks` cards, and by a place card
only as a fallback for a missing city or country name.

## Rendering and assets

`next/og` (Satori) paints a PNG; `ogAsJpeg` re-encodes it with sharp (quality 82, mozjpeg), which is
far smaller for every card type. sharp is imported inside the `try`, so a missing native binary
serves the PNG instead of failing every card.

The photo and the brand marks are read from the deployment's own disk, not fetched over HTTP on
every render. The read is rooted at `og-assets/`, which `prebuild` fills with one 1200×630
rendition per media photo and the two brand PNGs, and which is gitignored. Rooting it anywhere
else ships that whole directory in the function
([a runtime file read ships the directory it is rooted at](../rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md)).
Without a rendition (or under `next dev` before `pnpm generate:og-assets` has run) the photo falls
back to its absolute URL, which usually paints nothing because Satori skips progressive JPEGs, and
the brand marks fall back to `public/`. A raster blog cover is read the same way; an SVG cover is
skipped, since Satori cannot size it.

## Cache windows

| Answer                        | `Cache-Control`                                                           |
| ----------------------------- | ------------------------------------------------------------------------- |
| A card                        | `public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400` |
| Render threw (500)            | `public, max-age=0, s-maxage=300`                                         |
| Bad path (400), unknown (404) | none of their own                                                         |

Thirty days because nothing on a card changes before the next deploy, which purges Cloudflare, and
because the URLs are many and each is asked for about once a day: the five-minute window it
replaced hit the cache almost never. The route sets the value with `cdnCacheHeaders` (also
`CDN-Cache-Control`), `text-card.tsx` sets `Cache-Control` alone, and the `/api/og/:path*` rule in
`next.config.ts` repeats it; the three must agree, because on Vercel the handler's header wins and
under `next start` the rule does ([CDN caching](../architecture/cdn-caching.md#api-routes)). The
failure window is its own five minutes so a card that failed once is not frozen for a month, yet one
that always fails is rendered at most once per five minutes per URL. The 400 and 404 answers carry
no header, so they take the rule's thirty days.

`robots.txt` allows `/api/og/` while disallowing the rest of `/api/`
([SEO analysis](../seo/analysis.md)).

## Checking a change

`pnpm og:preview` fetches one sample per template (home, generic pages, region, park, ride, blog
index, post, category, tag, glossary term) from a running server, writes them to `.og-preview/` with
an `index.html` contact sheet, and exits non-zero if any failed. It targets `http://localhost:3000`;
`--base=<url>` or `OG_BASE` points it elsewhere, and extra arguments are rendered too
(`pnpm og:preview en/europe/germany/bruehl/phantasialand`). Against `next dev` the photos fall back
as described above, so judge photos against `pnpm build && pnpm start`.
