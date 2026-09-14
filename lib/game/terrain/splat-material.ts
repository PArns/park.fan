/**
 * The ground material: a stock `PBRMaterial` with a splat blend injected into its fragment shader.
 *
 * Why a plugin and not a `ShaderMaterial`: the terrain has to receive the cascaded shadows, the
 * ACES tone mapping, the height fog and the IBL that `core/renderer.ts` already sets up. A
 * hand-written shader would re-implement all of it and drift from core the first time core changes.
 * `MaterialPluginBase` injects at `CUSTOM_FRAGMENT_DEFINITIONS` and `CUSTOM_FRAGMENT_BEFORE_LIGHTS`
 * — the second sits after `pbrBlockNormalFinal` (so `normalW` is final and can be overwritten) and
 * after `surfaceAlbedo` is assembled, which is exactly the two things a splat has to say.
 *
 * The one thing there is no injection point for is roughness: it is computed inside
 * `reflectivityBlock`, which is called with no marker before it. So the roughness goes in through
 * the plugin manager's regex form (`"!<pattern>"` as the point name), rewriting the first argument
 * of that one call. A regex that stops matching after a Babylon upgrade injects nothing and the
 * terrain falls back to the material's uniform roughness — it does not produce a broken shader,
 * which is why this is an acceptable seam and a hand-edited copy of `pbr.fragment` would not be.
 *
 * WebGPU: the plugin declares itself GLSL-only and `createGroundMaterial` does not attach it on a
 * WebGPU engine — the WGSL PBR shader binds samplers through a different convention and shipping an
 * unverifiable second copy of this shader is worse than the documented fallback (see `main.ts`).
 */

import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';
import { Material } from '@babylonjs/core/Materials/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import type { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import type { Scene } from '@babylonjs/core/scene';
import type { TerrainData } from '../core/types';
import { CLIFF_SLOPE_FULL, CLIFF_SLOPE_START, LAYER_ROCK } from './heightfield';
import {
  CLIFF_TILE_METRES,
  MACRO_TILE_METRES,
  SPLAT_TILE_METRES,
  type TerrainTextureSet,
} from './textures';

/** Metres the second macro sample tiles over — the one that breaks painted boundaries. */
const MACRO_FINE_METRES = 11;
/**
 * Metres the third sample tiles over. Three scales, because two left a hole: the layer tile is
 * 3.2 m and the coarse macro is 190 m, and everything between read as one flat colour with a
 * texture on it. 44 m is the scale a hillside's dry and damp patches actually vary at.
 */
const MACRO_MID_METRES = 44;

const DEFINITIONS = `
uniform sampler2D terrainSplatSampler;
uniform sampler2D terrainMacroSampler;
uniform highp sampler2DArray terrainAlbedoSampler;
uniform highp sampler2DArray terrainSurfaceSampler;
float terrainRoughness = 0.85;
`;

/**
 * `vTerrainInfo`  = (worldSize, splatResolution, cliffStart, cliffFull)
 * `vTerrainInfo2` = (1/splatTile, 1/cliffTile, 1/macroTile, rockLayerIndex)
 * `vTerrainInfo3` = (normalStrength, macroStrength, wetness, 1/macroFineTile)
 * `vTerrainInfo4` = (1/macroMidTile, 0, 0, 0)
 */
