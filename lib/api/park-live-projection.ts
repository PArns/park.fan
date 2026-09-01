import type { ParkWithAttractions, ParkAttraction, ParkShow, ParkRestaurant } from './types';

/**
 * Cache tag for ONE park's structure fetch, so the backend can drop that park's entry alone.
 *
 * The day is the thing this exists for. Most of the snapshot survives 24 hours comfortably, but
 * `shows` and `restaurants` do not: the API answers with a show's showtimes FOR TODAY and forces
 * every show to CLOSED while the park is, so an entry written at 04:00 says "no performances,
 * everything shut" and — with nothing to replace it — went on saying that at 14:00. The backend
 * knows the moment a park opens or closes (it recomputes park status every five minutes anyway)
 * and POSTs this tag to `/api/revalidate` then, which costs one small request instead of a cron
 * sweeping 213 parks, and re-fetches only the ones somebody actually visits afterwards.
 *
 * The geo path, not the slug: slugs are unique per destination, not globally — `disneyland-park`
 * is both Anaheim and Paris, and they do not open at the same time. The string is the API URL
 * this tags, which is what keeps the two repos' copies of it recognizably the same thing.
 */
export function parkCacheTag(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): string {
  return `park:${continent}/${country}/${city}/${parkSlug}`;
}

/**
 * The park poll's response: only what can change between two polls.
 *
 * `useLiveParkData` re-downloads the park every 5 minutes for as long as a tab is open, and it
 * used to fetch the whole thing — 90 KB on Phantasialand, of which ~50 KB cannot move within five
 * minutes and is already sitting in the page the visitor is looking at:
 *
 *     attractions[] static  27.6 KB   restaurants[46]   9.7 KB
 *     schedule[17]           5.6 KB   shows[4]          1.3 KB
 *
 * So the poll answers with this projection instead and `mergeLiveParkSnapshot` lays it back over
 * the server-rendered park, which gives every consumer the same complete `ParkWithAttractions`
 * they had before. Identity fields (id/name/slug/land) ride along deliberately: they cost 4 KB and
 * they are what lets the poll still surface a ride that opened since the page was rendered,
 * instead of the merge silently dropping it.
 *
 * A field belongs here only if a five-minute-old value would be WRONG on screen. Ride photos are
 * the odd one out — `backgroundImage`/`backgroundPosition` are attached by the /api/parks proxy
 * (the media catalog can't cross into a Client Component), and the park page's cards genuinely
 * have no photo until this response lands.
 */
export interface LiveAttractionSnapshot {
  id: string;
  name: string;
  slug: string;
  land: string | null;
  status?: ParkAttraction['status'];
  /** Not on `ParkAttraction`; `attraction-card` reads it via an `in` check. */
  effectiveStatus?: ParkAttraction['status'];
  crowdLevel?: ParkAttraction['crowdLevel'];
  trend?: ParkAttraction['trend'];
  queues?: ParkAttraction['queues'];
  statistics?: ParkAttraction['statistics'];
  bestVisitTimes?: ParkAttraction['bestVisitTimes'];
  backgroundImage?: string | null;
  backgroundPosition?: string;
}

/**
 * The volatile half of a restaurant. Name, slug and coordinates come from the server render and
 * are what makes this worth projecting: the 46 restaurants of Phantasialand are 9.9 KB whole and
 * 3.1 KB reduced to what can move.
 */
export interface LiveRestaurantSnapshot {
  id: string;
  status?: ParkRestaurant['status'];
  waitTime?: ParkRestaurant['waitTime'];
  partySize?: ParkRestaurant['partySize'];
  operatingHours?: ParkRestaurant['operatingHours'];
}

export interface LiveParkSnapshot {
  status?: ParkWithAttractions['status'];
  timezone?: string;
  hasOperatingSchedule?: boolean;
  currentLoad?: ParkWithAttractions['currentLoad'];
  analytics?: ParkWithAttractions['analytics'];
  weather?: ParkWithAttractions['weather'];
  nextSchedule?: ParkWithAttractions['nextSchedule'];
  attractions: LiveAttractionSnapshot[];
  /**
   * The DAY-SCOPED block, and it rides only on a `?full=1` poll — see {@link
   * leanParkForLivePoll}. Absent on every other poll, which the merge reads as "keep what you
   * have" rather than "the park has no shows".
   */
  shows?: ParkShow[];
  restaurants?: LiveRestaurantSnapshot[];
}

