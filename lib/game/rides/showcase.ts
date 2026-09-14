/**
 * `/game?showcase=rides` — a fairground with every flat ride both bundled packs declare, plus one
 * that exists only in this file.
 *
 * **The sixth machine is the extensibility gate, in the frame rather than in a paragraph.** A pack
 * called `rides-showcase` is registered at runtime with a `teacups` ride and a `rideRigs` entry for
 * it, and the teacup is a thing no file in `lib/game/rides` anticipated: a turntable carrying three
 * platters, each carrying four free-spinning cups, three levels of nested rotation out of the same
 * eleven primitives the carousel uses. No code here knows the pack exists; nothing switches on its
 * id. If a critic wants to know whether a new ride is a manifest entry, that ride is in the picture.
 *
 * **They are placed as ENTITIES, never by calling the api.** `ctx.dispatch('entity:add', …)` is
 * what a build tool does, so core mirrors the command into `world.entities`, announces it to every
 * main handle and replays it when the worker starts — and the simulation indexes the same six rides
 * the renderer drew. `track/showcase.ts` records what happens otherwise.
 *
 * The pack is registered BEFORE the worker starts (`host.boot` stages the showcase at step 6 and
 * sends `packs: [...registry.packs()]` at step 7), which is what makes a runtime pack work at all.
 *
 * The layout is a street with three rides down each side rather than a ring, and that is about the
 * cameras: `close` and `night` anchor on the centroid of `kinds:shop,ride,…` at 40 m and 150 m, so
 * a cluster centred on the origin puts something in both, and `ground` stands in the middle of it.
 * `shops` strung twelve buildings along 220 m and its own report records that the `overview` frame
 * got nothing.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { Entity, MainContext, TerrainData } from '../core/types';
import { nextEntityId } from '../core/world';
import { LAYER_CONCRETE, LAYER_GRASS } from '../terrain';
import type { RidesMainApi } from './main';

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
 * A teacup ride, in JSON, using nothing but the shapes.
 *
 * Three levels of nested rotation — turntable 7 turns, platters 11, cups 17 — is what makes a
 * teacup a teacup, and it is the one thing the bundled rigs never ask for. It is here to prove the
 * rig format is a tree rather than a two-level thing; `rig.ts` grew `count`-per-parent-unit for it
 * and every bundled rig draws exactly what it drew before.
 */
const SHOWCASE_PACK = {
  id: 'rides-showcase',
  version: 1,
  name: { en: 'Rides showcase', de: 'Fahrgeschäft-Schaufenster' },
  requires: [],
  rides: [
    {
      id: 'teacups',
      kind: 'flat',
      name: { en: 'Teacups', de: 'Tassenkarussell' },
      rig: 'rig-teacup',
      capacity: 48,
      cycleMinutes: 2.4,
      excitement: 2.6,
      fear: 0.6,
      nausea: 4.4,
      cost: 21000000,
      upkeep: 900,
      footprint: [16, 16],
      power: 45,
      procedural: 'teacups',
      night: {
        light: {
          color: '#ffd166',
          intensity: 9,
          height: 5,
          range: 20,
          mode: 'chase',
          colors: ['#ffd166', '#c8362f', '#f0e4c8'],
        },
      },
    },
  ],
  rideRigs: [
    {
      id: 'rig-teacup',
      parts: [
        {
          id: 'base',
          shape: 'drum',
          params: {
            radius: 7.6,
            height: 0.55,
            sides: 24,
            skirt: 0.45,
            panels: true,
            rim: true,
            color: '#2c4b6e',
            accent: '#f0e4c8',
            trim: '#d9a441',
          },
        },
        {
          id: 'mast',
          parent: 'base',
          offset: [0, 0.55, 0],
          shape: 'mast',
          params: {
            height: 4.2,
            radius: 0.3,
            radiusTop: 0.22,
            bands: 3,
            sides: 12,
            color: '#f0e4c8',
            trim: '#d9a441',
          },
        },
        {
          id: 'platform',
          parent: 'base',
          offset: [0, 0.55, 0],
          shape: 'drum',
          params: {
            radius: 7.4,
            height: 0.16,
            sides: 24,
            panels: true,
            rim: true,
            color: '#f0e4c8',
            accent: '#2c4b6e',
            trim: '#d9a441',
          },
          animate: { yaw: { curve: 'ease-in-out', revolutions: 7 } },
        },
        {
          id: 'platters',
          parent: 'platform',
          offset: [0, 0.16, 0],
          shape: 'drum',
          count: 3,
          radius: 4,
          facing: 'fixed',
          params: {
            radius: 2.5,
            height: 0.14,
            sides: 18,
            panels: true,
            rim: true,
            color: '#d9a441',
            accent: '#c8362f',
          },
          animate: { yaw: { curve: 'linear', revolutions: 11, phaseSpread: 0 } },
        },
        {
          id: 'cups',
          parent: 'platters',
          offset: [0, 0.14, 0],
          shape: 'drum',
          count: 4,
          radius: 1.55,
          seats: 4,
          facing: 'out',
          params: {
            radius: 1.02,
            radiusTop: 1.22,
            height: 1.05,
            sides: 14,
            hollow: true,
            panels: true,
            rim: true,
            color: '#c8362f',
            accent: '#f0e4c8',
            trim: '#d9a441',
          },
          animate: { yaw: { curve: 'linear', revolutions: 17, phaseSpread: 0 } },
        },
        {
          id: 'canopy',
          parent: 'base',
          offset: [0, 5.6, 0],
          shape: 'canopy',
          params: {
            radius: 7.9,
            rise: 1.25,
            sides: 18,
            hub: 0.5,
            valance: 0.5,
            panels: true,
            bulbs: true,
            color: '#c8362f',
            accent: '#f0e4c8',
            trim: '#d9a441',
            bulb: '#ffd166',
          },
        },
      ],
    },
  ],
} as const;

