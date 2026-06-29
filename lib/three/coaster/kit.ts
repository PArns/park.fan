/**
 * Reusable three.js toolkit for the glossary coaster player.
 *
 * Every glossary 3-D element shares this kit so the look stays consistent: the
 * same materials, the same meadow + mountain + sky, and — most importantly — the
 * same **parallel-transport frame** maths that make inversions and rolls render
 * cleanly (a plain `lookAt(worldUp)` gimbals/flips upside-down through a loop).
 *
 * Client-only (uses canvas/WebGL); load it behind a `ssr:false` dynamic import.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Palette — a bright, toy/RCT-ish look shared by every element scene.
// ---------------------------------------------------------------------------
export const PAL = {
  grass: 0x6fcf57,
  grassDark: 0x4fae3d,
  rail: 0x2b6cff,
  railAccent: 0xffd24a,
  carLead: 0xffe072,
  car: 0xe5202e,
  tie: 0x6f8383,
  support: 0xeff3f3,
  mountain: 0x9aa7b2,
  mountainSnow: 0xf3f7fb,
  hill: 0x67c24f,
};

// ---------------------------------------------------------------------------
// Disposal tracker — register every geometry/material/texture so the whole
// scene can be torn down in one call (avoids WebGL leaks when the player
// unmounts / the term page navigates away).
// ---------------------------------------------------------------------------
export class Tracker {
  private geos: THREE.BufferGeometry[] = [];
  private mats: THREE.Material[] = [];
  private texs: THREE.Texture[] = [];

  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geos.push(g);
    return g;
  }
  mat<T extends THREE.Material>(m: T): T {
    this.mats.push(m);
    return m;
  }
  tex<T extends THREE.Texture>(t: T): T {
    this.texs.push(t);
    return t;
  }
  dispose() {
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
    for (const t of this.texs) t.dispose();
    this.geos = [];
    this.mats = [];
    this.texs = [];
  }
}

export interface BuildCtx {
  track: Tracker;
  /** Flat-shaded standard material (the toy/toon look). */
  mat: (params: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  /** Like mat() but with a constant emissive glow for lively accents (rails, cars). */
  lit: (params: THREE.MeshStandardMaterialParameters, glow?: number) => THREE.MeshStandardMaterial;
}

export function createCtx(track: Tracker): BuildCtx {
  const mat = (params: THREE.MeshStandardMaterialParameters) =>
    track.mat(new THREE.MeshStandardMaterial({ flatShading: true, ...params }));
  const lit = (params: THREE.MeshStandardMaterialParameters, glow = 0.25) => {
    const m = new THREE.MeshStandardMaterial({ flatShading: true, ...params });
    m.emissive = new THREE.Color(params.color as THREE.ColorRepresentation);
    m.emissiveIntensity = glow;
    return track.mat(m);
  };
  return { track, mat, lit };
}

// ---------------------------------------------------------------------------
// Parallel-transport frames along a curve.
//
// Returns a smoothly-rotating frame (tangent / up / right) at N+1 samples,
// transported with minimal twist so it never flips. A planar vertical loop
// naturally takes `up` upside-down at the apex (correct), while a straight
// section keeps `up` constant — and an explicit per-sample `roll(t)` then adds
// barrel-rolls/heartline twists on top. Rails are lofted along `right`, and the
// train + onboard camera are oriented from (tangent, up).
// ---------------------------------------------------------------------------
export interface CurveFrames {
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  tangents: THREE.Vector3[];
  ups: THREE.Vector3[];
  rights: THREE.Vector3[];
  /** Cumulative arc length at each sample (0..total). */
  arc: number[];
  length: number;
  closed: boolean;
}

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

