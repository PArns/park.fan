/**
 * The build tools' main handle: the tool stack, the pointer and keyboard wiring, the ghost, and
 * the undo/redo history.
 *
 * **Every change to the world is a core command, dispatched exactly the way core documents it.**
 * `ctx.dispatch('entity:add' | 'entity:update' | 'entity:remove', …)` is mirrored on the main
 * thread by `host.ts` (around line 150) before it reaches the worker, so a tool sees its own result
 * in the same frame the click happened in, and the worker's own event confirms it idempotently.
 * There is no second path: undo re-dispatches the inverse commands, redo re-dispatches the
 * originals, and the showcase places its content through the same `commit()` a click calls.
 *
 * **A click is a pointer that did not move.** The camera module owns the left button for panning
 * (`camera/input.ts`, `panButtons: [0, 1]`), and it must keep it — a build tool that took the drag
 * would be a tool you cannot move the camera while using. So this listens on the same canvas and
 * treats a press-and-release inside {@link CLICK_SLOP_PX} pixels as a click; anything further is a
 * camera pan and this module never hears about it. No timers are involved, because a click that
 * depends on a clock behaves differently in the screenshot harness than in a browser.
 *
 * **Picking is geometric.** See `placement.ts`: everything in this game is drawn as thin instances
 * of a per-type batch, so `scene.pick` cannot name an individual bench. The footprint table that
 * the overlap rule already needs answers "what is under the cursor" as well.
 */

import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import type { Scene } from '@babylonjs/core/scene';
import type { CameraMainApi } from '../camera/main';
import { nextEntityId } from '../core/world';
import type { Entity, EntityChange, MainContext, MainHandle, Vec3 } from '../core/types';
import { createGhostRig, type GhostRig } from './ghost';
import { createHistory, type History } from './history';
import { attachPalette, buildPalette, findPaletteItem, firstPlaceable } from './palette';
import {
  DEFAULT_PLACEMENT_RULES,
  evaluatePlacement,
  pickEntityAt,
  type Obstacle,
} from './placement';
import { rectsOverlap, snapAngle, snapPoint, wrapAngle, type Rect } from './snap';
import {
  DEFAULT_SNAP,
  type GhostState,
  type PaletteGroup,
  type PaletteItem,
  type SnapSettings,
  type ToolId,
  type ToolsState,
  type ToolsStats,
} from './types';

/** Pixels a pointer may travel between press and release and still count as a click. */
export const CLICK_SLOP_PX = 6;
/** Degrees one press of `R`, or one press of a rotate button, turns the ghost or the selection. */
export const ROTATE_STEP_DEG = 15;

export interface ToolsMainApi {
  /** Everything placeable, grouped by entity kind. Derived from the registry, live. */
  palette(): PaletteGroup[];
  /** Arm a tool. `place` needs an item key; `move` needs a selection. Returns false if it cannot. */
  useTool(tool: ToolId, itemKey?: string | null): boolean;
  activeTool(): ToolId;
  activeItem(): PaletteItem | null;
  /** Escape: leave the current tool, or clear the selection when there is nothing to leave. */
  cancel(): void;
  state(): ToolsState;
  subscribe(fn: (state: ToolsState) => void): () => void;
  snap(): SnapSettings;
  setSnap(patch: Partial<SnapSettings>): void;
  /** Turn the ghost, or the selection when no ghost is live. Degrees. */
  rotateBy(deltaDeg: number): boolean;
  select(id: string | null): void;
  selected(): string | null;
  deleteSelection(): boolean;
  /** Move the ghost to a world point. The showcase and the probes use it; a pointer uses it too. */
  hoverWorld(x: number, z: number): void;
  hoverScreen(clientX: number, clientY: number): void;
  clearHover(): void;
  /** Put the armed item down, or drop the moved one. Returns the entity id, or null if refused. */
  commit(): string | null;
  undo(): boolean;
  redo(): boolean;
  stats(): ToolsStats;
}

interface TerrainLike {
  height(x: number, z: number): number;
  waterLevel(): number;
}

