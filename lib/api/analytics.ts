import { api } from './client';
import type { GlobalStats, GeoLiveStatsDto, TickerResponse } from './types';

/**
 * Get global real-time statistics — cached in the Vercel Data Cache.
 *
 * Only an SSR SEED: the homepage headline counts refresh client-side via `useGlobalStats`
 * (no-store `/api/analytics/realtime`), so this may cache for a long time without showing stale
 * counts to a JS visitor. Any fetch below the page's `export const revalidate` silently pins the
 * whole route's ISR window down to it (lowest-fetch-wins), which is why this is a week and not an
 * hour: at 3600 it was one of the fetches holding the homepage to hourly regeneration, and an
 * hourly seed buys nothing that the mount-time overlay does not already deliver.
 */
export function getGlobalStats(): Promise<GlobalStats> {
  return api.get<GlobalStats>('/v1/analytics/realtime', {
    next: { revalidate: 604800, tags: ['analytics'] },
  });
}

/**
 * Get live ticker data — top wait times across all open parks. Cached 10 min so the client polls
 * hitting the `/api/analytics/ticker` proxy collapse onto one backend call per window.
 *
 * Exactly one consumer is left, and it is `/admin/analytics` — the public ticker component is
 * gone. That makes the 10 minutes a pure backend-collapse window with no ISR consequence
 * whatsoever: `/admin` is never prerendered, so nothing here can set a shell's clock.
 *
 * The window used to be a parameter, because the homepage seeded its items and had to pass
 * something longer than 600 to avoid pinning its own ISR window to ten minutes. The homepage stopped
 * baking the ticker, which left a parameter no caller passes — and a spare TTL parameter is how a
 * literal ends up at a call site governing a page nobody was thinking about. Removed for that
 * reason; see the hard-coded-TTL section in docs/architecture/caching-strategy.md.
 */
export function getTickerData(): Promise<TickerResponse> {
  return api.get<TickerResponse>('/v1/analytics/ticker', {
    next: { revalidate: 600, tags: ['analytics'] },
  });
}

/**
 * Get live statistics for geographic regions — cached in the Vercel Data Cache.
 *
 * Only an SSR SEED: open-park counts refresh client-side via `useGeoLiveStats` (no-store
 * `/api/analytics/geo-live`), so this may cache for a long time. It pins every static route that
 * bakes it (homepage, /parks) to its own window, which is the whole reason it is a week: those
 * two routes regenerated 24 times a day for a number the client replaces on mount.
 */
export function getGeoLiveStats(): Promise<GeoLiveStatsDto> {
  return api.get<GeoLiveStatsDto>('/v1/analytics/geo-live', {
    next: { revalidate: 604800, tags: ['analytics'] },
  });
}
