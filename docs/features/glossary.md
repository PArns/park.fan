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

## Adding a New Term

1. **`lib/glossary/data.ts`** — add a `GlossaryTermData` entry with a stable `id`, `category`, and `slugs` for all 6 locales.
2. **`content/glossary/XX.ts`** (all 6 files) — add a `GlossaryTermTranslation` with `name`, `shortDefinition`, `definition`, and optional `relatedTermIds`.
3. The sitemap and search index update automatically on next build/revalidation.

### Categories

`wait-times` · `crowd-levels` · `park-operations` · `planning` · `attractions`

## Search Integration

`app/api/glossary-search/route.ts` handles `GET /api/glossary-search?q=...&locale=...` (minimum 3 chars, max 5 results). The `SearchCommand` component sends a second `useQuery` alongside the main park/attraction search and renders results in a separate `CommandGroup`.

## SEO

- **Overview**: `DefinedTermSet` JSON-LD with all terms as `hasDefinedTerm`
- **Detail**: `DefinedTerm` JSON-LD with `inDefinedTermSet` reference
- **hreflang**: Each detail page lists locale-specific slugs for all 6 languages
- **Sitemap**: 6 overview pages + all term×locale combinations (via `app/sitemap.ts`)
