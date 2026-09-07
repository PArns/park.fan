/**
 * The basin, in vertices. Pure arrays — no Babylon, no DOM — so `selftest.mjs` can count triangles,
 * measure the floor's slope and check which way a normal points without a GPU.
 *
 * ## What a pool is made of, and why each piece is here
 *
 * Researched from European public baths and hotel lagoons before anything was modelled, because a
 * blue box in the ground is a 3 on the fidelity axis:
 *
 * - **The floor falls in two breaks, not one ramp.** A swimming pool has a shallow shelf, a
 *   transition and a deep well; `geom.ts`'s `slope` profile is two smoothsteps for exactly that.
 * - **The wall carries a waterline.** Every tiled pool has a band of darker tile at the water
 *   surface, 150–250 mm deep, because that is where the scum line forms and where the tiler stops
 *   the field tile. It is the single detail that makes a tiled box read as a pool, and it is drawn
 *   here as its own row of vertices at the water level so the band has a hard edge.
 * - **The coping overhangs.** A rolled (bullnose) edge stands 40–50 mm proud of the deck and rolls
 *   over the wall's lip; a deck-level pool has no coping at all, only a grate channel flush with
 *   the paving and the water at deck height. Both are here, and which one a pool gets is a
 *   manifest field.
 * - **The deck falls away from the pool at about 1.5 %** so splash water drains outward rather
 *   than back in. It is 48 mm over a 3.2 m deck: invisible in a still, and the reason the deck
 *   does not read as a sheet of card.
 * - **Steps are 250 mm risers and 350 mm treads** — deeper and lower than a stair, because they
 *   are walked in water — and the first one is under the surface.
 *
 * ## The polar grid
 *
 * Floor, wall, coping, deck and water are all built on the same `segments` columns from `geom.ts`'s
 * outline, so the five meet exactly, the waterline lands on the wall's own row, and a lagoon's
 * organic plan costs nothing extra. `offsetRing` is what widens the outline for the coping and the
 * deck, and it decides which way is out by MEASURING (the offset ring must enclose more area than
 * the original) rather than by trusting a winding convention — the one thing in this file that
 * would otherwise be a silent 50/50.
 */

import type {
  PoolBuild,
  PoolDeckItemSpec,
  PoolDepthSpec,
  PoolEdgeSpec,
  PoolLightSite,
  PoolShapeSpec,
  PoolTileSpec,
} from './types';
import { SurfaceBuilder, WHITE } from './surfaces';
import {
  DECK_LIFT,
  rimHeight,
  depthAtUnit,
  hash2,
  hexToLinear,
  mix,
  outlinePoints,
  polygonArea,
  smoothstep,
} from './geom';

export interface PoolBuildInput {
  shape: PoolShapeSpec;
  tile: PoolTileSpec;
  edge: PoolEdgeSpec;
  size: [number, number];
  maxDepth: number;
  /** Metres the water sits below the top of the coping. */
  freeboard: number;
  deckDensity: number;
  /** Furniture catalogue to draw the deck from. Empty leaves it bare. */
  deckItems: PoolDeckItemSpec[];
  /** Seeds the per-tile tint, the furniture layout and the niche phase. */
  seed: number;
  /** Floor rings and wall rows scale with it; the outline segments do not (a lagoon must stay round). */
  detail: number;
}

