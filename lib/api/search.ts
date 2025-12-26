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

  return api.get<SearchResult>('/v1/search', {
    params,
    next: { revalidate: 60 },
  });
}
