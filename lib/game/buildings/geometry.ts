/**
 * The geometry the kit is cut from, and the atlas that lets a whole building be three draw calls.
 *
 * A `Surface` is a plain array accumulator — positions, normals, uvs, vertex colours, indices — and
 * every kit piece is a sequence of appends into one. The mesh is created once at the end, so a
 * ticket hall is one draw call rather than four hundred parented boxes, and every copy of it in the
 * park is a matrix in that mesh's thin-instance buffer.
 *
 * **Winding.** The scene is right-handed (`scene.useRightHandedSystem = true`) and Babylon's default
 * side orientation flips with it, so a triangle authored counter-clockwise as seen from the front is
 * emitted with its last two indices swapped. Everything here authors counter-clockwise from outside
 * and lets {@link tri} apply the convention once. `terrain/chunks.ts` records what getting this
 * wrong looks like: every chunk back-face culled, a park of black holes.
 *
 * **Colour is linear.** `vColor` multiplies into the albedo after the texture has been linearised,
 * so a palette written in sRGB comes out washed. {@link srgb} does the conversion once, which is why
 * every palette in this module reads as hex a colour picker would show.
 *
 * **The atlas is why a building is three draw calls.** Twelve surfaces sit in one 4 × 3 texture set,
 * so brick, stone, render, slate, zinc and painted joinery all share one material. The cost is that
 * UVs can no longer WRAP: a 4 m wall cannot ask the sampler to repeat a 1 m tile, because the repeat
 * would walk into the neighbouring tile. {@link addQuad} subdivides instead. That trade is why this
 * module builds a facade **bay by bay** rather than as one big wall with holes cut in it — a 3.4 m
 * bay panel subdivides into three or four cells, where a 44 m elevation would need forty-four and
 * hit the cap.
 *
 * **A `Frame` is the kit's coordinate system.** Everything that hangs on a wall — a window, a door,
 * a sill, a pilaster, a sign band — is placed by `(u, v, out)` on the facade it belongs to: u along
 * it, v up it, out along its normal. That is what makes the same window piece work on the front of a
 * box, on the canted side of an octagonal tower and on a wing rotated 30°, without a second code
 * path or a matrix stack.
 *
 * Babylon-free on purpose: the whole builder runs under node, so `selftest.mjs` can measure door
 * heights, window sills, triangle counts and bounds — none of which a screenshot answers.
 */

import type { SurfaceName } from './types';

