/**
 * Every surface a slide has, generated at boot. No files, no fetch.
 *
 * Four looks — moulded gelcoat, galvanised steel, deck boards, canopy fabric — plus the water
 * sheet, and one texture set per look rather than one per slide: a park with six flumes in six
 * colours shares one 384² gelcoat set and tints it with `albedoColor`, so the cost is the number
 * of LOOKS and not the number of slides. That matters more here than elsewhere, because a boot
 * that generates a set per entity is a boot that trips the host's 8 s worker-ready notice — which
 * `pools/materials.ts` recorded doing.
 *
 * Three maps from one height field (`paths` and `pools` both use the discipline): albedo, a normal
 * from central differences on that height, and an ORM with occlusion in red and roughness in green.
 * Deriving all three from the same field is what makes a moulded flume read as moulded — the seam
 * you see, the seam you feel in the bump, and the sheen break at the seam all agree about where it
 * is.
 *
 * ## What is specific to this module
 *
 * **Gelcoat is the glossiest thing in a water park, and it is not a mirror.** A polyester gelcoat
 * over glass fibre is sprayed and flow-coated, so it carries "orange peel" — a millimetre-scale
 * undulation you only see as a wobble in the reflection — plus the butt seams where 2.4 m mouldings
 * are bolted together. Roughness 0.09 on the face and 0.35 in the seam. Without the peel it is a
 * plastic tube; with roughness 1.0 it is the grey the art bible bans by name.
 *
 * **The water sheet is `envExempt`.** It is the case §4 of ARCHITECTURE.md names outright: it owns
 * its own look, animates its own albedo, and a wetness pass over running water would darken the one
 * surface in the park that is already wet.
 *
 * **And the sheet is drawn with vertex colours.** `geom.ts` bakes the local gradient into the
 * colour channel — RGB is the foam, alpha is how OPAQUE the water is there — so one material draws
 * a lazy run-out and a 54° plunge without a uniform per slide. `mesh.useVertexColors` is on by
 * default and `PBRMaterial` picks the attribute up through its own `VERTEXCOLOR` define.
 *
 * **`hasVertexAlpha` is the line that was missing, and it is why the sheet was white plastic.**
 * Round 1's docblock said the alpha channel was "read by the scroll in `animate()`"; it was read by
 * nothing. `AbstractMesh.hasVertexAlpha` defaults to **false**, so `VERTEXALPHA` was never defined
 * and every vertex's alpha was discarded — a quarter of the buffer computed, uploaded and ignored,
 * with a green build. Turning it on is what lets calm water be see-through and aerated water not,
 * which is the difference between 3 cm of running water and a strip of white paper.
 *
 * The other half of the same fault is specular. A PBR dielectric at roughness 0.06 under a bright
 * sky is a mirror, and Babylon's `useSpecularOverAlpha` / `useRadianceOverAlpha` both default to
 * **true**, which adds the full reflection ON TOP of the alpha — so a 26 %-transparent sheet still
 * carried a 100 % highlight and rendered white at grazing angles, which is every angle a chute is
 * seen from. Both are off, the roughness is a running sheet's rather than a pond's, and the
 * environment term no longer multiplies the sky by 1.5.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Material } from '@babylonjs/core/Materials/material';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { QualityPreset } from '../core/types';
import { hexToLinear } from './geom';

/**
 * The four looks. `shade` and not `canopy`, and that is not a naming preference: the environment
 * module identifies foliage by `metadata.foliage` OR by a regex over the material's NAME
 * (`environment/surfaces.ts:29`), and that regex contains `canopy`. A material called
 * `flume-canopy:#16e0c8` was being seasonally tinted — the first render came back with a green
 * roof over every slide tower. `metadata.foliage = false` does not help, because the test is
 * `foliage === true || NAME.test(name)`; the name is the fix.
 */
export type FlumeSurface = 'gelcoat' | 'steel' | 'deck' | 'shade';

/** Texel budget per set. A flume seam repeats every metre, so 384 px is 384 px/m at `high`. */
const TEXTURE_SIZE: Record<QualityPreset, number> = {
  low: 160,
  medium: 256,
  high: 384,
  ultra: 512,
};

