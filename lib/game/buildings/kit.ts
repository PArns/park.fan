/**
 * The kit: the pieces a facade is bashed together from.
 *
 * Every piece takes a {@link Frame} — a wall to hang on, in `(u along, v up, out)` — so the same
 * window lands on the front of a box, on the canted facet of an octagonal tower and on a wing
 * rotated thirty degrees with no second code path and no matrix stack. That is the whole reason
 * `geometry.ts` works in frames rather than in local boxes.
 *
 * **The list is short and every item earns its triangles.** What separates architecture from a
 * textured box is, in order of how much it buys: the **reveal** (an opening cut into the wall with
 * jambs, a head and a sill, so the sun puts a hard shadow down one side of every window), the
 * **projecting bands** (plinth, string course, cornice — a horizontal line with a lit top face and a
 * dark soffit, which is what a European facade reads by at 200 m), the **sash** (a real frame with
 * glazing bars, because a sheet of glass in a hole is a shop unit and not a window), and the
 * **eaves** (an overhang with a soffit and a fascia, which is what gives a roof a shadow line
 * instead of a paper edge). Everything else here is dressing and could be dropped.
 *
 * **Openings sizes are the real ones**, and they are what makes a hall read as 12 m and not as a
 * doll's house: a door head at 2.05–2.15 m, a window sill at 0.9, a shopfront stall riser at 0.4, a
 * storey at 3.6–4.5. `selftest.mjs` measures them off the built geometry rather than trusting this
 * paragraph.
 *
 * Babylon-free: pure `Surface` arrays.
 */

import {
  addBand,
  addFrameQuad,
  addPanelWithHole,
  addQuad,
  addReveal,
  addStroke,
  addTube,
  framePoint,
  mixRgb,
  shade,
  tri,
  tileUv,
  vertex,
  type Frame,
  type P3,
  type Rgb,
  type Surface,
} from './geometry';
import { rand2 } from './noise';
import type { BayCode, LightSite } from './types';

/** What a wall is dressed in. Resolved once per mass; every piece reads it. */
export interface Skin {
  wallTile: number;
  wallColour: Rgb;
  plinthTile: number;
  plinthColour: Rgb;
  trimTile: number;
  trimColour: Rgb;
  joineryTile: number;
  joineryColour: Rgb;
  metalTile: number;
  metalColour: Rgb;
  glassColour: Rgb;
  litColour: Rgb;
  /** How deep an opening sits into the wall. */
  reveal: number;
  /** How far a sill projects past the wall face. */
  sill: number;
  mullions: number;
  transoms: number;
}

export interface KitCtx {
  kit: Surface;
  glass: Surface;
  lit: Surface;
  seed: number;
  /** 0..1 — how many windows have a light on after dark. */
  litFraction: number;
  windows: number;
  litWindows: number;
  doors: number;
  lights: LightSite[];
  /** Where a visitor walks in, in building space. Set by the first door drawn on the front. */
  entrance: [number, number] | null;
}

export interface BayOptions {
  /** Storey index, 0 at the ground. */
  storey: number;
  /** Clear height of this storey, metres. */
  storeyHeight: number;
  /** A stable per-bay hash, so the same bay is the same bay every run. */
  key: number;
  /** This bay is on the entrance elevation. */
  front: boolean;
  /** Building-space position of the bay centre, for a light site. */
  world: P3;
  /** Outward normal in building space, for a light site. */
  normal: P3;
  /** Lanterns beside a door. */
  lanterns: boolean;
}

// ── frame-space round pieces ────────────────────────────────────────────────────────────────

/** A disc lying on a frame, facing out (or in). */
function addFrameDisc(
  s: Surface,
  f: Frame,
  cu: number,
  cv: number,
  r: number,
  out: number,
  sides: number,
  colour: Rgb,
  tile: number,
  facingOut: boolean
): void {
  const n = Math.max(6, Math.round(sides));
  const sign = facingOut ? 1 : -1;
  const nrm: P3 = [f.normal[0] * sign, f.normal[1] * sign, f.normal[2] * sign];
  const [cuu, cvv] = tileUv(tile, 0.5, 0.5);
  const c = framePoint(f, cu, cv, out);
  const centre = vertex(s, c[0], c[1], c[2], nrm[0], nrm[1], nrm[2], cuu, cvv, colour);
  const ring: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const p = framePoint(f, cu + Math.cos(a) * r, cv + Math.sin(a) * r, out);
    const [u, v] = tileUv(tile, 0.5 + Math.cos(a) * 0.45, 0.5 + Math.sin(a) * 0.45);
    ring.push(vertex(s, p[0], p[1], p[2], nrm[0], nrm[1], nrm[2], u, v, colour));
  }
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    if (facingOut) tri(s, centre, a, b);
    else tri(s, centre, b, a);
  }
}

