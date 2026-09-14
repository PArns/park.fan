/**
 * Three PBR materials and a contact decal, all procedural, all shared by the whole crowd.
 *
 * **Every texture here is a DETAIL map with a luminance around 1.0, not a colour map.** What a
 * guest's shirt actually shows is `texture.rgb × vertexColour × instanceColor`: the texture carries
 * the weave and the wear, the vertex colour carries the baked occlusion (`geometry.ts`), and the
 * instance colour carries the paint. Writing a colour into the texture as well multiplies two
 * mid-tones and comes out black, which is the mistake the scenery module documents having made on
 * its bark. So these three write cloth *structure* at ~0.9–1.1 and nothing else.
 *
 * **`maxSimultaneousLights = 6`**, not Babylon's default 4. A night scene holds the sun, the sky
 * term, the moon and whatever lamp rig is nearest; at 4 slots a guest standing under a lamp is lit
 * by the moon and by nothing else, which is the exact finding the paths critique made about paving.
 *
 * Nothing here sets `envExempt` except the contact decal: a guest in the rain should darken and
 * a guest in October should not be tinted like a leaf, which is what the default modulation does
 * (ARCHITECTURE §4).
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';

export interface GuestMaterials {
  cloth: PBRMaterial;
  skin: PBRMaterial;
  hair: PBRMaterial;
  contact: StandardMaterial;
  resolution: number;
  textureMs: number;
  all(): Material[];
  dispose(): void;
}

// ── Noise ───────────────────────────────────────────────────────────────────────────────────
function hash2(x: number, y: number, seed: number): number {
  let h =
    (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) / 4294967296;
}

/** Tileable value noise, so a texture wrapped round a limb has no seam. */
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

interface Sample {
  /** Luminance around 1. */
  value: number;
  /** Height, for the derived normal. */
  height: number;
  roughness: number;
  ao: number;
  /** Slight hue push, −1 cool to +1 warm. */
  warm: number;
}

type Shader = (u: number, v: number, out: Sample) => void;

interface TextureSet {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
}

function raw(
  scene: Scene,
  data: Uint8Array,
  size: number,
  name: string,
  gamma: boolean
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
  tex.gammaSpace = gamma;
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 4;
  return tex;
}

/**
 * Albedo, normal and ORM from one height field, so the three agree.
 *
 * The normal comes from a central difference of the same `height` the colour was drawn from; a
 * hand-authored normal and a hand-authored albedo drift apart and the result reads as a photograph
 * with a bump map over it.
 */
function makeSet(
  scene: Scene,
  size: number,
  name: string,
  shader: Shader,
  relief: number
): TextureSet {
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const orm = new Uint8Array(size * size * 4);
  const heights = new Float32Array(size * size);
  const sample: Sample = { value: 1, height: 0.5, roughness: 0.8, ao: 1, warm: 0 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      sample.value = 1;
      sample.height = 0.5;
      sample.roughness = 0.8;
      sample.ao = 1;
      sample.warm = 0;
      shader(u, v, sample);
      const i = (y * size + x) * 4;
      heights[y * size + x] = sample.height;
      const warm = sample.warm * 0.045;
      albedo[i] = to8(sample.value * (1 + warm));
      albedo[i + 1] = to8(sample.value);
      albedo[i + 2] = to8(sample.value * (1 - warm));
      albedo[i + 3] = 255;
      orm[i] = to8(sample.ao);
      orm[i + 1] = to8(sample.roughness);
      orm[i + 2] = 0;
      orm[i + 3] = 255;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const at = (dx: number, dy: number): number =>
        heights[((((y + dy) % size) + size) % size) * size + ((((x + dx) % size) + size) % size)];
      const dx = (at(1, 0) - at(-1, 0)) * relief;
      const dy = (at(0, 1) - at(0, -1)) * relief;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      normal[i] = to8((-dx / len) * 0.5 + 0.5);
      normal[i + 1] = to8((-dy / len) * 0.5 + 0.5);
      normal[i + 2] = to8((1 / len) * 0.5 + 0.5);
      normal[i + 3] = 255;
    }
  }
  return {
    albedo: raw(scene, albedo, size, `${name}-albedo`, true),
    normal: raw(scene, normal, size, `${name}-normal`, false),
    orm: raw(scene, orm, size, `${name}-orm`, false),
  };
}

// ── The three surfaces ──────────────────────────────────────────────────────────────────────
/**
 * Cotton: a warp and a weft at the thread scale, plus a soft wear pattern an order of magnitude
 * larger so a shirt is not uniform. The weave is what stops a t-shirt reading as painted plastic
 * at 3 m; the wear is what stops it reading as graph paper at 15.
 */
function clothShader(seed: number): Shader {
  return (u, v, out) => {
    const warp = Math.sin(u * Math.PI * 2 * 64) * 0.5 + 0.5;
    const weft = Math.sin(v * Math.PI * 2 * 64) * 0.5 + 0.5;
    const thread = warp * 0.5 + weft * 0.5;
    const wear = fbm(u, v, 5, 3, seed);
    const fuzz = noise(u, v, 96, seed + 7);
    out.height = thread * 0.6 + fuzz * 0.4;
    out.value = 0.9 + thread * 0.11 + (wear - 0.5) * 0.09 + (fuzz - 0.5) * 0.03;
    out.roughness = 0.78 + (1 - thread) * 0.12 + (wear - 0.5) * 0.06;
    out.ao = 0.86 + thread * 0.14;
    out.warm = (wear - 0.5) * 0.6;
  };
}

