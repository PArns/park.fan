/**
 * Queue Tactics combat: a fixed-timestep (100 ms), fully deterministic and
 * RNG-FREE auto-battle. All "chance" effects (e.g. Ranger bonus shots) are
 * deterministic counters, so:
 *
 *   - the same setup always produces the identical replay (event list),
 *   - a mirror match on the point-symmetric board is an EXACT draw,
 *   - future multiplayer can be host-authoritative or lockstep with zero
 *     desync risk.
 *
 * Each tick runs in three phases to avoid first-mover advantage:
 *   decide   — every unit plans its action against the state at tick start
 *              (no mutations),
 *   collect  — attacks/casts turn into EFFECTS (damage/heal/shield/mana/
 *              stun) which are only BUFFERED; moves apply afterwards so all
 *              range/zone checks used tick-start positions,
 *   resolve  — buffered effects apply in a canonical, mirror-invariant
 *              order (shields → damage → heals → stuns → mana), then deaths
 *              are collected (mutual kills = draw).
 *
 * The buffering is not optional bookkeeping: applying e.g. `mana = 0` on
 * cast immediately would make the outcome depend on apply order (a unit hit
 * after casting keeps the on-hit mana, one hit before loses it), which
 * breaks mirror symmetry. The gate tests in scripts/test-tactics-sim.mjs
 * caught exactly that.
 *
 * The whole fight is simulated synchronously up-front (< 10 ms) and returned
 * as a replay the renderer plays back — like a demo file.
 */

import { STAR_MULT, TRAITS, UNITS } from './data';
import { hexDistance, hexKey, hexNeighbours, type Hex } from './hex';
import type { AbilityDef, CombatEvent, CombatReplay, CombatUnitSpawn, TraitId } from './types';

export const TICK_MS = 100;
export const TICKS_PER_SECOND = 10;
const MOVE_TICKS = 5; // 0.5 s per hex
const CAST_LOCK_TICKS = 3;
const MAX_TICKS = 450;
const SUDDEN_DEATH_TICK = 250; // after 25 s: damage ramps up, healing decays
const SUDDEN_DEATH_RAMP = 0.08; // +8% incoming damage per tick past the mark
const SUDDEN_DEATH_HEAL_FACTOR = 0.3;
const MANA_PER_ATTACK = 10;
const MANA_PER_HIT_TAKEN = 5;

export interface CombatUnitInput {
  defId: string;
  star: 1 | 2 | 3;
  hex: Hex; // global board coordinates
  /** Override stats for PvE minions (no defId lookup). */
  statsOverride?: { name: string; hp: number; ad: number; attackSpeed: number };
}

interface Unit {
  uid: string;
  team: 0 | 1;
  index: number;
  defId: string;
  star: 1 | 2 | 3;
  pos: Hex;
  hp: number;
  maxHp: number;
  shield: number;
  mana: number;
  manaMax: number;
  ad: number;
  baseAs: number;
  bonusAsPct: number; // rally + duelist stacking
  armor: number;
  mr: number;
  range: number;
  ability: AbilityDef | null;
  spellPower: number;
  attackCd: number; // ticks until next attack (float accumulation)
  moveTicksLeft: number;
  castLockTicks: number;
  stunTicks: number;
  targetUid: string | null;
  attackCounter: number; // for deterministic Ranger bonus shots
  rangerEvery: number; // 0 = no bonus shots
  regenPctPerTick: number;
  alive: boolean;
  /** Ticks spent wanting to move without managing to — enables lateral flow. */
  blockedTicks: number;
  // per-tick buffers (resolve phase)
  manaGained: number;
  castThisTick: boolean;
}

interface AttackAction {
  kind: 'attack';
  actor: Unit;
  target: Unit;
}
interface CastAction {
  kind: 'cast';
  actor: Unit;
  target: Unit | null;
}
interface MoveClaim {
  kind: 'move';
  actor: Unit;
  to: Hex;
}
type Action = AttackAction | CastAction | MoveClaim;

