/**
 * `/game?showcase=paths` — a piece of park that has to answer for the whole module.
 *
 * It is laid out around the three camera presets core falls back to, because a showcase that
 * stages only the origin gives two of them an empty field: `overview` looks at (0, 8, 0) from
 * 340 m, `close` at (0, 2, 0) from 40 m — the plaza — and `ground` stands at (0, 1.7, 120), which
 * is why the four-way junction of the avenue and the boulevard is put at exactly z = 118. A
 * visitor's-eye view of a crossing is the one frame that shows whether the kerbs stop where they
 * should, so it gets the preset that is nearest the ground.
 *
 * Five things are deliberately in frame: a **right-angle** crossing (avenue × boulevard), an
 * **oblique** one at about 50° (the paver walk at z ≈ 150, where a perpendicular cut would leave a
 * visible wedge), a path **running into a plaza**, a **queue** with its stanchions and belts, and
 * four different styles meeting — every one of them from a manifest entry.
 *
 * The terrain is sculpted here rather than left flat. A showcase world arrives from `createWorld`
 * with every height at zero, and a path that conforms to nothing proves nothing: the relief is
 * gentle (±4 m) and deliberately runs ACROSS the avenue, so the kerb's skirt has a cross slope to
 * cover.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, TerrainData } from '../core/types';
import type { PathsMainApi } from './main';

export async function stagePathsShowcase(ctx: MainContext): Promise<void> {
  sculpt(ctx.world.terrain as TerrainData);
  ctx.events.emit('terrain:changed', { rect: null });

  const paths = ctx.module<PathsMainApi>('paths');
  if (!paths) {
    console.warn('[game/paths] showcase: the paths module has no api');
    return;
  }

  // The main plaza. An octagon rather than a square: the ear-clipper and the kerb walk both have
  // to cope with a ring that is not axis-aligned, and a square would not have shown that.
  paths.create({ form: 'plaza', style: 'pavers', points: octagon(0, 0, 27) });

  // The grand avenue, gate to plaza. Eight metres, with a slight bend so it is a spline and not a
  // ruler; the bend sits south of the junction so the crossing itself is straight.
  paths.create({
    form: 'path',
    style: 'promenade',
    width: 8,
    entrance: true,
    points: [0, 178, 2, 160, -3, 140, 0, 118, 0, 92, 0, 60, 0, 20],
  });

  // The east–west boulevard, crossing the avenue square-on at z = 118.
  paths.create({
    form: 'path',
    style: 'promenade',
    width: 6,
    points: [-96, 104, -58, 112, -22, 117, 0, 118, 26, 119, 62, 126, 94, 138],
  });

  // An oblique crossing: this one meets the avenue at about 50 degrees, which is where a cut made
  // perpendicular to the centreline leaves a wedge of missing surface on one side.
  paths.create({
    form: 'path',
    style: 'pavers',
    width: 4,
    points: [-64, 178, -40, 166, -16, 156, 12, 145, 40, 136, 70, 130],
  });

  // A service road running down the west side and over the boulevard.
  paths.create({
    form: 'path',
    style: 'service-road',
    width: 6,
    points: [-118, 176, -104, 148, -92, 118, -80, 86, -70, 58],
  });

  // North of the plaza, a granite street climbing the rise.
  paths.create({
    form: 'path',
    style: 'cobble',
    width: 6,
    points: [0, -20, -4, -44, -14, -68, -30, -88, -52, -100],
  });

  // A boardwalk curling east out of the plaza and down towards the low ground.
  paths.create({
    form: 'path',
    style: 'boardwalk',
    width: 4,
    points: [20, 2, 48, 10, 72, 26, 88, 50, 92, 78],
  });

  // The queue: a switchback west of the plaza, ending at a station apron. `rideId` is a binding,
  // not a lookup — nothing in this module resolves it, and the rides module owns what it points at.
  paths.create({
    form: 'queue',
    style: 'queue-line',
    width: 2,
    rideId: 'showcase-ride',
    points: [
      -30, 14, -44, 16, -58, 14, -58, 6, -44, 4, -30, 2, -30, -6, -44, -8, -58, -10, -68, -14, -76,
      -20,
    ],
  });
  paths.create({ form: 'plaza', style: 'promenade', points: rectangle(-92, -28, 22, 16) });

  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.6;
    camera.beta = 1.12;
    camera.radius = 210;
    camera.target.set(0, 2, 70);
  }
}

function octagon(cx: number, cz: number, r: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    out.push(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
  }
  return out;
}

function rectangle(cx: number, cz: number, w: number, h: number): number[] {
  return [
    cx - w / 2,
    cz - h / 2,
    cx + w / 2,
    cz - h / 2,
    cx + w / 2,
    cz + h / 2,
    cx - w / 2,
    cz + h / 2,
  ];
}

/**
 * Gentle relief, written straight into the heightfield.
 *
 * Core stages the showcase after the main handles exist and before the worker is started, so this
 * reaches the simulation's copy of the terrain too — the same trick the terrain module's own
 * showcase uses, and the reason the graph's node heights agree with the drawn ones.
 */
function sculpt(terrain: TerrainData): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      // A rise to the north the cobble street climbs, a shallow dip under the boardwalk in the
      // east, and a cross slope over the avenue so the kerb has a real gradient to sit on.
      const rise = 4.2 * Math.exp(-((x + 60) ** 2 + (z + 130) ** 2) / (2 * 95 * 95));
      const dip = -2.6 * Math.exp(-((x - 96) ** 2 + (z - 70) ** 2) / (2 * 60 * 60));
      const cross = Math.sin((z + 40) / 78) * Math.cos((x - 30) / 96) * 1.5;
      const roll = Math.sin(x / 130 + 1.1) * Math.cos(z / 150) * 0.9;
      terrain.heights[j * w + i] = rise + dip + cross + roll;
    }
  }
  terrain.waterLevel = -40;
}