interface Recipe {
  /** Height field in 0..1 at (u, v). */
  height(u: number, v: number, seed: number): number;
  /** Albedo modulation in 0..1 — 1 is the full tint, lower is a darker patch. */
  shade(u: number, v: number, h: number, seed: number): number;
  /** Roughness on a face and in a joint. */
  roughness: [number, number];
  relief: number;
  metallic: number;
}

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 362437);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Tileable value noise on `cells` per side. */
function noise(u: number, v: number, cells: number, seed: number): number {
  const x = u * cells;
  const y = v * cells;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const w = (a: number, b: number) => hash2(((a % cells) + cells) % cells, ((b % cells) + cells) % cells, seed); // prettier-ignore
  const a = w(xi, yi);
  const b = w(xi + 1, yi);
  const c = w(xi, yi + 1);
  const d = w(xi + 1, yi + 1);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

function fbm(u: number, v: number, cells: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(u, v, cells * 2 ** o, seed + o * 97);
    total += amp;
    amp *= 0.5;
  }
  return sum / total;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const RECIPES: Record<FlumeSurface, Recipe> = {
  /**
   * Moulded gelcoat: orange peel plus a butt seam every 2.4 m of moulding.
   *
   * The seam runs across the flume, which in this module's UV convention is constant `v` (v is arc
   * length in metres, u is across the section). One repeat of the texture is one metre, so a seam
   * every 2.4 m is drawn as a band at v = 0 and read at every other repeat — close enough at the
   * distance a camera in this game gets to, and it costs nothing.
   */
  gelcoat: {
    height(u, v, seed) {
      const peel = fbm(u, v, 9, 3, seed) * 0.5 + fbm(u * 2.3, v * 2.3, 17, 2, seed + 31) * 0.28;
      const seam = Math.exp(-((v - 0.5) ** 2) / 0.00035);
      return clamp01(0.62 + peel * 0.38 - seam * 0.55);
    },
    shade(u, v, h, seed) {
      const grain = fbm(u * 3.1, v * 3.1, 23, 2, seed + 401);
      const seam = Math.exp(-((v - 0.5) ** 2) / 0.0006);
      return clamp01(0.94 + (h - 0.7) * 0.22 + grain * 0.05 - seam * 0.3);
    },
    roughness: [0.09, 0.35],
    relief: 0.5,
    metallic: 0,
  },
  /** Hot-dip galvanised tube: the spangle pattern, plus the long scratches of an erected column. */
  steel: {
    height(u, v, seed) {
      const spangle = fbm(u * 1.7, v * 1.7, 13, 3, seed);
      const scratch = noise(u * 26, v * 0.7, 31, seed + 77);
      return clamp01(0.55 + spangle * 0.35 + scratch * 0.12);
    },
    shade(u, v, h, seed) {
      return clamp01(0.72 + (h - 0.6) * 0.55 + fbm(u * 2, v * 2, 9, 2, seed + 13) * 0.14);
    },
    roughness: [0.24, 0.52],
    relief: 0.7,
    metallic: 0.5,
  },
  /** Deck boards: a plank every 0.14 m of the repeat, with a sawn grain along them. */
  deck: {
    height(u, v, seed) {
      const board = Math.floor(v * 7);
      const within = v * 7 - board;
      const gap = Math.min(within, 1 - within);
      const grain = fbm(u * 5, board * 0.37, 29, 3, seed + board * 17);
      return clamp01(0.5 + grain * 0.4 - Math.exp(-gap * gap * 420) * 0.5);
    },
    shade(u, v, h, seed) {
      const board = Math.floor(v * 7);
      const tone = hash2(board, 3, seed + 5) * 0.22;
      return clamp01(0.78 + (h - 0.55) * 0.4 + tone - 0.11);
    },
    roughness: [0.55, 0.82],
    relief: 1,
    metallic: 0,
  },
  /** Tensioned canopy fabric: a weave, and the sag between the frames. */
  shade: {
    height(u, v, seed) {
      const weave = (Math.sin(u * Math.PI * 96) + Math.sin(v * Math.PI * 96)) * 0.12;
      return clamp01(0.6 + weave + fbm(u, v, 7, 2, seed) * 0.2);
    },
    shade(u, v, h) {
      return clamp01(0.9 + (h - 0.62) * 0.25);
    },
    roughness: [0.48, 0.68],
    relief: 0.35,
    metallic: 0,
  },
};

interface TextureSet {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
  dispose(): void;
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
  // A flume is seen along its length for most of a frame; without anisotropy the far half of the
  // trough turns to grey mush and takes the seams with it.
  tex.anisotropicFilteringLevel = 8;
  return tex;
}

function buildSet(
  scene: Scene,
  name: string,
  recipe: Recipe,
  size: number,
  seed: number
): TextureSet {
  const height = new Float32Array(size * size);
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const orm = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      height[y * size + x] = recipe.height((x + 0.5) / size, (y + 0.5) / size, seed);
    }
  }
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const strength = recipe.relief * 7;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = y * size + x;
      const i = k * 4;
      const h = height[k];
      const shade = recipe.shade((x + 0.5) / size, (y + 0.5) / size, h, seed);
      const around = (at(x + 2, y) + at(x - 2, y) + at(x, y + 2) + at(x, y - 2)) / 4;
      const ao = clamp01(0.62 + 0.38 * clamp01(1 - (around - h) * 2.8));
      // The albedo is written as a WHITE map: the colour comes from `albedoColor`, which is what
      // lets six flumes in six colours share one set.
      const byte = Math.round(255 * clamp01(shade) ** (1 / 2.2));
      albedo[i] = byte;
      albedo[i + 1] = byte;
      albedo[i + 2] = byte;
      albedo[i + 3] = 255;

      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      normal[i] = Math.round(255 * ((-dx / len) * 0.5 + 0.5));
      normal[i + 1] = Math.round(255 * ((-dy / len) * 0.5 + 0.5));
      normal[i + 2] = Math.round(255 * ((1 / len) * 0.5 + 0.5));
      normal[i + 3] = 255;

      const rough = clamp01(
        recipe.roughness[0] + (recipe.roughness[1] - recipe.roughness[0]) * (1 - h)
      );
      orm[i] = Math.round(255 * ao);
      orm[i + 1] = Math.round(255 * rough);
      orm[i + 2] = Math.round(255 * recipe.metallic);
      orm[i + 3] = 255;
    }
  }
  const a = raw(scene, `flume-${name}-albedo`, size, albedo);
  const n = raw(scene, `flume-${name}-normal`, size, normal);
  const o = raw(scene, `flume-${name}-orm`, size, orm);
  n.gammaSpace = false;
  o.gammaSpace = false;
  return {
    albedo: a,
    normal: n,
    orm: o,
    dispose() {
      a.dispose();
      n.dispose();
      o.dispose();
    },
  };
}

