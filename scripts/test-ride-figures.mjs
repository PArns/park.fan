/**
 * Unit tests for the park map popup's ride figures (`lib/api/ride-figures.ts`).
 *
 * Run: `pnpm test:ride-figures`
 *
 * The API strips null keys, so a missing figure is a missing key, and `rideProfile` or `stats`
 * may be absent altogether. A ride keeps only the figures it has, a ride with none is left out,
 * a 0 is a placeholder rather than a measurement, and the duration reaches the popup as whole
 * seconds because it is printed as `m:ss`.
 */
import assert from 'node:assert/strict';
import { pickRideFigures } from '../lib/api/ride-figures.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const ride = (id, stats) => ({ id, rideProfile: stats === undefined ? undefined : { stats } });

test('a ride with all three figures keeps all three', () => {
  const out = pickRideFigures([
    ride('a', { topSpeedKmh: 78, heightM: 19.5, durationSeconds: 175 }),
  ]);
  assert.deepEqual(out, { a: { topSpeedKmh: 78, heightM: 19.5, durationSeconds: 175 } });
});

test('a ride with one figure keeps only that one', () => {
  const out = pickRideFigures([ride('a', { heightM: 26 })]);
  assert.deepEqual(out, { a: { heightM: 26 } });
});

test('null figures are dropped, and a ride left with none is absent', () => {
  const out = pickRideFigures([
    ride('a', { topSpeedKmh: null, heightM: null, durationSeconds: null }),
    ride('b', { topSpeedKmh: 50, heightM: null }),
  ]);
  assert.deepEqual(out, { b: { topSpeedKmh: 50 } });
});

test('a missing rideProfile or stats is absent, not an error', () => {
  const out = pickRideFigures([
    { id: 'a' },
    { id: 'b', rideProfile: null },
    ride('c', null),
    ride('d', undefined),
  ]);
  assert.deepEqual(out, {});
});

test('a 0 is a placeholder and is dropped', () => {
  const out = pickRideFigures([ride('a', { topSpeedKmh: 0, heightM: 0, durationSeconds: 0 })]);
  assert.deepEqual(out, {});
});

test('the duration is rounded to whole seconds', () => {
  const out = pickRideFigures([
    ride('a', { durationSeconds: 95.5 }),
    ride('b', { durationSeconds: 0.4 }),
  ]);
  assert.deepEqual(out, { a: { durationSeconds: 96 } });
});

test('an empty park answers an empty object', () => {
  assert.deepEqual(pickRideFigures([]), {});
});

console.log(`\n${passed} passed`);
