/**
 * The module host, and the failure isolation that is the whole reason it exists.
 *
 * A module's `setup()` throwing must not take the page down. It logs, emits `module:failed`,
 * registers a **stub** whose every declared method is a typed no-op, and the rest of the game
 * boots — with a visible, dismissible notice, because a silently degraded park is a bug report
 * nobody files.
 *
 * `world:ready` still fires in the degraded case (see DECISIONS.md D-014). If it only fired on a
 * perfect boot, every screenshot of a broken state would be a harness timeout instead of a picture
 * of the bug.
 */

import type { EventBus } from './events';
import type { Logger } from './log';
import type { Command } from './protocol';
import type { RngStream } from './rng';
import type { WorldView } from './world';

export const MODULE_IDS = [
  'core',
  'terrain',
  'environment',
  'ui',
  'audio',
  'effects',
  'paths',
  'pools',
  'track',
  'buildings',
  'scenery',
  'shops',
  'rides',
  'flumes',
  'trains',
  'guests',
  'staff',
  'management',
  'overlays',
  'tools',
  'camera',
  'scenarios',
  'persistence',
  'demo-park',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export type QualityTier = 'ultra' | 'high' | 'medium' | 'low' | 'potato';

export interface QualityPreset {
  tier: QualityTier;
  shadowCascades: number;
  shadowMapSize: number;
  ssao: boolean;
  bloom: boolean;
  /** 0 = none, 1 = reflection probe, 2 = + refraction, 3 = + caustics + Gerstner waves. */
  waterTier: 0 | 1 | 2 | 3;
  maxGuestsDrawn: number;
  particleScale: number;
  /** Metres. Beyond this, scenery is culled entirely rather than LOD'd. */
  sceneryDrawDistance: number;
  msaaSamples: number;
  textureScale: 1 | 0.5 | 0.25;
  fxaa: boolean;
}

export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  ultra: {
    tier: 'ultra',
    shadowCascades: 4,
    shadowMapSize: 2048,
    ssao: true,
    bloom: true,
    waterTier: 3,
    maxGuestsDrawn: 4000,
    particleScale: 1,
    sceneryDrawDistance: 500,
    msaaSamples: 4,
    textureScale: 1,
    fxaa: false,
  },
  high: {
    tier: 'high',
    shadowCascades: 4,
    shadowMapSize: 2048,
    ssao: true,
    bloom: true,
    waterTier: 2,
    maxGuestsDrawn: 3000,
    particleScale: 1,
    sceneryDrawDistance: 400,
    msaaSamples: 2,
    textureScale: 1,
    fxaa: true,
  },
  medium: {
    tier: 'medium',
    shadowCascades: 3,
    shadowMapSize: 1024,
    ssao: false,
    bloom: true,
    waterTier: 1,
    maxGuestsDrawn: 2000,
    particleScale: 0.6,
    sceneryDrawDistance: 280,
    msaaSamples: 1,
    textureScale: 1,
    fxaa: true,
  },
  low: {
    tier: 'low',
    shadowCascades: 2,
    shadowMapSize: 1024,
    ssao: false,
    bloom: false,
    waterTier: 0,
    maxGuestsDrawn: 900,
    particleScale: 0.3,
    sceneryDrawDistance: 180,
    msaaSamples: 1,
    textureScale: 0.5,
    fxaa: true,
  },
  potato: {
    tier: 'potato',
    shadowCascades: 0,
    shadowMapSize: 512,
    ssao: false,
    bloom: false,
    waterTier: 0,
    maxGuestsDrawn: 350,
    particleScale: 0,
    sceneryDrawDistance: 110,
    msaaSamples: 1,
    textureScale: 0.25,
    fxaa: false,
  },
};

export interface GpuCapabilities {
  webgpu: boolean;
  /** WebGL2 when not WebGPU; a false here means the route shows its honest fallback page. */
  webgl2: boolean;
  maxTextureSize: number;
  maxSamples: number;
  floatLinearFiltering: boolean;
  instancedArrays: boolean;
  drawBuffers: boolean;
  /** From `navigator.deviceMemory`, GB. 0 when the browser does not say. */
  deviceMemoryGb: number;
  hardwareConcurrency: number;
  /** Coarse pointer + narrow viewport. Drives the reduced preset and the honest warning. */
  mobile: boolean;
  rendererName: string;
}

/** What a module can reach. There is no other door. */
export interface ModuleContext {
  readonly scene: import('@babylonjs/core/scene').Scene;
  readonly engine: import('@babylonjs/core/Engines/abstractEngine').AbstractEngine;
  readonly quality: QualityPreset;
  readonly caps: GpuCapabilities;
  readonly bus: EventBus;
  /** Read-only. Mutation is `send()` and nothing else. */
  readonly world: () => WorldView | null;
  readonly send: (command: Command) => void;
  readonly registry: import('./registry').ContentRegistry;
  readonly assets: AssetService;
  /** Presentation-only randomness. Its values never reach the simulation. */
  readonly rng: RngStream;
  readonly log: Logger;
  /** A dependency's API — or its stub, if that dependency failed. Never throws. */
  readonly module: <T>(id: ModuleId) => T;
  readonly locale: string;
  readonly t: (key: string, fallback?: string) => string;
}

