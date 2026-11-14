/**
 * The assistant's option steps draw what the region's data says (`lib/trip-regions/wizard-choices.ts`):
 * what the Hotel step says of getting in early, the Tempo cards' day patterns, an area card's ways to the trip's parks, which parks a city's map
 * shows, the map's places kept apart inside their box, and the fact on a travel day's card.
 *
 * Pure local data, no server, no network. Run: pnpm test:wizard-choices
 */

import assert from 'node:assert/strict';
import {
  areaWays,
  homeBases,
  hotelEarlyAccess,
  mapParks,
  pacePattern,
  restStreak,
  schematicMap,
  travelDayFact,
} from '../lib/trip-regions/wizard-choices.ts';

const bits = (pattern) => pattern.map((park) => (park ? '#' : '.')).join('');

// ── Hotel: the lead and the cards from the same perks ──────────────────────

// Southern California as the API sends it: Disneyland's hotels have no early slot.
const california = hotelEarlyAccess([
  { key: 'disney', perks: [] },
  { key: 'offsite', perks: [] },
]);
assert.equal(california?.lead, 'none', 'no hotel with an early slot: the lead promises none');
assert.equal(california?.early.has('disney'), false, 'and the Disney card says it has none');
const orlando = hotelEarlyAccess([
  { key: 'disney', perks: ['early_entry'] },
  { key: 'disney_deluxe', perks: ['early_entry', 'extended_evening'] },
  { key: 'universal_premier', perks: ['early_park_admission', 'express_included'] },
  { key: 'offsite', perks: [] },
]);
assert.equal(orlando?.lead, 'early', 'Orlando: a resort hotel gets you in early');
assert.deepEqual(
  [...(orlando?.early ?? [])],
  ['disney', 'disney_deluxe', 'universal_premier'],
  'every resort hotel with a slot, never off-site'
);
assert.equal(
  hotelEarlyAccess([{ key: 'park_hotel', perks: ['express_included'] }])?.lead,
  'none',
  'Express is no early slot'
);
assert.equal(hotelEarlyAccess(undefined), null, 'without perk data the step claims nothing');

// ── Tempo ────────────────────────────────────────────────────────────────────

assert.equal(bits(pacePattern(4)), '####.##', 'automatic: four park days, then a rest day');
assert.equal(bits(pacePattern(2)), '##.##.#', 'own limit 2');
assert.equal(bits(pacePattern(1)), '#.#.#.#', 'own limit 1');
assert.equal(bits(pacePattern(null)), '#######', 'no rest days');
assert.equal(restStreak('max:3'), 3);
assert.equal(restStreak('auto'), null);
assert.equal(restStreak('max:x'), null);

// ── Ways from a hotel area (Tokyo's legs as the API sends them) ───────────────

const leg = (from, to, minutes, mode, extra = {}) => ({ from, to, minutes, mode, ...extra });
const TOKYO = {
  parks: [
    { slug: 'tokyo-disneyland', group: 'tdr' },
    { slug: 'tokyo-disneysea', group: 'tdr' },
    { slug: 'fuji-q-highland', group: 'fuji' },
  ],
  travel: {
    legs: [
      leg('hotel:maihama', 'tokyo-disneyland', 10, 'walk'),
      leg('hotel:maihama', 'tokyo-disneysea', 15, 'monorail'),
      leg('hotel:maihama', 'fuji-q-highland', 165, 'highway_bus'),
      leg('hotel:disneysea_hotels', 'tokyo-disneysea', 5, 'walk'),
      leg('hotel:disneysea_hotels', 'tokyo-disneyland', 15, 'monorail'),
      leg('hotel:shinjuku', 'tokyo-disneyland', 55, 'rail'),
      leg('hotel:shinjuku', 'tokyo-disneysea', 65, 'rail'),
      leg('hotel:shinjuku', 'fuji-q-highland', 110, 'highway_bus'),
    ],
  },
};
const tokyoParks = ['tokyo-disneyland', 'tokyo-disneysea', 'fuji-q-highland'];

assert.deepEqual(
  areaWays(TOKYO, 'disneysea_hotels', tokyoParks).map((w) => [w.to, w.minutes, w.mode]),
  [
    ['tokyo-disneysea', 5, 'walk'],
    ['tokyo-disneyland', 15, 'monorail'],
  ],
  'nearest first, a park without a leg left out'
);
assert.equal(areaWays(TOKYO, 'maihama', tokyoParks).length, 3);
assert.deepEqual(areaWays(TOKYO, 'nowhere', tokyoParks), [], 'an area without legs has no ways');

