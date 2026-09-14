/**
 * The eight procedural surfaces the shop atlas is made of, as pure functions.
 *
 * Split out of `textures.ts` so they carry no Babylon import and can be run under node: the claim
 * these files make — that every material has real per-unit tone variation rather than "one colour
 * with a grid drawn on it", which is what a critic measured at 2.9 % on another module's flagship
 * surface — is a number, and a number belongs in a test rather than in a docblock.
 *
 * Read the docblock on `textures.ts` for the channel contract and for why every shader writes a
 * luminance around 1.0 instead of the colour a wall actually shows.
 */

import { clamp01, mix, rand2, smoothstep, tileableFbm, tileableNoise } from './noise';
import { TILE } from './geometry';

/** A surface sample: colour in sRGB 0..1, a height for the normal, and the material response. */
export interface Sample {
  r: number;
  g: number;
  b: number;
  height: number;
  roughness: number;
  metallic: number;
  ao: number;
}

export type Shader = (u: number, v: number, out: Sample) => void;

// ── The eight shaders ───────────────────────────────────────────────────────────────────────

/**
 * Lime render: a trowelled plaster with an aggregate grain and the odd hairline shrinkage crack.
 *
 * The trowel is anisotropic and diagonal, which is what a hand-floated wall actually looks like and
 * what stops it reading as noise.
 */
function renderShader(salt: number): Shader {
  return (u, v, out) => {
    const grain = tileableFbm(u * 90, v * 90, 90, salt, 3);
    const trowel = tileableFbm((u + v) * 9, (u - v) * 22, 22, salt + 11, 3);
    const blotch = tileableFbm(u * 4, v * 4, 4, salt + 31, 3);
    const crack = smoothstep(0.965, 0.995, tileableFbm(u * 7, v * 13, 13, salt + 57, 2));
    const height = clamp01(0.5 + (grain - 0.5) * 0.5 + (trowel - 0.5) * 0.35 - crack * 0.7);
    const value = 0.82 + height * 0.36 + (blotch - 0.5) * 0.12;
    out.r = value * 1.005;
    out.g = value;
    out.b = value * 0.985;
    out.height = height;
    out.roughness = 0.84 + (1 - height) * 0.1;
    out.metallic = 0;
    out.ao = 0.72 + height * 0.28 - crack * 0.25;
  };
}

/**
 * Clay pantiles: interlocking S-tiles in staggered courses.
 *
 * A pantile is 33 cm on the roll and about 42 cm on the course in Europe, so the tile covers three
 * across and two courses up at 0.75 m — the profile is the roll (a raised half-round) with a flat
 * pan beside it, and the shadow under each course head is what makes a roof read as a roof from
 * 200 m. Every tile takes its own tone: a clay roof is a hundred slightly different oranges.
 */
function pantileShader(salt: number): Shader {
  const cols = 3;
  const rows = 2;
  return (u, v, out) => {
    const cy = v * rows;
    const row = Math.floor(cy);
    const fy = cy - row;
    // Every other course is offset by half a tile.
    const cx = u * cols + (row % 2 === 0 ? 0 : 0.5);
    const col = Math.floor(cx);
    const fx = cx - col;
    const tone = rand2(col, row, salt) * 2 - 1;
    // The roll: a raised half-round over the left third, a shallow pan over the rest.
    const roll = Math.exp(-Math.pow((fx - 0.22) / 0.19, 2));
    const pan = 0.18 + 0.1 * Math.cos((fx - 0.6) * 3.1);
    let height = clamp01(pan + roll * 0.72);
    // The head lap: the course above overlaps and casts a hard shadow on the top of this one.
    const lap = smoothstep(0.9, 1.0, fy);
    height = mix(height, height * 0.35, lap);
    const grain = tileableFbm(u * 140, v * 140, 140, salt + 5, 2);
    const wear = tileableFbm(u * 8, v * 8, 8, salt + 71, 3);
    const value = 0.72 + height * 0.42 + tone * 0.16 + (grain - 0.5) * 0.1;
    // Weathered clay goes grey-green in the pans where water sits.
    const moss = smoothstep(0.62, 0.95, wear) * (1 - roll) * 0.55;
    out.r = value * mix(1, 0.78, moss);
    out.g = value * mix(1, 0.92, moss);
    out.b = value * mix(0.93, 0.8, moss);
    out.height = height;
    out.roughness = 0.78 + (1 - height) * 0.14;
    out.metallic = 0;
    out.ao = 0.42 + height * 0.58 - lap * 0.3;
  };
}

