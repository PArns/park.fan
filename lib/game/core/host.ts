/**
 * The main-thread host: boots the engine, creates the main handles of every module, starts the
 * worker, forwards commands, interpolates frames and exposes the harness API on
 * `window.__parkfan_game`. Loaded through `next/dynamic(..., { ssr: false })` — nothing here runs
 * on the server.
 */

import { EventBus } from './events';
import { Rng } from './rng';
import { Registry } from './registry';
import { detectCapabilities, QUALITY } from './capabilities';
import { createRenderContext, type RenderContext } from './renderer';
import { parseBootQuery, type BootQuery } from './boot-query';
import { GameStore } from './store';
import { computeEnvironment } from './sun';
import { cloneWorld, createWorld, deserializeWorld } from './world';
import type { MainToWorker, WorkerToMain } from './protocol';
import {
  TICK_MS,
  type Command,
  type Entity,
  type EntityChange,
  type EnvironmentState,
  type GameEvents,
  type GameModule,
  type MainContext,
  type MainHandle,
  type SimFrame,
  type Speed,
  type World,
} from './types';
import { GAME_MODULES } from '../modules';
import { BUNDLED_PACKS } from '../content/packs';

export interface BootOptions {
  canvas: HTMLCanvasElement;
  store: GameStore;
  locale: string;
  search: string;
  assetsUrl?: string;
  /** Override the world (e.g. loading a save). */
  world?: World;
  /** Aborts a boot that is still in progress (React strict-mode remount, route change). */
  signal?: AbortSignal;
}

export class BootAbortedError extends Error {
  constructor() {
    super('boot aborted');
    this.name = 'BootAbortedError';
  }
}

export interface GameHandle {
  store: GameStore;
  events: EventBus<GameEvents>;
  registry: Registry;
  render: RenderContext;
  query: BootQuery;
  world: Readonly<World>;
  dispatch(type: string, payload: unknown): number;
  setSpeed(speed: Speed): void;
  setTimeOfDay(minute: number, day?: number): void;
  save(): Promise<string>;
  load(json: string): void;
  module<T = unknown>(id: string): T | undefined;
  handles: Map<string, MainHandle>;
  dispose(): void;
}

const MAX_ERRORS = 50;

