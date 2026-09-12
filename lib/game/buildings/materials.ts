/**
 * Four materials for every building in the park, plus one emissive per colour.
 *
 * `kit` is the atlas: brick, ashlar, render, timber, slate, clay tile, zinc, copper, shingle,
 * concrete, paving and painted joinery all come out of it, which is what makes a whole ticket hall
 * **one** draw call rather than twelve. `glass` is separate because it has to blend and must not
 * write depth against itself. The emissives are separate because they own their own look after dark
 * and must be exempt from the environment module's wetness and season passes.
 *
 * Sharing is not about draw calls — a thin-instance batch is one call whatever material it uses — it
 * is about shader variants and texture memory: four materials compile four PBR programs, and a
 * material per building type would compile a dozen and stutter the first frame each one is seen.
 *
 * **The emissive is cached per colour and not per building**, the same trick `shops/materials.ts`
 * uses for its signage. A park of brick halls with warm windows and one neon pavilion with a teal
 * fascia is three emissive materials in total.
 *
 * The metadata flags are ARCHITECTURE §4's and are set deliberately:
 *   `envExempt: true`  on the emissives, which animate their own albedo and must not be darkened by
 *                      rain or tinted by October
 *   `kit` and `glass`  are left modulated on purpose: wet brick should darken, and a window in the
 *                      rain should too.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { Constants } from '@babylonjs/core/Engines/constants';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { BuildingAtlas } from './textures';

export interface BuildingMaterials {
  kit: PBRMaterial;
  glass: PBRMaterial;
  /**
   * Cached per sRGB hex and per kind.
   *
   * The kind is what a surface looks like BY DAY, and the two answers are opposite. A window with a
   * light on behind it is a dark window at noon — an amber pane at nine in the morning is a lantern
   * bolted to a wall, which is what the first run of this module photographed on every elevation. A
   * sign face is the other way round: at 0.16 it renders as a black bar across the frontage, which is
   * the correction `shops/materials.ts` records, so it stays a painted panel until dusk lights it.
   */
  emissive(hex: string, kind: 'window' | 'sign'): PBRMaterial;
  /**
   * The additive spill a lit window throws on the wall around it.
   *
   * `StandardMaterial` with `ALPHA_ADD` and lighting off, because additive is the whole trick: at
   * noon `emissiveIntensity` is 0, the material contributes black, and black adds nothing — so the
   * quad is invisible without a second draw path or an alpha test. After dark it adds warm light to
   * the brick, which is the one thing six pooled point lights across the entire game cannot buy.
   */
  halo(hex: string): StandardMaterial;
  /** 0..1 from `EnvironmentState.night`. */
  setNight(night: number): void;
  all(): Material[];
  dispose(): void;
}

