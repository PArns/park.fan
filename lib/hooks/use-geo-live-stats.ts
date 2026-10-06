import { useQuery } from '@tanstack/react-query';
import type { GeoLiveStatsDto } from '@/lib/api/types';
import { LIVE_POLL_QUERY_OPTIONS } from '@/lib/hooks/live-poll-options';

/**
 * Live open-park counts per continent and country, one request shared by every consumer on a page.
 * Client-only, so the counts are not baked into the ISR shell.
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
    ...LIVE_POLL_QUERY_OPTIONS,
  });
}

/**
 * The live open-park count for a continent or a country within it. `undefined` means not loaded
 * yet and nothing else: `/v1/analytics/geo-live` only carries regions with at least one park open,
 * so a region missing from a loaded response has zero.
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
