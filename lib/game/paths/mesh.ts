/**
 * Geometry: ribbons, kerbs, plazas, junction caps and queue furniture, grouped by material.
 *
 * Three decisions in here are load-bearing.
 *
 * **Every surface vertex takes its height from the terrain sample at its own (x, z).** Not from
 * the centreline, not interpolated along a quad. It costs one bilinear lookup per vertex and it is
 * what makes the seams exact: a path's cut edge, the junction cap that fills the hole, and the
 * plaza it runs into all evaluate the same function at the same point, so there is nothing to
 * z-fight and nothing to gap. Interpolating instead leaves millimetre steps that catch the light.
 *
 * **Quads are clipped in parameter space.** A junction is removed from a path by clipping its
 * quads against the OTHER path's two edge lines (see `layout.ts`), and the clip runs on the quad's
 * unit square with the plane distances interpolated bilinearly — so position, uv and vertex colour
 * all come out consistent, and the cut lands exactly on the other path's kerb line at any crossing
 * angle. Cutting perpendicular to the centreline instead is the obvious approach and leaves a
 * wedge-shaped gap on every oblique junction.
 *
 * **Macro variation is vertex colour, not a second texture.** The surface tiles every two metres;
 * a 2 m repeat across a 60 m promenade is the thing that makes a generated material look printed.
 * Two long-wavelength noise fields (about 30 m and about 9 m) plus a centre-wear term multiply the
 * albedo per vertex — one Color4 per vertex, no second sampler and no second set of uvs. It is
 * applied through the mesh's `useVertexColors`, so it is a real albedo multiply in the PBR shader
 * rather than a lighting trick, and it is sampled in WORLD space: two paths that meet carry the
 * same stain across the junction instead of each starting its pattern again at its own origin.
 */

import {
  MESH_SPACING,
  SURFACE_LIFT,
  layoutContains,
  regionContains,
  type ClipRegion,
  type Junction,
  type PathLayout,
} from './layout';
import { signedDistance, triangulate, type Pt } from './geom2d';
import { offsetLeft, type Station } from './spline';
import { STANCHION_BELT_MATERIAL } from './manifest';
import { clamp01, fbm } from './noise';

