/**
 * Every path surface, generated at boot from its manifest recipe.
 *
 * `public/game/assets` is empty in this checkout, so these are not placeholders for files that
 * arrive later — they are the shipping artwork. Three maps come out of ONE height field per
 * recipe: albedo, a normal map from central differences on that height, and an ORM (occlusion in
 * red, roughness in green, metallic in blue). Deriving all three from one field is what stops the
 * result reading as a photograph glued to a flat plane: the bump, the shading in the joints and
 * the sheen all agree about where the stones are.
 *
 * Two details do most of the work and are easy to leave out:
 *
 *  - **Per-cell tint.** Every slab, paver, sett and board gets its own colour offset from a hash of
 *    its cell index. Without it a paved surface is one colour with a grid drawn on top, which is
 *    exactly what programmer art looks like.
 *  - **Occlusion in the joints.** The ORM's red channel darkens the mortar lines. A normal map
 *    alone leaves them lit as brightly as the stones and the surface flattens out the moment the
 *    sun is high.
 *
 * `RawTexture`, never a canvas: a 2D context is DOM, and these are built during `main()`, which
 * runs before the first frame and also runs under the showcase path.
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import type { PathMaterialRecipe } from './manifest';
import { clamp01, fbm, hash2, mix, ridged, smoothstep, valueNoise } from './noise';

export interface PathTextureSet {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
  size: number;
  generateMs: number;
  dispose(): void;
}

interface Sample {
  /** 0 = deep in a joint, 1 = the top of a stone. */
  h: number;
  /** Per-cell colour offset, roughly −1..1. */
  tint: number;
  /** 1 where this pixel is mortar/gap. */
  joint: number;
  /** Extra roughness, 0..1. */
  wear: number;
}

/** Real-world dimensions of the pattern units, metres. */
const SLAB_M = 1.0;
const PAVER_LENGTH_M = 0.2;
const PAVER_WIDTH_M = 0.1;
const SETT_M = 0.11;
const BOARD_WIDTH_M = 0.145;
const BOARD_LENGTH_M = 2.4;

