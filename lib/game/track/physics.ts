/**
 * The energy model: a train over a spline, and the verdict on whether the layout works.
 *
 * Pure. No Babylon, no DOM, no clock, no RNG — every number in here is a function of the geometry
 * and the train, which is what lets the same code run in the worker, in the build tool's preview
 * and in `selftest.mjs`.
 *
 * **It marches in arc length, not in time.** The obvious reading of "fixed 20 Hz" is a Δt loop,
 * and a Δt loop is exactly wrong for this question: the thing a validation pass exists to decide is
 * whether the train crests the hill, and at a crest the train is slow, so a fixed Δt puts its
 * fewest samples precisely where the answer is decided — 0.05 s at 3 m/s is a 15 cm step at the
 * top and a 1.7 m step at the bottom. A fixed Δs samples the geometry evenly and updates v² by the
 * work done over the step, which is exact for gravity and makes the integration conserve energy by
 * construction rather than by being small enough. The 20 Hz tick still exists; it is what `sim.ts`
 * runs, and it reads speeds out of this table.
 *
 * **The train is not a point.** Potential energy comes from the MEAN height of five samples spread
 * over the train's length, which is the whole reason a long train crests a hill a short one stalls
 * on, and the reason the last car is thrown over a crest faster than the first. Modelling a point
 * mass gets the classic answer wrong on every out-and-back.
 *
 * **Losses follow the normal force, not the distance.** Rolling resistance is µ·N, and N is the
 * force pressing the wheels into the rail — which in a 4 g loop is four times what it is on a
 * straight. So a loop costs about four times as much energy per metre as the straight before it,
 * which is a real effect and the reason a layout with three inversions needs a taller lift than
 * its drop height suggests. Air drag is the usual ½ρ·C_dA·v², and at 30 m/s it is roughly half of
 * the total loss on a steel coaster.
 */

import { TrackSpline } from './spline';
import type { DriveSection } from './types';
import { clamp, cross, dot, G, type V3 } from './vec';

/** Air density at 15 °C, sea level. */
const RHO = 1.225;
/** Below this the train is considered stalled. */
const STALL_SPEED = 0.6;
/** How hard a brake or a launch is allowed to push, m/s². 1.2 g is a firm brake run. */
const MAX_DRIVE_ACCEL = 11.8;
/** Samples along the train used for the mean-height term. */
const TRAIN_SAMPLES = 5;
/** Baseline over which jerk is measured, metres. */
const JERK_BASELINE = 2;
/**
 * Roll-rate ceiling, degrees per second.
 *
 * The first version of this check used 130 and it was simply wrong: an inversion is quick by
 * design. A modern zero-g roll turns 360° in about 1.8–2.5 seconds, which is 145–200 °/s, and a
 * track that never exceeded 130 could not contain one. 200 is the top of that observed band; a
 * warning above it says the roll is faster than anything built rather than that it is unusual.
 */
const MAX_ROLL_RATE_DEG = 200;

export interface TrainSpec {
  cars: number;
  /** Metres per car, including the gap. */
  carLength: number;
  seatsPerCar: number;
  /** Empty mass of one car, kg. */
  massPerCar: number;
  /** Kg per occupied seat; the validation run assumes a full train. */
  riderMass: number;
  /** C_d · A for the whole train, m². */
  dragArea: number;
  /** Rolling resistance coefficient, dimensionless. */
  rollingResistance: number;
}

export interface ComfortLimits {
  vertical: number;
  lateral: number;
  negative: number;
}

export interface PhysicsInput {
  spline: TrackSpline;
  drives: readonly DriveSection[];
  train: TrainSpec;
  limits: ComfortLimits;
  /** Speed the train leaves the station at, m/s. */
  dispatchSpeed?: number;
  /** Station spacing for the march, metres. Default 0.5. */
  step?: number;
  /** The ride definition's rated top speed, m/s — reported against, never enforced. */
  ratedSpeed?: number;
}

export interface PhysicsStation {
  s: number;
  /** Metres above the layout's lowest point. */
  height: number;
  /** Speed, m/s. */
  v: number;
  /** Seconds since dispatch. */
  t: number;
  gVert: number;
  gLat: number;
  gLong: number;
  /** Rate of change of the felt force, g per second. */
  jerk: number;
  /** Roll rate about the direction of travel, degrees per second. */
  rollRate: number;
}

export type IssueCode =
  | 'stall'
  | 'vertical'
  | 'negative'
  | 'lateral'
  | 'roll-rate'
  | 'jerk'
  | 'station-arrival'
  | 'overspeed';

