import { rankByMatch } from '@/lib/utils/search-ranking';

/**
 * Hits from the site's fuzzy search and from the admin's own lookup as one list, ranked the way
 * the site ranks. The admin lookup finds what the public index leaves out (a curated name the
 * index has not picked up yet, a retired ride, a slug or a pasted id); where both find the same
 * entity, its admin fields win and the site's live status stays. Equal scores keep the fuzzy
 * order first.
 */
export function mergeSearchHits<T extends { id: string; name: string; status?: string }>(
  fuzzy: readonly T[],
  exact: readonly T[],
  query: string
): T[] {
  const byId = new Map<string, T>();
  for (const hit of fuzzy) byId.set(hit.id, hit);
  for (const hit of exact) byId.set(hit.id, { ...byId.get(hit.id), ...hit });
  return rankByMatch([...byId.values()], query).map(({ item }) => item);
}

/**
 * `matched` plus the entries of `pool` the fuzzy search found (`ids`, in its order) and the
 * plain match missed, so "phantsialand" still finds Phantasialand in a loaded list.
 */
export function withFuzzyMatches<T>(
  matched: readonly T[],
  pool: readonly T[],
  ids: readonly string[],
  key: (item: T) => string
): T[] {
  const seen = new Set(matched.map(key));
  const byKey = new Map(pool.map((item) => [key(item), item]));
  const extra = ids.flatMap((id) => {
    const item = byKey.get(id);
    if (!item || seen.has(id)) return [];
    seen.add(id);
    return [item];
  });
  return [...matched, ...extra];
}
