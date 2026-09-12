/**
 * The shop material atlas: eight procedural PBR surfaces in one texture set.
 *
 * `public/game/assets` is empty in this checkout, so none of this is a fallback — it is what ships,
 * and it is held to the art bible's "procedural fallbacks are real materials too: a generated brick
 * or plank texture with normal, never a flat colour".
 *
 * Three maps, generated together from one height field so all three agree:
 *   `albedo`  RGB(A) sRGB colour; A is 255 everywhere (the alpha-tested surfaces are geometry here)
 *   `normal`  RGB    tangent-space, OpenGL convention (green up), Sobel over the height
 *   `orm`     RGB    R ambient occlusion, G roughness, B metallic — the channel layout
 *                    `PBRMaterial.metallicTexture` reads with the three `use*FromMetallicTexture*`
 *                    flags set
 *
 * **These are detail maps, not colour maps.** What a surface shows is `texture.rgb × vertexColour`,
 * so each shader writes a luminance around 1.0 (roughly 0.6–1.25) carrying only the hue shift the
 * material itself has — moss in a mortar joint, warm dust on a pantile — and the palette in
 * `manifest.ts` carries the colour. Writing the full colour into both squares the darkness, which
 * is how the scenery module's first bark texture rendered every oak as a black post.
 *
 * **Per-unit tone variation is not decoration, it is the difference between a material and a grid.**
 * The paths critique measured a 2.9 % tone spread across the four slabs that exist before that
 * module's flagship concrete repeats, and called it "one colour with a grid drawn on it" — which is
 * what its own docblock said it existed to prevent. So every unit here — brick, pantile, board,
 * paving slab — draws a tone from a hash of its own row and column, at ±14 to ±22 %, and the
 * selftest measures the spread rather than trusting the intent.
 *
 * **The normal is computed per tile, wrapped inside it.** A Sobel over the whole atlas would read
 * the pantile's ridge as a step in the brick beside it, and put a bright seam down every tile
 * boundary in the park.
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import { ATLAS_COLS, ATLAS_ROWS } from './geometry';
import { clamp01 } from './noise';
import { SHADERS, type Sample } from './shaders';

export interface ShopAtlas {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
  /** Pixels per tile side. */
  tileSize: number;
  generateMs: number;
  /** Per-tile mean albedo luminance and its standard deviation, for the selftest and the report. */
  spread: Array<{ tile: number; mean: number; sd: number }>;
  dispose(): void;
}

function to8(v: number): number {
  const n = Math.round(clamp01(v) * 255);
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

export function createShopAtlas(scene: Scene, seed: number, tileSize: number): ShopAtlas {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const width = ATLAS_COLS * tileSize;
  const height = ATLAS_ROWS * tileSize;
  const albedo = new Uint8Array(width * height * 4);
  const orm = new Uint8Array(width * height * 4);
  const normal = new Uint8Array(width * height * 4);
  const heights = new Float32Array(tileSize * tileSize);
  const spread: ShopAtlas['spread'] = [];
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
    // Sobel INSIDE the tile, wrapped at its own edges. See the docblock.
    const at = (x: number, y: number): number =>
      heights[((y + tileSize) % tileSize) * tileSize + ((x + tileSize) % tileSize)];
    const strength = 2.6;
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
    spread.push({ tile: entry.tile, mean, sd: Math.sqrt(Math.max(0, sumSq / n - mean * mean)) });
  }

  const albedoTex = raw(scene, albedo, width, height, 'shops-atlas-albedo', true);
  const normalTex = raw(scene, normal, width, height, 'shops-atlas-normal', false);
  const ormTex = raw(scene, orm, width, height, 'shops-atlas-orm', false);
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
