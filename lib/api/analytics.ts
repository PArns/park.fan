import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto } from './types';

/**
 * Get global real-time statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate: 300 },
  });
}

/**
 * Get live statistics for geographic regions
 */
export async function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate: 300 }, // 5 minutes cache
  });
}
