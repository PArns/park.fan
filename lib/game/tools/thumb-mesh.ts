/**
 * One geometry surface to one mesh, for the thumbnail studio.
 *
 * The modules each have their own copy of this — `shops/main.ts`, `rides/geometry.ts`,
 * `scenery/geometry.ts` — and only scenery's is exported. This is the fourth, and it exists so the
 * studio can build a shop without either editing that folder or reaching into a private function.
 * It is deliberately the plain version: positions, normals, uvs, colours, indices, vertex colours
 * on, nothing pickable and nothing that casts.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';

export interface PlainSurface {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

export function surfaceToMesh(
  scene: Scene,
  name: string,
  surface: PlainSurface,
  material: Material
): Mesh {
  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = new Float32Array(surface.positions);
  data.normals = new Float32Array(surface.normals);
  data.uvs = new Float32Array(surface.uvs);
  data.colors = new Float32Array(surface.colors);
  data.indices =
    surface.indices.length > 65000
      ? new Uint32Array(surface.indices)
      : new Uint16Array(surface.indices);
  data.applyToMesh(mesh, false);
  mesh.material = material;
  mesh.useVertexColors = true;
  mesh.isPickable = false;
  mesh.hasVertexAlpha = false;
  return mesh;
}
