/**
 * The shapes every other file in this module agrees on. DOM-free, Babylon-free, import-safe on the
 * worker and in node.
 *
 * `PathEntityData` is what lands in `Entity.data` for an entity of kind `path`, so it has to be
 * JSON-serialisable and it has to survive a save: the control points are a flat number array
 * rather than an array of pairs because `serializeWorld` writes numbers in a fixed order and a
 * nested tuple costs two more levels of brackets per point for nothing.
 */

/**
 * What the entity is.
 *
 * `path` and `queue` are both splines and differ in what they mean rather than in how they are
 * drawn: a queue binds to a ride, is walked in one direction, and gets stanchions along its edge.
 * `plaza` is a filled polygon.
 */
export type PathForm = 'path' | 'plaza' | 'queue';

export interface PathEntityData {
  form: PathForm;
  /** A style id from the manifest (`lib/game/paths/manifest.ts`). */
  style: string;
  /** Flat `[x, z, x, z, …]`: Catmull-Rom control points, or the ring of a plaza. */
  points: number[];
  /** Metres. Clamped to the style's allowed widths; 4 m by default. Ignored by `plaza`. */
  width?: number;
  /** Splines only: join the last control point back to the first. */
  closed?: boolean;
  /** `queue` only: the entity id of the ride this queue feeds. */
  rideId?: string;
  /** Marks this path as carrying the park gate; `entrance()` snaps to its first node. */
  entrance?: boolean;
  [key: string]: unknown;
}

export const DEFAULT_WIDTH = 4;
/** The widths a tool may offer. A style may allow a subset. */
export const PATH_WIDTHS: readonly number[] = [2, 4, 6, 8];

// ── Graph ───────────────────────────────────────────────────────────────────────────────────
/** Node flags, bitwise. `Uint8Array` in the graph, so eight is the ceiling. */
export const NODE_PATH = 1;
export const NODE_PLAZA = 2;
export const NODE_QUEUE = 4;
export const NODE_ENTRANCE = 8;
/** The end of a queue that touches the ride; guests board here. */
export const NODE_QUEUE_HEAD = 16;

export interface GraphStats {
  nodes: number;
  edges: number;
  components: number;
  entities: number;
  /** Milliseconds the last full relink took. */
  buildMs: number;
  /** How many of the cached route trees are live. */
  routeTrees: number;
  /** Cheap counters, so a report can say what the cache actually bought. */
  routeHits: number;
  routeMisses: number;
  greedyFallbacks: number;
}

export interface QueueInfo {
  entityId: string;
  rideId: string | null;
  /** Node at the back of the line — where a guest joins. */
  tailNode: number;
  /** Node at the ride end. */
  headNode: number;
  nodes: number[];
  lengthM: number;
}

/** What `next()` answers with: the waypoint to walk to, and the node it belongs to. */
export interface Waypoint {
  x: number;
  z: number;
  node: number;
}
