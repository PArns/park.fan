/**
 * Queue Tactics simulation gates — run with:
 *   pnpm test:tactics
 *
 * These are the "balance gates" from the design doc: automated checks that
 * fail if a tuning change silently breaks the game's foundations.
 *
 *   1. Determinism   — same seed → byte-identical combat replay.
 *   2. Mirror match  — identical armies on the point-symmetric board is an
 *                      EXACT draw (combat is RNG-free by design).
 *   3. Termination   — every fight ends before the hard tick cap.
 *   4. Counters      — star-ups and resist stats actually matter.
 *   5. Full match    — an AI-vs-AI game finishes and stays reproducible.
 */

import { runCombat } from '../lib/tactics/core/combat.ts';
import { UNITS, UNIT_LIST } from '../lib/tactics/core/data.ts';
import {
  createGame,
  applyCommand,
  simulateRound,
  resolveCombat,
  isPveRound,
} from '../lib/tactics/core/game.ts';
import { aiPlanTurn } from '../lib/tactics/core/ai.ts';
import { rotate180 } from '../lib/tactics/core/hex.ts';

let passed = 0;
let failed = 0;
const fails = [];

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    fails.push(name);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function replayHash(replay) {
  return JSON.stringify(replay.events);
}

/* ------------------------------------------------------------------ */
console.log('\n[1] Determinism');

const armyA = [
  { defId: 'deckhand', star: 1, hex: { col: 2, row: 3 } },
  { defId: 'squire', star: 1, hex: { col: 4, row: 3 } },
  { defId: 'wisp', star: 1, hex: { col: 3, row: 1 } },
];
const armyB = [
  { defId: 'golem', star: 1, hex: { col: 3, row: 4 } },
  { defId: 'scout', star: 1, hex: { col: 2, row: 6 } },
  { defId: 'corsair', star: 1, hex: { col: 4, row: 6 } },
];

{
  const r1 = runCombat(armyA, armyB);
  const r2 = runCombat(armyA, armyB);
  check('same input → identical replay', replayHash(r1) === replayHash(r2));
  check('replay has events', r1.events.length > 10);
}

/* ------------------------------------------------------------------ */
console.log('\n[2] Mirror match = exact draw');

const mirrorComps = [
  [
    { defId: 'deckhand', star: 1, hex: { col: 3, row: 3 } },
    { defId: 'wisp', star: 1, hex: { col: 3, row: 1 } },
  ],
  [
    { defId: 'squire', star: 2, hex: { col: 2, row: 3 } },
    { defId: 'golem', star: 1, hex: { col: 4, row: 3 } },
    { defId: 'scout', star: 1, hex: { col: 1, row: 0 } },
    { defId: 'shaman', star: 1, hex: { col: 5, row: 1 } },
  ],
  [
    { defId: 'captain', star: 1, hex: { col: 3, row: 3 } },
    { defId: 'banshee', star: 1, hex: { col: 2, row: 1 } },
    { defId: 'corsair', star: 2, hex: { col: 4, row: 0 } },
    { defId: 'fencer', star: 1, hex: { col: 1, row: 3 } },
    { defId: 'tinker', star: 1, hex: { col: 5, row: 0 } },
  ],
  // Full-width front line stress test (movement conflicts).
  [0, 1, 2, 3, 4, 5, 6].map((col) => ({ defId: 'deckhand', star: 1, hex: { col, row: 3 } })),
];

for (let i = 0; i < mirrorComps.length; i++) {
  const local = mirrorComps[i];
  const teamA = local.map((u) => ({ ...u }));
  const teamB = local.map((u) => ({ ...u, hex: rotate180(u.hex) }));
  const res = runCombat(teamA, teamB);
  check(
    `mirror comp #${i + 1} is an exact draw`,
    res.winner === 'draw',
    `winner=${res.winner} ticks=${res.ticks}`
  );
}

/* ------------------------------------------------------------------ */
console.log('\n[3] Termination');

{
  // Two full-tank teams with healers — the classic stalemate risk.
  const tanks = [
    { defId: 'golem', star: 2, hex: { col: 2, row: 3 } },
    { defId: 'squire', star: 2, hex: { col: 4, row: 3 } },
    { defId: 'tinker', star: 2, hex: { col: 3, row: 0 } },
    { defId: 'shaman', star: 2, hex: { col: 2, row: 0 } },
  ];
  const mirror = tanks.map((u) => ({ ...u, hex: rotate180(u.hex) }));
  const res = runCombat(tanks, mirror);
  check(
    'tank+healer mirror terminates (sudden death works)',
    res.ticks < 450,
    `ticks=${res.ticks}`
  );
}

for (const seedish of [1, 2, 3]) {
  // Random-ish but deterministic army pairing across the roster.
  const ids = UNIT_LIST.map((u) => u.id);
  const pick = (n, off) => ids.filter((_, i) => (i + off) % 3 === 0).slice(0, n);
  const mk = (defs, row) => defs.map((defId, i) => ({ defId, star: 1, hex: { col: i + 1, row } }));
  const res = runCombat(mk(pick(4, seedish), 3), mk(pick(4, seedish + 1), 4));
  check(`roster pairing #${seedish} terminates with a result`, res.ticks < 450);
}

