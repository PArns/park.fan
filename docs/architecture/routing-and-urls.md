# Routing & URLs

## Route Structure

The app uses **geographic routes** analogous to the API:

```
/[locale]/parks/[continent]/[country]/[city]/[park]/[attraction]
```

**Examples:**

- `/en/parks/europe/germany/bruehl/phantasialand`
- `/de/parks/europe/germany/bruehl/phantasialand/taron`
- `/en/parks/north-america/united-states/orlando/magic-kingdom`

**Important:** The **city** segment is **required** – there is no route without city.

---

## URL Conversion (API → Frontend)

The API returns URLs like `/v1/parks/europe/germany/bruehl/phantasialand`.

**Rule:** Always use `convertApiUrlToFrontendUrl()` from `lib/utils/url-utils.ts` – **never** build URLs manually.

```ts
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';

// Correct
const href = convertApiUrlToFrontendUrl(attraction.url);

// Wrong – do not build manually
const href = `/parks/${continent}/${country}/${city}/${park}`;
```

**Mapping:**

- `/v1/parks/...` → `/parks/...`
- `/v1/parks/.../attractions/xyz` → `/parks/.../xyz` (attraction directly under park)
- `/v1/shows/...`, `/v1/restaurants/...` → Hash fragments (`#shows`, `#restaurants`)

---

## URL Builders (lib/utils/url-utils.ts)

When you **have an API URL** (e.g. from `park.url`, `attraction.url`), use **`convertApiUrlToFrontendUrl(apiUrl)`**.

When you **only have geo data** (continent, country, city, slug), use:

- **`buildParkUrl({ continent, country, city, slug, url? })`** – Prefer building from geo; falls back to converting `url` if geo is incomplete.
- **`buildAttractionUrlFromGeo({ slug, park?, url? })`** – Same idea for attraction URLs.
- **`buildShowUrl(parkUrl)`** – Returns park URL with `#shows`.
- **`buildRestaurantUrl(parkUrl)`** – Returns park URL with `#restaurants`.
- **`buildAttractionUrl(parkUrl, attractionSlug)`** – Park URL + `/${attractionSlug}`.

**Rule:** If the API returns a `url` field, use `convertApiUrlToFrontendUrl(url)` so the frontend stays in sync with the backend. Use the builders when constructing links from geo params or for hash tabs.

---

## Breadcrumbs

**`lib/utils/breadcrumb-utils.ts`** exposes generators per segment:

- `generateContinentBreadcrumbs`, `generateCountryBreadcrumbs`, `generateCityBreadcrumbs`
- `generateParkBreadcrumbs`, `generateAttractionBreadcrumbs`

Each returns an array of `{ name, url, className? }` for `BreadcrumbNav`. Pass locale-aware labels (e.g. from `getTranslations('navigation')` or geo names).

---

## Redirect Logic (404 Prevention)

Malformed URLs (e.g. missing city) are checked **before** returning 404 and redirected if possible.

**`lib/utils/redirect-utils.ts`:**

- `findParkBySlug()` – Lookup in geo structure
- `findParkPageRedirect()` / `findCityPageRedirect()` – Park slug in city position (missing city segment)
- `findRelocatedParkRedirect()` – **Stale geo segments**: the park slug is the stable key; when the API re-slugs a city (e.g. umlaut transliteration `bruhl` → `bruehl`, `gunzburg` → `guenzburg`) or moves a park (`marne-la-vallee` → `paris`), the park/attraction pages 308 old URLs to the park's current canonical path. Only runs **after** the API lookup failed (never touches working URLs). Critical for SEO: without it, every re-slug 404s the URLs Google has indexed and German rankings drop.
- Known historical re-slugs additionally get static 301s in `next.config.ts` (`redirects()`, rules 4–6) — these also cover the bare city-hub URLs.

**Implemented in:**

- City page
- Park page
- Attraction page

**Example redirects:**

- `/de/parks/europe/germany/phantasialand` → `/de/parks/europe/germany/bruehl/phantasialand`
- `/de/parks/europe/netherlands/toverland/fenix` → `/de/parks/europe/netherlands/sevenum/toverland/fenix`
- `/de/parks/europe/germany/bruhl/phantasialand/taron` → `/de/parks/europe/germany/bruehl/phantasialand/taron` (old city slug, 301 via next.config + 308 fallback via `findRelocatedParkRedirect`)

---

## Locale Prefix

- **Always** prefix: `/en/...`, `/de/...`, etc.
- `localePrefix: 'always'` in `i18n/routing.ts`
- Automatic language detection via `Accept-Language`

---

## Link Prefetching

| Link Type           | Recommendation                                           |
| ------------------- | -------------------------------------------------------- |
| Header/Footer       | `prefetch={false}`                                       |
| Discovery/Geo cards | `prefetch={false}`                                       |
| Parks/Attractions   | `prefetch={status === 'OPERATING'}` (only when open)     |
| Search              | `prefetch={false}` for locations, conditional for others |

---

## Related

- [System Overview](system-overview.md)
- [API Integration](api-integration.md)
- [404 Prevention – Recent Updates](../../CLAUDE.md#version-255-2026-01-25---404-error-prevention)
