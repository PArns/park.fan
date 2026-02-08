# API Integration (Architecture)

## Overview

The frontend talks to [api.park.fan](https://api.park.fan) via the type-safe client in `lib/api/*`. API routes under `/api/*` proxy search and park requests to avoid CORS; other endpoints are called server-side.

**Key rule:** Use `convertApiUrlToFrontendUrl()` for any URL from the API – see [Routing & URLs](routing-and-urls.md).

## Summary

| Concern | Detail |
|---------|--------|
| **Base URL** | `NEXT_PUBLIC_API_URL` (default `https://api.park.fan`). No secrets in docs. |
| **Client** | `lib/api/client.ts`, `parks.ts`, `discovery.ts`, `search.ts`, `analytics.ts`, `types.ts` |
| **Proxies** | `/api/search`, `/api/parks/[...path]`, `/api/nearby`, `/api/favorites`, `/api/og/*`, `/api/debug-geo-mode` |
| **Data types** | ParkStatus, AttractionStatus, CrowdLevel, Calendar day status (OPERATING / CLOSED / UNKNOWN) |

**Crowd "moderate":** Shown as **"Normal"** (green). Backend: [P50 Crowd Levels](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/analytics/p50-crowd-levels.md).

## Related

- [Backend Integration](../api/backend-integration.md) – Endpoints, modules, URL conversion
- [Calendar Status](../api/calendar-status-closed.md) – UNKNOWN vs CLOSED
- [API Docs](https://api.park.fan/api)
