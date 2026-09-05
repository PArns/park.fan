/**
 * The water table — the lake, the river, whatever the heightfield dips below
 * `world.terrain.waterLevel`. Pools own their own basins and their own material; this is the open
 * water the land makes.
 *
 * Depth is baked into the mesh rather than read from a depth buffer. The heightfield is right here
 * and does not move between edits, so the absorption ramp, the shoreline fade and the foam band all
 * come out of the vertex colour, which costs one attribute and works identically on WebGL2 and
 * WebGPU. A depth-buffer version would need the pre-pass, a second shader and a plugin per backend
 * to say the same thing.
 *
 * Only quads with a corner at or under the waterline are emitted, so a park with no water below the
 * line produces an empty mesh and no draw call at all, and a lake costs its own area rather than the
 * park's.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import type { Scene } from '@babylonjs/core/scene';
import type { EnvironmentState, TerrainData } from '../core/types';
import { sampleHeight } from './heightfield';
import { clamp01, mix, smoothstep } from './noise';

/** Metres per water quad. Fine enough that the shoreline fade is a gradient and not a staircase. */
const WATER_CELL = 4;
/** Metres the surface reaches past the park edge, so the lake does not end in mid-air. */
const WATER_MARGIN = 48;
/** Metres one tile of the ripple normal map covers. */
const RIPPLE_TILE = 8;

const SHALLOW = new Color3(0.36, 0.55, 0.5);
const DEEP = new Color3(0.035, 0.13, 0.19);
const FOAM = new Color3(0.78, 0.85, 0.86);

export interface WaterSurface {
  mesh: Mesh;
  material: PBRMaterial;
  /** Rebuild from the heightfield and the current water level. Returns the triangle count. */
  rebuild(): number;
  /** Scroll the two ripple layers. `seconds` is real time, not park time — a lake ripples at the
   *  same rate whether the park clock runs at 1× or 100×. */
  animate(seconds: number): void;
  applyEnvironment(env: EnvironmentState): void;
  dispose(): void;
}

