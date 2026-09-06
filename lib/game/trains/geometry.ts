/**
 * The car, built from the real thing.
 *
 * **The reference, before any of it was written.** A modern steel sit-down coaster car (B&M, Mack,
 * Intamin, Vekoma) is four things stacked in a fixed order, and every number below is one of them:
 *
 * - **A chassis** — two longitudinal beams over the rails, carrying two **bogies** about 1.8 m
 *   apart. Each bogie carries, PER RAIL, three wheels, and it is the three that make a coaster a
 *   coaster rather than a train: a **road wheel** on top of the rail (polyurethane, ~30 cm across,
 *   ~10 cm wide), an **upstop wheel** underneath it that stops the car leaving the track in
 *   airtime, and a **guide wheel** on the inboard face with a vertical axis that takes the lateral
 *   load. Six wheels per bogie, twelve per car. Leave any of the three off and the assembly reads
 *   as a bogie off a tram.
 * - **A shell** — moulded fibreglass over the chassis, 1.7–1.9 m wide, sides about 0.6 m tall, with
 *   a valance skirting the chassis so the wheels are half-hidden from the side. Wider than the
 *   gauge, which is why a coaster train looks like it is balanced on a wire from head on.
 * - **The seating** — two across, one or two rows a car, in a moulded bucket with a headrest. The
 *   footwell drops BETWEEN the rails, which is the only way the geometry closes: the rider's chest
 *   is 1.1 m above the rail plane (that is what a heartline is) and the seat pan 0.6 m below the
 *   chest, so the pan sits 0.5 m over the rail — barely above the chassis — and the feet have to go
 *   somewhere lower. They go in the 1.16 m of clear width between the two rails.
 * - **The restraint** — an over-the-shoulder harness on anything that inverts or pulls hard, a lap
 *   bar on anything that does not. Which one a train gets is a content decision made in
 *   `manifest.ts` from the ride's own comfort limits; this file only draws what it is told.
 *
 * **Every measurement is relative to the spline, and the spline is the rider's chest.** `track`
 * builds the heartline and steps 1.1 m down the frame's up-vector to lay the rails
 * (`track/profile.ts`), so a car drawn against any other origin floats or sinks into its own
 * track. `RAIL` below is that number, imported and not retyped.
 *
 * **Vertex colours are the shading and the instance colour is the paint** — the same split
 * `guests/geometry.ts` uses and for the same reason: the occlusion under the valance, inside the
 * footwell and behind the seat backs is baked once here and survives every livery. Without it a
 * train is untextured primitives in flat colours, which is the art bible's definition of programmer
 * art.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import { HEARTLINE_HEIGHT } from '../track';
import type { TrainProfile } from './types';

/** The rail plane, in car-local metres. Negative: the rails are below the rider. */
export const RAIL = -HEARTLINE_HEIGHT;

/** Road-wheel radius, m. A coaster road wheel is about 30 cm across. */
const ROAD_WHEEL_R = 0.155;
const ROAD_WHEEL_HALF = 0.05;
/** Upstop and guide wheels are smaller; they carry load only in airtime and in a turn. */
const SMALL_WHEEL_R = 0.085;
const SMALL_WHEEL_HALF = 0.04;
/** Gap between two cars, m — the coupler. */
const COUPLER_GAP = 0.16;

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

export function surfaceTriangles(s: Surface): number {
  return s.indices.length / 3;
}

function vertex(s: Surface, x: number, y: number, z: number, u: number, v: number, shade: number) {
  const index = s.positions.length / 3;
  s.positions.push(x, y, z);
  s.normals.push(0, 0, 0);
  s.uvs.push(u, v);
  s.colors.push(shade, shade, shade, 1);
  return index;
}

