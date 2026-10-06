/**
 * The coaster-element registry: one entry per glossary term that has a 3-D player, each pure data
 * (the demo curve's control points, an optional `roll(t)` and the timeline key points).
 *
 * The scene builds a parallel-transport frame along the points (kit.ts), so planar figures (loops,
 * hills) invert with no extra data and only barrel rolls supply `roll(t)`. Keep everything in a box
 * around the origin: travel along +x, the frontal camera looks from +z, the mountain sits at -z.
 */

/** A marker on the player's timeline scrubber. */
export interface ElementKeyPoint {
  /** Progress along the run, 0..1. */
  t: number;
  /** Short label key shown on the timeline (localised in the player). */
  label: string;
}

/** One element's demo run: the curve, how the train rolls and moves along it, and its hardware. */
export interface CoasterElementDef {
  id: string;
  /** Control points of the full demo curve: [x, y, z]. */
  points: [number, number, number][];
  /** Extra roll (radians) about the tangent at progress t∈[0,1]. Omit for planar figures. */
  roll?: (t: number) => number;
  /**
   * Dual-track element (e.g. a celestial spin): `points` is then the shared centreline, and the
   * scene builds two tracks offset by ±gap/2 around it, rotated by `twist(t)` so they wind around
   * each other. Each track gets its own train.
   */
  dual?: { gap: number; twist: (t: number) => number; roll?: (t: number) => number };
  keyPoints: ElementKeyPoint[];
  /** Seconds for one pass of the run (default 9). */
  duration?: number;
  /**
   * Speed profile: maps timeline progress (0..1) to a position along the curve (0..1). The curve
   * is arc-length parameterised, so without it the speed is constant, which suits almost every
   * figure. Supply it only when the speed change is the element (a launch, a scorpion tail's hang,
   * a drop track's stop). Must be monotonic, start at 0 and end at 1.
   */
  pace?: (t: number) => number;
  /**
   * Initial camera. Turn-based figures (helix, overbanked turn) curve away into depth and read
   * poorly head-on, so they open in `'follow'`. Omit for the usual `'front'`.
   */
  defaultView?: 'front' | 'follow' | 'onboard';
  /**
   * Linear-motor launch hardware: paired stator fins along the track centre,
   * over `from`..`to` of the run (progress 0..1).
   *
   * Modelled as PAIRS flanking the centreline rather than one strip, because
   * that is what the real thing is: the stators sit either side of a reaction
   * fin carried under the train's bogies, and the common systems are
   * deliberately symmetric two-fin designs — Intrasys states the symmetry is
   * what keeps horizontal forces off the train.
   *
   * Only meaningful over straight, level track. Put it on the run-in, not the
   * climb: past the point where the track lifts, the real hardware has stopped.
   */
  lsm?: { from: number; to: number };
  /**
   * Friction-brake hardware: caliper housings flanking the track centre over
   * `from`..`to` of the run (progress 0..1). Real brake runs close hydraulic
   * pads on a fin under the train, so the housings sit in the middle of the
   * track like the stators do, but longer and in a signal colour so a brake
   * section is never mistaken for a launch.
   *
   * Cover the whole stopping distance, train length included: the train must
   * come to rest with its last car still inside the run.
   */
  brake?: { from: number; to: number };
  /**
   * Turntable: a rotating disc under the train at `at`, which must lie on the
   * curve with a straight stretch of at least `radius` either side. The train
   * rides in, stops with its centre on the disc and turns on the spot by
   * `yaw(t)` radians about the vertical, then leaves the way it came, so
   * `pace` runs back down the curve instead of staying monotonic.
   *
   * The track under the disc is not drawn as part of the curve; the disc
   * carries its own rails and turns with the train. Put the curve's end inside
   * the disc, one half-train past `at`, so the cars have track to stand on.
   */
  turntable?: { at: [number, number, number]; radius: number; yaw: (t: number) => number };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
const TAU = Math.PI * 2;

// Vertical loop: a near-circular loop in the x-y plane. A small, steady
// depth drift (z) means the entry and exit legs cross OVER/UNDER each other
// at the bottom (as a real loop does) instead of intersecting in-plane, so
// the track never appears to drive through itself. Parallel transport takes
// the train fully inverted at the apex with no explicit roll.
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

// Corkscrew, a true helix: the centreline itself spirals a full 360° around
// a horizontal axis along the travel direction (y and z trace a circle while
// x advances), and the train barrel-rolls in sync, so the two rails wind
// around each other like a screw thread. The spiralling PATH is what sets it
// apart from the banana roll (which only bows out flat to one side).
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

// Airtime hill: a planar parabolic camelback; riders float at the crest. No
// roll, never inverts (the tangent stays well under vertical).
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

// Celestial Spin: Mack Rides' patented dual-track element, the signature move of Stardust Racers
// at Universal Epic Universe. The tracks invert around each other over the peak, a double-helix
// intertwine (not a high-five, where the tracks only bank side by side).
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
  // The two tracks wind a full turn around each other while both trains barrel-roll a full turn,
  // so both invert, one hanging upside-down just above the other.
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

// Heartline roll: a 360° roll on essentially LEVEL track, rotating the train
// around the riders' heart line (no hill, no lateral drift).
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

// Zero-G roll: a 360° roll timed to the crest of an airtime hill, so it
// happens in a weightless float (the roll axis ≈ the riders).
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

// Zero-G stall: like a zero-G roll, but the train rolls inverted at the
// crest and HANGS upside-down for a beat before rolling back upright.
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

// Bunny hops: a SERIES of small, low hills taken in quick succession, each
// popping a little ejector airtime.
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

// Top hat: a tall, near-vertical climb, a sharp crest and a near-vertical
// drop; the signature element of many launch coasters.
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

// Immelmann: half a vertical loop (up and over, inverting via parallel
// transport) then a half-twist that rolls the train upright as it flies out
// in the OPPOSITE direction at height.
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

// Dive loop, the Immelmann reversed: the train twists up and over, then
// dives back toward the ground through a half vertical loop.
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

// First drop, the big descent off the lift/launch crest: a steep, floaty
// plunge that levels out along the ground.
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

// Beyond-vertical drop, a drop steeper than 90°: the track tucks back under
// itself (overhangs) at the steepest point before levelling out.
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

// Cobra roll, a double inversion that REVERSES direction: up into a first
// inverted head, over and down, straight into a mirrored second head, then
// out along the ground travelling the OPPOSITE way (exit leg parallel to the
// entry, offset sideways). The two heads lean the same way (the cobra hood);
// the z-drift carries the reversal and keeps the legs from overlapping.
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

// Sea serpent: like a cobra roll's two inverted heads, but the corkscrews
// face OPPOSITE ways so the train exits the SAME direction it entered (it
// flows straight through instead of reversing).
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

// Batwing, two inverted "wings": up and over a first inverted hood, a deep
// dive almost to the ground, then up and over a mirrored second hood. Wider
// and lower than a cobra roll (the spread-wing silhouette). Each hood is a
// real x-y loop so the train fully inverts.
const batwing: CoasterElementDef = {
  id: 'batwing',
  points: [
    [-12, 1, 0],
    [-8, 1.1, 0],
    [-5.5, 1.4, 0],
    [-4, 1.9, 0],
    [-1.83, 2.61, 0.15],
    [-0.48, 4.46, 0.3],
    [-0.48, 6.74, 0.45],
    [-1.83, 8.59, 0.6],
    [-4, 9.3, 0.75], // wing 1 — inverted over the top
    [-6.17, 8.59, 0.9],
    [-7.52, 6.74, 1.05],
    [-7.52, 4.46, 1.2],
    [-6.17, 2.61, 1.35],
    [-4, 1.9, 1.5],
    [-2, 1.5, 1.7], // deep dive across the bottom (the body)
    [0, 1.2, 2.0],
    [2, 1.5, 2.3],
    [4, 1.9, 2.5],
    [6.17, 2.61, 2.65],
    [7.52, 4.46, 2.8],
    [7.52, 6.74, 2.95],
    [6.17, 8.59, 3.1],
    [4, 9.3, 3.25], // wing 2 — inverted over the top
    [1.83, 8.59, 3.4],
    [0.48, 6.74, 3.55],
    [0.48, 4.46, 3.7],
    [1.83, 2.61, 3.85],
    [4, 1.9, 4],
    [5.5, 1.4, 4.1],
    [8, 1.1, 4.1],
    [12, 1, 4.1],
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

// Barrel-roll drop: a 360° barrel roll performed while plunging down a
// drop, so the inversion and the descent happen together.
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

// Banana roll: a 360° roll along a curved, arcing track (the path bows out
// to the side like a banana while the train rolls).
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

// Horseshoe, a 180° turnaround perched on top of a hill: the train climbs,
// sweeps through a heavily-banked (≈90°) semicircle at the apex and comes
// back down, now travelling the opposite direction. A steady depth offset
// keeps the up-leg and down-leg from overlapping in view.
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

// Overbanked turn: a sweeping, near-level curve in which the track tilts
// PAST vertical (≈105°), so riders lean over beyond upside-down without ever
// fully inverting. Sustained left turn → one steady direction of bank.
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

// Wave turn, RMC's banked turnaround with an airtime crest: the train rolls
// to ≈90° on its side, floats over a camelback while fully banked, and exits
// the opposite direction. Like a horseshoe, but with airtime at the top.
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

// Outward-banked turn, the opposite of an overbank: the track banks the
// "wrong" way (tilting outward, ≈40°) so the curve throws riders to the
// OUTSIDE instead of cradling them into it.
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

// Raven turn, a half-inversion turnaround: the train climbs the front of a
// loop, rolls inverted over the top, then dives back down and levels out at
// its starting height, now travelling the opposite way. Planar (parallel
// transport inverts it); a small depth drift separates the climb and dive.
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

// Inclined loop: a vertical loop whose plane is tilted off-vertical, so it
// leans steadily to one side as it rises. Parallel transport still inverts
// the train over the top; the lean comes from a depth (z) drift.
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

// Non-inverting loop: a tall, loop-shaped hill where the track twists ≈180°
// over the crest so the train stays UPRIGHT (airtime) instead of going fully
// inverted. The roll bump cancels the loop's natural inversion at the apex.
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

// Pretzel loop, the flying-coaster signature: the train dives steeply down
// the middle, loops around the bottom, and the loop body crosses back over
// the dive strand — the pretzel knot. A steady depth drift makes the
// crossing pass over/under, not through.
const pretzelLoop: CoasterElementDef = {
  id: 'pretzel-loop',
  points: [
    [-2.2, 13, 0],
    [-0.6, 10, 0.1],
    [0.2, 6, 0.2],
    [0.7, 2.2, 0.35], // steep dive down the middle
    [0.7, 1.2, 0.55],
    [2.93, 1.75, 0.68],
    [4.65, 3.27, 0.81],
    [5.47, 5.42, 0.94],
    [5.19, 7.7, 1.07],
    [3.88, 9.59, 1.2],
    [1.85, 10.66, 1.33], // over the top
    [-0.45, 10.66, 1.47],
    [-2.48, 9.59, 1.6],
    [-3.79, 7.7, 1.73],
    [-4.07, 5.42, 1.86],
    [-3.25, 3.27, 1.99], // down the back — crosses over the dive strand
    [-1.53, 1.75, 2.12],
    [0.7, 1.2, 2.25], // loop bottom
    [3.5, 2.2, 2.45], // climb out forward (+x), clear of the loop and dive
    [7.5, 3.1, 2.6],
    [12, 3.8, 2.7],
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

// Sidewinder: half a vertical loop pulling up into an inverted top, then a
// half-corkscrew that rolls the train upright while turning ≈90° to the side
// (the building block of Vekoma's Boomerang). Compact: an inversion plus a
// sharp directional change.
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

// Flat spin, a corkscrew laid almost on its side: the train barrel-rolls a
// full 360° while sweeping through a wide, nearly level horizontal arc, so
// the spiral reads flat and sweeping rather than rising over a hump.
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

// Zero-G winder, a zero-G roll with a built-in directional change: the train
// floats over an airtime crest, barrel-rolls a full 360° at the weightless
// apex, and curves away so it enters and exits on different headings.
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

// Camelback: a series of rounded airtime hills in a row; riders float over
// each crest. Purely planar, never inverts.
const camelback: CoasterElementDef = {
  id: 'camelback',
  points: [
    [-13, 1.2, 0],
    [-10, 1.5, 0],
    [-7, 5.6, 0],
    [-5, 6.8, 0], // hill 1 crest
    [-3, 5.6, 0],
    [-1.2, 2.6, 0],
    [1.2, 2.6, 0],
    [3, 5.6, 0],
    [5, 6.8, 0], // hill 2 crest
    [7, 5.6, 0],
    [10, 1.5, 0],
    [13, 1.2, 0],
  ],
  keyPoints: [
    { t: 0.18, label: 'approach' },
    { t: 0.36, label: 'airtime' },
    { t: 0.64, label: 'airtime' },
    { t: 0.84, label: 'land' },
  ],
  duration: 8,
};

// Quad down: four successive DESCENDING airtime hops, each crest lower than
// the last, for rapid-fire airtime near the end of a layout.
const quadDown: CoasterElementDef = {
  id: 'quad-down',
  points: [
    [-13, 10, 0],
    [-9.5, 10, 0],
    [-7.6, 8, 0],
    [-6.3, 8.7, 0], // hop 1
    [-4.9, 6.3, 0],
    [-3.7, 6.9, 0], // hop 2
    [-2.3, 4.6, 0],
    [-1.1, 5.1, 0], // hop 3
    [0.4, 3.1, 0],
    [1.6, 3.5, 0], // hop 4
    [3.1, 1.9, 0],
    [6, 1.2, 0],
    [13, 1, 0],
  ],
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.42, label: 'airtime' },
    { t: 0.66, label: 'airtime' },
    { t: 0.86, label: 'land' },
  ],
  duration: 7,
};

// S-hill: an airtime hill that weaves an S in plan as it lifts, so riders
// get a lateral kick on top of the float. The S is in the path (depth).
const sHill: CoasterElementDef = {
  id: 's-hill',
  points: [
    [-13, 1.2, 0],
    [-8.5, 2.2, -2.2],
    [-4.5, 5.2, -2.6],
    [-1.5, 6.6, -1.2],
    [0, 6.8, 0], // crest
    [1.5, 6.6, 1.2],
    [4.5, 5.2, 2.6],
    [8.5, 2.2, 2.2],
    [13, 1.2, 0],
  ],
  keyPoints: [
    { t: 0.2, label: 'approach' },
    { t: 0.5, label: 'airtime' },
    { t: 0.8, label: 'leave' },
  ],
  duration: 8,
  defaultView: 'follow',
};

// Lift hill: the mechanically-powered straight climb to the highest point,
// cresting into the first drop.
const lifthill: CoasterElementDef = {
  id: 'lifthill',
  points: [
    [-13, 1, 0],
    [-10, 1.2, 0],
    [-7, 3.4, 0],
    [-4, 6.6, 0],
    [-1, 9.8, 0],
    [1.6, 11.8, 0],
    [3.6, 12, 0], // crest
    [5.2, 11.2, 0],
    [7, 8.6, 0],
    [9, 5, 0],
    [11, 2.2, 0],
    [13, 1, 0],
  ],
  keyPoints: [
    { t: 0.16, label: 'approach' },
    { t: 0.45, label: 'climb' },
    { t: 0.62, label: 'crest' },
    { t: 0.85, label: 'land' },
  ],
  duration: 9,
};

// Block brake: a level mid-course brake run after a drop. The caliper
// housings close on the fin under the train, which slows to a dead stop and
// is held there (the block ahead is occupied), then released into the next
// hill. `pace` is the whole point: a trim brake only bleeds speed, a block
// brake stops the train. Reference: Wikipedia "Brake (roller coaster)" and
// Coaster101 "Brakes, Blocks, and Sensors" — brake runs split into trim brakes
// (slow only) and block brakes (can stop and hold), one block per section
// between lift hill, mid-course brake and end brake.
const blockBrake: CoasterElementDef = {
  id: 'block-brake',
  points: [
    [-13, 7, 0],
    [-11, 6.9, 0],
    [-9, 5.2, 0],
    [-7, 2.6, 0],
    [-5.2, 1.3, 0],
    [-3.5, 1, 0], // level brake run starts
    [-1, 1, 0],
    [1.5, 1, 0],
    [4, 1, 0], // level brake run ends
    [6, 1.3, 0],
    [8.4, 3, 0],
    [10.6, 4.4, 0],
    [13, 4.6, 0],
  ],
  keyPoints: [
    { t: 0.12, label: 'approach' },
    { t: 0.38, label: 'brake' },
    { t: 0.55, label: 'hold' },
    { t: 0.78, label: 'release' },
    { t: 0.95, label: 'leave' },
  ],
  duration: 10,
  // Track fractions: `brake` is the run, REST (below) is where the head of the
  // train stops. Approach and braking speeds are matched at t = 0.3
  // (A / 0.3 = 2D / 0.2) so the handover does not read as a jerk.
  brake: { from: 0.34, to: 0.58 },
  pace: (t) => {
    const A = 0.4;
    const REST = A + A / 3;
    if (t < 0.3) return A * (t / 0.3);
    // Pads closed: constant deceleration to a standstill.
    if (t < 0.5) {
      const u = (t - 0.3) / 0.2;
      return A + (REST - A) * (1 - (1 - u) * (1 - u));
    }
    // Held: the train does not move.
    if (t < 0.6) return REST;
    // Released: ease out of the standstill, then roll on.
    const u = Math.min(1, (t - 0.6) / 0.4);
    return REST + (1 - REST) * Math.pow(u, 1.4);
  },
};

// Trim brake: a brake run on a hill crest that only bleeds speed. The train
// drops, climbs the next hill and meets the caliper housings at the top; the
// pads close part-way, so it slows (here to about a third of its speed) but is
// never held, then rolls on down the far side and gathers speed again. This is
// the difference from the block brake above: no standstill, no hold, and the
// run sits on a curve instead of a level stretch. Reference: Wikipedia "Brake
// (roller coaster)" — "Trim brakes are brake run sections that reduce the
// speed of the train but cannot stop the train completely", engineered in or
// retrofitted where trains run faster than intended.
// Relative speed at track position s (1 = free-rolling). Keyed to the position
// of the caliper run (0.5..0.72), not to the clock: the train must already be
// slowing when it meets the housings and speed up only once it has left them.
const TRIM_SPEED = (s: number): number => {
  const slow = 0.35;
  if (s < 0.1) return 0.55 + 0.45 * smoothstep(0, 0.1, s); // rolling in off the drop
  const slowed = 1 + (slow - 1) * smoothstep(0.46, 0.54, s); // pads close
  return slowed + (1 - slow) * smoothstep(0.7, 0.86, s); // pads open, speed returns
};
// Time to reach each track position, integrated once; `pace` inverts it so the
// timeline (t) maps to a position (s) that honours the speed profile above.
const TRIM_PACE: number[] = (() => {
  const n = 400;
  const time = [0];
  for (let i = 1; i <= n; i++) time.push(time[i - 1] + 1 / n / TRIM_SPEED((i - 0.5) / n));
  const total = time[n];
  const pace: number[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    while (j < n - 1 && time[j + 1] / total < t) j++;
    const t0 = time[j] / total;
    const t1 = time[j + 1] / total;
    pace.push((j + (t1 > t0 ? (t - t0) / (t1 - t0) : 0)) / n);
  }
  pace[0] = 0;
  pace[n] = 1;
  return pace;
})();
const trimBrake: CoasterElementDef = {
  id: 'trim-brake',
  points: [
    [-13, 8, 0],
    [-11, 7.8, 0],
    [-9, 6, 0],
    [-7, 3.2, 0],
    [-5, 1.4, 0], // valley
    [-3, 1.5, 0],
    [-1, 3, 0],
    [1, 5.4, 0],
    [3, 7.2, 0], // hill crest — brake run starts on the way up
    [5, 7.9, 0],
    [7, 7.4, 0],
    [9, 5.8, 0],
    [11, 3.4, 0],
    [13, 2.2, 0],
  ],
  keyPoints: [
    { t: 0.12, label: 'approach' },
    { t: 0.5, label: 'brake' },
    { t: 0.9, label: 'leave' },
  ],
  duration: 10,
  brake: { from: 0.5, to: 0.72 },
  pace: (t) => {
    const n = TRIM_PACE.length - 1;
    const x = Math.min(1, Math.max(0, t)) * n;
    const i = Math.min(n - 1, Math.floor(x));
    return TRIM_PACE[i] + (TRIM_PACE[i + 1] - TRIM_PACE[i]) * (x - i);
  },
};

// Interlocking loops: two vertical loops whose planes lean opposite ways so
// they cross through each other (chain-link). The train rides both; each
// inverts via parallel transport.
const interlockingLoops: CoasterElementDef = {
  id: 'interlocking-loops',
  points: [
    [-13, 1, -1.4],
    [-9, 1.2, -1],
    [-2.6, 2.1, 0.17],
    [-0.28, 2.78, 0.58],
    [1.31, 4.61, 1.48],
    [1.66, 7.01, 2.61],
    [0.65, 9.22, 3.67],
    [-1.39, 10.53, 4.34], // loop A top (leaning +z)
    [-3.81, 10.53, 4.47],
    [-5.85, 9.22, 4.05],
    [-6.86, 7.01, 3.25],
    [-6.51, 4.61, 2.37],
    [-4.92, 2.78, 1.73],
    [-2.6, 2.1, 1.57],
    [-0.6, 1.6, 2.5], // cross to loop B
    [1.2, 1.6, 2.7],
    [2.6, 2.1, 2.73],
    [4.92, 2.78, 2.57],
    [6.51, 4.61, 1.93],
    [6.86, 7.01, 1.05],
    [5.85, 9.22, 0.25],
    [3.81, 10.53, -0.17], // loop B top (leaning −z, plane crosses A)
    [1.39, 10.53, -0.04],
    [-0.65, 9.22, 0.63],
    [-1.66, 7.01, 1.69],
    [-1.31, 4.61, 2.82],
    [0.28, 2.78, 3.72],
    [2.6, 2.1, 4.13],
    [9, 1.2, 4.4],
    [13, 1, 4.5],
  ],
  keyPoints: [
    { t: 0.16, label: 'enterLoop' },
    { t: 0.3, label: 'inverted' },
    { t: 0.5, label: 'exitLoop' },
    { t: 0.7, label: 'inverted' },
    { t: 0.84, label: 'leave' },
  ],
  duration: 9,
  defaultView: 'follow',
};

// Helix: the track spirals ~1¼ turns around a vertical axis while gently
// descending (a sustained, banked turn). Curves away into depth, so it opens
// in the follow view.
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

// Launch: the element is the ACCELERATION, so the geometry is deliberately
// plain: a dead-straight LSM stretch out of the station that rises into a
// speed hill. `pace` does the work — the train crawls out of the station,
// the launch fires, and it coasts over the hill. Reference: Intamin/Vekoma
// LSM launch tracks (Taron, TRON), which are level and straight so the fins
// can engage before the layout starts.
const launch: CoasterElementDef = {
  id: 'launch',
  points: [
    [-13, 1, 0],
    [-10.5, 1, 0],
    [-7, 1, 0],
    [-3, 1, 0],
    [0.5, 1.1, 0],
    [3.5, 1.9, 0],
    [6, 3.6, 0],
    [8, 6, 0],
    [9.6, 8.4, 0],
    [11.2, 9.7, 0],
    [13, 10, 0],
  ],
  // The motors only act over the stator run, so only that stretch accelerates; past the last fin
  // the train coasts and bleeds speed climbing. The phase boundary at 0.34 equals `lsm.to`, and
  // exit and entry speeds are matched (0.32·1.7/0.30 ≈ 0.66·1.6/0.58) so the handover is no jerk.
  // A harder launch would put the train over the crest before the timeline ends.
  pace: (t) => {
    // Crawl out of the station.
    if (t < 0.12) return 0.02 * (t / 0.12);
    // On the motors: ease-in over the stators, ~5× the crawl speed by the last fin.
    if (t < 0.42) {
      const u = (t - 0.12) / 0.3;
      return 0.02 + 0.32 * Math.pow(u, 1.7);
    }
    // Off the motors: coasting, bleeding speed into the climb.
    // Clamped: at t = 1 the division gives 1.0000000000000002, and Math.pow(-2e-16, 1.6) is NaN,
    // which would strand the train on the last frame.
    const u = Math.min(1, (t - 0.42) / 0.58);
    return 0.34 + 0.66 * (1 - Math.pow(1 - u, 1.6));
  },
  keyPoints: [
    { t: 0.08, label: 'approach' },
    { t: 0.24, label: 'launch' },
    { t: 0.72, label: 'climb' },
  ],
  // Stators over the level run-in only. The curve leaves y=1 at the fifth
  // control point, so the hardware stops before the track starts to lift —
  // which is where it stops on the real ride too.
  lsm: { from: 0.02, to: 0.34 },
  duration: 7,
};

// Vertical lift: a 90° climb up the face of the tower, a short crest and a
// steep drop away. Reference: Gerstlauer Euro-Fighter / Infinity lifts
// (Takabisha, Kärnan), where the car is hauled by a catch-car on a vertical
// face. Kept slow on the way up so the climb reads, then released.
const verticalLift: CoasterElementDef = {
  id: 'vertical-lift',
  points: [
    [-13, 1, 0],
    [-9, 1, 0],
    [-6.2, 1.1, 0],
    [-4.6, 2.2, 0],
    [-4.2, 4.5, 0],
    [-4.2, 7.5, 0],
    [-4.2, 10, 0], // dead vertical face
    [-3.9, 11.6, 0],
    [-2.6, 12.3, 0], // crest
    [-1.2, 11.9, 0],
    [-0.2, 10.2, 0],
    [0.6, 7, 0],
    [1.8, 3.4, 0],
    [4, 1.4, 0],
    [8, 1, 0],
    [13, 1, 0],
  ],
  // slow, steady haul up the face; normal speed once it is over the crest
  pace: (t) => (t < 0.55 ? (t / 0.55) * 0.42 : 0.42 + ((t - 0.55) / 0.45) * 0.58),
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.55, label: 'crest' },
    { t: 0.78, label: 'dive' },
  ],
  duration: 9,
};

// Drop track: the train rolls onto a level segment, stops dead, and the
// piece of track it is standing on falls away. Modelled as a level approach,
// a step down, and a level run-out: the `pace` hold at the top and the very
// fast transit of the step are what sell it. Reference: Verbolten and
// Hagrid's, where the drop is a few metres, straight down, in the dark.
const dropTrack: CoasterElementDef = {
  id: 'drop-track',
  points: [
    [-13, 8, 0],
    [-9, 8, 0],
    [-5.5, 8, 0],
    [-2.6, 8, 0], // the movable segment — level, train stops here
    [-1.4, 7.9, 0],
    [-0.6, 6.6, 0],
    [-0.35, 4.6, 0], // the floor goes
    [-0.5, 2.6, 0],
    [-0.1, 1.5, 0],
    [1.4, 1.05, 0],
    [5, 1, 0],
    [9, 1, 0],
    [13, 1, 0],
  ],
  pace: (t) => {
    if (t < 0.34) return (t / 0.34) * 0.3; // roll on
    if (t < 0.5) return 0.3; // dead stop on the segment
    const u = (t - 0.5) / 0.5;
    return 0.3 + 0.7 * Math.pow(u, 1.6); // released — accelerating away
  },
  keyPoints: [
    { t: 0.3, label: 'approach' },
    { t: 0.46, label: 'drop' },
    { t: 0.82, label: 'land' },
  ],
  duration: 8,
};

// Scorpion tail: a launch spike that curls PAST vertical into an overhang,
// so the train climbs inverted and hangs there before falling back the way
// it came. Reference: Mack Rides' 105° spike on Voltron Nevera (2024) — the
// steepest launch section built. x moves BACK as y rises past ~10, which is
// what makes the overhang read; the pace stalls the train at the apex. The
// return leg is the SAME track in reality — it is drawn with a ~1.6 depth
// offset here for the same reason the vertical loop drifts in z: so the two
// legs cross over/under instead of appearing to drive through each other.
const scorpionTail: CoasterElementDef = {
  id: 'scorpion-tail',
  points: [
    [-13, 1, 0],
    [-9, 1, 0],
    [-5.5, 1.1, 0],
    [-2.6, 1.9, 0],
    [-0.5, 3.6, 0.1],
    [0.6, 6, 0.2],
    [0.9, 8.4, 0.3],
    [0.5, 10.4, 0.4],
    [-0.5, 11.8, 0.5], // past vertical: leaning back over the entry
    [-1.6, 12.4, 0.7], // apex, overhanging
    [-2.2, 12.1, 1.1],
    [-2.3, 10.6, 1.4], // falling back the way it came
    [-1.6, 8.4, 1.5],
    [-1, 6, 1.6],
    [-2.2, 3.6, 1.6],
    [-4.4, 1.9, 1.6],
    [-7.5, 1.2, 1.6],
    [-11, 1, 1.6],
    [-13, 1, 1.6],
  ],
  pace: (t) => {
    // hard up the spike, a long float at the overhang, then back down
    if (t < 0.38) return 0.42 * (1 - Math.pow(1 - t / 0.38, 2.2));
    if (t < 0.6) return 0.42 + 0.1 * ((t - 0.6) / 0.22 + 1); // stall across the apex
    return 0.52 + 0.48 * Math.pow((t - 0.6) / 0.4, 1.4);
  },
  keyPoints: [
    { t: 0.18, label: 'launch' },
    { t: 0.42, label: 'overhang' },
    { t: 0.55, label: 'hangtime' },
    { t: 0.85, label: 'land' },
  ],
  duration: 8,
};

// Step-up under-flip, RMC's two-stage inversion: the train "steps up" a
// rising, heavily banked hill, then flips UNDER itself on the way down, so
// the roll happens in the descending half and the train falls out inverted
// into ejector airtime. Reference: Steel Vengeance / Zadra / Untamed. The
// roll is applied over the back half only, which is the whole distinction
// from an ordinary barrel roll over a crest.
const stepUpUnderFlip: CoasterElementDef = {
  id: 'step-up-under-flip',
  points: [
    [-13, 1.2, 0],
    [-9.5, 1.6, 0],
    [-6.5, 3.4, 0],
    [-4, 6.4, 0],
    [-2, 9.2, 0],
    [-0.2, 10.8, 0], // step up complete
    [1.8, 11.1, 0.5],
    [3.8, 10.2, 1.2],
    [5.4, 8, 1.6], // flipping under on the way down
    [6.6, 5.2, 1.5],
    [7.8, 2.6, 1.1],
    [9.8, 1.3, 0.6],
    [13, 1, 0],
  ],
  // the roll lives entirely in the descending half
  roll: (t) => TAU * smoothstep(0.46, 0.86, t),
  keyPoints: [
    { t: 0.3, label: 'climb' },
    { t: 0.5, label: 'rollIn' },
    { t: 0.68, label: 'inverted' },
    { t: 0.88, label: 'airtime' },
  ],
  duration: 9,
  defaultView: 'follow',
};

// Twisted horseshoe roll: a 180° horseshoe turnaround with a barrel roll
// threaded into EACH leg, so the train inverts twice while reversing
// direction. Reference: RMC (Outlaw Run, Steel Vengeance, Zadra). The turn
// itself is carried in z (the exit leg runs back alongside the entry); the
// two rolls are explicit, one per leg, with the horseshoe crest between.
// The depth is kept under ~4 so the frontal camera does not have to pull
// back far enough to flatten the figure into a diagonal smear.
const twistedHorseshoeRoll: CoasterElementDef = {
  id: 'twisted-horseshoe-roll',
  points: [
    [-13, 1.4, 0],
    [-9.5, 1.8, 0],
    [-6.5, 3.8, 0.05],
    [-3.6, 7, 0.15], // roll 1, climbing
    [-1.2, 9.6, 0.4],
    [0.8, 11.2, 0.9],
    [1.9, 11.7, 1.8], // horseshoe crest — swinging across
    [1.9, 11.5, 2.7],
    [0.8, 10.7, 3.4],
    [-1.4, 8.8, 3.7], // roll 2, descending, heading back
    [-4.2, 5.8, 3.85],
    [-7, 3.2, 3.9],
    [-10, 1.7, 3.9],
    [-13, 1.3, 3.9],
  ],
  // one full rotation per leg, with the horseshoe crest un-rolled between them
  roll: (t) => {
    const a = TAU * smoothstep(0.1, 0.36, t);
    const b = TAU * smoothstep(0.62, 0.88, t);
    return a + b;
  },
  keyPoints: [
    { t: 0.24, label: 'inverted' },
    { t: 0.5, label: 'turn' },
    { t: 0.76, label: 'inverted' },
    { t: 0.92, label: 'leave' },
  ],
  duration: 11,
  defaultView: 'follow',
};

// Double down: one descent broken into two stages by a short level shelf,
// so a single hill delivers two separate hits of airtime instead of one long
// float. Reference: the classic wooden double dip (Kennywood's Jack Rabbit,
// 1920) and its modern descendants on Colossos, Balder and Troy. The shelf
// is short and very slightly RISING — that tiny lift is what makes the
// second drop pop.
const doubleDown: CoasterElementDef = {
  id: 'double-down',
  points: [
    [-13, 11, 0],
    [-9.5, 11, 0],
    [-7.2, 10.2, 0],
    [-5.4, 8, 0],
    [-3.9, 5.6, 0], // drop 1
    [-2.6, 5.1, 0],
    [-1.3, 5.35, 0], // the shelf — a hair of lift
    [-0.1, 4.6, 0],
    [1.4, 2.6, 0], // drop 2
    [3.4, 1.4, 0],
    [6.6, 1, 0],
    [13, 1, 0],
  ],
  keyPoints: [
    { t: 0.2, label: 'climb' },
    { t: 0.42, label: 'airtime' },
    { t: 0.62, label: 'airtime' },
    { t: 0.86, label: 'land' },
  ],
  duration: 7,
};

// Turntable: a piece of track on a rotating disc. The train rolls onto the
// disc and stops, the disc turns it through 180 degrees, and it rolls back
// off facing the other way. Reference: the turntable on Voltron Nevera at
// Europa-Park (Mack Rides, 2024), which turns the train between the boost
// launch and the halfpipe launch, and doubles as the switch to the
// maintenance barn; the same machine railways use to turn a locomotive
// round at a depot. Modelled as a spur: one straight lead-in ending on the
// disc, so the train leaves along the track it arrived on. The cars turn
// about the disc centre as one rigid body, which is why the nose swings
// out and the rear swings in.
const TURNTABLE_LENGTH = 16.5; // x from −14 to 2.5, inside the disc rim
const TURNTABLE_CENTRE = 14 / TURNTABLE_LENGTH; // the disc centre, as a fraction of the curve
const TURNTABLE_EDGE = 2.5 / TURNTABLE_LENGTH; // where the train stands when the run starts and ends
const turntable: CoasterElementDef = {
  id: 'turntable',
  points: [
    [-14, 1, 0],
    [-10, 1, 0],
    [-6, 1, 0],
    [-2, 1, 0],
    [0, 1, 0], // disc centre
    [2.5, 1, 0],
  ],
  turntable: {
    at: [0, 1, 0],
    radius: 2.9,
    yaw: (t) => Math.PI * smoothstep(0.4, 0.6, t),
  },
  pace: (t) => {
    const ease = (u: number) => smoothstep(0, 1, u);
    if (t < 0.36) return TURNTABLE_EDGE + (TURNTABLE_CENTRE - TURNTABLE_EDGE) * ease(t / 0.36);
    if (t < 0.64) return TURNTABLE_CENTRE; // stopped on the disc while it turns
    return TURNTABLE_CENTRE - (TURNTABLE_CENTRE - TURNTABLE_EDGE) * ease((t - 0.64) / 0.36);
  },
  keyPoints: [
    { t: 0.2, label: 'approach' },
    { t: 0.5, label: 'turn' },
    { t: 0.82, label: 'leave' },
  ],
  duration: 10,
  defaultView: 'follow',
};

/** Every element with a 3-D player, keyed by glossary term id. */
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
  camelback,
  'quad-down': quadDown,
  's-hill': sHill,
  lifthill,
  'block-brake': blockBrake,
  'trim-brake': trimBrake,
  'interlocking-loops': interlockingLoops,
  launch,
  'vertical-lift': verticalLift,
  'drop-track': dropTrack,
  'scorpion-tail': scorpionTail,
  'step-up-under-flip': stepUpUnderFlip,
  'twisted-horseshoe-roll': twistedHorseshoeRoll,
  'double-down': doubleDown,
  turntable,
};

/** The 3-D player's element for a glossary term id, if it has one. */
export function getCoasterElement(id: string): CoasterElementDef | undefined {
  return COASTER_ELEMENTS[id];
}

/** Whether a glossary term has a 3-D player. */
export function hasCoasterElement(id: string): boolean {
  return id in COASTER_ELEMENTS;
}
