# Scripts

## Build Scripts

| Script                         | Purpose                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `generate-build-info.mjs`      | Writes build metadata (version, timestamp)                                                                    |
| `generate-client-glossary.mjs` | Generates the client-side glossary search index                                                               |
| `generate-blog-manifest.mjs`   | Generates the blog manifests (see below)                                                                      |
| `generate-media-manifest.mjs`  | Builds the media database manifests from `public/media` (see [media database](../features/media-database.md)) |
| `generate-image-crops.mjs`     | Generates image crop configs                                                                                  |
| `fetch-hero-textures.mjs`      | Fetches textures for the 3-D hero (`generate:hero-textures`)                                                  |

All except `fetch-hero-textures.mjs` (manual, `pnpm generate:hero-textures`) run automatically via `prebuild` before `pnpm build`. See [Assets, Images & Content](assets.md) for what each generates.

### The blog manifest is three files, on purpose

`generate-blog-manifest.mjs` writes (all git-ignored, regenerated on every build):

| File                          | Contents                                                                                                | Imported by                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `lib/blog/manifest.ts`        | `BLOG_POSTS_META` – frontmatter + build-time derivations (reading time, `parkRefs`/`rideRefs`), ~100 KB | `lib/blog/listing.ts` (every listing surface) |
| `lib/blog/manifest-bodies.ts` | `BLOG_POST_BODIES` – the markdown, keyed `<locale>/<slug>`, ~900 KB and growing                         | `lib/blog/index.ts` → the blog post page only |

The split is the point: the root layout asks `hasPublishedPosts()`, the homepage
and every park and ride page list posts, and with one combined module all of
them bundled the full post bodies. Import from **`@/lib/blog/listing`** unless you actually
render markdown — `@/lib/blog` pulls the bodies in.

Anything derived from a body (reading time, the park and ride references behind
the catalog's blog sections) is computed **once, at build time**, by
[`lib/blog/derive.mjs`](../../lib/blog/derive.mjs) — plain JS so the generator
and the app share one implementation instead of two copies of the same regexes.

The generator also **warns** about `parkLinks`/`rideLinks` frontmatter that
would fail silently: an entry that isn't a valid slug, an empty list, and a
config that differs between a post's translations (it governs the post in all
languages). Warnings never fail the build.

### `generate-hero-world-map.mjs` (manual)