/** The inside of a round hole in a wall: a cylinder along the frame's normal. */
function addFrameCylinder(
  s: Surface,
  f: Frame,
  cu: number,
  cv: number,
  r: number,
  out0: number,
  out1: number,
  sides: number,
  colour: Rgb,
  tile: number
): void {
  const n = Math.max(6, Math.round(sides));
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const p = (a: number, o: number): P3 =>
      framePoint(f, cu + Math.cos(a) * r, cv + Math.sin(a) * r, o);
    addQuad(s, p(a1, out0), p(a0, out0), p(a0, out1), p(a1, out1), {
      colour,
      tile,
      repeatU: 1,
      repeatV: 1,
    });
  }
}

// ── openings ────────────────────────────────────────────────────────────────────────────────

/**
 * A sash: the frame round a pane, as four bars with real thickness.
 *
 * Flat quads were the first version and they are exactly the "textured box" look this module exists
 * to avoid — a bar with no depth takes no highlight on its edge and disappears the moment the sun is
 * anywhere but straight on. Five faces each, twenty quads a window, and a window that reads at 40 m.
 */
function addSash(
  s: Surface,
  f: Frame,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  out: number,
  bar: number,
  colour: Rgb,
  tile: number
): void {
  const d = out - 0.045;
  addBand(s, f, u0, u1, v0, v0 + bar, d, out, colour, tile);
  addBand(s, f, u0, u1, v1 - bar, v1, d, out, colour, tile);
  addBand(s, f, u0, u0 + bar, v0 + bar, v1 - bar, d, out, colour, tile);
  addBand(s, f, u1 - bar, u1, v0 + bar, v1 - bar, d, out, colour, tile);
}

/** Glazing bars: flat, in front of the pane. They divide light; they are not joinery you can grab. */
function addGlazingBars(
  s: Surface,
  f: Frame,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  out: number,
  across: number,
  up: number,
  colour: Rgb,
  tile: number
): void {
  const w = 0.035;
  for (let i = 1; i < across; i++) {
    const u = u0 + ((u1 - u0) * i) / across;
    addFrameQuad(s, f, u - w, v0, u + w, v1, out, { colour, tile, repeatU: 1, repeatV: 1 });
  }
  for (let j = 1; j < up; j++) {
    const v = v0 + ((v1 - v0) * j) / up;
    addFrameQuad(s, f, u0, v - w, u1, v + w, out, { colour, tile, repeatU: 1, repeatV: 1 });
  }
}

/** The pane itself, into the glass surface or the lit one. */
function addPane(
  ctx: KitCtx,
  f: Frame,
  skin: Skin,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  out: number,
  key: number
): boolean {
  const litRoll = rand2(key & 0xffff, key >>> 16, ctx.seed + 5171);
  const isLit = litRoll < ctx.litFraction;
  ctx.windows += 1;
  if (isLit) ctx.litWindows += 1;
  const target = isLit ? ctx.lit : ctx.glass;
  const colour = isLit
    ? mixRgb(skin.litColour, shade(skin.litColour, 0.72), rand2(key, 7, ctx.seed) * 0.6)
    : skin.glassColour;
  addFrameQuad(target, f, u0, v0, u1, v1, out, {
    colour,
    tile: skin.joineryTile,
    repeatU: 1,
    repeatV: 1,
  });
  return isLit;
}

/** A window: hole, reveal, sill, pane, sash, bars, and a lintel over it. */
function window_(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions, tall: boolean): void {
  const bw = f.width;
  const sh = o.storeyHeight;
  const openW = Math.min(tall ? 2.2 : 1.6, bw * (tall ? 0.62 : 0.54));
  const sill = tall ? 0.34 : 0.92;
  const head = Math.min(sh - 0.46, sill + (tall ? sh - 1.0 : 1.78));
  if (head - sill < 0.5) {
    solid(ctx, f, skin);
    return;
  }
  const u0 = (bw - openW) / 2;
  const u1 = u0 + openW;
  const hole = { u0, u1, v0: sill, v1: head };
  addPanelWithHole(ctx.kit, f, hole, 0, { colour: skin.wallColour, tile: skin.wallTile });
  addReveal(ctx.kit, f, hole, 0, skin.reveal, shade(skin.wallColour, 0.88), skin.wallTile);
  const back = -skin.reveal + 0.06;
  addPane(ctx, f, skin, u0 + 0.05, u1 - 0.05, sill + 0.05, head - 0.05, back, o.key);
  addSash(ctx.kit, f, u0, u1, sill, head, back + 0.05, 0.075, skin.joineryColour, skin.joineryTile);
  addGlazingBars(
    ctx.kit,
    f,
    u0 + 0.075,
    u1 - 0.075,
    sill + 0.075,
    head - 0.075,
    back + 0.06,
    skin.mullions,
    skin.transoms,
    skin.joineryColour,
    skin.joineryTile
  );
  // Sill: it projects and it oversails the opening either side, which is what throws the rain clear
  // of the wall and what draws the line under every window on the elevation.
  addBand(
    ctx.kit,
    f,
    u0 - 0.1,
    u1 + 0.1,
    sill - 0.14,
    sill,
    -skin.reveal,
    skin.sill,
    skin.trimColour,
    skin.trimTile
  );
  // Lintel over the head.
  addBand(
    ctx.kit,
    f,
    u0 - 0.08,
    u1 + 0.08,
    head,
    head + 0.16,
    -skin.reveal,
    skin.sill * 0.6,
    skin.trimColour,
    skin.trimTile
  );
}