/** Unit outward normal per outline vertex, with the direction settled by measurement. */
function outwardNormals(points: number[]): number[] {
  const n = points.length / 2;
  const out = new Array<number>(n * 2);
  for (let i = 0; i < n; i++) {
    const p = (i - 1 + n) % n;
    const q = (i + 1) % n;
    // The two adjacent edge directions, each rotated by −90° in (x, z).
    const e1x = points[i * 2] - points[p * 2];
    const e1z = points[i * 2 + 1] - points[p * 2 + 1];
    const e2x = points[q * 2] - points[i * 2];
    const e2z = points[q * 2 + 1] - points[i * 2 + 1];
    const n1 = norm2(e1z, -e1x);
    const n2 = norm2(e2z, -e2x);
    const nx = n1[0] + n2[0];
    const nz = n1[1] + n2[1];
    const [ux, uz] = norm2(nx, nz);
    // Miter: a corner has to travel further than a flat run to keep the offset parallel.
    const cos = ux * n2[0] + uz * n2[1];
    const scale = Math.min(2.5, 1 / Math.max(0.4, cos));
    out[i * 2] = ux * scale;
    out[i * 2 + 1] = uz * scale;
  }
  // Which way is out? Measure it. A ring offset outwards encloses more area than the original.
  const test = offsetWith(points, out, 0.25);
  if (polygonArea(test) < polygonArea(points)) {
    for (let i = 0; i < out.length; i++) out[i] = -out[i];
  }
  return out;
}

function norm2(x: number, z: number): [number, number] {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
}

function offsetWith(points: number[], normals: number[], d: number): number[] {
  const out = new Array<number>(points.length);
  for (let i = 0; i < points.length; i += 2) {
    out[i] = points[i] + normals[i] * d;
    out[i + 1] = points[i + 1] + normals[i + 1] * d;
  }
  return out;
}

/** Cumulative arclength around the outline, in metres, for the wall's u coordinate. */
function arcLengths(points: number[]): number[] {
  const n = points.length / 2;
  const out = new Array<number>(n + 1);
  out[0] = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    out[i + 1] =
      out[i] + Math.hypot(points[j * 2] - points[i * 2], points[j * 2 + 1] - points[i * 2 + 1]);
  }
  return out;
}

/**
 * Build one basin.
 *
 * Local space: the deck is y = 0, the coping stands `copingRise` above it, the water sits
 * `freeboard` below the top of the coping and the floor is at `−depth`.
 */
