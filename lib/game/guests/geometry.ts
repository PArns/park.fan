/**
 * The figure: seven parts at LOD 0, four at LOD 1, two at LOD 2, all procedural.
 *
 * **Why the body is separate meshes rather than one skinned mesh.** Two thousand skinned guests is
 * two thousand bone matrix palettes and a shader variant that has to work on WebGPU and WebGL2
 * alike; the alternative most crowd renderers reach for is a baked vertex-animation texture, which
 * is a custom vertex shader written twice (D-021 is the same argument about wetness). A rigid part
 * per limb with its matrix composed on the CPU needs no shader at all, animates exactly, and costs
 * nine 4×4 writes per near guest per frame — measured in `main.ts`. What it cannot do is bend, so
 * the knee is a joint rather than a deformation: a thigh and a shin, which is why a LOD 0 leg is
 * two meshes.
 *
 * **The parts are built in "figure units": a reference adult is exactly 1.0 tall** and the head is
 * `REF_HEAD` of that. Everything is placed against joints given as fractions of the neck height,
 * so one mesh set serves every archetype — the instance matrix carries a UNIFORM body scale and a
 * separate, larger, uniform head scale. That is what makes a child a child rather than a small
 * adult: `bodyScale = height × (1 − headRatio) / NECK` and `headScale = height × headRatio / REF_HEAD`,
 * so the totals come out at exactly the archetype's height with a 1:5.6 head instead of 1:7.4.
 * Uniform scale on every part also keeps the normals correct without a `NONUNIFORMSCALING` define
 * that thin instances cannot set.
 *
 * **Vertex colours are the shading, and the instance colour is the paint.** `vColor` is
 * `vertexColor × instanceColor` in the PBR fragment shader, so the ambient occlusion under the
 * chin, in the armpit and between the legs is baked here once and every guest gets it whatever
 * they are wearing. Without it a crowd is a field of untextured primitives in flat colours, which
 * is the art bible's definition of programmer art.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';

/** Head height as a fraction of total, for the mesh set as built. */
export const REF_HEAD = 0.135;
/** Everything below the head, in figure units. */
export const NECK = 1 - REF_HEAD;

/**
 * Joints, as fractions of `NECK`. A human is about half legs, and getting that wrong is the
 * difference between a person and a garden gnome.
 */
export const JOINT = {
  ankle: 0.065,
  knee: 0.325,
  hip: 0.615,
  waist: 0.72,
  chest: 0.845,
  shoulder: 0.955,
};

export const HIP_HALF = 0.082;
export const SHOULDER_HALF = 0.113;

export interface Surface {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

export function newSurface(): Surface {
  return { positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

export interface Ring {
  /** Along the part's own axis. */
  y: number;
  /** Half-width across and front-to-back. */
  rx: number;
  rz: number;
  /** Centre offset, for a chest that sits forward of the hips. */
  cx?: number;
  cz?: number;
  /** Baked shading, multiplied into the instance colour. 1 is unshaded. */
  shade: number;
}

/**
 * Loft a closed tube through the rings.
 *
 * An ellipse per ring rather than a circle, because a torso is a good deal wider than it is deep
 * and a round one reads as a bollard. `segments` is 8 up close and 6 or 4 further out; the shading
 * comes from the ring and from a per-vertex term so the sides of a limb are darker than its front.
 */
export function addLoft(
  s: Surface,
  rings: readonly Ring[],
  segments: number,
  options: { capTop?: boolean; capBottom?: boolean; uvScale?: number; sideShade?: number } = {}
): void {
  const start = s.positions.length / 3;
  const uvScale = options.uvScale ?? 8;
  const sideShade = options.sideShade ?? 0.14;
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const x = (ring.cx ?? 0) + cos * ring.rx;
      const z = (ring.cz ?? 0) + sin * ring.rz;
      s.positions.push(x, ring.y, z);
      s.normals.push(0, 0, 0);
      s.uvs.push((i / segments) * 2, ring.y * uvScale);
      // Sides away from the light are darker before any light touches them; this is the term that
      // gives an untextured cylinder a form at 20 m, where the normal map has stopped working.
      const facing = 0.5 + 0.5 * sin;
      const shade = ring.shade * (1 - sideShade * (1 - facing));
      s.colors.push(shade, shade, shade, 1);
    }
  }
  const stride = segments + 1;
  for (let r = 0; r + 1 < rings.length; r++) {
    for (let i = 0; i < segments; i++) {
      const a = start + r * stride + i;
      const b = a + 1;
      const c = a + stride;
      const dd = c + 1;
      s.indices.push(a, c, b, b, c, dd);
    }
  }
  if (options.capBottom) capRing(s, rings[0], segments, false);
  if (options.capTop) capRing(s, rings[rings.length - 1], segments, true);
}

function capRing(s: Surface, ring: Ring, segments: number, up: boolean): void {
  const centre = s.positions.length / 3;
  s.positions.push(ring.cx ?? 0, ring.y, ring.cz ?? 0);
  s.normals.push(0, up ? 1 : -1, 0);
  s.uvs.push(0.5, 0.5);
  s.colors.push(ring.shade, ring.shade, ring.shade, 1);
  const first = s.positions.length / 3;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    s.positions.push(
      (ring.cx ?? 0) + Math.cos(a) * ring.rx,
      ring.y,
      (ring.cz ?? 0) + Math.sin(a) * ring.rz
    );
    s.normals.push(0, up ? 1 : -1, 0);
    s.uvs.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    s.colors.push(ring.shade, ring.shade, ring.shade, 1);
  }
  for (let i = 0; i < segments; i++) {
    if (up) s.indices.push(centre, first + i, first + i + 1);
    else s.indices.push(centre, first + i + 1, first + i);
  }
}

