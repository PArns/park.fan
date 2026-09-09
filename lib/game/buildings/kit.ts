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
  addFrameQuadUv,
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
  TILE_GLOW,
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
  /** Emissive, in the style's `lit` colour: window panes, lanterns, a lantern's glazing. */
  lit: Surface;
  /** Emissive, in the sign's own colour. Separate because a PBR emissive is one uniform colour and
   * a teal sign over warm windows is two. */
  sign: Surface;
  /**
   * The light a lit window throws on the wall around it — ADDITIVE, so it is invisible by day.
   *
   * The round-1 critic measured a lit pane at luma 209.7 and the brick 0.4 m beside it at 22.1,
   * against 29.8 for brick nowhere near a window: the spill was not small, it was negative. Six real
   * lights is the whole game's budget and this module already takes the smallest share of it, so the
   * wall cannot have a light — but it can have the mark one would leave. Two triangles a window,
   * drawn on the wall face, blended additively so black adds nothing at noon.
   */
  halo: Surface;
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

/**
 * The pane itself: into the glass surface, or into the lit one with its own patch of the glow tile.
 *
 * The sub-rectangle is what makes a night elevation work. One emissive material draws every lit
 * window in the park — Babylon multiplies the emissive by a texture and a uniform colour and never
 * by the vertex stream — so without a per-pane uv window all forty of them are the same value, which
 * is what a decal looks like. Half a tile per pane at a random offset gives each one its own
 * brightness and its own soft gradient, and it costs nothing.
 */
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
  if (!isLit) {
    /**
     * An opaque backing behind the pane, and it is not a detail.
     *
     * A building here is a hollow box whose inner faces are back-face culled, so a 38 %-opaque pane
     * over an opening shows 62 % of *the landscape on the other side of the building*. That is what
     * made every window on the ticket hall's back elevation read as a hole punched through to the
     * sky. Two triangles of dark interior behind each pane, and the glass has something to be glass
     * against.
     */
    addFrameQuad(ctx.kit, f, u0, v0, u1, v1, out - 0.07, {
      // A room, not a hole. At 0.3 of the wall's own colour a brick facade in shade came back with
      // black rectangles punched in it (`.game-render/probe2/0900-facade.png`); a real interior is
      // dark and WARM, and the pane in front of it is doing most of the work anyway.
      colour: mixRgb(shade(skin.wallColour, 0.42), skin.litColour, 0.22),
      tile: skin.joineryTile,
      repeatU: 1,
      repeatV: 1,
    });
    addFrameQuad(ctx.glass, f, u0, v0, u1, v1, out, {
      colour: skin.glassColour,
      tile: skin.joineryTile,
      repeatU: 1,
      repeatV: 1,
    });
    return false;
  }
  const w = 0.45;
  const s0 = rand2(key, 13, ctx.seed + 71) * (1 - w);
  const t0 = rand2(key, 29, ctx.seed + 71) * (1 - w);
  addFrameQuadUv(ctx.lit, f, u0, v0, u1, v1, out, skin.litColour, TILE_GLOW, [
    s0,
    t0,
    s0 + w,
    t0 + w,
  ]);
  // The spill, on the wall face, sampling the SAME patch of the glow tile — so a bright room throws
  // a bright patch and a dim one does not, out of one additive material.
  addHalo(ctx.halo, f, u0, v0, u1, v1, skin.litColour, [s0, t0, s0 + w, t0 + w]);
  return true;
}

/**
 * The spill on the wall round a lit window: eight quads in a ring, fading to nothing at the edge.
 *
 * One flat quad was the first version and it is what an additive decal looks like when you can see
 * where it stops — a hard-edged rectangle four times the size of the window, which at 0.34 strength
 * turned the whole terrace into a row of light boxes with no brick left between them. Light does not
 * have a border. The ring carries the falloff in the vertex colour (1 on the opening's own edge, 0
 * at the margin) and skips the middle cell, because the middle is the window and the window is
 * already drawing itself.
 */
