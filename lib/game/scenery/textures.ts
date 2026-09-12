/**
 * Procedural PBR texture sets for every prop this module draws.
 *
 * `public/game/assets` is empty in this checkout, so none of this is a fallback — it is what
 * ships, and it is held to the art bible's "procedural fallbacks are real materials too: a
 * generated brick or plank texture with normal, never a flat colour".
 *
 * Every set is three maps, generated together from one height field so the three agree:
 *   `albedo`  RGB(A) — sRGB colour; A is the alpha-test mask on the leaf set and 255 elsewhere
 *   `normal`  RGB    — tangent-space, OpenGL convention (green up), from the height field
 *   `orm`     RGB    — R ambient occlusion, G roughness, B metallic, which is exactly the
 *                      channel layout `PBRMaterial.metallicTexture` reads with the three
 *                      `use*FromMetallicTexture*` flags set
 *
 * Deriving the normal and the AO from the same height as the colour is the whole trick: a
 * hand-tuned normal map and a hand-tuned albedo drift apart, and the result reads as a photo with
 * a bump map on it rather than as a surface.
 *
 * **These are detail maps, not colour maps, and that is the correction that mattered most.** The
 * albedo a prop actually shows is `texture.rgb × vertexColour`, and the first version wrote the
 * full colour into BOTH — a mid-brown bark texture times a mid-brown vertex colour, which squares
 * the darkness: an oak trunk came out at about 4 % reflectance and rendered as a black post in
 * every screenshot at every time of day. So each shader writes a **luminance around 1.0** (roughly
 * 0.55–1.15) with only the hue shift the material itself has — moss on bark, lichen on stone —
 * and the palette in the generators carries the colour.
 *
 * Colour is written in sRGB and the samplers are created in gamma space (`Texture` defaults to
 * `gammaSpace = true`), so the numbers here are the numbers a colour picker would show. The normal
 * and ORM maps are data, not colour, and are created with `gammaSpace = false`.
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import { clamp01, mix, rand2, smoothstep, tileableFbm } from './noise';

export interface TextureSet {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
}

export interface SceneryTextures {
  bark: TextureSet;
  leaf: TextureSet;
  needle: TextureSet;
  /** Fine leafy mottle for solid foliage bodies — hedge, shrub core, grass blade. */
  moss: TextureSet;
  paint: TextureSet;
  metal: TextureSet;
  wood: TextureSet;
  stone: TextureSet;
  fabric: TextureSet;
  /** Radial falloff, greyscale, for the contact-shadow decal. Multiplied over the ground. */
  contact: RawTexture;
  resolution: number;
  generateMs: number;
  dispose(): void;
}

/** A surface sample: colour in sRGB 0..1, a height for the normal, and the material response. */
interface Sample {
  r: number;
  g: number;
  b: number;
  a: number;
  height: number;
  roughness: number;
  metallic: number;
  ao: number;
}

type Shader = (u: number, v: number, out: Sample) => void;

function makeSet(
  scene: Scene,
  size: number,
  salt: number,
  shade: Shader,
  name: string
): TextureSet {
  const albedo = new Uint8Array(size * size * 4);
  const heights = new Float32Array(size * size);
  const orm = new Uint8Array(size * size * 4);
  const sample: Sample = {
    r: 0,
    g: 0,
    b: 0,
    a: 1,
    height: 0.5,
    roughness: 0.8,
    metallic: 0,
    ao: 1,
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      sample.a = 1;
      sample.height = 0.5;
      sample.roughness = 0.8;
      sample.metallic = 0;
      sample.ao = 1;
      shade((x + 0.5) / size, (y + 0.5) / size, sample);
      const i = y * size + x;
      albedo[i * 4] = to8(sample.r);
      albedo[i * 4 + 1] = to8(sample.g);
      albedo[i * 4 + 2] = to8(sample.b);
      albedo[i * 4 + 3] = to8(sample.a);
      heights[i] = sample.height;
      orm[i * 4] = to8(sample.ao);
      orm[i * 4 + 1] = to8(sample.roughness);
      orm[i * 4 + 2] = to8(sample.metallic);
      orm[i * 4 + 3] = 255;
    }
  }
  const normal = normalsFrom(heights, size, 2.4);
  void salt;
  return {
    albedo: raw(scene, albedo, size, `${name}-albedo`, true),
    normal: raw(scene, normal, size, `${name}-normal`, false),
    orm: raw(scene, orm, size, `${name}-orm`, false),
  };
}

