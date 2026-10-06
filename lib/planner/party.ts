import { canRideAtHeight } from '@/lib/utils/rider-height';
import type { PlannerDayPrefs } from './types';

/**
 * Who is coming, and what that rules out: how tall the shortest rider is, and whether the group
 * would rather stay dry, asked once per day. Neither ever hides a ride: a flag says "this one has a
 * problem", while a filter would quietly shorten the park.
 */

/**
 * The heights the wizard offers, in centimetres: round tens, because the question is how tall the
 * child is, not which posted threshold applies. `riderHeightStops` derives a park's real thresholds
 * for the park page's slider.
 */
export const RIDER_HEIGHT_CHOICES = [90, 100, 110, 120, 130, 140] as const;

/**
 * Where the wizard's height row opens: typed as one of {@link RIDER_HEIGHT_CHOICES}, so a value
 * outside the chips (which once left all six unmarked while the plan held an answer) fails to
 * compile. 110 is about a five-year-old.
 */
export const RIDER_HEIGHT_DEFAULT_CM: (typeof RIDER_HEIGHT_CHOICES)[number] = 110;

/** A toddler and a tall adult. Anything outside is a typo or a joke. */
export const MIN_RIDER_CM = 50;
/** The tallest rider height accepted, in centimetres. */
export const MAX_RIDER_CM = 210;

/** What a ride has to carry for the two questions to be answerable. */
export interface PartyRideFacts {
  /** Minimum rider height in cm. Absent means nobody wrote one down. */
  minimumHeight?: number | null;
  /** Whether the ride may soak you. Absent is unknown, never "dry". */
  mayGetWet?: boolean | null;
}

/** What a party's answers say about one ride. */
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
 * What this ride's own facts say about this party, through `canRideAtHeight`, which reads a missing
 * limit as "nobody wrote one down". Only the minimum height is asked: the preference names the
 * shortest rider, and a maximum would flag a kiddie ride for the child it was built for.
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

/**
 * The wizard's chip for a height a park posts, e.g. 105 or 132 cm, rounded down, never up, so the
 * plan never flags less than the child's real height would. `null` below the lowest chip, where the
 * wizard's question stays unanswered rather than planning for a taller child.
 */
export function riderHeightChoiceFor(cm: number): (typeof RIDER_HEIGHT_CHOICES)[number] | null {
  let choice: (typeof RIDER_HEIGHT_CHOICES)[number] | null = null;
  for (const c of RIDER_HEIGHT_CHOICES) if (c <= cm) choice = c;
  return choice;
}

/** Inside the range a person can be. Used on the way in AND on the way out of storage. */
export function clampRiderHeight(cm: number): number {
  if (!Number.isFinite(cm)) return MIN_RIDER_CM;
  return Math.max(MIN_RIDER_CM, Math.min(MAX_RIDER_CM, Math.round(cm)));
}
