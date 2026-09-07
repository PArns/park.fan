/**
 * The vocabulary of a flat ride.
 *
 * Import-safe everywhere: no Babylon, no DOM, node-runnable. Every file in this module that does
 * arithmetic about a machine — the shapes, the rig solver, the cycle — reads its types from here,
 * so the selftest can run the same code the browser runs.
 *
 * Two words are used precisely and are easy to confuse:
 *
 *  - a **cycle** is one complete load → dispatch → run → unload, and `cycleMinutes` in a pack
 *    manifest is the length of that whole thing at full capacity. Throughput is therefore
 *    `capacity / cycleMinutes * 60` guests an hour and nothing else, which is the number a park
 *    manager actually plans with.
 *  - a **run** is the part of the cycle where the machine moves. `phase` is progress through the
 *    RUN, 0..1, and it is the only number the renderer needs to draw the animation.
 */

// ── Content: the rig ────────────────────────────────────────────────────────────────────────
/**
 * The parametric shapes a rig part can be built from.
 *
 * This list is code and says so — a genuinely new geometric primitive is a new function, the same
 * line `shops` draws at its five massings and `guests` draws between a thought and a signal. What
 * a pack CAN do without code is combine these with any parameters, at any radius, in any count,
 * on any animation channel, in any colour: the five flat rides the two bundled packs ship are all
 * built out of this list and nothing else, and the selftest builds a sixth that no file here
 * anticipated.
 */
export type ShapeName =
  | 'drum' // prism / cylinder: bases, platforms, hubs, towers, teacups
  | 'box' // beams, plinths, kerbs
  | 'mast' // tapered pole: centre poles, king pins
  | 'frame' // A-frame or portal legs with cross bracing
  | 'rim' // polygonal ring of a given tube radius, optionally spoked
  | 'canopy' // conical tent roof with scalloped valance and a finial
  | 'horse' // a fairground horse on a brass pole
  | 'gondola' // a passenger car: floor, back, sides, optional roof and restraints
  | 'chair' // a swing seat hanging on chains
  | 'arm' // a boom / lifting arm
  | 'lights'; // a ring of bulbs, emissive at night

/** How a surface is finished. One material per finish for the whole park. */
export type Finish = 'matte' | 'gloss' | 'metal' | 'fabric' | 'lamp';

/** Which way a repeated unit faces on its ring. */
export type Facing = 'out' | 'in' | 'tangent' | 'fixed';

/** Animation channels a rig part accepts. Angular ones are radians, linear ones metres. */
export type Channel = 'yaw' | 'pitch' | 'roll' | 'tilt' | 'x' | 'y' | 'z';

export type CurveKind = 'linear' | 'ease-in-out' | 'sine' | 'ease-in' | 'ease-out';

export interface CurveSpec {
  curve: CurveKind;
  /**
   * Full turns (angular channels) or complete oscillations (linear channels, and any channel whose
   * curve is `sine`) over the window.
   */
  revolutions?: number;
  /** Radians for an angular channel, metres for a linear one. Only read by oscillating curves. */
  amplitude?: number;
  /** Which axis a `roll`/`tilt` channel turns about. Defaults per channel. */
  axis?: 'x' | 'y' | 'z';
  /** Fraction of the run this motion occupies, `[start, end]` in 0..1. Defaults to the whole run. */
  window?: [number, number];
  /**
   * How far the phase is spread around a ring of repeated units, in turns.
   *
   * A Venetian carousel's horses are cranked so that the ring reads as a travelling wave rather
   * than as one block going up and down together; two turns over sixteen horses is what that looks
   * like. 0 makes every unit move in lockstep, which is what a top spin's seats do.
   */
  phaseSpread?: number;
}

