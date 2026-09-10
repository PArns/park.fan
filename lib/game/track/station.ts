/**
 * The station: the one part of a coaster a guest stands on, and the part this module drew nothing
 * of for its whole existence.
 *
 * `station` already meant something here — an extrusion sample along the spline (`profile.ts`) —
 * so nobody noticed that the boarding station did not exist. Photographed from 48 m on the demo
 * park's `kleiner-kreisel`, two trains stood on bare track: no platform, no roof, no railing, no
 * edge to step off. `flumes` next to it draws a tower, a deck and a shade roof, which is what made
 * the gap obvious in one frame.
 *
 * ## The reference, before the code
 *
 * A European park station — Taron and Winja's at Phantasialand, Wodan at Europa-Park, Baron 1898
 * at the Efteling — is four things, and only the first two are load-bearing for the silhouette:
 *
 * 1. **Two decks, one either side of the track**, floor level within a few centimetres of the
 *    train's own floor so a rider steps ACROSS rather than up or down. **The spline IS the
 *    rider's path** (`trains/types.ts`: the rails are drawn `HEARTLINE_HEIGHT` BELOW it), so the
 *    deck is `DECK_BELOW_SEAT` under the spline and not under the rails. Getting that wrong put
 *    the first version's platform 2.05 m below a seated rider, i.e. a metre of climb down onto it.
 * 2. **A flat canopy on posts**, and its height is set by the RIDER and not by the platform. A
 *    person standing on the deck wants 2.4-2.8 m; a rider sitting in the train with their arms up
 *    reaches about 1.6 m above the seat, which is higher — the first version measured 2.6 m off
 *    the deck and put the soffit 0.73 m over the heartline, through the heads of everyone in the
 *    train. `RIDER_HEADROOM` is measured off the spline for that reason, and the platform gets
 *    whatever that leaves it (3.0 m, which is what a real station has anyway).
 * 3. Air gates at the deck edge, which are per-seat and far below the resolution this draws at.
 *    A continuous low rail along the OUTER edge stands in for them: it is what the eye reads as
 *    "you cannot walk off the side", and it is 40 quads instead of 400.
 * 4. Theming, which belongs to a scenery pack and not to this file.
 *
 * ## What it is built from
 *
 * The spline over the `station` drive section, and nothing else. Every vertex is placed from a
 * `TrackFrame`'s `p`, `right` and a WORLD up — not the frame's `up`. That is deliberate: a station
 * straight is level and unbanked by construction, but a layout that banks through it would
 * otherwise tilt the platform a guest is standing on, and a tilted floor is a bug that only shows
 * up in a screenshot of somebody else's layout. The deck follows the track's heading and stays
 * level.
 *
 * Three groups, so a caller can give each its own material: `deck` (concrete), `structure` (posts
 * and canopy, painted with the track) and `rail` (steel).
 */

import type { Geo } from './profile';
import type { TrackSpline } from './spline';
import type { DriveSection } from './types';

export interface StationBuild {
  /** The two platform decks. */
  deck: Geo;
  /** Posts and canopy. */
  structure: Geo;
  /** The outer railing. */
  rail: Geo;
  /** Metres of platform actually built — 0 when the layout has no station section. */
  length: number;
  /** World centre of the platform, for a camera or a label. */
  centre: [number, number, number] | null;
}

/**
 * Metres the deck sits below the SPLINE, which is the seat and not the rail.
 *
 * A car floor sits about 0.3 m over the rail plane and a seat about 0.5 m over that, so a platform
 * level with the floor is roughly 0.8 m under the rider. Any more and a rider climbs down onto it.
 */
const DECK_BELOW_SEAT = 0.8;
/**
 * Half-width of the slot the train runs in.
 *
 * `carWidth` is 1.85 m on the bundled trains, so 0.925 of car; 1.25 leaves a 32 cm step across,
 * which is the gap a real platform has (they fill it with a rubber lip nobody models at this
 * scale) and is wide enough that a lap bar swinging up does not clip the deck.
 */