/**
 * Skin: pores at a very fine scale and almost nothing else.
 *
 * A face at the size a guest is ever seen is thirty pixels, so the job here is only to stop the
 * specular highlight from being a mirror. Roughness 0.52 with a little variation is a matte human;
 * 1.0 is chalk and 0.2 is a shop mannequin, and both read instantly wrong in a low sun.
 */
function skinShader(seed: number): Shader {
  return (u, v, out) => {
    const pores = noise(u, v, 128, seed);
    const blotch = fbm(u, v, 7, 3, seed + 31);
    out.height = pores * 0.7 + blotch * 0.3;
    out.value = 0.97 + (blotch - 0.5) * 0.06 + (pores - 0.5) * 0.02;
    out.roughness = 0.5 + (pores - 0.5) * 0.08 + (blotch - 0.5) * 0.05;
    out.ao = 0.94 + pores * 0.06;
    out.warm = 0.4 + (blotch - 0.5) * 0.5;
  };
}

/**
 * Hair: strands running down V, anisotropic by a factor of about twelve.
 *
 * Isotropic noise on hair reads as felt. The direction matters more than the detail — the strand
 * highlight running across the crown is what says "hair" at any distance where the head is more
 * than a few pixels.
 */
function hairShader(seed: number): Shader {
  return (u, v, out) => {
    const strand = noise(u * 12, v, 48, seed);
    const clump = noise(u * 4, v * 0.5, 12, seed + 17);
    out.height = strand * 0.75 + clump * 0.25;
    out.value = 0.86 + strand * 0.2 + (clump - 0.5) * 0.08;
    out.roughness = 0.34 + (1 - strand) * 0.2;
    out.ao = 0.7 + clump * 0.3;
    out.warm = (clump - 0.5) * 0.4;
  };
}

function contactTexture(scene: Scene, size: number): RawTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const r = Math.min(1, Math.hypot(dx, dy) * 2);
      // Squared falloff, and no hard rim: a disc with an edge reads as a sticker on the path.
      const occ = Math.pow(1 - r, 2.1);
      const value = 1 - occ * 0.55;
      const i = (y * size + x) * 4;
      data[i] = to8(value);
      data[i + 1] = to8(value);
      data[i + 2] = to8(value);
      data[i + 3] = 255;
    }
  }
  return raw(scene, data, size, 'guest-contact', false);
}

function pbr(
  scene: Scene,
  name: string,
  set: TextureSet,
  uvScale: number,
  bump: number
): PBRMaterial {
  const m = new PBRMaterial(name, scene);
  m.albedoTexture = set.albedo;
  m.bumpTexture = set.normal;
  m.metallicTexture = set.orm;
  // R ambient occlusion, G roughness, B metallic. Without these three flags Babylon reads the
  // whole map as reflectivity and the crowd comes out chrome.
  m.useAmbientOcclusionFromMetallicTextureRed = true;
  m.useRoughnessFromMetallicTextureGreen = true;
  m.useMetallnessFromMetallicTextureBlue = true;
  m.albedoColor = new Color3(1, 1, 1);
  m.metallic = 1;
  m.roughness = 1;
  m.backFaceCulling = true;
  m.transparencyMode = Material.MATERIAL_OPAQUE;
  m.bumpTexture.level = bump;
  for (const tex of [set.albedo, set.normal, set.orm]) {
    tex.uScale = uvScale;
    tex.vScale = uvScale;
  }
  m.maxSimultaneousLights = 6;
  return m;
}

export function createGuestMaterials(
  scene: Scene,
  seed: number,
  resolution: number
): GuestMaterials {
  const started = typeof performance !== 'undefined' ? performance.now() : 0;
  const size = Math.max(64, resolution);
  const clothSet = makeSet(scene, size, 'guest-cloth', clothShader(seed ^ 0x51ab), 3.4);
  const skinSet = makeSet(scene, size, 'guest-skin', skinShader(seed ^ 0x2fd1), 1.4);
  const hairSet = makeSet(scene, size, 'guest-hair', hairShader(seed ^ 0x7c05), 4.2);

  const cloth = pbr(scene, 'guest-cloth', clothSet, 1, 0.9);
  const skin = pbr(scene, 'guest-skin', skinSet, 1, 0.45);
  const hair = pbr(scene, 'guest-hair', hairSet, 1, 1.1);

  const contact = new StandardMaterial('guest-contact', scene);
  // `disableLighting` leaves the diffuse base at zero, so the map has to go in the EMISSIVE slot;
  // in the diffuse slot it renders pure black. `ALPHA_MULTIPLY` then makes the white rim a no-op
  // and the dark centre an occlusion, which is why the texture is greyscale and not an alpha mask.
  contact.disableLighting = true;
  contact.emissiveTexture = contactTexture(scene, 64);
  contact.diffuseColor = new Color3(0, 0, 0);
  contact.specularColor = new Color3(0, 0, 0);
  contact.alphaMode = Constants.ALPHA_MULTIPLY;
  contact.alpha = 0.999;
  contact.disableDepthWrite = true;
  contact.backFaceCulling = true;
  contact.metadata = { envExempt: true };

  const sets = [clothSet, skinSet, hairSet];
  const textureMs = (typeof performance !== 'undefined' ? performance.now() : 0) - started;

  return {
    cloth,
    skin,
    hair,
    contact,
    resolution: size,
    textureMs,
    all: () => [cloth, skin, hair, contact],
    dispose() {
      for (const set of sets) {
        set.albedo.dispose();
        set.normal.dispose();
        set.orm.dispose();
      }
      contact.emissiveTexture?.dispose();
      cloth.dispose();
      skin.dispose();
      hair.dispose();
      contact.dispose();
    },
  };
}
