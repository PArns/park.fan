/**
 * Build tools: the tool stack, the ghost, snapping, undo/redo, and the palette the build bar draws.
 *
 * Import-safe on the worker — there is no `sim` half at all (ARCHITECTURE.md gives this module
 * "nothing persistent (command stack on main)"), and everything that touches Babylon sits behind
 * the dynamic imports below. `ToolsMainApi` is deliberately not re-exported here, for the reason
 * terrain, paths, track, guests and shops all give: a type re-export keeps a module reference to
 * `main.ts` that a bundler is free to follow into Babylon. Import it from `@/lib/game/tools/main`.
 *
 * **`deps` names five modules and each one is load-bearing for the showcase, not for the game.**
 * `orderModules()` restricts a `?showcase=<id>` run to the module and its dependencies, so without
 * `scenery` and `shops` in this list `/game?showcase=tools` would have a palette full of items and
 * nothing in the scene able to draw one — the tool would place entities into a world with no
 * renderer for them and the frame would be empty ground. In the full game this reorders nothing:
 * every one of them already sits before `tools` in `lib/game/modules.ts`.
 */

import type { GameModule } from '../core/types';

export const toolsModule: GameModule = {
  id: 'tools',
  deps: ['core', 'ui', 'camera', 'terrain', 'paths', 'scenery', 'shops'],
  main: async (ctx) => (await import('./main')).createToolsMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageToolsShowcase(ctx),
};

export {
  attachPalette,
  buildPalette,
  findPaletteItem,
  firstPlaceable,
  footprintForItem,
  heightForItem,
  kindForItem,
  placementForItem,
  paletteItemFrom,
  PALETTE_CATEGORIES,
} from './palette';
export { createHistory, HISTORY_LIMIT } from './history';
export {
  DEFAULT_PLACEMENT_RULES,
  evaluatePlacement,
  pickEntityAt,
  samplePoints,
} from './placement';
export {
  rectCorners,
  rectsOverlap,
  pointInRect,
  snapAngle,
  snapPoint,
  snapValue,
  wrapAngle,
} from './snap';
export type {
  GroundProbe,
  Obstacle,
  PlacementQuery,
  PlacementRules,
  PlacementVerdict,
} from './placement';
export type { Rect } from './snap';
export type { History, HistoryCommand, HistoryEntry } from './history';
export type {
  GhostState,
  PaletteCategory,
  PaletteGroup,
  PaletteItem,
  PlacementMode,
  PlacementReason,
  SnapSettings,
  ToolId,
  ToolsState,
  ToolsStats,
} from './types';
export { DEFAULT_SNAP, TOOL_IDS } from './types';
