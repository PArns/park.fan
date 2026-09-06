/**
 * The main-thread half: materials, the instanced fleet, the shadow wiring, and the camera follow
 * source that finally gives `camera.follow()` something that moves.
 *
 * Thin on purpose. Everything about how a car LOOKS is in `geometry.ts` and `materials.ts`,
 * everything about how the fleet is BATCHED is in `fleet.ts`, and everything a train DOES is in
 * `sim.ts` on the worker. What is left here is the wiring.
 *
 * **The roster arrives as an event, not as a buffer.** A car's ride, its index in its train and the
 * style it is drawn from are strings and small integers that change only when a coaster is built or
 * removed — putting them in the 20 Hz frame would be re-sending a constant twenty times a second.
 * The worker emits `train:roster` when the fleet changes, core forwards it (the `train:` prefix is
 * already in `FORWARDED_PREFIXES`), and the frame carries nothing but `trains.transform`, which is
 * exactly what ARCHITECTURE §5 allocates to this module.
 *
 * **The follow source is two lines and it is the point of §5 of `requests/camera.md`.** The camera
 * module ships a stand-in that walks the track spline at a fixed speed and says in its own docblock
 * that it exists because nothing in the world moves. Sources are consulted newest-first, so
 * registering here shadows it for the `train:` ids and leaves `track:` alone.
 */

import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, MainHandle, SimFrame } from '../core/types';
import type { TrackData } from '../track';
import { resolveStyle } from '../track';
import type { CameraMainApi } from '../camera/main';
import { createFleetRenderer, type FleetRenderer, type FleetStats } from './fleet';
import { carMetrics, type CarMetrics } from './geometry';
import { createTrainMaterials, type TrainMaterials } from './materials';
import { attachTrainContent, resolveTrainProfile } from './manifest';
import type { RosterCar, RosterMessage, TrainProfile } from './types';

/** Texture resolution per preset. Three sets shared by every train in the park. */
const TEXTURE_SIZE = { low: 128, medium: 256, high: 256, ultra: 512 } as const;

export interface TrainsMainApi {
  stats(): FleetStats;
  meshes(): AbstractMesh[];
  /** Ride ids that currently have trains drawn on them, in roster order. */
  rides(): string[];
  /** How many trains a ride is running. */
  trainCount(rideId: string): number;
  /**
   * The follow id of one train, for `camera.follow()`.
   * `train:<rideId>:<index>`; `train:<rideId>` means the first train.
   */
  followId(rideId: string, train?: number): string;
  /** World position and heading of a train's leading car, interpolated to this frame. */
  leadPose(rideId: string, train?: number): { position: [number, number, number]; heading: number } | null;
  profile(rideId: string): TrainProfile | undefined;
}

