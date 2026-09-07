/**
 * The sixteen procedural surfaces the building atlas is made of, as pure functions.
 *
 * Split out of `textures.ts` so they carry no Babylon import and can be run under node: the claim
 * these files make — that every material has real per-unit tone variation rather than "one colour
 * with a grid drawn on it", which a critic measured at 2.9 % on another module's flagship surface —
 * is a number, and a number belongs in a test rather than in a docblock. `selftest.mjs` measures the
 * spread of every one of them.
 *
 * **These are detail maps, not colour maps.** What a surface shows is `texture.rgb × vertexColour`,
 * so each shader writes a luminance around 1.0 (roughly 0.6–1.3) carrying only the hue shift the
 * material itself has — the green of moss in a mortar joint, the blue of weathered zinc — and the
 * palette carries the colour. Writing the full colour into both squares the darkness, which is how
 * the scenery module's first bark texture rendered every oak as a black post.
 *
 * **The unit sizes are real.** A brick is 215 × 65 mm on a 10 mm joint, a plain clay tile is 155 mm
 * wide on a 155 mm gauge, an ashlar block is 800 × 400, a standing seam is 530 mm on centres, a
 * board is 140 mm. Those numbers set the `cols`/`rows` of each shader against the tile's metres in
 * `geometry.ts` — change one and the other has to move with it or the building lies about its scale,
 * which is the single fastest way to make a 12 m hall read as a doll's house.
 */

import { clamp01, mix, rand2, smoothstep, tileableFbm, tileableNoise } from './noise';
import { TILE, TILE_GLOW } from './geometry';

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

function grey(out: Sample, value: number): void {
  out.r = value;
  out.g = value;
  out.b = value;
}

/**
 * Facing brickwork in stretcher bond: 215 × 65 mm bricks, 10 mm joints, every other course offset by
 * half a brick.
 *
 * The joint is a **recess**, not a line drawn on a flat surface — that is the whole normal map — and
 * every brick takes its own tone, because a real wall is a few hundred slightly different reds and a
 * wall that is one red reads as wallpaper. ±19 %, with the odd much darker header.
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
    const jointX = smoothstep(0.055, 0.0, fx) + smoothstep(0.945, 1.0, fx);
    const jointY = smoothstep(0.09, 0.0, fy) + smoothstep(0.91, 1.0, fy);
    const joint = clamp01(jointX + jointY);
    const r = rand2(col, row, salt);
    const tone = (r * 2 - 1) * 0.19;
    // One brick in nine is a dark header — the burnt ends a Flemish wall is dotted with.
    const header = r > 0.89 ? -0.22 : 0;
    const face = tileableFbm(u * 150, v * 150, 150, salt + col * 31 + row * 7, 3);
    const pit = smoothstep(0.86, 1.0, tileableFbm(u * 220, v * 220, 220, salt + 17, 2));
    const height = clamp01(0.78 + (face - 0.5) * 0.22 - joint * 0.75 - pit * 0.25);
    const value = 0.82 + height * 0.3 + tone + header;
    // The mortar is grey-buff and slightly greener where it holds damp.
    const mortar = joint;
    out.r = mix(value, value * 1.1, mortar);
    out.g = mix(value * 0.985, value * 1.09, mortar);
    out.b = mix(value * 0.96, value * 1.05, mortar);
    out.height = height;
    out.roughness = mix(0.72, 0.9, joint) + (1 - height) * 0.05;
    out.metallic = 0;
    out.ao = 0.55 + height * 0.45 - joint * 0.22;
  };
}

/**
 * Lime render over masonry: floated flat, with the aggregate showing through and the odd hairline
 * shrinkage crack. The float marks are diagonal and anisotropic, which is what a hand-worked wall
 * looks like and what stops it reading as noise.
 */
