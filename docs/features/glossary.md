# Glossary System

Theme park terminology glossary with localized URLs, search integration, and structured data.

---

## Architecture

| Layer                    | Files                                         |
| ------------------------ | --------------------------------------------- |
| Term data (slugs)        | `lib/glossary/data.ts`                        |
| Types                    | `lib/glossary/types.ts`                       |
| Loader (cached)          | `lib/glossary/translations.ts`                |
| Per-locale definitions   | `content/glossary/{en,de,fr,it,nl,es}.ts`     |
| Overview page            | `app/[locale]/glossary/page.tsx`              |
| Detail page              | `app/[locale]/glossary/[term]/page.tsx`       |
| Cards / detail component | `components/glossary/`                        |
| Background               | `components/glossary/glossary-background.tsx` |
| Structured data          | `components/seo/glossary-structured-data.tsx` |
| Search API               | `app/api/glossary-search/route.ts`            |

## Localized URLs

The file system uses `/app/[locale]/glossary/[term]/` as the canonical path. External localized URLs (e.g. `/de/glossar/wartezeit`) are handled via **Next.js `rewrites()`** in `next.config.ts` — no next-intl `pathnames` needed.

| Locale | URL segment     |
| ------ | --------------- |
| en     | `/glossary`     |
| de     | `/glossar`      |
| fr     | `/glossaire`    |
| it     | `/glossario`    |
| nl     | `/woordenlijst` |
| es     | `/glosario`     |

The segment map lives in `lib/glossary/translations.ts` as `GLOSSARY_SEGMENTS`.

## Terms & Categories

Currently **90 terms** across 7 categories:

| Category          | Description                              |
| ----------------- | ---------------------------------------- |
| `wait-times`      | Queuing systems, express passes, etc.    |
| `crowd-levels`    | Crowd forecasting, peak days, calendars  |
| `park-operations` | Refurbishments, capacity, events         |
| `planning`        | Rope drop, ERT, touring plans, passes    |
| `attractions`     | Ride types, animatronics, height limits  |
| `coasters`        | Coaster types and manufacturers          |
| `coaster-elements`| Track elements (inversions, airtime, etc.)|

## Adding a New Term

1. **`lib/glossary/data.ts`** — add a `GlossaryTermData` entry with a stable `id`, `category`, and `slugs` for all 6 locales.
2. **`content/glossary/XX.ts`** (all 6 files) — add a `GlossaryTermTranslation` with `name`, `shortDefinition`, `definition`, and optional `relatedTermIds`.
3. The sitemap and search index update automatically on next build/revalidation.

### Definition Formatting

The `definition` field supports **multiple paragraphs** separated by `\n\n`. The detail page renders each paragraph as a separate `<p>` element. No markdown syntax — plain prose only.

```ts
definition: 'First paragraph text.\n\nSecond paragraph with more detail.\n\nThird paragraph with examples.',
```

## UI & Design

- **Background**: `GlossaryBackground` renders a random hero image (same pool as park pages) with no Ken Burns animation (`noAnimation` prop) and a gradient fade. Shared by both overview and detail pages.
- **Overview glass panel**: Breadcrumb sits above the panel; title + description + search + category pills are inside a single `bg-background/60 backdrop-blur-md` glass card.
- **Type-to-search**: Any keypress on the overview page focuses the search input automatically. ESC clears and blurs.
- **Detail page**: 2-column grid (main + 260px sidebar) with glass cards. Related terms in sidebar use `divide-y` rows. Back button uses `variant="default"` (primary color).
- **Detail page extras**: Below the term content, detail pages include `NearbyParksCard`, `FavoritesSection`, and `FeaturedParksSection` — same widgets as the homepage.

## Language Switcher

The locale switcher reads `link[rel="alternate"][hreflang="..."]` tags from `<head>` and extracts the **pathname only** (`new URL(href).pathname`) to navigate within the current origin. This ensures switching works on both localhost and production without redirecting to the production domain.

## Search Integration

`app/api/glossary-search/route.ts` handles `GET /api/glossary-search?q=...&locale=...` (minimum 3 chars, max 5 results). The `SearchCommand` component sends a second `useQuery` alongside the main park/attraction search and renders results in a separate `CommandGroup`.

## SEO

- **Overview**: `DefinedTermSet` JSON-LD with all terms as `hasDefinedTerm`; `inLanguage` and localized description per locale
- **Detail**: `DefinedTerm` JSON-LD with `inDefinedTermSet` reference, `termCode`, `inLanguage`
- **hreflang**: Each detail page lists locale-specific slugs for all 6 languages
- **Sitemap**: 6 overview pages (priority 0.7, weekly) + all term×locale pages (priority 0.5, monthly)
- **IndexNow**: Glossary overview pages submitted alongside home/howto/parks/attractions
