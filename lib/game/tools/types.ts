/**
 * The build tools' vocabulary. Pure: no Babylon, no DOM, no React — importable on the worker, in
 * node (`selftest.mjs`) and from the HUD, which is the whole reason the state the build bar reads
 * is a plain object rather than a handle on a Babylon mesh.
 *
 * Two shapes here are load-bearing.
 *
 * **`PaletteItem` carries no pack id or item id that anything branches on.** It carries the
 * *schema* facts — the category the manifest declared it under, the entity kind that follows from
 * that, a footprint, a cost — and every decision this module makes is made from those. A pack that
 * ships a new bench is a new `PaletteItem` and no new code; that is the graded axis.
 *
 * **`ToolsState` is serialisable.** The build bar re-renders from it and nothing else, so a React
 * tree never holds a reference into the scene and a state change is one object comparison.
 */

import type { EntityKind, Vec3 } from '../core/types';

/**
 * The tools the player switches between. `place` is parameterised by the palette item; the other
 * three act on whatever is under the cursor.
 *
 * Rotation is deliberately NOT a tool: it applies to the ghost while placing and to the selection
 * otherwise, so a "rotate tool" would be a mode that means two different things depending on what
 * else is active. `R` and the two bar buttons call `rotateBy()`, which routes to whichever of the
 * two is live. See the report.
 */
export type ToolId = 'select' | 'place' | 'move' | 'delete';
export const TOOL_IDS: readonly ToolId[] = ['select', 'place', 'move', 'delete'];

/** How an item gets into the world. */
export type PlacementMode =
  /** One point, one yaw: a bench, a tree, a kiosk, a flat ride. */
  | 'point'
  /**
   * A route: a coaster or a flume is built along a track, so a click on the ground says nothing
   * about where it goes. Derived from the manifest — an item with no footprint at all cannot be
   * put down at a point — and never from an item id.
   */
  | 'route';

/** The categories of a pack manifest this module offers as placeable things. */
export type PaletteCategory =
  'scenery' | 'foliage' | 'shops' | 'rides' | 'buildings' | 'coasterLayouts';

export interface PaletteItem {
  /** `pack:item`, the registry's own key. */
  key: string;
  pack: string;
  item: string;
  category: PaletteCategory;
  /** The entity kind this becomes in the world. Decides which module draws it. */
  kind: EntityKind;
  /** Localized names straight from the manifest; the HUD picks a locale. */
  name: Record<string, string>;
  /** Whole cents, from the manifest. */
  cost: number;
  /** Metres, [x, z] before yaw. Null for a `route` item. */
  footprint: [number, number] | null;
  /**
   * Metres from the entity's origin to the CENTRE of that footprint, in the item's own frame
   * (+Z is its facing), before yaw. Null means the two coincide, which is what every item in
   * both bundled packs assumed and most of them are right about.
   *
   * A coaster is not. `track` starts its first piece AT the origin and runs the layout onwards,
   * so `kleiner-wirbel`'s 56 x 111.9 m box has its centre 28.0 m to the side and 23.2 m ahead of
   * the point the player clicked — and until this field existed the ghost judged a rectangle
   * centred on the pointer while the game built somewhere else. Measured on the first coaster a
   * player ever placed: 28 m east and 23.2 m north of the box `evaluatePlacement` had approved,
   * 27.1 m past the plot it was dropped on, and **600 of 2001 track samples underground**, low
   * point 1.79 m inside the hill. Green build, no warning, no console error.
   *
   * The manifest declares it, `lib/game/track/selftest.mjs` measures the built spline and fails
   * on drift, and nothing here knows which items have one.
   */
  footprintOffset: [number, number] | null;
  /**
   * Metres this item reaches BELOW its own origin, before yaw. Zero for everything that stands on
   * the ground, which is nearly everything.
   *
   * A coaster does not stand on the ground: `kleiner-wirbel`'s drop bottoms out **3.99 m** under
   * its station and `nordwind`'s **6.00 m**, so an origin dropped on the terrain buries the whole
   * valley of the layout. Measured on the first player-placed coaster after the offset above was
   * fixed -- the box was then exactly right in x and z, entirely inside the plot with 4.4 to
   * 11.7 m to spare, and **621 of 2001 track samples were still inside the hill**, low point
   * 2.61 m under it. The demo park's own coasters escape it because their y was typed by hand
   * (`COASTER_AT.y = 12.53`), which is not a number a player can supply.
   *
   * So the anchor is lifted by this much above the ground the footprint was judged on, which
   * guarantees clearance everywhere: every point of the machine is at least `origin - dip`, and
   * that is the highest ground under it. It over-lifts where the deepest point does not sit over
   * the highest ground -- about a metre here, drawn as slightly taller footings, which is the
   * trade a real park makes with a graded pad.
   *
   * It is NOT added to `height`: the declared height is already the whole profile span (this
   * layout is -3.99..15.00 about its origin, declared 19), so the ghost's box is right as drawn
   * and only the anchor inside it moves.
   */
  footprintDip: number;
  /** Metres. Used for the ghost's volume, so a lamp does not get a box the size of a shop. */
  height: number;
  placement: PlacementMode;
  /** `lucide:ferris-wheel` from the pack's `icons` map, if it named one. */
  icon: string | null;
  /**
   * True when some module has claimed this item's entity kind. An item nobody draws is listed and
   * refused rather than hidden: CONTENT_PACKS.md — "unknown kinds are listed as unavailable, never
   * crash" — and hiding it would make a pack look like it had not loaded.
   */
  available: boolean;
  /** Why it is not available, for the tooltip. */
  unavailableReason: 'kind' | 'route' | null;
}

