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
    [-7, 1.1, 0],
    [-3.2, 1.5, 0.1], // entry leg, heading +x
    [-2.0, 4.8, 0.3],
    [-1.6, 9.2, 0.6],
    [-1.3, 12.1, 1.0], // head 1 (inverted), splayed −x/+z
    [-0.5, 11.4, 1.6],
    [-0.1, 8.8, 2.0],
    [0.0, 7.2, 2.4], // valley between the heads
    [0.1, 8.8, 2.8],
    [0.5, 11.4, 3.2],
    [1.0, 12.1, 3.5], // head 2 (inverted), splayed +x/+z
    [0.4, 9.2, 3.8],
    [-0.6, 4.8, 4.0],
    [-2.2, 1.5, 4.1], // exit leg, heading −x (opposite the entry)
    [-6, 1.1, 4.1],
    [-11, 1, 4.1],
  ],
  keyPoints: [
    { t: 0.2, label: 'enterLoop' },
    { t: 0.36, label: 'inverted' },
    { t: 0.5, label: 'exitLoop' },
    { t: 0.64, label: 'inverted' },
    { t: 0.8, label: 'leave' },
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
    [-8, 1, 0],
    [-4.5, 1.5, 0],
    [-3.5, 4, -0.2],
    [-3, 8, -0.55],
    [-1.5, 12, -0.7], // head 1 (inverted)
    [0, 10.8, -0.3],
    [0, 9, 0], // valley between the two heads
    [0, 10.8, 0.3],
    [1.5, 12, 0.7], // head 2 (inverted, mirrored the other way)
    [3, 8, 0.55],
    [3.5, 4, 0.2],
    [4.5, 1.5, 0],
    [8, 1, 0],
    [13, 1, 0], // exit — same direction as entry
  ],
  keyPoints: [
    { t: 0.2, label: 'enterLoop' },
    { t: 0.37, label: 'inverted' },
    { t: 0.5, label: 'exitLoop' },
    { t: 0.63, label: 'inverted' },
    { t: 0.8, label: 'leave' },
  ],
  duration: 9,
};

// ── Batwing — like a cobra roll but stretched vertically: up into a first
//    inverted head, a deep dive almost to the ground, then a mirrored second
//    inverted head before exiting. ───────────────────────────────────────────
const batwing: CoasterElementDef = {
  id: 'batwing',
  points: [
    [-13, 1, 0],
    [-8, 1, 0],
    [-4.5, 1.6, 0],
    [-3, 5, -0.25],
    [-2.2, 9.5, -0.6],
    [-1.4, 12.5, -0.7], // head 1 (inverted)
    [-1.2, 10.5, -0.5],
    [-1.6, 5.5, -0.2],
    [-1.2, 2.2, 0], // deep dive near the ground (between the heads)
    [1.2, 2.2, 0],
    [1.6, 5.5, 0.2],
    [1.2, 10.5, 0.5],
    [1.4, 12.5, 0.7], // head 2 (inverted, mirrored)
    [2.2, 9.5, 0.6],
    [3, 5, 0.25],
    [4.5, 1.6, 0],
    [8, 1, 0],
    [13, 1, 0],
  ],
  keyPoints: [
    { t: 0.22, label: 'enterLoop' },
    { t: 0.34, label: 'inverted' },
    { t: 0.5, label: 'exitLoop' },
    { t: 0.66, label: 'inverted' },
    { t: 0.8, label: 'leave' },
  ],
  duration: 9,
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
    [-12, 1, 0],
    [-7, 1.2, 0],
    [-3.2, 1.6, 0],
    [-1.1, 1.6, 0], // bottom — entry (moving +x)
    [1.58, 2.22, 0.38],
    [3.68, 3.93, 1.45],
    [4.77, 6.35, 2.94],
    [4.63, 8.91, 4.54],
    [3.33, 11.04, 5.85],
    [1.21, 12.24, 6.6], // top — leaned over toward +z
    [-1.21, 12.24, 6.6],
    [-3.33, 11.04, 5.85],
    [-4.63, 8.91, 4.54],
    [-4.77, 6.35, 2.94],
    [-3.68, 3.93, 1.45],
    [-1.58, 2.22, 0.38],
    [1.1, 1.6, 0], // bottom — exit (moving +x, beside the entry)
    [3.2, 1.6, 0],
    [7, 1.2, 0],
    [12, 1, 0],
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

// ── Pretzel loop — the flying-coaster signature: entered from the TOP, the
//    train dives head-first toward the ground, loops around and climbs back
//    out, so the entry and exit strands cross near the top in a pretzel. A
//    steady depth drift makes the crossing pass over/under, not through. ───────
const pretzelLoop: CoasterElementDef = {
  id: 'pretzel-loop',
  points: [
    [-12, 12, 0],
    [-7.5, 11.6, 0.2],
    [-4.2, 10.4, 0.5], // dive in from height
    [-2.37, 12.28, 0.7],
    [-0.1, 12.8, 0.79],
    [2.19, 12.35, 0.89],
    [4.1, 11.02, 0.98],
    [5.29, 9.02, 1.07],
    [5.58, 6.71, 1.17],
    [4.9, 4.49, 1.26],
    [3.37, 2.73, 1.35],
    [1.26, 1.74, 1.45], // loop bottom
    [-1.07, 1.7, 1.54],
    [-3.21, 2.61, 1.63],
    [-4.8, 4.32, 1.73],
    [-5.56, 6.52, 1.82],
    [-5.36, 8.84, 1.91],
    [-4.23, 10.87, 2.01],
    [-2.37, 12.28, 2.1], // back over the top — crosses the dive strand
    [-4.5, 10.6, 2.3],
    [-8, 11.4, 2.2],
    [-12, 12, 2.1], // climb out at height
  ],
  keyPoints: [
    { t: 0.16, label: 'approach' },
    { t: 0.34, label: 'enterLoop' },
    { t: 0.52, label: 'inverted' },
    { t: 0.72, label: 'exitLoop' },
    { t: 0.88, label: 'leave' },
  ],
  duration: 9,
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
};

export function getCoasterElement(id: string): CoasterElementDef | undefined {
  return COASTER_ELEMENTS[id];
}

export function hasCoasterElement(id: string): boolean {
  return id in COASTER_ELEMENTS;
}
