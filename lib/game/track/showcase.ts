/**
 * `/game?showcase=track` — three complete coasters on one piece of ground.
 *
 * Not a test bench of disconnected pieces: each of the three is a circuit with a station, a lift,
 * a first drop, a return leg and a brake run home, and each one's physics says it completes. The
 * point of a showcase is that the thing it shows would work if you got on it.
 *
 * **They are placed as ENTITIES, not by calling the api.** `ctx.dispatch('entity:add', …)` is what
 * a build tool would do, and it exercises the whole path: core mirrors the command into
 * `world.entities` and announces it to every main handle, the worker replays it when it starts, and
 * the sim half builds the same spline from the same piece list. Calling `api.create()` here instead
 * would draw three coasters the simulation had never heard of — and `trains` reads the SIM handle.
 *
 * The terrain is sculpted here rather than left flat. A showcase world arrives from `createWorld`
 * with every height at zero, and supports standing on a plane prove nothing: the relief is gentle
 * (±6 m) and runs ACROSS all three layouts, so the column heights vary along a straight and the
 * footings have a slope to sit on.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { Entity, MainContext, TerrainData, Vec3 } from '../core/types';
import { nextEntityId } from '../core/world';
import { layoutData, TRACK_LAYOUTS } from './layouts';
import type { TrackMainApi } from './main';

/**
 * Where each layout's station goes, and which way it faces.
 *
 * All three run EAST–WEST (`yaw = π/2`), and that is a framing decision rather than a taste one.
 * The `overview` preset sits 328 m out and 91 m up with a 0.9 rad vertical field of view, so it
 * covers roughly 560 m across the frame and 316 m into it. Two of these layouts are just under
 * 400 m long: pointed north–south they run off the top and the bottom of that frame, which is what
 * the first render showed. Turned broadside they are 400 m across a 560 m frame and the group is
 * 254 m deep, and all three fit with room either side.
 *
 * `close` (0, 2, 0) then lands on the north edge of `Nordwind`, and `ground` (0, 1.7, 120) stands
 * under `Kleiner Kreisel`, which is the small one and the one whose detail survives a 12 m camera.
 */
const PLACEMENT: Record<string, { origin: Vec3; yaw: number }> = {
  nordwind: { origin: [-140, 10, 60], yaw: Math.PI / 2 },
  'alte-muehle': { origin: [-150, 10, -60], yaw: Math.PI / 2 },
  'kleiner-kreisel': { origin: [-100, 8, 145], yaw: Math.PI / 2 },
};

export async function stageTrackShowcase(ctx: MainContext): Promise<void> {
  sculpt(ctx.world.terrain as TerrainData);
  ctx.events.emit('terrain:changed', { rect: null });

  const track = ctx.module<TrackMainApi>('track');
  if (!track) {
    console.warn('[game/track] showcase: the track module has no api');
    return;
  }

  for (const preset of TRACK_LAYOUTS) {
    const place = PLACEMENT[preset.id] ?? { origin: preset.origin, yaw: preset.yaw };
    const data = layoutData(preset);
    const [pack, item] = preset.ride.split(':');
    const entity: Entity = {
      id: nextEntityId(ctx.world as never, 'coaster'),
      kind: 'coaster',
      pack,
      item,
      position: place.origin,
      yaw: place.yaw,
      data: { ...data, origin: place.origin, yaw: place.yaw } as unknown as Record<string, unknown>,
    };
    ctx.dispatch('entity:add', entity);
    const physics = track.physics(entity.id);
    const built = track.get(entity.id);
    if (!physics || !built) continue;
    // Printed rather than asserted: the harness reads console errors, and a layout that stops
    // completing after a change to an element should say so in the run that broke it.
    const issues = physics.issues.map((i) => `${i.severity}:${i.code}`).join(' ') || 'none';
    console.info(
      `[game/track] ${preset.name}: ${built.spline.length().toFixed(0)} m · ` +
        `${(physics.maxSpeed * 3.6).toFixed(0)} km/h · ${physics.maxDrop.toFixed(0)} m drop · ` +
        `${physics.minVerticalG.toFixed(2)}…${physics.maxVerticalG.toFixed(2)} g · ` +
        `${physics.airtimeSeconds.toFixed(1)} s airtime · closure ${built.closure.position.toFixed(2)} m · ` +
        `issues ${issues}`
    );
  }

  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.6;
    camera.beta = 1.2;
    camera.radius = 320;
    camera.target.set(-20, 14, 20);
  }
}

/**
 * Gentle relief, written straight into the heightfield.
 *
 * Core stages the showcase after the main handles exist and before the worker is started, so this
 * reaches the simulation's copy of the terrain too — the same trick the terrain and paths
 * showcases use, and the reason the supports stand on the ground the physics thinks is there.
 */
function sculpt(terrain: TerrainData): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      // A long ridge running east–west under all three layouts, so every one of them has columns
      // that grow and shrink along a straight; a shallow bowl in the middle for the small coaster
      // to sit in; and a slow roll to keep the ground from reading as a plane.
      const ridge = 5.5 * Math.exp(-((z + 150) ** 2) / (2 * 70 * 70));
      const bowl = -3.4 * Math.exp(-((x + 10) ** 2 + (z - 60) ** 2) / (2 * 110 * 110));
      const roll = Math.sin(x / 145 + 0.6) * Math.cos(z / 165 - 0.4) * 1.7;
      terrain.heights[j * w + i] = ridge + bowl + roll;
    }
  }
  terrain.waterLevel = -40;
}
