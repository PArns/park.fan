import { api } from './client';
import { CACHE_TTL } from './cache-config';
import type { GlobalStats, GeoLiveStatsDto } from './types';

/**
 * Get global real-time statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate: CACHE_TTL.realtime },
  });
}

/**
 * Get live statistics for geographic regions
 */
export async function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate: CACHE_TTL.realtime },
  });
}
