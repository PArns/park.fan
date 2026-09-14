/**
 * The drawn track: rails, spine and crossties extruded along the spline.
 *
 * Pure — it returns vertex arrays, and `main.ts` turns them into Babylon meshes. That split is
 * what lets `selftest.mjs` count triangles and check the winding without a GPU.
 *
 * **One mesh per material per run, never a mesh per tie.** A wooden coaster has a tie every 45 cm;
 * on 895 m of track that is 1,990 of them, and 1,990 meshes is 1,990 draw calls for one ride
 * against a whole-scene budget of 1,200. Every tie on a run is welded into the same vertex buffer
 * as every other tie, and the three material groups (bare rail, painted spine, timber) are the
 * only division there is.
 *
 * **The stations are adaptive, and the criterion is the sagitta.** A fixed 1 m step draws a 6 m
 * corkscrew as a visible polygon and wastes half its vertices on the straight before it. The step
 * here is whatever keeps the chord within a centimetre of the curve — `√(8·tolerance/κ)` — capped
 * either side, plus a second limit from the roll rate, because a rail 65 cm off the centreline
 * moves as fast as the bank does and a zero-g roll would otherwise facet even on straight track.
 *
 * **The rails hang off the heartline.** The spline is the line through the riders' chests
 * (`cursor.ts`), so every part of the structure is placed by stepping DOWN the up-vector from it:
 * the rail plane at 1.1 m, the spine below that. Banking therefore swings the whole structure
 * under the rider, which is what heartlined track does and why a banked turn's supports lean.
 */

import { HEARTLINE_HEIGHT } from './types';
import type { TrackSpline, TrackFrame } from './spline';
import { clamp, cross, normalize, type V3 } from './vec';

