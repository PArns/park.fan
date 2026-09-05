/**
 * The lights, the shadows, the fog and the exposure.
 *
 * `core/renderer.ts` creates a directional sun, a `HemisphericLight` at 0.5 and a cascaded shadow
 * generator, and `applyEnvironment` writes to all three every time the clock moves. This module's
 * `onEnvironment` runs immediately after that call (see the loop in `core/host.ts`), which is what
 * makes it possible to own these numbers without owning the file. The four objects arrive through
 * `ctx.lights`; they used to be found by name, which was a contract in string literals.
 *
 * The hemispheric light is not removed, it is turned down to a fill of 0.10–0.25 with the sky's
 * own zenith and ground colours. The ambient proper comes from the IBL cube; what the hemisphere
 * still does is keep any `StandardMaterial` in the scene — which reads no environment texture at
 * all — from going black in the shade.
 *
 * Exposure is smoothed in real seconds rather than snapped, because the eye it is standing in for
 * takes about a second too; a jump of more than half an hour of park time (the clock control, the
 * screenshot harness) snaps instead, since nothing is adapting to that.
 */

import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import type { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator';
import type { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import type { Scene } from '@babylonjs/core/scene';
import type { EnvironmentState, MainContext, QualitySettings, Vec3 } from '../core/types';
import { sampleSky, type SkyState } from './sky-model';
import { clamp01, mix, smoothstep } from './noise';

/**
 * Auto exposure.
 *
 * The key is measured against a scene estimate, not against the sky alone: a sunlit park is lit
 * mostly by the sun, and metering off the sky's mean luminance opened up two stops at noon and
 * blew the whole upper half of the frame to white. `0.18` is the grey card, `1.6` turns the sky's
 * mean radiance into a rough irradiance, and `0.55` is the average cosine over surfaces that are
 * not all facing the sun. The `^0.7` is what stops a dusk sky from metering as if it were night.
 */
const EXPOSURE_KEY = 0.364;
const EXPOSURE_MIN = 0.55;
const EXPOSURE_MAX = 2.8;
/** Seconds to cross most of an exposure change. */
const EXPOSURE_TAU = 0.55;

const SHADOW_RANGE: Record<string, number> = {
  low: 220,
  medium: 320,
  high: 460,
  ultra: 620,
};

export interface LightingHandle {
  apply(env: EnvironmentState, sky: SkyState, meanLuminance: number, snap: boolean): void;
  /** Per render frame: ease exposure towards its target and refresh the fog colour. */
  render(dtSeconds: number, sky: SkyState): void;
  addShadowCaster(mesh: unknown, includeDescendants: boolean): void;
  removeShadowCaster(mesh: unknown): void;
  dispose(): void;
}

export function createLighting(
  scene: Scene,
  quality: QualitySettings,
  lights: MainContext['lights']
): LightingHandle {
  const sun = (lights.sun ?? null) as DirectionalLight | null;
  const hemi = (lights.hemi ?? null) as HemisphericLight | null;
  const shadow = (lights.shadow ?? null) as CascadedShadowGenerator | null;
  const pipeline = (lights.pipeline ?? null) as DefaultRenderingPipeline | null;

  // A second directional light for the moon. Without it a clear night is lit from nowhere: the
  // IBL alone gives shape but no direction, and moonlight is directional enough to read.
  const moon = new DirectionalLight('env-moon-light', new Vector3(0.2, -0.9, 0.3), scene);
  moon.intensity = 0;
  moon.diffuse = new Color3(0.5, 0.62, 0.95);
  moon.specular = new Color3(0.42, 0.52, 0.85);
  moon.shadowEnabled = false;

  if (shadow) {
    try {
      shadow.shadowMaxZ = SHADOW_RANGE[quality.preset] ?? 460;
      shadow.lambda = 0.82;
      shadow.stabilizeCascades = true;
      shadow.depthClamp = true;
      // Blending between cascades costs a second sample at the seam and is what stops the ground
      // banding into visible strips as the camera pulls back.
      shadow.cascadeBlendPercentage = quality.preset === 'low' ? 0 : 0.12;
      shadow.autoCalcDepthBounds = quality.preset === 'high' || quality.preset === 'ultra';
      shadow.bias = 0.0035;
      shadow.normalBias = 0.018;
      shadow.darkness = 0;
      if (quality.preset === 'ultra') {
        // Contact hardening: the shadow of a lamp post is sharp at its base and soft at its tip,
        // which is the single cue that reads as "real sun" rather than "shadow map".
        shadow.useContactHardeningShadow = true;
        shadow.contactHardeningLightSizeUVRatio = 0.035;
        shadow.filteringQuality = ShadowGenerator.QUALITY_HIGH;
      }
    } catch (error) {
      console.warn('[game/environment] shadow configuration rejected', error);
    }
  }

  const imageProcessing = scene.imageProcessingConfiguration;
  let exposure = imageProcessing.exposure || 1;
  let exposureTarget = exposure;
  const fogSample: Vec3 = [0, 0, 0];
  const forward = new Vector3(0, 0, 1);

  function apply(env: EnvironmentState, sky: SkyState, meanLuminance: number, snap: boolean): void {
    const day = 1 - env.night;
    if (sun) {
      // The sun is written here in full rather than left to core's `applyEnvironment`, because a
      // weather change arrives as an event and does not re-run that call: a shower would darken
      // the sky and leave the light at its clear-sky intensity until the clock ticked again.
      sun.direction.set(env.sunDirection[0], env.sunDirection[1], env.sunDirection[2]);
      sun.diffuse.set(env.sunColor[0], env.sunColor[1], env.sunColor[2]);
      // Specular is held under diffuse: at full strength every kerb edge on a clear noon becomes
      // a highlight, and the IBL is already supplying the sky's share of the reflection.
      sun.specular.set(env.sunColor[0] * 0.65, env.sunColor[1] * 0.65, env.sunColor[2] * 0.65);
      sun.intensity = env.sunIntensity;
      sun.shadowEnabled = env.sunElevation > 0.035 && env.sunIntensity > 0.05;
    }
    if (hemi) {
      const zenith: Vec3 = [0, 0, 0];
      sampleSky(sky, [0, 1, 0], zenith);
      hemi.diffuse.set(
        clamp01(zenith[0] * 2.2),
        clamp01(zenith[1] * 2.2),
        clamp01(zenith[2] * 2.2)
      );
      hemi.groundColor.set(sky.ground[0] * 2.4, sky.ground[1] * 2.4, sky.ground[2] * 2.4);
      hemi.intensity = 0.1 + 0.15 * day * (1 - 0.35 * env.cloud);
    }

    moon.direction.set(-sky.moon[0], -sky.moon[1], -sky.moon[2]);
    moon.intensity =
      0.2 * env.night * (0.15 + 0.85 * sky.moonPhase) * clamp01(sky.moon[1] * 3) * (1 - env.cloud);

    if (shadow) {
      // Softer, weaker shadows under cloud: an overcast sky is a 180° light source and casts
      // almost nothing, which is the difference between "grey day" and "sunny day with grey sky".
      shadow.darkness = 0.55 * smoothstep(0.55, 0.95, env.cloud);
    }

    scene.fogMode = 2; // FOGMODE_EXP2
    const rainy = env.weather === 'rain' || env.weather === 'storm';
    // Dawn mist: real and short, and only in the morning — an evening at the same sun elevation
    // has a warm dry haze instead, which the sky model's own haze band already gives.
    const morning = env.minute > 240 && env.minute < 600 ? 1 : 0;
    const lowSun = smoothstep(0.22, -0.02, Math.sin(env.sunElevation));
    scene.fogDensity =
      0.00045 +
      0.0013 * env.cloud +
      (rainy ? 0.0016 * (0.4 + 0.6 * env.wetness) : 0) +
      0.0016 * morning * lowSun * (1 - 0.6 * env.cloud);

    imageProcessing.contrast = mix(1.12, 0.98, env.cloud);
    if (pipeline) {
      pipeline.bloomThreshold = mix(0.86, 0.72, env.night);
      pipeline.bloomWeight = 0.24 + 0.3 * env.night;
    }

    const sunLuminance =
      env.sunIntensity *
      (env.sunColor[0] * 0.2126 + env.sunColor[1] * 0.7152 + env.sunColor[2] * 0.0722);
    const sceneKey = 0.18 * (meanLuminance * 1.6 + sunLuminance * 0.55);
    exposureTarget = clamp(
      EXPOSURE_KEY / Math.pow(Math.max(0.0035, sceneKey), 0.7),
      EXPOSURE_MIN,
      EXPOSURE_MAX
    );
    if (snap) exposure = exposureTarget;
  }

  function render(dt: number, sky: SkyState): void {
    const k = 1 - Math.exp(-dt / EXPOSURE_TAU);
    exposure += (exposureTarget - exposure) * k;
    imageProcessing.exposure = exposure;

    // Fog takes the colour of the sky the camera is actually facing, sampled just above the
    // horizon. A fixed grey turns every sunset into a grey sunset at 400 m.
    //
    // The heading comes from the camera's own target rather than `getForwardRay`, which needs the
    // `Culling/ray` side-effect module — pulling in the whole ray/picking path to read a direction
    // costs bundle size the game budget does not have, and without it every frame logs an error.
    const camera = scene.activeCamera as unknown as {
      position?: Vector3;
      getTarget?: () => Vector3;
    } | null;
    const target = camera?.getTarget?.();
    if (camera?.position && target) {
      target.subtractToRef(camera.position, forward);
      const len = Math.hypot(forward.x, forward.z);
      if (len > 1e-4) {
        sampleSky(sky, [forward.x / len, 0.045, forward.z / len], fogSample);
        scene.fogColor.set(fogSample[0] * 1.04, fogSample[1] * 1.04, fogSample[2] * 1.06);
        scene.clearColor.set(fogSample[0], fogSample[1], fogSample[2], 1);
      }
    }
  }

  return {
    apply,
    render,
    addShadowCaster(mesh, includeDescendants) {
      if (!shadow || !mesh) return;
      try {
        shadow.addShadowCaster(mesh as never, includeDescendants);
      } catch (error) {
        console.warn('[game/environment] shadow caster rejected', error);
      }
    },
    removeShadowCaster(mesh) {
      if (!shadow || !mesh) return;
      try {
        shadow.removeShadowCaster(mesh as never, true);
      } catch {
        /* already gone */
      }
    },
    dispose() {
      moon.dispose();
    },
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
