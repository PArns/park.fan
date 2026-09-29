/**
 * When the nowcast says it is time to go under a roof — the trigger for the covered rides the
 * park page's nowcast banner offers (PAR-425).
 *
 * Read from the nowcast itself, not from the warning the banner picked: a storm or hail warning
 * outranks rain in the banner, and a thunderstorm an hour out outranks rain that is falling now,
 * but the rain is still there.
 *
 * Pure: the caller passes the clock.
 */
import type { WeatherNowcast } from '@/lib/api/types';

/**
 * How far ahead (minutes) rain or a thunderstorm makes the banner offer covered rides. Thirty is
 * about what it takes to walk across a large park and join a queue; further out the forecast
 * start moves by more than that between two nowcast updates, and the rides it would point at
 * are the ones to ride before the rain, not during it.
 */
export const SHELTER_LEAD_MINUTES = 30;

type RainFields = Pick<WeatherNowcast, 'currentlyRaining' | 'rainStartsAt' | 'rainEndsAt'>;

const parse = (iso: string | null | undefined): number => (iso ? Date.parse(iso) : NaN);

/**
 * Whether rain is falling now. The API only sets `rainStartsAt` while rain is still ahead (it is
 * null once rain is already falling), so a future start means it is NOT raining yet — no matter
 * when it ends. Without this guard, a forecast that ends hours from now reads as "raining now".
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
 * Rain or a thunderstorm that is falling now or starts within {@link SHELTER_LEAD_MINUTES}.
 *
 * Storm and hail alone are not in it: the ticket that asked for the offer scoped it to rain and
 * thunderstorms. A thunderstorm counts from its start for as long as the nowcast carries it, the
 * same way the banner shows one; its end is not checked because the banner does not check it
 * either.
 */
export function offersShelter(
  data: RainFields & Pick<WeatherNowcast, 'thunderstormStartsAt'>,
  now: number
): boolean {
  if (dueWithinLead(data.thunderstormStartsAt, now)) return true;
  if (isRainingNow(data, now)) return true;
  return dueWithinLead(data.rainStartsAt, now);
}