/**
 * Two triangles for a quad given as (a, b) on one edge and (c, d) on the facing edge, wound the
 * way `guests/geometry.ts` winds its lofts.
 *
 * The winding in this scene is counter-intuitive and it is not this module's discovery — the
 * terrain, paths and track modules all carry the note: `scene.useRightHandedSystem = true`, and
 * getting it backwards throws nothing and warns nothing, it simply culls every face and the train
 * renders as an invisible mesh with the right vertex count in the inspector. This order is copied
 * from the one crowd renderer in the project whose output has been photographed 850 times.
 */
function quad(s: Surface, a: number, b: number, c: number, d: number): void {
  s.indices.push(a, c, b, b, c, d);
}

/** A box with hard edges: 24 vertices, so `finishNormals` cannot round the corners off. */
function addBox(
  s: Surface,
  min: readonly [number, number, number],
  max: readonly [number, number, number],
  shade: number,
  uvScale = 1
): void {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const face = (
    p: Array<readonly [number, number, number]>,
    faceShade: number,
    su: number,
    sv: number
  ) => {
    const a = vertex(s, p[0][0], p[0][1], p[0][2], 0, 0, faceShade);
    const b = vertex(s, p[1][0], p[1][1], p[1][2], su, 0, faceShade);
    const c = vertex(s, p[3][0], p[3][1], p[3][2], 0, sv, faceShade);
    const d = vertex(s, p[2][0], p[2][1], p[2][2], su, sv, faceShade);
    quad(s, a, b, c, d);
  };
  const w = (x1 - x0) * uvScale;
  const h = (y1 - y0) * uvScale;
  const l = (z1 - z0) * uvScale;
  // The top of a thing catches the sky and its underside does not; that difference is what gives
  // an untextured box a form before any light touches it.
  face(
    [
      [x0, y1, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    shade,
    w,
    l
  );
  face(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y0, z0],
      [x0, y0, z0],
    ],
    shade * 0.55,
    w,
    l
  );
  face(
    [
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
      [x0, y0, z0],
    ],
    shade * 0.82,
    l,
    h
  );
  face(
    [
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x1, y0, z1],
    ],
    shade * 0.82,
    l,
    h
  );
  face(
    [
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
      [x1, y0, z0],
    ],
    shade * 0.9,
    w,
    h
  );
  face(
    [
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
      [x0, y0, z1],
    ],
    shade * 0.9,
    w,
    h
  );
}

/** One cross-section of a loft: a closed polygon in the car's (x, y) plane at a given z. */
export interface Section {
  z: number;
  points: Array<readonly [number, number]>;
  shade: number;
}

/**
 * Loft a run of sections along +Z.
 *
 * Every section needs the same point count and the same winding; the sections are authored
 * counter-clockwise seen from behind the car (looking along +Z), which puts the outward normal on
 * the outside of the shell.
 */
function addLoft(s: Surface, sections: readonly Section[], options: { cap?: boolean } = {}): void {
  const n = sections[0].points.length;
  const start = s.positions.length / 3;
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    for (let k = 0; k <= n; k++) {
      const p = sec.points[k % n];
      // A surface facing up catches the sky and one facing down does not. Baked here, because it
      // is what gives an untextured shell a form at twenty metres where the normal map has given
      // up — the same term `guests/geometry.ts` uses on a limb.
      const rise = p[1] / Math.max(0.25, Math.abs(p[0]) + Math.abs(p[1]));
      vertex(
        s,
        p[0],
        p[1],
        sec.z,
        (k / n) * 2,
        sec.z,
        sec.shade * (0.84 + 0.16 * (0.5 + 0.5 * rise))
      );
    }
  }
  const stride = n + 1;
  for (let i = 0; i + 1 < sections.length; i++) {
    for (let k = 0; k < n; k++) {
      const a = start + i * stride + k;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      quad(s, a, b, c, d);
    }
  }
  if (options.cap) {
    capSection(s, sections[0], false);
    capSection(s, sections[sections.length - 1], true);
  }
}

