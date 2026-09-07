/**
 * `/game?showcase=pools` — a lido that has to answer for the whole module.
 *
 * Laid out around the three camera presets, because a showcase staged at the origin gives two of
 * them an empty field. The `camera` module resolves `close` and `pool` against `kinds:pool`, so
 * those follow whatever is placed here; `ground` does not — it stands 79 m north of the park centre
 * looking a further 26 m along bearing 0, which is **−Z** (`camera/pose.ts`). So the lap pool is at
 * z = −102, deliberately, and that frame is a swimmer's-eye view along a lane: the one shot that
 * shows whether the waterline band, the deck-level channel and the handrails land where they should.
 *
 * Seven basins, and each is here to answer a different question:
 *
 * | Pool                | What it is in the frame for                                              |
 * | ------------------- | ------------------------------------------------------------------------ |
 * | Lagoon              | A free-form plan, a zero-entry beach, and 28 m of glass mosaic            |
 * | Lap pool            | Lane lines, a deck-level overflow channel, a ladder, a 1.35→2.0 m floor  |
 * | Paddling pool       | A dish profile 180 mm deep — the water has to read as shallow            |
 * | Whirlpool           | Heated, dark slate, Roman steps, timber surround — a different material  |
 * | Plunge pool         | A stadium plan and a flat 1.4 m floor beside a timber deck               |
 * | Slide run-out       | The `channel` profile and the `splashdown` role `flumes` will ask for    |
 * | **Terrace (pack)**  | Registered at runtime from a pack manifest, with zero code in this module |
 *
 * The last row is the extensibility gate made visible rather than asserted: `showcasePack()` is a
 * pack manifest with a `pools` key, registered through `registry.registerPack` after this module's
 * `main()` has already run, so it lands through the `onPack` listener and not through the boot walk
 * of `registry.packs()`. It brings a new outline (an explicit polygon), a new tile pattern with its
 * own palette, a new edge treatment and a new deck item — and every one of them draws.
 */

import type { MainContext, TerrainData } from '../core/types';
import type { PoolsMainApi } from './main';

interface Pad {
  x: number;
  z: number;
  radius: number;
}

export async function stagePoolsShowcase(ctx: MainContext): Promise<void> {
  const pools = ctx.module<PoolsMainApi>('pools');
  if (!pools) {
    console.warn('[game/pools] showcase: the pools module has no api');
    return;
  }

  // A pack registered AFTER main() ran — the half of the content path a boot-time walk cannot
  // reach. If the id is already taken (a second showcase in one session), carry on quietly.
  try {
    ctx.registry.registerPack(showcasePack());
  } catch {
    /* already registered */
  }

  const pads: Pad[] = [
    { x: 0, z: -8, radius: 24 },
    { x: 0, z: -102, radius: 20 },
    { x: -30, z: 8, radius: 13 },
    { x: 28, z: 6, radius: 9 },
    { x: -32, z: -26, radius: 11 },
    { x: 34, z: -26, radius: 15 },
    { x: 0, z: 24, radius: 18 },
    { x: -78, z: -58, radius: 27 },
    { x: 76, z: -46, radius: 22 },
    { x: 72, z: 26, radius: 13 },
    { x: -72, z: 22, radius: 11 },
  ];
  sculpt(ctx.world.terrain as TerrainData, pads);
  ctx.events.emit('terrain:changed', { rect: null });

  // The hero: a free-form lagoon with a zero-entry beach at its south end.
  pools.create({ shape: 'lagoon', x: 0, z: -8, yaw: 0.18 });

  // The lap pool the `ground` preset stands in front of.
  pools.create({ shape: 'lap-pool', x: 0, z: -102, yaw: 0 });

  pools.create({ shape: 'kids-pool', x: -30, z: 8, yaw: -0.4 });
  pools.create({ shape: 'whirlpool', x: 28, z: 6, yaw: 0.6, heated: true });
  pools.create({ shape: 'plunge', x: -32, z: -26, yaw: 0.25 });

  // The run-out lane a water slide lands in, angled as a slide tower would want it.
  pools.create({ shape: 'runout-lane', x: 34, z: -26, yaw: 0.35 });

  // And the pack's own basin, in the pack's own tile, with the pack's own edge.
  pools.create({ shape: 'infinity-terrace', x: 0, z: 24, yaw: 0 });

  // Four more, spread wide. The `overview` preset is a fixed 400 m from the park centre, so a lido
  // packed into seventy metres arrives as a smudge in it; these take the water park out to about
  // two hundred and give that frame something to be a frame of. Each also re-uses a shape with a
  // different tile and edge, which is the entity override doing its job.
  pools.create({
    shape: 'lagoon',
    x: -78,
    z: -58,
    yaw: -0.5,
    size: [36, 24],
    tile: 'sand-pebble',
    edge: 'beach-sand',
  });
  pools.create({
    shape: 'runout-lane',
    x: 76,
    z: -46,
    yaw: 0.2,
    size: [12, 68],
    depth: 1.2,
    tile: 'aqua-mosaic',
    edge: 'rolled-concrete',
    deckDensity: 1,
  });
  pools.create({ shape: 'kids-pool', x: 72, z: 26, yaw: 0.8, tile: 'sand-pebble' });
  pools.create({
    shape: 'plunge',
    x: -72,
    z: 22,
    yaw: -0.2,
    tile: 'slate-dark',
    edge: 'timber-surround',
  });
}

