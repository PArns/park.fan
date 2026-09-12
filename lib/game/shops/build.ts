/**
 * The building. One parametric generator; five massings; no `switch` on a content id anywhere.
 *
 * ## The local frame, and why the origin is where it is
 *
 * Everything is built in the shop's own space and placed by a thin-instance matrix:
 *
 *   +x  across the frontage, right as the customer sees it
 *   +y  up, 0 at the apron surface
 *   +z  out of the counter, towards the person being served
 *
 * The origin is **where a guest stands**, not the centre of the building — see `frontSetback` in
 * `sim.ts` for the whole argument. The building runs back from `z = -setback`, the apron runs
 * forward past the origin, and the queue rail frames the space between them. A shop placed with
 * nothing but a position and a yaw therefore has its counter facing the path.
 *
 * ## What makes it not a box with a sign on it
 *
 * The list is short and every item was chosen because leaving it out is what "programmer art"
 * looks like at 12 m:
 *
 *  - **The eaves.** A roof that stops at the wall has no shadow line. Every roof here overhangs by
 *    `style.eaves`, carries a fascia board on its edge and shows its rafter ends underneath.
 *  - **The serving bay is a hole, not a decal.** Piers at the ends, a bulkhead over the top, a
 *    counter slab that projects 22 cm past the wall with a fillet under it, and a dark recess
 *    behind — so the opening reads as depth from any angle.
 *  - **The plinth.** A wall that meets the ground on a line looks like a sticker. A 16–22 cm base
 *    course a few centimetres proud of the wall is what every real one has.
 *  - **The hard standing.** The shop lays its own paving, with a kerb and a step up. Without it the
 *    queue stands on grass, which is what the first render of this module actually showed.
 *  - **The queue rail.** Powder-coated posts at 1.5 m centres with a 1.0 m top rail and a mid rail,
 *    which is the section a park uses, and it is what turns a clump of people into a line.
 *
 * Pure geometry: no Babylon objects are created here, only `Surface` arrays, so the whole builder
 * is testable in node.
 */

import {
  addBox,
  addDisc,
  addPrism,
  addQuad,
  addStroke,
  addTube,
  mixRgb,
  newSurface,
  shade,
  srgb,
  surfaceTriangles,
  TILE,
  type P3,
  type Rgb,
  type Surface,
} from './geometry';
import { glyphFor, type ResolvedShop } from './manifest';
import { rand2 } from './noise';
import { hashString } from './noise';

export interface ShopBuild {
  /** Everything opaque: one mesh, one draw call, whatever the building is made of. */
  kit: Surface;
  /** Shopfront and display glazing. Empty for most shops. */
  glass: Surface;
  /** The lit signage. Drawn with the emissive material for `signColour`. */
  sign: Surface;
  signColour: string;
  /** Metres from the origin back to the front face of the building. */
  setback: number;
  /** Overall bounding box in local space, for the shadow-caster test and the placement checks. */
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  triangles: number;
  /** Where the counter's night light hangs, local space. */
  lightAt: P3;
}

const TAU = Math.PI * 2;

/** Cladding to atlas tile. Data, not a decision: the style names a surface and this is the map. */
const CLADDING_TILE: Record<string, number> = {
  render: TILE.render,
  timber: TILE.timber,
  panel: TILE.metal,
  brick: TILE.brick,
};

export interface BuildOptions {
  shop: ResolvedShop;
  /** Footprint from the shop definition, `[width, depth]` in metres. */
  footprint: [number, number];
  /** Stable per-shop variation: two burger stands should not be the same building twice. */
  seed: number;
  /** The signage colour the pack declared, if any. */
  signage?: string;
  /** How many counters the entity actually has (a management override). */
  counters?: number;
}

export function buildShop(opts: BuildOptions): ShopBuild {
  const { shop, seed } = opts;
  const style = shop.style;
  const kit = newSurface();
  const glass = newSurface();
  const sign = newSurface();

  const width = Math.max(1, opts.footprint[0]);
  const depth = Math.max(1, opts.footprint[1]);
  const setback = 1 + style.apron * 0.12;
  const counters = Math.max(0, opts.counters ?? style.counters);

  const wall = srgb(style.palette.wall);
  const trim = srgb(style.palette.trim);
  const roofC = srgb(style.palette.roof);
  const metal = srgb(style.palette.metal);
  const awnA = srgb(style.palette.awningA);
  const awnB = srgb(style.palette.awningB);
  const signBoard = srgb(style.palette.sign);
  const claddingTile = CLADDING_TILE[style.cladding] ?? TILE.render;

  // Front face of the building, and the back of it.
  const zFront = -setback;
  const zBack = zFront - depth;
  const hw = width / 2;

  const ctx: Ctx = {
    kit,
    glass,
    sign,
    style,
    seed,
    width,
    depth,
    hw,
    zFront,
    zBack,
    setback,
    counters,
    wall,
    trim,
    roofC,
    metal,
    awnA,
    awnB,
    signBoard,
    claddingTile,
    board: shop.board,
    glyph: glyphFor(style, shop.def.kind),
    eaveTop: 0,
    frontWallZ: zFront,
  };

  // 1. The ground this thing stands on. Always first: everything else sits on its surface.
  apron(ctx);

  // 2. The building.
  switch (style.form) {
    case 'round':
      roundPavilion(ctx);
      break;
    case 'block':
      utilityBlock(ctx);
      break;
    case 'unit':
      retailUnit(ctx);
      break;
    case 'machine':
      machine(ctx);
      break;
    default:
      kioskHut(ctx);
      break;
  }

  // 3. The things that stand on the apron.
  if (style.rail > 0) queueRail(ctx);
  if (style.dressing) dressing(ctx);
  if (style.sign.post > 0) pylon(ctx);

  const bounds = boundsOf(kit, glass, sign);
  return {
    kit,
    glass,
    sign,
    signColour: opts.signage ?? style.palette.signLit,
    setback,
    bounds,
    triangles: surfaceTriangles(kit) + surfaceTriangles(glass) + surfaceTriangles(sign),
    lightAt: [0, Math.max(2.2, ctx.eaveTop - 0.35), zFront + 0.6],
  };
}

interface Ctx {
  kit: Surface;
  glass: Surface;
  sign: Surface;
  style: ResolvedShop['style'];
  seed: number;
  width: number;
  depth: number;
  hw: number;
  zFront: number;
  zBack: number;
  setback: number;
  counters: number;
  wall: Rgb;
  trim: Rgb;
  roofC: Rgb;
  metal: Rgb;
  awnA: Rgb;
  awnB: Rgb;
  signBoard: Rgb;
  claddingTile: number;
  board: Array<{ name: Record<string, string>; price: number }>;
  glyph: number[][];
  /** Height of the eaves, filled in by the massing; the awning and the light hang off it. */
  eaveTop: number;
  /**
   * The z of the wall the customer faces, filled in by the massing.
   *
   * Not the same as `zFront` for a round pavilion: the drum's front facet sits at its apothem, a
   * metre and a half behind the box the massing was laid out in, so the condiment shelf and the
   * bracket sign were floating in mid-air in front of every round kiosk in the showcase.
   */
  frontWallZ: number;
}

// ── The ground ──────────────────────────────────────────────────────────────────────────────

/**
 * The shop's own hard standing: a paved slab under the building and the queue, with a kerb round
 * it and a skirt below that.
 *
 * 5 cm proud of the surrounding ground, because flush would z-fight the path mesh and much more
 * than that is a trip hazard nobody builds. The **skirt** is the part that is not obvious: the slab
 * is flat and the ground under it is not, so the kerb runs 45 cm down and is buried on level ground
 * and exposed on a slope. Without it a shop on the demo park's 1-in-200 main street floats on its
 * downhill corner, which is exactly what the first render of this module showed.
 */
