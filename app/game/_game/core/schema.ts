/**
 * The serializable world model.
 *
 * One plain object. No class instances, no `Map`, no `Set`, no functions, no `undefined` in a
 * persisted position — everything here survives `structuredClone` and a stable JSON encode, which
 * is what the save round-trip and the worker boundary both need.
 *
 * Adding a field is cheap; adding a field that is *derived* is not. Anything computable from other
 * fields belongs in `stats` (recomputed, never loaded) rather than here, or the save format grows
 * two copies of one truth and they drift.
 */

import type { EntityId } from './ids';
import type { RngState } from './rng';
import type { Cents } from './units';

/** Bumped whenever the shape changes. `migrate()` walks a save forward one version at a time. */
export const SAVE_VERSION = 1;

/** Bumped when a content-pack field changes meaning. Packs declare the range they support. */
export const ENGINE_CONTENT_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// terrain
// ---------------------------------------------------------------------------

/** Paint layers, in blend order. A cell stores a weight per layer. */
export const TERRAIN_LAYERS = ['grass', 'dirt', 'sand', 'rock', 'concrete', 'wood'] as const;
export type TerrainLayer = (typeof TERRAIN_LAYERS)[number];

export interface TerrainState {
  /** Cells per side. The world is `size * TERRAIN_CELL_M` metres square. */
  size: number;
  /** Height in metres, row-major, `(size + 1)^2` samples — corners, not centres. */
  heights: number[];
  /** One byte of weight per layer per cell, layer-major: `layer * size * size + z * size + x`. */
  paint: number[];
  /** Global water table height in metres. Anything below it is submerged. */
  waterLevel: number;
  /** Cells the player has bought. Bitfield packed into numbers, 32 cells per entry. */
  owned: number[];
}

// ---------------------------------------------------------------------------
// components
// ---------------------------------------------------------------------------

export interface TransformComponent {
  x: number;
  y: number;
  z: number;
  /** Yaw in radians. Pitch and roll are not stored: nothing placeable tilts. */
  rotY: number;
}

export type RideKind = 'coaster' | 'flat' | 'flume' | 'transport';
export type RideStatus = 'closed' | 'testing' | 'open' | 'broken' | 'building';

export interface RideComponent {
  defId: string;
  kind: RideKind;
  status: RideStatus;
  /** Ticket price in cents. 0 = free (the park may charge at the gate instead). */
  price: Cents;
  /** 0–10, one decimal, computed by `trains` for coasters and read from the manifest for flats. */
  excitement: number;
  fear: number;
  nausea: number;
  /** Guests per hour the layout can actually move, from capacity and cycle time. */
  throughput: number;
  /** 0–1. Falls with age and use, raised by a mechanic. Below `breakdownAt` it can break. */
  reliability: number;
  ticksSinceInspection: number;
  totalRiders: number;
  queue: EntityId[];
  /** Set while `status === 'broken'`; the mechanic that has claimed the job. */
  assignedMechanic: EntityId;
}

export interface TrackComponent {
  /** Control points in ride order. Repeats are meaningful — never dedupe or sort. */
  nodes: TrackNode[];
  closed: boolean;
  lengthM: number;
  /** Indices into `nodes` where a block section begins. */
  blocks: number[];
  trainCount: number;
  carsPerTrain: number;
}

export interface TrackNode {
  x: number;
  y: number;
  z: number;
  /** Bank angle, radians, positive = right-hand-down. */
  bank: number;
  /** Segment role from this node to the next. */
  role: 'plain' | 'station' | 'lift' | 'launch' | 'brake' | 'blockBrake' | 'transfer';
  /** Metres per second the powered roles drive at. Ignored for `plain`. */
  driveSpeed: number;
}

export interface TrainComponent {
  rideId: EntityId;
  /** Distance along the track, metres. The single source of a train's position. */
  s: number;
  /** Metres per second, signed. */
  v: number;
  cars: number;
  riders: number;
  /** Block index the train currently occupies, for the block system. */
  block: number;
  state: 'station' | 'dispatch' | 'lift' | 'running' | 'brake' | 'stopped' | 'crashed';
  /** Peak G readings for the ride rating, reset per circuit. */
  peakGVert: number;
  peakGLat: number;
}