export interface Geo {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

export type TrackGroup = 'rail' | 'spine' | 'tie';

export interface TrackGeometry {
  groups: Record<TrackGroup, Geo>;
  /** The frames the extrusion used; supports and the LOD share them rather than re-marching. */
  frames: TrackFrame[];
  triangles: number;
}

/** The subset of a pack's `trackStyles` entry this module draws. */
export interface TrackStyleShape {
  rail: { profile: 'round' | 'box' | 'i-beam' | 'tube'; radius: number; gauge: number };
  spine?: { profile: 'round' | 'box'; size: number };
  ties?: { every: number; width?: number };
  supports: 'steel' | 'timber' | 'none';
  color?: string;
}

/**
 * How far the chord of one extrusion step may sag away from the curve, metres.
 *
 * A centimetre. Below that the silhouette of a 6 m-radius corkscrew is smooth at any distance a
 * camera in this game can get to; above about 3 cm the loop shows flats.
 */
const SAGITTA = 0.01;
const MIN_STEP = 0.32;
const MAX_STEP = 1.15;
/**
 * Clear air between the underside of the rails and the top of the spine, metres.
 *
 * The first version left 6 cm, which put the two rails almost touching the box and made the whole
 * assembly read as one tube with a dark stripe on it: the crossties and the struts that make a
 * steel coaster look like a steel coaster had nowhere to be. On a real box-spine ride the rails sit
 * half a metre or so above the spine and the ladder between them is the visible structure.
 */
const SPINE_GAP = 0.45;

/**
 * Which way `cross(v1 − v0, v2 − v0)` points on a FRONT-facing triangle in this scene.
 *
 * It is −1, which is the opposite of the intuition, and it is not this module's discovery: the
 * terrain and paths modules carry the same note. In a right-handed scene Babylon winds a
 * front-facing quad so that this cross product points AWAY from the visible side. Getting it
 * backwards does not throw and does not warn — every surface is simply back-face culled, and the
 * coaster renders as nothing at all with the right vertex count in the inspector.
 */
const FRONT_FACE_SIGN = -1;

function emptyGeo(): Geo {
  return { positions: [], normals: [], uvs: [], indices: [] };
}

/**
 * Arc lengths to extrude at.
 *
 * `rollPerMetre` is sampled by differencing the up-vectors rather than the roll channel, because
 * the roll channel is measured against a gauge that does not close around a circuit (see
 * `spline.ts`) and differencing it across the seam would ask for a 3 cm step there.
 */
export function extrusionStations(spline: TrackSpline): number[] {
  const total = spline.length();
  const out: number[] = [0];
  let s = 0;
  let guard = 0;
  while (s < total && guard++ < 20000) {
    const kappa = Math.hypot(...spline.curvatureAt(s));
    const here = spline.frameAt(s);
    const ahead = spline.frameAt(Math.min(total, s + 0.5));
    const roll =
      Math.abs(Math.asin(clamp(dotV(cross(here.up, ahead.up), here.tangent), -1, 1))) / 0.5;
    const byCurve = kappa > 1e-6 ? Math.sqrt((8 * SAGITTA) / kappa) : MAX_STEP;
    const byRoll = roll > 1e-6 ? 0.12 / roll : MAX_STEP;
    s += clamp(Math.min(byCurve, byRoll), MIN_STEP, MAX_STEP);
    if (s >= total - MIN_STEP * 0.5) break;
    out.push(s);
  }
  // The last station is the end, and it REPLACES rather than follows a station close to it: a
  // 10 cm final step makes a ring of near-degenerate quads at the seam, which on a closed circuit
  // is exactly where the extrusion wraps.
  if (out.length > 1 && total - out[out.length - 1] < MIN_STEP * 0.5) out.pop();
  out.push(total);
  return out;
}

function dotV(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** A closed cross-section in the frame's (right, up) plane, as [across, vertical] pairs. */
function railSection(
  profile: TrackStyleShape['rail']['profile'],
  r: number
): Array<[number, number]> {
  if (profile === 'box') {
    return [
      [-r, -r],
      [r, -r],
      [r, r],
      [-r, r],
    ];
  }
  if (profile === 'i-beam') {
    const w = r * 1.35;
    const t = r * 0.42;
    return [
      [-w, -r],
      [w, -r],
      [w, -r + t],
      [t * 0.6, -r + t],
      [t * 0.6, r - t],
      [w, r - t],
      [w, r],
      [-w, r],
      [-w, r - t],
      [-t * 0.6, r - t],
      [-t * 0.6, -r + t],
      [-w, -r + t],
    ];
  }
  // Six sides for a 6–7 cm rail: at the closest a camera gets in this game (a metre) the flats are
  // under a pixel, and it halves the vertex count against the twelve-sided version.
  const sides = 6;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / sides;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

function tubeSection(profile: 'round' | 'box', size: number): Array<[number, number]> {
  const r = size / 2;
  if (profile === 'box') {
    return [
      [-r, -r],
      [r, -r],
      [r, r],
      [-r, r],
    ];
  }
  const sides = 8;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / sides;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

function push(geo: Geo, p: V3, n: V3, u: number, v: number): number {
  const index = geo.positions.length / 3;
  geo.positions.push(p[0], p[1], p[2]);
  geo.normals.push(n[0], n[1], n[2]);
  geo.uvs.push(u, v);
  return index;
}

/** Two triangles for a quad whose vertices are counter-clockwise seen from `+normal`. */
function quad(geo: Geo, a: number, b: number, c: number, d: number): void {
  if (FRONT_FACE_SIGN < 0) geo.indices.push(a, c, b, a, d, c);
  else geo.indices.push(a, b, c, a, c, d);
}

/**
 * Sweep a closed section along a run of frames.
 *
 * `offset` moves the section in the frame's own (right, up) plane, which is how the two rails end
 * up either side of the centreline and the spine ends up below them.
 */
function sweep(
  geo: Geo,
  frames: readonly TrackFrame[],
  section: ReadonlyArray<readonly [number, number]>,
  offset: readonly [number, number],
  closed: boolean
): void {
  const k = section.length;
  const rings: number[][] = [];
  for (const frame of frames) {
    const ring: number[] = [];
    for (let i = 0; i < k; i++) {
      const [a, b] = section[i];
      const across = a + offset[0];
      const vertical = b + offset[1];
      const p: V3 = [
        frame.p[0] + frame.right[0] * across + frame.up[0] * vertical,
        frame.p[1] + frame.right[1] * across + frame.up[1] * vertical,
        frame.p[2] + frame.right[2] * across + frame.up[2] * vertical,
      ];
      // The section's own outward normal, carried into world space by the frame.
      const na = section[i][0];
      const nb = section[i][1];
      const len = Math.hypot(na, nb) || 1;
      const n: V3 = normalize([
        (frame.right[0] * na + frame.up[0] * nb) / len,
        (frame.right[1] * na + frame.up[1] * nb) / len,
        (frame.right[2] * na + frame.up[2] * nb) / len,
      ]);
      ring.push(push(geo, p, n, (i / k) * 0.5, frame.s));
    }
    rings.push(ring);
  }
  const last = closed ? rings.length : rings.length - 1;
  for (let r = 0; r < last; r++) {
    const a = rings[r];
    const b = rings[(r + 1) % rings.length];
    for (let i = 0; i < k; i++) {
      const j = (i + 1) % k;
      quad(geo, a[i], a[j], b[j], b[i]);
    }
  }
}

/** An axis-aligned box in a frame's own axes: `half` is (across, vertical, along). */
function frameBox(
  geo: Geo,
  frame: TrackFrame,
  centre: readonly [number, number, number],
  half: readonly [number, number, number]
): void {
  const corner = (sx: number, sy: number, sz: number): V3 => {
    const a = centre[0] + sx * half[0];
    const b = centre[1] + sy * half[1];
    const c = centre[2] + sz * half[2];
    return [
      frame.p[0] + frame.right[0] * a + frame.up[0] * b + frame.tangent[0] * c,
      frame.p[1] + frame.right[1] * a + frame.up[1] * b + frame.tangent[1] * c,
      frame.p[2] + frame.right[2] * a + frame.up[2] * b + frame.tangent[2] * c,
    ];
  };
  const axes: V3[] = [frame.right, frame.up, frame.tangent];
  const faces: Array<[number, number, [number, number, number][]]> = [
    [
      0,
      1,
      [
        [1, -1, -1],
        [1, 1, -1],
        [1, 1, 1],
        [1, -1, 1],
      ],
    ],
    [
      0,
      -1,
      [
        [-1, -1, 1],
        [-1, 1, 1],
        [-1, 1, -1],
        [-1, -1, -1],
      ],
    ],
    [
      1,
      1,
      [
        [-1, 1, -1],
        [1, 1, -1],
        [1, 1, 1],
        [-1, 1, 1],
      ].map((v) => v as [number, number, number]),
    ],
    [
      1,
      -1,
      [
        [-1, -1, 1],
        [1, -1, 1],
        [1, -1, -1],
        [-1, -1, -1],
      ].map((v) => v as [number, number, number]),
    ],
    [
      2,
      1,
      [
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ].map((v) => v as [number, number, number]),
    ],
    [
      2,
      -1,
      [
        [-1, 1, -1],
        [1, 1, -1],
        [1, -1, -1],
        [-1, -1, -1],
      ].map((v) => v as [number, number, number]),
    ],
  ];
  for (const [axis, sign, corners] of faces) {
    const n: V3 = [axes[axis][0] * sign, axes[axis][1] * sign, axes[axis][2] * sign];
    const idx = corners.map((c, i) =>
      push(geo, corner(c[0], c[1], c[2]), n, i < 2 ? 0 : 0.5, i === 0 || i === 3 ? 0 : 1)
    );
    quad(geo, idx[0], idx[1], idx[2], idx[3]);
  }
}

/** A strut between two world points, drawn as a square section. */
export function strut(geo: Geo, from: V3, to: V3, halfWidth: number, up?: V3): void {
  const along = normalize([to[0] - from[0], to[1] - from[1], to[2] - from[2]], [0, 1, 0]);
  const reference: V3 =
    up && Math.abs(dotV(up, along)) < 0.95 ? up : Math.abs(along[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
  const right = normalize(cross(reference, along), [1, 0, 0]);
  const top = normalize(cross(along, right), [0, 1, 0]);
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const frames: TrackFrame[] = [
    { s: 0, p: from, tangent: along, up: top, right },
    { s: length, p: to, tangent: along, up: top, right },
  ];
  sweep(
    geo,
    frames,
    [
      [-halfWidth, -halfWidth],
      [halfWidth, -halfWidth],
      [halfWidth, halfWidth],
      [-halfWidth, halfWidth],
    ],
    [0, 0],
    false
  );
  // Cap both ends so a column read end-on is not a hole.
  cap(geo, frames[0], halfWidth, -1);
  cap(geo, frames[1], halfWidth, 1);
}

function cap(geo: Geo, frame: TrackFrame, halfWidth: number, sign: number): void {
  const n: V3 = [frame.tangent[0] * sign, frame.tangent[1] * sign, frame.tangent[2] * sign];
  const corners: Array<[number, number]> = [
    [-halfWidth, -halfWidth],
    [halfWidth, -halfWidth],
    [halfWidth, halfWidth],
    [-halfWidth, halfWidth],
  ];
  const order = sign > 0 ? corners : [...corners].reverse();
  const idx = order.map(([a, b], i) =>
    push(
      geo,
      [
        frame.p[0] + frame.right[0] * a + frame.up[0] * b,
        frame.p[1] + frame.right[1] * a + frame.up[1] * b,
        frame.p[2] + frame.right[2] * a + frame.up[2] * b,
      ],
      n,
      i < 2 ? 0 : 0.5,
      i === 0 || i === 3 ? 0 : 0.5
    )
  );
  quad(geo, idx[0], idx[1], idx[2], idx[3]);
}

export function countTriangles(groups: Record<TrackGroup, Geo>): number {
  return Object.values(groups).reduce((sum, g) => sum + g.indices.length / 3, 0);
}

export function buildTrackGeometry(spline: TrackSpline, style: TrackStyleShape): TrackGeometry {
  const stations = extrusionStations(spline);
  const frames = stations.map((s) => spline.frameAt(s));
  const groups: Record<TrackGroup, Geo> = { rail: emptyGeo(), spine: emptyGeo(), tie: emptyGeo() };
  const closed = spline.closed;
  // On a circuit the last frame repeats the first; drop it and let `sweep` wrap instead, or the
  // seam gets a zero-length ring and a fan of degenerate triangles.
  const ring = closed ? frames.slice(0, -1) : frames;

  const gauge = style.rail.gauge;
  const railTop = -HEARTLINE_HEIGHT;
  const section = railSection(style.rail.profile, style.rail.radius);
  sweep(groups.rail, ring, section, [-gauge / 2, railTop], closed);
  sweep(groups.rail, ring, section, [gauge / 2, railTop], closed);

  let spineTop = railTop - style.rail.radius;
  if (style.spine) {
    const size = style.spine.size;
    const centre = railTop - style.rail.radius - size / 2 - SPINE_GAP;
    sweep(groups.spine, ring, tubeSection(style.spine.profile, size), [0, centre], closed);
    spineTop = centre + size / 2;
  }

  if (style.ties) {
    const every = Math.max(0.25, style.ties.every);
    const width = style.ties.width ?? gauge + 0.5;
    const total = spline.length();
    const count = Math.max(1, Math.floor(total / every));
    for (let i = 0; i < count; i++) {
      const s = (i + 0.5) * (total / count);
      const frame = spline.frameAt(s);
      if (style.spine) {
        // Steel: a crosstie under the rails plus two struts down to the spine — the ladder every
        // box-spine coaster has, and the thing that reads as "not a tube in the air".
        frameBox(
          groups.tie,
          frame,
          [0, railTop - style.rail.radius - 0.05, 0],
          [width / 2, 0.05, 0.07]
        );
        const drop = railTop - style.rail.radius - 0.1;
        for (const side of [-1, 1]) {
          const a: V3 = [
            frame.p[0] + frame.right[0] * (side * gauge * 0.5) + frame.up[0] * drop,
            frame.p[1] + frame.right[1] * (side * gauge * 0.5) + frame.up[1] * drop,
            frame.p[2] + frame.right[2] * (side * gauge * 0.5) + frame.up[2] * drop,
          ];
          const b: V3 = [
            frame.p[0] + frame.up[0] * spineTop,
            frame.p[1] + frame.up[1] * spineTop,
            frame.p[2] + frame.up[2] * spineTop,
          ];
          strut(groups.tie, a, b, 0.035, frame.tangent);
        }
      } else {
        // Timber: a sleeper across the whole structure, the way a wooden coaster's track is built.
        frameBox(
          groups.tie,
          frame,
          [0, railTop - style.rail.radius - 0.09, 0],
          [width / 2, 0.09, 0.075]
        );
      }
    }
  }

  return { groups, frames, triangles: countTriangles(groups) };
}
