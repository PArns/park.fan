/**
 * Paths: spline walks, plazas, queue lines — and the graph the guests navigate.
 *
 * Import-safe on the worker. `sim` is a plain function over pure files (`layout`, `spline`,
 * `geom2d`, `graph`, `manifest`, `noise`); everything that touches Babylon sits behind the dynamic
 * imports below. `PathsMainApi` is deliberately NOT re-exported here for the same reason the
 * terrain module gives: a type re-export keeps a module reference to `main.ts` that a bundler is
 * free to follow into Babylon. Import it from `@/lib/game/paths/main`.
 */

import type { GameModule } from '../core/types';
import { createPathsSim } from './sim';

export const pathsModule: GameModule = {
  id: 'paths',
  deps: ['core', 'terrain'],
  kinds: ['path'],
  sim: createPathsSim,
  main: async (ctx) => (await import('./main')).createPathsMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stagePathsShowcase(ctx),
};

export type { PathsSimApi } from './sim';
export type { PathEntityData, PathForm, GraphStats, QueueInfo, Waypoint } from './types';
export {
  DEFAULT_WIDTH,
  PATH_WIDTHS,
  NODE_ENTRANCE,
  NODE_PATH,
  NODE_PLAZA,
  NODE_QUEUE,
  NODE_QUEUE_HEAD,
} from './types';
export {
  PATH_MATERIAL_MANIFEST,
  PATH_STYLE_MANIFEST,
  parsePathStyle,
  pathMaterial,
  pathStyle,
  pathStyles,
  registerPathMaterial,
  registerPathStyle,
  resolveWidth,
} from './manifest';
export type { PathMaterialRecipe, PathStyleDef } from './manifest';
export { buildLayout, findJunctions, GRAPH_SPACING, MESH_SPACING, SURFACE_LIFT } from './layout';
export type { PathLayout, Junction } from './layout';
export {
  buildGraph,
  createRouter,
  nearestNode,
  routeTree,
  SERVICE_RADIUS,
  SNAP_RADIUS,
} from './graph';
export type { PathGraph, Router } from './graph';
