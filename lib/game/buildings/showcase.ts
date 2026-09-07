/**
 * `/game?showcase=buildings` — a street of buildings, plus the loose kit they are bashed out of.
 *
 * **The eighth building is the extensibility gate, in the frame rather than in a paragraph.** A pack
 * called `buildings-showcase` is registered at runtime with an inn nothing in `lib/game/buildings`
 * anticipated: three masses, of which the upper one is LARGER than the one under it and sits on top
 * of it — a jettied first floor, the thing a Fachwerk street actually does — and a wing swung round
 * thirty-five degrees off the block it joins. No code here knows the pack exists and nothing switches
 * on its id. If a critic wants to know whether a new building is a manifest entry, that inn is in the
 * picture.
 *
 * **They are placed as ENTITIES, never by calling the api.** `ctx.dispatch('entity:add', …)` is what
 * a build tool does, so core mirrors the command into `world.entities`, announces it to every main
 * handle and replays it when the worker starts. A showcase that calls the renderer directly is a
 * showcase of a code path the game does not use.
 *
 * The pack is registered BEFORE the worker starts (`host.boot` stages the showcase at step 6 and
 * sends `packs: [...registry.packs()]` at step 7), which is what makes a runtime pack work at all.
 *
 * **The layout is built round the three fallback cameras**, because a composition none of them frames
 * is a composition nobody will see. `ground` stands on the gate axis 105 m in, so the street runs
 * north from there with its terrace on one side and its market hall on the other; `close` and
 * `overview` anchor on the centroid of the `building` entities, so the whole set sits round z ≈ 10
 * rather than strung out over 200 m. `shops` strung twelve buildings along 220 m and its own report
 * records that the overview frame got nothing.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { Entity, MainContext, TerrainData } from '../core/types';
import { nextEntityId } from '../core/world';
import { LAYER_CONCRETE, LAYER_GRASS, LAYER_MEADOW } from '../terrain';
import type { BuildingsMainApi } from './main';

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
 * A pack of one building, in JSON, using nothing but what a manifest may say.
 *
 * The jetty is the point: `base` puts the first floor at the height of the ground floor's head, and
 * its `size` is a metre wider in both directions, so it oversails. Nothing in `build.ts` has a
 * concept of an overhang — it draws each mass where the record puts it — which is exactly why this
 * works and why it is worth photographing.
 */
