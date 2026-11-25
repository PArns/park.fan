/**
 * Unit tests for `/admin/facilities` (`lib/admin/facilities.ts`): the state a park's row shows,
 * the filter and its numbers, the queue's status line, the plot of an outline with its points,
 * and where the page sits in the sidebar.
 *
 * Run: pnpm test:admin-facilities
 */
import assert from 'node:assert/strict';
import {
  FACILITY_STATES,
  FACILITY_STATE_LABEL,
  facilityPlot,
  facilityQueueText,
  facilityState,
  facilityStateCounts,
  filterFacilityParks,
  isFacilitiesBackendMissing,
  isOutlineRef,
  osmElementUrl,
} from '../lib/admin/facilities.ts';
import { activeNavItem, visibleGroups } from '../app/admin/_app/nav.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const parks = [
  { name: 'Phantasialand', country: 'Germany', status: 'approved', lastRun: 'ok' },
  { name: 'Europa-Park', country: 'Germany', status: 'imported', lastRun: 'ok' },
  { name: 'Efteling', country: 'Netherlands', status: 'approved', lastRun: 'failed' },
  { name: 'Fantawild Adventure', country: 'China', status: 'pending', lastRun: 'no_outline' },
  { name: 'Toverland', country: 'Netherlands', status: 'pending', lastRun: 'failed' },
  { name: 'Walibi Holland', status: 'none' },
];

test('a row shows what a visitor gets before how the last run ended', () => {
  assert.deepEqual(parks.map(facilityState), [
    'approved',
    'review',
    'approved',
    'no_outline',
    'failed',
    'none',
  ]);
});

test('every state has a German word, and the numbers add up to the parks', () => {
  for (const state of FACILITY_STATES) assert.ok(FACILITY_STATE_LABEL[state]);
  const counts = facilityStateCounts(parks);
  assert.deepEqual(counts, { review: 1, approved: 2, no_outline: 1, failed: 1, none: 1 });
  assert.equal(
    Object.values(counts).reduce((a, b) => a + b, 0),
    parks.length
  );
});

test('the list filters by state and by a word of the name or the country', () => {
  const names = (state, search = '') =>
    filterFacilityParks(parks, state, search).map((p) => p.name);
  assert.equal(names('all').length, 6);
  assert.deepEqual(names('approved'), ['Phantasialand', 'Efteling']);
  assert.deepEqual(names('no_outline'), ['Fantawild Adventure']);
  assert.deepEqual(names('all', ' nether '), ['Efteling', 'Toverland']);
  assert.deepEqual(names('approved', 'PHANTA'), ['Phantasialand']);
  assert.deepEqual(names('review', 'efteling'), []);
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
  assert.equal(activeNavItem('/admin/facilities')?.label, 'Toiletten und Wasser');
  const hrefs = (role) =>
    visibleGroups(role)
      .find((group) => group.label === 'Kuratieren')
      .items.map((item) => item.href);
  assert.ok(hrefs('editor').includes('/admin/facilities'));
  assert.ok(!hrefs('viewer').includes('/admin/facilities'));
});

console.log(`\n${passed} cases passed.`);
