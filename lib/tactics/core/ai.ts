/**
 * Opponent AI. It plays through the exact same rule-checked `applyCommand`
 * API as the human player — it cannot cheat, and every decision is driven by
 * the shared econ RNG stream so a whole match stays reproducible from one
 * seed.
 *
 * Strategy (deliberately "solid but beatable" for a queue-time casual game):
 *   - buy copies that complete triples, then pairs, then new trait bodies,
 *   - keep interest gold from round 4 on unless low HP forces a spend-down,
 *   - buy XP mid-game, reroll only with surplus gold,
 *   - re-position every round: melees to the front row, long range to the
 *     back, centred columns.
 */

import { allUnits, unitAtHex } from './board';
import { UNITS } from './data';
import { REROLL_COST, XP_COST, unitCap } from './economy';
import { HALF_ROWS, hexKey, type Hex } from './hex';
import { applyCommand, withEconRng } from './game';
import type { GameState, PlayerId, PlayerState } from './types';

export function aiPlanTurn(state: GameState, pid: PlayerId = 'p2'): void {
  const p = state.players[pid];

  withEconRng(state, (r) => {
    const reserve = goldReserve(state, p);
    shoppingSpree(state, pid, p, reserve);

    // Level up mid-game when gold allows.
    if (state.round >= 4) {
      let guard = 0;
      while (p.gold >= reserve + XP_COST && p.level < 8 && guard++ < 3) {
        if (!applyCommand(state, pid, { type: 'buyXp' }).ok) break;
      }
    }

    // Reroll with surplus (small random chance keeps runs varied but seeded).
    let rerolls = 0;
    while (p.gold >= reserve + REROLL_COST + 6 && rerolls < 3 && r.next() < 0.75) {
      if (!applyCommand(state, pid, { type: 'reroll' }).ok) break;
      shoppingSpree(state, pid, p, reserve);
      rerolls++;
    }
  });

  positionBoard(state, pid, p);
}

function goldReserve(state: GameState, p: PlayerState): number {
  if (state.round < 4) return 0;
  if (p.hp <= 40) return 0; // desperate: all-in
  return Math.min(30, Math.floor(state.round / 2) * 10);
}

/** Buy from the shop by priority until gold/bench run out. */
function shoppingSpree(state: GameState, pid: PlayerId, p: PlayerState, reserve: number): void {
  let bought = true;
  while (bought) {
    bought = false;
    const owned = new Map<string, number>();
    for (const { unit } of allUnits(p)) {
      if (unit.star === 1) owned.set(unit.defId, (owned.get(unit.defId) ?? 0) + 1);
    }
    const slots = p.shop
      .map((defId, slot) => ({ defId, slot }))
      .filter((s): s is { defId: string; slot: number } => !!s.defId);

    let best: { slot: number; score: number; cost: number } | null = null;
    for (const { defId, slot } of slots) {
      const def = UNITS[defId];
      if (p.gold - def.cost < reserve && p.gold - def.cost < 0) continue;
      if (p.gold < def.cost) continue;
      const copies = owned.get(defId) ?? 0;
      let score = def.cost; // baseline: expensive = better body
      if (copies >= 2)
        score += 100; // completes a triple
      else if (copies === 1) score += 40; // pair
      if (p.gold - def.cost < reserve && copies < 1) continue; // only break reserve for pairs+
      if (best === null || score > best.score) best = { slot, score, cost: def.cost };
    }
    if (best) {
      const res = applyCommand(state, pid, { type: 'buyUnit', slot: best.slot });
      bought = res.ok;
    }
  }
}

/** Clear and re-place the strongest units in a sensible formation. */
function positionBoard(state: GameState, pid: PlayerId, p: PlayerState): void {
  // Pull everything back to bench first (frees cap for stronger units).
  for (const key of Object.keys(p.board)) {
    const uid = p.board[key].uid;
    // Find a free bench slot; if bench is full the unit stays on board.
    const free = p.bench.findIndex((b) => b === null);
    if (free === -1) break;
    applyCommand(state, pid, { type: 'moveUnit', uid, dest: { kind: 'bench', index: free } });
  }

  const cap = unitCap(p.level);
  const roster = allUnits(p)
    .map(({ unit }) => ({ unit, def: UNITS[unit.defId] }))
    .sort((a, b) => b.def.cost * b.unit.star - a.def.cost * a.unit.star);

  const centredCols = [3, 2, 4, 1, 5, 0, 6];
  const placed: string[] = [];
  for (const { unit, def } of roster) {
    if (placed.length >= cap) break;
    if (placed.includes(unit.uid)) continue;
    // Front row (local row 3) for melee, mid for short range, back for long.
    const row = def.range <= 1 ? HALF_ROWS - 1 : def.range >= 4 ? 0 : 1;
    const hex = firstFreeInRow(p, row, centredCols) ?? anyFreeHex(p, centredCols);
    if (!hex) break;
    const res = applyCommand(state, pid, {
      type: 'moveUnit',
      uid: unit.uid,
      dest: { kind: 'board', hex },
    });
    if (res.ok) placed.push(unit.uid);
  }
}

function firstFreeInRow(p: PlayerState, row: number, cols: number[]): Hex | null {
  for (const col of cols) {
    const hex = { col, row };
    if (!unitAtHex(p, hex)) return hex;
  }
  return null;
}

function anyFreeHex(p: PlayerState, cols: number[]): Hex | null {
  for (let row = HALF_ROWS - 1; row >= 0; row--) {
    for (const col of cols) {
      const hex = { col, row };
      if (!p.board[hexKey(hex)]) return hex;
    }
  }
  return null;
}
