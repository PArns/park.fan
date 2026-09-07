/**
 * Roofs — the half of a building you see from the overview camera, and the half a box has none of.
 *
 * Eight forms, all built from the same three ideas.
 *
 * **The overhang goes DOWN, not out.** A rafter runs in one plane from the ridge past the wall
 * plate, so the eave edge sits *below* the top of the wall by `eaves × tan(pitch)`. The first
 * version raised the ridge instead and kept the eave level with the wall head, which puts the roof
 * on top of the building like a lid: no shadow under it, no line where the wall stops, and a hall
 * that reads as two stacked boxes.
 *
 * **The eave is three pieces, not an edge.** A fascia board standing vertically at the edge, a
 * soffit closing the underside back to the wall, and a half-round gutter on brackets. Together they
 * are what puts a dark horizontal band under every roof in the park; without them a roof plane meets
 * a wall plane at a line one pixel wide and the building reads as paper.
 *
 * **A ridge is capped and a verge is boarded.** Both are 60 mm of geometry and both are what the eye
 * uses to tell a roof covering from a roof shape.
 *
 * Everything is built in building space through the mass's own transform, so a wing at 30° gets its
 * roof at 30° with no second code path.
 */

import {
  addBand,
  addBox,
  addPrism,
  addQuad,
  addTriangle,
  addTube,
  shade,
  type P3,
  type Rgb,
  type Surface,
} from './geometry';
import { rand2 } from './noise';
import type { KitCtx, Skin } from './kit';
import type { RoofForm, LanternDef } from './types';

/** A mass placed in building space: centre, rotation and half-extents. */
export interface Placed {
  cx: number;
  cz: number;
  cos: number;
  sin: number;
  hx: number;
  hz: number;
  /** Y of the ground floor. */
  base: number;
}

/** Local (x, y, z) in the mass's own frame → building space. */
export function xf(m: Placed, x: number, y: number, z: number): P3 {
  return [m.cx + x * m.cos + z * m.sin, y, m.cz - x * m.sin + z * m.cos];
}

export interface ResolvedRoof {
  form: RoofForm;
  /** Radians. */
  pitch: number;
  eaves: number;
  /** Which local axis the ridge runs along. */
  ridge: 'x' | 'z';
  parapet: number;
  dormers: number;
  chimneys: number;
  lantern: LanternDef | null;
  tile: number;
  colour: Rgb;
  /** Polygon sides for a round mass; 0 for a box. */
  sides: number;
}

export interface RoofResult {
  /** Height of the highest point of the roof, building space. */
  top: number;
}

/**
 * Draw a roof over a mass whose walls stop at `eaveY`.
 *
 * Returns the top of everything it drew, so a lantern, a chimney or the next mass up can sit on it.
 */
export function buildRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number,
  seed: number
): RoofResult {
  if (r.sides >= 3) return roundRoof(ctx, m, r, skin, eaveY, seed);
  switch (r.form) {
    case 'flat':
      return flatRoof(ctx, m, r, skin, eaveY);
    case 'hip':
      return hipRoof(ctx, m, r, skin, eaveY, seed);
    case 'pyramid':
      return pyramidRoof(ctx, m, r, skin, eaveY, seed);
    case 'shed':
      return shedRoof(ctx, m, r, skin, eaveY);
    case 'mansard':
      return mansardRoof(ctx, m, r, skin, eaveY, seed);
    case 'barrel':
      return barrelRoof(ctx, m, r, skin, eaveY);
    default:
      return gableRoof(ctx, m, r, skin, eaveY, seed);
  }
}

// ── the eave ────────────────────────────────────────────────────────────────────────────────

/**
 * Fascia, soffit and gutter along one eave.
 *
 * `along` is the run of the eave in local space; `at` is the outward coordinate of the eave edge and
 * `wallAt` the wall face behind it. `axis` says whether the eave runs along x (so it faces ±z) or
 * along z.
 */