function to8(v: number): number {
  const n = Math.round(clamp01(v) * 255);
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

/** Sobel over the height field, wrapped, packed as an OpenGL-convention tangent normal. */
function normalsFrom(heights: Float32Array, size: number, strength: number): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => heights[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
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
      const i = (y * size + x) * 4;
      out[i] = to8((nx / len) * 0.5 + 0.5);
      out[i + 1] = to8((ny / len) * 0.5 + 0.5);
      out[i + 2] = to8((1 / len) * 0.5 + 0.5);
      out[i + 3] = 255;
    }
  }
  return out;
}

/**
 * One RGBA8 texture.
 *
 * `gammaSpace` is set explicitly rather than left to the default: albedo is colour and has to be
 * linearised on sampling, while a normal map and an ORM map are data and must not be. Getting that
 * backwards on the ORM map is invisible in a still and wrong in every light.
 */
function raw(
  scene: Scene,
  data: Uint8Array,
  size: number,
  name: string,
  gammaSpace: boolean
): RawTexture {
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
  tex.gammaSpace = gammaSpace;
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 4;
  return tex;
}

// ── The shaders ────────────────────────────────────────────────────────────────────────────

/**
 * Bark: vertical fibres at three scales, with the deep furrows of an old broadleaf.
 *
 * The V axis runs up the trunk, so the fibre is stretched 6:1 in V — a bark texture built from
 * isotropic noise reads as concrete, and that difference is most of what makes a trunk a trunk.
 */
function barkShader(salt: number): Shader {
  return (u, v, out) => {
    const fibre = tileableFbm(u * 22, v * 3.4, 22, salt, 4);
    const furrow = tileableFbm(u * 7, v * 1.4, 7, salt + 101, 3);
    const grain = tileableFbm(u * 60, v * 14, 60, salt + 202, 2);
    // Furrows are the dark cracks; the ridges between them catch the light.
    const crack = smoothstep(0.42, 0.62, furrow) * 0.75 + smoothstep(0.55, 0.8, fibre) * 0.25;
    const height = clamp01(crack * 0.8 + grain * 0.2);
    const value = 0.6 + 0.55 * height;
    const moss = smoothstep(0.68, 0.95, tileableFbm(u * 5, v * 2, 5, salt + 303, 3)) * 0.5;
    out.r = value * mix(1, 0.72, moss);
    out.g = value * mix(1, 0.98, moss);
    out.b = value * mix(0.94, 0.72, moss);
    out.height = height;
    out.roughness = 0.86 + 0.1 * (1 - height);
    out.metallic = 0;
    out.ao = 0.55 + 0.45 * height;
  };
}

/**
 * A leaf cluster on a card: the alpha channel is the silhouette, and it is the only thing that
 * decides whether a canopy reads as foliage or as a stack of rectangles.
 *
 * The mask is built from ~40 elliptical leaflets on stems radiating from the card's stalk, not
 * from thresholded noise — thresholded noise gives a lace curtain, which is exactly what a
 * generated tree usually looks like from below.
 */
