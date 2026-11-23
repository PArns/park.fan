/**
 * Unit tests for the admin's weather-closure board (`lib/admin/weather-closure.ts`): which colour a
 * ride takes, what each filter and the search keep, and which cause a row's figures come from.
 *
 * Run: pnpm test:admin-weather-closure
 */
import assert from 'node:assert/strict';
import {
  filterWeatherClosureRides,
  leadingProfile,
  weatherClosureState,
} from '../lib/admin/weather-closure.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const profile = (attributableShare, overrides = {}) => ({
  thresholdC: 9,
  closedShare: 0.68,
  closedShareLower: 0.5,
  baselineShare: 0.01,
  attributableShare,
  hours: 41,
  days: 20,
  publishable: false,
  ...overrides,
});

const ride = (overrides = {}) => ({
  attractionId: 'a',
  attractionName: 'The Incredible Hulk Coaster®',
  attractionSlug: 'the-incredible-hulk-coaster',
  parkId: 'p',
  parkName: 'Islands of Adventure',
  parkSlug: 'universal-islands-of-adventure',
  parkPath: 'north-america/united-states/orlando/universal-islands-of-adventure',
  publishable: false,
  bestProbability: 0.6,
  cold: profile(0.6),
  snow: null,
  ...overrides,
});

const shown = ride({ attractionId: 'shown', publishable: true, bestProbability: 0.94 });
const near = ride({ attractionId: 'near', bestProbability: 0.8 });
const edge = ride({ attractionId: 'edge', bestProbability: 0.75 });
const below = ride({ attractionId: 'below', bestProbability: 0.74 });
const snowy = ride({
  attractionId: 'snowy',
  attractionName: 'Taron',
  parkName: 'Phantasialand',
  cold: null,
  snow: profile(0.8, { thresholdC: null }),
  bestProbability: 0.8,
});
const all = [shown, near, edge, below, snowy];
const ids = (rides) => rides.map((r) => r.attractionId);

test('a publishable ride is shown, whatever its probability', () => {
  assert.equal(weatherClosureState(shown), 'shown');
  assert.equal(weatherClosureState(ride({ publishable: true, bestProbability: 0.5 })), 'shown');
});

test('from 75 % a ride that is not shown is near, below it grey', () => {
  assert.equal(weatherClosureState(near), 'near');
  assert.equal(weatherClosureState(edge), 'near');
  assert.equal(weatherClosureState(below), 'below');
});

test('each filter keeps its rides in the API order', () => {
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'all', '')), ids(all));
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'shown', '')), ['shown']);
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'near', '')), ['near', 'edge', 'snowy']);
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'cold', '')), [
    'shown',
    'near',
    'edge',
    'below',
  ]);
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'snow', '')), ['snowy']);
});

test('the search matches park or ride, without case, and combines with the filter', () => {
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'all', '  phantasia ')), ['snowy']);
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'all', 'TARON')), ['snowy']);
  assert.deepEqual(ids(filterWeatherClosureRides(all, 'cold', 'taron')), []);
});

test('the row reads the cause that explains the ride best', () => {
  assert.equal(leadingProfile(shown)?.cause, 'cold');
  assert.equal(leadingProfile(snowy)?.cause, 'snow');
  assert.equal(leadingProfile(ride({ snow: profile(0.9) }))?.cause, 'snow');
  assert.equal(leadingProfile(ride({ snow: profile(0.6) }))?.cause, 'cold');
  assert.equal(leadingProfile(ride({ cold: null })), null);
});

console.log(`\n${passed} cases passed.`);
