/**
 * Match state machine: planning-phase commands, combat setup (board halves
 * rotated into global space), result resolution, economy and PvE rounds.
 *
 * Queue-friendly by design: there is NO planning countdown — combat starts
 * when the player taps "Fight". The whole GameState is plain data, so the
 * HUD auto-saves it to localStorage every round and a match survives putting
 * the phone away in the queue.
 */

import {
  applyMerges,
  boardCount,
  findUnit,
  firstFreeBenchSlot,
  isValidLocalHex,
  removeUnit,
} from './board';
import { MINION_WAVES, UNITS, UNIT_LIST } from './data';
import {
  BASE_INCOME,
  POOL_SIZES,
  REROLL_COST,
  SHOP_SLOTS,
  STARTING_GOLD,
  STARTING_HP,
  XP_COST,
  XP_PER_BUY,
  XP_PER_ROUND,
  XP_TABLE,
  MAX_LEVEL,
  interestFor,
  playerDamage,
  sellValue,
  streakBonus,
  unitCap,
} from './economy';
import { BENCH_SLOTS, hexKey, parseHexKey, rotate180 } from './hex';
import { createRng, hashSeed, type Rng } from './rng';
import { rollShop } from './shop';
import { runCombat, type CombatUnitInput } from './combat';
import type { Command, CombatReplay, GameState, PlayerId, PlayerState } from './types';

export const PVE_ROUNDS = MINION_WAVES.length;

/* ------------------------------------------------------------------ */
/* Creation                                                            */
/* ------------------------------------------------------------------ */

function createPlayer(id: PlayerId): PlayerState {
  return {
    id,
    hp: STARTING_HP,
    gold: STARTING_GOLD,
    level: 2,
    xp: 0,
    winStreak: 0,
    lossStreak: 0,
    bench: Array(BENCH_SLOTS).fill(null),
    board: {},
    shop: Array(SHOP_SLOTS).fill(null),
    ready: false,
  };
}

export function createGame(seed: number): GameState {
  const pool: Record<string, number> = {};
  for (const u of UNIT_LIST) pool[u.id] = POOL_SIZES[u.cost];

  const state: GameState = {
    seed,
    round: 1,
    phase: 'planning',
    players: { p1: createPlayer('p1'), p2: createPlayer('p2') },
    pool,
    rngState: hashSeed(seed, 'econ'),
    lastCombat: null,
    winner: null,
    nextUid: 1,
  };
  rollShops(state);
  return state;
}

function rng(state: GameState): Rng {
  return createRng(state.rngState);
}

function commitRng(state: GameState, r: Rng): void {
  state.rngState = r.state();
}

function rollShops(state: GameState): void {
  const r = rng(state);
  for (const pid of ['p1', 'p2'] as PlayerId[]) {
    const p = state.players[pid];
    p.shop = rollShop(r, p.level, state.pool);
  }
  commitRng(state, r);
}

/* ------------------------------------------------------------------ */
/* Planning commands                                                   */
/* ------------------------------------------------------------------ */

export type CommandResult = { ok: true } | { ok: false; reason: string };

