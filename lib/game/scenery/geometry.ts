/**
 * Geometry primitives every generator builds out of.
 *
 * A `Surface` is a plain array accumulator — positions, normals, uvs, vertex colours, a per-vertex
 * wind weight and indices — and a generator is a sequence of calls that append to one. The mesh is
 * created once at the end, so a bench is one draw call rather than eleven parented boxes, and the
 * whole prop can be thin-instanced.
 *
 * **Winding.** The scene is right-handed (`scene.useRightHandedSystem = true`) and Babylon's
 * default side orientation flips with it, so a triangle whose vertices are counter-clockwise seen
 * from the front is emitted with its last two indices swapped — `cross(v1-v0, v2-v0)` points
 * AWAY from the visible side here. `terrain/chunks.ts` records what getting this wrong looks like
 * (every ground chunk back-face culled, a park of black holes). Every generator in this module
 * authors counter-clockwise from outside and lets {@link tri} apply the convention once.
 *
 * **Colour is linear.** `vColor` is multiplied into `surfaceAlbedo` after the albedo texture has
 * been linearised, so a palette written in sRGB would come out washed. {@link srgb} does the
 * conversion, which is why the palettes in the generators read as hex a colour picker would show.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';

export interface Surface {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  /** 0 = rigid, 1 = the tip of a branch. Read by the wind plugin's vertex shader. */
  sway: number[];
  indices: number[];
}

export type Rgb = [number, number, number];

export function newSurface(): Surface {
  return { positions: [], normals: [], uvs: [], colors: [], sway: [], indices: [] };
}

/** sRGB hex to linear RGB. */
export function srgb(hex: number): Rgb {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return [f((hex >> 16) & 255), f((hex >> 8) & 255), f(hex & 255)];
}