const BEFORE_LIGHTS = `
vec2 tWorld = vPositionW.xz;
float tSize = vTerrainInfo.x;
float tRes = vTerrainInfo.y;
vec4 tMacro = texture2D(terrainMacroSampler, tWorld * vTerrainInfo2.z);
vec4 tMacroFine = texture2D(terrainMacroSampler, tWorld * vTerrainInfo3.w);
vec4 tMacroMid = texture2D(terrainMacroSampler, tWorld * vTerrainInfo4.x);

vec2 tTexel = ((tWorld + tSize * 0.5) / tSize) * tRes - 0.5;
vec2 tCell = floor(tTexel);
// The jitter breaks a painted boundary into a natural edge; at 0.85 of a cell (1.7 m here) it
// broke a 6 m trail into dashes instead, so it is under half a cell.
vec2 tF = clamp(tTexel - tCell + (vec2(tMacroFine.b, tMacroFine.g) - 0.5) * 0.42, 0.0, 1.0);
tF = tF * tF * (3.0 - 2.0 * tF);
vec2 tInv = vec2(1.0 / tRes);
float tL00 = floor(texture2D(terrainSplatSampler, (tCell + vec2(0.5, 0.5)) * tInv).r * 255.0 + 0.5);
float tL10 = floor(texture2D(terrainSplatSampler, (tCell + vec2(1.5, 0.5)) * tInv).r * 255.0 + 0.5);
float tL01 = floor(texture2D(terrainSplatSampler, (tCell + vec2(0.5, 1.5)) * tInv).r * 255.0 + 0.5);
float tL11 = floor(texture2D(terrainSplatSampler, (tCell + vec2(1.5, 1.5)) * tInv).r * 255.0 + 0.5);
float tW00 = (1.0 - tF.x) * (1.0 - tF.y);
float tW10 = tF.x * (1.0 - tF.y);
float tW01 = (1.0 - tF.x) * tF.y;
float tW11 = tF.x * tF.y;

vec2 tUV = tWorld * vTerrainInfo2.x;
vec4 tAlbedo =
  texture(terrainAlbedoSampler, vec3(tUV, tL00)) * tW00 +
  texture(terrainAlbedoSampler, vec3(tUV, tL10)) * tW10 +
  texture(terrainAlbedoSampler, vec3(tUV, tL01)) * tW01 +
  texture(terrainAlbedoSampler, vec3(tUV, tL11)) * tW11;
vec4 tSurface =
  texture(terrainSurfaceSampler, vec3(tUV, tL00)) * tW00 +
  texture(terrainSurfaceSampler, vec3(tUV, tL10)) * tW10 +
  texture(terrainSurfaceSampler, vec3(tUV, tL01)) * tW01 +
  texture(terrainSurfaceSampler, vec3(tUV, tL11)) * tW11;

vec3 tGeoN = normalize(normalW);
float tSlope = 1.0 - clamp(tGeoN.y, 0.0, 1.0);
float tCliff = smoothstep(vTerrainInfo.z, vTerrainInfo.w, tSlope);
if (tCliff > 0.003) {
  vec3 tAxis = abs(tGeoN);
  vec3 tBlend = tAxis / max(tAxis.x + tAxis.y + tAxis.z, 1e-4);
  float tRock = vTerrainInfo2.w;
  float tScale = vTerrainInfo2.y;
  vec4 tRockA =
    texture(terrainAlbedoSampler, vec3(vPositionW.zy * tScale, tRock)) * tBlend.x +
    texture(terrainAlbedoSampler, vec3(vPositionW.xz * tScale, tRock)) * tBlend.y +
    texture(terrainAlbedoSampler, vec3(vPositionW.xy * tScale, tRock)) * tBlend.z;
  vec4 tRockS =
    texture(terrainSurfaceSampler, vec3(vPositionW.zy * tScale, tRock)) * tBlend.x +
    texture(terrainSurfaceSampler, vec3(vPositionW.xz * tScale, tRock)) * tBlend.y +
    texture(terrainSurfaceSampler, vec3(vPositionW.xy * tScale, tRock)) * tBlend.z;
  tAlbedo = mix(tAlbedo, tRockA, tCliff);
  tSurface = mix(tSurface, tRockS, tCliff);
}

vec3 tColor = pow(tAlbedo.rgb, vec3(2.2));
float tBright = mix(1.0, 0.78 + 0.44 * tMacro.r, vTerrainInfo3.y);
float tMidVar = mix(1.0, 0.80 + 0.40 * tMacroMid.g, vTerrainInfo3.y);
float tFine = mix(1.0, 0.88 + 0.24 * tMacroFine.r, vTerrainInfo3.y);
vec3 tTint = mix(vec3(1.05, 0.99, 0.88), vec3(0.91, 1.02, 1.02), tMacroMid.r);
float tAo = mix(1.0, tSurface.b, 0.65);
tColor *= tBright * tMidVar * tFine * tAo;
tColor *= mix(vec3(1.0), tTint, vTerrainInfo3.y);
tColor *= mix(1.0, 0.58, vTerrainInfo3.z);
surfaceAlbedo = tColor;

vec2 tN2 = (tSurface.rg * 2.0 - 1.0) * vTerrainInfo3.x;
vec3 tTangentN = normalize(vec3(tN2, 1.0));
vec3 tT = normalize(vec3(1.0, 0.0, 0.0) - tGeoN * tGeoN.x);
vec3 tB = cross(tT, tGeoN);
normalW = normalize(tT * tTangentN.x + tB * tTangentN.y + tGeoN * tTangentN.z);

terrainRoughness = clamp(mix(tSurface.a, 0.12, vTerrainInfo3.z * 0.8), 0.06, 1.0);
`;

