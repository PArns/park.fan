/**
 * Every pool surface, generated at boot from its manifest entry. No files, no fetch.
 *
 * The same three-maps-from-one-height-field discipline `paths` uses: albedo, a normal map from
 * central differences on that height, and an ORM (occlusion red, roughness green, metallic blue).
 * Deriving all three from one field is what makes a tiled wall read as tile rather than as a
 * photograph of tile glued to a plane — the bump, the shading in the grout and the sheen all agree
 * about where the tiles are.
 *
 * Three things do most of the work here and are easy to leave out:
 *
 *  - **Per-tile colour.** A glass mosaic is not one blue: every 25 mm chip takes a different one
 *    of the recipe's colours from a hash of its own cell. Without it a mosaic is a flat fill with a
 *    grid drawn on it, which is exactly what programmer art looks like.
 *  - **Occlusion in the grout.** The ORM's red channel darkens the joints. A normal map alone
 *    leaves them lit as brightly as the tile faces and the wall flattens out under a high sun.
 *  - **Glaze.** A ceramic pool tile is the glossiest surface in a park: roughness 0.10-0.14 on the
 *    face and 0.5-0.7 in the grout, in one map, so a wet-looking sheen runs across the tiles and
 *    stops at every joint.
 *
 * ## Caustics
 *
 * The net of light on a pool floor is a **Worley cell-border field**: `F2 - F1` from a jittered
 * grid, thresholded so the borders are thin bright lines, over a slow second octave so the net
 * breathes rather than tiling visibly. It is written into the R, G and B channels at slightly
 * different scales, because real caustics fringe — the floor of a pool has colour in its light and
 * a greyscale caustic looks like a projector.
 *
 * `RawTexture` and never a canvas: a 2D context is DOM, and these are built inside `main()`, which
 * also runs under the showcase and under the screenshot harness.
 */

import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import { hash2, clamp01, mix, smoothstep } from './geom';
import type { PoolEdgeSpec, PoolTileSpec } from './types';
import { hexToLinear } from './geom';

export type SurfacePattern =
  'mosaic' | 'ceramic' | 'slate' | 'pebble' | 'lanes' | 'concrete' | 'timber' | 'stone' | 'sand';

export interface SurfaceRecipe {
  id: string;
  pattern: SurfacePattern;
  /** Metres one texture repeat covers. */
  tileMetres: number;
  /** Linear RGB. A cell picks one. */
  colors: Array<[number, number, number]>;
  /** Linear RGB of the joint. */
  grout: [number, number, number];
  /** Linear RGB of the lane line, where the pattern has one. */
  accent: [number, number, number];
  /** Metres. */
  accentWidth: number;
  /** Roughness on a face and down in the joint. */
  roughness: [number, number];
  relief: number;
  seed: number;
}

export interface SurfaceTextureSet {
  albedo: RawTexture;
  normal: RawTexture;
  orm: RawTexture;
  dispose(): void;
}

interface Sample {
  /** 0 in a joint, 1 on the top of a tile. */
  h: number;
  /** Which colour of the recipe this pixel belongs to, and how far it is shifted. */
  cell: number;
  tint: number;
  /** 1 where this pixel is grout. */
  joint: number;
  /** 1 where this pixel is the accent (a lane line). */
  accent: number;
}