Writes `lib/geo/world-map-data.ts` — one simplified silhouette per continent for the homepage
hero's world map — from `public/world.svg`. **Not** part of `prebuild`: the source map never
changes, so the output is committed. Re-run it only after touching the grouping or the
simplification thresholds, and **look at the rendered map afterwards** — a collapsed ring still
compiles. Details: [homepage hero](../features/homepage-hero.md#the-map-data-is-generated).

## Translation Scripts

| Script                          | Purpose                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `validate-translations.js`      | Checks message keys against `messages/*.json`                                   |
| `crawl-translations.js`         | Translation crawler                                                             |
| `generate-route-namespaces.mjs` | Derives which namespaces each route ships (committed output)                    |
| `generate-message-chunks.mjs`   | Per-locale chunks for namespaces a lazy boundary fetches (prebuild, gitignored) |
| `check-client-messages.mjs`     | Fails on a stale map or a mis-wired route                                       |
| `check-untranslated.mjs`        | Fails on German copied verbatim into another locale (prebuild)                  |

### The route namespace map is generated, not written

`generate-route-namespaces.mjs` walks the import graph from every route entry, propagates the real
client boundary (`'use client'` plus everything it transitively imports — a shared component
without the directive inherits the boundary from whoever imports it) and records which namespaces
each route has to ship. Output goes to `i18n/route-namespaces.generated.ts`, which — unlike the
blog and media manifests — is **committed**: it is a few hundred bytes, it is what a reviewer needs
to see when a component crosses the boundary, and committing it keeps `next dev` working on a
fresh clone. `check-client-messages.mjs` re-derives it and diffs, so it cannot go stale silently.

The graph walk shares one module with the checker (`lib/i18n/route-namespaces.mjs`) for the same
reason `lib/blog/derive.mjs` exists: a second copy of the boundary logic would drift.

One trap worth knowing: the scan strips comments first. A doc comment quoting
`useTranslations('seo.faq')` as an example otherwise registers as a real call and puts that
namespace on every route.

**Crawler modes:**

- **Static:** Checks local build for key usage
- **Live:** `--live` – crawls running server, verifies missing keys, templates, 404s

**Usage:**

1. Start dev server: `pnpm dev`
2. Run: `pnpm crawl:translations:live`

## Other Scripts

| Script                             | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test-url-building.mjs`            | Validates URL construction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `test-weather-chart-axis.mjs`      | Unit tests for the weather day chart's geometry: that a park without a schedule keeps the exact linear axis it had, and that the warped one stays monotone and bounded for every window shape the catalogue contains, DST days included. `pnpm test:weather-chart-axis`, see [weather day chart](../features/weather-day-chart.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `measure-cls.mjs`                  | Layout-shift inventory: diffs each page's first-paint layout (JS off) against its settled one, walking **every** element instead of a list of suspected selectors, and splits the result into what a visitor has in view versus what only a fast scroller reaches. A third pass with images blocked catches pictures whose box is not reserved. `--late` switches to the other job — replaying one captured document with its streamed tail held back 1.5 s, unthrottled, so the browser's own score is reproducible (`--scroll=<y>` parks the reader; a shift only counts what is in view). Needs a **production** site (`pnpm build && pnpm start`) at `localhost` — a `next dev` server ships its CSS through JavaScript and 403s its own chunks from `127.0.0.1`, either of which makes the run report 0.0000 for a page that shifts; both are refused rather than graded. `pnpm measure:cls`, see [system-overview §5](../architecture/system-overview.md#5-a-streamed-section-owes-the-page-its-height-requirement) |
| `measure-api-calls.mjs`            | Opens every API-backed route in a real browser and prints how many `/api/*` requests it makes, their transfer size and when each lands. Needs a running site; the baseline it produced is in [API budget per page](../architecture/api-budget.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `check-hero-search-rest.mjs`       | Asserts the hero's resting search dropdown holds one height across all three states it loads through, in all six locales — the drift moves the nearby pills under it. Needs a running site; see [homepage hero](../features/homepage-hero.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `render-coaster-elements.mjs`      | Headless contact sheets of every glossary 3-D coaster element (front/follow/onboard × light/dark) — the verification step [conventions §12](conventions.md#12-threejs-animations-research-first-then-verify-from-every-perspective-requirement) requires                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `generate-icons.mjs`               | Cuts the whole icon set from the brand files. Two sources, split by the smallest size a surface may draw each file at — not by the file's own size: `logo-small-dark.svg` (the header's pin) for `app/favicon.ico` (16/32/48/96), `/icon.svg` and the 180 px Apple touch icon, which Google may scale to 16 px itself; `logo-big-dark.svg` (real vector, unlike the 77 KB `logo-dark.svg`) for the manifest's 192/512 and its maskable 512. Ink box and the wordmark's position are measured by rendering, never typed. `pnpm generate:icons` writes, `pnpm check:icons` fails on drift; see [favicon](../seo/favicon.md)                                                                                                                                                                                                                                                                                                                                                                                                 |
| `export-glossary-term-ids.mjs`     | Prints the glossary term-id allowlist the API repo checks its ride-profile seed against                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `setup-vercel-comment-webhook.mjs` | Registers/lists/deletes the Vercel `comment.*` webhook behind the [preview-comment → PR sync](vercel-comment-sync.md) (must go through the API — the dashboard does not offer these events)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ci/sync-vercel-comment.mjs`       | Run by the `vercel comment sync` workflow: posts a Vercel preview comment onto the matching PR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Related

- [Setup](setup.md)
- [Date & Time Handling](datetime-handling.md)
- [Internationalization](../i18n/internationalization.md)
- [Translation System](../i18n/translations.md) – Validation and crawler details
