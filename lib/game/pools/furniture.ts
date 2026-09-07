/**
 * What stands on the deck. Six shapes, and a pack may combine them at any colour, weight and
 * clearance — the manifest names a `shape` here the way a ride's manifest names a shape in
 * `rides/shapes.ts`.
 *
 * The references are the ones a European lido actually buys:
 *
 * - **Lounger** — an aluminium frame 1.95 m long and 0.62 m wide, seat at 0.38 m, a backrest at
 *   about 40° on a five-position ratchet, textilene sling in one colour, four small feet.
 * - **Parasol** — a 2.7 m octagonal canopy on a 38 mm pole, hub at 2.15 m, ribs falling to 1.9 m,
 *   so a standing adult walks under the edge. Alternating panel colours, because a plain one reads
 *   as a traffic cone from above.
 * - **Lifebuoy post** — a 24 kg ring on a galvanised post, 1.25 m to the centre, and it is red for
 *   the same reason it is red at a real pool. It is the only saturated object in the frame and it
 *   does a lot of work at 100 m.
 * - **Towel box, planter, ladder** — the furniture that fills the gaps between the loungers.
 *
 * Every shape is authored with its origin **on the deck at its own centre**, y up, +x forward
 * (which the layout turns to face the water), so a placement is a yaw and a scale and nothing else.
 */

import { SurfaceBuilder, WHITE } from './surfaces';
import { hexToLinear, hash2 } from './geom';
import type { PoolBuild, PoolDeckShape } from './types';

type Prop = PoolBuild['props'][number];

/** Draw one deck item into the builder, already transformed into the pool's local frame. */
export function buildProp(b: SurfaceBuilder, prop: Prop, seed: number, index: number): void {
  const colours = prop.item.colors.length ? prop.item.colors : ['#cccccc'];
  const colour = hexToLinear(colours[Math.floor(hash2(index, 7, seed) * colours.length) % colours.length]);
  const accent = hexToLinear(prop.item.accent);
  const t = transform(prop);
  switch (prop.shape) {
    case 'lounger':
      lounger(b, t, colour, accent);
      break;
    case 'parasol':
      parasol(b, t, colour, accent, index, seed);
      break;
    case 'ring-post':
      ringPost(b, t, colour, accent);
      break;
    case 'towel-box':
      towelBox(b, t, colour, accent);
      break;
    case 'planter':
      planter(b, t, colour, accent);
      break;
    case 'ladder':
    default:
      towelBox(b, t, colour, accent);
      break;
  }
}

interface Xf {
  x: number;
  z: number;
  c: number;
  s: number;
  k: number;
}

function transform(prop: Prop): Xf {
  return { x: prop.x, z: prop.z, c: Math.cos(prop.yaw), s: Math.sin(prop.yaw), k: prop.scale };
}

/** Local (forward, up, left) to the pool's frame. */
function at(t: Xf, f: number, u: number, l: number): [number, number, number] {
  const fx = f * t.k;
  const lx = l * t.k;
  return [t.x + fx * t.c - lx * t.s, u * t.k, t.z + fx * t.s + lx * t.c];
}

function dir(t: Xf, f: number, u: number, l: number): [number, number, number] {
  const n: [number, number, number] = [f * t.c - l * t.s, u, f * t.s + l * t.c];
  const m = Math.hypot(n[0], n[1], n[2]) || 1;
  return [n[0] / m, n[1] / m, n[2] / m];
}

/**
 * An axis-aligned slab in the prop's own (forward, up, left) frame.
 *
 * Six quads with their own outward normals — never a shared normal per box, which is what makes a
 * cube read as a lump of flat colour. `tiltF` rotates it about the left axis, for a backrest.
 */