function addHalo(
  s: Surface,
  f: Frame,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  colour: Rgb,
  uv: [number, number, number, number]
): void {
  const m = 0.8;
  const out = 0.012;
  /**
   * Clamped to the wall it is drawn on.
   *
   * A top-storey window is less than 0.8 m from the wall head, so an unclamped margin floated the
   * spill over the eaves and out across the roof — a row of orange rectangles above the terrace's
   * ridge line in the 09:00 frame, which is both wrong and the first thing the eye finds.
   */
  const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
  const us = [clamp(u0 - m, 0, f.width), u0, u1, clamp(u1 + m, 0, f.width)];
  const vs = [clamp(v0 - m, 0, f.height), v0, v1, clamp(v1 + m, 0, f.height)];
  const [cu, cv] = tileUv(TILE_GLOW, (uv[0] + uv[2]) / 2, (uv[1] + uv[3]) / 2);
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      if (i === 1 && j === 1) continue;
      const idx: number[] = [];
      for (const [gi, gj] of [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ]) {
        // 0.62 on the inner ring rather than 1, and 0 on the outer one. At full weight the inner
        // edge is a hard bright line exactly on the window's surround, so every lit window wore a
        // glowing frame — brighter than the pane inside it, which is the wrong way round.
        const k = (gi === 0 || gi === 3 ? 0 : 0.62) * (gj === 0 || gj === 3 ? 0 : 0.62);
        const p = framePoint(f, us[gi], vs[gj], out);
        idx.push(
          vertex(s, p[0], p[1], p[2], f.normal[0], f.normal[1], f.normal[2], cu, cv, [
            colour[0] * k,
            colour[1] * k,
            colour[2] * k,
          ])
        );
      }
      tri(s, idx[0], idx[1], idx[3]);
      tri(s, idx[1], idx[2], idx[3]);
    }
  }
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
  // Impost blocks where the arch springs. Two small projecting stones a side, and they are what puts
  // a horizontal accent into an arcade that would otherwise be a row of holes.
  for (const [a, b] of [
    [u0 - 0.26, u0 + 0.06],
    [u1 - 0.06, u1 + 0.26],
  ]) {
    addBand(
      ctx.kit,
      f,
      a,
      b,
      springing - 0.14,
      springing + 0.08,
      -0.02,
      0.11,
      skin.trimColour,
      skin.trimTile
    );
  }
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
  addGlazingBars(
    ctx.kit,
    f,
    u0 + 0.07,
    u1 - 0.07,
    sill + 0.07,
    springing - 0.07,
    back + 0.12,
    skin.mullions,
    skin.transoms,
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
  /**
   * The fan gets an opaque backing of its own, and forgetting it was the most visible bug of the
   * first round: the market hall's arched windows showed the grass and the sky BEHIND THE BUILDING
   * through their heads (`.game-render/buildings-arcade/1200-arcade.png`), because the rectangular
   * part of the opening had a backing and the semicircle over it did not.
   */
  fanTriangles(
    ctx.kit,
    f,
    skin,
    cu,
    cv,
    r,
    out - 0.07,
    n,
    mixRgb(shade(skin.wallColour, 0.42), skin.litColour, 0.22)
  );
  fanTriangles(target, f, skin, cu, cv, r, out, n, colour);
}

/** The half-disc of a fanlight, as a triangle fan on a frame. */
function fanTriangles(
  target: Surface,
  f: Frame,
  skin: Skin,
  cu: number,
  cv: number,
  r: number,
  out: number,
  n: number,
  colour: Rgb
): void {
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
  // `ring[i + 1]` before `ring[i]`: the ring is walked from the left springing over the crown to the
  // right one, which is CLOCKWISE seen from the front, and `tri()`'s contract is counter-clockwise.
  // Both fans — the opaque interior backing and the glass in front of it — came out as back faces,
  // so eighty-three arch heads in the shipped packs were holes through the building and you could
  // see the meadow through the rotunda's fanlight at 44 m.
  for (let i = 0; i < n; i++) tri(target, centre, ring[i + 1], ring[i]);
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
    addPane(
      ctx,
      f,
      skin,
      u0 + 0.05,
      u1 - 0.05,
      openH + 0.11,
      fanTop - 0.05,
      -skin.reveal + 0.06,
      o.key + 977
    );
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
      /**
       * The light sits where the lantern's flame would be and 0.9 m off the wall, not 0.24.
       *
       * The round-1 critic measured the brick 1 m from this lamp at luma **246.8** — clipped, with
       * the mortar joints gone inside a three-metre pool and the lantern itself a dark blob in the
       * middle of its own glare. A point light 24 cm from a wall is a light source pressed against
       * it; 0.9 m out is a lantern.
       *
       * Moving it out was only half of it, and the half that measured worst: at 21 the same brick
       * clipped to **254.1** over 2,880 pixels of the 23:00 street, because Babylon's default
       * falloff is inverse-square and 0.9 m in front of a wall is 1/0.81 — the nearest brick gets
       * MORE than the number written here. 7 is what leaves the courses and the mortar joints
       * legible inside the pool. Measured, not guessed: clipped share 0.673 % → 0.000 %.
       */
      const p = framePoint(f, lu, 2.3, 0.9);
      ctx.lights.push({
        x: p[0],
        y: p[1],
        z: p[2],
        color: '#ffd9a0',
        intensity: 7,
        range: 10,
      });
    }
  }
}

