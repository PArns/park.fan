/**
 * The four surfaces a coaster is made of, generated at boot from one height field each: bare
 * running rail, painted steel, timber, and the concrete of the footings.
 *
 * The method is the one `paths/textures.ts` sets out and the reason is the same: albedo, normal
 * and ORM all derived from a single height function agree about where the metal is dented and
 * where the grain runs, which is what stops a generated material reading as a photograph glued to
 * a flat plane. Two details do most of the work — a per-cell tint so no two planks are the same
 * colour, and occlusion baked into the ORM's red channel so a joint stays dark when the sun is
 * high — and both are cheap.
 *
 * `RawTexture`, never a canvas: a 2D context is DOM, and these are built inside `main()`, which
 * also runs under the showcase path before the first frame.
 *
 * The albedo is written through the sRGB transfer function because Babylon samples an albedo map
 * as gamma space and converts back; the normal and ORM maps are raw and say so with
 * `gammaSpace = false`. Getting that wrong darkens every surface by the whole curve, which is what
 * made the paths module's first plaza look like wet tarmac.
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import { clamp01, fbm, hash2, mix, smoothstep, valueNoise } from './noise';

export type SurfaceKind = 'rail' | 'paint' | 'timber' | 'concrete';

export interface TextureSet {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
  size: number;
  dispose(): void;
}

export interface TrackTextures {
  get(kind: SurfaceKind): TextureSet;
  generateMs: number;
  size: number;
  dispose(): void;
}

interface Sample {
  /** 0 = deepest, 1 = the top of the surface. */
  h: number;
  /** Per-cell colour offset, roughly −1..1. */
  tint: number;
  /** Extra roughness, 0..1. */
  wear: number;
}

/** Base colour (linear), roughness range and metallic per surface. */
const RECIPE: Record<
  SurfaceKind,
  { base: [number, number, number]; roughness: [number, number]; metallic: number; relief: number }
> = {
  // A running rail is polished by the wheels on its head and rusty-grey on its web. Metallic 1.
  rail: { base: [0.42, 0.44, 0.47], roughness: [0.18, 0.5], metallic: 1, relief: 0.6 },
  // Painted steel: the colour is a per-style tint on top of this near-white, so the paint texture
  // carries only the orange peel, the chips and the dirt.
  paint: { base: [0.82, 0.82, 0.82], roughness: [0.3, 0.62], metallic: 0.05, relief: 0.5 },
  timber: { base: [0.29, 0.19, 0.11], roughness: [0.55, 0.92], metallic: 0, relief: 1.2 },
  concrete: { base: [0.44, 0.43, 0.4], roughness: [0.72, 0.95], metallic: 0, relief: 0.8 },
};

function sample(kind: SurfaceKind, u: number, v: number, seed: number): Sample {
  switch (kind) {
    case 'rail': {
      // Drawn steel: fine longitudinal grain, a few deeper scuffs, and the polished band where the
      // wheel runs. `v` is along the rail, so the grain is stretched hard in that axis.
      const grain =
        valueNoise(u * 6, v * 190, 190, seed) * 0.6 + valueNoise(u * 3, v * 40, 40, seed + 7) * 0.4;
      const scuff = Math.pow(clamp01(fbm(u, v * 5, { octaves: 3, period: 9, seed: seed + 19 })), 3);
      const polish = smoothstep(0.32, 0.5, u) * (1 - smoothstep(0.5, 0.68, u));
      return {
        h: clamp01(0.62 + 0.3 * grain - scuff * 0.35),
        tint: (grain - 0.5) * 0.35 + polish * 0.25,
        wear: clamp01(0.65 - polish * 0.5 + scuff * 0.4),
      };
    }
    case 'paint': {
      // Orange peel, plus chips that reveal the primer underneath. The chips are rare on purpose:
      // a coaster is repainted every couple of winters.
      const peel = fbm(u * 8, v * 8, { octaves: 4, period: 24, seed });
      const chip = Math.pow(clamp01(fbm(u, v, { octaves: 3, period: 14, seed: seed + 53 })), 9);
      const dirt = fbm(u, v, { octaves: 3, period: 4, seed: seed + 91 });
      return {
        h: clamp01(0.72 + 0.18 * peel - chip * 0.7),
        tint: (peel - 0.5) * 0.16 - chip * 0.9 + (dirt - 0.5) * 0.25,
        wear: clamp01(0.25 + chip * 0.6 + dirt * 0.35),
      };
    }
    case 'timber': {
      // Sawn softwood: boards 22 cm wide running along v, with grain stretched along the board and
      // a per-board tint. Wooden coaster track is built out of stacked laminations, so the boards
      // are narrow and the joints matter.
      const boards = 5;
      const bf = u * boards;
      const board = Math.floor(bf);
      const fu = bf - board;
      const gap = Math.min(smoothstep(0, 0.03, fu), smoothstep(0, 0.03, 1 - fu));
      const grain = fbm(u * 30, v * 1.2, { octaves: 4, period: 16, seed: seed + board * 37 });
      const knot = Math.pow(clamp01(valueNoise(u * 4, v * 4, 4, seed + board * 11)), 7);
      const cup = 1 - Math.pow(Math.abs(fu * 2 - 1), 2) * 0.28;
      return {
        h: clamp01(gap * (0.6 + 0.24 * cup + 0.2 * grain) - knot * 0.4),
        tint: (hash2(board, 0, seed) - 0.5) * 0.7 + (grain - 0.5) * 1.1 - knot * 0.6,
        wear: clamp01(0.5 + grain * 0.4),
      };
    }
    default: {
      const grit =
        valueNoise(u, v, 220, seed) * 0.5 +
        fbm(u, v, { octaves: 3, period: 40, seed: seed + 5 }) * 0.5;
      const form = fbm(u, v, { octaves: 2, period: 3, seed: seed + 61 });
      return {
        h: clamp01(0.5 + 0.42 * grit),
        tint: (grit - 0.5) * 0.4 + (form - 0.5) * 0.4,
        wear: clamp01(0.6 + form * 0.35),
      };
    }
  }
}

