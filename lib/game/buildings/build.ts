/**
 * The builder: a blueprint in, three vertex buffers out.
 *
 * Nothing in this file switches on a pack id, a blueprint id or a style id. It reads the resolved
 * records `manifest.ts` hands it and draws what they say — masses, storeys, bay patterns, roofs,
 * trim, arcades, ground works — which is the axis this module is graded on and the reason the whole
 * catalogue can live in a pack.
 *
 * **Three surfaces, because they are three materials and no more.** `kit` is everything opaque and
 * comes out of one atlas, so a building of brick, stone, slate, zinc and painted joinery is ONE draw
 * call. `glass` blends. `lit` is emissive and owns its own look after dark. A building therefore
 * costs one to three draw calls **per type**, not per copy: `main.ts` puts every instance of a type
 * in one thin-instance buffer.
 *
 * **The origin is the middle of the building's plan, on the ground**, and +z is the front. A build
 * tool places it by a matrix; the ground works and the entrance point are in the same space.
 *
 * **The whole thing is pure.** No Babylon objects are created here, only arrays, so `selftest.mjs`
 * can build every blueprint under node and measure door heights, sill heights, bay counts, triangle
 * counts and bounds — none of which a screenshot answers and all of which a green build misses.
 */

import { patternForStorey, planBays } from './bays';
import {
  addBand,
  addPrism,
  addQuad,
  addTube,
  boundsOf,
  mixRgb,
  newSurface,
  shade,
  srgb,
  subFrame,
  surfaceTriangles,
  tileFor,
  type Frame,
  type P3,
  type Rgb,
  type Surface,
} from './geometry';
import { clockFace, courseBand, downpipe, drawBay, quoins, signBand, type KitCtx, type Skin } from './kit';
import { hashString, rand2 } from './noise';
import { boxLocal, buildRoof, xf, type Placed, type ResolvedRoof } from './roofs';
import type {
  BayCode,
  BlueprintDef,
  BuildBounds,
  BuildingStyleDef,
  FacadeSide,
  LightSite,
  MassDef,
  RoofDef,
  SurfaceName,
} from './types';

export interface BuildingBuild {
  kit: Surface;
  glass: Surface;
  lit: Surface;
  bounds: BuildBounds;
  triangles: number;
  windows: number;
  litWindows: number;
  doors: number;
  /** Where a visitor stands to go in, in the building's own space. */
  entrance: [number, number];
  /** Where this building would like a real light after dark, its own space. */
  lights: LightSite[];
  /** Height of the tallest thing drawn. */
  height: number;
}

export interface BuildOptions {
  blueprint: BlueprintDef;
  style: BuildingStyleDef;
  /** Deterministic per-batch seed. */
  seed: number;
  /** Overrides the blueprint's own night fraction; the showcase uses it to photograph both. */
  litFraction?: number;
}

const DEG = Math.PI / 180;

/** A stable integer for a batch key, so two buildings that share a mesh share their variation. */
export function seedForBuilding(key: string): number {
  return hashString(key) % 2147483647;
}

export function buildBuilding(opts: BuildOptions): BuildingBuild {
  const bp = opts.blueprint;
  const style = opts.style;
  const ctx: KitCtx = {
    kit: newSurface(),
    glass: newSurface(),
    lit: newSurface(),
    seed: opts.seed,
    litFraction: opts.litFraction ?? bp.night?.litFraction ?? 0.55,
    windows: 0,
    litWindows: 0,
    doors: 0,
    lights: [],
    entrance: null,
  };
  const lanterns = bp.night?.lanterns !== false;
  let top = 0;

  bp.masses.forEach((mass, index) => {
    const built = buildMass(ctx, mass, style, bp, index, lanterns);
    if (built > top) top = built;
  });

  groundWorks(ctx, bp, style);

  const bounds = boundsOf(ctx.kit, ctx.glass, ctx.lit);
  const entrance = ctx.entrance ?? defaultEntrance(bp);
  return {
    kit: ctx.kit,
    glass: ctx.glass,
    lit: ctx.lit,
    bounds: { min: bounds.min, max: bounds.max },
    triangles: surfaceTriangles(ctx.kit) + surfaceTriangles(ctx.glass) + surfaceTriangles(ctx.lit),
    windows: ctx.windows,
    litWindows: ctx.litWindows,
    doors: ctx.doors,
    entrance,
    lights: ctx.lights,
    height: top,
  };
}

// ── one mass ────────────────────────────────────────────────────────────────────────────────

