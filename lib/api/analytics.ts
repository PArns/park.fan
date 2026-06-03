import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics — revalidates every 5 min (ISR-friendly)
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate: 300 },
  });
}

/**
 * Get live ticker data — top wait times across all open parks.
 * Frontend data-cached 5 min (revalidate 300): clients poll the ticker every 5 min, so
 * this collapses concurrent visitors onto one backend call per window. Also reused by the
 * /api/analytics/ticker proxy so the client poll shares the same cache.
 */
export async function getTickerData(): Promise<TickerResponse> {
  return api.get<TickerResponse>('/v1/analytics/ticker', {
    next: { revalidate: 300 },
  });
}

/**
 * Get live statistics for geographic regions — revalidates every 2 min (ISR-friendly)
 */
export async function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate: 300 },
  });
}
