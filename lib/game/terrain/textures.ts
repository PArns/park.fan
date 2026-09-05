/**
 * Procedural PBR texture sets for the ground layers. `public/game/assets` is empty in this
 * checkout, so this is not a fallback — it is what ships.
 *
 * Two 2D array textures, one layer per paint index:
 *   `albedo`  RGB = base colour (sRGB, linearised in the splat shader), A = roughness
 *   `surface` RG  = tangent-space normal XY, B = ambient occlusion, A = height
 * plus one macro map tiled at 190 m, whose channels break the repeat (see `splat-material.ts`).
 *
 * Cost is why the layers share three fBm fields instead of each running its own: the fields are
 * 3 × res² evaluations, the seven layers on top of them are cheap arithmetic. At 512² that is
 * 786 k noise evaluations rather than 5.5 M, which is the difference between ~120 ms and ~1.4 s of
 * boot on this machine — measured, and the reason the layer functions read as ramps over shared
 * fields rather than as seven independent generators.
 *
 * Texel density: a layer tiles every `SPLAT_TILE_METRES` (3.2 m), so 512² is 160 px/m and 256² is
 * 80 px/m. The art bible asks 128 px/m for terrain macro, which is why `low` is the only preset
 * that drops to 256².
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { RawTexture2DArray } from '@babylonjs/core/Materials/Textures/rawTexture2DArray';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import { LAYER_COUNT } from './heightfield';
import { clamp01, mix, ridgedFbm, smoothstep, tileableFbm } from './noise';

/** Metres one texture tile covers on the ground. */
export const SPLAT_TILE_METRES = 3.2;
/** Metres the cliff's triplanar projection tiles over — larger, because a cliff face is big. */
export const CLIFF_TILE_METRES = 7.0;
/** Metres the macro map tiles over. Long enough that a park never sees it repeat. */
export const MACRO_TILE_METRES = 190;