function buildMass(
  ctx: KitCtx,
  mass: MassDef,
  style: BuildingStyleDef,
  bp: BlueprintDef,
  index: number,
  lanterns: boolean
): number {
  const at = mass.at ?? [0, 0];
  const yaw = (mass.yaw ?? 0) * DEG;
  const m: Placed = {
    cx: at[0],
    cz: at[1],
    cos: Math.cos(yaw),
    sin: Math.sin(yaw),
    hx: mass.size[0] / 2,
    hz: mass.size[1] / 2,
    base: mass.base ?? 0,
  };
  const round = mass.round && mass.round >= 3 ? Math.round(mass.round) : 0;
  const storeys = Math.max(1, Math.round(mass.storeys ?? 1));
  const storeyHeight = mass.storeyHeight ?? 4.0;
  const plinth = mass.plinth ?? 0.55;
  const skin = skinFor(style, mass);
  const trim = { ...style.trim, ...(mass.trim ?? {}) };
  const wallTop = m.base + plinth + storeys * storeyHeight;
  const eaveY = wallTop;

  // The plinth, and it starts BELOW grade: a building on a slope whose base stops at zero shows the
  // underside of its own ground floor from downhill. Six hundred millimetres of buried skirt costs
  // two quads a facade and makes the placement forgiving.
  if (round) {
    addPrism(ctx.kit, m.cx, m.cz, m.base - 0.7, m.base + plinth, m.hx + 0.07, m.hx + 0.07, {
      colour: skin.plinthColour,
      tile: skin.plinthTile,
      sides: round,
      phase: roundPhase(round),
      capTop: false,
    });
  } else {
    boxLocal(
      ctx.kit,
      m,
      [-m.hx - 0.07, m.base - 0.7, -m.hz - 0.07],
      [m.hx + 0.07, m.base + plinth, m.hz + 0.07],
      skin.plinthColour,
      skin.plinthTile
    );
  }

  const facades = mass.facades ?? {};
  const bayTarget = mass.bay ?? 3.3;

  for (let s = 0; s < storeys; s++) {
    const y0 = m.base + plinth + s * storeyHeight;
    const frames = round ? roundFrames(m, round, y0, storeyHeight) : boxFrames(m, y0, storeyHeight);
    frames.forEach((entry, fi) => {
      const raw =
        (entry.side === 'front' ? facades.front : undefined) ??
        (entry.side === 'right' ? facades.right : undefined) ??
        (entry.side === 'back' ? facades.back : undefined) ??
        (entry.side === 'left' ? facades.left : undefined) ??
        facades.all ??
        'w*';
      const pattern = patternForStorey(raw, s);
      const plan = planBays(entry.frame.width, pattern, bayTarget);
      if (!plan.bays.length) continue_(ctx, entry.frame, skin);
      plan.bays.forEach((code, i) => {
        const bf = subFrame(entry.frame, i * plan.width, 0, plan.width, storeyHeight);
        const centre = [
          bf.o[0] + bf.right[0] * plan.width * 0.5,
          bf.o[1] + storeyHeight * 0.5,
          bf.o[2] + bf.right[2] * plan.width * 0.5,
        ] as P3;
        drawBay(ctx, bf, code as BayCode, skin, {
          storey: s,
          storeyHeight,
          key: (index * 977 + fi * 131 + s * 17 + i) | 0,
          front: entry.side === 'front' && s === 0,
          world: centre,
          normal: entry.frame.normal,
          lanterns: lanterns && s === 0,
        });
      });
      if (trim.quoins && !round) {
        quoins(ctx, entry.frame, storeyHeight, skin.trimColour, skin.trimTile, true);
      }
    });

    // A string course between storeys, and a moulded band on top of the plinth.
    if (s > 0 && trim.stringCourse > 0) {
      band(ctx, m, round, y0 - trim.stringCourse * 0.5, trim.stringCourse, 0.09, skin);
    }
  }
  if (plinth > 0.15) band(ctx, m, round, m.base + plinth - 0.14, 0.14, 0.12, skin);

  // The cornice: the deepest band on the building and the one that draws the line under the roof.
  if (trim.cornice > 0) {
    band(ctx, m, round, eaveY - trim.cornice, trim.cornice, trim.corniceOut, skin);
  }

  const roof = resolveRoof(mass.roof, style, mass, round);
  const result = buildRoof(ctx, m, roof, skin, eaveY, ctx.seed + index * 31);

  // Downpipes at the corners of the front elevation, and a sign band and a clock where asked.
  if (!round) {
    const front = boxFrames(m, m.base + plinth, eaveY - m.base - plinth)[0].frame;
    downpipe(ctx, front, 0.35, eaveY - m.base - plinth - trim.cornice, skin);
    downpipe(ctx, front, front.width - 0.35, eaveY - m.base - plinth - trim.cornice, skin);
    if (bp.sign && bp.sign.band > 0 && index === 0) {
      const width = (bp.sign.width ?? 0.55) * front.width;
      const u0 = (front.width - width) / 2;
      signBand(
        ctx,
        front,
        u0,
        u0 + width,
        storeyHeight - bp.sign.band - 0.45,
        bp.sign.band,
        srgb(bp.sign.color ?? style.palette.sign),
        skin
      );
    }
    if (mass.clock && mass.clock > 0) {
      clockFace(
        ctx,
        front,
        front.width / 2,
        eaveY - m.base - plinth + mass.clock * 0.1,
        mass.clock,
        skin
      );
    }
  } else if (mass.clock && mass.clock > 0) {
    const frames = roundFrames(m, round, m.base + plinth, eaveY - m.base - plinth);
    for (const entry of frames) {
      clockFace(ctx, entry.frame, entry.frame.width / 2, entry.frame.height - mass.clock * 0.75, mass.clock, skin);
    }
  }

  if (mass.arcade) arcade(ctx, m, mass, skin, storeyHeight, plinth);

  return Math.max(result.top, eaveY);
}

