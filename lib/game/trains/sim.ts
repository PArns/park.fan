/**
 * The worker half: the fleet, the block system, and the transforms the renderer draws.
 *
 * **This is the only writer of a train's position.** The main thread interpolates between the last
 * two frames and never integrates; `world.modules.trains` is written here and read here, which is
 * the one-writer rule axis 5 is graded on.
 *
 * **Every accumulator is in `serialize()`.** `guests-round1.md` §3.4 records four unsaved
 * accumulators found in one module by diffing two serialisations field by field, and names that as
 * the method that works. The four here are `TrainState.timer` (ride seconds in the current mode —
 * an unsaved dwell restarts a load on every reload), `TrainState.laps`, `FleetState.sinceDispatch`
 * and `FleetState.dispatches`. `s` and `v` are the obvious two and were never the risk.
 * `selftest.mjs` §7 saves a running fleet, reloads it, runs both on and compares the two
 * serialisations byte for byte.
 *
 * **Nothing here is random.** There is no `Rng` in this module at all: a dispatch happens when the
 * dwell is up and the block ahead is clear, and both are functions of the tick count. That is the
 * cheapest possible answer to determinism, and it is worth saying out loud because the obvious
 * next feature — a load time that varies with how many people are boarding — is where an RNG would
 * arrive, and it will need a seeded stream and a serialised state when it does.
 */

import type { Command, Entity, SimContext, SimFrameWriter, SimHandle } from '../core/types';
import type { TrackSimApi, TrackData, DriveSection } from '../track';
import { HEARTLINE_HEIGHT } from '../track';
import {
  blockAt,
  blocksCovered,
  distanceAhead,
  nextBlock,
  planBlocks,
  type BlockPlan,
} from './blocks';
import { attachTrainContent, resolveTrainProfile, trainLengthM, trainMassKg } from './manifest';
import { samplerFor, stepTrain, type MotionContext, type SplineLike } from './motion';
import {
  MIN_DISPATCH_SPEED,
  RIDE_SECONDS_PER_TICK,
  type FleetState,
  type FleetStatus,
  type RosterCar,
  type TrainProfile,
  type TrainsSlot,
  type TrainState,
} from './types';

/** Speed below which a train arriving at a stop line is considered to have stopped. */
const PARK_SPEED = 0.35;
/** Metres either side of a stop line that count as being on it. */
const PARK_WINDOW = 0.6;

/** What other sim modules may ask this one. */
export interface TrainsSimApi {
  /** Rides that have a fleet on them. */
  ids(): string[];
  status(rideId: string): FleetStatus | undefined;
  /** Every ride's status, in id order. */
  statuses(): FleetStatus[];
  /** Live state of one ride's trains. A copy; mutating it changes nothing. */
  trains(rideId: string): TrainState[];
  /** The profile a ride's trains are built from. */
  profile(rideId: string): TrainProfile | undefined;
  /** Set how many trains a ride runs, capped by its blocks and by the ride definition. */
  setFleetSize(rideId: string, count: number): number;
}

interface Fleet {
  rideId: string;
  profile: TrainProfile;
  plan: BlockPlan;
  motion: MotionContext;
  drives: readonly DriveSection[];
  state: FleetState;
  /** Metres over couplers. */
  trainLength: number;
  /** One lap plus one dwell, seconds — from the layout's own validation run. */
  cycleSeconds: number;
  /** Set once when a layout the physics says is incomplete puts a train in trouble. */
  reportedStall: boolean;
}