export interface RigPartSpec {
  id: string;
  /** Another part in the same rig. A part with no parent hangs off the ride's own transform. */
  parent?: string;
  shape: ShapeName;
  /** Shape parameters. Every shape documents its own; unknown keys are ignored. */
  params?: Record<string, number | string | boolean>;
  /** Local offset from the parent, metres. */
  offset?: [number, number, number];
  /** How many copies, spread around a ring of `radius`. */
  count?: number;
  radius?: number;
  /** Fraction of the full circle the ring covers. 1 = all the way round. */
  spread?: number;
  /** Riders this part carries, per copy. The sum over a rig is checked against `capacity`. */
  seats?: number;
  /** Keep the unit level however its parents turn — a ferris wheel gondola. */
  level?: boolean;
  /**
   * How hard the unit swings with the tangential acceleration of its parent, 0..1.
   *
   * A ferris wheel gondola is a pendulum: it hangs plumb at constant speed and lags on the way in
   * and out of a stop. 0 pins it rigidly, which is wrong for anything that hangs.
   */
  pendulum?: number;
  /**
   * Chains, in metres, for a unit that flies out under rotation.
   *
   * With this set the unit's hang angle is SOLVED rather than authored: `tan θ = ω²(r + L sin θ)/g`
   * is the real balance of centripetal force against gravity on a chair swing, and it is why the
   * chains rise as the ride speeds up and drop as it slows without anybody keyframing it.
   */
  chain?: number;
  facing?: Facing;
  animate?: Partial<Record<Channel, CurveSpec>>;
  /** sRGB hex; overrides the shape's own default colour. */
  color?: string;
  /** Accent colour, used by shapes that have two (a canopy's valance, a gondola's trim). */
  accent?: string;
}

export interface RideRigSpec {
  id: string;
  /** Another rig id whose parts are the starting point. Parts with the same id are replaced. */
  extends?: string;
  parts: RigPartSpec[];
}

/** A rig with its provenance, as `manifest.ts` hands it out. */
export interface ResolvedRig extends RideRigSpec {
  /** `pack:id` of the rig, or `builtin:<id>`. */
  key: string;
  source: 'pack' | 'builtin' | 'fallback';
}

// ── Content: the ride ───────────────────────────────────────────────────────────────────────
/**
 * A flat ride, resolved from a `rides` manifest entry of `kind: 'flat'` plus its rig.
 *
 * Everything here is content. Nothing in this module reads `key` to decide anything: it is carried
 * so a report, a HUD panel and a warning can name the thing they are talking about.
 */
export interface FlatRideProfile {
  /** `pack:id`. */
  key: string;
  name: Record<string, string>;
  capacity: number;
  /** The whole load → dispatch → run → unload cycle at full capacity, park minutes. */
  cycleMinutes: number;
  /** Fractions of `cycleMinutes`; they sum to 1. */
  split: CycleSplit;
  footprint: [number, number];
  excitement: number;
  fear: number;
  nausea: number;
  minHeightCm: number | null;
  /** Cents a rider pays. Flat rides in these packs are free with park entry; a pack may charge. */
  price: number;
  upkeep: number;
  power: number;
  /**
   * Mean park minutes between breakdowns, from the ride's own intensity when a pack does not say.
   *
   * A top spin breaks down more often than a carousel because there is more of it to break, and
   * that is a real and well-known fact about fairground machinery rather than a balance knob.
   */
  mtbfMinutes: number;
  /** Which side of the footprint the queue and the loading gate are on, 0..3 = +z,+x,-z,-x. */
  queueSide: number;
  rig: ResolvedRig;
  /** Total seats the rig actually draws. Differs from `capacity` when a pack disagrees with itself. */
  rigSeats: number;
  night: NightRig | null;
}

export interface CycleSplit {
  load: number;
  dispatch: number;
  run: number;
  unload: number;
}

export interface NightRig {
  color: string;
  intensity: number;
  height: number;
  range: number;
  mode: 'steady' | 'chase' | 'strobe' | 'cycle';
  colors: string[];
}