/* ------------------------------------------------------------------ */
console.log('\n[4] Counter gates');

{
  // 2★ beats 1★ of the same unit head-on.
  const a = [{ defId: 'deckhand', star: 2, hex: { col: 3, row: 3 } }];
  const b = [{ defId: 'deckhand', star: 1, hex: { col: 3, row: 4 } }];
  check('2★ beats 1★ (same unit)', runCombat(a, b).winner === 0);
}
{
  // Higher cost beats lower cost 1v1.
  const a = [{ defId: 'captain', star: 1, hex: { col: 3, row: 3 } }];
  const b = [{ defId: 'squire', star: 1, hex: { col: 3, row: 4 } }];
  check('3-cost beats 1-cost 1v1', runCombat(a, b).winner === 0);
}
{
  // Armor matters: magic damage kills a high-armor tank faster than physical
  // damage does. Compare the tick the Golem dies on under each damage type.
  const golem = [{ defId: 'golem', star: 1, hex: { col: 3, row: 4 } }];
  const mkSquad = (defId) => [
    { defId, star: 1, hex: { col: 2, row: 3 } },
    { defId, star: 1, hex: { col: 3, row: 3 } },
    { defId, star: 1, hex: { col: 4, row: 3 } },
  ];
  const deathTick = (replay) =>
    replay.events.find((e) => e.type === 'death' && e.uid === '1-0')?.t ?? Infinity;
  const tPhys = deathTick(runCombat(mkSquad('scout'), golem));
  const tMag = deathTick(runCombat(mkSquad('wisp'), golem));
  // The armor tank MAY wall pure physical entirely (tPhys=Infinity) — that IS
  // the emergent counter. Magic must always break through, and faster.
  check(
    'magic kills the armored tank faster than physical (emergent counter)',
    Number.isFinite(tMag) && tMag < tPhys,
    `magic=${tMag} phys=${tPhys}`
  );
}
{
  // Melee duelists (fast, tough) run down squishy long-cast mystics of
  // similar total cost — the mobility-vs-range matchup falls out of stats.
  const duelists = [
    { defId: 'deckhand', star: 1, hex: { col: 2, row: 3 } },
    { defId: 'fencer', star: 1, hex: { col: 4, row: 3 } },
  ];
  const casters = [
    { defId: 'wisp', star: 1, hex: { col: 2, row: 6 } },
    { defId: 'banshee', star: 1, hex: { col: 4, row: 6 } },
  ];
  const res = runCombat(duelists, casters);
  check('duelist pair runs down the caster backline', res.winner === 0, `winner=${res.winner}`);
}
{
  // A 5-cost legend beats a 3-cost tank one-on-one.
  const a = [{ defId: 'revenant', star: 1, hex: { col: 3, row: 3 } }];
  const b = [{ defId: 'captain', star: 1, hex: { col: 3, row: 4 } }];
  check('5-cost beats 3-cost tank 1v1', runCombat(a, b).winner === 0);
}

/* ------------------------------------------------------------------ */
console.log('\n[5] Full AI-vs-AI match');

function playFullGame(seed) {
  const state = createGame(seed);
  const log = [];
  let rounds = 0;
  while (state.phase !== 'gameover' && rounds < 60) {
    aiPlanTurn(state, 'p1');
    if (!isPveRound(state.round)) aiPlanTurn(state, 'p2');
    for (const pid of ['p1', 'p2']) {
      applyCommand(state, pid, { type: 'reroll' }); // exercise more of the API
    }
    const replay = simulateRound(state);
    log.push(`${state.round}:${replay.winner}:${replay.ticks}`);
    resolveCombat(state, replay);
    rounds++;
  }
  return { state, log: log.join('|'), rounds };
}

{
  const g1 = playFullGame(12345);
  const g2 = playFullGame(12345);
  check('AI-vs-AI game finishes', g1.state.phase === 'gameover', `rounds=${g1.rounds}`);
  check(
    'match is reproducible from seed',
    g1.log === g2.log && g1.state.winner === g2.state.winner
  );
  check('a winner is declared', g1.state.winner === 'p1' || g1.state.winner === 'p2');

  const g3 = playFullGame(999);
  check('different seed → different match', g3.log !== g1.log);
}

{
  // Across several seeds neither side should win overwhelmingly (both use
  // the same AI — this catches a P1/P2 systemic advantage in the sim).
  let p1Wins = 0;
  const N = 12;
  for (let s = 0; s < N; s++) {
    const g = playFullGame(1000 + s);
    if (g.state.winner === 'p1') p1Wins++;
  }
  check(`no systemic side advantage (p1 won ${p1Wins}/${N})`, p1Wins >= 3 && p1Wins <= 9);
}

/* ------------------------------------------------------------------ */
console.log('\n[6] Data sanity');

for (const u of UNIT_LIST) {
  const ok =
    u.hp > 0 &&
    u.ad > 0 &&
    u.attackSpeed > 0.3 &&
    u.attackSpeed < 1.5 &&
    u.range >= 1 &&
    u.range <= 4 &&
    UNITS[u.id] === u;
  if (!ok) check(`unit ${u.id} stats sane`, false);
}
check('all units have sane stats', true);

/* ------------------------------------------------------------------ */
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('Failed gates:', fails.join(', '));
  process.exit(1);
}
