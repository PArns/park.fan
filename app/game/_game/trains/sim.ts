/**
 * Coaster physics.
 *
 * Energy integrated along an **arclength-parameterized** spline. The train is a point mass at
 * distance `s` with speed `v`; everything else — height, slope, curvature, bank — is a function of
 * `s` the track provides. That is what makes a loop work without a constraint solver: the track
 * *is* the constraint, so the only forces are the ones along it.
 *
 *   dv/dt = −g·sin(θ) − μ·g·cos(θ) − k·v² + drive
 *
 * with θ the slope angle from dy/ds, μ rolling friction, k a lumped aerodynamic term, and `drive`
 * whatever a lift, launch or brake segment is doing. Integration is **semi-implicit Euler at the
 * 50 ms tick, substepped**: at 30 m/s a train covers 1.5 m per tick, and a 6 m-radius loop
 * sampled every 1.5 m loses enough curvature to under-report lateral G by a third. Eight substeps
 * put the sample interval under 20 cm.
 *
 * G-forces come out of the same numbers rather than from a table:
 *   vertical  = cos(θ) + v²·κ_vertical/g      (1 g standing still on the flat)
 *   lateral   = v²·κ_lateral/g − tan(bank)    (bank is what a designer uses to cancel it)
 * and the ratings are a function of those, of airtime time and of the layout's variety.
 */

import type { SimSystem } from '../core/sim/context';
import type { TrackComponent, TrainComponent } from '../core/schema';
import { NO_ENTITY, type EntityId } from '../core/ids';
import { TICK_MS, clamp } from '../core/units';

const G = 9.81;
const SUBSTEPS = 8;
const DT = TICK_MS / 1000 / SUBSTEPS;

export interface TrackSample {
  x: number;
  y: number;
  z: number;
  /** Unit tangent. */
  tx: number;
  ty: number;
  tz: number;
  /** 1/m, signed in the track's own frame. */
  curvatureVertical: number;
  curvatureLateral: number;
  bank: number;
  role: TrackComponent['nodes'][number]['role'];
  driveSpeed: number;
}

/**
 * Sample the track at arclength `s`.
 *
 * The nodes are treated as a Catmull–Rom control polygon, but the *distance* along it is the
 * polyline distance rather than the true spline arclength. The difference at the node spacing a
 * track editor produces (2–8 m) is under 1 %, and paying for a proper reparameterization would
 * cost a table rebuild on every edit for a hundredth of a metre.
 */
export function sampleTrack(track: TrackComponent, sRaw: number): TrackSample {
  const nodes = track.nodes;
  const count = nodes.length;
  const total = Math.max(0.001, track.lengthM);
  let s = track.closed ? ((sRaw % total) + total) % total : clamp(sRaw, 0, total);

  // Walk to the segment. Linear rather than a binary search on a prefix table: `count` is in the
  // low hundreds and the walk starts where the caller left off in the common case.
  let index = 0;
  let acc = 0;
  for (; index < count - 1; index++) {
    const segment = segmentLength(nodes[index]!, nodes[index + 1]!);
    if (acc + segment >= s) break;
    acc += segment;
  }
  if (index >= count - 1) index = count - 2;
  const a = nodes[index]!;
  const b = nodes[index + 1] ?? nodes[0]!;
  const segment = Math.max(0.001, segmentLength(a, b));
  const t = clamp((s - acc) / segment, 0, 1);

  const p0 = nodes[wrap(index - 1, count, track.closed)]!;
  const p3 = nodes[wrap(index + 2, count, track.closed)]!;

  const point = catmullRom(p0, a, b, p3, t);
  const tangent = catmullRomDerivative(p0, a, b, p3, t);
  const second = catmullRomSecond(p0, a, b, p3, t);

  const speed = Math.hypot(tangent.x, tangent.y, tangent.z) || 1;
  const tx = tangent.x / speed;
  const ty = tangent.y / speed;
  const tz = tangent.z / speed;

  // κ = |r' × r''| / |r'|³, split into the component in the vertical plane and the one across it.
  const cross = {
    x: tangent.y * second.z - tangent.z * second.y,
    y: tangent.z * second.x - tangent.x * second.z,
    z: tangent.x * second.y - tangent.y * second.x,
  };
  const denom = speed * speed * speed;
  const curvature = Math.hypot(cross.x, cross.y, cross.z) / denom;
  // The horizontal part of the curvature vector is the lateral one; what is left is vertical.
  const horizontal = Math.hypot(cross.x, cross.z) / denom;
  const curvatureLateral = Math.sign(cross.y || 1) * Math.min(curvature, Math.abs(cross.y) / denom);
  const curvatureVertical = Math.sign(second.y || 1) * Math.min(curvature, horizontal);

  return {
    x: point.x,
    y: point.y,
    z: point.z,
    tx,
    ty,
    tz,
    curvatureVertical,
    curvatureLateral,
    bank: a.bank + (b.bank - a.bank) * t,
    role: a.role,
    driveSpeed: a.driveSpeed,
  };
}

