/**
 * Paths on the sim side: owns entities of kind `path`, keeps the navigation graph in step with
 * them, and answers the questions the guests module will ask.
 *
 * DOM-free and Babylon-free — it also runs in node under `scripts/game-soak.mjs`, which is where
 * `reachable()` and `entrance()` are graded.
 *
 * The graph is **derived**, never saved: `world.modules.paths` holds one thing, an optional manual
 * gate override, and everything else is rebuilt from the path entities. A derived structure in a
 * save is a second copy of the truth that can disagree with the first after a load, and this one
 * costs under a millisecond to rebuild for a park-sized network.
 */

import type { Command, Entity, SimContext, SimHandle } from '../core/types';
import { buildLayout, GRAPH_SPACING, type PathLayout } from './layout';
import {
  buildGraph,
  createRouter,
  EMPTY_GRAPH,
  SERVICE_RADIUS,
  SNAP_RADIUS,
  type PathGraph,
  type Router,
} from './graph';
import type { GraphStats, QueueInfo, Waypoint } from './types';
import { attachPathStyles } from './manifest';

export interface PathsSimApi {
  /**
   * The next waypoint on the way from (fromX, fromZ) to (toX, toZ).
   *
   * `node` is the caller's current node from the previous answer; passing it skips the nearest-node
   * search, which is the difference between a grid lookup and an array read per guest per tick.
   * `null` means "no route" — either end off the network, or the two ends in different components.
   */
  next(fromX: number, fromZ: number, toX: number, toZ: number, node?: number): Waypoint | null;
  /** Is there any walk from one point to the other? O(1): two component labels compared. */
  reachable(fromX: number, fromZ: number, toX: number, toZ: number): boolean;
  /** The park gate. Falls back to the middle of the +Z park edge when no path exists yet. */
  entrance(): { x: number; z: number };
  /** Nearest graph node, or -1. `maxDistance` defaults to 6 m. */
  nearestNode(x: number, z: number, maxDistance?: number): number;
  /** Position of a node, or null. */
  nodeAt(node: number): { x: number; y: number; z: number; halfWidth: number } | null;
  /** Every queue, with the ride it feeds and the node a guest joins at. */
  queues(): readonly QueueInfo[];
  /** Bumped on every rebuild, so a consumer can drop cached node ids. */
  version(): number;
  stats(): GraphStats;
}

