# Changelog / Recent Updates

Short log of notable changes; details live in the linked docs.

---

## 2.8.0 (2026-04-25) – Codebase Refactoring

### Shared Hooks (`lib/hooks/use-mounted.ts`)

- **`useMounted()`** — returns `true` after hydration (replaces `useState + useEffect` pattern across 5 components).
- **`useBrowserTimezone()`** — returns browser timezone string after mount.
- **`useBrowserNow(intervalMs)`** — returns a `Date` refreshed every `intervalMs` ms; pass `null` for one-shot (no interval). Replaces `setInterval` in `PeakHourBadge` and `ParkTimeInfo`.

### FAQ Helpers (`lib/faq/`)

- **`lib/faq/attraction-faq.ts`** — `buildAttractionFaqItems()` extracts FAQ Q1–Q4 logic from `AttractionFaqSection` and `AttractionFaqStructuredData`.
- **`lib/faq/park-faq.ts`** — `buildParkFaqItems()` (Q1–Q6) and `getParkArticleForms()` shared by `ParkFAQSection` and `faq-structured-data`.

### Shared Sparkline (`components/parks/sparkline.tsx`)

- Generic `<Sparkline points[] formatTooltip />` component with global-mousemove tooltip (portal to `document.body`).
- `WaitTimeSparkline` and `HourlyP90Sparkline` are now thin wrappers.

### Duration Formatting (`lib/i18n/time.ts`)

- **`formatDuration(diffMs, t)`** — formats milliseconds as `"Xh Ym"` / `"Xh"` / `"Ym"`. Used in `PeakHourBadge` and `ParkTimeInfo`.

### Howto Page Split (`app/[locale]/howto/`)

- `page.tsx` — metadata shell only (~236 lines).
- `_howto-ui.tsx` — shared UI atoms: `Section`, `SubSection`, `DemoBadge`, `InfoBox`, `TipBox`, `PersonaCard`, `Li`.
- `_mock-components.tsx` — demo components: `MockParkHeader`, `MockAttractionCards`, etc.
- `_live-calendar.tsx` — async server component that fetches live Phantasialand calendar data.
- `content/[locale].tsx` — per-locale content (de/en/es/fr/it/nl).

### Dead Code Removed

- `components/search/hero-search-button.tsx` — unused
- `components/home/scroll-indicator.tsx` — unused
- `components/common/truncated-text.tsx` — unused
- Removed dead `FeaturedParksSection` async function from `featured-parks-section.tsx`
- Removed `'use client'` from `glossary-background.tsx` and `glossary-inject-term.tsx`

---

## 2.7.0 (2026-03-15) – Glossary System

### Complete Glossary Launch

- **90 terms** across 7 categories: wait-times, crowd-levels, park-operations, planning, attractions, coasters, coaster-elements
- All terms with full definitions in 6 languages (EN/DE/FR/IT/NL/ES) — multi-paragraph format (`\n\n` separator), locale-appropriate park references
- Localized URL segments: `/glossary`, `/glossar`, `/glossaire`, `/glossario`, `/woordenlijst`, `/glosario`

### Design & UX

- **Random hero background** on all glossary pages (`GlossaryBackground` component, no Ken Burns animation)
- **Glass UI**: unified glass panel on overview (breadcrumb above panel; title + description + search inside); glass cards on detail page
- **Type-to-search**: typing anywhere on overview focuses the search input; ESC clears + blurs
- **Category filter pills** with instant client-side filtering
- **Detail page**: 2-column layout, multi-paragraph definition rendering, primary-color back button
- **Homepage extras on detail pages**: `NearbyParksCard`, `FavoritesSection`, `FeaturedParksSection` below each term

### Navigation

- **Header**: removed "Startseite" from desktop nav; reordered to Parks entdecken → Glossar → Anleitung
- **Homepage hero**: added glossary link ("Wichtige Freizeitparkbegriffe") next to the howto link in all 6 locales
- **Howto page**: removed `max-w-4xl` constraint — now full container width like other pages

### SEO & Indexing

- Glossary added to sitemap: 6 overview pages (priority 0.7) + ~540 term pages (priority 0.5)
- IndexNow aligned to sitemap scope: home, howto, glossary overview, parks, attractions
- Improved `generateMetadata` on both overview and detail pages: keyword-rich titles, `overviewKeywords` meta tag, locale-specific `termTitleSuffix`
- Schema.org: `DefinedTermSet` + `DefinedTerm` with `inLanguage`, `termCode`, localized descriptions