function leafShader(salt: number, needle: boolean): Shader {
  const count = needle ? 74 : 58;
  const leaves: Array<{ x: number; y: number; ax: number; ay: number; rot: number; tone: number }> =
    [];
  for (let i = 0; i < count; i++) {
    const r = rand2(i, 0, salt);
    const r2 = rand2(i, 1, salt);
    const r3 = rand2(i, 2, salt);
    const r4 = rand2(i, 3, salt);
    // Leaflets fill the card in a rough ellipse rather than fanning along one stalk. A fan leaves
    // most of the quad transparent, and a canopy of transparent quads is a canopy you can see the
    // sky through from every angle — the first version read as a lace curtain at 20 m.
    const a = r * Math.PI * 2;
    const rad = Math.sqrt(r4) * 0.46;
    leaves.push({
      x: 0.5 + Math.cos(a) * rad,
      y: 0.5 + Math.sin(a) * rad * 0.94,
      ax: needle ? 0.05 + r2 * 0.026 : 0.058 + r2 * 0.034,
      ay: needle ? 0.012 + r3 * 0.008 : 0.03 + r3 * 0.022,
      rot: needle ? a + (r2 - 0.5) * 0.5 : (r2 - 0.5) * 3.1,
      tone: 0.74 + r3 * 0.48,
    });
  }
  return (u, v, out) => {
    let cover = 0;
    let tone = 0;
    let ridge = 0;
    for (const leaf of leaves) {
      const dx = u - leaf.x;
      const dy = v - leaf.y;
      const c = Math.cos(leaf.rot);
      const s = Math.sin(leaf.rot);
      const lx = (dx * c + dy * s) / leaf.ax;
      const ly = (-dx * s + dy * c) / leaf.ay;
      const d = lx * lx + ly * ly;
      if (d > 1) continue;
      const edge = 1 - d;
      if (edge > cover) {
        cover = edge;
        tone = leaf.tone;
        // The midrib: a bright line down the long axis of the leaflet.
        ridge = 1 - Math.min(1, Math.abs(ly) * 3.2);
      }
    }
    // A twig behind the leaflets so the card has something structural in it.
    const twig = 1 - smoothstep(0.004, 0.012, Math.abs(v - 0.5) * (1 - u * 0.55));
    const stem = u < 0.92 ? twig : 0;
    const mask = cover > 0.02 ? 1 : stem > 0.5 ? 1 : 0;
    const veins = tileableFbm(u * 40, v * 40, 40, salt + 55, 2);
    if (mask === 0) {
      out.a = 0;
      out.r = 0.8;
      out.g = 0.9;
      out.b = 0.6;
      out.height = 0.5;
      out.roughness = 0.9;
      out.ao = 1;
      return;
    }
    if (cover <= 0.02) {
      // the twig
      out.a = 1;
      out.r = 0.62;
      out.g = 0.5;
      out.b = 0.38;
      out.height = 0.35;
      out.roughness = 0.88;
      out.metallic = 0;
      out.ao = 0.6;
      return;
    }
    const lit = 0.72 + 0.42 * cover;
    const shade = tone * lit * (0.9 + 0.2 * veins);
    // A detail map: near white with a slight leaf-green bias, and a brighter midrib. The green
    // itself is the vertex colour, so one texture serves an oak, a spruce and a hedge.
    out.a = 1;
    out.r = clamp01(shade * 0.86 + ridge * 0.1);
    out.g = clamp01(shade * 1.02 + ridge * 0.14);
    out.b = clamp01(shade * 0.7 + ridge * 0.06);
    out.height = 0.45 + cover * 0.35 + ridge * 0.2;
    // Leaves are waxy: a real leaf has a broad, low-gloss highlight, which is what stops a canopy
    // reading as felt.
    out.roughness = 0.52 + 0.2 * (1 - cover);
    out.metallic = 0;
    out.ao = 0.62 + 0.38 * cover;
  };
}

/**
 * Fine foliage mottle for the *solid* bodies — a hedge's interior, a shrub's core, a grass blade.
 *
 * It exists because the leaf-cluster mask does not work at this scale and the first version used
 * it anyway: `addCard` maps the whole texture onto one card and the tubes and blobs here are UV'd
 * in metres, so a 0.6 m grass blade wearing a leaf-cluster texture came out as one enormous leaf.
 * This tiles every 25 cm and reads as leaves from a metre away, which is the distance that matters.
 */
function mossShader(salt: number): Shader {
  return (u, v, out) => {
    const leaves = tileableFbm(u * 26, v * 26, 26, salt, 3);
    const fine = tileableFbm(u * 90, v * 90, 90, salt + 13, 2);
    const shade = tileableFbm(u * 7, v * 7, 7, salt + 61, 3);
    // Little lobed patches: bright where a leaf faces up, dark in the gaps between them.
    const lobe = smoothstep(0.42, 0.72, leaves);
    const value = 0.55 + lobe * 0.5 + fine * 0.18 + (shade - 0.5) * 0.22;
    out.r = value * 0.88;
    out.g = value * 1.04;
    out.b = value * 0.72;
    out.height = clamp01(lobe * 0.7 + fine * 0.3);
    out.roughness = 0.7 + (1 - lobe) * 0.18;
    out.metallic = 0;
    out.ao = 0.55 + lobe * 0.45;
  };
}