function sample(recipe: PathMaterialRecipe, u: number, v: number): Sample {
  const tile = recipe.tileMetres;
  const seed = recipe.seed;
  switch (recipe.pattern) {
    case 'concrete': {
      const cells = Math.max(1, Math.round(tile / SLAB_M));
      // A saw-cut joint in a concrete slab is a few millimetres wide, not a painted stripe. The
      // first pass used 14 mm with a soft ramp on each side and the shading around it did the
      // rest: on screen it read as black tape laid out in a grid.
      const jointM = 0.008;
      const cx = Math.floor(u * cells);
      const cy = Math.floor(v * cells);
      const fu = u * cells - cx;
      const fv = v * cells - cy;
      const jointU = jointM / (tile / cells);
      const edge =
        Math.min(smoothstep(0, jointU, fu), smoothstep(0, jointU, 1 - fu)) *
        Math.min(smoothstep(0, jointU, fv), smoothstep(0, jointU, 1 - fv));
      // Power-float finish: a fine swirl plus aggregate speckle.
      const swirl = fbm(u, v, { octaves: 3, period: 12, seed: seed + 3 });
      const grit = valueNoise(u, v, 220, seed + 17);
      const h = clamp01(edge * (0.82 + 0.12 * swirl + 0.06 * grit));
      const stain = fbm(u, v, { octaves: 4, period: 5, seed: seed + 41 });
      return {
        h,
        tint: (hash2(cx, cy, seed) - 0.5) * 0.5 + (stain - 0.5) * 0.7,
        joint: 1 - edge,
        wear: clamp01(stain * 0.8),
      };
    }
    case 'pavers': {
      const rows = Math.max(1, Math.round(tile / PAVER_WIDTH_M));
      const cols = Math.max(1, Math.round(tile / PAVER_LENGTH_M));
      const rowF = v * rows;
      const row = Math.floor(rowF);
      // Running bond: every other course shifts half a brick.
      const shift = row % 2 === 0 ? 0 : 0.5;
      const colF = u * cols + shift;
      const col = Math.floor(colF);
      const fu = colF - col;
      const fv = rowF - row;
      const jointU = 0.009 / (tile / cols);
      const jointV = 0.009 / (tile / rows);
      const edge =
        Math.min(smoothstep(0, jointU, fu), smoothstep(0, jointU, 1 - fu)) *
        Math.min(smoothstep(0, jointV, fv), smoothstep(0, jointV, 1 - fv));
      // Clay bricks are slightly domed and each is fired a different shade.
      const dome = 1 - Math.pow(Math.abs(fu * 2 - 1), 3) * 0.25;
      const grit = fbm(u * 3, v * 3, { octaves: 3, period: 30, seed: seed + 7 });
      const cell = hash2(col, row, seed);
      const h = clamp01(edge * (0.72 + 0.2 * dome + 0.08 * grit) + (1 - edge) * 0.05);
      return {
        h,
        tint: (cell - 0.5) * 1.5 + (grit - 0.5) * 0.4,
        joint: 1 - edge,
        wear: clamp01(0.35 + (1 - cell) * 0.3),
      };
    }
    case 'cobble': {
      const cells = Math.max(2, Math.round(tile / SETT_M));
      let best = 1e9;
      let second = 1e9;
      let bestCx = 0;
      let bestCy = 0;
      const gx = Math.floor(u * cells);
      const gy = Math.floor(v * cells);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const wx = (((gx + ox) % cells) + cells) % cells;
          const wy = (((gy + oy) % cells) + cells) % cells;
          const jx = (gx + ox + 0.15 + 0.7 * hash2(wx, wy, seed)) / cells;
          const jy = (gy + oy + 0.15 + 0.7 * hash2(wx, wy, seed + 977)) / cells;
          const dx = u - jx;
          const dy = v - jy;
          const d = dx * dx + dy * dy;
          if (d < best) {
            second = best;
            best = d;
            bestCx = wx;
            bestCy = wy;
          } else if (d < second) {
            second = d;
          }
        }
      }
      const edge = clamp01((Math.sqrt(second) - Math.sqrt(best)) * cells * 1.5);
      const grit = valueNoise(u, v, 180, seed + 23);
      const dome = smoothstep(0, 0.42, edge);
      const h = clamp01(dome * (0.8 + 0.2 * grit));
      return {
        h,
        tint: (hash2(bestCx, bestCy, seed + 5) - 0.5) * 1.1 + (grit - 0.5) * 0.3,
        joint: 1 - dome,
        wear: clamp01(0.3 + hash2(bestCx, bestCy, seed + 61) * 0.5),
      };
    }
    case 'planks': {
      // Boards are long in `v` — the mesh's `crossGrain` flag decides whether that ends up along
      // the path or across it, so one texture serves a deck and a jetty.
      const across = Math.max(1, Math.round(tile / BOARD_WIDTH_M));
      const along = Math.max(1, Math.round(tile / BOARD_LENGTH_M));
      const boardF = u * across;
      const board = Math.floor(boardF);
      const fu = boardF - board;
      const lengthF = v * along + hash2(board, 0, seed + 3) * 0.5;
      const seg = Math.floor(lengthF);
      const fv = lengthF - seg;
      const gapU = 0.007 / (tile / across);
      const gapV = 0.006 / (tile / along);
      const edge =
        Math.min(smoothstep(0, gapU, fu), smoothstep(0, gapU, 1 - fu)) *
        Math.min(smoothstep(0, gapV, fv), smoothstep(0, gapV, 1 - fv));
      // Grain: noise stretched hard along the board.
      const grain = fbm(u * 26, v * 0.6, { octaves: 4, period: 12, seed: seed + board * 13 });
      const cup = 1 - Math.pow(Math.abs(fu * 2 - 1), 2) * 0.3;
      const h = clamp01(edge * (0.66 + 0.22 * cup + 0.16 * grain));
      return {
        h,
        tint: (hash2(board, seg, seed) - 0.5) * 0.9 + (grain - 0.5) * 0.9,
        joint: 1 - edge,
        wear: clamp01(0.4 + grain * 0.5),
      };
    }
    case 'metal': {
      // Brushed and slightly dented: queue stanchions and the belts between them. The brush marks
      // run along `u` so a post can map its length to that axis and get vertical streaks.
      const brush =
        valueNoise(u * 240, v * 5, 240, seed) * 0.6 + valueNoise(u * 44, v * 2, 44, seed + 7) * 0.4;
      const dents = fbm(u, v, { octaves: 3, period: 6, seed: seed + 19 });
      const h = clamp01(brush * 0.7 + dents * 0.3);
      return {
        h,
        tint: (dents - 0.5) * 0.5,
        joint: 0,
        wear: clamp01(0.3 + dents * 0.4),
      };
    }
    default: {
      // Asphalt: aggregate, no cells, the occasional crack.
      const grit =
        valueNoise(u, v, 300, seed) * 0.55 +
        fbm(u, v, { octaves: 3, period: 60, seed: seed + 9 }) * 0.45;
      const crack = Math.pow(clamp01(ridged(u, v, { octaves: 3, period: 6, seed: seed + 71 })), 14);
      const h = clamp01(0.55 + 0.4 * grit - crack * 0.8);
      const patch = fbm(u, v, { octaves: 3, period: 3, seed: seed + 101 });
      return {
        h,
        tint: (grit - 0.5) * 0.5 + (patch - 0.5) * 0.6,
        joint: crack,
        wear: clamp01(0.5 + patch * 0.4),
      };
    }
  }
}

