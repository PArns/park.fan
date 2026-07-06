/**
 * Bench/board bookkeeping helpers: placement, lookup and the 3-copies →
 * star-up merge rule. Pure functions over PlayerState.
 */

import { BENCH_SLOTS, HALF_ROWS, BOARD_COLS, hexKey, type Hex } from './hex';
import type { OwnedUnit, PlayerState } from './types';

export function boardCount(p: PlayerState): number {
  return Object.keys(p.board).length;
}

export function allUnits(p: PlayerState): { unit: OwnedUnit; where: 'bench' | 'board' }[] {
  const out: { unit: OwnedUnit; where: 'bench' | 'board' }[] = [];
  for (const u of p.bench) if (u) out.push({ unit: u, where: 'bench' });
  for (const key of Object.keys(p.board)) out.push({ unit: p.board[key], where: 'board' });
  return out;
}

export function findUnit(
  p: PlayerState,
  uid: string
): {
  unit: OwnedUnit;
  loc: { kind: 'bench'; index: number } | { kind: 'board'; key: string };
} | null {
  for (let i = 0; i < p.bench.length; i++) {
    const u = p.bench[i];
    if (u?.uid === uid) return { unit: u, loc: { kind: 'bench', index: i } };
  }
  for (const key of Object.keys(p.board)) {
    if (p.board[key].uid === uid) return { unit: p.board[key], loc: { kind: 'board', key } };
  }
  return null;
}

export function removeUnit(p: PlayerState, uid: string): OwnedUnit | null {
  const found = findUnit(p, uid);
  if (!found) return null;
  if (found.loc.kind === 'bench') p.bench[found.loc.index] = null;
  else delete p.board[found.loc.key];
  return found.unit;
}

export function firstFreeBenchSlot(p: PlayerState): number {
  for (let i = 0; i < BENCH_SLOTS; i++) if (!p.bench[i]) return i;
  return -1;
}

export function isValidLocalHex(hex: Hex): boolean {
  return hex.col >= 0 && hex.col < BOARD_COLS && hex.row >= 0 && hex.row < HALF_ROWS;
}

/**
 * Merge any 3 identical (defId, star) copies into one star+1 unit.
 * Prefers keeping a board copy in place (TFT behaviour). Cascades:
 * three 2★ formed from merges become a 3★.
 */
export function applyMerges(p: PlayerState): void {
  let merged = true;
  while (merged) {
    merged = false;
    for (const star of [1, 2] as const) {
      const groups = new Map<string, { uid: string; where: 'bench' | 'board' }[]>();
      for (const { unit, where } of allUnits(p)) {
        if (unit.star !== star) continue;
        const list = groups.get(unit.defId) ?? [];
        list.push({ uid: unit.uid, where });
        groups.set(unit.defId, list);
      }
      for (const [, copies] of groups) {
        if (copies.length < 3) continue;
        // Keep a board copy if one exists, otherwise the first bench copy.
        const keep = copies.find((c) => c.where === 'board') ?? copies[0];
        const kept = findUnit(p, keep.uid);
        if (!kept) continue;
        let removed = 0;
        for (const c of copies) {
          if (c.uid === keep.uid || removed >= 2) continue;
          removeUnit(p, c.uid);
          removed++;
        }
        kept.unit.star = (star + 1) as 2 | 3;
        merged = true;
      }
    }
  }
}

/** Local hex occupied by which uid (for drag & drop + AI placement). */
export function unitAtHex(p: PlayerState, hex: Hex): OwnedUnit | null {
  return p.board[hexKey(hex)] ?? null;
}