/**
 * The running-water normal map.
 *
 * Two things a lake's ripple does not have and a sheet on a slide does: the perturbation is
 * STRETCHED along the direction of flow (water running down a chute has streaks, not circles), and
 * it carries a foam threshold in the alpha so the same map drives the white. Scrolled by
 * `animate()` at two rates, which is what stops one visible tiling rate reading as a conveyor belt.
 */
function buildFlowNormal(scene: Scene, size: number, seed: number): RawTexture {
  const height = new Float32Array(size * size);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      // Streaks: high frequency across the flume, low along it.
      const streak = fbm(u * 1.0, v * 0.22, 11, 3, seed);
      const chop = fbm(u * 1.0, v * 0.6, 23, 2, seed + 61);
      height[y * size + x] = clamp01(streak * 0.72 + chop * 0.28);
    }
  }
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = (at(x + 1, y) - at(x - 1, y)) * 5.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.2;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      data[i] = Math.round(255 * ((-dx / len) * 0.5 + 0.5));
      data[i + 1] = Math.round(255 * ((-dy / len) * 0.5 + 0.5));
      data[i + 2] = Math.round(255 * ((1 / len) * 0.5 + 0.5));
      data[i + 3] = 255;
    }
  }
  const tex = raw(scene, 'flume-flow-normal', size, data);
  tex.gammaSpace = false;
  return tex;
}

export interface FlumeMaterials {
  /** The trough shell, tinted per slide. One material per COLOUR, not per slide. */
  shell(color: string): PBRMaterial;
  /** The tower's steelwork, deck boards and canopy, tinted per tower style. */
  surface(kind: Exclude<FlumeSurface, 'gelcoat'>, color: string): PBRMaterial;
  /** The sheet running down the trough. One for the whole park. */
  water(): PBRMaterial;
  /**
   * The vehicle hull and the riders' costumes — ONE material for the whole park.
   *
   * White albedo, coloured per THIN INSTANCE by `main.ts` out of the style's `rig.colors` and
   * `rig.wear` palettes. Round 1 had a material per colour and drew `colors[0]` for every vehicle
   * on a slide, so the palettes were decoration and the raft fleet was one yellow; this is fewer
   * materials AND more colours, because an instance colour costs no bind.
   */
  vehicle(): PBRMaterial;
  /** Emissive trim for a slide that carries a night rig. */
  glow(color: string): PBRMaterial;
  /** Real seconds — water runs at the same rate at every game speed. */
  animate(seconds: number): void;
  setEnvironment(night: number): void;
  all(): Material[];
  size: number;
  textureMs: number;
  dispose(): void;
}