function apron(c: Ctx): void {
  const style = c.style;
  const forward = Math.max(1.2, style.apron);
  const margin = 0.9;
  const x0 = -c.hw - margin;
  const x1 = c.hw + margin;
  const z0 = c.zBack - margin;
  const z1 = forward;
  const h = 0.05;
  const skirt = -0.45;
  const paving = mixRgb(srgb('#b9b3a8'), c.trim, 0.12);
  // Top surface.
  addQuad(c.kit, [x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], {
    colour: paving,
    tile: TILE.paving,
  });
  // Kerb and skirt: four faces, so the slab has an edge instead of floating.
  const kerb = shade(paving, 0.82);
  addQuad(c.kit, [x0, skirt, z1], [x1, skirt, z1], [x1, h, z1], [x0, h, z1], {
    colour: kerb,
    tile: TILE.paving,
    repeatV: 1,
  });
  addQuad(c.kit, [x1, skirt, z0], [x0, skirt, z0], [x0, h, z0], [x1, h, z0], {
    colour: kerb,
    tile: TILE.paving,
    repeatV: 1,
  });
  addQuad(c.kit, [x1, skirt, z1], [x1, skirt, z0], [x1, h, z0], [x1, h, z1], {
    colour: kerb,
    tile: TILE.paving,
    repeatV: 1,
  });
  addQuad(c.kit, [x0, skirt, z0], [x0, skirt, z1], [x0, h, z1], [x0, h, z0], {
    colour: kerb,
    tile: TILE.paving,
    repeatV: 1,
  });
}

// ── Shared parts ────────────────────────────────────────────────────────────────────────────

/**
 * A serving bay: a hole in the wall with a counter through it.
 *
 * `x0..x1` is the opening, `sill` the counter height, `head` the underside of the bulkhead. The
 * recess behind is a dark box rather than a black quad — at a low sun the difference is a lit
 * back wall and a hard shadow line under the bulkhead, which is what tells the eye it is a hole.
 */
function servingBay(c: Ctx, x0: number, x1: number, sill: number, head: number): void {
  const z = c.zFront;
  const inner = shade(c.wall, 0.42);
  // Deep enough that the far wall of the recess is inside the building rather than a card 60 cm
  // behind the counter: at a low sun the shallow version let daylight round the back panel and the
  // opening read as a hole through the hut.
  const depth = Math.max(0.7, Math.min(c.depth - 0.35, 1.3));
  // Reveal: floor, ceiling and two sides of the recess.
  addQuad(c.kit, [x0, sill, z], [x1, sill, z], [x1, sill, z - depth], [x0, sill, z - depth], {
    colour: shade(inner, 1.15),
    tile: TILE.metal,
  });
  addQuad(c.kit, [x0, head, z - depth], [x1, head, z - depth], [x1, head, z], [x0, head, z], {
    colour: inner,
    tile: TILE.metal,
  });
  addQuad(c.kit, [x0, sill, z - depth], [x0, sill, z], [x0, head, z], [x0, head, z - depth], {
    colour: shade(inner, 1.1),
    tile: TILE.metal,
  });
  addQuad(c.kit, [x1, sill, z], [x1, sill, z - depth], [x1, head, z - depth], [x1, head, z], {
    colour: shade(inner, 1.1),
    tile: TILE.metal,
  });
  // The back of the recess, seen through the opening.
  addQuad(
    c.kit,
    [x0, sill, z - depth],
    [x1, sill, z - depth],
    [x1, head, z - depth],
    [x0, head, z - depth],
    { colour: shade(inner, 0.72), tile: TILE.timber }
  );

  // The counter slab: through the opening and 22 cm proud, with a fillet under the nose.
  const top = srgb('#8d8a84');
  addBox(c.kit, [x0 - 0.06, sill, z - depth], [x1 + 0.06, sill + 0.05, z + 0.22], {
    colour: top,
    tile: TILE.metal,
  });
  addBox(c.kit, [x0 - 0.02, sill - 0.1, z + 0.02], [x1 + 0.02, sill, z + 0.16], {
    colour: shade(top, 0.72),
    tile: TILE.metal,
  });

  // The roller-shutter box above the bulkhead, which is what every serving hatch has.
  addBox(c.kit, [x0 - 0.08, head, z - 0.02], [x1 + 0.08, head + 0.22, z + 0.14], {
    colour: shade(c.metal, 0.9),
    tile: TILE.metal,
  });

  /**
   * The strip light under the hatch, facing down at the counter.
   *
   * It is in the SIGN surface, so it runs on the same emissive material as the fascia and comes up
   * with it at dusk. Two reasons it is here and not decoration: a serving hatch that is unlit at
   * 22:00 reads as a closed shop however bright its sign is, and the sign mesh was otherwise two
   * triangles — a whole draw call for a single quad.
   *
   * Wholly INSIDE the reveal, not overhanging the counter nose. Hung 11 cm proud it took direct sun
   * at noon and the misting station's teal strip read as a lit tube in the middle of the day; under
   * the bulkhead it is in shadow when it is off and still visible from the queue when it is on.
   */
  addQuad(
    c.sign,
    [x0 + 0.06, head - 0.05, z - 0.34],
    [x1 - 0.06, head - 0.05, z - 0.34],
    [x1 - 0.06, head - 0.05, z - 0.06],
    [x0 + 0.06, head - 0.05, z - 0.06],
    { colour: [1, 1, 1], tile: TILE.board, repeatU: 1, repeatV: 1, back: true }
  );
}

/**
 * A wall to hang something on: an origin in the plan, and the direction that wall faces.
 *
 * The flat massings all face `+z` and could get away with axis-aligned boxes; the round pavilion
 * cannot, and the first version of it proved the point in a screenshot — the fascia was a flat
 * panel spanning ±0.82 r across an octagon, so it stuck out past the drum on both sides like a
 * shelf, and the menu board floated half off the wall it was meant to be screwed to. Every fitting
 * takes a `Facet` now and the flat forms pass the trivial one.
 */
interface Facet {
  /** A point on the wall, in plan. */
  x: number;
  z: number;
  /** Unit outward normal, in plan. */
  dx: number;
  dz: number;
}

/** The front wall of a flat-fronted massing: the plane at `zFront`, facing the customer. */
function frontFacet(c: Ctx): Facet {
  return { x: 0, z: c.zFront, dx: 0, dz: 1 };
}

/** `u` across the facet (right as the customer sees it), `y` up, `out` along the outward normal. */
function onFacet(f: Facet, u: number, y: number, out: number): P3 {
  return [f.x + f.dz * u + f.dx * out, y, f.z - f.dx * u + f.dz * out];
}

/** A box lying on a facet: `u0..u1` across, `y0..y1` up, `out0..out1` through the wall. */
function facetBox(
  s: Surface,
  f: Facet,
  u0: number,
  u1: number,
  y0: number,
  y1: number,
  out0: number,
  out1: number,
  colour: Rgb,
  tile: number
): void {
  const p = (u: number, y: number, o: number): P3 => onFacet(f, u, y, o);
  // Outer face, two sides, top and bottom. The inner face is against the wall and never seen.
  addQuad(s, p(u0, y0, out1), p(u1, y0, out1), p(u1, y1, out1), p(u0, y1, out1), { colour, tile });
  addQuad(s, p(u1, y0, out1), p(u1, y0, out0), p(u1, y1, out0), p(u1, y1, out1), {
    colour: shade(colour, 0.85),
    tile,
    repeatU: 1,
  });
  addQuad(s, p(u0, y0, out0), p(u0, y0, out1), p(u0, y1, out1), p(u0, y1, out0), {
    colour: shade(colour, 0.85),
    tile,
    repeatU: 1,
  });
  addQuad(s, p(u0, y1, out1), p(u1, y1, out1), p(u1, y1, out0), p(u0, y1, out0), {
    colour: shade(colour, 1.08),
    tile,
    repeatV: 1,
  });
  addQuad(s, p(u0, y0, out0), p(u1, y0, out0), p(u1, y0, out1), p(u0, y0, out1), {
    colour: shade(colour, 0.7),
    tile,
    repeatV: 1,
  });
}