/** A round-headed window: the same opening with an arch on top of it. */
function archWindow(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions): void {
  const bw = f.width;
  const sh = o.storeyHeight;
  const openW = Math.min(1.9, bw * 0.58);
  const r = openW / 2;
  const sill = 0.85;
  const springing = Math.min(sh - 0.5 - r, sill + 1.55);
  if (springing - sill < 0.4) {
    window_(ctx, f, skin, o, false);
    return;
  }
  const u0 = (bw - openW) / 2;
  const u1 = u0 + openW;
  const top = springing + r;
  const hole = { u0, u1, v0: sill, v1: top };
  addPanelWithHole(ctx.kit, f, hole, 0, { colour: skin.wallColour, tile: skin.wallTile });
  // The straight jambs and the sill; the head is the arch's own soffit.
  const back = -skin.reveal;
  const q = (a: P3, b: P3, c: P3, d: P3, colour: Rgb, tile: number): void =>
    addQuad(ctx.kit, a, b, c, d, { colour, tile, repeatU: 1, repeatV: 1 });
  q(
    framePoint(f, u0, sill, back),
    framePoint(f, u0, sill, 0),
    framePoint(f, u0, springing, 0),
    framePoint(f, u0, springing, back),
    shade(skin.wallColour, 0.88),
    skin.wallTile
  );
  q(
    framePoint(f, u1, sill, 0),
    framePoint(f, u1, sill, back),
    framePoint(f, u1, springing, back),
    framePoint(f, u1, springing, 0),
    shade(skin.wallColour, 0.88),
    skin.wallTile
  );
  q(
    framePoint(f, u0, sill, back),
    framePoint(f, u1, sill, back),
    framePoint(f, u1, sill, 0),
    framePoint(f, u0, sill, 0),
    shade(skin.wallColour, 0.94),
    skin.wallTile
  );
  archHead(ctx, f, u0, u1, springing, skin);
  // Glass: the rectangle plus a fan for the head.
  addPane(ctx, f, skin, u0 + 0.06, u1 - 0.06, sill + 0.06, springing, back + 0.06, o.key);
  addFan(ctx, f, skin, (u0 + u1) / 2, springing, r - 0.06, back + 0.06, o.key);
  addSash(
    ctx.kit,
    f,
    u0,
    u1,
    sill,
    springing,
    back + 0.11,
    0.07,
    skin.joineryColour,
    skin.joineryTile
  );
  addBand(
    ctx.kit,
    f,
    u0 - 0.1,
    u1 + 0.1,
    sill - 0.14,
    sill,
    back,
    skin.sill,
    skin.trimColour,
    skin.trimTile
  );
}

