/**
 * Unit tests for the park page's rider-height filter (`lib/utils/rider-height.ts`).
 *
 * Run: `pnpm test:rider-height`
 *
 * Two decisions in there are invisible from the screen and would each be a quiet
 * regression: an attraction with NO height on file passes the filter (a missing
 * limit is nobody having written one down, not a ban), and `maximumHeight` is
 * filtered on but does not stretch the slider — Phantasialand's maxima are 140,
 * 145, 195, 200 and 205 cm, so honouring the top of that would spend a third of
 * the track on whether somebody is too tall for a roller coaster.
 */
import assert from 'node:assert/strict';
import {
  canRideAtHeight,
  riderHeightRange,
  riderHeightThresholds,
} from '../lib/utils/rider-height.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('rider height');

test('a ride with no height on file is rideable at every height', () => {
  assert.equal(canRideAtHeight({}, 80), true);
  assert.equal(canRideAtHeight({ minimumHeight: null, maximumHeight: null }, 200), true);
});

test('the minimum is a floor, and the boundary itself clears it', () => {
  assert.equal(canRideAtHeight({ minimumHeight: 120 }, 115), false);
  assert.equal(canRideAtHeight({ minimumHeight: 120 }, 120), true);
});

test('the maximum is a ceiling, and the boundary itself clears it', () => {
  assert.equal(canRideAtHeight({ maximumHeight: 140 }, 140), true);
  assert.equal(canRideAtHeight({ maximumHeight: 140 }, 145), false);
});

test('a park with no minimum anywhere gets no filter', () => {
  assert.equal(riderHeightRange([]), null);
  assert.equal(riderHeightRange([{ minimumHeight: null }, { maximumHeight: 140 }]), null);
});

test('thresholds are the distinct minima, ascending', () => {
  const park = [
    { minimumHeight: 120 },
    { minimumHeight: 90 },
    { minimumHeight: 120 },
    { minimumHeight: null },
    { minimumHeight: 0 },
  ];
  assert.deepEqual(riderHeightThresholds(park), [90, 120]);
});

test("Phantasialand's own limits, which is where the range rule comes from", () => {
  const park = [
    ...[90, 100, 110, 120, 130, 140].map((minimumHeight) => ({ minimumHeight })),
    // The maxima that must NOT stretch the track.
    { maximumHeight: 195 },
    { maximumHeight: 205 },
  ];
  const range = riderHeightRange(park);
  assert.deepEqual(range, { min: 80, max: 140, thresholds: [90, 100, 110, 120, 130, 140] });
});

test('a park with a single limit still gets a track worth dragging', () => {
  // Without the floor this would be 90 → 100: three positions, two of which are
  // the same answer.
  assert.deepEqual(riderHeightRange([{ minimumHeight: 100 }]), {
    min: 90,
    max: 110,
    thresholds: [100],
  });
});

test('limits that are not multiples of five still land on the grid', () => {
  // The step is 5 cm, so the ends have to be too or the last position on the
  // track is unreachable.
  const range = riderHeightRange([{ minimumHeight: 92 }, { minimumHeight: 137 }]);
  assert.deepEqual(range, { min: 80, max: 140, thresholds: [92, 137] });
});

console.log(`\n${passed} passed`);
