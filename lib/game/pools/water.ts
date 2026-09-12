/**
 * Pool water: the surface mesh, its material, and the rings a splash leaves.
 *
 * ## Why this is not the lake
 *
 * `terrain/water.ts` is the open water the land makes, and this module deliberately does not
 * contradict it — same two-scale scrolling ripple normal, same depth-in-the-vertex-colour trick,
 * same `envExempt` contract, same "the body colour follows the sky so a night frame is not
 * daytime green". Four things are different, and each is a property of a contained pool rather
 * than a preference:
 *
 *  1. **The chop is short.** A lake has fetch and therefore a swell; twenty metres of pool has
 *     none, so `createRipple` tiles in 3 m against the lake's 8 and carries no long wave at all.
 *  2. **The floor is visible and is the point.** A lake's absorption ramp reaches full opacity over
 *     three metres. A chlorinated pool at two metres is still clear enough to read the tile grid
 *     on the bottom, so the ramp here tops out at 0.62 and the tint is the manifest's `water`
 *     colour rather than a lake green.
 *  3. **It ends at a wall, not at a shore.** There is no foam band and no shoreline fade; instead
 *     the last 300 mm before the tile brightens, which is the light that bounces off a white wall
 *     back up through the surface and is the thing that says "shallow here" in a photograph.
 *  4. **It has a floor it can light.** The caustics live on the tile material (`materials.ts`) and
 *     scroll with the same clock as these ripples, so the net on the bottom moves with the surface
 *     above it.
 *
 * ## Refraction
 *
 * There is no refraction probe and no render target. What is here is the cheap approximation the
 * brief allows: depth-tinted alpha over the real tiled floor, a two-layer animated normal, a low
 * roughness so the sky and the IBL land on it as a specular sheet, and `useRadianceOverAlpha` /
 * `useSpecularOverAlpha` so those reflections survive being blended. A `RefractionTexture` would
 * cost a full scene re-render per pool per frame — the most expensive thing anybody has proposed
 * on this branch — to bend a floor that is already drawn, in focus, 1.5 m under the surface. The
 * report says so with the draw-call numbers beside it.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import type { Scene } from '@babylonjs/core/scene';
import type { EnvironmentState } from '../core/types';
import { mix } from './geom';
import type { PoolTileSpec } from './types';
export { buildWaterMesh, RIPPLE_TILE } from './water-mesh';
export type { WaterMeshData } from './water-mesh';

export interface PoolWaterMaterial {
  material: PBRMaterial;
  /** Scroll the two ripple layers. Real seconds, not park minutes. */
  animate(seconds: number): void;
  applyEnvironment(
    env: EnvironmentState,
    night: number,
    lightColor: [number, number, number]
  ): void;
  dispose(): void;
}

/**
 * One water material per tile style, because the body tint is the tile style's business — a slate
 * whirlpool is not the same water as an aqua mosaic lagoon, and a park with one look pays for one
 * shader program.
 */
export function createWaterMaterial(
  scene: Scene,
  style: PoolTileSpec,
  rippleA: RawTexture,
  rippleB: RawTexture
): PoolWaterMaterial {
  const material = new PBRMaterial(`pool-water-${style.id}`, scene);
  material.metallic = 0;
  material.roughness = 0.055;
  material.albedoColor = new Color3(1, 1, 1);
  material.alpha = 1;
  material.transparencyMode = Material.MATERIAL_ALPHABLEND;
  material.backFaceCulling = false;
  material.specularIntensity = 1.5;
  material.useRadianceOverAlpha = true;
  material.useSpecularOverAlpha = true;
  material.maxSimultaneousLights = 6;
  // It owns its own look: no wetness, no season tint, no exposure fiddling. The canonical case.
  material.metadata = { ...(material.metadata ?? {}), envExempt: true };

  const bump = rippleA;
  bump.level = 0.42;
  material.bumpTexture = bump;
  material.invertNormalMapX = false;
  material.invertNormalMapY = false;

  // A second wave train at a different scale, crossing the first. One layer alone reads as moving
  // wallpaper the moment the sun is low enough to pick out the crests.
  const detail = rippleB;
  detail.uScale = 2.3;
  detail.vScale = 2.3;
  material.detailMap.texture = detail;
  material.detailMap.isEnabled = true;
  material.detailMap.bumpLevel = 0.42;
  material.detailMap.diffuseBlendLevel = 0;
  material.detailMap.roughnessBlendLevel = 0;

  return {
    material,
    animate(seconds) {
      bump.uOffset = seconds * 0.021;
      bump.vOffset = seconds * 0.0135;
      detail.uOffset = -seconds * 0.0165;
      detail.vOffset = seconds * 0.0245;
    },
    applyEnvironment(env, night, lightColor) {
      // The body follows the sky, exactly as the lake does: a pool at 23:00 that is still daytime
      // turquoise is the loudest wrong thing in a night frame. What is different is the floor —
      // this water has lit tile under it — so the night floor is the niche lamps' colour rather
      // than a flat dark.
      const day = 1 - night;
      const sky = env.skyColor;
      material.albedoColor.set(
        mix(0.1 + sky[0] * 0.4 + lightColor[0] * 0.32, 1, day * 0.78),
        mix(0.14 + sky[1] * 0.4 + lightColor[1] * 0.32, 1, day * 0.78),
        mix(0.2 + sky[2] * 0.4 + lightColor[2] * 0.32, 1, day * 0.78)
      );
      // Rain ruffles a pool too, and a storm more so; there is just less of it than on open water,
      // because a pool has no fetch for the wind to work over.
      const ruffle = env.weather === 'storm' ? 0.7 : env.weather === 'rain' ? 0.4 : 0.1;
      bump.level = 0.34 + 0.4 * ruffle;
      material.detailMap.bumpLevel = 0.34 + 0.4 * ruffle;
      material.roughness = 0.04 + 0.075 * ruffle;
      // At night the surface carries a little of the lamp light itself, which is what makes a lit
      // pool read as a glowing shape from the overview camera rather than as a dark hole.
      material.emissiveColor.set(
        lightColor[0] * 0.1 * night,
        lightColor[1] * 0.1 * night,
        lightColor[2] * 0.1 * night
      );
    },
    dispose() {
      // The ripple textures belong to the renderer's texture set, which disposes them.
      material.dispose();
    },
  };
}