/**
 * The fascia band and its pictogram.
 *
 * The panel is drawn with the emissive material and the glyph is extruded 3 cm proud of it in the
 * opaque kit, so at night the pictogram is a silhouette against a lit box — which is what a park's
 * signage actually is, and what makes it legible at 40 m where flat lettering on a flat panel is
 * not.
 */
function fascia(c: Ctx, f: Facet, y0: number, height: number, halfWidth: number): void {
  if (height <= 0.02 || halfWidth <= 0.1) return;
  const w = halfWidth;
  // A dark surround first, so the panel has an edge rather than bleeding into the wall. 4 cm, not
  // 7: on a 40 cm band a 7 cm frame is a third of the sign, and the fascias in the noon frames read
  // as dark bars with a light slot in them.
  facetBox(
    c.kit,
    f,
    -w - 0.04,
    w + 0.04,
    y0 - 0.04,
    y0 + height + 0.04,
    -0.09,
    0.005,
    c.signBoard,
    TILE.metal
  );
  // The lit panel, just proud of it.
  addQuad(
    c.sign,
    onFacet(f, -w, y0, 0.012),
    onFacet(f, w, y0, 0.012),
    onFacet(f, w, y0 + height, 0.012),
    onFacet(f, -w, y0 + height, 0.012),
    { colour: [1, 1, 1], tile: TILE.board, repeatU: 1, repeatV: 1 }
  );
  const g = c.glyph;
  if (!g.length) return;
  const size = height * 0.78;
  const ou = -w + size * 0.42;
  const oy = y0 + (height - size) / 2;
  for (const line of g) {
    for (let i = 0; i + 3 < line.length; i += 2) {
      const a = onFacet(f, ou + line[i] * size, oy + line[i + 1] * size, 0.045);
      const b = onFacet(f, ou + line[i + 2] * size, oy + line[i + 3] * size, 0.045);
      strokeSegment(c.kit, f, a, b, size * 0.12, c.signBoard);
    }
  }
}

/**
 * One segment of a glyph, as a flat strip lying on a facet.
 *
 * The half-width has to be perpendicular to the segment **inside the wall plane**, not in world
 * space, or a diagonal stroke on a wall that is not axis-aligned comes out twisted. In the facet's
 * own (across, up) basis the perpendicular of `(du, dv)` is `(-dv, du)`, which is the whole trick.
 */
function strokeSegment(s: Surface, f: Facet, a: P3, b: P3, width: number, colour: Rgb): void {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-5) return;
  const ax = f.dz;
  const az = -f.dx;
  const du = (dx * ax + dz * az) / len;
  const dv = dy / len;
  const h = width * 0.5;
  // Extend each end by half a width so corners join without a notch.
  const ex = (dx / len) * h;
  const ey = (dy / len) * h;
  const ez = (dz / len) * h;
  const px = -dv * ax * h;
  const py = du * h;
  const pz = -dv * az * h;
  const q0: P3 = [a[0] - ex + px, a[1] - ey + py, a[2] - ez + pz];
  const q1: P3 = [b[0] + ex + px, b[1] + ey + py, b[2] + ez + pz];
  const q2: P3 = [b[0] + ex - px, b[1] + ey - py, b[2] + ez - pz];
  const q3: P3 = [a[0] - ex - px, a[1] - ey - py, a[2] - ez - pz];
  addQuad(s, q3, q2, q1, q0, { colour, tile: TILE.metal, repeatU: 1, repeatV: 1 });
}

/**
 * The menu board: a slate panel with the lines that are actually on the shop's menu.
 *
 * The rows come from the resolved board, so a pack that gives a shop four items gets four lines
 * and one that gives it none gets a blank board rather than four invented ones. Each line is two
 * strokes — a ragged item strip whose length follows the name, and a short price strip on the
 * right — which at 3 m reads as handwriting and at 15 m reads as a menu.
 */
function menuBoard(c: Ctx, f: Facet, u: number, y: number, w: number, h: number): void {
  const frame = shade(c.trim, 1.05);
  facetBox(
    c.kit,
    f,
    u - w / 2 - 0.05,
    u + w / 2 + 0.05,
    y - 0.05,
    y + h + 0.05,
    -0.05,
    0.01,
    frame,
    TILE.timber
  );
  const slate = srgb('#232a2c');
  addQuad(
    c.kit,
    onFacet(f, u - w / 2, y, 0.018),
    onFacet(f, u + w / 2, y, 0.018),
    onFacet(f, u + w / 2, y + h, 0.018),
    onFacet(f, u - w / 2, y + h, 0.018),
    { colour: slate, tile: TILE.board, repeatU: 1, repeatV: 1 }
  );
  const lines = c.board.slice(0, 5);
  if (!lines.length) return;
  const chalk = srgb('#dfe4de');
  const pitch = h / (lines.length + 1);
  lines.forEach((line, i) => {
    const ly = y + h - pitch * (i + 0.85);
    const name = line.name.en ?? Object.values(line.name)[0] ?? '';
    // Length follows the word; a menu whose lines are all the same length is a barcode.
    const len = Math.min(w * 0.56, w * 0.2 + name.length * w * 0.026);
    const u0 = u - w / 2 + 0.07;
    strokeSegment(
      c.kit,
      f,
      onFacet(f, u0, ly, 0.026),
      onFacet(f, u0 + len, ly, 0.026),
      pitch * 0.22,
      chalk
    );
    const p0 = u + w / 2 - 0.07 - w * 0.14;
    strokeSegment(
      c.kit,
      f,
      onFacet(f, p0, ly, 0.026),
      onFacet(f, u + w / 2 - 0.07, ly, 0.026),
      pitch * 0.22,
      chalk
    );
  });
}

/**
 * A striped canvas awning on a steel frame.
 *
 * Stripes are geometry, not texture: they have to run down the slope of the canvas whatever the
 * projection, and an atlas cannot rotate a tile. Each stripe is its own quad, drawn front and back
 * so the underside is lit — a single-sided awning is a hole in the sky from below, which is the
 * angle a person in the queue is looking from.
 */
function awning(c: Ctx, y: number, halfWidth: number, project: number): void {
  const z0 = c.zFront;
  const z1 = c.zFront + project;
  // A real market awning falls about a quarter of its projection: 2.55 m at the wall to 2.1 m at
  // the front over 1.9 m out, which is a shelter a person can stand under. At 0.34 the front edge
  // of a 1.9 m awning was at 1.7 m, i.e. below head height.
  const drop = project * 0.24;
  const stripes = Math.max(4, Math.round((halfWidth * 2) / 0.42));
  for (let i = 0; i < stripes; i++) {
    const x0 = -halfWidth + (i / stripes) * halfWidth * 2;
    const x1 = -halfWidth + ((i + 1) / stripes) * halfWidth * 2;
    const colour = i % 2 === 0 ? c.awnA : c.awnB;
    const a: P3 = [x0, y, z0];
    const b: P3 = [x1, y, z0];
    const cc: P3 = [x1, y - drop, z1];
    const d: P3 = [x0, y - drop, z1];
    addQuad(c.kit, a, b, cc, d, { colour, tile: TILE.canvas, repeatU: 1 });
    addQuad(c.kit, d, cc, b, a, { colour: shade(colour, 0.62), tile: TILE.canvas, repeatU: 1 });
  }
  // The scalloped valance on the front edge, which is the detail that says "awning" and not "shelf".
  const scallops = stripes;
  for (let i = 0; i < scallops; i++) {
    const x0 = -halfWidth + (i / scallops) * halfWidth * 2;
    const x1 = -halfWidth + ((i + 1) / scallops) * halfWidth * 2;
    const colour = i % 2 === 0 ? c.awnA : c.awnB;
    const dip = 0.16;
    addQuad(
      c.kit,
      [x0, y - drop, z1],
      [x1, y - drop, z1],
      [x1, y - drop - dip * 0.45, z1],
      [x0, y - drop - dip * 0.45, z1],
      { colour: shade(colour, 0.9), tile: TILE.canvas, repeatU: 1, repeatV: 1 }
    );
    addQuad(
      c.kit,
      [x0, y - drop - dip * 0.45, z1],
      [x1, y - drop - dip * 0.45, z1],
      [(x0 + x1) / 2, y - drop - dip, z1],
      [(x0 + x1) / 2, y - drop - dip, z1],
      { colour: shade(colour, 0.85), tile: TILE.canvas, repeatU: 1, repeatV: 1 }
    );
  }
  // Two arms.
  for (const s of [-1, 1]) {
    addTube(
      c.kit,
      [s * (halfWidth - 0.12), y, z0],
      [s * (halfWidth - 0.12), y - drop, z1],
      0.028,
      c.metal,
      TILE.metal
    );
  }
}

