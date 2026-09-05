/**
 * Terrain renderer — PLACEHOLDER owned by the terrain builder. It exists so the route compiles
 * before the module is built: one flat PBR ground with a real material, no sculpting, no water.
 */

import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { MainContext, MainHandle } from '../core/types';
import { sampleHeight, sampleNormal } from './heightfield';

export interface TerrainMainApi {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
  /** The ground mesh, for shadow receivers and picking. */
  ground(): unknown;
}

export function createTerrainMain(ctx: MainContext): MainHandle {
  const scene = ctx.scene as Scene;
  const t = ctx.world.terrain;
  const ground = CreateGround(
    'terrain',
    { width: t.size, height: t.size, subdivisions: Math.min(128, t.resolution), updatable: true },
    scene
  );
  const positions = ground.getVerticesData('position');
  if (positions) {
    for (let k = 0; k < positions.length; k += 3) {
      positions[k + 1] = sampleHeight(t, positions[k], positions[k + 2]);
    }
    ground.updateVerticesData('position', positions);
    ground.createNormals(true);
  }
  const mat = new PBRMaterial('terrain-grass', scene);
  mat.albedoColor = new Color3(0.19, 0.32, 0.12);
  mat.metallic = 0;
  mat.roughness = 0.92;
  mat.specularIntensity = 0.3;
  ground.material = mat;
  ground.receiveShadows = true;
  ground.freezeWorldMatrix();

  const api: TerrainMainApi = {
    height: (x, z) => sampleHeight(ctx.world.terrain, x, z),
    normal: (x, z) => sampleNormal(ctx.world.terrain, x, z),
    ground: () => ground,
  };
  return {
    api,
    dispose() {
      ground.dispose();
      mat.dispose();
    },
  };
}
