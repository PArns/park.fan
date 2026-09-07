/**
 * `/game?showcase=tools` — a build site, staged so every claim this module makes is in a frame.
 *
 * Nothing here places an entity by hand. Every object in the picture went down through
 * `api.hoverWorld()` + `api.commit()`, which is the same pair a click calls, so a frame arriving at
 * all is the tool working end to end: the palette resolved an item from the registry, the placement
 * rules accepted the spot, `entity:add` went through core, and the module that owns the kind drew
 * it. Two of them are then moved and rotated, and one is deleted and undone, so the history is
 * exercised before the camera looks at it.
 *
 * The terrain is deliberately unkind: a slope across the middle and a pond, because a validity
 * colour has to have something to refuse. Three ghosts are left standing at the end —
 *
 *   the **green** one on level ground west of the plaza, legal;
 *   the **red** one in the pond, `under-water`;
 *   the **red** one overlapping a placed kiosk, `overlap`
 *
 * — by parking the tool over each in turn. Only the last one survives to the screenshot (there is
 * one ghost), so the showcase leaves the pond one up: `?showcase=tools&ghost=ok|water|overlap`
 * picks which, and the report has all three.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, TerrainData } from '../core/types';
import type { ToolsMainApi } from './main';
import type { PaletteItem } from './types';

interface PathsLike {
  create(spec: {
    form: 'path' | 'plaza' | 'queue';
    style: string;
    points: number[];
    width?: number;
    entrance?: boolean;
  }): string;
}

/** Where the staged items stand, in the order the palette hands them back. */
const SLOTS: Array<[number, number]> = [
  [-9, 14],
  [-9, 6],
  [-9, -2],
  [-9, -10],
  [9, 14],
  [9, 6],
  [9, -2],
  [9, -10],
  [-19, 10],
  [-19, 0],
  [19, 10],
  [19, 0],
];

export async function stageToolsShowcase(ctx: MainContext): Promise<void> {
  sculpt(ctx.world.terrain as TerrainData);
  ctx.events.emit('terrain:changed', { rect: null });

  const paths = ctx.module<PathsLike>('paths');
  paths?.create({
    form: 'path',
    style: 'promenade',
    width: 8,
    points: [0, 40, 0, 20, 0, 0, 0, -20, 0, -40],
  });

  const api = ctx.module<ToolsMainApi>('tools');
  if (!api) {
    console.warn('[game/tools] showcase: the tools module has no api');
    return;
  }

  // Six from each group that can actually be placed, so the frame shows what the palette is made
  // of rather than twelve copies of the first thing in it.
  const groups = api.palette();
  const chosen: PaletteItem[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      if (!item.available) continue;
      chosen.push(item);
      if (chosen.length % 6 === 0) break;
    }
  }
  const staged = chosen.slice(0, SLOTS.length);
  let movedId: string | null = null;

  staged.forEach((item, i) => {
    const [x, z] = SLOTS[i];
    api.useTool('place', item.key);
    // Face the walk: west side turns east, east side turns west.
    api.rotateBy(x < 0 ? 90 : -90);
    api.hoverWorld(x, z);
    const id = api.commit();
    if (!id) console.warn(`[game/tools] showcase: ${item.key} was refused at ${x}, ${z}`);
  });

  // The history, driven rather than described: place one more, delete it, undo the delete, then
  // move and rotate it. What ends up in the frame is the moved copy, and `stats()` reports 2 moves
  // and 1 rotation against 1 removal that was undone.
  const first = staged[0];
  if (first) {
    api.useTool('place', first.key);
    api.hoverWorld(0, -34);
    const id = api.commit();
    if (id) {
      movedId = id;
      api.select(id);
      api.deleteSelection();
      api.undo();
      api.select(id);
      api.useTool('move');
      api.hoverWorld(-6, -30);
      api.commit();
      api.select(id);
      api.rotateBy(45);
    }
  }

  // Leave a ghost standing for the camera. `?ghost=` picks which of the three states.
  const wanted = ctx.query.get('ghost') ?? 'water';
  const ghostItem = staged.find((item) => (item.footprint?.[0] ?? 0) >= 3) ?? staged[0];
  if (ghostItem) {
    api.useTool('place', ghostItem.key);
    api.setSnap({ enabled: true });
    if (wanted === 'ok') api.hoverWorld(-3, -6);
    else if (wanted === 'overlap') api.hoverWorld(SLOTS[0][0] + 1, SLOTS[0][1] + 1);
    else api.hoverWorld(30, -30);
    // Selection and ghost are independent, so the frame can carry both: the blue marker is on the
    // thing that was moved and turned, the coloured box is where the next one would go.
    if (movedId) api.select(movedId);
  }

  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.6;
    camera.beta = 1.16;
    camera.radius = 78;
    camera.target.set(0, 1.5, 0);
  }
}

/**
 * A cross slope, a shelf and a pond.
 *
 * The pond is what makes `under-water` photographable, and the slope is what makes `too-steep` a
 * real refusal rather than a rule nobody can trip: the bank of the pond falls about 1 in 3, which
 * no footprint in either bundled pack may stand on.
 */
function sculpt(terrain: TerrainData): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      const roll = Math.sin(z / 55) * Math.cos(x / 70) * 0.8;
      const cross = x * 0.01;
      // The pond, south-east of the plaza.
      const d = Math.hypot(x - 30, z + 30);
      const basin = d < 18 ? -3.4 * Math.cos((Math.min(d, 18) / 18) * (Math.PI / 2)) : 0;
      terrain.heights[j * w + i] = roll + cross + basin;
    }
  }
  terrain.waterLevel = -1.2;
}
