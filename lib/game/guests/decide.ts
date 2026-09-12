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
 *  - **Nothing to do is a real answer.** With no rides in the park — the state of the demo park
 *    today — the shortlist is shops, benches, sights and somewhere to walk, and the guest takes
 *    it. It does not stand still, and it does not pretend a bench answers hunger.
 *
 * The candidate list is not all one thing. Benches, sights and wander points are built from the
 * entities by `sim.ts`; a shop is an OFFER from the `shops` module, carrying its own frontage point
 * and the wait at its own counters, and it is appended per decision rather than indexed — see
 * `shopCandidates`. Everything below scores the two the same way, which is the point of keeping
 * `Venue` a plain record.
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
  /**
   * A wait somebody else has already measured, in park minutes.
   *
   * `incoming / throughput` is this module's own guess at a queue — how many people said they were
   * coming, over how fast the thing serves — and it is the best a guest can do about a venue that
   * simulates nothing. A shop does simulate it: `shops.find()` answers with the wait of a real line
   * at a real counter, tills and all, and a guess standing next to a measurement is just a worse
   * measurement. So when this is set it REPLACES the estimate rather than adding to it, and the
   * arithmetic below is unchanged for every venue that leaves it undefined.
   */
  waitMinutes?: number;
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

/**
 * Metres of walk that halve a venue's worth.
 *
 * Swept on the demo park over a whole park day, reading interactions per visitor and the refusals
 * that a wasted walk produces:
 *
 *   30 m → 1.02   full 113    45 m → 1.15   full 202    60 m → 1.25   full 653
 *   90 m → 1.34   full 928   140 m → 1.23   full 557
 *
 * The top is flat between 60 and 90 and falls away on both sides, so the number is not delicate.
 * 60 is the near end of that plateau on purpose: 90 buys 7 % more interactions and 42 % more `full`
 * refusals, and a `full` refusal is somebody who crossed the park to a counter that could not take
 * them. Past 140 the walk stops being weighed at all and guests start out-walking their own day.
 */
const WALK_TOLERANCE = 60;

/**
 * A venue somebody goes to because there is nothing they would rather do.
 *
 * `wander` is a path node and `sight` is something to look at; neither answers a need, so neither
 * can ever be OUTRANKED by one on the arithmetic below — their score is a flat constant while a
 * need's is a product of terms that are each below 1. They are not competitors, they are what is
 * left when nothing clears the floor, and `decide` treats them as a second tier for that reason.
 */
function isFallback(venue: Venue): boolean {
  return venue.kind === 'wander' || venue.kind === 'sight';
}
/**
 * Below this a candidate is not worth walking to at all.
 *
 * Exported because `sim.ts` uses it as the gate on asking `shops.find()` at all. Every factor
 * `scoreVenue` applies after the relief term is `≤ 1` — the price penalty, the wait penalty and the
 * walk — so a need whose relief term alone is under the floor cannot produce a candidate that
 * clears it, whatever shop answers. Skipping the query in that case is exact rather than a
 * heuristic, and it is what keeps the query off the hot path: a guest asks about the one or two
 * needs that are actually pressing, not about all seven, every time it re-plans.
 */
export const FLOOR = 0.05;

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
  // Both numbers are why the tiers below exist rather than a scale to be tuned. They are a flat
  // addition to a value that is otherwise a product of small factors, and a need's whole term is
  // `urgency x got x moodWeight x weight`: at 200 of 255 hunger — past `urgentAt`, a guest who
  // should be looking for nothing but food — a burger van 40 m off scores about 0.065 against a
  // path node's 0.071. So the flat bonus does not nudge the wandering, it wins the argument, and
  // over a whole park day it won 85 % of it: measured on the demo park, 85 % of the population was
  // IDLE at 10:00 and the day delivered 0.45 interactions per visitor.

  if (venue.price > 0) {
    if (ctx.cash < venue.price) return 0;
    // Money left after paying matters more than the price: 6.50 is nothing with 90 in your pocket
    // and everything with 8.
    const after = (ctx.cash - venue.price) / Math.max(1, ctx.cash);
    value *= 0.35 + after * 0.65;
  }

  // Queueing behind the people already on their way. `throughput` is per park minute, so the
  // fallback is literally the wait the reservation implies; `waitMinutes` is a real line, measured.
  const wait =
    venue.waitMinutes ??
    (venue.throughput > 0 && venue.incoming > 0 ? venue.incoming / venue.throughput : 0);
  if (wait > 0) {
    value *= 1 / (1 + wait / (6 + ctx.archetype.patience * 30));
  }

  if (venue.id === ctx.lastVenue) value *= 0.35;

  // The walk itself, weighed in METRES rather than in the park minutes it takes.
  //
  // That is the one place D-006's compression leaks into a preference. `speed` is 1.0-1.5 m per
  // PARK minute, so a kiosk forty metres off is a thirty-two-minute walk on the clock the scorer
  // was dividing by, and against a tolerance written as nine minutes it lost by a factor of 4.6 —
  // to a path node two metres away that answers no need at all. The distance is what a person
  // actually weighs when they look across a plaza, and it does not change when the clock does.
  // `WALK_TOLERANCE` is that look: sixty metres is worth about half.
  return value / (1 + distance / WALK_TOLERANCE);
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
  const wanted: Decision[] = [];
  const otherwise: Decision[] = [];
  for (const venue of ctx.venues) {
    const score = scoreVenue(ctx, venue);
    if (score <= FLOOR) continue;
    keep(isFallback(venue) ? otherwise : wanted, { venue, score });
  }
  const list = wanted.length ? wanted : otherwise;
  if (!list.length) return null;
  let total = 0;
  for (const entry of list) total += entry.score;
  let roll = ctx.rng.next() * total;
  for (const entry of list) {
    roll -= entry.score;
    if (roll <= 0) return entry;
  }
  return list[0];
}

/** Keep the best `SHORTLIST` of one tier, highest first. */
function keep(list: Decision[], entry: Decision): void {
  if (list.length < SHORTLIST) {
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    return;
  }
  if (entry.score > list[list.length - 1].score) {
    list[list.length - 1] = entry;
    list.sort((a, b) => b.score - a.score);
  }
}