export interface Geo {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

export interface MeshBuild {
  /** Keyed by material recipe id. */
  groups: Map<string, Geo>;
  /** 16 floats per stanchion post, ready for `thinInstanceSetBuffer`. */
  posts: Float32Array;
  triangles: number;
}

export interface SurfaceSampler {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
}

interface Vertex {
  x: number;
  y: number;
  z: number;
  u: number;
  v: number;
  /** Vertex colour, one channel — the tint is neutral, so r = g = b. */
  c: number;
  /** Surface normal. Carried on the vertex so a clipped corner interpolates it like everything else. */
  nx: number;
  ny: number;
  nz: number;
}

function emptyGeo(): Geo {
  return { positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

function groupFor(build: MeshBuild, material: string): Geo {
  let geo = build.groups.get(material);
  if (!geo) {
    geo = emptyGeo();
    build.groups.set(material, geo);
  }
  return geo;
}

/**
 * The macro tint at a world point: two long wavelengths of noise plus the wear a path takes down
 * its middle. `across` is 0 at the centreline and 1 at the edge.
 */
function macroTint(x: number, z: number, across: number, wear: number): number {
  const broad = fbm(x / 96 + 0.5, z / 96 + 0.5, { octaves: 3, period: 3, seed: 31 });
  const fine = fbm(x / 27 + 0.5, z / 27 + 0.5, { octaves: 3, period: 3, seed: 907 });
  // Traffic polishes the middle of a path pale and leaves the edges dark with grit.
  const centre = 1 - Math.pow(clamp01(across), 1.7);
  const dirtEdge = Math.pow(clamp01(across), 4) * 0.16;
  return clamp01(
    0.9 + (broad - 0.5) * 0.16 + (fine - 0.5) * 0.1 + centre * wear * 0.2 - dirtEdge * (0.4 + wear)
  );
}

/**
 * Which way `cross(v1 - v0, v2 - v0)` points on a FRONT-facing triangle in this scene.
 *
 * It is -1, which is the opposite of the intuition, and it is not this module's discovery: the
 * terrain module's `chunks.ts` carries the same note, because in a right-handed scene
 * (`useRightHandedSystem`, right-handed projection) Babylon's own `CreateGround` winds an up-facing
 * quad so that this cross product points DOWN. Getting it backwards does not throw and does not
 * warn: every path surface and every kerb face was back-face culled, so the showcase rendered a
 * park of thin dark kerb lines drawn on grass, with the plazas showing as an outline and nothing
 * inside. The only clue was that the geometry was in the scene with the right vertex count.
 */
const FRONT_FACE_SIGN = -1;

// ── quad emission with clipping ─────────────────────────────────────────────────────────────
const UNIT_QUAD: Array<{ a: number; b: number }> = [
  { a: 0, b: 0 },
  { a: 1, b: 0 },
  { a: 1, b: 1 },
  { a: 0, b: 1 },
];

/**
 * Emit one quad, minus whatever the clip regions remove from it.
 *
 * The quad is `[a, b, c, d]` in ring order. `conform` re-samples the terrain for every emitted
 * vertex (surfaces and kerb tops); a vertical face keeps the interpolated y, because its corners
 * are the ones the neighbouring surface already agreed on.
 *
 * `poly === null` means "still the four original corners", which is the case for all but a few
 * dozen quads in a park. Keeping that as a null rather than as the unit square costs one branch and
 * saves the whole bilinear evaluation — three object allocations per vertex, seven times per metre
 * of path. Measured on a 3 km network: 72 ms of the geometry build, gone.
 */
function emitQuad(
  geo: Geo,
  quad: [Vertex, Vertex, Vertex, Vertex],
  normal: [number, number, number],
  clips: readonly ClipRegion[],
  conform: ((x: number, z: number) => number) | null
): number {
  let poly: Array<{ a: number; b: number }> | null = null;
  for (const clip of clips) {
    const world: readonly Vertex[] = poly ? poly.map((p) => bilinear(quad, p.a, p.b)) : quad;
    // Bounding-box reject: the clip regions are small and most quads are nowhere near one.
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const w of world) {
      if (w.x < minX) minX = w.x;
      if (w.x > maxX) maxX = w.x;
      if (w.z < minZ) minZ = w.z;
      if (w.z > maxZ) maxZ = w.z;
    }
    if (maxX < clip.minX || minX > clip.maxX || maxZ < clip.minZ || minZ > clip.maxZ) continue;

    // Fully removed?
    let allInside = true;
    for (const w of world) {
      if (!regionContains(clip, w.x, w.z)) {
        allInside = false;
        break;
      }
    }
    if (allInside) return 0;

    // Which of the region's planes does this polygon actually straddle? For a junction that is B's
    // left edge or B's right edge and never both — a quad is one metre long and the slab between
    // them is at least two.
    let chosen = -1;
    let chosenSpread = Infinity;
    for (let p = 0; p < clip.planes.length; p++) {
      const plane = clip.planes[p];
      let neg = 0;
      let pos = 0;
      let maxAbs = 0;
      for (const w of world) {
        const d = signedDistance(plane, w.x, w.z);
        if (d >= 0) pos++;
        else neg++;
        const abs = d < 0 ? -d : d;
        if (abs > maxAbs) maxAbs = abs;
      }
      if (pos === 0 || neg === 0) continue;
      if (maxAbs < chosenSpread) {
        chosenSpread = maxAbs;
        chosen = p;
      }
    }
    if (chosen < 0) {
      // No plane splits it, and it is not fully inside: the quad is outside this region.
      continue;
    }
    // Sutherland–Hodgman, but run on the quad's unit square: every vertex it produces is either an
    // original corner or a point on an edge between two of them at parameter `t`, so clipping in
    // parameter space and interpolating position, uv and colour there gives exactly the same ring
    // as clipping in world space would, with every attribute consistent.
    poly = clipParams(poly ?? UNIT_QUAD, quad, clip.planes[chosen]);
    if (poly.length < 3) return 0;
  }

  const clipped = poly !== null;
  const verts: readonly Vertex[] = poly ? poly.map((p) => bilinear(quad, p.a, p.b)) : quad;
  const base = geo.positions.length / 3;
  for (const w of verts) {
    // `conform` runs only for a vertex the clip INVENTED: an original corner already holds the
    // terrain height its builder sampled, and re-sampling it is one bilinear lookup per corner of
    // every quad in the park for a number that cannot have changed.
    const y = clipped && conform ? conform(w.x, w.z) : w.y;
    geo.positions.push(w.x, y, w.z);
    const len = Math.sqrt(w.nx * w.nx + w.ny * w.ny + w.nz * w.nz) || 1;
    geo.normals.push(w.nx / len, w.ny / len, w.nz / len);
    geo.uvs.push(w.u, w.v);
    geo.colors.push(w.c, w.c, w.c, 1);
  }
  // Fan, wound so the face points the way `normal` says. Deciding it from the geometry rather than
  // from a sign convention is why a mistake in `offsetLeft` cannot turn a path into a hole — but
  // the SIGN is a convention and it is the counter-intuitive one: see `FRONT_FACE_SIGN`.
  const w0 = verts[0];
  const w1 = verts[1];
  const w2 = verts[2];
  const ax = w1.x - w0.x;
  const ay = w1.y - w0.y;
  const az = w1.z - w0.z;
  const bx = w2.x - w0.x;
  const by = w2.y - w0.y;
  const bz = w2.z - w0.z;
  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;
  const flip = (cx * normal[0] + cy * normal[1] + cz * normal[2]) * FRONT_FACE_SIGN < 0;
  let tris = 0;
  for (let i = 1; i + 1 < verts.length; i++) {
    if (flip) geo.indices.push(base, base + i + 1, base + i);
    else geo.indices.push(base, base + i, base + i + 1);
    tris++;
  }
  return tris;
}

function bilinear(quad: readonly Vertex[], a: number, b: number): Vertex {
  // Ring order a→b→c→d: (0,0)=a, (1,0)=b, (1,1)=c, (0,1)=d.
  const lerp = (p: Vertex, q: Vertex, t: number): Vertex => ({
    x: p.x + (q.x - p.x) * t,
    y: p.y + (q.y - p.y) * t,
    z: p.z + (q.z - p.z) * t,
    u: p.u + (q.u - p.u) * t,
    v: p.v + (q.v - p.v) * t,
    c: p.c + (q.c - p.c) * t,
    nx: p.nx + (q.nx - p.nx) * t,
    ny: p.ny + (q.ny - p.ny) * t,
    nz: p.nz + (q.nz - p.nz) * t,
  });
  const bottom = lerp(quad[0], quad[1], a);
  const top = lerp(quad[3], quad[2], a);
  return lerp(bottom, top, b);
}

function clipParams(
  poly: readonly { a: number; b: number }[],
  quad: readonly Vertex[],
  plane: { nx: number; nz: number; c: number }
): Array<{ a: number; b: number }> {
  const out: Array<{ a: number; b: number }> = [];
  const dist = (p: { a: number; b: number }) => {
    const w = bilinear(quad, p.a, p.b);
    return signedDistance(plane, w.x, w.z);
  };
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const dp = dist(p);
    const dq = dist(q);
    if (dp >= 0) out.push(p);
    if (dp >= 0 !== dq >= 0) {
      const t = dp / (dp - dq);
      out.push({ a: p.a + (q.a - p.a) * t, b: p.b + (q.b - p.b) * t });
    }
  }
  return out;
}

// ── ribbons ─────────────────────────────────────────────────────────────────────────────────
export interface BuildOptions {
  sampler: SurfaceSampler;
  /** How far the kerb's outer face drops below the ground, hiding any gap on a cross slope. */
  skirt: number;
}

function surfaceY(sampler: SurfaceSampler, x: number, z: number): number {
  return sampler.height(x, z) + SURFACE_LIFT;
}

export function buildPathGeometry(
  layouts: readonly PathLayout[],
  junctions: readonly Junction[],
  opts: BuildOptions
): MeshBuild {
  const build: MeshBuild = { groups: new Map(), posts: new Float32Array(0), triangles: 0 };
  const clipsByEntity = new Map<string, ClipRegion[]>();
  const addClip = (id: string, clip: ClipRegion) => {
    if (clip.planes.length === 0) return;
    const list = clipsByEntity.get(id) ?? [];
    list.push(clip);
    clipsByEntity.set(id, list);
  };
  for (const j of junctions) {
    addClip(j.a, j.clipForA);
    addClip(j.b, j.clipForB);
  }

  const postMatrices: number[] = [];
  for (const layout of layouts) {
    const clips = clipsByEntity.get(layout.id) ?? [];
    if (layout.form === 'plaza') {
      buildPlaza(build, layout, layouts, opts);
    } else {
      buildRibbon(build, layout, clips, opts, postMatrices);
    }
  }
  for (const j of junctions) {
    if (j.cap.length >= 3) buildCap(build, j, opts);
  }

  build.posts = new Float32Array(postMatrices);
  let tris = 0;
  for (const geo of build.groups.values()) tris += geo.indices.length / 3;
  build.triangles = tris;
  return build;
}

function buildRibbon(
  build: MeshBuild,
  layout: PathLayout,
  clips: readonly ClipRegion[],
  opts: BuildOptions,
  postMatrices: number[]
): void {
  const { sampler } = opts;
  const style = layout.style;
  const kerb = style.kerb;
  const kerbW = kerb ? kerb.width : 0;
  const inner = Math.max(0.35, layout.halfWidth - kerbW);
  const surfaceGeo = groupFor(build, style.surface);
  const kerbGeo = kerb ? groupFor(build, kerb.material) : null;
  const st = layout.stations;
  const conform = (x: number, z: number) => surfaceY(sampler, x, z);
  const conformTop = kerb ? (x: number, z: number) => surfaceY(sampler, x, z) + kerb.height : null;
  const swap = style.crossGrain;

  /**
   * Everything that depends only on a station, computed once per station.
   *
   * Consecutive quads share a whole cross-section, so anything computed per quad corner is
   * computed twice: `macroTint` is two three-octave fBm evaluations (about thirty integer hashes),
   * the height is a bilinear terrain lookup, and the surface normal is four of them. Hoisting the
   * six arrays below took the geometry build for a 3 km network from 88 ms to a third of that.
   */
  const half = layout.halfWidth;
  const count = st.length;
  const edgeLx = new Float64Array(count);
  const edgeLz = new Float64Array(count);
  const edgeRx = new Float64Array(count);
  const edgeRz = new Float64Array(count);
  const outLx = new Float64Array(count);
  const outLz = new Float64Array(count);
  const outRx = new Float64Array(count);
  const outRz = new Float64Array(count);
  const yL = new Float64Array(count);
  const yR = new Float64Array(count);
  const yOutL = new Float64Array(count);
  const yOutR = new Float64Array(count);
  const tintL = new Float32Array(count);
  const tintR = new Float32Array(count);
  const normL = new Float32Array(count * 3);
  const normR = new Float32Array(count * 3);
  const across = inner / Math.max(0.001, half);
  for (let i = 0; i < count; i++) {
    const s = st[i];
    const lx = s.x + s.tz * inner;
    const lz = s.z - s.tx * inner;
    const rx = s.x - s.tz * inner;
    const rz = s.z + s.tx * inner;
    edgeLx[i] = lx;
    edgeLz[i] = lz;
    edgeRx[i] = rx;
    edgeRz[i] = rz;
    outLx[i] = s.x + s.tz * half;
    outLz[i] = s.z - s.tx * half;
    outRx[i] = s.x - s.tz * half;
    outRz[i] = s.z + s.tx * half;
    yL[i] = surfaceY(sampler, lx, lz);
    yR[i] = surfaceY(sampler, rx, rz);
    yOutL[i] = surfaceY(sampler, outLx[i], outLz[i]);
    yOutR[i] = surfaceY(sampler, outRx[i], outRz[i]);
    tintL[i] = macroTint(lx, lz, across, style.wear);
    tintR[i] = macroTint(rx, rz, across, style.wear);
    const nl = sampler.normal(lx, lz);
    normL[i * 3] = nl[0];
    normL[i * 3 + 1] = nl[1];
    normL[i * 3 + 2] = nl[2];
    const nr = sampler.normal(rx, rz);
    normR[i * 3] = nr[0];
    normR[i * 3 + 1] = nr[1];
    normR[i * 3 + 2] = nr[2];
  }

  const surf = (i: number, left: boolean, along: number, acrossM: number): Vertex => {
    const n = left ? normL : normR;
    return {
      x: left ? edgeLx[i] : edgeRx[i],
      y: left ? yL[i] : yR[i],
      z: left ? edgeLz[i] : edgeRz[i],
      u: swap ? along : acrossM,
      v: swap ? acrossM : along,
      c: left ? tintL[i] : tintR[i],
      nx: n[i * 3],
      ny: n[i * 3 + 1],
      nz: n[i * 3 + 2],
    };
  };

  for (let i = 0; i + 1 < count; i++) {
    const a = st[i];
    const b = st[i + 1];
    emitQuad(
      surfaceGeo,
      [
        surf(i, true, a.s, inner),
        surf(i, false, a.s, -inner),
        surf(i + 1, false, b.s, -inner),
        surf(i + 1, true, b.s, inner),
      ],
      [0, 1, 0],
      clips,
      conform
    );
    if (!kerb || !kerbGeo) continue;
    const top = kerb.height;
    for (const side of [1, -1]) {
      const left = side === 1;
      const inX = left ? edgeLx : edgeRx;
      const inZ = left ? edgeLz : edgeRz;
      const inY = left ? yL : yR;
      const outX = left ? outLx : outRx;
      const outZ = left ? outLz : outRz;
      const outY = left ? yOutL : yOutR;
      const kerbVertex = (
        i2: number,
        outer: boolean,
        along: number,
        u: number,
        dy: number,
        n: [number, number, number]
      ): Vertex => ({
        x: outer ? outX[i2] : inX[i2],
        y: (outer ? outY[i2] : inY[i2]) + dy,
        z: outer ? outZ[i2] : inZ[i2],
        u,
        v: along,
        c: 0.94,
        nx: n[0],
        ny: n[1],
        nz: n[2],
      });
      const up: [number, number, number] = [0, 1, 0];
      // Top of the kerb.
      emitQuad(
        kerbGeo,
        [
          kerbVertex(i, false, a.s, 0, top, up),
          kerbVertex(i, true, a.s, kerbW, top, up),
          kerbVertex(i + 1, true, b.s, kerbW, top, up),
          kerbVertex(i + 1, false, b.s, 0, top, up),
        ],
        up,
        clips,
        conformTop
      );
      // Inner face, the one a guest sees from the path.
      const inward = faceNormal(inX[i], inZ[i], inX[i + 1], inZ[i + 1], side, true);
      emitQuad(
        kerbGeo,
        [
          kerbVertex(i, false, a.s, 0, 0, inward),
          kerbVertex(i + 1, false, b.s, 0, 0, inward),
          kerbVertex(i + 1, false, b.s, top, top, inward),
          kerbVertex(i, false, a.s, top, top, inward),
        ],
        inward,
        clips,
        null
      );
      // Outer face, dropped below the ground so a cross slope cannot open a gap under the kerb.
      const outward = faceNormal(outX[i], outZ[i], outX[i + 1], outZ[i + 1], side, false);
      emitQuad(
        kerbGeo,
        [
          kerbVertex(i, true, a.s, top, top, outward),
          kerbVertex(i + 1, true, b.s, top, top, outward),
          kerbVertex(i + 1, true, b.s, -opts.skirt, -opts.skirt, outward),
          kerbVertex(i, true, a.s, -opts.skirt, -opts.skirt, outward),
        ],
        outward,
        clips,
        null
      );
    }
  }

  if (layout.form === 'queue' && style.furniture === 'stanchion') {
    buildStanchions(build, layout, clips, opts, postMatrices);
  }
}

function faceNormal(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  side: number,
  inward: boolean
): [number, number, number] {
  let dx = bx - ax;
  let dz = bz - az;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const s = (inward ? -1 : 1) * side;
  return [dz * s, 0, -dx * s];
}

// ── plazas ──────────────────────────────────────────────────────────────────────────────────
function buildPlaza(
  build: MeshBuild,
  layout: PathLayout,
  all: readonly PathLayout[],
  opts: BuildOptions
): void {
  const { sampler } = opts;
  const geo = groupFor(build, layout.style.surface);
  const ring = layout.ring;
  const tris = triangulate(ring);
  const maxEdge = 3;
  for (let i = 0; i < tris.length; i += 3) {
    subdivideTriangle(ring[tris[i]], ring[tris[i + 1]], ring[tris[i + 2]], maxEdge, (p, q, r) => {
      emitTriangle(geo, p, q, r, sampler, layout.style.wear, worldUv);
    });
  }
  const kerb = layout.style.kerb;
  if (!kerb) return;
  const kerbGeo = groupFor(build, kerb.material);
  const others = all.filter((l) => l.id !== layout.id && l.form !== 'plaza');
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.round(len / 2));
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps;
      const t1 = (k + 1) / steps;
      const p0 = { x: a.x + (b.x - a.x) * t0, z: a.z + (b.z - a.z) * t0 };
      const p1 = { x: a.x + (b.x - a.x) * t1, z: a.z + (b.z - a.z) * t1 };
      const mid = { x: (p0.x + p1.x) / 2, z: (p0.z + p1.z) / 2 };
      // Where a path lands on the plaza there must be no kerb, or the plaza is walled in.
      let blocked = false;
      for (const other of others) {
        if (layoutContains(other, mid.x, mid.z)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      emitPlazaKerb(build, kerbGeo, layout, p0, p1, kerb.width, kerb.height, opts);
    }
  }
}

