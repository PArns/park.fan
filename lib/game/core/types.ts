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

/**
 * The speeds a player may select. **The top one is 10 and it used to be 100.**
 *
 * Not a UI decision — a simulation one, and it bought something. `trains` advanced the train a
 * constant 0.05 ride-seconds a tick whatever the clock said, so the machine's dispatches and the
 * number of people its queue boarded came off two different clocks: over a park day at speed 20
 * the coaster's line boarded **1,507 riders while the train dispatched twice**. Putting the train
 * on the park clock fixes that (2 dispatches → 229 over the same day) and costs sub-steps, and
 * the bill is a cliff rather than a slope — mean ms per tick against a 6 ms budget: **5× → 1.37,
 * 10× → 2.69, 12× → 4.58, 15× → 5.91, 20× → 9.03, 100× → 192.99**.
 *
 * So the ladder stops where the simulation can still be honest. Ten is twice the old usable
 * fast-forward (the rung below the jump was 5) with 2.2x of headroom left, and a fourteen-hour
 * park day runs in about four real minutes instead of twenty-five seconds. That is the trade,
 * stated: a coaster whose riders are the people actually on it, against a button that skipped a
 * day in the time it takes to read this sentence.
 *
 * 100 survives as a HARNESS speed — `game-soak.mjs` still stresses there — and `trains` clamps
 * its own step to this ladder's top so that run costs what it always did.
 */
export type Speed = 0 | 1 | 2 | 3 | 5 | 10;
export const SPEEDS: readonly Speed[] = [0, 1, 2, 3, 5, 10];
/** The fastest a player can drive the park. Read by `trains` to bound its integration step. */
export const MAX_PLAYER_SPEED = 10;
/** Fixed simulation step. Unchanged by D-006 and not negotiable: the sim is 20 Hz. */
export const TICK_HZ = 20;
export const TICK_MS = 1000 / TICK_HZ;

/**
 * Park minutes one tick advances the clock at speed 1 (D-006).
 *
 * **Deliberately no longer `1 / TICK_HZ`.** The tick rate and the pace of the park day were one
 * number, so the only way to give a visitor time to cross the park was to change how often the
 * world thinks — which is an architectural constant. They are two questions and are now two
 * constants: 20 Hz is how smooth the simulation is, this is how fast the day goes.
 *
 * It was `1 / 20`, i.e. one park minute per real second and a park day in 14 real minutes. Measured
 * on the demo park at that rate, the four flat rides stand about **190 m** from the main street the
 * crowd walks, which at the old pace was a **152-minute walk against a median stay of 330 park
 * minutes** — one round trip to the fairground was the whole visit. The park delivered 291 rides a
 * day across machines rated for 2,136 an hour, at 5–14 % utilisation.
 *
 * `1 / 60` makes a park day 42 real minutes at speed 1. The archetype speeds in
 * `guests/manifest.ts` are tripled to match, so a guest still covers **2.0 m per real second on
 * screen** — the change is in how much park day fits around the walk, not in how fast anybody
 * moves. Nothing about the frame changes.
 *
 * **Anything converting between ticks and park minutes must read this constant** rather than
 * dividing by 20. Two harness scripts did exactly that (`game-soak.mjs`, `game-day-budget.mjs`) and
 * would have reported a day three times too long while the sim ran a third as far.
 */
export const MINUTES_PER_TICK_AT_SPEED_1 = 1 / 60;

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
  /**
   * Entity kinds somebody may QUEUE FOR, and whose vehicles this module dispatches.
   *
   * Separate from `kinds` because the two answer different questions and the answers differ: a
   * `coaster` is OWNED by `track` — which builds and stores the layout — and DISPATCHED by
   * `trains`, which is the half that knows a train is standing on the platform with seats in it.
   * Declaring it here is what lets `rides` run a line in front of a machine it has never heard
   * of, and what lets `guests` build a venue out of one, without either of them growing a list of
   * kinds. See `Dock` for what a module that declares this has to answer.
   */
  queueable?: EntityKind[];
  main?: (ctx: MainContext) => MainHandle | Promise<MainHandle>;
  sim?: (ctx: SimContext) => SimHandle;
  /** `/game?showcase=<id>`: stage a representative scene of this module alone. */
  showcase?: (ctx: MainContext) => Promise<void> | void;
}

