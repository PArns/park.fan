/**
 * The simulation worker.
 *
 * Authoritative, 20 Hz, deterministic. It owns the one mutable world; the main thread gets
 * snapshots and sends commands. Nothing here reads a wall clock as *simulation* input —
 * `performance.now()` appears exactly twice, both times to measure how long a tick took, and
 * neither value ever reaches a system.
 *
 * The rules `pnpm test:game-determinism` enforces over this file and everything it imports:
 * no `Math.random`, no `Date.now()`, no `new Date()`, no iteration over a `Set` of object identities.
 */

/// <reference lib="webworker" />

import { createRegistry, type ContentRegistry } from './registry';
import { LogRing } from './log';
import { GuestStore, World, guestsToRecords, recordsToGuests } from './world';
import { deserializeWorld, serializeWorld } from './serialize';
import { ENGINE_CONTENT_VERSION, type DayLedger } from './schema';
import { clockFromTick, TICKS_PER_GAME_DAY } from './units';
import {
  emptyDirty,
  snapshotTransfers,
  type CommandEnvelope,
  type FromWorker,
  type SnapshotFrame,
  type SnapshotStats,
  type SoakReport,
  type ToWorker,
  type DirtyList,
} from './protocol';
import { FixedStepScheduler } from './scheduler';
import { applyCommand } from './sim/apply';
import { SIM_SYSTEM_ORDER } from './sim/order';
import type { LedgerBuckets, SimContext, SimNotice } from './sim/context';
import { entityIndex, type EntityId } from './ids';
import { ALL_PACKS } from '../packs';

const log = new LogRing();
const logger = log.logger('sim');

let world: World | null = null;
let guests: GuestStore | null = null;
let registry: ContentRegistry | null = null;
let scheduler: FixedStepScheduler | null = null;
let needNames: string[] = [];
let dirty: DirtyList = emptyDirty();
let ledger: LedgerBuckets = emptyLedger();
let paletteRevision = 0;
let palettePending = true;
let snapshotEveryTicks = 2; // 10 Hz of snapshots against a 20 Hz sim; the renderer interpolates
let ticksSinceSnapshot = 0;
let lastFrameAt = 0;
let notices: SimNotice[] = [];
let guestsToday = 0;
let bankruptcies = 0;
let guestsPeak = 0;

function emptyLedger(): LedgerBuckets {
  return {
    ticketIncome: 0,
    shopIncome: 0,
    entryIncome: 0,
    wages: 0,
    upkeep: 0,
    marketing: 0,
    interest: 0,
    construction: 0,
  };
}

function post(message: FromWorker, transfer?: Transferable[]): void {
  if (transfer && transfer.length) {
    (self as unknown as Worker).postMessage(message, transfer);
  } else {
    (self as unknown as Worker).postMessage(message);
  }
}

function buildRegistry(): ContentRegistry {
  const created = createRegistry(logger.child('registry'), ENGINE_CONTENT_VERSION);
  for (const pack of ALL_PACKS) created.load(pack);
  return created;
}

function makeContext(): SimContext {
  const w = world!;
  const g = guests!;
  const r = registry!;
  return {
    world: w,
    guests: g,
    registry: r,
    clock: clockFromTick(w.tick),
    dt: 1,
    dirty,
    rng: (stream) => w.rng(stream),
    notify: (notice) => {
      // Bounded: a system that notifies every tick must not fill the message queue.
      if (notices.length < 16) notices.push(notice);
    },
    destroy: (id) => {
      if (w.destroy(id)) dirty.removed.push(id);
    },
    spend: (cents, bucket) => {
      if (cents <= 0) return true;
      const economy = w.state.economy;
      if (economy.cash < cents) return false;
      economy.cash -= cents;
      ledger[bucket] += cents;
      return true;
    },
    earn: (cents, bucket) => {
      if (cents <= 0) return;
      w.state.economy.cash += cents;
      ledger[bucket] += cents;
    },
  };
}

function step(): void {
  const w = world!;
  w.state.tick++;
  const ctx = makeContext();

  for (const system of SIM_SYSTEM_ORDER) {
    try {
      system.tick(ctx);
    } catch (error) {
      // One system throwing must not stop the clock: the park degrades, the tick completes, and
      // the error is reported once rather than twenty times a second.
      logger.error(`system ${system.id} threw — skipped this tick`, error);
    }
  }

  if (guests!.count > guestsPeak) guestsPeak = guests!.count;

  // Day boundary: close the ledger.
  if (w.tick % TICKS_PER_GAME_DAY === 0) {
    const day = Math.floor(w.tick / TICKS_PER_GAME_DAY);
    const entry: DayLedger = {
      day,
      ticketIncome: ledger.ticketIncome,
      shopIncome: ledger.shopIncome,
      entryIncome: ledger.entryIncome,
      wages: ledger.wages,
      upkeep: ledger.upkeep,
      marketing: ledger.marketing,
      interest: ledger.interest,
      construction: ledger.construction,
      guests: guestsToday,
    };
    w.state.economy.history.push(entry);
    if (w.state.economy.history.length > 365) w.state.economy.history.shift();
    if (w.state.economy.cash < 0) bankruptcies++;
    ledger = emptyLedger();
    guestsToday = 0;
    w.state.stats.guestsToday = 0;
  }
}