export function buildPool(input: PoolBuildInput): PoolBuild {
  const { shape, tile, edge, size, maxDepth, freeboard, seed } = input;
  const b = new SurfaceBuilder();
  const outline = outlinePoints(shape, size);
  const n = outline.length / 2;
  const normals = outwardNormals(outline);
  const arc = arcLengths(outline);
  const hx = size[0] / 2;
  const hz = size[1] / 2;
  const depth: PoolDepthSpec = { ...shape.depth, max: maxDepth };
  // The deck falls away from the pool at 1.5 %, and it falls to GRADE rather than below it — the
  // outer edge has to meet the untouched ground, or the terrain pokes through the paving there.
  // So the pool's own rim stands a deck-fall above zero, which is what a real pool does too: the
  // coping is the high point and everything drains away from it.
  const deckFall = edge.deck === 'none' ? 0 : 0.015 * Math.max(0, edge.deckWidth);
  const rimY = rimHeight(edge);
  const waterY = rimY - freeboard;
  const waterlineTint = hexToLinear(tile.waterline);

  const depthAt = (x: number, z: number): number => Math.max(0, depthAtUnit(depth, x / hx, z / hz));

  // ── the floor ─────────────────────────────────────────────────────────────────────────────
  //
  // A polar grid from the centroid. The normal is the analytic gradient of the depth field, not
  // the triangle's own: the shading then follows the real slope, and a floor drawn with six rings
  // shades like one drawn with sixty.
  const rings = Math.max(3, Math.round(4 + input.detail * 4));
  const floor = b.surface('tile');
  const floorIndex: number[][] = [];
  const centreDepth = depthAt(0, 0);
  const centre = b.vertex(floor, [0, -centreDepth, 0], floorNormal(depthAt, 0, 0), [0, 0], WHITE);
  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    const row: number[] = [];
    for (let i = 0; i < n; i++) {
      const x = outline[i * 2] * t;
      const z = outline[i * 2 + 1] * t;
      const d = depthAt(x, z);
      // Ambient occlusion in the corner where the floor meets the wall. The pool's own shadowing
      // is the only thing that stops a tiled box reading as a lightbox.
      const ao = mix(0.66, 1, smoothstep(1, 0.78, t));
      row.push(b.vertex(floor, [x, -d, z], floorNormal(depthAt, x, z), [x, z], [ao, ao, ao]));
    }
    floorIndex.push(row);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // The fan at the centre. Winding: seen from above, the outward normal is +Y with this order.
    b.tri(floor, centre, floorIndex[0][j], floorIndex[0][i]);
  }
  for (let r = 0; r + 1 < rings; r++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      b.quad(floor, floorIndex[r][i], floorIndex[r][j], floorIndex[r + 1][j], floorIndex[r + 1][i]);
    }
  }

  // ── the wall ──────────────────────────────────────────────────────────────────────────────
  //
  // Rows at fixed heights so the waterline band has its own edge: rim, just above the water, the
  // water itself, the bottom of the band, and then down to the floor. Where the floor has risen to
  // meet the rim (a zero-entry beach) the rows collapse and the strip disappears on its own.
  const wall = b.surface('tile');
  const bandTop = waterY + 0.06;
  const bandBottom = waterY - 0.2;
  const wallRows = Math.max(2, Math.round(2 + input.detail * 2));
  const previous: number[] = [];
  const current: number[] = [];
  const firstColumn: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = outline[i * 2];
    const z = outline[i * 2 + 1];
    const nx = -normals[i * 2];
    const nz = -normals[i * 2 + 1];
    const floorY = -depthAt(x, z);
    const u = arc[i];
    const column: Array<[number, [number, number, number]]> = [];
    const push = (y: number, tint: [number, number, number]) => {
      if (y < floorY - 0.001) return;
      column.push([Math.max(y, floorY), tint]);
    };
    push(rimY, WHITE);
    push(bandTop, WHITE);
    push(bandTop - 0.001, waterlineTint);
    push(bandBottom, waterlineTint);
    push(bandBottom - 0.001, WHITE);
    for (let k = 1; k <= wallRows; k++) {
      push(mix(bandBottom - 0.001, floorY, k / wallRows), WHITE);
    }
    current.length = 0;
    for (const [y, tint] of column) {
      current.push(b.vertex(wall, [x, y, z], [nx, 0, nz], [u, -y], tint));
    }
    if (i > 0 && previous.length === current.length) {
      for (let k = 0; k + 1 < current.length; k++) {
        b.quad(wall, previous[k], current[k], current[k + 1], previous[k + 1]);
      }
    }
    if (i === 0) {
      // Remember the first column so the strip closes on itself at the end.
      firstColumn.length = 0;
      for (const v of current) firstColumn.push(v);
    }
    previous.length = 0;
    for (const v of current) previous.push(v);
    if (i === n - 1 && previous.length === firstColumn.length) {
      for (let k = 0; k + 1 < previous.length; k++) {
        b.quad(wall, previous[k], firstColumn[k], firstColumn[k + 1], previous[k + 1]);
      }
    }
  }

  // ── the coping ────────────────────────────────────────────────────────────────────────────
  if (edge.coping !== 'none' && edge.copingWidth > 0.02) {
    const coping = b.surface('coping');
    const w = edge.copingWidth;
    // Cross-section, as (outward offset, height). A rolled edge dips at the lip and again at the
    // back so it reads as a bullnose; a deck-level channel is a slot in the paving.
    const section: Array<[number, number]> =
      edge.coping === 'rolled'
        ? [
            [0, rimY - 0.045],
            [w * 0.14, rimY],
            [w * 0.82, rimY],
            [w, rimY - 0.02],
          ]
        : edge.coping === 'deck-level'
          ? [
              [0, rimY],
              [w * 0.22, rimY - 0.055],
              [w * 0.74, rimY - 0.055],
              [w, rimY],
            ]
          : [
              [0, rimY],
              [w * 0.12, rimY],
              [w * 0.88, rimY],
              [w, rimY],
            ];
    const rows: number[][] = [];
    for (const [d, y] of section) {
      const ring = offsetWith(outline, normals, d);
      const row: number[] = [];
      for (let i = 0; i < n; i++) {
        const x = ring[i * 2];
        const z = ring[i * 2 + 1];
        // A grate channel is in shadow; the top of a coping stone is the brightest thing here.
        const shade = edge.coping === 'deck-level' && y < rimY - 0.01 ? 0.45 : 1;
        row.push(b.vertex(coping, [x, y, z], [0, 1, 0], [x, z], [shade, shade, shade]));
      }
      rows.push(row);
    }
    for (let r = 0; r + 1 < rows.length; r++) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        b.quad(coping, rows[r][i], rows[r][j], rows[r + 1][j], rows[r + 1][i]);
      }
    }
    // The coping's outer face, down to the deck's inner edge.
    if (rimY - deckFall > 0.005) {
      const outerRing = offsetWith(outline, normals, w);
      const top: number[] = [];
      const bottom: number[] = [];
      for (let i = 0; i < n; i++) {
        const x = outerRing[i * 2];
        const z = outerRing[i * 2 + 1];
        const nx = normals[i * 2];
        const nz = normals[i * 2 + 1];
        top.push(b.vertex(coping, [x, rimY - 0.02, z], [nx, 0, nz], [arc[i], 0], WHITE));
        bottom.push(
          b.vertex(coping, [x, deckFall, z], [nx, 0, nz], [arc[i], rimY], [0.8, 0.8, 0.8])
        );
      }
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        b.quad(coping, top[i], bottom[i], bottom[j], top[j]);
      }
    }
  }

  // ── the deck ──────────────────────────────────────────────────────────────────────────────
  const copingOuter = edge.coping === 'none' ? 0 : edge.copingWidth;
  const deckWidth = Math.max(0, edge.deckWidth);
  if (edge.deck !== 'none' && deckWidth > 0.2) {
    const deck = b.surface('deck');
    const steps = 3;
    const rows: number[][] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const d = copingOuter + deckWidth * t;
      // 1.5 % away from the pool, and the whole ring stands `DECK_LIFT` proud of the surrounding
      // ground. Laid exactly ON grade the paving z-fights the turf along its entire outer edge —
      // measured, and it reads as a ring of flickering grass rather than as a fault.
      const y = DECK_LIFT + deckFall * (1 - t);
      const ring = offsetWith(outline, normals, d);
      const row: number[] = [];
      for (let i = 0; i < n; i++) {
        row.push(
          b.vertex(
            deck,
            [ring[i * 2], y, ring[i * 2 + 1]],
            [0, 1, 0],
            [ring[i * 2], ring[i * 2 + 1]],
            WHITE
          )
        );
      }
      rows.push(row);
    }
    for (let r = 0; r + 1 < rows.length; r++) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        b.quad(deck, rows[r][i], rows[r][j], rows[r + 1][j], rows[r + 1][i]);
      }
    }
    // A skirt at the outer edge, buried in the ground, so the deck never shows a floating rim on
    // terrain that is not perfectly flat.
    const outerRing = offsetWith(outline, normals, copingOuter + deckWidth);
    const top: number[] = [];
    const bottom: number[] = [];
    // Deep enough to hide the excavation ramp under the deck whatever the terrain does there
    // (see excavate.ts): the pit floor is `maxDepth + 0.9` down and the skirt clears it.
    const skirtY = DECK_LIFT;
    const skirtDrop = maxDepth + 1.6;
    for (let i = 0; i < n; i++) {
      const x = outerRing[i * 2];
      const z = outerRing[i * 2 + 1];
      const nx = normals[i * 2];
      const nz = normals[i * 2 + 1];
      top.push(b.vertex(deck, [x, skirtY, z], [nx, 0, nz], [arc[i], 0], WHITE));
      bottom.push(
        b.vertex(
          deck,
          [x, skirtY - skirtDrop, z],
          [nx, 0, nz],
          [arc[i], skirtDrop],
          [0.42, 0.42, 0.42]
        )
      );
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      b.quad(deck, top[i], bottom[i], bottom[j], top[j]);
    }
  }

  // ── getting in ────────────────────────────────────────────────────────────────────────────
  const entryPoint = pointAtYaw(outline, shape.entryYaw);
  if (shape.entry === 'corner-steps' || shape.entry === 'roman-steps') {
    buildSteps(b, {
      shape: shape.entry,
      x: entryPoint[0],
      z: entryPoint[1],
      inward: [-entryPoint[2], -entryPoint[3]],
      rimY,
      depthAt,
      width: shape.entry === 'roman-steps' ? Math.min(3.2, size[0] * 0.55) : 2.6,
    });
  }
  if (
    shape.entry === 'ladder' ||
    (edge.rail && shape.entry !== 'beach' && shape.entry !== 'none')
  ) {
    buildHandrails(b, {
      x: entryPoint[0],
      z: entryPoint[1],
      inward: [-entryPoint[2], -entryPoint[3]],
      rimY,
      waterY,
      ladder: shape.entry === 'ladder',
      colour: hexToLinear(edge.railColor),
      floorY: -depthAt(entryPoint[0], entryPoint[1]),
    });
  }

  // ── night: the niches ─────────────────────────────────────────────────────────────────────
  //
  // Emissive recesses set into the wall 600 mm under the surface, every ~6 m of perimeter. They
  // are geometry rather than lights, so every pool has them at any quality preset; the real point
  // lights are a pool of three at most and the main thread hands them to the nearest basins.
  const lights: PoolLightSite[] = [];
  const glow = b.surface('glow');
  const perimeter = arc[n];
  const niches = Math.max(2, Math.min(14, Math.round(perimeter / 6)));
  for (let k = 0; k < niches; k++) {
    const target = ((k + 0.5) / niches) * perimeter;
    let i = 0;
    while (i + 1 < n && arc[i + 1] < target) i++;
    const x = outline[i * 2];
    const z = outline[i * 2 + 1];
    const nx = -normals[i * 2];
    const nz = -normals[i * 2 + 1];
    const floorY = -depthAt(x, z);
    const y = Math.max(floorY + 0.28, waterY - 0.62);
    if (y >= waterY - 0.05) continue;
    // A 360 × 160 mm underwater lamp, sunk 30 mm into the wall.
    const [tx, tz] = norm2(-nz, nx);
    const hw = 0.18;
    const hh = 0.08;
    const px = x + nx * 0.03;
    const pz = z + nz * 0.03;
    const corners: Array<[number, number]> = [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ];
    const ids = corners.map(([a, h]) =>
      b.vertex(glow, [px + tx * a, y + h, pz + tz * a], [nx, 0, nz], [a, h], WHITE)
    );
    b.quad(glow, ids[0], ids[1], ids[2], ids[3]);
    lights.push({ x: px + nx * 0.4, y, z: pz + nz * 0.4, nx, nz });
  }

  // ── the deck's furniture ──────────────────────────────────────────────────────────────────
  const props = layoutDeck(input, outline, normals, copingOuter, deckWidth, seed);

  const { surfaces, triangles } = b.done();
  return { surfaces, outline, lights, props, triangles };
}

