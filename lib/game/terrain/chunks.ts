/**
 * The ground geometry: the park cut into square chunks, three LOD levels each, plus one apron ring
 * that carries the land out past the park boundary and one coarse proxy that casts the sun's
 * shadow.
 *
 * Chunking is what makes both frustum culling and editing cheap. Babylon culls per mesh, so a
 * single 512 m ground is either fully drawn or fully skipped; at 64 chunks the `close` and `ground`
 * camera presets draw between four and eleven of them. And a sculpt stroke touches the chunks its
 * rect covers — `rebuildRect` rewrites the vertex buffers of those and nothing else, which is the
 * difference between 1.5 ms and ~90 ms for a brush on the default park.
 *
 * Normals are taken from the full-resolution heightfield at every LOD, not from the strided mesh.
 * Deriving them per level makes a hillside change shade as it crosses an LOD threshold, which is
 * far more visible than the silhouette change the LOD is actually making.
 *
 * Cracks between neighbouring LOD levels are covered by a skirt around every chunk rather than by
 * stitching: stitching needs a chunk to know its neighbours' current level, so an edit or a camera
 * move can invalidate a mesh that was not edited.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import type { TerrainData } from '../core/types';
import { cellSize, sampleHeight, sampleNormal } from './heightfield';

/** Cells per chunk side. 32 cells × 2 m = a 64 m chunk on the default park. */
export const CHUNK_CELLS = 32;
/** Vertex strides of the three levels. Each must divide `CHUNK_CELLS`. */
const LOD_STRIDES = [1, 2, 4];
/** Metres at which the next level takes over. Tuned against the `overview` preset's 260 m radius. */
const LOD_DISTANCES = [150, 320];
/** How far the edge apron hangs below the surface, metres. Covers the worst LOD crack measured on
 *  the showcase escarpment (7.4 m). */
const SKIRT_DEPTH = 9;

