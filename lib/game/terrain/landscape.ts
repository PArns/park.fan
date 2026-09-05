/**
 * The showcase landscape. DOM-free and Babylon-free on purpose: it writes into
 * `world.terrain.heights` / `.paint` before the worker is started, so the main thread and the
 * simulation get the same park without either of them sculpting it twice.
 *
 * It is built to put every claim the module makes in one frame: an escarpment steep enough to
 * trip the cliff rule, a hill for the sun to model, a shoreline for the water table, and a patch
 * of each of the seven paint layers where a camera preset can see it. The `ground` preset stands
 * at (0, 1.7, 120), which is why the shoreline is placed a few metres south of that.
 */

import type { TerrainData } from '../core/types';
import {
  LAYER_CONCRETE,
  LAYER_DIRT,
  LAYER_GRASS,
  LAYER_MEADOW,
  LAYER_ROCK,
  LAYER_SAND,
  LAYER_WOOD,
  sampleNormal,
} from './heightfield';
import { clamp01, fbm2, smoothstep } from './noise';

/** Deck height of the causeway, metres above the water line. */
const JETTY_DECK = 0.95;
const JETTY_X = 12;
const JETTY_HALF_WIDTH = 3;
const JETTY_FROM_Z = 98;
const JETTY_TO_Z = 141;

const PAD_X = 12;
const PAD_Z = 79;
const PAD_HALF_X = 13;
const PAD_HALF_Z = 8;

/** Where the coast runs, as a function of x. */
function shoreZ(x: number, seed: number): number {
  return 100 + 26 * Math.sin(x * 0.0112) + 14 * (fbm2(x, 77, 1 / 130, 3, seed) - 0.5);
}

/** Where the escarpment runs, as a function of x. */
function scarpZ(x: number, seed: number): number {
  return -66 + 16 * Math.sin(x * 0.017) + 44 * (fbm2(x, -400, 1 / 170, 2, seed + 5) - 0.5);
}

/**
 * A landform. The radius is warped by direction and by a noise field, because an unwarped
 * `pow(1 - d/r, p)` is a cone of revolution and reads as one from every camera: the outcrop in the
 * `close` shot was a traffic cone until this took its circular plan away.
 */
function bump(
  x: number,
  z: number,
  cx: number,
  cz: number,
  r: number,
  h: number,
  p: number,
  seed = 0
) {
  const dx = x - cx;
  const dz = z - cz;
  const dist = Math.hypot(dx, dz);
  if (dist >= r * 1.45) return 0;
  const angle = Math.atan2(dz, dx);
  const lobes = 1 + 0.22 * Math.sin(angle * 3 + seed) + 0.13 * Math.sin(angle * 5 - seed * 1.7);
  const warp = 0.82 + 0.36 * fbm2(x, z, 1 / Math.max(12, r * 0.6), 2, seed + 700);
  const d = dist / (r * lobes * warp);
  if (d >= 1) return 0;
  return h * Math.pow(1 - d, p);
}

/** Distance from (x, z) to the worn trail, in metres. */
function trailDistance(x: number, z: number): number {
  let best = 1e9;
  for (let k = 0; k <= 24; k++) {
    const s = k / 24;
    const px = -58 + 96 * s + 24 * Math.sin(s * 4.1);
    const pz = -44 + 92 * s;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) best = d;
  }
  return best;
}

function heightAt(x: number, z: number, seed: number): number {
  // Rolling base, then the coast flattens it out so the beach is not a hillside running into
  // the lake.
  let h = fbm2(x, z, 1 / 230, 4, seed + 1) * 11 - 3.4;
  h += fbm2(x, z, 1 / 61, 3, seed + 2) * 2.6 - 1.3;

  const zs = shoreZ(x, seed);
  const coast = smoothstep(-70, 12, z - zs);
  h = h * (1 - coast) + 1.7 * coast;

  // The escarpment: a step of 13-27 m over 6-13 m of ground, which is 50-75° and well past the
  // cliff threshold the material paints rock at. Both the height and the width vary along x —
  // the first version held both constant and the result read as a retaining wall rather than as
  // a cliff, most obviously from the `ground` preset where the scarp spans the whole frame.
  const zc = scarpZ(x, seed);
  const width = 6 + 7 * fbm2(x, 900, 1 / 90, 2, seed + 3);
  const rise = 13 + 14 * fbm2(x, 1500, 1 / 145, 3, seed + 4);
  h += rise * smoothstep(zc + width, zc - width, z);

  // Two hills on the plateau above the scarp, and one steep outcrop south-west of the origin,
  // which is the direction the `close` preset looks — that shot has to contain a rock face and a
  // meadow at once or nothing in it says the splat is doing anything.
  h += bump(x, z, -74, -168, 108, 33, 1.7, 11);
  h += bump(x, z, 96, -196, 82, 21, 1.8, 29);
  h += bump(x, z, -34, 40, 16, 10.5, 1.55, 53);

  h -= smoothstep(-14, 130, z - zs) * 13;

  // Relief at the scale of the sample grid itself (cells are 2 m). Without it every slope is a
  // smooth analytic surface and the cliff rule draws clean contour rings on it; with it the slope
  // wanders and the rock comes out ragged. Damped right at the waterline (the showcase floods at
  // 0), because a noisy shore turns the lake edge into a fringe of puddles and islands.
  const nearWater = 1 - smoothstep(1.0, 3.5, Math.abs(h));
  h += (fbm2(x, z, 1 / 17, 2, seed + 6) - 0.5) * 1.35 * (1 - 0.75 * nearWater);

  // The lakeside terrace is level, or nothing placed on it later would stand straight.
  const padX = Math.abs(x - PAD_X) - PAD_HALF_X;
  const padZ = Math.abs(z - PAD_Z) - PAD_HALF_Z;
  const padD = Math.max(padX, padZ);
  if (padD < 5) {
    // Fixed, not sampled: the coast pass has already flattened this stretch towards 1.7 m, so a
    // level read off the raw base field would stand two metres proud of its own beach.
    const level = 2.6;
    h += (level - h) * (1 - smoothstep(0, 5, Math.max(0, padD)));
  }

  // The causeway out into the lake: a level deck with sloped flanks the cliff rule turns to stone.
  if (z > JETTY_FROM_Z - 6 && z < JETTY_TO_Z + 6) {
    const alongEnd =
      smoothstep(JETTY_TO_Z, JETTY_TO_Z - 7, z) * smoothstep(JETTY_FROM_Z - 6, JETTY_FROM_Z + 3, z);
    const across = 1 - smoothstep(JETTY_HALF_WIDTH, JETTY_HALF_WIDTH + 4.5, Math.abs(x - JETTY_X));
    const deck = JETTY_DECK + 0.9 * smoothstep(JETTY_TO_Z, JETTY_FROM_Z, z);
    const w = alongEnd * across;
    if (h < deck) h += (deck - h) * w;
  }

  // The trail is worn a little into the ground; without the dip it is a stripe of paint.
  const trail = trailDistance(x, z);
  if (trail < 6) h -= 0.35 * (1 - smoothstep(2.4, 6, trail));

  return h;
}