function buildSnapshot(tickMs: number): SnapshotFrame {
  const w = world!;
  const g = guests!;
  const clock = clockFromTick(w.tick);

  const guestData = new Float32Array(g.count * 4);
  for (let i = 0; i < g.count; i++) {
    guestData[i * 4] = g.x[i]!;
    guestData[i * 4 + 1] = g.z[i]!;
    guestData[i * 4 + 2] = g.heading[i]!;
    guestData[i * 4 + 3] = g.state[i]!;
  }

  const trainIndices = Object.keys(w.entities.train);
  const trainData = new Float32Array(trainIndices.length * 6);
  trainIndices.forEach((key, i) => {
    const train = w.entities.train[Number(key)]!;
    trainData[i * 6] = train.rideId;
    trainData[i * 6 + 1] = train.s;
    trainData[i * 6 + 2] = train.v;
    trainData[i * 6 + 3] = train.cars;
    trainData[i * 6 + 4] = train.riders;
    trainData[i * 6 + 5] = TRAIN_STATES.indexOf(train.state);
  });

  let palette: Uint8Array | null = null;
  if (palettePending) {
    palette = g.palette.slice(0, g.count * 5);
    palettePending = false;
    paletteRevision++;
  }

  const stats: SnapshotStats = {
    cash: w.state.economy.cash,
    loan: w.state.economy.loan,
    guests: w.state.stats.guests,
    guestsToday,
    rating: w.state.stats.rating,
    happiness: w.state.stats.happiness,
    litter: w.state.stats.litter,
    ridesOpen: w.state.stats.ridesOpen,
    ridesTotal: w.state.stats.ridesTotal,
    staffCount: w.state.stats.staffCount,
    queueTotal: w.state.stats.queueTotal,
    powerDemandKw: w.state.stats.powerDemandKw,
    powerSupplyKw: w.state.stats.powerSupplyKw,
    day: clock.day,
    hour: clock.hour,
    minute: clock.minute,
    speed: scheduler!.getSpeed() as SnapshotStats['speed'],
    weather: w.state.weather.kind,
    temperatureC: w.state.weather.temperatureC,
    tickMs,
  };

  const frame: SnapshotFrame = {
    k: 'snapshot',
    tick: w.tick,
    guestCount: g.count,
    guestData,
    guestPalette: palette,
    paletteRevision,
    trainData,
    trainCount: trainIndices.length,
    stats,
    dirty,
  };
  dirty = emptyDirty();
  return frame;
}

const TRAIN_STATES = ['station', 'dispatch', 'lift', 'running', 'brake', 'stopped', 'crashed'] as const;

function flushNotices(): void {
  for (const notice of notices) post({ k: 'notify', ...notice });
  notices = [];
}

/** Walk the world for non-finite numbers. The soak test's number-one find. */
function findNonFinite(): string[] {
  const found: string[] = [];
  const w = world!;
  const g = guests!;
  const check = (value: number, where: string) => {
    if (!Number.isFinite(value) && found.length < 20) found.push(where);
  };
  for (let i = 0; i < g.count; i++) {
    check(g.x[i]!, `guest[${i}].x`);
    check(g.z[i]!, `guest[${i}].z`);
    check(g.heading[i]!, `guest[${i}].heading`);
  }
  for (const [key, transform] of Object.entries(w.entities.transform)) {
    check(transform.x, `transform[${key}].x`);
    check(transform.y, `transform[${key}].y`);
    check(transform.z, `transform[${key}].z`);
  }
  for (const [key, train] of Object.entries(w.entities.train)) {
    check(train.s, `train[${key}].s`);
    check(train.v, `train[${key}].v`);
  }
  check(w.state.economy.cash, 'economy.cash');
  for (let i = 0; i < w.state.terrain.heights.length; i += 97) {
    check(w.state.terrain.heights[i]!, `terrain.heights[${i}]`);
  }
  return found;
}

function buildSoakReport(ticks: number, wallMs: number): SoakReport {
  const w = world!;
  const g = guests!;
  const ctx = makeContext();

  let stuck = 0;
  for (let i = 0; i < g.count; i++) {
    // Walking, not moving, for over a game hour: the definition of stuck. Queueing and riding are
    // supposed to be motionless, so they are excluded rather than counted and explained away.
    const state = g.state[i]!;
    if ((state === 1 || state === 0) && g.speed[i]! < 0.01 && g.ticksInState[i]! > 20 * 60) stuck++;
  }

  let unreachableQueues = 0;
  for (const path of Object.values(w.entities.path)) {
    if (path.kind === 'queue' && path.servesRide === 0) unreachableQueues++;
  }

  const audits: Record<string, number> = {};
  for (const system of SIM_SYSTEM_ORDER) {
    if (!system.audit) continue;
    try {
      Object.assign(audits, system.audit(ctx));
    } catch (error) {
      logger.warn(`audit ${system.id} threw`, error);
    }
  }

  return {
    ticks,
    guests: g.count,
    guestsPeak,
    nonFinite: findNonFinite(),
    stuckGuests: stuck,
    unreachableQueues,
    orphanEntities: audits.orphanEntities ?? 0,
    cash: w.state.economy.cash,
    bankruptcies,
    maxTickMs: scheduler!.stats.maxTickMs,
    meanTickMs: scheduler!.stats.meanTickMs,
    wallMs,
  };
}