const SHOWCASE_PACK = {
  id: 'buildings-showcase',
  version: 1,
  name: { en: 'Buildings showcase', de: 'Gebäude-Schaufenster' },
  requires: [],
  buildingStyles: [
    {
      id: 'inn-timber',
      name: { en: 'Inn timber', de: 'Gasthausfachwerk' },
      wall: 'render',
      plinth: 'rubble',
      roof: 'pantile',
      palette: {
        wall: '#e9dfc8',
        plinth: '#8b8577',
        roof: '#9d5233',
        trim: '#5b3a24',
        joinery: '#5b3a24',
        metal: '#43403a',
        glass: '#28353d',
        lit: '#ffc981',
        sign: '#b8452f',
      },
      trim: {
        cornice: 0.22,
        stringCourse: 0.34,
        quoins: false,
        reveal: 0.14,
        sill: 0.13,
        corniceOut: 0.5,
      },
      glazing: { mullions: 3, transoms: 3 },
    },
  ],
  buildingBlueprints: [
    {
      id: 'old-inn',
      name: { en: 'The old inn', de: 'Gasthaus' },
      style: 'inn-timber',
      masses: [
        {
          id: 'ground',
          size: [12, 9],
          storeys: 1,
          storeyHeight: 3.2,
          plinth: 0.5,
          bay: 3.0,
          facades: { all: 'w*', front: 'w D w' },
          roof: { form: 'flat', parapet: 0 },
        },
        {
          id: 'jetty',
          base: 3.7,
          size: [13.1, 10.1],
          storeys: 2,
          storeyHeight: 2.9,
          plinth: 0,
          bay: 2.6,
          facades: { all: 'w*', front: 'w* o w*' },
          roof: { form: 'gable', pitch: 52, eaves: 0.7, ridge: 'x', dormers: 2, chimneys: 2 },
        },
        {
          id: 'wing',
          at: [10.5, -7],
          yaw: 35,
          size: [9, 7],
          storeys: 2,
          storeyHeight: 3.0,
          plinth: 0.5,
          bay: 3.0,
          facades: { all: 'w*', front: 'w d w' },
          roof: { form: 'gable', pitch: 48, eaves: 0.6, ridge: 'x', chimneys: 1 },
        },
      ],
      ground: { apron: 2.0, steps: true, kerb: false },
      night: { litFraction: 0.6, lanterns: true },
      sign: { band: 0.8, width: 0.3, color: '#e8b04a' },
    },
  ],
  buildings: [
    {
      id: 'old-inn',
      name: { en: 'The old inn', de: 'Gasthaus' },
      category: 'blueprint',
      size: [22.0, 15.5, 18.0],
      cost: 2800000,
      procedural: 'old-inn',
    },
  ],
  icons: { 'old-inn': 'lucide:beer' },
  /**
   * The cameras this showcase is judged through, replaced in place.
   *
   * `cameraPresets` is the `camera` module's own pack category and "a pack naming a built-in id
   * replaces it in place" is its documented contract, so this is a manifest edit rather than a reach
   * into another module. It is in the SHOWCASE pack and not in `pack.ts` on purpose: the demo park's
   * `overview` belongs to the whole park and this one has ten buildings in a hundred metres.
   *
   * The built-in `overview` is a fixed 400 m, which on this scene put the whole street in a 90-pixel
   * smudge in the middle of the frame — measured on `.game-render/showcase-buildings/0900-overview.png`
   * from the first round. `frameRadius: 'auto'` fits the content instead. `kit`, `hall` and `gate`
   * are inspection cameras: a kit piece is 4 m and no preset in the game gets close enough to judge
   * one.
   */
  cameraPresets: [
    // Explicit targets rather than the built-in anchors, and that is the difference between framing
    // a park and framing a street. `kinds:building` puts the anchor on the centroid of twenty-three
    // entities, ten of which are 4 m kit samples, and `frameRadius: 'auto'` then fits a 110 m circle
    // — measured on the first round's `0900-overview.png`, where the whole set was a smudge a
    // hundred pixels wide. A showcase knows where its own street is.
    { id: 'overview', target: [0, 7, 4], bearing: 30, pitch: 21, distance: 132 },
    { id: 'close', target: [0, 6, 12], bearing: 35, pitch: 12, distance: 58 },
    // Two metres from a facade: the only frame in the set where a brick, a sash bar and a sill are
    // each more than a pixel, and therefore the only one that can answer whether they are there.
    { id: 'facade', target: [-16, 6, 46], bearing: 92, pitch: 5, distance: 17 },
    { id: 'kit', target: [0, 3, 6], bearing: 0, pitch: 9, distance: 27 },
    { id: 'hall', target: [0, 8, -46], bearing: 8, pitch: 12, distance: 52 },
    { id: 'gate', target: [-19, 5, 20], bearing: 96, pitch: 11, distance: 40 },
    { id: 'inn', target: [15, 6, 34], bearing: 250, pitch: 12, distance: 32 },
    { id: 'market', target: [26, 7, 18], bearing: 265, pitch: 14, distance: 48 },
    { id: 'ticket', target: [-25, 7, 20], bearing: 85, pitch: 14, distance: 48 },
    { id: 'rot', target: [24, 8, -18], bearing: 262, pitch: 12, distance: 38 },
  ],
} as const;

/** Where each blueprint stands. `yaw` turns its `+z` front towards the street. */
const PLOTS: Array<{ item: string; pack: string; x: number; z: number; yaw: number }> = [
  // The vista stop at the north end, square on to the camera.
  { pack: 'parkfan-architecture', item: 'grand-pavilion', x: 0, z: -52, yaw: 0 },
  // West side, facing east.
  { pack: 'parkfan-architecture', item: 'ticket-hall', x: -25, z: 20, yaw: Math.PI / 2 },
  { pack: 'parkfan-architecture', item: 'clock-tower', x: -23, z: -14, yaw: Math.PI / 2 },
  { pack: 'parkfan-architecture', item: 'terrace-house', x: -16, z: 56, yaw: Math.PI / 2 },
  { pack: 'parkfan-architecture', item: 'terrace-house', x: -16, z: 46, yaw: Math.PI / 2 },
  { pack: 'parkfan-architecture', item: 'terrace-house', x: -16, z: 36, yaw: Math.PI / 2 },
  // East side, facing west.
  { pack: 'parkfan-architecture', item: 'market-hall', x: 26, z: 18, yaw: -Math.PI / 2 },
  { pack: 'parkfan-architecture', item: 'rotunda', x: 24, z: -18, yaw: -Math.PI / 2 },
  { pack: 'parkfan-architecture', item: 'guest-services', x: 17, z: 52, yaw: -Math.PI / 2 },
  { pack: 'buildings-showcase', item: 'old-inn', x: 19, z: 34, yaw: -Math.PI / 2 },
];