/**
 * The regex point name. It matches the single call site of `reflectivityBlock` in `pbr.fragment`
 * and replaces the first argument with one carrying our per-pixel roughness in `.g`, which is where
 * `pbrBlockReflectivity` reads it in the metallic workflow (`metallicRoughness = rgb.rg`).
 */
const ROUGHNESS_POINT = '!reflectivityOut\\s*=\\s*reflectivityBlock\\(\\s*vReflectivityColor';
const ROUGHNESS_CODE =
  'reflectivityOut=reflectivityBlock(vec4(vReflectivityColor.r, terrainRoughness, vReflectivityColor.ba)';

class TerrainSplatPlugin extends MaterialPluginBase {
  splat: RawTexture | null;
  textures: TerrainTextureSet | null;
  worldSize: number;
  splatResolution: number;
  normalStrength: number;
  macroStrength: number;
  wetness: number;

  constructor(material: PBRMaterial) {
    super(material, 'TerrainSplat', 220, { TERRAIN_SPLAT: true }, true, true);
    this.splat = null;
    this.textures = null;
    this.worldSize = 512;
    this.splatResolution = 256;
    this.normalStrength = 1;
    this.macroStrength = 1;
    this.wetness = 0;
  }

  getClassName(): string {
    return 'TerrainSplatPlugin';
  }

  isCompatible(shaderLanguage: ShaderLanguage): boolean {
    return shaderLanguage === ShaderLanguage.GLSL;
  }

  isReadyForSubMesh(): boolean {
    if (!this.splat || !this.textures) return false;
    return (
      this.splat.isReady() &&
      this.textures.albedo.isReady() &&
      this.textures.surface.isReady() &&
      this.textures.macro.isReady()
    );
  }

  getSamplers(samplers: string[]): void {
    samplers.push(
      'terrainSplatSampler',
      'terrainMacroSampler',
      'terrainAlbedoSampler',
      'terrainSurfaceSampler'
    );
  }

  getUniforms(): { ubo: Array<{ name: string; size: number; type: string }> } {
    return {
      ubo: [
        { name: 'vTerrainInfo', size: 4, type: 'vec4' },
        { name: 'vTerrainInfo2', size: 4, type: 'vec4' },
        { name: 'vTerrainInfo3', size: 4, type: 'vec4' },
        { name: 'vTerrainInfo4', size: 4, type: 'vec4' },
      ],
    };
  }

  bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, _engine: AbstractEngine): void {
    const set = this.textures;
    if (!set || !this.splat) return;
    uniformBuffer.updateFloat4(
      'vTerrainInfo',
      this.worldSize,
      this.splatResolution,
      CLIFF_SLOPE_START,
      CLIFF_SLOPE_FULL
    );
    uniformBuffer.updateFloat4(
      'vTerrainInfo2',
      1 / SPLAT_TILE_METRES,
      1 / CLIFF_TILE_METRES,
      1 / MACRO_TILE_METRES,
      LAYER_ROCK
    );
    uniformBuffer.updateFloat4(
      'vTerrainInfo3',
      this.normalStrength,
      this.macroStrength,
      this.wetness,
      1 / MACRO_FINE_METRES
    );
    uniformBuffer.updateFloat4('vTerrainInfo4', 1 / MACRO_MID_METRES, 0, 0, 0);
    if (scene.texturesEnabled) {
      uniformBuffer.setTexture('terrainSplatSampler', this.splat);
      uniformBuffer.setTexture('terrainMacroSampler', set.macro);
      uniformBuffer.setTexture('terrainAlbedoSampler', set.albedo);
      uniformBuffer.setTexture('terrainSurfaceSampler', set.surface);
    }
  }

  hasTexture(texture: BaseTexture): boolean {
    const set = this.textures;
    if (!set) return this.splat === texture;
    return (
      this.splat === texture ||
      set.albedo === texture ||
      set.surface === texture ||
      set.macro === texture
    );
  }

  getActiveTextures(activeTextures: BaseTexture[]): void {
    if (this.splat) activeTextures.push(this.splat);
    if (this.textures) {
      activeTextures.push(this.textures.albedo, this.textures.surface, this.textures.macro);
    }
  }

  getCustomCode(shaderType: string): { [pointName: string]: string } | null {
    if (shaderType !== 'fragment') return null;
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: DEFINITIONS,
      CUSTOM_FRAGMENT_BEFORE_LIGHTS: BEFORE_LIGHTS,
      [ROUGHNESS_POINT]: ROUGHNESS_CODE,
    };
  }
}

export interface GroundMaterial {
  material: PBRMaterial;
  /** Null on WebGPU, where the material falls back to a plain tiled albedo (see `main.ts`). */
  plugin: TerrainSplatPlugin | null;
  splat: RawTexture;
  /** Re-upload the paint layer. The whole map is 64 KB at the default resolution, so a partial
   *  upload would cost more bookkeeping than it saves. */
  uploadPaint(terrain: TerrainData): void;
  setWetness(wetness: number): void;
  dispose(): void;
}

export function createGroundMaterial(
  scene: Scene,
  terrain: TerrainData,
  textures: TerrainTextureSet,
  options: { splatEnabled: boolean }
): GroundMaterial {
  const splat = new RawTexture(
    terrain.paint,
    terrain.resolution,
    terrain.resolution,
    Constants.TEXTUREFORMAT_R,
    scene,
    false,
    false,
    Texture.NEAREST_SAMPLINGMODE
  );
  splat.wrapU = Texture.CLAMP_ADDRESSMODE;
  splat.wrapV = Texture.CLAMP_ADDRESSMODE;

  const material = new PBRMaterial('terrain-ground', scene);
  material.metallic = 0;
  material.roughness = 0.86;
  // The sun is the only strong specular source on open ground, and Fresnel takes reflectance to 1
  // at grazing angles: at full strength a low sun laid a wet sheet of highlight across the whole
  // meadow — measured at 16:00, where the glare covered about a third of the frame.
  material.specularIntensity = 0.28;
  material.albedoColor = new Color3(1, 1, 1);
  material.backFaceCulling = true;
  material.transparencyMode = Material.MATERIAL_OPAQUE;

  let plugin: TerrainSplatPlugin | null = null;
  if (options.splatEnabled) {
    plugin = new TerrainSplatPlugin(material);
    plugin.splat = splat;
    plugin.textures = textures;
    plugin.worldSize = terrain.size;
    plugin.splatResolution = terrain.resolution;
    material.markAsDirty(Material.AllDirtyFlag);
  } else {
    // WebGPU / no-splat path: still a real PBR surface, just one layer of it. The macro map does
    // the large-scale variation the splat would otherwise carry.
    material.albedoTexture = textures.macro;
    material.albedoColor = new Color3(0.42, 0.5, 0.3);
    material.bumpTexture = textures.macro;
    material.useParallax = false;
  }

  return {
    material,
    plugin,
    splat,
    uploadPaint(t: TerrainData) {
      splat.update(t.paint);
    },
    setWetness(wetness: number) {
      if (plugin) plugin.wetness = wetness;
    },
    dispose() {
      material.dispose();
      splat.dispose();
    },
  };
}
