import type { FavoritesData } from '@/lib/utils/favorites';

/** The most ids of each kind a question carries. */
export const FAVORITES_SNAPSHOT_MAX = 50;

/**
 * The `favorites` field of a chat request: the cookie's ids as stored, so Parky can tell what is
 * starred; `undefined` where nothing is.
 */
export function assistantFavoritesSnapshot(data: FavoritesData): FavoritesData | undefined {
  const cap = (ids: string[]) => ids.slice(0, FAVORITES_SNAPSHOT_MAX);
  const snapshot = {
    parks: cap(data.parks),
    attractions: cap(data.attractions),
    shows: cap(data.shows),
    restaurants: cap(data.restaurants),
  };
  return Object.values(snapshot).some((ids) => ids.length > 0) ? snapshot : undefined;
}
