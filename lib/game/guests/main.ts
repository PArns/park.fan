/**
 * The crowd on screen: materials, the instanced meshes, and the per-frame update.
 *
 * This file is thin on purpose. Everything about how a guest LOOKS is in `geometry.ts`,
 * `materials.ts` and `appearance.ts`; everything about how the crowd is BATCHED is in `crowd.ts`;
 * and everything a guest DOES is in `sim.ts` on the worker. What is left here is the wiring: build
 * the materials once, hand the crowd the archetype list the packs resolved to, push each simulated
 * frame at it with the interpolation factor, and give the near band to the sun's shadow generator.
 *
 * The camera position is read every frame because the crowd's LOD and its draw cap are both
 * distance-driven. It is read off `scene.activeCamera` rather than passed in, for the same reason
 * `environment/lighting.ts` reads its heading there: a module that asked for the camera in its
 * constructor would be wrong the moment the camera module swaps presets.
 */

import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, MainHandle, SimFrame } from '../core/types';
import { createCrowd, type Crowd, type CrowdStats } from './crowd';
import { createGuestMaterials, type GuestMaterials } from './materials';
import { attachGuestContent, guestArchetypes } from './manifest';

/**
 * Texture resolution per preset. The three guest materials are one shared set for the whole crowd
 * — a guest's colour comes from a thin-instance colour buffer, not from its own texture — so this
 * is three textures for two thousand people and can afford to be generous.
 */
const TEXTURE_RESOLUTION: Record<string, number> = {
  low: 64,
  medium: 128,
  high: 256,
  ultra: 256,
};

export interface GuestsMainApi {
  stats(): CrowdStats;
  /** Every mesh the crowd draws, for a critic or a debugger counting them. */
  meshes(): Mesh[];
}

interface EnvironmentApi {
  addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
  removeShadowCaster?(mesh: unknown): void;
}

export function createGuestsMain(ctx: MainContext): MainHandle {
  // Claim the pack categories and read them, at boot and afterwards. Both halves of the module do
  // it: `onPack` fires on registration and the bundled packs are registered before any module is
  // built, so a listener alone would miss exactly the packs the game ships with.
  const detachContent = attachGuestContent(ctx.registry);

  const scene = ctx.scene as Scene;
  const preset = ctx.quality.preset;
  const materials: GuestMaterials = createGuestMaterials(
    scene,
    ctx.rng.int(1, 1 << 28),
    TEXTURE_RESOLUTION[preset] ?? 128
  );
  const crowd: Crowd = createCrowd({
    scene,
    materials,
    quality: ctx.quality,
    archetypes: guestArchetypes(),
  });

  // A pack that lands later brings new archetypes with it, and the crowd holds the list it draws
  // from. Re-handing it is cheap — it re-resolves colours, it does not rebuild a mesh.
  const detachRefresh = ctx.registry.onPack(() => {
    crowd.archetypes(guestArchetypes());
  });

  const env = ctx.module<EnvironmentApi>('environment');
  const shadowed: Mesh[] = [];
  if (env?.addShadowCaster) {
    // Only the near band casts. A guest at 120 m contributes a shadow smaller than a shadow-map
    // texel, and the terrain module was just cut by 73,728 triangles for doing exactly this kind
    // of thing at the wrong level of detail.
    for (const mesh of crowd.shadowMeshes()) {
      env.addShadowCaster(mesh, false);
      shadowed.push(mesh);
    }
  }

  const cameraAt: [number, number, number] = [0, 0, 0];
  let elapsed = 0;

  const handle: MainHandle = {
    onFrame(frame: SimFrame, previous: SimFrame | null, alpha: number) {
      const camera = scene.activeCamera;
      if (camera) {
        cameraAt[0] = camera.globalPosition.x;
        cameraAt[1] = camera.globalPosition.y;
        cameraAt[2] = camera.globalPosition.z;
      }
      crowd.update(frame, previous, alpha, cameraAt, elapsed);
    },
    onRender(dtSeconds: number) {
      // The walk cycle's clock. Real seconds and not park minutes: a crowd at 100× speed must
      // still walk at a walking pace, or two thousand people sprint on the spot.
      elapsed += dtSeconds;
    },
    api: {
      stats: () => crowd.stats(),
      meshes: () => crowd.meshes(),
    } satisfies GuestsMainApi,
    dispose() {
      detachRefresh();
      detachContent();
      if (env?.removeShadowCaster) {
        for (const mesh of shadowed) env.removeShadowCaster(mesh);
      }
      shadowed.length = 0;
      crowd.dispose();
      materials.dispose();
    },
  };
  return handle;
}