export function tintRgb(c: Rgb, factor: number): Rgb {
  return [c[0] * factor, c[1] * factor, c[2] * factor];
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Append one vertex, return its index. */
export function vertex(
  s: Surface,
  px: number,
  py: number,
  pz: number,
  nx: number,
  ny: number,
  nz: number,
  u: number,
  v: number,
  colour: Rgb,
  sway: number
): number {
  const index = s.positions.length / 3;
  s.positions.push(px, py, pz);
  s.normals.push(nx, ny, nz);
  s.uvs.push(u, v);
  s.colors.push(colour[0], colour[1], colour[2], 1);
  s.sway.push(sway);
  return index;
}

/** Vertices counter-clockwise as seen from the front. See the winding note at the top. */
export function tri(s: Surface, a: number, b: number, c: number): void {
  s.indices.push(a, c, b);
}

export function quad(s: Surface, a: number, b: number, c: number, d: number): void {
  tri(s, a, b, c);
  tri(s, a, c, d);
}

// ── Frames ─────────────────────────────────────────────────────────────────────────────────

/** An orthonormal frame around a direction, used to sweep a ring along a branch. */
export function frameFor(dx: number, dy: number, dz: number): { u: Rgb; v: Rgb; w: Rgb } {
  const len = Math.hypot(dx, dy, dz) || 1;
  const w: Rgb = [dx / len, dy / len, dz / len];
  const ref: Rgb = Math.abs(w[1]) > 0.94 ? [1, 0, 0] : [0, 1, 0];
  const u: Rgb = [
    ref[1] * w[2] - ref[2] * w[1],
    ref[2] * w[0] - ref[0] * w[2],
    ref[0] * w[1] - ref[1] * w[0],
  ];
  const ul = Math.hypot(u[0], u[1], u[2]) || 1;
  u[0] /= ul;
  u[1] /= ul;
  u[2] /= ul;
  const v: Rgb = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
  return { u, v, w };
}

// ── Primitives ─────────────────────────────────────────────────────────────────────────────

export interface BoxOptions {
  colour: Rgb;
  sway?: number;
  /** Texture metres per unit; the UVs are laid out in world scale so the grain matches. */
  uvScale?: number;
  yaw?: number;
}

/** An axis-aligned box (optionally yawed), centred on `cx, cy, cz`. */
export function addBox(
  s: Surface,
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  opts: BoxOptions
): void {
  const { colour } = opts;
  const sway = opts.sway ?? 0;
  const uv = opts.uvScale ?? 1;
  const yaw = opts.yaw ?? 0;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const faces: Array<{ n: Rgb; corners: Array<[number, number, number]>; w: number; h: number }> = [
    {
      n: [0, 0, 1],
      corners: [
        [-hx, -hy, hz],
        [hx, -hy, hz],
        [hx, hy, hz],
        [-hx, hy, hz],
      ],
      w: sx,
      h: sy,
    },
    {
      n: [0, 0, -1],
      corners: [
        [hx, -hy, -hz],
        [-hx, -hy, -hz],
        [-hx, hy, -hz],
        [hx, hy, -hz],
      ],
      w: sx,
      h: sy,
    },
    {
      n: [1, 0, 0],
      corners: [
        [hx, -hy, hz],
        [hx, -hy, -hz],
        [hx, hy, -hz],
        [hx, hy, hz],
      ],
      w: sz,
      h: sy,
    },
    {
      n: [-1, 0, 0],
      corners: [
        [-hx, -hy, -hz],
        [-hx, -hy, hz],
        [-hx, hy, hz],
        [-hx, hy, -hz],
      ],
      w: sz,
      h: sy,
    },
    {
      n: [0, 1, 0],
      corners: [
        [-hx, hy, hz],
        [hx, hy, hz],
        [hx, hy, -hz],
        [-hx, hy, -hz],
      ],
      w: sx,
      h: sz,
    },
    {
      n: [0, -1, 0],
      corners: [
        [-hx, -hy, -hz],
        [hx, -hy, -hz],
        [hx, -hy, hz],
        [-hx, -hy, hz],
      ],
      w: sx,
      h: sz,
    },
  ];
  for (const face of faces) {
    const nx = face.n[0] * cos + face.n[2] * sin;
    const nz = -face.n[0] * sin + face.n[2] * cos;
    const idx: number[] = [];
    const uvs: Array<[number, number]> = [
      [0, 0],
      [face.w / uv, 0],
      [face.w / uv, face.h / uv],
      [0, face.h / uv],
    ];
    face.corners.forEach((corner, i) => {
      const px = corner[0] * cos + corner[2] * sin;
      const pz = -corner[0] * sin + corner[2] * cos;
      idx.push(
        vertex(
          s,
          cx + px,
          cy + corner[1],
          cz + pz,
          nx,
          face.n[1],
          nz,
          uvs[i][0],
          uvs[i][1],
          colour,
          sway
        )
      );
    });
    quad(s, idx[0], idx[1], idx[2], idx[3]);
  }
}

export interface TubeRing {
  x: number;
  y: number;
  z: number;
  radius: number;
  /** Wind weight of this ring; interpolated across the segment. */
  sway: number;
  colour: Rgb;
}

/**
 * Sweep a circular profile through a list of rings — trunks, branches, posts, rails, hoops.
 *
 * The frame is re-derived per ring from the direction to the next one rather than carried along
 * the curve. A parallel-transport frame is the better answer for a tight helix; for a trunk that
 * bends four degrees per segment the difference is invisible and the failure mode of the simple
 * version (a flip when the direction crosses vertical) is handled inside `frameFor`.
 */
export function addTube(
  s: Surface,
  rings: TubeRing[],
  sides: number,
  opts: { uvScale?: number; capStart?: boolean; capEnd?: boolean; twist?: number } = {}
): void {
  if (rings.length < 2) return;
  const uvScale = opts.uvScale ?? 1;
  const twist = opts.twist ?? 0;
  const loops: number[][] = [];
  let along = 0;
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    const next = rings[Math.min(i + 1, rings.length - 1)];
    const prev = rings[Math.max(i - 1, 0)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const dz = next.z - prev.z;
    const { u, v, w } = frameFor(dx || 0, dy || 1, dz || 0);
    if (i > 0) {
      along += Math.hypot(ring.x - prev.x, ring.y - prev.y, ring.z - prev.z);
    }
    const loop: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2 + twist * along;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const nx = u[0] * ca + v[0] * sa;
      const ny = u[1] * ca + v[1] * sa;
      const nz = u[2] * ca + v[2] * sa;
      loop.push(
        vertex(
          s,
          ring.x + nx * ring.radius,
          ring.y + ny * ring.radius,
          ring.z + nz * ring.radius,
          nx,
          ny,
          nz,
          (k / sides) * ((Math.PI * 2 * ring.radius) / uvScale),
          along / uvScale,
          ring.colour,
          ring.sway
        )
      );
    }
    loops.push(loop);
    void w;
  }
  for (let i = 0; i < loops.length - 1; i++) {
    const a = loops[i];
    const b = loops[i + 1];
    for (let k = 0; k < sides; k++) {
      quad(s, a[k], a[k + 1], b[k + 1], b[k]);
    }
  }
  if (opts.capStart) capRing(s, rings[0], sides, -1);
  if (opts.capEnd) capRing(s, rings[rings.length - 1], sides, 1);
}