export interface Surface {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

export type Rgb = [number, number, number];
export type P3 = [number, number, number];

export function newSurface(): Surface {
  return { positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

export function surfaceTriangles(s: Surface): number {
  return s.indices.length / 3;
}

// ── Colour ──────────────────────────────────────────────────────────────────────────────────

/** sRGB hex string (`#rrggbb`) to linear RGB. */
export function srgb(hex: string): Rgb {
  const n = parseInt(String(hex).replace('#', ''), 16) || 0;
  const f = (c: number): number => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)];
}

export function shade(c: Rgb, factor: number): Rgb {
  return [c[0] * factor, c[1] * factor, c[2] * factor];
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// ── The atlas ───────────────────────────────────────────────────────────────────────────────

/** Atlas slot per surface name. The order is the texture's layout and is shared with `shaders.ts`. */
export const TILE: Record<SurfaceName, number> = {
  brick: 0,
  render: 1,
  ashlar: 2,
  timber: 3,
  slate: 4,
  pantile: 5,
  zinc: 6,
  shingle: 7,
  panel: 8,
  concrete: 9,
  paving: 10,
  metal: 11,
};

export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 3;

/**
 * How many metres of real surface one tile covers — the texel density per material.
 *
 * These are the sizes the shaders are drawn at: the brick tile holds four courses over 0.9 m
 * (a 65 mm brick and a 10 mm joint course up at 0.075 m × 4 ≈ 0.3 — three brick heights per third
 * of the tile), the slate tile two courses over 0.8 m, the ashlar tile one and a half blocks.
 * Change one here and the shader that draws it has to change with it or the scale lies.
 */
export const TILE_METRES: Record<number, number> = {
  [TILE.brick]: 0.9,
  [TILE.render]: 1.1,
  [TILE.ashlar]: 1.6,
  [TILE.timber]: 1.0,
  [TILE.slate]: 0.8,
  [TILE.pantile]: 0.75,
  [TILE.zinc]: 1.2,
  [TILE.shingle]: 0.7,
  [TILE.panel]: 1.2,
  [TILE.concrete]: 1.6,
  [TILE.paving]: 1.5,
  [TILE.metal]: 0.6,
};

/** Half a texel at the base resolution, so trilinear filtering does not walk into the neighbour. */
let atlasInset = 0.002;

/** Called by `main.ts` once the texture size is known. */
export function setAtlasResolution(tileSize: number): void {
  atlasInset = 0.6 / Math.max(8, tileSize);
}

export function atlasInsetValue(): number {
  return atlasInset;
}

/**
 * Map a tile-local coordinate in [0,1]² into the atlas.
 *
 * CLAMPED, never wrapped: a caller asking for 1.0 means the far edge of the tile, and wrapping it to
 * 0.0 would put the last column of a subdivided wall back at the tile's left edge. Repeating is the
 * caller's job ({@link addQuad} emits one tile per cell) precisely because the sampler cannot do it.
 */
export function tileUv(tile: number, s: number, t: number): [number, number] {
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS) % ATLAS_ROWS;
  const w = 1 / ATLAS_COLS;
  const h = 1 / ATLAS_ROWS;
  const cs = Math.min(1 - atlasInset, Math.max(atlasInset, s));
  const ct = Math.min(1 - atlasInset, Math.max(atlasInset, t));
  return [(col + cs) * w, (row + ct) * h];
}

/** A surface name a pack wrote, resolved to a slot. An unknown name falls back to render. */
export function tileFor(name: string | undefined, fallback: SurfaceName = 'render'): number {
  const slot = TILE[name as SurfaceName];
  return slot === undefined ? TILE[fallback] : slot;
}

// ── Primitives ──────────────────────────────────────────────────────────────────────────────

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
  colour: Rgb
): number {
  const index = s.positions.length / 3;
  s.positions.push(px, py, pz);
  s.normals.push(nx, ny, nz);
  s.uvs.push(u, v);
  s.colors.push(colour[0], colour[1], colour[2], 1);
  return index;
}

/** Vertices counter-clockwise as seen from the front. See the winding note at the top. */
export function tri(s: Surface, a: number, b: number, c: number): void {
  s.indices.push(a, c, b);
}

export interface QuadOptions {
  colour: Rgb;
  tile: number;
  /** Repeat counts across and up. Defaults to the edge length over the tile's metres. */
  repeatU?: number;
  repeatV?: number;
  /** Flip the normal. */
  back?: boolean;
  /** Tint the far edge, for weathering down a wall or a gradient up a roof. */
  colourTop?: Rgb;
  /** Cap on the subdivision, both axes. */
  maxCells?: number;
}

/**
 * A planar quad `a → b → c → d` (counter-clockwise from the front), subdivided so an atlas tile can
 * repeat over it.
 *
 * `a→b` is the U direction and `a→d` the V direction; the subdivision is bilinear over the four
 * corners, so this works for a trapezoid — a hipped roof panel, a gable end, a mansard slope — as
 * well as for a rectangle.
 */
