/**
 * The parametric shapes a flat ride is built from. Pure arrays, no Babylon, node-runnable — which
 * is what lets `selftest.mjs` count triangles, measure heights and check a rig's seats without a
 * GPU.
 *
 * ## The references these were drawn from
 *
 * Researched before anything was modelled, because "a plausible-looking invention that anyone who
 * has been to a park would not recognise" is a 3 on the fidelity axis:
 *
 * **Carousel** (Venetian / continental, e.g. the Bayol and Hübner machines in European parks).
 * 10-16 m across, platform 0.55-0.75 m off the ground with a hanging skirt over the running gear.
 * A centre pole carries radial *sweeps* out to the rim; the canopy is a shallow cone of painted
 * panels with a **scalloped valance** hanging off its edge and a light bulb between each scallop.
 * Horses ride on **spiral-fluted brass poles**; the *jumpers* rise 0.35-0.45 m on a crank while the
 * *standers* on the outer row do not, and adjacent cranks are offset so the ring reads as a
 * travelling wave rather than one block. 4-5 rpm, and a continental carousel turns **clockwise**
 * seen from above, which is the opposite of an American one.
 *
 * **Chair swing / Wellenflug** (Zierer, Bertazzon). A 10-12 m mast, a crown of 6-10 m radius, seats
 * on **two chains** each, 3-4 m long. The chains fly out to 45-60° at speed — that angle is not
 * authored anywhere in this module, it is solved from the rotation (see `chainAngle`). The wave
 * swinger's crown also **tilts** 7-10° and rotates about the canted axis, which is where the name
 * comes from: the riders rise and fall once per revolution.
 *
 * **Ferris wheel.** Hub on two A-frames, a spoked rim, gondolas on **pivots at the rim** so they
 * hang level whatever the wheel does, and they swing a few degrees when the wheel starts and stops.
 * A 25-30 m park wheel runs 0.5-1.5 rpm and a ride is three or four revolutions.
 *
 * **Top spin** (HUSS). Two towers, two hydraulic arms, and a gondola of two rows back to back that
 * rotates about its own horizontal axis while the arms swing it through a full circle. The seats
 * are in a straight row with over-the-shoulder restraints and there is no floor under them.
 *
 * ## Conventions
 *
 * Every shape is authored with its **origin at the point it attaches to its parent** — a chair's
 * origin is the pivot the chains hang from, a gondola's is its hanger pin, a horse's is the foot of
 * its pole — because that is what makes a rig a tree of transforms rather than a list of offsets
 * somebody has to keep in step.
 *
 * UVs are in metres divided by `UV_TILE`, assigned from each face's own edge lengths, so one shared
 * detail texture holds a constant texel density over a 0.4 m bulb and a 25 m rim.
 */

import type { Finish, ShapeName } from './types';

/** Metres per texture repeat. 2 m at 512 px/m is the art bible's mid-ground figure. */
export const UV_TILE = 2;

