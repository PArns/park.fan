import type { FavoritesData } from '@/lib/utils/favorites';
import type { TemperatureUnit } from '@/lib/utils/temperature';

/**
 * What a visitor account carries across devices, and how two copies of it become one. Pure, so
 * `pnpm test:account-sync` pins it; the browser side is `lib/account/sync.ts`.
 */

/** The synced state: favorites by kind, rides marked as ridden, the temperature unit. */
export interface AccountState {
  favorites: FavoritesData;
  riddenRides: string[];
  temperatureUnit: TemperatureUnit | null;
}

/** The state as `GET /api/account` answers it, with when it was last written. */
export interface AccountServerState extends AccountState {
  updatedAt: string | null;
}

/** What this browser last agreed with the account: whose it was, and as of when. */
export interface AccountSyncRecord {
  email: string;
  syncedAt: string | null;
}

/** Each id once, the first copy's order first. */
function union(first: readonly string[], second: readonly string[]): string[] {
  return [...new Set([...first, ...second])];
}

/**
 * The first sync of a browser with an account: nothing is lost, so the favorites and ridden rides
 * of both sides are kept, and a unit picked here wins over the account's.
 */
export function mergeAccountState(local: AccountState, server: AccountState): AccountState {
  return {
    favorites: {
      parks: union(local.favorites.parks, server.favorites.parks),
      attractions: union(local.favorites.attractions, server.favorites.attractions),
      shows: union(local.favorites.shows, server.favorites.shows),
      restaurants: union(local.favorites.restaurants, server.favorites.restaurants),
    },
    riddenRides: union(local.riddenRides, server.riddenRides),
    temperatureUnit: local.temperatureUnit ?? server.temperatureUnit,
  };
}

/** Both hold the same ids and unit, whatever the order. */
export function sameAccountState(a: AccountState, b: AccountState): boolean {
  const same = (x: readonly string[], y: readonly string[]) =>
    x.length === y.length && x.every((id) => y.includes(id));
  return (
    same(a.favorites.parks, b.favorites.parks) &&
    same(a.favorites.attractions, b.favorites.attractions) &&
    same(a.favorites.shows, b.favorites.shows) &&
    same(a.favorites.restaurants, b.favorites.restaurants) &&
    same(a.riddenRides, b.riddenRides) &&
    a.temperatureUnit === b.temperatureUnit
  );
}

/** What a browser does when it meets its account's state. */
export type AccountSyncStep =
  { kind: 'merge'; state: AccountState } | { kind: 'pull' } | { kind: 'push' } | { kind: 'none' };

/**
 * Decides between merging, taking the account's copy and sending this browser's: a browser that
 * never synced with this account merges; one whose account changed since its last sync, on
 * another device, takes the account's copy; otherwise this browser's copy is the newer one and
 * goes up, unless the two already agree.
 */
export function accountSyncStep(
  record: AccountSyncRecord | null,
  email: string,
  local: AccountState,
  server: AccountServerState
): AccountSyncStep {
  if (!record || record.email !== email) {
    return { kind: 'merge', state: mergeAccountState(local, server) };
  }
  const serverNewer =
    server.updatedAt !== null &&
    (record.syncedAt === null || Date.parse(server.updatedAt) > Date.parse(record.syncedAt));
  if (serverNewer) return { kind: 'pull' };
  return sameAccountState(local, server) ? { kind: 'none' } : { kind: 'push' };
}