/** The floor's normal from the analytic slope of the depth field. */
function floorNormal(
  depthAt: (x: number, z: number) => number,
  x: number,
  z: number
): [number, number, number] {
  const h = 0.35;
  const dx = (depthAt(x + h, z) - depthAt(x - h, z)) / (2 * h);
  const dz = (depthAt(x, z + h) - depthAt(x, z - h)) / (2 * h);
  const l = Math.hypot(dx, 1, dz) || 1;
  return [dx / l, 1 / l, dz / l];
}

/** The outline point nearest a direction, plus its outward normal. Returns `[x, z, nx, nz]`. */
function pointAtYaw(outline: number[], yaw: number): [number, number, number, number] {
  const n = outline.length / 2;
  const wx = Math.cos(yaw);
  const wz = Math.sin(yaw);
  let best = -Infinity;
  let bi = 0;
  for (let i = 0; i < n; i++) {
    const l = Math.hypot(outline[i * 2], outline[i * 2 + 1]) || 1;
    const dot = (outline[i * 2] / l) * wx + (outline[i * 2 + 1] / l) * wz;
    if (dot > best) {
      best = dot;
      bi = i;
    }
  }
  const x = outline[bi * 2];
  const z = outline[bi * 2 + 1];
  const l = Math.hypot(x, z) || 1;
  return [x, z, x / l, z / l];
}

