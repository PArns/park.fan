/**
 * The navigable graph: nodes on the walkable surface, edges between them, and the routing the
 * guests module asks thousands of questions of per tick.
 *
 * Pure and DOM-free — it runs on the worker and in the soak harness under node.
 *
 * **What is cached and what it costs.** Three things, and they answer three different questions:
 *
 *  - `comp[]`, one Int32 per node, from a single BFS over the whole graph at build time. It makes
 *    `reachable()` an O(1) comparison of two labels instead of a search, which is what lets the
 *    soak ask it once per ride without the answer being a search per ride.
 *  - a uniform grid over the nodes (`GRID_CELL` metres), so `nearestNode` looks at the few nodes in
 *    a 3×3 block of cells rather than at all of them. Plus a small map from a 2 m-quantised
 *    destination to its node, because a park's destinations are its rides and shops: the same
 *    dozen points, asked for by every guest, every tick.
 *  - one **route tree** per destination: a Dijkstra from the destination that writes, for every
 *    node, the neighbour to step to next. After it exists, `next()` is one array read. A tree is
 *    `4 · nodes` bytes and `ROUTE_TREE_LIMIT` of them are kept; at 2000 nodes that is 512 KB for
 *    64 destinations, and every tree is thrown away when the graph changes.
 *
 * The trees are what make the budget: building one is O(E log V) — measurable milliseconds on a
 * big park — so at most `TREES_PER_TICK` are built per tick and a query that misses is answered
 * greedily (step to the neighbour that gets closer) rather than made to wait. A guest therefore
 * walks approximately for a tick or two after a path is built, and exactly afterwards. That is a
 * deliberate trade and `stats().greedyFallbacks` counts how often it is taken.
 */

import { GRAPH_SPACING, SURFACE_LIFT, layoutContains, type PathLayout } from './layout';
import { pointInPolygon, type Pt } from './geom2d';
import {
  NODE_ENTRANCE,
  NODE_PATH,
  NODE_PLAZA,
  NODE_QUEUE,
  NODE_QUEUE_HEAD,
  type GraphStats,
  type QueueInfo,
  type Waypoint,
} from './types';

/**
 * Two nodes on different entities are joined when their SURFACES touch, not when the centrelines
 * happen to be close: the reach is `halfWidth(a) + halfWidth(b) + WELD_MARGIN`.
 *
 * The flat radius this replaced (2.2 m) was chosen to be a little over half a plaza lattice
 * diagonal, and it silently disconnected a plaza from every path that stopped at its kerb — which
 * is what a path drawn up to a plaza looks like. An eight-metre avenue ending one metre short of a
 * plaza edge is joined now; two four-metre paths running parallel eight metres apart are not,
 * because their kerbs are two metres from touching.
 */
const WELD_MARGIN = 1;
/** Nothing is welded further than this, whatever the widths say. */
const WELD_MAX = 8;
/**
 * Grid cell, metres. Sized so that a weld query (`WELD_MAX`) fits in a 3×3 block: at 6 m it needed
 * 5×5 and examined nodes thirty metres away to reject them.
 */
const GRID_CELL = 8;
/** How far off a path a query may be and still snap to it. */
export const SNAP_RADIUS = 6;
/** A ride or shop counts as served by a path node this close to it. */
export const SERVICE_RADIUS = 14;
const ROUTE_TREE_LIMIT = 64;
const TREES_PER_TICK = 2;

export interface PathGraph {
  count: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  flags: Uint8Array;
  /** Half-width of the surface at this node; guests may wander inside it. */
  halfWidth: Float32Array;
  /** Index into `entities`. */
  owner: Int32Array;
  entities: string[];
  edgeStart: Int32Array;
  edgeTo: Int32Array;
  edgeCost: Float32Array;
  comp: Int32Array;
  components: number;
  queues: QueueInfo[];
  entranceNode: number;
  /**
   * How long the last build took, milliseconds — written by whoever called `buildGraph` from a
   * thread that is allowed a clock (the renderer). It stays 0 on the worker: `performance.now()`
   * is banned in anything a sim file can reach (ARCHITECTURE §1 rule 2), and a diagnostic is not
   * worth an exception to a determinism rule. The number in the report comes from a node harness
   * that times the same pure function from outside.
   */
  buildMs: number;
  /** Grid index. */
  cellSize: number;
  gridMinX: number;
  gridMinZ: number;
  gridW: number;
  gridH: number;
  cellStart: Int32Array;
  cellItems: Int32Array;
}