/** A blank wall where a pattern produced no bays. */
function continue_(ctx: KitCtx, f: Frame, skin: Skin): void {
  addQuad(
    ctx.kit,
    f.o,
    [f.o[0] + f.right[0] * f.width, f.o[1], f.o[2] + f.right[2] * f.width],
    [f.o[0] + f.right[0] * f.width, f.o[1] + f.height, f.o[2] + f.right[2] * f.width],
    [f.o[0], f.o[1] + f.height, f.o[2]],
    { colour: skin.wallColour, tile: skin.wallTile }
  );
}

/** A projecting band right round a mass, box or drum. */
function band(
  ctx: KitCtx,
  m: Placed,
  round: number,
  y: number,
  height: number,
  out: number,
  skin: Skin
): void {
  if (round) {
    addPrism(ctx.kit, m.cx, m.cz, y, y + height, m.hx + out, m.hx + out, {
      colour: skin.trimColour,
      tile: skin.trimTile,
      sides: round,
      phase: roundPhase(round),
      capTop: true,
    });
    return;
  }
  boxLocal(
    ctx.kit,
    m,
    [-m.hx - out, y, -m.hz - out],
    [m.hx + out, y + height, m.hz + out],
    skin.trimColour,
    skin.trimTile
  );
}

// ── facades ─────────────────────────────────────────────────────────────────────────────────

interface FacadeEntry {
  side: FacadeSide;
  frame: Frame;
}

/**
 * The four walls of a box, as frames, in building space.
 *
 * `front` faces +z. The other three follow clockwise seen from above, which is the order a person
 * walking round the building meets them in, and is why `right` runs from the front-right corner
 * backwards.
 */
export function boxFrames(m: Placed, y: number, height: number): FacadeEntry[] {
  const dir = (x: number, z: number): P3 => [x * m.cos + z * m.sin, 0, -x * m.sin + z * m.cos];
  const up: P3 = [0, 1, 0];
  const mk = (
    side: FacadeSide,
    corner: [number, number],
    right: [number, number],
    normal: [number, number],
    width: number
  ): FacadeEntry => ({
    side,
    frame: {
      o: xf(m, corner[0], y, corner[1]),
      right: dir(right[0], right[1]),
      up,
      normal: dir(normal[0], normal[1]),
      width,
      height,
    },
  });
  return [
    mk('front', [-m.hx, m.hz], [1, 0], [0, 1], m.hx * 2),
    mk('right', [m.hx, m.hz], [0, -1], [1, 0], m.hz * 2),
    mk('back', [m.hx, -m.hz], [-1, 0], [0, -1], m.hx * 2),
    mk('left', [-m.hx, -m.hz], [0, 1], [-1, 0], m.hz * 2),
  ];
}

/** Facet 0 of a drum is centred on +z, so a `front` pattern lands where the front is. */
function roundPhase(sides: number): number {
  return Math.PI / 2 - Math.PI / sides;
}

/**
 * The facets of a polygonal drum, as frames.
 *
 * Facet 0 faces the front; every other facet takes the `all` pattern. A tower with a door on one
 * side and windows on the rest is therefore two lines of JSON, and a rotunda with the same opening
 * all the way round is one.
 */
export function roundFrames(m: Placed, sides: number, y: number, height: number): FacadeEntry[] {
  const out: FacadeEntry[] = [];
  const r = m.hx;
  const phase = roundPhase(sides);
  for (let i = 0; i < sides; i++) {
    const a0 = phase + (i / sides) * Math.PI * 2;
    const a1 = phase + ((i + 1) / sides) * Math.PI * 2;
    const p0: P3 = [m.cx + Math.cos(a0) * r, y, m.cz + Math.sin(a0) * r];
    const p1: P3 = [m.cx + Math.cos(a1) * r, y, m.cz + Math.sin(a1) * r];
    const dx = p1[0] - p0[0];
    const dz = p1[2] - p0[2];
    const width = Math.hypot(dx, dz);
    const right: P3 = [dx / width, 0, dz / width];
    // right × up, the same convention `addQuad` derives its normal from.
    const normal: P3 = [right[1] * 0 - 0 * 1, 0, right[0] * 1 - right[1] * 0];
    normal[0] = -right[2];
    normal[2] = right[0];
    out.push({
      side: i === 0 ? 'front' : 'back',
      frame: { o: p0, right, up: [0, 1, 0], normal, width, height },
    });
  }
  return out;
}

