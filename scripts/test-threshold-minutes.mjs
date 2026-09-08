/**
 * Unit tests for `lib/push/threshold-minutes.ts`: `parseThresholdMinutes` —
 * the guard against a cleared threshold field reaching the API as
 * `Number('') === 0`, which the backend's `@Min(1)` would 400 on with no
 * indication to the visitor of why — and `defaultThresholdFor`, the slider's
 * seeded starting point.
 *
 * Run: `pnpm test:threshold-minutes`
 */
import assert from 'node:assert/strict';
import {
  MAX_THRESHOLD_MIN,
  THRESHOLD_STEP_MIN,
  THRESHOLD_SLIDER_MIN,
  defaultThresholdFor,
  parseThresholdMinutes,
} from '../lib/push/threshold-minutes.ts';

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

test('defaultThresholdFor falls back to the flat default with no live reading', () => {
  assert.equal(defaultThresholdFor(null), 20);
  assert.equal(defaultThresholdFor(undefined), 20);
});

test('defaultThresholdFor is ten minutes under a live reading, on the five-minute grid', () => {
  assert.equal(defaultThresholdFor(31), 20); // roundWaitTo5(31) = 30
  assert.equal(defaultThresholdFor(80), 70);
  assert.equal(defaultThresholdFor(200), 190);
});

test('defaultThresholdFor floors at the slider minimum, not at 1', () => {
  assert.equal(defaultThresholdFor(0), THRESHOLD_SLIDER_MIN);
  assert.equal(defaultThresholdFor(3), THRESHOLD_SLIDER_MIN);
  assert.equal(defaultThresholdFor(15), THRESHOLD_SLIDER_MIN); // roundWaitTo5(15) - 10 = 5, still below the floor
});

test('defaultThresholdFor caps at the maximum', () => {
  assert.equal(defaultThresholdFor(245), 235);
  assert.ok(defaultThresholdFor(9999) <= MAX_THRESHOLD_MIN);
});

test('every non-fallback defaultThresholdFor output lands on the slider grid', () => {
  for (const wait of [5, 10, 33, 47, 61, 99, 150, 239]) {
    const result = defaultThresholdFor(wait);
    assert.equal((result - THRESHOLD_SLIDER_MIN) % THRESHOLD_STEP_MIN, 0, `${wait} -> ${result}`);
  }
});

console.log(`\n${passed} assertions passed.`);