/** The arch itself: voussoirs on the face, and the soffit behind them. */
function archHead(ctx: KitCtx, f: Frame, u0: number, u1: number, springing: number, skin: Skin) {
  const r = (u1 - u0) / 2;
  const cu = (u0 + u1) / 2;
  const back = -skin.reveal;
  const segments = 10;
  const top = springing + r;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI;
    const a1 = ((i + 1) / segments) * Math.PI;
    const p0: [number, number] = [cu - Math.cos(a0) * r, springing + Math.sin(a0) * r];
    const p1: [number, number] = [cu - Math.cos(a1) * r, springing + Math.sin(a1) * r];
    // The spandrel between the arch and the square head of the opening's box.
    addQuad(
      ctx.kit,
      framePoint(f, p0[0], p0[1], 0),
      framePoint(f, p1[0], p1[1], 0),
      framePoint(f, p1[0], top, 0),
      framePoint(f, p0[0], top, 0),
      { colour: skin.wallColour, tile: skin.wallTile, repeatU: 1, repeatV: 1 }
    );
    // The soffit, facing into the opening.
    addQuad(
      ctx.kit,
      framePoint(f, p1[0], p1[1], back),
      framePoint(f, p0[0], p0[1], back),
      framePoint(f, p0[0], p0[1], 0),
      framePoint(f, p1[0], p1[1], 0),
      { colour: shade(skin.wallColour, 0.86), tile: skin.wallTile, repeatU: 1, repeatV: 1 }
    );
    // A ring of voussoirs standing proud of the wall: the arch you actually see from the street.
    const mid = (a0 + a1) / 2;
    const o0: [number, number] = [cu - Math.cos(a0) * r, springing + Math.sin(a0) * r];
    const o1: [number, number] = [cu - Math.cos(a1) * r, springing + Math.sin(a1) * r];
    const e0: [number, number] = [
      cu - Math.cos(a0) * (r + 0.24),
      springing + Math.sin(a0) * (r + 0.24),
    ];
    const e1: [number, number] = [
      cu - Math.cos(a1) * (r + 0.24),
      springing + Math.sin(a1) * (r + 0.24),
    ];
    const tone = shade(skin.trimColour, 0.94 + (i % 2) * 0.12);
    addQuad(
      ctx.kit,
      framePoint(f, o0[0], o0[1], 0.05),
      framePoint(f, o1[0], o1[1], 0.05),
      framePoint(f, e1[0], e1[1], 0.05),
      framePoint(f, e0[0], e0[1], 0.05),
      { colour: tone, tile: skin.trimTile, repeatU: 1, repeatV: 1 }
    );
    // Its own edge, so the ring has thickness.
    addQuad(
      ctx.kit,
      framePoint(f, e0[0], e0[1], 0),
      framePoint(f, e1[0], e1[1], 0),
      framePoint(f, e1[0], e1[1], 0.05),
      framePoint(f, e0[0], e0[1], 0.05),
      { colour: shade(tone, 0.8), tile: skin.trimTile, repeatU: 1, repeatV: 1 }
    );
    void mid;
  }
}

/** A semicircular fanlight of glass. */
function addFan(
  ctx: KitCtx,
  f: Frame,
  skin: Skin,
  cu: number,
  cv: number,
  r: number,
  out: number,
  key: number
): void {
  const litRoll = rand2(key & 0xffff, (key >>> 16) + 3, ctx.seed + 5171);
  const isLit = litRoll < ctx.litFraction;
  const target = isLit ? ctx.lit : ctx.glass;
  const colour = isLit ? skin.litColour : skin.glassColour;
  const n = 8;
  const [cuu, cvv] = tileUv(skin.joineryTile, 0.5, 0.5);
  const c = framePoint(f, cu, cv, out);
  const centre = vertex(
    target,
    c[0],
    c[1],
    c[2],
    f.normal[0],
    f.normal[1],
    f.normal[2],
    cuu,
    cvv,
    colour
  );
  const ring: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI;
    const p = framePoint(f, cu - Math.cos(a) * r, cv + Math.sin(a) * r, out);
    const [u, v] = tileUv(skin.joineryTile, i / n, 0.5);
    ring.push(
      vertex(target, p[0], p[1], p[2], f.normal[0], f.normal[1], f.normal[2], u, v, colour)
    );
  }
  for (let i = 0; i < n; i++) tri(target, centre, ring[i], ring[i + 1]);
}

