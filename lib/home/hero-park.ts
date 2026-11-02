import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { stripNewPrefix } from '@/lib/utils';
import { IN_PARK_FALLBACK_DISTANCE_M } from '@/types/nearby';
import type { HeroPark } from '@/components/home/hero-park-actions';
import type {
  NearbyAttractionsData,
  NearbyParkInfo,
  NearbyParksData,
  NearbyResponse,
  ParkWithDistance,
} from '@/types/nearby';

/** Only show the "park is nearby" variant when the nearest park is within this (m). */
const NEAR_PARK_HERO_RADIUS_M = 5000;

/**
 * The park the homepage hero is about: the one the visitor stands in (`in_park`, or a nearby
 * answer whose nearest park is within 1 km), or one within 5 km (`near_park`).
 */
export interface HeroParkVariant {
  kind: 'in_park' | 'near_park';
  park: HeroPark;
}

/** The two nearby shapes, reduced to what the hero's park block reads. */
function heroPark(park: NearbyParkInfo | ParkWithDistance, geo: HeroPark['geo']): HeroPark {
  return {
    slug: park.slug,
    name: stripNewPrefix(park.name),
    geo,
    timezone: park.timezone,
    status: park.status,
    todaySchedule: park.todaySchedule,
    nextSchedule: park.nextSchedule,
    operatingAttractions:
      'operatingAttractions' in park
        ? park.operatingAttractions
        : (park.analytics?.operatingAttractions ?? null),
    backgroundImage: park.backgroundImage,
    backgroundPosition: park.backgroundPosition,
  };
}

/** {@link HeroParkVariant} out of a nearby answer, or `null` for a visitor near no park. */
export function resolveHeroPark(data: NearbyResponse | undefined): HeroParkVariant | null {
  if (data?.type === 'in_park') {
    const { park, rides } = data.data as NearbyAttractionsData;
    // `in_park` sends no URL for the park itself, so its slugs are read off a ride's: every ride
    // names the same four.
    const geo =
      parkGeoFromUrl(park.url) ??
      rides.reduce<HeroPark['geo']>((found, ride) => found ?? parkGeoFromUrl(ride.url), null);
    return { kind: 'in_park', park: heroPark(park, geo) };
  }
  const nearest =
    data?.type === 'nearby_parks' ? (data.data as NearbyParksData).parks[0] : undefined;
  if (!nearest) return null;
  if (nearest.distance <= IN_PARK_FALLBACK_DISTANCE_M) {
    return { kind: 'in_park', park: heroPark(nearest, parkGeoFromUrl(nearest.url)) };
  }
  if (nearest.distance <= NEAR_PARK_HERO_RADIUS_M) {
    return { kind: 'near_park', park: heroPark(nearest, parkGeoFromUrl(nearest.url)) };
  }
  return null;
}