export function applyCommand(state: GameState, pid: PlayerId, cmd: Command): CommandResult {
  if (state.phase !== 'planning') return { ok: false, reason: 'not in planning phase' };
  const p = state.players[pid];

  switch (cmd.type) {
    case 'buyUnit': {
      const defId = p.shop[cmd.slot];
      if (!defId) return { ok: false, reason: 'empty slot' };
      const def = UNITS[defId];
      if (p.gold < def.cost) return { ok: false, reason: 'not enough gold' };
      const slot = firstFreeBenchSlot(p);
      if (slot === -1) return { ok: false, reason: 'bench full' };
      if ((state.pool[defId] ?? 0) <= 0) return { ok: false, reason: 'pool empty' };
      p.gold -= def.cost;
      state.pool[defId]--;
      p.shop[cmd.slot] = null;
      p.bench[slot] = { uid: `u${state.nextUid++}`, defId, star: 1 };
      applyMerges(p);
      return { ok: true };
    }
    case 'sellUnit': {
      const found = findUnit(p, cmd.uid);
      if (!found) return { ok: false, reason: 'unit not found' };
      const def = UNITS[found.unit.defId];
      removeUnit(p, cmd.uid);
      p.gold += sellValue(def.cost, found.unit.star);
      // Copies flow back into the shared pool.
      const copies = found.unit.star === 1 ? 1 : found.unit.star === 2 ? 3 : 9;
      state.pool[def.id] = (state.pool[def.id] ?? 0) + copies;
      return { ok: true };
    }
    case 'reroll': {
      if (p.gold < REROLL_COST) return { ok: false, reason: 'not enough gold' };
      p.gold -= REROLL_COST;
      const r = rng(state);
      p.shop = rollShop(r, p.level, state.pool);
      commitRng(state, r);
      return { ok: true };
    }
    case 'buyXp': {
      if (p.gold < XP_COST) return { ok: false, reason: 'not enough gold' };
      if (p.level >= MAX_LEVEL) return { ok: false, reason: 'max level' };
      p.gold -= XP_COST;
      gainXp(p, XP_PER_BUY);
      return { ok: true };
    }
    case 'moveUnit': {
      const found = findUnit(p, cmd.uid);
      if (!found) return { ok: false, reason: 'unit not found' };
      if (cmd.dest.kind === 'bench') {
        const idx = cmd.dest.index;
        if (idx < 0 || idx >= BENCH_SLOTS) return { ok: false, reason: 'bad bench slot' };
        const occupant = p.bench[idx];
        removeUnit(p, cmd.uid);
        if (occupant && occupant.uid !== cmd.uid) {
          // Swap: occupant moves to where the dragged unit came from.
          removeUnit(p, occupant.uid);
          if (found.loc.kind === 'bench') p.bench[found.loc.index] = occupant;
          else p.board[found.loc.key] = occupant;
        }
        p.bench[idx] = found.unit;
        return { ok: true };
      }
      const hex = cmd.dest.hex;
      if (!isValidLocalHex(hex)) return { ok: false, reason: 'hex outside your half' };
      const key = hexKey(hex);
      const occupant = p.board[key] ?? null;
      const fromBench = found.loc.kind === 'bench';
      if (fromBench && !occupant && boardCount(p) >= unitCap(p.level)) {
        return { ok: false, reason: 'board is full for your level' };
      }
      removeUnit(p, cmd.uid);
      if (occupant && occupant.uid !== cmd.uid) {
        removeUnit(p, occupant.uid);
        if (fromBench) p.bench[(found.loc as { kind: 'bench'; index: number }).index] = occupant;
        else p.board[(found.loc as { kind: 'board'; key: string }).key] = occupant;
      }
      p.board[key] = found.unit;
      return { ok: true };
    }
  }
}

function gainXp(p: PlayerState, amount: number): void {
  if (p.level >= MAX_LEVEL) return;
  p.xp += amount;
  let need = XP_TABLE[p.level];
  while (p.level < MAX_LEVEL && p.xp >= need) {
    p.xp -= need;
    p.level++;
    need = XP_TABLE[p.level];
  }
}

/* ------------------------------------------------------------------ */
/* Combat setup & resolution                                           */
/* ------------------------------------------------------------------ */

export function isPveRound(round: number): boolean {
  return round <= PVE_ROUNDS;
}

