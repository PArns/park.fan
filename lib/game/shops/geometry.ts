/**
 * Geometry primitives the shop builder works in, and the atlas that lets a whole building be one
 * draw call.
 *
 * A `Surface` is a plain array accumulator — positions, normals, uvs, vertex colours, indices — and
 * a builder is a sequence of calls appending to one. The mesh is created once at the end, so a
 * kiosk is one draw call rather than forty parented boxes, and every copy of it in the park is a
 * matrix in that mesh's thin-instance buffer.
 *
 * **Winding.** The scene is right-handed (`scene.useRightHandedSystem = true`) and Babylon's
 * default side orientation flips with it, so a triangle authored counter-clockwise as seen from the
 * front is emitted with its last two indices swapped. `terrain/chunks.ts` records what getting this
 * wrong looks like: every ground chunk back-face culled, a park of black holes. Everything here
 * authors counter-clockwise from outside and lets {@link tri} apply the convention once.
 *
 * **Colour is linear.** `vColor` multiplies into the albedo AFTER the texture has been linearised,
 * so a palette written in sRGB comes out washed. {@link srgb} does the conversion once, which is
 * why the palettes in `manifest.ts` read as hex a colour picker would show.
 *
 * **The atlas is why a shop is one mesh.** Eight surfaces — render, roof tile, painted boards,
 * painted metal, awning canvas, chalkboard, paving, brick — sit in one 4×2 texture set, so every
 * opaque part of a building shares a material and therefore a draw call. The cost is that UVs can
 * no longer WRAP: a 4 m wall cannot ask the sampler to repeat a 1 m tile, because the repeat would
 * walk into the neighbouring tile. {@link addQuad} subdivides instead — a 4 × 2.6 m wall at a 1 m
 * tile becomes 4 × 3 quads, 24 triangles rather than 2 — which is the trade this module makes
 * knowingly: a park holds tens of shops, not tens of thousands of props, so triangles are cheap
 * here and draw calls are not.
 *
 * Bleed between neighbouring tiles appears at the mip levels where the filter kernel spans the
 * boundary; with a 4×2 layout that is the last three or four levels, by which point a shop is a few
 * pixels wide. Each tile's UVs are inset by half a texel at the base resolution as well.
 *
 * **Babylon-free on purpose.** The whole builder is pure arrays, so `lib/game/shops/selftest.mjs`
 * can build all twelve shops under node and measure them — bounds, triangle counts, whether the
 * counter is at a human height — none of which a screenshot answers and all of which a green build
 * misses. `toMesh` lives in `main.ts`, where the scene already is.
 */

export interface Surface {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

export type Rgb = [number, number, number];

export function newSurface(): Surface {
  return { positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

export function surfaceTriangles(s: Surface): number {
  return s.indices.length / 3;
}

// ── Colour ──────────────────────────────────────────────────────────────────────────────────

/** sRGB hex string (`#rrggbb`) to linear RGB. */
export function srgb(hex: string): Rgb {
  const n = parseInt(hex.replace('#', ''), 16) || 0;
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

/** Atlas slot ids. The order is the texture's layout and is shared with `textures.ts`. */
export const TILE = {
  render: 0,
  roof: 1,
  timber: 2,
  metal: 3,
  canvas: 4,
  board: 5,
  paving: 6,
  brick: 7,
} as const;
export type TileId = (typeof TILE)[keyof typeof TILE];

export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 2;

/** How many metres of real surface one tile covers. Sets the texel density per material. */
export const TILE_METRES: Record<number, number> = {
  [TILE.render]: 0.9,
  [TILE.roof]: 0.75,
  [TILE.timber]: 1.0,
  [TILE.metal]: 0.6,
  [TILE.canvas]: 1.4,
  [TILE.board]: 1.0,
  [TILE.paving]: 1.5,
  [TILE.brick]: 1.0,
};

/** Half a texel at the base resolution, so trilinear filtering does not walk into the neighbour. */
let atlasInset = 0.002;

/** Called by `main.ts` once the texture size is known. */
export function setAtlasResolution(tileSize: number): void {
  atlasInset = 0.6 / Math.max(8, tileSize);
}

/**
 * Map a tile-local coordinate in [0,1]² into the atlas.
 *
 * CLAMPED, never wrapped: a caller asking for 1.0 means the far edge of the tile, and wrapping it
 * to 0.0 would put the last column of a subdivided wall back at the tile's left edge. Repeating is
 * the caller's job (`addQuad` emits one tile per cell) precisely because the sampler cannot do it.
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

export type P3 = [number, number, number];

export interface QuadOptions {
  colour: Rgb;
  tile: number;
  /** Repeat counts across and up. Defaults to the edge length over the tile's metres. */
  repeatU?: number;
  repeatV?: number;
  /** Flip the normal. */
  back?: boolean;
  /** Tint the second corner pair, for a gradient down a wall (dirt, weathering). */
  colourTop?: Rgb;
}

/**
 * A planar quad `a → b → c → d` (counter-clockwise from the front), subdivided so an atlas tile
 * can repeat over it.
 *
 * `a→b` is the U direction and `a→d` the V direction; the subdivision is bilinear over the four
 * corners, so this works for a trapezoid (a hipped roof panel, a shed end) as well as a rectangle.
 */
export function addQuad(s: Surface, a: P3, b: P3, c: P3, d: P3, opts: QuadOptions): void {
  const metres = TILE_METRES[opts.tile] ?? 1;
  const lenU = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const lenV = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
  const nu = Math.max(1, Math.min(16, Math.round(opts.repeatU ?? lenU / metres)));
  const nv = Math.max(1, Math.min(16, Math.round(opts.repeatV ?? lenV / metres)));

  // Flat normal from the corner frame.
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
   * A shared vertex on an interior seam would have to carry u = 1 for the cell on its left and
   * u = 0 for the cell on its right, and it can only carry one — which is what an atlas costs and
   * what a WRAP sampler would otherwise have done. The first version of this function shared the
   * grid and every wall came out with the tile mirrored back on itself every other course.
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

export interface BoxOptions {
  colour: Rgb;
  /** Tile per face: `[+x, -x, +y, -y, +z, -z]`, or one tile for all six. */
  tile: number | [number, number, number, number, number, number];
  /** Faces to skip, same order. */
  skip?: boolean[];
  colourTop?: Rgb;
}

/** An axis-aligned box in local space, from `min` to `max`. */
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
  });
  // +X
  if (!skip[0]) addQuad(s, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], o(t[0]));
  // -X
  if (!skip[1]) addQuad(s, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], o(t[1]));
  // +Y
  if (!skip[2]) addQuad(s, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], o(t[2]));
  // -Y
  if (!skip[3]) addQuad(s, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], o(t[3]));
  // +Z
  if (!skip[4]) addQuad(s, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], o(t[4]));
  // -Z
  if (!skip[5]) addQuad(s, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], o(t[5]));
}

