/**
 * One PBR material per tile style, per edge treatment, and four shared finishes for the metalwork
 * and the furniture.
 *
 * Per STYLE and not per pool: two lagoons in the same mosaic share a material, a texture set and a
 * shader program, so a water park costs materials in the number of looks it has and not in the
 * number of basins.
 *
 * ARCHITECTURE §4 metadata, decided per surface rather than in one sweep:
 *
 *  - **tile, coping, deck, metal, fabric, timber — modulated.** A pool deck in the rain should
 *    darken and go glossy like every other paved surface in the park; that is the `environment`
 *    module's wet pass multiplying `albedoColor` and `roughness`, which is why both stay at 1 here
 *    and the textures carry the values.
 *  - **glow and water — `envExempt = true`.** Water is the canonical case named in §4: it owns its
 *    own look, animates its own albedo against the sky, and a wetness pass over it would darken
 *    the one surface in the park that is already wet. The niche lamps animate their emissive
 *    against `EnvironmentState.night` and must not also be dimmed.
 *
 * Peak emissive is **1.0**. The pipeline's bloom threshold is 0.9 and `shops` recorded what 1.35
 * looks like: featureless white bars with a halo where a lit sign should be.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import type { QualityPreset } from '../core/types';
import type { PoolEdgeSpec, PoolTileSpec } from './types';
import {
  copingRecipe,
  createCaustics,
  createSurfaceTextures,
  deckRecipe,
  tileRecipe,
  type SurfaceTextureSet,
} from './textures';

export type PoolFinish = 'metal' | 'fabric' | 'timber';

export interface PoolMaterials {
  /** The pool's tiled surfaces — floor, wall and steps — for one tile style. */
  tile(style: PoolTileSpec): PBRMaterial;
  coping(edge: PoolEdgeSpec): PBRMaterial;
  deck(edge: PoolEdgeSpec): PBRMaterial;
  /** The emissive niche lamp for one tile style — its colour is the style's `night`. */
  glow(style: PoolTileSpec): PBRMaterial;
  finish(name: PoolFinish): PBRMaterial;
  /** White, alpha-blended, unlit-ish: the ring a splash leaves on the surface. */
  foam(): PBRMaterial;
  /** The caustic map, so the water surface can scroll it in step with its own ripples. */
  caustics: RawTexture;
  /** `night` and `sunUp` are both 0..1; every tile style takes its own lamp colour from here. */
  setEnvironment(night: number, sunUp: number): void;
  /** Scroll the caustic net. Real seconds — a pool ripples at the same rate at every game speed. */
  animate(seconds: number): void;
  all(): Material[];
  textureMs(): number;
  size: number;
  dispose(): void;
}

const TEXTURE_SIZE: Record<QualityPreset, number> = {
  low: 192,
  medium: 320,
  high: 512,
  ultra: 512,
};
const CAUSTIC_SIZE: Record<QualityPreset, number> = {
  low: 128,
  medium: 192,
  high: 256,
  ultra: 256,
};

/**
 * The three non-tiled finishes, in the same vocabulary the `rides` module uses.
 *
 * `metal` is half metallic and not 0.9 for the reason that module recorded and paid for: a fully
 * metallic PBR surface has no diffuse term at all, so under a dim analytic sky every stainless
 * handrail renders black. Half keeps the specular and gives the steel something to be seen by.
 */
const FINISHES: Record<PoolFinish, { metallic: number; roughness: number }> = {
  metal: { metallic: 0.5, roughness: 0.24 },
  fabric: { metallic: 0, roughness: 0.86 },
  timber: { metallic: 0, roughness: 0.66 },
};

