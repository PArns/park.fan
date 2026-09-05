/**
 * The typed message protocol between the main thread and the simulation worker.
 *
 * Two directions, both discriminated on `k`, both JSON-clonable. The snapshot direction carries
 * transferable typed arrays alongside the structured part — the arrays are *moved*, not copied,
 * which is what keeps a 2000-guest frame inside the tick budget.
 *
 * The rule that keeps this honest: **the main thread never mutates the world.** Its only write is a
 * `Command`, stamped with the tick it was issued on and applied by the worker at a tick boundary.
 * Everything else here is the worker telling the main thread what happened.
 */

import type { EntityId } from './ids';
import type { StaffRole, TerrainLayer, TrackNode } from './schema';
import type { SimSpeed, Vec2, Vec3 } from './units';

// ---------------------------------------------------------------------------
// commands — main → worker
// ---------------------------------------------------------------------------

export type Command =
  | { k: 'sim.speed'; speed: SimSpeed }
  | { k: 'sim.seedPark'; blueprint: string }
  | { k: 'terrain.sculpt'; at: Vec2; radius: number; strength: number; mode: 'raise' | 'lower' | 'level' | 'smooth'; levelY?: number }
  | { k: 'terrain.paint'; at: Vec2; radius: number; layer: TerrainLayer; strength: number }
  | { k: 'terrain.water'; level: number }
  | { k: 'path.place'; nodes: Vec3[]; width: number; styleId: string; kind: 'path' | 'plaza' | 'queue'; servesRide?: EntityId }
  | { k: 'path.remove'; id: EntityId }
  | { k: 'pool.place'; cells: number[]; depths: number[]; surfaceY: number }
  | { k: 'pool.remove'; id: EntityId }
  | { k: 'ride.build'; defId: string; at: Vec3; rotY: number }
  | { k: 'ride.remove'; id: EntityId }
  | { k: 'ride.setStatus'; id: EntityId; status: 'open' | 'closed' | 'testing' }
  | { k: 'ride.setPrice'; id: EntityId; cents: number }
  | { k: 'ride.setTrains'; id: EntityId; trains: number; carsPerTrain: number }
  | { k: 'track.commit'; rideId: EntityId; nodes: TrackNode[]; closed: boolean }
  | { k: 'scenery.place'; defId: string; at: Vec3; rotY: number; scale: number; tint: number }
  | { k: 'scenery.remove'; id: EntityId }
  | { k: 'building.place'; defId: string; at: Vec3; rotY: number; parts: Array<{ defId: string; x: number; y: number; z: number; rotY: number }> }
  | { k: 'shop.place'; defId: string; at: Vec3; rotY: number }
  | { k: 'shop.setPrice'; id: EntityId; sku: string; cents: number }
  | { k: 'staff.hire'; role: StaffRole; at: Vec3 }
  | { k: 'staff.fire'; id: EntityId }
  | { k: 'staff.setZone'; id: EntityId; zone: number[] }
  | { k: 'economy.setEntryFee'; cents: number }
  | { k: 'economy.loan'; deltaCents: number }
  | { k: 'economy.marketing'; kind: string; days: number; spendPerDay: number }
  | { k: 'research.set'; defId: string; spendPerDay: number }
  | { k: 'entity.remove'; id: EntityId }
  | { k: 'custom'; module: string; payload: unknown };

export interface CommandEnvelope {
  /** The tick the main thread believed it was on. Recorded for the replay log, never trusted. */
  issuedAtTick: number;
  /** Monotonic per session, so an undo can name the command it reverses. */
  seq: number;
  cmd: Command;
}

// ---------------------------------------------------------------------------
// main → worker
// ---------------------------------------------------------------------------

export type ToWorker =
  | { k: 'boot'; seed: number; name: string; scenarioId: string; packIds: string[]; terrainSize: number; needNames: string[]; guestCapacity: number }
  | { k: 'load'; save: string; needNames: string[]; guestCapacity: number }
  | { k: 'commands'; list: CommandEnvelope[] }
  | { k: 'requestSave' }
  /** Run `ticks` ticks as fast as possible and reply once. The soak test's whole interface. */
  | { k: 'fastForward'; ticks: number }
  | { k: 'setSnapshotRate'; hz: number }
  | { k: 'dispose' };

