/**
 * The building material atlas: twelve procedural PBR surfaces in one texture set.
 *
 * `public/game/assets` is empty in this checkout, so none of this is a fallback — it is what ships,
 * and it is held to the art bible's "procedural fallbacks are real materials too: a generated brick
 * or plank texture with normal, never a flat colour".
 *
 * Three maps, generated together from one height field so all three agree:
 *   `albedo`  RGB(A) sRGB colour; A is 255 everywhere
 *   `normal`  RGB    tangent-space, OpenGL convention (green up), Sobel over the height
 *   `orm`     RGB    R ambient occlusion, G roughness, B metallic — the channel layout
 *                    `PBRMaterial.metallicTexture` reads with the three `use*FromMetallicTexture*`
 *                    flags set
 *
 * **The normal is computed per tile, wrapped inside it.** A Sobel over the whole atlas would read
 * the slate's course step as a step in the brick beside it and put a bright seam down every tile
 * boundary in the park.
 *
 * **The cost is at boot and is paid once for the whole park.** Twelve tiles at 224² is 602 k samples
 * across three maps; the figure the harness measures is in `generateMs` and in the report. It is one
 * atlas for every building of every style, which is what makes a building three draw calls no matter
 * how many materials the blueprint names.
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import { ATLAS_COLS, ATLAS_ROWS } from './geometry';
import { clamp01 } from './noise';
import { SHADERS, type Sample } from './shaders';

export interface BuildingAtlas {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
  tileSize: number;
  generateMs: number;
  /** Per-tile mean albedo luminance and its standard deviation, for the selftest and the report. */
  spread: Array<{ tile: number; name: string; mean: number; sd: number }>;
  dispose(): void;
}

function to8(v: number): number {
  const n = Math.round(clamp01(v) * 255);
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

export function createBuildingAtlas(scene: Scene, seed: number, tileSize: number): BuildingAtlas {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const width = ATLAS_COLS * tileSize;
  const height = ATLAS_ROWS * tileSize;
  const albedo = new Uint8Array(width * height * 4);
  const orm = new Uint8Array(width * height * 4);
  const normal = new Uint8Array(width * height * 4);
  const heights = new Float32Array(tileSize * tileSize);
  const spread: BuildingAtlas['spread'] = [];
  const sample: Sample = { r: 1, g: 1, b: 1, height: 0.5, roughness: 0.8, metallic: 0, ao: 1 };

  for (const entry of SHADERS) {
    const col = entry.tile % ATLAS_COLS;
    const row = Math.floor(entry.tile / ATLAS_COLS) % ATLAS_ROWS;
    const ox = col * tileSize;
    const oy = row * tileSize;
    const shade = entry.make(seed + entry.tile * 7919);
    let sum = 0;
    let sumSq = 0;
    for (let y = 0; y < tileSize; y++) {
      for (let x = 0; x < tileSize; x++) {
        sample.r = 1;
        sample.g = 1;
        sample.b = 1;
        sample.height = 0.5;
        sample.roughness = 0.8;
        sample.metallic = 0;
        sample.ao = 1;
        shade((x + 0.5) / tileSize, (y + 0.5) / tileSize, sample);
        const dst = ((oy + y) * width + (ox + x)) * 4;
        albedo[dst] = to8(sample.r);
        albedo[dst + 1] = to8(sample.g);
        albedo[dst + 2] = to8(sample.b);
        albedo[dst + 3] = 255;
        orm[dst] = to8(sample.ao);
        orm[dst + 1] = to8(sample.roughness);
        orm[dst + 2] = to8(sample.metallic);
        orm[dst + 3] = 255;
        heights[y * tileSize + x] = sample.height;
        const lum = sample.r * 0.2126 + sample.g * 0.7152 + sample.b * 0.0722;
        sum += lum;
        sumSq += lum * lum;
      }
    }
    const at = (x: number, y: number): number =>
      heights[((y + tileSize) % tileSize) * tileSize + ((x + tileSize) % tileSize)];
    const strength = 2.4;
    for (let y = 0; y < tileSize; y++) {
      for (let x = 0; x < tileSize; x++) {
        const dx =
          at(x + 1, y - 1) +
          2 * at(x + 1, y) +
          at(x + 1, y + 1) -
          (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
        const dy =
          at(x - 1, y + 1) +
          2 * at(x, y + 1) +
          at(x + 1, y + 1) -
          (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
        const nx = -dx * strength;
        const ny = -dy * strength;
        const len = Math.hypot(nx, ny, 1) || 1;
        const dst = ((oy + y) * width + (ox + x)) * 4;
        normal[dst] = to8((nx / len) * 0.5 + 0.5);
        normal[dst + 1] = to8((ny / len) * 0.5 + 0.5);
        normal[dst + 2] = to8((1 / len) * 0.5 + 0.5);
        normal[dst + 3] = 255;
      }
    }
    const n = tileSize * tileSize;
    const mean = sum / n;
    spread.push({
      tile: entry.tile,
      name: entry.name,
      mean,
      sd: Math.sqrt(Math.max(0, sumSq / n - mean * mean)),
    });
  }

  const albedoTex = raw(scene, albedo, width, height, 'buildings-atlas-albedo', true);
  const normalTex = raw(scene, normal, width, height, 'buildings-atlas-normal', false);
  const ormTex = raw(scene, orm, width, height, 'buildings-atlas-orm', false);
  const generateMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;

  return {
    albedo: albedoTex,
    normal: normalTex,
    orm: ormTex,
    tileSize,
    generateMs,
    spread,
    dispose() {
      albedoTex.dispose();
      normalTex.dispose();
      ormTex.dispose();
    },
  };
}

/**
 * One RGBA8 texture.
 *
 * `gammaSpace` is set explicitly rather than left to the default: albedo is colour and has to be
 * linearised on sampling, while a normal map and an ORM map are data and must not be. Getting that
 * backwards on the ORM map is invisible in a still and wrong in every light.
 *
 * `CLAMP_ADDRESSMODE` on both axes, because this is an atlas: a WRAP sampler would let a wall whose
 * UVs drifted a hair past the edge sample the tile next door.
 */
function raw(
  scene: Scene,
  data: Uint8Array,
  width: number,
  height: number,
  name: string,
  gammaSpace: boolean
): RawTexture {
  const tex = new RawTexture(
    data,
    width,
    height,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  tex.name = name;
  tex.gammaSpace = gammaSpace;
  tex.wrapU = Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = Texture.CLAMP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 8;
  return tex;
}