export function createPoolMaterials(
  scene: Scene,
  preset: QualityPreset,
  seed: number
): PoolMaterials {
  const size = TEXTURE_SIZE[preset] ?? 320;
  const sets = new Map<string, SurfaceTextureSet>();
  const materials = new Map<string, PBRMaterial>();
  const finishes = new Map<PoolFinish, PBRMaterial>();
  const glows = new Map<string, PBRMaterial>();
  let foamMaterial: PBRMaterial | null = null;
  const styles = new Map<string, PoolTileSpec>();
  const caustics = createCaustics(scene, CAUSTIC_SIZE[preset] ?? 192, seed + 4409);
  let generateMs = 0;
  let night = 0;

  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

  function textures(key: string, make: () => SurfaceTextureSet): SurfaceTextureSet {
    let set = sets.get(key);
    if (!set) {
      const start = typeof performance !== 'undefined' ? performance.now() : 0;
      set = make();
      generateMs += (typeof performance !== 'undefined' ? performance.now() : 0) - start;
      sets.set(key, set);
    }
    return set;
  }

  function textured(
    key: string,
    set: SurfaceTextureSet,
    tileMetres: number,
    specular: number
  ): PBRMaterial {
    const existing = materials.get(key);
    if (existing) return existing;
    const m = new PBRMaterial(`pool-${key}`, scene);
    m.albedoTexture = set.albedo;
    m.bumpTexture = set.normal;
    m.metallicTexture = set.orm;
    m.useAmbientOcclusionFromMetallicTextureRed = true;
    m.useRoughnessFromMetallicTextureGreen = true;
    m.useMetallnessFromMetallicTextureBlue = true;
    m.useRoughnessFromMetallicTextureAlpha = false;
    // The textures carry the values; these two stay at 1 so the environment's wetness can modulate.
    m.metallic = 1;
    m.roughness = 1;
    m.albedoColor = new Color3(1, 1, 1);
    m.specularIntensity = specular;
    // The mesh's UVs are in METRES, so the tile size lives on the texture: a style with bigger
    // tiles changes one number in the manifest and not one vertex.
    const scale = 1 / Math.max(0.05, tileMetres);
    for (const tex of [set.albedo, set.normal, set.orm]) {
      tex.uScale = scale;
      tex.vScale = scale;
    }
    // Six, matching `paths`, `scenery`, `rides` and `track`: the sun, the sky term, the moon light
    // and up to three of this module's own underwater lamps. A material that runs out of slots
    // drops a lamp (they carry `renderPriority = -1`) and never the sun.
    m.maxSimultaneousLights = 6;
    m.useHorizonOcclusion = true;
    m.useRadianceOcclusion = true;
    m.backFaceCulling = true;
    materials.set(key, m);
    return m;
  }

  const api: PoolMaterials = {
    tile(style) {
      const key = `tile-${style.id}`;
      const existing = materials.get(key);
      if (existing) return existing;
      styles.set(key, style);
      const set = textures(key, () => createSurfaceTextures(scene, tileRecipe(style, seed), size));
      // Glazed ceramic is the glossiest thing in a park: a high specular intensity plus the clear
      // coat is what puts a hard highlight on a wet tile instead of a soft sheen.
      const m = textured(key, set, style.tileMetres, 0.7 + style.glaze * 0.9);
      m.clearCoat.isEnabled = style.glaze > 0.35;
      m.clearCoat.intensity = style.glaze * 0.55;
      m.clearCoat.roughness = 0.08;
      /**
       * The caustic net rides on the tile as emissive.
       *
       * Emissive is right and not a hack: caustics ARE light arriving at the floor, focused by the
       * surface above it, and they do not depend on how rough the tile is. It also means one
       * texture lights the floor, the wall under the waterline and the submerged steps out of one
       * material — and at night the same map is driven by the niche lamps' colour instead of the
       * sun's, which is what stops a lit pool looking like a flat blue hole.
       */
      m.emissiveTexture = caustics;
      m.emissiveColor = new Color3(0, 0, 0);
      const causticScale = 1 / 2.6;
      caustics.uScale = causticScale;
      caustics.vScale = causticScale;
      return m;
    },
    coping(edge) {
      const key = `coping-${edge.id}`;
      const set = textures(key, () =>
        createSurfaceTextures(scene, copingRecipe(edge, seed + 31), Math.round(size * 0.75))
      );
      return textured(key, set, 1.2, 0.45);
    },
    deck(edge) {
      const key = `deck-${edge.id}`;
      const set = textures(key, () =>
        createSurfaceTextures(scene, deckRecipe(edge, seed + 67), Math.round(size * 0.75))
      );
      return textured(key, set, edge.deck === 'timber' ? 2.4 : edge.deck === 'sand' ? 3 : 2.4, 0.4);
    },
    glow(style) {
      const key = `glow-${style.id}`;
      const existing = glows.get(key);
      if (existing) return existing;
      const m = new PBRMaterial(`pool-${key}`, scene);
      // The lens of a submerged lamp is a bright milky disc even when it is off; at night it is the
      // brightest thing in the frame and the bloom threshold is 0.9, so peak emissive is 1.0.
      m.albedoColor = new Color3(0.55, 0.66, 0.72);
      m.metallic = 0;
      m.roughness = 0.28;
      m.emissiveColor = new Color3(style.nightTint[0], style.nightTint[1], style.nightTint[2]);
      m.emissiveIntensity = 0.25;
      m.maxSimultaneousLights = 4;
      m.metadata = { ...(m.metadata ?? {}), envExempt: true };
      glows.set(key, m);
      return m;
    },
    foam() {
      if (foamMaterial) return foamMaterial;
      const m = new PBRMaterial('pool-foam', scene);
      m.albedoColor = new Color3(0.86, 0.94, 0.97);
      m.emissiveColor = new Color3(0.22, 0.3, 0.33);
      m.metallic = 0;
      m.roughness = 0.9;
      m.alpha = 1;
      m.transparencyMode = Material.MATERIAL_ALPHABLEND;
      m.backFaceCulling = false;
      m.disableLighting = false;
      m.maxSimultaneousLights = 4;
      m.metadata = { ...(m.metadata ?? {}), envExempt: true };
      foamMaterial = m;
      return m;
    },
    finish(name) {
      const existing = finishes.get(name);
      if (existing) return existing;
      const s = FINISHES[name];
      const m = new PBRMaterial(`pool-${name}`, scene);
      m.albedoColor = new Color3(1, 1, 1);
      m.metallic = s.metallic;
      m.roughness = s.roughness;
      m.maxSimultaneousLights = 6;
      m.backFaceCulling = name !== 'fabric';
      finishes.set(name, m);
      return m;
    },
    caustics,
    setEnvironment(value, sunUp) {
      night = Math.max(0, Math.min(1, value));
      for (const [key, m] of materials) {
        const style = styles.get(key);
        if (!style) continue;
        // By day the net is the sun's; at night it is whatever this pool's own lamps are. The
        // daylight term is deliberately modest — caustics are a contrast pattern, and pushed past
        // about 0.35 they stop reading as light on tile and start reading as paint.
        // 0.2 rather than the 0.34 the first pass used. Measured on the `close` frame: at 0.34 the
        // net stops reading as light on tile and reads as mottled camouflage painted into it, and
        // it fights the mosaic's own per-chip colour for the same frequency band.
        const day = 0.2 * sunUp * (1 - night * 0.85);
        const lamp = 0.26 * night;
        const tint = style.nightTint;
        m.emissiveColor.set(
          day + tint[0] * lamp,
          day * 1.02 + tint[1] * lamp,
          day * 1.05 + tint[2] * lamp
        );
      }
      for (const m of glows.values()) m.emissiveIntensity = 0.25 + 0.75 * night;
    },
    animate(seconds) {
      // Slower than the surface ripple: a caustic net drifts, it does not race. Two speeds would
      // need two textures; one is honest at this scale and costs one sampler.
      caustics.uOffset = seconds * 0.0125;
      caustics.vOffset = seconds * 0.0085;
    },
    all: () => [
      ...materials.values(),
      ...finishes.values(),
      ...glows.values(),
      ...(foamMaterial ? [foamMaterial] : []),
    ],
    textureMs: () => generateMs,
    size,
    dispose() {
      for (const m of materials.values()) m.dispose();
      for (const m of finishes.values()) m.dispose();
      for (const m of glows.values()) m.dispose();
      foamMaterial?.dispose();
      foamMaterial = null;
      for (const s of sets.values()) s.dispose();
      materials.clear();
      finishes.clear();
      glows.clear();
      styles.clear();
      sets.clear();
      caustics.dispose();
    },
  };

  generateMs += (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
  return api;
}
