/**
 * `/game?showcase=scenery` — a dressed corner of a park.
 *
 * The three fallback camera presets in `core/host.ts` are fixed, so the layout is built around
 * where they actually point rather than around a nice composition that none of them frames:
 *
 *   `overview` sits at (156, 136, −270) looking at the origin — it has to read as a laid-out park,
 *              so the path runs the long way up +Z and the tree stands sit off it in clumps.
 *   `close`    sits at (27, 10, −27) looking at (0, 2, 0) — the fountain plaza is at the origin,
 *              with the benches, bins, lamps and planters a visitor would actually walk past.
 *   `ground`   stands at (0, 2.2, 132) looking down −Z at eye level — so the entrance arch spans
 *              the path at z = 125 and the avenue recedes through it.
 *
 * The path is painted through the terrain module's own `brush` api rather than by writing into
 * `world.terrain.paint`: the paths module is a scaffold in this branch, and a painted concrete
 * strip is the honest stand-in — it goes through the same command the sculpt tool sends, so the
 * simulation's copy of the heightmap agrees with the picture, and the scatter reads it as ground
 * nothing may grow on.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext } from '../core/types';
import type { SceneryMainApi } from './main';

/** `LAYER_CONCRETE` from `terrain/heightfield.ts`. */
const PAINT_CONCRETE = 5;
/** `LAYER_MEADOW` — the flower-rich grass the scatter thickens on. */
const PAINT_MEADOW = 4;

interface TerrainBrush {
  brush(stroke: {
    shape: 'raise' | 'lower' | 'smooth' | 'flatten' | 'paint';
    x: number;
    z: number;
    radius: number;
    strength: number;
    falloff?: number;
  }): void;
}