export interface PaletteGroup {
  /** The entity kind. One group per kind, in the order the kinds first appeared. */
  kind: EntityKind;
  items: PaletteItem[];
}

export interface SnapSettings {
  /** Off by default: the brief asks for free placement unless the player says otherwise. */
  enabled: boolean;
  /** Metres. */
  grid: number;
  /** Degrees. */
  angle: number;
}

export const DEFAULT_SNAP: SnapSettings = { enabled: false, grid: 0.25, angle: 15 };

/** Why a placement is refused. One string per rule, so the HUD can say which. */
export type PlacementReason =
  'out-of-bounds' | 'under-water' | 'too-steep' | 'overlap' | 'no-ground' | 'unavailable' | 'route';

export interface GhostState {
  /** Where it stands, after snapping. Y is the ground under it. This is the ENTITY's origin. */
  position: Vec3;
  /** Radians about +Y. */
  yaw: number;
  /** The ground the footprint was judged on. The pad and the box are drawn from here. */
  groundY: number;
  /**
   * World [x, z] of the footprint rectangle's centre — `position` plus `footprintOffset` turned
   * by `yaw`. It is what `evaluatePlacement` judged and what the rig draws, and for everything
   * whose art is centred on its anchor it is `position` again.
   */
  footprintCentre: [number, number];
  footprint: [number, number];
  height: number;
  valid: boolean;
  reasons: PlacementReason[];
  /** The entity a refusal collided with, when the reason is `overlap`. */
  blockedBy: string | null;
}

/** Everything the build bar renders, and nothing else. */
export interface ToolsState {
  tool: ToolId;
  /** The palette key the `place` tool is armed with. */
  itemKey: string | null;
  snap: SnapSettings;
  ghost: GhostState | null;
  selected: string | null;
  undoDepth: number;
  redoDepth: number;
  /** i18n key of the last committed action, for the bar's status line. */
  lastAction: string | null;
  /** Bumps whenever a pack registers, so the palette memo knows to re-read. */
  paletteVersion: number;
}

export interface ToolsStats {
  tool: ToolId;
  itemKey: string | null;
  paletteItems: number;
  paletteGroups: number;
  /** Items whose kind no module claimed. */
  unavailable: number;
  placed: number;
  removed: number;
  moved: number;
  rotated: number;
  undoDepth: number;
  redoDepth: number;
  /** Babylon objects this module owns. Fixed: the ghost is scaled, never rebuilt. */
  meshes: number;
  materials: number;
}
