import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics — cached 10 min in the Vercel Data Cache.
 * Streamed inside a homepage <Suspense> hole (one shared key).
 */
export function getGlobalStats(): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate: 600, tags: ['analytics'] },
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
 * Get live statistics for geographic regions — cached 10 min.
 */
export function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate: 600, tags: ['analytics'] },
  });
}