/** A door: leaf, panels, threshold, and — where the blueprint asks — a lantern either side of it. */
function door(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions, grand: boolean): void {
  const bw = f.width;
  const sh = o.storeyHeight;
  const openW = Math.min(grand ? 2.8 : 1.35, bw * (grand ? 0.66 : 0.44));
  // 2.05 m to the head of a single door, 3.0 to a grand pair. These are the numbers a person walks
  // through, and getting them wrong is what makes a building read as a model of a building.
  const openH = Math.min(sh - 0.7, grand ? 3.0 : 2.15);
  const u0 = (bw - openW) / 2;
  const u1 = u0 + openW;
  const hole = { u0, u1, v0: 0, v1: openH };
  addPanelWithHole(ctx.kit, f, hole, 0, { colour: skin.wallColour, tile: skin.wallTile });
  addReveal(ctx.kit, f, hole, 0, skin.reveal + 0.08, shade(skin.wallColour, 0.84), skin.wallTile);
  const back = -skin.reveal - 0.08;
  // The leaf (or two), with the sunk panels every joinery door has.
  const leaves = grand ? 2 : 1;
  for (let i = 0; i < leaves; i++) {
    const lu0 = u0 + 0.04 + ((openW - 0.08) / leaves) * i;
    const lu1 = lu0 + (openW - 0.08) / leaves - (leaves > 1 ? 0.04 : 0);
    addFrameQuad(ctx.kit, f, lu0, 0, lu1, openH - 0.04, back + 0.02, {
      colour: skin.joineryColour,
      tile: skin.joineryTile,
    });
    const inset = 0.14;
    for (let p = 0; p < 2; p++) {
      const pv0 = 0.2 + p * (openH * 0.45);
      const pv1 = pv0 + openH * 0.34;
      addFrameQuad(ctx.kit, f, lu0 + inset, pv0, lu1 - inset, pv1, back + 0.055, {
        colour: shade(skin.joineryColour, 0.82),
        tile: skin.joineryTile,
      });
    }
    // The handle, at 1.05 m, because that is where a handle is.
    addBand(
      ctx.kit,
      f,
      lu1 - 0.22,
      lu1 - 0.14,
      1.0,
      1.1,
      back + 0.05,
      back + 0.11,
      skin.metalColour,
      skin.metalTile
    );
  }
  // A fanlight over the door if the storey leaves room for one.
  const fanTop = Math.min(sh - 0.5, openH + 0.9);
  if (fanTop - openH > 0.4) {
    const fanHole = { u0, u1, v0: openH + 0.06, v1: fanTop };
    addPanelWithHole(ctx.kit, f, fanHole, 0, { colour: skin.wallColour, tile: skin.wallTile });
    addReveal(ctx.kit, f, fanHole, 0, skin.reveal, shade(skin.wallColour, 0.88), skin.wallTile);
    addPane(ctx, f, skin, u0 + 0.05, u1 - 0.05, openH + 0.11, fanTop - 0.05, -skin.reveal + 0.06, o.key + 977);
    addGlazingBars(
      ctx.kit,
      f,
      u0 + 0.05,
      u1 - 0.05,
      openH + 0.11,
      fanTop - 0.05,
      -skin.reveal + 0.1,
      3,
      1,
      skin.joineryColour,
      skin.joineryTile
    );
  }
  // The surround: a moulded architrave and a hood over it.
  addBand(
    ctx.kit,
    f,
    u0 - 0.18,
    u1 + 0.18,
    fanTop + 0.02,
    fanTop + 0.24,
    -0.02,
    skin.sill + 0.06,
    skin.trimColour,
    skin.trimTile
  );
  addBand(
    ctx.kit,
    f,
    u0 - 0.18,
    u0 - 0.02,
    0,
    fanTop + 0.02,
    -0.02,
    0.07,
    skin.trimColour,
    skin.trimTile
  );
  addBand(
    ctx.kit,
    f,
    u1 + 0.02,
    u1 + 0.18,
    0,
    fanTop + 0.02,
    -0.02,
    0.07,
    skin.trimColour,
    skin.trimTile
  );
  ctx.doors += 1;
  if (o.front && !ctx.entrance) {
    const c = framePoint(f, (u0 + u1) / 2, 0, 2.4);
    ctx.entrance = [c[0], c[2]];
  }
  if (o.lanterns) {
    for (const side of [-1, 1]) {
      const lu = (u0 + u1) / 2 + side * (openW / 2 + 0.42);
      if (lu < 0.25 || lu > bw - 0.25) continue;
      lantern(ctx, f, skin, lu, 2.25);
      const p = framePoint(f, lu, 2.35, 0.24);
      ctx.lights.push({
        x: p[0],
        y: p[1],
        z: p[2],
        color: '#ffd9a0',
        intensity: 34,
        range: 11,
      });
    }
  }
}

/** A wall lantern on a bracket: the small warm thing beside a door that makes a night frame work. */
function lantern(ctx: KitCtx, f: Frame, skin: Skin, u: number, v: number): void {
  addBand(ctx.kit, f, u - 0.04, u + 0.04, v - 0.02, v + 0.36, 0, 0.26, skin.metalColour, skin.metalTile);
  const glassC = mixRgb(skin.litColour, [1, 1, 1], 0.25);
  addBand(ctx.lit, f, u - 0.13, u + 0.13, v - 0.34, v, 0.1, 0.36, glassC, skin.joineryTile);
  addBand(
    ctx.kit,
    f,
    u - 0.17,
    u + 0.17,
    v,
    v + 0.09,
    0.06,
    0.4,
    skin.metalColour,
    skin.metalTile
  );
}

