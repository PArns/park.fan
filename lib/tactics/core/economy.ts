/**
 * Economy rules — modelled on the researched TFT reference values
 * (shop odds / pool sizes / interest, cf. metatft.com/tables/shop-odds and
 * esportstales.com champion-pool tables), scaled down to this prototype's
 * 16-unit roster.
 */

export const SHOP_SLOTS = 5;
export const REROLL_COST = 2;
export const XP_COST = 4;
export const XP_PER_BUY = 4;
export const XP_PER_ROUND = 2;
export const MAX_LEVEL = 9;
export const BASE_INCOME = 5;
export const MAX_INTEREST = 5;
export const STARTING_GOLD = 6;
export const STARTING_HP = 100;

/** XP needed to reach the NEXT level (index = current level). */
export const XP_TABLE: Record<number, number> = {
  1: 2,
  2: 2,
  3: 6,
  4: 10,
  5: 20,
  6: 36,
  7: 56,
  8: 80,
  9: Infinity,
};

/**
 * Shop odds per level: probability (in %) of a slot rolling cost 1..5.
 * TFT-style curve compressed to 9 levels.
 */
export const SHOP_ODDS: Record<number, [number, number, number, number, number]> = {
  1: [100, 0, 0, 0, 0],
  2: [100, 0, 0, 0, 0],
  3: [75, 25, 0, 0, 0],
  4: [55, 30, 15, 0, 0],
  5: [45, 33, 20, 2, 0],
  6: [30, 40, 25, 5, 0],
  7: [19, 35, 35, 10, 1],
  8: [17, 24, 32, 24, 3],
  9: [10, 15, 30, 30, 15],
};

/** Copies of each unit in the shared pool, by cost (scaled-down TFT bags). */
export const POOL_SIZES: Record<number, number> = { 1: 18, 2: 14, 3: 12, 4: 9, 5: 7 };

/** Board unit cap = player level (TFT rule). */
export function unitCap(level: number): number {
  return level;
}

export function interestFor(gold: number): number {
  return Math.min(MAX_INTEREST, Math.floor(gold / 10));
}

/** Streak bonus (win or loss streak, whichever is active). */
export function streakBonus(streak: number): number {
  if (streak >= 5) return 3;
  if (streak >= 4) return 2;
  if (streak >= 2) return 1;
  return 0;
}

/** Sell value: full invested copy value (cost × copies merged). */
export function sellValue(cost: number, star: 1 | 2 | 3): number {
  const copies = star === 1 ? 1 : star === 2 ? 3 : 9;
  // 1-gold units always sell for copies × 1; higher tiers lose 1g on merged
  // units (TFT-style) to keep star-ups a commitment.
  const raw = cost * copies;
  return star === 1 ? raw : cost === 1 ? raw : raw - 1;
}

/**
 * Player damage after a lost combat: round-scaled base + surviving units'
 * star levels (TFT-style stage base + per-survivor damage).
 */
export function playerDamage(round: number, survivorStars: number[]): number {
  const base = Math.min(8, 2 + Math.floor(round / 3));
  let dmg = base;
  for (const star of survivorStars) dmg += star;
  return dmg;
}
