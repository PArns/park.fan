/**
 * Shop rolls against the shared unit pool.
 *
 * Simplification vs real TFT: units offered in a shop are not reserved from
 * the pool while displayed — the pool only shrinks on purchase and refills on
 * sell. Good enough for 1-v-AI; documented so nobody mistakes it for a bug.
 */

import { UNIT_LIST } from './data';
import { SHOP_ODDS, SHOP_SLOTS } from './economy';
import type { Rng } from './rng';

/** Roll a full shop for a player of `level` given the current pool. */
export function rollShop(rng: Rng, level: number, pool: Record<string, number>): (string | null)[] {
  const odds = SHOP_ODDS[Math.min(9, Math.max(1, level))];
  const shop: (string | null)[] = [];
  for (let i = 0; i < SHOP_SLOTS; i++) {
    shop.push(rollSlot(rng, odds, pool));
  }
  return shop;
}

function rollSlot(
  rng: Rng,
  odds: [number, number, number, number, number],
  pool: Record<string, number>
): string | null {
  // Pick a cost tier by the odds table, then fall back downwards (and finally
  // upwards) if that tier's pool is empty.
  const roll = rng.next() * 100;
  let acc = 0;
  let tier = 1;
  for (let c = 0; c < 5; c++) {
    acc += odds[c];
    if (roll < acc) {
      tier = c + 1;
      break;
    }
  }
  for (const t of fallbackOrder(tier)) {
    const id = pickFromTier(rng, t, pool);
    if (id) return id;
  }
  return null;
}

function fallbackOrder(tier: number): number[] {
  const down = [];
  for (let t = tier; t >= 1; t--) down.push(t);
  for (let t = tier + 1; t <= 5; t++) down.push(t);
  return down;
}

function pickFromTier(rng: Rng, tier: number, pool: Record<string, number>): string | null {
  const candidates = UNIT_LIST.filter((u) => u.cost === tier && (pool[u.id] ?? 0) > 0);
  if (candidates.length === 0) return null;
  // Weight by remaining copies so thinned-out units show up less.
  const total = candidates.reduce((s, u) => s + pool[u.id], 0);
  let roll = rng.next() * total;
  for (const u of candidates) {
    roll -= pool[u.id];
    if (roll < 0) return u.id;
  }
  return candidates[candidates.length - 1].id;
}