interface StepsInput {
  shape: 'corner-steps' | 'roman-steps';
  x: number;
  z: number;
  inward: [number, number];
  rimY: number;
  depthAt: (x: number, z: number) => number;
  width: number;
}

/**
 * Steps into the water: 250 mm risers, 350 mm treads, the first one already submerged.
 *
 * `roman-steps` are the semicircular set a whirlpool and a hotel pool have, drawn as arcs of
 * decreasing radius; `corner-steps` are the straight run of a municipal bath.
 */
function buildSteps(b: SurfaceBuilder, s: StepsInput): void {
  const surface = b.surface('tile');
  const rise = 0.25;
  const tread = 0.36;
  const [ix, iz] = norm2(s.inward[0], s.inward[1]);
  const [tx, tz] = norm2(-iz, ix);
  const floorY = -s.depthAt(s.x + ix * 1.2, s.z + iz * 1.2);
  const count = Math.max(2, Math.min(5, Math.round((s.rimY - floorY) / rise)));
  const shade: [number, number, number] = [0.92, 0.92, 0.92];

  for (let k = 0; k < count; k++) {
    const y = s.rimY - rise * (k + 1);
    const d0 = tread * k;
    const d1 = tread * (k + 1);
    const halfA = s.shape === 'roman-steps' ? s.width / 2 - k * 0.18 : s.width / 2;
    const halfB = s.shape === 'roman-steps' ? s.width / 2 - (k + 1) * 0.18 : s.width / 2;
    if (halfB <= 0.3) break;
    const p = (d: number, half: number, side: number): [number, number, number] => [
      s.x + ix * d + tx * half * side,
      y,
      s.z + iz * d + tz * half * side,
    ];
    // The tread.
    const a = b.vertex(surface, p(d0, halfA, -1), [0, 1, 0], [d0, -halfA], shade);
    const bb = b.vertex(surface, p(d0, halfA, 1), [0, 1, 0], [d0, halfA], shade);
    const c = b.vertex(surface, p(d1, halfB, 1), [0, 1, 0], [d1, halfB], shade);
    const d = b.vertex(surface, p(d1, halfB, -1), [0, 1, 0], [d1, halfB], shade);
    b.quad(surface, a, d, c, bb);
    // The riser under its leading edge, facing back out of the pool.
    const yb = y - rise;
    const e = b.vertex(surface, p(d1, halfB, -1), [-ix, 0, -iz], [d1, -y], WHITE);
    const f = b.vertex(surface, p(d1, halfB, 1), [-ix, 0, -iz], [d1, -y], WHITE);
    const g = b.vertex(
      surface,
      [s.x + ix * d1 + tx * halfB, yb, s.z + iz * d1 + tz * halfB],
      [-ix, 0, -iz],
      [d1, -yb],
      WHITE
    );
    const h = b.vertex(
      surface,
      [s.x + ix * d1 - tx * halfB, yb, s.z + iz * d1 - tz * halfB],
      [-ix, 0, -iz],
      [d1, -yb],
      WHITE
    );
    b.quad(surface, e, h, g, f);
    // The two flanks, so a step is a solid and not a card seen edge-on.
    for (const side of [-1, 1]) {
      const nx = tx * side;
      const nz = tz * side;
      const v0 = b.vertex(surface, p(d0, halfA, side), [nx, 0, nz], [d0, -y], shade);
      const v1 = b.vertex(surface, p(d1, halfB, side), [nx, 0, nz], [d1, -y], shade);
      const v2 = b.vertex(
        surface,
        [s.x + ix * d1 + tx * halfB * side, yb, s.z + iz * d1 + tz * halfB * side],
        [nx, 0, nz],
        [d1, -yb],
        shade
      );
      const v3 = b.vertex(
        surface,
        [s.x + ix * d0 + tx * halfA * side, yb, s.z + iz * d0 + tz * halfA * side],
        [nx, 0, nz],
        [d0, -yb],
        shade
      );
      if (side > 0) b.quad(surface, v0, v1, v2, v3);
      else b.quad(surface, v0, v3, v2, v1);
    }
  }
}