/**
 * The rings a splash leaves — the visual half of the contract `flumes` needs.
 *
 * A pool of eight flat annuli, reused round-robin. Each one is spawned at a world point, expands
 * over its lifetime and fades out; nothing is allocated after boot. It is deliberately not a
 * particle system: a ring on a water surface is one expanding shape, and a particle system would
 * cost a soft-particle depth read to do the same thing worse.
 */
export interface SplashRings {
  spawn(x: number, y: number, z: number, strength: number): void;
  update(dtSeconds: number): void;
  count(): number;
  dispose(): void;
}

const RING_POOL = 8;
const RING_LIFE = 2.6;

export function createSplashRings(scene: Scene, material: PBRMaterial): SplashRings {
  const meshes: Mesh[] = [];
  const age = new Float32Array(RING_POOL).fill(RING_LIFE + 1);
  const power = new Float32Array(RING_POOL);
  const template = ringMesh(scene, 'pool-splash', 20);
  template.material = material;
  template.isVisible = false;
  template.isPickable = false;

  // Clones, not instances: Babylon's instances share the source mesh's `visibility`, so eight
  // rings on one instance buffer would fade in lockstep — which is not what a splash does. A clone
  // shares the geometry and the material and costs its own draw call only while it is enabled.
  for (let i = 0; i < RING_POOL; i++) {
    const m = template.clone(`pool-splash-${i}`);
    m.isPickable = false;
    m.setEnabled(false);
    meshes.push(m);
  }
  let next = 0;

  return {
    spawn(x, y, z, strength) {
      const i = next;
      next = (next + 1) % RING_POOL;
      const m = meshes[i];
      m.position.set(x, y + 0.02, z);
      m.scaling.setAll(0.4);
      m.setEnabled(true);
      age[i] = 0;
      power[i] = Math.max(0.2, Math.min(3, strength));
    },
    update(dt) {
      for (let i = 0; i < RING_POOL; i++) {
        if (age[i] > RING_LIFE) continue;
        age[i] += dt;
        const t = age[i] / RING_LIFE;
        if (t >= 1) {
          meshes[i].setEnabled(false);
          continue;
        }
        const r = 0.4 + power[i] * 3.4 * Math.sqrt(t);
        meshes[i].scaling.set(r, 1, r);
        meshes[i].visibility = (1 - t) * (1 - t);
      }
    },
    count: () => meshes.filter((m) => m.isEnabled()).length,
    dispose() {
      for (const m of meshes) m.dispose();
      meshes.length = 0;
      template.dispose();
    },
  };
}

/** A flat annulus of unit outer radius, faded from the rim inwards. */
function ringMesh(scene: Scene, name: string, segments: number): Mesh {
  const mesh = new Mesh(name, scene);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const radii = [0.55, 0.82, 1];
  const alpha = [0, 0.85, 0];
  for (let r = 0; r < radii.length; r++) {
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      positions.push(Math.cos(a) * radii[r], 0, Math.sin(a) * radii[r]);
      normals.push(0, 1, 0);
      uvs.push(i / segments, r / (radii.length - 1));
      colors.push(1, 1, 1, alpha[r]);
    }
  }
  for (let r = 0; r + 1 < radii.length; r++) {
    for (let i = 0; i < segments; i++) {
      const j = (i + 1) % segments;
      const a = r * segments + i;
      const b = r * segments + j;
      const c = (r + 1) * segments + j;
      const d = (r + 1) * segments + i;
      indices.push(a, d, c, a, c, b);
    }
  }
  const data = new VertexData();
  data.positions = positions;
  data.normals = normals;
  data.uvs = uvs;
  data.colors = colors;
  data.indices = indices;
  data.applyToMesh(mesh, false);
  mesh.hasVertexAlpha = true;
  mesh.alphaIndex = 30;
  mesh.position = new Vector3(0, 0, 0);
  return mesh;
}