function sample(r: SurfaceRecipe, u: number, v: number): Sample {
  const tile = r.tileMetres;
  const seed = r.seed;
  switch (r.pattern) {
    case 'mosaic':
    case 'ceramic': {
      // 25 mm glass chips against 150 mm ceramic — one algorithm, two cell sizes out of the recipe.
      const unit = r.pattern === 'mosaic' ? 0.025 : 0.15;
      const cells = Math.max(2, Math.round(tile / unit));
      const jointM = r.pattern === 'mosaic' ? 0.0025 : 0.004;
      const cx = Math.floor(u * cells);
      const cy = Math.floor(v * cells);
      const fu = u * cells - cx;
      const fv = v * cells - cy;
      const j = jointM / (tile / cells);
      const edge =
        Math.min(smoothstep(0, j, fu), smoothstep(0, j, 1 - fu)) *
        Math.min(smoothstep(0, j, fv), smoothstep(0, j, 1 - fv));
      // A pressed tile is very slightly domed; a glass chip more so, and that dome is the only
      // reason a wall of them catches the sun in bands rather than as one sheet.
      const dome = 1 - Math.pow(Math.max(Math.abs(fu * 2 - 1), Math.abs(fv * 2 - 1)), 4) * 0.32;
      const h = clamp01(edge * (0.7 + 0.3 * dome));
      const pick = hash2(cx, cy, seed);
      return {
        h,
        cell: pick,
        tint: (hash2(cx, cy, seed + 91) - 0.5) * 0.14,
        joint: 1 - edge,
        accent: 0,
      };
    }
    case 'lanes': {
      // Competition lanes: 2.5 m of field tile and a 250 mm dark line down the middle of each.
      const unit = 0.15;
      const cells = Math.max(2, Math.round(tile / unit));
      const cx = Math.floor(u * cells);
      const cy = Math.floor(v * cells);
      const fu = u * cells - cx;
      const fv = v * cells - cy;
      const j = 0.004 / (tile / cells);
      const edge =
        Math.min(smoothstep(0, j, fu), smoothstep(0, j, 1 - fu)) *
        Math.min(smoothstep(0, j, fv), smoothstep(0, j, 1 - fv));
      const half = r.accentWidth / 2 / tile;
      const d = Math.abs(u - 0.5);
      const lane = 1 - smoothstep(half - 0.004, half + 0.004, d);
      return {
        h: clamp01(edge * 0.95),
        cell: hash2(cx, cy, seed),
        tint: (hash2(cx, cy, seed + 91) - 0.5) * 0.12,
        joint: 1 - edge,
        accent: lane,
      };
    }
    case 'slate':
    case 'stone': {
      // Sawn slabs on a running bond, with a riven face.
      const unit = r.pattern === 'slate' ? 0.4 : 0.6;
      const rows = Math.max(2, Math.round(tile / unit));
      const cols = Math.max(2, Math.round(tile / (unit * 2)));
      const rowF = v * rows;
      const row = Math.floor(rowF);
      const colF = u * cols + (row % 2 === 0 ? 0 : 0.5);
      const col = Math.floor(colF);
      const fu = colF - col;
      const fv = rowF - row;
      const ju = 0.006 / (tile / cols);
      const jv = 0.006 / (tile / rows);
      const edge =
        Math.min(smoothstep(0, ju, fu), smoothstep(0, ju, 1 - fu)) *
        Math.min(smoothstep(0, jv, fv), smoothstep(0, jv, 1 - fv));
      const riven = fbm(u, v, 26, 3, seed + 7);
      return {
        h: clamp01(edge * (0.6 + 0.34 * riven)),
        cell: hash2(col, row, seed),
        tint: (hash2(col, row, seed + 5) - 0.5) * 0.5 + (riven - 0.5) * 0.34,
        joint: 1 - edge,
        accent: 0,
      };
    }
    case 'pebble': {
      // Exposed-aggregate render: a Worley field of stones set in a matrix.
      const cells = Math.max(4, Math.round(tile / 0.035));
      const w = worley(u * cells, v * cells, cells, seed);
      const stone = smoothstep(0.55, 0.1, w.f1);
      return {
        h: clamp01(stone * (0.55 + 0.45 * (1 - w.f1))),
        cell: w.cell,
        tint: (w.cell - 0.5) * 0.5,
        joint: 1 - stone,
        accent: 0,
      };
    }
    case 'timber': {
      // Deck boards: 145 mm wide, a 5 mm gap, grain along the board and two fixings a course.
      const boardW = 0.145;
      const rows = Math.max(2, Math.round(tile / boardW));
      const rowF = v * rows;
      const row = Math.floor(rowF);
      const fv = rowF - row;
      const gap = 0.005 / boardW;
      const edge = Math.min(smoothstep(0, gap, fv), smoothstep(0, gap, 1 - fv));
      const grain = fbm(u * 4, v * 46, 34, 3, seed + row * 17);
      const ring = 0.5 + 0.5 * Math.sin((u * 9 + grain * 4.5) * Math.PI * 2);
      return {
        h: clamp01(edge * (0.68 + 0.24 * ring + 0.1 * grain)),
        cell: hash2(row, 0, seed),
        tint: (hash2(row, 0, seed + 3) - 0.5) * 0.5 + (ring - 0.5) * 0.34,
        joint: 1 - edge,
        accent: 0,
      };
    }
    case 'sand': {
      // Wind ripples across the grain, warped so they are not stripes.
      const grain = fbm(u, v, 190, 2, seed + 31);
      const warp = fbm(u, v, 6, 3, seed + 11);
      const ripple = 0.5 + 0.5 * Math.sin((v * 22 + warp * 5.5) * Math.PI * 2);
      return {
        h: clamp01(ripple * 0.45 + grain * 0.42 + warp * 0.13),
        cell: warp,
        tint: (grain - 0.5) * 0.4 + (warp - 0.5) * 0.5,
        joint: 0,
        accent: 0,
      };
    }
    case 'concrete':
    default: {
      // Broom-finished slabs with a saw-cut joint. A pool deck, not a pavement.
      const cells = Math.max(1, Math.round(tile / 1.2));
      const cx = Math.floor(u * cells);
      const cy = Math.floor(v * cells);
      const fu = u * cells - cx;
      const fv = v * cells - cy;
      const j = 0.008 / (tile / cells);
      const edge =
        Math.min(smoothstep(0, j, fu), smoothstep(0, j, 1 - fu)) *
        Math.min(smoothstep(0, j, fv), smoothstep(0, j, 1 - fv));
      const broom = 0.5 + 0.5 * Math.sin((v * 150 + fbm(u, v, 9, 2, seed) * 7) * Math.PI * 2);
      const grit = fbm(u, v, 210, 2, seed + 17);
      const stain = fbm(u, v, 5, 4, seed + 41);
      return {
        h: clamp01(edge * (0.8 + 0.1 * broom + 0.1 * grit)),
        cell: hash2(cx, cy, seed),
        tint: (hash2(cx, cy, seed) - 0.5) * 0.5 + (stain - 0.5) * 0.5,
        joint: 1 - edge,
        accent: 0,
      };
    }
  }
}

