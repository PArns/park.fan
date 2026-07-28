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

Currently **262 terms**. Categories are defined in `lib/glossary/types.ts` (`GlossaryCategory`); the ones in active use:

| Category           | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `coaster-elements` | Track elements (inversions, airtime, etc.)             |
| `attractions`      | Ride types, dark-ride tech, height limits              |
| `coasters`         | Coaster types (hyper, giga, dive, wild mouse, …)       |
| `manufacturers`    | Ride builders (Mack, Intamin, B&M, Vekoma, …)          |
| `planning`         | Rope drop, ERT, touring plans, passes, AI metrics      |
| `wait-times`       | Queuing systems, express passes, etc.                  |
| `ride-experience`  | Enthusiast jargon (GP, credit, near-miss, Mackprodukt) |
| `park-operations`  | Refurbishments, capacity, dispatch, events             |
| `crowd-levels`     | Crowd forecasting, peak days, calendars                |
| `dining`           | Quick/table service, reservations, mobile ordering     |
| `shopping`         | Souvenirs, merchandise, park exclusives                |
| `logistics`        | Chicken exit, in-show exit, e-stop                     |

> The `ai` category exists in the type union but is currently unused.

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

## Ride ↔ Glossary link

Rides and glossary terms are connected in **both directions** through the API's
curated `rideProfile` (see the backend's
[ride-glossary-link doc](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/frontend/ride-glossary-link.md)).
The API stores only **glossary term ids**; this app owns the glossary and
resolves them.

| Direction        | Where                                  | Component                                     |
| ---------------- | -------------------------------------- | --------------------------------------------- |
| ride → glossary  | ride page, below the history chapter   | `components/parks/ride-profile-section.tsx`   |
| glossary → rides | term detail page, below the definition | `components/glossary/glossary-term-rides.tsx` |

- **`RideProfileSection`** renders the track figures as a **numbered** list in
  ride order — repeats are meaningful (Voltron Nevera really does hit two
  corkscrews back to back), so the list is never deduped. Figures that have a
  3-D player are badged. Ride-type terms render as `Badge` chips; the
  manufacturer links only when the glossary covers that builder, otherwise it
  is plain text. Data arrives on the **park** response
  (`attractions[].rideProfile`), so it is in the static shell.
- **`GlossaryTermRides`** fetches `/v1/glossary/terms/:id/attractions` (cached
  1 day — the seed only changes when a human edits it), groups by park and
  renders nothing when no ride carries the term. Most of the glossary is
  concepts no ride profile references, and an empty box would be worse than no
  box.

An id this app has no term for is **dropped**, not rendered raw — the API can
legitimately be seeded with a term before the glossary entry lands here.

Term ids are mirrored into the API repo for CI validation. Regenerate after
adding, renaming or removing a term:

```bash
node scripts/export-glossary-term-ids.mjs \
  > ../v4.api.park.fan/src/attractions/data/glossary-term-ids.ts
```

## Verifying the 3-D player

`scripts/render-coaster-elements.mjs` is the headless harness the
[three.js convention](../development/conventions.md#12-threejs-animations-research-first-then-verify-from-every-perspective-requirement)
requires: it drives the real scene module in Chromium and writes a contact
sheet per element — one row per camera (front / follow / onboard), one column
per timeline position, in both themes.

```bash
node scripts/render-coaster-elements.mjs                 # all 42 elements
node scripts/render-coaster-elements.mjs launch top-hat  # just these
OUT=/tmp/sheets SAMPLES=0.9,0.95,1 node scripts/render-coaster-elements.mjs
```

It uses the container's pre-installed Chromium (`/opt/pw-browsers/chromium`,
override with `CHROMIUM_PATH`) — never run `playwright install`.

### `pace`: elements whose speed IS the point

The player's curve is arc-length parameterised, so linear progress means
constant speed — correct for almost every figure. An element may supply
`pace(t)` to remap progress onto the curve when the speed change is the
element: a launch accelerating out of the station, a train hanging at the apex
of a scorpion tail, a drop track standing dead still before the floor lets go.
It must be monotonic and run 0 → 1. Prefer ease-**in**; an ease-out compresses
the tail of the run and bunches the cars at the end of the curve.

## Use in blog posts

Blog post bodies expose glossary terms two ways (see `components/blog/blog-content.tsx`):

- **Auto-injection**: known glossary terms (and aliases) are highlighted automatically on first occurrence via `GlossaryInjectTerm`, linking to the term's detail page. The compiled matcher is cached per locale in a `WeakMap`.
- **Glossary widget**: to pull a term's name and **full definition** straight from the dataset into the post body — no copied text — authors drop a widget fence referencing the term:

      ```glossary-widget slug=hyper-coaster
      ```

  `slug` accepts either the term's localized slug or its stable `id` (slug is tried first, then id), so the same reference works across translated posts. Rendered by `BlogGlossaryWidget` as a card with the term name, its definition paragraphs, optional alternate names, and a link to the detail page. An unknown reference falls back to a not-found note (`blog.widget.termNotFound`).