/**
 * A wall lantern on a bracket.
 *
 * The first version was two axis-aligned cuboids — a mustard box under a dark box — and the round-1
 * critic put it at 4× beside brick that reads as brick and called it the one thing in the crop that
 * looks like programmer art. A carriage lantern is a **bracket, a cage and a cap**: an arm that
 * tapers out of the wall, four glazed panes between four corner posts, a pyramid cap with a finial,
 * and a solid bottom, because the light goes down and sideways and not up. Twenty-two quads.
 */
function lantern(ctx: KitCtx, f: Frame, skin: Skin, u: number, v: number): void {
  const out = 0.34;
  const half = 0.115;
  const top = v + 0.06;
  const bottom = v - 0.4;
  // The bracket: a wall plate, an arm that tapers, and a stay back to the wall under it.
  addBand(
    ctx.kit,
    f,
    u - 0.07,
    u + 0.07,
    v + 0.1,
    v + 0.34,
    0,
    0.05,
    skin.metalColour,
    skin.metalTile
  );
  addBand(
    ctx.kit,
    f,
    u - 0.03,
    u + 0.03,
    v + 0.2,
    v + 0.28,
    0.03,
    out,
    skin.metalColour,
    skin.metalTile
  );
  addTube(
    ctx.kit,
    framePoint(f, u, v + 0.12, 0.04),
    framePoint(f, u, v + 0.22, out - 0.03),
    0.018,
    skin.metalColour,
    skin.metalTile,
    4
  );
  // The cage: four posts and four glazed faces between them, tapering in towards the top.
  const glassC = mixRgb(skin.litColour, [1, 1, 1], 0.2);
  for (const [du, dOut] of [
    [-half, 0],
    [half, 0],
    [0, -half],
    [0, half],
  ]) {
    addBand(
      ctx.kit,
      f,
      u + du - 0.014,
      u + du + 0.014,
      bottom,
      top,
      out + dOut - 0.014,
      out + dOut + 0.014,
      skin.metalColour,
      skin.metalTile
    );
  }
  addBand(
    ctx.lit,
    f,
    u - half,
    u + half,
    bottom + 0.02,
    top - 0.02,
    out - half,
    out + half,
    glassC,
    skin.joineryTile
  );
  // The cap and the base, both a little wider than the cage, and a finial on top.
  addBand(
    ctx.kit,
    f,
    u - half - 0.05,
    u + half + 0.05,
    top,
    top + 0.06,
    out - half - 0.05,
    out + half + 0.05,
    skin.metalColour,
    skin.metalTile
  );
  addBand(
    ctx.kit,
    f,
    u - half - 0.02,
    u + half + 0.02,
    top + 0.06,
    top + 0.13,
    out - half + 0.02,
    out + half - 0.02,
    skin.metalColour,
    skin.metalTile
  );
  addTube(
    ctx.kit,
    framePoint(f, u, top + 0.13, out),
    framePoint(f, u, top + 0.21, out),
    0.016,
    skin.metalColour,
    skin.metalTile,
    4
  );
  addBand(
    ctx.kit,
    f,
    u - half - 0.04,
    u + half + 0.04,
    bottom - 0.05,
    bottom,
    out - half - 0.04,
    out + half + 0.04,
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
  addBand(
    ctx.kit,
    f,
    u0 - 0.06,
    u1 + 0.06,
    0,
    v0,
    -0.02,
    0.08,
    skin.joineryColour,
    skin.joineryTile
  );
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
  addFrameCylinder(
    ctx.kit,
    f,
    cu,
    cv,
    r,
    0.02,
    -0.22,
    14,
    shade(skin.wallColour, 0.82),
    skin.wallTile
  );
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
    // `a1 → a0` and not `a0 → a1`. Walked with the angle, the ring's front annulus is
    // `tangent × radius`, which is MINUS the frame normal — so the stone ring round every oculus in
    // the catalogue faced into its own wall and was culled, 28 triangles per opening. Nothing saw
    // it for three rounds: §5b measures roof planes, §5c only asks the normal to agree with the
    // winding (it did, both wrong), and round 2's §5d judged nothing that did not stand on a mass's
    // plan prism. It stands 70 mm proud of one, which is what §5d reaches now.
    addQuad(ctx.kit, p(a1, r, 0.07), p(a0, r, 0.07), p(a0, r + 0.18, 0.07), p(a1, r + 0.18, 0.07), {
      colour: skin.trimColour,
      tile: skin.trimTile,
      repeatU: 1,
      repeatV: 1,
    });
    addQuad(
      ctx.kit,
      p(a0, r + 0.18, 0),
      p(a1, r + 0.18, 0),
      p(a1, r + 0.18, 0.07),
      p(a0, r + 0.18, 0.07),
      {
        colour: shade(skin.trimColour, 0.8),
        tile: skin.trimTile,
        repeatU: 1,
        repeatV: 1,
      }
    );
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
  addBand(ctx.kit, f, u0 - 0.09, u1 + 0.09, sh - 0.28, sh, 0, 0.18, skin.trimColour, skin.trimTile);
}

/** Wall, and nothing on it. */
function solid(ctx: KitCtx, f: Frame, skin: Skin): void {
  addFrameQuad(ctx.kit, f, 0, 0, f.width, f.height, 0, {
    colour: skin.wallColour,
    tile: skin.wallTile,
  });
}

/** The one place a bay code turns into geometry. */
export function drawBay(ctx: KitCtx, f: Frame, code: BayCode, skin: Skin, o: BayOptions): void {
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
      // A door above the ground floor is a door into thin air, and the pattern language repeats its
      // last storey upward by design — so `"w d w"` on a three-storey block asks for exactly that.
      // The substitution is here, in the primitive, rather than in a blueprint that has to remember:
      // upstairs a door is a full-height window, which is what a French casement onto no balcony
      // actually is.
      if (o.storey > 0) window_(ctx, f, skin, o, true);
      else door(ctx, f, skin, o, false);
      return;
    case 'D':
      if (o.storey > 0) window_(ctx, f, skin, o, true);
      else door(ctx, f, skin, o, true);
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

/**
 * A downpipe: hopper, pipe, brackets and a shoe.
 *
 * 80 mm, not 180. The round-1 critic measured the first version at radius 0.09 m — a 180 mm pipe,
 * twice anything on a real building — in the same off-white as the string course, with nothing at
 * either end. A rainwater pipe is 68–80 mm, it is darker than the wall it runs down, it starts at a
 * hopper under the gutter and it ends in a shoe over the gully, and it is clipped to the wall every
 * two metres.
 */
export function downpipe(ctx: KitCtx, f: Frame, u: number, top: number, skin: Skin): void {
  const r = 0.04;
  const out = 0.075;
  const colour = shade(skin.metalColour, 0.82);
  const a = framePoint(f, u, 0.16, out);
  const b = framePoint(f, u, top - 0.22, out);
  addTube(ctx.kit, a, b, r, colour, skin.metalTile, 6);
  // The hopper the gutter empties into, splayed out at the top.
  addBand(
    ctx.kit,
    f,
    u - 0.1,
    u + 0.1,
    top - 0.22,
    top,
    out - 0.09,
    out + 0.09,
    colour,
    skin.metalTile
  );
  // Two clips, and a shoe throwing the water clear of the plinth.
  for (const v of [top * 0.62, top * 0.28]) {
    addBand(ctx.kit, f, u - 0.07, u + 0.07, v, v + 0.05, 0, out + r, colour, skin.metalTile);
  }
  addTube(ctx.kit, a, framePoint(f, u, 0.1, out + 0.13), r * 1.05, colour, skin.metalTile, 6);
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
  addFrameQuad(ctx.sign, f, u0 + 0.12, v0 + 0.1, u1 - 0.12, v0 + height - 0.1, 0.31, {
    colour,
    tile: skin.joineryTile,
    repeatU: 1,
    repeatV: 1,
  });
  // Same inverse-square arithmetic as the lantern above: 1.0 m out means the wall behind the sign
  // gets the full number, so this is 9 rather than 26.
  const p = framePoint(f, (u0 + u1) / 2, v0 + height / 2, 1.0);
  ctx.lights.push({ x: p[0], y: p[1], z: p[2], color: '#ffd9a0', intensity: 9, range: 9 });
}
