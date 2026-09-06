/**
 * One PBR material per surface, plus one tinted copy of the painted steel per track colour.
 *
 * The textures are shared and only the `albedoColor` differs between a red coaster and a blue one:
 * the paint map carries the orange peel, the chips and the dirt in near-white, and the tint
 * multiplies into it. That keeps four texture sets in memory however many coasters a park has, and
 * it keeps the shader-variant count down — a park with eight coasters compiles four PBR programs,
 * not thirty-two.
 *
 * Nothing here sets `metadata.envExempt`. A coaster SHOULD go dark and glossy in the rain, and
 * that is exactly what the `environment` module's wet pass does to `albedoColor` and `roughness` —
 * which are the two scalars a texture-driven PBR material leaves free for it (ARCHITECTURE §4).
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import { createTrackTextures, type SurfaceKind, type TrackTextures } from './textures';

export interface TrackMaterials {
  /** Bare running rail: metallic, scuffed, unpainted. */
  rail(): PBRMaterial;
  /** Painted structural steel in a track style's own colour. */
  paint(hex: string): PBRMaterial;
  timber(): PBRMaterial;
  concrete(): PBRMaterial;
  all(): Material[];
  textureMs: number;
  textureSize: number;
  dispose(): void;
}

/** UV scale per surface, in tiles per metre of geometry. The UVs are authored in metres. */
const TILING: Record<SurfaceKind, number> = {
  // A rail's section is ~40 cm around and the map holds one board of grain, so it repeats often
  // along the rail and once across it.
  rail: 1.6,
  paint: 0.8,
  timber: 0.55,
  concrete: 0.9,
};

function base(scene: Scene, name: string, textures: TrackTextures, kind: SurfaceKind): PBRMaterial {
  const set = textures.get(kind);
  const material = new PBRMaterial(name, scene);
  material.albedoTexture = set.albedo;
  material.bumpTexture = set.normal;
  material.metallicTexture = set.orm;
  // The ORM channel contract: R occlusion, G roughness, B metallic. Without these three flags
  // Babylon reads the whole texture as reflectivity and every part comes out chrome.
  material.useAmbientOcclusionFromMetallicTextureRed = true;
  material.useRoughnessFromMetallicTextureGreen = true;
  material.useMetallnessFromMetallicTextureBlue = true;
  material.useRoughnessFromMetallicTextureAlpha = false;
  material.metallic = 1;
  material.roughness = 1;
  material.albedoColor = new Color3(1, 1, 1);
  material.backFaceCulling = true;
  material.maxSimultaneousLights = 6;
  // Steel at a grazing angle is where a PBR material either reads as metal or as plastic; these
  // two keep the far half of a straight from turning into a white sheet under a low sun.
  material.useHorizonOcclusion = true;
  material.useRadianceOcclusion = true;
  const scale = TILING[kind];
  for (const tex of [set.albedo, set.normal, set.orm]) {
    tex.uScale = scale;
    tex.vScale = scale;
  }
  return material;
}

export function createTrackMaterials(scene: Scene, seed: number, size: number): TrackMaterials {
  const textures = createTrackTextures(scene, seed, size);
  const cache = new Map<string, PBRMaterial>();

  const shared = (key: string, kind: SurfaceKind, tune?: (m: PBRMaterial) => void): PBRMaterial => {
    const existing = cache.get(key);
    if (existing) return existing;
    const material = base(scene, `track-${key}`, textures, kind);
    tune?.(material);
    cache.set(key, material);
    return material;
  };

  return {
    rail: () =>
      shared('rail', 'rail', (m) => {
        // A clear-coated running rail: the reflection is what says "steel", so it gets a little
        // help from the environment above what the ORM asks for.
        m.environmentIntensity = 1.15;
      }),
    paint: (hex: string) =>
      shared(`paint-${hex.replace('#', '')}`, 'paint', (m) => {
        const colour = Color3.FromHexString(hex);
        // Straight into linear: the texture is already sRGB-encoded and Babylon multiplies the
        // colour in after decoding it.
        m.albedoColor = colour.toLinearSpace();
      }),
    timber: () => shared('timber', 'timber'),
    concrete: () => shared('concrete', 'concrete'),
    all: () => [...cache.values()],
    textureMs: textures.generateMs,
    textureSize: textures.size,
    dispose() {
      for (const material of cache.values()) material.dispose();
      cache.clear();
      textures.dispose();
    },
  };
}
