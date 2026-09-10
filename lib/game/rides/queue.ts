/**
 * Where a queue stands, as one formula.
 *
 * This file exists because the serpentine had two consumers and one copy. `sim.ts` placed the
 * guests with local `ROW` / `PITCH` / `CHANNEL` constants; nothing drew the line, so nothing else
 * needed them. The moment a rail is built the numbers have a second reader, and a rail that is
 * near the people rather than round them is worse than no rail at all -- so the geometry is here,
 * both halves import it, and neither may re-derive it.
 *
 * The repo has a name for the alternative and a rule about it: `attractionIsOutOfSeason()`'s
 * hand-written SQL twin, "change both halves or neither". The `tools` round-2 critic caught this
 * module's sibling shipping exactly that pattern for `rectCentre` a day earlier. Once is a
 * mistake.
 *
 * **The shape is a real park's.** Guests stand 0.85 m apart -- close enough to read as a line,
 * far enough not to intersect at a 0.4 m shoulder -- and the line turns back on itself every ten
 * places into a 1.9 m channel, which is a switchback a person can walk and a handrail can be built
 * either side of. Row 0 is at the entrance and the line grows AWAY from the machine, so a place
 * that opens at the front moves everybody up rather than teleporting the tail.
 *
 * Pure arithmetic. No Babylon, no DOM, no world: it is called from the worker to place a guest and
 * from the main thread to build a rail, and those two must not be able to disagree.
 */

/** Places along one leg of the switchback before the line turns back. */
export const QUEUE_ROW = 10;
/** Metres between two people standing in line. */
export const QUEUE_PITCH = 0.85;
/** Metres between one leg of the switchback and the next. */
export const QUEUE_CHANNEL = 1.9;
/** Metres from the entrance point to the first place in the line. */
export const QUEUE_LEAD = 0.6;

/**
 * The `index`-th place in the line at an entrance, in world metres.
 *
 * `dir` is the unit vector the line runs BACK along, away from the machine -- the same convention
 * `Dock.dirX`/`dirZ` uses, so a docked machine's own module decides which way its queue trails.
 */
export function queueSlot(
  entrance: readonly [number, number],
  dir: readonly [number, number],
  index: number
): [number, number] {
  const row = Math.floor(index / QUEUE_ROW);
  const along = index % QUEUE_ROW;
  // Odd rows run back the other way, which is what makes it a switchback and not a comb.
  const back = row % 2 === 0 ? along : QUEUE_ROW - 1 - along;
  const dx = dir[0];
  const dz = dir[1];
  // Right-hand normal of the queue direction.
  const nx = dz;
  const nz = -dx;
  return [
    entrance[0] + dx * (QUEUE_LEAD + back * QUEUE_PITCH) + nx * row * QUEUE_CHANNEL,
    entrance[1] + dz * (QUEUE_LEAD + back * QUEUE_PITCH) + nz * row * QUEUE_CHANNEL,
  ];
}

/**
 * The centreline of the switchback as a polyline, for `slots` places.
 *
 * The rail and the paving are built along this; the people stand on it. It is the corners of the
 * serpentine rather than every place, because a rail wants segments and a straight run of ten
 * needs two points and not ten.
 */
export function queuePath(
  entrance: readonly [number, number],
  dir: readonly [number, number],
  slots: number
): Array<[number, number]> {
  const count = Math.max(1, Math.floor(slots));
  const rows = Math.ceil(count / QUEUE_ROW);
  const out: Array<[number, number]> = [];
  for (let row = 0; row < rows; row++) {
    const first = row * QUEUE_ROW;
    const last = Math.min(count, first + QUEUE_ROW) - 1;
    // Walking order along this leg: whichever end of it the line enters at.
    const a = queueSlot(entrance, dir, row % 2 === 0 ? first : last);
    const b = queueSlot(entrance, dir, row % 2 === 0 ? last : first);
    out.push(a, b);
  }
  return out;
}

/**
 * How many tickets a machine will issue before it turns people away, as a multiple of one load.
 *
 * This is a SIMULATION cap and not a building specification. The difference cost a round: the
 * first version of the rail was built to this number, and on a high-capacity machine that is
 * 8 x 40 = 320 places, i.e. **thirty-two legs and a 74 x 11.5 m structure** measured in the
 * running park (`ride-1503`, 7,098 triangles) sprawling across the fairground it was meant to
 * serve.
 */
export const QUEUE_CYCLES = 8;

/**
 * Legs the switchback is BUILT with, whatever the ticket cap says.
 *
 * Six legs is 60 places in 11.4 x 8.2 m, which is a structure a park actually pours and a shape
 * that fits beside a machine rather than across its neighbour. Where more people hold a ticket
 * than the rail has room for, the tail stands past the end of it — which is what a queue that has
 * "gone out of the gate" looks like in a real park, and is more honest than a handrail that grows
 * when the ride gets popular.
 */
export const QUEUE_MAX_ROWS = 6;

/** Places the rail is built for. Bounded, so geometry cannot follow a manifest's capacity. */
export function queueSlots(capacity: number): number {
  const wanted = Math.round(Math.max(1, capacity) * QUEUE_CYCLES);
  return Math.max(QUEUE_ROW, Math.min(wanted, QUEUE_MAX_ROWS * QUEUE_ROW));
}