// ── Queueing for a machine ──────────────────────────────────────────────────────────────────
/**
 * The head of a line: where people wait, how many the next vehicle takes, and how long it keeps
 * them.
 *
 * One structure for every machine a guest can queue for, so the queue itself is written once. A
 * flat ride answers it out of its own manifest, a coaster out of its fleet and block plan, a flume
 * out of its dispatch interval — and `rides` runs the same line in front of all three.
 *
 * **Every duration here is in PARK MINUTES, and that is a decision rather than a unit.** A
 * machine's own animation runs on a fixed ride clock (`RIDE_SECONDS_PER_TICK` in `trains`,
 * `SLIDE_SECONDS_PER_TICK` in `flumes`) that is deliberately real time, while the park clock is
 * compressed — twenty park minutes to the real minute at speed 1, four hundred at speed 20. A
 * queue driven off the animation would therefore board once per park day at the speed the
 * day-budget harness runs at, and the rate would change with a setting in the speed menu. So the
 * dispatcher converts: `cycleMinutes` is the machine's own interval read as real time and
 * expressed in park minutes, which is the number an operator would quote and the only one a
 * throughput figure can be built on. `rides/sim.ts` already draws exactly this line for a flat
 * ride — its cycle is park minutes and its `spin` is ride seconds — and this extends it.
 */
export interface Dock {
  /** World metres a guest walks to in order to join the line. */
  x: number;
  z: number;
  /** Unit vector the line runs BACK along from that point, away from the machine. */
  dirX: number;
  dirZ: number;
  /** Riders one vehicle-load holds — the batch the line drains in. */
  capacity: number;
  /** Park minutes between departures with the machine running flat out. */
  cycleMinutes: number;
  /** Park minutes a rider is aboard, from the doors closing to getting off again. */
  rideMinutes: number;
  /** False while the machine can take nobody at all: no fleet, no station, pumps off, mid-build. */
  running: boolean;
  /**
   * Where a rider is standing once they are off, when the machine knows.
   *
   * Optional, because most machines do not know and the honest default is derivable: a flat ride
   * lets people out where they got on. A station does not -- a coaster unloads at the far end of
   * the platform onto its own path, which is why a real queue and a real exit never cross. A
   * module that owns a platform can say so here; one that does not leaves it out and `rides`
   * puts the exit clear of its own queue rather than guessing at geometry it cannot see.
   *
   * Until this existed a rider simply went idle WHERE THEY HAD QUEUED, so everybody who had ever
   * ridden was standing at the head of the line they had just left.
   */
  exitX?: number;
  exitZ?: number;
  /**
   * What the machine is worth to a visitor, 0..10, when its own module can say.
   *
   * Same reason as `exitX`: the dispatcher knows things `rides` cannot see. A coaster's numbers
   * come from the layout it actually runs — `track/rating.ts` marches the physics and reads speed,
   * drop, airtime and every g-force off it — whereas `rides` could only fall back on a manifest
   * constant. It did, and the constant was **6 for every coaster in the game**, so a 979 m hyper
   * and a 345 m family twister were the same attraction to the simulation and building a better
   * ride changed nothing about who came.
   *
   * Absent means "I have no opinion", and the manifest's own numbers stand.
   */
  excitement?: number;
  intensity?: number;
  nausea?: number;
}

/**
 * What a module that declares a `queueable` kind answers about its machines.
 *
 * Two verbs. `dock` is read every tick — the fleet size, the pumps and the block plan all move —
 * and `seat` is how the load that just boarded gets back to the module that owns the vehicle, so
 * a train knows how many people are in it. `seat` answers how many were actually taken.
 */
export interface DispatchApi {
  /** Entity ids this module dispatches vehicles for. */
  docks(): string[];
  /** One machine's line-head, or null when this module does not run that entity (yet). */
  dock(id: string): Dock | null;
  /** `n` riders just boarded. Answers how many the vehicle actually took. */
  seat(id: string, n: number): number;
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
  notify: {
    level: 'info' | 'warning' | 'error';
    /** A translation key (`notice.<text>`), not a sentence — the sim has no locale. */
    text: string;
    params?: Record<string, string | number>;
    key?: string;
  };
  /**
   * Withdraw a notice by its dedup key, from wherever the condition it described has ended.
   *
   * The general rule this exists for: **a notice that describes a CONDITION names the event that
   * ends it, and the module that raised it is the one that knows.** Without this, `rides` could
   * announce a breakdown and had no way to say it was over — so "Top spin has broken down" stood on
   * screen for an hour and a half of park time after the machine was running again, next to a panel
   * reading 4 of 4. The HUD cannot fix that on its own: it would have to know which event ends which
   * notice, which is exactly the knowledge that belongs in the module.
   */
  'notice:withdraw': { key: string };
  'sim:error': { where: string; message: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [custom: string]: any;
}
