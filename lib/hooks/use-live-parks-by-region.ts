import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { LiveParkFields } from '@/lib/api/types';

export type { LiveParkFields };

/**
 * Batch-fetch live park status for a set of regions, keyed by park id.
 *
 * ONE request per distinct region SET — `/api/parks/live?regions=…` fans the regions out
 * server-side and answers with the {@link LiveParkFields} projection, so a caller spanning three
 * countries (the featured strip) costs one request instead of three, and a single-region caller
 * (a hub grid, a blog park reference) gets the same nine fields at ~40% of the bytes the old
 * per-region discovery route sent.
 *
 * Regions are sorted before they reach the query key and the URL, so callers listing the same
 * countries in a different order share one cache entry and one CDN object.
 *
 * Mirrors the `useLiveParkData` contract: client-only (the SSR shell is status-free), refetch on
 * mount, 5-min poll, refetch on focus/reconnect.
 *
 * @param regions `"<continent>/<country>"` pairs. Empty entries are dropped, so a caller whose
 *   geo lookup hasn't resolved can keep the hook call unconditional.
 */
export function useLiveParksByRegion(regions: string[]) {
  // Sort + dedupe here rather than at each call site: the key, the URL and therefore the CDN
  // object all derive from this one list. The shape filter mirrors the route's own guard — one
  // malformed entry would otherwise 400 the whole batch and blank the status on every valid
  // card next to it, so it drops out here instead.
  const key = useMemo(
    () => [...new Set(regions.filter((r) => /^[^/]+\/[^/]+$/.test(r)))].sort(),
    [regions]
  );

  // Plain object (not a Map) so React Query's structural sharing keeps the result identity
  // stable across polls when nothing changed — a Map would get a new identity every 5-min
  // poll and re-render every consuming card grid for no reason.
  const query = useQuery<Record<string, LiveParkFields>>({
    queryKey: ['live-parks', key],
    queryFn: async () => {
      const res = await fetch(`/api/parks/live?regions=${encodeURIComponent(key.join(','))}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Failed to fetch live parks: ${res.statusText}`);
      return (await res.json()) as Record<string, LiveParkFields>;
    },
    // Run only on the client: the SSR/prerendered shell renders status-free cards.
    enabled: key.length > 0 && typeof window !== 'undefined',
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  // Expose ONLY the data. React Query v5 tracks which fields consumers read; returning
  // `query.isFetching` here subscribed every card grid to its false→true→false flip on each
  // 5-min poll and every window refocus — a full grid re-render for identity-stable data.
  return { liveByParkId: query.data };
}

/**
 * Single-region convenience wrapper for the hub grids and the blog's park references.
 *
 * `enabled` lets a caller keep the hook call unconditional while it has no region yet — the
 * blog's park references call it for entries the geo lookup failed to resolve.
 */
export function useRegionParks(continent: string, country: string, enabled = true) {
  const regions = useMemo(
    () => (enabled && continent && country ? [`${continent}/${country}`] : []),
    [continent, country, enabled]
  );
  return useLiveParksByRegion(regions);
}