export interface TrackIssue {
  code: IssueCode;
  severity: 'error' | 'warning';
  /** Where on the track, metres. */
  s: number;
  value: number;
  limit: number;
  text: string;
}

export interface TrackPhysics {
  stations: PhysicsStation[];
  /** Length of the whole layout, metres. */
  length: number;
  /** Length of the run the stations cover — one lap on a circuit, the tail on a shuttle. */
  runLength: number;
  /** True when there is no `error` issue. */
  complete: boolean;
  issues: TrackIssue[];
  maxSpeed: number;
  minSpeed: number;
  /** Height of the highest point above the lowest, metres. */
  topHeight: number;
  /** The biggest single descent, metres. */
  maxDrop: number;
  rideTimeSeconds: number;
  maxVerticalG: number;
  minVerticalG: number;
  maxLateralG: number;
  maxLongitudinalG: number;
  maxJerk: number;
  maxRollRateDegPerSec: number;
  /** Seconds spent below 0.3 g vertical. */
  airtimeSeconds: number;
  /** Speed arriving back at the station, m/s. */
  arrivalSpeed: number;
  /** Where the run starts, metres — the exit of the station block. */
  startS: number;
}

/** A train spec from a coaster's numbers, with the masses the pack does not carry. */
export function trainSpec(options: {
  cars: number;
  seatsPerCar: number;
  carLength: number;
  carWidth: number;
  carHeight: number;
  /** `wood` rides rougher than steel: 0.024 against 0.019. See the note on the default. */
  rollingResistance?: number;
}): TrainSpec {
  const { cars, seatsPerCar, carLength, carWidth, carHeight } = options;
  return {
    cars,
    carLength,
    seatsPerCar,
    // A coaster car is a steel chassis with a fibreglass shell: about 900 kg empty for a 3 m car.
    massPerCar: 300 * carLength,
    riderMass: 70,
    // Frontal area times a blunt-body drag coefficient, plus a skin term that grows with the
    // train: a seven-car train is not seven times the drag of one car, but it is not one either.
    dragArea: 0.9 * carWidth * carHeight + 0.05 * cars * carWidth,
    /**
     * Calibrated against a real ride rather than picked from the middle of the 0.015–0.03 band
     * that engineering tables give for polyurethane wheels on steel rail.
     *
     * Wodan at Europa-Park: 40 m of lift, 1050 m of track, and the train arrives at a brake run
     * roughly 10 m up — so about 30 m of head is dissipated over 1050 m, which is 0.28 m/s² on
     * average. Take the drag term off that at a mean 18 m/s and what is left needs µ ≈ 0.019 once
     * the normal force is averaged over a layout with real curvature in it. The first pass used
     * 0.030 and could not get a 32 m wooden coaster round 850 m of its own track.
     */
    rollingResistance: options.rollingResistance ?? 0.019,
  };
}

export function trainMass(train: TrainSpec): number {
  return train.cars * (train.massPerCar + train.seatsPerCar * train.riderMass);
}

/** Every drive section overlapping `[a, b]`, honouring the wrap on a circuit. */
function drivesAt(
  drives: readonly DriveSection[],
  a: number,
  b: number,
  total: number,
  closed: boolean
) {
  const out: DriveSection[] = [];
  for (const d of drives) {
    if (overlaps(d.from, d.to, a, b)) out.push(d);
    else if (closed && overlaps(d.from, d.to, a - total, b - total)) out.push(d);
    else if (closed && overlaps(d.from, d.to, a + total, b + total)) out.push(d);
  }
  return out;
}

function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

