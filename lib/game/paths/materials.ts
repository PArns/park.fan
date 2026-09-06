/**
 * One PBR material per material recipe, built on first use.
 *
 * Per RECIPE and not per style, because the tile size is a property of the texture and two styles
 * that share `concrete-slab` want the same concrete at the same scale — the promenade and the
 * queue line do exactly that. Sharing also means the mesh builder can group its geometry by
 * material and a park with five styles still draws in a handful of calls.
 *
 * Nothing here sets `metadata.envExempt`: a path is meant to darken and go glossy in the rain, and
 * the `environment` module's wet pass multiplies `albedoColor` and `roughness`, which are the two
 * scalars a texture-driven PBR material leaves at 1 for exactly that purpose.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import { pathMaterial } from './manifest';
import { createPathTextures, type PathTextureSet } from './textures';

export interface PathMaterials {
  get(recipeId: string): PBRMaterial;
  /** Every material built so far, for the shadow/receiver wiring. */
  all(): PBRMaterial[];
  textureMs(): number;
  size: number;
  dispose(): void;
}

export function createPathMaterials(scene: Scene, size: number): PathMaterials {
  const textures = new Map<string, PathTextureSet>();
  const materials = new Map<string, PBRMaterial>();
  let generateMs = 0;

  const get = (recipeId: string): PBRMaterial => {
    const existing = materials.get(recipeId);
    if (existing) return existing;
    const recipe = pathMaterial(recipeId);
    let set = textures.get(recipe.id);
    if (!set) {
      // `detail` is the recipe's own say in how much of the budget it deserves; never below 128,
      // where the joint pattern stops resolving at all.
      const want = Math.max(128, Math.round(size * (recipe.detail ?? 1)));
      set = createPathTextures(scene, recipe, want);
      generateMs += set.generateMs;
      textures.set(recipe.id, set);
    }
    const material = new PBRMaterial(`path-${recipe.id}`, scene);
    material.albedoTexture = set.albedo;
    material.bumpTexture = set.normal;
    material.metallicTexture = set.orm;
    material.useAmbientOcclusionFromMetallicTextureRed = true;
    material.useRoughnessFromMetallicTextureGreen = true;
    material.useMetallnessFromMetallicTextureBlue = true;
    material.useRoughnessFromMetallicTextureAlpha = false;
    // The textures carry the values; these two stay at 1 so they are free for the environment
    // module's wetness to modulate.
    material.metallic = 1;
    material.roughness = 1;
    material.albedoColor = new Color3(1, 1, 1);
    // The mesh's uvs are in METRES, so the tile size lives on the texture rather than in the
    // geometry: a style that wants bigger slabs changes one number in the manifest and no vertex.
    const scale = 1 / recipe.tileMetres;
    for (const tex of [set.albedo, set.normal, set.orm]) {
      tex.uScale = scale;
      tex.vScale = scale;
    }
    material.specularIntensity = recipe.metallic > 0.5 ? 1 : 0.32;
    /**
     * Six lights, not Babylon's default four, and the reason is measured.
     *
     * A path is the largest surface a visitor looks at and it is the one every lamp stands ON, so
     * it was the one surface in the game that lamps did not light. `mesh.lightSources` is sorted
     * by `renderPriority`, and a PBR material takes the first `maxSimultaneousLights` of it: with
     * four slots the list came out `[sun, sky, env-moon-light, lamp-0]` and exactly ONE of the
     * park's seventy-two lamps reached the paving. Worse, that number stayed at one across
     * `medium`, `high` AND `ultra`, where the night rig's pool holds two, four and six lamps — so
     * the disparity got wider the more the machine could afford. And two of the four slots went to
     * `sun` and `env-moon-light` at `intensity 0.000` at 22:00: half the light budget of the
     * biggest surface in the frame, spent on lights that are switched off.
     *
     * Six matches what `scenery` and `track` already set, so a lamp now lights the path, the bench
     * beside it and the hedge behind it as one scene. It costs no draw call and no triangle — a
     * shader permutation with two more light loops — which is why it is six and not four with the
     * moon excluded per material.
     */
    material.maxSimultaneousLights = 6;
    // A paved surface at a grazing angle is where a PBR material either reads as stone or as
    // plastic; the horizon occlusion and the smoothness-based reflectance keep the far half of a
    // promenade from turning into a white sheet under a low sun.
    material.useHorizonOcclusion = true;
    material.useRadianceOcclusion = true;
    material.bumpTexture.level = 1;
    material.backFaceCulling = true;
    materials.set(recipeId, material);
    return material;
  };

  return {
    get,
    all: () => [...materials.values()],
    textureMs: () => generateMs,
    size,
    dispose() {
      for (const m of materials.values()) m.dispose();
      for (const t of textures.values()) t.dispose();
      materials.clear();
      textures.clear();
    },
  };
}