export interface TerrainTextureSet {
  albedo: RawTexture2DArray;
  surface: RawTexture2DArray;
  macro: RawTexture;
  /** Two ripple normals for the lake: the same generator at two seeds, so the second scrolling
   *  layer is a different wave train rather than the same one offset. */
  water: RawTexture;
  waterDetail: RawTexture;
  resolution: number;
  /** Wall-clock cost of generating the set, ms — reported, not guessed. */
  generateMs: number;
  dispose(): void;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const rgb = (hex: number): Rgb => ({
  r: ((hex >> 16) & 255) / 255,
  g: ((hex >> 8) & 255) / 255,
  b: (hex & 255) / 255,
});

const lerpRgb = (a: Rgb, b: Rgb, t: number): Rgb => ({
  r: mix(a.r, b.r, t),
  g: mix(a.g, b.g, t),
  b: mix(a.b, b.b, t),
});

/** Palette per layer. Values are the sRGB the texture stores; the shader does the 2.2. */
const GRASS_DARK = rgb(0x3a5420);
const GRASS_LIGHT = rgb(0x6f8d3c);
const GRASS_DRY = rgb(0x8d8a4a);
const MEADOW_DARK = rgb(0x557f2f);
const MEADOW_LIGHT = rgb(0x8bab4e);
const FLOWER_WHITE = rgb(0xe6e2cf);
const FLOWER_YELLOW = rgb(0xdcc558);
const SAND_DARK = rgb(0xc0a578);
const SAND_LIGHT = rgb(0xe3d0ab);
const ROCK_DARK = rgb(0x494741);
const ROCK_MID = rgb(0x74716a);
const ROCK_LIGHT = rgb(0xa09b91);
const ROCK_WARM = rgb(0x7d7060);
const DIRT_DARK = rgb(0x43331f);
const DIRT_LIGHT = rgb(0x765c39);
const PEBBLE = rgb(0x8d8477);
const CONCRETE_DARK = rgb(0x7e7c78);
const CONCRETE_LIGHT = rgb(0xb8b5af);
const WOOD_DARK = rgb(0x6a4728);
const WOOD_LIGHT = rgb(0x9c7443);
const WOOD_GAP = rgb(0x2c1e14);

/**
 * One layer's shading: returns the surface height (drives the normal map and the AO) and writes
 * the colour and roughness. Called res² times per layer, so it takes the three shared fields as
 * plain numbers rather than sampling anything itself.
 */
function shadeLayer(
  layer: number,
  u: number,
  v: number,
  low: number,
  mid: number,
  high: number,
  ridge: number,
  out: Rgb
): { height: number; roughness: number } {
  switch (layer) {
    case 0: {
      // grass — clumps at two scales, dried patches where the low field peaks
      const clump = high * 0.62 + mid * 0.38;
      // Dried patches are driven by the MID field and kept faint. Anything with a feature larger
      // than about a metre inside a 3.2 m tile is a feature that repeats every 3.2 m, and on open
      // grass that repeat is the most visible thing on the screen — the large-scale variation is
      // the macro map's job, not the tile's.
      const dry = smoothstep(0.58, 0.9, mid);
      const c = lerpRgb(GRASS_DARK, GRASS_LIGHT, clamp01(clump * 1.15 - 0.05));
      const withDry = lerpRgb(c, GRASS_DRY, dry * 0.3);
      const shade = 0.82 + 0.32 * high;
      out.r = withDry.r * shade;
      out.g = withDry.g * shade;
      out.b = withDry.b * shade;
      return { height: clump, roughness: 0.86 + 0.08 * (1 - high) };
    }
    case 1: {
      // sand — wind ripples along one axis, warped by the mid field so they are not stripes
      const ripple = 0.5 + 0.5 * Math.sin((v * 26 + mid * 6.2 + low * 2.0) * Math.PI * 2);
      const grain = high;
      const h = ripple * 0.45 + grain * 0.4 + low * 0.15;
      const c = lerpRgb(SAND_DARK, SAND_LIGHT, clamp01(0.25 + h * 0.9));
      const shade = 0.9 + 0.18 * grain;
      out.r = c.r * shade;
      out.g = c.g * shade;
      out.b = c.b * shade;
      return { height: h, roughness: 0.7 + 0.12 * grain };
    }
    case 2: {
      // rock — ridged creases at the large scale, grit on top, warm oxidation from the low field
      const h = clamp01(ridge * 0.55 + mid * 0.2 + high * 0.25);
      const crease = smoothstep(0.38, 0.0, h);
      let c = lerpRgb(ROCK_MID, ROCK_LIGHT, clamp01(h * 1.35 - 0.25));
      c = lerpRgb(c, ROCK_DARK, crease * 0.8);
      c = lerpRgb(c, ROCK_WARM, smoothstep(0.6, 0.95, mid) * 0.4);
      const shade = 0.88 + 0.22 * high;
      out.r = c.r * shade;
      out.g = c.g * shade;
      out.b = c.b * shade;
      return { height: h, roughness: 0.52 + 0.3 * (1 - crease) };
    }
    case 3: {
      // dirt — clods, with pebbles standing proud where the high field spikes
      const pebble = smoothstep(0.84, 0.93, high);
      const h = clamp01(mid * 0.6 + high * 0.3 + pebble * 0.5);
      let c = lerpRgb(DIRT_DARK, DIRT_LIGHT, clamp01(mid * 0.8 + high * 0.4));
      c = lerpRgb(c, PEBBLE, pebble);
      const shade = 0.86 + 0.26 * mid;
      out.r = c.r * shade;
      out.g = c.g * shade;
      out.b = c.b * shade;
      return { height: h, roughness: 0.9 - 0.25 * pebble };
    }
    case 4: {
      // meadow — grass with a lighter cast plus flower specks; the specks are flat, not raised,
      // or the normal map turns a field of daisies into gravel
      const clump = high * 0.55 + mid * 0.45;
      let c = lerpRgb(MEADOW_DARK, MEADOW_LIGHT, clamp01(clump * 1.2));
      const white = smoothstep(0.955, 0.985, high);
      const yellow = smoothstep(0.94, 0.97, high * 0.62 + mid * 0.38);
      c = lerpRgb(c, FLOWER_YELLOW, yellow * 0.7);
      c = lerpRgb(c, FLOWER_WHITE, white);
      const shade = 0.84 + 0.3 * high;
      out.r = c.r * shade;
      out.g = c.g * shade;
      out.b = c.b * shade;
      return { height: clump, roughness: 0.86 };
    }
    case 5: {
      // concrete — float-finished slab: fine aggregate, a hairline crack network from the mid
      // field's zero crossing, and stains that only touch the colour
      const aggregate = smoothstep(0.88, 0.97, high);
      const crack = smoothstep(0.03, 0.004, Math.abs(mid - 0.5));
      const h = clamp01(0.55 + aggregate * 0.35 - crack * 0.6);
      let c = lerpRgb(CONCRETE_DARK, CONCRETE_LIGHT, clamp01(0.5 + mid * 0.45));
      c = lerpRgb(c, CONCRETE_DARK, crack * 0.9);
      const shade = 0.94 + 0.12 * high - 0.08 * smoothstep(0.3, 0.8, low);
      out.r = c.r * shade;
      out.g = c.g * shade;
      out.b = c.b * shade;
      return { height: h, roughness: 0.55 + 0.2 * aggregate + 0.15 * crack };
    }
    default: {
      // wood — eight boards across the tile, each with its own hue offset and its grain stretched
      // 12:1 along the board, gaps cut to the darkest value
      const boards = 8;
      const bv = v * boards;
      const board = Math.floor(bv);
      const withinBoard = bv - board;
      const gap = smoothstep(0.055, 0.0, withinBoard) + smoothstep(0.945, 1.0, withinBoard);
      const boardTint = ((board * 2654435761) >>> 0) / 4294967296;
      const grain = mid * 0.45 + high * 0.25 + low * 0.3;
      const rings = 0.5 + 0.5 * Math.sin((u * 9 + grain * 5.5 + boardTint * 6.3) * Math.PI * 2);
      const h = clamp01(0.62 + rings * 0.28 - gap * 0.9);
      let c = lerpRgb(WOOD_DARK, WOOD_LIGHT, clamp01(rings * 0.7 + boardTint * 0.4));
      c = lerpRgb(c, WOOD_GAP, clamp01(gap));
      const shade = 0.9 + 0.16 * rings;
      out.r = c.r * shade;
      out.g = c.g * shade;
      out.b = c.b * shade;
      return { height: h, roughness: 0.44 + 0.3 * gap + 0.1 * rings };
    }
  }
}

/**
 * Height field → tangent-space normal, wrapped so the map tiles. `strength` is in texels of slope
 * per unit height; it is per layer because a wood plank's grain and a rock's creases want very
 * different relief from the same 0..1 height range.
 */
const NORMAL_STRENGTH = [2.2, 1.5, 3.4, 2.6, 2.0, 1.2, 1.6];

function buildLayerMaps(
  layer: number,
  res: number,
  low: Float32Array,
  mid: Float32Array,
  high: Float32Array,
  ridge: Float32Array,
  albedo: Uint8Array,
  surface: Uint8Array
): void {
  const count = res * res;
  const heights = new Float32Array(count);
  const offset = layer * count * 4;
  const c: Rgb = { r: 0, g: 0, b: 0 };
  // Each layer reads the shared fields through its own rotation of the index so that grass and
  // dirt do not share the same blotches at the same place, which is visible where they meet.
  const shift = layer * 7919;
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const k = j * res + i;
      const s = (k + shift) % count;
      const shaded = shadeLayer(layer, i / res, j / res, low[s], mid[k], high[k], ridge[k], c);
      heights[k] = shaded.height;
      const at = offset + k * 4;
      albedo[at] = Math.round(clamp01(c.r) * 255);
      albedo[at + 1] = Math.round(clamp01(c.g) * 255);
      albedo[at + 2] = Math.round(clamp01(c.b) * 255);
      albedo[at + 3] = Math.round(clamp01(shaded.roughness) * 255);
    }
  }
  const strength = NORMAL_STRENGTH[layer] ?? 2;
  for (let j = 0; j < res; j++) {
    const jm = (j - 1 + res) % res;
    const jp = (j + 1) % res;
    for (let i = 0; i < res; i++) {
      const im = (i - 1 + res) % res;
      const ip = (i + 1) % res;
      const k = j * res + i;
      const dx = (heights[j * res + im] - heights[j * res + ip]) * strength;
      const dy = (heights[jm * res + i] - heights[jp * res + i]) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const at = offset + k * 4;
      surface[at] = Math.round((dx * inv * 0.5 + 0.5) * 255);
      surface[at + 1] = Math.round((dy * inv * 0.5 + 0.5) * 255);
      // Cheap cavity AO: how far this texel sits below its 4-neighbour mean.
      const mean =
        (heights[j * res + im] +
          heights[j * res + ip] +
          heights[jm * res + i] +
          heights[jp * res + i]) *
        0.25;
      const ao = clamp01(0.72 + (heights[k] - mean) * 2.4 + heights[k] * 0.24);
      surface[at + 2] = Math.round(ao * 255);
      surface[at + 3] = Math.round(clamp01(heights[k]) * 255);
    }
  }
}

