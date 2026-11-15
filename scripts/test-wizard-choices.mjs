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
  declutterMap,
  mapBoxSize,
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

// Orlando as the API places it: five hotel areas and the seven headliners, a city that runs north
// to south.
const area = (key, latitude, longitude, radius = 10) => ({ key, latitude, longitude, radius });
const park = (key, latitude, longitude, code) => ({
  key,
  latitude,
  longitude,
  radius: 7,
  label: { width: code.length * 7 + 6, height: 14 },
});
const ORLANDO_MAP = [
  area('disney', 28.367, -81.544, 13),
  area('universal', 28.467, -81.465),
  area('international_drive', 28.444, -81.47),
  area('lake_buena_vista', 28.377, -81.514),
  area('kissimmee', 28.333, -81.512),
  park('mk', 28.4177, -81.5812, 'MK'),
  park('ep', 28.3747, -81.5494, 'EP'),
  park('hs', 28.3575, -81.5582, 'HS'),
  park('ak', 28.3553, -81.5901, 'AK'),
  park('usf', 28.4749, -81.4664, 'US'),
  park('ioa', 28.4711, -81.4716, 'IoA'),
  park('epic', 28.4733, -81.4462, 'Epic'),
];
const frame = (maxWidth) => ({ maxWidth, minHeight: 150, maxHeight: 300, pad: 22 });

/** Every marker and label inside the map, no two markers touching and no label on anything else. */
function assertReadable(layout, name) {
  const boxes = [
    ...layout.points.map((p) => ({
      key: `marker ${p.key}`,
      l: p.x - p.radius,
      t: p.y - p.radius,
      r: p.x + p.radius,
      b: p.y + p.radius,
    })),
    ...layout.labels.map((l) => ({
      key: `label ${l.key}`,
      l: l.x - l.width / 2,
      t: l.y - l.height / 2,
      r: l.x + l.width / 2,
      b: l.y + l.height / 2,
    })),
  ];
  for (const box of boxes) {
    assert.ok(box.l >= -0.5 && box.t >= -0.5, `${name}: ${box.key} inside, top left`);
    assert.ok(
      box.r <= layout.width + 0.5 && box.b <= layout.height + 0.5,
      `${name}: ${box.key} inside, bottom right`
    );
  }
  const points = layout.points;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const [a, b] = [points[i], points[j]];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      assert.ok(d >= a.radius + b.radius, `${name}: markers ${a.key} and ${b.key} apart, ${d}`);
    }
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = Math.max(i + 1, points.length); j < boxes.length; j += 1) {
      const [a, b] = [boxes[i], boxes[j]];
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      assert.ok(w <= 0.5 || h <= 0.5, `${name}: ${a.key} clear of ${b.key}`);
    }
  }
}

/**
 * The places in pixels as the tiles would put them: fitted into the box with 24 px at the edges,
 * longitude by the cosine of the latitude. Leaflet's own projection differs from this by far less
 * than a marker at a city's scale.
 */
function project(places, width, height) {
  const lats = places.map((p) => p.latitude);
  const cos = Math.cos((((Math.min(...lats) + Math.max(...lats)) / 2) * Math.PI) / 180);
  const xs = places.map((p) => p.longitude * cos);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...lats),
    Math.max(...lats),
  ];
  const k = Math.min((width - 48) / (maxX - minX || 1), (height - 48) / (maxY - minY || 1));
  const offX = (width - (maxX - minX) * k) / 2;
  const offY = (height - (maxY - minY) * k) / 2;
  return places.map((p, i) => ({
    key: p.key,
    x: offX + (xs[i] - minX) * k,
    y: offY + (maxY - p.latitude) * k,
    radius: p.radius,
    ...(p.label && { label: p.label }),
  }));
}

for (const width of [715, 343]) {
  const box = mapBoxSize(ORLANDO_MAP, frame(width));
  assert.ok(box.height <= 300 && box.height >= 150, `Orlando at ${width}: height ${box.height}`);
  const markers = project(ORLANDO_MAP, box.width, box.height);
  const map = declutterMap(markers, box.width, box.height);
  assert.equal(map.labels.length, 7, 'every park has its label');
  assertReadable({ ...map, ...box }, `Orlando at ${width}`);
  const at = (key) => map.points.find((p) => p.key === key);
  assert.ok(at('mk').x < at('universal').x, 'west stays west');
  assert.ok(at('universal').y < at('kissimmee').y, 'north stays up');
  assert.deepEqual(declutterMap(markers, box.width, box.height), map, 'the same map every time');
}
const desk = mapBoxSize(ORLANDO_MAP, frame(715));
assert.equal(desk.height, 300, 'a city that runs north to south takes the height it may');
assert.ok(desk.width < 715 * 0.6, `and only the width it needs: ${desk.width}`);

// Tokyo runs west to east: the map takes the whole width and only the height that asks for.
const TOKYO_MAP = [
  area('maihama', 35.635, 139.885, 13),
  area('disneysea_hotels', 35.627, 139.89),
  area('bayside', 35.628, 139.876),
  area('shin_urayasu', 35.65, 139.914),
  area('tokyo_station', 35.682, 139.765),
  area('shinjuku', 35.688, 139.7),
  park('tokyo-disneyland', 35.633, 139.88, 'DL'),
  park('tokyo-disneysea', 35.627, 139.888, 'DS'),
];
for (const width of [715, 343]) {
  const box = mapBoxSize(TOKYO_MAP, frame(width));
  assert.equal(box.width, width, `Tokyo at ${width} fills the width`);
  assert.ok(box.height < 300, `Tokyo at ${width}: height ${box.height}`);
  const map = declutterMap(project(TOKYO_MAP, box.width, box.height), box.width, box.height);
  assertReadable({ ...map, ...box }, `Tokyo at ${width}`);
}

assert.deepEqual(mapBoxSize([], frame(400)), { width: 0, height: 0 }, 'no places, no map');

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