/**
 * A pitched roof with eaves, a fascia board and rafter ends.
 *
 * `kind` picks the shape; the overhang, the fascia and the rafters are the same for all of them,
 * because they are what a roof has and not what a particular roof has.
 *
 * `cone` is not in the list on purpose: a cone over a rectangle is not a thing, so a style that asks
 * for one on a flat massing gets a hip. The round pavilion builds its own cone, where the plan it
 * has to sit on is a polygon.
 */
function roof(c: Ctx, kind: string, eaveY: number, pitchDeg: number, over: number): void {
  const x0 = -c.hw - over;
  const x1 = c.hw + over;
  const z0 = c.zBack - over;
  const z1 = c.zFront + over;
  const pitch = (Math.max(2, pitchDeg) * Math.PI) / 180;
  const half = Math.min((x1 - x0) / 2, (z1 - z0) / 2);
  const rise = Math.tan(pitch) * half;
  const ridgeY = eaveY + rise;
  const tile = TILE.roof;
  const light = shade(c.roofC, 1.1);
  const dark = shade(c.roofC, 0.86);

  if (kind === 'flat') {
    addQuad(c.kit, [x0, eaveY, z1], [x1, eaveY, z1], [x1, eaveY, z0], [x0, eaveY, z0], {
      colour: c.roofC,
      tile: TILE.metal,
    });
  } else if (kind === 'shed') {
    const backY = eaveY + Math.tan(pitch) * (z1 - z0);
    addQuad(c.kit, [x0, eaveY, z1], [x1, eaveY, z1], [x1, backY, z0], [x0, backY, z0], {
      colour: c.roofC,
      colourTop: dark,
      tile,
    });
    // Gable triangles down the sides.
    addTriangle(c.kit, [x0, eaveY, z1], [x0, backY, z0], [x0, eaveY, z0], dark, tile);
    addTriangle(c.kit, [x1, eaveY, z0], [x1, backY, z0], [x1, eaveY, z1], dark, tile);
  } else if (kind === 'gable') {
    // Ridge runs across the frontage (parallel to +x), which is what a shop front wants.
    const zm = (z0 + z1) / 2;
    const r = eaveY + Math.tan(pitch) * ((z1 - z0) / 2);
    addQuad(c.kit, [x0, eaveY, z1], [x1, eaveY, z1], [x1, r, zm], [x0, r, zm], {
      colour: light,
      colourTop: c.roofC,
      tile,
    });
    addQuad(c.kit, [x1, eaveY, z0], [x0, eaveY, z0], [x0, r, zm], [x1, r, zm], {
      colour: dark,
      colourTop: shade(c.roofC, 0.94),
      tile,
    });
    addTriangle(c.kit, [x0, eaveY, z1], [x0, r, zm], [x0, eaveY, z0], dark, tile);
    addTriangle(c.kit, [x1, eaveY, z0], [x1, r, zm], [x1, eaveY, z1], dark, tile);
    ridgeCap(c, [x0, r, zm], [x1, r, zm]);
  } else {
    // Hip: four panels meeting on a ridge that runs the long way.
    const ridgeLen = Math.max(0.4, x1 - x0 - (z1 - z0));
    const rx0 = -ridgeLen / 2;
    const rx1 = ridgeLen / 2;
    const zm = (z0 + z1) / 2;
    const r = ridgeY;
    addQuad(c.kit, [x0, eaveY, z1], [x1, eaveY, z1], [rx1, r, zm], [rx0, r, zm], {
      colour: light,
      colourTop: c.roofC,
      tile,
    });
    addQuad(c.kit, [x1, eaveY, z0], [x0, eaveY, z0], [rx0, r, zm], [rx1, r, zm], {
      colour: dark,
      colourTop: shade(c.roofC, 0.94),
      tile,
    });
    addTriangle(c.kit, [x0, eaveY, z1], [rx0, r, zm], [x0, eaveY, z0], shade(c.roofC, 0.9), tile);
    addTriangle(c.kit, [x1, eaveY, z0], [rx1, r, zm], [x1, eaveY, z1], shade(c.roofC, 0.9), tile);
    ridgeCap(c, [rx0, r, zm], [rx1, r, zm]);
  }

  // Fascia board on all four eaves, and the rafter ends under the front one.
  const fasciaC = c.trim;
  const t = 0.09;
  addBox(c.kit, [x0, eaveY - 0.16, z1 - t], [x1, eaveY, z1], {
    colour: fasciaC,
    tile: TILE.timber,
  });
  addBox(c.kit, [x0, eaveY - 0.16, z0], [x1, eaveY, z0 + t], {
    colour: fasciaC,
    tile: TILE.timber,
  });
  addBox(c.kit, [x0, eaveY - 0.16, z0], [x0 + t, eaveY, z1], {
    colour: fasciaC,
    tile: TILE.timber,
  });
  addBox(c.kit, [x1 - t, eaveY - 0.16, z0], [x1, eaveY, z1], {
    colour: fasciaC,
    tile: TILE.timber,
  });
  if (over > 0.2) {
    const n = Math.max(2, Math.round((c.hw * 2) / 0.7));
    for (let i = 0; i <= n; i++) {
      const x = -c.hw + (i / n) * c.hw * 2;
      addBox(c.kit, [x - 0.035, eaveY - 0.15, c.zFront], [x + 0.035, eaveY - 0.05, z1 - t], {
        colour: shade(fasciaC, 0.88),
        tile: TILE.timber,
      });
    }
  }
  c.eaveTop = eaveY;
}

function ridgeCap(c: Ctx, a: P3, b: P3): void {
  addBox(
    c.kit,
    [Math.min(a[0], b[0]), a[1] - 0.02, a[2] - 0.09],
    [Math.max(a[0], b[0]), a[1] + 0.1, a[2] + 0.09],
    { colour: shade(c.roofC, 1.06), tile: TILE.roof }
  );
}

function addTriangle(s: Surface, a: P3, b: P3, c: P3, colour: Rgb, tile: number): void {
  // A degenerate fourth corner turns the quad emitter into a triangle emitter, which keeps the
  // atlas and the winding logic in one place.
  addQuad(s, a, b, c, c, { colour, tile, repeatU: 2, repeatV: 2 });
}