export async function stageSceneryShowcase(ctx: MainContext): Promise<void> {
  const api = ctx.module<SceneryMainApi>('scenery');
  if (!api) return;
  const terrain = ctx.module<TerrainBrush>('terrain');

  // ── The ground: a path north–south through a plaza, and two meadow patches ────────────────
  if (terrain) {
    for (let z = -60; z <= 152; z += 3) {
      terrain.brush({ shape: 'paint', x: 0, z, radius: 2.4, strength: PAINT_CONCRETE });
    }
    // The plaza at the origin — the `close` preset's subject.
    for (let r = 2; r <= 10; r += 2) {
      const steps = Math.max(8, Math.round((Math.PI * 2 * r) / 2.5));
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        terrain.brush({
          shape: 'paint',
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          radius: 2.2,
          strength: PAINT_CONCRETE,
        });
      }
    }
    for (const patch of [
      [-44, 46],
      [40, 84],
      [-38, 128],
    ] as Array<[number, number]>) {
      terrain.brush({
        shape: 'paint',
        x: patch[0],
        z: patch[1],
        radius: 16,
        strength: PAINT_MEADOW,
      });
    }
  }

  // ── Landscape dressing first, so placed props can push it out of their footprint ──────────
  // (`dress` re-runs the exclusion test against everything placed so far, so it is called again
  // at the end; this first pass is what the tree stands are read against.)

  // ── The plaza ────────────────────────────────────────────────────────────────────────────
  api.place('core-classic:fountain-tier', 0, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const r = 7.6;
    // Benches face the fountain: yaw is the direction from the bench towards the centre.
    api.place('core-classic:bench-wood', Math.cos(a) * r, Math.sin(a) * r, {
      yaw: Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI / 2,
    });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    api.place('core-classic:lamp-victorian', Math.cos(a) * 10.5, Math.sin(a) * 10.5);
    api.place('core-classic:planter-round', Math.cos(a + 0.5) * 12.5, Math.sin(a + 0.5) * 12.5);
  }
  api.place('core-classic:bin-green', 6.4, -6.4);
  api.place('core-classic:bin-green', -6.4, 6.4);

  // ── The avenue north of the plaza, up to the arch ─────────────────────────────────────────
  for (let z = 22; z <= 118; z += 16) {
    const side = ((z / 16) | 0) % 2 === 0 ? -1 : 1;
    api.place('core-classic:lamp-victorian', side * 3.4, z);
    if (side > 0) api.place('core-classic:bench-wood', -3.6, z + 6, { yaw: Math.PI / 2 });
    else api.place('core-classic:bench-wood', 3.6, z + 6, { yaw: -Math.PI / 2 });
  }
  api.place('core-classic:bin-green', 3.6, 30);
  api.place('core-classic:bin-green', -3.6, 78);
  api.place('core-classic:bin-green', 3.6, 110);

  // A run of iron railings along one side and a clipped hedge along the other: the two things
  // that make a path read as a path rather than as a stripe of concrete.
  api.placeLine('core-classic:fence-iron', [4.4, 30], [4.4, 66], { facing: 'along' });
  api.placeLine('core-classic:hedge-box', [-4.4, 40], [-4.4, 74], { facing: 'along' });
  api.placeLine('core-classic:fence-iron', [-4.4, 88], [-4.4, 116], { facing: 'along' });

  // ── The entrance arch, framed by the `ground` preset ──────────────────────────────────────
  api.place('core-classic:sign-entrance', 0, 125, { yaw: 0 });
  api.place('core-classic:flag-parkfan', -7.5, 125.5);
  api.place('core-classic:flag-parkfan', 7.5, 125.5);
  api.place('core-classic:planter-round', -8.6, 121);
  api.place('core-classic:planter-round', 8.6, 121);
  api.place('core-classic:lamp-victorian', -3.6, 132);
  api.place('core-classic:lamp-victorian', 3.6, 132);

  // ── South of the plaza: a quieter stretch with a bench, a bin and a lamp ──────────────────
  for (let z = -18; z >= -52; z -= 17) {
    api.place('core-classic:lamp-victorian', 3.4, z);
    api.place('core-classic:bench-wood', -3.6, z - 4, { yaw: Math.PI / 2 });
  }
  api.place('core-classic:bin-green', -3.6, -20);

  // ── Tree stands ──────────────────────────────────────────────────────────────────────────
  // Deliberately clumps of one species with a second mixed in, not a uniform sprinkle: a copse is
  // how planting actually looks, and it is also what makes the per-instance scale variation read.
  const stands: Array<{ key: string; x: number; z: number; r: number; n: number; mix?: string }> = [
    { key: 'core-classic:oak', x: -26, z: 14, r: 13, n: 7, mix: 'core-classic:linden' },
    { key: 'core-classic:linden', x: 24, z: 34, r: 11, n: 6 },
    { key: 'core-classic:spruce', x: -32, z: 62, r: 14, n: 9 },
    { key: 'core-classic:oak', x: 30, z: 74, r: 15, n: 8, mix: 'core-classic:spruce' },
    { key: 'core-classic:linden', x: -24, z: 104, r: 12, n: 6 },
    { key: 'core-classic:spruce', x: 28, z: 116, r: 13, n: 7 },
    { key: 'core-classic:oak', x: -20, z: -30, r: 12, n: 5 },
  ];
  for (const stand of stands) {
    const spec = api.spec(stand.key);
    const mixSpec = stand.mix ? api.spec(stand.mix) : undefined;
    if (!spec) continue;
    api.scatterBrush(stand.key, stand.x, stand.z, stand.r, {
      density: (stand.n / (Math.PI * stand.r * stand.r)) * 100,
      max: stand.n,
      mix: mixSpec
        ? [
            { spec, weight: 3 },
            { spec: mixSpec, weight: 1 },
          ]
        : undefined,
    });
  }
  // Shrubs and flower beds where the path meets the grass.
  for (const z of [12, 48, 92, 130, -24]) {
    api.scatterBrush('core-classic:shrub-round', 6.5, z, 4, { density: 22, max: 7 });
    api.scatterBrush('core-classic:flowerbed', -6.5, z + 6, 3.5, { density: 40, max: 9 });
  }

  // ── Dress the landscape ──────────────────────────────────────────────────────────────────
  const placed = api.dress({
    bounds: [-120, -80, 120, 168],
    density: 1,
    woodland: ['core-classic:oak', 'core-classic:linden', 'core-classic:spruce'],
  });
  void placed;

  // A default framing for somebody opening the page by hand. The harness replaces it with the
  // three presets above, which this layout is built around.
  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.6;
    camera.beta = 1.19;
    camera.radius = 78;
    camera.target.set(0, 3, 22);
  }
}