export const EMPTY_GRAPH: PathGraph = {
  count: 0,
  x: new Float32Array(0),
  y: new Float32Array(0),
  z: new Float32Array(0),
  flags: new Uint8Array(0),
  halfWidth: new Float32Array(0),
  owner: new Int32Array(0),
  entities: [],
  edgeStart: new Int32Array(1),
  edgeTo: new Int32Array(0),
  edgeCost: new Float32Array(0),
  comp: new Int32Array(0),
  components: 0,
  queues: [],
  entranceNode: -1,
  buildMs: 0,
  cellSize: GRID_CELL,
  gridMinX: 0,
  gridMinZ: 0,
  gridW: 0,
  gridH: 0,
  cellStart: new Int32Array(1),
  cellItems: new Int32Array(0),
};

export type HeightFn = (x: number, z: number) => number;

interface RawNode {
  x: number;
  z: number;
  y: number;
  flags: number;
  halfWidth: number;
  owner: number;
}

/**
 * Build the graph from the layouts.
 *
 * Incremental in the way that matters: the caller (`sim.ts`) keeps one layout per entity and
 * re-samples only the entity that changed, so the spline evaluation and the terrain sampling — the
 * expensive half — is paid once per edited path. This function then re-packs the flat arrays,
 * which is O(total nodes) and measured in `stats().buildMs`. Re-packing rather than patching is a
 * deliberate simplification: a park with 3 km of paths is about 1000 nodes, the pack is well under
 * a millisecond, and it happens at the rate a human clicks rather than per tick.
 */