function emitPlazaKerb(
  build: MeshBuild,
  geo: Geo,
  layout: PathLayout,
  p0: Pt,
  p1: Pt,
  width: number,
  height: number,
  opts: BuildOptions
): void {
  const { sampler } = opts;
  let dx = p1.x - p0.x;
  let dz = p1.z - p0.z;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  // Outward is away from the plaza's interior; the ring may be wound either way, so it is decided
  // by testing a probe point rather than by assuming a winding.
  let nx = dz;
  let nz = -dx;
  const probe = { x: (p0.x + p1.x) / 2 + nx * 0.4, z: (p0.z + p1.z) / 2 + nz * 0.4 };
  if (layoutContains(layout, probe.x, probe.z)) {
    nx = -nx;
    nz = -nz;
  }
  const inner0 = { x: p0.x, z: p0.z };
  const inner1 = { x: p1.x, z: p1.z };
  const outer0 = { x: p0.x + nx * width, z: p0.z + nz * width };
  const outer1 = { x: p1.x + nx * width, z: p1.z + nz * width };
  const mk = (p: Pt, u: number, v: number, dy: number, n: [number, number, number]): Vertex => ({
    x: p.x,
    y: surfaceY(sampler, p.x, p.z) + dy,
    z: p.z,
    u,
    v,
    c: 0.94,
    nx: n[0],
    ny: n[1],
    nz: n[2],
  });
  const up: [number, number, number] = [0, 1, 0];
  const inward: [number, number, number] = [-nx, 0, -nz];
  const outward: [number, number, number] = [nx, 0, nz];
  emitQuad(
    geo,
    [
      mk(inner0, 0, 0, height, up),
      mk(outer0, width, 0, height, up),
      mk(outer1, width, 2, height, up),
      mk(inner1, 0, 2, height, up),
    ],
    up,
    [],
    (x, z) => surfaceY(sampler, x, z) + height
  );
  emitQuad(
    geo,
    [
      mk(inner0, 0, 0, 0, inward),
      mk(inner1, 2, 0, 0, inward),
      mk(inner1, 2, height, height, inward),
      mk(inner0, 0, height, height, inward),
    ],
    inward,
    [],
    null
  );
  emitQuad(
    geo,
    [
      mk(outer0, 0, height, height, outward),
      mk(outer1, 2, height, height, outward),
      mk(outer1, 2, -opts.skirt, -opts.skirt, outward),
      mk(outer0, 0, -opts.skirt, -opts.skirt, outward),
    ],
    outward,
    [],
    null
  );
}