export function createTrainsSim(ctx: SimContext): SimHandle {
  // Claim `trainProfiles` and read it off every pack. Done on the sim side as well as the main
  // side because both halves resolve the same profile, and a showcase may load one without the
  // other; re-registering an override is a map write over the same key.
  const detachContent = attachTrainContent(ctx.registry);

  const fleets = new Map<string, Fleet>();
  const scratch: DriveSection[] = [];
  const covered: number[] = [];
  let dirty = true;
  let roster: RosterCar[] = [];
  let carCount = 0;
  let stallWarned = false;

  const track = () => ctx.module<TrackSimApi>('track');

  function slot(): TrainsSlot {
    const existing = ctx.world.modules.trains as TrainsSlot | undefined;
    if (existing && existing.version === 1 && existing.fleets) return existing;
    const fresh: TrainsSlot = { version: 1, fleets: {} };
    ctx.world.modules.trains = fresh;
    return fresh;
  }

  function dataOf(entity: Entity): TrackData | null {
    const data = entity.data as unknown as TrackData | undefined;
    if (!data || !Array.isArray(data.pieces) || data.pieces.length === 0) return null;
    return { ...data, origin: entity.position, yaw: entity.yaw };
  }

  /**
   * Rebuild the fleet map from the world's coasters.
   *
   * Iterated in sorted id order, never in `Object.keys` order, because the frame buffer's car
   * order is this order and a renderer that gets its cars in a different order on a reload draws
   * the wrong livery on the wrong train (ARCHITECTURE §1 rule 4).
   */
  function sync(): void {
    const api = track();
    const seen = new Set<string>();
    const saved = slot();

    for (const id of Object.keys(ctx.world.entities).sort()) {
      const entity = ctx.world.entities[id];
      if (entity.kind !== 'coaster') continue;
      const data = dataOf(entity);
      if (!data) continue;
      const spline = api?.spline(id);
      // The track has not been built yet (the coaster arrived this tick and `track` builds on the
      // same event). Leave the map dirty and try again next tick rather than guessing.
      if (!spline || !api) continue;
      seen.add(id);

      const drives = api.drives(id);
      const plan = planBlocks(drives, spline.length(), api.closed(id));
      const profile = resolveTrainProfile(ctx.registry, data);
      const existing = fleets.get(id);
      if (
        existing &&
        existing.plan.blocks.length === plan.blocks.length &&
        Math.abs(existing.plan.length - plan.length) < 0.01 &&
        existing.profile.cars === profile.cars
      ) {
        // Same layout, same train: keep the running state and only refresh what is derived.
        existing.plan = plan;
        existing.drives = drives;
        existing.profile = profile;
        existing.motion = motionFor(spline, drives, profile, plan);
        continue;
      }

      const fleet = createFleet(id, spline, drives, plan, profile, api);
      if (!fleet) continue;
      const restored = saved.fleets[id];
      if (restored && restored.trains.length > 0 && restored.trains.length <= plan.capacity) {
        fleet.state = {
          trains: restored.trains.map((t) => ({
            s: clampFinite(t.s, 0),
            v: clampFinite(t.v, 0),
            mode: t.mode === 'station' || t.mode === 'held' ? t.mode : 'running',
            timer: clampFinite(t.timer, 0),
            laps: Math.max(0, Math.round(clampFinite(t.laps, 0))),
          })),
          sinceDispatch: clampFinite(restored.sinceDispatch, 0),
          dispatches: Math.max(0, Math.round(clampFinite(restored.dispatches, 0))),
        };
      }
      fleets.set(id, fleet);
    }

    for (const id of [...fleets.keys()]) {
      if (!seen.has(id)) fleets.delete(id);
    }
    for (const id of Object.keys(saved.fleets)) {
      if (!fleets.has(id) && !ctx.world.entities[id]) delete saved.fleets[id];
    }
    // A coaster whose track has not been built yet leaves the map dirty, so the next tick tries
    // again. Anything else is settled and the flag comes down.
    dirty = countCoasters() > fleets.size;
    rebuildRoster();
  }

  function clampFinite(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  function motionFor(
    spline: SplineLike,
    drives: readonly DriveSection[],
    profile: TrainProfile,
    plan: BlockPlan
  ): MotionContext {
    return {
      sampler: samplerFor(spline),
      drives,
      trainLength: trainLengthM(profile),
      massKg: trainMassKg(profile),
      dragArea: profile.dragArea,
      rollingResistance: profile.rollingResistance,
      closed: plan.closed,
    };
  }

  function createFleet(
    rideId: string,
    spline: SplineLike,
    drives: readonly DriveSection[],
    plan: BlockPlan,
    profile: TrainProfile,
    api: TrackSimApi
  ): Fleet | null {
    if (plan.blocks.length === 0 || plan.station < 0) {
      // A layout with nothing that can hold a train has no station to dispatch from. That is a
      // legitimate state for a layout under construction, so it is a warning once and no fleet.
      if (!stallWarned) {
        stallWarned = true;
        console.warn(`[game/trains] ${rideId}: no station block, no trains dispatched`);
      }
      return null;
    }
    const physics = api.physics(rideId);
    const size = defaultFleetSize(rideId, plan);
    const cycle = (physics?.rideTimeSeconds ?? 60) + profile.dwellSeconds;
    return {
      rideId,
      profile,
      plan,
      drives,
      motion: motionFor(spline, drives, profile, plan),
      trainLength: trainLengthM(profile),
      cycleSeconds: cycle,
      reportedStall: false,
      state: {
        trains: placeTrains(plan, size),
        sinceDispatch: 0,
        dispatches: 0,
      },
    };
  }

  /**
   * How many trains a ride opens with.
   *
   * The block plan is the hard limit — `n` blocks hold `n − 1` trains or the fleet deadlocks on the
   * first tick — and the ride definition's `trainsMax` is the content's own say over it. A layout
   * with a station, a lift and a brake run is three blocks and therefore two trains, which is what
   * `core-classic`'s family coaster and wooden coaster both declare; the hyper coaster's four
   * blocks and `trainsMax: 3` agree at three.
   */
  function defaultFleetSize(rideId: string, plan: BlockPlan): number {
    const entity = ctx.world.entities[rideId];
    const data = entity ? (entity.data as unknown as TrackData | undefined) : undefined;
    const def = data?.ride ? ctx.registry.item('rides', data.ride)?.def : undefined;
    const declared = (def as { trainsMax?: number } | undefined)?.trainsMax ?? 1;
    return Math.max(1, Math.min(declared, plan.capacity));
  }

  /**
   * Where the trains stand when the ride opens: one in the station, the rest parked on the block
   * brakes BEHIND it, working backwards.
   *
   * That is what a coaster looks like at opening, and it is also the only arrangement that is
   * immediately legal — the station's train has an empty block in front of it and can go, and each
   * one behind it follows as the block ahead clears. Filling forwards instead would park a train on
   * the lift with the station occupied, which deadlocks.
   */
  function placeTrains(plan: BlockPlan, count: number): TrainState[] {
    const out: TrainState[] = [];
    const n = plan.blocks.length;
    for (let i = 0; i < count; i++) {
      const index = ((plan.station - i) % n + n) % n;
      const block = plan.blocks[index];
      out.push({
        s: block.stop,
        v: 0,
        mode: i === 0 ? 'station' : 'held',
        timer: 0,
        laps: 0,
      });
    }
    return out;
  }

  function rebuildRoster(): void {
    const cars: RosterCar[] = [];
    for (const id of [...fleets.keys()].sort()) {
      const fleet = fleets.get(id);
      if (!fleet) continue;
      for (let t = 0; t < fleet.state.trains.length; t++) {
        for (let c = 0; c < fleet.profile.cars; c++) {
          cars.push({
            rideId: id,
            train: t,
            car: c,
            cars: fleet.profile.cars,
            profile: fleet.profile.key,
          });
        }
      }
    }
    const changed =
      cars.length !== roster.length ||
      cars.some((c, i) => c.rideId !== roster[i].rideId || c.train !== roster[i].train);
    roster = cars;
    carCount = cars.length;
    if (changed) {
      const profiles = new Map<string, TrainProfile>();
      for (const fleet of fleets.values()) profiles.set(fleet.profile.key, fleet.profile);
      ctx.events.emit('train:roster', { cars, profiles: [...profiles.values()] });
    }
  }

  // ── the tick ──────────────────────────────────────────────────────────────────────────────
  function advance(fleet: Fleet, dt: number): void {
    const { plan, state } = fleet;
    const trains = state.trains;
    if (trains.length === 0 || plan.blocks.length === 0) return;
    const n = plan.blocks.length;

    // Occupancy from the pre-tick positions, so every train decides against the same picture and
    // the outcome does not depend on the order they are visited in.
    const occupied = new Uint8Array(n);
    for (const t of trains) {
      blocksCovered(plan, t.s, fleet.trainLength, covered);
      for (const b of covered) occupied[b] = 1;
    }
    const claimed = new Uint8Array(n);

    state.sinceDispatch += dt;

    for (const t of trains) {
      const block = blockAt(plan, t.s);
      if (block < 0) {
        // Off the plan entirely — an open layout's run-out. Keep it moving and let the clamp at
        // the end of the spline hold it.
        stepTrain(t, fleet.motion, null, dt, scratch);
        continue;
      }
      const b = plan.blocks[block];
      const ahead = nextBlock(plan, block);
      const holdLength = b.stop - b.from;
      const toStop = distanceAhead(plan, t.s, b.stop);
      const inHoldSection = toStop <= holdLength + 1e-6;

      let cleared = ahead >= 0 && occupied[ahead] === 0 && claimed[ahead] === 0;
      if (block === plan.station && t.mode !== 'station') {
        // A train arriving at the station always stops, whatever is ahead of it: the platform is
        // where people get off. Only a train that has already dwelled may leave.
        if (inHoldSection) cleared = false;
      }
      if (t.mode === 'station' && t.timer < fleet.profile.dwellSeconds) cleared = false;
      if (cleared && ahead >= 0 && inHoldSection) claimed[ahead] = 1;

      if (t.mode === 'station' || t.mode === 'held') {
        t.timer += dt;
        if (!cleared) continue;
        t.mode = 'running';
        t.timer = 0;
        if (block === plan.station) {
          state.dispatches += 1;
          state.sinceDispatch = 0;
          ctx.events.emit('train:dispatch', { rideId: fleet.rideId, s: t.s });
        }
      }

      const hold =
        cleared || !inHoldSection ? null : { from: b.from, stop: b.stop, distance: toStop };
      applyDispatchPush(fleet, t);
      const result = stepTrain(t, fleet.motion, hold, dt, scratch);
      if (result.stalled && !fleet.reportedStall) {
        fleet.reportedStall = true;
        ctx.events.emit('train:stall', { rideId: fleet.rideId, s: t.s });
      }
      if (result.parked) {
        const atStation = block === plan.station;
        t.mode = atStation ? 'station' : 'held';
        t.timer = 0;
        if (atStation) t.laps += 1;
      } else if (!hold) {
        // Snap a train that has crawled onto its stop line under the drive's own braking.
        const rest = distanceAhead(plan, t.s, b.stop);
        if (
          t.v < PARK_SPEED &&
          rest <= PARK_WINDOW &&
          block === plan.station &&
          t.mode === 'running'
        ) {
          t.s = b.stop;
          t.v = 0;
          t.mode = 'station';
          t.timer = 0;
          t.laps += 1;
        }
      }
    }
  }

  /**
   * A departing train needs a push, and the station drive is the only thing that can give it one.
   *
   * Modelled as a floor on the speed for as long as the train's tail is still on the platform,
   * which is what the drive tyres do. Without it a station whose next element is plain level track
   * dispatches a train at 0 m/s onto a 0 % gradient and it never moves — and a layout whose next
   * element is a transport section would hide the bug, which is exactly what the three showcase
   * layouts do.
   */
  function applyDispatchPush(fleet: Fleet, t: TrainState): void {
    const { plan } = fleet;
    if (t.mode !== 'running' || plan.station < 0) return;
    const station = plan.blocks[plan.station];
    const since = distanceAhead(plan, station.stop, t.s);
    if (since >= 0 && since < fleet.trainLength) t.v = Math.max(t.v, MIN_DISPATCH_SPEED);
  }

  // ── entity wiring ─────────────────────────────────────────────────────────────────────────
  const offAdd = ctx.events.on('entity:add', (entity: Entity) => {
    if (entity.kind === 'coaster') dirty = true;
  });
  const offUpdate = ctx.events.on('entity:update', (payload: { entity: Entity }) => {
    if (payload.entity.kind === 'coaster') dirty = true;
  });
  const offRemove = ctx.events.on('entity:remove', (entity: Entity) => {
    if (entity.kind === 'coaster') {
      fleets.delete(entity.id);
      dirty = true;
    }
  });
  const offTrack = ctx.events.on('track:changed', () => {
    dirty = true;
  });

  const api: TrainsSimApi = {
    ids: () => [...fleets.keys()].sort(),
    status: (rideId) => statusOf(fleets.get(rideId)),
    statuses: () =>
      [...fleets.keys()]
        .sort()
        .map((id) => statusOf(fleets.get(id)))
        .filter((s): s is FleetStatus => !!s),
    trains: (rideId) => (fleets.get(rideId)?.state.trains ?? []).map((t) => ({ ...t })),
    profile: (rideId) => fleets.get(rideId)?.profile,
    setFleetSize(rideId, count) {
      const fleet = fleets.get(rideId);
      if (!fleet) return 0;
      const size = Math.max(1, Math.min(Math.round(count), fleet.plan.capacity));
      fleet.state.trains = placeTrains(fleet.plan, size);
      fleet.state.dispatches = 0;
      fleet.state.sinceDispatch = 0;
      rebuildRoster();
      return size;
    },
  };

  function statusOf(fleet: Fleet | undefined): FleetStatus | undefined {
    if (!fleet) return undefined;
    const running = fleet.state.trains.filter((t) => t.mode === 'running').length;
    // Analytic, not counted: the fleet's throughput is the cycle divided by the number of trains,
    // because `n` trains on one circuit dispatch `n` times per cycle. Counted dispatches per park
    // hour would be wrong by whatever `clock.speed` is, for the reason `types.ts` sets out.
    const perTrain = Math.max(1, fleet.cycleSeconds);
    const dispatchesPerHour = (3600 / perTrain) * fleet.state.trains.length;
    return {
      rideId: fleet.rideId,
      trains: fleet.state.trains.length,
      blocks: fleet.plan.blocks.length,
      running,
      cycleSeconds: Math.round(fleet.cycleSeconds * 10) / 10,
      ridersPerHour: Math.round(dispatchesPerHour * fleet.profile.cars * fleet.profile.seatsPerCar),
      dispatches: fleet.state.dispatches,
    };
  }

  return {
    api,
    tick() {
      if (dirty) sync();
      const dt = RIDE_SECONDS_PER_TICK;
      for (const fleet of fleets.values()) advance(fleet, dt);
    },
    fill(writer: SimFrameWriter) {
      const api2 = track();
      const out = writer.f32('trains.transform', carCount * 7);
      writer.stat('trains.cars', carCount);
      writer.stat('trains.count', countTrains());
      if (!api2 || carCount === 0) return;
      let at = 0;
      for (const id of [...fleets.keys()].sort()) {
        const fleet = fleets.get(id);
        if (!fleet) continue;
        const half = fleet.profile.carLength / 2;
        for (const t of fleet.state.trains) {
          for (let c = 0; c < fleet.profile.cars; c++) {
            const s = fleet.motion.sampler.wrap(t.s - half - c * fleet.profile.carLength);
            const frame = api2.frameAt(id, s);
            if (!frame) {
              at += 7;
              continue;
            }
            out[at] = frame.p[0];
            out[at + 1] = frame.p[1];
            out[at + 2] = frame.p[2];
            writeQuaternion(out, at + 3, frame.right, frame.up, frame.tangent);
            at += 7;
          }
        }
      }
    },
    command(cmd: Command): boolean {
      if (cmd.type === 'trains:fleet') {
        const p = cmd.payload as { rideId?: string; count?: number };
        if (typeof p?.rideId === 'string' && typeof p.count === 'number') {
          api.setFleetSize(p.rideId, p.count);
          return true;
        }
        return false;
      }
      if (cmd.type === 'trains:rebuild') {
        dirty = true;
        return true;
      }
      return false;
    },
    serialize(): TrainsSlot {
      const out: TrainsSlot = { version: 1, fleets: {} };
      for (const id of [...fleets.keys()].sort()) {
        const fleet = fleets.get(id);
        if (!fleet) continue;
        out.fleets[id] = {
          trains: fleet.state.trains.map((t) => ({
            s: t.s,
            v: t.v,
            mode: t.mode,
            timer: t.timer,
            laps: t.laps,
          })),
          sinceDispatch: fleet.state.sinceDispatch,
          dispatches: fleet.state.dispatches,
        };
      }
      ctx.world.modules.trains = out;
      return out;
    },
    rebuild() {
      fleets.clear();
      dirty = true;
      sync();
    },
    dispose() {
      offAdd();
      offUpdate();
      offRemove();
      offTrack();
      detachContent();
      fleets.clear();
      roster = [];
      carCount = 0;
    },
  };

  function countTrains(): number {
    let n = 0;
    for (const fleet of fleets.values()) n += fleet.state.trains.length;
    return n;
  }

  function countCoasters(): number {
    let n = 0;
    for (const id in ctx.world.entities) {
      if (ctx.world.entities[id].kind === 'coaster') n += 1;
    }
    return n;
  }
}

/**
 * A quaternion from the track frame's own basis.
 *
 * `(right, up, tangent)` is a right-handed triple — `track/vec.ts` defines `right = cross(up, dir)`
 * and `cross(right, up) = tangent` follows — so it is a rotation matrix with those three as its
 * columns, X = right, Y = up, Z = forward. Shepperd's method picks the largest of the four
 * components to divide by, which is what keeps it stable through a loop where the naive
 * trace-only form divides by something near zero.
 */
export function writeQuaternion(
  out: Float32Array,
  at: number,
  right: readonly [number, number, number],
  up: readonly [number, number, number],
  forward: readonly [number, number, number]
): void {
  const m00 = right[0];
  const m10 = right[1];
  const m20 = right[2];
  const m01 = up[0];
  const m11 = up[1];
  const m21 = up[2];
  const m02 = forward[0];
  const m12 = forward[1];
  const m22 = forward[2];
  const trace = m00 + m11 + m22;
  let x: number;
  let y: number;
  let z: number;
  let w: number;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    w = 0.25 * s;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }
  out[at] = x;
  out[at + 1] = y;
  out[at + 2] = z;
  out[at + 3] = w;
}

/** Re-exported so the renderer and the selftest agree about where the rails are. */
export const RAIL_PLANE = -HEARTLINE_HEIGHT;
