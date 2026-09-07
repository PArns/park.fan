/**
 * The worker half: a load → dispatch → run → unload cycle per placed flat ride, the queue in front
 * of it, the throughput it actually delivers, and the days it breaks down.
 *
 * ## The cycle is honest about what a machine can do
 *
 * `cycleMinutes` in a manifest is the **whole** cycle at full capacity, so the rated throughput is
 * `capacity / cycleMinutes × 60` guests an hour and nothing else: the bundled carousel is 24 people
 * every 3 minutes, i.e. 480 an hour, which is what a small park carousel does. The cycle is split
 * into four phases by `DEFAULT_SPLIT`, and the load phase is **rate-limited, not timed**: the
 * machine takes `capacity / loadMinutes` guests a minute off the queue, so a ride with six people
 * waiting dispatches in a fraction of the time and a ride with a hundred takes the full load. A
 * fixed load time would make a quiet ride and a busy one cost the same, which is the one thing a
 * park manager can see from across the park.
 *
 * ## Two clocks
 *
 * Everything in this file except `spin` and `drive` is integrated in **park minutes**, so the
 * numbers hold at every speed including the soak's 100×. `spin` and `drive` are the machine's own
 * animation clock in ride seconds and are the only thing the renderer reads; see `rig.ts`.
 *
 * ## Every accumulator is serialised
 *
 * `docs/game/critiques/guests-round1.md` §3.4 records four that were not, all found by diffing two
 * serialisations field by field. **And none of them is rounded on the way out**, which is the same
 * bug wearing a different hat: `serialize()` used to write every float to six decimal places for
 * readability, and a resumed run's `drive` came back 0.445239 against 0.445238 — one part in a
 * million, which the spin-up ramp turned into a whole tick of phase inside three hundred ticks and
 * the field-by-field diff then reported as five differing fields. A double survives JSON exactly;
 * a tidied one does not survive three hundred ticks. The ones here are `stateTimer`, `boardAccum` (a fractional guest),
 * `dwell`, `spin`, `drive`, `openMinutes`, `runMinutes`, `sinceService`, the throughput ring and
 * its minute cursor, the next ticket number, the queue, who is on board, and the rng word state.
 * `selftest.mjs` §6 runs a world 900 ticks, saves, resumes from the save, runs both another 300 and
 * diffs the two serialisations field by field.
 */

import type { Rng } from '../core/rng';
import type { Command, Entity, SimContext, SimFrameWriter, SimHandle } from '../core/types';
import { attachRideContent, resolveFlatRide } from './manifest';
import {
  MOTION_STRIDE,
  RIDE_STATE_NAMES,
  RideState,
  THROUGHPUT_WINDOW,
  type FlatRideProfile,
  type RefusalReason,
  type RideBoarding,
  type RideJoin,
  type RideOffer,
  type RideStateValue,
  type RideTicket,
  type RideView,
  type RidesStats,
} from './types';

/**
 * Ride seconds one fixed tick advances the MACHINE.
 *
 * The same constant and the same reason as `trains/types.ts`: the park clock is compressed sixty
 * fold, so a machine driven by it would run its whole cycle in three real seconds. Fixed, not
 * scaled by `clock.speed`, so a tick count is a repeatable animation.
 */
export const RIDE_SECONDS_PER_TICK = 0.05;

/**
 * Park minutes the whole park is open.
 *
 * Duplicated from `guests/sim.ts`'s `PARK_OPEN`/`PARK_CLOSE`, which is a real duplication and is
 * request §5: importing them would pull the guest simulation into a worker bundle for two numbers,
 * and there is nothing in core that answers "is the park open".
 */
export const PARK_OPEN = 9 * 60;
export const PARK_CLOSE = 23 * 60;

/** Ride seconds the machine takes to reach full speed, and to come back down. */
const SPIN_UP_SECONDS = 7;
const SPIN_DOWN_SECONDS = 9;
/** A queue longer than this many cycles' worth is full. */
const QUEUE_CYCLES = 8;
/** Park minutes an operator waits with an empty queue before dispatching what it has. */
const MIN_DWELL = 0.8;
/** How far from an entrance a walk-up guest is treated as being in the line, metres. */
const WALKUP_RADIUS = 7;
/** Guest slots the bridge inspects per tick. See `bridge()`. */
const SCAN_PER_TICK = 96;
/** Park minutes a walk-up ticket survives without boarding. */
const WALKUP_PATIENCE = 9;

// ── what the guests module looks like from here ─────────────────────────────────────────────
/**
 * Structurally typed rather than imported.
 *
 * A type-only import from `../guests` would be free at runtime, but this module is built and run
 * without `guests` in the graph (every showcase does exactly that), and a local interface is what
 * makes "no guests module" a branch rather than a missing symbol.
 */
interface GuestsLike {
  stats(): { capacity: number };
  inspect(slot: number): {
    slot: number;
    id: number;
    archetype: string;
    state: string;
    position: [number, number, number];
    cash: number;
  } | null;
  archetypes(): Array<{ id: string; height: number; thrill: number; patience: number }>;
}

// ── per-ride state ──────────────────────────────────────────────────────────────────────────
interface RideRuntime {
  id: string;
  profile: FlatRideProfile;
  entity: Entity;
  /** World point a guest walks to in order to join. */
  entrance: [number, number];
  /** Unit vector from the entrance back along the queue. */
  queueDir: [number, number];