/** Tileable value noise, folded on the unit square so the texture has no seam. */
function noise(x: number, y: number, wrap: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const w = (a: number) => ((a % wrap) + wrap) % wrap;
  const a = hash2(w(xi), w(yi), seed);
  const b = hash2(w(xi + 1), w(yi), seed);
  const c = hash2(w(xi), w(yi + 1), seed);
  const d = hash2(w(xi + 1), w(yi + 1), seed);
  const top = a + (b - a) * u;
  return top + (c + (d - c) * u - top) * v;
}

function fbm(u: number, v: number, freq: number, octaves: number, seed: number): number {
  let f = Math.max(1, Math.round(freq));
  let amp = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(u * f, v * f, f, seed + o * 131) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / (norm || 1);
}

/** Worley: distance to the nearest and second-nearest jittered cell point, and the nearest's hash. */
function worley(
  x: number,
  y: number,
  cells: number,
  seed: number
): { f1: number; f2: number; cell: number } {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  let f1 = 9;
  let f2 = 9;
  let cell = 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const wx = (((gx + ox) % cells) + cells) % cells;
      const wy = (((gy + oy) % cells) + cells) % cells;
      const jx = gx + ox + hash2(wx, wy, seed);
      const jy = gy + oy + hash2(wx, wy, seed + 977);
      const d = Math.hypot(x - jx, y - jy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        cell = hash2(wx, wy, seed + 313);
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return { f1, f2, cell };
}

/**
 * Linear 0..1 to an sRGB byte.
 *
 * The recipes are written in LINEAR colour, and Babylon samples an albedo texture as sRGB and
 * converts it back; storing the linear value raw darkens every surface by the whole transfer
 * function. Normal and ORM maps are read raw and carry `gammaSpace = false`.
 */
function srgbByte(linear: number): number {
  const v = linear <= 0 ? 0 : linear >= 1 ? 1 : linear;
  const encoded = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(255 * encoded);
}

function raw(scene: Scene, name: string, size: number, data: Uint8Array): RawTexture {
  const tex = new RawTexture(
    data,
    size,
    size,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  tex.name = name;
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.hasAlpha = false;
  // A pool deck and a pool floor are both seen at a grazing angle for most of a frame; without
  // anisotropy the far half of either turns to grey mush and takes the grout with it.
  tex.anisotropicFilteringLevel = 8;
  return tex;
}

export function createSurfaceTextures(
  scene: Scene,
  recipe: SurfaceRecipe,
  size: number
): SurfaceTextureSet {
  const height = new Float32Array(size * size);
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const orm = new Uint8Array(size * size * 4);
  const cells = new Float32Array(size * size);
  const tints = new Float32Array(size * size);
  const joints = new Float32Array(size * size);
  const accents = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = sample(recipe, (x + 0.5) / size, (y + 0.5) / size);
      const i = y * size + x;
      height[i] = s.h;
      cells[i] = s.cell;
      tints[i] = s.tint;
      joints[i] = s.joint;
      accents[i] = s.accent;
    }
  }

  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const strength = recipe.relief * 6;
  const palette = recipe.colors.length
    ? recipe.colors
    : [[0.5, 0.5, 0.5] as [number, number, number]];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = y * size + x;
      const i = k * 4;
      const h = height[k];
      const joint = joints[k];
      const tint = tints[k];
      const base = palette[Math.min(palette.length - 1, Math.floor(cells[k] * palette.length))];

      // Occlusion from the local height deficit: a pixel much lower than its neighbours is in a
      // joint and sees less sky. The floor is high on purpose — a 3 mm grout line is not a cave.
      const around =
        (at(x + 2, y) +
          at(x - 2, y) +
          at(x, y + 2) +
          at(x, y - 2) +
          at(x + 2, y + 2) +
          at(x - 2, y - 2)) /
        6;
      const ao = clamp01(0.6 + 0.4 * clamp01(1 - (around - h) * 2.6));

      for (let c = 0; c < 3; c++) {
        const face = clamp01(base[c] * (1 + tint) + (h - 0.72) * 0.05);
        let value = mix(recipe.grout[c], face, 1 - joint);
        value = mix(value, recipe.accent[c], accents[k]);
        // Only a hint of occlusion in the albedo; the ORM's red carries the real thing.
        albedo[i + c] = srgbByte(value * (0.88 + 0.12 * ao));
      }
      albedo[i + 3] = 255;

      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      normal[i] = Math.round(255 * ((-dx / len) * 0.5 + 0.5));
      normal[i + 1] = Math.round(255 * ((-dy / len) * 0.5 + 0.5));
      normal[i + 2] = Math.round(255 * ((1 / len) * 0.5 + 0.5));
      normal[i + 3] = 255;

      const rough = clamp01(
        mix(recipe.roughness[0], recipe.roughness[1], joint * 0.85 + (1 - h) * 0.3)
      );
      orm[i] = Math.round(255 * ao);
      orm[i + 1] = Math.round(255 * rough);
      orm[i + 2] = 0;
      orm[i + 3] = 255;
    }
  }

  const albedoTex = raw(scene, `pool-${recipe.id}-albedo`, size, albedo);
  const normalTex = raw(scene, `pool-${recipe.id}-normal`, size, normal);
  const ormTex = raw(scene, `pool-${recipe.id}-orm`, size, orm);
  normalTex.gammaSpace = false;
  ormTex.gammaSpace = false;
  return {
    albedo: albedoTex,
    normal: normalTex,
    orm: ormTex,
    dispose() {
      albedoTex.dispose();
      normalTex.dispose();
      ormTex.dispose();
    },
  };
}