/** A glazed shopfront: stall riser, mullions, transom, and a deep head. */
function shopfront(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions): void {
  const bw = f.width;
  const sh = o.storeyHeight;
  const margin = Math.min(0.3, bw * 0.1);
  const u0 = margin;
  const u1 = bw - margin;
  const v0 = 0.42;
  const v1 = Math.min(sh - 0.65, 3.1);
  const hole = { u0, u1, v0, v1 };
  addPanelWithHole(ctx.kit, f, hole, 0, { colour: skin.wallColour, tile: skin.wallTile });
  addReveal(ctx.kit, f, hole, 0, skin.reveal + 0.05, shade(skin.wallColour, 0.86), skin.wallTile);
  const back = -skin.reveal - 0.05;
  const transom = v0 + (v1 - v0) * 0.74;
  addPane(ctx, f, skin, u0 + 0.06, u1 - 0.06, v0 + 0.06, transom - 0.03, back + 0.05, o.key);
  addPane(ctx, f, skin, u0 + 0.06, u1 - 0.06, transom + 0.03, v1 - 0.06, back + 0.05, o.key + 31);
  const bars = Math.max(2, Math.round((u1 - u0) / 1.15));
  addSash(ctx.kit, f, u0, u1, v0, v1, back + 0.1, 0.09, skin.joineryColour, skin.joineryTile);
  addGlazingBars(
    ctx.kit,
    f,
    u0 + 0.09,
    u1 - 0.09,
    v0 + 0.09,
    v1 - 0.09,
    back + 0.11,
    bars,
    1,
    skin.joineryColour,
    skin.joineryTile
  );
  addBand(
    ctx.kit,
    f,
    u0 + 0.09,
    u1 - 0.09,
    transom - 0.045,
    transom + 0.045,
    back + 0.05,
    back + 0.12,
    skin.joineryColour,
    skin.joineryTile
  );
  // The stall riser under the glass — a real one is panelled timber and it is what keeps a barrow
  // from putting a wheel through the window.
  addBand(ctx.kit, f, u0 - 0.06, u1 + 0.06, 0, v0, -0.02, 0.08, skin.joineryColour, skin.joineryTile);
}

/** A louvred vent: plant room, tower belfry, the top of a clock stage. */
function louvre(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions): void {
  const bw = f.width;
  const sh = o.storeyHeight;
  const openW = Math.min(1.5, bw * 0.5);
  const u0 = (bw - openW) / 2;
  const u1 = u0 + openW;
  const v0 = Math.max(0.6, sh * 0.22);
  const v1 = Math.min(sh - 0.5, v0 + 2.2);
  const hole = { u0, u1, v0, v1 };
  addPanelWithHole(ctx.kit, f, hole, 0, { colour: skin.wallColour, tile: skin.wallTile });
  addReveal(ctx.kit, f, hole, 0, skin.reveal + 0.1, shade(skin.wallColour, 0.7), skin.wallTile);
  // A dark void behind the slats, so the vent is a hole and not a panel.
  addFrameQuad(ctx.kit, f, u0, v0, u1, v1, -skin.reveal - 0.12, {
    colour: shade(skin.wallColour, 0.18),
    tile: skin.wallTile,
  });
  const slats = Math.max(4, Math.round((v1 - v0) / 0.24));
  for (let i = 0; i < slats; i++) {
    const y = v0 + 0.06 + ((v1 - v0 - 0.1) * i) / slats;
    const rise = 0.12;
    addQuad(
      ctx.kit,
      framePoint(f, u0, y, -skin.reveal - 0.02),
      framePoint(f, u1, y, -skin.reveal - 0.02),
      framePoint(f, u1, y + rise, -0.03),
      framePoint(f, u0, y + rise, -0.03),
      { colour: skin.joineryColour, tile: skin.joineryTile, repeatU: 2, repeatV: 1 }
    );
  }
}

/** A blind niche: an opening with a back to it. Rhythm on a wall that must not have windows. */
function niche(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions): void {
  const bw = f.width;
  const sh = o.storeyHeight;
  const openW = Math.min(1.5, bw * 0.5);
  const u0 = (bw - openW) / 2;
  const u1 = u0 + openW;
  const v0 = 0.95;
  const v1 = Math.min(sh - 0.55, v0 + 1.9);
  const hole = { u0, u1, v0, v1 };
  addPanelWithHole(ctx.kit, f, hole, 0, { colour: skin.wallColour, tile: skin.wallTile });
  addReveal(ctx.kit, f, hole, 0, 0.14, shade(skin.wallColour, 0.9), skin.wallTile);
  addFrameQuad(ctx.kit, f, u0, v0, u1, v1, -0.14, {
    colour: shade(skin.wallColour, 0.78),
    tile: skin.wallTile,
  });
  addBand(
    ctx.kit,
    f,
    u0 - 0.1,
    u1 + 0.1,
    v0 - 0.12,
    v0,
    -0.14,
    skin.sill * 0.8,
    skin.trimColour,
    skin.trimTile
  );
}

