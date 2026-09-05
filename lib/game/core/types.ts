/**
 * The shared contract every game module is built against. See docs/game/ARCHITECTURE.md.
 *
 * This file is import-safe on every thread (main, worker, node): it must never import Babylon or
 * touch `window`, `document`, `navigator`.
 */

import type { EventBus } from './events';
import type { Rng } from './rng';
import type { Registry } from './registry';

// ── Units ───────────────────────────────────────────────────────────────────────────────────
/** Metres, +Y up, right-handed. */
export type Vec3 = [number, number, number];
/** Whole cents. Never a float. */
export type Cents = number;
/** Minutes since midnight, park local. */
export type ParkMinute = number;

export type EntityId = string;
/** Open string union; modules register the kinds they own through the registry. */
export type EntityKind = string;

export type Speed = 0 | 1 | 2 | 3 | 5 | 100;
export const SPEEDS: readonly Speed[] = [0, 1, 2, 3, 5, 100];
/** Fixed simulation step. */
export const TICK_HZ = 20;
export const TICK_MS = 1000 / TICK_HZ;
/** At speed 1, one real second is one park minute. */
export const MINUTES_PER_TICK_AT_SPEED_1 = 1 / TICK_HZ;

// ── World model ─────────────────────────────────────────────────────────────────────────────
export interface WorldMeta {
  version: 1;
  seed: number;
  name: string;
  createdAt: number;
  /** Pack ids this world depends on, in registration order. */
  packs: string[];
}

export interface Clock {
  day: number;
  minute: ParkMinute;
  speed: Speed;
}

export interface TerrainData {
  /** Side length in metres, the park is a square centred on the origin. */
  size: number;
  /** Cells per side; there are `resolution + 1` height samples per side. */
  resolution: number;
  heights: Float32Array;
  /** Paint layer index per cell (`resolution` × `resolution`). */
  paint: Uint8Array;
  waterLevel: number;
}

export interface Entity {
  id: EntityId;
  kind: EntityKind;
  /** Pack id and item id, `core-classic` / `carousel`. */
  pack: string;
  item: string;
  position: Vec3;
  /** Radians about +Y, counter-clockwise from above. */
  yaw: number;
  scale?: number;
  /** Kind-specific, JSON-serialisable, owned by the module that registered the kind. */
  data?: Record<string, unknown>;
}

export interface DayLedger {
  day: number;
  income: Cents;
  expenses: Cents;
  guests: number;
  rating: number;
}

export interface Finance {
  cash: Cents;
  loan: Cents;
  history: DayLedger[];
}

export interface World {
  meta: WorldMeta;
  clock: Clock;
  terrain: TerrainData;
  entities: Record<EntityId, Entity>;
  finance: Finance;
  /** Module-owned state, keyed by module id. Must be JSON-serialisable. */
  modules: Record<string, unknown>;
  /** Command tail since the last checkpoint. */
  log: Command[];
}

// ── Commands ────────────────────────────────────────────────────────────────────────────────
/**
 * Every mutation of the world is a command: created on the main thread by a tool, applied by the
 * worker in tick order, logged in `world.log`. `type` is namespaced by module (`terrain:sculpt`,
 * `entity:add`, `management:price`).
 */
export interface Command {
  type: string;
  /** Monotonic id assigned by the main thread; the worker acknowledges it in the next frame. */
  seq: number;
  payload: unknown;
}

export type EntityChange =
  | { type: 'add'; entity: Entity }
  | { type: 'update'; entity: Entity; previous: Entity }
  | { type: 'remove'; entity: Entity };

// ── Environment ─────────────────────────────────────────────────────────────────────────────
export type WeatherKind = 'clear' | 'cloudy' | 'overcast' | 'rain' | 'storm';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface EnvironmentState {
  minute: ParkMinute;
  day: number;
  season: Season;
  weather: WeatherKind;
  /** 0..1, how wet surfaces are. */
  wetness: number;
  /** 0..1, cloud cover. */
  cloud: number;
  temperatureC: number;
  /** Sun direction (unit, pointing FROM the sun towards the world) and elevation in radians. */
  sunDirection: Vec3;
  sunElevation: number;
  /** Sun colour as linear RGB 0..1 and intensity scalar. */
  sunColor: Vec3;
  sunIntensity: number;
  /** Ambient/sky colour and intensity. */
  skyColor: Vec3;
  ambientIntensity: number;
  /** 0..1, 1 at midnight. Drives night light rigs. */
  night: number;
  /**
   * 0..1, how hard the weather is doing whatever it does — a shower against a downpour.
   *
   * These three arrived on request from the `environment` module, which produced all of them and
   * had to expose them on its own `api` instead, so every consumer had to reach for
   * `ctx.module('environment')` rather than read the state core already hands it.
   */
  intensity: number;
  /** Metres per second. Flags, foliage and particles read it. */
  windMs: number;
  /**
   * What is falling, if anything.
   *
   * Deliberately not a sixth `WeatherKind`: snow is rain below about 1.5 °C, and that is how it
   * behaves for a guest too — the decision to go home is about getting wet, not about the crystal.
   */
  precipitation: 'none' | 'rain' | 'snow';
}

// ── Frames ──────────────────────────────────────────────────────────────────────────────────
/**
 * A frame is what the worker sends after a tick. Buffers are transferable and owned by one
 * module each (see protocol.ts). `ack` is the highest command seq applied.
 */
export interface SimFrame {
  tick: number;
  clock: Clock;
  ack: number;
  /** Worker-side cost of the tick, ms. */
  tickMs: number;
  buffers: Record<string, ArrayBuffer>;
  /** Small per-frame scalars, module namespaced (`guests.count`, `finance.cash`). */
  stats: Record<string, number>;
  /** Wall-clock ms on the receiving side, set by the main thread. */
  receivedAt?: number;
}