function capRing(s: Surface, ring: TubeRing, sides: number, dir: number): void {
  const centre = vertex(s, ring.x, ring.y, ring.z, 0, dir, 0, 0.5, 0.5, ring.colour, ring.sway);
  const rim: number[] = [];
  for (let k = 0; k <= sides; k++) {
    const a = (k / sides) * Math.PI * 2;
    rim.push(
      vertex(
        s,
        ring.x + Math.cos(a) * ring.radius,
        ring.y,
        ring.z + Math.sin(a) * ring.radius,
        0,
        dir,
        0,
        0.5 + Math.cos(a) * 0.5,
        0.5 + Math.sin(a) * 0.5,
        ring.colour,
        ring.sway
      )
    );
  }
  for (let k = 0; k < sides; k++) {
    if (dir > 0) tri(s, centre, rim[k], rim[k + 1]);
    else tri(s, centre, rim[k + 1], rim[k]);
  }
}

/** A surface of revolution from a `[radius, y]` profile — bins, planters, fountains, lamp heads. */
export function addLathe(
  s: Surface,
  cx: number,
  cy: number,
  cz: number,
  profile: Array<[number, number]>,
  sides: number,
  opts: { colour: Rgb; sway?: number; uvScale?: number; closeBottom?: boolean }
): void {
  const sway = opts.sway ?? 0;
  const uvScale = opts.uvScale ?? 1;
  const loops: number[][] = [];
  for (let i = 0; i < profile.length; i++) {
    const [r, y] = profile[i];
    const prev = profile[Math.max(0, i - 1)];
    const next = profile[Math.min(profile.length - 1, i + 1)];
    // The profile's own tangent gives the ring's normal tilt, so a cone shades as a cone.
    const tr = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const nl = Math.hypot(tr, ty) || 1;
    const nr = ty / nl;
    const ny = -tr / nl;
    const loop: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      loop.push(
        vertex(
          s,
          cx + ca * r,
          cy + y,
          cz + sa * r,
          ca * nr,
          ny,
          sa * nr,
          (k / sides) * ((Math.PI * 2 * Math.max(r, 0.05)) / uvScale),
          y / uvScale,
          opts.colour,
          sway
        )
      );
    }
    loops.push(loop);
  }
  for (let i = 0; i < loops.length - 1; i++) {
    const a = loops[i];
    const b = loops[i + 1];
    for (let k = 0; k < sides; k++) quad(s, a[k], a[k + 1], b[k + 1], b[k]);
  }
  if (opts.closeBottom) {
    const [r, y] = profile[0];
    capRing(s, { x: cx, y: cy + y, z: cz, radius: r, sway, colour: opts.colour }, sides, -1);
  }
}

/** A flat disc facing +Y. */
export function addDisc(
  s: Surface,
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  sides: number,
  colour: Rgb,
  sway = 0
): void {
  capRing(s, { x: cx, y: cy, z: cz, radius, sway, colour }, sides, 1);
}