/**
 * The caustic net, as a tiling emissive map.
 *
 * `F2 − F1` of a Worley field is the distance to a cell BORDER, so thresholding it gives the thin
 * closed loops a real caustic draws. Two scales are summed — a coarse net and a finer one — and the
 * three channels are sampled at slightly different offsets so the lines fringe warm on one side and
 * cold on the other, which is what light through a wavy surface actually does.
 */
export function createCaustics(scene: Scene, size: number, seed: number): RawTexture {
  const cellsA = 6;
  const cellsB = 11;
  // One pass, not three. The first version evaluated the whole net once per CHANNEL at a small
  // offset — six Worley lookups per texel, nine cells each — and a 192² map cost about 2 M of them
  // at boot, on the main thread, where it is measured as boot time and shows up as the worker-ready
  // notice. The fringe is a texel shift, so it costs an index and not a lookup.
  const net = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const a = worley(u * cellsA, v * cellsA, cellsA, seed);
      const b = worley(u * cellsB, v * cellsB, cellsB, seed + 77);
      const lineA = smoothstep(0.3, 0.02, a.f2 - a.f1);
      const lineB = smoothstep(0.24, 0.02, b.f2 - b.f1);
      net[y * size + x] = clamp01(lineA * 0.75 + lineB * 0.45 + lineA * lineB * 0.5);
    }
  }
  const at = (x: number, y: number) => net[((y + size) % size) * size + ((x + size) % size)];
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Real caustics fringe — light through a wavy surface separates. One texel each way is a
      // hint and not a rainbow.
      data[i] = Math.round(255 * at(x + 1, y));
      data[i + 1] = Math.round(255 * at(x, y));
      data[i + 2] = Math.round(255 * at(x - 1, y + 1));
      data[i + 3] = 255;
    }
  }
  return raw(scene, 'pool-caustics', size, data);
}