function renderShader(salt: number): Shader {
  return (u, v, out) => {
    const grain = tileableFbm(u * 110, v * 110, 110, salt, 3);
    const float = tileableFbm((u + v) * 8, (u - v) * 26, 26, salt + 11, 3);
    const blotch = tileableFbm(u * 3, v * 3, 3, salt + 31, 3);
    const crack = smoothstep(0.968, 0.997, tileableFbm(u * 6, v * 15, 15, salt + 57, 2));
    // Damp rises up a rendered wall from the ground, so the bottom eighth of the tile is darker.
    const rising = smoothstep(0.16, 0.0, v) * 0.1;
    const height = clamp01(0.55 + (grain - 0.5) * 0.42 + (float - 0.5) * 0.3 - crack * 0.75);
    const value = 0.86 + height * 0.3 + (blotch - 0.5) * 0.14 - rising;
    out.r = value * 1.008;
    out.g = value;
    out.b = value * 0.982;
    out.height = height;
    out.roughness = 0.85 + (1 - height) * 0.08;
    out.metallic = 0;
    out.ao = 0.76 + height * 0.24 - crack * 0.3;
  };
}

/**
 * Coursed ashlar: 800 × 400 mm blocks with a fine drafted joint, laid in regular courses.
 *
 * A plinth, a quoin and a cornice are all cut from this. The joint is much finer than brick — ashlar
 * is dressed stone — so the relief is smaller and the tone variation larger: every block came out of
 * a different part of the quarry.
 */
function ashlarShader(salt: number): Shader {
  const cols = 2;
  const rows = 4;
  return (u, v, out) => {
    const cy = v * rows;
    const row = Math.floor(cy);
    const fy = cy - row;
    const cx = u * cols + (row % 2 === 0 ? 0 : 0.5);
    const col = Math.floor(cx);
    const fx = cx - col;
    const joint = clamp01(
      smoothstep(0.022, 0.0, fx) +
        smoothstep(0.978, 1.0, fx) +
        smoothstep(0.045, 0.0, fy) +
        smoothstep(0.955, 1.0, fy)
    );
    // 0.11 and not 0.16: at 16 % a coursed ashlar wall reads as a chequerboard of light and dark
    // blocks rather than as stone — visible on the ticket hall's back elevation in
    // `.game-render/buildings-detail/1200-gate.png`. Dressed stone out of one quarry is close in
    // tone; it is rubble that is not.
    const tone = (rand2(col, row, salt) * 2 - 1) * 0.11;
    const bed = tileableFbm(u * 26, v * 60, 60, salt + col * 13 + row * 5, 3);
    const weather = tileableFbm(u * 5, v * 9, 9, salt + 71, 3);
    const height = clamp01(0.72 + (bed - 0.5) * 0.16 - joint * 0.5);
    const value = 0.9 + height * 0.24 + tone + (bed - 0.5) * 0.16;
    // Limestone goes grey-green where the rain runs and buff where it does not.
    const soiling = smoothstep(0.6, 0.95, weather) * 0.35;
    out.r = value * mix(1, 0.9, soiling);
    out.g = value * mix(0.995, 0.93, soiling);
    out.b = value * mix(0.955, 0.91, soiling);
    out.height = height;
    out.roughness = 0.66 + (1 - height) * 0.16 + soiling * 0.1;
    out.metallic = 0;
    out.ao = 0.72 + height * 0.28 - joint * 0.2;
  };
}

/**
 * Painted timber boarding, 140 mm boards with a V-joint.
 *
 * The grain runs ALONG the board and is stretched 8:1, which is most of what makes timber read as
 * timber rather than as concrete, and each board takes its own tone: a painted boarded wall is never
 * one colour, and one that is reads as a decal.
 */
