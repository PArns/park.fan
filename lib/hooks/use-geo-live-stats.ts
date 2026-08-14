import { useQuery } from '@tanstack/react-query';
import type { GeoLiveStatsDto } from '@/lib/api/types';

/**
 * Batch-fetch live "open park" counts per continent/country.
 *
 * One shared request (deduped via React Query) feeds every consumer on a page — the homepage
 * "parks open now" grid and the continent page's country cards. Client-only + 5-min poll, so these
 * counts no longer have to be baked into (and revalidate) the ISR shell. Hits the existing no-store
 * `/api/analytics/geo-live` proxy.
 */
export function useGeoLiveStats() {
  return useQuery<GeoLiveStatsDto>({
    queryKey: ['geo-live'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/geo-live', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch geo-live stats: ${res.statusText}`);
      return res.json();
    },
    enabled: typeof window !== 'undefined',
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });
}

/**
 * Look up the live open-park count for a continent (or a country within it).
 *
 * `undefined` means **not loaded yet** and nothing else — consumers render a skeleton on it.
 * A region that is missing from a loaded response has **zero** parks open: `/v1/analytics/geo-live`
 * only carries regions with at least one, so at 08:00 CEST all of Europe is the single entry
 * `germany: 2` and the other ten countries are simply absent. Reading that absence as "unknown"
 * left every country card on the continent page pulsing its skeleton forever — the loading state
 * ended only for whichever region happened to be open — and made the homepage panels hold their
 * server-rendered `initialOpenCount` after the live number had fallen to 0.
 */
export function findOpenParkCount(
  stats: GeoLiveStatsDto | undefined,
  continentSlug: string,
  countrySlug?: string
): number | undefined {
  if (!stats) return undefined;
  const continent = stats.continents.find((c) => c.slug === continentSlug);
  if (!continent) return 0;
  if (!countrySlug) return continent.openParkCount;
  return continent.countries.find((c) => c.slug === countrySlug)?.openParkCount ?? 0;
}
