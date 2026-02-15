import { api } from './client';
import type { SearchResult } from './types';

export type SearchType = 'park' | 'attraction' | 'show' | 'restaurant';

/**
 * Search across all entities
 */
export async function search(query: string, types?: SearchType[]): Promise<SearchResult> {
  const params: Record<string, string> = { q: query };
  if (types && types.length > 0) {
    params.type = types.join(',');
  }

  // Use cache: 'no-store' to respect API cache headers (60s)
  // This prevents double-caching (Frontend + API)
  return api.get<SearchResult>('/v1/search', {
    params,
    cache: 'no-store',
  });
}