function timberShader(salt: number, boards: number, vertical: boolean): Shader {
  return (u, v, out) => {
    const along = vertical ? v : u;
    const across = vertical ? u : v;
    const c = across * boards;
    const board = Math.floor(c);
    const f = c - board;
    const tone = (rand2(board, 0, salt) * 2 - 1) * 0.15;
    const groove = smoothstep(0.045, 0.0, f) + smoothstep(0.955, 1.0, f);
    const grain = tileableFbm(along * 30, across * boards * 5, 30, salt + board * 13, 3);
    const knot = smoothstep(0.94, 1.0, tileableFbm(along * 5, across * 5, 5, salt + 41, 2));
    const height = clamp01(0.66 + (grain - 0.5) * 0.28 - groove * 0.9 - knot * 0.22);
    const value = 0.88 + height * 0.26 + tone;
    out.r = value;
    out.g = value * 0.996;
    out.b = value * 0.986;
    out.height = height;
    // Paint on wood: satin on the face, flatter where it has weathered into the grain.
    out.roughness = 0.5 + (1 - height) * 0.32;
    out.metallic = 0;
    out.ao = 0.62 + height * 0.38 - groove * 0.32;
  };
}

/**
 * Natural slate, 500 × 250 mm laid to a 200 mm gauge with a broken bond.
 *
 * A slate roof is dark and nearly smooth, and what carries it at any distance is the **step at each
 * course** and the fact that no two slates are the same grey. The riven face gets a faint lamination
 * along the length of the slate.
 */
function slateShader(salt: number): Shader {
  const cols = 3;
  const rows = 4;
  return (u, v, out) => {
    const cy = v * rows;
    const row = Math.floor(cy);
    const fy = cy - row;
    const cx = u * cols + (row % 2 === 0 ? 0 : 0.5);
    const col = Math.floor(cx);
    const fx = cx - col;
    const gap = smoothstep(0.03, 0.0, fx) + smoothstep(0.97, 1.0, fx);
    // The head of the course below is overlapped: a hard shadow line across the bottom of each slate.
    const lap = smoothstep(0.12, 0.0, fy);
    const tone = (rand2(col, row, salt) * 2 - 1) * 0.17;
    const riven = tileableFbm(u * 40, v * 190, 190, salt + col * 7 + row * 19, 3);
    const height = clamp01(0.7 + (riven - 0.5) * 0.2 - gap * 0.6 - lap * 0.5);
    const value = 0.86 + height * 0.28 + tone;
    // Welsh slate is faintly blue-purple; the weathered ones go green.
    const moss = smoothstep(0.72, 1.0, tileableFbm(u * 7, v * 7, 7, salt + 91, 3)) * 0.4;
    out.r = value * mix(0.97, 0.88, moss);
    out.g = value * mix(0.985, 1.0, moss);
    out.b = value * mix(1.03, 0.9, moss);
    out.height = height;
    out.roughness = 0.6 + (1 - height) * 0.2 + moss * 0.15;
    out.metallic = 0;
    out.ao = 0.5 + height * 0.5 - lap * 0.3;
  };
}

/**
 * Plain clay tiles — Biberschwanz — 155 mm wide, laid double-lap to a 155 mm gauge with a rounded
 * tail. The scalloped shadow line under every course is the reason this roof reads as a roof from
 * the overview camera, where nothing else about it survives.
 */
function plainTileShader(salt: number): Shader {
  const cols = 5;
  const rows = 5;
  return (u, v, out) => {
    const cy = v * rows;
    const row = Math.floor(cy);
    const fy = cy - row;
    const cx = u * cols + (row % 2 === 0 ? 0 : 0.5);
    const col = Math.floor(cx);
    const fx = cx - col;
    // The rounded tail: the tile's bottom edge is a segment of a circle, so the shadow under it
    // scallops instead of running straight.
    const tail = Math.sqrt(Math.max(0, 1 - Math.pow((fx - 0.5) * 2, 2)));
    const lap = smoothstep(0.1 + tail * 0.09, 0.0, fy);
    const gap = smoothstep(0.035, 0.0, fx) + smoothstep(0.965, 1.0, fx);
    const tone = (rand2(col, row, salt) * 2 - 1) * 0.2;
    const grain = tileableFbm(u * 130, v * 130, 130, salt + 5, 2);
    const height = clamp01(0.72 + (grain - 0.5) * 0.16 - lap * 0.75 - gap * 0.4);
    const value = 0.76 + height * 0.4 + tone;
    // Weathered clay: grey-green in the shade of the lap, warm orange on the exposed face.
    const wear = tileableFbm(u * 6, v * 6, 6, salt + 61, 3);
    const moss = smoothstep(0.66, 0.97, wear) * (0.3 + lap * 0.5);
    out.r = value * mix(1.02, 0.8, moss);
    out.g = value * mix(0.94, 0.9, moss);
    out.b = value * mix(0.86, 0.78, moss);
    out.height = height;
    out.roughness = 0.8 + (1 - height) * 0.12;
    out.metallic = 0;
    out.ao = 0.45 + height * 0.55 - lap * 0.28;
  };
}