/** A rounded box, for a shoe. Four flat sides read wrong on a foot; the chamfer is the point. */
export function addShoe(
  s: Surface,
  y: number,
  length: number,
  width: number,
  height: number,
  shade: number
): void {
  const rings: Ring[] = [
    { y, rx: width * 0.42, rz: length * 0.34, cz: -length * 0.05, shade: shade * 0.72 },
    { y: y + height * 0.55, rx: width * 0.5, rz: length * 0.46, cz: length * 0.02, shade },
    { y: y + height, rx: width * 0.4, rz: length * 0.34, cz: length * 0.06, shade: shade * 0.92 },
  ];
  addLoft(s, rings, 6, { capTop: true, capBottom: true, uvScale: 6, sideShade: 0.1 });
}

/** Area-weighted smooth normals. Built once per mesh, so the cost is boot time and not frame time. */
export function finishNormals(s: Surface): void {
  const n = s.positions.length / 3;
  const acc = new Float64Array(n * 3);
  for (let i = 0; i < s.indices.length; i += 3) {
    const a = s.indices[i] * 3;
    const b = s.indices[i + 1] * 3;
    const c = s.indices[i + 2] * 3;
    const ux = s.positions[b] - s.positions[a];
    const uy = s.positions[b + 1] - s.positions[a + 1];
    const uz = s.positions[b + 2] - s.positions[a + 2];
    const vx = s.positions[c] - s.positions[a];
    const vy = s.positions[c + 1] - s.positions[a + 1];
    const vz = s.positions[c + 2] - s.positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const at of [a, b, c]) {
      acc[at] += nx;
      acc[at + 1] += ny;
      acc[at + 2] += nz;
    }
  }
  for (let i = 0; i < n; i++) {
    const x = acc[i * 3];
    const y = acc[i * 3 + 1];
    const z = acc[i * 3 + 2];
    const len = Math.hypot(x, y, z) || 1;
    s.normals[i * 3] = x / len;
    s.normals[i * 3 + 1] = y / len;
    s.normals[i * 3 + 2] = z / len;
  }
}

export function toMesh(scene: Scene, name: string, s: Surface, material: Material): Mesh {
  finishNormals(s);
  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = new Float32Array(s.positions);
  data.normals = new Float32Array(s.normals);
  data.uvs = new Float32Array(s.uvs);
  data.colors = new Float32Array(s.colors);
  data.indices = s.indices.length > 65000 ? new Uint32Array(s.indices) : new Uint16Array(s.indices);
  data.applyToMesh(mesh, false);
  mesh.material = material;
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  // Vertex alpha is 1 everywhere; `hasVertexAlpha` would push the whole crowd into the transparent
  // pass, sorted per instance, drawn over the paths they are standing on.
  mesh.hasVertexAlpha = false;
  mesh.isVisible = false;
  mesh.thinInstanceCount = 0;
  mesh.freezeWorldMatrix();
  // The instance buffers are rewritten every frame; syncing a bounding box over 1 500 matrices
  // twenty times a second is the kind of hidden cost that shows up as a flat frame budget.
  mesh.doNotSyncBoundingInfo = true;
  mesh.alwaysSelectAsActiveMesh = true;
  return mesh;
}