function subdivideTriangle(
  a: Pt,
  b: Pt,
  c: Pt,
  maxEdge: number,
  emit: (p: Pt, q: Pt, r: Pt) => void,
  depth = 0
): void {
  const ab = (b.x - a.x) ** 2 + (b.z - a.z) ** 2;
  const bc = (c.x - b.x) ** 2 + (c.z - b.z) ** 2;
  const ca = (a.x - c.x) ** 2 + (a.z - c.z) ** 2;
  if (depth > 6 || Math.max(ab, bc, ca) <= maxEdge * maxEdge) {
    emit(a, b, c);
    return;
  }
  const mab = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  const mbc = { x: (b.x + c.x) / 2, z: (b.z + c.z) / 2 };
  const mca = { x: (c.x + a.x) / 2, z: (c.z + a.z) / 2 };
  subdivideTriangle(a, mab, mca, maxEdge, emit, depth + 1);
  subdivideTriangle(mab, b, mbc, maxEdge, emit, depth + 1);
  subdivideTriangle(mca, mbc, c, maxEdge, emit, depth + 1);
  subdivideTriangle(mab, mbc, mca, maxEdge, emit, depth + 1);
}

/** World metres as uv: what a plaza uses, so two plazas that touch share one grout line. */
function worldUv(p: Pt): [number, number] {
  return [p.x, p.z];
}