/**
 * Standing-seam zinc: flat bays 530 mm wide with a 25 mm upstand seam between them, running up the
 * slope. Weathered zinc is a soft blue-grey and only slightly metallic — a fully metallic roof under
 * an IBL turns into a mirror of the sky and reads as chrome.
 */
function zincShader(salt: number): Shader {
  const bays = 2;
  return (u, v, out) => {
    const c = u * bays;
    const bay = Math.floor(c);
    const f = c - bay;
    const seam = smoothstep(0.06, 0.015, f) + smoothstep(0.94, 0.985, f);
    const pan = tileableFbm(u * 18, v * 5, 18, salt + bay * 23, 3);
    const oil = tileableFbm(u * 4, v * 9, 9, salt + 7, 3);
    const tone = (rand2(bay, 0, salt) * 2 - 1) * 0.06;
    const height = clamp01(0.42 + seam * 0.55 + (pan - 0.5) * 0.12);
    const value = 0.94 + (pan - 0.5) * 0.14 + seam * 0.12 + tone;
    out.r = value * mix(1, 1.01, oil);
    out.g = value;
    out.b = value * mix(1.02, 1.05, oil);
    out.height = height;
    out.roughness = 0.46 + (1 - height) * 0.14 + (oil - 0.5) * 0.08;
    // 0.32 rather than 0.45: weathered zinc is a dull sheet, and at 0.45 under an IBL it takes so
    // much of the sky that a hip roof reads as a slab of blue plastic.
    out.metallic = 0.32;
    out.ao = 0.78 + height * 0.22;
  };
}

/** Cedar shingles: 180 mm wide, staggered, split rather than sawn, so every tail is a different length. */
function shingleShader(salt: number): Shader {
  const cols = 4;
  const rows = 4;
  return (u, v, out) => {
    const cy = v * rows;
    const row = Math.floor(cy);
    const fy = cy - row;
    const jitter = rand2(Math.floor(u * cols), row, salt + 3) * 0.22;
    const cx = u * cols + (row % 2 === 0 ? 0 : 0.5) + jitter * 0.1;
    const col = Math.floor(cx);
    const fx = cx - col;
    const gap = smoothstep(0.05, 0.0, fx) + smoothstep(0.95, 1.0, fx);
    const lap = smoothstep(0.14 + jitter * 0.3, 0.0, fy);
    const tone = (rand2(col, row, salt) * 2 - 1) * 0.21;
    const grain = tileableFbm(u * 20, v * 150, 150, salt + col * 11, 3);
    const height = clamp01(0.68 + (grain - 0.5) * 0.3 - lap * 0.8 - gap * 0.5);
    const value = 0.82 + height * 0.32 + tone;
    out.r = value * 1.01;
    out.g = value * 0.97;
    out.b = value * 0.9;
    out.height = height;
    out.roughness = 0.86 + (1 - height) * 0.1;
    out.metallic = 0;
    out.ao = 0.48 + height * 0.52 - lap * 0.3;
  };
}

/**
 * Gloss-painted joinery: window frames, doors, fascia boards, sign panels.
 *
 * Nearly flat, satin, with the faintest brush lay-off and the odd blemish where the paint has run.
 * Roughness 0.34 and not 1.0 — the art bible's ban on "roughness-1.0 plastic" is exactly a window
 * frame that takes no highlight, and a frame that takes none is the fastest way to make a facade
 * look untextured.
 */