function srgbByte(linear: number): number {
  const v = clamp01(linear);
  const encoded = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(255 * encoded);
}

function raw(scene: Scene, name: string, size: number, data: Uint8Array): RawTexture {
  const tex = new RawTexture(
    data,
    size,
    size,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  tex.name = name;
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.hasAlpha = false;
  // A rail is seen at a grazing angle for most of any frame it is in; without anisotropy the far
  // half of a straight turns to grey mush.
  tex.anisotropicFilteringLevel = 8;
  return tex;
}

function generate(scene: Scene, kind: SurfaceKind, size: number, seed: number): TextureSet {
  const recipe = RECIPE[kind];
  const height = new Float32Array(size * size);
  const tints = new Float32Array(size * size);
  const wears = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = sample(kind, (x + 0.5) / size, (y + 0.5) / size, seed);
      const i = y * size + x;
      height[i] = s.h;
      tints[i] = s.tint;
      wears[i] = s.wear;
    }
  }

  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const orm = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const strength = recipe.relief * 5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = y * size + x;
      const i = k * 4;
      const h = height[k];
      const around =
        (at(x + 2, y) +
          at(x - 2, y) +
          at(x, y + 2) +
          at(x, y - 2) +
          at(x + 2, y + 2) +
          at(x - 2, y - 2)) /
        6;
      const ao = clamp01(0.6 + 0.4 * clamp01(1 - (around - h) * 2.6));
      for (let c = 0; c < 3; c++) {
        const value = clamp01(recipe.base[c] * (1 + tints[k] * 0.3) + (h - 0.7) * 0.06);
        albedo[i + c] = srgbByte(value * (0.88 + 0.12 * ao));
      }
      albedo[i + 3] = 255;

      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      normal[i] = Math.round(255 * ((-dx / len) * 0.5 + 0.5));
      normal[i + 1] = Math.round(255 * ((-dy / len) * 0.5 + 0.5));
      normal[i + 2] = Math.round(255 * ((1 / len) * 0.5 + 0.5));
      normal[i + 3] = 255;

      orm[i] = Math.round(255 * ao);
      orm[i + 1] = Math.round(
        255 *
          clamp01(mix(recipe.roughness[0], recipe.roughness[1], clamp01(1 - h + wears[k] * 0.4)))
      );
      orm[i + 2] = Math.round(255 * clamp01(recipe.metallic));
      orm[i + 3] = 255;
    }
  }

  const albedoTex = raw(scene, `track-${kind}-albedo`, size, albedo);
  const normalTex = raw(scene, `track-${kind}-normal`, size, normal);
  const ormTex = raw(scene, `track-${kind}-orm`, size, orm);
  normalTex.gammaSpace = false;
  ormTex.gammaSpace = false;
  return {
    albedo: albedoTex,
    normal: normalTex,
    orm: ormTex,
    size,
    dispose() {
      albedoTex.dispose();
      normalTex.dispose();
      ormTex.dispose();
    },
  };
}

export function createTrackTextures(scene: Scene, seed: number, size: number): TrackTextures {
  const cache = new Map<SurfaceKind, TextureSet>();
  const t0 = performance.now();
  const get = (kind: SurfaceKind): TextureSet => {
    const existing = cache.get(kind);
    if (existing) return existing;
    const set = generate(scene, kind, size, seed + kind.length * 977);
    cache.set(kind, set);
    return set;
  };
  // All four up front: they are wanted within the same frame anyway, and generating one lazily in
  // the middle of a build is a stutter nobody can attribute.
  for (const kind of ['rail', 'paint', 'timber', 'concrete'] as SurfaceKind[]) get(kind);
  const generateMs = performance.now() - t0;
  return {
    get,
    generateMs,
    size,
    dispose() {
      for (const set of cache.values()) set.dispose();
      cache.clear();
    },
  };
}
