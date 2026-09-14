/**
 * The scenery material library: eight shared PBR materials plus one emissive per night-light
 * colour, and every prop in the game is painted out of them.
 *
 * Sharing is not about draw calls — a thin-instance batch is one draw call whatever material it
 * uses — it is about shader variants and texture memory: eight materials compile eight PBR
 * programs, thirty would compile thirty, and the first frame after a build would stutter for each
 * new one. What varies per prop is the **vertex colour**, which multiplies into the albedo after
 * the texture is linearised, so one grey painted-metal surface serves a green bin, a dark blue
 * bench frame and a cream planter without a second texture.
 *
 * Three metadata flags matter here and are set deliberately (see ARCHITECTURE §4):
 *   `foliage: true`   on the leaf and needle materials, so `environment` tints them by season and
 *                     the tint lands on leaves rather than on anything merely called `tree-…`
 *   `envExempt: true` on the emissive night materials and the contact-shadow decal, which own
 *                     their look and must not be darkened by rain or tinted by October
 *   everything else is left modulated on purpose: a wet bench should darken.
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import type { SceneryTextures, TextureSet } from './textures';
import { attachWind, type WindState } from './wind';

export interface MaterialLibrary {
  bark: PBRMaterial;
  leaf: PBRMaterial;
  needle: PBRMaterial;
  /**
   * The leaf texture without the alpha test: the inside of a hedge, the core of a shrub, a blade
   * of grass. Its RGB is mottled green everywhere, including where the mask cuts the leaf cards
   * away, so it reads as dense foliage rather than as a painted green surface — which is what a
   * flat-colour hedge body would have been, and what the art bible calls programmer art.
   */
  foliageSolid: PBRMaterial;
  /**
   * Still water for a fountain basin. The `pools` module owns the real water shader; this is a
   * smooth dark dielectric that reflects the IBL, and it is exempt from the wetness pass because a
   * pool of water does not get wetter in the rain.
   */
  pond: PBRMaterial;
  paint: PBRMaterial;
  metal: PBRMaterial;
  wood: PBRMaterial;
  stone: PBRMaterial;
  fabric: PBRMaterial;
  contact: StandardMaterial;
  /** An unlit-looking emissive for a lamp lens or a neon tube, cached per colour. */
  emissive(hex: string): PBRMaterial;
  /** 0..1 night factor; the emissive materials fade in with it. */
  setNight(night: number): void;
  all(): Material[];
  dispose(): void;
}

export type MaterialName =
  | 'bark'
  | 'leaf'
  | 'needle'
  | 'foliageSolid'
  | 'paint'
  | 'metal'
  | 'wood'
  | 'stone'
  | 'fabric'
  | 'pond';

function pbr(scene: Scene, name: string, set: TextureSet, uvScale: number): PBRMaterial {
  const m = new PBRMaterial(name, scene);
  m.albedoTexture = set.albedo;
  m.bumpTexture = set.normal;
  m.metallicTexture = set.orm;
  // The ORM channel contract: R ambient occlusion, G roughness, B metallic. Without these three
  // flags Babylon reads the whole texture as reflectivity and every prop comes out chrome.
  m.useAmbientOcclusionFromMetallicTextureRed = true;
  m.useRoughnessFromMetallicTextureGreen = true;
  m.useMetallnessFromMetallicTextureBlue = true;
  m.albedoColor = new Color3(1, 1, 1);
  m.metallic = 1;
  m.roughness = 1;
  m.backFaceCulling = true;
  m.transparencyMode = Material.MATERIAL_OPAQUE;
  // UVs are authored in metres, so one number decides the texel density of every prop using it.
  // Set on the `RawTexture` rather than through `material.albedoTexture`, which is typed as the
  // base class and has no UV transform.
  set.albedo.uScale = uvScale;
  set.albedo.vScale = uvScale;
  set.normal.uScale = uvScale;
  set.normal.vScale = uvScale;
  set.orm.uScale = uvScale;
  set.orm.vScale = uvScale;
  m.maxSimultaneousLights = 6;
  return m;
}

function alphaTested(m: PBRMaterial, cutOff: number): PBRMaterial {
  m.useAlphaFromAlbedoTexture = true;
  m.transparencyMode = Material.MATERIAL_ALPHATEST;
  m.alphaCutOff = cutOff;
  // A leaf card is seen from both sides; the alternative is twice the geometry (see `addCard`).
  m.backFaceCulling = false;
  m.twoSidedLighting = true;
  return m;
}