export function addQuad(s: Surface, a: P3, b: P3, c: P3, d: P3, opts: QuadOptions): void {
  const metres = TILE_METRES[opts.tile] ?? 1;
  const lenU = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const lenV = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
  if (lenU < 1e-5 || lenV < 1e-5) return;
  const cap = opts.maxCells ?? 10;
  const nu = Math.max(1, Math.min(cap, Math.round(opts.repeatU ?? lenU / metres)));
  const nv = Math.max(1, Math.min(cap, Math.round(opts.repeatV ?? lenV / metres)));

  const e1: P3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2: P3 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let nx = e1[1] * e2[2] - e1[2] * e2[1];
  let ny = e1[2] * e2[0] - e1[0] * e2[2];
  let nz = e1[0] * e2[1] - e1[1] * e2[0];
  const nl = Math.hypot(nx, ny, nz) || 1;
  const sign = opts.back ? -1 : 1;
  nx = (nx / nl) * sign;
  ny = (ny / nl) * sign;
  nz = (nz / nl) * sign;

  const at = (tu: number, tv: number): P3 => [
    a[0] * (1 - tu) * (1 - tv) + b[0] * tu * (1 - tv) + c[0] * tu * tv + d[0] * (1 - tu) * tv,
    a[1] * (1 - tu) * (1 - tv) + b[1] * tu * (1 - tv) + c[1] * tu * tv + d[1] * (1 - tu) * tv,
    a[2] * (1 - tu) * (1 - tv) + b[2] * tu * (1 - tv) + c[2] * tu * tv + d[2] * (1 - tu) * tv,
  ];

  /**
   * Four fresh vertices per cell rather than one shared grid.
   *
   * A shared vertex on an interior seam would have to carry u = 1 for the cell on its left and u = 0
   * for the cell on its right, and it can only carry one — which is what an atlas costs, and what a
   * WRAP sampler would otherwise have done.
   */
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const u0 = i / nu;
      const u1 = (i + 1) / nu;
      const v0 = j / nv;
      const v1 = (j + 1) / nv;
      const corners: Array<[P3, number, number]> = [
        [at(u0, v0), 0, 0],
        [at(u1, v0), 1, 0],
        [at(u1, v1), 1, 1],
        [at(u0, v1), 0, 1],
      ];
      const idx: number[] = [];
      for (const [p, ts, tt] of corners) {
        const [uu, vv] = tileUv(opts.tile, ts, tt);
        const tv = (v0 + v1) / 2;
        const colour = opts.colourTop ? mixRgb(opts.colour, opts.colourTop, tv) : opts.colour;
        idx.push(vertex(s, p[0], p[1], p[2], nx, ny, nz, uu, vv, colour));
      }
      if (opts.back) {
        tri(s, idx[0], idx[3], idx[1]);
        tri(s, idx[1], idx[3], idx[2]);
      } else {
        tri(s, idx[0], idx[1], idx[3]);
        tri(s, idx[1], idx[2], idx[3]);
      }
    }
  }
}

/** A triangle with one tile stretched over it — a gable end, a hip. */
export function addTriangle(s: Surface, a: P3, b: P3, c: P3, colour: Rgb, tile: number): void {
  const e1: P3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2: P3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let nx = e1[1] * e2[2] - e1[2] * e2[1];
  let ny = e1[2] * e2[0] - e1[0] * e2[2];
  let nz = e1[0] * e2[1] - e1[1] * e2[0];
  const nl = Math.hypot(nx, ny, nz) || 1;
  nx /= nl;
  ny /= nl;
  nz /= nl;
  const uv: Array<[number, number]> = [
    tileUv(tile, 0, 0),
    tileUv(tile, 1, 0),
    tileUv(tile, 0.5, 1),
  ];
  const ia = vertex(s, a[0], a[1], a[2], nx, ny, nz, uv[0][0], uv[0][1], colour);
  const ib = vertex(s, b[0], b[1], b[2], nx, ny, nz, uv[1][0], uv[1][1], colour);
  const ic = vertex(s, c[0], c[1], c[2], nx, ny, nz, uv[2][0], uv[2][1], colour);
  tri(s, ia, ib, ic);
}

export interface BoxOptions {
  colour: Rgb;
  /** Tile per face: `[+x, -x, +y, -y, +z, -z]`, or one tile for all six. */
  tile: number | [number, number, number, number, number, number];
  /** Faces to skip, same order. */
  skip?: boolean[];
  colourTop?: Rgb;
  maxCells?: number;
}