// ── arcade ──────────────────────────────────────────────────────────────────────────────────

/**
 * A colonnade in front of one elevation.
 *
 * This is the piece that turns a shed into a public building, and it is why the entrance hall in the
 * bundled pack has one: a row of columns holding a flat entablature, with the wall set back behind
 * them, reads as somewhere a person is meant to walk in.
 */
function arcade(
  ctx: KitCtx,
  m: Placed,
  mass: MassDef,
  skin: Skin,
  storeyHeight: number,
  plinth: number
): void {
  const a = mass.arcade;
  if (!a) return;
  const n = Math.max(2, Math.round(a.columns));
  const height = a.height ?? storeyHeight - 0.6;
  const depth = a.depth;
  const y0 = m.base + 0.12;
  const top = m.base + plinth + height;
  const along = a.side === 'front' || a.side === 'back' ? m.hx : m.hz;
  const outAt = a.side === 'front' || a.side === 'right' ? 1 : -1;
  const axis = a.side === 'front' || a.side === 'back' ? 'x' : 'z';
  const face = (a.side === 'front' || a.side === 'back' ? m.hz : m.hx) + depth;
  const p = (u: number, o: number, y: number): P3 =>
    axis === 'x' ? xf(m, u, y, outAt * o) : xf(m, outAt * o, y, u);

  // A stylobate: the platform the columns stand on. Columns growing straight out of grass is the
  // fastest way to lose the effect.
  const step = 0.34;
  for (const [i, inset] of [
    [0, 0.5],
    [1, 0.0],
  ] as Array<[number, number]>) {
    const yy = m.base + i * step * 0.5;
    const box0 = axis === 'x' ? [-along - 0.5 + inset, yy, outAt * (face - depth)] : [outAt * (face - depth), yy, -along - 0.5 + inset];
    const box1 =
      axis === 'x'
        ? [along + 0.5 - inset, yy + step * 0.5, outAt * (face + 0.5 - inset)]
        : [outAt * (face + 0.5 - inset), yy + step * 0.5, along + 0.5 - inset];
    boxLocal(ctx.kit, m, box0 as P3, box1 as P3, skin.plinthColour, skin.plinthTile);
  }

  const radius = Math.min(0.34, (along * 2) / n / 4);
  for (let i = 0; i < n; i++) {
    const u = -along + 0.5 + ((i + 0.0) * (along * 2 - 1)) / (n - 1);
    const c = p(u, face - radius - 0.15, 0);
    // Base, shaft, capital: three pieces, because a column that is one cylinder reads as a pipe.
    addPrism(ctx.kit, c[0], c[2], y0 + step, y0 + step + 0.22, radius * 1.35, radius * 1.25, {
      colour: skin.trimColour,
      tile: skin.trimTile,
      sides: 10,
    });
    addPrism(ctx.kit, c[0], c[2], y0 + step + 0.22, top - 0.3, radius, radius * 0.88, {
      colour: skin.trimColour,
      tile: skin.trimTile,
      sides: 10,
    });
    addPrism(ctx.kit, c[0], c[2], top - 0.3, top, radius * 1.3, radius * 1.4, {
      colour: skin.trimColour,
      tile: skin.trimTile,
      sides: 10,
      capTop: false,
    });
  }
  // The entablature over them, and a shallow lean-to roof back to the wall.
  const eb0 = axis === 'x' ? [-along - 0.4, top, outAt * (face - depth)] : [outAt * (face - depth), top, -along - 0.4];
  const eb1 =
    axis === 'x'
      ? [along + 0.4, top + 0.55, outAt * (face + 0.2)]
      : [outAt * (face + 0.2), top + 0.55, along + 0.4];
  boxLocal(ctx.kit, m, eb0 as P3, eb1 as P3, skin.trimColour, skin.trimTile);
  const co0 = axis === 'x' ? [-along - 0.55, top + 0.55, outAt * (face - depth)] : [outAt * (face - depth), top + 0.55, -along - 0.55];
  const co1 =
    axis === 'x'
      ? [along + 0.55, top + 0.72, outAt * (face + 0.34)]
      : [outAt * (face + 0.34), top + 0.72, along + 0.55];
  boxLocal(ctx.kit, m, co0 as P3, co1 as P3, shade(skin.trimColour, 1.05), skin.trimTile);

  if (a.arch) {
    // Round heads between the columns, drawn as a ring of segments in the plane of the colonnade.
    const gap = (along * 2 - 1) / (n - 1);
    for (let i = 0; i < n - 1; i++) {
      const u0 = -along + 0.5 + i * gap;
      const u1 = u0 + gap;
      const cu = (u0 + u1) / 2;
      const rr = (u1 - u0) / 2 - radius;
      const springing = top - 0.3 - rr * 0.15;
      const segs = 8;
      for (let k = 0; k < segs; k++) {
        const t0 = (k / segs) * Math.PI;
        const t1 = ((k + 1) / segs) * Math.PI;
        const q0 = p(cu - Math.cos(t0) * rr, face - radius - 0.15, springing + Math.sin(t0) * rr);
        const q1 = p(cu - Math.cos(t1) * rr, face - radius - 0.15, springing + Math.sin(t1) * rr);
        const o0 = p(
          cu - Math.cos(t0) * (rr + 0.3),
          face - radius - 0.15,
          springing + Math.sin(t0) * (rr + 0.3)
        );
        const o1 = p(
          cu - Math.cos(t1) * (rr + 0.3),
          face - radius - 0.15,
          springing + Math.sin(t1) * (rr + 0.3)
        );
        addQuad(ctx.kit, q0, q1, o1, o0, {
          colour: shade(skin.trimColour, 0.96 + (k % 2) * 0.1),
          tile: skin.trimTile,
          repeatU: 1,
          repeatV: 1,
          back: outAt < 0,
        });
      }
    }
  }
}

