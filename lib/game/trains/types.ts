/**
 * The vocabulary of a coaster train. Pure: no Babylon, no DOM, no clock, no RNG — importable on
 * the worker, on the main thread and under node, which is what lets `selftest.mjs` run the block
 * logic and the integrator without a browser.
 *
 * Two constants in here decide more than they look like they do.
 *
 * **`RIDE_SECONDS_PER_TICK` is fixed at 0.05 and does NOT scale with `clock.speed`.** The rest of
 * the simulation integrates in park minutes, and the park clock is compressed sixty-fold at speed
 * 1 (one real second is one park minute), so a lap that takes 88 seconds would take 1.47 park
 * minutes, i.e. 1.47 real seconds, i.e. a train through a vertical loop at sixty times its own
 * speed. The other reading is no better: at speed 100 a tick would advance the train 7.5 m, which
 * steps clean over a 24 m block brake and past the stop line inside it. So the train is integrated
 * in RIDE seconds, one tick is one twentieth of one, and the fixed 20 Hz tick is what makes that
 * deterministic — a tick count, never a wall clock. The cost is stated rather than hidden: at
 * speeds above 1 a ride completes fewer cycles per park hour than it would in reality, which is a
 * throughput figure the `management` module will want computed analytically rather than counted.
 * `TrainsSimApi.cycleSeconds()` is that figure.
 *
 * **`HEARTLINE` is a copy of the track module's constant and has to stay one.** `track/types.ts`
 * owns it (`HEARTLINE_HEIGHT = 1.1`), the spline IS the rider's path, and the rails are drawn
 * `1.1 m` down the frame's up-vector. Every measurement in `geometry.ts` is relative to the same
 * origin, so a train drawn against a different number would float or sink into its own rails. It is
 * imported, not re-declared.
 */

import type { Vec3 } from '../core/types';

/** Ride seconds one fixed tick advances. See the docblock. */
export const RIDE_SECONDS_PER_TICK = 0.05;

/** Sub-steps per tick for the integrator, as a floor. See `MAX_SUBSTEP_METRES` for the real rule. */
export const MOTION_SUBSTEPS = 4;

/**
 * Metres a single integration sub-step may cover.
 *
 * This is what actually keeps the block system safe, and it is a distance because the thing it
 * protects is a distance: a block's stop line is a position on the spline, and a train that jumps
 * over it in one step has left the block system's opinion behind. Half a metre is what four fixed
 * sub-steps happened to give a 40 m/s train at the old constant tick, so nothing about today's
 * behaviour changes — it is the same number, stated as the rule it always was rather than as a
 * count that only worked while `dt` never moved.
 */
export const MAX_SUBSTEP_METRES = 0.5;

/** Standard gravity, m/s². The same number `track/vec.ts` uses; a physical constant, not an import. */
export const G = 9.80665;

/** Air density at 15 °C, sea level — matches `track/physics.ts`, deliberately. */
export const RHO = 1.225;

/** How hard a brake, a launch or a block hold may push, m/s². 1.2 g is a firm brake run. */
export const MAX_DRIVE_ACCEL = 11.8;

/** Below this a train that is not being held is considered stalled and reported. */
export const STALL_SPEED = 0.35;

/** A train never leaves a stop line slower than this, whatever the section after it says. */
export const MIN_DISPATCH_SPEED = 1.2;

/**
 * Speed the station's drive tyres pull an arriving train in at, m/s.
 *
 * A station platform is powered in both directions — the tyres pull the train up to the stop line
 * and push it out again — and the `speed: 0` on the `station` element means "hold it at rest once
 * it is there", not "let it coast". Without this a train that arrives on the platform at walking
 * pace stops 20 m short of its own stop line under nothing but rolling resistance and blocks the
 * circuit for ever, which is what `Nordwind` did for five simulated minutes: 1 dispatch, 0 laps,
 * three trains standing still.
 */
export const STATION_CREEP = 1.4;

/** Restraint types a train may carry. Content chooses; geometry draws. */
export type RestraintKind = 'lap' | 'shoulder' | 'vest' | 'none';

/** Front-car fairing shapes. */
export type NoseKind = 'wedge' | 'round' | 'blunt';

/**
 * Everything about a train that is content rather than code.
 *
 * A pack declares one under its own `trainProfiles` key (claimed by this module through
 * `registry.registerPackCategory`); where a pack declares none, every field is derived from what
 * `trainStyles` and `rides` already carry — from the SHAPE of the content, never from an id. See
 * `manifest.ts` for each derivation and the reason for it.
 */