/** An oculus: a round window, recessed, with a stone ring round it. */
function oculus(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions): void {
  const bw = f.width;
  const sh = o.storeyHeight;
  const r = Math.min(0.7, bw * 0.24, sh * 0.22);
  const cu = bw / 2;
  const cv = sh * 0.55;
  solid(ctx, f, skin);
  addFrameCylinder(ctx.kit, f, cu, cv, r, 0.02, -0.22, 14, shade(skin.wallColour, 0.82), skin.wallTile);
  addFrameDisc(ctx.lit, f, cu, cv, r - 0.05, -0.2, 14, skin.litColour, skin.joineryTile, true);
  ctx.windows += 1;
  ctx.litWindows += 1;
  // The ring: a band of stone standing proud, in eight facets.
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const p = (a: number, rr: number, out: number): P3 =>
      framePoint(f, cu + Math.cos(a) * rr, cv + Math.sin(a) * rr, out);
    addQuad(ctx.kit, p(a0, r, 0.07), p(a1, r, 0.07), p(a1, r + 0.18, 0.07), p(a0, r + 0.18, 0.07), {
      colour: skin.trimColour,
      tile: skin.trimTile,
      repeatU: 1,
      repeatV: 1,
    });
    addQuad(ctx.kit, p(a0, r + 0.18, 0), p(a1, r + 0.18, 0), p(a1, r + 0.18, 0.07), p(a0, r + 0.18, 0.07), {
      colour: shade(skin.trimColour, 0.8),
      tile: skin.trimTile,
      repeatU: 1,
      repeatV: 1,
    });
  }
}

/** A pilaster: a flat column against the wall, with a base and a cap. */
function pilaster(ctx: KitCtx, f: Frame, skin: Skin, o: BayOptions): void {
  solid(ctx, f, skin);
  const bw = f.width;
  const sh = o.storeyHeight;
  const w = Math.min(0.5, bw * 0.3);
  const u0 = (bw - w) / 2;
  const u1 = u0 + w;
  addBand(ctx.kit, f, u0, u1, 0, sh, 0, 0.11, shade(skin.wallColour, 1.04), skin.wallTile);
  addBand(ctx.kit, f, u0 - 0.07, u1 + 0.07, 0, 0.26, 0, 0.16, skin.trimColour, skin.trimTile);
  addBand(
    ctx.kit,
    f,
    u0 - 0.09,
    u1 + 0.09,
    sh - 0.28,
    sh,
    0,
    0.18,
    skin.trimColour,
    skin.trimTile
  );
}

/** Wall, and nothing on it. */
function solid(ctx: KitCtx, f: Frame, skin: Skin): void {
  addFrameQuad(ctx.kit, f, 0, 0, f.width, f.height, 0, {
    colour: skin.wallColour,
    tile: skin.wallTile,
  });
}

/** The one place a bay code turns into geometry. */
export function drawBay(
  ctx: KitCtx,
  f: Frame,
  code: BayCode,
  skin: Skin,
  o: BayOptions
): void {
  switch (code) {
    case 'w':
      window_(ctx, f, skin, o, false);
      return;
    case 't':
      window_(ctx, f, skin, o, true);
      return;
    case 'a':
      archWindow(ctx, f, skin, o);
      return;
    case 'o':
      oculus(ctx, f, skin, o);
      return;
    case 'd':
      door(ctx, f, skin, o, false);
      return;
    case 'D':
      door(ctx, f, skin, o, true);
      return;
    case 'g':
      shopfront(ctx, f, skin, o);
      return;
    case 'v':
      louvre(ctx, f, skin, o);
      return;
    case 'n':
      niche(ctx, f, skin, o);
      return;
    case 'p':
      pilaster(ctx, f, skin, o);
      return;
    default:
      solid(ctx, f, skin);
  }
}

// ── bands, corners and dressing ─────────────────────────────────────────────────────────────

/** A projecting horizontal band across a whole facade — plinth cap, string course, cornice. */
export function courseBand(
  ctx: KitCtx,
  f: Frame,
  v0: number,
  v1: number,
  out: number,
  colour: Rgb,
  tile: number
): void {
  addBand(ctx.kit, f, -0.001, f.width + 0.001, v0, v1, -0.02, out, colour, tile);
}