export async function boot(opts: BootOptions): Promise<GameHandle> {
  const { canvas, store, locale } = opts;
  const query = parseBootQuery(opts.search);
  const events = new EventBus<GameEvents>();
  const registry = new Registry();
  const errors: string[] = [];
  const recordError = (where: string, message: string) => {
    errors.push(`${where}: ${message}`);
    if (errors.length > MAX_ERRORS) errors.shift();
  };

  const step = (bootStep: string, progress: number) => {
    if (opts.signal?.aborted) throw new BootAbortedError();
    store.set({ bootStep, progress });
  };

  // 1. capabilities
  step('capabilities', 0.05);
  const caps = await detectCapabilities(query.quality, query.engine);
  const quality = QUALITY[caps.preset];
  store.set({ capabilities: caps, preset: caps.preset });
  if (caps.notice) store.notify('info', caps.notice, 'preset');

  // 2. packs
  step('packs', 0.12);
  for (const pack of BUNDLED_PACKS) registry.registerPack(pack);

  // 3. world
  step('world', 0.18);
  let world: World;
  if (opts.world) {
    world = opts.world;
  } else if (query.showcase) {
    world = createWorld({
      seed: query.seed,
      name: `showcase:${query.showcase}`,
      packs: registry.packs().map((p) => p.id),
    });
  } else if (query.park === 'demo') {
    const demo = GAME_MODULES.find((m) => m.id === 'demo-park');
    const factory = (
      demo as { buildWorld?: (seed: number, registry: Registry) => World } | undefined
    )?.buildWorld;
    world = factory
      ? factory(query.seed, registry)
      : createWorld({ seed: query.seed, packs: registry.packs().map((p) => p.id) });
  } else {
    world = createWorld({
      seed: query.seed,
      name: query.park === 'sandbox' ? 'Sandbox' : 'New park',
      packs: registry.packs().map((p) => p.id),
      cash: query.park === 'sandbox' ? 100_000_000_00 : 50_000_00,
    });
  }
  if (query.minute != null) world.clock.minute = query.minute;
  world.clock.speed = query.speed;
  if (query.weather) {
    const env = (world.modules.environment as Record<string, unknown> | undefined) ?? {};
    world.modules.environment = { ...env, weather: query.weather, forced: true };
  }

  // 4. engine — the one step that must not run twice on one canvas: a second WebGL context on the
  // same element is the first one, so an aborted boot must stop before this point.
  step('engine', 0.25);
  const render = await createRenderContext(canvas, caps, quality);
  if (opts.signal?.aborted) {
    render.dispose();
    throw new BootAbortedError();
  }
  store.set({ engine: render.kind });

  // 5. main modules
  step('modules', 0.4);
  const handles = new Map<string, MainHandle>();
  const failed: string[] = [];
  let seq = 0;
  const pending: Command[] = [];
  let worker: Worker | null = null;
  const post = (msg: MainToWorker, transfer?: ArrayBuffer[]) =>
    worker?.postMessage(msg, transfer ?? []);

  const dispatch = (type: string, payload: unknown): number => {
    const cmd: Command = { type, seq: ++seq, payload };
    if (worker) post({ type: 'command', cmd });
    else pending.push(cmd);
    // Core entity commands are mirrored immediately so tools see their own result without a
    // round trip; the worker's own event confirms it (idempotent).
    if (type === 'entity:add' || type === 'entity:update' || type === 'entity:remove') {
      mirrorEntityCommand(cmd);
    }
    return cmd.seq;
  };

  const rng = new Rng(world.meta.seed);
  const moduleIds = orderModules(GAME_MODULES, query.showcase);
  const ctxFor = (id: string): MainContext => ({
    world,
    events,
    registry,
    rng: rng.fork(id),
    quality,
    capabilities: caps,
    scene: render.scene,
    engine: render.engine,
    dispatch,
    module: <T>(other: string) => handles.get(other)?.api as T | undefined,
    assetsUrl: opts.assetsUrl ?? '/game/assets',
    query: query.raw,
    locale,
  });

  let i = 0;
  for (const id of moduleIds) {
    const def = GAME_MODULES.find((m) => m.id === id);
    i += 1;
    step(`module:${id}`, 0.4 + 0.35 * (i / moduleIds.length));
    if (!def?.main) continue;
    try {
      for (const kind of def.kinds ?? []) registry.registerKind(kind, def.id);
      handles.set(id, await def.main(ctxFor(id)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push(id);
      recordError(`main:${id}`, message);
      console.error(`[game] module "${id}" failed to start`, error);
      events.emit('module:failed', { id, where: 'main', error: message });
      handles.set(id, { dispose() {} });
    }
  }
  store.set({ failedModules: failed });

  // Entities the world already has (demo park, save) — announce them to the main handles.
  const announce = (change: EntityChange) => {
    for (const h of handles.values()) {
      try {
        h.onEntity?.(change);
      } catch (error) {
        recordError('onEntity', error instanceof Error ? error.message : String(error));
      }
    }
  };
  for (const id in world.entities) announce({ type: 'add', entity: world.entities[id] });

  function mirrorEntityCommand(cmd: Command): void {
    if (cmd.type === 'entity:add') {
      const entity = cmd.payload as Entity;
      world.entities[entity.id] = entity;
      announce({ type: 'add', entity });
    } else if (cmd.type === 'entity:update') {
      const entity = cmd.payload as Entity;
      const previous = world.entities[entity.id];
      if (!previous) return;
      world.entities[entity.id] = entity;
      announce({ type: 'update', entity, previous });
    } else if (cmd.type === 'entity:remove') {
      const { id } = cmd.payload as { id: string };
      const entity = world.entities[id];
      if (!entity) return;
      delete world.entities[id];
      announce({ type: 'remove', entity });
    }
  }

  // 6. showcase staging
  if (query.showcase) {
    const def = GAME_MODULES.find((m) => m.id === query.showcase);
    if (def?.showcase) {
      step(`showcase:${def.id}`, 0.8);
      try {
        await def.showcase(ctxFor(def.id));
      } catch (error) {
        recordError(`showcase:${def.id}`, error instanceof Error ? error.message : String(error));
        console.error('[game] showcase failed', error);
      }
    } else {
      store.notify('warning', `showcase:${query.showcase}:missing`, 'showcase');
    }
  }

  // 7. worker
  step('worker', 0.85);
  let frames: [SimFrame | null, SimFrame | null] = [null, null];
  let readyResolved = false;
  const snapshotWaiters = new Map<number, (json: string) => void>();
  let snapshotSeq = 0;

  const onWorkerMessage = (e: MessageEvent<WorkerToMain>) => {
    const msg = e.data;
    switch (msg.type) {
      case 'ready': {
        if (msg.failed.length) {
          store.set((s) => ({
            failedModules: Array.from(new Set([...s.failedModules, ...msg.failed])),
          }));
        }
        if (!readyResolved) {
          readyResolved = true;
          finishBoot('ready');
        }
        break;
      }
      case 'frame': {
        msg.frame.receivedAt = performance.now();
        frames = [frames[1], msg.frame];
        break;
      }
      case 'event': {
        if (msg.name === 'entity:add') {
          const entity = msg.payload as Entity;
          const existing = world.entities[entity.id];
          world.entities[entity.id] = entity;
          if (!existing) announce({ type: 'add', entity });
        } else if (msg.name === 'entity:update') {
          const { entity, previous } = msg.payload as { entity: Entity; previous: Entity };
          world.entities[entity.id] = entity;
          announce({ type: 'update', entity, previous });
        } else if (msg.name === 'entity:remove') {
          const entity = msg.payload as Entity;
          if (world.entities[entity.id]) {
            delete world.entities[entity.id];
            announce({ type: 'remove', entity });
          }
        } else if (msg.name === 'notify') {
          const n = msg.payload as {
            level: 'info' | 'warning' | 'error';
            text: string;
            key?: string;
          };
          store.notify(n.level, n.text, n.key);
        } else if (msg.name === 'finance:changed') {
          store.set({ cash: (msg.payload as { cash: number }).cash });
        }
        events.emit(msg.name, msg.payload);
        break;
      }
      case 'snapshot': {
        snapshotWaiters.get(msg.requestId)?.(msg.json);
        snapshotWaiters.delete(msg.requestId);
        break;
      }
      case 'error': {
        recordError(msg.where, msg.message);
        console.error(`[game/sim] ${msg.where}: ${msg.message}`);
        events.emit('sim:error', { where: msg.where, message: msg.message });
        break;
      }
    }
  };

  try {
    worker = new Worker(new URL('./sim.worker.ts', import.meta.url), {
      type: 'module',
      name: 'parkfan-sim',
    });
    worker.onmessage = onWorkerMessage;
    worker.onerror = (ev) => {
      recordError('worker', ev.message);
      console.error('[game] worker error', ev.message);
    };
    const init: MainToWorker = {
      type: 'init',
      world: cloneWorld(world),
      packs: [...registry.packs()],
      modules: moduleIds,
    };
    post(init);
    for (const cmd of pending) post({ type: 'command', cmd });
    pending.length = 0;
  } catch (error) {
    recordError('worker:create', error instanceof Error ? error.message : String(error));
    console.error('[game] could not start the simulation worker', error);
    worker = null;
  }

  const readyTimeout = window.setTimeout(() => {
    if (!readyResolved) {
      readyResolved = true;
      store.notify('warning', 'sim:timeout', 'sim');
      finishBoot('reduced');
    }
  }, 8000);

  // 8. render loop
  let lastEnvKey = -1;
  let env: EnvironmentState = computeEnvironment({
    minute: world.clock.minute,
    day: world.clock.day,
  });
  let lastRender = performance.now();
  let metricsAt = 0;
  const environmentApi = () =>
    handles.get('environment')?.api as
      { current?: (minute: number, day: number) => EnvironmentState } | undefined;

  const applyEnv = (minute: number, day: number, force = false) => {
    const key = Math.floor(minute * 4) + day * 5760;
    if (!force && key === lastEnvKey) return;
    lastEnvKey = key;
    const api = environmentApi();
    env = api?.current
      ? api.current(minute, day)
      : computeEnvironment({ minute, day, weather: query.weather ?? undefined });
    render.applyEnvironment(env);
    for (const h of handles.values()) {
      try {
        h.onEnvironment?.(env);
      } catch (error) {
        recordError('onEnvironment', error instanceof Error ? error.message : String(error));
      }
    }
    store.set({ environment: env });
    events.emit('env:changed', env);
  };
  applyEnv(world.clock.minute, world.clock.day, true);

  const renderFrame = () => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastRender) / 1000);
    lastRender = now;
    const [prev, cur] = frames;
    if (cur) {
      const alpha = Math.max(0, Math.min(1, (now - (cur.receivedAt ?? now)) / TICK_MS));
      world.clock.minute = cur.clock.minute;
      world.clock.day = cur.clock.day;
      world.clock.speed = cur.clock.speed;
      applyEnv(cur.clock.minute, cur.clock.day);
      for (const h of handles.values()) {
        try {
          h.onFrame?.(cur, prev, alpha);
        } catch (error) {
          recordError('onFrame', error instanceof Error ? error.message : String(error));
        }
      }
    }
    for (const h of handles.values()) {
      try {
        h.onRender?.(dt);
      } catch (error) {
        recordError('onRender', error instanceof Error ? error.message : String(error));
      }
    }
    render.scene.render();
    if (now - metricsAt > 500) {
      metricsAt = now;
      const m = render.metrics();
      store.set({
        metrics: {
          ...m,
          simTickMs: cur?.tickMs ?? 0,
          guests: cur?.stats['guests.count'] ?? 0,
        },
        clock: { ...world.clock },
        cash: cur?.stats['finance.cash'] ?? world.finance.cash,
      });
    }
  };
  render.engine.runRenderLoop(renderFrame);

  function finishBoot(phase: 'ready' | 'reduced') {
    window.clearTimeout(readyTimeout);
    store.set({ phase, bootStep: 'done', progress: 1 });
    events.emit('world:ready', { tick: frames[1]?.tick ?? 0 });
    harness.ready = true;
  }

  const handle: GameHandle = {
    store,
    events,
    registry,
    render,
    query,
    world,
    handles,
    dispatch,
    setSpeed(speed) {
      world.clock.speed = speed;
      store.setSpeed(speed);
      post({ type: 'speed', speed });
    },
    setTimeOfDay(minute, day) {
      world.clock.minute = minute;
      if (day != null) world.clock.day = day;
      dispatch('clock:set', { minute, day });
      applyEnv(minute, day ?? world.clock.day, true);
    },
    save() {
      return new Promise<string>((resolve, reject) => {
        if (!worker) {
          reject(new Error('simulation not running'));
          return;
        }
        const requestId = ++snapshotSeq;
        snapshotWaiters.set(requestId, resolve);
        post({ type: 'save', requestId });
        window.setTimeout(() => {
          if (snapshotWaiters.delete(requestId)) reject(new Error('save timed out'));
        }, 10000);
      });
    },
    load(json) {
      const next = deserializeWorld(json);
      for (const id in world.entities) announce({ type: 'remove', entity: world.entities[id] });
      (Object.keys(world.entities) as string[]).forEach((k) => delete world.entities[k]);
      Object.assign(world.meta, next.meta);
      Object.assign(world.clock, next.clock);
      world.terrain.heights.set(next.terrain.heights);
      world.terrain.paint.set(next.terrain.paint);
      world.terrain.waterLevel = next.terrain.waterLevel;
      Object.assign(world.finance, next.finance);
      world.modules = next.modules;
      world.log = next.log;
      for (const id in next.entities) {
        world.entities[id] = next.entities[id];
        announce({ type: 'add', entity: next.entities[id] });
      }
      events.emit('terrain:changed', { rect: null });
      post({ type: 'load', world: cloneWorld(world) });
      applyEnv(world.clock.minute, world.clock.day, true);
    },
    module: <T>(id: string) => handles.get(id)?.api as T | undefined,
    dispose() {
      window.clearTimeout(readyTimeout);
      harness.ready = false;
      const w = window as unknown as { __parkfan_game?: unknown };
      if (w.__parkfan_game === harness) delete w.__parkfan_game;
      try {
        post({ type: 'dispose' });
        worker?.terminate();
      } catch {
        /* already gone */
      }
      for (const h of handles.values()) {
        try {
          h.dispose();
        } catch (error) {
          console.error('[game] dispose failed', error);
        }
      }
      handles.clear();
      events.clear();
      render.dispose();
    },
  };

  // Harness API — read by scripts/game-shot.mjs. Also handy in DevTools.
  const harness = {
    ready: false,
    errors,
    handle,
    metrics: () => ({
      ...store.get().metrics,
      engine: render.kind,
      preset: caps.preset,
      clock: { ...world.clock },
      failedModules: store.get().failedModules,
      tick: frames[1]?.tick ?? 0,
    }),
    setTimeOfDay: (minute: number) => handle.setTimeOfDay(minute),
    setCamera: (preset: string) => {
      const cam = handles.get('camera')?.api as { preset?: (name: string) => boolean } | undefined;
      if (cam?.preset?.(preset)) return true;
      return applyFallbackCameraPreset(render, preset);
    },
    setSpeed: (speed: Speed) => handle.setSpeed(speed),
    step: (ticks: number) => post({ type: 'step', ticks }),
    save: () => handle.save(),
    load: (json: string) => handle.load(json),
    dispatch,
    /** Resolves when the next frame has rendered (after shaders compiled). */
    nextFrame: () =>
      new Promise<void>((resolve) => {
        render.scene.onAfterRenderObservable.addOnce(() => resolve());
      }),
    world: () => world,
  };
  (window as unknown as { __parkfan_game: typeof harness }).__parkfan_game = harness;

  if (query.camera) harness.setCamera(query.camera);

  return handle;
}