const SLOT_HALF = 1.25;
/** How far out from the slot each deck reaches. */
const DECK_WIDTH = 2.4;
/** Deck slab thickness. */
const DECK_THICK = 0.22;
/**
 * Clear height under the canopy, measured from the SPLINE — see the docblock's point 2.
 *
 * A rider sitting in the train with their arms up reaches roughly 1.6 m over the seat. 2.2 clears
 * that by 60 cm and leaves the platform 3.0 m, which is a real station's ceiling.
 */
const RIDER_HEADROOM = 2.2;
/**
 * What `RIDER_HEADROOM` leaves over the platform: 3.0 m, since the deck is 0.8 m under the seat.
 *
 * Not a constant this file reads — it is the selftest's threshold, and it lives there rather than
 * here so nothing can quietly satisfy it by importing it.
 */
const CANOPY_THICK = 0.18;
/** The canopy oversails the deck edge by this much, which is what keeps the rain off it. */
const CANOPY_OVERHANG = 0.35;
const POST_HALF = 0.09;
/** Metres between posts along the platform. Real stations run 3-4 m bays. */
const POST_SPACING = 3.4;
const RAIL_HEIGHT = 1.05;
const RAIL_THICK = 0.05;
/** Below this the section is a marker, not a platform, and nothing is drawn. */
const MIN_STATION_LENGTH = 4;

type V3 = [number, number, number];

function emptyGeo(): Geo {
  return { positions: [], normals: [], uvs: [], indices: [] };
}

/**
 * One quad, wound so `a → b → c → d` is counter-clockwise seen from the side the normal points at.
 *
 * Two things are computed here rather than passed in, and both were bugs the first time.
 *
 * The **normal** comes from the corners, because every caller below would otherwise have to get
 * it right twice and a flipped normal on a PBR material is a black face — which is exactly what
 * the decks were, 144 of 144 top faces pointing at the ground.
 *
 * The **UVs are in METRES**, which is the contract `materials.ts` states in as many words ("the
 * UVs are authored in metres") and applies as `uScale = 0.8` tiles per metre. A 0-to-1 UV per
 * quad — the obvious thing to write, and what shipped first — stretches the albedo, the normal
 * map and the ORM map across the whole face. Each quad restarts at 0, which is a seam every ring;
 * the maps here are tiling noise, so what matters is the scale and not the continuity.
 *
 * And the **winding is the opposite of the normal**, which is the third time this repository has
 * paid for that. `paths/mesh.ts` writes it down as `FRONT_FACE_SIGN = -1` and `terrain/chunks.ts`
 * records what it looks like — in this scene (`useRightHandedSystem = true`, and Babylon's default
 * side orientation flips with it) a FRONT-facing triangle is wound so that
 * `cross(v1 - v0, v2 - v0)` points AWAY from the visible side. Emitting `a,b,c / a,c,d`, which is
 * the intuitive order and matches the normal, back-face culls the whole thing: the canopy showed
 * its own soffit from above and read as a black slab, at 2.3x darker than the same material on a
 * post beside it. The vertex normals were right the whole time and a test that only checks them
 * cannot see this — which is why the selftest checks the emitted index order against the normal.
 */