export function createWaterSurface(
  scene: Scene,
  terrain: TerrainData,
  rippleA: RawTexture,
  rippleB: RawTexture
): WaterSurface {
  const material = new PBRMaterial('terrain-water', scene);
  material.metallic = 0;
  material.roughness = 0.055;
  material.albedoColor = new Color3(1, 1, 1);
  material.alpha = 1;
  material.transparencyMode = Material.MATERIAL_ALPHABLEND;
  material.backFaceCulling = false;
  material.specularIntensity = 1.4;
  material.useRadianceOverAlpha = true;
  material.useSpecularOverAlpha = true;

  const bump = rippleA;
  bump.uScale = 1;
  bump.vScale = 1;
  bump.level = 0.55;
  material.bumpTexture = bump;
  material.invertNormalMapX = false;
  material.invertNormalMapY = false;

  // A second wave train at a different scale, scrolling the other way. One layer alone reads as a
  // moving wallpaper the moment the sun is low enough to pick out the ripple crests.
  const detail = rippleB;
  detail.uScale = 2.7;
  detail.vScale = 2.7;
  material.detailMap.texture = detail;
  material.detailMap.isEnabled = true;
  material.detailMap.bumpLevel = 0.5;
  material.detailMap.diffuseBlendLevel = 0;
  material.detailMap.roughnessBlendLevel = 0;

  const mesh = new Mesh('terrain-water', scene);
  mesh.material = material;
  mesh.isPickable = false;
  mesh.receiveShadows = false;
  mesh.hasVertexAlpha = true;
  mesh.alphaIndex = 10;

  const rebuild = (): number => {
    const half = terrain.size / 2 + WATER_MARGIN;
    const perSide = Math.ceil((half * 2) / WATER_CELL);
    const w = perSide + 1;
    const level = terrain.waterLevel;
    const depths = new Float32Array(w * w);
    for (let b = 0; b <= perSide; b++) {
      const z = -half + b * WATER_CELL;
      for (let a = 0; a <= perSide; a++) {
        const x = -half + a * WATER_CELL;
        depths[b * w + a] = level - sampleHeight(terrain, x, z);
      }
    }

    // Two passes: mark the vertices a kept quad uses, then emit only those, so the buffer is the
    // size of the lake and not of the park.
    const used = new Int32Array(w * w).fill(-1);
    const quads: number[] = [];
    for (let b = 0; b < perSide; b++) {
      for (let a = 0; a < perSide; a++) {
        const v00 = b * w + a;
        const v10 = v00 + 1;
        const v01 = v00 + w;
        const v11 = v01 + 1;
        const deepest = Math.max(depths[v00], depths[v10], depths[v01], depths[v11]);
        // -0.6 keeps one row of dry vertices so the alpha ramp has somewhere to reach zero.
        if (deepest < -0.6) continue;
        quads.push(v00, v10, v01, v11);
        used[v00] = 0;
        used[v10] = 0;
        used[v01] = 0;
        used[v11] = 0;
      }
    }
    if (quads.length === 0) {
      mesh.setEnabled(false);
      return 0;
    }

    let count = 0;
    for (let k = 0; k < used.length; k++) if (used[k] === 0) used[k] = count++;

    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const colors = new Float32Array(count * 4);
    for (let b = 0; b <= perSide; b++) {
      const z = -half + b * WATER_CELL;
      for (let a = 0; a <= perSide; a++) {
        const src = b * w + a;
        const at = used[src];
        if (at < 0) continue;
        const x = -half + a * WATER_CELL;
        const depth = depths[src];
        positions[at * 3] = x;
        positions[at * 3 + 1] = level;
        positions[at * 3 + 2] = z;
        normals[at * 3] = 0;
        normals[at * 3 + 1] = 1;
        normals[at * 3 + 2] = 0;
        uvs[at * 2] = x / RIPPLE_TILE;
        uvs[at * 2 + 1] = z / RIPPLE_TILE;
        const t = smoothstep(0.15, 4.5, depth);
        const foam = smoothstep(0.55, 0.08, depth) * smoothstep(-0.15, 0.1, depth);
        colors[at * 4] = mix(mix(SHALLOW.r, DEEP.r, t), FOAM.r, foam * 0.7);
        colors[at * 4 + 1] = mix(mix(SHALLOW.g, DEEP.g, t), FOAM.g, foam * 0.7);
        colors[at * 4 + 2] = mix(mix(SHALLOW.b, DEEP.b, t), FOAM.b, foam * 0.7);
        colors[at * 4 + 3] = clamp01(smoothstep(-0.05, 0.85, depth) * 0.84 + 0.05);
      }
    }

    const indices = new Uint32Array((quads.length / 4) * 6);
    let ix = 0;
    for (let q = 0; q < quads.length; q += 4) {
      const v00 = used[quads[q]];
      const v10 = used[quads[q + 1]];
      const v01 = used[quads[q + 2]];
      const v11 = used[quads[q + 3]];
      indices[ix++] = v00;
      indices[ix++] = v01;
      indices[ix++] = v10;
      indices[ix++] = v10;
      indices[ix++] = v01;
      indices[ix++] = v11;
    }

    const data = new VertexData();
    data.positions = positions;
    data.normals = normals;
    data.uvs = uvs;
    data.colors = colors;
    data.indices = indices;
    data.applyToMesh(mesh, false);
    mesh.hasVertexAlpha = true;
    mesh.setEnabled(true);
    mesh.freezeWorldMatrix();
    return indices.length / 3;
  };

  return {
    mesh,
    material,
    rebuild,
    animate(seconds) {
      bump.uOffset = seconds * 0.013;
      bump.vOffset = seconds * 0.0075;
      detail.uOffset = -seconds * 0.0092;
      detail.vOffset = seconds * 0.0165;
    },
    applyEnvironment(env) {
      // The body colour follows the sky rather than staying a fixed teal: a lake at 23:00 that is
      // still daytime green is the single loudest thing in a night screenshot.
      const day = 1 - env.night;
      const sky = env.skyColor;
      material.albedoColor.set(
        mix(0.16 + sky[0] * 0.55, 1, day * 0.72),
        mix(0.2 + sky[1] * 0.55, 1, day * 0.72),
        mix(0.28 + sky[2] * 0.55, 1, day * 0.72)
      );
      // A ruffled surface under storm, glass under clear sky.
      const wind = env.weather === 'storm' ? 1 : env.weather === 'rain' ? 0.6 : 0.15;
      bump.level = 0.4 + 0.75 * wind;
      material.roughness = 0.045 + 0.1 * wind;
    },
    dispose() {
      // The two ripple textures belong to the texture set, which disposes them.
      mesh.dispose();
      material.dispose();
    },
  };
}