/**
 * Rusticated quoins up the corner of a facade: alternate blocks standing proud.
 *
 * Drawn on one facade of each corner only. Doing both would put two blocks in the same place at the
 * corner itself and z-fight; a real quoin alternates which wall it is long on, and at 0.11 m of
 * relief nobody has ever noticed the difference from the street.
 */
export function quoins(
  ctx: KitCtx,
  f: Frame,
  height: number,
  colour: Rgb,
  tile: number,
  atStart: boolean
): void {
  const w = 0.55;
  const h = 0.42;
  const u0 = atStart ? 0 : f.width - w;
  const u1 = u0 + w;
  const n = Math.floor(height / h);
  for (let i = 0; i < n; i++) {
    if (i % 2 === 1) continue;
    const v0 = i * h + 0.02;
    const v1 = Math.min(height, v0 + h - 0.04);
    if (v1 - v0 < 0.1) continue;
    addBand(ctx.kit, f, u0, u1, v0, v1, 0, 0.09, shade(colour, 1.02), tile);
  }
}

/** A downpipe with its shoe, at one end of a facade. */
export function downpipe(ctx: KitCtx, f: Frame, u: number, top: number, skin: Skin): void {
  const a = framePoint(f, u, 0.12, 0.09);
  const b = framePoint(f, u, top, 0.09);
  addTube(ctx.kit, a, b, 0.055, skin.metalColour, skin.metalTile, 6);
  const shoe = framePoint(f, u, 0.12, 0.22);
  addTube(ctx.kit, a, shoe, 0.06, skin.metalColour, skin.metalTile, 6);
}

/**
 * A clock face.
 *
 * Ten past ten, which is where the hands of every clock in every photograph of a clock are: it is
 * symmetrical, it frames the maker's name and it is unambiguously not a wall-mounted disc. The
 * alternative is reading a real clock, and `Date.now()` is banned in this codebase for reasons that
 * have nothing to do with clocks on buildings and everything to do with a save that replays.
 */
export function clockFace(
  ctx: KitCtx,
  f: Frame,
  cu: number,
  cv: number,
  diameter: number,
  skin: Skin
): void {
  const r = diameter / 2;
  addFrameCylinder(ctx.kit, f, cu, cv, r, 0.02, 0.2, 20, skin.trimColour, skin.trimTile);
  addFrameDisc(ctx.kit, f, cu, cv, r, 0.2, 20, shade(skin.trimColour, 1.12), skin.trimTile, true);
  addFrameDisc(ctx.lit, f, cu, cv, r * 0.86, 0.21, 20, [0.86, 0.83, 0.72], skin.joineryTile, true);
  const dark = shade(skin.joineryColour, 0.4);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = r * (i % 3 === 0 ? 0.62 : 0.72);
    const r1 = r * 0.82;
    addStroke(
      ctx.kit,
      f,
      [cu + Math.cos(a) * r0, cv + Math.sin(a) * r0, cu + Math.cos(a) * r1, cv + Math.sin(a) * r1],
      0.225,
      i % 3 === 0 ? 0.055 : 0.03,
      dark,
      skin.joineryTile
    );
  }
  // 10:10.
  const hour = Math.PI / 2 + (Math.PI * 2 * 10.17) / 12;
  const minute = Math.PI / 2 - (Math.PI * 2 * 10) / 60;
  addStroke(
    ctx.kit,
    f,
    [cu, cv, cu + Math.cos(hour) * r * 0.5, cv + Math.sin(hour) * r * 0.5],
    0.23,
    0.05,
    dark,
    skin.joineryTile
  );
  addStroke(
    ctx.kit,
    f,
    [cu, cv, cu + Math.cos(minute) * r * 0.74, cv + Math.sin(minute) * r * 0.74],
    0.235,
    0.038,
    dark,
    skin.joineryTile
  );
}

/** A lit sign band over an entrance: a dark surround with a bright face set into it. */
export function signBand(
  ctx: KitCtx,
  f: Frame,
  u0: number,
  u1: number,
  v0: number,
  height: number,
  colour: Rgb,
  skin: Skin
): void {
  addBand(
    ctx.kit,
    f,
    u0,
    u1,
    v0,
    v0 + height,
    -0.02,
    0.3,
    shade(skin.trimColour, 0.42),
    skin.trimTile
  );
  addFrameQuad(ctx.lit, f, u0 + 0.12, v0 + 0.1, u1 - 0.12, v0 + height - 0.1, 0.31, {
    colour,
    tile: skin.joineryTile,
    repeatU: 1,
    repeatV: 1,
  });
  const p = framePoint(f, (u0 + u1) / 2, v0 + height / 2, 1.0);
  ctx.lights.push({ x: p[0], y: p[1], z: p[2], color: '#ffd9a0', intensity: 26, range: 9 });
}
