# Media database

One filesystem-backed database for every image the site uses: park and ride photos, blog
galleries, diagrams. This page covers the read side: the modules that query it, what the build
generates, how it is cached, the HTTP API and the export for the native app. Open it before
importing from `@/lib/media*` or touching `scripts/generate-media-manifest.mjs`.

- Authoring contract (sidecar fields, roles, tags, focus, `alsoRides`, `review`, naming):
  [`public/media/README.md`](../../public/media/README.md)
- How the admin, the capture screen, contributions and the blog editor write to it, and the GitHub
  token saving needs: [writing to the media database](media-database-writes.md)
- Standing rules: [media database](../rules/media-database.md) (sidecar is the index, client-safe
  imports, credits), [card photos are two layers](../rules/card-photos-are-two-layers.md),
  [one photo can index two rides](../rules/one-photo-can-index-two-rides-alsorides.md),
  [no Creative Commons photos](../rules/no-creative-commons-photos.md)

Files live at `public/media/<collection>/<name>.<ext>` with a `<name>.json` sidecar. Nothing
queries by folder: an image says what it shows (`park`, `ride`, `area`, `tags`) and what it is used
for (`roles`), so a Halloween photo of Troy appears in the gallery it was shot for and on Troy's
ride page without being stored twice. "Blog image" is therefore not a category, at most a tag.

## Reading it

### `@/lib/media`: structure, lookup, search

No `fs`, no `server-only`: it reads the build-time manifest, so it works in Server Components,
route handlers and scripts alike. **Not client-safe**: it ships the whole catalog (~107 KB).

```ts
import { getRideImage, getRideImages, getParkBackground, searchMedia } from '@/lib/media';

getParkBackground('europa-park'); // the park's full-bleed photo (role park-background)
getRideImage('toverland', 'troy'); // the canonical ride photo (role ride-card)
getRideImages('toverland', 'troy'); // all photos of that ride, any collection, incl. alsoRides
getParkImages('toverland'); // every photo assigned to the park
getParkOnlyImages('walibi-holland'); // park-level tier: park set, no ride
getHeroImages('toverland'); // hero rotation, optionally per park
searchMedia({ q: 'arach', tags: ['night'] });
```

### `@/lib/media/text`: localized alt and caption

Kept separate on purpose: `manifest-text.ts` is six locales of prose for every image (~37 KB), and
a route that only resolves a path or runs a search must not pay for it. Same split as
`@/lib/blog/listing` vs `@/lib/blog`.

### `@/lib/media/hero` — client-safe

The hero rotation runs in Client Components, so this module reads a generated slice
(`manifest-hero.ts`, ~21 KB) holding only the hero images and their caption fields
(`pickHeroImage`). The admin login uses it too.

### `@/lib/media/attribution` — client-safe

`getPhotoAttribution(src)` returns the on-image credit for a path a component already paints (`?v=`
and crops included), or `null` for an own shoot. It reads `manifest-attribution.ts`, which lists
only the photos `needsAttribution()` is true for, so `PhotoCredit` can take a bare `src` in any
Client Component. The rules (`OWN_PHOTO_AUTHORS`, `needsAttribution`, `getCreditLine`) live in
`@/lib/media/credit`, which imports nothing at runtime so the generator can load it too. Where the
credit must render is in the [media database rule](../rules/media-database.md).

### `@/lib/media/hero-lqip`: server only

`heroBlurDataUrl(src)` returns a 16 px WebP of a hero photo as a `data:` URL for `next/image`'s
`placeholder="blur"`. Its table is a separate file because a page needs only the one preview it
server-picked, and the whole table (~13 KB of base64) would otherwise ship to every visitor. The
server looks it up and passes it down as a prop (see [homepage hero](homepage-hero.md)).

### `@/lib/media/focus`: one crop rule for every surface

`objectPositionForSrc(src, fallback)` turns an image's focal point into a CSS `object-position`, and
`versionedPath(src)` attaches `?v=` to any media path, crops included.