export function buildGraph(layouts: readonly PathLayout[], height: HeightFn): PathGraph {
  const nodes: RawNode[] = [];
  const entities: string[] = [];
  const perEntity: number[][] = [];
  const plazaRings: Array<{ ring: Pt[]; owner: number }> = [];

  for (const layout of layouts) {
    const owner = entities.length;
    entities.push(layout.id);
    const mine: number[] = [];
    if (layout.form === 'plaza') {
      plazaRings.push({ ring: layout.ring, owner });
      for (const p of plazaLattice(layout)) {
        mine.push(nodes.length);
        nodes.push({
          x: p.x,
          z: p.z,
          y: height(p.x, p.z) + SURFACE_LIFT,
          flags: NODE_PLAZA,
          halfWidth: GRAPH_SPACING * 0.5,
          owner,
        });
      }
    } else {
      const isQueue = layout.form === 'queue';
      for (const st of layout.stations) {
        mine.push(nodes.length);
        nodes.push({
          x: st.x,
          z: st.z,
          y: height(st.x, st.z) + SURFACE_LIFT,
          flags: isQueue ? NODE_QUEUE : NODE_PATH,
          halfWidth: layout.halfWidth,
          owner,
        });
      }
      if (isQueue && mine.length) nodes[mine[mine.length - 1]].flags |= NODE_QUEUE_HEAD;
      if (layout.entrance && mine.length) nodes[mine[0]].flags |= NODE_ENTRANCE;
    }
    perEntity.push(mine);
  }

  const count = nodes.length;
  const graph: PathGraph = {
    ...EMPTY_GRAPH,
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    z: new Float32Array(count),
    flags: new Uint8Array(count),
    halfWidth: new Float32Array(count),
    owner: new Int32Array(count),
    entities,
    comp: new Int32Array(count).fill(-1),
    queues: [],
    entranceNode: -1,
    edgeStart: new Int32Array(count + 1),
    edgeTo: new Int32Array(0),
    edgeCost: new Float32Array(0),
    cellStart: new Int32Array(1),
    cellItems: new Int32Array(0),
  };
  for (let i = 0; i < count; i++) {
    graph.x[i] = nodes[i].x;
    graph.y[i] = nodes[i].y;
    graph.z[i] = nodes[i].z;
    graph.flags[i] = nodes[i].flags;
    graph.halfWidth[i] = nodes[i].halfWidth;
    graph.owner[i] = nodes[i].owner;
  }
  buildGrid(graph);

  // ── edges ────────────────────────────────────────────────────────────────────────────────
  const adjacency: number[][] = Array.from({ length: count }, () => []);
  const costs: number[][] = Array.from({ length: count }, () => []);
  // Packed pair key rather than `adjacency[a].includes(b)`: the weld pass offers the same pair from
  // both ends and a linear scan of a node's neighbours is the innermost loop of the build.
  const linked = new Set<number>();
  const link = (a: number, b: number) => {
    if (a === b) return;
    const key = a < b ? a * count + b : b * count + a;
    if (linked.has(key)) return;
    linked.add(key);
    const dx = graph.x[a] - graph.x[b];
    const dz = graph.z[a] - graph.z[b];
    const d = Math.sqrt(dx * dx + dz * dz);
    adjacency[a].push(b);
    costs[a].push(d);
    adjacency[b].push(a);
    costs[b].push(d);
  };

  for (let e = 0; e < layouts.length; e++) {
    const layout = layouts[e];
    const mine = perEntity[e];
    if (layout.form === 'plaza') {
      linkLattice(graph, mine, link);
      continue;
    }
    for (let i = 0; i + 1 < mine.length; i++) link(mine[i], mine[i + 1]);
    if (layout.closed && mine.length > 2) link(mine[mine.length - 1], mine[0]);
  }

  // Cross-entity welds: every node against the nodes in its own and neighbouring grid cells.
  const scratch: number[] = [];
  for (let i = 0; i < count; i++) {
    queryCell(graph, graph.x[i], graph.z[i], WELD_MAX, scratch);
    for (const j of scratch) {
      if (j <= i) continue;
      if (graph.owner[i] === graph.owner[j]) continue;
      const reach = Math.min(WELD_MAX, graph.halfWidth[i] + graph.halfWidth[j] + WELD_MARGIN);
      const dx = graph.x[i] - graph.x[j];
      const dz = graph.z[i] - graph.z[j];
      if (dx * dx + dz * dz > reach * reach) continue;
      link(i, j);
    }
  }
  // A path that runs ACROSS a plaza has nodes inside the ring. Those are usually caught above, but
  // a plaza's lattice is inset from its own kerb, so a node sitting in that inset band has nothing
  // within reach; it is joined to the plaza's nearest lattice node explicitly.
  const ownerScratch: number[] = [];
  for (const { ring, owner } of plazaRings) {
    for (let i = 0; i < count; i++) {
      if (graph.owner[i] === owner) continue;
      if (!pointInPolygon(ring, graph.x[i], graph.z[i])) continue;
      const near = nearestInOwner(
        graph,
        graph.x[i],
        graph.z[i],
        owner,
        GRAPH_SPACING * 2,
        ownerScratch
      );
      if (near >= 0) link(i, near);
    }
  }

  let edgeCount = 0;
  for (let i = 0; i < count; i++) edgeCount += adjacency[i].length;
  graph.edgeTo = new Int32Array(edgeCount);
  graph.edgeCost = new Float32Array(edgeCount);
  let at = 0;
  for (let i = 0; i < count; i++) {
    graph.edgeStart[i] = at;
    for (let k = 0; k < adjacency[i].length; k++) {
      graph.edgeTo[at] = adjacency[i][k];
      graph.edgeCost[at] = costs[i][k];
      at++;
    }
  }
  graph.edgeStart[count] = at;

  labelComponents(graph);

  // ── queues ───────────────────────────────────────────────────────────────────────────────
  for (let e = 0; e < layouts.length; e++) {
    const layout = layouts[e];
    if (layout.form !== 'queue') continue;
    const mine = perEntity[e];
    if (mine.length < 2) continue;
    graph.queues.push({
      entityId: layout.id,
      rideId: layout.rideId,
      tailNode: mine[0],
      headNode: mine[mine.length - 1],
      nodes: mine,
      lengthM: layout.lengthM,
    });
  }

  // ── entrance ─────────────────────────────────────────────────────────────────────────────
  let entrance = -1;
  for (let i = 0; i < count; i++) {
    if (graph.flags[i] & NODE_ENTRANCE) {
      entrance = i;
      break;
    }
  }
  if (entrance < 0) {
    // No flagged gate: the node furthest towards +Z, which is where a park's entrance plaza is by
    // convention here (the demo park flattens one at z ≈ 170). Ties go to the one nearest x = 0.
    let best = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < count; i++) {
      if (graph.flags[i] & NODE_QUEUE) continue;
      const score = graph.z[i] - Math.abs(graph.x[i]) * 0.15;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    entrance = best;
  }
  graph.entranceNode = entrance;
  return graph;
}