export function createFlumeMaterials(
  scene: Scene,
  preset: QualityPreset,
  seed: number
): FlumeMaterials {
  const size = TEXTURE_SIZE[preset] ?? 256;
  const t0 = performance.now();
  const sets = new Map<FlumeSurface, TextureSet>();
  const materials = new Map<string, PBRMaterial>();
  const flowNormal = buildFlowNormal(scene, Math.max(128, Math.round(size * 0.75)), seed + 5501);
  let waterMaterial: PBRMaterial | null = null;
  let night = 0;

  function setFor(kind: FlumeSurface): TextureSet {
    let set = sets.get(kind);
    if (!set) {
      set = buildSet(scene, kind, RECIPES[kind], size, seed + kind.length * 733);
      sets.set(kind, set);
    }
    return set;
  }

  function tinted(kind: FlumeSurface, color: string): PBRMaterial {
    const key = `${kind}:${color}`;
    const cached = materials.get(key);
    if (cached) return cached;
    const set = setFor(kind);
    const m = new PBRMaterial(`flume-${key}`, scene);
    const [r, g, b] = hexToLinear(color);
    m.albedoColor = new Color3(r, g, b);
    m.albedoTexture = set.albedo;
    m.bumpTexture = set.normal;
    m.metallicTexture = set.orm;
    m.useAmbientOcclusionFromMetallicTextureRed = true;
    m.useRoughnessFromMetallicTextureGreen = true;
    m.useMetallnessFromMetallicTextureBlue = true;
    m.metallic = 1;
    m.roughness = 1;
    // Half-metallic steel and not 0.9, for the reason `rides` recorded and `pools` repeated: a
    // fully metallic PBR surface has no diffuse term, so under a dim analytic sky every galvanised
    // column renders black. The ORM's blue carries it; this is the ceiling.
    m.environmentIntensity = 1;
    materials.set(key, m);
    if (night > 0) applyNight(key, m);
    return m;
  }

  /**
   * What a surface does after dark.
   *
   * Round 1 shipped nothing here, and the round-1 critic's night frames are the bill: two of five
   * slides declare a `night.light`, the `medium` pool is two, and everything outside those two
   * pools of light was "a pale grey kerb" at 19:29 and invisible at 340 m. A gelcoat trough IS
   * grey with no light on it — that part is correct PBR — but a real park does not leave its
   * slides unlit, and this module cannot answer it with more point lights, which are the thing
   * every other module has already recorded as not free.
   *
   * So the GELCOAT keeps a tenth of its own albedo as an emissive term at full night. It is small
   * on purpose: enough that a teal chute is still teal and a purple pipe still purple against a
   * dark park, not enough to read as a glowing plastic tube. Steel, deck boards and canopy fabric
   * get nothing — a handrail that glows is a mistake, and the tower reads as a silhouette, which
   * is what the critic said the timber lattice already did well.
   */
  function applyNight(key: string, m: PBRMaterial): void {
    if (key.startsWith('glow:')) {
      m.emissiveIntensity = 0.15 + night * 0.85;
      return;
    }
    if (!key.startsWith('gelcoat:')) return;
    const a = m.albedoColor;
    m.emissiveColor.set(a.r * 0.1 * night, a.g * 0.1 * night, a.b * 0.1 * night);
  }

  const api: FlumeMaterials = {
    shell: (color) => tinted('gelcoat', color),
    surface: (kind, color) => tinted(kind, color),
    vehicle() {
      const key = 'vehicle';
      const cached = materials.get(key);
      if (cached) return cached;
      const m = new PBRMaterial('flume-vehicle', scene);
      m.albedoColor = new Color3(1, 1, 1);
      // A wet inflatable is smooth and dark-reflecting; no texture, because at the size a vehicle
      // is ever drawn a 384² map is under a pixel per texel and costs a bind for nothing.
      m.metallic = 0;
      m.roughness = 0.28;
      materials.set(key, m);
      return m;
    },
    water() {
      if (waterMaterial) return waterMaterial;
      const m = new PBRMaterial('flume-water', scene);
      m.albedoColor = new Color3(0.34, 0.66, 0.78);
      m.bumpTexture = flowNormal;
      m.bumpTexture.level = 0.85;
      m.metallic = 0;
      // A sheet 3 cm deep over a moulded floor, broken up by its own flow. 0.06 was a still pond.
      m.roughness = 0.16;
      // The vertex alpha carries the range (0.30 in the run-out, 1.00 in the foam); this is the
      // ceiling it is measured against, not the sheet's opacity.
      m.alpha = 0.95;
      m.transparencyMode = Material.MATERIAL_ALPHABLEND;
      m.backFaceCulling = true;
      // Both default TRUE, and together they were the white. See the file docblock.
      m.useSpecularOverAlpha = false;
      m.useRadianceOverAlpha = false;
      /**
       * **Water does not glow, and this material was the last place in the module that said it did.**
       *
       * Round 2 gave the sheet an emissive term "so it does not go black in the shadow of the
       * trough's own wall" and then RAMPED IT WITH `night`, up to (0.09, 0.18, 0.24). Measured at
       * 23:00 on the module's own `ground` frame, the sheet came out at value 0.58 on average and
       * 0.80 at its ninetieth percentile against a night grass reading 0.13 — the brightest thing
       * in a night frame was the one surface with no light on it. A shadowed sheet is meant to be
       * dark; what fills it in is the sky it reflects, which is `environmentIntensity`, and what
       * fills it in after dark is the slide's own rig — which is why round 3 gave the tower a lit
       * edge (`TowerBuild.lights`, welded into the trough's rim strip) instead of giving the water
       * a torch.
       */
      m.emissiveColor = new Color3(0, 0, 0);
      m.environmentIntensity = 0.85;
      // §4: water owns its own look. No wetness pass, no seasonal tint, no exposure fiddling.
      m.metadata = { envExempt: true };
      waterMaterial = m;
      return m;
    },
    glow(color) {
      const key = `glow:${color}`;
      const cached = materials.get(key);
      if (cached) return cached;
      const m = new PBRMaterial(`flume-${key}`, scene);
      const [r, g, b] = hexToLinear(color);
      m.albedoColor = new Color3(r * 0.3, g * 0.3, b * 0.3);
      m.emissiveColor = new Color3(r, g, b);
      m.emissiveIntensity = 0;
      m.metallic = 0;
      m.roughness = 0.4;
      m.metadata = { envExempt: true };
      materials.set(key, m);
      return m;
    },
    animate(seconds) {
      if (!waterMaterial?.bumpTexture) return;
      const t = waterMaterial.bumpTexture as Texture;
      // Down the flume (v is arc length) fast, across it slowly: the second rate is what keeps the
      // sheet from reading as one sliding image.
      t.uOffset = (t.uOffset + 0.0006) % 1;
      t.vOffset = (seconds * -0.55) % 1;
      t.uScale = 1;
      t.vScale = 1;
    },
    setEnvironment(value) {
      night = value;
      for (const [key, m] of materials) applyNight(key, m);
      if (waterMaterial) {
        /**
         * The sheet gets no term of its own after dark — see `water()`. What it gets instead is
         * the environment it reflects: a wet, nearly specular surface picks up more of a dark sky
         * than a diffuse one does, so the reflection is turned UP at night rather than an emission
         * being turned on. It is still a reflection: with nothing lit nearby the sheet is dark,
         * which is what an unlit slide at midnight looks like.
         */
        waterMaterial.environmentIntensity = 0.85 + night * 0.35;
      }
    },
    all: () => [...materials.values(), ...(waterMaterial ? [waterMaterial] : [])],
    size,
    textureMs: 0,
    dispose() {
      for (const m of materials.values()) m.dispose();
      materials.clear();
      waterMaterial?.dispose();
      waterMaterial = null;
      for (const set of sets.values()) set.dispose();
      sets.clear();
      flowNormal.dispose();
    },
  };
  api.textureMs = performance.now() - t0;
  // Referenced so the import is not dropped by a bundler that cannot see the assignment above.
  void Vector2;
  return api;
}
