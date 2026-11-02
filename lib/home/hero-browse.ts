import { HERO_REST_ROWS_DESKTOP, HERO_REST_ROWS_PHONE } from '@/lib/home/hero-search';
import type { PopularPark, ScheduleSummary } from '@/lib/api/types';
import type { ParkWithDistance } from '@/types/nearby';
import type { NearbySearchExtras } from '@/lib/hooks/use-hero-browse-parks';

/**
 * Nearby parks the hero's resting lists need before popular parks fill them up: their rows have a
 * reserved height, and the nearby answer can come back shorter than that.
 */
export const BROWSE_MIN_PARKS = Math.max(HERO_REST_ROWS_DESKTOP, HERO_REST_ROWS_PHONE);

/**
 * The park's own API URL out of one of its rides' (`…/parks/<continent>/<country>/<city>/<park>/…`):
 * the in-park answer sends none for the park, and a row without one leads nowhere.
 */
export const parkUrlOfRide = (url: string | undefined): string | undefined =>
  url?.match(/^.*?\/parks(?:\/[^/]+){4}/)?.[0];

/** A shut park's schedule entries and its zone, for the status pill; nothing for an open park. */
export const shutParkSchedules = (park: {
  status: string;
  timezone: string;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
}): Pick<NearbySearchExtras, 'schedules' | 'timezone'> =>
  park.status === 'CLOSED'
    ? {
        schedules: { today: park.todaySchedule, next: park.nextSchedule },
        timezone: park.timezone,
      }
    : {};

/** Open parks first, then by distance. */
export function sortOpenFirst(parks: ParkWithDistance[]): ParkWithDistance[] {
  return [...parks].sort((a, b) => {
    const aOpen = a.status === 'OPERATING' ? 0 : 1;
    const bOpen = b.status === 'OPERATING' ? 0 : 1;
    return aOpen !== bOpen ? aOpen - bOpen : a.distance - b.distance;
  });
}

/** The popular parks that top a short nearby list up to {@link BROWSE_MIN_PARKS}, none already listed. */
export function popularFill(
  listed: { id: string }[],
  fallback: PopularPark[],
  minParks = BROWSE_MIN_PARKS
): PopularPark[] {
  if (listed.length >= minParks) return [];
  const ids = new Set(listed.map((park) => park.id));
  return fallback.filter((park) => !ids.has(park.id)).slice(0, minParks - listed.length);
}