/** A lattice of walkable points inside a plaza, inset so nobody stands on the kerb. */
function plazaLattice(layout: PathLayout): Pt[] {
  const ring = layout.ring;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of ring) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  const inset = (layout.style.kerb?.width ?? 0.25) + 0.5;
  const out: Pt[] = [];
  const cols = Math.max(1, Math.floor((maxX - minX) / GRAPH_SPACING));
  const rows = Math.max(1, Math.floor((maxZ - minZ) / GRAPH_SPACING));
  const stepX = (maxX - minX) / cols;
  const stepZ = (maxZ - minZ) / rows;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const x = minX + i * stepX;
      const z = minZ + j * stepZ;
      if (!pointInPolygon(ring, x, z)) continue;
      // Reject points within `inset` of the boundary by sampling four probes; cheaper than an
      // offset polygon and exact enough at a 3 m lattice.
      if (
        !pointInPolygon(ring, x + inset, z) ||
        !pointInPolygon(ring, x - inset, z) ||
        !pointInPolygon(ring, x, z + inset) ||
        !pointInPolygon(ring, x, z - inset)
      ) {
        continue;
      }
      out.push({ x, z });
    }
  }
  return out;
}

function linkLattice(
  graph: PathGraph,
  mine: readonly number[],
  link: (a: number, b: number) => void
): void {
  // The lattice is emitted row-major but with holes cut out of it, so neighbours are found by
  // distance rather than by index arithmetic. `GRAPH_SPACING · 1.5` reaches the four orthogonal
  // neighbours and the four diagonals (1.414 × spacing) and nothing beyond — linking every pair
  // would make a plaza one clique and every route across it a straight line through the kerb.
  const reach = GRAPH_SPACING * 1.5;
  const reach2 = reach * reach;
  for (let a = 0; a < mine.length; a++) {
    const i = mine[a];
    for (let b = a + 1; b < mine.length; b++) {
      const j = mine[b];
      const dx = graph.x[i] - graph.x[j];
      const dz = graph.z[i] - graph.z[j];
      if (dx * dx + dz * dz > reach2) continue;
      link(i, j);
    }
  }
}

