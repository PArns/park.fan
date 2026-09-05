/**
 * Rain and snow: two particle systems, one enabled at a time, emitting from a box that rides with
 * the camera.
 *
 * The box follows the camera rather than covering the park because the park is 512 m across and a
 * volume that size needs two orders of magnitude more particles to reach the same density in
 * front of the lens. 30 m of box is wider than the camera's near field at any preset, and the
 * distance fog and the darkened sky carry the weather beyond it.
 *
 * Snow is not a sixth weather state — `WeatherKind` has five and this module does not own that
 * type. It is rain below 1.5 °C, decided in `weather-model.ts`, which is also how a real forecast
 * reads.
 */

import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Particles/particleSystemComponent';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import type { QualitySettings } from '../core/types';
import { rainStreak, softDot } from './textures';
import { clamp01 } from './noise';

const BOX_HALF = 15;
const BOX_TOP = 26;

export interface PrecipitationHandle {
  /** `kind` null stops everything; `intensity` is 0..1. */
  set(kind: 'rain' | 'snow' | null, intensity: number, windMs: number): void;
  follow(camera: Camera | null): void;
  dispose(): void;
}

export function createPrecipitation(
  scene: Scene,
  quality: QualitySettings
): PrecipitationHandle {
  const emitter = new Vector3(0, 0, 0);
  const rainTexture = rainStreak(scene);
  const snowTexture = softDot(scene, 'env-snowflake', 32, 1.5);

  const rain = new ParticleSystem('env-rain', Math.round(2600 * quality.particleScale), scene);
  rain.particleTexture = rainTexture;
  rain.emitter = emitter;
  rain.minEmitBox = new Vector3(-BOX_HALF, BOX_TOP, -BOX_HALF);
  rain.maxEmitBox = new Vector3(BOX_HALF, BOX_TOP + 4, BOX_HALF);
  rain.color1 = new Color4(0.62, 0.72, 0.88, 0.42);
  rain.color2 = new Color4(0.78, 0.84, 0.95, 0.3);
  rain.colorDead = new Color4(0.62, 0.72, 0.88, 0);
  rain.minSize = 0.07;
  rain.maxSize = 0.14;
  rain.minLifeTime = 1.15;
  rain.maxLifeTime = 1.5;
  rain.gravity = new Vector3(0, -30, 0);
  rain.direction1 = new Vector3(-0.6, -8, -0.6);
  rain.direction2 = new Vector3(0.6, -12, 0.6);
  rain.minEmitPower = 1;
  rain.maxEmitPower = 1.6;
  rain.updateSpeed = 0.016;
  rain.blendMode = ParticleSystem.BLENDMODE_STANDARD;
  rain.isBillboardBased = true;
  rain.billboardMode = ParticleSystem.BILLBOARDMODE_STRETCHED;
  rain.preWarmCycles = 60;
  rain.preWarmStepOffset = 2;

  const snow = new ParticleSystem('env-snow', Math.round(1400 * quality.particleScale), scene);
  snow.particleTexture = snowTexture;
  snow.emitter = emitter;
  snow.minEmitBox = new Vector3(-BOX_HALF, BOX_TOP, -BOX_HALF);
  snow.maxEmitBox = new Vector3(BOX_HALF, BOX_TOP + 4, BOX_HALF);
  snow.color1 = new Color4(1, 1, 1, 0.85);
  snow.color2 = new Color4(0.9, 0.94, 1, 0.6);
  snow.colorDead = new Color4(1, 1, 1, 0);
  snow.minSize = 0.07;
  snow.maxSize = 0.19;
  snow.minLifeTime = 6;
  snow.maxLifeTime = 9.5;
  snow.gravity = new Vector3(0, -1.5, 0);
  snow.direction1 = new Vector3(-0.9, -0.6, -0.9);
  snow.direction2 = new Vector3(0.9, -1.2, 0.9);
  snow.minEmitPower = 0.4;
  snow.maxEmitPower = 1.2;
  snow.minAngularSpeed = -1.4;
  snow.maxAngularSpeed = 1.4;
  snow.updateSpeed = 0.014;
  snow.blendMode = ParticleSystem.BLENDMODE_STANDARD;
  snow.preWarmCycles = 120;
  snow.preWarmStepOffset = 3;

  let active: 'rain' | 'snow' | null = null;

  function set(kind: 'rain' | 'snow' | null, intensity: number, windMs: number): void {
    const i = clamp01(intensity);
    // Wind shears the fall; a storm's drops arrive at an angle, which is most of what tells a
    // storm apart from a shower once the sky above is grey in both.
    const drift = Math.min(14, windMs) * 0.55;
    rain.direction1.set(-0.6 - drift * 0.1, -8, -0.6 - drift * 0.06);
    rain.direction2.set(0.6 + drift, -12, 0.6 + drift * 0.6);
    snow.direction1.set(-0.9 - drift * 0.2, -0.6, -0.9 - drift * 0.12);
    snow.direction2.set(0.9 + drift * 0.5, -1.2, 0.9 + drift * 0.3);

    if (kind !== active) {
      if (active === 'rain') rain.stop();
      if (active === 'snow') snow.stop();
      active = kind;
      if (kind === 'rain') rain.start();
      if (kind === 'snow') snow.start();
    }
    if (kind === 'rain') {
      rain.emitRate = Math.round(1800 * quality.particleScale * (0.25 + 0.75 * i));
      rain.maxSize = 0.1 + 0.08 * i;
    } else if (kind === 'snow') {
      snow.emitRate = Math.round(160 * quality.particleScale * (0.3 + 0.7 * i));
    }
  }

  return {
    set,
    follow(camera) {
      const cam = camera ?? scene.activeCamera;
      if (cam) emitter.copyFrom(cam.globalPosition);
    },
    dispose() {
      rain.dispose();
      snow.dispose();
      rainTexture.dispose();
      snowTexture.dispose();
    },
  };
}