/** Powder-coated queue rail: posts at 1.5 m, a top rail at 1.0 m and a mid rail at 0.55 m. */
function queueRail(c: Ctx): void {
  const length = Math.min(c.style.rail, c.hw * 2 + 3);
  const forward = Math.max(1.4, c.style.apron) - 0.4;
  const x = c.hw + 0.55;
  const legs: Array<[P3, P3]> = [
    // Two arms running out from the building either side of the queue, and a return across the
    // front — a U with the opening facing the path, which is how a park channels a line.
    [
      [-x, 0, c.zFront + 0.2],
      [-x, 0, forward],
    ],
    [
      [x, 0, c.zFront + 0.2],
      [x, 0, forward],
    ],
  ];
  const railTop = 1.0;
  const railMid = 0.55;
  for (const [a, b] of legs) {
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    if (len < 0.5) continue;
    const posts = Math.max(2, Math.round(len / 1.5) + 1);
    for (let i = 0; i < posts; i++) {
      const t = i / (posts - 1);
      const px = a[0] + (b[0] - a[0]) * t;
      const pz = a[2] + (b[2] - a[2]) * t;
      addPrism(c.kit, px, pz, 0.05, railTop + 0.04, 0.028, 0.024, {
        colour: c.metal,
        tile: TILE.metal,
        sides: 6,
        capTop: true,
      });
      // A cast base flange, so the post lands on the paving rather than through it.
      addPrism(c.kit, px, pz, 0.05, 0.09, 0.075, 0.06, {
        colour: shade(c.metal, 0.86),
        tile: TILE.metal,
        sides: 8,
        capTop: true,
      });
    }
    addTube(c.kit, [a[0], railTop, a[2]], [b[0], railTop, b[2]], 0.024, c.metal, TILE.metal);
    addTube(
      c.kit,
      [a[0], railMid, a[2]],
      [b[0], railMid, b[2]],
      0.018,
      shade(c.metal, 0.94),
      TILE.metal
    );
    void length;
  }
}

/** A bin, a condiment shelf and a planter — the things that actually stand beside a kiosk. */
function dressing(c: Ctx): void {
  const s = c.seed;
  const side = rand2(s, 1, 17) > 0.5 ? 1 : -1;
  const wallZ = c.frontWallZ;
  const binX = side * (c.hw + 0.35);
  const binZ = wallZ + 0.55;
  // Bin: a tapered drum with a hooded lid on a post, which is the park pattern.
  addPrism(c.kit, binX, binZ, 0.05, 0.86, 0.24, 0.27, {
    colour: shade(c.trim, 0.9),
    tile: TILE.metal,
    sides: 10,
  });
  addPrism(c.kit, binX, binZ, 0.86, 0.96, 0.3, 0.26, {
    colour: shade(c.trim, 0.7),
    tile: TILE.metal,
    sides: 10,
    capTop: true,
  });
  // Condiment shelf against the frontage.
  const shelfX = -side * (c.hw - 0.55);
  addBox(c.kit, [shelfX - 0.42, 0.9, c.zFront + 0.02], [shelfX + 0.42, 0.98, c.zFront + 0.36], {
    colour: c.trim,
    tile: TILE.timber,
  });
  for (const dx of [-0.36, 0.36]) {
    addBox(
      c.kit,
      [shelfX + dx - 0.03, 0.05, c.zFront + 0.06],
      [shelfX + dx + 0.03, 0.9, c.zFront + 0.12],
      { colour: shade(c.metal, 0.9), tile: TILE.metal }
    );
  }
  // A planter at the mouth of the queue.
  const px = -side * (c.hw + 0.7);
  const pz = Math.max(1.4, c.style.apron) - 0.6;
  addBox(c.kit, [px - 0.42, 0.05, pz - 0.42], [px + 0.42, 0.52, pz + 0.42], {
    colour: mixRgb(c.wall, srgb('#8a7f6d'), 0.5),
    tile: TILE.render,
  });
  addBox(c.kit, [px - 0.36, 0.52, pz - 0.36], [px + 0.36, 0.6, pz + 0.36], {
    colour: srgb('#3f4a2c'),
    tile: TILE.render,
  });
  // Three clipped mounds, so it is a planter with something in it rather than a box of soil.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.4;
    addPrism(c.kit, px + Math.cos(a) * 0.19, pz + Math.sin(a) * 0.19, 0.56, 0.86, 0.17, 0.05, {
      colour: srgb('#4c6a34'),
      tile: TILE.render,
      sides: 6,
      capTop: true,
    });
  }
}

/** A pylon sign: a post with a lit panel on it, for a building that has no frontage of its own. */
function pylon(c: Ctx): void {
  const h = c.style.sign.post;
  const x = c.hw + 1.1;
  const z = Math.max(1.2, c.style.apron) - 0.5;
  addPrism(c.kit, x, z, 0.05, h, 0.075, 0.065, {
    colour: c.metal,
    tile: TILE.metal,
    sides: 8,
    capTop: true,
  });
  const pw = 0.62;
  const ph = 0.62;
  addBox(c.kit, [x - pw / 2 - 0.05, h - ph - 0.05, z - 0.06], [x + pw / 2 + 0.05, h + 0.05, z], {
    colour: c.signBoard,
    tile: TILE.metal,
  });
  addQuad(
    c.sign,
    [x - pw / 2, h - ph, z + 0.005],
    [x + pw / 2, h - ph, z + 0.005],
    [x + pw / 2, h, z + 0.005],
    [x - pw / 2, h, z + 0.005],
    { colour: [1, 1, 1], tile: TILE.board, repeatU: 1, repeatV: 1 }
  );
  for (const line of c.glyph) {
    const pts: number[] = [];
    for (let i = 0; i + 1 < line.length; i += 2) {
      pts.push(x - pw / 2 + line[i] * pw, h - ph + line[i + 1] * ph);
    }
    addStroke(c.kit, pts, z + 0.03, pw * 0.085, 0.02, c.signBoard, TILE.metal);
  }
}

// ── The five massings ───────────────────────────────────────────────────────────────────────

/** A free-standing hut with a serving window: the food kiosk every park has fifteen of. */
function kioskHut(c: Ctx): void {
  const style = c.style;
  const plinth = style.plinth;
  const wallTop = style.wallHeight;
  const zF = c.zFront;
  const zB = c.zBack;

  // Plinth, a few centimetres proud of the wall above it.
  if (plinth > 0.01) {
    addBox(c.kit, [-c.hw - 0.05, 0.05, zB - 0.05], [c.hw + 0.05, plinth, zF + 0.05], {
      colour: shade(c.wall, 0.74),
      tile: TILE.render,
    });
  }

  // Back and sides. Weathering runs down the wall, so the colour is graded from the plinth up.
  const weathered = shade(c.wall, 0.9);
  addBox(c.kit, [-c.hw, plinth, zB], [c.hw, wallTop, zF], {
    colour: weathered,
    colourTop: c.wall,
    tile: c.claddingTile,
    // The front face is drawn in pieces below, so it is skipped here.
    skip: [false, false, false, true, true, false],
  });

  // The front: piers, a spandrel under the counter, a bulkhead over it.
  const sill = Math.max(0.8, style.counterHeight);
  const head = Math.min(wallTop - 0.28, sill + 1.05);
  const bays = Math.max(1, c.counters);
  const pier = 0.34;
  const usable = c.hw * 2 - pier * (bays + 1);
  const bayW = Math.max(0.6, usable / bays);
  for (let i = 0; i <= bays; i++) {
    const x = -c.hw + pier * i + bayW * i;
    addBox(c.kit, [x, plinth, zF - 0.16], [x + pier, wallTop, zF], {
      colour: weathered,
      colourTop: c.wall,
      tile: c.claddingTile,
    });
  }
  for (let i = 0; i < bays; i++) {
    const x0 = -c.hw + pier * (i + 1) + bayW * i;
    const x1 = x0 + bayW;
    // Spandrel below the counter and bulkhead above it.
    addBox(c.kit, [x0, plinth, zF - 0.16], [x1, sill, zF], {
      colour: weathered,
      colourTop: c.wall,
      tile: c.claddingTile,
    });
    addBox(c.kit, [x0, head, zF - 0.16], [x1, wallTop, zF], {
      colour: c.wall,
      tile: c.claddingTile,
    });
    servingBay(c, x0, x1, sill, head);
  }

  /**
   * Roof, then fascia, then awning — in that order and hung off each other, not off three
   * independent numbers.
   *
   * The frontage has to stack: hatch head, awning, sign, eaves. Placing each of them from
   * `wallHeight` independently is how the first render came out with the awning starting in the
   * middle of the sign band. The fascia goes just under the eaves and the awning just under the
   * fascia, so a pack that raises the wall gets more room for all three rather than a collision.
   */
  roof(c, style.roof, wallTop, style.roofPitch, style.eaves);
  const bandH = style.sign.fascia;
  const bandY = wallTop - bandH - 0.06;
  if (bandH > 0.02) fascia(c, frontFacet(c), bandY, bandH, c.hw - 0.12);
  if (style.awning > 0.05) {
    awning(c, (bandH > 0.02 ? bandY : wallTop - 0.4) - 0.1, c.hw + style.eaves * 0.4, style.awning);
  }

  // Menu board on the widest pier, or beside the opening when there is only one bay.
  if (style.menuBoard > 0.02) {
    const bw = Math.min(1.5, c.hw * 2 * style.menuBoard);
    menuBoard(c, frontFacet(c), -c.hw + bw / 2 + 0.15, sill + 0.16, bw, Math.min(1.0, bw * 0.78));
  }

  if (style.flue > 0.05) {
    const fx = c.hw * 0.45;
    const fz = (zF + zB) / 2;
    addPrism(c.kit, fx, fz, wallTop, wallTop + style.flue + 0.6, 0.13, 0.12, {
      colour: shade(c.metal, 1.05),
      tile: TILE.metal,
      sides: 8,
    });
    addPrism(c.kit, fx, fz, wallTop + style.flue + 0.6, wallTop + style.flue + 0.78, 0.2, 0.2, {
      colour: shade(c.metal, 0.85),
      tile: TILE.metal,
      sides: 8,
      capTop: true,
    });
  }
}

