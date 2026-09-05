/**
 * Every texture this module draws with, generated from noise at boot.
 *
 * `public/game/assets` is empty in this checkout and the procedural path is the default, so none
 * of these is a placeholder for a file that will arrive later: the cloud sheets, the moon and the
 * showcase's PBR sets are the shipping artwork. They are built once (the whole set measures under
 * 40 ms) and then reused — the clouds move by scrolling UVs, not by regenerating pixels.
 *
 * All of it is `RawTexture` rather than a canvas: a 2D context is DOM, and the same builders are
 * called from the showcase, which runs before the first frame.
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import { clamp01, fbm, hash2, mix, ridged, smoothstep, valueNoise } from './noise';

function rgba(
  scene: Scene,
  name: string,
  size: number,
  data: Uint8Array,
  wrap: boolean,
  mips = true
): RawTexture {
  const tex = new RawTexture(
    data,
    size,
    size,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    mips,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  tex.name = name;
  tex.wrapU = wrap ? Texture.WRAP_ADDRESSMODE : Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = wrap ? Texture.WRAP_ADDRESSMODE : Texture.CLAMP_ADDRESSMODE;
  tex.hasAlpha = true;
  return tex;
}

export type CloudLayerKind = 'cumulus' | 'cirrus';

/**
 * A tiling cloud sheet. Alpha carries the density and RGB a slight brightness variation, so the
 * lit tint can be one uniform per layer while the sheet still has internal shape — a single flat
 * colour behind an alpha mask reads as fog, not as cloud.
 */
export function cloudSheet(scene: Scene, kind: CloudLayerKind, seed: number): RawTexture {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  const cumulus = kind === 'cumulus';
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      let density: number;
      if (cumulus) {
        const base = fbm(u, v, { octaves: 5, period: 6, seed, gain: 0.55 });
        const detail = ridged(u, v, { octaves: 4, period: 14, seed: seed + 31, gain: 0.5 });
        density = clamp01(base * 1.15 - 0.16 + (detail - 0.5) * 0.28);
      } else {
        // Cirrus is stretched: sampling with a squashed v gives the streaked look without a
        // second noise function.
        const base = fbm(u, v * 3.4, { octaves: 4, period: 9, seed: seed + 77, gain: 0.5 });
        const streak = fbm(u * 0.6, v * 9, { octaves: 3, period: 5, seed: seed + 12 });
        density = clamp01(base * 0.75 + streak * 0.45 - 0.42);
      }
      // A little self-shadowing: the underside of a lump is where the density gradient points
      // away from the light, approximated here as "thicker is darker".
      const shade = 1 - 0.42 * Math.pow(density, 0.7);
      const bright = Math.round(255 * clamp01(mix(1, shade, cumulus ? 1 : 0.35)));
      const i = (y * size + x) * 4;
      data[i] = bright;
      data[i + 1] = bright;
      data[i + 2] = Math.min(255, bright + 6);
      data[i + 3] = Math.round(255 * clamp01(Math.pow(density, cumulus ? 0.85 : 1.15)));
    }
  }
  return rgba(scene, `env-cloud-${kind}`, size, data, true);
}

/** Soft round dot: stars, snow, and anything else that wants a point with no visible edge. */
export function softDot(scene: Scene, name: string, size: number, power: number): RawTexture {
  const data = new Uint8Array(size * size * 4);
  const half = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - half) / half;
      const dy = (y + 0.5 - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      const a = Math.pow(clamp01(1 - r), power);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(255 * a);
    }
  }
  return rgba(scene, name, size, data, false);
}

/** The sun's disc: a hard-edged core with one texel of falloff, plus a tight corona. */
export function sunDisc(scene: Scene): RawTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const half = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - half) / half;
      const dy = (y + 0.5 - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      // The disc occupies the middle third so the corona has room; the sprite's world size is
      // scaled up to match in `sky-dome.ts`.
      const core = 1 - smoothstep(0.3, 0.34, r);
      const corona = Math.pow(clamp01(1 - r), 3.2) * 0.5;
      const a = clamp01(core + corona);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = Math.round(255 * (0.94 + 0.06 * core));
      data[i + 2] = Math.round(255 * (0.86 + 0.14 * core));
      data[i + 3] = Math.round(255 * a);
    }
  }
  return rgba(scene, 'env-sun-disc', size, data, false);
}

