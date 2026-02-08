# Caching Strategy

## ISR (Incremental Static Regeneration)

Next.js ISR controls revalidation per route:

| Route | revalidate | Reason |
|-------|------------|--------|
| Homepage | 60s | Stats, Nearby Parks |
| Continent | 3600 (1h) | Stable geo structure |
| Country | 3600 (1h) | Stable geo structure |
| City | 1800 (30min) | Parks list |
| Park | 300 (5min) | Wait times, status |
| Attraction | 300 (5min) | Details, predictions |
| Search | Dynamic | No cache |

---

## API Cache Respect

The frontend **respects** the API's cache headers (e.g. ETag, `Cache-Control`). The API sets different TTLs:

- **Live data** (Wait Times): 2min + 5min stale
- **Metadata** (Parks): 5min + 10min stale
- **Geo/Discovery**: 1h + 2h stale
- **Holidays**: 24h + 48h stale

---

## Next.js Headers

In `next.config.ts`:

- **`/api/*`**: `Cache-Control: no-store, must-revalidate`
- **`/:locale/search`**: `Cache-Control: no-store, must-revalidate`
- **Referrer-Policy**: `origin-when-cross-origin` global

---

## Discovery / Geo-Structure Cache

`lib/utils/redirect-utils.ts` caches the geo structure for redirect lookups:

- **TTL:** 1 hour
- **Source:** `getGeoStructure(86400)` (24h cache on API side)

---

## Client Cache TTL (lib/api/cache-config.ts)

When the frontend caches API responses (e.g. in fetch wrappers or data layers), it uses `CACHE_TTL` from `lib/api/cache-config.ts`. Rule: **frontend TTL should not be shorter than the API’s**, to avoid extra requests without fresher data.

| Key | TTL | Use |
|-----|-----|-----|
| `search` | 60s | Search results |
| `nearby` | 60s | Nearby parks (homepage) |
| `realtime` | 120s | Global stats (Most/Least Crowded) |
| `geo`, `continents`, `parks`, `parkDetail`, `waitTimes` | 120s | Discovery and park data |
| `calendar`, `weather` | 3600s (1h) | Calendar, weather |
| `predictions`, `holidays` | 86400s (24h) | ML predictions, holidays |

---

## Related

- [System Overview](system-overview.md)
- Backend: [Caching Strategy](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/architecture/caching-strategy.md)