/**
 * The pack. Nothing in `lib/game/pools/` knows any of these ids.
 *
 * `outline: 'polygon'` is the open end of the shape vocabulary — a closed loop in unit space, which
 * is how a pack draws a plan the five generators cannot. `pattern: 'slate'` with a different
 * palette and a different grout is a new tile; `coping: 'square'` over a `stone` deck is a new
 * edge; and `planter` at a heavy weight is a new deck mix. All four are JSON.
 */
function showcasePack(): unknown {
  return {
    id: 'showcase-lido',
    version: 1,
    name: { en: 'Showcase lido', de: 'Showcase-Bad' },
    requires: [],
    pools: {
      tiles: [
        {
          id: 'terrace-basalt',
          name: { en: 'Basalt terrace', de: 'Basaltterrasse' },
          pattern: 'slate',
          tileMetres: 1.4,
          colors: ['#4a4038', '#554a40', '#403830', '#5f5347'],
          grout: '#332c26',
          waterline: '#2a231d',
          roughness: [0.2, 0.68],
          relief: 0.85,
          glaze: 0.5,
          water: '#12615f',
          night: '#ffcf8a',
          nightIntensity: 9,
        },
      ],
      edges: [
        {
          id: 'terrace-stone',
          name: { en: 'Stone terrace', de: 'Steinterrasse' },
          coping: 'square',
          copingWidth: 0.55,
          copingRise: 0.06,
          copingColor: '#b9ac96',
          deck: 'stone',
          deckWidth: 3.8,
          deckColor: '#a79c88',
          rail: true,
          railColor: '#d3d8dc',
        },
      ],
      deck: [
        {
          id: 'terrace-planter',
          name: { en: 'Terrace planter', de: 'Terrassenkübel' },
          shape: 'planter',
          weight: 3,
          clearance: 2.6,
          colors: ['#b9ac96', '#a79c88'],
          accent: '#4f7a3c',
        },
      ],
      shapes: [
        {
          id: 'infinity-terrace',
          name: { en: 'Terrace pool', de: 'Terrassenbecken' },
          outline: 'polygon',
          // An eight-sided plan with one long straight side — the infinity edge — in unit space.
          points: [
            -1, -0.62, 1, -0.62, 1, 0.2, 0.62, 0.72, 0.1, 1, -0.42, 1, -0.86, 0.66, -1, 0.16,
          ],
          size: [22, 11],
          segments: 32,
          depth: { profile: 'slope', min: 1.1, max: 1.7, axis: 'z', beach: 0 },
          entry: 'roman-steps',
          entryYaw: 1.5707963267948966,
          role: 'swim',
          tile: 'terrace-basalt',
          edge: 'terrace-stone',
          deckDensity: 3.2,
          water: 8,
          cost: 26000000,
        },
      ],
    },
  };
}

/**
 * Gentle relief with a flat pad under each basin.
 *
 * A water park on a dead-flat plane proves nothing about how a pool sits in the ground; a pool on a
 * cross slope proves the wrong thing, because a real one is built on a level platform and a deck
 * ring is a plane. So the land rolls by about a metre and a half over a couple of hundred metres,
 * and each basin gets a pad flattened out to its deck plus six metres, blended over the next eight.
 *
 * Core stages the showcase after the main handles exist and before the worker starts, so writing
 * the heightfield here reaches the simulation's copy too — the same trick `paths/showcase.ts` uses.
 */
function sculpt(terrain: TerrainData, pads: Pad[]): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      const roll =
        Math.sin(x / 180 + 0.6) * Math.cos(z / 210 - 0.4) * 1.4 +
        Math.sin((x + z) / 320) * 0.8 +
        Math.cos(x / 96) * Math.sin(z / 120) * 0.35;
      let height = roll;
      for (const pad of pads) {
        const d = Math.hypot(x - pad.x, z - pad.z);
        if (d > pad.radius + 8) continue;
        const t = d <= pad.radius ? 1 : 1 - (d - pad.radius) / 8;
        const smooth = t * t * (3 - 2 * t);
        // The pad's own level is the rolling ground at its centre, so a pad never leaves a step.
        const level =
          Math.sin(pad.x / 180 + 0.6) * Math.cos(pad.z / 210 - 0.4) * 1.4 +
          Math.sin((pad.x + pad.z) / 320) * 0.8 +
          Math.cos(pad.x / 96) * Math.sin(pad.z / 120) * 0.35;
        height = height + (level - height) * smooth;
      }
      terrain.heights[j * w + i] = height;
    }
  }
  // Well below anything here: the lake is the terrain module's water and must not flood the lido.
  terrain.waterLevel = -40;
}