/** Wide radial glow for the sun's halo; separate from the disc so the two can fade apart. */
export function radialGlow(scene: Scene, name: string, power: number): RawTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const half = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - half) / half;
      const dy = (y + 0.5 - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      const a = Math.pow(clamp01(1 - r), power);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 248;
      data[i + 2] = 232;
      data[i + 3] = Math.round(255 * a);
    }
  }
  return rgba(scene, name, size, data, false);
}

/**
 * The moon, with the phase baked in.
 *
 * The terminator moves a day at a time, so regenerating a 128² texture when `world.clock.day`
 * changes is cheaper in every sense than a shader that would have to exist in GLSL and WGSL.
 * `phase` is the illuminated fraction 0..1; `waxing` puts the lit limb on the leading side.
 */
export function moonFace(scene: Scene, phase: number, waxing: boolean, seed: number): RawTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const half = size / 2;
  // Terminator: the lit region is bounded by an ellipse whose x-radius follows the phase.
  const k = 1 - 2 * clamp01(phase);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - half) / half;
      const dy = (y + 0.5 - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      const i = (y * size + x) * 4;
      if (r > 1) {
        data[i + 3] = 0;
        continue;
      }
      const maria = fbm((dx + 1) * 0.5, (dy + 1) * 0.5, { octaves: 4, period: 4, seed });
      const craters = ridged((dx + 1) * 0.5, (dy + 1) * 0.5, {
        octaves: 4,
        period: 11,
        seed: seed + 5,
      });
      const albedo = clamp01(0.62 + 0.3 * (maria - 0.5) + 0.16 * (craters - 0.5));
      // Lambert falloff towards the limb so it reads as a sphere, not a sticker.
      const limb = Math.pow(clamp01(1 - r * r), 0.28);
      const sx = waxing ? dx : -dx;
      const edge = Math.sqrt(Math.max(0, 1 - dy * dy)) * k;
      const lit = smoothstep(edge - 0.06, edge + 0.06, sx);
      const value = albedo * limb * (0.035 + 0.965 * lit);
      data[i] = Math.round(255 * clamp01(value * 1.0));
      data[i + 1] = Math.round(255 * clamp01(value * 0.98));
      data[i + 2] = Math.round(255 * clamp01(value * 0.93));
      data[i + 3] = Math.round(255 * clamp01(1 - smoothstep(0.965, 1.0, r)));
    }
  }
  return rgba(scene, 'env-moon', size, data, false);
}

/** A rain drop seen as a streak; the particle system stretches it further along its velocity. */
export function rainStreak(scene: Scene): RawTexture {
  const w = 16;
  const h = 64;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    // Thicker and brighter at the bottom of the streak, where the drop actually is.
    const taper = Math.pow(v, 0.6);
    for (let x = 0; x < w; x++) {
      const dx = Math.abs((x + 0.5) / w - 0.5) * 2;
      const across = clamp01(1 - dx / Math.max(0.18, 0.16 + 0.5 * taper));
      const a = Math.pow(across, 1.6) * (0.12 + 0.88 * taper);
      const i = (y * w + x) * 4;
      data[i] = 226;
      data[i + 1] = 236;
      data[i + 2] = 255;
      data[i + 3] = Math.round(255 * clamp01(a));
    }
  }
  const tex = new RawTexture(
    data,
    w,
    h,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  tex.name = 'env-rain';
  tex.wrapU = Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = Texture.CLAMP_ADDRESSMODE;
  tex.hasAlpha = true;
  return tex;
}

// ── Procedural PBR sets (showcase props) ────────────────────────────────────────────────────
export interface PbrSet {
  albedo: RawTexture;
  normal: RawTexture;
  /** Metallic in B, roughness in G — the packing `PBRMaterial.metallicTexture` expects. */
  orm: RawTexture;
  dispose(): void;
}

export interface PbrRecipe {
  name: string;
  base: [number, number, number];
  /** Second colour the noise mixes towards; keeps a surface from being one flat swatch. */
  accent: [number, number, number];
  roughness: [number, number];
  metallic: number;
  /** Height field: 'stone' cobbles, 'plaster' fine grain, 'metal' brushed. */
  pattern: 'stone' | 'plaster' | 'metal';
  seed: number;
  size?: number;
}

