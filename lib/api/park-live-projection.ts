import type { ParkWithAttractions, ParkAttraction, ParkShow, ParkRestaurant } from './types';

/**
 * Cache tag for ONE park's structure fetch, so the backend can drop that park's entry alone. The
 * snapshot's shows carry today's showtimes and read CLOSED while the park is, so an entry written
 * overnight would say „everything shut" all day; the backend POSTs this tag to `/api/revalidate`
 * when a park opens or closes. The geo path, not the slug, since slugs repeat across cities; the
 * string is the API URL it tags, so both repos' copies stay recognizable.
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
 * One attraction in the park poll's response: only what can change between two polls. The poll
 * repeats every five minutes for as long as a tab is open, so the static half stays in the server
 * render and `mergeLiveParkSnapshot` lays this back over it. Identity fields ride along so a ride
 * that opened since the render still appears. A field belongs here only if a five-minute-old value
 * would be wrong on screen; photos are the exception, attached by the /api/parks proxy because the
 * media catalog cannot reach a Client Component. See docs/rules/api-budget-per-page.md.
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
  /**
   * The other half of the `crowdLevel` reading: the tooltip turns the badge into minutes with it.
   * The API sends it only while the ride has a live wait, so a render from before opening has none
   * and only the poll's copy can fill it in.
   */
  baseline?: ParkAttraction['baseline'];
  trend?: ParkAttraction['trend'];
  /**
   * Sent on EVERY poll, as `null` when absent: the merge spreads the snapshot over the static ride,
   * so an omitted key keeps the render's outage under an OPERATING badge, and JSON drops an
   * `undefined` key.
   */
  outage?: ParkAttraction['outage'] | null;
  /** Volatile the same way `outage` is, and on the wire as `null` for the same reason. */
  notRunToday?: ParkAttraction['notRunToday'];
  queues?: ParkAttraction['queues'];
  statistics?: ParkAttraction['statistics'];
  bestVisitTimes?: ParkAttraction['bestVisitTimes'];
  backgroundImage?: string | null;
  backgroundPosition?: string;
}

/**
 * The volatile half of a restaurant; name, slug and coordinates stay in the server render, which
 * is most of each record.
 */
export interface LiveRestaurantSnapshot {
  id: string;
  status?: ParkRestaurant['status'];
  waitTime?: ParkRestaurant['waitTime'];
  partySize?: ParkRestaurant['partySize'];
  operatingHours?: ParkRestaurant['operatingHours'];
}

/** The park poll's response: the live fields of a park and its attractions. */
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
   * The day-scoped block, sent only on a `?full=1` poll (see {@link leanParkForLivePoll}). Absent
   * means „keep what you have", not „the park has no shows".
   */
  shows?: ParkShow[];
  restaurants?: LiveRestaurantSnapshot[];
}

/**
 * Project a park down to {@link LiveParkSnapshot}.
 *
 * Left out: `schedule` (consumers read it from the server render's props), `ropeDrop`,
 * `typicalWaits` and `rideProfile` (they move once a day at most) and `comparison` (never
 * rendered). `shows` and `restaurants` move once a day, but they do move, so with `daily` (the
 * first poll of a tab and about every half hour after, `?full=1` on the proxy) they ride along at
 * no upstream cost. Shows go over whole because the API drops a show without showtimes today, so
 * membership itself is daily; restaurants keep their membership, so only their status moves.
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
      // Day-scoped, but on every poll: an omitted field keeps the server render's value, so a ride
      // coming into season would stay hidden for up to a day. One boolean per ride.
      isCurrentlyInSeason: a.isCurrentlyInSeason,
      crowdLevel: a.crowdLevel,
      // `null`, not `undefined`: JSON drops an undefined key, and an omitted key keeps the
      // previous poll's baseline under a ride that is no longer rated.
      baseline: a.baseline ?? null,
      trend: a.trend,
      // Always the key, and `null` rather than `undefined` so it survives JSON; see
      // LiveAttractionSnapshot.
      outage: a.outage ?? null,
      // The same rule, so a ride that has run since the render loses its „noch nicht" line.
      notRunToday: a.notRunToday ?? null,
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
 * Overlay the projected restaurant statuses onto the server-rendered list. Membership stays with
 * `base`; a poll without the block leaves the list as it was.
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
 * Attraction order and membership come from the snapshot, so a ride that opened or closed upstream
 * shows within one poll; static fields come from `base`. Shows follow the snapshot whole, for the
 * same reason; restaurants do not (see {@link mergeLiveRestaurants}). An absent block means
 * „unchanged". With no `base` it returns the snapshot, and a full park as the snapshot is a no-op,
 * so it is safe over React Query's `initialData`.
 */
export function mergeLiveParkSnapshot(
  base: ParkWithAttractions | undefined,
  live: LiveParkSnapshot
): ParkWithAttractions {
  if (!base) return live as unknown as ParkWithAttractions;
  // React Query seeds the cache with the full park, so the first `select` runs base over itself;
  // returning it untouched keeps the array identity `LiveParkData` compares before re-grouping.
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

/**
 * Trim for the serialized park on the park SUB-pages (calendar, wait-time record), which render
 * no attraction cards: only `ParkTodayPanel`'s headliner rows and `useParkTileItems` read
 * `park.attractions`, and they need a dozen fields. The poll returns the rest and
 * {@link mergeLiveParkSnapshot} lays it back, so nothing reachable is lost.
 *
 * An allow-list rather than a `delete` chain, so a field the API adds tomorrow stays out by
 * default. In this pure module (re-exported by `./parks`) so a node test can import it. Judge the
 * savings compressed.
 * See docs/rules/the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md.
 */
export function leanParkForCalendarShell(park: ParkWithAttractions): ParkWithAttractions {
  return {
    ...park,
    attractions: (park.attractions ?? []).map((a) => {
      const lean: ParkAttraction = {
        // Required by `ParkAttraction`, and the identity the live merge keys on.
        id: a.id,
        name: a.name,
        slug: a.slug,
        latitude: a.latitude,
        longitude: a.longitude,
        // `useParkTileItems` counts distinct lands for the ride tile's hint.
        land: a.land,
        // `getAttractionDisplayStatus` and `getStandbyWait`: the headliner rows and the tile hint.
        status: a.status,
        queues: a.queues,
        isHeadliner: a.isHeadliner,
        // `isInSeason`. Reads `isCurrentlyInSeason` alone, but a ride out of season is reported
        // by `effectiveStatus`, so the pair travels together.
        isSeasonal: a.isSeasonal,
        isCurrentlyInSeason: a.isCurrentlyInSeason,
      };
      // Not on `ParkAttraction`: the API adds it and consumers read it through an `in` check.
      const effectiveStatus = (a as { effectiveStatus?: ParkAttraction['status'] }).effectiveStatus;
      return effectiveStatus === undefined ? lean : { ...lean, effectiveStatus };
    }),
  };
}
