import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto } from './types';

/**
 * Get global real-time statistics
 * Uses cache: 'no-store' to respect API cache headers (120s)
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    cache: 'no-store',
  });
}

/**
 * Get live statistics for geographic regions
 * Uses cache: 'no-store' to respect API cache headers (120s)
 */
export async function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    cache: 'no-store',
  });
}