function eaveTrim(
  ctx: KitCtx,
  m: Placed,
  skin: Skin,
  axis: 'x' | 'z',
  from: number,
  to: number,
  at: number,
  wallAt: number,
  y: number,
  gutter: boolean
): void {
  const depth = 0.24;
  const p = (a: number, out: number, yy: number): P3 =>
    axis === 'x' ? xf(m, a, yy, out) : xf(m, out, yy, a);
  const facing = Math.sign(at - wallAt) || 1;
  const front = facing > 0;
  // The fascia board, standing vertically at the edge of the rafters.
  const a0 = p(from, at, y - depth);
  const a1 = p(to, at, y - depth);
  const a2 = p(to, at, y);
  const a3 = p(from, at, y);
  if ((axis === 'x') === front) addQuad(ctx.kit, a0, a1, a2, a3, quad(skin.joineryColour, skin.joineryTile));
  else addQuad(ctx.kit, a1, a0, a3, a2, quad(skin.joineryColour, skin.joineryTile));
  // The soffit, closing the underside back to the wall. It is what makes the overhang a shadow.
  const b0 = p(from, at, y - depth);
  const b1 = p(to, at, y - depth);
  const b2 = p(to, wallAt, y - depth);
  const b3 = p(from, wallAt, y - depth);
  if ((axis === 'x') === front) addQuad(ctx.kit, b1, b0, b3, b2, quad(shade(skin.joineryColour, 0.55), skin.joineryTile));
  else addQuad(ctx.kit, b0, b1, b2, b3, quad(shade(skin.joineryColour, 0.55), skin.joineryTile));
  if (gutter) {
    const gy = y - depth + 0.06;
    const go = at - facing * 0.07;
    addTube(
      ctx.kit,
      p(from, go, gy),
      p(to, go, gy),
      0.075,
      skin.metalColour,
      skin.metalTile,
      6
    );
  }
}

function quad(colour: Rgb, tile: number): { colour: Rgb; tile: number; maxCells?: number } {
  return { colour, tile, maxCells: 8 };
}

/** A capping over a ridge or a hip: a small box following the line. */
function ridgeCap(ctx: KitCtx, r: ResolvedRoof, a: P3, b: P3): void {
  addTube(ctx.kit, a, b, 0.11, shade(r.colour, 1.06), r.tile, 5);
}

// ── forms ───────────────────────────────────────────────────────────────────────────────────

function gableRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number,
  seed: number
): RoofResult {
  const along = r.ridge === 'x' ? m.hx : m.hz;
  const span = r.ridge === 'x' ? m.hz : m.hx;
  const e = r.eaves;
  const rise = Math.tan(r.pitch) * span;
  const ridgeY = eaveY + rise;
  const edgeY = eaveY - Math.tan(r.pitch) * e;
  const A = along + e;
  const S = span + e;
  // Local (u along the ridge, w across it) → world.
  const p = (u: number, w: number, y: number): P3 =>
    r.ridge === 'x' ? xf(m, u, y, w) : xf(m, w, y, u);

  for (const side of [1, -1]) {
    const a = p(-A, side * S, edgeY);
    const b = p(A, side * S, edgeY);
    const c = p(A, 0, ridgeY);
    const d = p(-A, 0, ridgeY);
    if (side > 0) addQuad(ctx.kit, a, b, c, d, roofQuad(r, span + e));
    else addQuad(ctx.kit, b, a, d, c, roofQuad(r, span + e));
    eaveTrim(ctx, m, skin, r.ridge, -A, A, side * S, side * span, edgeY, true);
  }
  // The gable walls, in the wall's own material — they are wall, not roof.
  for (const end of [1, -1]) {
    const a = p(end * along, -span, eaveY);
    const b = p(end * along, span, eaveY);
    const c = p(end * along, 0, ridgeY);
    if (end > 0) addTriangle(ctx.kit, a, b, c, skin.wallColour, skin.wallTile);
    else addTriangle(ctx.kit, b, a, c, skin.wallColour, skin.wallTile);
    // Barge boards along the verge, and a small return under them.
    for (const side of [1, -1]) {
      addTube(
        ctx.kit,
        p(end * A, side * S, edgeY),
        p(end * A, 0, ridgeY),
        0.09,
        skin.joineryColour,
        skin.joineryTile,
        4
      );
    }
  }
  ridgeCap(ctx, r, p(-A, 0, ridgeY + 0.04), p(A, 0, ridgeY + 0.04));
  dormers(ctx, m, r, skin, eaveY, ridgeY, along, span, seed);
  chimneys(ctx, m, r, skin, ridgeY, along, seed);
  const top = lanternOn(ctx, m, r, skin, ridgeY);
  return { top: Math.max(ridgeY, top) };
}

function hipRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number,
  seed: number
): RoofResult {
  const along = r.ridge === 'x' ? m.hx : m.hz;
  const span = r.ridge === 'x' ? m.hz : m.hx;
  const e = r.eaves;
  const rise = Math.tan(r.pitch) * span;
  const ridgeY = eaveY + rise;
  const edgeY = eaveY - Math.tan(r.pitch) * e;
  const A = along + e;
  const S = span + e;
  // A true hip runs its ridge in from each end by the half span, so all four planes take one pitch.
  const ridgeHalf = Math.max(0.4, A - S);
  const p = (u: number, w: number, y: number): P3 =>
    r.ridge === 'x' ? xf(m, u, y, w) : xf(m, w, y, u);

  for (const side of [1, -1]) {
    const a = p(-A, side * S, edgeY);
    const b = p(A, side * S, edgeY);
    const c = p(ridgeHalf, 0, ridgeY);
    const d = p(-ridgeHalf, 0, ridgeY);
    if (side > 0) addQuad(ctx.kit, a, b, c, d, roofQuad(r, S));
    else addQuad(ctx.kit, b, a, d, c, roofQuad(r, S));
    eaveTrim(ctx, m, skin, r.ridge, -A, A, side * S, side * span, edgeY, true);
  }
  for (const end of [1, -1]) {
    const a = p(end * A, -S, edgeY);
    const b = p(end * A, S, edgeY);
    const c = p(end * ridgeHalf, 0, ridgeY);
    if (end > 0) addTriangle(ctx.kit, b, a, c, r.colour, r.tile);
    else addTriangle(ctx.kit, a, b, c, r.colour, r.tile);
    eaveTrim(
      ctx,
      m,
      skin,
      r.ridge === 'x' ? 'z' : 'x',
      -S,
      S,
      end * A,
      end * along,
      edgeY,
      true
    );
    // The hip line itself, capped like a ridge.
    ridgeCap(ctx, r, p(end * A, S, edgeY), p(end * ridgeHalf, 0, ridgeY + 0.04));
    ridgeCap(ctx, r, p(end * A, -S, edgeY), p(end * ridgeHalf, 0, ridgeY + 0.04));
  }
  ridgeCap(ctx, r, p(-ridgeHalf, 0, ridgeY + 0.04), p(ridgeHalf, 0, ridgeY + 0.04));
  dormers(ctx, m, r, skin, eaveY, ridgeY, ridgeHalf, span, seed);
  chimneys(ctx, m, r, skin, ridgeY, ridgeHalf, seed);
  const top = lanternOn(ctx, m, r, skin, ridgeY);
  return { top: Math.max(ridgeY, top) };
}

function pyramidRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number,
  seed: number
): RoofResult {
  const e = r.eaves;
  const span = Math.min(m.hx, m.hz);
  const apexY = eaveY + Math.tan(r.pitch) * span;
  const edgeY = eaveY - Math.tan(r.pitch) * e;
  const X = m.hx + e;
  const Z = m.hz + e;
  const apex = xf(m, 0, apexY, 0);
  const corners: P3[] = [
    xf(m, -X, edgeY, Z),
    xf(m, X, edgeY, Z),
    xf(m, X, edgeY, -Z),
    xf(m, -X, edgeY, -Z),
  ];
  for (let i = 0; i < 4; i++) {
    addTriangle(ctx.kit, corners[i], corners[(i + 1) % 4], apex, r.colour, r.tile);
    ridgeCap(ctx, r, corners[i], apex);
  }
  eaveTrim(ctx, m, skin, 'x', -X, X, Z, m.hz, edgeY, true);
  eaveTrim(ctx, m, skin, 'x', X, -X, -Z, -m.hz, edgeY, true);
  eaveTrim(ctx, m, skin, 'z', Z, -Z, X, m.hx, edgeY, true);
  eaveTrim(ctx, m, skin, 'z', -Z, Z, -X, -m.hx, edgeY, true);
  void seed;
  const top = lanternOn(ctx, m, r, skin, apexY);
  return { top: Math.max(apexY, top) };
}

function shedRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number
): RoofResult {
  const e = r.eaves;
  const span = r.ridge === 'x' ? m.hz : m.hx;
  const along = r.ridge === 'x' ? m.hx : m.hz;
  const highY = eaveY + Math.tan(r.pitch) * span * 2;
  const lowY = eaveY - Math.tan(r.pitch) * e;
  const A = along + e;
  const S = span + e;
  const p = (u: number, w: number, y: number): P3 =>
    r.ridge === 'x' ? xf(m, u, y, w) : xf(m, w, y, u);
  addQuad(
    ctx.kit,
    p(-A, S, lowY),
    p(A, S, lowY),
    p(A, -S, highY + Math.tan(r.pitch) * e),
    p(-A, -S, highY + Math.tan(r.pitch) * e),
    roofQuad(r, S * 2)
  );
  eaveTrim(ctx, m, skin, r.ridge, -A, A, S, span, lowY, true);
  // The high wall under the upstand.
  const wa = p(-along, -span, eaveY);
  const wb = p(along, -span, eaveY);
  const wc = p(along, -span, highY);
  const wd = p(-along, -span, highY);
  addQuad(ctx.kit, wb, wa, wd, wc, quad(skin.wallColour, skin.wallTile));
  return { top: highY };
}

function flatRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number
): RoofResult {
  const deckY = eaveY - 0.12;
  addQuad(
    ctx.kit,
    xf(m, -m.hx, deckY, m.hz),
    xf(m, m.hx, deckY, m.hz),
    xf(m, m.hx, deckY, -m.hz),
    xf(m, -m.hx, deckY, -m.hz),
    { colour: r.colour, tile: r.tile, maxCells: 10 }
  );
  const par = Math.max(0.35, r.parapet);
  // The parapet: an upstand round the deck with a coping on top, which is the whole silhouette of a
  // flat-roofed building. Without it the wall just stops.
  const t = 0.22;
  for (const [x0, z0, x1, z1] of [
    [-m.hx, m.hz - t, m.hx, m.hz],
    [-m.hx, -m.hz, m.hx, -m.hz + t],
    [m.hx - t, -m.hz, m.hx, m.hz],
    [-m.hx, -m.hz, -m.hx + t, m.hz],
  ]) {
    boxLocal(ctx.kit, m, [x0, deckY, z0], [x1, eaveY + par, z1], skin.wallColour, skin.wallTile);
    boxLocal(
      ctx.kit,
      m,
      [x0 - 0.06, eaveY + par, z0 - 0.06],
      [x1 + 0.06, eaveY + par + 0.1, z1 + 0.06],
      skin.trimColour,
      skin.trimTile
    );
  }
  const top = lanternOn(ctx, m, r, skin, eaveY + par);
  return { top: Math.max(eaveY + par + 0.1, top) };
}

function mansardRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number,
  seed: number
): RoofResult {
  const along = r.ridge === 'x' ? m.hx : m.hz;
  const span = r.ridge === 'x' ? m.hz : m.hx;
  const e = r.eaves;
  // A mansard is two pitches: about 72° below the break and 28° above it, with the break two thirds
  // of the way in. That double slope is the whole reason the form exists — an extra storey inside a
  // roof — and drawing it as one pitch loses it.
  const breakW = span * 0.42;
  const lowRise = Math.tan((72 * Math.PI) / 180) * (span - breakW);
  const breakY = eaveY + lowRise;
  const topY = breakY + Math.tan((26 * Math.PI) / 180) * breakW;
  const edgeY = eaveY - 0.3;
  const A = along + e;
  const p = (u: number, w: number, y: number): P3 =>
    r.ridge === 'x' ? xf(m, u, y, w) : xf(m, w, y, u);
  for (const side of [1, -1]) {
    const a = p(-A, side * (span + e), edgeY);
    const b = p(A, side * (span + e), edgeY);
    const c = p(A, side * breakW, breakY);
    const d = p(-A, side * breakW, breakY);
    if (side > 0) addQuad(ctx.kit, a, b, c, d, roofQuad(r, lowRise));
    else addQuad(ctx.kit, b, a, d, c, roofQuad(r, lowRise));
    const e0 = p(-A, side * breakW, breakY);
    const e1 = p(A, side * breakW, breakY);
    const e2 = p(A, 0, topY);
    const e3 = p(-A, 0, topY);
    if (side > 0) addQuad(ctx.kit, e0, e1, e2, e3, roofQuad(r, breakW));
    else addQuad(ctx.kit, e1, e0, e3, e2, roofQuad(r, breakW));
    ridgeCap(ctx, r, p(-A, side * breakW, breakY + 0.03), p(A, side * breakW, breakY + 0.03));
    eaveTrim(ctx, m, skin, r.ridge, -A, A, side * (span + e), side * span, edgeY, true);
  }
  for (const end of [1, -1]) {
    // The mansard's ends are the same two pitches, drawn as a five-sided panel.
    const a = p(end * along, -(span + e), edgeY);
    const b = p(end * along, -breakW, breakY);
    const c = p(end * along, 0, topY);
    const d = p(end * along, breakW, breakY);
    const f = p(end * along, span + e, edgeY);
    if (end > 0) {
      addTriangle(ctx.kit, a, f, b, r.colour, r.tile);
      addTriangle(ctx.kit, b, f, d, r.colour, r.tile);
      addTriangle(ctx.kit, b, d, c, r.colour, r.tile);
    } else {
      addTriangle(ctx.kit, f, a, b, r.colour, r.tile);
      addTriangle(ctx.kit, f, b, d, r.colour, r.tile);
      addTriangle(ctx.kit, d, b, c, r.colour, r.tile);
    }
  }
  ridgeCap(ctx, r, p(-A, 0, topY + 0.04), p(A, 0, topY + 0.04));
  dormers(ctx, m, r, skin, eaveY, breakY, along, span, seed);
  chimneys(ctx, m, r, skin, topY, along, seed);
  const top = lanternOn(ctx, m, r, skin, topY);
  return { top: Math.max(topY, top) };
}

function barrelRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number
): RoofResult {
  const along = r.ridge === 'x' ? m.hx : m.hz;
  const span = r.ridge === 'x' ? m.hz : m.hx;
  const e = r.eaves;
  const A = along + e;
  const rise = span * 0.72;
  const segs = 12;
  const p = (u: number, w: number, y: number): P3 =>
    r.ridge === 'x' ? xf(m, u, y, w) : xf(m, w, y, u);
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI;
    const a1 = ((i + 1) / segs) * Math.PI;
    const w0 = -Math.cos(a0) * span;
    const y0 = eaveY + Math.sin(a0) * rise;
    const w1 = -Math.cos(a1) * span;
    const y1 = eaveY + Math.sin(a1) * rise;
    addQuad(ctx.kit, p(-A, w0, y0), p(A, w0, y0), p(A, w1, y1), p(-A, w1, y1), {
      colour: r.colour,
      tile: r.tile,
      repeatU: Math.max(1, Math.round((A * 2) / 1.2)),
      repeatV: 1,
      maxCells: 12,
    });
  }
  // The end arches, in the wall material: a barrel vault ends in a lunette.
  for (const end of [1, -1]) {
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI;
      const a1 = ((i + 1) / segs) * Math.PI;
      const c = p(end * along, 0, eaveY);
      const q0 = p(end * along, -Math.cos(a0) * span, eaveY + Math.sin(a0) * rise);
      const q1 = p(end * along, -Math.cos(a1) * span, eaveY + Math.sin(a1) * rise);
      if (end > 0) addTriangle(ctx.kit, c, q0, q1, skin.wallColour, skin.wallTile);
      else addTriangle(ctx.kit, c, q1, q0, skin.wallColour, skin.wallTile);
    }
  }
  return { top: eaveY + rise };
}