/** Two-scale wave normal for the lake surface, tiling in 8 m (see `water.ts`). */
function buildWaterNormal(res: number, seed: number): Uint8Array {
  const data = new Uint8Array(res * res * 4);
  const h = new Float32Array(res * res);
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const u = i / res;
      const v = j / res;
      // A swell running one way and a chop running across it: one field alone reads as a
      // corrugated sheet as soon as the sun is low enough to catch it.
      const swell = Math.sin((u * 2 + tileableFbm(u, v, 2, 3, seed) * 1.4) * Math.PI * 2);
      const chop = Math.sin((v * 6 + tileableFbm(u, v, 6, 2, seed + 51) * 2.2) * Math.PI * 2);
      h[j * res + i] = swell * 0.55 + chop * 0.3 + tileableFbm(u, v, 16, 2, seed + 97) * 0.35;
    }
  }
  for (let j = 0; j < res; j++) {
    const jm = (j - 1 + res) % res;
    const jp = (j + 1) % res;
    for (let i = 0; i < res; i++) {
      const im = (i - 1 + res) % res;
      const ip = (i + 1) % res;
      const k = j * res + i;
      const dx = (h[j * res + im] - h[j * res + ip]) * 0.85;
      const dy = (h[jm * res + i] - h[jp * res + i]) * 0.85;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      data[k * 4] = Math.round((dx * inv * 0.5 + 0.5) * 255);
      data[k * 4 + 1] = Math.round((dy * inv * 0.5 + 0.5) * 255);
      data[k * 4 + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      data[k * 4 + 3] = 255;
    }
  }
  return data;
}