export interface TrainProfile {
  /** `pack:id`. Matches the `trainStyles` entry it extends when it extends one. */
  key: string;
  /** Cars per train. */
  cars: number;
  seatsPerCar: number;
  /** Seats across one row. 4-seat cars are 2 × 2. */
  seatsPerRow: number;
  /** Metres per car, coupler to coupler. */
  carLength: number;
  carWidth: number;
  /** Body height, metres — the shell, not the wheel assemblies. */
  carHeight: number;
  /** Empty mass of one car, kg. */
  massPerCar: number;
  /** Kg per occupied seat. */
  riderMass: number;
  /** C_d · A for the whole train, m². */
  dragArea: number;
  rollingResistance: number;
  /** Metres above the rail plane the rider's chest sits. Negative = suspended. */
  heartline: number;
  restraint: RestraintKind;
  nose: NoseKind;
  /** Seconds a train stands in the station before it may be dispatched. */
  dwellSeconds: number;
  livery: {
    /** The shell. */
    body: string;
    /** The stripe along the shell and the fairing's blade. */
    trim: string;
    /** Chassis, bogies, restraint frames. */
    chassis: string;
    /** Seat upholstery. */
    seat: string;
  };
}

/** What a train is doing. */
export type TrainMode =
  /** Standing in the station, loading. */
  | 'station'
  /** Held at a block's stop line because the section ahead is occupied. */
  | 'held'
  /** On the circuit. */
  | 'running';

/** One train's live state. Every field of it is serialised; see `sim.ts`. */
export interface TrainState {
  /** Arc length of the FRONT of the train, metres from the layout's start. */
  s: number;
  /** Speed along the track, m/s. */
  v: number;
  mode: TrainMode;
  /** Ride seconds spent in the current mode. Serialised — an unsaved accumulator is a bug. */
  timer: number;
  /** Laps completed since the world was created. Serialised. */
  laps: number;
}

/** A ride's fleet. */
export interface FleetState {
  trains: TrainState[];
  /**
   * Ride seconds since this ride last dispatched, for the throughput readout.
   * Serialised — `guests-round1.md` §3.4 found four accumulators exactly like this one unsaved.
   */
  sinceDispatch: number;
  /** Dispatches since the world was created. Serialised. */
  dispatches: number;
  /**
   * Riders the queue in front of this coaster last put on board.
   *
   * Set by `TrainsSimApi.seat`, which `rides` calls when a load boards; capped at the train's own
   * seat count. It is what this module DRAWS and REPORTS — the ride's occupancy — and it moves no
   * train: the line runs on the park clock and the fleet on the ride clock, which is why the two
   * dispatches are different events. Serialised, because an occupancy that resets on reload is
   * the same unsaved-accumulator bug the docblock at the top of `sim.ts` lists four of.
   */
  riders: number;
}

/** `world.modules.trains`. */
export interface TrainsSlot {
  version: 1;
  /** Keyed by coaster entity id. */
  fleets: Record<string, FleetState>;
}

/** One car's place in the frame buffer, published to the main thread as a roster event. */
export interface RosterCar {
  rideId: string;
  train: number;
  /** Index of this car within its train, 0 = front. */
  car: number;
  cars: number;
  /** `pack:id` of the profile this car is drawn from. */
  profile: string;
}

export interface RosterMessage {
  /** Cars in frame-buffer order. `trains.transform` holds 7 floats per entry. */
  cars: RosterCar[];
  /** Profiles referenced by the roster, so the renderer needs no registry lookup by id. */
  profiles: TrainProfile[];
}

/** A pose written into the frame buffer: position and an orientation quaternion. */
export interface CarPose {
  p: Vec3;
  q: [number, number, number, number];
}

/** Reported per ride by `TrainsSimApi.status`. */
export interface FleetStatus {
  rideId: string;
  trains: number;
  blocks: number;
  /** Trains currently on the circuit rather than standing. */
  running: number;
  /** Seconds a full cycle takes: the lap plus the dwell, from the layout's own physics. */
  cycleSeconds: number;
  /** Trains per hour × seats, at the current fleet size. Analytic, not counted. */
  ridersPerHour: number;
  dispatches: number;
  /** Seats one train holds, `cars × seatsPerCar`. */
  seats: number;
  /** Riders the queue last put on board. 0 in a park with no `rides` module running a line. */
  riders: number;
}
