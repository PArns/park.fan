/**
 * Queue Tactics — all balance data in one place.
 *
 * Design follows the "emergent counters" philosophy: there is no hand-written
 * rock-paper-scissors table. Matchups fall out of stats (armor vs AD, MR vs
 * ability power, range vs mobility, single-target vs splash), so EVERY number
 * lives here and nothing is hardcoded in the sim. Tuning happens in this file
 * only; `scripts/test-tactics-sim.mjs` gates against degenerate outcomes
 * (never-ending fights, dead traits, hard-broken counters).
 *
 * Theme: the five origins are theme-park lands (park.fan flavour) —
 * Pirate Cove, Royal Castle, Robo World, Ghost Manor, Wildlife Trail.
 */

import type { TraitDef, UnitDef } from './types';

/* ------------------------------------------------------------------ */
/* Traits                                                              */
/* ------------------------------------------------------------------ */

export const TRAITS: Record<string, TraitDef> = {
  pirates: {
    id: 'pirates',
    name: 'Pirate Cove',
    kind: 'origin',
    breakpoints: [2, 3],
    effects: ['Pirates gain +18% attack damage', 'Pirates gain +40% attack damage'],
  },
  royals: {
    id: 'royals',
    name: 'Royal Castle',
    kind: 'origin',
    breakpoints: [2, 3],
    effects: [
      'Royals start combat with a shield of 25% max HP',
      'Royals start combat with a shield of 45% max HP',
    ],
  },
  robots: {
    id: 'robots',
    name: 'Robo World',
    kind: 'origin',
    breakpoints: [2, 3],
    effects: ['Robots start with +30 mana', 'Robots start with +60 mana'],
  },
  spirits: {
    id: 'spirits',
    name: 'Ghost Manor',
    kind: 'origin',
    breakpoints: [2, 3],
    effects: ['Spirit abilities are 30% stronger', 'Spirit abilities are 65% stronger'],
  },
  beasts: {
    id: 'beasts',
    name: 'Wildlife Trail',
    kind: 'origin',
    breakpoints: [2, 4],
    effects: ['Beasts gain +18% max HP', 'Beasts gain +40% max HP'],
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    kind: 'class',
    breakpoints: [2, 4],
    effects: ['Guardians gain +50 armor', 'Guardians gain +130 armor'],
  },
  duelist: {
    id: 'duelist',
    name: 'Duelist',
    kind: 'class',
    breakpoints: [2, 4],
    effects: ['Duelists gain +30% attack speed', 'Duelists gain +75% attack speed'],
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    kind: 'class',
    breakpoints: [2, 3],
    effects: [
      'Rangers fire a bonus attack every 4th shot',
      'Rangers fire a bonus attack every 2nd shot',
    ],
  },
  mystic: {
    id: 'mystic',
    name: 'Mystic',
    kind: 'class',
    breakpoints: [2, 3],
    effects: ['Your team gains +25 magic resist', 'Your team gains +65 magic resist'],
  },
  support: {
    id: 'support',
    name: 'Support',
    kind: 'class',
    breakpoints: [2],
    effects: ['Your team regenerates 1.5% max HP per second'],
  },
};

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

/**
 * Baselines (1-cost, 1-star): melee ~600 HP / 50 AD, ranged ~480 HP / 48 AD.
 * Each cost tier scales roughly ×1.2. Star-up multiplies HP/AD ×1.8 per star
 * (applied at combat setup, see combat.ts).
 */