function nearestInOwner(
  graph: PathGraph,
  x: number,
  z: number,
  owner: number,
  maxDistance: number,
  scratch: number[]
): number {
  queryCell(graph, x, z, maxDistance, scratch);
  let best = -1;
  let bestD = maxDistance;
  for (const i of scratch) {
    if (graph.owner[i] !== owner) continue;
    const d = Math.hypot(graph.x[i] - x, graph.z[i] - z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

// ── grid ────────────────────────────────────────────────────────────────────────────────────
function buildGrid(graph: PathGraph): void {
  const n = graph.count;
  if (n === 0) {
    graph.gridW = 0;
    graph.gridH = 0;
    graph.cellStart = new Int32Array(1);
    graph.cellItems = new Int32Array(0);
    return;
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, graph.x[i]);
    maxX = Math.max(maxX, graph.x[i]);
    minZ = Math.min(minZ, graph.z[i]);
    maxZ = Math.max(maxZ, graph.z[i]);
  }
  graph.gridMinX = minX - 1;
  graph.gridMinZ = minZ - 1;
  graph.gridW = Math.max(1, Math.ceil((maxX - minX + 2) / GRID_CELL));
  graph.gridH = Math.max(1, Math.ceil((maxZ - minZ + 2) / GRID_CELL));
  const cells = graph.gridW * graph.gridH;
  const counts = new Int32Array(cells + 1);
  const cellOf = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const cx = Math.min(graph.gridW - 1, Math.floor((graph.x[i] - graph.gridMinX) / GRID_CELL));
    const cz = Math.min(graph.gridH - 1, Math.floor((graph.z[i] - graph.gridMinZ) / GRID_CELL));
    const c = cz * graph.gridW + cx;
    cellOf[i] = c;
    counts[c + 1]++;
  }
  for (let c = 0; c < cells; c++) counts[c + 1] += counts[c];
  const cursor = counts.slice();
  const items = new Int32Array(n);
  for (let i = 0; i < n; i++) items[cursor[cellOf[i]]++] = i;
  graph.cellStart = counts;
  graph.cellItems = items;
}

function queryCell(graph: PathGraph, x: number, z: number, radius: number, out: number[]): void {
  out.length = 0;
  if (graph.gridW === 0) return;
  const r = Math.max(1, Math.ceil(radius / GRID_CELL));
  const cx = Math.floor((x - graph.gridMinX) / GRID_CELL);
  const cz = Math.floor((z - graph.gridMinZ) / GRID_CELL);
  for (let j = cz - r; j <= cz + r; j++) {
    if (j < 0 || j >= graph.gridH) continue;
    for (let i = cx - r; i <= cx + r; i++) {
      if (i < 0 || i >= graph.gridW) continue;
      const c = j * graph.gridW + i;
      for (let k = graph.cellStart[c]; k < graph.cellStart[c + 1]; k++)
        out.push(graph.cellItems[k]);
    }
  }
}

/**
 * Nearest node within `maxDistance`, or -1.
 *
 * Walks the grid cells directly instead of collecting candidates into an array first: this is on
 * the guests' hot path, and one array allocation per call is what 16,000 of those a tick costs.
 */
export function nearestNode(graph: PathGraph, x: number, z: number, maxDistance: number): number {
  if (graph.gridW === 0) return -1;
  const r = Math.max(1, Math.ceil(maxDistance / GRID_CELL));
  const cx = Math.floor((x - graph.gridMinX) / GRID_CELL);
  const cz = Math.floor((z - graph.gridMinZ) / GRID_CELL);
  let best = -1;
  let bestD = maxDistance * maxDistance;
  for (let j = cz - r; j <= cz + r; j++) {
    if (j < 0 || j >= graph.gridH) continue;
    for (let i = cx - r; i <= cx + r; i++) {
      if (i < 0 || i >= graph.gridW) continue;
      const c = j * graph.gridW + i;
      for (let k = graph.cellStart[c]; k < graph.cellStart[c + 1]; k++) {
        const node = graph.cellItems[k];
        const dx = graph.x[node] - x;
        const dz = graph.z[node] - z;
        const d = dx * dx + dz * dz;
        if (d < bestD) {
          bestD = d;
          best = node;
        }
      }
    }
  }
  return best;
}

function labelComponents(graph: PathGraph): void {
  const comp = graph.comp;
  comp.fill(-1);
  let label = 0;
  const stack: number[] = [];
  for (let seed = 0; seed < graph.count; seed++) {
    if (comp[seed] >= 0) continue;
    comp[seed] = label;
    stack.length = 0;
    stack.push(seed);
    while (stack.length) {
      const v = stack.pop() as number;
      for (let e = graph.edgeStart[v]; e < graph.edgeStart[v + 1]; e++) {
        const w = graph.edgeTo[e];
        if (comp[w] >= 0) continue;
        comp[w] = label;
        stack.push(w);
      }
    }
    label++;
  }
  graph.components = label;
}

// ── routing ─────────────────────────────────────────────────────────────────────────────────
/**
 * Dijkstra from `dest` over the undirected graph, writing the next hop towards `dest` for every
 * node. `-1` means unreachable.
 */
export function routeTree(graph: PathGraph, dest: number): Int32Array {
  const n = graph.count;
  const hop = new Int32Array(n).fill(-1);
  /**
   * `Float64Array`, and the width is the whole bug it fixes.
   *
   * The heap key is a JS number (double); a `Float32Array` rounds what it stores, and at a park's
   * distances — a couple of hundred metres — that rounding is about 1.5e-5, which is larger than
   * the 1e-6 the stale-entry guard below allows. So `key > dist[v] + eps` fired on entries that
   * were not stale, the node was skipped instead of expanded, and the tree came back with `-1` for
   * a destination the component labels said was reachable: `next()` returned null on a route a
   * guest could walk, on a graph `reachable()` had just called connected. Eight bytes a node.
   */
  const dist = new Float64Array(n).fill(Infinity);
  const heapNode: number[] = [];
  const heapKey: number[] = [];
  dist[dest] = 0;
  push(heapNode, heapKey, dest, 0);
  while (heapNode.length) {
    const key = heapKey[0];
    const v = heapNode[0];
    pop(heapNode, heapKey);
    if (key > dist[v] + 1e-6) continue;
    for (let e = graph.edgeStart[v]; e < graph.edgeStart[v + 1]; e++) {
      const w = graph.edgeTo[e];
      const nd = key + graph.edgeCost[e];
      if (nd < dist[w] - 1e-6) {
        dist[w] = nd;
        hop[w] = v;
        push(heapNode, heapKey, w, nd);
      }
    }
  }
  hop[dest] = dest;
  return hop;
}

function push(nodes: number[], keys: number[], node: number, key: number): void {
  nodes.push(node);
  keys.push(key);
  let i = nodes.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (keys[parent] <= keys[i]) break;
    swap(nodes, keys, i, parent);
    i = parent;
  }
}

