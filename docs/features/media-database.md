# Media database

One filesystem-backed database for every image the site uses: park and ride photos, blog
galleries, diagrams. This page covers the read side: the modules that query it, what the build
generates, how it is cached, the HTTP API and the export for the native app. Open it before
importing from `@/lib/media*` or touching `scripts/generate-media-manifest.mjs`.

- Authoring contract (sidecar fields, roles, tags, focus, `bannerFocus`, `alsoRides`, `review`,
  naming):
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
getParkBackground(park); // a ParkBase as it stands: its url names the park's path
searchMedia({ q: 'arach', tags: ['night'] });
```

**A park is found by its path, not its slug.** `disneyland-park` is Paris and Anaheim. An image is
filed under its park's geo path (`continent/country/city/slug`): the sidecar's `parkPath`, else the
catalog's path for the slug (`MEDIA_PARK_PATH_BY_SLUG`). Every park lookup takes the park as a slug
or as `{ slug, url }`, where `url` is the API's `/v1/parks/…`, a page path or the bare path, so a
`ParkBase` passes as it stands. A bare slug finds the catalog's first park of that slug, which for
`disneyland-park` is Paris; a caller that knows the park's path passes it. The keys come from one
module, `lib/media/park-path.mjs`, which the generator's role audit, the admin's unique-role
hand-over, the card map and the app export import as well. `pnpm test:media-park-path`.

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
keyed by geo path with a `paths` table for a park that arrives with a slug and no `url` (its
fetch URL changes with its keys, because the browser keeps the map a day), and the relays behind
client-rendered grids (`/api/parks/[...path]`, `/api/nearby`,
`/api/favorites`) enrich on the way out. `ParkCard`, `AttractionCard`, `CardPhotoFrame` and
`ParkBackground` import nothing from `lib/media` except `@/lib/media/attribution` through
`PhotoCredit`. The cheap check after a build:

```sh
grep -l "avatar-flight-of-passage/01-hoehlen" .next/static/chunks/*.js   # must be empty
```

The two full-bleed heads with text over the photo, `LandingHero` and `BlogPostBanner`, take their
framing from `heroPhotoFraming(src)` (`components/marketing/editorial-ui.tsx`), which reads
`bannerObjectPositions(src)`: the sidecar's `bannerFocus` below `sm`, `focus` from `sm` up. Both
positions are custom properties on the image's `style` (`--focus-narrow`, `--focus-wide`) and a
`max-sm:` class picks one, so the server's HTML is already framed for every width and nothing
re-renders on the client. Only the full manifest carries `bannerFocus`, and only on the rows that
set it; the client-safe slices do not, since neither head runs on the client.

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

- **Which photos:** the card photos, chosen by `getParkBackground` and `getRideImage` as in
  `getCardImageMap()`, so the app and the cards cannot disagree, plus every photo with the `hero`
  role (`getHeroImages()`), the pool the app's Start hero picks from as the homepage does.
  `license: unknown` is left out.
- **Files:** `<id>/<version>-<w>.webp` at 400, 828, 1200 and 1600 px, never upscaled, quality 78,
  plus the photo's own width when it is below 1600 px (a 1024 px photo ships at 400, 828 and 1024),
  `Cache-Control: public, max-age=31536000, immutable`. `version` changes with the pixels or the
  focal point, so a key never changes and the script uploads only missing keys.
- **`index.json`** (`max-age=300`), written last so it never names a missing file:
  `{schema, generatedAt, base, pattern, parks: {<geo path>: id}, rides: {<geo path>/<ride>: id},
images: {id: {v, w, h, widths, focus, credit, attribution, roles, bannerFocus?, title?}}}`.
  `roles` are the sidecar's (`hero`, `park-background`, `ride-card`), `bannerFocus` the focal point
  for a narrow full-bleed head where the sidecar has one, `title` the sidecar's own title (not
  translated) where it has one; a title the manifest made up from the file name is left out. Parks are keyed by the API's geo
  path, because `disneyland-park` and `universal-islands-of-adventure` each exist twice, and the photo
  is looked up by that path too. `credit` is
  `getCreditLine()`, `attribution` is `needsAttribution()`; the app shows the line on the photo when
  it is true, as the cards do. The line carries its own `©`, so it is drawn as it stands, with no
  „Foto:“ in front, as `PhotoCredit` draws it on the website. Files are scaled, never cropped, so the app applies `focus` itself.
- **When:** `.github/workflows/publish-media.yml` on every push to `main` touching `public/media/**`
  or `content/blog/**`, and by hand (`workflow_dispatch`). Secrets: `R2_ENDPOINT`
  (`https://<account>.eu.r2.cloudflarestorage.com`), `R2_BUCKET`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`. Locally, `pnpm publish:media --out <dir>` writes the same files to a folder
  without credentials.

### News for the app

The same script writes the news posts as JSON (`scripts/news-export.mjs`, blocks in
`lib/blog/news-blocks.ts`), because the app cannot call `park.fan/api/*` either. Both files have
`Cache-Control: public, max-age=300` and are written before `index.json`; the avatar files are
written before them.

- **Which posts:** the `/news` listing: `isNewsCategory()` (`news` and `news/…`), `listPosts()` so
  drafts, hidden and scheduled posts stay out, only posts the locale has itself (no English
  fallback), newest first by date and time, all of them: the app searches and filters the list on
  the device, so it holds every post the website's search finds (117 German news are 100 KB, 26 KB
  compressed).
- **Guides:** every other post (the `/blog` listing, `selectGuides()`) is written by the same code
  to `guides/<locale>.json` and `guides/<locale>/<slug>.json`, with the same fields and block
  types as the news files below. Only `url` differs: it is
  `https://park.fan/<locale>/blog/<slug>`.
- **`news/<locale>.json`:** `{schema: 1, generatedAt, locale, posts: [Post]}`, with `Post` =
  `{slug, url, title, teaser, publishedAt, updatedAt?, category, categoryLabel?, terms?, parks,
parkSlugs, rides, cover, coverAlt, readingMinutes}`. `url` is the absolute
  `https://park.fan/<locale>/news/<slug>`; `publishedAt` and `updatedAt` carry Berlin's offset;
  `teaser` is the frontmatter `excerpt`; `categoryLabel` and `terms` are the post's entry in the
  site search (`getPostSearchIndex`, `lib/navigation/blog-menu.ts`): the category's label in that
  locale and the words of the SEO keywords and tags, each once, so the app's search matches what
  the website's does. `terms` leaves out the words the title already holds (`termsBeyondTitle`):
  the title outweighs them, so the matches and their order stay the same. Both are additive and `schema` stays 1; `parks` are the API
  geo paths of the parks the post is about, the keys of `parks` in `index.json`, the park of the
  news label first (`getNewsParkRef`); `parkSlugs` are the same parks as slugs, because a park
  nobody photographed and no post linked by its full path has no known path and is then missing
  from `parks` only; `rides` are the post's `rideLinks` as `<park geo path>/<ride slug>`, where the
  park's path is known; `cover` is an id in `images` of `index.json` or `null` (the post has no
  photo: draw the fallback), `coverAlt` its alt text in that locale.
- **`news/<locale>/<slug>.json`:** `Post` plus `schema`, `locale`, `author` and `blocks`.
  `author` is the byline, `{name, role, avatar, avatarSmall}`: the short name, the role in that
  locale or `null`, and the avatar as absolute `https://media.park.fan/authors/<name>-<hash>-<w>.webp`
  URLs (192 px and 96 px squares) or `null`. The app loads them from the bucket, never from the
  website; the hash is that of the source file, so a key is immutable and uploaded once. `blocks`,
  in reading order:
  - `{type: 'heading', level, text, id}`, `id` the anchor the web gives the heading (`#id`)
  - `{type: 'paragraph', text}`
  - `{type: 'list', ordered, items: [text]}`
  - `{type: 'quote', text, source}`, `source` is the attribution line or `null`
  - `{type: 'callout', kind, text, date, label}`, `kind` is `parky`, `update`, `correction`,
    `note`, `tip`, `important`, `warning` or `caution`; `date` is the `YYYY-MM-DD` of an `update`,
    `label` Parky's verdict; paragraphs are separated by a blank line
  - `{type: 'table', header: [text], rows: [[text]]}`
  - `{type: 'image', imageId, alt, caption, credit}`, `credit` only when the photo needs an
    attribution; the news posts carry none inline today
  - `{type: 'link', text, url, park?}`, a block of its own: a call to action, or a park card, which
    carries the park's geo path in `park` when it is known
  - `{type: 'widget', widget, park, parkSlug, rides?, params, url}`, a widget that draws live park
    data: `widget` is `best-days`, `hourly-profile`, `ride-waits` or `stats`; `park` the park's geo
    path or `null` when no path is known, `parkSlug` its slug for the app to find in its own park
    list (`null` for a `ride-waits` that names rides); `rides` only for `ride-waits` with `rides=`,
    each `{park, parkSlug, ride, label}`; `params` the fence's other attributes as written (`top`,
    `columns`, `highlight`, `show`, `from`, `to`); `url` the post on the web, for an app that cannot
    draw the widget
  - `{type: 'weather' | 'map', park, parkSlug, url}`, a `weather-widget` or `map-widget`: the
    park's live weather or its map, `park` and `parkSlug` as in `widget`
  - `{type: 'park-comparison', parks: [{park, parkSlug}], params, url}`, a
    `park-comparison-widget`: the parks of its `slugs=` in their order, `params` its other
    attributes as written (`highlight`, `show`)
  - `{type: 'glossary', term, alternateNames, text, url}`, a `glossary-widget`: the term's name
    and other names in that locale, its full definition (paragraphs separated by a blank line) and
    its glossary page
  - `{type: 'gallery', heading, images: [{imageId, alt, caption, credit}]}`, a `gallery-widget`:
    its `heading` or `null`, and its photos as an `image` block holds them
  - A `text` holds only `**bold**`, `*italic*` and `[label](https://…)` with absolute URLs; a
    park, ride or post reference becomes its web page, or plain text when its path is unknown.
- **Widgets:** `best-days-widget`, `hourly-profile-widget`, `ride-waits-widget` and `stats-widget`
  become `widget` blocks, which the app fills from its own API calls; one naming no park and no ride
  is left out. `weather-widget`, `map-widget` and `park-comparison-widget` name their parks the same
  way and carry no figure either, but have a block type of their own: the app build 1.0.1 draws a
  `widget` kind it does not know as a link to the post it already shows, and skips a type it does
  not know, as it did while the export left these out. A `glossary-widget` carries the term's text
  and a `gallery-widget` its photos (exported like inline photos); an unknown term or a gallery
  without an exported photo is left out. `cta-widget` becomes a `link` block; a paragraph that is only
  `[Park](ref:slug?full)` becomes a `link` block to the park page. Fence attributes are read by
  `parseWidgetAttrs`, the parser the web's own widgets use.
- **Photos:** a cover or inline photo not among the card photos is exported with the same widths
  and added to `images`; `license: unknown` is left out, so the post gets `cover: null`.

### Watching the export

The website shows a post from its deploy on; the app and the API's push notifications get it only
from this export. A run that fails or never starts leaves them silent while the site looks fine, so
two places say so.

- **The workflow** stops `pnpm publish:media` after 50 minutes and the job after 60. A run took 18
  to 26 minutes in November 2026, and a job may run six hours by default: a run that hangs would
  hold the concurrency group, and every export queued behind it, that long. A failed run writes a job summary and an `::error` annotation that say whether
  anything was uploaded (the lists go up after the bodies and `index.json` last, so a run that
  stopped partway leaves some lists new and the rest old) and how to start a new one: **Run
  workflow** on the workflow's page, or `gh workflow run publish-media.yml`. A cancelled run writes
  the same, since the job's limit cancels a run rather than failing it (`failure() || cancelled()`).
  GitHub notifies whoever triggered the run. The workflow's token may only read the repository
  (`permissions: contents: read`), and its push paths include every file the export imports that
  decides what goes out (`news-export-feeds.ts`, `backlinks.ts`, `map-with-concurrency.mjs`).
- **`/admin/system`, „Export für die App“** (`app/admin/system/news-export-panel.tsx`). Its route,
  `GET /api/admin/news-export` (role viewer), builds the report in `lib/admin/news-export-report.ts`:
  it reads the twelve lists (`news/` and `guides/`, six
  locales) server-side, never from the browser, and keeps each one it could read for five minutes
  in memory: the lists' own `max-age`, and not the Data Cache, which would store all twelve again
  every window to serve a handful of editors. It compares them with the deployment's own posts,
  selected by the functions the export uses (`EXPORT_FEEDS` in `lib/blog/news-export-feeds.ts`,
  which `scripts/news-export.mjs` iterates too).
  Per feed the panel shows when the export last ran (the oldest `generatedAt`, so a run that
  stopped halfway shows), the newest post in the export and on the site, and every post the site
  lists and the export lacks, with its locales.
- **By slug, not by date.** A post merged days after its own date is older than the last run, so
  comparing `generatedAt` with the newest date would call the export current.
- **How long a post has waited** counts from its date or from when it reached the default
  branch, whichever is later. The arrival is read from GitHub with the admin's token
  (`lib/admin/news-export-arrival.ts`): the oldest commit on the default branch that touches the
  post's German file (else the file the site falls back to), and of that commit the earliest merge
  of a pull request into the default branch, since a commit made on a branch carries the branch's
  time; a commit pushed straight to the branch counts with its own. Only missing posts are asked
  about, five per check, oldest first, and a time once read is kept in memory, since it never
  changes. Without a token, or where GitHub fails, the wait counts from the deployment's build time
  (`build-info.json`) instead, the latest the post can have arrived; that clock starts again with
  every later deploy, which is why it is only the fallback. Amber after an hour, longer than two
  runs back to back; red after six hours, the
  window in which the API still announces a post (`NEWS_MAX_AGE_MS` in its news push job): an
  export that catches up later brings the post to the app without a notification. A list that
  cannot be read is red. While a post is younger than the hour, the tile says „noch nicht drin“.
- **The answer** to an amber or red feed is a new run, so the panel asks „Export neu starten?“. An
  editor starts it there: `POST /api/admin/news-export/run` (role editor, the floor of the admin's
  other job starts) dispatches `publish-media.yml` on the repository's default branch, not the
  admin's base branch, since only the default branch is live, with the admin's GitHub token
  (`lib/admin/news-export-run.ts`). It answers `{started: true, workflowUrl}`, or
  `{started: false, reason}` with 503 without a token and 502 for anything GitHub refused; the
  reason is the German sentence the panel shows, and a 403 most likely means a token without
  „Actions: Read and write“. When the dispatch was sent and GitHub gave no answer in time or a 5xx,
  the run may have started all the same: the answer is 504 with `maybeStarted: true`, the panel says
  „Vielleicht gestartet“ and links the workflow's runs to look at before starting another, and the
  API's `run_news_export` treats the 504 as unclear. The log gets GitHub's status, never the request. After a start the
  panel links the workflow page and reads the export once more 25 minutes later, or on „Neu lesen“;
  it does not poll. A viewer gets the workflow page instead of the button; while no feed is amber
  or red, an editor still finds the button below the tiles. The pure half is `lib/admin/news-export-lag.ts` (`pnpm test:admin-news-export`,
  which also starts a run against a stand-in for GitHub).
- **The API's MCP tools** read and start the same through two server routes gated like
  `/api/revalidate`, `Authorization: Bearer $REVALIDATE_SECRET`, 503 without the secret and 401 on a
  wrong one: `GET /api/news-export/status` answers the `NewsExportReport` above (`no-store`), and
  `POST /api/news-export/run` starts a run with the admin route's answers. The API depends on both
  paths and shapes; `pnpm test:admin-news-export` checks the status against a copy of the API's
  schema (`newsExportReport` in its `src/mcp/tools/news-export.tools.ts`), and the role floors of
  the admin's two routes. Like `/api/revalidate` they are outside `proxy.ts`'s matcher and not in
  `robots.txt`, which names only the back office. Cloudflare challenges non-browser clients on
  `park.fan/api/*`, so whatever lets the API's calls to `/api/revalidate` through has to cover
  `/api/news-export/` too.

Two cases reach the panel as a missing post and nothing else: a merge that touched none of the
workflow's paths, and a scheduled post, which the run at its merge leaves out and no later run
picks up until something else starts one. The regular comparison inside the API, which would put a
late export on the overview, belongs to the backend.

## Related

- [Writing to the media database](media-database-writes.md): admin browser, sessions, uploads
- [Assets](../development/assets.md): delivery, quality banding, source-size targets
- [Scripts](../development/scripts.md): `generate:media`, `generate:image-crops`
- [Caching](../architecture/caching-strategy.md): where this fits the wider model