function emitTriangle(
  geo: Geo,
  a: Pt,
  b: Pt,
  c: Pt,
  sampler: SurfaceSampler,
  wear: number,
  uv: (p: Pt) => [number, number]
): void {
  const base = geo.positions.length / 3;
  for (const p of [a, b, c]) {
    const y = surfaceY(sampler, p.x, p.z);
    const n = sampler.normal(p.x, p.z);
    geo.positions.push(p.x, y, p.z);
    geo.normals.push(n[0], n[1], n[2]);
    const st = uv(p);
    geo.uvs.push(st[0], st[1]);
    const tint = macroTint(p.x, p.z, 0.35, wear);
    geo.colors.push(tint, tint, tint, 1);
  }
  const ax = b.x - a.x;
  const az = b.z - a.z;
  const bx = c.x - a.x;
  const bz = c.z - a.z;
  // `cross(AB, AC).y` is `az·bx − ax·bz`; a front face wants it pointing the way `FRONT_FACE_SIGN`
  // says, which for an up-facing plaza triangle is DOWN.
  if ((az * bx - ax * bz) * FRONT_FACE_SIGN > 0) geo.indices.push(base, base + 1, base + 2);
  else geo.indices.push(base, base + 2, base + 1);
}

// ── junction caps ───────────────────────────────────────────────────────────────────────────
function buildCap(build: MeshBuild, junction: Junction, opts: BuildOptions): void {
  const geo = groupFor(build, junction.capMaterial);
  const ring = junction.cap;
  const tris = triangulate(ring);
  const f = junction.capFrame;
  // The owning path's own frame, continued across the junction: `across` is the signed distance
  // from its centreline, `along` its arc length. Same convention as `buildRibbon`, so the paving
  // pattern runs through the crossing instead of starting again inside it.
  const uv = (p: Pt): [number, number] => {
    const dx = p.x - f.ox;
    const dz = p.z - f.oz;
    const along = f.s + dx * f.tx + dz * f.tz;
    const across = dx * f.tz - dz * f.tx;
    return f.swap ? [along, across] : [across, along];
  };
  for (let i = 0; i < tris.length; i += 3) {
    subdivideTriangle(ring[tris[i]], ring[tris[i + 1]], ring[tris[i + 2]], 2, (p, q, r) => {
      emitTriangle(geo, p, q, r, opts.sampler, 0.6, uv);
    });
  }
}