/** Dependency order over the module list; a showcase restricts it to the module and its deps. */
export function orderModules(modules: readonly GameModule[], showcase: string | null): string[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const wanted = new Set<string>();
  const add = (id: string) => {
    if (wanted.has(id)) return;
    const m = byId.get(id);
    if (!m) return;
    for (const d of m.deps ?? []) add(d);
    wanted.add(id);
  };
  if (showcase) {
    add('core');
    add('terrain');
    add('environment');
    add('ui');
    add('camera');
    add(showcase);
  } else {
    for (const m of modules) add(m.id);
  }
  return Array.from(wanted);
}

const FALLBACK_PRESETS: Record<
  string,
  { alpha: number; beta: number; radius: number; target: [number, number, number] }
> = {
  overview: { alpha: -Math.PI / 3, beta: Math.PI / 3.4, radius: 260, target: [0, 0, 0] },
  entrance: { alpha: Math.PI / 2, beta: Math.PI / 2.6, radius: 90, target: [0, 2, 170] },
  close: { alpha: -Math.PI / 4, beta: Math.PI / 2.4, radius: 40, target: [0, 2, 0] },
  coaster: { alpha: -Math.PI / 2.5, beta: Math.PI / 3, radius: 140, target: [-90, 10, -40] },
  pool: { alpha: Math.PI / 5, beta: Math.PI / 3, radius: 110, target: [110, 0, 60] },
  night: { alpha: -Math.PI / 3, beta: Math.PI / 3.4, radius: 220, target: [0, 0, 0] },
  ground: { alpha: Math.PI / 2, beta: Math.PI / 2.05, radius: 12, target: [0, 1.7, 120] },
};

function applyFallbackCameraPreset(render: RenderContext, name: string): boolean {
  const p = FALLBACK_PRESETS[name];
  if (!p) return false;
  render.camera.alpha = p.alpha;
  render.camera.beta = p.beta;
  render.camera.radius = p.radius;
  render.camera.target.set(p.target[0], p.target[1], p.target[2]);
  return true;
}
