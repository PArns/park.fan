/**
 * The simulation runtime. Runs in sim.worker.ts in the browser and directly in node for the soak
 * harness and the tests — so it must never touch the DOM or Babylon. It owns the world, the fixed
 * 20 Hz scheduler, the sim handles of every module and the frame writer.
 */

import { EventBus } from './events';
import { Rng } from './rng';
import { Registry } from './registry';
import { FixedStepScheduler } from './scheduler';
import { computeEnvironment } from './sun';
import { FrameWriter, type InitMessage, type WorkerToMain } from './protocol';
import { deserializeWorld, serializeWorld } from './world';
import {
  MINUTES_PER_TICK_AT_SPEED_1,
  type Command,
  type Entity,
  type EnvironmentState,
  type GameEvents,
  type GameModule,
  type SimContext,
  type SimHandle,
  type Speed,
  type World,
} from './types';

export type Post = (msg: WorkerToMain, transfer?: ArrayBuffer[]) => void;

/** Events forwarded to the main thread when they fire in the worker. */
const FORWARDED_PREFIXES = [
  'entity:',
  'notify',
  'clock:day',
  'finance:',
  'ride:',
  'guest:',
  'train:',
  'staff:',
  'scenario:',
  'power:',
  'shop:',
  'env:',
  'module:failed',
  'paths:',
  'terrain:',
  'track:',
  'pools:',
];

export class SimRuntime {
  world!: World;
  readonly registry = new Registry();
  readonly events = new EventBus<GameEvents>();
  readonly handles = new Map<string, SimHandle>();
  readonly failed: string[] = [];
  readonly writer = new FrameWriter();
  readonly scheduler: FixedStepScheduler;
  rng!: Rng;
  private ack = 0;
  private lastTickMs = 0;
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private envCache: EnvironmentState | null = null;
  private envCacheKey = -1;

  private readonly moduleDefs: readonly GameModule[];
  private readonly post: Post;