function quad(geo: Geo, a: V3, b: V3, c: V3, d: V3): void {
  const base = geo.positions.length / 3;
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = d[0] - a[0];
  const vy = d[1] - a[1];
  const vz = d[2] - a[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l;
  ny /= l;
  nz /= l;
  const uLen = Math.hypot(ux, uy, uz);
  const vLen = Math.hypot(vx, vy, vz);
  for (const p of [a, b, c, d]) geo.positions.push(p[0], p[1], p[2]);
  for (let i = 0; i < 4; i++) geo.normals.push(nx, ny, nz);
  geo.uvs.push(0, 0, uLen, 0, uLen, vLen, 0, vLen);
  // `a, c, b` and `a, d, c`: the front-face order for this scene. See the docblock.
  geo.indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
}

/**
 * A box given its four bottom corners in order and a height, closed on all six faces.
 *
 * Corners rather than a centre and a half-extent, because everything here is oriented to the
 * track's heading and an axis-aligned box would only be right on a station that happens to run
 * north-south.
 */
function prism(geo: Geo, base: [V3, V3, V3, V3], height: number): void {
  const [a, b, c, d] = base;
  const up = (p: V3): V3 => [p[0], p[1] + height, p[2]];
  const [a2, b2, c2, d2] = [up(a), up(b), up(c), up(d)];
  quad(geo, a2, b2, c2, d2); // top
  quad(geo, d, c, b, a); // bottom
  quad(geo, a, b, b2, a2);
  quad(geo, b, c, c2, b2);
  quad(geo, c, d, d2, c2);
  quad(geo, d, a, a2, d2);
}

export interface StationOptions {
  /** Ground height under a world point, so a post reaches the floor rather than hanging. */
  ground: (x: number, z: number) => number;
}

/**
 * Build the platform for the FIRST `station` section in `drives`.
 *
 * One and not all of them: a layout with two station sections is a transfer track or a second
 * load platform, and neither is something this module can tell apart from the drive list alone.
 * A layout with none — the showcase's open test pieces — gets an empty build and no warning,
 * because a piece of track with no station is a legitimate thing to draw.
 */
export function buildStation(
  spline: TrackSpline,
  drives: readonly DriveSection[],
  options: StationOptions
): StationBuild {
  const build: StationBuild = {
    deck: emptyGeo(),
    structure: emptyGeo(),
    rail: emptyGeo(),
    length: 0,
    centre: null,
  };
  const section = drives.find((d) => d.kind === 'station');
  if (!section) return build;
  const length = section.to - section.from;
  if (!(length >= MIN_STATION_LENGTH)) return build;

  // One ring per metre is finer than a straight needs and is what keeps a station on a gentle
  // curve from faceting; a 24 m platform is 25 rings, i.e. a few hundred triangles for the decks.
  const steps = Math.max(2, Math.round(length));
  const rings: Array<{ p: V3; right: V3 }> = [];
  for (let i = 0; i <= steps; i++) {
    const f = spline.frameAt(section.from + (length * i) / steps);
    // World up, not `f.up` — see the file docblock.
    const rx = f.right[0];
    const rz = f.right[2];
    const rl = Math.hypot(rx, rz) || 1;
    rings.push({ p: [f.p[0], f.p[1], f.p[2]], right: [rx / rl, 0, rz / rl] });
  }

  const deckY = (p: V3) => p[1] - DECK_BELOW_SEAT;
  /** Underside of the canopy: off the rider, never off the deck. */
  const canopyY = (p: V3) => p[1] + RIDER_HEADROOM;
  const at = (r: { p: V3; right: V3 }, offset: number, y: number): V3 => [
    r.p[0] + r.right[0] * offset,
    y,
    r.p[2] + r.right[2] * offset,
  ];

  // ── the two decks ─────────────────────────────────────────────────────────────────────────
  for (const side of [-1, 1] as const) {
    const inner = side * SLOT_HALF;
    const outer = side * (SLOT_HALF + DECK_WIDTH);
    for (let i = 0; i < steps; i++) {
      const a = rings[i];
      const b = rings[i + 1];
      const ya = deckY(a.p);
      const yb = deckY(b.p);
      // Top, then the outer and inner fascias, so the slab reads as a slab from the side.
      const topA = at(a, inner, ya);
      const topB = at(b, inner, yb);
      const topC = at(b, outer, yb);
      const topD = at(a, outer, ya);
      // Both sides face UP, and the winding differs because `outer` is on the other side of
      // `inner`: the cross product that `quad` takes flips with it. The first version had the two
      // branches the wrong way round and every deck face in the game pointed at the ground —
      // measured, 144 of 144 top normals at -Y, which renders as a black slab lit from below.
      if (side > 0) quad(build.deck, topA, topB, topC, topD);
      else quad(build.deck, topD, topC, topB, topA);
      const drop = (o: number, flip: boolean) => {
        const p1 = at(a, o, ya);
        const p2 = at(b, o, yb);
        const p3 = at(b, o, yb - DECK_THICK);
        const p4 = at(a, o, ya - DECK_THICK);
        if (flip) quad(build.deck, p4, p3, p2, p1);
        else quad(build.deck, p1, p2, p3, p4);
      };
      drop(inner, side > 0);
      drop(outer, side < 0);
    }
  }

  // ── posts and canopy ──────────────────────────────────────────────────────────────────────
  const bays = Math.max(1, Math.round(length / POST_SPACING));
  for (let bay = 0; bay <= bays; bay++) {
    const t = bay / bays;
    const idx = Math.min(steps, Math.round(t * steps));
    const r = rings[idx];
    const deck = deckY(r.p);
    for (const side of [-1, 1] as const) {
      const o = side * (SLOT_HALF + DECK_WIDTH - 0.3);
      const c = at(r, o, 0);
      const foot = options.ground(c[0], c[2]);
      // A post starts at whichever is lower, the deck's underside or the ground: on a raised
      // station the deck is metres up and the post has to reach the floor, on a station cut into
      // a slope the ground can be ABOVE the deck's soffit and a post from the ground would grow
      // through the platform.
      const bottom = Math.min(foot, deck - DECK_THICK);
      const top = canopyY(r.p);
      const f = r.right;
      const tx = -f[2];
      const tz = f[0];
      const corner = (dr: number, dt: number): V3 => [
        c[0] + f[0] * dr + tx * dt,
        bottom,
        c[2] + f[2] * dr + tz * dt,
      ];
      prism(
        build.structure,
        [
          corner(-POST_HALF, -POST_HALF),
          corner(POST_HALF, -POST_HALF),
          corner(POST_HALF, POST_HALF),
          corner(-POST_HALF, POST_HALF),
        ],
        top - bottom
      );
    }
  }
  // The canopy is one slab over the whole platform, following the rings so a curved station gets a
  // curved roof rather than a straight one crossing the track.
  for (let i = 0; i < steps; i++) {
    const a = rings[i];
    const b = rings[i + 1];
    const ya = canopyY(a.p);
    const yb = canopyY(b.p);
    const reach = SLOT_HALF + DECK_WIDTH + CANOPY_OVERHANG;
    const top: [V3, V3, V3, V3] = [
      at(a, -reach, ya + CANOPY_THICK),
      at(b, -reach, yb + CANOPY_THICK),
      at(b, reach, yb + CANOPY_THICK),
      at(a, reach, ya + CANOPY_THICK),
    ];
    quad(build.structure, top[0], top[1], top[2], top[3]);
    quad(build.structure, at(a, reach, ya), at(b, reach, yb), at(b, -reach, yb), at(a, -reach, ya));
    for (const side of [-1, 1] as const) {
      const o = side * reach;
      const p1 = at(a, o, ya);
      const p2 = at(b, o, yb);
      const p3 = at(b, o, yb + CANOPY_THICK);
      const p4 = at(a, o, ya + CANOPY_THICK);
      if (side > 0) quad(build.structure, p1, p2, p3, p4);
      else quad(build.structure, p4, p3, p2, p1);
    }
  }

  // ── the outer railing ─────────────────────────────────────────────────────────────────────
  for (const side of [-1, 1] as const) {
    const o = side * (SLOT_HALF + DECK_WIDTH - 0.06);
    for (let i = 0; i < steps; i++) {
      const a = rings[i];
      const b = rings[i + 1];
      const ya = deckY(a.p) + RAIL_HEIGHT;
      const yb = deckY(b.p) + RAIL_HEIGHT;
      const inner = -side * RAIL_THICK;
      quad(build.rail, at(a, o, ya), at(b, o, yb), at(b, o + inner, yb), at(a, o + inner, ya));
      quad(
        build.rail,
        at(a, o + inner, ya - RAIL_THICK),
        at(b, o + inner, yb - RAIL_THICK),
        at(b, o, yb - RAIL_THICK),
        at(a, o, ya - RAIL_THICK)
      );
    }
  }

  const mid = rings[Math.floor(rings.length / 2)];
  build.length = length;
  build.centre = [mid.p[0], deckY(mid.p), mid.p[2]];
  return build;
}