// ---------------------------------------------------------------------------
// worker → main
// ---------------------------------------------------------------------------

/**
 * The per-tick payload.
 *
 * `guests` and `trains` travel as transferable typed arrays; everything else is small enough that
 * a structured clone costs less than the bookkeeping of pooling a buffer for it.
 */
export interface SnapshotFrame {
  k: 'snapshot';
  tick: number;
  /** Rendered as `tick / TICK_HZ`; the main thread interpolates between two of these. */
  guestCount: number;
  /** x, z, heading, state — four f32 per guest, interleaved. */
  guestData: Float32Array;
  /** Per-guest palette, 5 bytes each, only re-sent when `paletteRevision` changes. */
  guestPalette: Uint8Array | null;
  paletteRevision: number;
  /** rideId, s, v, cars, riders, state — six f32 per train, interleaved. */
  trainData: Float32Array;
  trainCount: number;
  /** The HUD's whole read model. Small, structured, re-sent every frame. */
  stats: SnapshotStats;
  /** Entities created or changed since the last snapshot, so the renderer can react without diffing. */
  dirty: DirtyList;
}

export interface SnapshotStats {
  cash: number;
  loan: number;
  guests: number;
  guestsToday: number;
  rating: number;
  happiness: number;
  litter: number;
  ridesOpen: number;
  ridesTotal: number;
  staffCount: number;
  queueTotal: number;
  powerDemandKw: number;
  powerSupplyKw: number;
  day: number;
  hour: number;
  minute: number;
  speed: SimSpeed;
  weather: string;
  temperatureC: number;
  /** Milliseconds the last tick took in the worker. The budget is 6. */
  tickMs: number;
}

export interface DirtyList {
  rides: EntityId[];
  paths: EntityId[];
  pools: EntityId[];
  scenery: EntityId[];
  buildings: EntityId[];
  shops: EntityId[];
  staff: EntityId[];
  litter: EntityId[];
  removed: EntityId[];
  /** Bounding box of terrain that changed, or null. */
  terrain: { minX: number; minZ: number; maxX: number; maxZ: number } | null;
}

export function emptyDirty(): DirtyList {
  return {
    rides: [],
    paths: [],
    pools: [],
    scenery: [],
    buildings: [],
    shops: [],
    staff: [],
    litter: [],
    removed: [],
    terrain: null,
  };
}

export type FromWorker =
  | { k: 'ready'; tick: number; worldSummary: WorldSummary }
  | SnapshotFrame
  /** A full serialized world, in reply to `requestSave` — and what the save file is built from. */
  | { k: 'save'; json: string; tick: number }
  | { k: 'fastForwardDone'; ticks: number; wallMs: number; report: SoakReport }
  | { k: 'notify'; level: 'info' | 'warn' | 'error'; title: string; body?: string }
  | { k: 'rejected'; seq: number; reason: string }
  | { k: 'error'; message: string; stack?: string };

export interface WorldSummary {
  name: string;
  seed: number;
  terrainSize: number;
  scenarioId: string;
  packIds: string[];
}

/** What a fast-forward reports back. The soak test asserts on every field. */
export interface SoakReport {
  ticks: number;
  guests: number;
  guestsPeak: number;
  /** Any NaN or Infinity found while walking the world. Non-empty means a failed run. */
  nonFinite: string[];
  /** Guests that have not moved and are not queueing/riding for over 60 s of game time. */
  stuckGuests: number;
  /** Queue paths with no route to the park entrance. */
  unreachableQueues: number;
  /** Entities alive with no component at all — the leak signature. */
  orphanEntities: number;
  cash: number;
  bankruptcies: number;
  maxTickMs: number;
  meanTickMs: number;
  /** Wall-clock milliseconds the whole fast-forward took. Not a simulation input. */
  wallMs: number;
}

/** The typed arrays a snapshot moves rather than copies. */
export function snapshotTransfers(frame: SnapshotFrame): Transferable[] {
  const transfers: Transferable[] = [frame.guestData.buffer as ArrayBuffer, frame.trainData.buffer as ArrayBuffer];
  if (frame.guestPalette) transfers.push(frame.guestPalette.buffer as ArrayBuffer);
  return transfers;
}