/** An axis-aligned box from `min` to `max`, in whatever space the caller is working in. */
export function addBox(s: Surface, min: P3, max: P3, opts: BoxOptions): void {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const t =
    typeof opts.tile === 'number' ? [0, 1, 2, 3, 4, 5].map(() => opts.tile as number) : opts.tile;
  const skip = opts.skip ?? [];
  const o = (tile: number): QuadOptions => ({
    colour: opts.colour,
    tile,
    colourTop: opts.colourTop,
    maxCells: opts.maxCells,
  });
  if (!skip[0]) addQuad(s, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], o(t[0]));
  if (!skip[1]) addQuad(s, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], o(t[1]));
  if (!skip[2]) addQuad(s, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], o(t[2]));
  if (!skip[3]) addQuad(s, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], o(t[3]));
  if (!skip[4]) addQuad(s, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], o(t[4]));
  if (!skip[5]) addQuad(s, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], o(t[5]));
}

export interface PrismOptions {
  colour: Rgb;
  tile: number;
  sides: number;
  /** Radians; 0 puts a vertex on +X. */
  phase?: number;
  capTop?: boolean;
  capBottom?: boolean;
  colourTop?: Rgb;
  /** Only draw these facets (indices into the ring). Everything when absent. */
  only?: number[];
}

/**
 * A vertical prism from `y0` to `y1`, with radii that may differ — a cylinder, a cone or a truncated
 * cone out of one call. `radius` is the CIRCUMRADIUS, so a polygon's corners sit on it.
 */
export function addPrism(
  s: Surface,
  cx: number,
  cz: number,
  y0: number,
  y1: number,
  r0: number,
  r1: number,
  opts: PrismOptions
): void {
  const n = Math.max(3, Math.round(opts.sides));
  const phase = opts.phase ?? 0;
  const metres = TILE_METRES[opts.tile] ?? 1;
  const face = (2 * Math.PI * Math.max(r0, r1)) / n;
  const repeatU = Math.max(1, Math.round(face / metres));
  const repeatV = Math.max(1, Math.round(Math.abs(y1 - y0) / metres));
  for (let i = 0; i < n; i++) {
    if (opts.only && !opts.only.includes(i)) continue;
    const a0 = phase + (i / n) * Math.PI * 2;
    const a1 = phase + ((i + 1) / n) * Math.PI * 2;
    const p0: P3 = [cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0];
    const p1: P3 = [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0];
    const p2: P3 = [cx + Math.cos(a1) * r1, y1, cz + Math.sin(a1) * r1];
    const p3: P3 = [cx + Math.cos(a0) * r1, y1, cz + Math.sin(a0) * r1];
    addQuad(s, p0, p1, p2, p3, {
      colour: opts.colour,
      colourTop: opts.colourTop,
      tile: opts.tile,
      repeatU,
      repeatV,
    });
  }
  if (opts.capTop && r1 > 0.001) addDisc(s, cx, y1, cz, r1, n, phase, opts.colour, opts.tile, false);
  if (opts.capBottom && r0 > 0.001)
    addDisc(s, cx, y0, cz, r0, n, phase, opts.colour, opts.tile, true);
}

export function addDisc(
  s: Surface,
  cx: number,
  y: number,
  cz: number,
  r: number,
  sides: number,
  phase: number,
  colour: Rgb,
  tile: number,
  down: boolean
): void {
  const n = Math.max(3, Math.round(sides));
  const ny = down ? -1 : 1;
  const [cu, cv] = tileUv(tile, 0.5, 0.5);
  const centre = vertex(s, cx, y, cz, 0, ny, 0, cu, cv, colour);
  const ring: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    const [u, v] = tileUv(tile, 0.5 + Math.cos(a) * 0.45, 0.5 + Math.sin(a) * 0.45);
    ring.push(vertex(s, cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, 0, ny, 0, u, v, colour));
  }
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    if (down) tri(s, centre, a, b);
    else tri(s, centre, b, a);
  }
}

