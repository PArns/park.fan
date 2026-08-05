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

## Translation Scripts

| Script                     | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `validate-translations.js` | Checks message keys against `messages/*.json` |
| `crawl-translations.js`    | Translation crawler                           |

**Crawler modes:**

- **Static:** Checks local build for key usage
- **Live:** `--live` – crawls running server, verifies missing keys, templates, 404s

**Usage:**

1. Start dev server: `pnpm dev`
2. Run: `pnpm crawl:translations:live`

## Other Scripts

| Script                             | Purpose                                                                                                                                                                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test-url-building.mjs`            | Validates URL construction                                                                                                                                                                                                                               |
| `render-coaster-elements.mjs`      | Headless contact sheets of every glossary 3-D coaster element (front/follow/onboard × light/dark) — the verification step [conventions §12](conventions.md#12-threejs-animations-research-first-then-verify-from-every-perspective-requirement) requires |
| `export-glossary-term-ids.mjs`     | Prints the glossary term-id allowlist the API repo checks its ride-profile seed against                                                                                                                                                                  |
| `setup-vercel-comment-webhook.mjs` | Registers/lists/deletes the Vercel `comment.*` webhook behind the [preview-comment → PR sync](vercel-comment-sync.md) (must go through the API — the dashboard does not offer these events)                                                              |
| `ci/sync-vercel-comment.mjs`       | Run by the `vercel comment sync` workflow: posts a Vercel preview comment onto the matching PR                                                                                                                                                           |

## Related

- [Setup](setup.md)
- [Date & Time Handling](datetime-handling.md)
- [Internationalization](../i18n/internationalization.md)
- [Translation System](../i18n/translations.md) – Validation and crawler details
