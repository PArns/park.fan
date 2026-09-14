/**
 * What a guest looks like, as a pure function of a 16-bit number.
 *
 * The sim rolls one `u16` per guest and puts it in the `guests.style` frame buffer; the renderer
 * decodes it into skin, hair, top, bottom, height and build. Both sides call the same function
 * over the same archetype list, so the two agree by construction.
 *
 * **Why not roll the colours on each side from `ctx.rng`.** Both threads fork their stream from
 * `world.meta.seed` and would, in principle, produce the same sequence — until one side draws one
 * extra number. A guest's shirt would then depend on how many times an unrelated part of the
 * renderer rolled a die, which is a bug with no scene of the crime: nothing throws, the park just
 * repaints. A `u16` on the wire costs 2 bytes per guest per frame (4 KB at 2 000 guests) and
 * removes the whole class.
 *
 * The layout is `archetypeIndex × 256 + variant`. 256 archetypes is far more than a pack set will
 * carry, and 256 variants is enough that a crowd does not repeat visibly: the four palette picks
 * are independent hashes of the variant, so 256 variants over a 7 × 8 × 10 × 7 palette give
 * 249 distinct combinations in the base game rather than 256 copies of eight.
 *
 * Pure: no Babylon, no DOM, node-safe, and the selftest checks it against the sim's own rolls.
 */

import type { GuestArchetypeDef } from './types';

export const STYLE_VARIANTS = 256;

export interface GuestLook {
  archetype: GuestArchetypeDef;
  /** Linear RGB, 0..1, ready for a thin-instance colour buffer. */
  skin: [number, number, number];
  hair: [number, number, number];
  top: [number, number, number];
  bottom: [number, number, number];
  /** Bare arms take the skin colour, sleeves take the top's. */
  arm: [number, number, number];
  /** Standing height in metres, including the head. */
  height: number;
  /** Head height as a fraction of the standing height. A child is not a small adult. */
  headRatio: number;
  /** Shoulder width multiplier, 0.92..1.08. */
  build: number;
  /** Radians per metre walked: the walk cadence, shorter legs step faster. */
  cadence: number;
}

export function encodeStyle(archetypeIndex: number, variant: number): number {
  return ((archetypeIndex & 0xff) << 8) | (variant & 0xff);
}

export function styleArchetype(style: number): number {
  return (style >> 8) & 0xff;
}

export function styleVariant(style: number): number {
  return style & 0xff;
}

/** A small integer hash so two adjacent variants are not two nearly identical people. */
function mix(variant: number, salt: number): number {
  let h = (variant * 0x9e3779b1 + salt * 0x85ebca6b) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

/** 0..1 from the same hash. */
function unit(variant: number, salt: number): number {
  return mix(variant, salt) / 4294967296;
}

/**
 * sRGB hex to LINEAR rgb.
 *
 * The instance colour multiplies `surfaceAlbedo` in the PBR fragment shader, which is already
 * linear by then (the albedo texture is declared gamma-space and converted on the way in). Passing
 * the sRGB value straight through makes every guest about 25 % too bright and washes the whole
 * palette towards pastel, which is exactly the failure the art bible calls "flat".
 */
export function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const to = (v: number): number => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [to((n >> 16) & 0xff), to((n >> 8) & 0xff), to(n & 0xff)];
}

const HEAD_RATIO: Record<GuestArchetypeDef['age'], number> = {
  // 1:7.5 for an adult is the art bible's stylised proportion; a six-year-old is nearer 1:5.5, and
  // the difference between those two numbers is the whole reason a family reads as a family.
  adult: 1 / 7.4,
  child: 1 / 5.6,
  senior: 1 / 7.2,
};

const cache = new Map<number, GuestLook>();
let cacheKey = '';

/**
 * Decode one style word.
 *
 * Memoised because the renderer asks for it once per visible guest per frame and the answer is a
 * pure function of two integers; the cache is dropped whenever the archetype list changes, which
 * is what the key is for (a pack loaded at runtime appends an archetype and must repaint nothing
 * that already exists, but must not hand back a stale `GuestArchetypeDef` object either).
 */
export function decodeStyle(style: number, archetypes: readonly GuestArchetypeDef[]): GuestLook {
  const key = `${archetypes.length}:${archetypes.map((a) => a.id).join(',')}`;
  if (key !== cacheKey) {
    cache.clear();
    cacheKey = key;
  }
  const found = cache.get(style);
  if (found) return found;
  const look = buildLook(style, archetypes);
  cache.set(style, look);
  return look;
}

function buildLook(style: number, archetypes: readonly GuestArchetypeDef[]): GuestLook {
  const index = Math.min(styleArchetype(style), Math.max(0, archetypes.length - 1));
  const archetype = archetypes[index] ?? archetypes[0];
  const variant = styleVariant(style);
  const p = archetype.palette;
  const pick = <T>(list: readonly T[], salt: number): T => list[mix(variant, salt) % list.length];

  const skin = hexToLinear(pick(p.skin, 11));
  const top = hexToLinear(pick(p.top, 23));
  const bare = unit(variant, 41) < archetype.bareArms;
  // ±4 % on the height, and it is what stops a queue reading as a fence: a row of figures that are
  // all exactly 1.74 m has a dead straight top edge, which no real line of people has.
  const height = archetype.height * (0.96 + unit(variant, 53) * 0.08);
  return {
    archetype,
    skin,
    hair: hexToLinear(pick(p.hair, 17)),
    top,
    bottom: hexToLinear(pick(p.bottom, 29)),
    arm: bare ? skin : top,
    height,
    headRatio: HEAD_RATIO[archetype.age],
    build: 0.92 + unit(variant, 67) * 0.16,
    // A stride is about 0.42 of standing height, and a cycle is two strides, so a full 2π of the
    // walk phase covers 0.84 × height metres. Short legs therefore step visibly faster at the same
    // ground speed, which is most of what makes a child read as a child from behind.
    cadence: (2 * Math.PI) / (0.84 * height),
  };
}

/** Drop the memo. The renderer calls this when a pack arrives and the archetype list grows. */
export function resetStyleCache(): void {
  cache.clear();
  cacheKey = '';
}
