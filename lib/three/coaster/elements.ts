/**
 * The coaster-element registry: one entry per glossary term that has a 3-D
 * player. Each entry is pure data — a set of control points for the demo curve
 * (lead-in → element → lead-out), an optional `roll(t)` that banks/rolls the
 * train around the direction of travel, and the timeline key-points the player
 * marks on its scrubber.
 *
 * Geometry note: the scene builds a parallel-transport frame along these points
 * (see kit.ts) so PLANAR figures (loops, hills) invert/pitch correctly with no
 * extra data, while BARREL rolls (corkscrew, heartline, celestial) supply an
 * explicit `roll(t)`. Keep everything in a tidy box around the origin: travel is
 * broadly along +x, the frontal camera looks from +z, the mountain sits at −z.
 */

export interface ElementKeyPoint {
  /** Progress along the run, 0..1. */
  t: number;
  /** Short label key shown on the timeline (localised in the player). */
  label: string;
}

export interface CoasterElementDef {
  id: string;
  /** Control points of the full demo curve: [x, y, z]. */
  points: [number, number, number][];
  /** Extra roll (radians) about the tangent at progress t∈[0,1]. Omit for planar figures. */
  roll?: (t: number) => number;
  /**
   * Dual-track element (e.g. a celestial spin): `points` is then the shared
   * CENTRELINE, and the scene builds TWO tracks orbiting it — offset by ±gap/2
   * in the centreline's (right, up) plane, rotated by `twist(t)` so they wind
   * around each other. Each track gets its own train.
   */
  dual?: { gap: number; twist: (t: number) => number; roll?: (t: number) => number };
  /** Timeline markers. */
  keyPoints: ElementKeyPoint[];
  /** Seconds for one pass of the run (default 9). */
  duration?: number;
}

// — small easing helpers —
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
const TAU = Math.PI * 2;

// ── Vertical loop — a near-circular loop in the x-y plane. A small, steady
//    depth drift (z) means the entry and exit legs cross OVER/UNDER each other
//    at the bottom (as a real loop does) instead of intersecting in-plane, so
//    the track never appears to drive through itself. Parallel transport takes
//    the train fully inverted at the apex with no explicit roll. ──────────────
const verticalLoop: CoasterElementDef = {
  id: 'vertical-loop',
  points: [
    [-10, 1, 0],
    [-5.5, 1.05, 0],
    [-2.8, 1.3, 0],
    [0, 1.6, 0], // loop bottom — entry (moving +x)
    [4.6, 3.0, 0.18],
    [5.6, 7.0, 0.42],
    [4.3, 10.9, 0.72],
    [0, 12.6, 0.95], // top (moving −x)
    [-4.3, 10.9, 1.12],
    [-5.6, 7.0, 1.28],
    [-4.6, 3.0, 1.42],
    [0, 1.6, 1.55], // loop bottom — exit (moving +x, just behind the entry)
    [2.8, 1.3, 1.55],
    [5.5, 1.05, 1.55],
    [10, 1, 1.55],
  ],
  keyPoints: [
    { t: 0.12, label: 'approach' },
    { t: 0.3, label: 'enterLoop' },
    { t: 0.5, label: 'inverted' },
    { t: 0.7, label: 'exitLoop' },
    { t: 0.88, label: 'leave' },
  ],
  duration: 8,
};

// ── Corkscrew — a symmetric, centred hump over which the train barrel-rolls a
//    full 360°. Kept planar (no sideways drift) so it reads centred head-on;
//    the inversion is carried entirely by the explicit roll. ──────────────────
const corkscrew: CoasterElementDef = {
  id: 'corkscrew',
  points: [
    [-11, 2.6, 0],
    [-6, 2.7, 0],
    [-2.6, 3.6, 0],
    [0, 4.0, 0],
    [2.6, 3.6, 0],
    [6, 2.7, 0],
    [11, 2.6, 0],
  ],
  roll: (t) => TAU * smoothstep(0.28, 0.72, t),
  keyPoints: [
    { t: 0.16, label: 'approach' },
    { t: 0.38, label: 'rollIn' },
    { t: 0.5, label: 'inverted' },
    { t: 0.62, label: 'rollOut' },
    { t: 0.84, label: 'leave' },
  ],
  duration: 7,
};

// ── Airtime hill — a planar parabolic camelback; riders float at the crest. No
//    roll, never inverts (the tangent stays well under vertical). ──────────────
const airtimeHill: CoasterElementDef = {
  id: 'airtime-hill',
  points: [
    [-11, 1, 0],
    [-6, 1.2, 0],
    [-3, 3.6, 0],
    [0, 7.3, 0],
    [3, 3.6, 0],
    [6, 1.2, 0],
    [11, 1, 0],
  ],
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'airtime' },
    { t: 0.8, label: 'land' },
  ],
  duration: 7,
};

// ── Celestial Spin — Mack Rides' patented DUAL-TRACK element, the signature
//    (and TALLEST, 41 m) move of Stardust Racers at Universal Epic Universe.
//    Both trains climb a tall spire and their tracks invert AROUND each other
//    while rising over the peak — a double-helix intertwine, both ascending
//    (NOT a high-five, where the tracks merely bank side-by-side). Modelled as
//    a tall, narrow centreline spire with two tracks orbiting it a full turn;
//    no explicit roll — the helix itself rolls both trains as they wind. ──────
const celestialSpin: CoasterElementDef = {
  id: 'celestial-spin',
  points: [
    [-13, 1.5, 0],
    [-8, 2.0, 0],
    [-3.4, 4.8, 0],
    [-1.3, 8.6, 0],
    [0, 11.6, 0], // tall peak — the apex of the ride
    [1.3, 8.6, 0],
    [3.4, 4.8, 0],
    [8, 2.0, 0],
    [13, 1.5, 0],
  ],
  // Inverted crisscross over the peak: the two tracks rotate a HALF turn so
  // they swap sides through vertical — at the apex one train hangs upside-down
  // just above the other — while BOTH barrel-roll the same way, so both ascend
  // AND invert. (Stardust Racers' signature 41 m element.)
  dual: {
    gap: 1.9,
    twist: (t) => Math.PI * smoothstep(0.16, 0.84, t),
    roll: (t) => TAU * smoothstep(0.2, 0.8, t),
  },
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'celestial' },
    { t: 0.8, label: 'land' },
  ],
  duration: 9,
};

export const COASTER_ELEMENTS: Record<string, CoasterElementDef> = {
  'vertical-loop': verticalLoop,
  corkscrew,
  'airtime-hill': airtimeHill,
  'celestial-spin': celestialSpin,
};

export function getCoasterElement(id: string): CoasterElementDef | undefined {
  return COASTER_ELEMENTS[id];
}

export function hasCoasterElement(id: string): boolean {
  return id in COASTER_ELEMENTS;
}