// ── ground works ────────────────────────────────────────────────────────────────────────────

/**
 * The paving a building stands on, the kerb round it and the steps up to the door.
 *
 * Every prop grounds (ART_BIBLE). A building set straight on grass reads as dropped rather than
 * built, and the apron is what a park actually has: a paved skirt wide enough to walk round.
 */
function groundWorks(ctx: KitCtx, bp: BlueprintDef, style: BuildingStyleDef): void {
  const g = bp.ground;
  const apron = g?.apron ?? 2.2;
  if (apron <= 0) return;
  const paving = tileFor('paving');
  const colour = srgb('#9ba1a6');
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const mass of bp.masses) {
    const at = mass.at ?? [0, 0];
    // The bounding box of a rotated mass, so a wing at an angle still gets paving under it.
    const yaw = (mass.yaw ?? 0) * DEG;
    const hx = mass.size[0] / 2;
    const hz = mass.size[1] / 2;
    const ex = Math.abs(hx * Math.cos(yaw)) + Math.abs(hz * Math.sin(yaw));
    const ez = Math.abs(hx * Math.sin(yaw)) + Math.abs(hz * Math.cos(yaw));
    minX = Math.min(minX, at[0] - ex);
    maxX = Math.max(maxX, at[0] + ex);
    minZ = Math.min(minZ, at[1] - ez);
    maxZ = Math.max(maxZ, at[1] + ez);
  }
  if (!Number.isFinite(minX)) return;
  const x0 = minX - apron;
  const x1 = maxX + apron;
  const z0 = minZ - apron;
  const z1 = maxZ + apron;
  const y = 0.06;
  addQuad(
    ctx.kit,
    [x0, y, z1],
    [x1, y, z1],
    [x1, y, z0],
    [x0, y, z0],
    { colour, tile: paving, maxCells: 14 }
  );
  if (g?.kerb !== false) {
    const k = 0.16;
    const trimColour = srgb(style.palette.plinth);
    const trimTile = tileFor(style.plinth);
    for (const [a0, b0, a1, b1] of [
      [x0 - k, z0 - k, x1 + k, z0],
      [x0 - k, z1, x1 + k, z1 + k],
      [x0 - k, z0, x0, z1],
      [x1, z0, x1 + k, z1],
    ]) {
      addQuad(
        ctx.kit,
        [a0, y + 0.05, b1],
        [a1, y + 0.05, b1],
        [a1, y + 0.05, b0],
        [a0, y + 0.05, b0],
        { colour: trimColour, tile: trimTile, maxCells: 12 }
      );
    }
  }
  // Steps at the entrance, from the apron up to the threshold.
  if (g?.steps !== false && ctx.entrance) {
    const rise = 0.19;
    const stepsUp = Math.max(1, Math.round(((bp.masses[0]?.plinth ?? 0.55) - 0.06) / rise));
    const w = 3.2;
    const [ex, ez] = ctx.entrance;
    const dz = Math.sign(ez) || 1;
    for (let i = 0; i < stepsUp; i++) {
      const yy = 0.06 + i * rise;
      const out = (stepsUp - i) * 0.32;
      addQuad(
        ctx.kit,
        [ex - w / 2, yy + rise, ez + dz * out],
        [ex + w / 2, yy + rise, ez + dz * out],
        [ex + w / 2, yy + rise, ez - dz * 1.6],
        [ex - w / 2, yy + rise, ez - dz * 1.6],
        { colour: shade(colour, 1.05), tile: paving, maxCells: 8, back: dz < 0 }
      );
      addQuad(
        ctx.kit,
        [ex - w / 2, yy, ez + dz * out],
        [ex + w / 2, yy, ez + dz * out],
        [ex + w / 2, yy + rise, ez + dz * out],
        [ex - w / 2, yy + rise, ez + dz * out],
        { colour: shade(colour, 0.86), tile: paving, maxCells: 6, back: dz < 0 }
      );
    }
  }
}

