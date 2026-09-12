/**
 * What the flumes module stores, resolves and publishes. Pure types plus the constants both
 * threads agree on; Babylon-free, DOM-free and safe on the worker.
 *
 * The vocabulary is deliberately not a coaster's. A slide has no train, no station and no block
 * system: it has a **tower** somebody climbs, a **trough** water runs down, a **rider** who is
 * either a body, a tube, a raft or a mat, and a **landing**. Those four words are the whole model,
 * and each of them is a manifest entry rather than a branch.
 */

import type { Vec3 } from '../core/types';

/**
 * Seconds of SLIDE time one fixed tick advances.
 *
 * The same constant and the same reason as `rides/sim.ts`'s `RIDE_SECONDS_PER_TICK` and
 * `trains/types.ts`: the park clock is compressed sixtyfold, so a rider driven by park minutes
 * would cover a 130 m slide in a third of a real second and the whole thing would read as a strobe.
 * Fixed, never scaled by `clock.speed`, so a tick count is a repeatable animation and a screenshot
 * taken after `--step=N` is the same picture every run.
 *
 * The consequence is stated rather than hidden: **dispatch intervals are in this clock too**, so
 * the queue a slide eats is not in step with the park's own hour. `FlumeView.ridersPerHour` is the
 * honest capacity figure a management panel should read, computed from the interval and the
 * vehicle's seats, and it is not what the visible dispatches count out.
 */
export const SLIDE_SECONDS_PER_TICK = 0.05;

/**
 * Floats per rider slot in the `flumes.riders` frame buffer. See `sim.ts`.
 *
 * Eleven since round 2, and the eleventh is `tint`. It was on `FlumeRider` from the start, was
 * computed on every dispatch, and never crossed the buffer — so `rig.colors` and `rig.wear`, which
 * every style declares as a PALETTE, were read at `[0]` and the whole park's rafts were one yellow.
 * The renderer turns it into a per-thin-instance colour, which costs no draw call.
 */
export const RIDER_STRIDE = 11;

/**
 * How many riders may be in flight across the whole park at once.
 *
 * A cap and not a limit anybody should hit: five slides dispatching every eight seconds with a
 * forty-second descent is twenty-five. The buffer is `MAX_RIDERS * RIDER_STRIDE` floats — 2.5 KB
 * at 20 Hz — and a slide that would overflow it simply holds its next dispatch.
 */
export const MAX_RIDERS = 64;

// ── content ─────────────────────────────────────────────────────────────────────────────────

/** The vehicle a style's riders arrive in. `none` is a body slide: the rider IS the vehicle. */
export type FlumeHull = 'none' | 'ring' | 'raft' | 'mat';

export interface FlumeRig {
  hull: FlumeHull;
  /** Outer radius of the ring or the raft, metres. Ignored by `none`. */
  hullRadius: number;
  /** Tube thickness of a ring, or the freeboard of a raft, metres. */
  hullTube: number;
  /** How many people it carries. */
  seats: number;
  /** Radius of a seated rider's torso, metres. */
  riderRadius: number;
  /** How far a seat sits from the vehicle's centre, metres. */
  seatSpread: number;
  /** Hull colours; a vehicle picks one from its own seeded stream. */
  colors: string[];
  /** Costume colours. */
  wear: string[];
}

/**
 * A slide style: a cross-section, a wall rule, a vehicle and the friction it slides on.
 *
 * There is no `switch (flumeStyle)` anywhere in this module and there cannot be one — `body`,
 * `tube`, `raft` and `mat` are four entries in a table that a pack may extend or replace by id,
 * and the geometry, the physics and the rig all read off the entry. `mat` ships here with no ride
 * in any pack, which is the extensibility case made concrete: `showcase.ts` registers a pack that
 * adds a fifth style and a ride that uses it, and this module contains no line about either.
 */
export interface FlumeStyleSpec {
  /** `pack:id`. */
  key: string;
  id: string;
  name: Record<string, string>;

