import { cacheLife } from 'next/cache';
import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics — cached 5 min (Cache Components).
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 1200 });
  return api.get<GlobalStats>('/v1/analytics/realtime');
}

/**
 * Get live ticker data — top wait times across all open parks. Cached 5 min so
 * concurrent visitors collapse onto one backend call per window (shared with the
 * /api/analytics/ticker proxy).
 */
export async function getTickerData(): Promise<TickerResponse> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 1200 });
  return api.get<TickerResponse>('/v1/analytics/ticker');
}

/**
 * Get live statistics for geographic regions — cached 5 min.
 */
export async function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 1200 });
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live');
}
