import type { AttractionResponse, AttractionStatus, ParkStatus } from '@/lib/api/types';
import type { ResolvedAttraction, ResolvedPark } from '@/lib/blog/park-resolver';
import type { LiveParkFields } from '@/lib/hooks/use-region-parks';
import type { LiveRideFields } from '@/lib/hooks/use-park-wait-times';

/**
 * Split a resolved park href (`/parks/{continent}/{country}/{city}/{parkSlug}`) back into its geo
 * parts — the shape every live endpoint is keyed by. Returns empty strings when the href isn't a
 * park path, which the hooks use to keep their queries disabled.
 */
export function parkGeoParts(park: ResolvedPark | null): {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
} {
  const parts = park?.href.split('/').filter(Boolean) ?? [];
  // parts = [parks, continent, country, city, parkSlug]
  if (parts.length < 5 || parts[0] !== 'parks') {
    return { continent: '', country: '', city: '', parkSlug: '' };
  }
  return { continent: parts[1], country: parts[2], city: parts[3], parkSlug: parts[4] };
}

/**
 * Lay the live region snapshot over a park resolved at build time.
 *
 * Every field here can change during the day, so a statically generated post must not keep
 * showing the values it was built with. Fields the live batch doesn't carry (name, geo, href)
 * stay as resolved. Returns the original object when there is no live data yet, so consumers
 * keep a stable identity until the first poll lands.
 */
export function overlayPark(park: ResolvedPark, live: LiveParkFields | undefined): ResolvedPark {
  if (!live) return park;
  return {
    ...park,
    status: live.status ?? park.status,
    crowdLevel: live.crowdLevel ?? park.crowdLevel,
    avgWaitTime: live.averageWaitTime ?? park.avgWaitTime,
    operatingAttractions: live.operatingAttractions ?? park.operatingAttractions,
    totalAttractions: live.totalAttractions ?? park.totalAttractions,
    timezone: live.timezone ?? park.timezone,
    hasOperatingSchedule: live.hasOperatingSchedule ?? park.hasOperatingSchedule,
    todaySchedule: live.todaySchedule ?? park.todaySchedule,
    nextSchedule: live.nextSchedule ?? park.nextSchedule,
  };
}

/**
 * Effective ride status — the same rule `resolveAttraction` applies on the server: a closed park
 * closes its rides (queue rows keep their last published value after closing time, so a ride can
 * still read OPERATING hours later), otherwise the ride's own live status wins.
 */
function effectiveStatus(
  parkStatus: ParkStatus | undefined,
  rideStatus: AttractionStatus | undefined
): AttractionStatus | undefined {
  if (parkStatus && parkStatus !== 'OPERATING') return 'CLOSED';
  return rideStatus;
}

/**
 * Lay live data over a ride resolved at build time.
 *
 * `live` is the lean whole-park batch (status + queues, one request for every ride in the post);
 * `detail` is the full attraction payload — today's average/peak and the sparkline series, which
 * the batch doesn't carry — fetched only for the cards that render them, and only once they're
 * actually on screen or hovered. Either may be absent; whatever is missing falls back to the
 * resolved snapshot.
 *
 * Status and wait always come from the batch when it has the ride, even though `detail` also
 * carries them: the batch polls every 5 minutes where the detail fetch is deliberately lazy, and
 * reading both from one source is what keeps a card's badge equal to the inline badge beside it
 * in the prose.
 */
export function overlayAttraction(
  attraction: ResolvedAttraction,
  park: ResolvedPark,
  live: LiveRideFields | undefined,
  detail?: AttractionResponse | null
): ResolvedAttraction {
  if (!live && !detail) return attraction;

  const detailStandby = detail?.queues?.find((q) => q.queueType === 'STANDBY');
  const detailWait =
    detailStandby && 'waitTime' in detailStandby ? (detailStandby.waitTime ?? null) : null;
  const queues = live?.queues ?? detail?.queues;
  const waitTime = live ? live.waitTime : detailWait;
  const status = effectiveStatus(
    park.status,
    live?.status ?? (detailStandby?.status as AttractionStatus | undefined) ?? detail?.status
  );
  const mergedDetail: AttractionResponse | null | undefined =
    attraction.detail || detail
      ? {
          ...(attraction.detail as AttractionResponse),
          ...(detail ?? {}),
          status: status ?? detail?.status ?? attraction.detail?.status,
          queues,
        }
      : attraction.detail;

  return {
    ...attraction,
    status: status ?? attraction.status,
    currentWaitTime: waitTime,
    // A build-time crowd level would outrank the live wait time in `buildAttractionPayload`'s
    // fallback, so it's dropped as soon as the batch supplies a fresh wait to derive from.
    crowdLevel: live ? undefined : detail?.currentLoad?.crowdLevel,
    detail: mergedDetail,
  };
}