export function createTrainsMain(ctx: MainContext): MainHandle {
  // Both halves of the module claim the pack category and read it: `onPack` fires on registration
  // and the bundled packs are registered before any module's `main()` runs, so a listener alone
  // would miss exactly the packs the game ships with.
  const detachContent = attachTrainContent(ctx.registry);

  const scene = ctx.scene as Scene;
  const materials: TrainMaterials = createTrainMaterials(
    scene,
    ctx.rng.int(1, 1 << 28),
    TEXTURE_SIZE[ctx.quality.preset] ?? 256
  );
  const fleet: FleetRenderer = createFleetRenderer({
    scene,
    materials,
    quality: ctx.quality,
  });

  interface EnvironmentLike {
    addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
    removeShadowCaster?(mesh: unknown): void;
  }
  const shadowed: Mesh[] = [];
  let roster: RosterCar[] = [];
  const profiles = new Map<string, TrainProfile>();

  /**
   * The car measurements for a style.
   *
   * The gauge and the rail radius come from the TRACK style of the ride the car belongs to, not
   * from the train — a car's wheels have to sit on the rails that are actually there, and the three
   * bundled track styles run 1.1, 1.2 and 1.3 m gauges with three different rail radii. Where two
   * rides share a train style on different track, the first ride in roster order decides; that is a
   * real limitation and it is in the report.
   */
  function metricsFor(profileKey: string): CarMetrics {
    const profile = profiles.get(profileKey);
    const car = roster.find((c) => c.profile === profileKey);
    const entity = car ? ctx.world.entities[car.rideId] : undefined;
    const data = entity?.data as unknown as TrackData | undefined;
    const style = resolveStyle(ctx.registry, data?.style);
    const fallback: TrainProfile = profile ?? {
      key: profileKey,
      cars: 4,
      seatsPerCar: 4,
      seatsPerRow: 2,
      carLength: 3,
      carWidth: 1.85,
      carHeight: 1.15,
      massPerCar: 900,
      riderMass: 70,
      dragArea: 2,
      rollingResistance: 0.019,
      heartline: 1.1,
      restraint: 'lap',
      nose: 'wedge',
      dwellSeconds: 20,
      livery: { body: '#c0c6cf', trim: '#1c222a', chassis: '#2b3038', seat: '#15181d' },
    };
    return carMetrics(fallback, style.rail.gauge, style.rail.radius);
  }

  function applyRoster(message: RosterMessage): void {
    roster = message.cars;
    profiles.clear();
    for (const p of message.profiles) profiles.set(p.key, p);
    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of shadowed) env?.removeShadowCaster?.(mesh);
    shadowed.length = 0;
    fleet.setRoster(roster, message.profiles, metricsFor);
    if (env?.addShadowCaster) {
      for (const mesh of fleet.shadowMeshes()) {
        env.addShadowCaster(mesh, false);
        shadowed.push(mesh);
      }
    }
  }

  const offRoster = ctx.events.on('train:roster', (payload: RosterMessage) => {
    applyRoster(payload);
  });

  /**
   * `train:<rideId>` and `train:<rideId>:<index>`.
   *
   * The id space is this module's to define — `requests/camera.md` §5 says so in as many words —
   * and it is namespaced by the module rather than by the entity so a source registered later
   * cannot shadow a plain entity id by accident.
   */
  const detachFollow = ctx
    .module<CameraMainApi>('camera')
    ?.registerFollowSource((id: string) => {
      if (!id.startsWith('train:')) return null;
      const rest = id.slice(6);
      const colon = rest.lastIndexOf(':');
      const rideId = colon > 0 ? rest.slice(0, colon) : rest;
      const index = colon > 0 ? Number(rest.slice(colon + 1)) : 0;
      if (!Number.isFinite(index)) return null;
      const pose = fleet.leadPose(rideId, index);
      if (!pose) return null;
      return { position: pose.position, heading: pose.heading };
    });

  const api: TrainsMainApi = {
    stats: () => fleet.stats(),
    meshes: () => fleet.meshes(),
    rides: () => [...new Set(roster.map((c) => c.rideId))],
    trainCount: (rideId) => {
      const set = new Set<number>();
      for (const car of roster) if (car.rideId === rideId) set.add(car.train);
      return set.size;
    },
    followId: (rideId, train = 0) => `train:${rideId}:${train}`,
    leadPose: (rideId, train = 0) => fleet.leadPose(rideId, train),
    profile(rideId) {
      const car = roster.find((c) => c.rideId === rideId);
      if (car) return profiles.get(car.profile);
      // Nothing has been drawn yet — resolve it from the entity so a build panel can ask before
      // the first frame arrives.
      const entity = ctx.world.entities[rideId];
      const data = entity?.data as unknown as TrackData | undefined;
      return data ? resolveTrainProfile(ctx.registry, data) : undefined;
    },
  };

  return {
    api,
    onFrame(frame: SimFrame, previous: SimFrame | null, alpha: number) {
      fleet.update(frame, previous, alpha);
    },
    dispose() {
      offRoster();
      detachFollow?.();
      detachContent();
      const env = ctx.module<EnvironmentLike>('environment');
      for (const mesh of shadowed) env?.removeShadowCaster?.(mesh);
      shadowed.length = 0;
      fleet.dispose();
      materials.dispose();
    },
  };
}