  state: RideStateValue;
  /** Park minutes left in this state (or in the current down time). */
  stateTimer: number;
  /** Park minutes the machine has been sitting in LOADING with nobody new. */
  dwell: number;
  /** Fractional guest carried across ticks while boarding. */
  boardAccum: number;
  /** This cycle's loading speed, ±18 % — an operator is not a metronome. Drawn per cycle. */
  loadFactor: number;

  /** Nominal runs completed, wrapping — the animation clock. */
  spin: number;
  /** 0..1 how hard it is running. */
  drive: number;

  queue: RideTicket[];
  onboard: RideTicket[];
  /** Tickets that have been handed a receipt, so `board()` answers exactly once. */
  boarded: Set<number>;
  nextTicket: number;

  openMinutes: number;
  runMinutes: number;
  sinceService: number;
  ridersToday: number;
  cyclesToday: number;
  downMinutesToday: number;
  breakdownsToday: number;
  /** Ring of riders per park minute over the last hour. */
  ring: number[];
  ringMinute: number;
  /** Exponential mean of the satisfaction of the riders it has carried. */
  satisfaction: number;
  lastRefusal: RefusalReason | null;
  closedByPlayer: boolean;
  /**
   * Keep the queue topped up with synthetic riders.
   *
   * Set ONLY by the `rides:demo` command, which only `showcase.ts` and `selftest.mjs` send. A
   * showcase loads five modules and `guests` is not one of them, so without it every machine in
   * `/game?showcase=rides` sits in LOADING with an empty line for ever — a module that works and
   * cannot be photographed, which is the trap `INTEGRATION.md` §2 says has already cost this
   * project two rounds. Nothing in the game sets it, `stats().demoRiders` counts what it produced,
   * and a park that has it on is saying so in its own numbers.
   */
  demo: boolean;
  rng: Rng;
}

interface WalkUp {
  ride: string;
  ticket: number;
  joined: number;
}

export interface RidesSimApi {
  /** Ranked offers for a guest standing at `(x, z)`; the ranking is walk plus wait, in minutes. */
  find(
    x: number,
    z: number,
    opts?: { thrill?: number; cash?: number; heightCm?: number; limit?: number }
  ): RideOffer[];
  offer(id: string): RideOffer | null;
  join(id: string, guest: number, opts?: { heightCm?: number; cash?: number }): RideJoin | null;
  lastRefusal(id: string): RefusalReason | null;
  /** Where this ticket should be standing now; moves forward as the line does. */
  place(id: string, ticket: number): [number, number] | null;
  /** The receipt, exactly once, when the machine has taken them on board. */
  board(id: string, ticket: number): RideBoarding | null;
  leave(id: string, ticket: number): void;
  entrance(id: string): [number, number] | null;
  list(): RideView[];
  stats(): RidesStats;
  /** Ride seconds one run of the machine takes — what the animation is drawn against. */
  runSeconds(id: string): number;
  /** Ids in the order the frame buffers are written. */
  roster(): string[];
}

