// Tests for the rain plan's covered rides (`lib/utils/covered-rides.ts`, PAR-425).
//
// Three real parks, captured from the API on 2026-09-29 at 06:24 UTC, before any of them opened:
// Phantasialand (31 of 37 in-season rides curated, 9 indoor), Movie Park Germany (22 of 41, the
// lowest share of the five curated parks) and Hansa-Park (nothing curated). Then synthetic rows
// for the ranking, which a closed park cannot exercise.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COVERED_BANNER_LIMIT,
  COVERED_MIN_KNOWN_SHARE,
  coveredOfferReady,
  isCovered,
  rankCoveredRides,
} from '../lib/utils/covered-rides.ts';
import { walkMinutesFrom } from '../lib/planner/next-best-ride.ts';

const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/covered-rides/${name}.json`, import.meta.url), 'utf8')
  ).attractions;

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✅ ${name}`);
};

test('isCovered: indoor and covered_queue count, outdoor and unknown do not', () => {
  assert.equal(isCovered({ indoorOutdoor: 'indoor' }), true);
  assert.equal(isCovered({ indoorOutdoor: 'covered_queue' }), true);
  assert.equal(isCovered({ indoorOutdoor: 'outdoor' }), false);
  assert.equal(isCovered({ indoorOutdoor: null }), false);
  assert.equal(isCovered({}), false);
});

test('gate: every curated park passes, the uncurated one does not', () => {
  assert.equal(coveredOfferReady(fixture('phantasialand')), true);
  assert.equal(coveredOfferReady(fixture('movie-park-germany')), true);
  assert.equal(coveredOfferReady(fixture('hansa-park')), false);
});

test('gate: the share is counted over in-season rides only', () => {
  // 2 of 4 in season carry a value (50 %); the off-season rides, unknown, do not dilute it.
  const rows = [
    { indoorOutdoor: 'indoor' },
    { indoorOutdoor: 'outdoor' },
    { indoorOutdoor: null },
    { indoorOutdoor: null, isCurrentlyInSeason: null },
    { indoorOutdoor: null, isCurrentlyInSeason: false },
    { indoorOutdoor: null, isCurrentlyInSeason: false },
  ];
  assert.equal(coveredOfferReady(rows), true);
  // One more unknown in season drops it to 2 of 5.
  assert.equal(coveredOfferReady([...rows, { indoorOutdoor: null }]), false);
  assert.equal(COVERED_MIN_KNOWN_SHARE, 0.5);
});

test('gate: fully curated but nothing covered offers nothing', () => {
  assert.equal(
    coveredOfferReady([{ indoorOutdoor: 'outdoor' }, { indoorOutdoor: 'outdoor' }]),
    false
  );
});

test('gate: an empty park offers nothing', () => {
  assert.equal(coveredOfferReady([]), false);
  assert.equal(coveredOfferReady([{ indoorOutdoor: 'indoor', isCurrentlyInSeason: false }]), false);
});

const withDistance = (rows) => rows.map((r) => ({ ...r, distance: null }));

test('ranking: a closed park offers nothing', () => {
  assert.deepEqual(rankCoveredRides(withDistance(fixture('phantasialand'))), []);
});

test('ranking: only the indoor rides of an open Phantasialand, capped', () => {
  const open = withDistance(fixture('phantasialand')).map((r) => ({ ...r, status: 'OPERATING' }));
  const out = rankCoveredRides(open);
  assert.equal(out.length, COVERED_BANNER_LIMIT);
  for (const r of out) assert.equal(r.indoorOutdoor, 'indoor');
  assert.equal(rankCoveredRides(open, 100).length, 9);
});

const row = (id, waitTime, extra = {}) => ({
  id,
  name: id,
  indoorOutdoor: 'indoor',
  status: 'OPERATING',
  waitTime,
  distance: null,
  ...extra,
});

test('ranking: without a position the queue decides', () => {
  const out = rankCoveredRides([row('a', 30), row('b', 5), row('c', 15)]);
  assert.deepEqual(
    out.map((r) => r.id),
    ['b', 'c', 'a']
  );
});

test('ranking: walk plus queue, so a near ride beats a short queue far away', () => {
  // 600 m is ceil(600 × 1.6 / 67) = 15 minutes' walk: 15 + 5 = 20 against 0 + 15 = 15.
  const out = rankCoveredRides([
    row('far', 5, { distance: 600 }),
    row('near', 15, { distance: 0 }),
  ]);
  assert.deepEqual(
    out.map((r) => r.id),
    ['near', 'far']
  );
});

test('ranking: equal totals go to the shorter walk, then the name', () => {
  assert.equal(walkMinutesFrom(100), 3);
  // 100 m is ceil(100 × 1.6 / 67) = 3 minutes: 3 + 7 = 10 against 0 + 10 = 10.
  const out = rankCoveredRides([
    row('walk', 7, { distance: 100 }),
    row('b-here', 10, { distance: 0 }),
    row('a-here', 10, { distance: 0 }),
  ]);
  assert.deepEqual(
    out.map((r) => r.id),
    ['a-here', 'b-here', 'walk']
  );
});

test('ranking: an unknown queue sorts after every known one', () => {
  const out = rankCoveredRides([row('unknown', null), row('long', 90)]);
  assert.deepEqual(
    out.map((r) => r.id),
    ['long', 'unknown']
  );
});

test('ranking: outdoor, unknown, off-season and non-operating rides are never offered', () => {
  const out = rankCoveredRides(
    [
      row('outdoor', 5, { indoorOutdoor: 'outdoor' }),
      row('unknown', 5, { indoorOutdoor: null }),
      row('off', 5, { isCurrentlyInSeason: false }),
      row('down', 5, { status: 'DOWN' }),
      row('queue', 20, { indoorOutdoor: 'covered_queue' }),
    ],
    10
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['queue']
  );
});

console.log(`\n${passed} passed`);
