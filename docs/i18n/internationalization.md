# Internationalization

## Overview

The app uses [next-intl](https://next-intl-docs.vercel.app/) for routing and translations. All user-facing text lives in `messages/*.json`.

## Locales

| Code | Language |
|------|----------|
| `en` | English (default) |
| `de` | Deutsch |
| `nl` | Nederlands |
| `fr` | Français |
| `es` | Español |

Configured in `i18n/config.ts`.

## Route Structure

- **Prefix:** Always `/[locale]/...` (e.g. `/en/parks`, `/de/parks`)
- **Detection:** `Accept-Language` header
- **Config:** `localePrefix: 'always'` in `i18n/routing.ts`

## Translation Namespaces

- `common` – Shared strings
- `navigation` – Nav items
- `parks` – Park-related
- `attractions` – Attraction-related
- `search` – Search UI
- `stats` – Statistics labels
- `geo` – Geographic labels
- `homepage` – Homepage
- `calendar` – Calendar component
- `admin` – Admin panel
- `seo` – SEO metadata

## Usage

```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('parks');
t('status.open');   // "Open"
t('status.closed'); // "Closed"
```

## Crowd Level "Normal"

API returns `moderate` for P50 baseline. We display it as **"Normal"** in all locales:
- EN: Normal
- DE: Normal
- NL: Normaal
- ES: Normal
- FR: Normal

Keys: `parks.crowdLevels.moderate`, `stats.crowd.moderate`, etc.

## SEO

- `generateAlternateLanguages()` in `i18n/config.ts` for hreflang
- `localeToOpenGraphLocale` for OG locale format (`en_US`, `de_DE`, …)

## Related

- [Translation System](translations.md) – Adding keys, validation, helpers, troubleshooting
- [Pluralization](pluralization.md) – ICU plural format, `formatWaitTime`, migration
- [Translation Crawler](../development/scripts.md#translation-scripts)
- [next-intl docs](https://next-intl-docs.vercel.app/)
