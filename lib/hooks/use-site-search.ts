'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchResult } from '@/lib/api/types';

/** `/api/search` answers an empty set below this many characters. */
export const SEARCH_MIN_QUERY_LENGTH = 3;

/**
 * The site's typo-tolerant search (`/api/search`, the API's `/v1/search`) for a query that has
 * already settled. One cache entry per query, shared by the search palette and the admin.
 */
export function useSiteSearch(query: string) {
  return useQuery<SearchResult>({
    queryKey: ['search', query],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
      if (!response.ok) throw new Error('Search failed');
      return (await response.json()) as SearchResult;
    },
    enabled: query.length >= SEARCH_MIN_QUERY_LENGTH,
    // Keep the previous query's results on screen while the next ones load — without this,
    // every debounced keystroke resets `data` to undefined and the dialog flashes
    // results → skeleton → results on each typed batch.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}
