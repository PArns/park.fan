/**
 * Three procedural PBR surfaces — paint, metal, upholstery — and one tinted copy of each per
 * livery colour.
 *
 * The method is the one `track/textures.ts` and `paths/textures.ts` set out, and the reason is the
 * same: albedo, normal and ORM derived from a single height function agree about where the paint is
 * chipped and where the weave runs, which is what stops a generated material reading as a
 * photograph glued to a flat plane.
 *
 * **The maps carry structure at a luminance around 1, never colour.** What a car actually shows is
 * `texture.rgb × vertexColour × albedoColor`: the texture carries the orange peel and the scuffs,
 * the vertex colour carries the occlusion baked in `geometry.ts`, and `albedoColor` carries the
 * livery. Writing the livery into the texture as well multiplies two mid-tones and comes out
 * black — the mistake `guests/materials.ts` and the scenery module both record having made.
 *
 * **`RawTexture`, never a canvas.** A 2D context is DOM, and these are built inside `main()`, which
 * runs on the showcase path before the first frame. The albedo goes through the sRGB transfer
 * function because Babylon samples an albedo map as gamma space and converts back; the normal and
 * ORM maps are raw and say so with `gammaSpace = false`.
 *
 * Nothing here sets `metadata.envExempt`: a train SHOULD go dark and glossy in the rain, and
 * `albedoColor` plus `roughness` are exactly the two scalars the environment module's wet pass
 * modulates (ARCHITECTURE §4).
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';

export type TrainSurface = 'paint' | 'metal' | 'cloth';

export interface TrainMaterials {
  /** The shell and the nose, in the livery's body colour. */
  paint(hex: string): PBRMaterial;
  /** Chassis, bogies, wheels, restraint frames. */
  metal(hex: string): PBRMaterial;
  /** Seat upholstery and restraint pads. */
  cloth(hex: string): PBRMaterial;
  all(): Material[];
  textureMs: number;
  textureSize: number;
  dispose(): void;
}

// ── noise ───────────────────────────────────────────────────────────────────────────────────
function hash2(x: number, y: number, seed: number): number {
  let h =
    (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) / 4294967296;
}

/** Tileable value noise, so a map wrapped round a car has no seam. */
function noise(u: number, v: number, freq: number, seed: number): number {
  const x = u * freq;
  const y = v * freq;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const wrap = (n: number) => ((n % freq) + freq) % freq;
  const a = hash2(wrap(x0), wrap(y0), seed);
  const b = hash2(wrap(x0 + 1), wrap(y0), seed);
  const c = hash2(wrap(x0), wrap(y0 + 1), seed);
  const d = hash2(wrap(x0 + 1), wrap(y0 + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(u: number, v: number, freq: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let f = freq;
  for (let i = 0; i < octaves; i++) {
    sum += noise(u, v, f, seed + i * 131) * amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum;
}

const to8 = (v: number): number => Math.max(0, Math.min(255, Math.round(v * 255)));
const srgb = (v: number): number =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;

interface Sample {
  /** Luminance around 1. */
  value: number;
  /** Height, for the derived normal. */
  height: number;
  roughness: number;
  ao: number;
}

/**
 * What each surface looks like at the level of one texel.
 *
 * - **Paint** is orange peel: a fine, almost isotropic ripple, plus a handful of stone chips along
 *   the leading edges. Glossy, and the gloss varies where it has been polished by hands.
 * - **Metal** is a milled and anodised chassis: a directional grain from the extrusion, a little
 *   pitting, and grease where two members meet.
 * - **Cloth** is a coarse vinyl weave — a coaster seat is wiped down every night, so it is smooth
 *   and slightly shiny, not a fabric.
 */
function sample(kind: TrainSurface, u: number, v: number, seed: number): Sample {
  if (kind === 'paint') {
    const peel = fbm(u, v, 26, 3, seed) - 0.5;
    const chips = Math.max(0, fbm(u, v, 90, 2, seed + 77) - 0.72) * 3.4;
    const polish = fbm(u, v, 5, 2, seed + 31);
    const height = 0.5 + peel * 0.5 - chips * 0.6;
    return {
      value: 1 + peel * 0.06 - chips * 0.34,
      height,
      roughness: 0.22 + polish * 0.14 + chips * 0.5,
      ao: 1 - chips * 0.45,
    };
  }
  if (kind === 'metal') {
    // The grain runs along the member, which is the U direction here.
    const grain = fbm(u * 0.16, v * 5, 30, 3, seed);
    const pit = Math.max(0, fbm(u, v, 70, 2, seed + 19) - 0.68) * 3;
    const grease = fbm(u, v, 7, 3, seed + 53);
    const height = 0.5 + (grain - 0.5) * 0.35 - pit * 0.8;
    return {
      value: 0.92 + (grain - 0.5) * 0.12 - pit * 0.2 - grease * 0.08,
      height,
      roughness: 0.34 + grease * 0.3 + pit * 0.35,
      ao: 1 - pit * 0.4 - grease * 0.1,
    };
  }
  // Vinyl: a weave at two scales with a soft sheen.
  const weave =
    0.5 +
    0.5 * Math.sin(u * Math.PI * 2 * 58) * 0.5 +
    0.5 * Math.sin(v * Math.PI * 2 * 58) * 0.5;
  const grain = fbm(u, v, 34, 3, seed + 91);
  const wear = fbm(u, v, 9, 2, seed + 5);
  return {
    value: 0.94 + (weave - 0.5) * 0.1 + (grain - 0.5) * 0.08,
    height: 0.5 + (weave - 0.5) * 0.5 + (grain - 0.5) * 0.3,
    roughness: 0.52 + wear * 0.2 - (weave - 0.5) * 0.1,
    ao: 1 - (1 - weave) * 0.12,
  };
}

const METALLIC: Record<TrainSurface, number> = { paint: 0.06, metal: 0.85, cloth: 0 };
/** Tiles per metre of geometry. The UVs are authored in metres in `geometry.ts`. */
const TILING: Record<TrainSurface, number> = { paint: 1.1, metal: 2.2, cloth: 3.4 };

interface TextureSet {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
  dispose(): void;
}

function buildTextures(scene: Scene, kind: TrainSurface, seed: number, size: number): TextureSet {
  const n = size * size;
  const albedo = new Uint8Array(n * 3);
  const normal = new Uint8Array(n * 3);
  const orm = new Uint8Array(n * 3);
  const heights = new Float32Array(n);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const s = sample(kind, x / size, y / size, seed);
      heights[i] = s.height;
      const c = to8(srgb(Math.max(0, s.value)));
      albedo[i * 3] = c;
      albedo[i * 3 + 1] = c;
      albedo[i * 3 + 2] = c;
      orm[i * 3] = to8(s.ao);
      orm[i * 3 + 1] = to8(s.roughness);
      orm[i * 3 + 2] = to8(METALLIC[kind]);
    }
  }
  // Sobel-free central difference: the map wraps, so the neighbours wrap too.
  const relief = kind === 'cloth' ? 3.5 : kind === 'metal' ? 2.6 : 1.8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const l = heights[y * size + ((x - 1 + size) % size)];
      const r = heights[y * size + ((x + 1) % size)];
      const d = heights[((y - 1 + size) % size) * size + x];
      const u = heights[((y + 1) % size) * size + x];
      const nx = (l - r) * relief;
      const ny = (d - u) * relief;
      const len = Math.hypot(nx, ny, 1);
      normal[i * 3] = to8(nx / len / 2 + 0.5);
      normal[i * 3 + 1] = to8(ny / len / 2 + 0.5);
      normal[i * 3 + 2] = to8(1 / len / 2 + 0.5);
    }
  }
  const make = (data: Uint8Array, gamma: boolean, name: string) => {
    const tex = new RawTexture(
      data,
      size,
      size,
      Constants.TEXTUREFORMAT_RGB,
      scene,
      true,
      false,
      Texture.TRILINEAR_SAMPLINGMODE
    );
    tex.name = name;
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    tex.gammaSpace = gamma;
    tex.uScale = TILING[kind];
    tex.vScale = TILING[kind];
    return tex;
  };
  const set: TextureSet = {
    albedo: make(albedo, true, `trains-${kind}-albedo`),
    normal: make(normal, false, `trains-${kind}-normal`),
    orm: make(orm, false, `trains-${kind}-orm`),
    dispose() {
      set.albedo.dispose();
      set.normal.dispose();
      set.orm.dispose();
    },
  };
  return set;
}