### Bug Fixes

- **Language switcher 404**: now extracts pathname from hreflang `<link>` tags instead of using full production URL — works on localhost and production
- **Breadcrumb double-locale** (`/de/de/glossar`): fixed by removing locale prefix from breadcrumb URL (next-intl `Link` adds it automatically)

→ [Glossary System](features/glossary.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.6.4 (2026-03-05) – SEO: Featured Parks, Split Sitemaps, ItemList

### Featured Parks Section (Homepage)

- New `FeaturedParksSection` component on homepage — 6 locale-specific park cards with live data (status, crowd level, wait times, opening hours).
- Parks resolved from existing `geoData` (no extra API call; `CACHE_TTL.geo = 120s`).
- Locale configs based on TEA 2024 attendance data + language-market wait-time search relevance.
- Translated country names via `tGeo('countries.*')`.
- Positioned after FavoritesSection — first "browse parks" content above the fold.

### Sitemap Split (Next.js-native via `generateSitemaps()`)

- Single `app/sitemap.ts` with `generateSitemaps()` — three sub-sitemaps: `/sitemap/0.xml` (home+parks), `/sitemap/1.xml` (attractions), `/sitemap/2.xml` (geo hub pages).
- Geo hub pages (continent/country/city) were completely missing from any sitemap before — now covered with correct priorities (0.6–0.8).
- Attraction variant slugs (e.g. `taron-2`) excluded — noindex pages pointing to canonical base slug.
- Single-park city pages excluded — they 301-redirect to the park page.
- `robots.txt` references single sitemap index `/sitemap.xml` (auto-generated by Next.js).

### ItemList Structured Data

- Added `ItemListStructuredData` to `/parks` overview page (continents). All listing levels now have ItemList schema.

### Docs

- New: [docs/seo/featured-parks.md](seo/featured-parks.md) — how to update park lists, slug collision notes, SEO rationale.
- New: [docs/seo/sitemaps.md](seo/sitemaps.md) — full sitemap strategy, priorities, exclusions.
- Updated: [docs/seo/analysis.md](seo/analysis.md) — completed items marked done, open items updated.

→ [SEO Analysis](seo/analysis.md) · [Featured Parks](seo/featured-parks.md) · [Sitemaps](seo/sitemaps.md)

---

## 2.5.12 (2026-02-08) – Docs vs Code alignment

- **URL helpers:** Added `getParkUrlFromAttractionUrl()` in `lib/utils/url-utils.ts`; use in `nearby-parks-card` instead of manual `split('/attractions/')`. Park URLs from API now always go through `convertApiUrlToFrontendUrl()`.
- **Translation helpers:** Replaced `t(\`countries.${slug}\`)` / `t(\`continents.${x}\`)`with`translateCountry`/`translateContinent`across geo pages (parks, continent, country, city, park, attraction). Missing keys are now logged via`logMissingTranslation`.

→ [Translation System](i18n/translations.md), [Routing & URLs](architecture/routing-and-urls.md), [Notes for Sessions](development/notes-for-sessions.md)

---

## 2.5.5 (2026-01-25) – 404 prevention

- Redirect logic for malformed URLs (e.g. missing city segment).
- Nearby Parks use `convertApiUrlToFrontendUrl(url)` instead of building from name fields.

→ [Routing & URLs](architecture/routing-and-urls.md), [Troubleshooting](troubleshooting/common-issues.md)

---

## 2.5.6 (2026-01-25) – Link prefetch

- Prefetch only when `status === 'OPERATING'` for park/attraction links.
- `prefetch={false}` for header/footer and discovery/geo cards.

→ [Routing & URLs – Link Prefetching](architecture/routing-and-urls.md#link-prefetching)

---

## P50 / "Normal" display

- API returns `moderate` for typical day (P50 baseline); frontend displays **"Normal"** (green) in all locales.

→ [Backend Integration – Crowd Levels](api/backend-integration.md#crowd-levels-p50--normal), [Backend P50 doc](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/p50-crowd-levels.md)

---

## Related

- [README](README.md) – Doc index
- [Conventions](development/conventions.md) – Key rules