/** Painted metalwork and plastics: the neutral base every prop tints with vertex colour. */
function paintShader(salt: number): Shader {
  return (u, v, out) => {
    const grain = tileableFbm(u * 46, v * 46, 46, salt, 3);
    const orangePeel = tileableFbm(u * 130, v * 130, 130, salt + 31, 2);
    const scratch = smoothstep(0.86, 1, tileableFbm(u * 9, v * 160, 9, salt + 77, 2));
    const wear = smoothstep(0.7, 1, tileableFbm(u * 5, v * 5, 5, salt + 12, 3));
    const value = 0.9 - grain * 0.06 - scratch * 0.12 + orangePeel * 0.03;
    out.r = value;
    out.g = value * 0.995;
    out.b = value * 0.985;
    out.height = 0.5 + orangePeel * 0.25 - scratch * 0.35;
    out.roughness = clamp01(0.42 + wear * 0.28 + scratch * 0.25 + grain * 0.08);
    out.metallic = 0;
    out.ao = 1 - scratch * 0.15;
  };
}

/** Brushed and slightly weathered metal: lamp posts, fence rails, arch structure. */
function metalShader(salt: number): Shader {
  return (u, v, out) => {
    const brush = tileableFbm(u * 4, v * 210, 4, salt, 3);
    const pit = smoothstep(0.78, 1, tileableFbm(u * 70, v * 70, 70, salt + 9, 2));
    const patina = tileableFbm(u * 6, v * 6, 6, salt + 40, 3);
    const value = 0.82 + brush * 0.22 - pit * 0.25;
    out.r = value * (1 + patina * 0.04);
    out.g = value;
    out.b = value * (1 - patina * 0.05);
    out.height = 0.5 + brush * 0.2 - pit * 0.5;
    out.roughness = clamp01(0.3 + brush * 0.18 + pit * 0.4);
    out.metallic = 1 - pit * 0.55;
    out.ao = 1 - pit * 0.35;
  };
}

/** Sawn softwood: bench slats, decking, fence posts. */
function woodShader(salt: number): Shader {
  return (u, v, out) => {
    // Growth rings: a warped ramp along U, so the grain runs down the plank.
    const warp = tileableFbm(u * 3, v * 9, 3, salt + 5, 3);
    const rings = Math.abs(((v * 9 + warp * 2.6) % 1) - 0.5) * 2;
    const fibre = tileableFbm(u * 12, v * 170, 12, salt + 21, 2);
    const knotField = tileableFbm(u * 2.5, v * 2.5, 3, salt + 60, 2);
    const knot = smoothstep(0.84, 0.96, knotField);
    const dark = clamp01(rings * 0.55 + fibre * 0.3 + knot * 0.6);
    // Detail only: the plank's colour is the vertex colour the generator picked.
    const value = mix(1.12, 0.6, dark);
    out.r = value;
    out.g = value * 0.96;
    out.b = value * 0.88;
    out.height = 0.55 - dark * 0.3 + fibre * 0.12;
    out.roughness = clamp01(0.66 + dark * 0.2);
    out.metallic = 0;
    out.ao = 1 - dark * 0.3;
  };
}

/** Weathered granite: boulders, planter walls, fountain basins, kerbs. */
function stoneShader(salt: number): Shader {
  return (u, v, out) => {
    const coarse = tileableFbm(u * 8, v * 8, 8, salt, 4);
    const speck = tileableFbm(u * 110, v * 110, 110, salt + 3, 2);
    const crack =
      1 - smoothstep(0.0, 0.06, Math.abs(tileableFbm(u * 5, v * 5, 5, salt + 88, 3) - 0.5));
    const lichen = smoothstep(0.62, 0.9, tileableFbm(u * 14, v * 14, 14, salt + 17, 3));
    const value = 0.72 + coarse * 0.34 + (speck - 0.5) * 0.24;
    out.r = value * mix(1, 0.86, lichen * 0.6);
    out.g = value * mix(1, 0.98, lichen * 0.6);
    out.b = value * mix(0.97, 0.72, lichen * 0.6);
    out.height = clamp01(coarse * 0.75 + speck * 0.25 - crack * 0.5);
    out.roughness = clamp01(0.72 + coarse * 0.18 - lichen * 0.1);
    out.metallic = 0;
    out.ao = clamp01(0.6 + coarse * 0.4 - crack * 0.35);
  };
}