/**
 * Painted timber cladding: tongue-and-groove boards with a V-joint.
 *
 * 14 cm boards, so a 1 m tile is seven of them. The grain runs ALONG the board and is stretched
 * 8:1, which is most of what makes timber read as timber rather than as concrete — the same
 * correction the scenery module's bark shader records. Each board takes its own tone, because a
 * painted boarded wall is never one colour and a wall that is reads as a decal.
 */
function boardShader(salt: number, boards: number, vertical: boolean): Shader {
  return (u, v, out) => {
    const along = vertical ? v : u;
    const across = vertical ? u : v;
    const c = across * boards;
    const board = Math.floor(c);
    const f = c - board;
    const tone = rand2(board, 0, salt) * 2 - 1;
    // The V-groove between boards.
    const groove = smoothstep(0.04, 0.0, f) + smoothstep(0.96, 1.0, f);
    const grain = tileableFbm(along * 34, across * boards * 4.5, 34, salt + board * 13, 3);
    const knot = smoothstep(0.93, 1.0, tileableFbm(along * 6, across * 6, 6, salt + 41, 2));
    const height = clamp01(0.62 + (grain - 0.5) * 0.3 - groove * 0.85 - knot * 0.2);
    const value = 0.86 + height * 0.28 + tone * 0.14;
    out.r = value;
    out.g = value * 0.995;
    out.b = value * 0.985;
    out.height = height;
    // Paint on wood: satin on the face, flatter where it has weathered in the grain.
    out.roughness = 0.55 + (1 - height) * 0.3;
    out.metallic = 0;
    out.ao = 0.6 + height * 0.4 - groove * 0.35;
  };
}

/**
 * Powder-coated steel: near-flat with a faint orange-peel and a few scuffs down to the primer.
 *
 * Roughness 0.32 rather than 1.0 — the art bible bans "roughness-1.0 plastic", and a queue rail
 * that does not take a specular highlight is the single fastest way to make a park look untextured.
 */
function metalShader(salt: number): Shader {
  return (u, v, out) => {
    const peel = tileableFbm(u * 55, v * 55, 55, salt, 2);
    const brush = tileableNoise(u * 160, v * 6, 160, salt + 19);
    const scuff = smoothstep(0.955, 1.0, tileableFbm(u * 20, v * 20, 20, salt + 67, 3));
    const height = clamp01(0.55 + (peel - 0.5) * 0.22 + (brush - 0.5) * 0.1 - scuff * 0.35);
    const value = 0.9 + height * 0.2;
    out.r = value;
    out.g = value;
    out.b = value * 1.01;
    out.height = height;
    out.roughness = mix(0.32, 0.62, scuff) + (1 - height) * 0.08;
    out.metallic = 0.15 + scuff * 0.45;
    out.ao = 0.8 + height * 0.2;
  };
}

/** Awning canvas: a plain weave, slightly translucent-looking, matt. */
function canvasShader(salt: number): Shader {
  return (u, v, out) => {
    const warp = Math.abs(Math.sin(u * Math.PI * 128));
    const weft = Math.abs(Math.sin(v * Math.PI * 128));
    const weave = (warp * 0.5 + weft * 0.5) * 0.5 + 0.25;
    const slub = tileableFbm(u * 40, v * 40, 40, salt, 2);
    const sag = tileableFbm(u * 3, v * 3, 3, salt + 23, 2);
    const height = clamp01(weave * 0.7 + (slub - 0.5) * 0.4);
    const value = 0.88 + height * 0.2 + (sag - 0.5) * 0.08;
    out.r = value;
    out.g = value;
    out.b = value;
    out.height = height;
    out.roughness = 0.92;
    out.metallic = 0;
    out.ao = 0.78 + height * 0.22;
  };
}

