/**
 * Wind sway, as a vertex-shader plugin on the foliage materials.
 *
 * It has to be a shader: a canopy is tens of thousands of thin instances and moving them on the
 * CPU would mean rewriting every matrix buffer every frame, which is the one thing the whole
 * batching design exists to avoid. The displacement is applied in world space at
 * `CUSTOM_VERTEX_UPDATE_WORLDPOS`, after `finalWorld` has been applied, which is what makes the
 * phase depend on where a tree stands — two oaks four metres apart lean out of step for free,
 * with no per-instance data at all.
 *
 * The weight comes from a custom `swayWeight` vertex attribute the generators write: 0 at the
 * root plate of a trunk, ~0.3 at the first fork, 1 at the outer leaf cards. Without it the whole
 * tree would slide sideways, trunk included, which reads as an earthquake rather than as weather.
 *
 * GLSL only. Babylon's WGSL PBR binds its samplers and attributes through a different convention,
 * and shipping an unverifiable second copy of a shader is worse than a documented fallback — on
 * WebGPU the plugin is simply not attached and the foliage stands still (`isCompatible`, and the
 * guard in `attachWind`). The same call the terrain module makes for the same reason.
 */

import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';
import { Material } from '@babylonjs/core/Materials/material';
import type { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import type { Scene } from '@babylonjs/core/scene';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

/** Shared by every wind plugin instance; `main.ts` advances it once per frame. */
export interface WindState {
  /** Seconds, wrapped so a long session cannot lose float precision in the sine. */
  time: number;
  /** Metres of travel at weight 1. */
  amplitude: number;
  /** Unit wind direction in the XZ plane. */
  dirX: number;
  dirZ: number;
  /** 0..1 extra flutter — a gust, a storm. */
  gust: number;
}

export function createWindState(): WindState {
  return { time: 0, amplitude: 0.14, dirX: 0.82, dirZ: 0.57, gust: 0.2 };
}

/**
 * Advance the wind.
 *
 * `windMs` is the environment's metres per second. The amplitude curve is deliberately shallow at
 * the top: a 20 m/s storm does not move a branch tip 140 times as far as a 0.14 m/s breeze, it
 * moves it about four times as far and much more raggedly, which is what `gust` carries.
 */
export function updateWind(state: WindState, dtSeconds: number, windMs: number): void {
  const speed = Math.max(0, windMs);
  state.amplitude = 0.05 + Math.min(0.62, Math.sqrt(speed) * 0.13);
  state.gust = Math.min(1, speed / 16);
  // The sway frequency rises with the wind too, and the time base is what carries it, so the
  // advance is scaled rather than the phase multiplied — multiplying the phase would make the
  // whole canopy jump every time the weather changed.
  state.time = (state.time + dtSeconds * (0.55 + speed * 0.075)) % 10000;
}

const DEFINITIONS = `
attribute float swayWeight;
`;

/**
 * `vWindParams` = (time, amplitude, dirX, dirZ), `vWindParams2` = (gust, stiffness, 0, 0).
 *
 * Two frequencies plus a high-frequency flutter scaled by the weight squared: the trunk barely
 * moves, the branch leans, the leaf cluster at the tip shivers. The small downward term is what
 * keeps a branch's tip on its arc instead of stretching the branch as it swings.
 */
const UPDATE_WORLDPOS = `
#ifdef SCENERY_WIND
if (swayWeight > 0.001) {
  float wTime = vWindParams.x;
  float wAmp = vWindParams.y * pow(swayWeight, vWindParams2.y);
  vec2 wDir = vWindParams.zw;
  float wPhase = dot(worldPos.xz, vec2(0.041, 0.033)) + wTime;
  float wave = sin(wPhase) * 0.62 + sin(wPhase * 2.17 + 1.3) * 0.38;
  float flutter = sin(wPhase * 6.3 + worldPos.y * 2.4) * vWindParams2.x * swayWeight;
  float travel = wAmp * (wave + flutter);
  worldPos.xz += wDir * travel;
  worldPos.y -= wAmp * abs(wave) * 0.22;
  vPositionW = worldPos.xyz;
}
#endif
`;

class WindPlugin extends MaterialPluginBase {
  state: WindState;
  /** Multiplier on the shared amplitude; grass moves further than a hedge. */
  scale: number;
  /**
   * Exponent on the weight. Above 1 the movement is pushed out to the tips (a stiff trunk);
   * below 1 it spreads down the branch (grass, which bends from the base).
   */
  stiffness: number;

  constructor(material: PBRMaterial, state: WindState, scale: number, stiffness: number) {
    super(material, 'SceneryWind', 200, { SCENERY_WIND: true }, true, true);
    this.state = state;
    this.scale = scale;
    this.stiffness = stiffness;
  }

  getClassName(): string {
    return 'SceneryWindPlugin';
  }

  isCompatible(shaderLanguage: ShaderLanguage): boolean {
    return shaderLanguage === ShaderLanguage.GLSL;
  }

  getAttributes(attributes: string[], _scene: Scene, _mesh: AbstractMesh): void {
    attributes.push('swayWeight');
  }

  getUniforms(): { ubo: Array<{ name: string; size: number; type: string }> } {
    return {
      ubo: [
        { name: 'vWindParams', size: 4, type: 'vec4' },
        { name: 'vWindParams2', size: 4, type: 'vec4' },
      ],
    };
  }

  bindForSubMesh(uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine): void {
    uniformBuffer.updateFloat4(
      'vWindParams',
      this.state.time,
      this.state.amplitude * this.scale,
      this.state.dirX,
      this.state.dirZ
    );
    uniformBuffer.updateFloat4('vWindParams2', this.state.gust, this.stiffness, 0, 0);
  }

  getCustomCode(shaderType: string): { [pointName: string]: string } | null {
    if (shaderType !== 'vertex') return null;
    return {
      CUSTOM_VERTEX_DEFINITIONS: DEFINITIONS,
      CUSTOM_VERTEX_UPDATE_WORLDPOS: UPDATE_WORLDPOS,
    };
  }
}

export interface WindHandle {
  plugin: WindPlugin | null;
}

/**
 * Attach the sway to a material. Returns a null plugin on WebGPU, which is not an error — the
 * caller carries on and the foliage is simply still.
 */
export function attachWind(
  material: PBRMaterial,
  state: WindState,
  options: { scale?: number; stiffness?: number; webgl: boolean }
): WindHandle {
  if (!options.webgl) return { plugin: null };
  try {
    const plugin = new WindPlugin(material, state, options.scale ?? 1, options.stiffness ?? 1.4);
    material.markAsDirty(Material.AllDirtyFlag);
    return { plugin };
  } catch (error) {
    console.warn('[game/scenery] wind plugin unavailable', error);
    return { plugin: null };
  }
}