function pop(nodes: number[], keys: number[]): void {
  const last = nodes.length - 1;
  swap(nodes, keys, 0, last);
  nodes.pop();
  keys.pop();
  let i = 0;
  for (;;) {
    const l = i * 2 + 1;
    const r = l + 1;
    let small = i;
    if (l < nodes.length && keys[l] < keys[small]) small = l;
    if (r < nodes.length && keys[r] < keys[small]) small = r;
    if (small === i) break;
    swap(nodes, keys, i, small);
    i = small;
  }
}

function swap(nodes: number[], keys: number[], a: number, b: number): void {
  const n = nodes[a];
  nodes[a] = nodes[b];
  nodes[b] = n;
  const k = keys[a];
  keys[a] = keys[b];
  keys[b] = k;
}

// ── the router ──────────────────────────────────────────────────────────────────────────────
export interface Router {
  graph: PathGraph;
  next(fromX: number, fromZ: number, toX: number, toZ: number, node?: number): Waypoint | null;
  reachable(fromX: number, fromZ: number, toX: number, toZ: number): boolean;
  entrance(): { x: number; z: number };
  entranceNode(): number;
  nearest(x: number, z: number, maxDistance?: number): number;
  /** Called once per tick so the tree budget refills. */
  beginTick(): void;
  stats(): GraphStats;
}