/** A polygonal pavilion with a conical roof: the ice-cream and lemonade kind. */
function roundPavilion(c: Ctx): void {
  const style = c.style;
  const r = Math.max(1.1, Math.min(c.width, c.depth) / 2);
  const cz = c.zFront - r;
  const sides = 8;
  const phase = Math.PI / sides;
  const wallTop = style.wallHeight;
  const sill = Math.max(0.8, style.counterHeight);
  const head = Math.min(wallTop - 0.3, sill + 1.0);

  if (style.plinth > 0.01) {
    addPrism(c.kit, 0, cz, 0.05, style.plinth, r + 0.09, r + 0.09, {
      colour: shade(c.wall, 0.74),
      tile: TILE.render,
      sides,
      phase,
    });
  }

  /**
   * The drum, facet by facet, and the counter set into the front of it.
   *
   * The serving side is a run of consecutive facets **centred on the front one**, because a run
   * that starts at facet 0 puts the opening off to one side of a building whose whole point is that
   * it is symmetrical. The first version opened facets 1 and 2 by index, which on this phase is the
   * front and the front-LEFT, and every lemonade stand in the showcase served over its shoulder.
   *
   * A facet is a `Facet`, so the counter, the fascia and the menu board all land on the wall they
   * belong to instead of on an axis-aligned plane through the middle of the building — which is
   * what the round pavilion looked like in `.game-render/shops-detail/street.png`: a dark panel
   * hanging a metre out past the drum on both sides.
   */
  const facetOf = (i: number): Facet => {
    const mid = phase + ((i + 0.5) / sides) * TAU;
    const apothem = r * Math.cos(Math.PI / sides);
    return {
      x: Math.cos(mid) * apothem,
      z: cz + Math.sin(mid) * apothem,
      dx: Math.cos(mid),
      dz: Math.sin(mid),
    };
  };
  // Which facet faces the customer: the one whose midpoint is nearest +z.
  let frontIndex = 0;
  let best = -Infinity;
  for (let i = 0; i < sides; i++) {
    const mid = phase + ((i + 0.5) / sides) * TAU;
    if (Math.sin(mid) > best) {
      best = Math.sin(mid);
      frontIndex = i;
    }
  }
  const bays = Math.max(1, Math.min(3, c.counters));
  const openFacets = new Set<number>();
  for (let k = 0; k < bays; k++) {
    openFacets.add((frontIndex + k - Math.floor((bays - 1) / 2) + sides) % sides);
  }

  const halfFacet = r * Math.sin(Math.PI / sides);
  c.frontWallZ = cz + r * Math.cos(Math.PI / sides);
  for (let i = 0; i < sides; i++) {
    const f = facetOf(i);
    const wallBand = (y0: number, y1: number, colour: Rgb, colourTop?: Rgb): void => {
      addQuad(
        c.kit,
        onFacet(f, -halfFacet, y0, 0),
        onFacet(f, halfFacet, y0, 0),
        onFacet(f, halfFacet, y1, 0),
        onFacet(f, -halfFacet, y1, 0),
        { colour, colourTop, tile: c.claddingTile }
      );
    };
    if (openFacets.has(i)) {
      wallBand(style.plinth, sill, shade(c.wall, 0.9), c.wall);
      wallBand(head, wallTop, c.wall);
      // Counter slab: through the wall and 22 cm proud, with the fillet under its nose.
      const top = srgb('#8d8a84');
      facetBox(
        c.kit,
        f,
        -halfFacet - 0.04,
        halfFacet + 0.04,
        sill,
        sill + 0.05,
        -0.55,
        0.22,
        top,
        TILE.metal
      );
      facetBox(
        c.kit,
        f,
        -halfFacet,
        halfFacet,
        sill - 0.1,
        sill,
        0.02,
        0.16,
        shade(top, 0.72),
        TILE.metal
      );
      // The shutter box over the opening.
      facetBox(
        c.kit,
        f,
        -halfFacet - 0.05,
        halfFacet + 0.05,
        head,
        head + 0.2,
        -0.02,
        0.13,
        shade(c.metal, 0.9),
        TILE.metal
      );
      // The reveal: a hard shadow line under the bulkhead is what tells the eye it is a hole.
      addQuad(
        c.kit,
        onFacet(f, -halfFacet, head, -0.4),
        onFacet(f, halfFacet, head, -0.4),
        onFacet(f, halfFacet, head, 0),
        onFacet(f, -halfFacet, head, 0),
        { colour: shade(c.wall, 0.38), tile: TILE.metal, repeatV: 1 }
      );
      // The strip light under the hatch — see the note in `servingBay`.
      addQuad(
        c.sign,
        onFacet(f, -halfFacet + 0.06, head - 0.05, -0.34),
        onFacet(f, halfFacet - 0.06, head - 0.05, -0.34),
        onFacet(f, halfFacet - 0.06, head - 0.05, -0.06),
        onFacet(f, -halfFacet + 0.06, head - 0.05, -0.06),
        { colour: [1, 1, 1], tile: TILE.board, repeatU: 1, repeatV: 1, back: true }
      );
    } else {
      wallBand(style.plinth, wallTop, shade(c.wall, 0.9), c.wall);
    }
  }

  /**
   * The inside, as a smaller solid drum rather than a card across the opening.
   *
   * A single panel behind the counter is a card floating in a hole from any angle but dead on, and
   * that is what the showcase frame showed. A drum at 0.52 r has a face towards every opening, is
   * eleven quads, and closes the building from every direction at once.
   */
  addPrism(c.kit, 0, cz, style.plinth, head + 0.05, r * 0.44, r * 0.44, {
    colour: shade(c.wall, 0.42),
    tile: TILE.timber,
    sides,
    phase,
    capTop: true,
  });

  // Conical roof with a deep overhang, a fascia ring and a finial.
  const over = r + style.eaves;
  const rise = Math.tan((style.roofPitch * Math.PI) / 180) * over;
  addPrism(c.kit, 0, cz, wallTop, wallTop + rise, over, 0.05, {
    colour: shade(c.roofC, 1.06),
    colourTop: shade(c.roofC, 0.9),
    tile: TILE.roof,
    sides: sides * 2,
    phase,
  });
  addPrism(c.kit, 0, cz, wallTop - 0.16, wallTop, over, over, {
    colour: c.trim,
    tile: TILE.timber,
    sides: sides * 2,
    phase,
  });
  addDisc(
    c.kit,
    0,
    wallTop - 0.16,
    cz,
    over,
    sides * 2,
    phase,
    shade(c.trim, 0.8),
    TILE.timber,
    true
  );
  addPrism(c.kit, 0, cz, wallTop + rise, wallTop + rise + 0.42, 0.06, 0.03, {
    colour: c.metal,
    tile: TILE.metal,
    sides: 6,
    capTop: true,
  });
  addPrism(c.kit, 0, cz, wallTop + rise + 0.1, wallTop + rise + 0.26, 0.13, 0.13, {
    colour: shade(c.metal, 1.1),
    tile: TILE.metal,
    sides: 8,
    capTop: true,
    capBottom: true,
  });

  // The fascia goes on the front facet and no wider than it; the menu board on the solid facet
  // next to the openings, which is where a kiosk actually puts one.
  const bandH = style.sign.fascia;
  if (bandH > 0.02) {
    fascia(c, facetOf(frontIndex), wallTop - bandH - 0.03, bandH, halfFacet - 0.04);
  }
  if (style.menuBoard > 0.02) {
    let boardFacet = frontIndex;
    for (let k = 1; k <= sides; k++) {
      const candidate = (frontIndex - k + sides) % sides;
      if (!openFacets.has(candidate)) {
        boardFacet = candidate;
        break;
      }
    }
    const bw = Math.min(halfFacet * 1.7, r * 2 * style.menuBoard);
    menuBoard(c, facetOf(boardFacet), 0, sill + 0.18, bw, bw * 0.82);
  }
  c.eaveTop = wallTop;
}