export interface SimFrameWriter {
  /** Claim a Float32 buffer of `length` elements under `name`; returns a view to fill. */
  f32(name: string, length: number): Float32Array;
  u8(name: string, length: number): Uint8Array;
  u16(name: string, length: number): Uint16Array;
  stat(name: string, value: number): void;
}

// ── Modules ─────────────────────────────────────────────────────────────────────────────────
export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface Capabilities {
  webgpu: boolean;
  webgl2: boolean;
  mobile: boolean;
  reducedMotion: boolean;
  cores: number;
  dpr: number;
  preset: QualityPreset;
  /** Why a preset below `high` was chosen, for the HUD notice. */
  notice?: string;
}

export interface QualitySettings {
  preset: QualityPreset;
  hardwareScaling: number;
  shadowMapSize: number;
  shadowCascades: number;
  softShadows: boolean;
  bloom: boolean;
  ssao: boolean;
  fxaa: boolean;
  reflections: 'none' | 'planar' | 'ssr';
  particleScale: number;
  foliageDensity: number;
  guestLodDistances: [number, number, number];
  maxGuestsDrawn: number;
}

/** What `main()` of a module receives. Babylon objects are typed loosely here so this file stays Babylon-free; the host casts. */
export interface MainContext {
  world: Readonly<World>;
  events: EventBus<GameEvents>;
  registry: Registry;
  rng: Rng;
  quality: QualitySettings;
  capabilities: Capabilities;
  /** `import('@babylonjs/core/scene').Scene` */
  scene: unknown;
  /** `import('@babylonjs/core/Engines/abstractEngine').AbstractEngine` */
  engine: unknown;
  /**
   * The renderer's own objects, handed over rather than looked up.
   *
   * The `environment` module was finding all four by name — `scene.getLightByName('sun')`,
   * `…('sky')`, `sun.getShadowGenerator()`, and the pipeline by `p.name === 'default'` — which is a
   * contract written in string literals that nothing enforces. Renaming the light in
   * `core/renderer.ts` would have left the sky drawn and the scene lit by whatever the renderer
   * last wrote, with no error anywhere. Passing them makes that a compile error.
   *
   * Typed loosely for the same reason `scene` and `engine` are: this file is imported on the
   * worker and in node, and must stay Babylon-free. The host casts.
   */
  lights: {
    /** `DirectionalLight` — the sun. */
    sun: unknown;
    /** `HemisphericLight` — the sky term. */
    hemi: unknown;
    /** `CascadedShadowGenerator | null` — null below the preset that affords one. */
    shadow: unknown;
    /** `DefaultRenderingPipeline | null` — null when it failed to build. */
    pipeline: unknown;
  };
  /** Post a command to the worker (and log it). */
  dispatch(type: string, payload: unknown): number;
  /** Read another module's main handle (may be a stub if it failed). */
  module<T = unknown>(id: string): T | undefined;
  /** Root URL for fetched assets, `/game/assets`. */
  assetsUrl: string;
  /** The URL query the page was opened with (`showcase`, `seed`, `tod`, `cam`…). */
  query: URLSearchParams;
  /** Locale for names, `en` | `de` | … */
  locale: string;
}

export interface MainHandle {
  onFrame?(frame: SimFrame, previous: SimFrame | null, alpha: number): void;
  onEntity?(change: EntityChange): void;
  onEnvironment?(env: EnvironmentState): void;
  /** Called at most once per render frame with the real delta in seconds. */
  onRender?(dtSeconds: number): void;
  /** Expose an API to other modules and the HUD. */
  api?: unknown;
  dispose(): void;
}

export interface SimContext {
  world: World;
  events: EventBus<GameEvents>;
  registry: Registry;
  rng: Rng;
  /** Read another module's sim handle. */
  module<T = unknown>(id: string): T | undefined;
  /** Environment for the current minute (from the environment module or a fallback). */
  environment(): EnvironmentState;
}

export interface SimHandle {
  /** Advance by `dtMinutes` park minutes. Must stay under the 6 ms budget across all modules. */
  tick(dtMinutes: number): void;
  /** Return true when handled. */
  command?(cmd: Command): boolean;
  /** Write this module's transferable buffers for the frame. */
  fill?(writer: SimFrameWriter): void;
  /** Expose an API to other sim modules. */
  api?: unknown;
  /** Return this module's persistent state for `world.modules[id]` before a save. */
  serialize?(): unknown;
  /** Called after `deserialize` of the world and after `init`; rebuild derived state. */
  rebuild?(): void;
  dispose?(): void;
}

export interface GameModule {
  id: string;
  deps?: string[];
  kinds?: EntityKind[];
  main?: (ctx: MainContext) => MainHandle | Promise<MainHandle>;
  sim?: (ctx: SimContext) => SimHandle;
  /** `/game?showcase=<id>`: stage a representative scene of this module alone. */
  showcase?: (ctx: MainContext) => Promise<void> | void;
}

// ── Events ──────────────────────────────────────────────────────────────────────────────────
/** Core's events; modules extend this map by declaration merging in their own `events.d.ts`. */
export interface GameEvents {
  'world:ready': { tick: number };
  'module:failed': { id: string; where: 'main' | 'sim'; error: string };
  'clock:tick': Clock;
  'clock:day': { day: number };
  'entity:add': Entity;
  'entity:update': { entity: Entity; previous: Entity };
  'entity:remove': Entity;
  'env:changed': EnvironmentState;
  'finance:changed': Finance;
  notify: { level: 'info' | 'warning' | 'error'; text: string; key?: string };
  'sim:error': { where: string; message: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [custom: string]: any;
}
