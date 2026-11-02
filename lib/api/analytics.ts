import { api } from './client';
import type { GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get live ticker data: top wait times across open parks. Cached ten minutes so the polls through
 * the `/api/analytics/ticker` proxy collapse onto one backend call. Its only consumer is
 * `/admin/analytics`, which is never prerendered, so the window sets no page's ISR clock.
 */
export function getTickerData(): Promise<TickerResponse> {
  return api.get<TickerResponse>('/v1/analytics/ticker', {
    next: { revalidate: 600, tags: ['analytics'] },
  });
}

/**
 * Get live statistics for geographic regions, cached a week. Only an SSR seed: open-park counts
 * refresh client-side via `useGeoLiveStats`, and this window pins every static route that bakes it
 * (homepage, /parks).
 */
export function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate: 604800, tags: ['analytics'] },
  });
}
