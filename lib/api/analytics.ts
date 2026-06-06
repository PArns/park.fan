import { cacheLife } from 'next/cache';
import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics — cached 10 min (Cache Components).
 *
 * Streamed inside a homepage <Suspense> hole (low cardinality — one shared key), so this is a
 * minor ISR-write contributor; the 10-min window still keeps the aggregate fresh enough.
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  'use cache';
  cacheLife({ stale: 600, revalidate: 600, expire: 1800 });
  return api.get<GlobalStats>('/v1/analytics/realtime');
}

/**
 * Get live ticker data — top wait times across all open parks. Cached 10 min so
 * concurrent visitors collapse onto one backend call per window (shared with the
 * /api/analytics/ticker proxy).
 */
export async function getTickerData(): Promise<TickerResponse> {
  'use cache';
  cacheLife({ stale: 600, revalidate: 600, expire: 1800 });
  return api.get<TickerResponse>('/v1/analytics/ticker');
}

/**
 * Get live statistics for geographic regions — cached 10 min.
 */
export async function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  'use cache';
  cacheLife({ stale: 600, revalidate: 600, expire: 1800 });
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live');
}