/** A cone or a many-sided pyramid over a round mass. */
function roundRoof(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number,
  seed: number
): RoofResult {
  const radius = Math.max(m.hx, m.hz);
  const e = r.eaves;
  const outer = radius + e;
  const edgeY = eaveY - Math.tan(r.pitch) * e;
  const apexY = eaveY + Math.tan(r.pitch) * radius * (r.form === 'flat' ? 0 : 1);
  if (r.form === 'flat') {
    addPrism(ctx.kit, m.cx, m.cz, eaveY - 0.1, eaveY + Math.max(0.4, r.parapet), radius, radius, {
      colour: skin.wallColour,
      tile: skin.wallTile,
      sides: r.sides,
      capTop: true,
    });
    const top = lanternOn(ctx, m, r, skin, eaveY + Math.max(0.4, r.parapet));
    return { top: Math.max(eaveY + 0.5, top) };
  }
  addPrism(ctx.kit, m.cx, m.cz, edgeY, apexY, outer, 0.001, {
    colour: r.colour,
    tile: r.tile,
    sides: r.sides,
    phase: Math.PI / r.sides,
  });
  // The eave: a fascia ring and a soffit ring.
  addPrism(ctx.kit, m.cx, m.cz, edgeY - 0.24, edgeY, outer, outer, {
    colour: skin.joineryColour,
    tile: skin.joineryTile,
    sides: r.sides,
    phase: Math.PI / r.sides,
  });
  addPrism(ctx.kit, m.cx, m.cz, edgeY - 0.24, edgeY - 0.24, radius, outer, {
    colour: shade(skin.joineryColour, 0.55),
    tile: skin.joineryTile,
    sides: r.sides,
    phase: Math.PI / r.sides,
  });
  void seed;
  const top = lanternOn(ctx, m, r, skin, apexY);
  return { top: Math.max(apexY, top) };
}

// ── things that stand on a roof ─────────────────────────────────────────────────────────────

/**
 * Dormers on the long slopes.
 *
 * A dormer is a small gabled box standing on the pitch with a window in its face — a real one for a
 * real reason: it is the only way a room in a roof gets light, and it is what turns a 45° plane into
 * a building somebody lives in.
 */