interface RailInput {
  x: number;
  z: number;
  inward: [number, number];
  rimY: number;
  waterY: number;
  floorY: number;
  ladder: boolean;
  colour: [number, number, number];
}

/**
 * Stainless handrails, and a ladder where the pool has one.
 *
 * A grab rail on a public pool is a 38 mm tube that rises to about 900 mm above the deck, bends
 * over and runs down into the water. Drawn as a swept tube of six sides — cheap, and it is the one
 * bright metal object at the water's edge, so it is what a night frame catches first.
 */
function buildHandrails(b: SurfaceBuilder, r: RailInput): void {
  const metal = b.surface('metal');
  const [ix, iz] = norm2(r.inward[0], r.inward[1]);
  const [tx, tz] = norm2(-iz, ix);
  const radius = 0.021;
  const sides = 6;

  const tube = (path: Array<[number, number, number]>): void => {
    const rings: number[][] = [];
    for (let k = 0; k < path.length; k++) {
      const p = path[k];
      const q = path[Math.min(k + 1, path.length - 1)];
      const o = path[Math.max(k - 1, 0)];
      const dir = norm3(q[0] - o[0], q[1] - o[1], q[2] - o[2]);
      const up: [number, number, number] = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const side = norm3(
        dir[1] * up[2] - dir[2] * up[1],
        dir[2] * up[0] - dir[0] * up[2],
        dir[0] * up[1] - dir[1] * up[0]
      );
      const other = norm3(
        dir[1] * side[2] - dir[2] * side[1],
        dir[2] * side[0] - dir[0] * side[2],
        dir[0] * side[1] - dir[1] * side[0]
      );
      const ring: number[] = [];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const nx = side[0] * Math.cos(a) + other[0] * Math.sin(a);
        const ny = side[1] * Math.cos(a) + other[1] * Math.sin(a);
        const nz = side[2] * Math.cos(a) + other[2] * Math.sin(a);
        ring.push(
          b.vertex(
            metal,
            [p[0] + nx * radius, p[1] + ny * radius, p[2] + nz * radius],
            [nx, ny, nz],
            [k * 0.3, s / sides],
            r.colour
          )
        );
      }
      rings.push(ring);
    }
    for (let k = 0; k + 1 < rings.length; k++) {
      for (let s = 0; s < sides; s++) {
        const t = (s + 1) % sides;
        b.quad(metal, rings[k][s], rings[k][t], rings[k + 1][t], rings[k + 1][s]);
      }
    }
  };

  for (const side of [-1, 1]) {
    const ox = r.x + tx * 0.62 * side - ix * 0.42;
    const oz = r.z + tz * 0.62 * side - iz * 0.42;
    tube([
      [ox, r.rimY + 0.0, oz],
      [ox, r.rimY + 0.72, oz],
      [ox + ix * 0.16, r.rimY + 0.94, oz + iz * 0.16],
      [ox + ix * 0.52, r.rimY + 0.98, oz + iz * 0.52],
      [ox + ix * 0.86, r.rimY + 0.62, oz + iz * 0.86],
      [ox + ix * 0.98, r.waterY - 0.35, oz + iz * 0.98],
    ]);
  }

  if (r.ladder) {
    const bottom = Math.max(r.floorY + 0.1, r.waterY - 1.1);
    for (const side of [-1, 1]) {
      const ox = r.x + tx * 0.24 * side + ix * 0.3;
      const oz = r.z + tz * 0.24 * side + iz * 0.3;
      tube([
        [ox, r.rimY, oz],
        [ox, bottom, oz],
      ]);
    }
    const rungs = Math.max(2, Math.round((r.rimY - bottom) / 0.3));
    for (let k = 1; k <= rungs; k++) {
      const y = r.rimY - ((r.rimY - bottom) * k) / (rungs + 1);
      tube([
        [r.x - tx * 0.24 + ix * 0.3, y, r.z - tz * 0.24 + iz * 0.3],
        [r.x + tx * 0.24 + ix * 0.3, y, r.z + tz * 0.24 + iz * 0.3],
      ]);
    }
  }
}

