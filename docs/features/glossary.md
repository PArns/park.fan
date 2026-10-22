# Glossary System

Theme park terminology glossary with localized URLs, search integration, and structured data.

---

## Architecture

| Layer                    | Files                                            |
| ------------------------ | ------------------------------------------------ |
| Term data (slugs)        | `lib/glossary/data.ts`                           |
| Types                    | `lib/glossary/types.ts`                          |
| Loader (cached)          | `lib/glossary/translations.ts`                   |
| Per-locale definitions   | `content/glossary/{en,de,fr,it,nl,es}.ts`        |
| Overview page            | `app/[locale]/glossary/page.tsx`                 |
| Detail page              | `app/[locale]/glossary/[term]/page.tsx`          |
| Cards / detail component | `components/glossary/`                           |
| Category icons           | `components/glossary/glossary-category-icons.ts` |
| Background               | `components/glossary/glossary-background.tsx`    |
| Structured data          | `components/seo/glossary-structured-data.tsx`    |
| Search API               | `app/api/glossary-search/route.ts`               |

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

Currently **306 terms**. Categories are defined in `lib/glossary/types.ts` (`GlossaryCategory`); the ones in active use:

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

Both pages are drawn from the parts the blog and news pages already use, so the glossary reads as
one more page of the same site. The one thing of its own is `GlossaryBackground`: a park photo from
the hero pool (one per day per deploy, server-picked for LCP) behind the head only, washed toward the
page background and faded out where the content starts, so the cards, the player and the sidebar
stand on the plain page and nothing is a glass panel over a photo.

- **Overview** is a tool page ([landing pages](../product/landing-pages.md)): the compact
  `LandingHero`, then the listings' search field (`LISTING_SEARCH_INPUT_CLASS`) with the 3-D filter
  beside it, and the category pills under it (`filterPillClass`, an „Alle“ pill first, a count in
  each). Every category opens with `ChapterHeading`, its icon from `GLOSSARY_CATEGORY_ICONS` as the
  watermark and the term count as the badge, unnumbered because the filter drops groups.
- **Term cards** (`GlossaryTermCard`) take the stream's surface (`LISTING_CARD_CLASS`): name, short
  definition, a 3-D badge, and the ride count on the card's floor.
- **Type-to-search**: a printable key with nothing focused moves into the search; Escape clears it
  from the field or from nowhere ([a keyboard shortcut waits for an unfocused page](../rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md)).
- **Term page** is laid out like a blog article: plain breadcrumb, a head with the category as kicker
  (`HeadKicker`, linking to its chapter on the overview), the name as a `font-black` H1, the short
  definition as the lead and the alternate names. Under it the 3-D player, the definition in the
  article's paragraph (`leading-[1.75]`), the Fancast link for model terms, the rides and the blog
  posts as chapters, and the way back. Related terms stand in a `SidebarCard`, the blog sidebar's
  block, sticky beside the text from 1024 px of page width and under it below that.
- **Term page tail**: below the term content, detail pages render the shared `PageBottomSections`
  (`components/common/page-bottom-sections.tsx`) — Nearby → Favorites → Featured Parks, the same
  tail the blog pages use. It is separated from the page's own content by a rule and a `bg-muted/30`
  tint (`border-y`), not by stacked padding: the tint continues into `FavoritesSection`'s band, so
  the whole tail reads as one region without pushing "nearest open park" a screenful down.

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

| Direction        | Where                                      | Component                                     |
| ---------------- | ------------------------------------------ | --------------------------------------------- |
| ride → glossary  | ride page, below the history chapter       | `components/parks/ride-profile-section.tsx`   |
| glossary → rides | term detail page, in the definition column | `components/glossary/glossary-term-rides.tsx` |

- **`RideProfileSection`** renders the track figures as a **numbered** list in
  ride order — repeats are meaningful (Voltron Nevera really does hit two
  corkscrews back to back), so the list is never deduped. Figures that have a
  3-D player are badged. Ride-type terms render as `Badge` chips; the
  manufacturer links only when the glossary covers that builder, otherwise it
  is plain text. Data arrives on the **park** response
  (`attractions[].rideProfile`), so it is in the static shell.
- **`GlossaryTermRides`** fetches `/v1/glossary/terms/:id/attractions` (cached
  1 day — the curation only changes when a human edits it), groups by park and
  renders nothing when no ride carries the term. Most of the glossary is
  concepts no ride profile references, and an empty box would be worse than no
  box. It is handed to `GlossaryTermDetail` as its **`rides` slot** rather than
  rendered as a sibling section: that puts it in the definition's column, under
  the text it illustrates, instead of a full-width stripe below the sidebar. It
  opens a chapter like every other one on the site (`ChapterHeading`, the ride
  count as badge); the three best-known rides are stream cards, the rest chips
  grouped by park, the parks side by side.

An id this app has no term for is **dropped**, not rendered raw — the API can
legitimately carry a term id before the glossary entry lands here.

### Nothing validates the ids any more

The API used to mirror this app's id list into `glossary-term-ids.ts` and fail
its CI on an unknown id. That allowlist is gone: the API's ride profiles are no
longer a checked-in seed but rows edited directly in
`attraction_ride_profiles`, so there is nothing there to check at build time.

**This app is now the only place a term id is defined, and no build in either
repo will tell you when one stops resolving.** A term renamed or removed here
silently shortens the layout on every ride page that referenced it.

So after renaming or removing a term, find the rows that still point at it:

```sql
SELECT p.slug, a.slug, rp.elements
  FROM attraction_ride_profiles rp
  JOIN attractions a ON a.id = rp."attractionId"
  JOIN parks p ON p.id = rp."parkId"
 WHERE rp.elements @> '["the-removed-id"]'
    OR rp.types    @> '["the-removed-id"]'
    OR rp.manufacturer_term_id = 'the-removed-id';
```

`scripts/export-glossary-term-ids.mjs` still dumps the id list and is still
useful for diffing, but it no longer has a consumer — do not expect writing its
output into the API repo to accomplish anything.

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