export type GuestState =
  | 'entering'
  | 'walking'
  | 'queueing'
  | 'riding'
  | 'shopping'
  | 'swimming'
  | 'resting'
  | 'leaving';

/**
 * Guests are the one population with a struct-of-arrays store — see `GuestStore`. This record is
 * the *serialized* shape, produced on save and consumed on load; it never exists at runtime for
 * 2000 guests at once.
 */
export interface GuestRecord {
  id: EntityId;
  x: number;
  z: number;
  heading: number;
  state: GuestState;
  /** 0–255 each. Named in `needs`; the registry decides which exist. */
  needs: Record<string, number>;
  happiness: number;
  energy: number;
  wallet: Cents;
  spent: Cents;
  /** Ride/shop the guest is heading for, queueing at or riding. */
  target: EntityId;
  /** Path node the guest is walking towards. */
  pathNode: number;
  ticksInState: number;
  /** Preference weights, 0–255: thrill, gentle, water, food, scenery. */
  taste: [number, number, number, number, number];
  nameIndex: number;
}

export type StaffRole = 'janitor' | 'mechanic' | 'entertainer' | 'vendor' | 'lifeguard';

export interface StaffComponent {
  role: StaffRole;
  wage: Cents;
  /** Polygon of the zone this member patrols, as flat x,z pairs. Empty = whole park. */
  zone: number[];
  target: EntityId;
  state: 'idle' | 'walking' | 'working';
  ticksInState: number;
  /** 0–1, rises with time served, raises work speed. */
  skill: number;
}

export interface ShopComponent {
  defId: string;
  price: Record<string, Cents>;
  stock: number;
  queue: EntityId[];
  revenue: Cents;
  /** 0–1; a dirty shop loses custom. */
  cleanliness: number;
}

export interface SceneryComponent {
  defId: string;
  /** Theme tint index into the theme's palette, or -1 for the definition's own material. */
  tint: number;
  scale: number;
}

export interface BuildingComponent {
  defId: string;
  /** Kit-bash parts, each an id plus a local transform. */
  parts: Array<{ defId: string; x: number; y: number; z: number; rotY: number }>;
}

export interface PathComponent {
  /** Flat x,y,z triples — the spline's control points. */
  nodes: number[];
  width: number;
  styleId: string;
  kind: 'path' | 'plaza' | 'queue';
  /** For a queue path: the ride it feeds. */
  servesRide: EntityId;
}

export interface PoolComponent {
  /** Cell indices belonging to this pool. */
  cells: number[];
  /** Depth zone per cell, parallel to `cells`. */
  depths: number[];
  surfaceY: number;
  /** 0–1. Falls with bathers, raised by filtration. Below 0.4 guests get out. */
  quality: number;
  price: Cents;
}

export interface LitterComponent {
  kind: 'litter' | 'vomit';
  /** Ticks since it was dropped; a janitor's target priority uses it. */
  age: number;
}

/** Every component table. A missing key means the entity does not have that component. */
export interface EntityTable {
  transform: Record<number, TransformComponent>;
  ride: Record<number, RideComponent>;
  track: Record<number, TrackComponent>;
  train: Record<number, TrainComponent>;
  staff: Record<number, StaffComponent>;
  shop: Record<number, ShopComponent>;
  scenery: Record<number, SceneryComponent>;
  building: Record<number, BuildingComponent>;
  path: Record<number, PathComponent>;
  pool: Record<number, PoolComponent>;
  litter: Record<number, LitterComponent>;
  /**
   * The escape hatch, so a module can persist state without a core edit.
   * Keyed `moduleId -> entityId -> value`. Anything here is opaque to core and must be
   * JSON-clonable; a module that puts a class instance in it breaks the round-trip and
   * `pnpm test:game-save-roundtrip` is what will tell it so.
   */
  custom: Record<string, Record<number, unknown>>;
}