  constructor(moduleDefs: readonly GameModule[], post: Post) {
    this.moduleDefs = moduleDefs;
    this.post = post;
    this.scheduler = new FixedStepScheduler(() => this.tick());
    this.events.onAny((name, payload) => {
      const n = String(name);
      if (FORWARDED_PREFIXES.some((p) => n.startsWith(p))) {
        this.post({ type: 'event', name: n, payload });
      }
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────────────────
  init(msg: InitMessage): void {
    for (const pack of msg.packs) this.registry.registerPack(pack);
    this.setWorld(msg.world);
    this.createModules(msg.modules);
    this.post({
      type: 'ready',
      tick: this.scheduler.tick,
      clock: this.world.clock,
      failed: [...this.failed],
    });
  }

  private setWorld(world: World): void {
    this.world = world;
    this.rng = new Rng(world.meta.seed);
    this.envCacheKey = -1;
  }

  private createModules(ids: string[]): void {
    for (const h of this.handles.values()) h.dispose?.();
    this.handles.clear();
    this.failed.length = 0;
    const byId = new Map(this.moduleDefs.map((m) => [m.id, m]));
    for (const id of ids) {
      const def = byId.get(id);
      if (!def?.sim) continue;
      const ctx: SimContext = {
        world: this.world,
        events: this.events,
        registry: this.registry,
        rng: this.rng.fork(id),
        module: <T>(other: string) => this.handles.get(other)?.api as T | undefined,
        environment: () => this.environment(),
      };
      try {
        for (const kind of def.kinds ?? []) this.registry.registerKind(kind, def.id);
        this.handles.set(id, def.sim(ctx));
      } catch (error) {
        this.failed.push(id);
        const message = error instanceof Error ? error.message : String(error);
        this.events.emit('module:failed', { id, where: 'sim', error: message });
        this.post({ type: 'error', where: `sim:${id}`, message });
      }
    }
    for (const h of this.handles.values()) {
      try {
        h.rebuild?.();
      } catch (error) {
        this.post({
          type: 'error',
          where: 'rebuild',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  load(world: World): void {
    const ids = Array.from(this.handles.keys());
    this.setWorld(world);
    this.createModules(ids.length ? ids : this.moduleDefs.map((m) => m.id));
    this.post({
      type: 'ready',
      tick: this.scheduler.tick,
      clock: this.world.clock,
      failed: [...this.failed],
    });
  }

  snapshot(requestId: number): void {
    // Give modules a chance to write their slot before serialising.
    for (const [id, h] of this.handles) {
      const state = h.serialize?.();
      if (state !== undefined) this.world.modules[id] = state;
    }
    try {
      this.post({ type: 'snapshot', requestId, json: serializeWorld(this.world) });
    } catch (error) {
      this.post({
        type: 'error',
        where: 'snapshot',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /** Serialise the world in-process (soak harness, tests). */
  serialize(): string {
    for (const [id, h] of this.handles) {
      const state = h.serialize?.();
      if (state !== undefined) this.world.modules[id] = state;
    }
    return serializeWorld(this.world);
  }

  static parse(json: string): World {
    return deserializeWorld(json);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduler.reset();
    this.timer = setInterval(() => this.scheduler.advance(now()), 16);
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  dispose(): void {
    this.stop();
    for (const h of this.handles.values()) h.dispose?.();
    this.handles.clear();
    this.events.clear();
  }

  // ── Commands ──────────────────────────────────────────────────────────────────────────────
  command(cmd: Command): void {
    this.ack = Math.max(this.ack, cmd.seq);
    this.world.log.push(cmd);
    if (this.world.log.length > 2000) this.world.log.splice(0, this.world.log.length - 2000);
    if (this.applyCoreCommand(cmd)) return;
    for (const h of this.handles.values()) {
      try {
        if (h.command?.(cmd)) return;
      } catch (error) {
        this.post({
          type: 'error',
          where: `command:${cmd.type}`,
          message: error instanceof Error ? error.message : String(error),
        });
        return;
      }
    }
  }

  private applyCoreCommand(cmd: Command): boolean {
    switch (cmd.type) {
      case 'clock:speed': {
        this.world.clock.speed = (cmd.payload as { speed: Speed }).speed;
        return true;
      }
      case 'clock:set': {
        const p = cmd.payload as { minute?: number; day?: number };
        if (p.minute != null) this.world.clock.minute = ((p.minute % 1440) + 1440) % 1440;
        if (p.day != null) this.world.clock.day = Math.max(1, Math.floor(p.day));
        this.envCacheKey = -1;
        return true;
      }
      case 'entity:add': {
        const entity = cmd.payload as Entity;
        this.world.entities[entity.id] = entity;
        this.events.emit('entity:add', entity);
        return false; // modules may also react
      }
      case 'entity:update': {
        const entity = cmd.payload as Entity;
        const previous = this.world.entities[entity.id];
        if (!previous) return true;
        this.world.entities[entity.id] = entity;
        this.events.emit('entity:update', { entity, previous });
        return false;
      }
      case 'entity:remove': {
        const { id } = cmd.payload as { id: string };
        const entity = this.world.entities[id];
        if (!entity) return true;
        delete this.world.entities[id];
        this.events.emit('entity:remove', entity);
        return false;
      }
      case 'finance:adjust': {
        const { cents } = cmd.payload as { cents: number };
        this.world.finance.cash += Math.round(cents);
        this.events.emit('finance:changed', this.world.finance);
        return false;
      }
      default:
        return false;
    }
  }

  // ── Tick ──────────────────────────────────────────────────────────────────────────────────
  setSpeed(speed: Speed): void {
    this.world.clock.speed = speed;
  }

  tick(): void {
    const t0 = now();
    const speed = this.world.clock.speed;
    const dt = speed * MINUTES_PER_TICK_AT_SPEED_1;
    if (dt > 0) {
      const clock = this.world.clock;
      clock.minute += dt;
      if (clock.minute >= 1440) {
        clock.minute -= 1440;
        clock.day += 1;
        this.events.emit('clock:day', { day: clock.day });
      }
      for (const [id, h] of this.handles) {
        try {
          h.tick(dt);
        } catch (error) {
          this.post({
            type: 'error',
            where: `tick:${id}`,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
      this.events.emit('clock:tick', clock);
    }
    this.lastTickMs = now() - t0;
    this.sendFrame();
  }

  private sendFrame(): void {
    this.writer.begin();
    for (const [id, h] of this.handles) {
      try {
        h.fill?.(this.writer);
      } catch (error) {
        this.post({
          type: 'error',
          where: `fill:${id}`,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const { buffers, stats, transfer } = this.writer.end();
    stats['finance.cash'] = this.world.finance.cash;
    stats['sim.tickMs'] = this.lastTickMs;
    this.post(
      {
        type: 'frame',
        frame: {
          tick: this.scheduler.tick,
          clock: { ...this.world.clock },
          ack: this.ack,
          tickMs: this.lastTickMs,
          buffers,
          stats,
        },
      },
      transfer
    );
  }

  environment(): EnvironmentState {
    const env = this.handles.get('environment')?.api as
      { current?: () => EnvironmentState } | undefined;
    if (env?.current) return env.current();
    const key = Math.floor(this.world.clock.minute) + this.world.clock.day * 1440;
    if (this.envCache && this.envCacheKey === key) return this.envCache;
    this.envCache = computeEnvironment({
      minute: this.world.clock.minute,
      day: this.world.clock.day,
    });
    this.envCacheKey = key;
    return this.envCache;
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
