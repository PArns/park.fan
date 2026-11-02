/**
 * Unit tests for the hero's park decision (`resolveHeroPark`) and the pure parts of its resting
 * list (`shutParkSchedules`, `sortOpenFirst`, `popularFill`).
 *
 * What must hold: standing in a park is `in_park` with the park's slugs read off a ride when the
 * answer sends no URL; a nearby park is `in_park` within 1 km, `near_park` within 5 km and nothing
 * beyond; the list puts open parks first and tops a short list up with popular parks not listed.
 *
 * Run: pnpm test:hero-park
 */
import assert from 'node:assert/strict';
import { resolveHeroPark } from '../lib/home/hero-park.ts';
import { popularFill, shutParkSchedules, sortOpenFirst } from '../lib/home/hero-browse.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const URL_OF = '/v1/parks/europe/germany/bruehl/phantasialand';
const park = (extra = {}) => ({
  id: 'p1',
  name: 'Phantasialand',
  slug: 'phantasialand',
  status: 'OPERATING',
  timezone: 'Europe/Berlin',
  ...extra,
});
const nearby = (distance, extra = {}) => ({
  type: 'nearby_parks',
  data: { parks: [park({ distance, url: URL_OF, ...extra })], count: 1 },
});

test('in_park with a park URL: the slugs come from it', () => {
  const answer = { type: 'in_park', data: { park: park({ url: URL_OF }), rides: [] } };
  const hero = resolveHeroPark(answer);
  assert.equal(hero.kind, 'in_park');
  assert.deepEqual(hero.park.geo, { continent: 'europe', country: 'germany', city: 'bruehl' });
});

test('in_park without a park URL: the slugs come from a ride', () => {
  const answer = {
    type: 'in_park',
    data: { park: park(), rides: [{ url: '/v1/parks/europe/germany/bruehl/phantasialand/taron' }] },
  };
  assert.deepEqual(resolveHeroPark(answer).park.geo, {
    continent: 'europe',
    country: 'germany',
    city: 'bruehl',
  });
});

test('in_park without any URL: still the park, geo null', () => {
  const hero = resolveHeroPark({ type: 'in_park', data: { park: park(), rides: [] } });
  assert.equal(hero.kind, 'in_park');
  assert.equal(hero.park.geo, null);
});

test('nearby_parks at 800 m: in_park', () => {
  assert.equal(resolveHeroPark(nearby(800)).kind, 'in_park');
});

test('nearby_parks at 4 km: near_park', () => {
  assert.equal(resolveHeroPark(nearby(4000)).kind, 'near_park');
});

test('nearby_parks at 6 km, an empty list and no answer: nothing', () => {
  assert.equal(resolveHeroPark(nearby(6000)), null);
  assert.equal(resolveHeroPark({ type: 'nearby_parks', data: { parks: [], count: 0 } }), null);
  assert.equal(resolveHeroPark(undefined), null);
});

test('a name with the „New“ prefix is shown without it', () => {
  assert.equal(
    resolveHeroPark(nearby(800, { name: 'NEW: Phantasialand' })).park.name,
    'Phantasialand'
  );
});

test('shutParkSchedules: only a CLOSED park carries schedules and its zone', () => {
  const today = { scheduleType: 'OPERATING', openingTime: 'a', closingTime: 'b' };
  assert.deepEqual(
    shutParkSchedules({ status: 'CLOSED', timezone: 'Europe/Berlin', todaySchedule: today }),
    {
      schedules: { today, next: undefined },
      timezone: 'Europe/Berlin',
    }
  );
  assert.deepEqual(shutParkSchedules({ status: 'OPERATING', timezone: 'Europe/Berlin' }), {});
});

test('sortOpenFirst: open parks first, then by distance, input untouched', () => {
  const input = [
    { id: 'a', status: 'CLOSED', distance: 100 },
    { id: 'b', status: 'OPERATING', distance: 900 },
    { id: 'c', status: 'OPERATING', distance: 300 },
  ];
  assert.deepEqual(
    sortOpenFirst(input).map((p) => p.id),
    ['c', 'b', 'a']
  );
  assert.equal(input[0].id, 'a');
});

test('popularFill: tops up to the minimum with parks not listed; a full list gets none', () => {
  const popular = ['x', 'y', 'z'].map((id) => ({ id }));
  assert.deepEqual(
    popularFill([{ id: 'x' }], popular, 3).map((p) => p.id),
    ['y', 'z']
  );
  assert.deepEqual(popularFill([{ id: 'a' }, { id: 'b' }], popular, 2), []);
});

console.log(`\n${passed} cases passed.`);
