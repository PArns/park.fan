import { canRideAtHeight } from '@/lib/utils/rider-height';
import type { PlannerDayPrefs } from './types';

/**
 * Who is coming, and what that rules out.
 *
 * The planner asks two questions about the party once, for the whole day, and
 * then every ride in the plan can answer against them: how tall the SHORTEST
 * rider is, and whether the group would rather stay dry. Both are stored per
 * day rather than per park or per browser, because they are properties of a
 * trip — the same family goes back in October without the four-year-old.
 *
 * Neither ever HIDES a ride. A flag says "this one has a problem"; a filter
 * would quietly shorten the park, and the visitor is the one who knows whether
 * grandma is holding the bags at the exit.
 */

/**
 * The heights the wizard offers, in centimetres.
 *
 * Round tens, not the thresholds parks post (95, 105, 120, 132…): the question
 * is how tall the child IS, which is a number a parent knows to the nearest
 * measurement on a door frame. `riderHeightStops` derives a park's real
 * thresholds and is the right tool for the park page's slider, where the
 * question is the other way round — it needs the park's attraction list, which
 * the planner does not have until the day payload arrives.
 */
export const RIDER_HEIGHT_CHOICES = [90, 100, 110, 120, 130, 140] as const;

/**
 * Where the wizard's height row opens, in centimetres.
 *
 * It has to be one of {@link RIDER_HEIGHT_CHOICES}, and the TYPE is what
 * enforces that: the wizard used to open on `105` — "the commonest threshold in
 * a European park", which is true of the numbers PARKS post and irrelevant to a
 * row of round tens — so switching the question on showed six chips with none of
 * them marked while the plan already held 105 cm. A visitor reading that has
 * been asked a question, has not answered it, and is being flagged against an
 * answer they cannot see. Annotated rather than inferred so the next edit to the
 * list either keeps this value in it or fails to compile.
 *
 * 110 is the middle of the offered range and about a five-year-old, which is the
 * shortest rider the question is usually being asked about.
 */
export const RIDER_HEIGHT_DEFAULT_CM: (typeof RIDER_HEIGHT_CHOICES)[number] = 110;

/** A toddler and a tall adult. Anything outside is a typo or a joke. */
export const MIN_RIDER_CM = 50;
export const MAX_RIDER_CM = 210;

/** What a ride has to carry for the two questions to be answerable. */
export interface PartyRideFacts {
  /** Minimum rider height in cm. Absent means nobody wrote one down. */
  minimumHeight?: number | null;
  /** Whether the ride may soak you. Absent is unknown, never "dry". */
  mayGetWet?: boolean | null;
}

export interface PartyFlags {
  /** The shortest rider in the party is under this ride's minimum. */
  tooShort: boolean;
  /** The party asked to stay dry and this ride is a water ride. */
  wet: boolean;
}

const NONE: PartyFlags = { tooShort: false, wet: false };

/** True where the party has been described at all. */
export function hasPartyPrefs(prefs: PlannerDayPrefs | undefined): boolean {
  if (!prefs) return false;
  return prefs.riderHeightCm !== undefined || prefs.avoidWet === true;
}

/**
 * What this ride's own facts say about this party.
 *
 * Through `canRideAtHeight`, which is the park page's height filter and already
 * treats a missing limit as "nobody wrote one down" rather than as a refusal —
 * the `!== false` rule this codebase applies to seasons too. Only the MINIMUM
 * is asked about: `maximumHeight` is a statement about the tallest rider and
 * this preference names the shortest, so passing it through would flag a
 * kiddie ride as unridable for the four-year-old it was built for.
 */
export function partyFlags(ride: PartyRideFacts, prefs: PlannerDayPrefs | undefined): PartyFlags {
  if (!prefs) return NONE;
  const tooShort =
    prefs.riderHeightCm !== undefined &&
    !canRideAtHeight({ minimumHeight: ride.minimumHeight }, prefs.riderHeightCm);
  const wet = prefs.avoidWet === true && ride.mayGetWet === true;
  if (!tooShort && !wet) return NONE;
  return { tooShort, wet };
}

/** Inside the range a person can be. Used on the way in AND on the way out of storage. */
export function clampRiderHeight(cm: number): number {
  if (!Number.isFinite(cm)) return MIN_RIDER_CM;
  return Math.max(MIN_RIDER_CM, Math.min(MAX_RIDER_CM, Math.round(cm)));
}
