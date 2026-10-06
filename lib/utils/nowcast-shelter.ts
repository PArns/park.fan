/**
 * When the nowcast says it is time to go under a roof: the trigger for the covered rides the park
 * page's nowcast banner offers. Read from the nowcast itself, not from the warning the banner
 * picked, because a storm warning can outrank rain in the banner while the rain is still there.
 * Pure: the caller passes the clock.
 */
import type { WeatherNowcast } from '@/lib/api/types';

/**
 * How far ahead (minutes) rain or a thunderstorm makes the banner offer covered rides: about the
 * time to cross a large park and join a queue. Further out the forecast start moves more than that
 * between updates.
 */
export const SHELTER_LEAD_MINUTES = 30;

type RainFields = Pick<WeatherNowcast, 'currentlyRaining' | 'rainStartsAt' | 'rainEndsAt'>;

const parse = (iso: string | null | undefined): number => (iso ? Date.parse(iso) : NaN);

/**
 * Whether rain is falling now. The API sets `rainStartsAt` only while rain is still ahead, so a
 * future start means it is not raining yet, however far off the end is.
 */
export function isRainingNow(data: RainFields, now: number): boolean {
  const startsTs = parse(data.rainStartsAt);
  const endsTs = parse(data.rainEndsAt);
  const startsInFuture = !Number.isNaN(startsTs) && startsTs > now;
  const endsInFuture = !Number.isNaN(endsTs) && endsTs > now;
  return !startsInFuture && (data.currentlyRaining || endsInFuture);
}

/** The start is known and at most {@link SHELTER_LEAD_MINUTES} away, or already past. */
const dueWithinLead = (iso: string | null | undefined, now: number): boolean => {
  const ts = parse(iso);
  return !Number.isNaN(ts) && ts - now <= SHELTER_LEAD_MINUTES * 60_000;
};

/**
 * Rain or a thunderstorm that is falling now or starts within {@link SHELTER_LEAD_MINUTES}. Storm
 * and hail alone are out of scope. A thunderstorm counts from its start for as long as the nowcast
 * carries it, as the banner shows one.
 */
export function offersShelter(
  data: RainFields & Pick<WeatherNowcast, 'thunderstormStartsAt'>,
  now: number
): boolean {
  if (dueWithinLead(data.thunderstormStartsAt, now)) return true;
  if (isRainingNow(data, now)) return true;
  return dueWithinLead(data.rainStartsAt, now);
}