/** Chalkboard: a dark matt slate with the ghost of a thousand wipes across it. */
function chalkboardShader(salt: number): Shader {
  return (u, v, out) => {
    const wipe = tileableFbm(u * 5, v * 24, 24, salt, 3);
    const dust = tileableFbm(u * 70, v * 70, 70, salt + 13, 2);
    const height = clamp01(0.5 + (dust - 0.5) * 0.3);
    // Bright enough that the vertex colour can still take it down to slate; the smears lift it.
    const value = 0.9 + wipe * 0.24 + (dust - 0.5) * 0.1;
    out.r = value * 0.99;
    out.g = value;
    out.b = value * 1.02;
    out.height = height;
    out.roughness = 0.88;
    out.metallic = 0;
    out.ao = 0.86 + height * 0.14;
  };
}

/**
 * The shop's own hard standing: small concrete unit pavers on a stretcher bond.
 *
 * Deliberately a different unit from the paths module's slabs — a kiosk forecourt is laid in
 * 20 × 10 cm blocks, and the change of module at the kerb is what tells a visitor the ground under
 * the awning belongs to the shop.
 */
function pavingShader(salt: number): Shader {
  const cols = 7;
  const rows = 14;
  return (u, v, out) => {
    const cy = v * rows;
    const row = Math.floor(cy);
    const fy = cy - row;
    const cx = u * cols + (row % 2 === 0 ? 0 : 0.5);
    const col = Math.floor(cx);
    const fx = cx - col;
    const tone = rand2(col, row, salt) * 2 - 1;
    const joint =
      smoothstep(0.045, 0.0, fx) +
      smoothstep(0.955, 1.0, fx) +
      smoothstep(0.06, 0.0, fy) +
      smoothstep(0.94, 1.0, fy);
    const grit = tileableFbm(u * 190, v * 190, 190, salt + 3, 2);
    const stain = tileableFbm(u * 6, v * 6, 6, salt + 91, 3);
    const height = clamp01(0.7 + (grit - 0.5) * 0.35 - Math.min(1, joint) * 0.8);
    const value = 0.84 + height * 0.26 + tone * 0.13 + (stain - 0.5) * 0.1;
    out.r = value;
    out.g = value * 0.997;
    out.b = value * 0.985;
    out.height = height;
    out.roughness = 0.86 + (1 - height) * 0.08;
    out.metallic = 0;
    out.ao = 0.55 + height * 0.45 - Math.min(1, joint) * 0.25;
  };
}

/**
 * Brick on a running bond: 21.5 × 6.5 cm with a 1 cm mortar joint, which is the European standard
 * and the reason a brick wall has the proportion it has.
 *
 * The joint is recessed and the mortar is lighter and much rougher than the brick, so the normal
 * map does the work at any distance where the geometry cannot.
 */
function brickShader(salt: number): Shader {
  const cols = 4;
  const rows = 12;
  return (u, v, out) => {
    const cy = v * rows;
    const row = Math.floor(cy);
    const fy = cy - row;
    const cx = u * cols + (row % 2 === 0 ? 0 : 0.5);
    const col = Math.floor(cx);
    const fx = cx - col;
    const tone = rand2(col, row, salt) * 2 - 1;
    const jointX = smoothstep(0.05, 0.012, fx) + smoothstep(0.95, 0.988, fx);
    const jointY = smoothstep(0.11, 0.03, fy) + smoothstep(0.89, 0.97, fy);
    const joint = Math.min(1, jointX + jointY);
    const face = tileableFbm(u * 120, v * 120, 120, salt + col * 7 + row * 3, 3);
    const height = clamp01(0.78 + (face - 0.5) * 0.28 - joint * 0.85);
    // Mortar is pale and desaturated; the brick carries the tone spread.
    const brickValue = 0.78 + height * 0.3 + tone * 0.2;
    const mortarValue = 1.16 + (face - 0.5) * 0.1;
    const value = mix(brickValue, mortarValue, joint);
    out.r = value * mix(1.02, 0.99, joint);
    out.g = value * mix(0.97, 1.0, joint);
    out.b = value * mix(0.93, 1.0, joint);
    out.height = height;
    out.roughness = mix(0.8, 0.95, joint);
    out.metallic = 0;
    out.ao = 0.45 + height * 0.55 - joint * 0.2;
  };
}