export function framesAlongCurve(
  pts: THREE.Vector3[],
  N: number,
  opts: { closed?: boolean; roll?: (t: number) => number; initialUp?: THREE.Vector3 } = {}
): CurveFrames {
  const { closed = false, roll, initialUp } = opts;
  const curve = new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.5);
  const points: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    points.push(curve.getPointAt(t));
    tangents.push(curve.getTangentAt(t).normalize());
  }

  // Seed `up`: the given hint (or world-up), made perpendicular to tangent[0].
  const up = initialUp ? initialUp.clone() : new THREE.Vector3(0, 1, 0);
  up.sub(_v.copy(tangents[0]).multiplyScalar(up.dot(tangents[0])));
  if (up.lengthSq() < 1e-6) up.set(1, 0, 0).sub(_v.copy(tangents[0]).multiplyScalar(tangents[0].x));
  up.normalize();

  const ups: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    if (i > 0) {
      // Rotate `up` by the minimal rotation that carried the tangent forward.
      _q.setFromUnitVectors(tangents[i - 1], tangents[i]);
      up.applyQuaternion(_q);
      // Re-orthogonalise against the (numerically drifting) tangent.
      up.sub(_v.copy(tangents[i]).multiplyScalar(up.dot(tangents[i]))).normalize();
    }
    ups.push(up.clone());
  }

  // Closed curves: spread any residual twist at the seam evenly so it joins smoothly.
  if (closed && N > 1) {
    let ang = Math.acos(THREE.MathUtils.clamp(ups[N].dot(ups[0]), -1, 1));
    _v.crossVectors(ups[N], ups[0]);
    if (_v.dot(tangents[0]) < 0) ang = -ang;
    for (let i = 0; i <= N; i++) ups[i].applyAxisAngle(tangents[i], (-ang * i) / N).normalize();
  }

  // Explicit roll (barrel rolls / heartline twists on otherwise-straight track).
  if (roll) {
    for (let i = 0; i <= N; i++) {
      const r = roll(i / N);
      if (r) ups[i].applyAxisAngle(tangents[i], r).normalize();
    }
  }

  const rights: THREE.Vector3[] = [];
  const arc: number[] = [0];
  for (let i = 0; i <= N; i++) {
    rights.push(new THREE.Vector3().crossVectors(tangents[i], ups[i]).normalize());
    if (i > 0) arc.push(arc[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  return { curve, points, tangents, ups, rights, arc, length: arc[N], closed };
}

/**
 * Sample an interpolated frame at progress `t` (0..1 along the curve), reusing
 * the precomputed frames. Used every animation tick to place + orient the train
 * and the follow/onboard cameras without recomputing the whole frame set.
 */
export function frameAt(
  f: CurveFrames,
  t: number,
  out: { pos: THREE.Vector3; tangent: THREE.Vector3; up: THREE.Vector3; right: THREE.Vector3 }
) {
  const N = f.points.length - 1;
  const tt = f.closed ? ((t % 1) + 1) % 1 : THREE.MathUtils.clamp(t, 0, 1);
  const x = tt * N;
  const i = Math.min(Math.floor(x), N - 1);
  const a = x - i;
  out.pos.copy(f.points[i]).lerp(f.points[i + 1], a);
  out.tangent
    .copy(f.tangents[i])
    .lerp(f.tangents[i + 1], a)
    .normalize();
  out.up
    .copy(f.ups[i])
    .lerp(f.ups[i + 1], a)
    .normalize();
  // Re-orthogonalise + derive right so the basis stays clean after lerp.
  out.up.sub(_v.copy(out.tangent).multiplyScalar(out.up.dot(out.tangent))).normalize();
  out.right.crossVectors(out.tangent, out.up).normalize();
}

// ---------------------------------------------------------------------------
// Environment — a consistent meadow + mountain + sky shared by every element.
// ---------------------------------------------------------------------------

function canvas2d(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}

export function makeSkyTexture(track: Tracker, night: boolean): THREE.CanvasTexture {
  const [c, ctx] = canvas2d(256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  if (night) {
    g.addColorStop(0, '#070b1e');
    g.addColorStop(0.55, '#142150');
    g.addColorStop(1, '#33508c');
  } else {
    g.addColorStop(0, '#3b8fe3');
    g.addColorStop(0.5, '#7fc2f3');
    g.addColorStop(1, '#cdeeff');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return track.tex(t);
}

/** A flat green meadow the coaster element sits on. */
export function buildMeadow(ctx: BuildCtx): THREE.Mesh {
  const m = new THREE.Mesh(
    ctx.track.geo(new THREE.CircleGeometry(120, 48)),
    ctx.mat({ color: PAL.grass, roughness: 1 })
  );
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/**
 * A simple, consistent mountain backdrop behind the element: a cluster of
 * snow-capped cones + low rolling hills, set well back so the coaster reads in
 * front of it from the frontal view.
 */
export function buildMountains(ctx: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const rockMat = ctx.mat({ color: PAL.mountain, roughness: 1, flatShading: false });
  const snowMat = ctx.mat({ color: PAL.mountainSnow, roughness: 1, flatShading: false });
  const hillMat = ctx.mat({ color: PAL.hill, roughness: 1, flatShading: false });
  // big peaks
  const peaks: [number, number, number][] = [
    [-26, 30, -8],
    [4, 42, 0],
    [30, 34, -6],
    [-50, 24, -18],
    [52, 26, -16],
  ];
  for (const [x, h, dz] of peaks) {
    const peak = new THREE.Mesh(ctx.track.geo(new THREE.ConeGeometry(h * 0.62, h, 5)), rockMat);
    peak.position.set(x, h / 2, -54 + dz);
    g.add(peak);
    const snow = new THREE.Mesh(
      ctx.track.geo(new THREE.ConeGeometry(h * 0.62 * 0.4, h * 0.32, 5)),
      snowMat
    );
    snow.position.set(x, h - h * 0.16, -54 + dz);
    g.add(snow);
  }
  // rolling foreground hills
  for (const [x, r, dz] of [
    [-30, 12, -34],
    [0, 14, -38],
    [34, 13, -34],
    [-60, 11, -30],
    [60, 12, -30],
  ] as const) {
    const hill = new THREE.Mesh(
      ctx.track.geo(new THREE.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
      hillMat
    );
    hill.position.set(x, -1, dz);
    hill.scale.y = 0.5;
    g.add(hill);
  }
  return g;
}

/** A few fluffy clouds drifting across the sky (optional ambience). */
export function buildClouds(ctx: BuildCtx): { group: THREE.Group; update: (e: number) => void } {
  const g = new THREE.Group();
  const mat = ctx.mat({ color: 0xffffff, roughness: 1, flatShading: false });
  const puffs: { obj: THREE.Group; speed: number; base: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    const n = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const blob = new THREE.Mesh(
        ctx.track.geo(new THREE.IcosahedronGeometry(rnd(1.8, 3), 2)),
        mat
      );
      blob.position.set(rnd(-4, 4), rnd(-0.4, 0.5), rnd(-2, 2));
      blob.scale.y = 0.6;
      cloud.add(blob);
    }
    cloud.position.set(rnd(-70, 70), rnd(26, 44), rnd(-58, -20));
    g.add(cloud);
    puffs.push({ obj: cloud, speed: rnd(0.2, 0.55), base: cloud.position.x });
  }
  return {
    group: g,
    update(e: number) {
      for (const p of puffs) p.obj.position.x = ((p.base + e * p.speed + 100) % 200) - 100;
    },
  };
}

export function rnd(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