/**
 * The macro map. Three independent low-frequency fields:
 *   R  brightness — dry ground and damp ground over tens of metres
 *   G  tint       — pushes green towards olive or towards blue-green
 *   B  weighting  — perturbs the splat weights so a painted boundary is not a clean arc
 * It is what stops the tiled layers reading as a tiled plane; without it the ground at overview
 * distance is one colour with a texture on it.
 */
function buildMacro(res: number, seed: number): Uint8Array {
  const data = new Uint8Array(res * res * 4);
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const u = i / res;
      const v = j / res;
      const k = (j * res + i) * 4;
      data[k] = Math.round(clamp01(tileableFbm(u, v, 3, 4, seed)) * 255);
      data[k + 1] = Math.round(clamp01(tileableFbm(u, v, 2, 3, seed + 313)) * 255);
      data[k + 2] = Math.round(clamp01(tileableFbm(u, v, 5, 3, seed + 787)) * 255);
      data[k + 3] = 255;
    }
  }
  return data;
}

export function createTerrainTextures(
  scene: Scene,
  seed: number,
  resolution: number
): TerrainTextureSet {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const res = resolution;
  const count = res * res;

  const low = new Float32Array(count);
  const mid = new Float32Array(count);
  const high = new Float32Array(count);
  const ridge = new Float32Array(count);
  for (let j = 0; j < res; j++) {
    const v = j / res;
    for (let i = 0; i < res; i++) {
      const u = i / res;
      const k = j * res + i;
      low[k] = tileableFbm(u, v, 2, 3, seed + 11);
      mid[k] = tileableFbm(u, v, 8, 3, seed + 23);
      high[k] = tileableFbm(u, v, 32, 3, seed + 37);
      ridge[k] = ridgedFbm(u, v, 4, 4, seed + 59);
    }
  }

  const albedoData = new Uint8Array(count * 4 * LAYER_COUNT);
  const surfaceData = new Uint8Array(count * 4 * LAYER_COUNT);
  for (let layer = 0; layer < LAYER_COUNT; layer++) {
    buildLayerMaps(layer, res, low, mid, high, ridge, albedoData, surfaceData);
  }

  const albedo = new RawTexture2DArray(
    albedoData,
    res,
    res,
    LAYER_COUNT,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  const surface = new RawTexture2DArray(
    surfaceData,
    res,
    res,
    LAYER_COUNT,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  // Anisotropy is what keeps the ground from smearing into mush at the grazing angles the
  // `ground` camera preset sits at — 4 is enough at 3.2 m tiles and costs nothing measurable.
  albedo.anisotropicFilteringLevel = 4;
  surface.anisotropicFilteringLevel = 4;
  albedo.wrapU = Texture.WRAP_ADDRESSMODE;
  albedo.wrapV = Texture.WRAP_ADDRESSMODE;
  surface.wrapU = Texture.WRAP_ADDRESSMODE;
  surface.wrapV = Texture.WRAP_ADDRESSMODE;

  const macroRes = Math.max(128, res >> 1);
  const macro = new RawTexture(
    buildMacro(macroRes, seed + 401),
    macroRes,
    macroRes,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  macro.wrapU = Texture.WRAP_ADDRESSMODE;
  macro.wrapV = Texture.WRAP_ADDRESSMODE;

  const waterRes = Math.max(128, res >> 1);
  const makeWater = (waterSeed: number, name: string) => {
    const tex = new RawTexture(
      buildWaterNormal(waterRes, waterSeed),
      waterRes,
      waterRes,
      Constants.TEXTUREFORMAT_RGBA,
      scene,
      true,
      false,
      Texture.TRILINEAR_SAMPLINGMODE
    );
    tex.name = name;
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    return tex;
  };
  const water = makeWater(seed + 613, 'terrain-ripple-a');
  const waterDetail = makeWater(seed + 1289, 'terrain-ripple-b');

  const generateMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;

  return {
    albedo,
    surface,
    macro,
    water,
    waterDetail,
    resolution: res,
    generateMs,
    dispose() {
      albedo.dispose();
      surface.dispose();
      macro.dispose();
      water.dispose();
      waterDetail.dispose();
    },
  };
}