/** A low utility block with doors: toilets, changing rooms. */
function utilityBlock(c: Ctx): void {
  const style = c.style;
  const wallTop = style.wallHeight;
  const zF = c.zFront;
  const zB = c.zBack;

  if (style.plinth > 0.01) {
    addBox(c.kit, [-c.hw - 0.06, 0.05, zB - 0.06], [c.hw + 0.06, style.plinth, zF + 0.06], {
      colour: shade(c.wall, 0.7),
      tile: TILE.render,
    });
  }
  addBox(c.kit, [-c.hw, style.plinth, zB], [c.hw, wallTop, zF], {
    colour: shade(c.wall, 0.92),
    colourTop: c.wall,
    tile: c.claddingTile,
    skip: [false, false, false, true, true, false],
  });

  // The front wall with its doors punched out of it.
  const doors = Math.max(1, style.doors);
  const doorW = 0.9;
  const doorH = 2.05;
  const pitch = (c.hw * 2) / doors;
  const openings: Array<[number, number]> = [];
  for (let i = 0; i < doors; i++) {
    const cx = -c.hw + pitch * (i + 0.5);
    openings.push([cx - doorW / 2, cx + doorW / 2]);
  }
  let cursor = -c.hw;
  for (const [x0, x1] of openings) {
    if (x0 > cursor) {
      addBox(c.kit, [cursor, style.plinth, zF - 0.14], [x0, wallTop, zF], {
        colour: shade(c.wall, 0.92),
        colourTop: c.wall,
        tile: c.claddingTile,
      });
    }
    // Head over the door.
    addBox(c.kit, [x0, style.plinth + doorH, zF - 0.14], [x1, wallTop, zF], {
      colour: c.wall,
      tile: c.claddingTile,
    });
    // The reveal and the leaf, set back so the opening has depth.
    const back = 0.14;
    addQuad(
      c.kit,
      [x0, style.plinth, zF - back],
      [x1, style.plinth, zF - back],
      [x1, style.plinth + doorH, zF - back],
      [x0, style.plinth + doorH, zF - back],
      { colour: shade(c.trim, 0.86), tile: TILE.timber }
    );
    addQuad(
      c.kit,
      [x0, style.plinth + doorH, zF - back],
      [x1, style.plinth + doorH, zF - back],
      [x1, style.plinth + doorH, zF],
      [x0, style.plinth + doorH, zF],
      { colour: shade(c.wall, 0.5), tile: TILE.render, repeatV: 1 }
    );
    // Handle.
    addTube(
      c.kit,
      [x1 - 0.16, style.plinth + 1.05, zF - back + 0.02],
      [x1 - 0.16, style.plinth + 1.28, zF - back + 0.02],
      0.022,
      c.metal,
      TILE.metal
    );
    // A pictogram plate beside each door, which is what a toilet block actually signs with.
    const plate = 0.3;
    const px = x1 + Math.min(0.28, (pitch - doorW) / 2 - 0.05);
    addBox(
      c.kit,
      [px - plate / 2, style.plinth + 1.5, zF - 0.005],
      [px + plate / 2, style.plinth + 1.5 + plate, zF + 0.02],
      { colour: shade(c.trim, 1.15), tile: TILE.metal }
    );
    const g = c.glyph;
    for (const line of g) {
      const pts: number[] = [];
      for (let i = 0; i + 1 < line.length; i += 2) {
        pts.push(px - plate / 2 + line[i] * plate, style.plinth + 1.5 + line[i + 1] * plate);
      }
      addStroke(c.kit, pts, zF + 0.03, plate * 0.075, 0.012, shade(c.wall, 0.3), TILE.metal);
    }
    cursor = x1;
  }
  if (cursor < c.hw) {
    addBox(c.kit, [cursor, style.plinth, zF - 0.14], [c.hw, wallTop, zF], {
      colour: shade(c.wall, 0.92),
      colourTop: c.wall,
      tile: c.claddingTile,
    });
  }

  // A louvred vent band high on the side wall, which is how these buildings breathe.
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const y = wallTop - 0.75 + i * 0.09;
      addBox(
        c.kit,
        [sx * c.hw - 0.03, y, zB + c.depth * 0.28],
        [sx * c.hw + 0.03, y + 0.05, zB + c.depth * 0.72],
        { colour: shade(c.metal, 0.9), tile: TILE.metal }
      );
    }
  }

  roof(c, style.roof, wallTop, style.roofPitch, style.eaves);
  const bandH = style.sign.fascia;
  if (bandH > 0.02) fascia(c, frontFacet(c), wallTop - bandH - 0.18, bandH, c.hw * 0.4);
}

