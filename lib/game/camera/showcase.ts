/**
 * `/game?showcase=camera` — the landscape this module has to keep a camera out of, plus three
 * extra presets that make its two invisible rules photographable.
 *
 * A camera draws nothing, so a showcase of it cannot be a picture of the module; it has to be a
 * picture of the module's *claims*. The terrain comes from `terrain`'s own showcase generator
 * (public API, reused rather than re-derived) because it has a lake, an escarpment and a ridge —
 * three things a camera can be driven into. On top of it:
 *
 * - `leash-out` puts the camera at the target leash looking AWAY from the park, which is the one
 *   framing where "a camera that can fly past the dome shows the world ending" would show. The
 *   arithmetic is in `pose.ts`; this is the frame that either agrees with it or does not.
 * - `floor` asks for a nearly horizontal camera with its target on the ground, which on this
 *   relief puts the eye inside a hill. What comes out is `clampPose`'s ground rule.
 * - `top` asks for the other end of the beta limit.
 *
 * They are registered through the module's own public `registerPreset()` — the same path a
 * content pack's `cameraPresets` entry takes — so the showcase is also the extensibility demo.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, TerrainData } from '../core/types';
import { generateShowcaseLandscape } from '../terrain';
import type { CameraMainApi } from './main';

export async function stageCameraShowcase(ctx: MainContext): Promise<void> {
  const terrain = ctx.world.terrain as TerrainData;
  generateShowcaseLandscape(terrain, { seed: ctx.world.meta.seed, waterLevel: 0 });
  ctx.events.emit('terrain:changed', { rect: null });

  const api = ctx.module<CameraMainApi>('camera');
  if (api?.registerPreset) {
    api.registerPreset({
      id: 'leash-out',
      anchor: 'xz:0,400',
      height: 2,
      bearing: 180,
      pitch: 9,
      distance: 480,
    });
    api.registerPreset({
      id: 'floor',
      anchor: 'park:centre',
      height: 0,
      bearing: 250,
      pitch: 0.5,
      distance: 190,
    });
    api.registerPreset({
      id: 'top',
      anchor: 'park:centre',
      height: 2,
      bearing: 180,
      pitch: 84,
      distance: 340,
    });
  }

  // A default framing for someone opening the page by hand; the harness overrides it with a
  // preset. Written straight onto the camera on purpose — it is also the test that this module
  // ADOPTS an outside write instead of snapping back from it on the next frame.
  const scene = ctx.scene as Scene;
  const camera = scene.activeCamera as ArcRotateCamera | null;
  if (camera && 'alpha' in camera) {
    camera.alpha = -Math.PI / 2.6;
    camera.beta = 1.22;
    camera.radius = 260;
    camera.target.set(0, 6, 10);
  }
}
