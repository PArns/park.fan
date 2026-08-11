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
- `seo` – SEO metadata

## Usage

```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('parks');
t('status.open'); // "Open"
t('status.closed'); // "Closed"
```

### Which namespaces reach the client

Everything handed to `NextIntlClientProvider` is serialized into the RSC payload — and therefore
into the HTML — of every page that renders it, in all six locales. The split is two-level:

1. the locale layout ships **`LAYOUT_MESSAGE_NAMESPACES`**: the chrome only (header, footer,
   search, language banner), ~6 KB of JSON,
2. each route adds its own delta through **`<RouteMessages route="…">`** in its `page.tsx`.

Both lists are **derived from the import graph**, not hand-maintained:
`pnpm generate:route-namespaces` walks every route entry, propagates the real client boundary and
writes `i18n/route-namespaces.generated.ts` (committed, so `next dev` works on a fresh clone).

`RouteMessages` merges on the **client** (`i18n/route-messages-provider.tsx`), which is the whole
trick: a nested next-intl provider _replaces_ messages rather than merging them
(`messages === undefined ? prevContext?.messages : messages` in `use-intl`), so handing it the
union would serialize the chrome set a second time on every page. Reading the parent's messages
via `useMessages()` and merging in the browser means only the delta travels.

What the message payload itself costs, against `messages/de.json`:

|                                       | JSON    | in HTML (escaped) | brotli  |
| ------------------------------------- | ------- | ----------------- | ------- |
| one flat allowlist (before)           | 47.4 KB | 51.7 KB           | 14.9 KB |
| chrome only — `/impressum`, `/search` | 6.6 KB  | 7.4 KB            | 2.5 KB  |
| park detail page (heaviest)           | 29.7 KB | 32.7 KB           | 9.4 KB  |

And what that does to whole prerendered pages — two production builds of the same commit range,
`.next/server/app/**.html` measured directly:

| Page                       | HTML before | after   | brotli before | after  |      Δ |
| -------------------------- | ----------- | ------- | ------------- | ------ | -----: |
| `/de/impressum`            | 139,513     | 94,851  | 26,557        | 14,155 | −46.7% |
| `/de/parks`                | 150,873     | 110,176 | 28,054        | 16,497 | −41.2% |
| `/de/parks/europe/germany` | 225,861     | 184,801 | 29,945        | 18,384 | −38.6% |
| `/de/blog`                 | 344,966     | 304,000 | 35,462        | 24,068 | −32.1% |
| `/de` (homepage)           | 631,229     | 618,910 | 48,704        | 45,164 |  −7.3% |

Park and ride pages are `force-dynamic`, so they have no prerendered HTML to diff — these come
from `next start` on both builds:

| Page                        | HTML before | after   | brotli before | after  |      Δ |
| --------------------------- | ----------- | ------- | ------------- | ------ | -----: |
| Ride `…/troublion`          | 177,706     | 155,846 | 30,636        | 24,382 | −20.4% |
| Park `…/phantasialand`      | 477,455     | 455,683 | 51,275        | 45,860 | −10.6% |
| Park `…/europa-park`        | 634,414     | 616,464 | 61,950        | 56,424 |  −8.9% |
| Park `…/europa-park` (`en`) | 630,082     | 613,709 | 59,786        | 55,056 |  −7.9% |

Those two routes drop `home` (7.5 KB), `blog`, `glossary`, `explore` and `stats` — namespaces they
never rendered but paid for on every request. The percentage looks modest because the pages are
large to begin with; the absolute saving is ~5.5–6.3 KB brotli per request.

The homepage moves least on purpose: `featured-park-cards-live` and `global-stats-section` need
the card namespaces regardless, so there is little to take away.

Note how much of the apparent win compression eats: the previous allowlist trimmed ~10 KB of JSON
but only ~2.3 KB after brotli. Judge changes here on the compressed number.

A missing namespace renders as its raw key rather than throwing, so the end-to-end check is to
scan rendered HTML for dotted message paths in text nodes — 2,882 prerendered pages plus the
dynamic park and ride routes off a running server, zero hits.

Rules of thumb:

- **`getTranslations(...)` (server)** – works with any namespace, nothing to do.
- **`useTranslations('x')`** – `x` has to reach the browser, whether or not the file carries
  `'use client'`: a shared component without the directive inherits the client boundary from
  whoever imports it. A missing namespace does **not** throw; next-intl logs `MISSING_MESSAGE`
  and renders the raw key.
- After moving a component across the client boundary, re-run
  `pnpm generate:route-namespaces` and commit the result.
- `pnpm check:client-messages` (part of `pnpm release:check`) fails when the generated file has
  drifted, when a route that needs a delta doesn't render `<RouteMessages>`, when it renders one
  with the wrong route key, and when a route that needs nothing renders one anyway.

Entries are either a whole top-level namespace (`'parks'`) or a subtree (`'seo.faq'`, kept under
its original path so lookups are unchanged).

### Namespaces that are fetched instead of shipped

`FavoritesSection` renders `ParkCard`/`AttractionCard`, so it needs `parks` (10.6 KB) +
`attractions` (6.2 KB) — but it renders nothing at all until the visitor has favorites, which is
cookie-gated and client-only. On `/blog`, `/blog/tag/…`, `/blog/authors/…`,
`/blog/category/…` and `/glossary/[term]` nothing else needs those two namespaces, so they are
**not** in the payload there: the section fetches them as a per-locale chunk
(`lib/i18n/message-chunks/<locale>.ts`, generated in prebuild) via `useLazyMessages`. That is
16.5 KB of JSON off each of those five routes.

Declared in `LAZY_MESSAGE_BOUNDARIES` (`lib/i18n/route-namespaces.mjs`); the graph walk stops at
the boundary file, so whatever is still reachable another way stays eager. On the homepage and the
park pages the cards are needed regardless, the route already ships both namespaces, and
`useLazyMessages` resolves without a request.

**The wait must not shift the page.** `favorites` (the title, skeleton and empty state) stays
eager, the chunk starts downloading in the same render that enables the favorites query — so it
rides alongside that request rather than after it — and the cards replace the skeleton only once
data **and** messages are both there. While the messages are outstanding the skeleton is held at
the real favorite counts, so what lands is the same box.

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
