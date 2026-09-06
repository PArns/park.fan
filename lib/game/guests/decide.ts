/**
 * What a guest wants next.
 *
 * **Park visitors are not random walkers and they are not optimisers**, and the two failure modes
 * look different in a frame: a random walker produces a crowd with no shape at all, and an
 * optimiser produces one queue with everybody in it and an empty park around it. What is in here
 * is a utility score, a shortlist, and a weighted draw from the shortlist — so the busiest shop is
 * usually the nearest good one and sometimes is not, which is what a crowd does.
 *
 * Four terms are worth arguing with:
 *
 *  - **Distance is a walking cost in park minutes**, not a raw metre count, so a slow guest weighs
 *    the far shop more heavily than a fast one and a child gives up on the other end of the park.
 *  - **Every candidate carries a soft reservation** (`incoming`): a venue somebody is already
 *    walking to is worth slightly less to the next guest. Without it, one shop wins the argument
 *    for the entire crowd at once and the park pulses.
 *  - **Momentum.** A guest that has decided does not re-decide for `decideIn` park minutes unless
 *    a need crosses its own `criticalAt`. Re-scoring every tick makes guests turn round in the
 *    middle of the path, which reads as a bug even when it is optimal.
 *  - **Nothing to do is a real answer.** With no shops and no rides — the state of the demo park
 *    today — the shortlist is benches, sights and somewhere to walk, and the guest takes it. It
 *    does not stand still, and it does not pretend a bench answers hunger.
 *
 * Pure: no Babylon, no DOM, node-safe, and every random draw comes from the caller's `Rng`.
 */

import type { Rng } from '../core/rng';
import type { NeedModel } from './needs';
import type { GuestArchetypeDef } from './types';

export type VenueKind = 'shop' | 'ride' | 'seat' | 'sight' | 'wander' | 'gate';

export interface Venue {
  /** Entity id, or `w<n>` for a wander point, or `gate`. */
  id: string;
  kind: VenueKind;
  x: number;
  z: number;
  /** Which need columns this answers, and by how much on the 0..255 scale. */
  relief: Array<{ column: number; amount: number }>;
  /** Cents. */
  price: number;
  /** 0..10 from the manifest; a ride only. */
  excitement: number;
  /** Guests per park minute the venue can take. */
  throughput: number;
  /** Guests currently heading here. Decays as they arrive. */
  incoming: number;
}

export interface DecisionContext {
  venues: readonly Venue[];
  needs: NeedModel;
  archetype: GuestArchetypeDef;
  /** Guest's need row, 0..255. */
  levels: Float32Array;
  /** Offset of the guest's row in `levels`. */
  base: number;
  x: number;
  z: number;
  cash: number;
  /** Metres per park minute. */
  speed: number;
  /** The guest's own multipliers per need column, so a bored enthusiast wants a ride more. */
  needWeights: Float32Array;
  rng: Rng;
  /** The last venue id they went to; going straight back is worth less. */
  lastVenue: string;
}

export interface Decision {
  venue: Venue;
  score: number;
}

const SHORTLIST = 4;
/** Below this a candidate is not worth walking to at all. */
const FLOOR = 0.05;

/**
 * Urgency of one need, 0..1, rising sharply past the need's own `urgentAt`.
 *
 * Quadratic rather than linear because the interesting behaviour is all at the top: a guest at 120
 * of 255 hunger should mostly be doing something else, and one at 240 should be doing nothing but
 * looking for food. A linear ramp makes every guest mildly interested in everything, which is how
 * a crowd ends up evenly smeared over the park.
 */
export function urgency(level: number, urgentAt: number, criticalAt: number): number {
  if (level <= 0) return 0;
  const t = level / 255;
  const knee = urgentAt / 255;
  const base = t * t * 0.6;
  if (level < urgentAt) return base;
  const over = (level - urgentAt) / Math.max(1, criticalAt - urgentAt);
  return Math.min(1.6, base + Math.min(1.4, over) * (0.55 + knee * 0.2));
}

export function scoreVenue(ctx: DecisionContext, venue: Venue): number {
  const dx = venue.x - ctx.x;
  const dz = venue.z - ctx.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  // Walking cost in park minutes, which is what the guest is actually spending.
  const minutes = distance / Math.max(0.2, ctx.speed);

  let value = 0;
  for (const relief of venue.relief) {
    const need = ctx.needs.columns[relief.column];
    if (!need) continue;
    const level = ctx.levels[ctx.base + relief.column];
    const got = Math.min(level, relief.amount) / 255;
    value +=
      urgency(level, need.urgentAt, need.criticalAt) *
      got *
      need.moodWeight *
      ctx.needWeights[relief.column];
  }

  if (venue.kind === 'ride') {
    // A thrill preference is a match, not a maximum: a nervous visitor does not want the biggest
    // coaster in the park, and an enthusiast does not want the teacups.
    const want = ctx.archetype.thrill;
    const has = Math.min(1, venue.excitement / 8);
    value *= 0.5 + (1 - Math.abs(want - has)) * 0.9;
  }

  if (venue.kind === 'wander') value += 0.11;
  if (venue.kind === 'sight') value += 0.16;

  if (venue.price > 0) {
    if (ctx.cash < venue.price) return 0;
    // Money left after paying matters more than the price: 6.50 is nothing with 90 in your pocket
    // and everything with 8.
    const after = (ctx.cash - venue.price) / Math.max(1, ctx.cash);
    value *= 0.35 + after * 0.65;
  }

  // Queueing behind the people already on their way. `throughput` is per park minute, so this is
  // literally the wait the reservation implies.
  if (venue.throughput > 0 && venue.incoming > 0) {
    const wait = venue.incoming / venue.throughput;
    value *= 1 / (1 + wait / (6 + ctx.archetype.patience * 30));
  }

  if (venue.id === ctx.lastVenue) value *= 0.35;

  // The walk itself. A shop 30 s away and one 6 min away are not the same shop.
  return value / (1 + minutes / 9);
}

/**
 * Score every candidate, keep the best few, and draw one in proportion to its score.
 *
 * The shortlist is short on purpose. A softmax over the whole list gives a long tail of guests
 * walking to the worst thing in the park for no reason; a hard `argmax` gives an optimiser. Four
 * candidates weighted by score is the middle, and it is what makes two guests standing in the same
 * place walk off in different directions.
 */
export function decide(ctx: DecisionContext): Decision | null {
  const best: Decision[] = [];
  for (const venue of ctx.venues) {
    const score = scoreVenue(ctx, venue);
    if (score <= FLOOR) continue;
    if (best.length < SHORTLIST) {
      best.push({ venue, score });
      best.sort((a, b) => b.score - a.score);
      continue;
    }
    if (score > best[best.length - 1].score) {
      best[best.length - 1] = { venue, score };
      best.sort((a, b) => b.score - a.score);
    }
  }
  if (!best.length) return null;
  let total = 0;
  for (const entry of best) total += entry.score;
  let roll = ctx.rng.next() * total;
  for (const entry of best) {
    roll -= entry.score;
    if (roll <= 0) return entry;
  }
  return best[0];
}