export function createPathsSim(ctx: SimContext): SimHandle {
  // Same claim the main half makes: the sim reads `widths` and the kerb inset off a style, so a
  // pack-supplied style has to reach the worker too.
  const detachStyles = attachPathStyles(ctx.registry);
  interface TerrainLike {
    height(x: number, z: number): number;
  }
  const terrain = ctx.module<TerrainLike>('terrain');
  const height = (x: number, z: number): number => terrain?.height(x, z) ?? 0;

  const layouts = new Map<string, PathLayout>();
  let graph: PathGraph = EMPTY_GRAPH;
  let router: Router = createRouter(graph, defaultGate());
  let dirty = true;
  let version = 0;
  let gateOverride: [number, number] | null = readGate();

  function defaultGate(): { x: number; z: number } {
    // The +Z edge, a little inside it. Every park in this repo puts its entrance there and the
    // demo park flattens a plaza for one at z ≈ 170; a gate that answers before any path exists is
    // what keeps `entrance()` from being a null the soak has to special-case.
    const size = ctx.world.terrain?.size ?? 512;
    return { x: 0, z: size * 0.33 };
  }

  function readGate(): [number, number] | null {
    const slot = ctx.world.modules.paths as { gate?: unknown } | undefined;
    const gate = slot?.gate;
    if (Array.isArray(gate) && gate.length === 2) {
      const x = Number(gate[0]);
      const z = Number(gate[1]);
      if (Number.isFinite(x) && Number.isFinite(z)) return [x, z];
    }
    return null;
  }

  function relayout(entity: Entity): void {
    const layout = buildLayout(entity, GRAPH_SPACING);
    if (layout) layouts.set(entity.id, layout);
    else layouts.delete(entity.id);
    dirty = true;
  }

  function rebuildAll(): void {
    layouts.clear();
    // Sorted rather than in `for…in` order: the graph's node ids are positions in these arrays,
    // and a save that reloads in a different insertion order would hand every guest a different
    // node for the same metre of path (ARCHITECTURE §1 rule 4, declared iteration order).
    for (const id of Object.keys(ctx.world.entities).sort()) {
      const entity = ctx.world.entities[id];
      if (entity.kind !== 'path') continue;
      const layout = buildLayout(entity, GRAPH_SPACING);
      if (layout) layouts.set(id, layout);
    }
    dirty = true;
  }

  function ensure(): void {
    if (!dirty) return;
    dirty = false;
    const ordered = [...layouts.keys()].sort().map((id) => layouts.get(id) as PathLayout);
    graph = buildGraph(ordered, height);
    router = createRouter(
      graph,
      gateOverride ? { x: gateOverride[0], z: gateOverride[1] } : defaultGate()
    );
    version++;
    ctx.events.emit('paths:changed', {
      version,
      nodes: graph.count,
      components: graph.components,
      entities: graph.entities.length,
    });
  }

  const offAdd = ctx.events.on('entity:add', (entity: Entity) => {
    if (entity.kind === 'path') relayout(entity);
  });
  const offUpdate = ctx.events.on('entity:update', (change: { entity: Entity }) => {
    if (change.entity.kind === 'path') relayout(change.entity);
  });
  const offRemove = ctx.events.on('entity:remove', (entity: Entity) => {
    if (entity.kind !== 'path') return;
    layouts.delete(entity.id);
    dirty = true;
  });

  rebuildAll();

  const api: PathsSimApi = {
    next(fromX, fromZ, toX, toZ, node) {
      ensure();
      return router.next(fromX, fromZ, toX, toZ, node);
    },
    reachable(fromX, fromZ, toX, toZ) {
      ensure();
      return router.reachable(fromX, fromZ, toX, toZ);
    },
    entrance() {
      ensure();
      if (gateOverride) return { x: gateOverride[0], z: gateOverride[1] };
      return router.entrance();
    },
    nearestNode(x, z, maxDistance = SNAP_RADIUS) {
      ensure();
      return router.nearest(x, z, maxDistance);
    },
    nodeAt(node) {
      ensure();
      if (node < 0 || node >= graph.count) return null;
      return {
        x: graph.x[node],
        y: graph.y[node],
        z: graph.z[node],
        halfWidth: graph.halfWidth[node],
      };
    },
    queues() {
      ensure();
      return graph.queues;
    },
    version() {
      ensure();
      return version;
    },
    stats() {
      ensure();
      return router.stats();
    },
  };

  return {
    api,
    tick() {
      ensure();
      router.beginTick();
    },
    command(cmd: Command) {
      if (cmd.type !== 'paths:gate') return false;
      const payload = cmd.payload as { x?: number; z?: number } | null;
      if (payload && Number.isFinite(payload.x) && Number.isFinite(payload.z)) {
        gateOverride = [payload.x as number, payload.z as number];
      } else {
        gateOverride = null;
      }
      ctx.world.modules.paths = { gate: gateOverride };
      dirty = true;
      return true;
    },
    fill(writer) {
      ensure();
      writer.stat('paths.nodes', graph.count);
      writer.stat('paths.components', graph.components);
    },
    rebuild() {
      gateOverride = readGate();
      rebuildAll();
    },
    serialize() {
      return { gate: gateOverride };
    },
    dispose() {
      detachStyles();
      offAdd();
      offUpdate();
      offRemove();
    },
  };
}

export { SERVICE_RADIUS, SNAP_RADIUS };