function wrap(index: number, count: number, closed: boolean): number {
  if (closed) return ((index % count) + count) % count;
  return clamp(index, 0, count - 1);
}

function segmentLength(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

type P = { x: number; y: number; z: number };

function catmullRom(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), z: f(p0.z, p1.z, p2.z, p3.z) };
}

function catmullRomDerivative(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const t2 = t * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (-a + c + 2 * (2 * a - 5 * b + 4 * c - d) * t + 3 * (-a + 3 * b - 3 * c + d) * t2);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), z: f(p0.z, p1.z, p2.z, p3.z) };
}

function catmullRomSecond(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * (2 * a - 5 * b + 4 * c - d) + 6 * (-a + 3 * b - 3 * c + d) * t);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), z: f(p0.z, p1.z, p2.z, p3.z) };
}

/** What a circuit measured, for the rating. Reset when a train re-enters the station. */
interface CircuitRecord {
  peakGVert: number;
  minGVert: number;
  peakGLat: number;
  airtimeTicks: number;
  maxSpeed: number;
  maxHeight: number;
  minHeight: number;
  inversions: number;
}

const circuits = new Map<number, CircuitRecord>();

function blankCircuit(): CircuitRecord {
  return {
    peakGVert: 1,
    minGVert: 1,
    peakGLat: 0,
    airtimeTicks: 0,
    maxSpeed: 0,
    maxHeight: -1e9,
    minHeight: 1e9,
    inversions: 0,
  };
}