/**
 * A round tube between two points — a downpipe, a railing, a flagpole, a canopy tie.
 *
 * Six sides by default: a 60 mm downpipe seen from two metres does not need eight, and this module
 * draws a lot of them.
 */
export function addTube(
  s: Surface,
  from: P3,
  to: P3,
  radius: number,
  colour: Rgb,
  tile: number,
  sides = 6
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-4) return;
  const w: P3 = [dx / len, dy / len, dz / len];
  const ref: P3 = Math.abs(w[1]) > 0.94 ? [1, 0, 0] : [0, 1, 0];
  const u: P3 = [
    ref[1] * w[2] - ref[2] * w[1],
    ref[2] * w[0] - ref[0] * w[2],
    ref[0] * w[1] - ref[1] * w[0],
  ];
  const ul = Math.hypot(u[0], u[1], u[2]) || 1;
  u[0] /= ul;
  u[1] /= ul;
  u[2] /= ul;
  const v: P3 = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
  const n = Math.max(3, sides);
  const base = s.positions.length / 3;
  for (let end = 0; end < 2; end++) {
    const o = end === 0 ? from : to;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const nxv = u[0] * ca + v[0] * sa;
      const nyv = u[1] * ca + v[1] * sa;
      const nzv = u[2] * ca + v[2] * sa;
      const [uu, vv] = tileUv(tile, i / n, end === 0 ? 0.02 : Math.min(0.98, len / 0.6));
      vertex(
        s,
        o[0] + nxv * radius,
        o[1] + nyv * radius,
        o[2] + nzv * radius,
        nxv,
        nyv,
        nzv,
        uu,
        vv,
        colour
      );
    }
  }
  const stride = n + 1;
  for (let i = 0; i < n; i++) {
    const a = base + i;
    const b = base + i + 1;
    const c = base + stride + i + 1;
    const d = base + stride + i;
    tri(s, a, b, c);
    tri(s, a, c, d);
  }
}

// ── Frames ──────────────────────────────────────────────────────────────────────────────────

/**
 * A wall to hang something on: an origin at its bottom-left corner seen from outside, the direction
 * along it, the direction up it, and the way it faces.
 *
 * Every opening, sill, pilaster and sign in this module is placed in `(u, v, out)` on one of these,
 * which is what lets the same window piece land on a box, on the canted facet of an octagonal tower
 * and on a wing rotated 30° with no second code path.
 */
export interface Frame {
  o: P3;
  right: P3;
  up: P3;
  normal: P3;
  /** Length along `right`, metres. */
  width: number;
  /** Length along `up`, metres. */
  height: number;
}

export function framePoint(f: Frame, u: number, v: number, out: number): P3 {
  return [
    f.o[0] + f.right[0] * u + f.up[0] * v + f.normal[0] * out,
    f.o[1] + f.right[1] * u + f.up[1] * v + f.normal[1] * out,
    f.o[2] + f.right[2] * u + f.up[2] * v + f.normal[2] * out,
  ];
}

/** Slide a frame along its own axes, keeping its orientation. */
export function offsetFrame(f: Frame, du: number, dv: number, dout: number): Frame {
  return { ...f, o: framePoint(f, du, dv, dout) };
}

/** A sub-rectangle of a frame, as a frame of its own. */
export function subFrame(f: Frame, u0: number, v0: number, width: number, height: number): Frame {
  return { ...f, o: framePoint(f, u0, v0, 0), width, height };
}

/** A rectangle on a frame, facing out. */
export function addFrameQuad(
  s: Surface,
  f: Frame,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  out: number,
  opts: QuadOptions
): void {
  addQuad(
    s,
    framePoint(f, u0, v0, out),
    framePoint(f, u1, v0, out),
    framePoint(f, u1, v1, out),
    framePoint(f, u0, v1, out),
    opts
  );
}