export function simulateTrack(input: PhysicsInput): TrackPhysics {
  const { spline, drives, train, limits } = input;
  const total = spline.length();
  const step = input.step ?? 0.5;
  const closed = spline.closed;
  const mass = trainMass(train);
  const trainLength = train.cars * train.carLength;
  const dragK = (0.5 * RHO * train.dragArea) / mass;

  // The run starts where the station block ends: that is where a dispatch happens, and starting
  // anywhere else on a circuit would report a lap the ride never does.
  const station = drives.find((d) => d.kind === 'station');
  const startS = station ? station.to : 0;
  // A circuit runs a whole lap from the dispatch point; a shuttle runs to the end of its track and
  // stops there. Marching a lap's worth on an open layout clamps at the last metre and reports a
  // hundred stations of flat track that does not exist — which is what it did, and it read as the
  // banking giving up rather than as the march running off the end.
  // A circuit's run is the lap MINUS the station block: the ride is dispatch → circuit → station
  // entry, and marching through the platform as well made the station's own brakes read as the
  // train running out of energy — a stall reported on every working layout.
  const stationLength = station ? Math.max(0, station.to - station.from) : 0;
  const run = closed ? Math.max(1, total - stationLength) : Math.max(1, total - startS);
  const count = Math.max(8, Math.round(run / step));
  const ds = run / count;

  const at = (s: number): number => {
    if (!closed) return clamp(s, 0, total);
    return ((s % total) + total) % total;
  };

  /** Mean height of the train when its centre is at `s`, metres. */
  const meanHeight = (s: number): number => {
    let sum = 0;
    for (let i = 0; i < TRAIN_SAMPLES; i++) {
      const offset = (i / (TRAIN_SAMPLES - 1) - 0.5) * trainLength;
      sum += spline.pointAt(at(s + offset))[1];
    }
    return sum / TRAIN_SAMPLES;
  };

  const stations: PhysicsStation[] = [];
  const issues: TrackIssue[] = [];
  let v = Math.max(input.dispatchSpeed ?? 2, 0.5);
  let t = 0;
  let stalled = false;
  let previousUp: V3 | null = null;
  /** Force `JERK_BASELINE / ds` stations back, so the jerk is what a body feels and not sample noise. */
  const forceHistory: V3[] = [];
  let lowest = Infinity;
  let highest = -Infinity;
  let dropStart = -Infinity;
  let maxDrop = 0;
  let airtime = 0;

  for (let i = 0; i <= count; i++) {
    const sLocal = i * ds;
    const s = at(startS + sLocal);
    const frame = spline.frameAt(s);
    const kappa = spline.curvatureAt(s);
    const y = frame.p[1];
    if (y < lowest) lowest = y;
    if (y > highest) {
      highest = y;
      dropStart = y;
    }
    if (dropStart - y > maxDrop) maxDrop = dropStart - y;

    // Drive over the step ahead: what the chain, the launch or the brakes will do next.
    const active = drivesAt(drives, s, s + ds, total, closed);
    let driveAccel = 0;
    let clampTo: number | null = null;
    let floorTo: number | null = null;
    for (const d of active) {
      if (d.kind === 'lift') {
        // A chain lift is a kinematic constraint, not a force: the dogs hold the train at chain
        // speed whatever the gradient, and a train arriving faster is caught by the anti-rollbacks.
        clampTo = clampTo === null ? d.speed : Math.min(clampTo, d.speed);
        floorTo = floorTo === null ? d.speed : Math.max(floorTo, d.speed);
      } else if (d.kind === 'transport') {
        floorTo = floorTo === null ? d.speed : Math.max(floorTo, d.speed);
      } else if (d.kind === 'launch') {
        const remaining = Math.max(1, d.to - s);
        const want = (d.speed * d.speed - v * v) / (2 * remaining);
        driveAccel += clamp(want, 0, MAX_DRIVE_ACCEL);
      } else if (d.kind === 'brake' || d.kind === 'block') {
        if (v > d.speed) {
          const remaining = Math.max(1, d.to - s);
          const want = (v * v - d.speed * d.speed) / (2 * remaining);
          driveAccel -= clamp(want, 0, MAX_DRIVE_ACCEL);
        }
      } else if (d.kind === 'station') {
        if (v > d.speed)
          driveAccel -= Math.min(MAX_DRIVE_ACCEL, (v * v) / (2 * Math.max(1, d.to - s)));
      }
    }
    if (clampTo !== null) v = Math.min(v, clampTo);
    if (floorTo !== null) v = Math.max(v, floorTo);

    // ── the forces the rider feels here ────────────────────────────────────────────────
    // The spline IS the heartline (see cursor.ts), so `v²κ⃗` is the rider's own centripetal
    // acceleration and there is no roll-rate correction to add.
    const centripetal: V3 = [kappa[0] * v * v, kappa[1] * v * v, kappa[2] * v * v];
    const gradient = -G * frame.tangent[1];
    const loss =
      train.rollingResistance * Math.hypot(centripetal[0], centripetal[1] + G, centripetal[2]) +
      dragK * v * v;
    const along = gradient + driveAccel - (v > STALL_SPEED ? loss : 0);
    const accel: V3 = [
      centripetal[0] + frame.tangent[0] * along,
      centripetal[1] + frame.tangent[1] * along,
      centripetal[2] + frame.tangent[2] * along,
    ];
    // Specific force: what a scale under the rider would read, in m/s².
    const force: V3 = [accel[0], accel[1] + G, accel[2]];
    const gVert = dot(force, frame.up) / G;
    const gLat = dot(force, frame.right) / G;
    const gLong = dot(force, frame.tangent) / G;

    // Jerk over a 2 m baseline rather than over one 0.5 m station: a rider feels the change of
    // force across their own body, and a one-station difference is mostly the sampling noise of a
    // spline evaluated at 0.5 m.
    forceHistory.push(force);
    const back = Math.max(1, Math.round(JERK_BASELINE / ds));
    const older = forceHistory.length > back ? forceHistory[forceHistory.length - 1 - back] : null;
    const jerk =
      older && v > 0.2
        ? (Math.hypot(force[0] - older[0], force[1] - older[1], force[2] - older[2]) /
            G /
            (back * ds)) *
          v
        : 0;
    // Roll rate from the FRAME, not from `rollAt`. The roll channel is measured against a
    // rotation-minimising gauge that does not close around a circuit, so differencing it across
    // the seam reported 3402 °/s on a track that rolls nowhere near there. The angle between two
    // consecutive up-vectors about the tangent is gauge-free and closes by construction.
    const rollRate =
      previousUp && v > 0.2
        ? (Math.asin(clamp(dot(cross(previousUp, frame.up), frame.tangent), -1, 1)) / ds) *
          v *
          (180 / Math.PI)
        : 0;
    previousUp = frame.up;

    const dt = v > 0.05 ? ds / v : 0;
    if (gVert < 0.3) airtime += dt;
    stations.push({
      s: sLocal,
      height: y,
      v,
      t,
      gVert,
      gLat,
      gLong,
      jerk,
      rollRate: Math.abs(rollRate),
    });
    t += dt;

    if (i === count) break;

    // ── advance ────────────────────────────────────────────────────────────────────────
    const dh = meanHeight(at(startS + sLocal + ds)) - meanHeight(s);
    const work = 2 * ds * (driveAccel - (v > STALL_SPEED ? loss : 0)) - 2 * G * dh;
    let v2 = v * v + work;
    const braking = active.some(
      (d) => d.kind === 'brake' || d.kind === 'block' || d.kind === 'station'
    );
    if (v2 < STALL_SPEED * STALL_SPEED && !braking) {
      if (!stalled) {
        stalled = true;
        issues.push({
          code: 'stall',
          severity: 'error',
          s: sLocal,
          value: 0,
          limit: STALL_SPEED,
          text: `The train runs out of energy ${sLocal.toFixed(0)} m in and rolls back.`,
        });
      }
      v2 = STALL_SPEED * STALL_SPEED;
    }
    v = Math.sqrt(v2);
    if (clampTo !== null) v = Math.min(v, clampTo);
    if (floorTo !== null) v = Math.max(v, floorTo);
  }

  const summary = summarise(stations);
  const arrival = stations[stations.length - 1]?.v ?? 0;

  const flag = (
    code: IssueCode,
    severity: 'error' | 'warning',
    value: number,
    limit: number,
    s: number,
    text: string
  ) => issues.push({ code, severity, s, value, limit, text });

  if (summary.maxVerticalG > limits.vertical) {
    flag(
      'vertical',
      'error',
      summary.maxVerticalG,
      limits.vertical,
      summary.maxVerticalAt,
      `${summary.maxVerticalG.toFixed(1)} g positive at ${summary.maxVerticalAt.toFixed(0)} m, over the ${limits.vertical} g limit.`
    );
  }
  if (summary.minVerticalG < limits.negative) {
    flag(
      'negative',
      'error',
      summary.minVerticalG,
      limits.negative,
      summary.minVerticalAt,
      `${summary.minVerticalG.toFixed(1)} g negative at ${summary.minVerticalAt.toFixed(0)} m, under the ${limits.negative} g limit.`
    );
  }
  if (summary.maxLateralG > limits.lateral) {
    flag(
      'lateral',
      'error',
      summary.maxLateralG,
      limits.lateral,
      summary.maxLateralAt,
      `${summary.maxLateralG.toFixed(1)} g sideways at ${summary.maxLateralAt.toFixed(0)} m, over the ${limits.lateral} g limit.`
    );
  }
  if (summary.maxRollRate > MAX_ROLL_RATE_DEG) {
    flag(
      'roll-rate',
      'warning',
      summary.maxRollRate,
      MAX_ROLL_RATE_DEG,
      summary.maxRollRateAt,
      `The track rolls at ${summary.maxRollRate.toFixed(0)}°/s at ${summary.maxRollRateAt.toFixed(0)} m, over the ${MAX_ROLL_RATE_DEG}°/s a shoulder restraint is comfortable with.`
    );
  }
  if (summary.maxJerk > 12) {
    flag(
      'jerk',
      'warning',
      summary.maxJerk,
      12,
      summary.maxJerkAt,
      `Force changes at ${summary.maxJerk.toFixed(1)} g/s at ${summary.maxJerkAt.toFixed(0)} m.`
    );
  }
  if (station && arrival > 8) {
    flag(
      'station-arrival',
      'error',
      arrival,
      8,
      total,
      `The train reaches the station at ${arrival.toFixed(1)} m/s; the brakes cannot hold that.`
    );
  }
  if (input.ratedSpeed && summary.maxSpeed > input.ratedSpeed * 1.05) {
    flag(
      'overspeed',
      'warning',
      summary.maxSpeed,
      input.ratedSpeed,
      summary.maxSpeedAt,
      `Tops out at ${(summary.maxSpeed * 3.6).toFixed(0)} km/h against a rated ${(input.ratedSpeed * 3.6).toFixed(0)}.`
    );
  }

  return {
    stations,
    length: total,
    runLength: run,
    complete: !issues.some((i) => i.severity === 'error'),
    issues,
    maxSpeed: summary.maxSpeed,
    minSpeed: summary.minSpeed,
    topHeight: highest - lowest,
    maxDrop,
    rideTimeSeconds: t,
    maxVerticalG: summary.maxVerticalG,
    minVerticalG: summary.minVerticalG,
    maxLateralG: summary.maxLateralG,
    maxLongitudinalG: summary.maxLongitudinalG,
    maxJerk: summary.maxJerk,
    maxRollRateDegPerSec: summary.maxRollRate,
    airtimeSeconds: airtime,
    arrivalSpeed: arrival,
    startS,
  };
}