// ── The parts ───────────────────────────────────────────────────────────────────────────────
export type PartName =
  | 'torso'
  | 'head'
  | 'hair'
  | 'arm'
  | 'thigh'
  | 'shin'
  | 'body1'
  | 'leg1'
  | 'head1'
  | 'hair1'
  | 'legs2'
  | 'body2'
  | 'head2'
  | 'contact';

/**
 * The torso, origin at the hip joint, running up to the neck.
 *
 * Six rings: hips, waist, lower chest, chest, shoulders and a short neck. The chest sits 8 mm
 * forward of the hips and the shoulders 5 mm back, which is the posture that stops a standing
 * figure reading as a fence post.
 */
export function buildTorso(detail: number): Surface {
  const s = newSurface();
  const top = NECK * (1 - JOINT.hip);
  const seg = detail >= 2 ? 8 : detail === 1 ? 6 : 4;
  const rings: Ring[] = [
    { y: 0, rx: HIP_HALF, rz: HIP_HALF * 0.66, shade: 0.78 },
    { y: top * 0.17, rx: HIP_HALF * 1.02, rz: HIP_HALF * 0.7, shade: 0.86 },
    { y: top * 0.34, rx: HIP_HALF * 0.9, rz: HIP_HALF * 0.63, cz: 0.004, shade: 0.94 },
    { y: top * 0.58, rx: SHOULDER_HALF * 0.86, rz: HIP_HALF * 0.74, cz: 0.008, shade: 1 },
    { y: top * 0.8, rx: SHOULDER_HALF, rz: HIP_HALF * 0.72, cz: 0.003, shade: 1 },
    { y: top * 0.93, rx: SHOULDER_HALF * 0.72, rz: HIP_HALF * 0.6, cz: -0.002, shade: 0.9 },
    { y: top, rx: 0.036, rz: 0.032, cz: -0.004, shade: 0.62 },
  ];
  addLoft(s, rings, seg, { capTop: true, capBottom: true, uvScale: 9 });
  return s;
}

/**
 * The head, centred on its own origin so the instance matrix can scale it independently.
 *
 * A brow ridge and a chin taper, and it is not a sphere: the back of the skull is fuller than the
 * face, which is the whole silhouette at 15 m.
 */
export function buildHead(detail: number): Surface {
  const s = newSurface();
  const h = REF_HEAD;
  const seg = detail >= 2 ? 8 : 6;
  const rings: Ring[] = [
    { y: -h * 0.5, rx: h * 0.19, rz: h * 0.2, cz: h * 0.03, shade: 0.55 },
    { y: -h * 0.34, rx: h * 0.28, rz: h * 0.3, cz: h * 0.02, shade: 0.74 },
    { y: -h * 0.14, rx: h * 0.35, rz: h * 0.38, cz: h * 0.01, shade: 0.98 },
    { y: h * 0.06, rx: h * 0.37, rz: h * 0.4, shade: 1 },
    { y: h * 0.24, rx: h * 0.35, rz: h * 0.38, cz: -h * 0.02, shade: 1 },
    { y: h * 0.4, rx: h * 0.26, rz: h * 0.28, cz: -h * 0.03, shade: 0.95 },
    { y: h * 0.5, rx: h * 0.11, rz: h * 0.12, cz: -h * 0.03, shade: 0.88 },
  ];
  addLoft(s, rings, seg, { capTop: true, capBottom: true, uvScale: 14, sideShade: 0.1 });
  return s;
}

/** Hair: a cap over the crown and down the back, in the head's own space. */
export function buildHair(detail: number): Surface {
  const s = newSurface();
  const h = REF_HEAD;
  const seg = detail >= 2 ? 8 : 6;
  const rings: Ring[] = [
    { y: -h * 0.06, rx: h * 0.385, rz: h * 0.415, cz: -h * 0.05, shade: 0.7 },
    { y: h * 0.16, rx: h * 0.375, rz: h * 0.405, cz: -h * 0.035, shade: 0.92 },
    { y: h * 0.34, rx: h * 0.29, rz: h * 0.31, cz: -h * 0.04, shade: 1 },
    { y: h * 0.47, rx: h * 0.14, rz: h * 0.15, cz: -h * 0.04, shade: 0.95 },
  ];
  addLoft(s, rings, seg, { capTop: true, uvScale: 20, sideShade: 0.2 });
  return s;
}