export interface CardOptions {
  colour: Rgb;
  sway: number;
  /** Bend the card's corners back so it reads as a shell rather than as a plate. */
  cup?: number;
  /** UV sub-rect, so one texture can hold several cluster variants. */
  uv?: [number, number, number, number];
  /** Normals are pushed towards the outward direction: a flat card lit flat looks like paper. */
  outward?: Rgb;
  /**
   * Half-width multipliers from the bottom edge to the top. `undefined` is the rectangle.
   *
   * This exists because of what a rectangle looks like from three hundred metres. The far foliage
   * imposter was two or three of these cards crossed, and a critic counting instances in the demo
   * park found 1,289 of 1,290 trees drawn as one: a spruce came out as a rectangle and a broadleaf
   * as a disc of leaves on a bare stick, which reads as a palm grove across the whole mid-ground.
   * The first diagnosis was that the imposter had no per-species branch; it has one, and both
   * branches ended in the same quad. **The silhouette is the only thing left at that distance**,
   * so it is the one thing the imposter has to get right, and a profile is what a quad is missing.
   *
   * Costed against the alternative before it was written: pushing the LOD break out far enough to
   * draw real trees at the overview camera adds 263,000 triangles and doubles the frame; giving
   * the imposter a profile adds about 20,600, i.e. 6.9 %.
   */
  profile?: readonly number[];
  /** Emit the back face as geometry. Only for a card on a back-face-culled material. */
  doubleSided?: boolean;
}

/**
 * A quad in an arbitrary frame — one leaf cluster, one flag panel, one blade of grass.
 *
 * `outward` is what stops a canopy reading as cardboard: the card's own normal is its plane, but
 * the light should behave as if the leaves faced away from the middle of the tree, so the vertex
 * normals are blended towards a supplied direction.
 */
export function addCard(
  s: Surface,
  centre: Rgb,
  right: Rgb,
  up: Rgb,
  halfWidth: number,
  halfHeight: number,
  opts: CardOptions
): void {
  const uv = opts.uv ?? [0, 0, 1, 1];
  const cup = opts.cup ?? 0;
  const nx = right[1] * up[2] - right[2] * up[1];
  const ny = right[2] * up[0] - right[0] * up[2];
  const nz = right[0] * up[1] - right[1] * up[0];
  const nl = Math.hypot(nx, ny, nz) || 1;
  const plane: Rgb = [nx / nl, ny / nl, nz / nl];
  const outward = opts.outward ?? plane;
  const blend = opts.outward ? 0.75 : 0;
  const n: Rgb = [
    plane[0] * (1 - blend) + outward[0] * blend,
    plane[1] * (1 - blend) + outward[1] * blend,
    plane[2] * (1 - blend) + outward[2] * blend,
  ];
  const ln = Math.hypot(n[0], n[1], n[2]) || 1;
  const profile = opts.profile ?? [1, 1];
  const rows = profile.length;
  // One row of two vertices per profile entry, stitched into a strip. With the default `[1, 1]`
  // that is the same four vertices and the same single quad the rectangle always was.
  const left: number[] = [];
  const rightIdx: number[] = [];
  for (let r = 0; r < rows; r++) {
    const t = rows === 1 ? 0 : r / (rows - 1);
    const sy = t * 2 - 1;
    const w = profile[r] ?? 1;
    const v = uv[1] + (uv[3] - uv[1]) * t;
    for (const sx of [-1, 1]) {
      const dip = cup * (sx * sx * w * w + sy * sy) * 0.5;
      const u = sx < 0 ? uv[0] : uv[2];
      const id = vertex(
        s,
        centre[0] + right[0] * sx * w * halfWidth + up[0] * sy * halfHeight - plane[0] * dip,
        centre[1] + right[1] * sx * w * halfWidth + up[1] * sy * halfHeight - plane[1] * dip,
        centre[2] + right[2] * sx * w * halfWidth + up[2] * sy * halfHeight - plane[2] * dip,
        n[0] / ln,
        n[1] / ln,
        n[2] / ln,
        u,
        v,
        opts.colour,
        opts.sway
      );
      if (sx < 0) left.push(id);
      else rightIdx.push(id);
    }
  }
  for (let r = 0; r < rows - 1; r++) {
    quad(s, left[r]!, rightIdx[r]!, rightIdx[r + 1]!, left[r + 1]!);
  }
  // A card is seen from both sides, and the cheap way to say so is `backFaceCulling = false` on
  // the material rather than a second copy of the quad: doubling the geometry doubles a canopy's
  // triangle count for a result the rasteriser already gives away. `doubleSided` exists for the
  // one case that cannot do it that way — a panel on a material shared with culled geometry.
  if (opts.doubleSided) {
    for (let r = rows - 1; r > 0; r--) {
      quad(s, left[r]!, rightIdx[r]!, rightIdx[r - 1]!, left[r - 1]!);
    }
  }
}

