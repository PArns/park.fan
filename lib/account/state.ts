import type { FavoritesData } from '@/lib/utils/favorites';
import type { TemperatureUnit } from '@/lib/utils/temperature';
import type { VisitedPark } from '@/lib/trip-regions/visited-parks';

/**
 * What a visitor account carries across devices, and how two copies of it become one. Pure, so
 * `pnpm test:account-sync` pins it; the browser side is `lib/account/sync.ts`.
 */

/**
 * The synced state: favorites by kind, rides marked as ridden, the parks ticked off as visited on
 * a trip, the temperature unit.
 */
export interface AccountState {
  favorites: FavoritesData;
  riddenRides: string[];
  visitedParks: VisitedPark[];
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

/** Each region's park once, with the later date: the trip that tick belongs to. */
function latestVisits(visits: readonly VisitedPark[]): VisitedPark[] {
  const kept = new Map<string, VisitedPark>();
  for (const { region, park, date } of visits) {
    const known = kept.get(`${region}:${park}`);
    if (!known || date > known.date) kept.set(`${region}:${park}`, { region, park, date });
  }
  return [...kept.values()];
}

/**
 * The first sync of a browser with an account: nothing is lost, so the favorites, ridden rides and
 * visited parks of both sides are kept (a park ticked on both, with the later date), and a unit
 * picked here wins over the account's.
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
    visitedParks: latestVisits([...local.visitedParks, ...server.visitedParks]),
    temperatureUnit: local.temperatureUnit ?? server.temperatureUnit,
  };
}

/** A visit as one comparable string. */
const visitKey = (visit: VisitedPark) => `${visit.region}:${visit.park}:${visit.date}`;

/** Both hold the same ids, visits and unit, whatever the order. */
export function sameAccountState(a: AccountState, b: AccountState): boolean {
  const same = (x: readonly string[], y: readonly string[]) =>
    x.length === y.length && x.every((id) => y.includes(id));
  return (
    same(a.favorites.parks, b.favorites.parks) &&
    same(a.favorites.attractions, b.favorites.attractions) &&
    same(a.favorites.shows, b.favorites.shows) &&
    same(a.favorites.restaurants, b.favorites.restaurants) &&
    same(a.riddenRides, b.riddenRides) &&
    same(a.visitedParks.map(visitKey), b.visitedParks.map(visitKey)) &&
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
