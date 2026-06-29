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
  /**
   * Initial camera the player opens with. Turn-based figures (helix, overbanked
   * turn) read poorly head-on — they curve away into depth — so they default to
   * `'follow'`. Omit for the usual `'front'`.
   */
  defaultView?: 'front' | 'follow' | 'onboard';
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

// ── Corkscrew — a true helix: the centreline itself spirals a full 360° around
//    a horizontal axis along the travel direction (y and z trace a circle while
//    x advances), and the train barrel-rolls in sync, so the two rails wind
//    around each other like a screw thread. The spiralling PATH is what sets it
//    apart from the banana roll (which only bows out flat to one side). ───────
const corkscrew: CoasterElementDef = {
  id: 'corkscrew',
  points: [
    [-11, 2, 0],
    [-7.5, 2, 0],
    [-4.6, 1.7, 0],
    [-4.02, 1.91, 1.03],
    [-3.45, 2.49, 1.91],
    [-2.88, 3.37, 2.49],
    [-2.3, 4.4, 2.7], // ¼ turn — out to the side
    [-1.72, 5.43, 2.49],
    [-1.15, 6.31, 1.91],
    [-0.58, 6.89, 1.03],
    [0, 7.1, 0], // ½ turn — over the top (inverted)
    [0.58, 6.89, -1.03],
    [1.15, 6.31, -1.91],
    [1.72, 5.43, -2.49],
    [2.3, 4.4, -2.7], // ¾ turn — out the other side
    [2.88, 3.37, -2.49],
    [3.45, 2.49, -1.91],
    [4.03, 1.91, -1.03],
    [4.6, 1.7, 0],
    [7.5, 2, 0],
    [11, 2, 0],
  ],
  roll: (t) => TAU * smoothstep(0.12, 0.88, t),
  keyPoints: [
    { t: 0.16, label: 'approach' },
    { t: 0.36, label: 'rollIn' },
    { t: 0.5, label: 'inverted' },
    { t: 0.64, label: 'rollOut' },
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

// ── First drop — the big descent off the lift/launch crest: a steep, floaty
//    plunge that levels out along the ground. ────────────────────────────────
const firstDrop: CoasterElementDef = {
  id: 'first-drop',
  points: [
    [-12, 11, 0],
    [-8.5, 11, 0],
    [-5.5, 10.2, 0],
    [-3, 7.4, 0],
    [-1.2, 3.7, 0],
    [0, 1.4, 0],
    [2.5, 1, 0],
    [7, 1, 0],
    [12, 1, 0],
  ],
  keyPoints: [
    { t: 0.16, label: 'climb' },
    { t: 0.45, label: 'airtime' },
    { t: 0.78, label: 'land' },
  ],
  duration: 7,
};

// ── Beyond-vertical drop — a drop steeper than 90°: the track tucks back under
//    itself (overhangs) at the steepest point before levelling out. ──────────
const beyondVerticalDrop: CoasterElementDef = {
  id: 'beyond-vertical-drop',
  points: [
    [-11, 11.6, 0],
    [-7.5, 11.6, 0],
    [-5, 11, 0],
    [-3.7, 8.8, 0],
    [-3.5, 5.8, 0],
    [-4.2, 3, 0], // overhang — x moves back as it drops (past vertical)
    [-3, 1.2, 0],
    [0, 0.9, 0],
    [4, 1, 0],
    [9, 1, 0],
  ],
  keyPoints: [
    { t: 0.18, label: 'climb' },
    { t: 0.46, label: 'airtime' },
    { t: 0.8, label: 'land' },
  ],
  duration: 7,
};

// ── Cobra roll — a double inversion that REVERSES direction: up into a first
//    inverted head, over and down, straight into a mirrored second head, then
//    out along the ground travelling the OPPOSITE way (exit leg parallel to the
//    entry, offset sideways). The two heads lean the same way (the cobra hood);
//    the z-drift carries the reversal and keeps the legs from overlapping. ─────
const cobraRoll: CoasterElementDef = {
  id: 'cobra-roll',
  points: [
    [-12, 1, 0],
    [-8, 1.1, 0],
    [-4, 1.4, 0], // entry leg, heading +x
    [-1, 1.6, 0],
    [0.91, 1.98, 0.03],
    [2.54, 3.06, 0.06],
    [3.62, 4.69, 0.09],
    [4, 6.6, 0.13],
    [3.62, 8.51, 0.16],
    [2.54, 10.14, 0.19],
    [0.91, 11.22, 0.22],
    [-1, 11.6, 0.25], // head 1 over the top — inverted, heading −x
    [-1, 11.6, 1.3], // the hood — shift across at the top
    [-1, 11.6, 2.3],
    [-1, 11.6, 2.6],
    [0.91, 11.22, 2.63],
    [2.54, 10.14, 2.66],
    [3.62, 8.51, 2.69],
    [4, 6.6, 2.73],
    [3.62, 4.69, 2.76],
    [2.54, 3.06, 2.79],
    [0.91, 1.98, 2.82],
    [-1, 1.6, 2.85], // head 2 bottom — heading −x (reversed)
    [-4, 1.4, 2.85],
    [-8, 1.1, 2.9],
    [-12, 1, 2.9],
  ],
  keyPoints: [
    { t: 0.18, label: 'enterLoop' },
    { t: 0.4, label: 'inverted' },
    { t: 0.5, label: 'exitLoop' },
    { t: 0.62, label: 'inverted' },
    { t: 0.84, label: 'leave' },
  ],
  duration: 9,
  defaultView: 'follow',
};

// ── Sea serpent — like a cobra roll's two inverted heads, but the corkscrews
//    face OPPOSITE ways so the train exits the SAME direction it entered (it
//    flows straight through instead of reversing). ───────────────────────────
const seaSerpent: CoasterElementDef = {
  id: 'sea-serpent',
  points: [
    [-13, 1, 0],
    [-9, 1.1, 0],
    [-6.2, 1.4, 0],
    [-4.2, 1.7, 0],
    [-1.91, 2.44, 0.13],
    [-0.49, 4.39, 0.26],
    [-0.49, 6.81, 0.39],
    [-1.91, 8.76, 0.52],
    [-4.2, 9.5, 0.65], // head 1 top — inverted
    [-6.49, 8.76, 0.78],
    [-7.91, 6.81, 0.91],
    [-7.91, 4.39, 1.04],
    [-6.49, 2.44, 1.17],
    [-4.2, 1.7, 1.3],
    [-1, 1.5, 1.4], // valley between the loops
    [1, 1.5, 1.5],
    [4.2, 1.7, 1.6],
    [6.49, 2.44, 1.73],
    [7.91, 4.39, 1.86],
    [7.91, 6.81, 1.99],
    [6.49, 8.76, 2.12],
    [4.2, 9.5, 2.25], // head 2 top — inverted
    [1.91, 8.76, 2.38],
    [0.49, 6.81, 2.51],
    [0.49, 4.39, 2.64],
    [1.91, 2.44, 2.77],
    [4.2, 1.7, 2.9],
    [6.2, 1.4, 3],
    [9, 1.1, 3],
    [13, 1, 3], // exit — same direction as entry
  ],
  keyPoints: [
    { t: 0.16, label: 'enterLoop' },
    { t: 0.3, label: 'inverted' },
    { t: 0.5, label: 'exitLoop' },
    { t: 0.7, label: 'inverted' },
    { t: 0.84, label: 'leave' },
  ],
  duration: 9,
};

// ── Batwing — two inverted "wings": up and over a first inverted hood, a deep
//    dive almost to the ground, then up and over a mirrored second hood. Wider
//    and lower than a cobra roll (the spread-wing silhouette). Each hood is a
//    real x-y loop so the train fully inverts. ────────────────────────────────
const batwing: CoasterElementDef = {
  id: 'batwing',
  points: [
    [-12, 1, 0],
    [-8, 1.1, 0],
    [-4.8, 1.5, 0],
    [-3.2, 1.4, 0],
    [-1.29, 1.84, 0.04],
    [0.24, 3.06, 0.07],
    [1.09, 4.82, 0.11],
    [1.09, 6.78, 0.14],
    [0.24, 8.54, 0.18],
    [-1.29, 9.76, 0.21],
    [-3.2, 10.2, 0.25], // wing 1 — inverted over the top
    [-1.29, 9.76, 0.29],
    [0.24, 8.54, 0.32],
    [1.09, 6.78, 0.36],
    [1.09, 4.82, 0.39],
    [0.24, 3.06, 0.43],
    [-1.29, 1.84, 0.46],
    [-3.2, 1.4, 0.5],
    [-3.2, 1.6, 0.7],
    [-1, 1.4, 1.1], // deep dive across the bottom (the body)
    [1, 1.4, 1.5],
    [3.2, 1.6, 1.9],
    [3.2, 1.4, 2.1],
    [5.11, 1.84, 2.14],
    [6.64, 3.06, 2.17],
    [7.49, 4.82, 2.21],
    [7.49, 6.78, 2.24],
    [6.64, 8.54, 2.28],
    [5.11, 9.76, 2.31],
    [3.2, 10.2, 2.35], // wing 2 — inverted over the top
    [5.11, 9.76, 2.39],
    [6.64, 8.54, 2.42],
    [7.49, 6.78, 2.46],
    [7.49, 4.82, 2.49],
    [6.64, 3.06, 2.53],
    [5.11, 1.84, 2.56],
    [3.2, 1.4, 2.6],
    [3.2, 1.6, 2.8],
    [6, 1.2, 2.9],
    [10, 1.05, 2.9],
    [13, 1, 2.9],
  ],
  keyPoints: [
    { t: 0.2, label: 'enterLoop' },
    { t: 0.3, label: 'inverted' },
    { t: 0.5, label: 'exitLoop' },
    { t: 0.7, label: 'inverted' },
    { t: 0.84, label: 'leave' },
  ],
  duration: 9,
  defaultView: 'follow',
};

// ── Barrel-roll drop — a 360° barrel roll performed while plunging down a
//    drop, so the inversion and the descent happen together. ─────────────────
const barrelRollDrop: CoasterElementDef = {
  id: 'barrel-roll-drop',
  points: [
    [-11, 9, 0],
    [-8, 9, 0],
    [-5.5, 8.3, 0],
    [-3, 5.5, 0],
    [-1, 2.6, 0],
    [0.6, 1.3, 0],
    [3, 1, 0],
    [7, 1, 0],
    [11, 1, 0],
  ],
  roll: (t) => TAU * smoothstep(0.24, 0.6, t),
  keyPoints: [
    { t: 0.16, label: 'climb' },
    { t: 0.42, label: 'inverted' },
    { t: 0.78, label: 'land' },
  ],
  duration: 7,
};

// ── Banana roll — a 360° roll along a curved, arcing track (the path bows out
//    to the side like a banana while the train rolls). ──────────────────────
const bananaRoll: CoasterElementDef = {
  id: 'banana-roll',
  points: [
    [-11, 2.6, 0],
    [-6.5, 2.8, 0.4],
    [-2.5, 3.7, 1.3],
    [0, 4.1, 1.7],
    [2.5, 3.7, 1.3],
    [6.5, 2.8, 0.4],
    [11, 2.6, 0],
  ],
  roll: (t) => TAU * smoothstep(0.28, 0.72, t),
  keyPoints: [
    { t: 0.2, label: 'rollIn' },
    { t: 0.5, label: 'inverted' },
    { t: 0.8, label: 'rollOut' },
  ],
  duration: 7,
};

// ── Horseshoe — a 180° turnaround perched on top of a hill: the train climbs,
//    sweeps through a heavily-banked (≈90°) semicircle at the apex and comes
//    back down, now travelling the opposite direction. A steady depth offset
//    keeps the up-leg and down-leg from overlapping in view. ───────────────────
const horseshoe: CoasterElementDef = {
  id: 'horseshoe',
  points: [
    [-13, 1, 0],
    [-8.5, 2, 0],
    [-5, 4.6, 0],
    [-3.2, 6.8, 0.3], // bank in as the climb tops out
    [-1.4, 7.6, 1.8],
    [0, 7.9, 3.7], // apex — heading +z, banked ≈90°
    [-1.4, 7.6, 5.6],
    [-3.2, 6.8, 7.1], // back over the top, now heading −x
    [-5, 4.6, 7.4],
    [-8.5, 2, 7.4],
    [-13, 1, 7.4],
  ],
  roll: (t) => 1.6 * (smoothstep(0.24, 0.37, t) - smoothstep(0.63, 0.76, t)),
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'turn' },
    { t: 0.8, label: 'land' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Overbanked turn — a sweeping, near-level curve in which the track tilts
//    PAST vertical (≈105°), so riders lean over beyond upside-down without ever
//    fully inverting. Sustained left turn → one steady direction of bank. ──────
const overbank: CoasterElementDef = {
  id: 'overbank',
  points: [
    [-13, 3.5, -4],
    [-7, 3.5, -3.4],
    [-2, 3.6, -1.5],
    [1.6, 3.7, 1.5],
    [3, 3.7, 6], // heading +z, over-banked ≈105°
    [1.6, 3.6, 10.5],
    [-2, 3.5, 13.5], // swept ≈160°, now heading −x
    [-7, 3.5, 14],
  ],
  roll: (t) => 1.83 * (smoothstep(0.16, 0.34, t) - smoothstep(0.66, 0.84, t)),
  keyPoints: [
    { t: 0.18, label: 'approach' },
    { t: 0.5, label: 'bank' },
    { t: 0.82, label: 'leave' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Wave turn — RMC's banked turnaround with an airtime crest: the train rolls
//    to ≈90° on its side, floats over a camelback while fully banked, and exits
//    the opposite direction. Like a horseshoe, but with airtime at the top. ────
const waveTurn: CoasterElementDef = {
  id: 'wave-turn',
  points: [
    [-13, 1.3, 0],
    [-8.5, 2.4, 0],
    [-5, 5.2, 0],
    [-3, 7.4, 0.35], // bank to 90° entering the turn
    [-1.3, 9.0, 1.8],
    [0, 9.5, 3.7], // crest — airtime while banked ≈95°, heading +z
    [-1.3, 9.0, 5.6],
    [-3, 7.4, 7.05], // heading −x
    [-5, 5.2, 7.4],
    [-8.5, 2.4, 7.4],
    [-13, 1.3, 7.4],
  ],
  roll: (t) => 1.66 * (smoothstep(0.22, 0.36, t) - smoothstep(0.64, 0.78, t)),
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.5, label: 'crest' },
    { t: 0.8, label: 'land' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Outward-banked turn — the opposite of an overbank: the track banks the
//    "wrong" way (tilting outward, ≈40°) so the curve throws riders to the
//    OUTSIDE instead of cradling them into it. ────────────────────────────────
const outerbankedTurn: CoasterElementDef = {
  id: 'outerbanked-turn',
  points: [
    [-13, 3, -2.5],
    [-8, 3, -2],
    [-4, 3.1, -0.5],
    [-1, 3.2, 2],
    [1, 3.3, 5.5],
    [1.4, 3.3, 10],
    [1.4, 3.3, 14],
  ],
  roll: (t) => -0.72 * (smoothstep(0.2, 0.4, t) - smoothstep(0.62, 0.82, t)),
  keyPoints: [
    { t: 0.2, label: 'approach' },
    { t: 0.5, label: 'bank' },
    { t: 0.82, label: 'leave' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Raven turn — a half-inversion turnaround: the train climbs the front of a
//    loop, rolls inverted over the top, then dives back down and levels out at
//    its starting height, now travelling the opposite way. Planar (parallel
//    transport inverts it); a small depth drift separates the climb and dive. ──
const ravenTurn: CoasterElementDef = {
  id: 'raven-turn',
  points: [
    [-12, 1, 0],
    [-6.5, 1.1, 0],
    [-3, 1.6, 0], // bottom front — heading +x
    [0.6, 3.2, 0.15],
    [2.6, 6.6, 0.4],
    [1.9, 10.2, 0.7],
    [-0.4, 11.6, 0.95], // top — inverted, heading −x
    [-2.7, 10.4, 1.2],
    [-3.4, 6.8, 1.5],
    [-2.2, 3.4, 1.8], // dive down the back, heading −x
    [-5.5, 1.5, 2.0], // level out
    [-12, 1.3, 2.0],
  ],
  keyPoints: [
    { t: 0.22, label: 'climb' },
    { t: 0.46, label: 'inverted' },
    { t: 0.68, label: 'dive' },
    { t: 0.86, label: 'leave' },
  ],
  duration: 8,
};

// ── Inclined loop — a vertical loop whose plane is tilted off-vertical, so it
//    leans steadily to one side as it rises. Parallel transport still inverts
//    the train over the top; the lean comes from a depth (z) drift. ────────────
const inclinedLoop: CoasterElementDef = {
  id: 'inclined-loop',
  points: [
    [-12, 1, -0.3],
    [-7, 1.2, -0.2],
    [-3.2, 1.6, 0],
    [-1, 1.6, 0], // bottom — entry (moving +x, z≈0)
    [1.49, 2.13, 0.45],
    [3.51, 3.63, 1.39],
    [4.69, 5.8, 2.66],
    [4.84, 8.2, 4.04],
    [3.94, 10.37, 5.31],
    [2.2, 11.87, 6.25],
    [0, 12.4, 6.7], // top — leaned over toward +z
    [-2.2, 11.87, 6.62],
    [-3.94, 10.37, 6.05],
    [-4.84, 8.2, 5.16],
    [-4.69, 5.8, 4.14],
    [-3.51, 3.63, 3.25],
    [-1.49, 2.13, 2.68],
    [1, 1.6, 2.6], // bottom — exit (offset in z so it clears the entry leg)
    [3.2, 1.6, 2.6],
    [7, 1.2, 2.7],
    [12, 1, 2.8],
  ],
  keyPoints: [
    { t: 0.16, label: 'approach' },
    { t: 0.32, label: 'enterLoop' },
    { t: 0.5, label: 'inverted' },
    { t: 0.7, label: 'exitLoop' },
    { t: 0.86, label: 'leave' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Non-inverting loop — a tall, loop-shaped hill where the track twists ≈180°
//    over the crest so the train stays UPRIGHT (airtime) instead of going fully
//    inverted. The roll bump cancels the loop's natural inversion at the apex. ─
const nonInvertingLoop: CoasterElementDef = {
  id: 'non-inverting-loop',
  points: [
    [-12, 1, 0],
    [-6.5, 1.2, 0],
    [-2.6, 1.6, 0],
    [0, 1.8, 0.15], // bottom — entry
    [3.6, 3.4, 0.3],
    [5.0, 6.6, 0.45],
    [4.2, 10.0, 0.6],
    [1.6, 12.4, 0.75],
    [0, 12.9, 0.85], // apex — twisted upright (airtime)
    [-1.6, 12.4, 0.95],
    [-4.2, 10.0, 1.1],
    [-5.0, 6.6, 1.25],
    [-3.6, 3.4, 1.4],
    [0, 1.8, 1.5], // bottom — exit
    [2.6, 1.6, 1.5],
    [6.5, 1.2, 1.5],
    [12, 1, 1.5],
  ],
  roll: (t) => Math.PI * Math.sin(Math.PI * smoothstep(0.16, 0.84, t)),
  keyPoints: [
    { t: 0.16, label: 'approach' },
    { t: 0.34, label: 'climb' },
    { t: 0.5, label: 'airtime' },
    { t: 0.68, label: 'land' },
    { t: 0.86, label: 'leave' },
  ],
  duration: 8,
};

// ── Pretzel loop — the flying-coaster signature: the train dives steeply down
//    the middle, loops around the bottom, and the loop body crosses back over
//    the dive strand — the pretzel knot. A steady depth drift makes the
//    crossing pass over/under, not through. ────────────────────────────────────
const pretzelLoop: CoasterElementDef = {
  id: 'pretzel-loop',
  points: [
    [-2.2, 13, 0],
    [-0.6, 10, 0.15],
    [0.2, 6, 0.3],
    [0.7, 2.2, 0.5], // steep dive down the middle
    [0.7, 1.2, 0.7],
    [2.93, 1.75, 0.78],
    [4.65, 3.27, 0.87],
    [5.47, 5.42, 0.95],
    [5.19, 7.7, 1.04],
    [3.88, 9.59, 1.12],
    [1.85, 10.66, 1.21], // over the top
    [-0.45, 10.66, 1.29],
    [-2.48, 9.59, 1.38],
    [-3.79, 7.7, 1.46],
    [-4.07, 5.42, 1.55],
    [-3.25, 3.27, 1.63], // down the back — crosses over the dive strand
    [-1.53, 1.75, 1.72],
    [0.7, 1.2, 1.8],
    [-2.5, 2.6, 2.0], // climb out to the left
    [-6, 3.4, 2.1],
    [-11, 4, 2.2],
  ],
  keyPoints: [
    { t: 0.18, label: 'dive' },
    { t: 0.3, label: 'enterLoop' },
    { t: 0.5, label: 'inverted' },
    { t: 0.72, label: 'exitLoop' },
    { t: 0.88, label: 'leave' },
  ],
  duration: 9,
  defaultView: 'follow',
};

// ── Sidewinder — half a vertical loop pulling up into an inverted top, then a
//    half-corkscrew that rolls the train upright while turning ≈90° to the side
//    (the building block of Vekoma's Boomerang). Compact: an inversion plus a
//    sharp directional change. ─────────────────────────────────────────────────
const sidewinder: CoasterElementDef = {
  id: 'sidewinder',
  points: [
    [-11, 1, 0],
    [-6, 1, 0],
    [-2.5, 1.5, 0],
    [0, 2.4, 0], // bottom — heading +x
    [3.2, 4.6, 0],
    [4.5, 8.2, 0],
    [3.3, 11.0, 0],
    [0.6, 12.2, 0.5], // inverted top — begin the half-corkscrew + 90° turn
    [-1.4, 12.1, 2.2],
    [-2.4, 11.7, 5.0], // rolling upright through the turn toward +z
    [-2.9, 11.5, 8.5],
    [-3.1, 11.4, 12], // exit — upright, at height, heading +z
  ],
  roll: (t) => Math.PI * smoothstep(0.56, 0.88, t),
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.45, label: 'inverted' },
    { t: 0.66, label: 'rollOut' },
    { t: 0.86, label: 'leave' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Flat spin — a corkscrew laid almost on its side: the train barrel-rolls a
//    full 360° while sweeping through a wide, nearly level horizontal arc, so
//    the spiral reads flat and sweeping rather than rising over a hump. ────────
const flatSpin: CoasterElementDef = {
  id: 'flat-spin',
  points: [
    [-13, 4.5, -4.5],
    [-8, 4.6, -3.5],
    [-3.5, 4.7, -1.2],
    [0, 4.8, 1.8], // mid — rolling through the flat sweep
    [2.6, 4.7, 5.5],
    [3.2, 4.6, 10],
    [3.3, 4.5, 14],
  ],
  roll: (t) => TAU * smoothstep(0.2, 0.8, t),
  keyPoints: [
    { t: 0.2, label: 'rollIn' },
    { t: 0.5, label: 'inverted' },
    { t: 0.8, label: 'rollOut' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Zero-G winder — a zero-G roll with a built-in directional change: the train
//    floats over an airtime crest, barrel-rolls a full 360° at the weightless
//    apex, and curves away so it enters and exits on different headings. ───────
const zeroGWinder: CoasterElementDef = {
  id: 'zero-g-winder',
  points: [
    [-12, 1.5, -3.5],
    [-7, 2.6, -2.6],
    [-3, 5.2, -1],
    [0, 6.6, 1.2], // weightless crest — roll + turn
    [3, 5.6, 3.6],
    [7, 3, 5.4],
    [12, 1.5, 6.6],
  ],
  roll: (t) => TAU * smoothstep(0.22, 0.78, t),
  keyPoints: [
    { t: 0.22, label: 'rollIn' },
    { t: 0.5, label: 'inverted' },
    { t: 0.78, label: 'rollOut' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// ── Helix — the track spirals ~1¼ turns around a vertical axis while gently
//    descending (a sustained, banked turn). Curves away into depth, so it opens
//    in the follow view. ─────────────────────────────────────────────────────
const helixElement: CoasterElementDef = {
  id: 'helix',
  points: [
    [-12, 6, 0],
    [-7, 5.8, 0],
    [-4, 5.5, 0], // enter the spiral (θ≈180°)
    [-2.8, 5.1, 2.8],
    [0, 4.8, 4],
    [2.8, 4.4, 2.8],
    [4, 4.0, 0],
    [2.8, 3.6, -2.8],
    [0, 3.2, -4],
    [-2.8, 2.9, -2.8],
    [-4, 2.6, 0], // one full turn
    [-2.8, 2.3, 2.8],
    [0, 2.0, 4],
    [2.8, 1.8, 2.8],
    [4, 1.6, 0],
    [7, 1.4, 0],
    [12, 1.2, 0],
  ],
  keyPoints: [
    { t: 0.22, label: 'approach' },
    { t: 0.8, label: 'leave' },
  ],
  duration: 9,
  defaultView: 'follow',
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
  'first-drop': firstDrop,
  'beyond-vertical-drop': beyondVerticalDrop,
  'cobra-roll': cobraRoll,
  batwing,
  'barrel-roll-drop': barrelRollDrop,
  'banana-roll': bananaRoll,
  helix: helixElement,
  horseshoe,
  overbank,
  'wave-turn': waveTurn,
  'outerbanked-turn': outerbankedTurn,
  'raven-turn': ravenTurn,
  'inclined-loop': inclinedLoop,
  'non-inverting-loop': nonInvertingLoop,
  'sea-serpent': seaSerpent,
  'pretzel-loop': pretzelLoop,
  sidewinder,
  'flat-spin': flatSpin,
  'zero-g-winder': zeroGWinder,
};

export function getCoasterElement(id: string): CoasterElementDef | undefined {
  return COASTER_ELEMENTS[id];
}

export function hasCoasterElement(id: string): boolean {
  return id in COASTER_ELEMENTS;
}