export const trainsSystem: SimSystem = {
  id: 'trains',

  tick(ctx) {
    const world = ctx.world;

    // Make sure each running ride has the trains its track asks for. Doing it here rather than in
    // a command keeps "how many trains exist" a function of the track, which is the thing a player
    // edits — a command would leave the two able to disagree.
    for (const key of Object.keys(world.entities.track)) {
      const rideIndex = Number(key);
      const track = world.entities.track[rideIndex]!;
      const ride = world.entities.ride[rideIndex];
      if (!ride || ride.kind === 'flat') continue;
      const existing: number[] = [];
      for (const trainKey of Object.keys(world.entities.train)) {
        if ((world.entities.train[Number(trainKey)]!.rideId & 0xfffff) === rideIndex) {
          existing.push(Number(trainKey));
        }
      }
      const want = ride.status === 'building' ? 0 : track.trainCount;
      if (existing.length < want) {
        for (let i = existing.length; i < want; i++) {
          const id = world.spawn();
          world.entities.train[id & 0xfffff] = {
            rideId: rideIndex as EntityId,
            // Spaced evenly round the circuit so the first dispatch is not all at once.
            s: (track.lengthM / Math.max(1, want)) * i,
            v: 0,
            cars: track.carsPerTrain,
            riders: 0,
            block: 0,
            state: 'station',
            peakGVert: 1,
            peakGLat: 0,
          };
          circuits.set(id & 0xfffff, blankCircuit());
        }
      } else if (existing.length > want) {
        for (const trainKey of existing.slice(want)) {
          const handle = handleFor(ctx, trainKey);
          if (handle) ctx.destroy(handle);
          circuits.delete(trainKey);
        }
      }
    }

    for (const key of Object.keys(world.entities.train)) {
      const trainIndex = Number(key);
      const train = world.entities.train[trainIndex]!;
      const rideIndex = train.rideId & 0xfffff;
      const track = world.entities.track[rideIndex];
      const ride = world.entities.ride[rideIndex];
      if (!track || !ride || track.nodes.length < 4) continue;
      if (train.state === 'crashed') continue;

      const definition =
        ctx.registry.get('coaster', ride.defId) ?? ctx.registry.get('flume', ride.defId);
      const friction = definition?.physics.frictionRolling ?? 0.0035;
      const dragK = definition?.physics.dragK ?? 0.0021;
      const liftSpeed = definition?.physics.liftSpeed ?? 4;

      let record = circuits.get(trainIndex);
      if (!record) {
        record = blankCircuit();
        circuits.set(trainIndex, record);
      }

      if (train.state === 'station') {
        // Held until the queue system loads it and clears the block ahead. A ride that is closed
        // or broken simply never leaves — the train that is already out still comes home.
        if (ride.status === 'open' && train.riders > 0 && blockClear(ctx, rideIndex, trainIndex, track)) {
          train.state = 'dispatch';
        } else {
          train.v = 0;
          continue;
        }
      }

      for (let sub = 0; sub < SUBSTEPS; sub++) {
        const sample = sampleTrack(track, train.s);
        const slopeSin = sample.ty; // the tangent is unit length, so its y IS sin(θ)
        const slopeCos = Math.max(0.05, Math.hypot(sample.tx, sample.tz));

        let accel = -G * slopeSin - friction * G * slopeCos - dragK * train.v * Math.abs(train.v);

        switch (sample.role) {
          case 'lift':
            // A chain lift is a speed clamp, not a force: it pulls whatever it needs to.
            if (train.v < liftSpeed) accel += (liftSpeed - train.v) / DT / SUBSTEPS;
            train.state = 'lift';
            break;
          case 'launch': {
            const target = definition?.physics.launchSpeed ?? (sample.driveSpeed || 25);
            if (train.v < target) accel += Math.min(50, (target - train.v) * 4);
            train.state = 'running';
            break;
          }
          case 'brake':
          case 'blockBrake': {
            const target = sample.driveSpeed || 6;
            if (train.v > target) accel -= Math.min(28, (train.v - target) * 6);
            train.state = 'brake';
            break;
          }
          case 'station': {
            const target = sample.driveSpeed || 3;
            if (train.state === 'dispatch') {
              if (train.v < target) accel += (target - train.v) * 4;
            } else if (train.v > 0.6) {
              accel -= Math.min(20, train.v * 8);
            }
            break;
          }
          default:
            if (train.state === 'lift' || train.state === 'brake' || train.state === 'dispatch') {
              train.state = 'running';
            }
        }

        // Semi-implicit: velocity first, then position with the NEW velocity. Explicit Euler
        // gains energy on a loop and a train that gains energy eventually leaves the track.
        train.v += accel * DT;
        // A coaster never runs backwards past a stop; it rolls back and the block system holds it.
        if (train.v < -12) train.v = -12;
        train.s += train.v * DT;

        const gVert = slopeCos + (train.v * train.v * sample.curvatureVertical) / G;
        const gLat = (train.v * train.v * sample.curvatureLateral) / G - Math.tan(sample.bank);
        if (gVert > record.peakGVert) record.peakGVert = gVert;
        if (gVert < record.minGVert) record.minGVert = gVert;
        if (Math.abs(gLat) > Math.abs(record.peakGLat)) record.peakGLat = gLat;
        if (gVert < 0.25) record.airtimeTicks++;
        if (train.v > record.maxSpeed) record.maxSpeed = train.v;
        if (sample.y > record.maxHeight) record.maxHeight = sample.y;
        if (sample.y < record.minHeight) record.minHeight = sample.y;
      }

      train.peakGVert = record.peakGVert;
      train.peakGLat = record.peakGLat;

      // A valley: the train ran out of energy and rolled back to a stop somewhere it cannot leave.
      if (Math.abs(train.v) < 0.05 && train.state === 'running') {
        train.state = 'stopped';
        ctx.notify({
          level: 'warn',
          title: 'Zug steckt fest',
          body: 'Die Bahn hat nicht genug Energie für ihr Layout.',
        });
      }

      // Completing a circuit: bank the rating and clear the record.
      if (track.closed && train.s >= track.lengthM) {
        train.s -= track.lengthM;
        applyRatings(ride, track, record);
        ride.totalRiders += train.riders;
        train.state = 'station';
        circuits.set(trainIndex, blankCircuit());
        ctx.dirty.rides.push(train.rideId);
      }

      if (detectCollision(ctx, rideIndex, trainIndex, train, track)) {
        train.state = 'crashed';
        ride.status = 'broken';
        ctx.notify({
          level: 'error',
          title: 'Unfall',
          body: 'Zwei Züge sind kollidiert. Die Bahn ist gesperrt.',
        });
      }
    }
  },

  audit(ctx) {
    let crashed = 0;
    let stopped = 0;
    for (const train of Object.values(ctx.world.entities.train)) {
      if (train.state === 'crashed') crashed++;
      if (train.state === 'stopped') stopped++;
    }
    return { trainsCrashed: crashed, trainsStopped: stopped };
  },
};

/**
 * The block system, as one question: is the section ahead of this train empty?
 *
 * Blocks are the node indices marked station / lift / blockBrake. A train may leave its block only
 * when the next one holds nobody — which is the actual safety rule a real coaster runs on, and is
 * why a well-blocked layout can never crash while a badly blocked one can.
 */
