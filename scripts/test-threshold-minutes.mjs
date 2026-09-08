/**
 * Unit tests for `parseThresholdMinutes` (`lib/push/threshold-minutes.ts`) —
 * the guard against a cleared threshold field reaching the API as
 * `Number('') === 0`, which the backend's `@Min(1)` would 400 on with no
 * indication to the visitor of why.
 *
 * Run: `pnpm test:threshold-minutes`
 */
import assert from 'node:assert/strict';
import { parseThresholdMinutes } from '../lib/push/threshold-minutes.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('accepts a value in range', () => {
  assert.equal(parseThresholdMinutes('20'), 20);
  assert.equal(parseThresholdMinutes('1'), 1);
  assert.equal(parseThresholdMinutes('240'), 240);
});

test('refuses an empty field rather than treating it as zero', () => {
  assert.equal(parseThresholdMinutes(''), null);
  assert.equal(parseThresholdMinutes('   '), null);
});

test('refuses zero and anything below the minimum', () => {
  assert.equal(parseThresholdMinutes('0'), null);
});

test('refuses anything above the maximum', () => {
  assert.equal(parseThresholdMinutes('241'), null);
  assert.equal(parseThresholdMinutes('9999'), null);
});

test('refuses a decimal — the API takes an integer', () => {
  assert.equal(parseThresholdMinutes('1.5'), null);
});

test('refuses a negative number', () => {
  assert.equal(parseThresholdMinutes('-5'), null);
});

test('refuses text a number field should not have let through anyway', () => {
  assert.equal(parseThresholdMinutes('abc'), null);
  assert.equal(parseThresholdMinutes('20abc'), null);
});

console.log(`\n${passed} assertions passed.`);