function dormers(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  eaveY: number,
  ridgeY: number,
  along: number,
  span: number,
  seed: number
): void {
  if (r.dormers <= 0) return;
  const n = Math.min(6, Math.round(r.dormers));
  const w = 1.35;
  const h = 1.5;
  // A third of the way up the slope: high enough to clear the gutter, low enough to be in the room.
  const t = 0.34;
  const faceW = span * (1 - t);
  const sillY = eaveY + (ridgeY - eaveY) * t;
  const p = (u: number, ww: number, y: number): P3 =>
    r.ridge === 'x' ? xf(m, u, y, ww) : xf(m, ww, y, u);
  for (const side of [1, -1]) {
    for (let i = 0; i < n; i++) {
      const u = -along + ((i + 0.5) * (along * 2)) / n;
      const cheekBack = side * (faceW - 1.1);
      const face = side * faceW;
      // The face, with a window in it.
      addQuad(
        ctx.kit,
        p(u - w / 2, face, sillY),
        p(u + w / 2, face, sillY),
        p(u + w / 2, face, sillY + h),
        p(u - w / 2, face, sillY + h),
        side > 0
          ? { colour: skin.wallColour, tile: skin.wallTile }
          : { colour: skin.wallColour, tile: skin.wallTile, back: true }
      );
      const lit = rand2(i, side, seed + 811) < ctx.litFraction;
      const target = lit ? ctx.lit : ctx.glass;
      ctx.windows += 1;
      if (lit) ctx.litWindows += 1;
      addQuad(
        target,
        p(u - w / 2 + 0.22, face + side * 0.02, sillY + 0.22),
        p(u + w / 2 - 0.22, face + side * 0.02, sillY + 0.22),
        p(u + w / 2 - 0.22, face + side * 0.02, sillY + h - 0.24),
        p(u - w / 2 + 0.22, face + side * 0.02, sillY + h - 0.24),
        side > 0
          ? { colour: lit ? skin.litColour : skin.glassColour, tile: skin.joineryTile }
          : { colour: lit ? skin.litColour : skin.glassColour, tile: skin.joineryTile, back: true }
      );
      // Cheeks and a little gable roof over it.
      for (const cheek of [-1, 1]) {
        const cu = u + (cheek * w) / 2;
        addTriangle(
          ctx.kit,
          p(cu, face, sillY),
          p(cu, cheekBack, sillY + h * 0.55),
          p(cu, face, sillY + h),
          r.colour,
          r.tile
        );
      }
      const apex = sillY + h + 0.34;
      for (const cheek of [-1, 1]) {
        addQuad(
          ctx.kit,
          p(u + (cheek * (w + 0.3)) / 2, face + side * 0.16, sillY + h),
          p(u, face + side * 0.16, apex),
          p(u, cheekBack, apex - 0.1),
          p(u + (cheek * (w + 0.3)) / 2, cheekBack, sillY + h - 0.1),
          { colour: r.colour, tile: r.tile, repeatU: 2, repeatV: 2, back: cheek * side < 0 }
        );
      }
    }
  }
}

/** Brick stacks with a cap and pots. A roof with a chimney on it has a house under it. */
function chimneys(
  ctx: KitCtx,
  m: Placed,
  r: ResolvedRoof,
  skin: Skin,
  ridgeY: number,
  along: number,
  seed: number
): void {
  const n = Math.min(4, Math.round(r.chimneys));
  for (let i = 0; i < n; i++) {
    const u = -along * 0.62 + ((i + 0.5) * (along * 1.24)) / n;
    const h = 1.5 + rand2(i, 3, seed + 41) * 0.7;
    const w = 0.75;
    const d = 0.5;
    const p0 = r.ridge === 'x' ? [u - w / 2, -d] : [-d, u - w / 2];
    const p1 = r.ridge === 'x' ? [u + w / 2, d] : [d, u + w / 2];
    boxLocal(
      ctx.kit,
      m,
      [p0[0], ridgeY - 1.0, p0[1]],
      [p1[0], ridgeY + h, p1[1]],
      skin.plinthColour,
      skin.plinthTile
    );
    boxLocal(
      ctx.kit,
      m,
      [p0[0] - 0.1, ridgeY + h, p0[1] - 0.1],
      [p1[0] + 0.1, ridgeY + h + 0.14, p1[1] + 0.1],
      skin.trimColour,
      skin.trimTile
    );
    for (const s of [-1, 1]) {
      const cx = r.ridge === 'x' ? u + s * 0.18 : 0;
      const cz = r.ridge === 'x' ? 0 : u + s * 0.18;
      addTube(
        ctx.kit,
        xf(m, cx, ridgeY + h + 0.14, cz),
        xf(m, cx, ridgeY + h + 0.52, cz),
        0.12,
        shade(skin.plinthColour, 0.8),
        skin.plinthTile,
        8
      );
    }
  }
}