/**
 * The two ripple normals for the water surface: the same generator at two seeds, so the second
 * scrolling layer is a different wave train rather than the same one offset.
 *
 * A pool is not a lake. The chop is short (0.3-0.6 m between crests against a lake's several
 * metres) and there is no swell at all, because there is no fetch — the wind cannot get a run at
 * water twenty metres across. So this is two crossed short-wave trains and a fine detail, and it
 * tiles in 3 m against the terrain water's 8.
 */
export function createRipple(scene: Scene, size: number, seed: number): RawTexture {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const a = Math.sin((u * 5 + fbm(u, v, 4, 3, seed) * 1.7) * Math.PI * 2);
      const b = Math.sin((v * 7 + fbm(u, v, 6, 2, seed + 51) * 2.1) * Math.PI * 2);
      h[y * size + x] = a * 0.42 + b * 0.38 + fbm(u, v, 22, 2, seed + 97) * 0.3;
    }
  }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const k = y * size + x;
      const dx = (h[y * size + xm] - h[y * size + xp]) * 0.8;
      const dy = (h[ym * size + x] - h[yp * size + x]) * 0.8;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      data[k * 4] = Math.round((dx * inv * 0.5 + 0.5) * 255);
      data[k * 4 + 1] = Math.round((dy * inv * 0.5 + 0.5) * 255);
      data[k * 4 + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      data[k * 4 + 3] = 255;
    }
  }
  const tex = raw(scene, `pool-ripple-${seed}`, size, data);
  tex.gammaSpace = false;
  return tex;
}

/** A tile style as a surface recipe. */
export function tileRecipe(tile: PoolTileSpec, seed: number): SurfaceRecipe {
  return {
    id: `tile-${tile.id}`,
    pattern: tile.pattern,
    tileMetres: tile.tileMetres,
    colors: tile.colors.map(hexToLinear),
    grout: hexToLinear(tile.grout),
    accent: hexToLinear(tile.lane),
    accentWidth: tile.laneWidth,
    roughness: tile.roughness,
    relief: tile.relief,
    seed,
  };
}

/** The coping, from the edge treatment. Cast stone with a fine sawn face. */
export function copingRecipe(edge: PoolEdgeSpec, seed: number): SurfaceRecipe {
  const base = hexToLinear(edge.copingColor);
  return {
    id: `coping-${edge.id}`,
    pattern: 'stone',
    tileMetres: 1.2,
    colors: [base, scale(base, 0.92), scale(base, 1.06)],
    grout: scale(base, 0.66),
    accent: scale(base, 0.5),
    accentWidth: 0,
    roughness: [0.42, 0.7],
    relief: 0.55,
    seed,
  };
}

/** The deck, from the edge treatment's surface and colour. */
export function deckRecipe(edge: PoolEdgeSpec, seed: number): SurfaceRecipe {
  const base = hexToLinear(edge.deckColor);
  const pattern: SurfacePattern =
    edge.deck === 'timber'
      ? 'timber'
      : edge.deck === 'stone'
        ? 'stone'
        : edge.deck === 'sand'
          ? 'sand'
          : 'concrete';
  return {
    id: `deck-${edge.id}`,
    pattern,
    tileMetres: pattern === 'timber' ? 2.4 : pattern === 'sand' ? 3 : 2.4,
    colors: [base, scale(base, 0.9), scale(base, 1.08), scale(base, 0.96)],
    grout: scale(base, 0.6),
    accent: scale(base, 0.5),
    accentWidth: 0,
    roughness: pattern === 'sand' ? [0.82, 0.9] : pattern === 'timber' ? [0.5, 0.72] : [0.6, 0.82],
    relief: pattern === 'sand' ? 0.7 : pattern === 'timber' ? 0.6 : 0.5,
    seed,
  };
}

const scale = (c: [number, number, number], k: number): [number, number, number] => [
  clamp01(c[0] * k),
  clamp01(c[1] * k),
  clamp01(c[2] * k),
];