function capSection(s: Surface, sec: Section, front: boolean): void {
  const n = sec.points.length;
  let cx = 0;
  let cy = 0;
  for (const p of sec.points) {
    cx += p[0];
    cy += p[1];
  }
  cx /= n;
  cy /= n;
  const centre = vertex(s, cx, cy, sec.z, 0.5, 0.5, sec.shade * 0.85);
  const first = s.positions.length / 3;
  for (let k = 0; k <= n; k++) {
    const p = sec.points[k % n];
    vertex(s, p[0], p[1], sec.z, 0.5 + p[0], 0.5 + p[1], sec.shade * 0.85);
  }
  for (let k = 0; k < n; k++) {
    if (front) s.indices.push(centre, first + k, first + k + 1);
    else s.indices.push(centre, first + k + 1, first + k);
  }
}

/** A cylinder whose axis runs along +X — a road wheel or an upstop wheel. */
function addWheelX(
  s: Surface,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  half: number,
  shade: number,
  segments = 12
): void {
  // Rings in the (y, z) plane at four x positions: the two outer ones are the rim shoulders, which
  // is what stops a wheel reading as a flat disc when the sun is behind it.
  const start = s.positions.length / 3;
  const rings = [
    { x: cx - half, shade: shade * 0.62 },
    { x: cx - half * 0.72, shade },
    { x: cx + half * 0.72, shade },
    { x: cx + half, shade: shade * 0.62 },
  ];
  for (const ring of rings) {
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const y = cy + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      // The bottom of a wheel is in its own shadow.
      const shade2 = ring.shade * (0.72 + 0.28 * (0.5 + 0.5 * Math.cos(a)));
      vertex(s, ring.x, y, z, (i / segments) * 2, ring.x, shade2);
    }
  }
  const stride = segments + 1;
  for (let r0 = 0; r0 + 1 < rings.length; r0++) {
    for (let i = 0; i < segments; i++) {
      const a = start + r0 * stride + i;
      quad(s, a, a + 1, a + stride, a + stride + 1);
    }
  }
  capWheel(s, cx - half, cy, cz, r, segments, shade * 0.55, false);
  capWheel(s, cx + half, cy, cz, r, segments, shade * 0.55, true);
}

function capWheel(
  s: Surface,
  x: number,
  cy: number,
  cz: number,
  r: number,
  segments: number,
  shade: number,
  positive: boolean
): void {
  const centre = vertex(s, x, cy, cz, 0.5, 0.5, shade);
  const first = s.positions.length / 3;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    vertex(s, x, cy + Math.cos(a) * r, cz + Math.sin(a) * r, 0.5, 0.5, shade);
  }
  for (let i = 0; i < segments; i++) {
    if (positive) s.indices.push(centre, first + i + 1, first + i);
    else s.indices.push(centre, first + i, first + i + 1);
  }
}

/** A cylinder whose axis runs along +Y — a guide wheel, which takes the lateral load. */
function addWheelY(
  s: Surface,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  half: number,
  shade: number,
  segments = 10
): void {
  const start = s.positions.length / 3;
  const rings = [
    { y: cy - half, shade: shade * 0.62 },
    { y: cy - half * 0.7, shade },
    { y: cy + half * 0.7, shade },
    { y: cy + half, shade: shade * 0.62 },
  ];
  for (const ring of rings) {
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      vertex(
        s,
        cx + Math.cos(a) * r,
        ring.y,
        cz + Math.sin(a) * r,
        (i / segments) * 2,
        ring.y,
        ring.shade
      );
    }
  }
  const stride = segments + 1;
  for (let r0 = 0; r0 + 1 < rings.length; r0++) {
    for (let i = 0; i < segments; i++) {
      const a = start + r0 * stride + i;
      quad(s, a, a + 1, a + stride, a + stride + 1);
    }
  }
}