export function emptyEntityTable(): EntityTable {
  return {
    transform: {},
    ride: {},
    track: {},
    train: {},
    staff: {},
    shop: {},
    scenery: {},
    building: {},
    path: {},
    pool: {},
    litter: {},
    custom: {},
  };
}

/** The order tables are written in. Declared, not derived from `Object.keys`, so a refactor
 *  that reorders the interface cannot change a save's bytes. */
export const ENTITY_TABLE_ORDER = [
  'transform',
  'ride',
  'track',
  'train',
  'staff',
  'shop',
  'scenery',
  'building',
  'path',
  'pool',
  'litter',
  'custom',
] as const satisfies readonly (keyof EntityTable)[];

// ---------------------------------------------------------------------------
// global state
// ---------------------------------------------------------------------------

export interface EconomyState {
  cash: Cents;
  loan: Cents;
  loanLimit: Cents;
  /** Annual rate in basis points; 500 = 5 %. */
  interestBp: number;
  entryFee: Cents;
  /** Rolling per-day ledger, newest last, capped at 365 entries. */
  history: DayLedger[];
  marketing: Array<{ kind: string; ticksLeft: number; spendPerDay: Cents }>;
}

export interface DayLedger {
  day: number;
  ticketIncome: Cents;
  shopIncome: Cents;
  entryIncome: Cents;
  wages: Cents;
  upkeep: Cents;
  marketing: Cents;
  interest: Cents;
  construction: Cents;
  guests: number;
}

export interface ResearchState {
  /** Definition ids the player may build. Supports a trailing `*` wildcard. */
  unlocked: string[];
  /** Definition id currently being researched, or ''. */
  current: string;
  progress: number;
  spendPerDay: Cents;
}

export interface WeatherState {
  kind: 'clear' | 'cloudy' | 'overcast' | 'rain' | 'storm' | 'snow';
  /** 0–1 */
  intensity: number;
  temperatureC: number;
  windMs: number;
  ticksLeft: number;
  /** 0–3: spring, summer, autumn, winter. Derived from the day, stored so a scenario can pin it. */
  season: number;
}

/**
 * Recomputed every tick, never loaded from a save.
 *
 * It exists so the HUD reads one small object instead of walking 2000 guests, and it is excluded
 * from the save on purpose: a stored aggregate is a second copy of a truth the entities already
 * hold, and the day it disagrees is the day nobody can tell which one is right.
 */
export interface StatsState {
  guests: number;
  guestsToday: number;
  /** 0–1000, the park rating. */
  rating: number;
  happiness: number;
  litter: number;
  queueTotal: number;
  ridesOpen: number;
  ridesTotal: number;
  staffCount: number;
  powerDemandKw: number;
  powerSupplyKw: number;
}

export function emptyStats(): StatsState {
  return {
    guests: 0,
    guestsToday: 0,
    rating: 0,
    happiness: 0,
    litter: 0,
    queueTotal: 0,
    ridesOpen: 0,
    ridesTotal: 0,
    staffCount: 0,
    powerDemandKw: 0,
    powerSupplyKw: 0,
  };
}

export interface WorldMeta {
  name: string;
  createdAtTick: number;
  scenarioId: string;
  packIds: string[];
}

export interface WorldState {
  version: number;
  seed: number;
  tick: number;
  meta: WorldMeta;
  terrain: TerrainState;
  entities: EntityTable;
  guests: GuestRecord[];
  economy: EconomyState;
  research: ResearchState;
  weather: WeatherState;
  /** Allocator state, so a loaded save keeps handing out the same ids the run would have. */
  allocator: { generations: number[]; alive: number[]; free: number[] };
  /** One saved RNG state per stream, keyed by name. */
  rng: Record<string, RngState>;
  /** Not persisted — recomputed on load. Present here so the runtime shape is one type. */
  stats: StatsState;
}
