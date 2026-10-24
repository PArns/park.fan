/**
 * Unit test for `typicalHourFigures`, the decision behind the ride panel's „usually X, rarely over
 * Y" line: nothing to say without a typical wait, no range unless the rounded 95th percentile
 * rises above it.
 *
 * Run: pnpm test:typical-hour
 */
import assert from 'node:assert/strict';
import { typicalHourFigures } from '../lib/utils/wait-time.ts';

assert.equal(typicalHourFigures(null, 80), null);
assert.equal(typicalHourFigures(undefined, 80), null);
assert.equal(typicalHourFigures(0, 20), null);
assert.deepEqual(typicalHourFigures(40, 80), { typical: 40, rare: 80 });
assert.deepEqual(typicalHourFigures(40, null), { typical: 40, rare: null });
assert.deepEqual(typicalHourFigures(41, 42), { typical: 40, rare: null });
assert.deepEqual(typicalHourFigures(41, 47), { typical: 40, rare: 45 });
assert.deepEqual(typicalHourFigures(40, 30), { typical: 40, rare: null });

console.log('typical-hour: 8 cases ok');
