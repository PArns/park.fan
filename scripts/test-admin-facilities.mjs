/**
 * Unit tests for `/admin/facilities` (`lib/admin/facilities.ts`): the state a park's row shows,
 * the point types and a row's tally, the filter and its numbers, the order of a park's points, the
 * queue's status line, the plot of an outline with its points, and where the page sits in the
 * sidebar.
 *
 * Run: pnpm test:admin-facilities
 */
import assert from 'node:assert/strict';
import {
  FACILITY_STATES,
  FACILITY_STATE_LABEL,
  FACILITY_TYPES,
  facilityCountsLine,
  facilityParksToReview,
  facilityPlot,
  facilityQueueText,
  facilityState,
  facilityStateCounts,
  facilityTypeCount,
  facilityTypeMeta,
  filterFacilityParks,
  isFacilitiesBackendMissing,
  isOutlineRef,
  orderFacilityPoints,
  osmElementUrl,
} from '../lib/admin/facilities.ts';
import { activeNavItem, visibleGroups } from '../app/admin/_app/nav.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const counts = (toilets, drinkingWater, sights) => ({
  toilets,
  drinkingWater,
  sights,
  hidden: 0,
  outside: 0,
  awaitingReview: 0,
});

const parks = [
  {
    name: 'Phantasialand',
    country: 'Germany',
    status: 'approved',
    lastRun: 'ok',
    counts: counts(20, 4, 0),
  },
  {
    name: 'Europa-Park',
    country: 'Germany',
    status: 'imported',
    lastRun: 'ok',
    counts: counts(28, 3, 9),
  },
  {
    name: 'Efteling',
    country: 'Netherlands',
    status: 'approved',
    lastRun: 'failed',
    counts: counts(21, 9, 24),
  },
  { name: 'Fantawild Adventure', country: 'China', status: 'pending', lastRun: 'no_outline' },
  { name: 'Toverland', country: 'Netherlands', status: 'pending', lastRun: 'failed' },
  { name: 'Walibi Holland', status: 'none' },
  {
    name: 'Liseberg',
    country: 'Sweden',
    status: 'imported',
    lastRun: 'ok',
    approvedAt: '2026-11-26T09:00:00Z',
    counts: { ...counts(12, 2, 3), awaitingReview: 3 },
  },
];

test('a row shows what a visitor gets before how the last run ended', () => {
  assert.deepEqual(parks.map(facilityState), [
    'approved',
    'review',
    'approved',
    'no_outline',
    'failed',
    'none',
    'update',
  ]);
});

test('every state has a German word, and the numbers add up to the parks', () => {
  for (const state of FACILITY_STATES) assert.ok(FACILITY_STATE_LABEL[state]);
  const counts = facilityStateCounts(parks);
  assert.deepEqual(counts, {
    review: 1,
    update: 1,
    approved: 2,
    no_outline: 1,
    failed: 1,
    none: 1,
  });
  assert.equal(
    Object.values(counts).reduce((a, b) => a + b, 0),
    parks.length
  );
});

test('the list filters by state and by a word of the name or the country', () => {
  const names = (state, search = '') =>
    filterFacilityParks(parks, state, search).map((p) => p.name);
  assert.equal(names('all').length, 7);
  assert.deepEqual(names('approved'), ['Phantasialand', 'Efteling']);
  assert.deepEqual(names('update'), ['Liseberg']);
  assert.deepEqual(names('no_outline'), ['Fantawild Adventure']);
  assert.deepEqual(names('all', ' nether '), ['Efteling', 'Toverland']);
  assert.deepEqual(names('approved', 'PHANTA'), ['Phantasialand']);
  assert.deepEqual(names('review', 'efteling'), []);
});

test('the parks waiting for an editor are the first reviews and the new points', () => {
  assert.equal(facilityParksToReview(parks), 2);
  assert.equal(facilityParksToReview([]), 0);
});

test('the type filter takes parks with a visible point of that type', () => {
  const names = (type) => filterFacilityParks(parks, 'all', '', type).map((p) => p.name);
  assert.deepEqual(names('sight'), ['Europa-Park', 'Efteling', 'Liseberg']);
  assert.equal(names('toilets').length, 4);
  assert.equal(names('all').length, 7);
});

test('every type has a word, a tally word and a colour; an unknown one is „Sonstiges“', () => {
  for (const type of FACILITY_TYPES) {
    const meta = facilityTypeMeta(type);
    assert.ok(meta.label && meta.short && meta.fill.startsWith('fill-'));
  }
  assert.equal(facilityTypeMeta('sight').label, 'Sehenswürdigkeit');
  assert.equal(facilityTypeMeta('first_aid').label, 'Sonstiges');
  assert.equal(facilityTypeMeta('first_aid').count, null);
});