export function createMaterials(
  scene: Scene,
  textures: SceneryTextures,
  wind: WindState,
  options: { webgl: boolean }
): MaterialLibrary {
  const bark = pbr(scene, 'scenery-bark', textures.bark, 1);
  bark.metadata = { foliage: false };

  const leaf = alphaTested(pbr(scene, 'scenery-leaf', textures.leaf, 1), 0.42);
  leaf.metadata = { foliage: true };
  // A leaf is thin: light gets through it, and a canopy with no transmission reads as a solid
  // shell with a hole punched in it. Babylon's subsurface translucency is the honest version of
  // that and costs one define on a material already paying for alpha test.
  leaf.subSurface.isTranslucencyEnabled = true;
  leaf.subSurface.translucencyIntensity = 0.55;
  leaf.subSurface.tintColor = new Color3(0.42, 0.62, 0.24);

  const needle = alphaTested(pbr(scene, 'scenery-needle', textures.needle, 1), 0.42);
  needle.metadata = { foliage: true };
  needle.subSurface.isTranslucencyEnabled = true;
  needle.subSurface.translucencyIntensity = 0.3;
  needle.subSurface.tintColor = new Color3(0.3, 0.46, 0.26);

  // 4 tiles per UV metre: the geometry is UV'd in metres, so this is a 25 cm leaf mottle.
  const foliageSolid = pbr(scene, 'scenery-foliage-solid', textures.moss, 4);
  foliageSolid.metadata = { foliage: true };
  foliageSolid.backFaceCulling = false;
  foliageSolid.twoSidedLighting = true;

  const pond = new PBRMaterial('scenery-pond', scene);
  pond.albedoColor = new Color3(0.03, 0.09, 0.11);
  pond.metallic = 0;
  pond.roughness = 0.06;
  pond.metadata = { envExempt: true };
  pond.backFaceCulling = true;

  const paint = pbr(scene, 'scenery-paint', textures.paint, 1);
  const metal = pbr(scene, 'scenery-metal', textures.metal, 1);
  const wood = pbr(scene, 'scenery-wood', textures.wood, 1);
  const stone = pbr(scene, 'scenery-stone', textures.stone, 1);
  const fabric = pbr(scene, 'scenery-fabric', textures.fabric, 1);
  fabric.backFaceCulling = false;
  fabric.twoSidedLighting = true;

  // Wind: the two canopy materials sway hard from the tips, the shrub/grass share `leaf` and are
  // covered by the same plugin. Stiffness above 1 keeps the movement out at the ends.
  attachWind(leaf, wind, { scale: 1, stiffness: 1.35, webgl: options.webgl });
  attachWind(needle, wind, { scale: 0.72, stiffness: 1.6, webgl: options.webgl });
  attachWind(bark, wind, { scale: 0.5, stiffness: 2.2, webgl: options.webgl });
  attachWind(fabric, wind, { scale: 1.35, stiffness: 1, webgl: options.webgl });
  // Grass and shrub cores bend from the base, so the exponent goes below 1.
  attachWind(foliageSolid, wind, { scale: 0.9, stiffness: 0.85, webgl: options.webgl });

  /**
   * The contact shadow: a disc multiplied over the ground under every prop.
   *
   * `disableLighting` on a `StandardMaterial` leaves the diffuse base at zero, so a texture in the
   * DIFFUSE slot renders pure black — the map goes in `emissiveTexture`, which is the slot that
   * survives it. `ALPHA_MULTIPLY` then makes the white rim a no-op and the dark centre an
   * occlusion, which is why the texture is greyscale rather than an alpha mask.
   */
  const contact = new StandardMaterial('scenery-contact', scene);
  contact.disableLighting = true;
  contact.emissiveTexture = textures.contact;
  contact.diffuseColor = new Color3(0, 0, 0);
  contact.specularColor = new Color3(0, 0, 0);
  contact.alphaMode = Constants.ALPHA_MULTIPLY;
  contact.alpha = 0.999;
  contact.disableDepthWrite = true;
  contact.backFaceCulling = true;
  contact.metadata = { envExempt: true };
  contact.separateCullingPass = false;

  const emissives = new Map<string, PBRMaterial>();
  let night = 0;

  function emissive(hex: string): PBRMaterial {
    const existing = emissives.get(hex);
    if (existing) return existing;
    const m = new PBRMaterial(`scenery-emissive-${hex.replace('#', '')}`, scene);
    const colour = Color3.FromHexString(hex);
    m.albedoColor = colour.scale(0.12);
    m.metallic = 0;
    m.roughness = 0.25;
    m.emissiveColor = colour;
    m.metadata = { envExempt: true };
    m.maxSimultaneousLights = 4;
    m.backFaceCulling = true;
    emissives.set(hex, m);
    applyNight(m, night);
    return m;
  }

  function applyNight(m: PBRMaterial, value: number): void {
    // Lamps do not switch on at 00:00; they come up over dusk. The floor keeps a lens reading as
    // glass in daylight rather than as a dead grey disc.
    m.emissiveIntensity = 0.06 + value * 0.95;
  }

  const library: MaterialLibrary = {
    bark,
    leaf,
    needle,
    foliageSolid,
    pond,
    paint,
    metal,
    wood,
    stone,
    fabric,
    contact,
    emissive,
    setNight(value) {
      night = value;
      for (const m of emissives.values()) applyNight(m, value);
    },
    all: () => [
      bark,
      leaf,
      needle,
      foliageSolid,
      pond,
      paint,
      metal,
      wood,
      stone,
      fabric,
      contact,
      ...emissives.values(),
    ],
    dispose() {
      for (const m of library.all()) m.dispose();
      emissives.clear();
    },
  };
  return library;
}