function heightAt(recipe: PbrRecipe, u: number, v: number): number {
  const s = recipe.seed;
  if (recipe.pattern === 'stone') {
    // Voronoi-ish cobbles from a jittered grid: the cheapest thing that still reads as masonry.
    const cells = 9;
    let best = 1e9;
    let second = 1e9;
    const gx = Math.floor(u * cells);
    const gy = Math.floor(v * cells);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const cx = (gx + ox + cells) % cells;
        const cy = (gy + oy + cells) % cells;
        const jx = (gx + ox + hash2(cx, cy, s) * 0.8 + 0.1) / cells;
        const jy = (gy + oy + hash2(cx, cy, s + 991) * 0.8 + 0.1) / cells;
        const dx = u - jx;
        const dy = v - jy;
        const d = dx * dx + dy * dy;
        if (d < best) {
          second = best;
          best = d;
        } else if (d < second) {
          second = d;
        }
      }
    }
    const edge = clamp01((Math.sqrt(second) - Math.sqrt(best)) * cells * 1.6);
    const grain = fbm(u, v, { octaves: 4, period: 24, seed: s + 3 });
    return clamp01(smoothstep(0.0, 0.35, edge) * 0.85 + grain * 0.15);
  }
  if (recipe.pattern === 'metal') {
    const brush =
      valueNoise(u * 220, v * 6, 220, s) * 0.6 + valueNoise(u * 40, v * 3, 40, s + 7) * 0.4;
    const dents = fbm(u, v, { octaves: 3, period: 5, seed: s + 19 });
    return clamp01(brush * 0.75 + dents * 0.25);
  }
  const coarse = fbm(u, v, { octaves: 5, period: 8, seed: s });
  const fine = fbm(u, v, { octaves: 3, period: 40, seed: s + 41 });
  return clamp01(coarse * 0.6 + fine * 0.4);
}

/**
 * Albedo + normal + metallic/roughness from one height field.
 *
 * The normal comes from central differences on that height rather than from a second noise, so
 * the bumps line up with the colour variation — a normal map that disagrees with the albedo is
 * the thing that makes generated materials look like plastic wrapped in a photo.
 */
export function pbrSet(scene: Scene, recipe: PbrRecipe): PbrSet {
  const size = recipe.size ?? 512;
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      height[y * size + x] = heightAt(recipe, (x + 0.5) / size, (y + 0.5) / size);
    }
  }
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const orm = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const strength = recipe.pattern === 'plaster' ? 2.4 : recipe.pattern === 'metal' ? 1.1 : 4.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const h = height[y * size + x];
      const t = clamp01(
        h * 0.75 +
          fbm((x + 0.5) / size, (y + 0.5) / size, {
            octaves: 3,
            period: 3,
            seed: recipe.seed + 101,
          }) *
            0.45
      );
      // Ambient occlusion in the crevices; without it the cobbles read as a printed pattern.
      const ao = 0.55 + 0.45 * Math.pow(h, 0.6);
      for (let c = 0; c < 3; c++) {
        albedo[i + c] = Math.round(255 * clamp01(mix(recipe.accent[c], recipe.base[c], t) * ao));
      }
      albedo[i + 3] = 255;

      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      normal[i] = Math.round(255 * ((-dx / len) * 0.5 + 0.5));
      normal[i + 1] = Math.round(255 * ((-dy / len) * 0.5 + 0.5));
      normal[i + 2] = Math.round(255 * ((1 / len) * 0.5 + 0.5));
      normal[i + 3] = 255;

      const rough = clamp01(mix(recipe.roughness[0], recipe.roughness[1], 1 - h));
      orm[i] = Math.round(255 * ao);
      orm[i + 1] = Math.round(255 * rough);
      orm[i + 2] = Math.round(255 * recipe.metallic);
      orm[i + 3] = 255;
    }
  }
  const albedoTex = rgba(scene, `${recipe.name}-albedo`, size, albedo, true);
  albedoTex.hasAlpha = false;
  const normalTex = rgba(scene, `${recipe.name}-normal`, size, normal, true);
  normalTex.hasAlpha = false;
  const ormTex = rgba(scene, `${recipe.name}-orm`, size, orm, true);
  ormTex.hasAlpha = false;
  return {
    albedo: albedoTex,
    normal: normalTex,
    orm: ormTex,
    dispose() {
      albedoTex.dispose();
      normalTex.dispose();
      ormTex.dispose();
    },
  };
}