/** A retail unit: a glazed shopfront under a fascia, with a door at one end. */
function retailUnit(c: Ctx): void {
  const style = c.style;
  const wallTop = style.wallHeight;
  const zF = c.zFront;
  const zB = c.zBack;
  const stall = 0.42;
  const transom = Math.min(wallTop - 0.75, 2.35);

  if (style.plinth > 0.01) {
    addBox(c.kit, [-c.hw - 0.06, 0.05, zB - 0.06], [c.hw + 0.06, style.plinth, zF + 0.06], {
      colour: shade(c.wall, 0.72),
      tile: TILE.brick,
    });
  }
  addBox(c.kit, [-c.hw, style.plinth, zB], [c.hw, wallTop, zF], {
    colour: shade(c.wall, 0.93),
    colourTop: c.wall,
    tile: c.claddingTile,
    skip: [false, false, false, true, true, false],
  });

  // Frontage: a glazed run, then a doorway, then a pier.
  const glazedW = Math.max(0.8, c.hw * 2 * style.glazing);
  const gx0 = -c.hw + 0.3;
  const gx1 = gx0 + glazedW;
  // Solid above the transom and below the stall riser.
  addBox(c.kit, [-c.hw, transom, zF - 0.14], [c.hw, wallTop, zF], {
    colour: c.wall,
    tile: c.claddingTile,
  });
  addBox(c.kit, [gx0 - 0.3, style.plinth, zF - 0.14], [gx0, transom, zF], {
    colour: shade(c.wall, 0.93),
    colourTop: c.wall,
    tile: c.claddingTile,
  });
  addBox(c.kit, [gx0, style.plinth, zF - 0.14], [gx1, stall, zF], {
    colour: shade(c.trim, 0.92),
    tile: TILE.timber,
  });
  // Glass, plus mullions every 1.1 m.
  addQuad(
    c.glass,
    [gx0, stall, zF - 0.04],
    [gx1, stall, zF - 0.04],
    [gx1, transom, zF - 0.04],
    [gx0, transom, zF - 0.04],
    { colour: [1, 1, 1], tile: TILE.metal, repeatU: 1, repeatV: 1 }
  );
  const mullions = Math.max(1, Math.round(glazedW / 1.1));
  for (let i = 0; i <= mullions; i++) {
    const x = gx0 + (glazedW * i) / mullions;
    addBox(c.kit, [x - 0.035, stall, zF - 0.08], [x + 0.035, transom, zF], {
      colour: c.trim,
      tile: TILE.timber,
    });
  }
  addBox(c.kit, [gx0 - 0.05, transom - 0.09, zF - 0.1], [gx1 + 0.05, transom, zF + 0.01], {
    colour: c.trim,
    tile: TILE.timber,
  });

  // The doorway.
  // A door only if the glazing left room for one. A pack that sets `glazing: 0.95` on a narrow unit
  // otherwise produced `dx0 > dx1`, i.e. boxes with min past max — inside-out geometry, no error.
  const dw = 1.0;
  const dx0 = gx1 + 0.24;
  const dx1 = Math.min(c.hw - 0.24, dx0 + dw);
  const hasDoor = dx1 - dx0 > 0.5;
  addBox(c.kit, [gx1, style.plinth, zF - 0.14], [dx0, transom, zF], {
    colour: shade(c.wall, 0.93),
    colourTop: c.wall,
    tile: c.claddingTile,
  });
  addBox(c.kit, [dx1, style.plinth, zF - 0.14], [c.hw, transom, zF], {
    colour: shade(c.wall, 0.93),
    colourTop: c.wall,
    tile: c.claddingTile,
  });
  if (hasDoor) {
    addQuad(
      c.glass,
      [dx0, style.plinth, zF - 0.1],
      [dx1, style.plinth, zF - 0.1],
      [dx1, transom - 0.08, zF - 0.1],
      [dx0, transom - 0.08, zF - 0.1],
      { colour: [1, 1, 1], tile: TILE.metal, repeatU: 1, repeatV: 1 }
    );
    for (const dx of [dx0, dx1]) {
      addBox(c.kit, [dx - 0.05, style.plinth, zF - 0.14], [dx + 0.05, transom, zF], {
        colour: c.trim,
        tile: TILE.timber,
      });
    }
    addTube(
      c.kit,
      [dx1 - 0.16, style.plinth + 0.95, zF - 0.06],
      [dx1 - 0.16, style.plinth + 1.3, zF - 0.06],
      0.022,
      c.metal,
      TILE.metal
    );
  }

  roof(c, style.roof, wallTop, style.roofPitch, style.eaves);
  const bandH = style.sign.fascia;
  if (bandH > 0.02) fascia(c, frontFacet(c), transom + 0.16, bandH, c.hw - 0.2);
  if (style.awning > 0.05) awning(c, transom + 0.12, c.hw - 0.1, style.awning);
  if (style.sign.bracket) bracketSign(c, transom + 0.1);
}

/** A projecting bracket sign at one end of the frontage. */
function bracketSign(c: Ctx, y: number): void {
  const x = -c.hw + 0.35;
  const out = 0.85;
  addTube(c.kit, [x, y, c.zFront], [x, y, c.zFront + out], 0.026, c.metal, TILE.metal);
  addTube(
    c.kit,
    [x, y - 0.42, c.zFront + 0.02],
    [x, y, c.zFront + out * 0.62],
    0.02,
    c.metal,
    TILE.metal
  );
  const w = 0.52;
  const h = 0.62;
  const zc = c.zFront + out - 0.02;
  addBox(
    c.kit,
    [x - 0.02, y - h - 0.06, zc - w / 2 - 0.06],
    [x + 0.02, y - 0.04, zc + w / 2 + 0.06],
    {
      colour: c.signBoard,
      tile: TILE.metal,
    }
  );
  for (const s of [-1, 1]) {
    addQuad(
      c.sign,
      [x + s * 0.03, y - h, zc - (s * w) / 2],
      [x + s * 0.03, y - h, zc + (s * w) / 2],
      [x + s * 0.03, y - 0.1, zc + (s * w) / 2],
      [x + s * 0.03, y - 0.1, zc - (s * w) / 2],
      { colour: [1, 1, 1], tile: TILE.board, repeatU: 1, repeatV: 1 }
    );
  }
}

/** A machine on a plinth under a hood: the cash point. */
function machine(c: Ctx): void {
  const style = c.style;
  const w = Math.max(0.7, Math.min(c.width, 1.3));
  const d = Math.max(0.4, Math.min(c.depth, 0.75));
  const zF = c.zFront;
  const h = style.wallHeight;
  const hw = w / 2;

  // Plinth and body, the body slightly narrower so it has a shadow line at its foot.
  addBox(c.kit, [-hw - 0.06, 0.05, zF - d - 0.06], [hw + 0.06, style.plinth, zF + 0.06], {
    colour: shade(c.wall, 0.6),
    tile: TILE.render,
  });
  addBox(c.kit, [-hw, style.plinth, zF - d], [hw, h, zF], {
    colour: c.wall,
    tile: TILE.metal,
  });
  // The face: a recessed panel with a screen, a keypad and a slot.
  const fx = hw - 0.08;
  addBox(c.kit, [-fx, style.counterHeight - 0.05, zF - 0.05], [fx, h - 0.14, zF + 0.01], {
    colour: shade(c.wall, 0.62),
    tile: TILE.metal,
  });
  addQuad(
    c.kit,
    [-fx + 0.06, h - 0.62, zF + 0.02],
    [fx - 0.06, h - 0.62, zF + 0.02],
    [fx - 0.06, h - 0.2, zF + 0.02],
    [-fx + 0.06, h - 0.2, zF + 0.02],
    { colour: srgb('#12181d'), tile: TILE.board, repeatU: 1, repeatV: 1 }
  );
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 3; k++) {
      addBox(
        c.kit,
        [-0.16 + k * 0.1, style.counterHeight + 0.02 + r * 0.07, zF + 0.015],
        [-0.1 + k * 0.1, style.counterHeight + 0.07 + r * 0.07, zF + 0.03],
        { colour: shade(c.metal, 1.1), tile: TILE.metal }
      );
    }
  }
  addBox(
    c.kit,
    [0.06, style.counterHeight + 0.12, zF + 0.012],
    [0.3, style.counterHeight + 0.17, zF + 0.03],
    {
      colour: srgb('#1a1f24'),
      tile: TILE.metal,
    }
  );
  // The hood, which is what makes a cash machine readable in silhouette.
  addQuad(
    c.kit,
    [-hw - 0.16, h, zF + 0.36],
    [hw + 0.16, h, zF + 0.36],
    [hw + 0.16, h + 0.2, zF - 0.04],
    [-hw - 0.16, h + 0.2, zF - 0.04],
    { colour: shade(c.trim, 1.05), tile: TILE.metal }
  );
  addQuad(
    c.kit,
    [-hw - 0.16, h + 0.2, zF - 0.04],
    [hw + 0.16, h + 0.2, zF - 0.04],
    [hw + 0.16, h, zF + 0.36],
    [-hw - 0.16, h, zF + 0.36],
    { colour: shade(c.trim, 0.7), tile: TILE.metal }
  );
  const bandH = style.sign.fascia;
  if (bandH > 0.02) fascia(c, { x: 0, z: zF + 0.09, dx: 0, dz: 1 }, h + 0.24, bandH, hw);
  c.eaveTop = h;
}

// ── Bounds ──────────────────────────────────────────────────────────────────────────────────

function boundsOf(...surfaces: Surface[]): ShopBuild['bounds'] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const s of surfaces) {
    for (let i = 0; i < s.positions.length; i += 3) {
      const x = s.positions[i];
      const y = s.positions[i + 1];
      const z = s.positions[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

/** A stable per-shop seed from its entity id, so a park reloads with the same variation. */
export function seedForShop(id: string): number {
  return hashString(id);
}
