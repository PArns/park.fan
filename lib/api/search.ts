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

  // Frontend data-cached for 5 min (revalidate 300): search returns navigation
  // metadata (park/attraction names + slugs), not live wait times, so it tolerates a
  // few minutes of staleness. Caching keyed by the query string keeps repeated/popular
  // searches off the backend.
  return api.get<SearchResult>('/v1/search', {
    params,
    next: { revalidate: 300 },
  });
}