/** A lantern or cupola on the apex: a small glazed drum with a roof of its own. */
function lanternOn(ctx: KitCtx, m: Placed, r: ResolvedRoof, skin: Skin, y: number): number {
  const l = r.lantern;
  if (!l) return 0;
  const sides = Math.max(4, Math.round(l.sides));
  const base = y - 0.15;
  // A plinth, the drum, and a cornice under its own roof.
  addPrism(ctx.kit, m.cx, m.cz, base, base + 0.22, l.radius * 1.18, l.radius * 1.18, {
    colour: skin.trimColour,
    tile: skin.trimTile,
    sides,
    capTop: false,
  });
  const drumTop = base + 0.22 + l.height;
  if (l.glazed) {
    addPrism(ctx.lit, m.cx, m.cz, base + 0.3, drumTop - 0.28, l.radius * 0.96, l.radius * 0.96, {
      colour: skin.litColour,
      tile: skin.joineryTile,
      sides,
    });
    // The posts between the glazed panels.
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const px = m.cx + Math.cos(a) * l.radius;
      const pz = m.cz + Math.sin(a) * l.radius;
      addTube(
        ctx.kit,
        [px, base + 0.22, pz],
        [px, drumTop, pz],
        0.075,
        skin.joineryColour,
        skin.joineryTile,
        4
      );
    }
  } else {
    addPrism(ctx.kit, m.cx, m.cz, base + 0.22, drumTop, l.radius, l.radius, {
      colour: skin.wallColour,
      tile: skin.wallTile,
      sides,
    });
  }
  addPrism(ctx.kit, m.cx, m.cz, drumTop - 0.28, drumTop, l.radius * 1.12, l.radius * 1.12, {
    colour: skin.trimColour,
    tile: skin.trimTile,
    sides,
  });
  const apex = drumTop + l.radius * (l.roof === 'pyramid' ? 1.05 : 1.5);
  addPrism(ctx.kit, m.cx, m.cz, drumTop, apex, l.radius * 1.16, 0.001, {
    colour: r.colour,
    tile: r.tile,
    sides: l.roof === 'pyramid' ? 4 : sides,
    phase: Math.PI / sides,
  });
  // A finial, so the silhouette ends in a point rather than in a stump.
  addTube(
    ctx.kit,
    [m.cx, apex - 0.1, m.cz],
    [m.cx, apex + 0.75, m.cz],
    0.05,
    skin.metalColour,
    skin.metalTile,
    5
  );
  ctx.lights.push({
    x: m.cx,
    y: drumTop - 0.4,
    z: m.cz,
    color: '#ffe0b0',
    intensity: 40,
    range: 16,
  });
  return apex + 0.75;
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────────

function roofQuad(r: ResolvedRoof, slope: number): {
  colour: Rgb;
  colourTop: Rgb;
  tile: number;
  maxCells: number;
  repeatV: number;
} {
  return {
    colour: r.colour,
    // A roof is lighter at the ridge, where it dries first and where the sun catches it.
    colourTop: shade(r.colour, 1.1),
    tile: r.tile,
    maxCells: 12,
    repeatV: Math.max(1, Math.round(slope / 0.9)),
  };
}

/** An axis-aligned box in the mass's local space, transformed into building space. */
export function boxLocal(
  s: Surface,
  m: Placed,
  min: P3,
  max: P3,
  colour: Rgb,
  tile: number
): void {
  // Build it in local space and rotate each corner, which is what `addBox` cannot do on its own.
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const c = (x: number, y: number, z: number): P3 => xf(m, x, y, z);
  const o = { colour, tile, maxCells: 8 };
  addQuad(s, c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1), o);
  addQuad(s, c(x0, y0, z0), c(x0, y0, z1), c(x0, y1, z1), c(x0, y1, z0), o);
  addQuad(s, c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0), o);
  addQuad(s, c(x0, y0, z0), c(x1, y0, z0), c(x1, y0, z1), c(x0, y0, z1), o);
  addQuad(s, c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1), o);
  addQuad(s, c(x1, y0, z0), c(x0, y0, z0), c(x0, y1, z0), c(x1, y1, z0), o);
}

/** Unused import guard: `addBand`/`addBox` are re-exported for the builder's convenience. */
export { addBand, addBox };
