/**
 * `/game?showcase=trains` — the track module's three circuits, with trains running on them.
 *
 * **It stages the track showcase rather than copying it.** `trackModule.showcase` sculpts the
 * relief, places the three layouts as ENTITIES through `ctx.dispatch('entity:add', …)` and frames
 * the camera; re-implementing any of that here would mean two placements to keep in step and a
 * second chance to get the terrain wrong. What this file adds is the fourth thing the track
 * showcase could not have: a fleet.
 *
 * **And it proves the extensibility gate in the frame rather than in a paragraph.** A pack is
 * registered here at runtime — `trains-showcase`, with its own `trainStyles` entry and its own
 * `trainProfiles` entry — and the family coaster is pointed at it with one `entity:update`. Car
 * count, seats per row, mass, drag area, rolling resistance, restraint type, nose shape and the
 * whole four-colour livery come out of that manifest and nowhere else, and the difference is
 * visible: eight short cars in cream and oxblood with lap bars and a domed nose, against the same
 * ride's derived four-car blue train with shoulder harnesses. No code in `lib/game/trains` knows
 * the pack exists.
 *
 * The pack is registered BEFORE the worker starts (`host.boot` step 6 stages the showcase, step 7
 * sends `packs: [...registry.packs()]` in `init`), so the sim resolves the same profile the
 * renderer draws. That ordering is core's and it is what makes a runtime pack work at all.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { Entity, MainContext } from '../core/types';
import type { TrackData } from '../track';
import { trackModule } from '../track';
import type { TrainsMainApi } from './main';

/**
 * A content pack that exists only in this showcase.
 *
 * Everything in it is data. The `trainProfiles` key is the category this module claims through
 * `registry.registerPackCategory('trainProfiles', 'trains')`; core keeps unknown top-level keys
 * (`packManifestSchema` is `.passthrough()`) and reports the ones nobody claimed, which is the
 * mechanism the `track` module's round-2 critique had to have built before any of this could work.
 */
const SHOWCASE_PACK = {
  id: 'trains-showcase',
  version: 1,
  name: { en: 'Trains showcase', de: 'Zug-Schaufenster' },
  requires: [],
  trainStyles: [
    {
      id: 'vintage-8',
      car: { length: 2.35, width: 1.72, height: 1.02, seats: 4, procedural: 'car-vintage' },
      color: '#e8dcc0',
    },
  ],
  trainProfiles: [
    {
      id: 'vintage-8',
      cars: 8,
      seatsPerCar: 4,
      seatsPerRow: 2,
      carLength: 2.35,
      carWidth: 1.72,
      carHeight: 1.02,
      // A short, light 1970s car — half the mass of a modern one and rougher on the rail.
      massPerCar: 620,
      riderMass: 70,
      dragArea: 1.65,
      rollingResistance: 0.022,
      heartline: 1.1,
      restraint: 'lap',
      nose: 'round',
      dwellSeconds: 26,
      livery: { body: '#e8dcc0', trim: '#7a2318', chassis: '#33302b', seat: '#5a2a20' },
    },
  ],
} as const;

/** Which of the track showcase's layouts gets the pack-authored train. */
const SHOWCASE_LAYOUT = 'kleiner-kreisel';

export async function stageTrainsShowcase(ctx: MainContext): Promise<void> {
  await trackModule.showcase?.(ctx);

  try {
    ctx.registry.registerPack(SHOWCASE_PACK);
  } catch (error) {
    // A duplicate id means the showcase has already staged once in this registry. Everything below
    // still works; anything else is worth seeing in the console.
    console.warn('[game/trains] showcase pack not registered', error);
  }

  // Find the family coaster by the ride it was placed with — the layout the track showcase parks
  // in the middle of the frame, which is where a train's detail survives a screenshot.
  let target: Entity | undefined;
  for (const id of Object.keys(ctx.world.entities).sort()) {
    const entity = ctx.world.entities[id];
    if (entity.kind !== 'coaster') continue;
    const data = entity.data as unknown as TrackData | undefined;
    if (data?.ride?.endsWith(':family-invert') || entity.item === 'family-invert') target = entity;
  }
  if (target) {
    const data = target.data as unknown as TrackData;
    ctx.dispatch('entity:update', {
      ...target,
      data: { ...data, train: 'trains-showcase:vintage-8' } as unknown as Record<string, unknown>,
    });
  } else {
    console.warn(`[game/trains] showcase: no ${SHOWCASE_LAYOUT} layout to re-train`);
  }

  const trains = ctx.module<TrainsMainApi>('trains');
  for (const id of Object.keys(ctx.world.entities).sort()) {
    if (ctx.world.entities[id].kind !== 'coaster') continue;
    const profile = trains?.profile(id);
    if (!profile) continue;
    // Printed rather than asserted: the harness reads the console, and a profile that stops
    // resolving after a manifest change should say so in the run that broke it.
    console.info(
      `[game/trains] ${id}: ${profile.cars} cars × ${profile.seatsPerCar} seats · ` +
        `${profile.restraint} restraint · ${profile.nose} nose · ` +
        `${Math.round(profile.cars * (profile.massPerCar + profile.seatsPerCar * profile.riderMass))} kg · ` +
        `dwell ${profile.dwellSeconds} s · ${profile.livery.body}`
    );
  }

  // A framing that has a train in it before the harness applies a preset: the hyper coaster's lift
  // and first drop, which is where a train spends the most photogenic twenty seconds of its lap.
  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.2;
    camera.beta = 1.15;
    camera.radius = 130;
    camera.target.set(-70, 22, 60);
  }
}