export function createBuildingMaterials(scene: Scene, atlas: BuildingAtlas): BuildingMaterials {
  const kit = new PBRMaterial('buildings-kit', scene);
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
  // Six rather than four: a building stands under the sun, the sky term, a moon light and up to two
  // of this module's own spill lights, and a material that runs out of slots drops the sun.
  kit.maxSimultaneousLights = 6;

  /**
   * Window glass by day.
   *
   * Dark, smooth and 0.38 opaque rather than clear, because there is no interior behind it: a fully
   * transparent pane on a solid wall reads as a hole. A real window at midday is mostly reflection
   * anyway, which is what the low roughness and the real index of refraction are for.
   */
  const glass = new PBRMaterial('buildings-glass', scene);
  glass.albedoColor = new Color3(0.05, 0.07, 0.09);
  glass.metallic = 0;
  glass.roughness = 0.12;
  // 0.55 rather than 0.38, now that every opening has an opaque interior behind it: the pane is a
  // reflective surface over a dark room, not a filter over the landscape on the far side.
  glass.alpha = 0.55;
  glass.indexOfRefraction = 1.52;
  glass.transparencyMode = Material.MATERIAL_ALPHABLEND;
  glass.backFaceCulling = true;
  glass.separateCullingPass = true;
  glass.maxSimultaneousLights = 6;

  const emissives = new Map<string, PBRMaterial>();
  const halos = new Map<string, StandardMaterial>();
  let night = 0;

  function halo(hex: string): StandardMaterial {
    const key = hex.toLowerCase();
    const found = halos.get(key);
    if (found) return found;
    const m = new StandardMaterial(`buildings-halo-${key.replace('#', '')}`, scene);
    m.diffuseColor = new Color3(0, 0, 0);
    m.specularColor = new Color3(0, 0, 0);
    m.emissiveColor = Color3.FromHexString(hex);
    /**
     * **No emissive texture here, and that is the fix for a spill that never faded.**
     *
     * `StandardMaterial` composes emissive as `vEmissiveColor` and then, if an emissive texture is
     * bound, `emissiveColor += texture(uv) * level` — an ADD, not the multiply `PBRMaterial` does
     * one screen down in `emissive()`. So with the atlas bound here the ring drew the glow tile at
     * full strength whatever `emissiveColor` said, the dusk curve below moved nothing at all, and
     * every window on the street wore an orange rectangle in the 09:00 frame. The shape does not
     * need a texture in any case: the falloff is in the vertex colour (`addHalo`), which reaches
     * the output through `baseColor.rgb`, so `emissiveColor` alone is both the fade and the tint.
     */
    m.disableLighting = true;
    m.backFaceCulling = true;
    m.alphaMode = Constants.ALPHA_ADD;
    m.transparencyMode = Material.MATERIAL_ALPHABLEND;
    /**
     * `alpha` is a hair under 1 to make Babylon blend at all, and it is NOT the fade.
     *
     * `ALPHA_ADD` is `(ONE, ONE)` — the source is added whatever its alpha says — so dimming this
     * with `alpha` would have done exactly nothing and the spill would have been full strength at
     * noon. What fades is the emissive colour itself.
     */
    m.alpha = 0.999;
    // It is a light, not a surface: no wetness, no season tint, no shadow.
    m.metadata = { envExempt: true, buildingsHalo: hex };
    m.disableDepthWrite = true;
    applyHalo(m, night);
    halos.set(key, m);
    return m;
  }

  function applyHalo(m: StandardMaterial, n: number): void {
    const hex = (m.metadata as { buildingsHalo?: string } | null)?.buildingsHalo ?? '#ffffff';
    m.emissiveColor = Color3.FromHexString(hex).scale(haloAlpha(n));
  }

  /**
   * How much of the spill is on.
   *
   * The same dusk curve the windows use: this is the light bouncing off a wall a metre from a
   * curtained pane, not the pane. The vertex ring already carries the falloff and the lit colour,
   * so this number multiplies a value that peaks at 0.62 on the opening's own edge — 0.72 here is
   * the strength the glow tile used to supply through the emissive texture, now written down where
   * the dusk curve can actually reach it.
   */
  function haloAlpha(n: number): number {
    // From 0.34 rather than 0.16: the window itself may start glowing at dusk, but the mark it
    // leaves on a sunlit wall may not — at 09:00 `night` is still about 0.2 and every window on the
    // terrace wore a faint orange ring in broad daylight. Additive light on a lit wall is visible
    // long before it is plausible.
    const t = Math.max(0, Math.min(1, (n - 0.34) / 0.34));
    return t * t * (3 - 2 * t) * 0.72;
  }

  function emissive(hex: string, kind: 'window' | 'sign' = 'window'): PBRMaterial {
    const key = `${hex.toLowerCase()}|${kind}`;
    const found = emissives.get(key);
    if (found) return found;
    const m = new PBRMaterial(`buildings-lit-${kind}-${hex.replace('#', '')}`, scene);
    const c = Color3.FromHexString(hex);
    /**
     * The emissive TEXTURE is the atlas, and that is the whole point of the glow tile.
     *
     * Babylon's PBR computes `emissive = emissiveColor × texture(emissiveUV)` and never touches the
     * vertex stream, so a lit pane's brightness has to come from its uv. Each pane samples its own
     * patch of slot 12, which runs from about a third of mid grey to a third again — so a wall of
     * lit windows has a wall of different brightnesses out of one material.
     */
    m.emissiveTexture = atlas.albedo;
    m.emissiveColor = c;
    m.emissiveIntensity = 0;
    m.albedoColor = c.scale(kind === 'window' ? 0.2 : 0.45);
    m.albedoTexture = atlas.albedo;
    m.metallic = 0;
    m.roughness = kind === 'window' ? 0.18 : 0.4;
    m.transparencyMode = Material.MATERIAL_OPAQUE;
    m.maxSimultaneousLights = 4;
    m.metadata = { envExempt: true, buildingsLit: kind };
    m.emissiveIntensity = litIntensity(night) * (kind === 'window' ? 1 : 0.82);
    emissives.set(key, m);
    return m;
  }

  /**
   * How hard a lit window burns.
   *
   * Flat until `night` passes about 0.2 and then rising fast, which is what a building does: the
   * lights go on at dusk, not gradually from noon.
   *
   * Peak 0.95, down from 1.15. A window is meant to bloom a little against the pipeline's 0.9
   * threshold, and at 1.15 it did more than a little: the 23:00 close frame came back with every
   * pane a white rectangle inside its own halo, glazing bars and all detail gone. The glow tile
   * still takes individual panes above and below that, which is the variation that makes a night
   * elevation read; blowing all of them out is what removes it.
   */
  function litIntensity(n: number): number {
    const t = Math.max(0, Math.min(1, (n - 0.16) / 0.4));
    return t * t * (3 - 2 * t) * 0.95;
  }

  return {
    kit,
    glass,
    emissive,
    halo,
    setNight(value: number) {
      night = value;
      const intensity = litIntensity(value);
      for (const m of emissives.values()) {
        const kind = (m.metadata as { buildingsLit?: string } | null)?.buildingsLit;
        m.emissiveIntensity = intensity * (kind === 'sign' ? 0.82 : 1);
      }
      for (const m of halos.values()) applyHalo(m, value);
    },
    all() {
      return [kit, glass, ...emissives.values(), ...halos.values()];
    },
    dispose() {
      kit.dispose();
      glass.dispose();
      for (const m of emissives.values()) m.dispose();
      emissives.clear();
      for (const m of halos.values()) m.dispose();
      halos.clear();
    },
  };
}