export const UNITS: Record<string, UnitDef> = {
  /* ---------------- 1-cost ---------------- */
  deckhand: {
    id: 'deckhand',
    name: 'Deckhand',
    cost: 1,
    origin: 'pirates',
    clazz: 'duelist',
    range: 1,
    hp: 600,
    ad: 52,
    attackSpeed: 0.75,
    armor: 30,
    mr: 25,
    manaMax: 60,
    manaStart: 0,
    ability: {
      archetype: 'rally',
      name: 'Sea Shanty',
      power: [0, 0, 0],
      rallyPct: 35,
      description: 'Gains 35% stacking attack speed.',
    },
  },
  squire: {
    id: 'squire',
    name: 'Squire',
    cost: 1,
    origin: 'royals',
    clazz: 'guardian',
    range: 1,
    hp: 700,
    ad: 45,
    attackSpeed: 0.65,
    armor: 45,
    mr: 22,
    manaMax: 70,
    manaStart: 0,
    ability: {
      archetype: 'slam',
      name: 'Shield Wall',
      power: [220, 340, 560],
      description: 'Shields himself and slams adjacent enemies for magic damage.',
    },
  },
  wisp: {
    id: 'wisp',
    name: 'Wisp',
    cost: 1,
    origin: 'spirits',
    clazz: 'mystic',
    range: 3,
    hp: 460,
    ad: 42,
    attackSpeed: 0.7,
    armor: 20,
    mr: 25,
    manaMax: 55,
    manaStart: 10,
    ability: {
      archetype: 'nuke',
      name: 'Soul Spark',
      power: [200, 310, 500],
      description: 'Zaps the current target for magic damage.',
    },
  },
  scout: {
    id: 'scout',
    name: 'Trail Scout',
    cost: 1,
    origin: 'beasts',
    clazz: 'ranger',
    range: 4,
    hp: 480,
    ad: 50,
    attackSpeed: 0.72,
    armor: 20,
    mr: 20,
    manaMax: 70,
    manaStart: 0,
    ability: {
      archetype: 'volley',
      name: 'Thorn Volley',
      power: [140, 220, 360],
      description: 'Fires thorns at the target and its neighbours (physical).',
    },
  },
  tinker: {
    id: 'tinker',
    name: 'Tinker Bot',
    cost: 1,
    origin: 'robots',
    clazz: 'support',
    range: 3,
    hp: 500,
    ad: 40,
    attackSpeed: 0.68,
    armor: 25,
    mr: 25,
    manaMax: 60,
    manaStart: 0,
    ability: {
      archetype: 'heal',
      name: 'Repair Drone',
      power: [240, 380, 620],
      description: 'Heals the most wounded ally.',
    },
  },

  /* ---------------- 2-cost ---------------- */
  corsair: {
    id: 'corsair',
    name: 'Corsair',
    cost: 2,
    origin: 'pirates',
    clazz: 'ranger',
    range: 4,
    hp: 560,
    ad: 62,
    attackSpeed: 0.75,
    armor: 22,
    mr: 22,
    manaMax: 80,
    manaStart: 0,
    ability: {
      archetype: 'volley',
      name: 'Grapeshot',
      power: [190, 300, 480],
      description: 'Blasts the target and its neighbours with shrapnel (physical).',
    },
  },
  golem: {
    id: 'golem',
    name: 'Steam Golem',
    cost: 2,
    origin: 'robots',
    clazz: 'guardian',
    range: 1,
    hp: 850,
    ad: 55,
    attackSpeed: 0.6,
    armor: 65,
    mr: 20,
    manaMax: 80,
    manaStart: 0,
    ability: {
      archetype: 'slam',
      name: 'Boiler Burst',
      power: [300, 470, 760],
      description: 'Vents steam: shields itself and burns adjacent enemies.',
    },
  },
  fencer: {
    id: 'fencer',
    name: 'Royal Fencer',
    cost: 2,
    origin: 'royals',
    clazz: 'duelist',
    range: 1,
    hp: 680,
    ad: 64,
    attackSpeed: 0.8,
    armor: 30,
    mr: 28,
    manaMax: 65,
    manaStart: 0,
    ability: {
      archetype: 'nuke',
      name: 'Riposte',
      power: [230, 360, 580],
      description: 'A lightning-fast lunge dealing magic damage.',
    },
  },
  shaman: {
    id: 'shaman',
    name: 'Grove Shaman',
    cost: 2,
    origin: 'beasts',
    clazz: 'support',
    range: 3,
    hp: 560,
    ad: 46,
    attackSpeed: 0.68,
    armor: 24,
    mr: 30,
    manaMax: 70,
    manaStart: 10,
    ability: {
      archetype: 'heal',
      name: 'Wild Mend',
      power: [330, 520, 840],
      description: 'Channels the grove to heal the most wounded ally.',
    },
  },

  /* ---------------- 3-cost ---------------- */
  banshee: {
    id: 'banshee',
    name: 'Banshee',
    cost: 3,
    origin: 'spirits',
    clazz: 'mystic',
    range: 3,
    hp: 620,
    ad: 52,
    attackSpeed: 0.72,
    armor: 25,
    mr: 32,
    manaMax: 90,
    manaStart: 20,
    ability: {
      archetype: 'aoe',
      name: 'Wail',
      power: [280, 430, 700],
      description: 'A piercing scream hits the target and its neighbours (magic).',
    },
  },
  captain: {
    id: 'captain',
    name: 'Dread Captain',
    cost: 3,
    origin: 'pirates',
    clazz: 'guardian',
    range: 1,
    hp: 1000,
    ad: 65,
    attackSpeed: 0.62,
    armor: 58,
    mr: 28,
    manaMax: 100,
    manaStart: 0,
    ability: {
      archetype: 'slam',
      name: 'Iron Hull',
      power: [380, 590, 950],
      description: 'Braces behind iron plating and slams adjacent enemies.',
    },
  },
  huntress: {
    id: 'huntress',
    name: 'Huntress',
    cost: 3,
    origin: 'beasts',
    clazz: 'duelist',
    range: 1,
    hp: 780,
    ad: 78,
    attackSpeed: 0.85,
    armor: 32,
    mr: 30,
    manaMax: 60,
    manaStart: 0,
    ability: {
      archetype: 'rally',
      name: 'Blood Frenzy',
      power: [0, 0, 0],
      rallyPct: 45,
      description: 'Gains 45% stacking attack speed.',
    },
  },

  /* ---------------- 4-cost ---------------- */
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel Prime',
    cost: 4,
    origin: 'robots',
    clazz: 'mystic',
    range: 3,
    hp: 760,
    ad: 58,
    attackSpeed: 0.75,
    armor: 30,
    mr: 38,
    manaMax: 100,
    manaStart: 30,
    ability: {
      archetype: 'stun',
      name: 'EMP Blast',
      power: [340, 530, 860],
      stunTicks: 15,
      description: 'Shocks the target: magic damage and a 1.5s stun.',
    },
  },
  highlord: {
    id: 'highlord',
    name: 'Highlord Archer',
    cost: 4,
    origin: 'royals',
    clazz: 'ranger',
    range: 4,
    hp: 700,
    ad: 88,
    attackSpeed: 0.82,
    armor: 26,
    mr: 26,
    manaMax: 90,
    manaStart: 0,
    ability: {
      archetype: 'volley',
      name: 'Royal Volley',
      power: [320, 500, 810],
      description: 'A royal decree of arrows: physical damage to target and neighbours.',
    },
  },

  /* ---------------- 5-cost ---------------- */
  alpha: {
    id: 'alpha',
    name: 'Dire Alpha',
    cost: 5,
    origin: 'beasts',
    clazz: 'guardian',
    range: 1,
    hp: 1400,
    ad: 90,
    attackSpeed: 0.7,
    armor: 70,
    mr: 42,
    manaMax: 110,
    manaStart: 20,
    ability: {
      archetype: 'stun',
      name: 'Terrifying Roar',
      power: [420, 660, 1080],
      stunTicks: 12,
      description: 'A roar that damages and stuns the target with fear.',
    },
  },
  revenant: {
    id: 'revenant',
    name: 'Revenant King',
    cost: 5,
    origin: 'spirits',
    clazz: 'duelist',
    range: 1,
    hp: 1050,
    ad: 105,
    attackSpeed: 0.9,
    armor: 45,
    mr: 45,
    manaMax: 80,
    manaStart: 0,
    ability: {
      archetype: 'nuke',
      name: 'Soul Reap',
      power: [520, 820, 1350],
      description: 'Reaps the target’s soul for massive magic damage.',
    },
  },
};

export const UNIT_LIST: UnitDef[] = Object.values(UNITS);

/* ------------------------------------------------------------------ */
/* PvE minion rounds (rounds 1–2 warm-up, TFT-style)                   */
/* ------------------------------------------------------------------ */

export interface MinionWave {
  /** defId-like visual hint + stats, not part of the shop pool. */
  units: { name: string; hp: number; ad: number; attackSpeed: number; count: number }[];
  /** Bonus gold for clearing the wave. */
  bounty: number;
}

export const MINION_WAVES: MinionWave[] = [
  { units: [{ name: 'Stray Balloon', hp: 380, ad: 30, attackSpeed: 0.6, count: 2 }], bounty: 2 },
  { units: [{ name: 'Runaway Cart', hp: 520, ad: 42, attackSpeed: 0.65, count: 3 }], bounty: 3 },
];

/* ------------------------------------------------------------------ */
/* Star-up scaling                                                     */
/* ------------------------------------------------------------------ */

export const STAR_MULT: Record<1 | 2 | 3, number> = { 1: 1, 2: 1.8, 3: 3.24 };
