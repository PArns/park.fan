# Scripts

## Build Scripts

| Script                           | Purpose                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| `generate-build-info.mjs`        | Writes build metadata (version, timestamp)                   |
| `generate-client-glossary.mjs`   | Generates the client-side glossary search index              |
| `generate-blog-manifest.mjs`     | Generates the blog manifest (posts, galleries, translations) |
| `generate-hero-images.mjs`       | Generates hero section images                                |
| `generate-attraction-images.mjs` | Generates attraction image configs                           |
| `generate-image-crops.mjs`       | Generates image crop configs                                 |
| `fetch-hero-textures.mjs`        | Fetches textures for the 3-D hero (`generate:hero-textures`) |

All except `fetch-hero-textures.mjs` (manual, `pnpm generate:hero-textures`) run automatically via `prebuild` before `pnpm build`. See [Assets, Images & Content](assets.md) for what each generates.

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