**Not client-safe**: it imports `./index` and therefore the manifest. Its absence from the
client-safe list once put 80 KB of catalog into the homepage bundle. So a card never resolves its
own photo or focal point; both are handed in. `enrichParksWithImages` / `enrichAttractionsWithImages`
(`lib/utils/park-assets.ts`) attach `backgroundImage` and `backgroundPosition` together,
`getCardObjectPosition` serves direct server call sites, `getCardImageMap()` is served as
`/api/card-images` for the browser's direct API calls (`loadCardImageMap`, `lib/media/card-images.ts`),
and the relays behind client-rendered grids (`/api/parks/[...path]`, `/api/nearby`,
`/api/favorites`) enrich on the way out. `ParkCard`, `AttractionCard`, `CardPhotoFrame` and
`ParkBackground` import nothing from `lib/media` except `@/lib/media/attribution` through
`PhotoCredit`. The cheap check after a build:

```sh
grep -l "avatar-flight-of-passage/01-hoehlen" .next/static/chunks/*.js   # must be empty
```

A **pre-cut crop** (`…-16x9.jpg`) answers as the image it was cut from (same credit, same content
version) but gets `50% 50%`, not the focal point: the crop was already cut around that point, and
offsetting it again in CSS would apply the correction twice. Blog `coverImage` frontmatter points
straight at a crop, which is exactly the file whose bytes change under an unchanged URL when a focal
point is retargeted; hence the version token below.

### Card framing

The framing reference for a focal point is the strip between a card's two glass panels
(`CardPhotoFrame`), never the whole card; why, and what breaks otherwise, is in
[card photos are two layers](../rules/card-photos-are-two-layers.md). Mechanics not stated there:
the two mirrored copies above and below the strip use the same URL (one request, one decode), each
zooms about its own centre on hover so the seam stays invisible, and they are only ever seen through
16–18 px of backdrop blur. `pnpm check:card-framing` (needs a running site) checks the **box** of
every card that has a bottom panel across ride, park, blog and home surfaces, not the photo in it: a
natively 16:9 picture has no vertical range in a 1.67 box, which is a property of that picture,
while a panelled card's box going square (a third badge row, a taller footer) would take the Y axis
from every landscape photo at once.

### A ride shows its own photo or none

There is no ride → park photo fallback anywhere a picture stands for a ride: not on the cards
(`enrichAttractionsWithImages`, `getCardObjectPosition`), the ride page backdrop, the ride's JSON-LD
`image`, the blog widgets or the editor's preview of them. On a park page the park photo on three
neighbouring cards read as a bug, and it claims "this is what the ride looks like", which is false.
`AttractionCard` renders its gradient placeholder and `ParkBackground` renders nothing. The one
exception is the **OG card**, where the park photo is chrome behind text that names the ride.

## Generated files

`pnpm generate:media` (`scripts/generate-media-manifest.mjs`) walks `public/media` and writes:

| File                      | Size    | Holds                                                                |
| ------------------------- | ------- | -------------------------------------------------------------------- |
| `manifest.ts`             | ~107 KB | structural rows: paths, size, park/ride, roles, credit, focus, crops |
| `manifest-text.ts`        | ~37 KB  | localized alt and caption per id                                     |
| `manifest-search.ts`      | ~81 KB  | the search index (below) and `MEDIA_REVISION`                        |
| `manifest-parks.ts`       | small   | park name, city, country per park, from the API catalog              |
| `manifest-hero.ts`        | ~21 KB  | the client-safe hero slice                                           |
| `manifest-hero-lqip.ts`   | ~13 KB  | a 16 px inline preview per hero image, server only                   |
| `manifest-attribution.ts` | ~2 KB   | the client-safe on-image credits, only photos that need one          |

It runs in `prebuild` **after** `generate:image-crops`: the manifest records which crops exist, so
the structured-data image set never advertises a file that was not cut and nothing probes the
filesystem at request time.

`manifest-parks.ts` is **committed**. It is regenerated only when the API catalog is reachable and
otherwise left alone, so an offline build keeps the last known park names instead of silently
dropping every hero caption.

### The search index

Two structures, because word-prefix and substring search have different right answers:

- an **inverted index** (sorted token vocabulary plus postings): a prefix query is a binary search
  and a short forward walk, so cost tracks the number of matches, not the number of images;
- a flattened **haystack** per image, the fallback for a query that starts mid-word (`phobia` →
  Arachnophobia).

Both fold diacritics, so `grun` finds `grün`. The tokenizer is shared between generator and query
side (`lib/media/tokenize.mjs`); if the two disagreed on what a token is, search would quietly stop
matching.

### Build-time validation

The generator is the only thing between a typo and a silently missing image. It reports:

- unknown park or ride slugs against the live catalog (`MEDIA_VERIFY=0` skips it), including every
  `alsoRides` slug;