/** Where each ride stands. `side` is which flank of the promenade; the yaw follows from it. */
const SLOTS: Array<{ x: number; z: number }> = [
  { x: -21, z: 34 },
  { x: 26, z: 33 },
  { x: -23, z: -6 },
  { x: 21, z: -8 },
  { x: -20, z: -44 },
  { x: 19, z: -42 },
];

export async function stageRidesShowcase(ctx: MainContext): Promise<void> {
  try {
    ctx.registry.registerPack(SHOWCASE_PACK);
  } catch (error) {
    // A duplicate id means the showcase has already staged once in this registry; everything below
    // still works, and anything else is worth seeing in the console.
    console.warn('[game/rides] showcase pack not registered', error);
  }

  sculpt(ctx.world.terrain as TerrainData);
  ctx.events.emit('terrain:changed', { rect: null });

  const paths = ctx.module<PathsLike>('paths');
  if (paths) {
    paths.create({
      form: 'path',
      style: 'promenade',
      width: 8,
      entrance: true,
      points: [0, 150, 0, 118, 0, 86, 0, 62, 0, 34],
    });
    paths.create({ form: 'plaza', style: 'pavers', points: polygon(0, -4, 14, 12) });
    paths.create({ form: 'path', style: 'promenade', width: 7, points: [0, -22, 0, -50, 0, -80] });
  } else {
    console.warn('[game/rides] showcase: no paths module — the fairground will have no ground');
  }

  const items = ctx.registry.items('rides', (i) => (i.def as { kind?: string }).kind === 'flat');
  if (!items.length) {
    console.warn('[game/rides] showcase: no pack declares a flat ride');
    return;
  }
  items.forEach((item, i) => {
    const slot = SLOTS[i % SLOTS.length];
    const entity: Entity = {
      id: nextEntityId(ctx.world, 'ride'),
      kind: 'ride',
      pack: item.pack,
      item: (item.def as { id: string }).id,
      // Y stays 0 so the renderer samples the terrain — the path a build tool that has not sampled
      // it takes, and therefore the one worth exercising.
      position: [slot.x, 0, slot.z],
      yaw: slot.x < 0 ? Math.PI / 2 : -Math.PI / 2,
    };
    ctx.dispatch('entity:add', entity);
  });

  /**
   * Keep every queue full.
   *
   * A showcase loads core, terrain, environment, ui, camera and this module — `guests` is not in
   * that graph — so with nothing to board, every machine would sit in LOADING with an empty line
   * and the whole point of the module would be unphotographable. `rides:demo` is a flag nothing in
   * the game sets, and what it produced is counted separately in `stats().demoRiders`.
   */
  ctx.dispatch('rides:demo', { on: true });

  // Printed rather than asserted: the harness reads the console, and a rig that stops resolving
  // after a manifest change should say so in the run that broke it.
  const rides = ctx.module<RidesMainApi>('rides');
  for (const profile of rides?.catalogue() ?? []) {
    console.info(
      `[game/rides] ${profile.key}: rig ${profile.rig.key} (${profile.rig.source}) · ` +
        `${profile.rig.parts.length} parts · ${profile.rigSeats} seats drawn / ${profile.capacity} capacity · ` +
        `${profile.cycleMinutes} min cycle → ${Math.round((profile.capacity / profile.cycleMinutes) * 60)}/h · ` +
        `mtbf ${profile.mtbfMinutes} min`
    );
  }

  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.6;
    camera.beta = 1.12;
    camera.radius = 78;
    camera.target.set(0, 5, 12);
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
 * A fairground is flat, and that is the point of sculpting it rather than leaving it.
 *
 * A showcase world arrives from `createWorld` with every height at zero, so a ride on a plane
 * proves nothing about a ride on ground. The relief here is gentle — a metre of fall over the
 * length of the street and a slow roll across it — because a flat ride cannot bank: every one of
 * them is a slab on a level plot, and what the frame has to show is the slab meeting ground that
 * is not level.
 */
function sculpt(terrain: TerrainData): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      const fall = (140 - z) * 0.006;
      const roll = Math.sin(z / 74 + 0.4) * Math.cos(x / 96) * 0.55;
      const rise = 7 * Math.exp(-((x + 130) ** 2 + (z + 110) ** 2) / (2 * 90 * 90));
      terrain.heights[j * w + i] = fall + roll + rise;
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + ((i + 0.5) / n) * terrain.size;
      const z = -half + ((j + 0.5) / n) * terrain.size;
      const onStreet = Math.abs(x) < 6 && z > -96 && z < 152;
      const onPlaza = Math.hypot(x, z + 4) < 15;
      terrain.paint[j * n + i] = onStreet || onPlaza ? LAYER_CONCRETE : LAYER_GRASS;
    }
  }
  terrain.waterLevel = -60;
}
