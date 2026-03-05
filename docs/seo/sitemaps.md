# Sitemap Strategy

park.fan uses **3 separate sitemap files** to keep crawl budget allocation clear and allow independent revalidation per content type.

---

## Files

| File | URL | Content | Revalidate | Priority |
|------|-----|---------|------------|----------|
| `app/sitemap.ts` | `/sitemap.xml` | Home pages + all park pages | **1h** | 1.0 (parks), 0.9 (/parks) |
| `app/sitemap-attractions.ts` | `/sitemap-attractions.xml` | All attraction pages | 24h | 0.7 |
| `app/sitemap-geo.ts` | `/sitemap-geo.xml` | Continent/country/city hub pages | 24h | 0.6–0.8 |

All three are referenced in `robots.txt` (in priority order):
```
Sitemap: https://park.fan/sitemap.xml
Sitemap: https://park.fan/sitemap-attractions.xml
Sitemap: https://park.fan/sitemap-geo.xml
```

---

## `sitemap.xml` — Primary (Home + Parks)

Most important URLs on the site. 1h revalidate because park pages display live wait-time data.

- `https://park.fan` (root x-default)
- `https://park.fan/{locale}` × all locales — priority 1.0, daily
- `https://park.fan/{locale}/parks` × all locales — priority 0.9, daily
- `https://park.fan/{locale}/parks/{continent}/{country}/{city}/{park}` × all locales — **priority 1.0, hourly**

Geo structure is fetched with a 24h internal cache (`getGeoStructure(86400)`) — the 1h sitemap revalidate ensures Next.js keeps the file reasonably fresh even if the structure itself doesn't change often.

---

## `sitemap-attractions.xml` — Attractions

Long-tail SEO surface: "[ride name] wait time", "[ride name] [park]".

- `https://park.fan/{locale}/parks/{continent}/{country}/{city}/{park}/{attraction}` × all locales
- **Variant slugs excluded:** slugs matching `/^.+-\d+$/` (e.g. `coaster-2`, `ride-3`) are noindex pages pointing to the canonical base slug — excluded from sitemap to avoid duplicate entries.
- 24h revalidate (matches `getGeoStructure` TTL).

---

## `sitemap-geo.xml` — Hub Pages

Continent/country/city listing pages. Previously **completely missing** from any sitemap.

- Continent pages — priority 0.8, weekly
- Country pages — priority 0.7, weekly
- City pages — priority 0.6, weekly
  - **Single-park cities are excluded** — they 301-redirect directly to the park page, so the city URL has no independent value.

24h revalidate (geo structure rarely changes).

---

## Priority Hierarchy

```
Home (1.0)
  └── /parks overview (0.9)
        └── Individual park pages (1.0)  ← highest-value content
              └── Attraction pages (0.7) ← long-tail

Geo hub pages: Continent (0.8) > Country (0.7) > City (0.6)
```

---

## What Is NOT in the Sitemap

| Page | Reason |
|------|--------|
| `/impressum`, `/datenschutz` | Legal pages — low SEO value, not crawl-budget priority |
| `/search?q=...` | Dynamic query pages — duplicate content risk |
| Attraction variant slugs (e.g. `taron-2`) | noindex pages, canonical points to base slug |
| Single-park city pages | 301 redirect to park page |
| `/parks/` (non-locale root) | Always redirects to `/{locale}/parks/`, disallowed in robots.txt |

---

## Related

- [Robots.txt](../../app/robots.ts)
- [SEO Analysis](analysis.md)
