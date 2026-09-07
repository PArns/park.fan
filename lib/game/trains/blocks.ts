/**
 * The block system: what keeps two trains on one circuit from occupying the same piece of track.
 *
 * A real coaster is divided into **blocks**, and the rule is one sentence long: a train may not
 * enter a block until the block is empty. Every block therefore begins with something that can
 * stop a train — a station, a lift, a block brake, a brake run — and the train waits at the far end
 * of that thing until the section ahead clears. `track`'s `drives(id)` already publishes exactly
 * those four kinds with their arc-length ranges (`DriveSection.kind` is
 * `station | lift | launch | brake | block | transport`), and nothing has ever read them.
 *
 * Three decisions in the mapping are worth stating.
 *
 * **A block starts at the START of its hold section, and the stop line is that section's END.**
 * So the station block is the platform, and a train waiting to leave stands with its front on
 * `station.to` — which for a 21 m train in a 24 m station puts the whole train on the platform,
 * where it belongs. A train held for the block ahead of a lift stops at the crest, which is what a
 * chain-stop does. Putting the boundary at the section's end instead would let a train roll off the
 * end of the brake run and then discover it had to stop.
 *
 * **A `launch` is not a block boundary and a `transport` is not either.** A launch cannot hold a
 * train — that is the whole point of it — and a transport section is friction wheels at walking
 * pace inside somebody else's block. Treating either as a hold would invent a stop line at a place
 * with no brakes on it.
 *
 * **A circuit with `n` blocks runs at most `n − 1` trains.** Every train needs an empty block in
 * front of it or the fleet deadlocks on the first tick: with three trains in three blocks nobody
 * can move. `fleetSize()` is that arithmetic, capped again by the ride definition's `trainsMax`.
 *
 * Pure: no Babylon, no clock, no RNG. `selftest.mjs` drives all of it.
 */

import type { DriveKind, DriveSection } from '../track';

/** Drive kinds that can bring a train to a stand, and therefore start a block. */
const HOLD_KINDS: readonly DriveKind[] = ['station', 'lift', 'block', 'brake'];

export interface BlockSection {
  /** Index in the plan, in arc-length order. Block 0 is the one the station starts. */
  index: number;
  kind: DriveKind;
  /** Where the block begins, metres. */
  from: number;
  /** Where the block ends — the start of the next block. Wraps on a circuit. */
  to: number;
  /** Where a train waits for the block ahead, metres. The end of this block's hold section. */
  stop: number;
  /** Speed the hold section runs at when it is not holding, m/s. */
  speed: number;
}

export interface BlockPlan {
  blocks: BlockSection[];
  /** Total circuit length, metres. */
  length: number;
  closed: boolean;
  /** Index of the block the station starts, or −1 when the layout has no station. */
  station: number;
  /** How many trains this plan can run before it deadlocks. */
  capacity: number;
}

/**
 * Build the block plan for a layout.
 *
 * Returns a plan with no blocks when the layout has nothing that can stop a train, which is a
 * legitimate state (a layout under construction) and not an error — `sim.ts` runs no fleet on it.
 */
export function planBlocks(
  drives: readonly DriveSection[],
  length: number,
  closed: boolean
): BlockPlan {
  const holds = drives
    .filter((d) => HOLD_KINDS.includes(d.kind) && d.to > d.from)
    .slice()
    .sort((a, b) => a.from - b.from);

  const blocks: BlockSection[] = [];
  for (let i = 0; i < holds.length; i++) {
    const hold = holds[i];
    const next = holds[(i + 1) % holds.length];
    const to = i + 1 < holds.length ? next.from : closed ? next.from + length : length;
    blocks.push({
      index: i,
      kind: hold.kind,
      from: hold.from,
      to,
      stop: hold.to,
      speed: hold.speed,
    });
  }

  const station = blocks.findIndex((b) => b.kind === 'station');
  return {
    blocks,
    length,
    closed,
    station,
    // n blocks hold n − 1 trains: every train needs an empty block ahead of it.
    capacity: closed ? Math.max(0, blocks.length - 1) : Math.max(0, blocks.length - 1),
  };
}

/** Normalise an arc length onto `[0, length)` for a circuit, clamp it for a shuttle. */
export function wrapS(plan: BlockPlan, s: number): number {
  if (!plan.closed) return Math.min(plan.length, Math.max(0, s));
  const l = plan.length;
  return ((s % l) + l) % l;
}

/**
 * Which block an arc length falls in.
 *
 * Blocks are stored with `to` allowed to exceed `length` (the last one wraps past the seam), so the
 * test is done both on `s` and on `s + length`. Returns −1 for an s outside every block, which can
 * only happen on an open layout with track before the first hold section.
 */
export function blockAt(plan: BlockPlan, s: number): number {
  const x = wrapS(plan, s);
  for (const b of plan.blocks) {
    if (x >= b.from && x < b.to) return b.index;
    if (plan.closed && x + plan.length >= b.from && x + plan.length < b.to) return b.index;
  }
  return -1;
}

/** The block after `index`, wrapping on a circuit. */
export function nextBlock(plan: BlockPlan, index: number): number {
  if (plan.blocks.length === 0) return -1;
  const n = plan.blocks.length;
  if (index + 1 < n) return index + 1;
  return plan.closed ? 0 : -1;
}

/**
 * Every block a train covers, front at `s` and `length` metres of train behind it.
 *
 * Walked from the tail forward rather than derived from the two ends, so a train longer than a
 * block — a seven-car train on a 20 m block brake section is not far off — still reports the block
 * in the middle. The walk is bounded by the block count, so it terminates whatever the arithmetic
 * does.
 */
export function blocksCovered(plan: BlockPlan, s: number, trainLength: number, out: number[]): void {
  out.length = 0;
  if (plan.blocks.length === 0) return;
  const front = blockAt(plan, s);
  if (front < 0) return;
  const tail = blockAt(plan, s - trainLength);
  out.push(front);
  if (tail < 0 || tail === front) return;
  // Walk forward from the tail to the front; at most one lap of the plan.
  let cursor = tail;
  for (let guard = 0; guard < plan.blocks.length; guard++) {
    if (cursor === front) break;
    out.push(cursor);
    const step = nextBlock(plan, cursor);
    if (step < 0) break;
    cursor = step;
  }
}

/**
 * Distance from `s` forward to `target`, along the direction of travel.
 *
 * Always non-negative on a circuit: a stop line 3 m behind the train is 976 m ahead of it, which is
 * the right answer for "how far until I have to be stopped" and the wrong one for anything else.
 */
export function distanceAhead(plan: BlockPlan, s: number, target: number): number {
  if (!plan.closed) return target - s;
  const d = wrapS(plan, target - s);
  return d;
}
