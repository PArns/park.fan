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
    [-9, 2.4, 0],
    [-5.5, 4.6, 0],
    [-2.3, 7.2, 0],
    [0, 8.8, 0], // rounded peak — the element rises and falls over a hill
    [2.3, 7.2, 0],
    [5.5, 4.6, 0],
    [9, 2.4, 0],
    [13, 1.5, 0],
  ],
  // A "do-si-do" over a rounded peak: the two tracks WIND a full turn around
  // each other (a braid) while BOTH trains barrel-roll a full turn — so they
  // twist over/under one another and both invert, one hanging upside-down just
  // above the other. (Stardust Racers' signature element.)
  dual: {
    gap: 1.9,
    twist: (t) => TAU * smoothstep(0.14, 0.86, t),
    roll: (t) => TAU * smoothstep(0.18, 0.82, t),
  },
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'celestial' },
    { t: 0.8, label: 'land' },
  ],
  duration: 9,
};

// ── Heartline roll — a 360° roll on essentially LEVEL track, rotating the train
//    around the riders' heart line (no hill, no lateral drift). ───────────────
const heartlineRoll: CoasterElementDef = {
  id: 'heartline-roll',
  points: [
    [-11, 3.4, 0],
    [-6, 3.4, 0],
    [-2, 3.5, 0],
    [0, 3.6, 0],
    [2, 3.5, 0],
    [6, 3.4, 0],
    [11, 3.4, 0],
  ],
  roll: (t) => TAU * smoothstep(0.3, 0.7, t),
  keyPoints: [
    { t: 0.18, label: 'approach' },
    { t: 0.4, label: 'rollIn' },
    { t: 0.5, label: 'inverted' },
    { t: 0.6, label: 'rollOut' },
    { t: 0.82, label: 'leave' },
  ],
  duration: 7,
};

// ── Zero-G roll — a 360° roll timed to the crest of an airtime hill, so it
//    happens in a weightless float (the roll axis ≈ the riders). ──────────────
const zeroGRoll: CoasterElementDef = {
  id: 'zero-g-roll',
  points: [
    [-11, 1.5, 0],
    [-6, 1.9, 0],
    [-2.5, 4.6, 0],
    [0, 6.6, 0],
    [2.5, 4.6, 0],
    [6, 1.9, 0],
    [11, 1.5, 0],
  ],
  roll: (t) => TAU * smoothstep(0.32, 0.68, t),
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'inverted' },
    { t: 0.8, label: 'land' },
  ],
  duration: 7,
};

// ── Zero-G stall — like a zero-G roll, but the train rolls inverted at the
//    crest and HANGS upside-down for a beat before rolling back upright. ──────
const zeroGStall: CoasterElementDef = {
  id: 'zero-g-stall',
  points: [
    [-12, 1.5, 0],
    [-7, 1.9, 0],
    [-3, 4.6, 0],
    [0, 6.8, 0],
    [3, 4.6, 0],
    [7, 1.9, 0],
    [12, 1.5, 0],
  ],
  // roll to inverted, hang there (the stall), then complete the roll upright
  roll: (t) => {
    if (t < 0.4) return Math.PI * smoothstep(0.12, 0.4, t); // 0 → π (invert)
    if (t < 0.6) return Math.PI; // hang inverted
    return Math.PI + Math.PI * smoothstep(0.6, 0.88, t); // π → 2π (recover)
  },
  keyPoints: [
    { t: 0.22, label: 'climb' },
    { t: 0.5, label: 'inverted' },
    { t: 0.8, label: 'land' },
  ],
  duration: 9,
};

// ── Bunny hops — a SERIES of small, low hills taken in quick succession, each
//    popping a little ejector airtime. ───────────────────────────────────────
const bunnyHop: CoasterElementDef = {
  id: 'bunnyhop',
  points: [
    [-13, 1.3, 0],
    [-9, 1.4, 0],
    [-6.5, 2.2, 0], // hop 1
    [-4.3, 1.4, 0], // dip
    [-2.1, 2.2, 0], // hop 2
    [0, 1.4, 0], // dip
    [2.1, 2.2, 0], // hop 3
    [4.3, 1.4, 0], // dip
    [6.5, 2.2, 0], // hop 4
    [9, 1.4, 0],
    [13, 1.3, 0],
  ],
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'airtime' },
    { t: 0.8, label: 'land' },
  ],
  duration: 6,
};

