/**
 * Shared types for the Queue Tactics simulation core.
 *
 * Everything in `lib/tactics/core` is pure, deterministic TypeScript —
 * no three.js, no React, no Date/Math.random. The renderer, HUD and AI are
 * layers on top. All game state is plain serialisable data so a match can be
 * auto-saved to localStorage between rounds (queue-friendly: put the phone
 * away, resume later).
 */

import type { Hex } from './hex';

/* ------------------------------------------------------------------ */
/* Static configuration                                                */
/* ------------------------------------------------------------------ */

export type TraitId =
  | 'pirates'
  | 'royals'
  | 'robots'
  | 'spirits'
  | 'beasts'
  | 'guardian'
  | 'duelist'
  | 'ranger'
  | 'mystic'
  | 'support';

export type AbilityArchetype =
  | 'nuke' // magic damage to current target
  | 'aoe' // magic damage to target + its neighbours
  | 'heal' // heal the lowest-HP ally
  | 'rally' // stacking self attack-speed buff
  | 'stun' // magic damage + stun to current target
  | 'volley' // physical damage to target + neighbours
  | 'slam'; // self shield + magic damage to adjacent enemies

export interface AbilityDef {
  archetype: AbilityArchetype;
  name: string;
  /** Primary power per star level (damage / heal / shield amount). */
  power: [number, number, number];
  /** Stun duration in ticks (stun archetype only). */
  stunTicks?: number;
  /** Attack-speed bonus per cast as percent (rally only). */
  rallyPct?: number;
  description: string;
}

export interface TraitDef {
  id: TraitId;
  name: string;
  kind: 'origin' | 'class';
  /** Unique-unit counts that activate tier 1, 2, ... */
  breakpoints: number[];
  /** Human description per active tier (index-aligned with breakpoints). */
  effects: string[];
}

export interface UnitDef {
  id: string;
  name: string;
  cost: 1 | 2 | 3 | 4 | 5;
  origin: TraitId;
  clazz: TraitId;
  /** Attack range in hexes; 1 = melee. */
  range: number;
  hp: number;
  ad: number;
  /** Attacks per second. */
  attackSpeed: number;
  armor: number;
  mr: number;
  manaMax: number;
  manaStart: number;
  ability: AbilityDef;
}

/* ------------------------------------------------------------------ */
/* Match state                                                         */
/* ------------------------------------------------------------------ */

export type PlayerId = 'p1' | 'p2';

export interface OwnedUnit {
  uid: string;
  defId: string;
  star: 1 | 2 | 3;
}

export interface PlayerState {
  id: PlayerId;
  hp: number;
  gold: number;
  level: number;
  xp: number;
  winStreak: number;
  lossStreak: number;
  /** 9 bench slots, null = empty. */
  bench: (OwnedUnit | null)[];
  /**
   * Board units in PLAYER-LOCAL coordinates: col 0..6, row 0..3 where row 3
   * is the front line (the middle of the arena). Player 2's half is rotated
   * 180° into global space at combat setup.
   */
  board: Record<string, OwnedUnit>;
  /** Current shop offering: unit def ids, null = already bought. */
  shop: (string | null)[];
  ready: boolean;
}

export type Phase = 'planning' | 'combat' | 'gameover';

export interface CombatSummary {
  winner: PlayerId | 'draw';
  /** Player HP damage dealt to the loser (0 on draw for both). */
  damage: number;
  survivors: number;
  ticks: number;
  round: number;
}

export interface GameState {
  seed: number;
  round: number;
  phase: Phase;
  players: Record<PlayerId, PlayerState>;
  /** Remaining copies per unit def id (shared pool, TFT-style). */
  pool: Record<string, number>;
  /** Economy RNG state (combat is RNG-free). */
  rngState: number;
  /** Result of the most recent combat (for the resolution banner). */
  lastCombat: CombatSummary | null;
  winner: PlayerId | null;
  /** Monotonic counter for unit uids. */
  nextUid: number;
}

/* ------------------------------------------------------------------ */
/* Planning-phase commands                                             */
/* ------------------------------------------------------------------ */

export type Command =
  | { type: 'buyUnit'; slot: number }
  | { type: 'sellUnit'; uid: string }
  | { type: 'reroll' }
  | { type: 'buyXp' }
  | {
      type: 'moveUnit';
      uid: string;
      dest: { kind: 'bench'; index: number } | { kind: 'board'; hex: Hex };
    };

/* ------------------------------------------------------------------ */
/* Combat replay events (consumed by the renderer)                     */
/* ------------------------------------------------------------------ */

export interface CombatUnitSpawn {
  uid: string;
  team: 0 | 1;
  defId: string;
  star: 1 | 2 | 3;
  hex: Hex;
  hp: number;
  maxHp: number;
  manaMax: number;
  mana: number;
}

export type CombatEvent =
  | { t: number; type: 'move'; uid: string; from: Hex; to: Hex; ticks: number }
  | { t: number; type: 'attack'; uid: string; target: string; projectile: boolean }
  | {
      t: number;
      type: 'damage';
      target: string;
      amount: number;
      kind: 'physical' | 'magic';
      hpAfter: number;
      shieldAfter: number;
    }
  | { t: number; type: 'heal'; target: string; amount: number; hpAfter: number }
  | { t: number; type: 'shield'; target: string; amount: number }
  | { t: number; type: 'mana'; uid: string; mana: number }
  | { t: number; type: 'cast'; uid: string; ability: AbilityArchetype; target?: string }
  | { t: number; type: 'stun'; target: string; ticks: number }
  | { t: number; type: 'death'; uid: string }
  | { t: number; type: 'end'; winner: 0 | 1 | 'draw' };

export interface CombatReplay {
  spawns: CombatUnitSpawn[];
  events: CombatEvent[];
  winner: 0 | 1 | 'draw';
  ticks: number;
  /** Surviving unit star levels of the winning team (player damage calc). */
  survivorStars: number[];
}