/**
 * A wall panel with a rectangular hole in it: four quads round the opening.
 *
 * This is the piece the whole facade is made of. Doing it as a hole rather than as a box with a
 * plane stuck on the front is what gives the reveal something to be cut into, and it is why the
 * openings in this module have depth from every angle instead of only head-on.
 */
export function addPanelWithHole(
  s: Surface,
  f: Frame,
  hole: { u0: number; u1: number; v0: number; v1: number },
  out: number,
  opts: QuadOptions
): void {
  const { u0, u1, v0, v1 } = hole;
  const w = f.width;
  const h = f.height;
  // below
  if (v0 > 1e-4) addFrameQuad(s, f, 0, 0, w, v0, out, opts);
  // above
  if (h - v1 > 1e-4) addFrameQuad(s, f, 0, v1, w, h, out, opts);
  // left
  if (u0 > 1e-4) addFrameQuad(s, f, 0, v0, u0, v1, out, opts);
  // right
  if (w - u1 > 1e-4) addFrameQuad(s, f, u1, v0, w, v1, out, opts);
}

/**
 * The jambs, head and sill of an opening: the four surfaces of the reveal, facing inwards.
 *
 * `depth` is how far back the glazing sits. These are the faces that catch a raking sun and put a
 * hard shadow down one side of every window, which is most of what stops a facade reading as a
 * printed picture of a facade.
 */
export function addReveal(
  s: Surface,
  f: Frame,
  hole: { u0: number; u1: number; v0: number; v1: number },
  outFace: number,
  depth: number,
  colour: Rgb,
  tile: number
): void {
  const { u0, u1, v0, v1 } = hole;
  const back = outFace - depth;
  const q = (a: P3, b: P3, c: P3, d: P3): void =>
    addQuad(s, a, b, c, d, { colour, tile, repeatU: 1, repeatV: 1 });
  // left jamb (faces +u)
  q(
    framePoint(f, u0, v0, back),
    framePoint(f, u0, v0, outFace),
    framePoint(f, u0, v1, outFace),
    framePoint(f, u0, v1, back)
  );
  // right jamb (faces -u)
  q(
    framePoint(f, u1, v0, outFace),
    framePoint(f, u1, v0, back),
    framePoint(f, u1, v1, back),
    framePoint(f, u1, v1, outFace)
  );
  // head (faces down)
  q(
    framePoint(f, u0, v1, outFace),
    framePoint(f, u1, v1, outFace),
    framePoint(f, u1, v1, back),
    framePoint(f, u0, v1, back)
  );
  // sill (faces up)
  q(
    framePoint(f, u0, v0, back),
    framePoint(f, u1, v0, back),
    framePoint(f, u1, v0, outFace),
    framePoint(f, u0, v0, outFace)
  );
}

/**
 * A band running along a frame that projects from the wall — a cornice, a string course, a sill, a
 * sign fascia, a plinth cap. Five faces: front, top, bottom and two returns.
 *
 * The top face is what a cornice is FOR: it catches the sun from above and draws a bright line
 * across the building under the eaves, which is how a European facade reads at 200 m.
 */
export function addBand(
  s: Surface,
  f: Frame,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  out0: number,
  out1: number,
  colour: Rgb,
  tile: number
): void {
  const p = (u: number, v: number, o: number): P3 => framePoint(f, u, v, o);
  const opt = { colour, tile, repeatU: undefined, repeatV: undefined, maxCells: 8 };
  // front
  addQuad(s, p(u0, v0, out1), p(u1, v0, out1), p(u1, v1, out1), p(u0, v1, out1), opt);
  // top
  addQuad(s, p(u0, v1, out1), p(u1, v1, out1), p(u1, v1, out0), p(u0, v1, out0), {
    colour: shade(colour, 1.06),
    tile,
    maxCells: 8,
  });
  // bottom (soffit)
  addQuad(s, p(u0, v0, out0), p(u1, v0, out0), p(u1, v0, out1), p(u0, v0, out1), {
    colour: shade(colour, 0.62),
    tile,
    maxCells: 8,
  });
  // returns
  addQuad(s, p(u1, v0, out1), p(u1, v0, out0), p(u1, v1, out0), p(u1, v1, out1), {
    colour: shade(colour, 0.86),
    tile,
    repeatU: 1,
  });
  addQuad(s, p(u0, v0, out0), p(u0, v0, out1), p(u0, v1, out1), p(u0, v1, out0), {
    colour: shade(colour, 0.86),
    tile,
    repeatU: 1,
  });
}

