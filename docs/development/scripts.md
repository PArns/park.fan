# Scripts

## Build Scripts

| Script                           | Purpose                                    |
| -------------------------------- | ------------------------------------------ |
| `generate-build-info.mjs`        | Writes build metadata (version, timestamp) |
| `generate-hero-images.mjs`       | Generates hero section images              |
| `generate-attraction-images.mjs` | Generates attraction image configs         |

All run automatically via `prebuild` before `pnpm build`. See [Assets, Images & Content](assets.md) for what each generates.

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

| Script                  | Purpose                    |
| ----------------------- | -------------------------- |
| `test-url-building.mjs` | Validates URL construction |

## Related

- [Setup](setup.md)
- [Date & Time Handling](datetime-handling.md)
- [Internationalization](../i18n/internationalization.md)
- [Translation System](../i18n/translations.md) – Validation and crawler details