/**
 * Linear 0..1 to an sRGB byte.
 *
 * The recipes are written in LINEAR colour — that is the only space in which "half as bright"
 * means anything — and Babylon samples an albedo texture as sRGB (`gammaSpace`, on by default) and
 * converts it back. Storing the linear value raw therefore darkened every surface by the whole
 * transfer function: a 0.5 concrete became 0.21 on screen, which is why the first pass rendered a
 * plaza that read as wet tarmac and joints that read as painted black lines. Normal and ORM maps
 * are NOT encoded — Babylon reads those raw — and say so with `gammaSpace = false`.
 */
function srgbByte(linear: number): number {
  const v = linear <= 0 ? 0 : linear >= 1 ? 1 : linear;
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
  // Paths are seen at a grazing angle for most of the frame; without anisotropy the far half of a
  // promenade turns to grey mush and takes the joint pattern with it.
  tex.anisotropicFilteringLevel = 8;
  return tex;
}

export function createPathTextures(
  scene: Scene,
  recipe: PathMaterialRecipe,
  size: number
): PathTextureSet {
  const t0 = performance.now();
  const height = new Float32Array(size * size);
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const orm = new Uint8Array(size * size * 4);

  const tints = new Float32Array(size * size);
  const joints = new Float32Array(size * size);
  const wears = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = sample(recipe, (x + 0.5) / size, (y + 0.5) / size);
      const i = y * size + x;
      height[i] = s.h;
      tints[i] = s.tint;
      joints[i] = s.joint;
      wears[i] = s.wear;
    }
  }

  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const strength = recipe.relief * 5.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = y * size + x;
      const i = k * 4;
      const h = height[k];
      const joint = joints[k];
      const tint = tints[k];

      // Ambient occlusion from the local height deficit: a pixel much lower than its neighbours is
      // in a joint and sees less sky. The floor is high on purpose — a joint eight millimetres
      // wide is not a cave, and every stop below it is one the normal map and the shadow are about
      // to take again.
      const around =
        (at(x + 2, y) +
          at(x - 2, y) +
          at(x, y + 2) +
          at(x, y - 2) +
          at(x + 2, y + 2) +
          at(x - 2, y - 2)) /
        6;
      const ao = clamp01(0.62 + 0.38 * clamp01(1 - (around - h) * 2.4));

      for (let c = 0; c < 3; c++) {
        const stone = clamp01(recipe.base[c] * (1 + tint * 0.26) + (h - 0.7) * 0.05);
        const value = mix(
          recipe.joint[c],
          mix(recipe.accent[c], stone, clamp01(h * 1.15)),
          1 - joint
        );
        // Only a HINT of occlusion in the albedo. The ORM's red channel carries the real thing and
        // the shader applies it to the indirect term; baking a second full copy in here is what
        // turned every mortar line into a black stripe.
        albedo[i + c] = srgbByte(value * (0.86 + 0.14 * ao));
      }
      albedo[i + 3] = 255;

      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      normal[i] = Math.round(255 * ((-dx / len) * 0.5 + 0.5));
      normal[i + 1] = Math.round(255 * ((-dy / len) * 0.5 + 0.5));
      normal[i + 2] = Math.round(255 * ((1 / len) * 0.5 + 0.5));
      normal[i + 3] = 255;

      const rough = clamp01(
        mix(recipe.roughness[0], recipe.roughness[1], clamp01(1 - h + wears[k] * 0.35))
      );
      orm[i] = Math.round(255 * ao);
      orm[i + 1] = Math.round(255 * rough);
      orm[i + 2] = Math.round(255 * clamp01(recipe.metallic));
      orm[i + 3] = 255;
    }
  }

  const albedoTex = raw(scene, `path-${recipe.id}-albedo`, size, albedo);
  const normalTex = raw(scene, `path-${recipe.id}-normal`, size, normal);
  const ormTex = raw(scene, `path-${recipe.id}-orm`, size, orm);
  normalTex.gammaSpace = false;
  ormTex.gammaSpace = false;
  return {
    albedo: albedoTex,
    normal: normalTex,
    orm: ormTex,
    size,
    generateMs: performance.now() - t0,
    dispose() {
      albedoTex.dispose();
      normalTex.dispose();
      ormTex.dispose();
    },
  };
}