// ── Top hat — a tall, near-vertical climb, a sharp crest and a near-vertical
//    drop; the signature element of many launch coasters. ────────────────────
const topHat: CoasterElementDef = {
  id: 'top-hat',
  points: [
    [-9, 1, 0],
    [-5.5, 1.2, 0],
    [-3.2, 5, 0],
    [-2.2, 9.4, 0],
    [-1, 11.3, 0],
    [0, 11.7, 0], // crest
    [1, 11.3, 0],
    [2.2, 9.4, 0],
    [3.2, 5, 0],
    [5.5, 1.2, 0],
    [9, 1, 0],
  ],
  keyPoints: [
    { t: 0.25, label: 'climb' },
    { t: 0.5, label: 'airtime' },
    { t: 0.75, label: 'land' },
  ],
  duration: 8,
};

// ── Immelmann — half a vertical loop (up and over, inverting via parallel
//    transport) then a half-twist that rolls the train upright as it flies out
//    in the OPPOSITE direction at height. ────────────────────────────────────
const immelmann: CoasterElementDef = {
  id: 'immelmann',
  points: [
    [-12, 1, 0],
    [-7, 1, 0],
    [-3, 1.4, 0],
    [0, 2.2, 0], // bottom, entering +x
    [3.4, 4.4, 0],
    [4.7, 8.2, 0],
    [3.4, 11, 0],
    [0.3, 12.3, 0], // over the top — inverted, now travelling −x
    [-3.6, 12.2, 0], // level out (the half-twist rolls upright here)
    [-8, 11.6, 0],
    [-12, 11.2, 0], // exit −x, upright, at height
  ],
  roll: (t) => Math.PI * smoothstep(0.5, 0.82, t), // half-twist out after the top
  keyPoints: [
    { t: 0.18, label: 'climb' },
    { t: 0.44, label: 'inverted' },
    { t: 0.66, label: 'rollOut' },
    { t: 0.86, label: 'leave' },
  ],
  duration: 8,
};

// ── Dive loop — the Immelmann reversed: the train twists up and over, then
//    dives back toward the ground through a half vertical loop. ──────────────
const diveLoop: CoasterElementDef = {
  id: 'dive-loop',
  points: [
    [-12, 11.2, 0], // lead-in, entering +x at height
    [-8, 11.6, 0],
    [-3.6, 12.2, 0],
    [0.3, 12.3, 0], // top (twist to inverted here, before the dive)
    [3.4, 11, 0],
    [4.7, 8.2, 0],
    [3.4, 4.4, 0],
    [0, 2.2, 0], // bottom, now travelling −x
    [-3, 1.4, 0],
    [-7, 1, 0],
    [-12, 1, 0], // exit −x along the ground
  ],
  roll: (t) => Math.PI * smoothstep(0.16, 0.46, t), // twist to inverted before the dive
  keyPoints: [
    { t: 0.14, label: 'approach' },
    { t: 0.32, label: 'rollIn' },
    { t: 0.54, label: 'inverted' },
    { t: 0.82, label: 'land' },
  ],
  duration: 8,
};

export const COASTER_ELEMENTS: Record<string, CoasterElementDef> = {
  'vertical-loop': verticalLoop,
  corkscrew,
  'airtime-hill': airtimeHill,
  'celestial-spin': celestialSpin,
  'heartline-roll': heartlineRoll,
  'zero-g-roll': zeroGRoll,
  'zero-g-stall': zeroGStall,
  bunnyhop: bunnyHop,
  'top-hat': topHat,
  immelmann,
  'dive-loop': diveLoop,
};

export function getCoasterElement(id: string): CoasterElementDef | undefined {
  return COASTER_ELEMENTS[id];
}

export function hasCoasterElement(id: string): boolean {
  return id in COASTER_ELEMENTS;
}
