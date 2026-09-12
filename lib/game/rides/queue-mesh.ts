/**
 * The queue you can see: paving, kerb and a handrail along the switchback.
 *
 * Until this file existed `rides` drew **no queue geometry at all** -- a grep for "queue" over
 * `main.ts` and `geometry.ts` returned zero -- so every line in the park was people standing on
 * grass in a serpentine, for flat rides and coasters alike. `shops/build.ts` had already met the
 * same problem and says so in its own docblock ("queue stands on grass, which is what the first
 * render of this module actually showed"); this is that fix at a machine's scale.
 *
 * **It is built from `queue.ts`, never from a second copy of the constants.** The rail has to be
 * round the people rather than near them, and the only way to guarantee that is one formula.
 *
 * **Boxes, not prisms.** `shops` draws its rail as hexagonal prisms and tubes, which is right for
 * eight posts beside a kiosk. A coaster's line is 160 places, i.e. 16 legs and about 200 posts,
 * and at 40 mm of steel seen from a park camera the extra sides are pixels nobody gets. A box
 * post has 12 triangles against a hex prism's 20, and the silhouette -- which is all that survives
 * at this distance -- is the same.
 *
 * **A fixed structure, not a rubber band.** The rail is as long as the line may ever become
 * (`queueSlots(capacity)`), not as long as today's queue, because a park pours its switchback once
 * and it does not shrink when the ride is quiet. That is also what keeps the geometry static: it
 * is built when the machine appears and never rebuilt per tick.
 */

import { QUEUE_CHANNEL, QUEUE_LEAD, QUEUE_PITCH, QUEUE_ROW, queueSlot } from './queue';
import type { Surface } from './shapes';
import { hexToLinear } from './shapes';

/** Metres. The walkable channel is 1.9 m; the paving is a little narrower so a kerb can show. */
const PAVE_HALF = 0.82;
const KERB_HEIGHT = 0.11;
/** Handrail: a top rail at 1.0 m and a mid rail at 0.55 m, posts every 1.5 m. Real park numbers. */
const RAIL_TOP = 1.0;
const RAIL_MID = 0.55;
const RAIL_THICK = 0.045;
const POST_SPACING = 1.5;
const POST_SIDE = 0.06;

const CONCRETE = '#8d8f8c';
const KERB = '#a9aba6';
const METAL = '#3f5d72';

interface Box {
  cx: number;
  cy: number;
  cz: number;
  hx: number;
  hy: number;
  hz: number;
  colour: [number, number, number];
}

/** One axis-aligned box, in the surface's own arrays. Twelve triangles, flat-shaded per face. */
function pushBox(s: Surface, b: Box): void {
  const base = s.positions.length / 3;
  const { cx, cy, cz, hx, hy, hz } = b;
  const faces: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [
    [[0, 1, 0], [hx, 0, 0], [0, 0, hz]],
    [[0, -1, 0], [hx, 0, 0], [0, 0, -hz]],
    [[1, 0, 0], [0, hy, 0], [0, 0, hz]],
    [[-1, 0, 0], [0, hy, 0], [0, 0, -hz]],
    [[0, 0, 1], [hx, 0, 0], [0, hy, 0]],
    [[0, 0, -1], [-hx, 0, 0], [0, hy, 0]],
  ];
  let at = base;
  for (const [n, u, v] of faces) {
    const ox = cx + n[0] * hx;
    const oy = cy + n[1] * hy;
    const oz = cz + n[2] * hz;
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      s.positions.push(ox + u[0] * su + v[0] * sv, oy + u[1] * su + v[1] * sv, oz + u[2] * su + v[2] * sv);
      s.normals.push(n[0], n[1], n[2]);
      s.uvs.push((su + 1) * 0.5, (sv + 1) * 0.5);
      s.colors.push(b.colour[0], b.colour[1], b.colour[2], 1);
    }
    pushQuad(s, at);
    at += 4;
  }
}

