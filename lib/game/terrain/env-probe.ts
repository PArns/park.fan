/**
 * A stand-in image-based light for the terrain's own materials.
 *
 * PBR without a reflection texture has no ambient specular at all: a lake at roughness 0.05 comes
 * out black except for the sun's own highlight, and the ground loses the sky bounce that separates
 * a north-facing slope from a shadow. `core/renderer.ts` sets up IBL but nothing fills
 * `scene.environmentTexture` yet — that belongs to the `environment` module (requested in
 * `docs/game/requests/terrain.md`). Until it lands, the terrain carries a 32² procedural sky cube
 * on its own materials only, and drops it the moment the scene has a real one, so the two never
 * fight over which sky the ground is under.
 */

import { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture';
import { Constants } from '@babylonjs/core/Engines/constants';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { Scene } from '@babylonjs/core/scene';
import type { EnvironmentState } from '../core/types';
import { clamp01, mix } from './noise';

const FACE = 32;

/** Direction of texel (u, v) ∈ [-1, 1]² on cube face `f`, in the usual GL face order. */
function faceDirection(f: number, u: number, v: number, out: [number, number, number]): void {
  if (f === 0) {
    out[0] = 1;
    out[1] = -v;
    out[2] = -u;
  } else if (f === 1) {
    out[0] = -1;
    out[1] = -v;
    out[2] = u;
  } else if (f === 2) {
    out[0] = u;
    out[1] = 1;
    out[2] = v;
  } else if (f === 3) {
    out[0] = u;
    out[1] = -1;
    out[2] = -v;
  } else if (f === 4) {
    out[0] = u;
    out[1] = -v;
    out[2] = 1;
  } else {
    out[0] = -u;
    out[1] = -v;
    out[2] = -1;
  }
  const len = Math.hypot(out[0], out[1], out[2]) || 1;
  out[0] /= len;
  out[1] /= len;
  out[2] /= len;
}

function renderFaces(env: EnvironmentState): Uint8Array[] {
  const faces: Uint8Array[] = [];
  const dir: [number, number, number] = [0, 0, 0];
  const sky = env.skyColor;
  // The sun direction points from the sun into the world, so the disc sits the other way.
  const sx = -env.sunDirection[0];
  const sy = -env.sunDirection[1];
  const sz = -env.sunDirection[2];
  const zenith: [number, number, number] = [sky[0] * 0.72, sky[1] * 0.86, sky[2] * 1.12];
  const horizon: [number, number, number] = [
    sky[0] * 1.25 + 0.06,
    sky[1] * 1.15 + 0.06,
    sky[2] * 1.05 + 0.07,
  ];
  // What the ground bounces back up: grass and stone, dimmed by night.
  const bounce = 0.35 * (1 - env.night * 0.85);
  const ground: [number, number, number] = [0.19 * bounce, 0.2 * bounce, 0.15 * bounce];
  for (let f = 0; f < 6; f++) {
    const data = new Uint8Array(FACE * FACE * 4);
    for (let j = 0; j < FACE; j++) {
      const v = ((j + 0.5) / FACE) * 2 - 1;
      for (let i = 0; i < FACE; i++) {
        const u = ((i + 0.5) / FACE) * 2 - 1;
        faceDirection(f, u, v, dir);
        const up = dir[1];
        const t = clamp01(up * 1.6);
        let r = mix(horizon[0], zenith[0], t);
        let g = mix(horizon[1], zenith[1], t);
        let b = mix(horizon[2], zenith[2], t);
        if (up < 0) {
          const below = clamp01(-up * 2.2);
          r = mix(r, ground[0], below);
          g = mix(g, ground[1], below);
          b = mix(b, ground[2], below);
        }
        const toSun = clamp01(dir[0] * sx + dir[1] * sy + dir[2] * sz);
        const glow = Math.pow(toSun, 7) * 0.55 + Math.pow(toSun, 90) * 1.6;
        const lit = glow * env.sunIntensity * 0.34;
        r += env.sunColor[0] * lit;
        g += env.sunColor[1] * lit;
        b += env.sunColor[2] * lit;
        const at = (j * FACE + i) * 4;
        data[at] = Math.round(clamp01(r) * 255);
        data[at + 1] = Math.round(clamp01(g) * 255);
        data[at + 2] = Math.round(clamp01(b) * 255);
        data[at + 3] = 255;
      }
    }
    faces.push(data);
  }
  return faces;
}

export interface EnvProbe {
  texture: RawCubeTexture;
  /** Re-render the cube when the sky has moved enough to matter. Returns true when it did. */
  update(env: EnvironmentState): boolean;
  dispose(): void;
}

export function createEnvProbe(scene: Scene, env: EnvironmentState): EnvProbe {
  const texture = new RawCubeTexture(
    scene,
    renderFaces(env) as unknown as ArrayBufferView[],
    FACE,
    Constants.TEXTUREFORMAT_RGBA,
    Constants.TEXTURETYPE_UNSIGNED_BYTE,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  texture.name = 'terrain-sky-probe';
  texture.gammaSpace = true;
  let key = -1;
  return {
    texture,
    update(next) {
      // One step per 0.02 of elevation-sine plus a step per weather change: 24 park hours cost
      // about 90 re-uploads of 24 KB, which is nothing, and the sky never visibly steps.
      const k =
        Math.round(Math.sin(next.sunElevation) * 50) * 8 +
        Math.round(next.cloud * 4) * 2 +
        Math.round(next.night);
      if (k === key) return false;
      key = k;
      texture.update(
        renderFaces(next) as unknown as ArrayBufferView[],
        Constants.TEXTUREFORMAT_RGBA,
        Constants.TEXTURETYPE_UNSIGNED_BYTE,
        false
      );
      return true;
    },
    dispose() {
      texture.dispose();
    },
  };
}
