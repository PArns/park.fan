import type { FavoritesData } from '@/lib/utils/favorites';
import { isUuid } from '@/lib/utils';

/** The most ids of each kind a question carries. */
export const FAVORITES_SNAPSHOT_MAX = 50;

/**
 * The `favorites` field of a chat request: the cookie's ids as stored, so Parky can tell what is
 * starred; only UUIDs, which is all the API takes. `undefined` where nothing is.
 */
export function assistantFavoritesSnapshot(data: FavoritesData): FavoritesData | undefined {
  const cap = (ids: string[]) => ids.filter(isUuid).slice(0, FAVORITES_SNAPSHOT_MAX);
  const snapshot = {
    parks: cap(data.parks),
    attractions: cap(data.attractions),
    shows: cap(data.shows),
    restaurants: cap(data.restaurants),
  };
  return Object.values(snapshot).some((ids) => ids.length > 0) ? snapshot : undefined;
}

/** The most ridden rides a question carries: the API's `RIDDEN_SNAPSHOT_MAX`. */
export const RIDDEN_SNAPSHOT_MAX = 300;

/**
 * The `ridden` field of a chat request: the rides this browser marked as ridden, UUIDs only, the
 * newest marks when there are more than the API takes (a mark lands at the end of the store).
 * `undefined` where none is marked.
 */
export function assistantRiddenSnapshot(ridden: ReadonlySet<string>): string[] | undefined {
  const ids = [...ridden].filter(isUuid);
  return ids.length > 0 ? ids.slice(-RIDDEN_SNAPSHOT_MAX) : undefined;
}
