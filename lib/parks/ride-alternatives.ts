import { calculateDistance } from '@/lib/utils/distance-utils';
import { roundWaitTo5 } from '@/lib/utils/wait-time';

/** An alternative must save at least this many minutes (on the displayed, rounded waits). */
export const MIN_ALTERNATIVE_SAVING_MIN = 15;

/** How many alternatives the ride page names. */
export const MAX_ALTERNATIVES = 3;

/** One ride in the park, as the ranking reads it. */
export interface AlternativeCandidate {
  slug: string;
  name: string;
  /** Standby wait in minutes; `null` for a ride that is not open or reports none. */
  wait: number | null;
  latitude: number | null;
  longitude: number | null;
  /** Ride-type terms from the ride profile; empty when the profile is not filled in. */
  types: readonly string[];
  minimumHeight: number | null;
}

/** A ranked alternative, with the numbers the row prints. */
export interface RideAlternative {
  slug: string;
  name: string;
  /** Metres from the ride the visitor is looking at; `null` when either has no coordinates. */
  distance: number | null;
  /** Rounded standby wait. */
  wait: number;
  /** Rounded wait of the current ride minus {@link RideAlternative.wait}, at least 15. */
  saving: number;
  minimumHeight: number | null;
  sameType: boolean;
}

/**
 * Up to three open rides of the same park that are at least 15 minutes shorter than the ride the
 * visitor is looking at: same ride type first, then the rest, each group nearest first. A ride
 * with a higher minimum height stays in, and the row says so. Empty when the current ride has no
 * wait or none of the others saves enough, so the page draws no heading.
 *
 * The saving is the difference of the two printed waits, not the raw gap rounded on its own.
 */
export function rankRideAlternatives(
  current: Omit<AlternativeCandidate, 'name' | 'minimumHeight'>,
  candidates: readonly AlternativeCandidate[]
): RideAlternative[] {
  if (current.wait == null) return [];
  const currentWait = roundWaitTo5(current.wait);
  const hasPosition = current.latitude != null && current.longitude != null;

  const ranked: RideAlternative[] = [];
  for (const c of candidates) {
    if (c.slug === current.slug || c.wait == null) continue;
    const wait = roundWaitTo5(c.wait);
    const saving = currentWait - wait;
    if (saving < MIN_ALTERNATIVE_SAVING_MIN) continue;
    const distance =
      hasPosition && c.latitude != null && c.longitude != null
        ? calculateDistance(current.latitude!, current.longitude!, c.latitude, c.longitude)
        : null;
    ranked.push({
      slug: c.slug,
      name: c.name,
      distance,
      wait,
      saving,
      minimumHeight: c.minimumHeight,
      sameType: c.types.some((type) => current.types.includes(type)),
    });
  }

  // A ride without coordinates cannot be near anything, so it sorts after the ones that can.
  const byDistance = (a: RideAlternative, b: RideAlternative) =>
    (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.name.localeCompare(b.name);
  return ranked
    .sort((a, b) => Number(b.sameType) - Number(a.sameType) || byDistance(a, b))
    .slice(0, MAX_ALTERNATIVES);
}