  // ── the trough ────────────────────────────────────────────────────────────────────────────
  /**
   * Angular half-extent of the shell either side of the trough's lowest point, radians, on
   * straight and level track. A body slide is a touch past horizontal; a closed tube is nearly
   * all the way round.
   */
  wrap: number;
  /** How far the shell may grow on the OUTSIDE of a turn, radians. Never below `wrap`. */
  maxWrap: number;
  /**
   * How much of the rider's required climb the wall answers, 0..1.
   *
   * 1 is a wall that follows the rider exactly; 0 is a section that never changes, which is right
   * for a closed pipe — a tube slide's wall is already over the rider's head and cannot grow.
   */
  wallResponse: number;
  /** Trough radius, metres, or 0 to take it from the ride's `trackStyle`. See `manifest.ts`. */
  radius: number;
  /** Fraction of the section given to a FLAT floor: 0 is a half-pipe, 0.55 a raft trough. */
  floorFlat: number;
  /** Shell thickness, metres. */
  thickness: number;
  /** Cross-section samples per side. A closed pipe needs more than an open chute. */
  sectionSamples: number;

  // ── the water ─────────────────────────────────────────────────────────────────────────────
  /** Depth of the sheet running down the floor, metres. */
  waterDepth: number;
  /** How far up the section the sheet reaches, as a fraction of `wrap`. */
  waterWrap: number;

  // ── the ride ──────────────────────────────────────────────────────────────────────────────
  /**
   * Effective sliding coefficient on wetted gelcoat.
   *
   * Measured band from the trade literature: a body on a well-watered slide hydroplanes at about
   * 0.10-0.14, an inflated tube at 0.06-0.08 (it rides on its own bow wave), a loaded family raft
   * at 0.08-0.10 because it displaces enough water to make wave drag the bigger term, and a mat
   * at 0.09. Dry polyethylene on polyethylene is 0.3 and is what a slide with the pumps off feels
   * like.
   */
  friction: number;
  /** C_d·A for the vehicle and its riders, m². */
  dragArea: number;
  /** Mass of the empty vehicle, kg. A body slide's is zero. */
  vehicleMass: number;
  /** Kg per rider. */
  riderMass: number;
  /** Seconds of SLIDE time between dispatches. See `SLIDE_SECONDS_PER_TICK`. */
  dispatchSeconds: number;
  /** Speed a rider leaves the tower at, m/s — a push-off, not a launch. */
  entrySpeed: number;
  /** How much of the coaster-perfect bank the trough is built with, 0..1. */
  bankFactor: number;

  rig: FlumeRig;

  /** Shell colour when the pack's track style does not carry one. */
  shell: string;
  /** The stripe down the rim, and the tower's steelwork. */
  trim: string;
}

/** The structure the slide starts on: columns, a deck, a stair and a canopy. */
export interface FlumeTowerSpec {
  key: string;
  id: string;
  name: Record<string, string>;
  /** Plan of the deck, metres. */
  footprint: [number, number];
  /** Column diameter, metres. */
  column: number;
  /** Handrail height, metres. */
  rail: number;
  /** Width of the stair flight, metres. */
  stairWidth: number;
  /** Rise per flight before a landing, metres. */
  flightRise: number;
  /** Tread going, metres. */
  going: number;
  /** Riser, metres. */
  riser: number;
  canopy: boolean;
  /** Colours: the steel, the deck boards, the canopy. */
  steel: string;
  deck: string;
  canopyColor: string;
}

/** One piece of a layout, in the `track` module's own element vocabulary. */
export interface FlumePiece {
  element: string;
  params?: Record<string, number>;
}

/**
 * A named descent.
 *
 * The pieces are `track`'s elements — `drop`, `curve`, `helix`, `s-bend`, `straight` — because a
 * slide's centreline is the same problem a coaster's is and that grammar is already built, tested
 * and graded. What this module adds is everything hanging off it.
 */