- ambiguous park slugs used without `parkPath`;
- two images claiming the same unique role (`park-background`, `ride-card`; `auditRoles`);
- tags outside the vocabulary (`lib/media/tags.mjs`) and clashes within an exclusive facet;
- counts of `license: unknown`, images without a park and images still marked `review`;
- `/media/…` paths in `content/blog` that no longer exist (a move made by hand; READMEs are skipped);
- and it **fails** on a Creative Commons licence.

## Caching

The database changes only when a deployment ships, so it is cached harder than anything else, with
one precaution.

**Image URLs carry `?v=<content hash>`**, `sha1` over the file bytes and the focal point. Without it,
retargeting a focal point rewrites a crop's bytes at an unchanged URL, and the CDN plus the image
optimizer (`minimumCacheTTL` one year) would serve the old framing indefinitely. A global build id
would bust every image on every deploy; this token moves only when that image's pixels or framing
do. `next.config.ts` allows the query on local images through `images.localPatterns`: an omitted
`search` means "any query", which is why `/media/**` has its own entry and everything else keeps the
no-query rule.

**`/api/media` is cached a day fresh and a week stale-while-revalidate**, with a strong ETag over
`MEDIA_REVISION` and the query. The route must stay `force-dynamic`: it is driven entirely by query
parameters, and `force-static` once prerendered one empty-query response and served the whole
catalog for every filter. Its `Cache-Control` is repeated in `next.config.ts`'s `headers()` **after**
the blanket `/api` no-store rule, or the handler's own header is clobbered.

## HTTP API

For external clients:

```
GET /api/media?q=&park=&ride=&collection=&tag=&role=&license=&limit=&offset=&locale=
GET /api/media?facets=1          → tag/park/collection counts + stats
GET /api/media/<collection>/<name>?locale=en
```

`park=` and `ride=` accept an explicit empty value meaning "has none", which is how a client asks
for the park-level tier. Each image serializes with a versioned URL, alt and caption for the locale,
a formatted credit line, the park's name and page path, the focal point (so a client cropping to
its own ratio can honour it) and the pre-cut variants. `revision` is in every payload, so one
conditional request answers "did anything change?".

`/api/image?park=&attraction=&w=&q=` stays for clients that want bytes at a size; it resolves
through the database and redirects (307) to the optimizer.

## Export for the native app

The native app does not use the routes above: every byte through the optimizer is billed by Vercel,
and Cloudflare challenges non-browser clients on `park.fan/api/*` (403, `cf-mitigated: challenge`).
It reads `https://media.park.fan`, an R2 bucket (`media-park-fan`, EU jurisdiction) filled by
`pnpm publish:media` (`scripts/publish-media-r2.mjs`):

- **Which photos:** exactly the card photos, chosen by `getParkBackground` and `getRideImage` as in
  `getCardImageMap()`, so the app and the cards cannot disagree. `license: unknown` is left out.
- **Files:** `<id>/<version>-<w>.webp` at 400, 828, 1200 and 1600 px, never upscaled, quality 78,
  `Cache-Control: public, max-age=31536000, immutable`. `version` changes with the pixels or the
  focal point, so a key never changes and the script uploads only missing keys.
- **`index.json`** (`max-age=300`), written last so it never names a missing file:
  `{schema, generatedAt, base, pattern, parks: {<geo path>: id}, rides: {<geo path>/<ride>: id},
images: {id: {v, w, h, widths, focus, credit, attribution}}}`. Parks are keyed by the API's geo
  path, because `disneyland-park` and `universal-islands-of-adventure` each exist twice. `credit` is
  `getCreditLine()`, `attribution` is `needsAttribution()`; the app shows the line on the photo when
  it is true, as the cards do. Files are scaled, never cropped, so the app applies `focus` itself.
- **When:** `.github/workflows/publish-media.yml` on every push to `main` touching `public/media/**`,
  and by hand (`workflow_dispatch`). Secrets: `R2_ENDPOINT`
  (`https://<account>.eu.r2.cloudflarestorage.com`), `R2_BUCKET`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`. Locally, `pnpm publish:media --out <dir>` writes the same files to a folder
  without credentials.

## Related

- [Writing to the media database](media-database-writes.md): admin browser, sessions, uploads
- [Assets](../development/assets.md): delivery, quality banding, source-size targets
- [Scripts](../development/scripts.md): `generate:media`, `generate:image-crops`
- [Caching](../architecture/caching-strategy.md): where this fits the wider model