function boot(seed: number, name: string, scenarioId: string, packIds: string[], terrainSize: number, capacity: number, names: string[]): void {
  registry = buildRegistry();
  needNames = names.length ? names : registry.needOrder().slice();
  world = World.create({ seed, name, scenarioId, packIds, terrainSize });
  guests = new GuestStore(capacity, Math.max(1, needNames.length));
  palettePending = true;
  scheduler = new FixedStepScheduler(step, () => performance.now());
  scheduler.setSpeed(1);
  const ctx = makeContext();
  for (const system of SIM_SYSTEM_ORDER) system.init?.(ctx);
  post({
    k: 'ready',
    tick: world.tick,
    worldSummary: { name, seed, terrainSize, scenarioId, packIds },
  });
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  try {
    switch (message.k) {
      case 'boot':
        boot(
          message.seed,
          message.name,
          message.scenarioId,
          message.packIds,
          message.terrainSize,
          message.guestCapacity,
          message.needNames
        );
        break;

      case 'load': {
        registry = buildRegistry();
        const { world: state } = deserializeWorld(message.save);
        needNames = message.needNames.length ? message.needNames : registry.needOrder().slice();
        world = new World(state);
        guests = recordsToGuests(state.guests, message.guestCapacity, needNames);
        palettePending = true;
        scheduler = new FixedStepScheduler(step, () => performance.now());
        scheduler.setSpeed(1);
        const ctx = makeContext();
        for (const system of SIM_SYSTEM_ORDER) system.init?.(ctx);
        post({
          k: 'ready',
          tick: world.tick,
          worldSummary: {
            name: state.meta.name,
            seed: state.seed,
            terrainSize: state.terrain.size,
            scenarioId: state.meta.scenarioId,
            packIds: state.meta.packIds,
          },
        });
        break;
      }

      case 'commands': {
        if (!world) break;
        const ctx = makeContext();
        for (const envelope of message.list) applyOne(ctx, envelope);
        break;
      }

      case 'setSnapshotRate':
        snapshotEveryTicks = Math.max(1, Math.round(20 / Math.max(1, message.hz)));
        break;

      case 'requestSave': {
        if (!world || !guests) break;
        world.state.guests = guestsToRecords(guests, needNames);
        world.sync();
        post({ k: 'save', json: serializeWorld(world.state), tick: world.tick });
        break;
      }

      case 'fastForward': {
        if (!scheduler) break;
        const started = performance.now();
        scheduler.runExactly(message.ticks);
        const wallMs = performance.now() - started;
        post({ k: 'fastForwardDone', ticks: message.ticks, wallMs, report: buildSoakReport(message.ticks, wallMs) });
        flushNotices();
        break;
      }

      case 'dispose':
        world = null;
        guests = null;
        scheduler = null;
        self.close();
        break;
    }
  } catch (error) {
    post({
      k: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
};

function applyOne(ctx: SimContext, envelope: CommandEnvelope): void {
  if (envelope.cmd.k === 'sim.speed') {
    scheduler!.setSpeed(envelope.cmd.speed);
    return;
  }
  const result = applyCommand(ctx, envelope.cmd);
  if (!result.ok) post({ k: 'rejected', seq: envelope.seq, reason: result.reason ?? 'rejected' });
}

/**
 * The worker's own loop.
 *
 * `setInterval` at the tick rate rather than `requestAnimationFrame`: a worker has no frames, and
 * a hidden tab throttles timers to once a second — which the scheduler's catch-up clamp is built
 * for, and which is the honest behaviour anyway (a park that runs at full speed in a background
 * tab is a laptop fan for nobody).
 */
const loop = setInterval(() => {
  if (!scheduler || !world || !guests) return;
  const now = performance.now();
  const elapsed = lastFrameAt === 0 ? 50 : now - lastFrameAt;
  lastFrameAt = now;
  const ran = scheduler.advance(elapsed);
  if (ran === 0 && scheduler.getSpeed() !== 0) return;

  ticksSinceSnapshot += Math.max(ran, 1);
  if (ticksSinceSnapshot >= snapshotEveryTicks) {
    ticksSinceSnapshot = 0;
    const frame = buildSnapshot(scheduler.stats.lastTickMs);
    post(frame, snapshotTransfers(frame));
  }
  flushNotices();
}, 25);

self.addEventListener('unload', () => clearInterval(loop));

/** Kept so `entityIndex` is not tree-shaken out of the worker bundle for the soak audit. */
export const __entityIndex = entityIndex as (id: EntityId) => number;
