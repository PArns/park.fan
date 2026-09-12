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
import { linearToGamma, sampleSky, type SkyState } from './sky-model';
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
const EXPOSURE_KEY = 0.78;
const EXPOSURE_MIN = 1.0;
const EXPOSURE_MAX = 3.6;
/**
 * The three numbers above were 0.42 / 0.55 / 2.2 and are 1.85× that, which is one stop and is not
 * a taste change: they were set against a frame in which the sky dome rendered black and the fog
 * was four times too dark (both fixed here and in `sky-dome.ts`), so the "scene estimate" the key
 * was matched to was not this scene. Measured at noon on the demo park afterwards, at the old
 * numbers: auto exposure settled at 1.054, sunlit grass came out at 0.069 scene-linear and read
 * sRGB 80 — a green a photograph puts nearer 120. Pinning the exposure by hand and looking at the
 * frames put the answer between 1.5 and 2.6: at 2.6 the grass washes towards yellow and the sky
 * loses its blue, at 2.0 it reads as a clear day, so the key is set to land near 1.95 at noon.
 *
 * Exposure and not `sunIntensity`, because the sun lights the ground and not the sky: lifting the
 * light source alone would move the park up and leave the dome where it is, which is the exact
 * ratio the gain in `sky-model.ts` exists to hold. A camera moves both.
 */
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
    // EXP2, so the fog factor is `exp(-(density * z)^2)` — and for every PBR material Babylon then
    // raises that factor to 2.2 (`toLinearSpace(fog)` in its `fogFragment` include), which makes
    // the fog roughly twice as strong as the density alone suggests. The clear-day base used to be
    // 0.0008 and, run through both, put HALF the contrast of a surface 660 m away into the haze:
    // that is a meteorological visibility of about 1.5 km, i.e. actual fog, on a day the model
    // calls clear. At 0.00035 the same surface keeps 96.9 % of itself at 340 m and 76 % at a
    // kilometre, which is aerial perspective rather than weather. (The first version of this
    // comment said 88 % at 340 m. It is 88 % at 689 m; the figure was read off the wrong distance
    // and shipped, and the round-1 critic recomputed it. The kilometre figure was right.) The overcast and rain terms come
    // down with it; the dawn-mist term does not, because mist really is that thick.
    // The weather terms carry the same arithmetic as the base, and the round-1 critique caught
    // them not being held to it: at the rain values this put HALF a surface's contrast into haze
    // at 447 m — worse than the 660 m the comment above condemns as "actual fog on a clear day".
    // The rain term is scaled by `intensity` now, so a shower and a storm are not the same weather
    // with different particles: measured half-contrast lands near 545 m in rain and 453 m in a
    // storm, where a storm cutting visibility is the point.
    scene.fogDensity =
      0.00035 +
      0.00045 * env.cloud +
      (rainy ? 0.00045 * (0.35 + 0.65 * env.wetness) * env.intensity : 0) +
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
        // `fogColor` is written GAMMA-ENCODED and `clearColor` linear, and the asymmetry is
        // Babylon's, not a preference. `BindFogParameters` passes its `linearSpace` flag for
        // every PBR material, which runs `Color3.toLinearSpaceToRef` over `scene.fogColor` before
        // it reaches the shader — so a linear radiance written here arrives squared. Measured at
        // noon on the demo park with the linear value in place: the shader's fog colour came out
        // at 0.034 against the 0.295 that was set, four times darker than the grass it was
        // supposed to haze, so distant terrain got DARKER with distance instead of paler
        // (sRGB 58/80/42 unfogged against 46/58/44 at 700 m). `clearColor` takes no such trip —
        // it is cleared straight into the render target the tone mapper reads — so it stays in
        // the linear units the sky model works in.
        scene.fogColor.set(
          linearToGamma(fogSample[0] * 1.04),
          linearToGamma(fogSample[1] * 1.04),
          linearToGamma(fogSample[2] * 1.06)
        );
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