// Orlando: seven headliners read as two resorts, a drive with its transfer counted to the gate.
const ORLANDO = {
  parks: [
    ['mk', 'wdw'],
    ['ep', 'wdw'],
    ['hs', 'wdw'],
    ['ak', 'wdw'],
    ['usf', 'uor'],
    ['ioa', 'uor'],
    ['epic', 'uor'],
  ].map(([slug, group]) => ({ slug, group })),
  travel: {
    legs: [
      leg('mk', 'hotel:disney', 9, 'drive', { transferMinutes: 15 }),
      leg('ep', 'hotel:disney', 8, 'drive'),
      leg('hs', 'hotel:disney', 10, 'drive'),
      leg('ak', 'hotel:disney', 12, 'drive'),
      leg('usf', 'hotel:disney', 20, 'drive'),
      leg('ioa', 'hotel:disney', 20, 'drive'),
      leg('epic', 'hotel:disney', 24, 'drive'),
    ],
  },
};
assert.deepEqual(
  areaWays(ORLANDO, 'disney', ['mk', 'ep', 'hs', 'ak', 'usf', 'ioa', 'epic']),
  [
    { to: 'wdw', group: true, minutes: 8, maxMinutes: 24, mode: 'drive' },
    { to: 'uor', group: true, minutes: 20, maxMinutes: 24, mode: 'drive' },
  ],
  'more than four parks: one line per resort'
);

// ── Cities before the plan answers ───────────────────────────────────────────

const BASES = [
  {
    key: 'tokyo',
    parks: [
      { slug: 'tokyo-disneyland', minutes: 10 },
      { slug: 'fuji-q-highland', minutes: 110 },
    ],
  },
  { key: 'fujikawaguchiko', parks: [{ slug: 'fuji-q-highland', minutes: 15 }] },
  { key: 'osaka', parks: [{ slug: 'universal-studios-japan', minutes: 5 }] },
];
assert.deepEqual(homeBases(BASES, ['universal-studios-japan', 'tokyo-disneyland']), [
  'tokyo',
  'osaka',
]);
assert.deepEqual(homeBases(BASES, ['fuji-q-highland']), ['fujikawaguchiko'], 'the nearest base');

// ── The map ──────────────────────────────────────────────────────────────────

assert.deepEqual(
  mapParks(TOKYO, ['maihama', 'shinjuku'], tokyoParks),
  ['tokyo-disneyland', 'tokyo-disneysea'],
  'a day trip stays off the city map'
);

const box = { width: 320, height: 160, pad: 14, gap: 22 };
const places = [
  { key: 'maihama', latitude: 35.635, longitude: 139.885 },
  { key: 'disneysea_hotels', latitude: 35.627, longitude: 139.89 },
  { key: 'bayside', latitude: 35.628, longitude: 139.876 },
  { key: 'shin_urayasu', latitude: 35.65, longitude: 139.914 },
  { key: 'tokyo_station', latitude: 35.682, longitude: 139.765 },
  { key: 'shinjuku', latitude: 35.688, longitude: 139.7 },
  { key: 'tokyo-disneyland', latitude: 35.633, longitude: 139.88 },
  { key: 'tokyo-disneysea', latitude: 35.627, longitude: 139.888 },
];
const points = schematicMap(places, box);
assert.equal(points.length, places.length);
for (const p of points) {
  assert.ok(p.x >= box.pad - 0.1 && p.x <= box.width - box.pad + 0.1, `${p.key} inside, x ${p.x}`);
  assert.ok(p.y >= box.pad - 0.1 && p.y <= box.height - box.pad + 0.1, `${p.key} inside, y ${p.y}`);
}
for (let i = 0; i < points.length; i += 1) {
  for (let j = i + 1; j < points.length; j += 1) {
    const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
    assert.ok(d >= box.gap - 0.5, `${points[i].key} and ${points[j].key} apart: ${d}`);
  }
}
const at = (key) => points.find((p) => p.key === key);
assert.ok(at('shinjuku').x < at('maihama').x, 'west stays west');
assert.ok(at('shinjuku').y < at('maihama').y, 'north stays up');
assert.deepEqual(schematicMap(places, box), points, 'the same places land in the same spots');
assert.deepEqual(
  schematicMap([{ key: 'only', latitude: 1, longitude: 2 }], box),
  [{ key: 'only', x: 160, y: 80 }],
  'one place sits in the middle'
);

// ── A travel day's fact ──────────────────────────────────────────────────────

const open = (opensAt, closesAt) => ({
  status: 'OPERATING',
  hoursPublished: true,
  opensAt,
  closesAt,
});
const day = {
  parks: {
    a: open('2027-01-14T09:00:00+09:00', '2027-01-14T20:00:00+09:00'),
    b: open('2027-01-14T08:30:00+09:00', '2027-01-14T21:00:00+09:00'),
    c: { status: 'CLOSED', hoursPublished: true },
    d: { status: 'OPERATING', hoursPublished: false },
  },
};
assert.deepEqual(travelDayFact(day, ['a', 'b', 'c', 'd'], 'arrival'), {
  slug: 'b',
  at: '2027-01-14T21:00:00+09:00',
});
assert.deepEqual(travelDayFact(day, ['a', 'c'], 'departure'), {
  slug: 'a',
  at: '2027-01-14T09:00:00+09:00',
});
assert.equal(travelDayFact(day, ['c', 'd'], 'arrival'), null, 'no published hours, no fact');
assert.equal(travelDayFact(undefined, ['a'], 'arrival'), null);

console.log('wizard choices: ok');