function paintShader(salt: number): Shader {
  return (u, v, out) => {
    const lay = tileableNoise(u * 3, v * 90, 90, salt);
    const dust = tileableFbm(u * 60, v * 60, 60, salt + 13, 2);
    const run = smoothstep(0.965, 1.0, tileableFbm(u * 8, v * 26, 26, salt + 47, 2));
    // Fade: paint on a south elevation is not the paint on a north one, and a door repainted last
    // year is not the door beside it. Without this every painted surface in the park is one value.
    const fade = tileableFbm(u * 2.2, v * 2.2, 2.2, salt + 5, 2);
    const height = clamp01(0.6 + (lay - 0.5) * 0.12 + (dust - 0.5) * 0.1 + run * 0.2);
    const value = 0.96 + height * 0.1 + (fade - 0.5) * 0.4;
    grey(out, value);
    out.height = height;
    out.roughness = 0.3 + (1 - height) * 0.14 + run * 0.12;
    out.metallic = 0;
    out.ao = 0.9 + height * 0.1;
  };
}

/** Board-marked in-situ concrete: 200 mm boards, tie holes, and the pour lines between lifts. */
function concreteShader(salt: number): Shader {
  const boards = 8;
  return (u, v, out) => {
    const c = v * boards;
    const board = Math.floor(c);
    const f = c - board;
    const line = smoothstep(0.035, 0.0, f) + smoothstep(0.965, 1.0, f);
    const tone = (rand2(0, board, salt) * 2 - 1) * 0.05;
    const grain = tileableFbm(u * 90, v * 90, 90, salt, 3);
    const blotch = tileableFbm(u * 3.5, v * 3.5, 3.5, salt + 29, 3);
    // Snap-tie holes on a 1.2 m grid, which at this tile size is one per tile.
    const dx = u - 0.5;
    const dy = v - 0.32;
    const tie = smoothstep(0.03, 0.012, Math.hypot(dx, dy));
    const height = clamp01(0.62 + (grain - 0.5) * 0.16 - line * 0.5 - tie * 0.8);
    const value = 0.92 + height * 0.18 + (blotch - 0.5) * 0.12 + tone;
    out.r = value;
    out.g = value * 1.002;
    out.b = value * 1.006;
    out.height = height;
    out.roughness = 0.78 + (1 - height) * 0.12;
    out.metallic = 0;
    out.ao = 0.8 + height * 0.2 - tie * 0.35;
  };
}

/** Granite paving: 500 mm slabs, flame-textured, with a wide joint that collects grit. */
function pavingShader(salt: number): Shader {
  const cols = 3;
  const rows = 3;
  return (u, v, out) => {
    const col = Math.floor(u * cols);
    const row = Math.floor(v * rows);
    const fx = u * cols - col;
    const fy = v * rows - row;
    const joint = clamp01(
      smoothstep(0.05, 0.0, fx) +
        smoothstep(0.95, 1.0, fx) +
        smoothstep(0.05, 0.0, fy) +
        smoothstep(0.95, 1.0, fy)
    );
    const tone = (rand2(col, row, salt) * 2 - 1) * 0.14;
    const flame = tileableFbm(u * 120, v * 120, 120, salt + col * 3 + row * 17, 3);
    const speck = smoothstep(0.8, 1.0, tileableFbm(u * 260, v * 260, 260, salt + 5, 2));
    const height = clamp01(0.7 + (flame - 0.5) * 0.24 - joint * 0.6);
    const value = 0.88 + height * 0.24 + tone + speck * 0.1;
    grey(out, value);
    out.r = value * 1.005;
    out.b = value * 0.995;
    out.height = height;
    out.roughness = 0.8 + (1 - height) * 0.12;
    out.metallic = 0;
    out.ao = 0.66 + height * 0.34 - joint * 0.26;
  };
}