/**
 * A buffered effect. `order` gives the canonical resolve sequence; the sort
 * key is mirror-invariant: it uses team-relative source info (ally flag +
 * index), never absolute team ids, so a mirrored fight resolves identically.
 */
interface Effect {
  order: 0 | 1 | 2 | 3; // shield, damage, heal, stun
  target: Unit;
  srcIndex: number;
  srcAlly: boolean;
  amount: number;
  dmgKind?: 'physical' | 'magic';
  stunTicks?: number;
}

/* ------------------------------------------------------------------ */
/* Trait resolution                                                    */
/* ------------------------------------------------------------------ */

function traitLevel(traitId: TraitId, count: number): number {
  const def = TRAITS[traitId];
  let level = 0;
  for (const bp of def.breakpoints) if (count >= bp) level++;
  return level;
}

export interface TeamTraits {
  counts: Map<TraitId, number>;
  levels: Map<TraitId, number>;
}

/** Count unique unit defs per trait (TFT rule: copies don't stack traits). */
export function countTraits(defIds: string[]): TeamTraits {
  const uniq = [...new Set(defIds)].filter((id) => UNITS[id]);
  const counts = new Map<TraitId, number>();
  for (const id of uniq) {
    const def = UNITS[id];
    counts.set(def.origin, (counts.get(def.origin) ?? 0) + 1);
    counts.set(def.clazz, (counts.get(def.clazz) ?? 0) + 1);
  }
  const levels = new Map<TraitId, number>();
  for (const [t, c] of counts) levels.set(t, traitLevel(t, c));
  return { counts, levels };
}

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */

function buildUnit(input: CombatUnitInput, team: 0 | 1, index: number, traits: TeamTraits): Unit {
  const lvl = (t: TraitId) => traits.levels.get(t) ?? 0;

  const base: Omit<
    Unit,
    | 'defId'
    | 'hp'
    | 'maxHp'
    | 'shield'
    | 'mana'
    | 'manaMax'
    | 'ad'
    | 'baseAs'
    | 'armor'
    | 'mr'
    | 'range'
    | 'ability'
    | 'spellPower'
    | 'bonusAsPct'
    | 'rangerEvery'
    | 'regenPctPerTick'
  > = {
    uid: `${team}-${index}`,
    team,
    index,
    star: input.star,
    pos: input.hex,
    attackCd: 0,
    moveTicksLeft: 0,
    castLockTicks: 0,
    stunTicks: 0,
    targetUid: null,
    attackCounter: 0,
    alive: true,
    blockedTicks: 0,
    manaGained: 0,
    castThisTick: false,
  };

  if (input.statsOverride) {
    const s = input.statsOverride;
    return {
      ...base,
      defId: `minion:${s.name}`,
      hp: s.hp,
      maxHp: s.hp,
      shield: 0,
      mana: 0,
      manaMax: Infinity,
      ad: s.ad,
      baseAs: s.attackSpeed,
      bonusAsPct: 0,
      armor: 20,
      mr: 20,
      range: 1,
      ability: null,
      spellPower: 1,
      rangerEvery: 0,
      regenPctPerTick: 0,
    };
  }

  const def = UNITS[input.defId];
  const mult = STAR_MULT[input.star];

  let maxHp = def.hp * mult;
  let ad = def.ad * mult;
  let armor = def.armor;
  let mr = def.mr;
  let mana = def.manaStart;
  let bonusAsPct = 0;
  let spellPower = 1;
  let rangerEvery = 0;
  let regenPctPerTick = 0;
  let startShieldPct = 0;

  // Origins
  const pirates = lvl('pirates');
  if (def.origin === 'pirates' && pirates > 0) ad *= pirates === 1 ? 1.18 : 1.4;
  const royals = lvl('royals');
  if (def.origin === 'royals' && royals > 0) startShieldPct = royals === 1 ? 0.25 : 0.45;
  const robots = lvl('robots');
  if (def.origin === 'robots' && robots > 0) mana += robots === 1 ? 30 : 60;
  const spirits = lvl('spirits');
  if (def.origin === 'spirits' && spirits > 0) spellPower *= spirits === 1 ? 1.3 : 1.65;
  const beasts = lvl('beasts');
  if (def.origin === 'beasts' && beasts > 0) maxHp *= beasts === 1 ? 1.18 : 1.4;

  // Classes
  const guardian = lvl('guardian');
  if (def.clazz === 'guardian' && guardian > 0) armor += guardian === 1 ? 50 : 130;
  const duelist = lvl('duelist');
  if (def.clazz === 'duelist' && duelist > 0) bonusAsPct += duelist === 1 ? 30 : 75;
  const ranger = lvl('ranger');
  if (def.clazz === 'ranger' && ranger > 0) rangerEvery = ranger === 1 ? 4 : 2;
  const mystic = lvl('mystic');
  if (mystic > 0) mr += mystic === 1 ? 25 : 65; // team-wide
  const support = lvl('support');
  if (support > 0) regenPctPerTick = 0.015 / TICKS_PER_SECOND; // team-wide

  return {
    ...base,
    defId: def.id,
    hp: maxHp,
    maxHp,
    shield: startShieldPct * maxHp,
    mana: Math.min(mana, def.manaMax),
    manaMax: def.manaMax,
    ad,
    baseAs: def.attackSpeed,
    bonusAsPct,
    armor,
    mr,
    range: def.range,
    ability: def.ability,
    spellPower,
    rangerEvery,
    regenPctPerTick,
  };
}