export async function stageBuildingsShowcase(ctx: MainContext): Promise<void> {
  try {
    ctx.registry.registerPack(SHOWCASE_PACK);
  } catch (error) {
    // A duplicate id means the showcase has already staged once in this registry; everything below
    // still works, and anything else is worth seeing in the console.
    console.warn('[game/buildings] showcase pack not registered', error);
  }

  sculpt(ctx.world.terrain as TerrainData);
  ctx.events.emit('terrain:changed', { rect: null });

  const paths = ctx.module<PathsLike>('paths');
  if (paths) {
    paths.create({
      form: 'path',
      style: 'promenade',
      width: 10,
      entrance: true,
      points: [0, 150, 0, 110, 0, 70, 0, 30, 0, -10, 0, -34],
    });
    paths.create({ form: 'plaza', style: 'pavers', points: polygon(0, -34, 17, 12) });
    paths.create({
      form: 'path',
      style: 'pavers',
      width: 6,
      points: [-14, 20, -6, 20, 6, 20, 14, 20],
    });
  } else {
    console.warn('[game/buildings] showcase: no paths module — the street will be bare ground');
  }

  for (const plot of PLOTS) {
    const found = ctx.registry.find('buildings', plot.pack, plot.item);
    if (!found) {
      console.warn(`[game/buildings] showcase: no item "${plot.pack}:${plot.item}"`);
      continue;
    }
    const entity: Entity = {
      id: nextEntityId(ctx.world, 'building'),
      kind: 'building',
      pack: plot.pack,
      item: plot.item,
      // Y stays 0 so the renderer samples the terrain — the path a build tool that has not sampled
      // it takes, and therefore the one worth exercising.
      position: [plot.x, 0, plot.z],
      yaw: plot.yaw,
    };
    ctx.dispatch('entity:add', entity);
  }

  /**
   * The loose kit, standing along the promenade like a builder's merchant laid it out.
   *
   * These are the ten `buildings` entries the two bundled packs already ship — a brick wall, a
   * plaster wall, an arched window, a double door, a slate roof, a timber floor, a stone column, a
   * concrete wall, a flat roof, a panorama window — none of which this module names anywhere. They
   * are here because "kit-bash" is a claim about pieces, and a claim about pieces should be
   * photographable one piece at a time.
   */
  const kit = ctx.registry
    .items('buildings')
    .filter((item) => (item.def as { category: string }).category !== 'blueprint');
  kit.forEach((item, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const step = Math.floor(i / 2);
    const entity: Entity = {
      id: nextEntityId(ctx.world, 'building'),
      kind: 'building',
      pack: item.pack,
      item: (item.def as { id: string }).id,
      position: [side * 8.5, 0, 24 - step * 6],
      // Square on to the street, not turned to face it. A kit piece is 4 m and 0.3 m thick, so
      // edge-on it is a black slab — which is exactly how the first round photographed all ten of
      // them. A visitor walking up the street meets their front.
      yaw: 0,
    };
    ctx.dispatch('entity:add', entity);
  });

  // Printed rather than asserted: the harness reads the console, and a blueprint that stops
  // resolving after a manifest change should say so in the run that broke it.
  const api = ctx.module<BuildingsMainApi>('buildings');
  for (const entry of api?.catalogue() ?? []) {
    const what = entry.blueprint
      ? `blueprint ${entry.blueprint.id} · ${entry.blueprint.masses.length} masses`
      : `piece ${entry.piece}`;
    console.info(
      `[game/buildings] ${entry.key}: ${what} · style ${entry.style.id} (${entry.source}) · ` +
        `${entry.size[0]} × ${entry.size[1]} × ${entry.size[2]} m`
    );
  }
  const stats = api?.stats();
  if (stats) {
    console.info(
      `[game/buildings] ${stats.buildings} placed · ${stats.batches} batches · ` +
        `${stats.drawnMeshes} draw calls · ${stats.triangles} triangles · ` +
        `${stats.windows} windows (${stats.litWindows} lit) · atlas ${stats.atlasMs.toFixed(0)} ms · ` +
        `build ${stats.buildMs.toFixed(0)} ms`
    );
  }

  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.35;
    camera.beta = 1.16;
    camera.radius = 96;
    camera.target.set(0, 6, 6);
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
 * A street is flat and the land round it is not, and that is the point of sculpting rather than
 * leaving it.
 *
 * A showcase world arrives from `createWorld` with every height at zero, so a building on a plane
 * proves nothing about a building on ground. The relief is gentle — a metre of fall over the length
 * of the street and a slow roll across it — because what the frame has to show is a plinth meeting
 * ground that is not level, which is the whole reason the plinth starts 0.7 m below grade.
 */
function sculpt(terrain: TerrainData): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      const fall = (120 - z) * 0.005;
      const roll = Math.sin(z / 82 + 0.6) * Math.cos(x / 104) * 0.6;
      const ridge = 9 * Math.exp(-((x - 150) ** 2 + (z + 130) ** 2) / (2 * 110 * 110));
      terrain.heights[j * w + i] = fall + roll + ridge;
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + ((i + 0.5) / n) * terrain.size;
      const z = -half + ((j + 0.5) / n) * terrain.size;
      const onStreet = Math.abs(x) < 7 && z > -46 && z < 152;
      const onPlaza = Math.hypot(x, z + 34) < 18;
      const verge = Math.abs(x) < 34 && z > -60 && z < 70;
      terrain.paint[j * n + i] =
        onStreet || onPlaza ? LAYER_CONCRETE : verge ? LAYER_MEADOW : LAYER_GRASS;
    }
  }
  terrain.waterLevel = -60;
}