export interface PrismOptions {
  colour: Rgb;
  tile: number;
  sides: number;
  /** Radians; 0 puts a vertex on +X. */
  phase?: number;
  /** Cap the top and the bottom. */
  capTop?: boolean;
  capBottom?: boolean;
  colourTop?: Rgb;
}

/**
 * A vertical prism (a polygonal drum) from `y0` to `y1`, with radii that may differ so the same
 * call makes a cylinder, a cone or a truncated cone.
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
  const circumference = 2 * Math.PI * Math.max(r0, r1);
  const repeatU = Math.max(1, Math.round(circumference / metres));
  const repeatV = Math.max(1, Math.round(Math.abs(y1 - y0) / metres));
  for (let i = 0; i < n; i++) {
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
      repeatU: Math.max(1, Math.round(repeatU / n)),
      repeatV,
    });
  }
  if (opts.capTop && r1 > 0.001)
    addDisc(s, cx, y1, cz, r1, n, phase, opts.colour, opts.tile, false);
  if (opts.capBottom && r0 > 0.001) {
    addDisc(s, cx, y0, cz, r0, n, phase, opts.colour, opts.tile, true);
  }
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
 * A round tube between two points — a rail, a post, a bracket arm.
 *
 * Six sides by default. A queue rail is 40 mm of steel seen from two metres; eight sides costs a
 * third more triangles for a silhouette nobody can tell from six at that size.
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

/**
 * A flat strip along a polyline, lying in the local XY plane at `z`, with a small extrusion.
 *
 * This is how the fascia pictogram and the menu-board lines are drawn: an extruded stroke reads at
 * 15 m where a texture-mapped letter turns to mud, and it costs eight triangles a segment.
 */
export function addStroke(
  s: Surface,
  points: number[],
  z: number,
  width: number,
  depth: number,
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
    // Extend each end by half the width so corners join without a notch.
    const ex = (dx / len) * width * 0.5;
    const ey = (dy / len) * width * 0.5;
    const nx = (-dy / len) * width * 0.5;
    const ny = (dx / len) * width * 0.5;
    const a: P3 = [x0 - ex + nx, y0 - ey + ny, z];
    const b: P3 = [x1 + ex + nx, y1 + ey + ny, z];
    const c: P3 = [x1 + ex - nx, y1 + ey - ny, z];
    const d: P3 = [x0 - ex - nx, y0 - ey - ny, z];
    // Front face plus a thin side wall, so the stroke catches the light rather than reading flat.
    addQuad(s, d, c, b, a, { colour, tile, repeatU: 1, repeatV: 1 });
    const back = depth;
    addQuad(s, [d[0], d[1], z - back], [c[0], c[1], z - back], c, d, {
      colour: shade(colour, 0.7),
      tile,
      repeatU: 1,
      repeatV: 1,
    });
    addQuad(s, a, b, [b[0], b[1], z - back], [a[0], a[1], z - back], {
      colour: shade(colour, 0.7),
      tile,
      repeatU: 1,
      repeatV: 1,
    });
  }
}