export interface FlumeLayoutSpec {
  key: string;
  id: string;
  name: Record<string, string>;
  /** Which style this layout was drawn for; a pack may reuse a layout under another style. */
  style: string;
  /** Metres the tower deck stands above the ground at the layout's origin. */
  towerHeight: number;
  tower: string;
  pieces: FlumePiece[];
}

// ── entities ────────────────────────────────────────────────────────────────────────────────

/** `Entity.data` for a `flume`. Everything else is derived. */
export interface FlumeEntityData {
  /** Registered layout id, or `pack:id`. */
  layout?: string;
  /** Override the layout's tower height, metres. */
  towerHeight?: number;
  /** Override the shell colour. */
  color?: string;
  /** The pool entity the run-out lands in. Resolved by proximity when absent. */
  splashdown?: string;
  /** Whether the pumps are on. A slide with the water off is a dry gutter and dispatches nobody. */
  running?: boolean;
}

/** A flume resolved against the registry and the world: everything a builder needs, no meshes. */
export interface ResolvedFlume {
  id: string;
  key: string;
  pack: string;
  item: string;
  name: Record<string, string>;
  /**
   * The pack's `trackStyles` id the trough's colour and (unless the style declares its own
   * `radius`) its section come from. Empty when the ride declares none: `track`'s own fallback
   * answers that, and this module names no content id of its own.
   */
  trackStyle: string;
  style: FlumeStyleSpec;
  layout: FlumeLayoutSpec;
  tower: FlumeTowerSpec;
  /** Trough radius, metres — from the pack's `trackStyles` entry, never invented here. */
  radius: number;
  color: string;
  position: Vec3;
  yaw: number;
  towerHeight: number;
  running: boolean;
  cost: number;
  upkeep: number;
  power: number;
  water: number;
  night: FlumeNightRig | null;
  minHeightCm: number | null;
}

export interface FlumeNightRig {
  color: string;
  intensity: number;
  height: number;
  range: number;
  mode: 'steady' | 'chase' | 'strobe' | 'cycle';
  colors: string[];
}

// ── what a slide is doing ───────────────────────────────────────────────────────────────────

export interface FlumeRider {
  /** Slot in the frame buffer; stable for the rider's whole descent. */
  slot: number;
  /** Arc length down the slide, metres. */
  s: number;
  /** Metres per second. */
  v: number;
  /** How many people are on this vehicle. */
  seats: number;
  /**
   * Which entry of `rig.colors` / `rig.wear` this vehicle and its riders wear.
   *
   * A counter and not a random draw: `descents + list.length` at dispatch, so a slide cycles its
   * palette in order and a save that restores `descents` restores the colours with it. Published
   * in the frame buffer at `RIDER_STRIDE - 1`.
   */
  tint: number;
}

export interface FlumeView {
  id: string;
  name: Record<string, string>;
  style: string;
  /** Metres of slide from the tower deck to the run-out. */
  length: number;
  /** Metres the deck stands above the lowest point of the run. */
  drop: number;
  /** Top speed a rider reaches, m/s. */
  topSpeed: number;
  /** Seconds from dispatch to the splashdown. */
  rideSeconds: number;
  /** The capacity the interval and the seat count imply. See `SLIDE_SECONDS_PER_TICK`. */
  ridersPerHour: number;
  riders: number;
  running: boolean;
  /** Descents completed since the park opened. */
  descents: number;
}

export interface FlumesStats {
  flumes: number;
  riders: number;
  /** Metres of trough across the park. */
  trough: number;
  /** m³/h the pumps move. */
  water: number;
  /** kW. */
  power: number;
  descents: number;
}

/** Per-flume state that survives a save. Small on purpose: everything else is derived. */
export interface FlumeState {
  descents: number;
  /** Slide-seconds since the last dispatch. */
  sinceDispatch: number;
  running: boolean;
}