/** Area-weighted smooth normals, computed once per mesh at boot. */
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
  // Vertex alpha is 1 everywhere; `hasVertexAlpha` would push every car into the transparent pass,
  // sorted per instance, drawn over the track it is standing on.
  mesh.hasVertexAlpha = false;
  mesh.isVisible = false;
  mesh.thinInstanceCount = 0;
  mesh.freezeWorldMatrix();
  // The instance buffer is rewritten every frame; syncing a bounding box over it twenty times a
  // second is the kind of hidden cost that shows up as a flat frame budget.
  mesh.doNotSyncBoundingInfo = true;
  mesh.alwaysSelectAsActiveMesh = true;
  return mesh;
}

// ── the car ─────────────────────────────────────────────────────────────────────────────────

/** The measurements every part is built from, solved once from the profile and the track style. */
export interface CarMetrics {
  length: number;
  width: number;
  height: number;
  /** Rail centres at ±gauge/2. */
  gauge: number;
  railRadius: number;
  railTop: number;
  /** Wheel axle height. */
  axleY: number;
  /** Underside of the chassis beams. */
  chassisY: number;
  /** Bottom edge of the painted shell — the valance that hides the running gear. */
  shellBottom: number;
  /** The rim: the top edge of the tub's side wall, which a rider's shoulders sit above. */
  shellTop: number;
  /** The seat pan. */
  seatY: number;
  /** The floor of the tub, inside the shell. */
  floorY: number;
  /** Thickness of the shell's wall, metres. */
  wall: number;
  /** Top of the headrest. */
  headTop: number;
  /** Bogie centres at ±wheelbase/2. */
  wheelbase: number;
  rows: number;
  perRow: number;
}

export function carMetrics(profile: TrainProfile, gauge: number, railRadius: number): CarMetrics {
  const railTop = RAIL + railRadius;
  const axleY = railTop + ROAD_WHEEL_R;
  const chassisY = axleY + ROAD_WHEEL_R + 0.02;
  const shellBottom = chassisY - 0.06;
  const rows = Math.max(1, Math.round(profile.seatsPerCar / profile.seatsPerRow));
  return {
    length: profile.carLength - COUPLER_GAP,
    width: profile.carWidth,
    height: profile.carHeight,
    gauge,
    railRadius,
    railTop,
    axleY,
    chassisY,
    shellBottom,
    wall: 0.045,
    // The rim sits just under the rider's shoulder: a coaster car's sides come up to about waist
    // height on a seated adult, which is what lets a photograph of a train read as people rather
    // than as a row of crates. Scaled by the manifest's `car.height`, so a low-slung launch train
    // gets a low rim and a classic wooden one a high one.
    shellTop: shellBottom + profile.carHeight * 0.56,
    // The rider's chest is y = 0 by definition of the heartline, and a seated adult's chest is
    // a little over half a metre above the pan. That is what fixes the pan; everything else
    // follows from it.
    seatY: -0.55,
    floorY: shellBottom + 0.06,
    headTop: shellBottom + profile.carHeight * 0.83,
    wheelbase: Math.max(1.1, profile.carLength - 1.25),
    rows,
    perRow: profile.seatsPerRow,
  };
}