/**
 * An arm, origin at the shoulder, hanging down its own −Y.
 *
 * One piece with a hand at the end: an elbow joint would be a second mesh and a second matrix per
 * arm for a bend nobody resolves at the distance a guest is ever seen from. The taper does the
 * work — a limb of constant radius is a pipe.
 */
export function buildArm(detail: number): Surface {
  const s = newSurface();
  const length = NECK * (JOINT.shoulder - JOINT.hip * 0.42);
  const seg = detail >= 2 ? 6 : 4;
  const rings: Ring[] = [
    { y: 0, rx: 0.031, rz: 0.031, shade: 0.7 },
    { y: -length * 0.24, rx: 0.027, rz: 0.028, shade: 0.95 },
    { y: -length * 0.52, rx: 0.022, rz: 0.023, cz: 0.004, shade: 1 },
    { y: -length * 0.78, rx: 0.019, rz: 0.02, cz: 0.008, shade: 0.97 },
    { y: -length * 0.92, rx: 0.022, rz: 0.016, cz: 0.01, shade: 0.86 },
    { y: -length, rx: 0.016, rz: 0.012, cz: 0.01, shade: 0.7 },
  ];
  addLoft(s, rings, seg, { capTop: true, capBottom: true, uvScale: 12 });
  return s;
}

/** Thigh, origin at the hip, down to the knee. */
export function buildThigh(detail: number): Surface {
  const s = newSurface();
  const length = NECK * (JOINT.hip - JOINT.knee);
  const seg = detail >= 2 ? 6 : 4;
  const rings: Ring[] = [
    { y: 0.012, rx: 0.05, rz: 0.052, shade: 0.62 },
    { y: -length * 0.3, rx: 0.046, rz: 0.049, shade: 0.95 },
    { y: -length * 0.72, rx: 0.038, rz: 0.041, shade: 1 },
    { y: -length, rx: 0.034, rz: 0.036, shade: 0.9 },
  ];
  addLoft(s, rings, seg, { capTop: true, capBottom: true, uvScale: 9 });
  return s;
}

/** Shin and shoe, origin at the knee. */
export function buildShin(detail: number): Surface {
  const s = newSurface();
  const length = NECK * (JOINT.knee - JOINT.ankle);
  const seg = detail >= 2 ? 6 : 4;
  const rings: Ring[] = [
    { y: 0, rx: 0.033, rz: 0.035, shade: 0.88 },
    { y: -length * 0.34, rx: 0.031, rz: 0.034, cz: -0.003, shade: 1 },
    { y: -length * 0.75, rx: 0.023, rz: 0.024, cz: -0.004, shade: 0.96 },
    { y: -length, rx: 0.019, rz: 0.02, cz: -0.002, shade: 0.8 },
  ];
  addLoft(s, rings, seg, { capTop: true, uvScale: 9 });
  // The shoe is darker than the trousers whatever colour the trousers are: it is baked into the
  // vertex colour rather than given its own mesh, which would be two more draw calls for 12
  // triangles at the bottom of a figure.
  addShoe(s, -length - NECK * JOINT.ankle, NECK * 0.075, 0.05, NECK * JOINT.ankle * 0.9, 0.34);
  return s;
}

// ── LOD 1: four meshes, no elbows, no knees ─────────────────────────────────────────────────
/** Torso with the arms fused in a mid-stride pose. One mesh, one matrix, one colour. */
export function buildBody1(): Surface {
  const s = buildTorso(1);
  const top = NECK * (1 - JOINT.hip);
  const armLength = NECK * (JOINT.shoulder - JOINT.hip * 0.5);
  for (const side of [-1, 1]) {
    const x = side * SHOULDER_HALF * 0.92;
    const lean = side * 0.06;
    const rings: Ring[] = [
      { y: top * 0.86, rx: 0.03, rz: 0.03, cx: x, shade: 0.8 },
      { y: top * 0.86 - armLength * 0.5, rx: 0.024, rz: 0.025, cx: x + lean, cz: 0.006, shade: 1 },
      { y: top * 0.86 - armLength, rx: 0.017, rz: 0.015, cx: x + lean * 2, cz: 0.012, shade: 0.78 },
    ];
    addLoft(s, rings, 4, { capTop: true, capBottom: true, uvScale: 9 });
  }
  return s;
}

