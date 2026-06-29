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

// ── Vertical loop — planar teardrop in the x-y plane; parallel transport takes
//    the train fully inverted at the apex with no explicit roll. ───────────────
const verticalLoop: CoasterElementDef = {
  id: 'vertical-loop',
  points: [
    [-20, 1, 0],
    [-13, 1, 0],
    [-6, 1, 0],
    [-3, 1.5, 0],
    [1.7, 3.7, 0],
    [3.5, 7.7, 0],
    [0, 11.7, 0],
    [-3.5, 7.7, 0],
    [-1.7, 3.7, 0],
    [3, 1.5, 0],
    [6, 1, 0],
    [13, 1, 0],
    [20, 1, 0],
  ],
  keyPoints: [
    { t: 0.14, label: 'approach' },
    { t: 0.31, label: 'enterLoop' },
    { t: 0.5, label: 'inverted' },
    { t: 0.69, label: 'exitLoop' },
    { t: 0.86, label: 'leave' },
  ],
};

// ── Corkscrew — a gentle hump that drifts sideways (z) while the train barrel-
//    rolls a full 360° across the middle of the run. ───────────────────────────
const corkscrew: CoasterElementDef = {
  id: 'corkscrew',
  points: [
    [-20, 3, 0],
    [-13, 3, 0],
    [-7, 3.1, 0],
    [-4, 3.6, 0.4],
    [-1.5, 4.8, 2.4],
    [1.5, 4.8, 2.4],
    [4, 3.6, 0.4],
    [7, 3.1, 0],
    [13, 3, 0],
    [20, 3, 0],
  ],
  roll: (t) => TAU * smoothstep(0.32, 0.68, t),
  keyPoints: [
    { t: 0.2, label: 'approach' },
    { t: 0.4, label: 'rollIn' },
    { t: 0.5, label: 'inverted' },
    { t: 0.6, label: 'rollOut' },
    { t: 0.82, label: 'leave' },
  ],
};

// ── Airtime hill — a planar parabolic camelback; riders float at the crest. No
//    roll, never inverts (the tangent stays well under vertical). ──────────────
const airtimeHill: CoasterElementDef = {
  id: 'airtime-hill',
  points: [
    [-20, 1, 0],
    [-13, 1, 0],
    [-7, 1.3, 0],
    [-3, 3.6, 0],
    [0, 7.3, 0],
    [3, 3.6, 0],
    [7, 1.3, 0],
    [13, 1, 0],
    [20, 1, 0],
  ],
  keyPoints: [
    { t: 0.22, label: 'climb' },
    { t: 0.5, label: 'airtime' },
    { t: 0.78, label: 'land' },
  ],
};

// ── Celestial roll — RMC-style outward-banked airtime hill: the train floats
//    over a long crest while slowly rolling a full turn. (New glossary term.) ──
const celestialRoll: CoasterElementDef = {
  id: 'celestial-roll',
  points: [
    [-20, 1.5, 0],
    [-13, 1.6, 0],
    [-7, 2.1, 0],
    [-4, 4.1, 0],
    [0, 7, 0],
    [4, 4.1, 0],
    [7, 2.1, 0],
    [13, 1.6, 0],
    [20, 1.5, 0],
  ],
  roll: (t) => TAU * smoothstep(0.26, 0.74, t),
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'celestial' },
    { t: 0.8, label: 'land' },
  ],
  duration: 10,
};

export const COASTER_ELEMENTS: Record<string, CoasterElementDef> = {
  'vertical-loop': verticalLoop,
  corkscrew,
  'airtime-hill': airtimeHill,
  'celestial-roll': celestialRoll,
};

export function getCoasterElement(id: string): CoasterElementDef | undefined {
  return COASTER_ELEMENTS[id];
}

export function hasCoasterElement(id: string): boolean {
  return id in COASTER_ELEMENTS;
}