/** Woven canvas: flags, parasols, lounger slings. */
function fabricShader(salt: number): Shader {
  return (u, v, out) => {
    const warp = Math.abs(((u * 90) % 1) - 0.5) * 2;
    const weft = Math.abs(((v * 90) % 1) - 0.5) * 2;
    const weave = Math.min(warp, weft);
    const slub = tileableFbm(u * 30, v * 30, 30, salt, 2);
    const value = 0.88 - weave * 0.18 + (slub - 0.5) * 0.1;
    out.r = value;
    out.g = value;
    out.b = value * 0.99;
    out.height = 0.5 + (warp - weft) * 0.25 + (slub - 0.5) * 0.2;
    out.roughness = 0.86 + slub * 0.1;
    out.metallic = 0;
    out.ao = 0.82 + 0.18 * (1 - weave);
  };
}

/** The contact shadow: white at the rim, dark under the prop, multiplied over the ground. */
function contactTexture(scene: Scene, size: number): RawTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const r = Math.hypot(dx, dy) * 2;
      // Squared falloff with a soft rim: an AO disc with a hard edge reads as a decal.
      const occ = 1 - smoothstep(0.15, 1, r);
      const wobble = 0.9 + 0.1 * tileableFbm((x / size) * 6, (y / size) * 6, 6, 991, 2);
      const value = 1 - occ * 0.62 * wobble;
      const i = (y * size + x) * 4;
      data[i] = to8(value);
      data[i + 1] = to8(value);
      data[i + 2] = to8(value);
      data[i + 3] = 255;
    }
  }
  return raw(scene, data, size, 'scenery-contact', false);
}

export function createSceneryTextures(
  scene: Scene,
  seed: number,
  resolution: number
): SceneryTextures {
  const t0 = performance.now();
  const size = Math.max(64, resolution);
  const set = (shader: Shader, name: string, salt: number, res = size) =>
    makeSet(scene, res, salt, shader, name);

  const textures: SceneryTextures = {
    bark: set(barkShader(seed ^ 0x1a2b), 'scenery-bark', 1),
    leaf: set(leafShader(seed ^ 0x2c3d, false), 'scenery-leaf', 2),
    needle: set(leafShader(seed ^ 0x3e4f, true), 'scenery-needle', 3),
    moss: set(mossShader(seed ^ 0x91a2), 'scenery-moss', 9, Math.min(size, 256)),
    paint: set(paintShader(seed ^ 0x4051), 'scenery-paint', 4),
    metal: set(metalShader(seed ^ 0x5162), 'scenery-metal', 5),
    wood: set(woodShader(seed ^ 0x6273), 'scenery-wood', 6),
    stone: set(stoneShader(seed ^ 0x7384), 'scenery-stone', 7),
    fabric: set(fabricShader(seed ^ 0x8495), 'scenery-fabric', 8, Math.min(size, 128)),
    contact: contactTexture(scene, 128),
    resolution: size,
    generateMs: 0,
    dispose() {
      for (const key of [
        'bark',
        'leaf',
        'needle',
        'moss',
        'paint',
        'metal',
        'wood',
        'stone',
        'fabric',
      ] as const) {
        const s = textures[key];
        s.albedo.dispose();
        s.normal.dispose();
        s.orm.dispose();
      }
      textures.contact.dispose();
    },
  };
  // The leaf and needle masks are the alpha test; without this the canopy draws as opaque cards.
  textures.leaf.albedo.hasAlpha = true;
  textures.needle.albedo.hasAlpha = true;
  textures.generateMs = performance.now() - t0;
  return textures;
}