/**
 * A round-headed arch over an opening: the wall above it, and the soffit of the arch itself.
 *
 * `segments` slices the semicircle; eight is enough for a 1.4 m arch at four metres and cheap enough
 * to put on every bay of an arcade.
 */
export function addArchHead(
  s: Surface,
  f: Frame,
  u0: number,
  u1: number,
  springing: number,
  outFace: number,
  depth: number,
  wallColour: Rgb,
  wallTile: number,
  revealColour: Rgb,
  revealTile: number,
  segments = 8
): void {
  const r = (u1 - u0) / 2;
  const cu = (u0 + u1) / 2;
  const back = outFace - depth;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI;
    const a1 = ((i + 1) / segments) * Math.PI;
    const p0: [number, number] = [cu - Math.cos(a0) * r, springing + Math.sin(a0) * r];
    const p1: [number, number] = [cu - Math.cos(a1) * r, springing + Math.sin(a1) * r];
    // The spandrel: wall between the arch and the square top of the opening's box.
    const top = springing + r;
    addQuad(
      s,
      framePoint(f, p0[0], p0[1], outFace),
      framePoint(f, p1[0], p1[1], outFace),
      framePoint(f, p1[0], top, outFace),
      framePoint(f, p0[0], top, outFace),
      { colour: wallColour, tile: wallTile, repeatU: 1, repeatV: 1 }
    );
    // The soffit of the arch, facing into the opening.
    addQuad(
      s,
      framePoint(f, p1[0], p1[1], back),
      framePoint(f, p0[0], p0[1], back),
      framePoint(f, p0[0], p0[1], outFace),
      framePoint(f, p1[0], p1[1], outFace),
      { colour: revealColour, tile: revealTile, repeatU: 1, repeatV: 1 }
    );
  }
}

/**
 * A flat strip along a polyline on a frame, extruded a little — the hands and marks of a clock face.
 *
 * Geometry rather than a texture because it has to read at 40 m, which is where a clock on a park
 * building is actually looked at.
 */
export function addStroke(
  s: Surface,
  f: Frame,
  points: number[],
  out: number,
  width: number,
  colour: Rgb,
  tile: number
): void {
  for (let i = 0; i + 3 < points.length; i += 2) {
    const x0 = points[i];
    const y0 = points[i + 1];
    const x1 = points[i + 2];
    const y1 = points[i + 3];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 1e-5) continue;
    const nx = (-dy / len) * width * 0.5;
    const ny = (dx / len) * width * 0.5;
    addQuad(
      s,
      framePoint(f, x0 - nx, y0 - ny, out),
      framePoint(f, x1 - nx, y1 - ny, out),
      framePoint(f, x1 + nx, y1 + ny, out),
      framePoint(f, x0 + nx, y0 + ny, out),
      { colour, tile, repeatU: 1, repeatV: 1 }
    );
  }
}

// ── Bounds ──────────────────────────────────────────────────────────────────────────────────

export function boundsOf(...surfaces: Surface[]): { min: P3; max: P3 } {
  const min: P3 = [Infinity, Infinity, Infinity];
  const max: P3 = [-Infinity, -Infinity, -Infinity];
  for (const s of surfaces) {
    for (let i = 0; i < s.positions.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = s.positions[i + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }
  }
  if (!Number.isFinite(min[0])) return { min: [0, 0, 0], max: [0, 0, 0] };
  return { min, max };
}
