# Featured Parks Section

Homepage section — rendered **server-side** by `components/home/featured-parks-slot.tsx` (the per-locale slug config lives in `components/home/featured-parks-section.tsx`) — that shows 6 locale-specific park cards with live data directly on the homepage, the primary SEO internal-linking surface from the root page to individual park pages. The same components are reused at the bottom of glossary term + blog pages, and a compact `PopularParksGrid` variant appears on the howto pages.

---

## How It Works

1. **Data source (structure):** Server-rendered from `geoData` via the default 24h-cached `getGeoStructure()` (request-deduped with the live-activity section). Only **day-stable** fields are baked (name, link, city, photo, translated country) — so the section no longer pins its host pages to a short ISR window (a route's effective revalidate is its lowest fetch revalidate; the old `getGeoStructure(300)` pinned homepage/blog/glossary/howto to 5 min and was a main ISR-write driver, see [caching-strategy](../architecture/caching-strategy.md)).
2. **Extraction:** `extractFeaturedParks()` traverses the geo structure and finds parks by slug in the predefined order. Parks not found in the API are silently skipped (graceful degradation).
3. **Live data (status, crowd, wait, schedule):** overlays **client-side** via `FeaturedParkCardsLive` → `useRegionParks` (one no-store `/api/discovery/<continent>/<country>` batch per distinct region, deduped by React Query, 5-min poll) — the same pattern as the hub-page `LiveParkGrid`. The prerendered card is status-free; the badge renders once the batch lands.
4. **Country name translation:** Country slug → `tGeo('countries.${slug}')` — same pattern as `ParkCardNearby`.
5. **Placement:** After `<FavoritesSection />`, before Global Stats — first "browse parks" section above the fold.

---

## Updating the Park Lists

The config lives at the top of `featured-parks-section.tsx`:

```ts
const FEATURED_PARK_SLUGS: Record<string, string[]> = {
  de: ['europa-park', 'phantasialand', ...],
  en: ['magic-kingdom-park', ...],
  // ...
};
```

**Rules:**

- Slugs must exist in the API geo structure (verify in the footer or the `/v1/discovery/geo` endpoint).
- Order = display order = relevance ranking (most important first).
- If a slug is not found in geoData, that card is silently dropped. The section only hides entirely if 0 parks are found.
- Unknown locales fall back to the `en` list.

### Known Slug Collision

`disneyland-park` is used by **both** Disneyland Paris (`/parks/europe/france/paris/disneyland-park`) and Disneyland Anaheim (`/parks/north-america/united-states/anaheim/disneyland-park`).

Because `extractFeaturedParks` stores the **first match** (and the geo structure traverses Europe before North America), `disneyland-park` **always resolves to Paris**. This is intentional for all European locales (`de`, `fr`, `nl`, `it`, `es`). For `en`, Disneyland Paris is also a top-10 worldwide park and appropriate for a global English audience.

If you ever need Anaheim specifically, use a different approach (path-based matching) or a different unique park slug.

---

## Current Config (v2.6.4)

Based on TEA 2024 Global Experience Index + language-market wait-time search relevance.

| Locale | Parks (in order)                                                                                                  | Rationale                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `de`   | Europa-Park, Phantasialand, Heide-Park, Movie Park Germany, Efteling, Disneyland Paris                            | Top 4 German parks + Efteling (popular with NRW visitors) + DLP (high-volume DE query)            |
| `en`   | Magic Kingdom, Universal Studios FL, Disneyland Paris, Tokyo Disneyland, Tokyo DisneySea, Universal Studios Japan | Top worldwide parks by attendance (TEA 2024)                                                      |
| `fr`   | Disneyland Paris, Walt Disney Studios, Parc Astérix, Europa-Park, Futuroscope, Phantasialand                      | French domestic + cross-border from Alsace/French-Swiss                                           |
| `nl`   | Efteling, Attractiepark Toverland, Walibi Belgium, Europa-Park, Phantasialand, Disneyland Paris                   | Best-calibrated locale — domestic NL/BE + popular German/French cross-border                      |
| `it`   | Gardaland, Disneyland Paris, Europa-Park, PortAventura, Efteling, Phantasialand                                   | Italian domestic + reachable European parks; removed Magic Kingdom/USJ (no IT wait-time searches) |
| `es`   | PortAventura, Disneyland Paris, Europa-Park, Phantasialand, Gardaland, Efteling                                   | Spain domestic + European parks; removed US/Japan parks (no ES wait-time searches)                |

---

## SEO Impact

- **Internal linking:** Adds 6 direct `<a>` links from the homepage to individual park pages per locale — improves link equity distribution from the root domain.
- **Crawl depth:** Reduces click depth for the most important parks from 4+ (Home → Continents → Country → City → Park) to 1.
- **Structured data:** The homepage `FeaturedParksSection` is plain HTML links — no additional JSON-LD needed (park pages themselves have full ThemePark schema).