function surface(finish: Surface['finish']): Surface {
  return { finish, positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

export interface QueueBuild {
  surfaces: Surface[];
  /** Places the rail was built for, so a report can say what it drew. */
  slots: number;
  triangles: number;
}

/**
 * Build the switchback for one machine.
 *
 * `groundAt` is sampled per leg rather than once, because a queue 30 m wide crosses real terrain
 * and a rail floating over a dip is the thing this file exists to stop being true of the people.
 */
export function buildQueue(
  entrance: readonly [number, number],
  dir: readonly [number, number],
  slots: number,
  groundAt: (x: number, z: number) => number
): QueueBuild {
  const concrete = surface('matte');
  const metal = surface('metal');
  const cConcrete = hexToLinear(CONCRETE);
  const cKerb = hexToLinear(KERB);
  const cMetal = hexToLinear(METAL);

  const count = Math.max(QUEUE_ROW, Math.floor(slots));
  const rows = Math.ceil(count / QUEUE_ROW);
  // The normal of the queue direction: legs run along `dir`, rows step along `n`.
  const nx = dir[1];
  const nz = -dir[0];

  for (let row = 0; row < rows; row++) {
    const first = row * QUEUE_ROW;
    const last = Math.min(count, first + QUEUE_ROW) - 1;
    const a = queueSlot(entrance, dir, row % 2 === 0 ? first : last);
    const b = queueSlot(entrance, dir, row % 2 === 0 ? last : first);
    const mx = (a[0] + b[0]) / 2;
    const mz = (a[1] + b[1]) / 2;
    // Half-length along the leg, plus a place's worth of slack at each end so the paving does not
    // stop under the first and last person's feet.
    const half = (QUEUE_ROW - 1) * QUEUE_PITCH * 0.5 + QUEUE_LEAD;
    const y = groundAt(mx, mz);

    // The slab. Its long axis is `dir`, so it is written as a box oriented by the two vectors.
    pushSlab(concrete, mx, y, mz, dir, half, PAVE_HALF, 0.06, cConcrete);
    // A kerb either side, which is what makes paving read as paving from above.
    for (const side of [-1, 1]) {
      pushSlab(
        concrete,
        mx + nx * side * PAVE_HALF,
        y,
        mz + nz * side * PAVE_HALF,
        dir,
        half,
        0.07,
        KERB_HEIGHT,
        cKerb
      );
    }

    // Handrail on both sides of the leg, posts first, then the two rails.
    const legLen = half * 2;
    const posts = Math.max(2, Math.round(legLen / POST_SPACING) + 1);
    for (const side of [-1, 1]) {
      const ox = nx * side * (PAVE_HALF + 0.04);
      const oz = nz * side * (PAVE_HALF + 0.04);
      for (let i = 0; i < posts; i++) {
        const t = i / (posts - 1) - 0.5;
        const px = mx + dir[0] * t * legLen + ox;
        const pz = mz + dir[1] * t * legLen + oz;
        const py = groundAt(px, pz);
        pushBox(metal, {
          cx: px,
          cy: py + RAIL_TOP / 2,
          cz: pz,
          hx: POST_SIDE / 2,
          hy: RAIL_TOP / 2,
          hz: POST_SIDE / 2,
          colour: cMetal,
        });
      }
      for (const h of [RAIL_TOP, RAIL_MID]) {
        pushSlab(metal, mx + ox, y + h - RAIL_THICK, mz + oz, dir, half, RAIL_THICK / 2, RAIL_THICK, cMetal);
      }
    }
  }

  const surfaces = [concrete, metal].filter((s) => s.indices.length > 0);
  const triangles = surfaces.reduce((n, s) => n + s.indices.length / 3, 0);
  return { surfaces, slots: count, triangles };
}

/** A box whose long axis is `dir` rather than world X — the legs run at the machine's own yaw. */
function pushSlab(
  s: Surface,
  cx: number,
  y: number,
  cz: number,
  dir: readonly [number, number],
  half: number,
  halfWidth: number,
  height: number,
  colour: [number, number, number]
): void {
  const ux = dir[0] * half;
  const uz = dir[1] * half;
  const vx = dir[1] * halfWidth;
  const vz = -dir[0] * halfWidth;
  const base = s.positions.length / 3;
  const corners: Array<[number, number]> = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  // Top face only for a slab this thin: the sides are 6 cm and nothing in this game looks at them
  // from below. A kerb gets its height from the box being lifted, not from drawn walls.
  for (const [su, sv] of corners) {
    s.positions.push(cx + ux * su + vx * sv, y + height, cz + uz * su + vz * sv);
    s.normals.push(0, 1, 0);
    s.uvs.push((su + 1) * 0.5, (sv + 1) * 0.5);
    s.colors.push(colour[0], colour[1], colour[2], 1);
  }
  pushQuad(s, base);
}

/**
 * Index one quad so its FRONT face is the side its vertex normal points at, measured.
 *
 * `scene.useRightHandedSystem = true` and `FRONT_FACE_SIGN = -1`, which means that on a
 * front-facing triangle `cross(v1-v0, v2-v0)` points AWAY from the visible side. Getting that
 * backwards has cost this repository four rounds -- `paths/mesh.ts` writes the sign down,
 * `terrain/chunks.ts` records what it looks like, `track/station.ts` shipped every face inverted
 * with CORRECT vertex normals (which is why a normals check could not see it), and this file's
 * first draft had **448 of 728** triangles facing the wrong way, all of them the posts, while the
 * slabs beside them were right.
 *
 * So it is not written down here either. The order is CHOSEN from the geometry: take the cross
 * product the winding would produce, compare it with the normal the quad already carries, and
 * emit whichever of the two orders puts them in opposition. Build-time only, four multiplies a
 * quad, and it cannot rot when somebody adds a face with a different tangent basis -- which is
 * exactly how the posts went wrong while the slabs stayed right.
 */
function pushQuad(s: Surface, base: number): void {
  const at = (k: number): [number, number, number] => [
    s.positions[k * 3],
    s.positions[k * 3 + 1],
    s.positions[k * 3 + 2],
  ];
  const p0 = at(base);
  const p1 = at(base + 1);
  const p2 = at(base + 2);
  const e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
  const cross = [
    e1[1] * e2[2] - e1[2] * e2[1],
    e1[2] * e2[0] - e1[0] * e2[2],
    e1[0] * e2[1] - e1[1] * e2[0],
  ];
  const dot =
    cross[0] * s.normals[base * 3] +
    cross[1] * s.normals[base * 3 + 1] +
    cross[2] * s.normals[base * 3 + 2];
  if (dot <= 0) s.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  else s.indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
}