interface Surface {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

function toVertexData(s: Surface): VertexData {
  const data = new VertexData();
  data.positions = s.positions;
  data.normals = s.normals;
  data.indices = s.indices;
  return data;
}

export interface TerrainChunk {
  cx: number;
  cz: number;
  /** LOD 0 is the drawn mesh; 1 and 2 hang off it through `addLODLevel`. */
  meshes: Mesh[];
}

export interface TerrainMeshes {
  chunks: TerrainChunk[];
  surround: Mesh;
  /** Coarse copy of the park, invisible to the camera, in the sun's shadow render list. */
  shadowProxy: Mesh | null;
  /** All meshes the camera can draw, for shadow-receiver and picking setup. */
  visible(): Mesh[];
  rebuildAll(): void;
  /** Rebuild only the chunks overlapping a sample-index rect `[i0, j0, i1, j1]`. */
  rebuildRect(rect: [number, number, number, number]): number;
  dispose(): void;
}

/** A chunk's geometry at one stride, in chunk-local metres (the mesh sits at the chunk centre). */
function buildChunkData(
  t: TerrainData,
  cx: number,
  cz: number,
  stride: number,
  centreX: number,
  centreZ: number
): Surface {
  const cell = cellSize(t);
  const perSide = CHUNK_CELLS / stride;
  const w = perSide + 1;
  const half = t.size / 2;
  const skirtCount = 4 * w;
  const total = w * w + skirtCount;
  const positions = new Float32Array(total * 3);
  const normals = new Float32Array(total * 3);
  const indices = new Uint32Array(perSide * perSide * 6 + 4 * perSide * 6);

  for (let b = 0; b <= perSide; b++) {
    const j = cz * CHUNK_CELLS + b * stride;
    const z = -half + j * cell;
    for (let a = 0; a <= perSide; a++) {
      const i = cx * CHUNK_CELLS + a * stride;
      const x = -half + i * cell;
      const k = (b * w + a) * 3;
      const y = sampleHeight(t, x, z);
      positions[k] = x - centreX;
      positions[k + 1] = y;
      positions[k + 2] = z - centreZ;
      const n = sampleNormal(t, x, z);
      normals[k] = n[0];
      normals[k + 1] = n[1];
      normals[k + 2] = n[2];
    }
  }

  let at = 0;
  for (let b = 0; b < perSide; b++) {
    for (let a = 0; a < perSide; a++) {
      const v00 = b * w + a;
      const v10 = v00 + 1;
      const v01 = v00 + w;
      const v11 = v01 + 1;
      // Same winding Babylon's own `CreateGround` emits. In this scene (`useRightHandedSystem`
      // with a right-handed projection) an up-facing triangle's cross(v1-v0, v2-v0) points DOWN,
      // which is the opposite of the intuition and is what the first version got wrong: every
      // chunk top was back-face culled and the park rendered as a grid of black holes with the
      // skirts still standing.
      indices[at++] = v00;
      indices[at++] = v10;
      indices[at++] = v01;
      indices[at++] = v10;
      indices[at++] = v11;
      indices[at++] = v01;
    }
  }

  // Skirt: one dropped copy of each edge vertex. The winding per edge is derived from the edge's
  // own direction rather than written out four times, which is where the first version put two of
  // the four the wrong way round and left two transparent walls at the park boundary.
  let skirtAt = w * w;
  const edges: Array<{ get: (n: number) => number; outward: [number, number] }> = [
    { get: (n) => n * w, outward: [-1, 0] },
    { get: (n) => n * w + perSide, outward: [1, 0] },
    { get: (n) => n, outward: [0, -1] },
    { get: (n) => perSide * w + n, outward: [0, 1] },
  ];
  for (const edge of edges) {
    const first = skirtAt;
    for (let n = 0; n <= perSide; n++) {
      const src = edge.get(n) * 3;
      const dst = (skirtAt + n) * 3;
      positions[dst] = positions[src];
      positions[dst + 1] = positions[src + 1] - SKIRT_DEPTH;
      positions[dst + 2] = positions[src + 2];
      normals[dst] = edge.outward[0];
      normals[dst + 1] = 0;
      normals[dst + 2] = edge.outward[1];
    }
    for (let n = 0; n < perSide; n++) {
      const t0 = edge.get(n);
      const t1 = edge.get(n + 1);
      const s0 = first + n;
      const s1 = first + n + 1;
      // cross(T1 - T0, S0 - T0) with S0 = T0 - (0, D, 0) is (ez·D, 0, -ex·D). Front faces in this
      // scene are the ones whose cross points AWAY from the visible side (see the grid above), so
      // the pair to emit is the one whose cross points back INTO the chunk.
      const ex = positions[t1 * 3] - positions[t0 * 3];
      const ez = positions[t1 * 3 + 2] - positions[t0 * 3 + 2];
      const crossPointsOut = ez * edge.outward[0] - ex * edge.outward[1] >= 0;
      if (!crossPointsOut) {
        indices[at++] = t0;
        indices[at++] = t1;
        indices[at++] = s0;
        indices[at++] = t1;
        indices[at++] = s1;
        indices[at++] = s0;
      } else {
        indices[at++] = t0;
        indices[at++] = s0;
        indices[at++] = t1;
        indices[at++] = t1;
        indices[at++] = s0;
        indices[at++] = s1;
      }
    }
    skirtAt += w + 0;
  }

  return { positions, normals, indices: indices.subarray(0, at) };
}

/**
 * The apron: concentric square rings from the park boundary out to `REACH` metres. Without it the
 * park is a 512 m plate with one hard silhouette against the sky — which is what the baseline
 * screenshot of this module was. The land keeps the boundary height for the first ring, then drifts
 * down and grows its own low relief so the horizon has a shape before the fog takes it.
 */
const SURROUND_REACH = 1500;
const SURROUND_RINGS = 12;
const SURROUND_SEGMENTS = 40;
/** Metres above the water table the far land settles at. */
const SURROUND_SHORE = 7;

function buildSurroundData(t: TerrainData, noise: (x: number, z: number) => number): Surface {
  const half = t.size / 2;
  const perimeter = SURROUND_SEGMENTS * 4;
  const ringCount = SURROUND_RINGS + 1;
  const positions = new Float32Array(perimeter * ringCount * 3);
  const normals = new Float32Array(perimeter * ringCount * 3);
  const indices = new Uint32Array(perimeter * SURROUND_RINGS * 6);

  const pointOnSquare = (k: number, h: number, out: [number, number]) => {
    const side = Math.floor(k / SURROUND_SEGMENTS);
    const f = (k % SURROUND_SEGMENTS) / SURROUND_SEGMENTS;
    const s = -h + 2 * h * f;
    if (side === 0) {
      out[0] = s;
      out[1] = -h;
    } else if (side === 1) {
      out[0] = h;
      out[1] = s;
    } else if (side === 2) {
      out[0] = -s;
      out[1] = h;
    } else {
      out[0] = -h;
      out[1] = -s;
    }
  };

  const p: [number, number] = [0, 0];
  for (let r = 0; r <= SURROUND_RINGS; r++) {
    // Geometric spacing: near rings are dense where the join has to be invisible, far rings are
    // cheap because the fog has them.
    const f = r / SURROUND_RINGS;
    const dist = SURROUND_REACH * f * f;
    const h = half + dist;
    for (let k = 0; k < perimeter; k++) {
      pointOnSquare(k, h, p);
      const x = p[0];
      const z = p[1];
      const edge = sampleHeight(
        t,
        Math.max(-half, Math.min(half, x)),
        Math.max(-half, Math.min(half, z))
      );
      // The apron leaves the boundary height and climbs to a far shore rather than sinking away
      // from it. Sinking was the first attempt and it put a black trench right across the horizon
      // in the overview shot: south of the park the boundary is 11 m of lake bed, so an apron that
      // drops further is lake floor with no water over it — the water surface only reaches
      // `WATER_MARGIN` past the park. Rising to a low far shore needs no second water mesh and
      // gives the lake an opposite bank, which is what a lake usually has.
      const blend = Math.min(1, dist / 320);
      const y = edge * (1 - blend) + (SURROUND_SHORE + Math.max(0, noise(x, z))) * blend;
      const at = (r * perimeter + k) * 3;
      positions[at] = x;
      positions[at + 1] = y;
      positions[at + 2] = z;
    }
  }

  let at = 0;
  for (let r = 0; r < SURROUND_RINGS; r++) {
    for (let k = 0; k < perimeter; k++) {
      const k1 = (k + 1) % perimeter;
      const a = r * perimeter + k;
      const b = r * perimeter + k1;
      const c = (r + 1) * perimeter + k;
      const d = (r + 1) * perimeter + k1;
      indices[at++] = a;
      indices[at++] = c;
      indices[at++] = b;
      indices[at++] = b;
      indices[at++] = c;
      indices[at++] = d;
    }
  }

  VertexData.ComputeNormals(positions, indices, normals);
  return { positions, normals, indices };
}

/** One coarse mesh over the whole park, drawn only into the shadow map. */
function buildProxyData(t: TerrainData, stride: number): Surface {
  const cell = cellSize(t);
  const perSide = t.resolution / stride;
  const w = perSide + 1;
  const half = t.size / 2;
  const positions = new Float32Array(w * w * 3);
  const normals = new Float32Array(w * w * 3);
  const indices = new Uint32Array(perSide * perSide * 6);
  for (let b = 0; b <= perSide; b++) {
    const z = -half + b * stride * cell;
    for (let a = 0; a <= perSide; a++) {
      const x = -half + a * stride * cell;
      const k = (b * w + a) * 3;
      positions[k] = x;
      positions[k + 1] = sampleHeight(t, x, z);
      positions[k + 2] = z;
      const n = sampleNormal(t, x, z);
      normals[k] = n[0];
      normals[k + 1] = n[1];
      normals[k + 2] = n[2];
    }
  }
  let at = 0;
  for (let b = 0; b < perSide; b++) {
    for (let a = 0; a < perSide; a++) {
      const v00 = b * w + a;
      indices[at++] = v00;
      indices[at++] = v00 + 1;
      indices[at++] = v00 + w;
      indices[at++] = v00 + 1;
      indices[at++] = v00 + w + 1;
      indices[at++] = v00 + w;
    }
  }
  return { positions, normals, indices };
}

export interface ChunkOptions {
  material: Material;
  /** Off on `low`, where the extra 8 k triangles per cascade are not worth the sun's shadow. */
  shadowProxy: boolean;
  /** Low-relief noise for the land outside the park, in metres. */
  surroundNoise: (x: number, z: number) => number;
}

export function createTerrainMeshes(
  scene: Scene,
  terrain: TerrainData,
  options: ChunkOptions
): TerrainMeshes {
  const chunksPerSide = Math.max(1, Math.round(terrain.resolution / CHUNK_CELLS));
  const cell = cellSize(terrain);
  const chunkMetres = CHUNK_CELLS * cell;
  const half = terrain.size / 2;
  const chunks: TerrainChunk[] = [];

  for (let cz = 0; cz < chunksPerSide; cz++) {
    for (let cx = 0; cx < chunksPerSide; cx++) {
      const centreX = -half + (cx + 0.5) * chunkMetres;
      const centreZ = -half + (cz + 0.5) * chunkMetres;
      const meshes: Mesh[] = [];
      for (let level = 0; level < LOD_STRIDES.length; level++) {
        const mesh = new Mesh(`terrain-${cx}-${cz}-l${level}`, scene);
        toVertexData(
          buildChunkData(terrain, cx, cz, LOD_STRIDES[level], centreX, centreZ)
        ).applyToMesh(mesh, true);
        mesh.position.set(centreX, 0, centreZ);
        mesh.material = options.material;
        mesh.receiveShadows = true;
        mesh.isPickable = false;
        mesh.checkCollisions = false;
        mesh.freezeWorldMatrix();
        meshes.push(mesh);
      }
      meshes[0].addLODLevel(LOD_DISTANCES[0], meshes[1]);
      meshes[0].addLODLevel(LOD_DISTANCES[1], meshes[2]);
      chunks.push({ cx, cz, meshes });
    }
  }

  const surround = new Mesh('terrain-surround', scene);
  toVertexData(buildSurroundData(terrain, options.surroundNoise)).applyToMesh(surround, true);
  surround.material = options.material;
  surround.receiveShadows = true;
  surround.isPickable = false;
  surround.freezeWorldMatrix();

  let shadowProxy: Mesh | null = null;
  if (options.shadowProxy) {
    shadowProxy = new Mesh('terrain-shadow-proxy', scene);
    toVertexData(buildProxyData(terrain, 2)).applyToMesh(shadowProxy, true);
    shadowProxy.material = options.material;
    // The camera's default layer mask is 0x0FFFFFFF, so this bit keeps the proxy out of the colour
    // pass; a shadow map's render list is explicit and does not filter on the mask.
    shadowProxy.layerMask = 0x40000000;
    shadowProxy.isPickable = false;
    shadowProxy.receiveShadows = false;
    shadowProxy.freezeWorldMatrix();
  }

  const rebuildChunk = (chunk: TerrainChunk) => {
    const centreX = -half + (chunk.cx + 0.5) * chunkMetres;
    const centreZ = -half + (chunk.cz + 0.5) * chunkMetres;
    for (let level = 0; level < chunk.meshes.length; level++) {
      const data = buildChunkData(
        terrain,
        chunk.cx,
        chunk.cz,
        LOD_STRIDES[level],
        centreX,
        centreZ
      );
      const mesh = chunk.meshes[level];
      mesh.unfreezeWorldMatrix();
      mesh.updateVerticesData('position', data.positions, false, false);
      mesh.updateVerticesData('normal', data.normals, false, false);
      mesh.refreshBoundingInfo();
      mesh.freezeWorldMatrix();
    }
  };

  const rebuildProxy = () => {
    if (!shadowProxy) return;
    const data = buildProxyData(terrain, 2);
    shadowProxy.updateVerticesData('position', data.positions, false, false);
    shadowProxy.updateVerticesData('normal', data.normals, false, false);
    shadowProxy.refreshBoundingInfo();
  };

  const rebuildSurround = () => {
    const data = buildSurroundData(terrain, options.surroundNoise);
    surround.updateVerticesData('position', data.positions, false, false);
    surround.updateVerticesData('normal', data.normals, false, false);
    surround.refreshBoundingInfo();
  };

  return {
    chunks,
    surround,
    shadowProxy,
    visible() {
      const out: Mesh[] = [surround];
      for (const c of chunks) out.push(...c.meshes);
      return out;
    },
    rebuildAll() {
      for (const chunk of chunks) rebuildChunk(chunk);
      rebuildProxy();
      rebuildSurround();
    },
    rebuildRect(rect) {
      const [i0, j0, i1, j1] = rect;
      const cx0 = Math.max(0, Math.floor((i0 - 1) / CHUNK_CELLS));
      const cx1 = Math.min(chunksPerSide - 1, Math.floor((i1 + 1) / CHUNK_CELLS));
      const cz0 = Math.max(0, Math.floor((j0 - 1) / CHUNK_CELLS));
      const cz1 = Math.min(chunksPerSide - 1, Math.floor((j1 + 1) / CHUNK_CELLS));
      let touched = 0;
      for (const chunk of chunks) {
        if (chunk.cx < cx0 || chunk.cx > cx1 || chunk.cz < cz0 || chunk.cz > cz1) continue;
        rebuildChunk(chunk);
        touched++;
      }
      rebuildProxy();
      // The apron reads the boundary height, so an edit at the park edge moves it too.
      if (cx0 === 0 || cz0 === 0 || cx1 === chunksPerSide - 1 || cz1 === chunksPerSide - 1) {
        rebuildSurround();
      }
      return touched;
    },
    dispose() {
      for (const chunk of chunks) for (const m of chunk.meshes) m.dispose();
      surround.dispose();
      shadowProxy?.dispose();
    },
  };
}

/** World-space centre of a chunk, for tests and for the report's culling numbers. */
export function chunkCentre(terrain: TerrainData, cx: number, cz: number): Vector3 {
  const chunkMetres = CHUNK_CELLS * cellSize(terrain);
  const half = terrain.size / 2;
  return new Vector3(-half + (cx + 0.5) * chunkMetres, 0, -half + (cz + 0.5) * chunkMetres);
}
