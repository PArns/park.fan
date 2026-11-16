import { api } from './client';
import type { SearchResult } from './types';
import { readWithApiKey, type ApiKeyRefusal } from './keyed-read';

/** The entity kinds `/v1/search` can be filtered to. */
export type SearchType = 'park' | 'attraction' | 'show' | 'restaurant';

/** Search parks, attractions, shows and restaurants. */
export async function search(query: string, types?: SearchType[]): Promise<SearchResult> {
  const params: Record<string, string> = { q: query };
  if (types && types.length > 0) {
    params.type = types.join(',');
  }

  // `no-store`: the API's own cache headers (60 s) are the one cache, not a second one here.
  return api.get<SearchResult>('/v1/search', {
    params,
    cache: 'no-store',
  });
}

/**
 * {@link search} with a caller's own data key, so the API applies that key's permissions
 * (`parks.directory`) and allowance to it; an agent's search through park.fan's MCP server.
 */
export function searchWithApiKey(
  query: string,
  apiKey: string,
  types?: SearchType[]
): Promise<SearchResult | ApiKeyRefusal> {
  const params = new URLSearchParams({ q: query });
  if (types && types.length > 0) params.set('type', types.join(','));
  return readWithApiKey<SearchResult>(`/v1/search?${params}`, apiKey);
}
