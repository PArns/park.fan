/**
 * Image-based lighting generated from this module's own sky.
 *
 * `scene.environmentTexture` is a cube filled by the same `sky-model.ts` the dome draws, and its
 * irradiance is a real spherical-harmonic projection of those texels — not the analytic
 * `HemisphericLight` at 0.5 the renderer boots with. The difference is visible on any curved
 * surface: a hemispheric fill puts the same colour on every upward-facing normal, while this puts
 * warm light on the side facing the sun, cool sky on the side away from it and a dim green bounce
 * underneath, because the lower half of the cube is ground and not sky.
 *
 * The face layout is Babylon's own (`Misc/HighDynamicRange/cubemapToSphericalPolynomial`'s
 * `_FileFaces`, which is the OpenGL cube convention), so the same six arrays can be handed to the
 * GPU and to the harmonic projection with nothing in between to get wrong.
 *
 * What this is NOT: a GGX-prefiltered radiance chain. The specular mips are the driver's box
 * filter, which has the right energy and the wrong lobe. On a sky — smooth, low-frequency, no
 * bright fixtures except the sun — the difference is small, and the sun is put back explicitly as
 * a widened disc so a chrome surface still has a highlight to catch. See the report.
 */

import { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import { CubeMapToSphericalPolynomialTools } from '@babylonjs/core/Misc/HighDynamicRange/cubemapToSphericalPolynomial';
import '@babylonjs/core/Materials/Textures/baseTexture.polynomial';
import type { Scene } from '@babylonjs/core/scene';
import type { QualitySettings, Vec3 } from '../core/types';
import { evalSky, makeSkyRow, type SkyState } from './sky-model';
import { floatToHalf } from './half-float';
import { clamp01 } from './noise';

/** Face order is +X, -X, +Y, -Y, +Z, -Z — GL's, and Babylon's. */
const FACE_NAMES = ['right', 'left', 'up', 'down', 'front', 'back'] as const;

/**
 * The sun in the cube is widened to ~3° so a 64² face still catches it, and kept to 12× rather
 * than the ~10⁵× of the real thing: the directional light already carries the diffuse sun, and a
 * physical disc in here would double it and clip the harmonics besides. What it buys is the
 * highlight on metal.
 */
const CUBE_SUN_POWER = 12;
const CUBE_SUN_COS = Math.cos((3.2 * Math.PI) / 180);

export interface IblHandle {
  texture: RawCubeTexture;
  /** Refill from `state`; returns the mean sky luminance, which drives auto exposure. */
  update(state: SkyState, sunColor: Vec3, sunIntensity: number): number;
  meanLuminance(): number;
  dispose(): void;
}

export function createIbl(scene: Scene, quality: QualitySettings): IblHandle {
  const size = quality.preset === 'low' ? 32 : 64;
  const texels = size * size * 4;
  const float: Float32Array[] = [];
  const half: Uint16Array[] = [];
  for (let f = 0; f < 6; f++) {
    float.push(new Float32Array(texels));
    const h = new Uint16Array(texels);
    const one = floatToHalf(1);
    for (let i = 3; i < h.length; i += 4) h[i] = one;
    half.push(h);
  }

  const texture = new RawCubeTexture(
    scene,
    half as unknown as ArrayBufferView[],
    size,
    Constants.TEXTUREFORMAT_RGBA,
    Constants.TEXTURETYPE_HALF_FLOAT,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  texture.name = 'env-ibl';
  texture.gammaSpace = false;
  texture.lodGenerationScale = 0.8;

  let mean = 0.2;
  const rgb: Vec3 = [0, 0, 0];

  function update(state: SkyState, sunColor: Vec3, sunIntensity: number): number {
    const du = 2 / size;
    const minUV = du * 0.5 - 1;
    let lumSum = 0;
    const discPower = CUBE_SUN_POWER * clamp01(sunIntensity / 3) * (1 - clamp01(state.cloud * 1.1));
    for (let f = 0; f < 6; f++) {
      const data = float[f];
      const out = half[f];
      let i = 0;
      for (let y = 0; y < size; y++) {
        const v = minUV + y * du;
        for (let x = 0; x < size; x++) {
          const u = minUV + x * du;
          let dx: number;
          let dy: number;
          let dz: number;
          switch (f) {
            case 0:
              dx = 1;
              dy = -v;
              dz = -u;
              break;
            case 1:
              dx = -1;
              dy = -v;
              dz = u;
              break;
            case 2:
              dx = u;
              dy = 1;
              dz = v;
              break;
            case 3:
              dx = u;
              dy = -1;
              dz = -v;
              break;
            case 4:
              dx = u;
              dy = -v;
              dz = 1;
              break;
            default:
              dx = -u;
              dy = -v;
              dz = -1;
              break;
          }
          const inv = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz);
          dx *= inv;
          dy *= inv;
          dz *= inv;
          evalSky(state, makeSkyRow(state, dy), dx, dy, dz, rgb);
          if (discPower > 0.01) {
            const cosSun = dx * state.sun[0] + dy * state.sun[1] + dz * state.sun[2];
            if (cosSun > CUBE_SUN_COS) {
              rgb[0] += sunColor[0] * discPower;
              rgb[1] += sunColor[1] * discPower;
              rgb[2] += sunColor[2] * discPower;
            }
          }
          data[i] = rgb[0];
          data[i + 1] = rgb[1];
          data[i + 2] = rgb[2];
          data[i + 3] = 1;
          out[i] = floatToHalf(rgb[0]);
          out[i + 1] = floatToHalf(rgb[1]);
          out[i + 2] = floatToHalf(rgb[2]);
          lumSum += rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
          i += 4;
        }
      }
    }
    mean = lumSum / (size * size * 6);

    texture.update(
      half as unknown as ArrayBufferView[],
      Constants.TEXTUREFORMAT_RGBA,
      Constants.TEXTURETYPE_HALF_FLOAT,
      false
    );

    try {
      const info = {
        size,
        format: Constants.TEXTUREFORMAT_RGBA,
        type: 1,
        gammaSpace: false,
      } as Record<string, unknown>;
      for (let f = 0; f < 6; f++) info[FACE_NAMES[f]] = float[f];
      texture.sphericalPolynomial =
        CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(info as never);
    } catch (error) {
      // A missing polynomial is a dimmer, flatter ambient — not a broken frame. Say so once.
      console.warn('[game/environment] irradiance projection failed', error);
    }
    return mean;
  }

  // A blank cube would light the first frame with black; fill it before anything renders.
  return {
    texture,
    update,
    meanLuminance: () => mean,
    dispose() {
      texture.dispose();
    },
  };
}