/**
 * Powder-coated steel: near-flat with a faint orange-peel and a few scuffs down to the primer.
 * Railings, gutters, downpipes, canopy frames, the odd handrail.
 */
function metalShader(salt: number): Shader {
  return (u, v, out) => {
    const peel = tileableFbm(u * 50, v * 50, 50, salt, 2);
    const brush = tileableNoise(u * 150, v * 6, 150, salt + 19);
    const scuff = smoothstep(0.95, 1.0, tileableFbm(u * 18, v * 18, 18, salt + 67, 3));
    const patch = tileableFbm(u * 2.6, v * 2.6, 2.6, salt + 5, 2);
    const height = clamp01(0.56 + (peel - 0.5) * 0.2 + (brush - 0.5) * 0.1 - scuff * 0.34);
    const value = 0.93 + height * 0.16 + (patch - 0.5) * 0.3;
    out.r = value;
    out.g = value;
    out.b = value * 1.01;
    out.height = height;
    out.roughness = mix(0.3, 0.6, scuff) + (1 - height) * 0.08;
    out.metallic = 0.2 + scuff * 0.4;
    out.ao = 0.82 + height * 0.18;
  };
}

/**
 * Rubble masonry: undressed field stone with wide mortar and no courses to speak of.
 *
 * Drawn as a jittered lattice rather than a grid — the whole character of a rubble wall is that no
 * two stones are the same size, and a regular grid with noise on it still reads as a grid.
 */
function rubbleShader(salt: number): Shader {
  const cols = 4;
  const rows = 5;
  return (u, v, out) => {
    let best = 0;
    let bestId = 0;
    let second = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = Math.floor(u * cols) + dx;
        const cy = Math.floor(v * rows) + dy;
        const jx = (rand2(cx, cy, salt) - 0.5) * 0.7;
        const jy = (rand2(cx, cy, salt + 91) - 0.5) * 0.7;
        const px = (cx + 0.5 + jx) / cols;
        const py = (cy + 0.5 + jy) / rows;
        const d = Math.hypot((u - px) * cols, (v - py) * rows);
        const w = 1 - d;
        if (w > best) {
          second = best;
          best = w;
          bestId = ((cx & 255) << 8) | (cy & 255);
        } else if (w > second) second = w;
      }
    }
    const edge = smoothstep(0.16, 0.02, best - second);
    const tone = (rand2(bestId, 3, salt) * 2 - 1) * 0.2;
    const face = tileableFbm(u * 90, v * 90, 90, salt + bestId, 3);
    const height = clamp01(0.72 + (face - 0.5) * 0.3 - edge * 0.8);
    const value = 0.86 + height * 0.28 + tone;
    out.r = value * 1.005;
    out.g = value;
    out.b = value * 0.97;
    out.height = height;
    out.roughness = 0.82 + (1 - height) * 0.1;
    out.metallic = 0;
    out.ao = 0.5 + height * 0.5 - edge * 0.28;
  };
}

/** Awning and blind canvas: a plain weave with a slub, matt, faintly translucent-looking. */
function canvasShader(salt: number): Shader {
  return (u, v, out) => {
    const warp = Math.abs(Math.sin(u * Math.PI * 120));
    const weft = Math.abs(Math.sin(v * Math.PI * 120));
    const weave = (warp * 0.5 + weft * 0.5) * 0.5 + 0.25;
    const slub = tileableFbm(u * 36, v * 36, 36, salt, 2);
    // The sag is what a canvas does between its ribs, and it is a shadow rather than a texture: the
    // fabric is darker where it hangs and bright where it is stretched.
    const sag = tileableFbm(u * 2.4, v * 2.4, 2.4, salt + 23, 2);
    const height = clamp01(weave * 0.7 + (slub - 0.5) * 0.4);
    const value = 0.9 + height * 0.18 + (sag - 0.5) * 0.2;
    grey(out, value);
    out.height = height;
    out.roughness = 0.93;
    out.metallic = 0;
    out.ao = 0.8 + height * 0.2;
  };
}