/** Build the global-space combat inputs for both sides. */
export function buildCombatInputs(state: GameState): {
  teamA: CombatUnitInput[];
  teamB: CombatUnitInput[];
} {
  const p1 = state.players.p1;
  const teamA: CombatUnitInput[] = Object.keys(p1.board)
    .sort()
    .map((key) => ({
      defId: p1.board[key].defId,
      star: p1.board[key].star,
      hex: parseHexKey(key),
    }));

  if (isPveRound(state.round)) {
    const wave = MINION_WAVES[state.round - 1];
    const teamB: CombatUnitInput[] = [];
    // Deterministic centred spread on the far half (global rows 5–6).
    const cols = [3, 2, 4, 1, 5, 0, 6];
    let i = 0;
    for (const m of wave.units) {
      for (let c = 0; c < m.count; c++) {
        teamB.push({
          defId: 'minion',
          star: 1,
          hex: { col: cols[i % cols.length], row: 5 + Math.floor(i / cols.length) },
          statsOverride: { name: m.name, hp: m.hp, ad: m.ad, attackSpeed: m.attackSpeed },
        });
        i++;
      }
    }
    return { teamA, teamB };
  }

  const p2 = state.players.p2;
  const teamB: CombatUnitInput[] = Object.keys(p2.board)
    .sort()
    .map((key) => ({
      defId: p2.board[key].defId,
      star: p2.board[key].star,
      hex: rotate180(parseHexKey(key)),
    }));
  return { teamA, teamB };
}

/** Run the fight for the current round. Does not mutate state. */
export function simulateRound(state: GameState): CombatReplay {
  const { teamA, teamB } = buildCombatInputs(state);
  return runCombat(teamA, teamB);
}

/**
 * Apply a finished combat to the match state: player damage, streaks,
 * income, XP, next round, fresh shops.
 */
export function resolveCombat(state: GameState, replay: CombatReplay): void {
  const { round } = state;
  const pve = isPveRound(round);
  const winnerPid: PlayerId | 'draw' =
    replay.winner === 'draw' ? 'draw' : replay.winner === 0 ? 'p1' : 'p2';

  const dmg = playerDamage(round, replay.survivorStars);

  for (const pid of ['p1', 'p2'] as PlayerId[]) {
    const p = state.players[pid];
    let isWinner = winnerPid === pid;
    let isLoser = winnerPid !== 'draw' && winnerPid !== pid;

    // Only p1's PvE wave is simulated; p2 is assumed to clear its own wave
    // (same income/XP/bounty) so neither side gets a systemic econ edge —
    // the "no side advantage" gate in test-tactics-sim.mjs guards this.
    if (pve && pid === 'p2') {
      isWinner = true;
      isLoser = false;
    }

    if (isLoser || (winnerPid === 'draw' && !(pve && pid === 'p2'))) {
      p.hp = Math.max(0, p.hp - (winnerPid === 'draw' ? Math.ceil(dmg / 2) : dmg));
    }

    // Streaks.
    if (isWinner) {
      p.winStreak++;
      p.lossStreak = 0;
    } else if (isLoser) {
      p.lossStreak++;
      p.winStreak = 0;
    }

    // Income: base + interest + streak + win bonus (+ PvE bounty).
    let income = BASE_INCOME + interestFor(p.gold);
    income += streakBonus(Math.max(p.winStreak, p.lossStreak));
    if (isWinner) income += 1;
    if (pve && isWinner) income += MINION_WAVES[round - 1].bounty;
    p.gold += income;

    gainXp(p, XP_PER_ROUND);
    p.ready = false;
  }

  state.lastCombat = {
    winner: winnerPid,
    damage: winnerPid === 'draw' ? Math.ceil(dmg / 2) : dmg,
    survivors: replay.survivorStars.length,
    ticks: replay.ticks,
    round,
  };

  const p1Dead = state.players.p1.hp <= 0;
  const p2Dead = state.players.p2.hp <= 0;
  if (p1Dead || p2Dead) {
    state.phase = 'gameover';
    // Player wins ties (queue-friendly generosity).
    state.winner = p1Dead && !p2Dead ? 'p2' : 'p1';
    return;
  }

  state.round++;
  state.phase = 'planning';
  rollShops(state);
}

/** RNG handle for the AI (kept in econ RNG stream so runs stay reproducible). */
export function withEconRng<T>(state: GameState, fn: (r: Rng) => T): T {
  const r = rng(state);
  const out = fn(r);
  commitRng(state, r);
  return out;
}
