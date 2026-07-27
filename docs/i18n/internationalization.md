# Internationalization

## Overview

The app uses [next-intl](https://next-intl-docs.vercel.app/) for routing and translations. All user-facing text lives in `messages/*.json`.

## Locales

| Code | Language          |
| ---- | ----------------- |
| `en` | English (default) |
| `de` | Deutsch           |
| `fr` | Français          |
| `it` | Italiano          |
| `nl` | Nederlands        |
| `es` | Español           |

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
t('status.open'); // "Open"
t('status.closed'); // "Closed"
```

### Which namespaces reach the client

The locale layout does **not** hand the full message bundle to `NextIntlClientProvider`. It ships
only the namespaces listed in **`i18n/client-messages.ts`** (`CLIENT_MESSAGE_NAMESPACES`) — the
full bundle is ~55 KB of JSON that would be serialized into every page's RSC payload, and most of
it (`seo`, the server-rendered legal/marketing pages, …) is only ever read by Server Components.
Trimming it saves ~10 KB per page response in all six locales.

Rules of thumb:

- **`getTranslations(...)` (server)** – works with any namespace, nothing to do.
- **`useTranslations('x')`** – `x` must be reachable from the allowlist, whether or not the file
  carries `'use client'`: a shared component without the directive inherits the client boundary
  from whoever imports it. A missing namespace does **not** throw; next-intl logs
  `MISSING_MESSAGE` and renders the raw key.
- `pnpm check:client-messages` (part of `pnpm release:check`) enforces this. When a Server
  Component becomes a Client Component, add its namespace to the list.

Entries are either a whole top-level namespace (`'parks'`) or a subtree (`'seo.faq'`, kept under
its original path so lookups are unchanged).

## Crowd Level "Normal"

API returns `moderate` for P50 baseline. We display it as **"Normal"** in all locales:

- EN: Normal
- DE: Normal
- NL: Normaal
- ES: Normal
- FR: Normal
- IT: Normale

Keys: `parks.crowdLevels.moderate`, `stats.crowd.moderate`, etc.

## Locale Switching

Both `LocaleSwitcher` (`components/common/locale-switcher.tsx`) and `LanguageBanner` (`components/layout/language-banner.tsx`) navigate to the correct localized URL using the following strategy:

1. **Hreflang first** – Query `link[rel="alternate"][hreflang="${newLocale}"]` from the page `<head>`. Parse `.href` via `new URL(el.href).pathname` to get the locale-correct path (e.g. `/de/glossar` vs `/en/glossary`). This works on localhost and production alike.
2. **Regex fallback** – Replace only the leading `/:locale/` segment using `path.replace(/^\/:locale(\\/|$)/, /:newLocale$1/)`. Never use bare `String.replace(`/${locale}`, ...)` as it can hit locale strings elsewhere in the path.

**Never use `path.replace(`/${locale}`, `/${newLocale}`)` directly** — it fails for:

- Localized URL segments: `/en/glossary` → `/de/glossary` instead of `/de/glossar`
- Paths containing the locale code: `/en/parks/europe/de` (Germany country code)

**Flags:** `en` locale uses `FlagUS` (not `FlagGB`). All flag SVGs are in `components/common/icons/flags.tsx`.

## SEO

- `generateAlternateLanguages()` in `i18n/config.ts` for hreflang
- `localeToOpenGraphLocale` for OG locale format (`en_US`, `de_DE`, …)

## Related

- [Translation System](translations.md) – Adding keys, validation, helpers, troubleshooting
- [Pluralization](pluralization.md) – ICU plural format, `formatWaitTime`, migration
- [Translation Crawler](../development/scripts.md#translation-scripts)
- [next-intl docs](https://next-intl-docs.vercel.app/)