/**
 * Verdigris copper: 600 mm bays with a standing seam, gone green in streaks that run DOWN the slope.
 *
 * A copper roof is the one metal in a European park that is not grey, and the patina is directional
 * — it forms where the water runs and stays bright where it does not, which is why the streaks here
 * are stretched 6:1 along v rather than isotropic blotches.
 */
function copperShader(salt: number): Shader {
  const bays = 2;
  return (u, v, out) => {
    const c = u * bays;
    const bay = Math.floor(c);
    const f = c - bay;
    const seam = smoothstep(0.05, 0.012, f) + smoothstep(0.95, 0.988, f);
    const patina = tileableFbm(u * 7, v * 1.4, 7, salt + bay * 13, 4);
    const streak = tileableFbm(u * 26, v * 4, 26, salt + 3, 3);
    const green = clamp01(patina * 1.15 + streak * 0.45 - 0.25);
    const height = clamp01(0.46 + seam * 0.5 + (streak - 0.5) * 0.12);
    const value = 0.9 + height * 0.16 + (green - 0.5) * 0.16;
    out.r = value * mix(1.06, 0.78, green);
    out.g = value * mix(0.94, 1.06, green);
    out.b = value * mix(0.82, 0.98, green);
    out.height = height;
    out.roughness = mix(0.34, 0.8, green) + (1 - height) * 0.08;
    out.metallic = mix(0.75, 0.1, green);
    out.ao = 0.8 + height * 0.2;
  };
}

/**
 * The window glow — not a material, and no pack can name it.
 *
 * Large soft blotches from about 0.35 to 1.3, warm in the middle and cooler at the edges. A lit pane
 * samples a random sub-rectangle of this, which is the only way forty windows get forty brightnesses
 * out of one emissive material: Babylon's PBR multiplies the emissive by a texture and a uniform
 * colour and never by the vertex stream. Within one pane it also gives a gradient, which reads as a
 * room lit from one side rather than as a light box.
 */
function glowShader(salt: number): Shader {
  return (u, v, out) => {
    const blob = tileableFbm(u * 3, v * 3, 3, salt, 3);
    const fine = tileableFbm(u * 11, v * 11, 11, salt + 17, 2);
    const value = clamp01(0.28 + blob * 1.1 + (fine - 0.5) * 0.3);
    // Warmer where it is brighter: a bright room is a lamp, a dim one is daylight through a blind.
    const warm = value;
    out.r = value * mix(0.92, 1.12, warm);
    out.g = value;
    out.b = value * mix(1.06, 0.82, warm);
    out.height = 0.5;
    out.roughness = 0.6;
    out.metallic = 0;
    out.ao = 1;
  };
}

export const SHADERS: Array<{ tile: number; name: string; make: (salt: number) => Shader }> = [
  { tile: TILE.brick, name: 'brick', make: brickShader },
  { tile: TILE.render, name: 'render', make: renderShader },
  { tile: TILE.ashlar, name: 'ashlar', make: ashlarShader },
  { tile: TILE.timber, name: 'timber', make: (s) => timberShader(s, 7, true) },
  { tile: TILE.slate, name: 'slate', make: slateShader },
  { tile: TILE.pantile, name: 'pantile', make: plainTileShader },
  { tile: TILE.zinc, name: 'zinc', make: zincShader },
  { tile: TILE.shingle, name: 'shingle', make: shingleShader },
  { tile: TILE.panel, name: 'panel', make: paintShader },
  { tile: TILE.concrete, name: 'concrete', make: concreteShader },
  { tile: TILE.paving, name: 'paving', make: pavingShader },
  { tile: TILE.metal, name: 'metal', make: metalShader },
  { tile: TILE_GLOW, name: 'glow', make: glowShader },
  { tile: TILE.rubble, name: 'rubble', make: rubbleShader },
  { tile: TILE.canvas, name: 'canvas', make: canvasShader },
  { tile: TILE.copper, name: 'copper', make: copperShader },
];
