import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { LiveParkFields } from '@/lib/api/types';
import { LIVE_POLL_QUERY_OPTIONS } from '@/lib/hooks/live-poll-options';

export type { LiveParkFields };

/**
 * Live park status for a set of regions, keyed by park id: one request per distinct region set,
 * answered with the {@link LiveParkFields} projection. Regions are sorted before the key and the
 * URL, so callers listing the same countries in any order share one cache entry and CDN object.
 * Client-only, polling like `useLiveParkData`.
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
    ...LIVE_POLL_QUERY_OPTIONS,
  });

  // Data only: React Query tracks which fields consumers read, so exposing `isFetching` would
  // re-render every card grid on each poll and refocus for identity-stable data.
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