export function createTrainMaterials(scene: Scene, seed: number, size: number): TrainMaterials {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const sets: Record<TrainSurface, TextureSet> = {
    paint: buildTextures(scene, 'paint', seed, size),
    metal: buildTextures(scene, 'metal', seed + 811, size),
    cloth: buildTextures(scene, 'cloth', seed + 1621, size),
  };
  const textureMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
  const cache = new Map<string, PBRMaterial>();

  function build(kind: TrainSurface, hex: string): PBRMaterial {
    const key = `${kind}-${hex.replace('#', '')}`;
    const existing = cache.get(key);
    if (existing) return existing;
    const set = sets[kind];
    const m = new PBRMaterial(`trains-${key}`, scene);
    m.albedoTexture = set.albedo;
    m.bumpTexture = set.normal;
    m.metallicTexture = set.orm;
    // The ORM channel contract: R occlusion, G roughness, B metallic. Without these three flags
    // Babylon reads the whole texture as reflectivity and every part comes out chrome.
    m.useAmbientOcclusionFromMetallicTextureRed = true;
    m.useRoughnessFromMetallicTextureGreen = true;
    m.useMetallnessFromMetallicTextureBlue = true;
    m.useRoughnessFromMetallicTextureAlpha = false;
    m.metallic = 1;
    m.roughness = 1;
    // Straight into linear: the texture is already sRGB-encoded and Babylon multiplies the colour
    // in after decoding it.
    m.albedoColor = Color3.FromHexString(hex).toLinearSpace();
    m.backFaceCulling = true;
    // Six, not Babylon's default four. A night scene holds the sun, the sky term, the moon and
    // whatever lamp rig is nearest; at four slots a train in a station under a lamp is lit by the
    // moon and by nothing else — the finding the paths critique made about paving.
    m.maxSimultaneousLights = 6;
    // A painted shell at a grazing angle is where PBR either reads as a lacquered surface or as
    // plastic; these two keep the far half of a train from turning into a white sheet under a low
    // sun, which is when a coaster is most often photographed.
    m.useHorizonOcclusion = true;
    m.useRadianceOcclusion = true;
    if (kind === 'paint') m.environmentIntensity = 1.1;
    if (kind === 'cloth') m.environmentIntensity = 0.75;
    cache.set(key, m);
    return m;
  }

  return {
    paint: (hex) => build('paint', hex),
    metal: (hex) => build('metal', hex),
    cloth: (hex) => build('cloth', hex),
    all: () => [...cache.values()],
    textureMs: Math.round(textureMs),
    textureSize: size,
    dispose() {
      for (const m of cache.values()) m.dispose();
      cache.clear();
      for (const kind of Object.keys(sets) as TrainSurface[]) sets[kind].dispose();
    },
  };
}