test('a row’s tally names toilets always and the other types where the park has any', () => {
  assert.equal(facilityCountsLine(counts(12, 3, 11)), '12 WC · 3 Wasser · 11 Sehensw.');
  assert.equal(facilityCountsLine(counts(5, 0, 0)), '5 WC');
  // An API from before sights sends no `sights`.
  assert.equal(
    facilityCountsLine({ toilets: 2, drinkingWater: 1, hidden: 0, outside: 0 }),
    '2 WC · 1 Wasser'
  );
  assert.equal(
    facilityTypeCount({ toilets: 2, drinkingWater: 1, hidden: 0, outside: 0 }, 'sight'),
    0
  );
});

test('a park’s points go by type, the waiting ones first, then by name', () => {
  const point = (osmId, type, name, awaitingReview) => ({ osmId, type, name, awaitingReview });
  const ordered = orderFacilityPoints([
    point('9', 'sight', 'Wensbron', false),
    point('3', 'first_aid', undefined, false),
    point('7', 'sight', 'Opa Gijs', true),
    point('2', 'toilets', undefined, false),
    point('1', 'drinking_water', 'Drinkebroer', false),
    point('10', 'toilets', undefined, false),
    point('8', 'sight', 'Apenfontein', false),
  ]);
  assert.deepEqual(
    ordered.map((p) => p.osmId),
    ['2', '10', '1', '7', '8', '9', '3']
  );
});

test('the queue line says what runs, what waits and why a run broke off', () => {
  assert.equal(facilityQueueText({ parkIds: [] }), null);
  assert.match(facilityQueueText({ bulk: { state: 'waiting' }, parkIds: [] }), /wartet/);
  assert.equal(
    facilityQueueText({
      bulk: {
        state: 'active',
        progress: { total: 209, done: 40, ok: 30, noOutline: 8, failed: 2, points: 500 },
      },
      parkIds: ['a'],
    }),
    'Sammelimport läuft: 40 von 209 Parks, 30 eingelesen, 8 ohne Umriss, 2 fehlgeschlagen.'
  );
  assert.equal(facilityQueueText({ parkIds: ['a'] }), 'Ein Park wird eingelesen.');
  assert.equal(facilityQueueText({ parkIds: ['a', 'b'] }), '2 Parks werden eingelesen.');
  assert.match(
    facilityQueueText({ parkIds: [], lastFailure: 'Overpass did not answer' }),
    /brach ab: Overpass did not answer/
  );
});

test('the plot keeps north up, the park in the frame and its shape', () => {
  // About 1.1 km high and, at 60° north, 1.1 km wide: two degrees of longitude to one of latitude.
  const ring = [
    [10, 60],
    [10.02, 60],
    [10.02, 60.01],
    [10, 60.01],
    [10, 60],
  ];
  const plot = facilityPlot(
    [ring],
    [
      { id: 'nw', latitude: 60.01, longitude: 10 },
      { id: 'se', latitude: 60, longitude: 10.02 },
    ],
    200,
    10
  );
  assert.equal(plot.width, 200);
  assert.ok(Math.abs(plot.height - 200) <= 2, `square park, got ${plot.height}`);
  assert.deepEqual(plot.points[0], { id: 'nw', x: 10, y: 10 });
  assert.equal(plot.points[1].x, 190);
  assert.ok(plot.points[1].y > 180);
  assert.equal(plot.paths.length, 1);
  assert.match(plot.paths[0], /^M10 [\d.]+L190 [\d.]+L190 10L10 10L10 [\d.]+Z$/);
});

test('a point outside the outline widens the frame, and nothing to draw is no plot', () => {
  const ring = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ];
  const plot = facilityPlot([ring], [{ id: 'far', latitude: 0.5, longitude: 3 }], 320, 10);
  assert.equal(plot.points[0].x, 310);
  assert.equal(facilityPlot([], []), null);
  assert.ok(facilityPlot([], [{ id: 'one', latitude: 1, longitude: 1 }]));
});

test('an outline reference, an OSM link and an API without the routes', () => {
  assert.ok(isOutlineRef(' way/31052062 '));
  assert.ok(isOutlineRef('relation/1628236'));
  assert.ok(!isOutlineRef('node/1'));
  assert.ok(!isOutlineRef('31052062'));
  assert.equal(osmElementUrl('node', '845180898'), 'https://www.openstreetmap.org/node/845180898');
  assert.ok(isFacilitiesBackendMissing({ status: 404 }));
  assert.ok(!isFacilitiesBackendMissing({ status: 500 }));
  assert.ok(!isFacilitiesBackendMissing(null));
});

test('the page sits under Kuratieren, for editors', () => {
  assert.equal(activeNavItem('/admin/facilities')?.label, 'Orte im Park');
  const hrefs = (role) =>
    visibleGroups(role)
      .find((group) => group.label === 'Kuratieren')
      .items.map((item) => item.href);
  assert.ok(hrefs('editor').includes('/admin/facilities'));
  assert.ok(!hrefs('viewer').includes('/admin/facilities'));
});

console.log(`\n${passed} cases passed.`);