/** A rounded rectangle, counter-clockwise seen from behind the car. */
function shellSection(
  halfWidth: number,
  bottom: number,
  top: number,
  corner: number
): Array<readonly [number, number]> {
  const r = Math.min(corner, halfWidth * 0.8, (top - bottom) * 0.45);
  const out: Array<readonly [number, number]> = [];
  const arc = (cx: number, cy: number, from: number, to: number) => {
    for (let i = 0; i <= 3; i++) {
      const a = from + ((to - from) * i) / 3;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  arc(halfWidth - r, bottom + r, -Math.PI / 2, 0);
  arc(halfWidth - r, top - r, 0, Math.PI / 2);
  arc(-halfWidth + r, top - r, Math.PI / 2, Math.PI);
  arc(-halfWidth + r, bottom + r, Math.PI, (3 * Math.PI) / 2);
  return out;
}

/**
 * The painted shell: an open tub with a wall, a floor and a rim.
 *
 * **It was a sealed box for one round and the seats were inside it.** `shellSection` returns a
 * closed rounded rectangle and the first version lofted it with both ends capped, which is a
 * lidded crate: the onboard camera at 7 m behind a train on the lift photographed six smooth
 * yellow humps with nothing in them, and every seat, headrest and shoulder harness in the module
 * was drawn inside a solid roof. A coaster car is open on top, and that is the whole reason a
 * train reads as people rather than as freight.
 *
 * So the section is the WALL's own cross-section: the outer contour down one side, under the
 * floor and up the other, then across the rim and back along the inner contour. That is a closed,
 * non-convex polygon, which the loft handles fine — but a centroid fan cannot cap it, because the
 * centroid is inside the cavity. The ends are closed by a ribbon between the two contours (the
 * exposed edge of the wall) plus a solid bulkhead across the cavity, which is what a real car has
 * at each end anyway.
 */
export function buildShell(m: CarMetrics): Surface {
  const s = newSurface();
  const half = m.width / 2;
  const zEnd = m.length / 2;
  const zs = [-zEnd, -zEnd * 0.72, -zEnd * 0.3, zEnd * 0.3, zEnd * 0.72, zEnd];
  const built = zs.map((z) => {
    const t = Math.abs(z) / zEnd;
    // A gentle tuck at both ends: a coaster car is not a box, and the taper is what makes a
    // seven-car train read as one object rather than as seven crates.
    const taper = 1 - 0.13 * t * t * t;
    const outer = tubContour(half * taper, m.shellBottom + 0.02 * t, m.shellTop, 0.15);
    const inner = tubContour(
      half * taper - m.wall,
      m.shellBottom + 0.02 * t + m.wall,
      m.shellTop,
      0.11
    );
    return { z, outer, inner, shade: 1 - 0.06 * t };
  });
  const sections: Section[] = built.map((b) => ({
    z: b.z,
    points: [...b.outer, ...[...b.inner].reverse()],
    shade: b.shade,
  }));
  addLoft(s, sections);

  // The exposed edge of the wall at each end, and the bulkhead behind it.
  capTub(s, built[0], -1);
  capTub(s, built[built.length - 1], 1);
  for (const end of [-1, 1]) {
    const innerHalf = half - m.wall * 2;
    const at = end * (zEnd - m.wall * 2);
    addBox(
      s,
      [-innerHalf, m.floorY - 0.02, Math.min(at, at + end * m.wall * 1.6)],
      [innerHalf, m.shellTop - 0.01, Math.max(at, at + end * m.wall * 1.6)],
      0.78
    );
  }

  // The floor of the tub.
  addBox(
    s,
    [-half + m.wall, m.floorY - 0.03, -zEnd + m.wall],
    [half - m.wall, m.floorY, zEnd - m.wall],
    0.6
  );
  return s;
}

/**
 * Half a rounded rectangle: down one side, under the floor and up the other, ending on the rim.
 *
 * Counter-clockwise in (x right, y up), which is the winding the closed sections in this file
 * already use and which `addLoft` turns into outward normals.
 */
function tubContour(
  halfWidth: number,
  bottom: number,
  top: number,
  corner: number
): Array<readonly [number, number]> {
  const r = Math.min(corner, halfWidth * 0.7, (top - bottom) * 0.4);
  const out: Array<readonly [number, number]> = [];
  out.push([-halfWidth, top]);
  for (let i = 0; i <= 3; i++) {
    const a = Math.PI + ((Math.PI / 2) * i) / 3;
    out.push([-halfWidth + r + Math.cos(a) * r, bottom + r + Math.sin(a) * r]);
  }
  for (let i = 0; i <= 3; i++) {
    const a = -Math.PI / 2 + ((Math.PI / 2) * i) / 3;
    out.push([halfWidth - r + Math.cos(a) * r, bottom + r + Math.sin(a) * r]);
  }
  out.push([halfWidth, top]);
  return out;
}

/** The wall's exposed edge at one end of the tub: a ribbon between the outer and inner contours. */
function capTub(
  s: Surface,
  built: {
    z: number;
    outer: Array<readonly [number, number]>;
    inner: Array<readonly [number, number]>;
    shade: number;
  },
  facing: number
): void {
  const n = built.outer.length;
  const a: number[] = [];
  const b: number[] = [];
  for (let i = 0; i < n; i++) {
    a.push(vertex(s, built.outer[i][0], built.outer[i][1], built.z, i / n, 0, built.shade * 0.9));
    b.push(vertex(s, built.inner[i][0], built.inner[i][1], built.z, i / n, 1, built.shade * 0.9));
  }
  for (let i = 0; i + 1 < n; i++) {
    if (facing > 0) quad(s, a[i], a[i + 1], b[i], b[i + 1]);
    else quad(s, b[i], b[i + 1], a[i], a[i + 1]);
  }
}

/**
 * The chassis and both bogies: the twelve wheels, their carriers, the two longitudinal beams and
 * the coupler stubs.
 *
 * This is the mesh that says "coaster" from two metres, and it is also the first thing to go at
 * distance — `main.ts` hangs an LOD level on it, because at 90 m a 9 cm upstop wheel is a fifth of
 * a pixel and drawing it costs the same as drawing it up close.
 */
export function buildRunningGear(m: CarMetrics): Surface {
  const s = newSurface();
  const halfGauge = m.gauge / 2;
  const zEnd = m.length / 2;

  // Longitudinal beams over the rails.
  for (const side of [-1, 1]) {
    addBox(
      s,
      [side * halfGauge - 0.055, m.chassisY - 0.1, -zEnd * 0.95],
      [side * halfGauge + 0.055, m.chassisY, zEnd * 0.95],
      0.9
    );
  }
  // The cross member that ties them, and the coupler stubs fore and aft.
  addBox(
    s,
    [-halfGauge - 0.05, m.chassisY - 0.085, -0.09],
    [halfGauge + 0.05, m.chassisY - 0.01, 0.09],
    0.8
  );
  for (const end of [-1, 1]) {
    addBox(
      s,
      [-0.055, m.chassisY - 0.09, end * zEnd * 0.95],
      [0.055, m.chassisY - 0.02, end * (zEnd + COUPLER_GAP / 2)],
      0.7
    );
  }

  for (const bogie of [-m.wheelbase / 2, m.wheelbase / 2]) {
    for (const side of [-1, 1]) {
      const x = side * halfGauge;
      // The carrier: the plate the three wheels hang off.
      addBox(
        s,
        [x - 0.075, m.railTop - 0.03, bogie - 0.19],
        [x + 0.075, m.chassisY - 0.01, bogie + 0.19],
        0.72
      );
      // Road wheel, on top of the rail.
      addWheelX(s, x, m.axleY, bogie, ROAD_WHEEL_R, ROAD_WHEEL_HALF, 0.5);
      // Upstop wheel, under the rail. Set back from the road wheel so the two do not intersect.
      addWheelX(
        s,
        x,
        RAIL - m.railRadius - SMALL_WHEEL_R,
        bogie + 0.155,
        SMALL_WHEEL_R,
        SMALL_WHEEL_HALF,
        0.45
      );
      // Guide wheel, vertical axis, running on the inboard face of the rail.
      addWheelY(
        s,
        x - side * (m.railRadius + SMALL_WHEEL_R),
        RAIL,
        bogie - 0.155,
        SMALL_WHEEL_R,
        SMALL_WHEEL_HALF,
        0.45
      );
    }
  }
  return s;
}

/**
 * The seating: a bucket seat per place, a headrest, and the restraint the profile asks for.
 *
 * Baked into ONE mesh per car rather than one per seat. Four seats and four restraints would be
 * eight instances a car and two more draw calls for geometry that never moves relative to the car,
 * and the whole point of a thin-instanced fleet is that a seven-car train costs the same number of
 * draw calls as a one-car train.
 */
export function buildInterior(m: CarMetrics, profile: TrainProfile): Surface {
  const s = newSurface();
  const zEnd = m.length / 2;
  const rowGap = (zEnd * 1.7) / m.rows;
  const seatWidth = Math.min(0.52, (m.width - 0.3) / m.perRow - 0.06);

  for (let row = 0; row < m.rows; row++) {
    const z = m.rows === 1 ? 0 : -zEnd * 0.82 + rowGap * (row + 0.5);
    for (let seat = 0; seat < m.perRow; seat++) {
      const x =
        m.perRow === 1
          ? 0
          : (-(m.perRow - 1) / 2 + seat) * ((m.width - 0.34) / Math.max(1, m.perRow - 1));
      addSeat(s, m, x, z, seatWidth);
      addRestraint(s, m, profile, x, z, seatWidth);
    }
  }
  return s;
}

function addSeat(s: Surface, m: CarMetrics, x: number, z: number, width: number): void {
  const half = width / 2;
  // Pan.
  addBox(s, [x - half, m.seatY - 0.09, z - 0.24], [x + half, m.seatY, z + 0.2], 1);
  // Back, tilted by being a little narrower at the top.
  addBox(s, [x - half, m.seatY, z - 0.3], [x + half, m.seatY + 0.42, z - 0.2], 0.94);
  // Headrest, wider than the back and stepped forward — the shape a shoulder harness pivots from.
  addBox(
    s,
    [x - half * 0.9, m.seatY + 0.42, z - 0.31],
    [x + half * 0.9, Math.min(m.headTop, m.seatY + 0.72), z - 0.17],
    0.88
  );
  // Side bolsters, which is what makes it a bucket rather than a bench.
  for (const side of [-1, 1]) {
    addBox(
      s,
      [x + side * half - 0.035, m.seatY - 0.02, z - 0.22],
      [x + side * half + 0.035, m.seatY + 0.16, z + 0.16],
      0.8
    );
  }
}

/**
 * The restraint.
 *
 * A shoulder harness is a yoke: a tube that leaves the headrest, comes forward over the head and
 * down the chest, with a pad either side of the sternum. A lap bar is a padded bar across the
 * thighs on a stem. A vest is the harness with a longer, narrower pad. `none` draws nothing, which
 * is what a launch coaster's lap-bar-free family train would want.
 */
function addRestraint(
  s: Surface,
  m: CarMetrics,
  profile: TrainProfile,
  x: number,
  z: number,
  width: number
): void {
  const half = width / 2;
  if (profile.restraint === 'none') return;
  if (profile.restraint === 'lap') {
    // The bar sits over the thighs at hip height, on two stems off the seat sides.
    const barY = m.seatY + 0.26;
    addBox(s, [x - half * 0.95, barY, z + 0.04], [x + half * 0.95, barY + 0.085, z + 0.19], 0.75);
    for (const side of [-1, 1]) {
      addBox(
        s,
        [x + side * half * 0.9 - 0.03, m.seatY + 0.02, z + 0.08],
        [x + side * half * 0.9 + 0.03, barY + 0.02, z + 0.14],
        0.65
      );
    }
    return;
  }
  // Shoulder or vest: the yoke, drawn as a run of short boxes down an arc so it reads as a bent
  // tube without a lathe. Six segments is enough at the distance a restraint is ever seen from.
  const pivotY = Math.min(m.headTop - 0.04, m.seatY + 0.66);
  const reach = profile.restraint === 'vest' ? 0.3 : 0.26;
  const drop = profile.restraint === 'vest' ? 0.5 : 0.42;
  const segments = 6;
  const tube = 0.035;
  for (const side of [-1, 1]) {
    const bx = x + side * half * 0.62;
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const a0 = (t0 * Math.PI) / 2;
      const a1 = (t1 * Math.PI) / 2;
      const y0 = pivotY - drop * (1 - Math.cos(a0));
      const y1 = pivotY - drop * (1 - Math.cos(a1));
      const z0 = z - 0.16 + reach * Math.sin(a0);
      const z1 = z - 0.16 + reach * Math.sin(a1);
      addBox(
        s,
        [bx - tube, Math.min(y0, y1) - tube, Math.min(z0, z1) - tube],
        [bx + tube, Math.max(y0, y1) + tube, Math.max(z0, z1) + tube],
        0.7
      );
    }
    // The chest pad.
    addBox(
      s,
      [bx - 0.075, pivotY - drop * 0.92, z - 0.16 + reach * 0.92 - 0.05],
      [bx + 0.075, pivotY - drop * 0.42, z - 0.16 + reach * 0.98 + 0.02],
      1
    );
  }
  // The lock bar between the two pads.
  addBox(
    s,
    [x - half * 0.62 - 0.02, pivotY - drop - 0.03, z - 0.16 + reach - 0.04],
    [x + half * 0.62 + 0.02, pivotY - drop + 0.04, z - 0.16 + reach + 0.03],
    0.72
  );
}

/**
 * The front fairing, drawn once per train.
 *
 * A coaster's nose is the one piece of a train anybody photographs, and the three shapes here are
 * the three that exist: a moulded **wedge** on a modern steel train, a **round** dome on a family
 * or a launch train, and the **blunt** square front of a classic wooden train, which is really just
 * the shell with a bulkhead on it. Which one a train gets is content (`manifest.ts`), never a
 * branch on a style id.
 */
export function buildNose(m: CarMetrics, profile: TrainProfile): Surface {
  const s = newSurface();
  const half = m.width / 2;
  const z0 = m.length / 2;
  const reach = profile.nose === 'blunt' ? 0.26 : profile.nose === 'round' ? 0.44 : 0.62;
  const sections: Section[] = [];
  const steps = profile.nose === 'blunt' ? 3 : 5;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // A wedge narrows fast and drops its top; a dome narrows on a sine; a blunt front barely moves.
    const shrink =
      profile.nose === 'wedge'
        ? 1 - 0.78 * t * t
        : profile.nose === 'round'
          ? Math.cos((t * Math.PI) / 2) * 0.9 + 0.1 * (1 - t)
          : 1 - 0.35 * t;
    const bottom = m.shellBottom + 0.03 * t;
    const top = m.shellTop - (m.shellTop - m.shellBottom) * 0.42 * t * t;
    sections.push({
      z: z0 + reach * t,
      points: shellSection(
        Math.max(0.09, half * 0.98 * shrink),
        bottom,
        Math.max(bottom + 0.1, top),
        0.14
      ),
      shade: 1 - 0.05 * t,
    });
  }
  addLoft(s, sections, { cap: true });
  return s;
}

/**
 * The trim: a stripe along the shell's waist and a skirt under it, in the livery's second colour.
 *
 * Its own mesh because it is its own material — a vertex-colour band would only ever be a darker
 * version of the body colour, and a two-tone train is the cheapest thing that stops a fleet of
 * identical boxes reading as a fleet of identical boxes.
 */
export function buildTrim(m: CarMetrics): Surface {
  const s = newSurface();
  const half = m.width / 2;
  const zEnd = m.length / 2;
  const y = m.shellBottom + (m.shellTop - m.shellBottom) * 0.62;
  for (const side of [-1, 1]) {
    addBox(
      s,
      [side * half - 0.012, y, -zEnd * 0.93],
      [side * half + 0.012, y + 0.055, zEnd * 0.93],
      1
    );
  }
  // The skirt: a band under the shell, which is what visually separates the body from the wheels.
  for (const side of [-1, 1]) {
    addBox(
      s,
      [side * (half - 0.02) - 0.02, m.shellBottom - 0.055, -zEnd * 0.9],
      [side * (half - 0.02) + 0.02, m.shellBottom + 0.005, zEnd * 0.9],
      0.8
    );
  }
  return s;
}