export function createRidesSim(ctx: SimContext): SimHandle {
  const detachContent = attachRideContent(ctx.registry);
  const rides = new Map<string, RideRuntime>();
  /** Sorted ride ids — the buffer order, and the tick order (ARCHITECTURE §1 rule 4). */
  let order: string[] = [];
  let rosterDirty = true;
  const rngBreak = ctx.rng.fork('breakdowns');
  const walkUps = new Map<number, WalkUp>();
  let scanCursor = 0;
  let walkUpCount = 0;
  let demoRiders = 0;
  let tickMs = 0;
  let lastMinute = -1;

  // ── indexing ──────────────────────────────────────────────────────────────────────────────
  function profileFor(entity: Entity): FlatRideProfile | null {
    return resolveFlatRide(ctx.registry, entity.pack, entity.item);
  }

  /**
   * Where the line starts and which way it runs back.
   *
   * `queueSide` is a manifest field (0..3 = +z, +x, -z, -x in the ride's own frame), rotated by the
   * entity's yaw. The entrance sits on the edge of the footprint rather than at its centre, because
   * a guest that walks to the centre of a ride walks into it.
   */
  function geometryOf(
    entity: Entity,
    profile: FlatRideProfile
  ): Pick<RideRuntime, 'entrance' | 'queueDir'> {
    const side = ((profile.queueSide % 4) + 4) % 4;
    const local: [number, number] =
      side === 0
        ? [0, profile.footprint[1] / 2]
        : side === 1
          ? [profile.footprint[0] / 2, 0]
          : side === 2
            ? [0, -profile.footprint[1] / 2]
            : [-profile.footprint[0] / 2, 0];
    const c = Math.cos(entity.yaw);
    const s = Math.sin(entity.yaw);
    const wx = local[0] * c + local[1] * s;
    const wz = -local[0] * s + local[1] * c;
    const l = Math.hypot(wx, wz) || 1;
    const dir: [number, number] = [wx / l, wz / l];
    return {
      entrance: [entity.position[0] + dir[0] * 1.4, entity.position[2] + dir[1] * 1.4],
      queueDir: dir,
    };
  }

  function add(entity: Entity): void {
    if (entity.kind !== 'ride') return;
    const profile = profileFor(entity);
    if (!profile) return;
    const geo = geometryOf(entity, profile);
    const existing = rides.get(entity.id);
    if (existing) {
      existing.entity = entity;
      existing.profile = profile;
      existing.entrance = geo.entrance;
      existing.queueDir = geo.queueDir;
      return;
    }
    rides.set(entity.id, {
      id: entity.id,
      profile,
      entity,
      ...geo,
      state: RideState.CLOSED,
      stateTimer: 0,
      dwell: 0,
      boardAccum: 0,
      loadFactor: 1,
      spin: 0,
      drive: 0,
      queue: [],
      onboard: [],
      boarded: new Set(),
      nextTicket: 1,
      openMinutes: 0,
      runMinutes: 0,
      sinceService: 0,
      ridersToday: 0,
      cyclesToday: 0,
      downMinutesToday: 0,
      breakdownsToday: 0,
      ring: new Array<number>(THROUGHPUT_WINDOW).fill(0),
      ringMinute: -1,
      satisfaction: 0,
      lastRefusal: null,
      closedByPlayer: false,
      demo: false,
      // One stream per ride, forked off this module's own stream by the ride's id, so adding a
      // second carousel cannot shift the first one's breakdowns.
      rng: rngBreak.fork(entity.id),
    });
    rosterDirty = true;
  }

  function remove(id: string): void {
    if (rides.delete(id)) rosterDirty = true;
    for (const [guest, w] of walkUps) if (w.ride === id) walkUps.delete(guest);
  }

  function reindex(): void {
    for (const id of Object.keys(ctx.world.entities).sort()) add(ctx.world.entities[id]);
  }

  const offAdd = ctx.events.on('entity:add', (entity: Entity) => add(entity));
  const offUpdate = ctx.events.on('entity:update', (p: { entity: Entity }) => add(p.entity));
  const offRemove = ctx.events.on('entity:remove', (entity: Entity) => remove(entity.id));

  // ── derived numbers ───────────────────────────────────────────────────────────────────────
  const loadMinutes = (r: RideRuntime): number => r.profile.cycleMinutes * r.profile.split.load;
  const dispatchMinutes = (r: RideRuntime): number =>
    r.profile.cycleMinutes * r.profile.split.dispatch;
  const runMinutesOf = (r: RideRuntime): number => r.profile.cycleMinutes * r.profile.split.run;
  const unloadMinutes = (r: RideRuntime): number => r.profile.cycleMinutes * r.profile.split.unload;
  /** Ride seconds one run takes. The `run` share of the cycle, read as real minutes. */
  const runSecondsOf = (r: RideRuntime): number => Math.max(4, runMinutesOf(r) * 60);
  const ratedThroughput = (r: RideRuntime): number =>
    (r.profile.capacity / r.profile.cycleMinutes) * 60;

  function measuredThroughput(r: RideRuntime): number {
    let sum = 0;
    for (const n of r.ring) sum += n;
    return sum;
  }

  /**
   * Park minutes a guest joining the back of the line waits before boarding.
   *
   * The people in front, over the rate the machine takes them, plus whatever is left of the cycle
   * that is running now. Not a fixed multiple of the queue length: a ride mid-run has a full cycle
   * to finish first and that is most of the wait on a short queue.
   */
  function waitFor(r: RideRuntime, extra = 0): number {
    const ahead = r.queue.length + extra;
    const cycles = Math.floor(ahead / Math.max(1, r.profile.capacity));
    let wait = cycles * r.profile.cycleMinutes;
    const inThis = ahead - cycles * r.profile.capacity;
    wait += (inThis / Math.max(1, r.profile.capacity)) * loadMinutes(r);
    if (
      r.state === RideState.DISPATCHING ||
      r.state === RideState.RUNNING ||
      r.state === RideState.UNLOADING
    ) {
      wait +=
        r.stateTimer + (r.state === RideState.DISPATCHING ? runMinutesOf(r) + unloadMinutes(r) : 0);
      if (r.state === RideState.RUNNING) wait += unloadMinutes(r);
    }
    if (r.state === RideState.BROKEN || r.state === RideState.MAINTENANCE) wait += r.stateTimer;
    return Math.max(0, wait);
  }

  const isOpen = (r: RideRuntime): boolean =>
    !r.closedByPlayer &&
    r.state !== RideState.BROKEN &&
    r.state !== RideState.MAINTENANCE &&
    parkOpen();

  function parkOpen(): boolean {
    const m = ctx.world.clock.minute;
    return m >= PARK_OPEN && m < PARK_CLOSE;
  }

  function offerOf(r: RideRuntime): RideOffer {
    return {
      id: r.id,
      key: r.profile.key,
      x: r.entity.position[0],
      z: r.entity.position[2],
      queueX: r.entrance[0],
      queueZ: r.entrance[1],
      price: r.profile.price,
      excitement: r.profile.excitement,
      fear: r.profile.fear,
      nausea: r.profile.nausea,
      minHeightCm: r.profile.minHeightCm,
      throughput: r.profile.capacity / r.profile.cycleMinutes,
      waitMinutes: waitFor(r),
      queueLength: r.queue.length,
      open: isOpen(r),
    };
  }

  // ── the cycle ─────────────────────────────────────────────────────────────────────────────
  function step(r: RideRuntime, dt: number): void {
    const open = parkOpen();
    if (r.state === RideState.CLOSED) {
      if (open && !r.closedByPlayer) r.state = RideState.LOADING;
      else return;
    }
    if (!open && r.state === RideState.LOADING && r.onboard.length === 0) {
      r.state = RideState.CLOSED;
      releaseQueue(r);
      return;
    }

    r.openMinutes += dt;
    r.sinceService += dt;

    switch (r.state) {
      case RideState.LOADING: {
        if (r.demo && r.queue.length < r.profile.capacity) {
          const want = r.profile.capacity - r.queue.length;
          for (let i = 0; i < want; i++) {
            r.queue.push({
              ticket: r.nextTicket++,
              guest: -r.nextTicket,
              joined: ctx.world.clock.minute,
              heightCm: 200,
            });
            demoRiders += 1;
          }
        }
        if (r.closedByPlayer && r.onboard.length === 0) {
          r.state = RideState.CLOSED;
          releaseQueue(r);
          return;
        }
        const rate = (r.profile.capacity * r.loadFactor) / Math.max(0.05, loadMinutes(r));
        r.boardAccum += rate * dt;
        let took = 0;
        while (r.boardAccum >= 1 && r.onboard.length < r.profile.capacity && r.queue.length > 0) {
          r.boardAccum -= 1;
          const ticket = r.queue.shift()!;
          r.onboard.push(ticket);
          took++;
        }
        if (r.onboard.length >= r.profile.capacity) {
          r.boardAccum = 0;
          enter(r, RideState.DISPATCHING, dispatchMinutes(r));
          return;
        }
        if (took > 0) {
          r.dwell = 0;
        } else {
          r.dwell += dt;
          // An operator with nobody left in the line dispatches what it has after a short wait,
          // and an empty machine simply sits there — a cycle with nobody on it is a cycle no park
          // runs and it would flatter the utilisation figure.
          if (r.onboard.length > 0 && r.dwell >= MIN_DWELL) {
            r.boardAccum = 0;
            enter(r, RideState.DISPATCHING, dispatchMinutes(r));
            return;
          }
          if (r.onboard.length === 0) r.dwell = Math.min(r.dwell, MIN_DWELL * 4);
        }
        break;
      }
      case RideState.DISPATCHING: {
        r.stateTimer -= dt;
        if (r.stateTimer <= 0) {
          if (rollBreakdown(r)) return;
          enter(r, RideState.RUNNING, runMinutesOf(r));
        }
        break;
      }
      case RideState.RUNNING: {
        r.stateTimer -= dt;
        r.runMinutes += dt;
        if (r.stateTimer <= 0) enter(r, RideState.UNLOADING, unloadMinutes(r) * riderShare(r));
        break;
      }
      case RideState.UNLOADING: {
        r.stateTimer -= dt;
        if (r.stateTimer <= 0) {
          completeCycle(r);
          enter(r, RideState.LOADING, 0);
        }
        break;
      }
      case RideState.BROKEN: {
        r.stateTimer -= dt;
        r.downMinutesToday += dt;
        if (r.stateTimer <= 0) enter(r, RideState.MAINTENANCE, 2);
        break;
      }
      case RideState.MAINTENANCE: {
        r.stateTimer -= dt;
        r.downMinutesToday += dt;
        if (r.stateTimer <= 0) {
          r.sinceService = 0;
          enter(r, RideState.LOADING, 0);
          ctx.events.emit('ride:fixed', { ride: r.id, key: r.profile.key });
        }
        break;
      }
      default:
        break;
    }
  }

  const riderShare = (r: RideRuntime): number =>
    0.35 + 0.65 * (r.onboard.length / Math.max(1, r.profile.capacity));

  function enter(r: RideRuntime, state: RideStateValue, timer: number): void {
    r.state = state;
    r.stateTimer = timer;
    if (state === RideState.LOADING) {
      r.dwell = 0;
      r.loadFactor = 0.82 + r.rng.next() * 0.36;
    }
  }

  function rollBreakdown(r: RideRuntime): boolean {
    // Poisson over the cycle, with wear since the last service on top. `mtbfMinutes` is derived
    // from the machine's own intensity — see `manifest.ts`.
    const wear = 1 + r.sinceService / (r.profile.mtbfMinutes * 2);
    const p = 1 - Math.exp((-r.profile.cycleMinutes * wear) / r.profile.mtbfMinutes);
    if (r.rng.next() >= p) return false;
    const down = 6 + r.rng.next() * 24;
    enter(r, RideState.BROKEN, down);
    r.breakdownsToday += 1;
    // Everybody on board gets off; the line gives up too, which is what happens.
    releaseOnboard(r);
    releaseQueue(r);
    ctx.events.emit('ride:breakdown', {
      ride: r.id,
      key: r.profile.key,
      name: r.profile.name,
      downMinutes: down,
    });
    ctx.events.emit('notify', {
      level: 'warning',
      key: `ride:breakdown:${r.id}`,
      text: `${r.profile.name.en ?? r.id} has broken down`,
    });
    return true;
  }

  function completeCycle(r: RideRuntime): void {
    const riders = r.onboard.length;
    if (riders > 0) {
      r.ridersToday += riders;
      r.cyclesToday += 1;
      const minute = Math.floor(ctx.world.clock.minute) % THROUGHPUT_WINDOW;
      rollRing(r, minute);
      r.ring[minute] += riders;
      ctx.events.emit('ride:cycle', {
        ride: r.id,
        key: r.profile.key,
        riders,
        capacity: r.profile.capacity,
        satisfaction: Math.round(r.satisfaction),
      });
    }
    releaseOnboard(r);
  }

  /** Zero every ring slot between the last minute we wrote and this one. */
  function rollRing(r: RideRuntime, minute: number): void {
    if (r.ringMinute === minute) return;
    if (r.ringMinute < 0) {
      r.ringMinute = minute;
      return;
    }
    let m = r.ringMinute;
    let guard = 0;
    while (m !== minute && guard++ < THROUGHPUT_WINDOW) {
      m = (m + 1) % THROUGHPUT_WINDOW;
      r.ring[m] = 0;
    }
    r.ringMinute = minute;
  }

  function releaseOnboard(r: RideRuntime): void {
    for (const t of r.onboard) {
      r.boarded.delete(t.ticket);
      walkUps.delete(t.guest);
    }
    r.onboard.length = 0;
  }

  function releaseQueue(r: RideRuntime): void {
    for (const t of r.queue) walkUps.delete(t.guest);
    r.queue.length = 0;
  }

  /** 0..100, what a rider thought of it before their own preferences are applied. */
  function satisfactionOf(r: RideRuntime, waited: number): number {
    const thrill = 42 + r.profile.excitement * 5.4;
    const queuePenalty = Math.min(38, (waited / 6) * 9);
    const sick = r.profile.nausea > 5 ? (r.profile.nausea - 5) * 2.2 : 0;
    return Math.max(0, Math.min(100, thrill - queuePenalty - sick));
  }

  // ── the animation clock ───────────────────────────────────────────────────────────────────
  function stepMachine(r: RideRuntime): void {
    const want = r.state === RideState.RUNNING ? 1 : 0;
    const perTick = RIDE_SECONDS_PER_TICK / (want > r.drive ? SPIN_UP_SECONDS : SPIN_DOWN_SECONDS);
    r.drive = want > r.drive ? Math.min(1, r.drive + perTick) : Math.max(0, r.drive - perTick);
    if (r.drive > 0) {
      r.spin += (r.drive * RIDE_SECONDS_PER_TICK) / runSecondsOf(r);
      if (r.spin >= 1024) r.spin -= 1024;
    }
  }

  // ── the guest bridge ──────────────────────────────────────────────────────────────────────
  /**
   * This module boards a guest that never asked, and says so.
   *
   * `guests/sim.ts` already walks a visitor to a `kind: 'ride'` venue and puts them in `QUEUING`
   * for two to six park minutes — and then walks them off again, because "a ride exists as a venue
   * but nothing boards yet" (its own comment). It has no hook for this module: the wiring it has
   * for `shops` is a `shopsApi()` call site by name. So rather than publish an API nothing calls
   * and photograph an empty carousel, this scans the guest store for people standing at a ride's
   * entrance and puts them in the line.
   *
   * What that is honest about: the guests module does not know it happened, so a rider here is
   * somebody who in ITS view stood at a ride for a few minutes and wandered off. It cannot balk,
   * it cannot pay, and its own happiness does not move. The one-line patch that makes it real is
   * `docs/game/requests/rides.md` §1, and it is the same shape as the bridge `shops` describes in
   * §2 of its own report.
   *
   * Cost is bounded: `SCAN_PER_TICK` slots per tick, round-robin, so a 2,000-guest park is swept
   * every 21 ticks (about one park second at speed 1). Measured in the report.
   */
  function bridge(): void {
    const guests = ctx.module<GuestsLike>('guests');
    if (!guests || rides.size === 0) return;
    let capacity = 0;
    try {
      capacity = guests.stats().capacity;
    } catch {
      return;
    }
    if (capacity <= 0) return;
    const now = ctx.world.clock.minute;
    const heights = archetypeHeights(guests);
    for (let n = 0; n < SCAN_PER_TICK; n++) {
      const slot = scanCursor++ % capacity;
      const record = guests.inspect(slot);
      if (!record) continue;
      const held = walkUps.get(record.id);
      if (held) {
        // Expire a ticket whose guest has moved on, or one the machine never got to.
        if (record.state !== 'queuing' || now - held.joined > WALKUP_PATIENCE) {
          const r = rides.get(held.ride);
          if (r) {
            const at = r.queue.findIndex((t) => t.ticket === held.ticket);
            if (at >= 0) r.queue.splice(at, 1);
          }
          walkUps.delete(record.id);
        }
        continue;
      }
      if (record.state !== 'queuing') continue;
      const [gx, , gz] = record.position;
      let best: RideRuntime | null = null;
      let bestD = WALKUP_RADIUS * WALKUP_RADIUS;
      for (const id of order) {
        const r = rides.get(id);
        if (!r || !isOpen(r)) continue;
        const dx = r.entrance[0] - gx;
        const dz = r.entrance[1] - gz;
        const d = dx * dx + dz * dz;
        if (d < bestD) {
          bestD = d;
          best = r;
        }
      }
      if (!best) continue;
      const join = doJoin(best, record.id, heights.get(record.archetype) ?? 175, record.cash);
      if (join) {
        walkUps.set(record.id, { ride: best.id, ticket: join.ticket, joined: now });
        walkUpCount += 1;
      }
    }
  }

  let heightCache: Map<string, number> | null = null;
  function archetypeHeights(guests: GuestsLike): Map<string, number> {
    if (heightCache) return heightCache;
    heightCache = new Map();
    try {
      for (const a of guests.archetypes()) heightCache.set(a.id, Math.round(a.height * 100));
    } catch {
      /* an archetype list is a nicety; 175 cm is the fallback */
    }
    return heightCache;
  }

  // ── join / board / leave ──────────────────────────────────────────────────────────────────
  function doJoin(r: RideRuntime, guest: number, heightCm: number, cash: number): RideJoin | null {
    if (!parkOpen() || r.closedByPlayer) {
      r.lastRefusal = 'closed';
      return null;
    }
    if (r.state === RideState.BROKEN || r.state === RideState.MAINTENANCE) {
      r.lastRefusal = 'broken';
      return null;
    }
    if (r.profile.minHeightCm != null && heightCm < r.profile.minHeightCm) {
      r.lastRefusal = 'too-short';
      return null;
    }
    if (r.profile.price > 0 && cash < r.profile.price) {
      r.lastRefusal = 'no-money';
      return null;
    }
    if (r.queue.length >= r.profile.capacity * QUEUE_CYCLES) {
      r.lastRefusal = 'queue-full';
      return null;
    }
    const ticket: RideTicket = {
      ticket: r.nextTicket++,
      guest,
      joined: ctx.world.clock.minute,
      heightCm,
    };
    r.queue.push(ticket);
    r.lastRefusal = null;
    return { ticket: ticket.ticket, x: r.entrance[0], z: r.entrance[1], waitMinutes: waitFor(r) };
  }

  /**
   * Where a ticket stands, as a serpentine back from the entrance.
   *
   * 0.85 m of pitch, and the line turns back on itself every `ROW` places into a 1.9 m channel —
   * the same switchback shape `shops` draws, at a flat ride's own scale.
   */
  const ROW = 10;
  const PITCH = 0.85;
  const CHANNEL = 1.9;
  function placeOf(r: RideRuntime, index: number): [number, number] {
    const row = Math.floor(index / ROW);
    const along = index % ROW;
    const back = row % 2 === 0 ? along : ROW - 1 - along;
    const dx = r.queueDir[0];
    const dz = r.queueDir[1];
    // Right-hand normal of the queue direction.
    const nx = dz;
    const nz = -dx;
    return [
      r.entrance[0] + dx * (0.6 + back * PITCH) + nx * row * CHANNEL,
      r.entrance[1] + dz * (0.6 + back * PITCH) + nz * row * CHANNEL,
    ];
  }

  // ── the public API ────────────────────────────────────────────────────────────────────────
  const api: RidesSimApi = {
    find(x, z, opts) {
      const limit = opts?.limit ?? 4;
      const out: Array<{ offer: RideOffer; cost: number }> = [];
      for (const id of order) {
        const r = rides.get(id);
        if (!r || !isOpen(r)) continue;
        if (r.profile.minHeightCm != null && (opts?.heightCm ?? 175) < r.profile.minHeightCm)
          continue;
        if (r.profile.price > 0 && (opts?.cash ?? Infinity) < r.profile.price) continue;
        const offer = offerOf(r);
        const walk = Math.hypot(offer.x - x, offer.z - z) / 1.25;
        let cost = walk + offer.waitMinutes;
        if (opts?.thrill != null) {
          // A thrill preference is a match, not a maximum — the same reading `guests/decide.ts`
          // takes, so the two rank a park the same way.
          const has = Math.min(1, r.profile.excitement / 8);
          cost /= 0.35 + (1 - Math.abs(opts.thrill - has)) * 0.9;
        }
        out.push({ offer, cost });
      }
      out.sort((a, b) => a.cost - b.cost);
      return out.slice(0, limit).map((e) => e.offer);
    },
    offer(id) {
      const r = rides.get(id);
      return r ? offerOf(r) : null;
    },
    join(id, guest, opts) {
      const r = rides.get(id);
      if (!r) return null;
      return doJoin(r, guest, opts?.heightCm ?? 175, opts?.cash ?? Infinity);
    },
    lastRefusal(id) {
      return rides.get(id)?.lastRefusal ?? null;
    },
    place(id, ticket) {
      const r = rides.get(id);
      if (!r) return null;
      const at = r.queue.findIndex((t) => t.ticket === ticket);
      if (at < 0) return null;
      return placeOf(r, at);
    },
    board(id, ticket) {
      const r = rides.get(id);
      if (!r) return null;
      const seat = r.onboard.find((t) => t.ticket === ticket);
      if (!seat || r.boarded.has(ticket)) return null;
      r.boarded.add(ticket);
      const waited = ctx.world.clock.minute - seat.joined;
      const satisfaction = satisfactionOf(r, waited);
      r.satisfaction =
        r.satisfaction === 0 ? satisfaction : r.satisfaction * 0.9 + satisfaction * 0.1;
      return {
        ticket,
        rideMinutes:
          Math.max(0, r.stateTimer) + dispatchMinutes(r) + runMinutesOf(r) + unloadMinutes(r),
        satisfaction,
        price: r.profile.price,
      };
    },
    leave(id, ticket) {
      const r = rides.get(id);
      if (!r) return;
      const q = r.queue.findIndex((t) => t.ticket === ticket);
      if (q >= 0) {
        walkUps.delete(r.queue[q].guest);
        r.queue.splice(q, 1);
        return;
      }
      const o = r.onboard.findIndex((t) => t.ticket === ticket);
      if (o >= 0) {
        walkUps.delete(r.onboard[o].guest);
        r.onboard.splice(o, 1);
        r.boarded.delete(ticket);
      }
    },
    entrance(id) {
      const r = rides.get(id);
      return r ? [...r.entrance] : null;
    },
    list() {
      return order.map((id) => {
        const r = rides.get(id)!;
        return {
          id,
          key: r.profile.key,
          name: r.profile.name,
          state: RIDE_STATE_NAMES[r.state],
          open: isOpen(r),
          phase: r.spin - Math.floor(r.spin),
          riders: r.onboard.length,
          capacity: r.profile.capacity,
          queueLength: r.queue.length,
          waitMinutes: waitFor(r),
          throughputHour: measuredThroughput(r),
          ratedThroughput: ratedThroughput(r),
          ridersToday: r.ridersToday,
          cyclesToday: r.cyclesToday,
          utilisation: r.openMinutes > 0 ? r.runMinutes / r.openMinutes : 0,
          downMinutesToday: r.downMinutesToday,
          breakdownsToday: r.breakdownsToday,
          satisfaction: r.satisfaction,
          sinceServiceMinutes: r.sinceService,
        } satisfies RideView;
      });
    },
    stats() {
      let open = 0;
      let broken = 0;
      let riding = 0;
      let queued = 0;
      let ridersToday = 0;
      let cyclesToday = 0;
      let throughput = 0;
      let rated = 0;
      let wait = 0;
      let satisfaction = 0;
      let satisfied = 0;
      let breakdowns = 0;
      for (const r of rides.values()) {
        if (isOpen(r)) open += 1;
        if (r.state === RideState.BROKEN || r.state === RideState.MAINTENANCE) broken += 1;
        riding += r.onboard.length;
        queued += r.queue.length;
        ridersToday += r.ridersToday;
        cyclesToday += r.cyclesToday;
        throughput += measuredThroughput(r);
        rated += ratedThroughput(r);
        wait += waitFor(r);
        if (r.satisfaction > 0) {
          satisfaction += r.satisfaction;
          satisfied += 1;
        }
        breakdowns += r.breakdownsToday;
      }
      return {
        rides: rides.size,
        open,
        broken,
        riding,
        queued,
        ridersToday,
        cyclesToday,
        throughputHour: throughput,
        ratedThroughput: rated,
        meanWaitMinutes: rides.size ? wait / rides.size : 0,
        meanSatisfaction: satisfied ? satisfaction / satisfied : 0,
        breakdownsToday: breakdowns,
        walkUps: walkUpCount,
        demoRiders,
        tickMs,
      };
    },
    runSeconds(id) {
      const r = rides.get(id);
      return r ? runSecondsOf(r) : 0;
    },
    roster: () => [...order],
  };

  // ── the handle ────────────────────────────────────────────────────────────────────────────
  function publishRoster(): void {
    order = [...rides.keys()].sort();
    rosterDirty = false;
    ctx.events.emit('ride:roster', {
      rides: order.map((id) => {
        const r = rides.get(id)!;
        return {
          id,
          key: r.profile.key,
          pack: r.entity.pack,
          item: r.entity.item,
          runSeconds: runSecondsOf(r),
        };
      }),
    });
  }

  return {
    api,
    tick(dt: number) {
      const t0 = now();
      if (rosterDirty) publishRoster();
      const minute = Math.floor(ctx.world.clock.minute);
      if (minute !== lastMinute) {
        lastMinute = minute;
        for (const r of rides.values()) rollRing(r, minute % THROUGHPUT_WINDOW);
      }
      for (const id of order) {
        const r = rides.get(id);
        if (!r) continue;
        step(r, dt);
        stepMachine(r);
      }
      bridge();
      tickMs = now() - t0;
    },
    command(cmd: Command): boolean {
      switch (cmd.type) {
        case 'rides:close': {
          const p = cmd.payload as { id: string; closed: boolean };
          const r = rides.get(p.id);
          if (!r) return true;
          r.closedByPlayer = !!p.closed;
          return true;
        }
        case 'rides:demo': {
          const p = cmd.payload as { id?: string; on: boolean };
          for (const r of rides.values()) if (!p.id || r.id === p.id) r.demo = !!p.on;
          return true;
        }
        case 'rides:repair': {
          const p = cmd.payload as { id: string };
          const r = rides.get(p.id);
          if (!r) return true;
          if (r.state === RideState.BROKEN) enter(r, RideState.MAINTENANCE, 1);
          return true;
        }
        case 'rides:service': {
          const p = cmd.payload as { id: string };
          const r = rides.get(p.id);
          if (!r) return true;
          enter(r, RideState.MAINTENANCE, 4);
          releaseOnboard(r);
          return true;
        }
        default:
          return false;
      }
    },
    fill(writer: SimFrameWriter) {
      const n = order.length;
      const motion = writer.f32('rides.motion', n * MOTION_STRIDE);
      const state = writer.u8('rides.state', n);
      for (let i = 0; i < n; i++) {
        const r = rides.get(order[i]);
        if (!r) continue;
        motion[i * MOTION_STRIDE] = r.spin;
        motion[i * MOTION_STRIDE + 1] = r.drive;
        motion[i * MOTION_STRIDE + 2] = r.onboard.length;
        motion[i * MOTION_STRIDE + 3] = r.queue.length;
        state[i] = r.state;
      }
      const s = api.stats();
      writer.stat('rides.count', s.rides);
      writer.stat('rides.open', s.open);
      writer.stat('rides.queued', s.queued);
      writer.stat('rides.riding', s.riding);
      writer.stat('rides.ridersToday', s.ridersToday);
      writer.stat('rides.throughputHour', s.throughputHour);
      writer.stat('rides.tickMs', s.tickMs);
    },
    serialize() {
      return {
        v: 1,
        walkUpCount,
        demoRiders,
        scanCursor,
        lastMinute,
        rides: order.map((id) => {
          const r = rides.get(id)!;
          return {
            id,
            state: r.state,
            stateTimer: r.stateTimer,
            dwell: r.dwell,
            boardAccum: r.boardAccum,
            loadFactor: r.loadFactor,
            spin: r.spin,
            drive: r.drive,
            queue: r.queue.map(packTicket),
            onboard: r.onboard.map(packTicket),
            boarded: [...r.boarded].sort((a, b) => a - b),
            nextTicket: r.nextTicket,
            openMinutes: r.openMinutes,
            runMinutes: r.runMinutes,
            sinceService: r.sinceService,
            ridersToday: r.ridersToday,
            cyclesToday: r.cyclesToday,
            downMinutesToday: r.downMinutesToday,
            breakdownsToday: r.breakdownsToday,
            ring: [...r.ring],
            ringMinute: r.ringMinute,
            satisfaction: r.satisfaction,
            closedByPlayer: r.closedByPlayer,
            demo: r.demo,
            // Unsigned, for the reason `shops` records: `Rng.state()` hands back int32 words that
            // may be negative, and `deserialize` normalises with `>>> 0`, so an uninterrupted run
            // and one resumed from its own save wrote the same generator as two different strings.
            rng: r.rng.state().map((w) => w >>> 0),
          };
        }),
        walkUps: [...walkUps.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([guest, w]) => [guest, w.ride, w.ticket, w.joined]),
      };
    },
    /**
     * Re-index the world and adopt the saved slot.
     *
     * There is no `deserialize` in `SimHandle` — core writes `serialize()` into
     * `world.modules[id]` and calls `rebuild()` after a load, so the slot is read from the world
     * here rather than handed in. Reading it anywhere else would be reading it before the entities
     * exist.
     */
    rebuild() {
      reindex();
      publishRoster();
      const saved = ctx.world.modules.rides as
        | {
            walkUpCount?: number;
            demoRiders?: number;
            scanCursor?: number;
            lastMinute?: number;
            rides?: Array<Record<string, unknown>>;
            walkUps?: Array<[number, string, number, number]>;
          }
        | undefined;
      if (!saved || typeof saved !== 'object') return;
      walkUpCount = saved.walkUpCount ?? 0;
      demoRiders = saved.demoRiders ?? 0;
      scanCursor = saved.scanCursor ?? 0;
      lastMinute = saved.lastMinute ?? -1;
      for (const raw of saved.rides ?? []) {
        const r = rides.get(String(raw.id));
        if (!r) continue;
        r.state = raw.state as RideStateValue;
        r.stateTimer = Number(raw.stateTimer) || 0;
        r.dwell = Number(raw.dwell) || 0;
        r.boardAccum = Number(raw.boardAccum) || 0;
        r.loadFactor = Number(raw.loadFactor) || 1;
        r.spin = Number(raw.spin) || 0;
        r.drive = Number(raw.drive) || 0;
        r.queue = (raw.queue as number[][] | undefined)?.map(unpackTicket) ?? [];
        r.onboard = (raw.onboard as number[][] | undefined)?.map(unpackTicket) ?? [];
        r.boarded = new Set((raw.boarded as number[] | undefined) ?? []);
        r.nextTicket = Number(raw.nextTicket) || 1;
        r.openMinutes = Number(raw.openMinutes) || 0;
        r.runMinutes = Number(raw.runMinutes) || 0;
        r.sinceService = Number(raw.sinceService) || 0;
        r.ridersToday = Number(raw.ridersToday) || 0;
        r.cyclesToday = Number(raw.cyclesToday) || 0;
        r.downMinutesToday = Number(raw.downMinutesToday) || 0;
        r.breakdownsToday = Number(raw.breakdownsToday) || 0;
        r.ring = ((raw.ring as number[] | undefined) ?? []).slice(0, THROUGHPUT_WINDOW);
        while (r.ring.length < THROUGHPUT_WINDOW) r.ring.push(0);
        r.ringMinute = Number(raw.ringMinute ?? -1);
        r.satisfaction = Number(raw.satisfaction) || 0;
        r.closedByPlayer = !!raw.closedByPlayer;
        r.demo = !!raw.demo;
        const words = raw.rng as number[] | undefined;
        if (words?.length === 4) r.rng.restore(words as [number, number, number, number]);
      }
      walkUps.clear();
      for (const [guest, ride, ticket, joined] of saved.walkUps ?? []) {
        walkUps.set(guest, { ride, ticket, joined });
      }
    },
    dispose() {
      offAdd();
      offUpdate();
      offRemove();
      detachContent();
      rides.clear();
      walkUps.clear();
    },
  };

  function packTicket(t: RideTicket): number[] {
    return [t.ticket, t.guest, t.joined, t.heightCm];
  }
}

function unpackTicket(a: number[]): RideTicket {
  return { ticket: a[0], guest: a[1], joined: a[2], heightCm: a[3] };
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}
