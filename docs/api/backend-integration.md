# Backend Integration

## Overview

The park.fan frontend integrates with [api.park.fan](https://api.park.fan) via REST. All API calls go through `lib/api/*` using the type-safe client.

## Configuration

- **Base URL:** `NEXT_PUBLIC_API_URL` (default: `https://api.park.fan`)
- **No secrets in code** – API keys etc. only in `.env.local`

## Key Endpoints Used

| Endpoint                              | Usage                            |
| ------------------------------------- | -------------------------------- |
| `/v1/discovery/geo`                   | Geo structure, redirect lookups  |
| `/v1/parks/{path}`                    | Park by geographic path          |
| `/v1/parks/{path}/wait-times`         | Current wait times               |
| `/v1/parks/{path}/calendar`           | Integrated calendar              |
| `/v1/parks/{path}/weather`            | Current weather                  |
| `/v1/parks/{path}/predictions/yearly` | Crowd predictions                |
| `/v1/search`                          | Search (via `/api/search` proxy) |
| `/v1/analytics/realtime`              | Global stats                     |

## API Client Modules

- **`lib/api/client.ts`** – Fetch wrapper, error handling
- **`lib/api/types.ts`** – TypeScript types
- **`lib/api/parks.ts`** – Park, wait times, schedule, weather
- **`lib/api/discovery.ts`** – Geo structure
- **`lib/api/search.ts`** – Search
- **`lib/api/analytics.ts`** – Realtime stats
- **`lib/api/favorites.ts`** – Favorites types and `getFavorites()` for enrichment
- **`lib/api/cache-config.ts`** – CACHE_TTL per endpoint (see [Caching Strategy](../architecture/caching-strategy.md))
- **`lib/api/calendar-data.ts`**, **`lib/api/integrated-calendar.ts`** – Calendar data and integration

## URL Conversion

Always use `convertApiUrlToFrontendUrl()` when linking to API-provided URLs. See [Routing & URLs](../architecture/routing-and-urls.md).

---

## Crowd Levels (P50 / "Normal")

The API uses a **P50 (median) baseline** for crowd levels. A typical day or typical wait = 100%, which the API returns as **`moderate`**.

- **Frontend:** We display `moderate` as **"Normal"** in all locales (green, emerald).
- **Translation keys:** e.g. `parks.crowdLevels.moderate`, `stats.crowd.moderate`.

Other levels (`very_low`, `low`, `high`, `very_high`, `extreme`, `closed`) are shown with their translated labels and colors. See [Design System – Crowd Level Badges](../design/design-system.md#crowd-level-badges-filled) and [P50 Crowd Levels (Backend)](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/p50-crowd-levels.md).

---

## App API Routes (app/api/\*)

Next.js API routes used by the frontend (all under `app/api/`):

| Route                          | Purpose                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GET /api/search**            | Proxies to API search; avoids CORS when calling from client.                                                                                                                          |
| **GET /api/parks/[...path]**   | Proxies park endpoints (e.g. by geo path).                                                                                                                                            |
| **GET /api/parks/backgrounds** | Returns park/attraction background image paths (uses `lib/utils/park-assets`).                                                                                                        |
| **GET /api/nearby**            | Proxies nearby-parks (geo) with optional lat/lng.                                                                                                                                     |
| **GET /api/favorites**         | Proxies to `api.park.fan/v1/favorites` with query params (parkIds, attractionIds, lat, lng, etc.); used to enrich favorites with full entities. Response is dynamic (cookies/params). |
| **GET /api/og/[...path]**      | Dynamic OG image generation (park, attraction, geo pages); uses `lib/utils/park-assets`, `lib/hero-images`, translations.                                                             |
| **GET /api/debug-geo-mode**    | Returns current `debug-geo-mode` flag value (Vercel Toolbar / debug geo).                                                                                                             |

All `/api/*` routes send `Cache-Control: no-store, must-revalidate` (see [Caching Strategy](../architecture/caching-strategy.md)).

---

## On-Demand Revalidation

`POST /api/revalidate` lets the **backend push cache invalidation when data actually changes**,
instead of the frontend re-rendering (and paying Vercel ISR writes) on a timer. Disabled (503)
until `REVALIDATE_SECRET` is set in the Vercel environment.

```bash
curl -X POST https://park.fan/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags":["geo","popular-parks"],"paths":["/en"]}'
```

- **`tags`** → `revalidateTag(tag, 'max')` (stale-while-revalidate purge: next request serves
  stale and re-renders in the background). Tags currently attached to fetches (`lib/api/*`):

  | Tag                | Invalidates                                         | Backend should fire on                        |
  | ------------------ | --------------------------------------------------- | --------------------------------------------- |
  | `geo`              | Geo structure / discovery (hubs, featured, sitemap) | Park/city/country added, removed or renamed   |
  | `parks`            | Park detail snapshots                               | Park structure/metadata change                |
  | `attractions`      | Attraction list snapshots                           | Attraction added/removed/renamed              |
  | `popular-parks`    | Popularity ranking                                  | Ranking re-computed                           |
  | `analytics`        | Global stats / ticker / geo-live SSR seeds          | (rarely useful — live values are client-side) |
  | `ml`               | ML dashboard + metrics history                      | Model retrained                               |
  | `weather`          | Per-park nowcast seeds                              | (normally TTL is fine)                        |
  | `best-days:<slug>` | One park's best-days calendar                       | Calendar/prediction recompute for that park   |

- **`paths`** → `revalidatePath(path)` for concrete page shells, e.g. `"/de"`, `"/en/parks"`.
- Max 50 entries per array per request; invalid entries are dropped silently.

This is the "read first, only write on change" model: TTLs (see
[Caching Strategy](../architecture/caching-strategy.md)) remain only as a fallback and can be
raised further once the backend webhook fires reliably.

---

## Favorites

Favorites are **stored in a cookie** (client) and **enriched via the API** (server).

- **Client:** `lib/utils/favorites.ts` (cookies: get/set/toggle parks, attractions, shows, restaurants). Syncs to `/api/favorites` in a debounced way to resolve full entities.
- **API:** `lib/api/favorites.ts` – Types and `getFavorites(parkIds, ...)` calling the backend.
- **Route:** `app/api/favorites/route.ts` – Proxies to `api.park.fan/v1/favorites` with IDs and optional lat/lng; used for enrichment and nearby context.

Cookie name and max-age are in `lib/utils/favorites.ts`; no secrets are stored in the cookie, only IDs.

---

## Related

- [Architecture – API Integration](../architecture/api-integration.md) – Overview
- [Calendar Status](calendar-status-closed.md) – UNKNOWN vs CLOSED
- [Routing & URLs](../architecture/routing-and-urls.md) – URL conversion
- [API Docs](https://api.park.fan/api)