export interface LandscapeOptions {
  seed: number;
  waterLevel?: number;
}

/** Sculpt and paint `terrain` in place. */
export function generateShowcaseLandscape(t: TerrainData, options: LandscapeOptions): void {
  const seed = options.seed >>> 0;
  const n = t.resolution;
  const w = n + 1;
  const half = t.size / 2;
  const cell = t.size / n;

  for (let j = 0; j < w; j++) {
    const z = -half + j * cell;
    for (let i = 0; i < w; i++) {
      const x = -half + i * cell;
      t.heights[j * w + i] = heightAt(x, z, seed);
    }
  }
  t.waterLevel = options.waterLevel ?? 0;

  for (let j = 0; j < n; j++) {
    const z = -half + (j + 0.5) * cell;
    for (let i = 0; i < n; i++) {
      const x = -half + (i + 0.5) * cell;
      const h = t.heights[j * w + i];
      const slope = 1 - sampleNormal(t, x, z)[1];
      let layer = LAYER_GRASS;

      // Meadow in patches on the terrace — never uniform, never everywhere.
      //
      // The threshold carries a fine dither term. Paint is one integer per 2 m cell and the shader
      // blends over one cell, so a clean threshold on smooth noise gives a clean arc: at overview
      // distance the first version read as a political map, light-green countries with a hard
      // border. Ten metres of noise on the threshold frays that border into interlocking cells the
      // splat can actually blend.
      const grain = (fbm2(x, z, 1 / 9, 2, seed + 41) - 0.5) * 0.22;
      if (h > 2 && fbm2(x, z, 1 / 74, 3, seed + 21) + grain > 0.56) layer = LAYER_MEADOW;

      // Below the shallows the bed is silt, not the grass the default would leave there: the
      // water is see-through and a green lake floor is the first thing anyone notices.
      const above = h - t.waterLevel;
      if (above < -2.6) layer = LAYER_DIRT;
      const sandTop = 1.3 + 1.2 * fbm2(x, z, 1 / 33, 2, seed + 31) + grain * 6;
      if (above > -3.0 && above < sandTop) layer = LAYER_SAND;

      // Rock a little before the material's own cliff threshold, so the two agree at the seam
      // instead of leaving a ring of grass on a 30° slope.
      if (slope > 0.16) layer = LAYER_ROCK;

      if (trailDistance(x, z) < 3.1 && above > 0.4) layer = LAYER_DIRT;

      const padD = Math.max(Math.abs(x - PAD_X) - PAD_HALF_X, Math.abs(z - PAD_Z) - PAD_HALF_Z);
      if (padD < 0) layer = LAYER_CONCRETE;

      if (
        Math.abs(x - JETTY_X) < JETTY_HALF_WIDTH &&
        z > JETTY_FROM_Z - 2 &&
        z < JETTY_TO_Z &&
        h > t.waterLevel + 0.2
      ) {
        layer = LAYER_WOOD;
      }

      t.paint[j * n + i] = layer;
    }
  }
}

/** Low relief for the land outside the park, so the horizon has a shape. Metres. */
export function surroundRelief(x: number, z: number, seed: number): number {
  const d = Math.max(Math.abs(x), Math.abs(z));
  const rise = clamp01((d - 300) / 900);
  return (fbm2(x, z, 1 / 420, 4, seed + 909) - 0.45) * 46 * rise;
}