function slab(
  b: SurfaceBuilder,
  t: Xf,
  surface: ReturnType<SurfaceBuilder['surface']>,
  centre: [number, number, number],
  half: [number, number, number],
  colour: [number, number, number],
  tiltF = 0
): void {
  const cos = Math.cos(tiltF);
  const sin = Math.sin(tiltF);
  const corner = (sf: number, su: number, sl: number): [number, number, number] => {
    const f0 = half[0] * sf;
    const u0 = half[1] * su;
    const f = f0 * cos - u0 * sin;
    const u = f0 * sin + u0 * cos;
    return at(t, centre[0] + f, centre[1] + u, centre[2] + half[2] * sl);
  };
  const faces: Array<{ n: [number, number, number]; c: Array<[number, number, number]> }> = [
    { n: dir(t, cos, sin, 0), c: [corner(1, -1, -1), corner(1, -1, 1), corner(1, 1, 1), corner(1, 1, -1)] },
    { n: dir(t, -cos, -sin, 0), c: [corner(-1, 1, -1), corner(-1, 1, 1), corner(-1, -1, 1), corner(-1, -1, -1)] },
    { n: dir(t, -sin, cos, 0), c: [corner(-1, 1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(-1, 1, 1)] },
    { n: dir(t, sin, -cos, 0), c: [corner(-1, -1, 1), corner(1, -1, 1), corner(1, -1, -1), corner(-1, -1, -1)] },
    { n: dir(t, 0, 0, 1), c: [corner(-1, -1, 1), corner(-1, 1, 1), corner(1, 1, 1), corner(1, -1, 1)] },
    { n: dir(t, 0, 0, -1), c: [corner(1, -1, -1), corner(1, 1, -1), corner(-1, 1, -1), corner(-1, -1, -1)] },
  ];
  for (const face of faces) {
    const ids = face.c.map((p, i) =>
      b.vertex(surface, p, face.n, [i & 1 ? 1 : 0, i & 2 ? 1 : 0], colour)
    );
    b.quad(surface, ids[0], ids[1], ids[2], ids[3]);
  }
}

/** A vertical round post. */
function post(
  b: SurfaceBuilder,
  t: Xf,
  surface: ReturnType<SurfaceBuilder['surface']>,
  f: number,
  l: number,
  y0: number,
  y1: number,
  radius: number,
  colour: [number, number, number],
  sides = 8
): void {
  const bottom: number[] = [];
  const top: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const df = Math.cos(a) * radius;
    const dl = Math.sin(a) * radius;
    const n = dir(t, Math.cos(a), 0, Math.sin(a));
    bottom.push(b.vertex(surface, at(t, f + df, y0, l + dl), n, [i / sides, 0], colour));
    top.push(b.vertex(surface, at(t, f + df, y1, l + dl), n, [i / sides, 1], colour));
  }
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    b.quad(surface, bottom[i], top[i], top[j], bottom[j]);
  }
}

function lounger(b: SurfaceBuilder, t: Xf, colour: [number, number, number], accent: [number, number, number]): void {
  const frame = b.surface('metal');
  const fabric = b.surface('fabric');
  // Four feet, 1.95 × 0.62, seat at 0.38.
  for (const f of [-0.82, 0.82]) {
    for (const l of [-0.26, 0.26]) {
      slab(b, t, frame, [f, 0.19, l], [0.03, 0.19, 0.03], accent);
    }
  }
  // Side rails.
  for (const l of [-0.3, 0.3]) {
    slab(b, t, frame, [0, 0.4, l], [0.98, 0.035, 0.035], accent);
  }
  // The sling: a seat pad and a backrest raked back about 40°.
  slab(b, t, fabric, [-0.16, 0.44, 0], [0.82, 0.045, 0.29], colour);
  slab(b, t, fabric, [0.94, 0.68, 0], [0.44, 0.04, 0.29], colour, -0.72);
}

function parasol(
  b: SurfaceBuilder,
  t: Xf,
  colour: [number, number, number],
  accent: [number, number, number],
  index: number,
  seed: number
): void {
  const metal = b.surface('metal');
  const fabric = b.surface('fabric');
  post(b, t, metal, 0, 0, 0, 2.15, 0.022, accent, 8);
  // The base: a moulded weight, not a floating pole.
  post(b, t, metal, 0, 0, 0, 0.09, 0.26, accent, 12);
  const panels = 8;
  const hub = 2.15;
  const rim = 1.9;
  const radius = 1.35;
  const second = hexToLinear('#f4f1e8');
  const alt = hash2(index, 9, seed) > 0.5;
  for (let i = 0; i < panels; i++) {
    const a0 = (i / panels) * Math.PI * 2;
    const a1 = ((i + 1) / panels) * Math.PI * 2;
    const c = alt && i % 2 === 1 ? second : colour;
    const p0 = at(t, 0, hub, 0);
    const p1 = at(t, Math.cos(a0) * radius, rim, Math.sin(a0) * radius);
    const p2 = at(t, Math.cos(a1) * radius, rim, Math.sin(a1) * radius);
    // The panel's own normal, so the canopy has facets and catches the sun on one side.
    const n = faceNormal(p0, p1, p2);
    const ids = [
      b.vertex(fabric, p0, n, [0.5, 0], c),
      b.vertex(fabric, p1, n, [0, 1], c),
      b.vertex(fabric, p2, n, [1, 1], c),
    ];
    b.tri(fabric, ids[0], ids[1], ids[2]);
    // The underside, so it is not a one-sided sheet seen from a lounger.
    const under = [
      b.vertex(fabric, p0, [-n[0], -n[1], -n[2]], [0.5, 0], [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7]),
      b.vertex(fabric, p2, [-n[0], -n[1], -n[2]], [1, 1], [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7]),
      b.vertex(fabric, p1, [-n[0], -n[1], -n[2]], [0, 1], [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7]),
    ];
    b.tri(fabric, under[0], under[1], under[2]);
  }
}