// ── Assembly ────────────────────────────────────────────────────────────────────────────────

export const SHADERS: Array<{ tile: number; make: (salt: number) => Shader }> = [
  { tile: TILE.render, make: renderShader },
  { tile: TILE.roof, make: pantileShader },
  { tile: TILE.timber, make: (s) => boardShader(s, 7, false) },
  { tile: TILE.metal, make: metalShader },
  { tile: TILE.canvas, make: canvasShader },
  { tile: TILE.board, make: chalkboardShader },
  { tile: TILE.paving, make: pavingShader },
  { tile: TILE.brick, make: brickShader },
];

/**
 * Mean and standard deviation of a tile's albedo luminance, and the spread ACROSS its units.
 *
 * The second number is the one that matters and the first cannot substitute for it: fine grain
 * noise gives a high overall sd with every brick the same colour. `unitSpread` samples the centre
 * of each unit on the tile's own grid, so it answers "are the bricks different colours" rather
 * than "is the surface noisy".
 */
export function tileStats(
  tile: number,
  seed: number,
  size: number
): { mean: number; sd: number; unitSpread: number } {
  const shade = shaderFor(tile, seed);
  const sample: Sample = { r: 1, g: 1, b: 1, height: 0.5, roughness: 0.8, metallic: 0, ao: 1 };
  const lum = (u: number, v: number): number => {
    sample.r = 1;
    sample.g = 1;
    sample.b = 1;
    sample.height = 0.5;
    sample.roughness = 0.8;
    sample.metallic = 0;
    sample.ao = 1;
    shade(u, v, sample);
    return sample.r * 0.2126 + sample.g * 0.7152 + sample.b * 0.0722;
  };
  let sum = 0;
  let sumSq = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = lum((x + 0.5) / size, (y + 0.5) / size);
      sum += l;
      sumSq += l * l;
    }
  }
  const n = size * size;
  const mean = sum / n;
  const sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));

  // The unit grid this surface is laid out on, for the per-unit spread.
  const grid = UNIT_GRID[tile];
  if (!grid) return { mean, sd, unitSpread: sd };
  let us = 0;
  let usSq = 0;
  let count = 0;
  for (let r = 0; r < grid[1]; r++) {
    for (let c = 0; c < grid[0]; c++) {
      // Each unit is averaged over a 4×4 grid inside its middle half, away from every joint. One
      // sample per unit measures the grain noise sitting on top of the tone as well as the tone,
      // which understates a smooth surface (boards) and flatters a rough one (brick).
      let acc = 0;
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) {
          const fu = 0.3 + (i / 3) * 0.4;
          const fv = 0.3 + (j / 3) * 0.4;
          const u = (c + fu) / grid[0] - (r % 2 === 0 ? 0 : 0.5 / grid[0]);
          const v = (r + fv) / grid[1];
          acc += lum((u + 1) % 1, v);
        }
      }
      const l = acc / 16;
      us += l;
      usSq += l * l;
      count++;
    }
  }
  const um = us / count;
  return { mean, sd, unitSpread: Math.sqrt(Math.max(0, usSq / count - um * um)) / (um || 1) };
}

/** The unit lattice each tile is laid out on, `[across, up]`. Surfaces with no unit are absent. */
const UNIT_GRID: Record<number, [number, number]> = {
  [TILE.roof]: [3, 2],
  // Boards stack UP the tile, not across it: `boardShader(_, 7, false)` reads `across = v`, so the
  // cladding is shiplap. Written as [7, 1] the first time, which sampled the same board seven times
  // and reported a 0.7 % spread for a surface that has 7 %.
  [TILE.timber]: [1, 7],
  [TILE.paving]: [7, 14],
  [TILE.brick]: [4, 12],
};

export function shaderFor(tile: number, seed: number): Shader {
  const entry = SHADERS.find((s) => s.tile === tile) ?? SHADERS[0];
  return entry.make(seed + entry.tile * 7919);
}
