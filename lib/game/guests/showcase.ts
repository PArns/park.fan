/**
 * `/game?showcase=guests` — a piece of park with nothing in it but the crowd.
 *
 * **Written by the integrator, not by the module's builder.** The module shipped without one and
 * neither its report nor its round-1 critique mentions the fact, so it was graded entirely from
 * demo-park frames — where the crowd shares every picture with the terrain, the paths, the scenery,
 * the shops and the rides. `BUILDER_BRIEF.md` asks for a showcase precisely so that a module can be
 * looked at on its own, and this is that frame: paving, a crowd, and no other module's work in it
 * beyond the ground it stands on.
 *
 * ## The crowd is not there at tick 0, and it takes BOTH flags
 *
 * Guests arrive over park minutes — `MAX_PARTIES_PER_TICK` is three, deliberately, because a crowd
 * should arrive rather than appear — so a screenshot of a freshly booted world is an empty street
 * whatever this file stages. What fills it is a **clock jump**: a move larger than `JUMP_MINUTES`
 * is read as a cut rather than as time passing, and the module re-seeds the park for the hour it
 * landed on, needs aged by how long each guest would have been inside.
 *
 * `--tod` alone does not do it, and that was measured rather than assumed: the harness runs at
 * `speed=0`, the jump is only noticed inside a tick, and at speed 0 a tick advances the clock by
 * nothing. The first run of this showcase came back with a perfect empty street and a panel reading
 * "Nobody is in the park yet." One tick is enough to trigger the re-seed; sixty park minutes is
 * enough for the crowd to leave the gate and spread over the network, which is what you want to
 * look at:
 *
 *     node scripts/game-shot.mjs --showcase=guests --cam=overview,close,ground \
 *       --tod=13:00,22:00 --step=1200
 *
 * Both hours are worth taking. The attendance curve puts 22:00 at about a third of the peak, so the
 * night frame is a thinner crowd under lamplight rather than the same picture darker.
 *
 * ## What this showcase deliberately cannot show
 *
 * A showcase loads the module, its dependencies and nothing else (`orderModules`), so `guests` here
 * gets `core`, `terrain`, `environment`, `ui`, `camera` and `paths` — and **no shops, no rides, no
 * benches**. Every venue the decision model can score is therefore a wander point sampled off the
 * path graph, which means: no queue forms in this frame, nobody sits, nobody buys. That is a limit
 * of what a showcase is allowed to load and not a statement about the module; the queue behaviour
 * belongs in the shops and rides showcases, which have counters in them. What IS in this frame is
 * everything about the crowd itself — density, the spread of bodies and clothing, the lane offset
 * that makes a wide walk read as a wide walk, the LOD tiers, and how the whole thing looks lit.
 *
 * ## The layout is built around the three fallback camera presets
 *
 * They are what every screenshot of this game is taken through, so the network is arranged to give
 * each of them a crowd rather than a field:
 *
 *   `ground`   (0, 1.7, 120) looking north — the eye of somebody standing on the promenade. The
 *              wide walk runs through exactly that point, so this frame is a crowd coming towards
 *              the camera at head height, which is the one view that shows whether a person reads
 *              as a person.
 *   `close`    (0, 2, 0) from ~40 m — the plaza, where four walks meet and the crowd mixes instead
 *              of queueing along a line.
 *   `overview` 340 m out — the whole network, which is where density and distribution have to hold
 *              up: a crowd that clumps at junctions and empties everywhere else is visible from
 *              here and from nowhere closer. It is also the weakest of the three and the reason is
 *              worth stating rather than hiding — a guests-only world has no trees, no buildings
 *              and no rides in it, so this frame is paving and people on a green field. What it can
 *              answer is whether the crowd is spread over the park or piled at the gate; what it
 *              cannot answer is anything about the look of the place.
 *
 * The three walks are three widths on purpose — 10 m, 6 m and 3 m. The lane offset a guest carries
 * is clamped to the node's half-width, so a crowd is supposed to fill a promenade and thread a
 * lane, and one width cannot show that.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, TerrainData } from '../core/types';
import { LAYER_GRASS } from '../terrain';

interface PathsLike {
  create(spec: {
    form: 'path' | 'plaza' | 'queue';
    style: string;
    points: number[];
    width?: number;
    entrance?: boolean;
  }): string;
}

export async function stageGuestsShowcase(ctx: MainContext): Promise<void> {
  sculpt(ctx.world.terrain as TerrainData);
  ctx.events.emit('terrain:changed', { rect: null });

  const paths = ctx.module<PathsLike>('paths');
  if (!paths) {
    console.warn('[game/guests] showcase: no paths module — there is nowhere to walk');
    return;
  }

  // The promenade, gate to plaza. Ten metres, which is wider than anything in the demo park: the
  // point of this frame is a crowd with room to spread across a walk rather than a file along one.
  // It passes through z = 120 dead straight, because that is where the `ground` preset stands.
  paths.create({
    form: 'path',
    style: 'promenade',
    width: 10,
    entrance: true,
    points: [0, 200, 0, 176, 0, 150, 0, 120, 0, 96, 0, 66, 0, 36, 0, 18],
  });

  // The plaza the walks meet on. Ten corners rather than four so the crowd distributes round a
  // curve; a square gathers people in its corners and reads as a car park from `overview`.
  paths.create({ form: 'plaza', style: 'pavers', points: polygon(0, -10, 44, 10) });

  // Two six-metre walks running in from the east and west edges, curving so that neither of them
  // is a ruler and both end inside the plaza rather than at it.
  paths.create({
    form: 'path',
    style: 'promenade',
    width: 6,
    points: [-176, 124, -144, 106, -110, 82, -78, 52, -52, 20, -34, -6, -24, -20],
  });
  paths.create({
    form: 'path',
    style: 'promenade',
    width: 6,
    points: [176, 120, 144, 102, 110, 78, 78, 48, 52, 16, 34, -10, 24, -24],
  });

  // A three-metre lane through the north-west, and a second one closing the loop in the south-east.
  // Narrow walks are where the lane offset shows: the same crowd that fills ten metres has to
  // thread three without walking through the kerb.
  paths.create({
    form: 'path',
    style: 'pavers',
    width: 3,
    points: [-152, 198, -120, 182, -88, 168, -52, 154, -18, 144, 0, 138],
  });
  paths.create({
    form: 'path',
    style: 'pavers',
    width: 3,
    points: [0, 60, 34, 52, 66, 34, 88, 4, 90, -30, 60, -44, 20, -40],
  });

  // A cobbled street climbing the rise south-west of the plaza, so one stretch of the crowd is
  // walking up a real gradient rather than across a table.
  paths.create({
    form: 'path',
    style: 'cobble',
    width: 6,
    points: [0, -54, -16, -84, -42, -114, -74, -140, -112, -156],
  });

  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.5;
    camera.beta = 1.14;
    camera.radius = 210;
    camera.target.set(0, 2, 70);
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
 * Gentle relief, written straight into the heightfield.
 *
 * Core stages a showcase after the main handles exist and before the worker starts, so this reaches
 * the simulation's copy of the terrain as well — which is what makes the graph's node heights agree
 * with the drawn ones, and therefore what stops a crowd walking a foot under the paving.
 *
 * The ground is left as grass everywhere. Each path lays its own surface, and a painted apron round
 * them would put the crowd on a concrete field: the subject of this frame is the people, and grass
 * is what makes a walk read as a walk.
 */
function sculpt(terrain: TerrainData): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      // A rise the cobbled street climbs, a shallow bowl under the plaza so the crowd on it is seen
      // slightly from above at `close`, and a long roll across the promenade.
      const rise = 6.2 * Math.exp(-((x + 86) ** 2 + (z + 140) ** 2) / (2 * 104 * 104));
      const bowl = -1.8 * Math.exp(-(x ** 2 + (z + 10) ** 2) / (2 * 62 * 62));
      const cross = Math.sin((z + 30) / 84) * Math.cos((x - 20) / 104) * 1.3;
      const roll = Math.sin(x / 140 + 0.7) * Math.cos(z / 160) * 0.8;
      terrain.heights[j * w + i] = rise + bowl + cross + roll;
    }
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) terrain.paint[j * n + i] = LAYER_GRASS;
  terrain.waterLevel = -40;
}