export interface Surface {
  finish: Finish;
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

export interface ShapeMesh {
  surfaces: Surface[];
  /** Axis-aligned bounds in the shape's own space. */
  min: [number, number, number];
  max: [number, number, number];
}

export type ShapeParams = Record<string, number | string | boolean | undefined>;

// ── sRGB → linear, because a vertex colour multiplies a PBR albedo in linear space ──────────
export function hexToLinear(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
  return n.map((pair) => {
    const s = parseInt(pair, 16) / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
}

// ── Surface bookkeeping ─────────────────────────────────────────────────────────────────────
class Builder {
  private readonly byFinish = new Map<Finish, Surface>();
  min: [number, number, number] = [Infinity, Infinity, Infinity];
  max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  surface(finish: Finish): Surface {
    let s = this.byFinish.get(finish);
    if (!s) {
      s = { finish, positions: [], normals: [], uvs: [], colors: [], indices: [] };
      this.byFinish.set(finish, s);
    }
    return s;
  }

  track(x: number, y: number, z: number): void {
    if (x < this.min[0]) this.min[0] = x;
    if (y < this.min[1]) this.min[1] = y;
    if (z < this.min[2]) this.min[2] = z;
    if (x > this.max[0]) this.max[0] = x;
    if (y > this.max[1]) this.max[1] = y;
    if (z > this.max[2]) this.max[2] = z;
  }

  done(): ShapeMesh {
    const surfaces = [...this.byFinish.values()].filter((s) => s.indices.length > 0);
    if (!surfaces.length) return { surfaces: [], min: [0, 0, 0], max: [0, 0, 0] };
    return { surfaces, min: this.min, max: this.max };
  }
}

type P3 = [number, number, number];

function sub(a: P3, b: P3): P3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a: P3, b: P3): P3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function len(a: P3): number {
  return Math.hypot(a[0], a[1], a[2]);
}
function norm(a: P3): P3 {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/**
 * One quad, wound `a b c d` counter-clockwise seen from the side the normal points at.
 *
 * The UVs come from the quad's own edge lengths rather than from a 0..1 unwrap: a 0.4 m bulb and a
 * 25 m rim then carry the same texel density off one shared texture, which is the only way a single
 * material can dress a whole fairground without a per-mesh scale nobody maintains.
 */
function quad(b: Builder, finish: Finish, color: P3, a: P3, bb: P3, c: P3, d: P3): void {
  const s = b.surface(finish);
  const n = norm(cross(sub(bb, a), sub(d, a)));
  const base = s.positions.length / 3;
  const u = len(sub(bb, a)) / UV_TILE;
  const v = len(sub(d, a)) / UV_TILE;
  const pts = [a, bb, c, d];
  const uv = [
    [0, 0],
    [u, 0],
    [u, v],
    [0, v],
  ];
  for (let i = 0; i < 4; i++) {
    s.positions.push(pts[i][0], pts[i][1], pts[i][2]);
    s.normals.push(n[0], n[1], n[2]);
    s.uvs.push(uv[i][0], uv[i][1]);
    s.colors.push(color[0], color[1], color[2], 1);
    b.track(pts[i][0], pts[i][1], pts[i][2]);
  }
  s.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function tri(b: Builder, finish: Finish, color: P3, a: P3, bb: P3, c: P3): void {
  const s = b.surface(finish);
  const n = norm(cross(sub(bb, a), sub(c, a)));
  const base = s.positions.length / 3;
  const pts = [a, bb, c];
  const uvs = [
    [0, 0],
    [len(sub(bb, a)) / UV_TILE, 0],
    [0, len(sub(c, a)) / UV_TILE],
  ];
  for (let i = 0; i < 3; i++) {
    s.positions.push(pts[i][0], pts[i][1], pts[i][2]);
    s.normals.push(n[0], n[1], n[2]);
    s.uvs.push(uvs[i][0], uvs[i][1]);
    s.colors.push(color[0], color[1], color[2], 1);
    b.track(pts[i][0], pts[i][1], pts[i][2]);
  }
  s.indices.push(base, base + 1, base + 2);
}

/** An axis-aligned box, `c` its centre. */
function box(b: Builder, finish: Finish, color: P3, c: P3, sx: number, sy: number, sz: number): void {
  const [x, y, z] = c;
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const p = (dx: number, dy: number, dz: number): P3 => [x + dx * hx, y + dy * hy, z + dz * hz];
  quad(b, finish, color, p(-1, -1, 1), p(1, -1, 1), p(1, 1, 1), p(-1, 1, 1)); // +z
  quad(b, finish, color, p(1, -1, -1), p(-1, -1, -1), p(-1, 1, -1), p(1, 1, -1)); // -z
  quad(b, finish, color, p(1, -1, 1), p(1, -1, -1), p(1, 1, -1), p(1, 1, 1)); // +x
  quad(b, finish, color, p(-1, -1, -1), p(-1, -1, 1), p(-1, 1, 1), p(-1, 1, -1)); // -x
  quad(b, finish, color, p(-1, 1, 1), p(1, 1, 1), p(1, 1, -1), p(-1, 1, -1)); // +y
  quad(b, finish, color, p(-1, -1, -1), p(1, -1, -1), p(1, -1, 1), p(-1, -1, 1)); // -y
}

/**
 * A box from `a` to `bb` of the given square section — a beam, a chain, a brace, a leg.
 *
 * Built in the beam's own frame so a diagonal brace is a real diagonal member and not a thin box
 * rotated by whoever placed it.
 */
function beam(b: Builder, finish: Finish, color: P3, a: P3, bb: P3, w: number, h = w): void {
  const dir = norm(sub(bb, a));
  const up: P3 = Math.abs(dir[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
  const right = norm(cross(dir, up));
  const realUp = norm(cross(right, dir));
  const corner = (p: P3, s: number, t: number): P3 => [
    p[0] + right[0] * s * w * 0.5 + realUp[0] * t * h * 0.5,
    p[1] + right[1] * s * w * 0.5 + realUp[1] * t * h * 0.5,
    p[2] + right[2] * s * w * 0.5 + realUp[2] * t * h * 0.5,
  ];
  const a0 = corner(a, -1, -1);
  const a1 = corner(a, 1, -1);
  const a2 = corner(a, 1, 1);
  const a3 = corner(a, -1, 1);
  const b0 = corner(bb, -1, -1);
  const b1 = corner(bb, 1, -1);
  const b2 = corner(bb, 1, 1);
  const b3 = corner(bb, -1, 1);
  quad(b, finish, color, a0, a1, b1, b0);
  quad(b, finish, color, a1, a2, b2, b1);
  quad(b, finish, color, a2, a3, b3, b2);
  quad(b, finish, color, a3, a0, b0, b3);
  quad(b, finish, color, a3, a2, a1, a0);
  quad(b, finish, color, b0, b1, b2, b3);
}

/** A vertical prism: `sides` faces, radius `r0` at `y0` rising to `r1` at `y1`. */
function prism(
  b: Builder,
  finish: Finish,
  color: P3,
  cx: number,
  cz: number,
  y0: number,
  y1: number,
  r0: number,
  r1: number,
  sides: number,
  cap: 'both' | 'top' | 'none' = 'both',
  alt?: P3
): void {
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const c = alt && i % 2 === 1 ? alt : color;
    const p0: P3 = [cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0];
    const p1: P3 = [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0];
    const p2: P3 = [cx + Math.cos(a1) * r1, y1, cz + Math.sin(a1) * r1];
    const p3: P3 = [cx + Math.cos(a0) * r1, y1, cz + Math.sin(a0) * r1];
    quad(b, finish, c, p0, p1, p2, p3);
    if (cap === 'both' || cap === 'top') {
      tri(b, finish, color, [cx, y1, cz], p3, p2);
    }
    if (cap === 'both') {
      tri(b, finish, color, [cx, y0, cz], p1, p0);
    }
  }
}

/** A ring of square section, radius `r`, tube `t`, in the XZ plane at height `y`. */
function ring(b: Builder, finish: Finish, color: P3, r: number, t: number, y: number, segments: number): void {
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    beam(
      b,
      finish,
      color,
      [Math.cos(a0) * r, y, Math.sin(a0) * r],
      [Math.cos(a1) * r, y, Math.sin(a1) * r],
      t
    );
  }
}

/** A low-poly ball — a finial, a bulb, a pivot boss. */
function ball(b: Builder, finish: Finish, color: P3, c: P3, r: number, seg = 6): void {
  for (let j = 0; j < seg; j++) {
    const t0 = (j / seg) * Math.PI;
    const t1 = ((j + 1) / seg) * Math.PI;
    for (let i = 0; i < seg * 2; i++) {
      const p0 = (i / (seg * 2)) * Math.PI * 2;
      const p1 = ((i + 1) / (seg * 2)) * Math.PI * 2;
      const at = (t: number, p: number): P3 => [
        c[0] + Math.sin(t) * Math.cos(p) * r,
        c[1] + Math.cos(t) * r,
        c[2] + Math.sin(t) * Math.sin(p) * r,
      ];
      quad(b, finish, color, at(t0, p0), at(t0, p1), at(t1, p1), at(t1, p0));
    }
  }
}

// ── Parameter access ────────────────────────────────────────────────────────────────────────
function num(p: ShapeParams, key: string, fallback: number): number {
  const v = p[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function flag(p: ShapeParams, key: string, fallback: boolean): boolean {
  const v = p[key];
  return typeof v === 'boolean' ? v : fallback;
}
function col(p: ShapeParams, key: string, fallback: string): P3 {
  const v = p[key];
  return hexToLinear(typeof v === 'string' ? v : fallback);
}
function finishOf(p: ShapeParams, fallback: Finish): Finish {
  const v = p.finish;
  return v === 'matte' || v === 'gloss' || v === 'metal' || v === 'fabric' || v === 'lamp'
    ? v
    : fallback;
}

// ── The shapes ──────────────────────────────────────────────────────────────────────────────
/**
 * `drum` — a prism. Bases, platforms, hubs, towers, teacups.
 *
 * `radius`, `radiusTop`, `height`, `sides`, `panels` (alternate the colour face by face, which is
 * how a carousel's centre drum and a teacup are painted), `rim` (a lip proud of the top edge),
 * `skirt` (a fascia hanging below, over the running gear), `hollow` (no top cap, for a cup).
 */
function drum(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const r = num(p, 'radius', 3);
  const rTop = num(p, 'radiusTop', r);
  const h = num(p, 'height', 1);
  const sides = Math.max(3, Math.round(num(p, 'sides', 16)));
  const base = col(p, 'color', '#c8552b');
  const accent = col(p, 'accent', '#f2e2c0');
  const finish = finishOf(p, 'gloss');
  prism(b, finish, base, 0, 0, 0, h, r, rTop, sides, flag(p, 'hollow', false) ? 'none' : 'both',
    flag(p, 'panels', false) ? accent : undefined);
  if (flag(p, 'rim', false)) {
    ring(b, 'metal', col(p, 'trim', '#c9a227'), rTop + 0.04, 0.09, h - 0.02, sides);
  }
  const skirt = num(p, 'skirt', 0);
  if (skirt > 0) prism(b, 'matte', col(p, 'trim', '#3a4652'), 0, 0, -skirt, 0, r * 0.97, r * 0.97, sides, 'none');
  return b.done();
}

/** `box` — `sx`, `sy`, `sz`, sitting on y = 0 unless `centred`. */
function boxShape(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const sx = num(p, 'sx', 1);
  const sy = num(p, 'sy', 1);
  const sz = num(p, 'sz', 1);
  const y = flag(p, 'centred', false) ? 0 : sy / 2;
  box(b, finishOf(p, 'matte'), col(p, 'color', '#8a939c'), [0, y, 0], sx, sy, sz);
  return b.done();
}

/** `mast` — a tapered pole with an optional finial. `height`, `radius`, `radiusTop`, `sides`. */
function mast(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const h = num(p, 'height', 8);
  const r = num(p, 'radius', 0.35);
  const rt = num(p, 'radiusTop', r * 0.8);
  const sides = Math.max(6, Math.round(num(p, 'sides', 12)));
  const c = col(p, 'color', '#d9d3c4');
  prism(b, finishOf(p, 'gloss'), c, 0, 0, 0, h, r, rt, sides, 'both');
  const bands = Math.round(num(p, 'bands', 0));
  for (let i = 1; i <= bands; i++) {
    const y = (i / (bands + 1)) * h;
    ring(b, 'metal', col(p, 'trim', '#c9a227'), r * 0.98, 0.11, y, sides);
  }
  if (flag(p, 'finial', false)) ball(b, 'metal', col(p, 'trim', '#c9a227'), [0, h + rt * 0.9, 0], rt * 1.5);
  return b.done();
}

/**
 * `frame` — the A-frame or portal that carries a hub.
 *
 * `span` (foot to foot), `height`, `depth` (thickness), `axis` ('x' or 'z': which way the A opens),
 * `braces` (cross members), `pad` (a concrete footing under each foot), `legs` (2 = an A, 4 = a
 * pyramid). A ferris wheel's two A-frames and a top spin's two towers are the same shape with
 * different numbers.
 */
function frame(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const span = num(p, 'span', 8);
  const h = num(p, 'height', 12);
  const t = num(p, 'depth', 0.4);
  const along = p.axis === 'z' ? 2 : 0;
  const braces = Math.max(0, Math.round(num(p, 'braces', 3)));
  const c = col(p, 'color', '#b8443a');
  const legs = Math.max(2, Math.round(num(p, 'legs', 2)));
  const feet: P3[] = [];
  for (let i = 0; i < legs; i++) {
    const s = i % 2 === 0 ? -1 : 1;
    const other = legs > 2 ? (i < 2 ? -1 : 1) : 0;
    const foot: P3 = [0, 0, 0];
    foot[along] = (s * span) / 2;
    foot[along === 0 ? 2 : 0] = (other * span) / 2.6;
    feet.push(foot);
    beam(b, 'gloss', c, foot, [0, h, 0], t, t);
    if (flag(p, 'pad', true)) box(b, 'matte', col(p, 'pad', '#9aa0a6'), [foot[0], 0.09, foot[2]], t * 3, 0.18, t * 3);
  }
  for (let i = 1; i <= braces; i++) {
    const f = i / (braces + 1);
    const y = f * h;
    const w = ((1 - f) * span) / 2;
    const a: P3 = [0, y, 0];
    const bb: P3 = [0, y, 0];
    a[along] = -w;
    bb[along] = w;
    beam(b, 'gloss', c, a, bb, t * 0.55);
    if (i < braces) {
      const f2 = (i + 1) / (braces + 1);
      const w2 = ((1 - f2) * span) / 2;
      const c1: P3 = [0, f2 * h, 0];
      c1[along] = -w2;
      const c2: P3 = [0, f2 * h, 0];
      c2[along] = w2;
      beam(b, 'gloss', c, a, c2, t * 0.32);
      beam(b, 'gloss', c, bb, c1, t * 0.32);
    }
  }
  return b.done();
}

/**
 * `rim` — a spoked wheel standing in a plane.
 *
 * `radius`, `tube`, `segments`, `spokes`, `width` (two rims this far apart, braced), `plane`
 * ('xy' turns about z, 'yz' turns about x). A ferris wheel is this plus gondolas.
 */
function rimShape(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const r = num(p, 'radius', 12);
  const tube = num(p, 'tube', 0.22);
  const segments = Math.max(8, Math.round(num(p, 'segments', 32)));
  const spokes = Math.max(0, Math.round(num(p, 'spokes', 16)));
  const width = num(p, 'width', 1.6);
  const yz = p.plane === 'yz';
  const c = col(p, 'color', '#e8e2d4');
  const spokeColor = col(p, 'trim', '#c9c3b4');
  const at = (a: number, off: number): P3 =>
    yz ? [off, Math.sin(a) * r, Math.cos(a) * r] : [Math.cos(a) * r, Math.sin(a) * r, off];
  for (const off of [-width / 2, width / 2]) {
    for (let i = 0; i < segments; i++) {
      beam(b, 'gloss', c, at((i / segments) * Math.PI * 2, off), at(((i + 1) / segments) * Math.PI * 2, off), tube);
    }
  }
  const hub = num(p, 'hub', 0.9);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const inner: P3 = yz ? [0, Math.sin(a) * hub, Math.cos(a) * hub] : [Math.cos(a) * hub, Math.sin(a) * hub, 0];
    for (const off of [-width / 2, width / 2]) beam(b, 'metal', spokeColor, inner, at(a, off), tube * 0.42);
    // The cross bracing between the two rims: what stops a real wheel folding sideways.
    const a2 = ((i + 1) / spokes) * Math.PI * 2;
    beam(b, 'metal', spokeColor, at(a, -width / 2), at(a2, width / 2), tube * 0.3);
  }
  prism(b, 'metal', spokeColor, 0, 0, -width * 0.6, width * 0.6, hub * 0.55, hub * 0.55, 12, 'both');
  return b.done();
}

/**
 * `canopy` — the cone over a carousel or a chair swing.
 *
 * `radius`, `rise`, `sides`, `panels` (alternating colours), `valance` (the scalloped skirt hanging
 * off the edge), `scallop` (its depth), `finial`, `sweeps` (radial ribs on the underside).
 */
function canopy(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const r = num(p, 'radius', 7);
  const rise = num(p, 'rise', 1.8);
  const sides = Math.max(8, Math.round(num(p, 'sides', 16)));
  const c = col(p, 'color', '#c8362f');
  const accent = col(p, 'accent', '#f4ecd8');
  const trim = col(p, 'trim', '#c9a227');
  const hubR = num(p, 'hub', 0.5);
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const cc = flag(p, 'panels', true) && i % 2 === 1 ? accent : c;
    const outer0: P3 = [Math.cos(a0) * r, 0, Math.sin(a0) * r];
    const outer1: P3 = [Math.cos(a1) * r, 0, Math.sin(a1) * r];
    const inner0: P3 = [Math.cos(a0) * hubR, rise, Math.sin(a0) * hubR];
    const inner1: P3 = [Math.cos(a1) * hubR, rise, Math.sin(a1) * hubR];
    quad(b, 'fabric', cc, outer0, outer1, inner1, inner0);
    quad(b, 'fabric', cc, inner0, inner1, outer1, outer0);
    if (flag(p, 'sweeps', true)) {
      beam(b, 'metal', trim, [Math.cos(a0) * hubR, rise - 0.06, Math.sin(a0) * hubR], [Math.cos(a0) * r, -0.05, Math.sin(a0) * r], 0.075);
    }
  }
  const valance = num(p, 'valance', 0.55);
  if (valance > 0) {
    const scallops = sides * 2;
    for (let i = 0; i < scallops; i++) {
      const a0 = (i / scallops) * Math.PI * 2;
      const a1 = ((i + 1) / scallops) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      const top0: P3 = [Math.cos(a0) * r, 0, Math.sin(a0) * r];
      const top1: P3 = [Math.cos(a1) * r, 0, Math.sin(a1) * r];
      const low: P3 = [Math.cos(am) * r, -valance, Math.sin(am) * r];
      const cc = i % 2 === 0 ? c : accent;
      tri(b, 'fabric', cc, top0, top1, low);
      tri(b, 'fabric', cc, low, top1, top0);
      // A bulb in every notch between two scallops — the rounding-board lights.
      if (flag(p, 'bulbs', true)) ball(b, 'lamp', col(p, 'bulb', '#ffe6b0'), [Math.cos(a1) * (r + 0.06), -0.12, Math.sin(a1) * (r + 0.06)], 0.075, 4);
    }
  }
  ring(b, 'metal', trim, r, 0.1, 0.02, sides * 2);
  if (flag(p, 'finial', true)) {
    prism(b, 'metal', trim, 0, 0, rise, rise + 0.5, hubR * 0.8, 0.1, 10, 'both');
    ball(b, 'metal', trim, [0, rise + 0.72, 0], 0.22);
  }
  return b.done();
}

/**
 * `horse` — a fairground horse on its pole. Origin at the platform, pole rising through the body.
 *
 * `scale`, `poleHeight`, `body`, `mane`, `saddle`, `pole` colours. Blocky by design at this size —
 * a carved carousel horse is a 3,000-triangle object and there are sixteen of them.
 */
function horse(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const s = num(p, 'scale', 1);
  const poleH = num(p, 'poleHeight', 3.1);
  const body = col(p, 'color', '#f2ede1');
  const mane = col(p, 'accent', '#3a2b22');
  const saddle = col(p, 'trim', '#a8322c');
  const brass = col(p, 'pole', '#c9a227');
  const y = 1.05 * s;
  box(b, 'matte', body, [0, y, 0], 1.62 * s, 0.72 * s, 0.52 * s);
  box(b, 'matte', body, [0.62 * s, y + 0.42 * s, 0], 0.42 * s, 0.62 * s, 0.4 * s);
  box(b, 'matte', body, [0.95 * s, y + 0.72 * s, 0], 0.66 * s, 0.34 * s, 0.34 * s);
  box(b, 'matte', mane, [0.5 * s, y + 0.72 * s, 0], 0.5 * s, 0.2 * s, 0.42 * s);
  box(b, 'matte', mane, [-0.84 * s, y + 0.24 * s, 0], 0.2 * s, 0.66 * s, 0.22 * s);
  for (const dx of [0.48, -0.48]) {
    for (const dz of [0.19, -0.19]) {
      const bent = dx > 0 ? 0.18 : -0.14;
      beam(b, 'matte', body, [dx * s, y - 0.3 * s, dz * s], [(dx + bent) * s, 0.06 * s, dz * s], 0.19 * s);
    }
  }
  box(b, 'gloss', saddle, [-0.04 * s, y + 0.4 * s, 0], 0.62 * s, 0.16 * s, 0.58 * s);
  box(b, 'gloss', saddle, [-0.3 * s, y + 0.56 * s, 0], 0.12 * s, 0.24 * s, 0.5 * s);
  if (flag(p, 'pole', true)) {
    prism(b, 'metal', brass, 0, 0, 0, poleH, 0.05 * s, 0.05 * s, 8, 'both');
    // A spiral is four short bands on a fluted pole; at 0.05 m radius that is what reads.
    for (let i = 1; i <= 4; i++) ring(b, 'metal', brass, 0.062 * s, 0.035, (i / 5) * poleH, 8);
  }
  return b.done();
}

/**
 * `gondola` — a passenger car. Origin at the hanger pin above it.
 *
 * `seats` (side by side), `width`, `depth`, `height`, `drop` (pin to floor), `roof`, `hanger`,
 * `restraint` ('none' | 'lap' | 'shoulder'), `open` (no back panel). A ferris wheel gondola and a
 * top spin's seat row are one shape with different numbers, which is the point.
 */
function gondola(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const seats = Math.max(1, Math.round(num(p, 'seats', 4)));
  const w = num(p, 'width', Math.max(1.4, seats * 0.62));
  const d = num(p, 'depth', 1.5);
  const h = num(p, 'height', 1.15);
  const drop = num(p, 'drop', 1.4);
  const shell = col(p, 'color', '#2f6fb0');
  const trim = col(p, 'trim', '#f0e9d8');
  const seat = col(p, 'accent', '#22262c');
  const y0 = -drop;
  box(b, 'gloss', shell, [0, y0, 0], w, 0.12, d);
  const wallH = h * 0.62;
  if (!flag(p, 'open', false)) {
    box(b, 'gloss', shell, [0, y0 + wallH / 2, -d / 2 + 0.06], w, wallH, 0.12);
  }
  box(b, 'gloss', shell, [-w / 2 + 0.06, y0 + wallH / 2, 0], 0.12, wallH, d);
  box(b, 'gloss', shell, [w / 2 - 0.06, y0 + wallH / 2, 0], 0.12, wallH, d);
  if (!flag(p, 'openFront', false)) box(b, 'gloss', shell, [0, y0 + wallH / 2, d / 2 - 0.06], w, wallH, 0.12);
  for (let i = 0; i < seats; i++) {
    const x = (i - (seats - 1) / 2) * (w / seats);
    box(b, 'matte', seat, [x, y0 + 0.46, 0], (w / seats) * 0.82, 0.14, d * 0.55);
    box(b, 'matte', seat, [x, y0 + 0.74, -d * 0.22], (w / seats) * 0.82, 0.56, 0.12);
    if (p.restraint === 'shoulder') {
      beam(b, 'gloss', col(p, 'restraint', '#c8362f'), [x - 0.2, y0 + 1.05, -d * 0.16], [x - 0.16, y0 + 0.52, d * 0.12], 0.09);
      beam(b, 'gloss', col(p, 'restraint', '#c8362f'), [x + 0.2, y0 + 1.05, -d * 0.16], [x + 0.16, y0 + 0.52, d * 0.12], 0.09);
    } else if (p.restraint === 'lap') {
      beam(b, 'metal', trim, [x - (w / seats) * 0.4, y0 + 0.62, d * 0.16], [x + (w / seats) * 0.4, y0 + 0.62, d * 0.16], 0.07);
    }
  }
  if (flag(p, 'roof', false)) {
    box(b, 'fabric', col(p, 'accent2', '#c8362f'), [0, y0 + h + 0.1, 0], w + 0.14, 0.1, d + 0.14);
  }
  if (flag(p, 'hanger', true)) {
    beam(b, 'metal', trim, [-w / 2 + 0.16, y0 + wallH, 0], [0, -0.12, 0], 0.09);
    beam(b, 'metal', trim, [w / 2 - 0.16, y0 + wallH, 0], [0, -0.12, 0], 0.09);
    ball(b, 'metal', trim, [0, 0, 0], 0.16);
  }
  return b.done();
}

/**
 * `chair` — a swing seat on chains. Origin at the pivot; everything hangs below it.
 *
 * `chainLength`, `chains` (2 or 4), `width`, `back`, `foot` (a footrest bar). The angle it hangs at
 * is NOT here: `rig.ts` solves it from the rotation, which is the whole point of the shape's origin
 * being the pivot.
 */
function chair(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const L = num(p, 'chainLength', 3.2);
  const chains = Math.max(1, Math.round(num(p, 'chains', 2)));
  const w = num(p, 'width', 0.52);
  const backH = num(p, 'back', 0.5);
  const seatC = col(p, 'color', '#2f6fb0');
  const metal = col(p, 'trim', '#cdd3d8');
  for (let i = 0; i < chains; i++) {
    const x = chains === 1 ? 0 : (i / (chains - 1) - 0.5) * w;
    beam(b, 'metal', metal, [x * 0.4, 0, 0], [x, -L, 0], 0.035);
  }
  box(b, 'gloss', seatC, [0, -L - 0.05, 0], w + 0.12, 0.1, 0.46);
  box(b, 'gloss', seatC, [0, -L + backH / 2 - 0.05, -0.2], w + 0.12, backH, 0.09);
  beam(b, 'metal', metal, [-w / 2 - 0.06, -L - 0.02, 0.26], [w / 2 + 0.06, -L - 0.02, 0.26], 0.05);
  if (flag(p, 'foot', true)) beam(b, 'metal', metal, [-w / 2, -L - 0.42, 0.16], [w / 2, -L - 0.42, 0.16], 0.045);
  return b.done();
}

/**
 * `arm` — a boom. Origin at the pivot, extending down -Y by `length`.
 *
 * `length`, `width`, `depth`, `truss` (a lattice instead of a solid box), `taper`.
 */
function arm(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const L = num(p, 'length', 5.5);
  const w = num(p, 'width', 0.5);
  const d = num(p, 'depth', 0.5);
  const c = col(p, 'color', '#e0a21b');
  if (flag(p, 'truss', true)) {
    beam(b, 'gloss', c, [-w / 2, 0, 0], [-w / 2, -L, 0], d * 0.4);
    beam(b, 'gloss', c, [w / 2, 0, 0], [w / 2, -L, 0], d * 0.4);
    const bays = Math.max(2, Math.round(L / 1.1));
    for (let i = 0; i <= bays; i++) {
      const y = -(i / bays) * L;
      beam(b, 'gloss', c, [-w / 2, y, 0], [w / 2, y, 0], d * 0.26);
      if (i < bays) {
        const y2 = -((i + 1) / bays) * L;
        beam(b, 'gloss', c, [-w / 2, y, 0], [w / 2, y2, 0], d * 0.2);
      }
    }
  } else {
    box(b, 'gloss', c, [0, -L / 2, 0], w, L, d);
  }
  ball(b, 'metal', col(p, 'trim', '#8d949b'), [0, 0, 0], w * 0.55);
  ball(b, 'metal', col(p, 'trim', '#8d949b'), [0, -L, 0], w * 0.5);
  return b.done();
}

/** `lights` — a ring of bulbs. `radius`, `count`, `bulb`, `plane` ('xz' | 'xy'). */
function lights(p: ShapeParams): ShapeMesh {
  const b = new Builder();
  const r = num(p, 'radius', 6);
  const count = Math.max(4, Math.round(num(p, 'count', 24)));
  const rad = num(p, 'bulb', 0.09);
  const c = col(p, 'color', '#ffe6b0');
  const xy = p.plane === 'xy';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    ball(b, 'lamp', c, xy ? [Math.cos(a) * r, Math.sin(a) * r, 0] : [Math.cos(a) * r, 0, Math.sin(a) * r], rad, 4);
  }
  return b.done();
}

const SHAPES: Record<ShapeName, (p: ShapeParams) => ShapeMesh> = {
  drum,
  box: boxShape,
  mast,
  frame,
  rim: rimShape,
  canopy,
  horse,
  gondola,
  chair,
  arm,
  lights,
};

export function isShapeName(name: string): name is ShapeName {
  return name in SHAPES;
}

export function buildShape(name: ShapeName, params: ShapeParams = {}): ShapeMesh {
  return SHAPES[name](params);
}

export function shapeNames(): ShapeName[] {
  return Object.keys(SHAPES) as ShapeName[];
}

export function triangleCount(mesh: ShapeMesh): number {
  let n = 0;
  for (const s of mesh.surfaces) n += s.indices.length / 3;
  return n;
}
