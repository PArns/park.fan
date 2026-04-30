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
 * Uses cache: 'no-store' to respect API cache headers (120s)
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