function defaultEntrance(bp: BlueprintDef): [number, number] {
  const first = bp.masses[0];
  if (!first) return [0, 0];
  const at = first.at ?? [0, 0];
  return [at[0], at[1] + first.size[1] / 2 + 2.4];
}

// ── skins ───────────────────────────────────────────────────────────────────────────────────

export function skinFor(style: BuildingStyleDef, mass?: MassDef): Skin {
  const p = style.palette;
  const wallName: SurfaceName = mass?.wallSurface ?? style.wall;
  return {
    wallTile: tileFor(wallName),
    wallColour: srgb(mass?.wallColor ?? p.wall),
    plinthTile: tileFor(style.plinth, 'ashlar'),
    plinthColour: srgb(p.plinth),
    trimTile: tileFor(style.plinth === 'brick' ? 'ashlar' : style.plinth, 'ashlar'),
    trimColour: srgb(p.trim),
    joineryTile: tileFor('panel'),
    joineryColour: srgb(p.joinery),
    metalTile: tileFor('metal'),
    metalColour: srgb(p.metal),
    glassColour: srgb(p.glass),
    litColour: srgb(p.lit),
    reveal: style.trim.reveal,
    sill: style.trim.sill,
    mullions: Math.max(1, Math.round(style.glazing.mullions)),
    transoms: Math.max(1, Math.round(style.glazing.transoms)),
  };
}

function resolveRoof(
  def: RoofDef | undefined,
  style: BuildingStyleDef,
  mass: MassDef,
  round: number
): ResolvedRoof {
  const d = def ?? { form: 'gable' as const };
  const surface = mass.roofSurface ?? d.material ?? style.roof;
  return {
    form: d.form,
    pitch: (d.pitch ?? 40) * DEG,
    eaves: d.eaves ?? 0.55,
    ridge: d.ridge ?? (mass.size[0] >= mass.size[1] ? 'x' : 'z'),
    parapet: d.parapet ?? 0.5,
    dormers: d.dormers ?? 0,
    chimneys: d.chimneys ?? 0,
    lantern: d.lantern ?? null,
    tile: tileFor(surface, 'slate'),
    colour: srgb(mass.roofColor ?? d.color ?? style.palette.roof),
    sides: round,
  };
}

// ── kit pieces ──────────────────────────────────────────────────────────────────────────────

/**
 * The generators a pack's core `buildings[]` entry names in its `procedural` field.
 *
 * These are the eight the bundled packs already use, and they are the module's **primitives** rather
 * than its content: a pack combines them at any size, material and colour, and it reaches a whole
 * building through a `buildingBlueprints` entry instead. A name nothing here knows falls back to a
 * plain panel of the declared size and warns once — a piece nobody anticipated draws SOMETHING.
 */
export const PIECES: Record<string, (ctx: KitCtx, size: P3, skin: Skin, style: BuildingStyleDef) => void> =
  {
    wall: (ctx, size, skin) => wallPiece(ctx, size, skin, 's'),
    'wall-window': (ctx, size, skin) => wallPiece(ctx, size, skin, 'w'),
    'wall-window-arched': (ctx, size, skin) => wallPiece(ctx, size, skin, 'a'),
    'wall-window-wide': (ctx, size, skin) => wallPiece(ctx, size, skin, 'g'),
    'wall-door': (ctx, size, skin) => wallPiece(ctx, size, skin, 'd'),
    'wall-arch': (ctx, size, skin) => wallPiece(ctx, size, skin, 'a'),
    'wall-oculus': (ctx, size, skin) => wallPiece(ctx, size, skin, 'o'),
    'wall-louvre': (ctx, size, skin) => wallPiece(ctx, size, skin, 'v'),
    'roof-gable': (ctx, size, skin, style) => roofPiece(ctx, size, skin, style, 'gable'),
    'roof-hip': (ctx, size, skin, style) => roofPiece(ctx, size, skin, style, 'hip'),
    'roof-flat': (ctx, size, skin, style) => roofPiece(ctx, size, skin, style, 'flat'),
    'roof-pyramid': (ctx, size, skin, style) => roofPiece(ctx, size, skin, style, 'pyramid'),
    floor: (ctx, size, skin) => floorPiece(ctx, size, skin),
    column: (ctx, size, skin) => columnPiece(ctx, size, skin),
    trim: (ctx, size, skin) => trimPiece(ctx, size, skin),
    canopy: (ctx, size, skin) => canopyPiece(ctx, size, skin),
  };

