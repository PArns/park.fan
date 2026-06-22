import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics — cached in the Vercel Data Cache.
 * Server-rendered into the homepage shell, which pins it to its 5-min revalidate window
 * (`getGlobalStats(300)`); defaults to 10 min for any other caller.
 */
export function getGlobalStats(revalidate = 600): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate, tags: ['analytics'] },
  });
}

/**
 * Get live ticker data — top wait times across all open parks. Cached 10 min so
 * concurrent visitors collapse onto one backend call per window (shared with the
 * /api/analytics/ticker proxy).
 */
export function getTickerData(): Promise<TickerResponse> {
  return api.get<TickerResponse>('/v1/analytics/ticker', {
    next: { revalidate: 600, tags: ['analytics'] },
  });
}

/**
 * Get live statistics for geographic regions — cached in the Vercel Data Cache.
 * Server-rendered into the homepage shell, which pins it to its 5-min revalidate window
 * (`getGeoLiveStats(300)`); defaults to 10 min for any other caller.
 */
export function getGeoLiveStats(revalidate = 600): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate, tags: ['analytics'] },
  });
}