// ── queue furniture ─────────────────────────────────────────────────────────────────────────
const POST_SPACING = 2.2;
const POST_HEIGHT = 0.98;
const BELT_HEIGHT = 0.66;
const BELT_SAG = 0.07;
const BELT_WIDTH = 0.05;

function buildStanchions(
  build: MeshBuild,
  layout: PathLayout,
  clips: readonly ClipRegion[],
  opts: BuildOptions,
  postMatrices: number[]
): void {
  const { sampler } = opts;
  const beltGeo = groupFor(build, STANCHION_BELT_MATERIAL);
  const st = layout.stations;
  const total = layout.lengthM;
  const count = Math.max(2, Math.round(total / POST_SPACING));
  const step = total / count;
  const offset = Math.max(0.2, layout.halfWidth - 0.12);
  for (const side of [1, -1]) {
    let previous: { x: number; y: number; z: number } | null = null;
    for (let i = 0; i <= count; i++) {
      const s = i * step;
      const station = stationAt(st, s);
      const p = offsetLeft(station, side * offset);
      const blocked = clips.some((c) => regionContains(c, p.x, p.z));
      const y = surfaceY(sampler, p.x, p.z);
      if (!blocked) {
        pushPostMatrix(postMatrices, p.x, y, p.z);
      }
      const here = blocked ? null : { x: p.x, y, z: p.z };
      if (previous && here) emitBelt(build, beltGeo, previous, here);
      previous = here;
    }
  }
}

