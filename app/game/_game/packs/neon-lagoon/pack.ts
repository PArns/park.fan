/**
 * `neon-lagoon` — the second pack, and the proof.
 *
 * It exists to show that a theme, a ride type the first pack does not have, a new guest need and a
 * scenario can all arrive without a core edit. Nothing in `_game/**` imports this file except the
 * pack index; every module reaches its content through the registry by id.
 *
 * It `requires` core-classic, which the registry enforces — a pack whose dependency is missing is
 * skipped whole rather than half-loaded.
 */

export const neonLagoonPack = {
  id: 'neon-lagoon',
  version: '1.0.0',
  name: { en: 'Neon Lagoon', de: 'Neon-Lagune' },
  requires: { engine: '>=1.0.0', packs: ['core-classic'] },
  license: 'CC0-1.0',
  definitions: [
    // A need core-classic does not have, satisfied by a facility this pack ships. Proof that a
    // guest need is content.
    {
      id: 'nl.cooling',
      kind: 'need',
      name: { en: 'Cooling off', de: 'Abkühlung' },
      decayPerHour: 18,
      moodWeight: 0.9,
      urgentAt: 175,
      criticalAt: 235,
      thoughts: [{ en: 'It is far too warm for this.', de: 'Mir ist viel zu warm.' }],
    },

    {
      id: 'nl.neon',
      kind: 'theme',
      name: { en: 'Neon Lagoon', de: 'Neon-Lagune' },
      palette: ['#3CE8D2', '#FF3C9A', '#7F5BFF', '#12233A', '#F5F7FF'],
      water: { absorptionHex: '#2A0E5A', scatterHex: '#7F5BFF', causticScale: 1.6 },
      fogDensity: 0.0022,
      foliage: ['nl.palm', 'nl.fern'],
      props: ['nl.neon-arch', 'nl.pylon', 'cc.bench'],
      pathStyle: 'nl.wet-deck',
      uiAccentHex: '#3CE8D2',
    },

    {
      id: 'nl.wet-deck',
      kind: 'path-style',
      name: { en: 'Wet Deck', de: 'Nassdeck' },
      surface: { material: 'nl.deck-mat', tileM: 1.5 },
      kerb: false,
      railing: 'nl.rail-neon',
    },

    // A ride TYPE core-classic does not have: a launched shuttle. Same schema, different physics
    // and a `launchSpeed` where every core-classic coaster has `null`.
    {
      id: 'nl.launch-shuttle',
      kind: 'coaster',
      name: { en: 'Launch Shuttle', de: 'Katapult-Shuttle' },
      tags: ['thrill', 'launch', 'steel'],
      theme: 'nl.neon',
      cost: { build: 810_000_00, runPerHour: 1_240_00 },
      track: { gauge: 1.6, railRadius: 0.08, tieSpacing: 1, spineProfile: 'triangle', material: 'nl.track-neon' },
      car: { seatsPerCar: 4, carsPerTrain: [5, 6], mass: 1180, lengthM: 3.4 },
      physics: { frictionRolling: 0.0028, dragK: 0.0018, liftSpeed: 4, launchSpeed: 38 },
      pieces: ['straight', 'curve-l', 'curve-r', 'hill', 'drop', 'loop', 'banked-l', 'banked-r', 'station', 'launch', 'brake', 'block-brake'],
      supports: { style: 'nl.support-neon', maxSpan: 11, footingRadius: 1 },
      limits: { maxGVertical: 5.5, maxGLateral: 2.2, minRadius: 7 },
    },

    {
      id: 'nl.body-slide',
      kind: 'flume',
      name: { en: 'Body Slide', de: 'Körperrutsche' },
      tags: ['water', 'thrill'],
      theme: 'nl.neon',
      cost: { build: 210_000_00, runPerHour: 320_00 },
      track: { gauge: 0.9, railRadius: 0.01, tieSpacing: 3, spineProfile: 'tube', material: 'nl.slide-mat' },
      car: { seatsPerCar: 1, carsPerTrain: [1], mass: 85, lengthM: 1.9 },
      physics: { frictionRolling: 0.02, dragK: 0.004, liftSpeed: 1.4, launchSpeed: null },
      pieces: ['straight', 'curve-l', 'curve-r', 'drop', 'station', 'brake'],
      supports: { style: 'nl.support-neon', maxSpan: 7, footingRadius: 0.6 },
      limits: { maxGVertical: 3.2, maxGLateral: 1.6, minRadius: 3 },
    },

    {
      id: 'nl.misting-station',
      kind: 'shop',
      name: { en: 'Misting Station', de: 'Sprühnebel-Station' },
      category: 'drink',
      theme: 'nl.neon',
      cost: { build: 28_000_00, runPerHour: 45_00 },
      model: 'neon-lagoon/shops/misting.glb',
      footprint: { w: 4, d: 4, clearanceY: 4 },
      satisfies: [
        { need: 'nl.cooling', amount: 220 },
        { need: 'cc.thirst', amount: 60 },
      ],
      sells: [{ sku: 'mist-token', cost: 40, defaultPrice: 190 }],
      staffSlots: 0,
      queueCapacity: 10,
      power: { kw: 9 },
    },

    { id: 'nl.palm', kind: 'scenery', name: { en: 'Palm', de: 'Palme' }, theme: 'nl.neon', procedural: 'tree', heightM: 9, cost: { build: 1_100_00, runPerHour: 0 }, scatter: { minScale: 0.8, maxScale: 1.3 } },
    { id: 'nl.fern', kind: 'scenery', name: { en: 'Tree Fern', de: 'Baumfarn' }, theme: 'nl.neon', procedural: 'bush', heightM: 2.6, cost: { build: 520_00, runPerHour: 0 }, scatter: { minScale: 0.7, maxScale: 1.4 } },
    {
      id: 'nl.neon-arch',
      kind: 'scenery',
      name: { en: 'Neon Arch', de: 'Neonbogen' },
      theme: 'nl.neon',
      procedural: 'sign',
      heightM: 6.8,
      cost: { build: 2_400_00, runPerHour: 0 },
      tintable: true,
      lightAtNight: { colorHex: '#3CE8D2', intensity: 2.6, rangeM: 18 },
    },
    {
      id: 'nl.pylon',
      kind: 'scenery',
      name: { en: 'Light Pylon', de: 'Lichtmast' },
      theme: 'nl.neon',
      procedural: 'lamp',
      heightM: 9,
      cost: { build: 1_600_00, runPerHour: 0 },
      lightAtNight: { colorHex: '#FF3C9A', intensity: 2.2, rangeM: 22 },
    },

    {
      id: 'nl.lagoon-nights',
      kind: 'scenario',
      name: { en: 'Lagoon Nights', de: 'Lagunennächte' },
      description: {
        en: 'A water park after dark: 1,200 guests, rating 750, and every pool clean.',
        de: 'Wasserpark bei Nacht: 1.200 Gäste, Wertung 750, jedes Becken sauber.',
      },
      start: { cash: 700_000_00, loan: 0, loanLimit: 900_000_00, day: 24, season: 1, unlocked: ['*'], terrainSize: 224 },
      objectives: [
        { id: 'guests', type: 'guestsAtOnce', target: 1200, byDay: 150 },
        { id: 'rating', type: 'parkRating', target: 750, byDay: 150 },
      ],
      fail: [{ type: 'bankrupt' }],
    },
  ],
  strings: {
    en: { 'pack.neon-lagoon': 'Neon Lagoon' },
    de: { 'pack.neon-lagoon': 'Neon-Lagune' },
  },
} as const;