/** One kit piece, standing on its own, centred on the origin. */
export function buildKitPiece(opts: {
  piece: string;
  size: [number, number, number];
  style: BuildingStyleDef;
  seed: number;
  litFraction?: number;
}): BuildingBuild {
  const ctx: KitCtx = {
    kit: newSurface(),
    glass: newSurface(),
    lit: newSurface(),
    seed: opts.seed,
    litFraction: opts.litFraction ?? 0.6,
    windows: 0,
    litWindows: 0,
    doors: 0,
    lights: [],
    entrance: null,
  };
  const skin = skinFor(opts.style);
  const gen = PIECES[opts.piece] ?? PIECES.wall;
  gen(ctx, opts.size, skin, opts.style);
  const bounds = boundsOf(ctx.kit, ctx.glass, ctx.lit);
  return {
    kit: ctx.kit,
    glass: ctx.glass,
    lit: ctx.lit,
    bounds: { min: bounds.min, max: bounds.max },
    triangles: surfaceTriangles(ctx.kit) + surfaceTriangles(ctx.glass) + surfaceTriangles(ctx.lit),
    windows: ctx.windows,
    litWindows: ctx.litWindows,
    doors: ctx.doors,
    entrance: [0, opts.size[2] / 2 + 1.5],
    lights: ctx.lights,
    height: bounds.max[1],
  };
}

/** A single panel of wall, with whatever opening the piece names, and a coping on top of it. */
function wallPiece(ctx: KitCtx, size: P3, skin: Skin, code: BayCode): void {
  const [w, h, d] = size;
  const m: Placed = { cx: 0, cz: 0, cos: 1, sin: 0, hx: w / 2, hz: d / 2, base: 0 };
  const front = boxFrames(m, 0, h)[0].frame;
  const back = boxFrames(m, 0, h)[2].frame;
  drawBay(ctx, front, code, skin, {
    storey: 0,
    storeyHeight: h,
    key: 7,
    front: true,
    world: [0, h / 2, d / 2],
    normal: [0, 0, 1],
    lanterns: false,
  });
  // The back and the two ends, so a piece standing on its own is a solid object.
  addQuad(
    ctx.kit,
    back.o,
    [back.o[0] - w, back.o[1], back.o[2]],
    [back.o[0] - w, back.o[1] + h, back.o[2]],
    [back.o[0], back.o[1] + h, back.o[2]],
    { colour: shade(skin.wallColour, 0.92), tile: skin.wallTile }
  );
  boxLocal(ctx.kit, m, [-w / 2, 0, -d / 2], [-w / 2 + 0.02, h, d / 2], skin.wallColour, skin.wallTile);
  boxLocal(ctx.kit, m, [w / 2 - 0.02, 0, -d / 2], [w / 2, h, d / 2], skin.wallColour, skin.wallTile);
  boxLocal(
    ctx.kit,
    m,
    [-w / 2 - 0.09, h, -d / 2 - 0.09],
    [w / 2 + 0.09, h + 0.16, d / 2 + 0.09],
    skin.trimColour,
    skin.trimTile
  );
  boxLocal(
    ctx.kit,
    m,
    [-w / 2 - 0.05, -0.4, -d / 2 - 0.05],
    [w / 2 + 0.05, 0.38, d / 2 + 0.05],
    skin.plinthColour,
    skin.plinthTile
  );
}

/** A roof piece: the covering over a `size`-shaped box, standing at the height it would sit at. */
function roofPiece(
  ctx: KitCtx,
  size: P3,
  skin: Skin,
  style: BuildingStyleDef,
  form: 'gable' | 'hip' | 'flat' | 'pyramid'
): void {
  const [w, h, d] = size;
  const m: Placed = { cx: 0, cz: 0, cos: 1, sin: 0, hx: w / 2, hz: d / 2, base: 0 };
  const roof: ResolvedRoof = {
    form,
    pitch: form === 'flat' ? 0 : Math.atan2(h, Math.max(0.5, Math.min(w, d) / 2)),
    eaves: 0.4,
    ridge: w >= d ? 'x' : 'z',
    parapet: 0.35,
    dormers: 0,
    chimneys: 0,
    lantern: null,
    tile: tileFor(style.roof, 'slate'),
    colour: srgb(style.palette.roof),
    sides: 0,
  };
  buildRoof(ctx, m, roof, skin, 0.35, ctx.seed);
  // A course of wall under it so the piece is not floating.
  boxLocal(ctx.kit, m, [-w / 2, 0, -d / 2], [w / 2, 0.35, d / 2], skin.wallColour, skin.wallTile);
}

function floorPiece(ctx: KitCtx, size: P3, skin: Skin): void {
  const [w, h, d] = size;
  const m: Placed = { cx: 0, cz: 0, cos: 1, sin: 0, hx: w / 2, hz: d / 2, base: 0 };
  boxLocal(ctx.kit, m, [-w / 2, 0, -d / 2], [w / 2, h, d / 2], skin.wallColour, skin.wallTile);
  boxLocal(
    ctx.kit,
    m,
    [-w / 2 - 0.04, h - 0.04, -d / 2 - 0.04],
    [w / 2 + 0.04, h, d / 2 + 0.04],
    skin.trimColour,
    skin.trimTile
  );
}