function stationAt(st: readonly Station[], s: number): Station {
  if (st.length === 0) return { s: 0, x: 0, z: 0, tx: 1, tz: 0 };
  let i = 0;
  while (i + 2 < st.length && st[i + 1].s < s) i++;
  const a = st[i];
  const b = st[Math.min(st.length - 1, i + 1)];
  const span = b.s - a.s;
  const t = span > 1e-6 ? Math.max(0, Math.min(1, (s - a.s) / span)) : 0;
  const tx = a.tx + (b.tx - a.tx) * t;
  const tz = a.tz + (b.tz - a.tz) * t;
  const len = Math.hypot(tx, tz) || 1;
  return { s, x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, tx: tx / len, tz: tz / len };
}

/**
 * Column-major 4×4, which is what `thinInstanceSetBuffer('matrix', …, 16)` reads.
 *
 * The translation carries `POST_HEIGHT / 2` because a Babylon cylinder is centred on its own
 * origin: putting the offset here rather than baking a transform into the source mesh keeps the
 * post a plain builder call, and the caller passes the GROUND height like everything else in this
 * file does.
 */
function pushPostMatrix(out: number[], x: number, y: number, z: number): void {
  out.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y + POST_HEIGHT / 2, z, 1);
}

function emitBelt(
  build: MeshBuild,
  geo: Geo,
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): void {
  const segments = 4;
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const nx = dz;
  const nz = -dx;
  const at = (t: number) => {
    const sag = Math.sin(Math.PI * t) * BELT_SAG;
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t + BELT_HEIGHT - sag,
      z: a.z + (b.z - a.z) * t,
    };
  };
  for (let i = 0; i < segments; i++) {
    const p = at(i / segments);
    const q = at((i + 1) / segments);
    // Two faces so the belt reads from both sides without a double-sided material.
    for (const facing of [1, -1]) {
      const n: [number, number, number] = [nx * facing, 0, nz * facing];
      const mk = (
        point: { x: number; y: number; z: number },
        dy: number,
        u: number,
        v: number
      ): Vertex => ({
        x: point.x,
        y: point.y + dy,
        z: point.z,
        u,
        v,
        c: 1,
        nx: n[0],
        ny: n[1],
        nz: n[2],
      });
      emitQuad(
        geo,
        [
          mk(p, -BELT_WIDTH / 2, 0, 0),
          mk(q, -BELT_WIDTH / 2, len, 0),
          mk(q, BELT_WIDTH / 2, len, BELT_WIDTH),
          mk(p, BELT_WIDTH / 2, 0, BELT_WIDTH),
        ],
        n,
        [],
        null
      );
    }
  }
}

export { POST_HEIGHT, MESH_SPACING };