function norm3(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

/**
 * Where the furniture stands.
 *
 * Deterministic and order-independent: every candidate is a pure function of the pool's seed and
 * its own index, so a rebuild triggered by a terrain edit puts every lounger back where it was.
 * Candidates are rejected against their neighbours' declared clearance, which is what stops two
 * parasols sharing a square metre on a narrow deck.
 */
function layoutDeck(
  input: PoolBuildInput,
  outline: number[],
  normals: number[],
  copingOuter: number,
  deckWidth: number,
  seed: number
): PoolBuild['props'] {
  const items = input.deckItems;
  const out: PoolBuild['props'] = [];
  if (!items.length || deckWidth < 1.2 || input.deckDensity <= 0) return out;
  const n = outline.length / 2;
  const arc = arcLengths(outline);
  const perimeter = arc[n];
  const deckArea = perimeter * deckWidth;
  const wanted = Math.min(64, Math.round((deckArea / 100) * input.deckDensity));
  if (wanted <= 0) return out;

  const totalWeight = items.reduce((s, i) => s + Math.max(0, i.weight), 0) || 1;
  const placed: Array<{ x: number; z: number; clearance: number }> = [];
  // Four times as many candidates as slots: a rejected one is cheap, and without the surplus a
  // narrow deck ends up with a third of the furniture it asked for.
  for (let k = 0; k < wanted * 4 && placed.length < wanted; k++) {
    const r1 = hash2(k, 1, seed);
    const r2 = hash2(k, 2, seed);
    const r3 = hash2(k, 3, seed);
    const target = r1 * perimeter;
    let i = 0;
    while (i + 1 < n && arc[i + 1] < target) i++;
    const j = (i + 1) % n;
    const f = arc[i + 1] > arc[i] ? (target - arc[i]) / (arc[i + 1] - arc[i]) : 0;
    const px = mix(outline[i * 2], outline[j * 2], f);
    const pz = mix(outline[i * 2 + 1], outline[j * 2 + 1], f);
    const nx = mix(normals[i * 2], normals[j * 2], f);
    const nz = mix(normals[i * 2 + 1], normals[j * 2 + 1], f);
    const [ux, uz] = norm2(nx, nz);
    // Loungers stand back from the edge; the walkway next to the water stays clear.
    const off = copingOuter + 0.9 + r2 * Math.max(0.2, deckWidth - 1.6);
    const x = px + ux * off;
    const z = pz + uz * off;

    let pick = r3 * totalWeight;
    let item = items[0];
    for (const candidate of items) {
      pick -= Math.max(0, candidate.weight);
      if (pick <= 0) {
        item = candidate;
        break;
      }
    }
    let clear = true;
    for (const p of placed) {
      const need = Math.max(p.clearance, item.clearance) * 0.5;
      if ((p.x - x) ** 2 + (p.z - z) ** 2 < need * need) {
        clear = false;
        break;
      }
    }
    if (!clear) continue;
    placed.push({ x, z, clearance: item.clearance });
    // Loungers face the water; everything else takes a quarter turn off it so a row is not a wall.
    const facing = Math.atan2(-uz, -ux);
    const jitter = (hash2(k, 4, seed) - 0.5) * (item.shape === 'lounger' ? 0.22 : Math.PI);
    out.push({
      shape: item.shape,
      x,
      z,
      yaw: facing + jitter,
      scale: 0.94 + hash2(k, 5, seed) * 0.12,
      item,
    });
  }
  return out;
}