/** One leg from hip to shoe, straight. Drawn twice per guest. */
export function buildLeg1(): Surface {
  const s = newSurface();
  const length = NECK * (JOINT.hip - JOINT.ankle);
  const rings: Ring[] = [
    { y: 0.01, rx: 0.049, rz: 0.051, shade: 0.62 },
    { y: -length * 0.42, rx: 0.04, rz: 0.043, shade: 1 },
    { y: -length * 0.78, rx: 0.026, rz: 0.028, shade: 0.94 },
    { y: -length, rx: 0.02, rz: 0.021, shade: 0.8 },
  ];
  addLoft(s, rings, 4, { capTop: true, uvScale: 9 });
  addShoe(s, -length - NECK * JOINT.ankle, NECK * 0.072, 0.05, NECK * JOINT.ankle * 0.9, 0.34);
  return s;
}

// ── LOD 2: two meshes and a silhouette ──────────────────────────────────────────────────────
/**
 * The far figure. This is 90 % of the crowd in an overview frame, so it is the one that decides
 * what a park looks like from the air.
 *
 * It is NOT a box: a six-sided taper with the shoulders wider than the hips, a notch between the
 * legs and a neck, which at the 8 to 26 px a guest occupies between 80 m and 200 m is the whole
 * difference between people and gravel. The scenery module lost most of a grade to a LOD 2 that
 * was an axis-aligned rectangle, and it is the same mistake one module later.
 */
export function buildLegs2(): Surface {
  const s = newSurface();
  const legTop = NECK * JOINT.hip;
  // Two tapered stumps with a real gap between them. The gap is the point: a single block from the
  // ground to the shoulders is a bollard, and a hundred of them on a path is gravel.
  for (const side of [-1, 1]) {
    const x = side * 0.037;
    addLoft(
      s,
      [
        { y: 0, rx: 0.031, rz: 0.035, cx: x, shade: 0.5 },
        { y: legTop * 0.5, rx: 0.037, rz: 0.04, cx: x, shade: 0.85 },
        { y: legTop, rx: 0.046, rz: 0.049, cx: x * 0.78, shade: 0.78 },
      ],
      5,
      { capBottom: true, capTop: true, uvScale: 6 }
    );
  }
  return s;
}

export function buildBody2(): Surface {
  const s = newSurface();
  const legTop = NECK * JOINT.hip;
  const top = NECK;
  addLoft(
    s,
    [
      { y: legTop - 0.02, rx: HIP_HALF * 0.96, rz: HIP_HALF * 0.68, shade: 0.78 },
      {
        y: legTop + (top - legTop) * 0.45,
        rx: SHOULDER_HALF * 0.94,
        rz: HIP_HALF * 0.74,
        shade: 1,
      },
      { y: top * 0.985, rx: SHOULDER_HALF * 0.78, rz: HIP_HALF * 0.62, shade: 0.9 },
      { y: top, rx: 0.03, rz: 0.028, shade: 0.6 },
    ],
    6,
    { capTop: true, capBottom: true, uvScale: 6 }
  );
  return s;
}

/** The far head: skin and hair in one, hair baked dark into the vertex colour. */
export function buildHead2(): Surface {
  const s = newSurface();
  const h = REF_HEAD;
  addLoft(
    s,
    [
      { y: -h * 0.5, rx: h * 0.22, rz: h * 0.23, shade: 0.7 },
      { y: -h * 0.1, rx: h * 0.36, rz: h * 0.39, shade: 1 },
      { y: h * 0.22, rx: h * 0.33, rz: h * 0.35, shade: 0.78 },
      { y: h * 0.5, rx: h * 0.12, rz: h * 0.13, shade: 0.5 },
    ],
    5,
    { capTop: true, capBottom: true, uvScale: 10 }
  );
  return s;
}

/**
 * The contact patch: a disc that darkens the ground a guest is standing on.
 *
 * Every prop in this game grounds (art bible), and a crowd is where the failure is loudest — a
 * figure with nothing under it hovers, and two thousand of them hover. It is one alpha-blended
 * quad-fan of 8 triangles, drawn only for the near band.
 */
export function buildContact(): Surface {
  const s = newSurface();
  const segments = 10;
  s.positions.push(0, 0, 0);
  s.normals.push(0, 1, 0);
  s.uvs.push(0.5, 0.5);
  s.colors.push(1, 1, 1, 1);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    s.positions.push(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
    s.normals.push(0, 1, 0);
    s.uvs.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    s.colors.push(1, 1, 1, 1);
  }
  for (let i = 0; i < segments; i++) s.indices.push(0, i + 2, i + 1);
  return s;
}

export function surfaceTriangles(s: Surface): number {
  return s.indices.length / 3;
}