function blockClear(
  ctx: Parameters<NonNullable<SimSystem['tick']>>[0],
  rideIndex: number,
  selfIndex: number,
  track: TrackComponent
): boolean {
  if (track.blocks.length < 2) return true;
  const self = ctx.world.entities.train[selfIndex]!;
  const selfBlock = blockAt(track, self.s);
  const nextBlock = (selfBlock + 1) % track.blocks.length;
  for (const key of Object.keys(ctx.world.entities.train)) {
    const index = Number(key);
    if (index === selfIndex) continue;
    const other = ctx.world.entities.train[index]!;
    if ((other.rideId & 0xfffff) !== rideIndex) continue;
    if (blockAt(track, other.s) === nextBlock) return false;
  }
  return true;
}

function blockAt(track: TrackComponent, s: number): number {
  if (track.blocks.length === 0) return 0;
  // Blocks are node indices; convert `s` to a node index by walking the same polyline.
  let acc = 0;
  let node = 0;
  for (; node < track.nodes.length - 1; node++) {
    const length = segmentLength(track.nodes[node]!, track.nodes[node + 1]!);
    if (acc + length >= s) break;
    acc += length;
  }
  let block = 0;
  for (let i = 0; i < track.blocks.length; i++) if (track.blocks[i]! <= node) block = i;
  return block;
}

/** Two trains closer than a train length on the same track, and neither in a station. */
function detectCollision(
  ctx: Parameters<NonNullable<SimSystem['tick']>>[0],
  rideIndex: number,
  selfIndex: number,
  self: TrainComponent,
  track: TrackComponent
): boolean {
  const trainLength = self.cars * 3.2 + 1;
  for (const key of Object.keys(ctx.world.entities.train)) {
    const index = Number(key);
    if (index <= selfIndex) continue;
    const other = ctx.world.entities.train[index]!;
    if ((other.rideId & 0xfffff) !== rideIndex) continue;
    if (self.state === 'station' && other.state === 'station') continue;
    let gap = Math.abs(self.s - other.s);
    if (track.closed) gap = Math.min(gap, track.lengthM - gap);
    if (gap < trainLength) return true;
  }
  return false;
}

/**
 * Ratings from what the circuit measured.
 *
 * Excitement rewards speed, drop height, airtime and variety; fear rewards height and peak G;
 * nausea rewards lateral G and direction changes. All three are penalised when the ride is
 * *dangerous* rather than thrilling — past 6 g vertical or 2.5 g lateral, excitement falls and
 * fear rises, which is what makes the limits in a coaster manifest a design constraint rather
 * than decoration.
 */
function applyRatings(
  ride: { excitement: number; fear: number; nausea: number; throughput: number },
  track: TrackComponent,
  record: CircuitRecord
): void {
  const drop = Math.max(0, record.maxHeight - record.minHeight);
  const airtimeSeconds = (record.airtimeTicks / SUBSTEPS) * (TICK_MS / 1000);

  const speedTerm = clamp(record.maxSpeed / 30, 0, 1.4);
  const dropTerm = clamp(drop / 55, 0, 1.3);
  const airTerm = clamp(airtimeSeconds / 6, 0, 1.2);
  const lengthTerm = clamp(track.lengthM / 900, 0, 1.1);
  const varietyTerm = clamp(track.nodes.length / 90, 0, 1);

  const overVert = Math.max(0, record.peakGVert - 6);
  const overLat = Math.max(0, Math.abs(record.peakGLat) - 2.5);
  const danger = overVert * 0.6 + overLat * 0.9;

  const excitement =
    2.2 * speedTerm + 2.4 * dropTerm + 1.8 * airTerm + 1.2 * lengthTerm + 1.4 * varietyTerm - danger * 1.6;
  const fear = 1.6 * dropTerm + 1.4 * clamp(record.peakGVert / 5, 0, 1.4) + 2.0 * clamp(danger, 0, 2);
  const nausea =
    2.4 * clamp(Math.abs(record.peakGLat) / 2.2, 0, 1.5) +
    1.1 * clamp(record.inversions / 4, 0, 1) +
    0.8 * clamp(-record.minGVert + 1, 0, 1.5);

  // Smoothed rather than replaced: one circuit is a measurement, a rating is a description, and a
  // rating that jumped every lap would be unreadable.
  ride.excitement = round1(ride.excitement * 0.7 + clamp(excitement, 0, 10) * 0.3);
  ride.fear = round1(ride.fear * 0.7 + clamp(fear, 0, 10) * 0.3);
  ride.nausea = round1(ride.nausea * 0.7 + clamp(nausea, 0, 10) * 0.3);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function handleFor(
  ctx: Parameters<NonNullable<SimSystem['tick']>>[0],
  index: number
): EntityId | null {
  for (let generation = 0; generation < 2048; generation++) {
    const candidate = ((generation << 20) | index) as EntityId;
    if (ctx.world.isAlive(candidate)) return candidate;
  }
  return NO_ENTITY === 0 ? null : null;
}