function summarise(stations: readonly PhysicsStation[]) {
  let maxSpeed = 0;
  let maxSpeedAt = 0;
  let minSpeed = Infinity;
  let maxVerticalG = -Infinity;
  let maxVerticalAt = 0;
  let minVerticalG = Infinity;
  let minVerticalAt = 0;
  let maxLateralG = 0;
  let maxLateralAt = 0;
  let maxLongitudinalG = 0;
  let maxJerk = 0;
  let maxJerkAt = 0;
  let maxRollRate = 0;
  let maxRollRateAt = 0;
  for (const st of stations) {
    if (st.v > maxSpeed) {
      maxSpeed = st.v;
      maxSpeedAt = st.s;
    }
    if (st.v < minSpeed) minSpeed = st.v;
    if (st.gVert > maxVerticalG) {
      maxVerticalG = st.gVert;
      maxVerticalAt = st.s;
    }
    if (st.gVert < minVerticalG) {
      minVerticalG = st.gVert;
      minVerticalAt = st.s;
    }
    if (Math.abs(st.gLat) > maxLateralG) {
      maxLateralG = Math.abs(st.gLat);
      maxLateralAt = st.s;
    }
    if (Math.abs(st.gLong) > maxLongitudinalG) maxLongitudinalG = Math.abs(st.gLong);
    if (st.jerk > maxJerk) {
      maxJerk = st.jerk;
      maxJerkAt = st.s;
    }
    if (st.rollRate > maxRollRate) {
      maxRollRate = st.rollRate;
      maxRollRateAt = st.s;
    }
  }
  return {
    maxSpeed,
    maxSpeedAt,
    minSpeed: Number.isFinite(minSpeed) ? minSpeed : 0,
    maxVerticalG,
    maxVerticalAt,
    minVerticalG,
    minVerticalAt,
    maxLateralG,
    maxLateralAt,
    maxLongitudinalG,
    maxJerk,
    maxJerkAt,
    maxRollRate,
    maxRollRateAt,
  };
}

/** Speed at an arc length, interpolated from the march. */
export function speedAt(physics: TrackPhysics, s: number): number {
  const stations = physics.stations;
  if (stations.length === 0) return 0;
  const run = physics.runLength;
  let local = s - physics.startS;
  local = ((local % run) + run) % run;
  const ds = run / (stations.length - 1);
  const i = clamp(Math.floor(local / ds), 0, stations.length - 2);
  const f = (local - i * ds) / ds;
  return stations[i].v + (stations[i + 1].v - stations[i].v) * f;
}