export function createRouter(graph: PathGraph, fallbackGate: { x: number; z: number }): Router {
  interface TreeEntry {
    tree: Int32Array;
    stamp: number;
  }
  const trees = new Map<number, TreeEntry>();
  const destCache = new Map<number, number>();
  let budget = TREES_PER_TICK;
  let stamp = 0;
  let hits = 0;
  let misses = 0;
  let greedy = 0;

  /**
   * The one-entry fast paths in front of both maps.
   *
   * Guests ask for the same handful of destinations over and over, usually the same one many times
   * in a row while a crowd walks the same way, so the common call should touch no `Map` at all. It
   * is worth the six extra fields: with the maps in the hot path 20,000 `next()` calls measured
   * 9.9 ms — over the whole-sim budget on their own — and the only work in them was three `Map`
   * operations per call, one of which was the delete-and-reinsert that kept the LRU in order. The
   * LRU is a stamp now, so a cache hit writes one integer.
   */
  let lastKey = -1;
  let lastDest = -1;
  let lastTreeDest = -1;
  let lastTree: Int32Array | null = null;

  const destNode = (x: number, z: number): number => {
    // Destinations repeat: a ride, a shop, the gate. Quantising to 2 m turns "every guest asks for
    // the same ride" into one grid lookup for the whole park.
    const key = (Math.round(x / 2) & 0xffff) | ((Math.round(z / 2) & 0xffff) << 16);
    if (key === lastKey) return lastDest;
    let node = destCache.get(key);
    if (node === undefined) {
      node = nearestNode(graph, x, z, SERVICE_RADIUS);
      if (destCache.size > 512) destCache.clear();
      destCache.set(key, node);
    }
    lastKey = key;
    lastDest = node;
    return node;
  };

  const treeFor = (dest: number): Int32Array | null => {
    if (dest === lastTreeDest && lastTree) {
      hits++;
      return lastTree;
    }
    const found = trees.get(dest);
    if (found) {
      hits++;
      found.stamp = ++stamp;
      lastTreeDest = dest;
      lastTree = found.tree;
      return found.tree;
    }
    misses++;
    if (budget <= 0) return null;
    budget--;
    const tree = routeTree(graph, dest);
    trees.set(dest, { tree, stamp: ++stamp });
    if (trees.size > ROUTE_TREE_LIMIT) {
      // Evict the least recently used. A linear scan of at most 64 entries, run only when a new
      // destination arrives after the cache is full — which in a park is a guest deciding to go
      // somewhere nobody has been for a while, not something that happens per query.
      let oldestKey = -1;
      let oldestStamp = Infinity;
      for (const [key, entry] of trees) {
        if (entry.stamp < oldestStamp) {
          oldestStamp = entry.stamp;
          oldestKey = key;
        }
      }
      if (oldestKey >= 0) {
        trees.delete(oldestKey);
        if (oldestKey === lastTreeDest) {
          lastTreeDest = -1;
          lastTree = null;
        }
      }
    }
    lastTreeDest = dest;
    lastTree = tree;
    return tree;
  };

  const router: Router = {
    graph,
    beginTick() {
      budget = TREES_PER_TICK;
    },
    nearest(x, z, maxDistance = SNAP_RADIUS) {
      return nearestNode(graph, x, z, maxDistance);
    },
    entranceNode() {
      return graph.entranceNode;
    },
    entrance() {
      const n = graph.entranceNode;
      if (n < 0) return { x: fallbackGate.x, z: fallbackGate.z };
      return { x: graph.x[n], z: graph.z[n] };
    },
    reachable(fromX, fromZ, toX, toZ) {
      if (graph.count === 0) return false;
      const a = nearestNode(graph, fromX, fromZ, SERVICE_RADIUS);
      const b = destNode(toX, toZ);
      if (a < 0 || b < 0) return false;
      return graph.comp[a] === graph.comp[b];
    },
    next(fromX, fromZ, toX, toZ, node) {
      if (graph.count === 0) return null;
      let from = node !== undefined && node >= 0 && node < graph.count ? node : -1;
      if (from < 0) from = nearestNode(graph, fromX, fromZ, SNAP_RADIUS);
      if (from < 0) return null;
      const dest = destNode(toX, toZ);
      if (dest < 0 || graph.comp[from] !== graph.comp[dest]) return null;
      if (from === dest) return null;
      const tree = treeFor(dest);
      if (tree) {
        const hop = tree[from];
        if (hop < 0) return null;
        return { x: graph.x[hop], z: graph.z[hop], node: hop };
      }
      // No tree yet: step to whichever neighbour gets closest to the destination. Approximate for
      // a tick or two rather than motionless, which is what a guest standing still would look like.
      greedy++;
      let best = -1;
      let bestD = Math.hypot(graph.x[from] - graph.x[dest], graph.z[from] - graph.z[dest]);
      for (let e = graph.edgeStart[from]; e < graph.edgeStart[from + 1]; e++) {
        const w = graph.edgeTo[e];
        const d = Math.hypot(graph.x[w] - graph.x[dest], graph.z[w] - graph.z[dest]);
        if (d < bestD) {
          bestD = d;
          best = w;
        }
      }
      if (best < 0) return null;
      return { x: graph.x[best], z: graph.z[best], node: best };
    },
    stats() {
      return {
        nodes: graph.count,
        edges: graph.edgeTo.length / 2,
        components: graph.components,
        entities: graph.entities.length,
        buildMs: Number(graph.buildMs.toFixed(3)),
        routeTrees: trees.size,
        routeHits: hits,
        routeMisses: misses,
        greedyFallbacks: greedy,
      };
    },
  };
  return router;
}

/** True where a point is on any walkable surface. Used by tools and by the graph's own welds. */
export function onSurface(layouts: readonly PathLayout[], x: number, z: number): boolean {
  for (const layout of layouts) if (layoutContains(layout, x, z)) return true;
  return false;
}