/**
 * Project a park down to {@link LiveParkSnapshot}.
 *
 * Note what is NOT here. `schedule` looks live but every consumer already receives it as a prop
 * from the (per-request, force-dynamic) server render and falls back to that prop — the poll
 * copy was never the one on screen. `ropeDrop`/`typicalWaits`/`rideProfile` are derived from
 * months of history and move once a day at most. `comparison` and `baseline` come down from the
 * API on every attraction and nothing in the app has ever rendered them.
 *
 * `shows` and `restaurants` are the third case: they move once a day, not every five minutes, but
 * they DO move — and until `daily` existed nothing carried them, so whatever the shell fetch had
 * cached stood for the rest of the day. Written overnight (the usual case) that is a park with
 * yesterday's showtimes and every show forced to CLOSED, because the API reports a show as CLOSED
 * for as long as the park is. So the poll carries them on request: `daily` is set on the first
 * poll of a tab and roughly every half hour after it, which is what `?full=1` on the /api/parks
 * proxy means. The upstream cost is zero either way — the proxy fetches the whole park regardless
 * and used to drop this block on the floor.
 *
 * Shows go over whole, restaurants projected, and the asymmetry is about MEMBERSHIP: the API drops
 * a show that has no showtimes today, so the set itself is a daily fact and the merge replaces it
 * wholesale (4 shows are 1.25 KB, and a name is not optional when the card has nothing else to
 * render). Restaurants keep their membership and only their status moves, so name, slug and
 * coordinates stay in the server render — 9.9 KB against 3.1.
 */
export function leanParkForLivePoll(
  park: ParkWithAttractions,
  { daily = false }: { daily?: boolean } = {}
): LiveParkSnapshot {
  return {
    status: park.status,
    timezone: park.timezone,
    hasOperatingSchedule: park.hasOperatingSchedule,
    currentLoad: park.currentLoad,
    analytics: park.analytics,
    weather: park.weather,
    nextSchedule: park.nextSchedule,
    attractions: (park.attractions ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      land: a.land,
      status: a.status,
      effectiveStatus: (a as { effectiveStatus?: ParkAttraction['status'] }).effectiveStatus,
      crowdLevel: a.crowdLevel,
      trend: a.trend,
      queues: a.queues,
      statistics: a.statistics,
      bestVisitTimes: a.bestVisitTimes,
    })),
    ...(daily && {
      shows: park.shows ?? [],
      restaurants: (park.restaurants ?? []).map((r) => ({
        id: r.id,
        status: r.status,
        waitTime: r.waitTime,
        partySize: r.partySize,
        operatingHours: r.operatingHours,
      })),
    }),
  };
}

/**
 * Overlay the projected restaurant statuses onto the server-rendered list.
 *
 * Membership stays with `base`: a restaurant does not come or go over a day, so the projection
 * carries only what moves and the card keeps reading its name, slug and coordinates from the
 * server render. A poll without the block leaves the list exactly as it was.
 */
function mergeLiveRestaurants(
  base: ParkWithAttractions,
  live: LiveParkSnapshot
): ParkRestaurant[] | undefined {
  if (!Array.isArray(live.restaurants)) return base.restaurants;
  const liveById = new Map(live.restaurants.map((r) => [r.id, r]));
  return (base.restaurants ?? []).map((r) => {
    const update = liveById.get(r.id);
    return update ? { ...r, ...update } : r;
  });
}

/**
 * Lay a {@link LiveParkSnapshot} back over the server-rendered park.
 *
 * Attraction order and membership come from the SNAPSHOT (so a ride that opened, closed or was
 * renamed upstream still appears/disappears within one poll, exactly as when the poll returned
 * the whole park); the static fields for each one come from `base`. A ride the snapshot has and
 * `base` doesn't renders from the snapshot alone — it has name, slug, land and a photo, which is
 * everything the card needs.
 *
 * Shows follow the same rule as attractions and for the same reason — the API drops a show with
 * no showtimes today, so the set is a statement about today and the snapshot's copy wins whole.
 * Restaurants do not: see {@link mergeLiveRestaurants}. Both blocks are absent from most polls,
 * and absent means "unchanged", never "empty".
 *
 * Tolerant on purpose: with no `base` it returns the snapshot as-is (consumers that subscribe
 * without an `initialData` seed read only park-level live fields and carry their own props for
 * the rest), and passing a full park as the snapshot is a no-op, which is what makes it safe to
 * run over React Query's `initialData` before the first poll lands.
 */
export function mergeLiveParkSnapshot(
  base: ParkWithAttractions | undefined,
  live: LiveParkSnapshot
): ParkWithAttractions {
  if (!base) return live as unknown as ParkWithAttractions;
  // React Query seeds the cache with the full park, so the first `select` runs base over itself.
  // Returning it untouched keeps the attraction array's identity, which is what `LiveParkData`
  // compares to decide whether to re-group the grid by land.
  if ((live as unknown) === base) return base;
  if (!Array.isArray(live.attractions))
    return {
      ...base,
      ...live,
      attractions: base.attractions,
      restaurants: mergeLiveRestaurants(base, live),
    };

  const staticById = new Map(base.attractions.map((a) => [a.id, a]));
  return {
    ...base,
    ...live,
    attractions: live.attractions.map(
      (a) => ({ ...staticById.get(a.id), ...a }) as unknown as ParkAttraction
    ),
    restaurants: mergeLiveRestaurants(base, live),
  };
}
