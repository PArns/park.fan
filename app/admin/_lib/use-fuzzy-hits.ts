'use client';

import type { SearchResultItem } from '@/lib/api/types';
import { SEARCH_SETTLE_MS } from '@/lib/analytics/search-session';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { SEARCH_MIN_QUERY_LENGTH, useSiteSearch } from '@/lib/hooks/use-site-search';
import { rankByMatch } from '@/lib/utils/search-ranking';

/**
 * The parks or rides the site's search finds for `query`, ranked as the site ranks them, so the
 * admin forgives the same typos ("phantsialand", "blue fir"). Retired rides are not in that index;
 * callers that need them merge the admin's own lookup in. Empty below three characters.
 */
export function useFuzzyHits(
  query: string,
  type: 'park' | 'attraction'
): { hits: SearchResultItem[]; loading: boolean } {
  const settled = useDebouncedValue(query.trim(), SEARCH_SETTLE_MS);
  const search = useSiteSearch(settled);
  // The previous query's hits stay in `data` while the next load; below the floor they are stale.
  if (settled.length < SEARCH_MIN_QUERY_LENGTH) return { hits: [], loading: false };
  const hits = (search.data?.results ?? []).filter((hit) => hit.type === type);
  return {
    hits: rankByMatch(hits, settled).map(({ item }) => item),
    loading: search.isFetching,
  };
}