export interface AssetService {
  /** A glTF container, cached by url. Rejects only if the caller wants to know; see `tryMesh`. */
  container(url: string): Promise<import('@babylonjs/core/assetContainer').AssetContainer>;
  /** The forgiving form: `null` on any failure, with an `asset:fallback` event already emitted. */
  tryContainer(url: string): Promise<import('@babylonjs/core/assetContainer').AssetContainer | null>;
  texture(url: string): Promise<import('@babylonjs/core/Materials/Textures/texture').Texture | null>;
  environment(url: string): Promise<import('@babylonjs/core/Materials/Textures/baseTexture').BaseTexture | null>;
  /** True when the asset folder is present at all. False = every consumer runs procedural. */
  readonly available: boolean;
  dispose(): void;
}

export interface RenderFrame {
  /** Seconds since the previous rendered frame. */
  dt: number;
  /** 0–1 between the two newest snapshots. Everything positional interpolates on this. */
  alpha: number;
  tick: number;
  /** Wall-clock ms since boot. Presentation only — never reaches the sim. */
  elapsedMs: number;
}

export interface GameModule<TApi extends object = object> {
  readonly id: ModuleId;
  readonly dependsOn?: readonly ModuleId[];
  setup(ctx: ModuleContext): TApi | Promise<TApi>;
  render?(frame: RenderFrame): void;
  dispose?(): void;
}

export interface MountedModule {
  id: ModuleId;
  api: object;
  stubbed: boolean;
  error?: string;
  render?: (frame: RenderFrame) => void;
  dispose?: () => void;
}

/**
 * Build a stub from a shape description.
 *
 * A `Proxy` would be shorter and is wrong here: a caller that destructures
 * (`const { place } = ctx.module('scenery')`) gets `undefined` from a get-trap that returns
 * functions lazily only if the trap is hit at destructure time — which it is, but the shape is
 * then invisible to anything that iterates keys, including the debug overlay that lists what a
 * failed module still answers. An explicit key list is what the module declares and what the stub
 * honours.
 */
export function makeStub<T extends object>(keys: readonly (keyof T)[], log: Logger, id: string): T {
  const stub = {} as Record<string, unknown>;
  for (const key of keys) {
    stub[String(key)] = (...args: unknown[]) => {
      log.debug(`stub ${id}.${String(key)}() called`, args.length ? args : undefined);
      return undefined;
    };
  }
  return stub as T;
}

export interface ModuleHost {
  mount(module: GameModule<never>, stubKeys?: readonly string[]): Promise<MountedModule>;
  get<T>(id: ModuleId): T;
  has(id: ModuleId): boolean;
  stubbed(): readonly ModuleId[];
  render(frame: RenderFrame): void;
  dispose(): void;
}

export function createModuleHost(
  makeContext: (id: ModuleId) => ModuleContext,
  bus: EventBus,
  log: Logger
): ModuleHost {
  const mounted = new Map<ModuleId, MountedModule>();
  /** Mount order, so `dispose()` can tear down in reverse and a module's dependencies outlive it. */
  const order: ModuleId[] = [];

  return {
    async mount(module, stubKeys = []) {
      const ctx = makeContext(module.id);
      let entry: MountedModule;
      try {
        for (const dependency of module.dependsOn ?? []) {
          if (!mounted.has(dependency)) {
            // Not fatal: the dependency may itself be a stub the host registered earlier, and a
            // module that copes with a stub dependency is exactly what the contract asks for.
            log.warn(`${module.id} mounted before ${dependency}`);
          }
        }
        const api = await module.setup(ctx);
        entry = {
          id: module.id,
          api: api as object,
          stubbed: false,
          render: module.render?.bind(module),
          dispose: module.dispose?.bind(module),
        };
        log.debug(`module ${module.id} ready`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.error(`module ${module.id} failed — running as a stub`, error);
        entry = {
          id: module.id,
          api: makeStub(stubKeys as readonly never[], log, module.id),
          stubbed: true,
          error: message,
        };
        bus.emit('module:failed', { id: module.id, error: message });
        bus.emit('ui:notify', {
          level: 'error',
          title: `Modul „${module.id}" konnte nicht geladen werden`,
          body: message,
        });
      }
      mounted.set(module.id, entry);
      order.push(module.id);
      return entry;
    },
    get<T>(id: ModuleId): T {
      const entry = mounted.get(id);
      if (!entry) {
        // Asking for a module that never mounted is a programming error, but throwing here would
        // take a frame down for a missing optional dependency. An empty stub keeps the contract.
        log.warn(`module ${id} requested before it mounted`);
        return {} as T;
      }
      return entry.api as T;
    },
    has(id) {
      return mounted.has(id);
    },
    stubbed() {
      return [...mounted.values()].filter((m) => m.stubbed).map((m) => m.id);
    },
    render(frame) {
      for (const id of order) {
        const entry = mounted.get(id);
        if (!entry?.render) continue;
        try {
          entry.render(frame);
        } catch (error) {
          // A module that throws in render is muted rather than allowed to kill the loop: a
          // stuttering park is recoverable, a dead render loop is a white screen.
          log.error(`module ${id} threw in render — muted for the session`, error);
          entry.render = undefined;
        }
      }
    },
    dispose() {
      for (let i = order.length - 1; i >= 0; i--) {
        const entry = mounted.get(order[i]!);
        try {
          entry?.dispose?.();
        } catch (error) {
          log.error(`module ${order[i]} threw in dispose`, error);
        }
      }
      mounted.clear();
      order.length = 0;
    },
  };
}