// ── Simulation ──────────────────────────────────────────────────────────────────────────────
/**
 * What the machine is doing. Written into the `rides.state` frame buffer as a byte, so these
 * numbers are wire format: reordering them is a frame-format break, not a refactor.
 */
export const RideState = {
  CLOSED: 0,
  LOADING: 1,
  DISPATCHING: 2,
  RUNNING: 3,
  UNLOADING: 4,
  BROKEN: 5,
  MAINTENANCE: 6,
} as const;
export type RideStateValue = (typeof RideState)[keyof typeof RideState];

export const RIDE_STATE_NAMES: Record<number, string> = {
  0: 'closed',
  1: 'loading',
  2: 'dispatching',
  3: 'running',
  4: 'unloading',
  5: 'broken',
  6: 'maintenance',
};

/** Floats per ride in the `rides.motion` buffer. */
export const MOTION_STRIDE = 4;
/** Ring of per-minute rider counts behind `throughputHour`. One park hour. */
export const THROUGHPUT_WINDOW = 60;

/** A place in a line. */
export interface RideTicket {
  ticket: number;
  /** Whatever the caller uses to identify a rider; the sim never interprets it. */
  guest: number;
  /** Park minute they joined. */
  joined: number;
  heightCm: number;
}

export interface RideOffer {
  id: string;
  key: string;
  x: number;
  z: number;
  /** Where somebody joining the line should stand. */
  queueX: number;
  queueZ: number;
  price: number;
  excitement: number;
  fear: number;
  nausea: number;
  minHeightCm: number | null;
  /** Guests per park minute the machine can take, `capacity / cycleMinutes`. */
  throughput: number;
  /** Park minutes a guest joining now would wait before boarding. */
  waitMinutes: number;
  queueLength: number;
  open: boolean;
}

export type RefusalReason =
  | 'closed'
  | 'broken'
  | 'too-short'
  | 'queue-full'
  | 'no-money'
  | 'unknown-ride';

export interface RideJoin {
  ticket: number;
  /** Where to stand, world metres. */
  x: number;
  z: number;
  /** Park minutes the ride thinks this will take. */
  waitMinutes: number;
}

export interface RideBoarding {
  ticket: number;
  /** Park minutes the ride will keep them. */
  rideMinutes: number;
  /** 0..100, what they thought of it, before their own preferences are applied. */
  satisfaction: number;
  price: number;
}

export interface RideView {
  id: string;
  key: string;
  name: Record<string, string>;
  state: string;
  open: boolean;
  /** 0..1 through the run. */
  phase: number;
  riders: number;
  capacity: number;
  queueLength: number;
  waitMinutes: number;
  /** Riders an hour, measured over the last park hour, not the nameplate figure. */
  throughputHour: number;
  /** `capacity / cycleMinutes * 60`, what the machine could do with an endless queue. */
  ratedThroughput: number;
  ridersToday: number;
  cyclesToday: number;
  /** 0..1 of the time it has been open that it was actually running. */
  utilisation: number;
  downMinutesToday: number;
  breakdownsToday: number;
  /** 0..100. */
  satisfaction: number;
  /** Park minutes since the last service; drives the breakdown chance. */
  sinceServiceMinutes: number;
}

export interface RidesStats {
  rides: number;
  open: number;
  broken: number;
  riding: number;
  queued: number;
  ridersToday: number;
  cyclesToday: number;
  /** Sum of every ride's measured riders an hour. */
  throughputHour: number;
  /** Sum of the nameplate figures, so the gap between the two is readable. */
  ratedThroughput: number;
  meanWaitMinutes: number;
  meanSatisfaction: number;
  breakdownsToday: number;
  /** Riders this module took from the guest bridge rather than through `join()`. */
  walkUps: number;
  tickMs: number;
}

/** Gravity, m/s². The chain solver is the only thing in this module that needs it. */
export const G = 9.80665;
