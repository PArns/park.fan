/**
 * Unit tests for `lib/push/threshold-minutes.ts`: `parseThresholdMinutes` —
 * the guard against a cleared threshold field reaching the API as
 * `Number('') === 0`, which the backend's `@Min(1)` would 400 on with no
 * indication to the visitor of why — `defaultThresholdFor`, the slider's
 * seeded starting point, and `maxThresholdFor` /
 * `hasUsableThresholdRange`, which keep it from offering a threshold that
 * is already true.
 *
 * Run: `pnpm test:threshold-minutes`
 */
import assert from 'node:assert/strict';
import {
  MAX_THRESHOLD_MIN,
  THRESHOLD_STEP_MIN,
  THRESHOLD_SLIDER_MIN,
  defaultThresholdFor,
  hasUsableThresholdRange,
  maxThresholdFor,
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
  assert.equal(defaultThresholdFor(12), THRESHOLD_SLIDER_MIN); // roundWaitTo5(12) - 10 = 0, below the floor
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

test('maxThresholdFor is ten under the live reading, on the five-minute grid', () => {
  assert.equal(maxThresholdFor(110), 100);
  assert.equal(maxThresholdFor(31), 20); // roundWaitTo5(31) = 30
  assert.equal(maxThresholdFor(80), 70);
});

test('maxThresholdFor is the API maximum with no reading to cap against', () => {
  assert.equal(maxThresholdFor(null), MAX_THRESHOLD_MIN);
  assert.equal(maxThresholdFor(undefined), MAX_THRESHOLD_MIN);
});

test('maxThresholdFor never returns a max under the slider floor', () => {
  for (const wait of [0, 3, 10, 15, 20]) {
    assert.ok(maxThresholdFor(wait) >= THRESHOLD_SLIDER_MIN, `${wait}`);
  }
});

test('maxThresholdFor is exactly ten under a short reading too', () => {
  assert.equal(maxThresholdFor(15), 5);
  assert.equal(maxThresholdFor(20), 10);
  assert.equal(maxThresholdFor(25), 15);
});

test('maxThresholdFor stays inside the API range for an absurd reading', () => {
  assert.ok(maxThresholdFor(9999) <= MAX_THRESHOLD_MIN);
});

test('a max always lands on the slider grid, so the top of the track is reachable', () => {
  for (const wait of [12, 27, 44, 63, 118, 251, null]) {
    const max = maxThresholdFor(wait);
    assert.equal((max - THRESHOLD_SLIDER_MIN) % THRESHOLD_STEP_MIN, 0, `${wait} -> ${max}`);
  }
});

test('the default is the max — the most permissive alert that is not already true', () => {
  for (const wait of [25, 40, 110, 200]) {
    assert.equal(defaultThresholdFor(wait), maxThresholdFor(wait), `${wait}`);
  }
});

test('hasUsableThresholdRange refuses a queue the cap would take to zero', () => {
  // roundWaitTo5(x) - 10 <= 0, i.e. nothing left to promise.
  assert.equal(hasUsableThresholdRange(0), false);
  assert.equal(hasUsableThresholdRange(5), false);
  assert.equal(hasUsableThresholdRange(10), false);
  assert.equal(hasUsableThresholdRange(12), false); // roundWaitTo5(12) = 10
});

test('hasUsableThresholdRange allows the one-stop track just above it', () => {
  assert.equal(hasUsableThresholdRange(15), true);
  assert.equal(maxThresholdFor(15), THRESHOLD_SLIDER_MIN);
});

test('hasUsableThresholdRange allows anything longer, and anything unknown', () => {
  assert.equal(hasUsableThresholdRange(20), true);
  assert.equal(hasUsableThresholdRange(110), true);
  assert.equal(hasUsableThresholdRange(null), true);
  assert.equal(hasUsableThresholdRange(undefined), true);
});

console.log(`\n${passed} assertions passed.`);
