/**
 * `/game?showcase=shops` — a shopping street that has to answer for the whole module.
 *
 * It stages **every registered shop item**, not a chosen three: twelve entities across two packs
 * and five massings, so a style that fails to build is a hole in a screenshot rather than a thing
 * nobody looks at. The layout is built around the three camera presets core falls back to, because
 * they are what every screenshot of this game is taken through:
 *
 *   `ground`   (0, 1.7, 120) looking north — the visitor's eye. The food kiosks are at z = 96–132
 *              on both sides of the street, so this frame is a queue at a counter and nothing else.
 *   `close`    (0, 2, 0) from ~40 m — the market square, where the round pavilions and the retail
 *              unit stand round a plaza and the frame has to survive being looked at from 12 m.
 *   `overview` 340 m out — the whole street, which is where the roofs and the signage have to keep
 *              a silhouette.
 *
 * **They are placed as ENTITIES, never by calling the api.** `ctx.dispatch('entity:add', …)` is
 * what a build tool would do, and it exercises the whole path: core mirrors the command into
 * `world.entities` and announces it to every main handle, and the worker replays it when it starts,
 * so the sim half indexes the same twelve shops the renderer drew. Calling into `main` directly
 * would draw twelve shops the simulation had never heard of, which is the trap `track/showcase.ts`
 * records.
 *
 * The terrain is sculpted rather than left flat: a showcase world arrives from `createWorld` with
 * every height at zero, and an apron on a plane proves nothing about the skirt that stops a shop
 * floating on a slope. The relief runs ACROSS the street, so the two sides sit at different levels.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { Entity, MainContext, TerrainData } from '../core/types';
import { nextEntityId } from '../core/world';
import { LAYER_CONCRETE, LAYER_GRASS } from '../terrain';

interface PathsLike {
  create(spec: {
    form: 'path' | 'plaza' | 'queue';
    style: string;
    points: number[];
    width?: number;
    entrance?: boolean;
  }): string;
}

/**
 * Where each shop stands, in the order the registry hands them back.
 *
 * `side` is which flank of the street; the yaw is derived from it so a shop always faces the
 * paving. A shop on the west side faces +x, which is `yaw = π/2` under this game's convention
 * (`facing = [sin yaw, cos yaw]`).
 */
const SLOTS: Array<{ z: number; side: -1 | 1 }> = [
  { z: 132, side: -1 },
  { z: 132, side: 1 },
  { z: 114, side: -1 },
  { z: 114, side: 1 },
  { z: 96, side: -1 },
  { z: 96, side: 1 },
  { z: 62, side: -1 },
  { z: 62, side: 1 },
  { z: 26, side: -1 },
  { z: 26, side: 1 },
  { z: -18, side: -1 },
  { z: -18, side: 1 },
  { z: -40, side: -1 },
  { z: -40, side: 1 },
];
/**
 * Metres from the street centreline to a shop's frontage point.
 *
 * 7.4, arrived at by rendering 10.5 and then 8.6 and looking: the apron reaches `style.apron`
 * (1.8–4.5 m) forward of the frontage point, so at 10.5 every shop's hard standing stopped four
 * metres short of the 8 m walk and sat in a lawn like a helipad, and at 8.6 it still missed by two.
 * At 7.4 the kiosks' aprons run under the promenade's kerb and the small ones stop a metre short,
 * which is a forecourt rather than an island. It also puts the queue — which forms 3.2 m out from
 * the frontage point, see `frontSetback` — on the edge of the paving, where a queue belongs.
 */
const OFFSET = 7.4;

export async function stageShopsShowcase(ctx: MainContext): Promise<void> {
  sculpt(ctx.world.terrain as TerrainData);
  ctx.events.emit('terrain:changed', { rect: null });

  const paths = ctx.module<PathsLike>('paths');
  if (paths) {
    paths.create({
      form: 'path',
      style: 'promenade',
      width: 8,
      entrance: true,
      points: [0, 176, 0, 152, 0, 128, 0, 104, 0, 80, 0, 52, 0, 24],
    });
    paths.create({ form: 'plaza', style: 'pavers', points: polygon(0, 0, 24, 12) });
    paths.create({
      form: 'path',
      style: 'promenade',
      width: 6,
      points: [0, -24, 0, -40, 0, -56],
    });
  } else {
    console.warn('[game/shops] showcase: no paths module — the street will be missing');
  }

  const items = ctx.registry.items('shops');
  if (!items.length) {
    console.warn('[game/shops] showcase: no pack declares any shops');
    return;
  }
  items.forEach((item, i) => {
    const slot = SLOTS[i % SLOTS.length];
    const x = slot.side * OFFSET;
    const entity: Entity = {
      id: nextEntityId(ctx.world, 'shop'),
      kind: 'shop',
      pack: item.pack,
      item: (item.def as { id: string }).id,
      // Y is left at 0 so the renderer samples the terrain, which is the path a build tool that
      // has not sampled it takes and therefore the one worth exercising.
      position: [x, 0, slot.z],
      yaw: slot.side < 0 ? Math.PI / 2 : -Math.PI / 2,
    };
    ctx.dispatch('entity:add', entity);
  });

  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.35;
    camera.beta = 1.15;
    camera.radius = 76;
    camera.target.set(0, 2.4, 104);
  }
}

function polygon(cx: number, cz: number, r: number, corners: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < corners; i++) {
    const a = (i / corners) * Math.PI * 2 + Math.PI / corners;
    out.push(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
  }
  return out;
}

/**
 * Gentle relief written straight into the heightfield, plus a paint layer under the street.
 *
 * Core stages the showcase after the main handles exist and before the worker is started, so this
 * reaches the simulation's copy of the terrain too — the same trick `paths` and `terrain` use, and
 * the reason the graph's node heights agree with the drawn ones.
 *
 * The cross slope is deliberate and is about 1 in 45 at the street: every shop's apron is a flat
 * slab, so one corner of it is always below grade and the skirt has to cover the difference.
 */
function sculpt(terrain: TerrainData): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      const fall = (170 - z) * 0.008;
      const cross = x * 0.022;
      const roll = Math.sin(z / 61 + 0.6) * Math.cos(x / 88) * 0.7;
      const rise = 6.5 * Math.exp(-((x + 90) ** 2 + (z + 80) ** 2) / (2 * 80 * 80));
      terrain.heights[j * w + i] = fall + cross + roll + rise;
    }
  }
  // Concrete under the street corridor ONLY — six metres either side of an eight-metre walk, which
  // is the paving plus its kerb. The first version painted twenty metres each way "so the shops do
  // not stand on a lawn", and the `ground` frame came back as a forty-metre car park with six huts
  // scattered on it. Each shop lays its own hard standing (`apron` in `build.ts`); the ground
  // between them is grass, which is what it is in a park.
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + ((i + 0.5) / n) * terrain.size;
      const z = -half + ((j + 0.5) / n) * terrain.size;
      const onStreet = Math.abs(x) < 6 && z > -60 && z < 180;
      terrain.paint[j * n + i] = onStreet ? LAYER_CONCRETE : LAYER_GRASS;
    }
  }
  terrain.waterLevel = -60;
}
