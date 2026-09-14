/**
 * Three materials for every shop in the park, plus one emissive per signage colour.
 *
 * `kit` is the atlas: every opaque surface of every building — render, pantile, boards, steel,
 * canvas, chalkboard, paving, brick — comes out of it, which is what makes a whole kiosk **one**
 * draw call rather than seven. `glass` is separate because it has to blend and must not write
 * depth against itself; `emissive` is separate because it owns its own look and has to be exempt
 * from the environment module's wetness and season passes.
 *
 * Sharing is not about draw calls (a thin-instance batch is one call whatever material it uses) —
 * it is about shader variants and texture memory: three materials compile three PBR programs, and
 * a material per shop type would compile twelve and stutter on the first frame each is seen.
 *
 * The metadata flags are ARCHITECTURE §4's and are set deliberately:
 *   `envExempt: true`  on the emissive signage, which animates its own albedo and must not be
 *                      darkened by rain or tinted by October
 *   `kit` and `glass`  are left modulated on purpose: a wet awning should darken, and a shopfront
 *                      in the rain should too.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { ShopAtlas } from './textures';

export interface ShopMaterials {
  kit: PBRMaterial;
  glass: PBRMaterial;
  /** Cached per sRGB hex. A pack's signage colour becomes one of these. */
  emissive(hex: string): PBRMaterial;
  /** 0..1 from `EnvironmentState.night`; the signage fades up with it. */
  setNight(night: number): void;
  all(): Material[];
  dispose(): void;
}

export function createShopMaterials(scene: Scene, atlas: ShopAtlas): ShopMaterials {
  const kit = new PBRMaterial('shops-kit', scene);
  kit.albedoTexture = atlas.albedo;
  kit.bumpTexture = atlas.normal;
  kit.metallicTexture = atlas.orm;
  // The ORM channel contract: R ambient occlusion, G roughness, B metallic. Without these three
  // flags Babylon reads the whole texture as reflectivity and every building comes out chrome.
  kit.useAmbientOcclusionFromMetallicTextureRed = true;
  kit.useRoughnessFromMetallicTextureGreen = true;
  kit.useMetallnessFromMetallicTextureBlue = true;
  kit.albedoColor = new Color3(1, 1, 1);
  kit.metallic = 1;
  kit.roughness = 1;
  kit.backFaceCulling = true;
  kit.transparencyMode = Material.MATERIAL_OPAQUE;
  // Six rather than four: a shop stands under the sun, the sky term and up to three of the night
  // pool's point lights, and a material that runs out of slots drops the sun.
  kit.maxSimultaneousLights = 6;

  /**
   * Shopfront glazing.
   *
   * Alpha 0.22 with a low roughness and a real index of refraction, and `separateCullingPass` so
   * the inside face of a shopfront does not z-fight the outside one. It is dark rather than clear
   * because there is no interior behind it: a fully transparent window on a solid wall reads as a
   * hole, and a park shopfront at midday is mostly reflection anyway.
   */
  const glass = new PBRMaterial('shops-glass', scene);
  glass.albedoColor = new Color3(0.05, 0.07, 0.08);
  glass.metallic = 0;
  glass.roughness = 0.08;
  glass.alpha = 0.34;
  glass.indexOfRefraction = 1.5;
  glass.transparencyMode = Material.MATERIAL_ALPHABLEND;
  glass.backFaceCulling = true;
  glass.separateCullingPass = true;
  glass.maxSimultaneousLights = 6;

  const emissives = new Map<string, PBRMaterial>();
  let night = 0;

  function emissive(hex: string): PBRMaterial {
    const key = hex.toLowerCase();
    const found = emissives.get(key);
    if (found) return found;
    const m = new PBRMaterial(`shops-sign-${key.replace('#', '')}`, scene);
    const c = Color3.FromHexString(hex);
    // The unlit body is a MUTED version of the sign colour, not a dark one. At 0.16 the fascia of
    // every kiosk in the noon frames read as a black band with a pictogram lost in it; 0.45 makes
    // it a painted panel by day and still leaves the emissive to do the work at night, which is the
    // whole point of a lit sign.
    m.albedoColor = c.scale(0.45);
    m.metallic = 0;
    m.roughness = 0.42;
    m.emissiveColor = c;
    m.emissiveIntensity = 0;
    m.transparencyMode = Material.MATERIAL_OPAQUE;
    m.maxSimultaneousLights = 4;
    m.metadata = { envExempt: true };
    emissives.set(key, m);
    m.emissiveIntensity = signIntensity(night);
    return m;
  }

  /**
   * How hard a sign glows.
   *
   * Signage is switched on at dusk, not faded linearly from noon: the curve is flat until `night`
   * passes about 0.25 and then rises fast, which is what a timeclock on a park's signage circuit
   * actually does.
   *
   * Peak 1.0, down from 1.35. The pipeline's bloom threshold is 0.9, and at 1.35 the 22:00 street
   * frame came back with the cream-coloured fascias — the five shops whose packs declare no
   * `night.signage` — as featureless white bars with a halo, while the magenta and teal ones read
   * as signs. A sign that clips is not brighter, it is just white.
   */
  function signIntensity(n: number): number {
    const t = Math.max(0, Math.min(1, (n - 0.18) / 0.42));
    return t * t * (3 - 2 * t) * 1.0;
  }

  return {
    kit,
    glass,
    emissive,
    setNight(value: number) {
      night = value;
      const intensity = signIntensity(value);
      for (const m of emissives.values()) m.emissiveIntensity = intensity;
    },
    all() {
      return [kit, glass, ...emissives.values()];
    },
    dispose() {
      kit.dispose();
      glass.dispose();
      for (const m of emissives.values()) m.dispose();
      emissives.clear();
    },
  };
}