function ringPost(b: SurfaceBuilder, t: Xf, colour: [number, number, number], accent: [number, number, number]): void {
  const metal = b.surface('metal');
  post(b, t, metal, 0, 0, 0, 1.35, 0.028, accent, 8);
  post(b, t, metal, 0, 0, 0, 0.06, 0.16, accent, 10);
  // The ring: a torus in the vertical plane across the post, 0.7 m across.
  const major = 0.35;
  const minor = 0.055;
  const segments = 14;
  const tube = 6;
  const rings: number[][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const cf = Math.cos(a) * major;
    const cu = 1.25 + Math.sin(a) * major;
    const row: number[] = [];
    for (let j = 0; j < tube; j++) {
      const bAng = (j / tube) * Math.PI * 2;
      const nf = Math.cos(a) * Math.cos(bAng);
      const nu = Math.sin(a) * Math.cos(bAng);
      const nl = Math.sin(bAng);
      row.push(
        b.vertex(
          metal,
          at(t, cf + nf * minor, cu + nu * minor, nl * minor),
          dir(t, nf, nu, nl),
          [i / segments, j / tube],
          colour
        )
      );
    }
    rings.push(row);
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < tube; j++) {
      const k = (j + 1) % tube;
      b.quad(metal, rings[i][j], rings[i][k], rings[i + 1][k], rings[i + 1][j]);
    }
  }
}

function towelBox(b: SurfaceBuilder, t: Xf, colour: [number, number, number], accent: [number, number, number]): void {
  const timber = b.surface('timber');
  slab(b, t, timber, [0, 0.28, 0], [0.62, 0.28, 0.34], colour);
  // A lid with a lip, so it is a chest and not a crate.
  slab(b, t, timber, [0, 0.58, 0], [0.66, 0.03, 0.37], accent);
}

function planter(b: SurfaceBuilder, t: Xf, colour: [number, number, number], accent: [number, number, number]): void {
  const timber = b.surface('timber');
  const fabric = b.surface('fabric');
  post(b, t, timber, 0, 0, 0, 0.52, 0.36, colour, 10);
  // What is growing in it. Three overlapping fans of leaf, not a green ball.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const p0 = at(t, 0, 0.5, 0);
    const p1 = at(t, Math.cos(a) * 0.42, 1.05, Math.sin(a) * 0.42);
    const p2 = at(t, Math.cos(a + 1.9) * 0.42, 0.92, Math.sin(a + 1.9) * 0.42);
    const n = faceNormal(p0, p1, p2);
    const ids = [
      b.vertex(fabric, p0, n, [0.5, 0], accent),
      b.vertex(fabric, p1, n, [0, 1], accent),
      b.vertex(fabric, p2, n, [1, 1], accent),
    ];
    b.tri(fabric, ids[0], ids[1], ids[2]);
    const back = [
      b.vertex(fabric, p0, [-n[0], -n[1], -n[2]], [0.5, 0], accent),
      b.vertex(fabric, p2, [-n[0], -n[1], -n[2]], [1, 1], accent),
      b.vertex(fabric, p1, [-n[0], -n[1], -n[2]], [0, 1], accent),
    ];
    b.tri(fabric, back[0], back[1], back[2]);
  }
}

function faceNormal(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number]
): [number, number, number] {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

/** Every shape this module can draw. A pack's `shape` field is checked against it by the schema. */
export const DECK_SHAPES: readonly PoolDeckShape[] = [
  'lounger',
  'parasol',
  'ring-post',
  'ladder',
  'towel-box',
  'planter',
];

export { WHITE };
