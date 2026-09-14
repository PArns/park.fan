/**
 * What a coaster is worth to a visitor, computed from the ride it actually gives.
 *
 * Every coaster in this game scored **excitement 6** — `rides/manifest.ts`'s `def.excitement ?? 6`
 * — because no pack declares one, so a 979 m hyper and a 345 m family twister were the same
 * attraction to the simulation, and building a better ride changed nothing about who came. That
 * is the hole this file fills, and the fix is not "let a pack type a number": the layout is where
 * the answer already is. `physics.ts` marches the train and reports speed, drop, airtime, jerk and
 * every g-force, so the rating is MEASURED off the machine rather than asserted about it.
 *
 * ## The thresholds are the module's own
 *
 * Nothing here invents a comfort number. `DEFAULT_LIMITS` (vertical 5.0 g, lateral 2.6 g, negative
 * −1.6 g) is what `physics.ts` already judges a layout against and what a ride definition may
 * override, so intensity is expressed as a FRACTION of the limits that apply to this ride. A
 * coaster at its own limit is at intensity 10 whether it is a wooden family ride with a 3 g
 * ceiling or a launched machine with 6.
 *
 * ## Why excitement is not just "faster is better"
 *
 * Three things a rider actually reports, in the proportions the design literature puts them:
 *
 * - **Airtime** is the single most cited reason enthusiasts rank a coaster highly, and it is the
 *   one thing you cannot get from speed alone — a fast flat turn has none. `physics.ts` already
 *   counts the seconds below 0.3 g.
 * - **Drop and speed** are what a first-time rider sees from the queue and feels in the first ten
 *   seconds.
 * - **Variety** — the spread between the highest and lowest vertical g — separates a layout that
 *   does something from one that holds a single sensation for forty seconds. Taron's flat 60/60/54
 *   hour profile against Chiapas climbing 22 minutes is the same observation one level up.
 *
 * And it is **capped by intensity**, not raised by it. Past the comfort limits a ride stops being
 * exciting and starts being punishing: the excitement curve turns over at 1.0 of the limit rather
 * than running away, which is why a layout that pulls 6 g does not out-score one that pulls 4.5.
 *
 * ## Nausea is lateral, not vertical
 *
 * Sideways force and roll rate are what empty a stomach; a straight drop does not. So nausea reads
 * `maxLateralG` and `maxRollRateDegPerSec`, and a long ride multiplies it because time under
 * sustained lateral load is the mechanism.
 *
 * Pure arithmetic over a `TrackPhysics`. No registry, no world, no Babylon: it is called from the
 * worker to price a ride and from a test to pin it.
 */

import type { ComfortLimits, TrackPhysics } from './physics';
import { DEFAULT_LIMITS } from './types';

export interface CoasterRating {
  /** 0..10, what a visitor would tell a friend. */
  excitement: number;
  /** 0..10 as a fraction of the limits that apply to THIS ride, so 10 is at its own ceiling. */
  intensity: number;
  /** 0..10. */
  nausea: number;
}

/** Metres per second at which speed alone has given all it has. ~100 km/h. */
const SPEED_FULL = 28;
/** Metres of drop at which the same is true. */
const DROP_FULL = 45;
/** Seconds of airtime a layout has to find to score the whole of that term. */
const AIRTIME_FULL = 8;
/** Metres of track past which length stops adding — a lap, not a marathon. */
const LENGTH_FULL = 900;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const round1 = (v: number): number => Math.round(v * 10) / 10;

/**
 * Rate a built layout.
 *
 * `limits` are the ones the ride definition carries, so the same track under a family ride's
 * ceiling and a launched coaster's rates differently — which is correct, because the same forces
 * mean different things to the people the machine was built for.
 */
export function rateCoaster(
  physics: TrackPhysics,
  limits: ComfortLimits = DEFAULT_LIMITS
): CoasterRating {
  // ── intensity: how close it runs to the limits that apply to it ─────────────────────────────
  const vertical = clamp01(physics.maxVerticalG / Math.max(0.1, limits.vertical));
  const lateral = clamp01(physics.maxLateralG / Math.max(0.1, limits.lateral));
  const negative = clamp01(physics.minVerticalG / Math.min(-0.1, limits.negative));
  /**
   * **Jerk is deliberately not in this.**
   *
   * It belongs in an intensity score — jerk is what a rider calls "rough" rather than "strong" —
   * and it was in the first version at `clamp01(maxJerk / 4)`. Measured over the four shipped
   * layouts, `maxJerk` runs **5.77, 8.87, 10.48 and 15.51 m/s³**, so every one of them saturated
   * that term and it contributed a constant 0.1 to all four: a discriminator that discriminates
   * nothing. The fix is not to raise the threshold until the numbers spread, which would be
   * fitting a constant to this repo's own four layouts and calling it physics.
   *
   * What is actually unknown is whether `maxJerk` means what the name says here: it is a peak
   * over a 0.5 m march, and a spike at a junction between two pieces is as likely an explanation
   * as anything a rider would feel. That is a question for `physics.ts` with its own measurement,
   * and it is filed rather than papered over. The three terms below are ones whose scale IS
   * anchored — each is a fraction of a comfort limit this ride declares.
   */
  const intensity = 10 * clamp01(vertical * 0.5 + lateral * 0.28 + negative * 0.22);

  // ── excitement: what it gives, capped by what it costs ──────────────────────────────────────
  const speed = clamp01(physics.maxSpeed / SPEED_FULL);
  const drop = clamp01(physics.maxDrop / DROP_FULL);
  const airtime = clamp01(physics.airtimeSeconds / AIRTIME_FULL);
  const length = clamp01(physics.runLength / LENGTH_FULL);
  const variety = clamp01((physics.maxVerticalG - physics.minVerticalG) / 4);
  const raw = speed * 0.24 + drop * 0.22 + airtime * 0.24 + variety * 0.18 + length * 0.12;

  /**
   * The turn-over. Below the limits, intensity helps; past them it hurts, and hard.
   *
   * A ride at exactly its ceiling keeps all of its excitement; one at 1.4x of it keeps 60 %. The
   * alternative — letting excitement rise with force without bound — is what makes a builder's
   * best move "add another loop", which is not how anybody who has ridden a badly over-banked
   * corner remembers it.
   */
  const over = Math.max(0, intensity / 10 - 1);
  const punish = 1 - Math.min(0.6, over * 1.5);
  // A layout with no station march is not a ride yet; `complete` is physics.ts's own word for it.
  const excitement = physics.complete ? 10 * raw * punish : 0;

  // ── nausea: sideways and rolling, over time ─────────────────────────────────────────────────
  const roll = clamp01(physics.maxRollRateDegPerSec / 120);
  const duration = clamp01(physics.rideTimeSeconds / 120);
  const nausea = 10 * clamp01((lateral * 0.55 + roll * 0.25) * (0.7 + 0.3 * duration));

  return {
    excitement: round1(Math.min(10, excitement)),
    intensity: round1(Math.min(10, intensity)),
    nausea: round1(Math.min(10, nausea)),
  };
}