/**
 * A lumpy sphere — boulders, shrubs, hedge tops.
 *
 * The lumps come from a deterministic radial displacement rather than from a noise texture, so the
 * silhouette changes with the seed. A boulder whose outline is a circle is the single clearest
 * "this was generated" tell there is.
 */
export function addBlob(
  s: Surface,
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  segments: number,
  opts: {
    colour: Rgb;
    sway?: number;
    squashY?: number;
    lumps?: number;
    seed: number;
    uvScale?: number;
    /** Flatten everything below this local Y, so a boulder sits in the ground. */
    floorY?: number;
    displace?: (x: number, y: number, z: number) => number;
  }
): void {
  const rings = Math.max(4, segments);
  const sides = Math.max(6, segments * 2);
  const squash = opts.squashY ?? 1;
  const lumps = opts.lumps ?? 0.22;
  const sway = opts.sway ?? 0;
  const uvScale = opts.uvScale ?? 1;
  const grid: number[][] = [];
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI;
    const sy = Math.cos(phi);
    const sr = Math.sin(phi);
    const loop: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const theta = (k / sides) * Math.PI * 2;
      const ux = Math.cos(theta) * sr;
      const uy = sy;
      const uz = Math.sin(theta) * sr;
      const wobble =
        1 +
        lumps *
          (Math.sin(ux * 3.1 + opts.seed * 0.017) * 0.5 +
            Math.sin(uy * 4.3 + opts.seed * 0.031) * 0.3 +
            Math.sin(uz * 2.7 + opts.seed * 0.013) * 0.4) +
        (opts.displace?.(ux, uy, uz) ?? 0);
      const r = radius * wobble;
      let py = uy * r * squash;
      if (opts.floorY != null && py < opts.floorY) py = opts.floorY;
      loop.push(
        vertex(
          s,
          cx + ux * r,
          cy + py,
          cz + uz * r,
          ux,
          uy / Math.max(squash, 0.05),
          uz,
          ((k / sides) * (Math.PI * 2 * radius)) / uvScale,
          ((i / rings) * (Math.PI * radius)) / uvScale,
          opts.colour,
          sway
        )
      );
    }
    grid.push(loop);
  }
  for (let i = 0; i < rings; i++) {
    for (let k = 0; k < sides; k++) {
      quad(s, grid[i][k], grid[i][k + 1], grid[i + 1][k + 1], grid[i + 1][k]);
    }
  }
}

// ── Mesh creation ──────────────────────────────────────────────────────────────────────────

export function surfaceTriangles(s: Surface): number {
  return s.indices.length / 3;
}

/**
 * Turn a surface into a mesh.
 *
 * `swayWeight` goes on with `setVerticesData` rather than through `VertexData`: `VertexData.set`
 * silently ignores a kind it does not know (its switch has no default), so a custom attribute
 * routed that way is a buffer that never reaches the GPU and a wind shader that reads zero.
 */
export function toMesh(
  scene: Scene,
  name: string,
  s: Surface,
  material: Material,
  options: { pickable?: boolean } = {}
): Mesh {
  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = new Float32Array(s.positions);
  data.normals = new Float32Array(s.normals);
  data.uvs = new Float32Array(s.uvs);
  data.colors = new Float32Array(s.colors);
  data.indices = s.indices.length > 65000 ? new Uint32Array(s.indices) : new Uint16Array(s.indices);
  data.applyToMesh(mesh, false);
  mesh.setVerticesData('swayWeight', new Float32Array(s.sway), false, 1);
  mesh.material = material;
  mesh.isPickable = options.pickable ?? false;
  mesh.receiveShadows = true;
  // Vertex alpha is always 1 here, and `hasVertexAlpha` would push every prop into the
  // transparent pass — sorted, unlit by the depth prepass, and drawn over the ground.
  mesh.hasVertexAlpha = false;
  return mesh;
}