export function createToolsMain(ctx: MainContext): MainHandle {
  const scene = ctx.scene as Scene;
  const engine = ctx.engine as AbstractEngine;
  const canvas = engine.getRenderingCanvas();
  const camera = ctx.module<CameraMainApi>('camera');
  const terrain = ctx.module<TerrainLike>('terrain');
  const parkHalf = ctx.world.terrain.size / 2;

  const ground = {
    height: (x: number, z: number) => terrain?.height(x, z) ?? 0,
    waterLevel: () => terrain?.waterLevel() ?? ctx.world.terrain.waterLevel,
  };

  const rig: GhostRig = createGhostRig(scene);
  const history: History = createHistory((type, payload) => ctx.dispatch(type, payload));

  // ── State ─────────────────────────────────────────────────────────────────────────────────
  let groups: PaletteGroup[] = [];
  let byKey = new Map<string, PaletteItem>();
  let paletteVersion = 0;
  let tool: ToolId = 'select';
  let itemKey: string | null = null;
  let snapSettings: SnapSettings = { ...DEFAULT_SNAP };
  let hover: { x: number; z: number } | null = null;
  let ghostYaw = 0;
  let ghost: GhostState | null = null;
  let selectedId: string | null = null;
  let lastAction: string | null = null;
  const counts = { placed: 0, removed: 0, moved: 0, rotated: 0 };

  const subscribers = new Set<(state: ToolsState) => void>();
  let digest = '';

  // ── The footprint table ───────────────────────────────────────────────────────────────────
  // Rebuilt when the world changes rather than per pointer move: a pointer move is 60 a second and
  // the demo park is several hundred entities.
  let obstacleList: Obstacle[] = [];
  let obstaclesDirty = true;

  // The palette is attached AFTER the table it invalidates: `attachPalette` calls its listener
  // synchronously for the packs that are already registered, and that listener writes
  // `obstaclesDirty` — declared with `let`, so reading it one line too early is a temporal-dead-zone
  // ReferenceError that takes the whole module down at boot. It did, on the first run
  // (`module "tools" failed to start`), and a green typecheck says nothing about it.
  const detachPalette = attachPalette(ctx.registry, () => {
    groups = buildPalette(ctx.registry);
    byKey = new Map();
    for (const group of groups) for (const item of group.items) byKey.set(item.key, item);
    paletteVersion += 1;
    obstaclesDirty = true;
    notify();
  });

  function rectFor(entity: Entity): Rect | null {
    const item = byKey.get(`${entity.pack}:${entity.item}`);
    if (!item?.footprint) return null;
    const scale = entity.scale ?? 1;
    return {
      x: entity.position[0],
      z: entity.position[2],
      yaw: entity.yaw,
      sizeX: item.footprint[0] * scale,
      sizeZ: item.footprint[1] * scale,
    };
  }

  function obstacles(): readonly Obstacle[] {
    if (!obstaclesDirty) return obstacleList;
    const out: Obstacle[] = [];
    for (const id in ctx.world.entities) {
      const rect = rectFor(ctx.world.entities[id]);
      if (rect) out.push({ id, rect });
    }
    obstacleList = out;
    obstaclesDirty = false;
    return obstacleList;
  }

  /** What a change to `id` may already be overlapping, so only NEW collisions are refused. */
  function ignoreSetFor(id: string | null): ReadonlySet<string> {
    const set = new Set<string>();
    if (!id) return set;
    set.add(id);
    const entity = ctx.world.entities[id];
    const rect = entity ? rectFor(entity) : null;
    if (!rect) return set;
    for (const obstacle of obstacles()) {
      if (obstacle.id === id) continue;
      if (rectsOverlap(rect, obstacle.rect, DEFAULT_PLACEMENT_RULES.margin)) set.add(obstacle.id);
    }
    return set;
  }

  // ── State plumbing ────────────────────────────────────────────────────────────────────────
  function state(): ToolsState {
    return {
      tool,
      itemKey,
      snap: { ...snapSettings },
      ghost: ghost ? { ...ghost, reasons: [...ghost.reasons] } : null,
      selected: selectedId,
      undoDepth: history.undoDepth(),
      redoDepth: history.redoDepth(),
      lastAction,
      paletteVersion,
    };
  }

  /**
   * Tell React only when something it draws has changed.
   *
   * The ghost's coordinates change on every pointer move and the build bar renders none of them —
   * it renders which tool is armed, whether the ghost is legal and why not. Without this digest the
   * HUD would re-render at pointer rate for a status line that says the same thing.
   */
  function notify(): void {
    const next = [
      tool,
      itemKey,
      snapSettings.enabled,
      snapSettings.grid,
      snapSettings.angle,
      selectedId,
      history.undoDepth(),
      history.redoDepth(),
      lastAction,
      paletteVersion,
      ghost ? (ghost.valid ? 'ok' : ghost.reasons.join('+')) : 'none',
      ghost?.blockedBy ?? '',
    ].join('|');
    if (next === digest) return;
    digest = next;
    const snapshot = state();
    for (const fn of subscribers) fn(snapshot);
  }

  function itemFor(key: string | null): PaletteItem | null {
    return findPaletteItem(groups, key);
  }

  /** The item the ghost is currently shaped like: the armed one, or the one being moved. */
  function ghostItem(): PaletteItem | null {
    if (tool === 'place') return itemFor(itemKey);
    if (tool === 'move' && selectedId) {
      const entity = ctx.world.entities[selectedId];
      return entity ? (byKey.get(`${entity.pack}:${entity.item}`) ?? null) : null;
    }
    return null;
  }

  function updateGhost(): void {
    const item = ghostItem();
    if (!item || !item.footprint || !hover) {
      ghost = null;
      rig.hideGhost();
      notify();
      return;
    }
    const [x, z] = snapSettings.enabled
      ? snapPoint(hover.x, hover.z, snapSettings.grid)
      : [hover.x, hover.z];
    const scale = tool === 'move' && selectedId ? (ctx.world.entities[selectedId]?.scale ?? 1) : 1;
    const rect: Rect = {
      x,
      z,
      yaw: ghostYaw,
      sizeX: item.footprint[0] * scale,
      sizeZ: item.footprint[1] * scale,
    };
    const verdict = evaluatePlacement({
      rect,
      parkHalf,
      ground,
      obstacles: obstacles(),
      ignore: tool === 'move' ? ignoreSetFor(selectedId) : undefined,
    });
    const reasons = item.available ? verdict.reasons : [...verdict.reasons, 'unavailable' as const];
    ghost = {
      position: [x, verdict.y, z],
      yaw: ghostYaw,
      footprint: [rect.sizeX, rect.sizeZ],
      height: item.height * scale,
      valid: verdict.ok && item.available,
      reasons,
      blockedBy: verdict.blockedBy,
    };
    rig.showGhost(ghost);
    notify();
  }

  function refreshSelectionMarker(): void {
    const entity = selectedId ? ctx.world.entities[selectedId] : null;
    const rect = entity ? rectFor(entity) : null;
    if (!entity || !rect) {
      rig.showSelection(null);
      return;
    }
    const item = byKey.get(`${entity.pack}:${entity.item}`);
    const [ex, , ez] = entity.position;
    rig.showSelection({
      position: [ex, ground.height(ex, ez), ez],
      yaw: entity.yaw,
      footprint: [rect.sizeX, rect.sizeZ],
      height: (item?.height ?? 2) * (entity.scale ?? 1),
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────────────────────
  function place(): string | null {
    const item = itemFor(itemKey);
    if (!item || !item.available || !ghost || !ghost.valid) {
      lastAction = 'tools.action.refused';
      notify();
      return null;
    }
    const id = nextEntityId(ctx.world, item.kind);
    const position: Vec3 = [ghost.position[0], ghost.position[1], ghost.position[2]];
    const entity: Entity = {
      id,
      kind: item.kind,
      pack: item.pack,
      item: item.item,
      position,
      yaw: ghost.yaw,
    };
    ctx.dispatch('entity:add', entity);
    const forward: Array<{ type: string; payload: unknown }> = [
      { type: 'entity:add', payload: entity },
    ];
    const backward: Array<{ type: string; payload: unknown }> = [
      { type: 'entity:remove', payload: { id } },
    ];
    // Building costs what the manifest says; undoing the build gets it back, to the cent. There is
    // no affordability gate here on purpose: whether a park may spend money it does not have is a
    // finance rule and belongs to `management`, which is a scaffold. See the report.
    if (item.cost > 0) {
      ctx.dispatch('finance:adjust', { cents: -item.cost });
      forward.push({ type: 'finance:adjust', payload: { cents: -item.cost } });
      backward.push({ type: 'finance:adjust', payload: { cents: item.cost } });
    }
    history.push({ label: 'tools.action.place', forward, backward });
    counts.placed += 1;
    lastAction = 'tools.action.place';
    ctx.events.emit('tool:placed', { id, key: item.key });
    notify();
    return id;
  }

  function moveSelection(): string | null {
    const id = selectedId;
    const previous = id ? ctx.world.entities[id] : null;
    if (!id || !previous || !ghost || !ghost.valid) {
      lastAction = 'tools.action.refused';
      notify();
      return null;
    }
    const before: Entity = { ...previous, position: [...previous.position] as Vec3 };
    const next: Entity = {
      ...previous,
      position: [ghost.position[0], ghost.position[1], ghost.position[2]],
      yaw: ghost.yaw,
    };
    ctx.dispatch('entity:update', next);
    history.push({
      label: 'tools.action.move',
      forward: [{ type: 'entity:update', payload: next }],
      backward: [{ type: 'entity:update', payload: before }],
    });
    counts.moved += 1;
    lastAction = 'tools.action.move';
    tool = 'select';
    hover = null;
    ghost = null;
    rig.hideGhost();
    ctx.events.emit('tool:moved', { id });
    refreshSelectionMarker();
    notify();
    return id;
  }

  function removeEntity(id: string): boolean {
    const entity = ctx.world.entities[id];
    if (!entity) return false;
    const copy: Entity = { ...entity, position: [...entity.position] as Vec3 };
    ctx.dispatch('entity:remove', { id });
    // A demolition moves no money, and neither does undoing one. A refund is a finance rule
    // (`management` owns it), and an undo that is not cash-neutral is a way of printing money:
    // delete, undo, delete, undo.
    history.push({
      label: 'tools.action.delete',
      forward: [{ type: 'entity:remove', payload: { id } }],
      backward: [{ type: 'entity:add', payload: copy }],
    });
    counts.removed += 1;
    lastAction = 'tools.action.delete';
    if (selectedId === id) selectedId = null;
    ctx.events.emit('tool:removed', { id });
    refreshSelectionMarker();
    notify();
    return true;
  }

  function rotateSelection(deltaDeg: number): boolean {
    const id = selectedId;
    const entity = id ? ctx.world.entities[id] : null;
    if (!id || !entity) return false;
    const item = byKey.get(`${entity.pack}:${entity.item}`);
    const yaw = snapSettings.enabled
      ? snapAngle(entity.yaw + (deltaDeg * Math.PI) / 180, snapSettings.angle)
      : wrapAngle(entity.yaw + (deltaDeg * Math.PI) / 180);
    if (item?.footprint) {
      const scale = entity.scale ?? 1;
      const verdict = evaluatePlacement({
        rect: {
          x: entity.position[0],
          z: entity.position[2],
          yaw,
          sizeX: item.footprint[0] * scale,
          sizeZ: item.footprint[1] * scale,
        },
        parkHalf,
        ground,
        obstacles: obstacles(),
        ignore: ignoreSetFor(id),
      });
      if (!verdict.ok) {
        lastAction = 'tools.action.refused';
        notify();
        return false;
      }
    }
    const before: Entity = { ...entity, position: [...entity.position] as Vec3 };
    const next: Entity = { ...entity, position: [...entity.position] as Vec3, yaw };
    ctx.dispatch('entity:update', next);
    history.push({
      label: 'tools.action.rotate',
      forward: [{ type: 'entity:update', payload: next }],
      backward: [{ type: 'entity:update', payload: before }],
    });
    counts.rotated += 1;
    lastAction = 'tools.action.rotate';
    refreshSelectionMarker();
    notify();
    return true;
  }

  // ── Input ─────────────────────────────────────────────────────────────────────────────────
  let press: { x: number; y: number } | null = null;

  const onPointerMove = (ev: PointerEvent) => {
    if (tool !== 'place' && tool !== 'move') return;
    api.hoverScreen(ev.clientX, ev.clientY);
  };

  const onPointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return;
    press = { x: ev.clientX, y: ev.clientY };
  };

  const onPointerUp = (ev: PointerEvent) => {
    if (ev.button !== 0 || !press) return;
    const travel = Math.hypot(ev.clientX - press.x, ev.clientY - press.y);
    press = null;
    if (travel > CLICK_SLOP_PX) return; // that was a camera pan
    handleClick(ev.clientX, ev.clientY);
  };

  const onPointerLeave = () => {
    press = null;
    if (tool === 'place' || tool === 'move') api.clearHover();
  };

  function handleClick(clientX: number, clientY: number): void {
    if (tool === 'place') {
      api.hoverScreen(clientX, clientY);
      place();
      return;
    }
    if (tool === 'move') {
      api.hoverScreen(clientX, clientY);
      moveSelection();
      return;
    }
    const point = camera?.screenToGround(clientX, clientY);
    if (!point) return;
    const hit = pickEntityAt(point[0], point[2], obstacles());
    if (tool === 'delete') {
      if (hit) removeEntity(hit);
      return;
    }
    api.select(hit);
  }

  const typing = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el?.tagName) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (typing(ev.target)) return;
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.code === 'KeyZ') {
      ev.preventDefault();
      if (ev.shiftKey) api.redo();
      else api.undo();
      return;
    }
    if (mod && ev.code === 'KeyY') {
      ev.preventDefault();
      api.redo();
      return;
    }
    if (mod) return;
    switch (ev.code) {
      case 'Escape':
        api.cancel();
        break;
      case 'KeyR':
        api.rotateBy(ev.shiftKey ? -ROTATE_STEP_DEG : ROTATE_STEP_DEG);
        break;
      case 'KeyG':
        api.setSnap({ enabled: !snapSettings.enabled });
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedId) {
          ev.preventDefault();
          api.deleteSelection();
        }
        break;
      default:
        break;
    }
  };

  canvas?.addEventListener('pointermove', onPointerMove);
  canvas?.addEventListener('pointerdown', onPointerDown);
  canvas?.addEventListener('pointerup', onPointerUp);
  canvas?.addEventListener('pointerleave', onPointerLeave);
  canvas?.addEventListener('pointercancel', onPointerLeave);
  const view = canvas?.ownerDocument?.defaultView ?? null;
  view?.addEventListener('keydown', onKeyDown);

  // ── The public API ────────────────────────────────────────────────────────────────────────
  const api: ToolsMainApi = {
    palette: () => groups,
    useTool(next, key) {
      if (next === 'place') {
        const item = itemFor(key ?? itemKey) ?? firstPlaceable(groups);
        if (!item || !item.available) return false;
        itemKey = item.key;
        tool = 'place';
        selectedId = null;
        refreshSelectionMarker();
        updateGhost();
        ctx.events.emit('tool:changed', { tool, itemKey });
        notify();
        return true;
      }
      if (next === 'move' && !selectedId) return false;
      tool = next;
      if (next !== 'move') {
        hover = null;
        ghost = null;
        rig.hideGhost();
      } else {
        // Enter `move` with the ghost already on the thing being moved, so the first frame shows
        // where it is rather than nothing until the pointer happens to travel.
        const entity = selectedId ? ctx.world.entities[selectedId] : null;
        if (entity) {
          ghostYaw = entity.yaw;
          hover = { x: entity.position[0], z: entity.position[2] };
        }
        updateGhost();
      }
      ctx.events.emit('tool:changed', { tool, itemKey });
      notify();
      return true;
    },
    activeTool: () => tool,
    activeItem: () => itemFor(itemKey),
    cancel() {
      if (tool !== 'select') {
        tool = 'select';
        hover = null;
        ghost = null;
        rig.hideGhost();
        ctx.events.emit('tool:changed', { tool, itemKey });
      } else {
        selectedId = null;
        refreshSelectionMarker();
      }
      lastAction = null;
      notify();
    },
    state,
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    snap: () => ({ ...snapSettings }),
    setSnap(patch) {
      snapSettings = { ...snapSettings, ...patch };
      if (snapSettings.enabled) ghostYaw = snapAngle(ghostYaw, snapSettings.angle);
      updateGhost();
      notify();
    },
    rotateBy(deltaDeg) {
      if (ghost) {
        ghostYaw = snapSettings.enabled
          ? snapAngle(ghostYaw + (deltaDeg * Math.PI) / 180, snapSettings.angle)
          : wrapAngle(ghostYaw + (deltaDeg * Math.PI) / 180);
        updateGhost();
        return true;
      }
      return rotateSelection(deltaDeg);
    },
    select(id) {
      selectedId = id && ctx.world.entities[id] ? id : null;
      refreshSelectionMarker();
      ctx.events.emit('tool:selected', { id: selectedId });
      notify();
    },
    selected: () => selectedId,
    deleteSelection() {
      return selectedId ? removeEntity(selectedId) : false;
    },
    hoverWorld(x, z) {
      hover = { x, z };
      updateGhost();
    },
    hoverScreen(clientX, clientY) {
      const point = camera?.screenToGround(clientX, clientY);
      if (!point) return;
      hover = { x: point[0], z: point[2] };
      updateGhost();
    },
    clearHover() {
      hover = null;
      updateGhost();
    },
    commit() {
      if (tool === 'place') return place();
      if (tool === 'move') return moveSelection();
      return null;
    },
    undo() {
      const entry = history.undo();
      if (!entry) return false;
      lastAction = 'tools.action.undo';
      if (selectedId && !ctx.world.entities[selectedId]) selectedId = null;
      refreshSelectionMarker();
      ctx.events.emit('tool:undo', { label: entry.label });
      notify();
      return true;
    },
    redo() {
      const entry = history.redo();
      if (!entry) return false;
      lastAction = 'tools.action.redo';
      if (selectedId && !ctx.world.entities[selectedId]) selectedId = null;
      refreshSelectionMarker();
      ctx.events.emit('tool:redo', { label: entry.label });
      notify();
      return true;
    },
    stats() {
      let items = 0;
      let unavailable = 0;
      for (const group of groups) {
        for (const item of group.items) {
          items += 1;
          if (!item.available) unavailable += 1;
        }
      }
      const census = rig.stats();
      return {
        tool,
        itemKey,
        paletteItems: items,
        paletteGroups: groups.length,
        unavailable,
        placed: counts.placed,
        removed: counts.removed,
        moved: counts.moved,
        rotated: counts.rotated,
        undoDepth: history.undoDepth(),
        redoDepth: history.redoDepth(),
        meshes: census.meshes,
        materials: census.materials,
      };
    },
  };

  return {
    api,
    onEntity(change: EntityChange) {
      obstaclesDirty = true;
      if (change.type === 'remove' && change.entity.id === selectedId) {
        selectedId = null;
        rig.showSelection(null);
        notify();
      } else if (change.type === 'update' && change.entity.id === selectedId) {
        refreshSelectionMarker();
      }
    },
    dispose() {
      canvas?.removeEventListener('pointermove', onPointerMove);
      canvas?.removeEventListener('pointerdown', onPointerDown);
      canvas?.removeEventListener('pointerup', onPointerUp);
      canvas?.removeEventListener('pointerleave', onPointerLeave);
      canvas?.removeEventListener('pointercancel', onPointerLeave);
      view?.removeEventListener('keydown', onKeyDown);
      detachPalette();
      subscribers.clear();
      history.clear();
      rig.dispose();
    },
  };
}
