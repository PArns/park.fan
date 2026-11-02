import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics, cached a week. Only an SSR seed: the homepage counts refresh
 * client-side via `useGlobalStats`, and a shorter window here would pin the homepage's whole ISR
 * window to it (the shortest fetch wins).
 * See docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
 */
export function getGlobalStats(): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate: 604800, tags: ['analytics'] },
  });
}

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
