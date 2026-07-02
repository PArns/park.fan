import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics — cached in the Vercel Data Cache.
 *
 * Only an SSR SEED: the homepage headline counts refresh client-side via `useGlobalStats`
 * (no-store `/api/analytics/realtime`), so this may cache for the full hour without showing
 * stale counts to a JS visitor. Any fetch below the page's `export const revalidate` silently
 * pins the whole route's ISR window down to it (lowest-fetch-wins) — keep ≥ 3600.
 */
export function getGlobalStats(revalidate = 3600): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate, tags: ['analytics'] },
  });
}

/**
 * Get live ticker data — top wait times across all open parks. Cached 10 min so the
 * client polls hitting the /api/analytics/ticker proxy collapse onto one backend call
 * per window. The homepage shell passes 3600: its baked items are only a seed
 * (`initialDataUpdatedAt: 0` → replaced on mount) and the default 600 would pin the
 * route's ISR window to 10 min.
 */
export function getTickerData(revalidate = 600): Promise<TickerResponse> {
  return api.get<TickerResponse>('/v1/analytics/ticker', {
    next: { revalidate, tags: ['analytics'] },
  });
}

/**
 * Get live statistics for geographic regions — cached in the Vercel Data Cache.
 *
 * Only an SSR SEED: open-park counts refresh client-side via `useGeoLiveStats` (no-store
 * `/api/analytics/geo-live`), so this may cache for the full hour. Keep ≥ 3600 — a lower
 * value pins every static route that bakes it (homepage, /parks) to that window.
 */
export function getGeoLiveStats(revalidate = 3600): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate, tags: ['analytics'] },
  });
}