/* ------------------------------------------------------------------ */
/* Main simulation                                                     */
/* ------------------------------------------------------------------ */

export function runCombat(teamA: CombatUnitInput[], teamB: CombatUnitInput[]): CombatReplay {
  const traitsA = countTraits(teamA.map((u) => u.defId));
  const traitsB = countTraits(teamB.map((u) => u.defId));

  const units: Unit[] = [
    ...teamA.map((u, i) => buildUnit(u, 0, i, traitsA)),
    ...teamB.map((u, i) => buildUnit(u, 1, i, traitsB)),
  ];

  // Stable decide order: interleave by index so neither team acts strictly
  // first — combined with mutation-free decide + buffered resolve this keeps
  // mirror matches perfectly symmetric.
  const order: Unit[] = [];
  const maxLen = Math.max(teamA.length, teamB.length);
  for (let i = 0; i < maxLen; i++) {
    const a = units.find((u) => u.team === 0 && u.index === i);
    const b = units.find((u) => u.team === 1 && u.index === i);
    if (a) order.push(a);
    if (b) order.push(b);
  }

  const byUid = new Map(units.map((u) => [u.uid, u]));
  const occupied = new Map<string, string>();
  for (const u of units) occupied.set(hexKey(u.pos), u.uid);

  const spawns: CombatUnitSpawn[] = units.map((u) => ({
    uid: u.uid,
    team: u.team,
    defId: u.defId,
    star: u.star,
    hex: u.pos,
    hp: Math.round(u.hp),
    maxHp: Math.round(u.maxHp),
    manaMax: Number.isFinite(u.manaMax) ? u.manaMax : 0,
    mana: u.mana,
  }));
  const events: CombatEvent[] = [];

  // Opening shields (Royals) — emitted at t=0 so the renderer shows them.
  for (const u of units) {
    if (u.shield > 0) {
      events.push({ t: 0, type: 'shield', target: u.uid, amount: Math.round(u.shield) });
    }
  }

  let tick = 0;
  let winner: 0 | 1 | 'draw' = 'draw';

  while (tick < MAX_TICKS) {
    /* ---------- decide (no mutations besides target memo) ---------- */
    const actions: Action[] = [];
    const moveClaims = new Map<string, MoveClaim[]>();

    for (const u of order) {
      if (!u.alive || u.stunTicks > 0 || u.castLockTicks > 0 || u.moveTicksLeft > 0) continue;

      let target = u.targetUid ? byUid.get(u.targetUid) : undefined;
      if (!target || !target.alive) {
        // Acquire: closest enemy by hex distance, stable tie-break.
        let best: Unit | undefined;
        let bestD = Infinity;
        for (const e of units) {
          if (!e.alive || e.team === u.team) continue;
          const d = hexDistance(u.pos, e.pos);
          if (d < bestD) {
            bestD = d;
            best = e;
          }
        }
        target = best;
        u.targetUid = best?.uid ?? null;
      }
      if (!target) continue;

      const dist = hexDistance(u.pos, target.pos);
      if (dist <= u.range) {
        u.blockedTicks = 0;
        if (u.attackCd <= 0) {
          if (u.ability && u.mana >= u.manaMax) {
            actions.push({ kind: 'cast', actor: u, target });
          } else {
            actions.push({ kind: 'attack', actor: u, target });
          }
        }
      } else {
        // Move: free neighbour closest to the target. A unit stuck for a
        // while may also take an equal-distance neighbour ("flow sideways"
        // around whatever is anchored in front of it).
        u.blockedTicks++;
        const allowLateral = u.blockedTicks >= 8;
        let best: Hex | null = null;
        let bestD = Infinity;
        for (const n of hexNeighbours(u.pos)) {
          if (occupied.has(hexKey(n))) continue;
          const d = hexDistance(n, target.pos);
          if (d < bestD) {
            bestD = d;
            best = n;
          }
        }
        if (best && (bestD < dist || (allowLateral && bestD === dist))) {
          const claim: MoveClaim = { kind: 'move', actor: u, to: best };
          actions.push(claim);
          const k = hexKey(best);
          const list = moveClaims.get(k) ?? [];
          list.push(claim);
          moveClaims.set(k, list);
        }
      }
    }

    /* ---------- collect: attacks & casts become buffered effects ---------- */
    const effects: Effect[] = [];
    const t = tick;

    const pushDamage = (source: Unit, target: Unit, amount: number, kind: 'physical' | 'magic') => {
      const resist = kind === 'physical' ? target.armor : target.mr;
      let dmg = amount * (100 / (100 + resist));
      if (t >= SUDDEN_DEATH_TICK) dmg *= 1 + (t - SUDDEN_DEATH_TICK) * SUDDEN_DEATH_RAMP;
      effects.push({
        order: 1,
        target,
        srcIndex: source.index,
        srcAlly: source.team === target.team,
        amount: dmg,
        dmgKind: kind,
      });
      target.manaGained += MANA_PER_HIT_TAKEN;
    };

    const collectCast = (actor: Unit, target: Unit | null) => {
      const ab = actor.ability;
      if (!ab) return;
      const power = ab.power[actor.star - 1] * actor.spellPower;
      events.push({ t, type: 'cast', uid: actor.uid, ability: ab.archetype, target: target?.uid });

      switch (ab.archetype) {
        case 'nuke':
          if (target) pushDamage(actor, target, power, 'magic');
          break;
        case 'aoe':
        case 'volley': {
          if (!target) break;
          const kind = ab.archetype === 'volley' ? 'physical' : 'magic';
          const zone = new Set([target.pos, ...hexNeighbours(target.pos)].map(hexKey));
          for (const u of units) {
            if (u.alive && u.team !== actor.team && zone.has(hexKey(u.pos))) {
              pushDamage(actor, u, power, kind);
            }
          }
          break;
        }
        case 'slam': {
          effects.push({
            order: 0,
            target: actor,
            srcIndex: actor.index,
            srcAlly: true,
            amount: power * 0.5,
          });
          const zone = new Set(hexNeighbours(actor.pos).map(hexKey));
          for (const u of units) {
            if (u.alive && u.team !== actor.team && zone.has(hexKey(u.pos))) {
              pushDamage(actor, u, power * 0.5, 'magic');
            }
          }
          break;
        }
        case 'heal': {
          // Target selection uses tick-start HP (buffered resolve), which
          // keeps it deterministic and mirror-safe.
          let best: Unit | null = null;
          for (const u of units) {
            if (!u.alive || u.team !== actor.team) continue;
            if (!best || u.hp / u.maxHp < best.hp / best.maxHp) best = u;
          }
          if (best) {
            const healPower = t >= SUDDEN_DEATH_TICK ? power * SUDDEN_DEATH_HEAL_FACTOR : power;
            effects.push({
              order: 2,
              target: best,
              srcIndex: actor.index,
              srcAlly: true,
              amount: healPower,
            });
          }
          break;
        }
        case 'rally':
          actor.bonusAsPct += ab.rallyPct ?? 30; // self-only, commutative
          break;
        case 'stun':
          if (target) {
            pushDamage(actor, target, power, 'magic');
            effects.push({
              order: 3,
              target,
              srcIndex: actor.index,
              srcAlly: false,
              amount: 0,
              stunTicks: ab.stunTicks ?? 10,
            });
          }
          break;
      }
    };

    for (const action of actions) {
      const u = action.actor;
      if (action.kind === 'attack') {
        const target = action.target;
        u.attackCd += TICKS_PER_SECOND / (u.baseAs * (1 + u.bonusAsPct / 100));
        u.attackCounter++;
        u.manaGained += MANA_PER_ATTACK;
        const shots = u.rangerEvery > 0 && u.attackCounter % u.rangerEvery === 0 ? 2 : 1;
        for (let s = 0; s < shots; s++) {
          events.push({
            t,
            type: 'attack',
            uid: u.uid,
            target: target.uid,
            projectile: u.range > 1,
          });
          pushDamage(u, target, u.ad, 'physical');
        }
      } else if (action.kind === 'cast') {
        u.castThisTick = true;
        u.castLockTicks = CAST_LOCK_TICKS;
        u.attackCd += TICKS_PER_SECOND / (u.baseAs * (1 + u.bonusAsPct / 100));
        collectCast(u, action.target);
      }
    }

    // Moves apply AFTER attack/cast collection so every zone/range used
    // tick-start positions. Contested destinations resolve by lowest
    // team-agnostic unit index — mirror partners share indices, so this is
    // symmetric; only an exact cross-team index tie cancels both (leaving
    // everyone standing forever would deadlock same-team traffic jams, which
    // the stalemate gate caught).
    for (const claims of moveClaims.values()) {
      let winner: MoveClaim | null = null;
      if (claims.length === 1) {
        winner = claims[0];
      } else {
        claims.sort((a, b) => a.actor.index - b.actor.index);
        if (claims[0].actor.index !== claims[1].actor.index) winner = claims[0];
      }
      if (!winner) continue;
      const u = winner.actor;
      occupied.delete(hexKey(u.pos));
      const from = u.pos;
      u.pos = winner.to;
      occupied.set(hexKey(u.pos), u.uid);
      u.moveTicksLeft = MOVE_TICKS;
      u.blockedTicks = 0;
      events.push({ t, type: 'move', uid: u.uid, from, to: winner.to, ticks: MOVE_TICKS });
    }

    // Team-wide regeneration (Support trait) — buffered like any heal.
    for (const u of units) {
      if (u.alive && u.regenPctPerTick > 0 && u.hp < u.maxHp) {
        const regen = u.maxHp * u.regenPctPerTick;
        effects.push({
          order: 2,
          target: u,
          srcIndex: u.index,
          srcAlly: true,
          amount: t >= SUDDEN_DEATH_TICK ? regen * SUDDEN_DEATH_HEAL_FACTOR : regen,
        });
      }
    }

    /* ---------- resolve: canonical, mirror-invariant effect order ---------- */
    effects.sort((x, y) => {
      if (x.order !== y.order) return x.order - y.order;
      if (x.target.team !== y.target.team) return x.target.team - y.target.team;
      if (x.target.index !== y.target.index) return x.target.index - y.target.index;
      if (x.srcAlly !== y.srcAlly) return x.srcAlly ? -1 : 1;
      if (x.srcIndex !== y.srcIndex) return x.srcIndex - y.srcIndex;
      return x.amount - y.amount;
    });

    for (const e of effects) {
      const target = e.target;
      if (!target.alive) continue;
      switch (e.order) {
        case 0: {
          target.shield += e.amount;
          events.push({ t, type: 'shield', target: target.uid, amount: Math.round(e.amount) });
          break;
        }
        case 1: {
          let dmg = e.amount;
          if (target.shield > 0) {
            const soaked = Math.min(target.shield, dmg);
            target.shield -= soaked;
            dmg -= soaked;
          }
          target.hp -= dmg;
          events.push({
            t,
            type: 'damage',
            target: target.uid,
            amount: Math.round(e.amount),
            kind: e.dmgKind ?? 'physical',
            hpAfter: Math.max(0, Math.round(target.hp)),
            shieldAfter: Math.round(target.shield),
          });
          break;
        }
        case 2: {
          if (target.hp <= 0) break; // cannot heal through a killing blow
          const healed = Math.min(target.maxHp - target.hp, e.amount);
          if (healed <= 0) break;
          target.hp += healed;
          if (e.amount >= 1) {
            events.push({
              t,
              type: 'heal',
              target: target.uid,
              amount: Math.round(healed),
              hpAfter: Math.round(target.hp),
            });
          }
          break;
        }
        case 3: {
          if (target.hp <= 0) break;
          target.stunTicks = Math.max(target.stunTicks, e.stunTicks ?? 0);
          events.push({ t, type: 'stun', target: target.uid, ticks: e.stunTicks ?? 0 });
          break;
        }
      }
    }

    // Mana resolves last, from buffers (cast zeroes first, then gains).
    for (const u of units) {
      if (!u.alive) continue;
      if (u.castThisTick || u.manaGained > 0) {
        const before = u.mana;
        u.mana = Math.min(u.manaMax, (u.castThisTick ? 0 : u.mana) + u.manaGained);
        u.manaGained = 0;
        u.castThisTick = false;
        if (u.mana !== before && Number.isFinite(u.manaMax)) {
          events.push({ t, type: 'mana', uid: u.uid, mana: Math.round(u.mana) });
        }
      }
    }

    /* ---------- cleanup ---------- */
    for (const u of units) {
      if (u.alive && u.hp <= 0) {
        u.alive = false;
        occupied.delete(hexKey(u.pos));
        events.push({ t, type: 'death', uid: u.uid });
      }
    }
    for (const u of units) {
      if (!u.alive) continue;
      if (u.stunTicks > 0) u.stunTicks--;
      if (u.castLockTicks > 0) u.castLockTicks--;
      if (u.moveTicksLeft > 0) u.moveTicksLeft--;
      if (u.attackCd > 0) u.attackCd -= 1;
    }

    tick++;

    const a = units.filter((u) => u.alive && u.team === 0).length;
    const b = units.filter((u) => u.alive && u.team === 1).length;
    if (a === 0 || b === 0) {
      winner = a === 0 && b === 0 ? 'draw' : a === 0 ? 1 : 0;
      break;
    }
  }

  events.push({ t: tick, type: 'end', winner });

  const survivorStars =
    winner === 'draw'
      ? []
      : units
          .filter((u) => u.alive && u.team === winner && !u.defId.startsWith('minion:'))
          .map((u) => u.star);

  return { spawns, events, winner, ticks: tick, survivorStars };
}