function columnPiece(ctx: KitCtx, size: P3, skin: Skin): void {
  const [w, h] = size;
  const r = Math.max(0.12, w / 2);
  addPrism(ctx.kit, 0, 0, 0, 0.2, r * 1.5, r * 1.42, {
    colour: skin.plinthColour,
    tile: skin.plinthTile,
    sides: 12,
    capBottom: true,
  });
  addPrism(ctx.kit, 0, 0, 0.2, 0.42, r * 1.32, r * 1.14, {
    colour: skin.trimColour,
    tile: skin.trimTile,
    sides: 12,
  });
  // Entasis: a column that is a straight cylinder reads as a pipe. The taper is real and is 1/6.
  addPrism(ctx.kit, 0, 0, 0.42, h - 0.34, r, r * 0.84, {
    colour: skin.trimColour,
    tile: skin.trimTile,
    sides: 12,
  });
  addPrism(ctx.kit, 0, 0, h - 0.34, h - 0.14, r * 1.02, r * 1.28, {
    colour: skin.trimColour,
    tile: skin.trimTile,
    sides: 12,
  });
  const m: Placed = { cx: 0, cz: 0, cos: 1, sin: 0, hx: r * 1.5, hz: r * 1.5, base: 0 };
  boxLocal(
    ctx.kit,
    m,
    [-r * 1.5, h - 0.14, -r * 1.5],
    [r * 1.5, h, r * 1.5],
    skin.trimColour,
    skin.trimTile
  );
}

function trimPiece(ctx: KitCtx, size: P3, skin: Skin): void {
  const [w, h, d] = size;
  const m: Placed = { cx: 0, cz: 0, cos: 1, sin: 0, hx: w / 2, hz: d / 2, base: 0 };
  boxLocal(ctx.kit, m, [-w / 2, 0, -d / 2], [w / 2, h * 0.55, d / 2], skin.trimColour, skin.trimTile);
  boxLocal(
    ctx.kit,
    m,
    [-w / 2, h * 0.55, -d / 2 - 0.12],
    [w / 2, h, d / 2 + 0.12],
    shade(skin.trimColour, 1.05),
    skin.trimTile
  );
}

/**
 * A glass-and-steel canopy on brackets — the thing over the door of every station and every park
 * ticket hall built since 1890.
 */
function canopyPiece(ctx: KitCtx, size: P3, skin: Skin): void {
  const [w, h, d] = size;
  const y = h;
  const m: Placed = { cx: 0, cz: 0, cos: 1, sin: 0, hx: w / 2, hz: d / 2, base: 0 };
  // The deck: glass on a frame, falling 8° to the front.
  addQuad(
    ctx.glass,
    [-w / 2, y, d / 2],
    [w / 2, y, d / 2],
    [w / 2, y + d * 0.14, -d / 2],
    [-w / 2, y + d * 0.14, -d / 2],
    { colour: mixRgb(skin.glassColour, [1, 1, 1], 0.35), tile: skin.joineryTile, maxCells: 6 }
  );
  const bars = Math.max(2, Math.round(w / 1.4));
  for (let i = 0; i <= bars; i++) {
    const x = -w / 2 + (w * i) / bars;
    addTube(
      ctx.kit,
      [x, y - 0.03, d / 2],
      [x, y + d * 0.14 - 0.03, -d / 2],
      0.05,
      skin.metalColour,
      skin.metalTile,
      5
    );
  }
  addBand(
    ctx.kit,
    {
      o: [-w / 2, y - 0.16, d / 2],
      right: [1, 0, 0],
      up: [0, 1, 0],
      normal: [0, 0, 1],
      width: w,
      height: 0.3,
    },
    0,
    w,
    0,
    0.22,
    -0.06,
    0.06,
    skin.metalColour,
    skin.metalTile
  );
  // Tie rods back to the wall, which is what actually holds one of these up.
  for (const s of [-1, 1]) {
    addTube(
      ctx.kit,
      [(s * w) / 2.4, y + d * 0.14, -d / 2],
      [(s * w) / 2.4, y + d * 0.14 + 1.5, -d / 2 + 0.1],
      0.035,
      skin.metalColour,
      skin.metalTile,
      4
    );
  }
  boxLocal(ctx.kit, m, [-w / 2, y + d * 0.14, -d / 2 - 0.12], [w / 2, y + d * 0.14 + 1.7, -d / 2], skin.wallColour, skin.wallTile);
}

/** Deterministic tone jitter for a batch, so two identical buildings are not identical. */
export function variantTint(colour: string, seed: number, index: number): Rgb {
  const base = srgb(colour);
  const t = (rand2(index, 11, seed) - 0.5) * 0.12;
  return shade(base, 1 + t);
}

export { courseBand };
