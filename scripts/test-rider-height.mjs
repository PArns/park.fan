/**
 * Unit tests for the park page's rider-height filter (`lib/utils/rider-height.ts`).
 *
 * Run: `pnpm test:rider-height`
 *
 * Three decisions in there are invisible from the screen and would each be a quiet
 * regression: an attraction with NO height on file passes the filter (a missing
 * limit is nobody having written one down, not a ban); a `maximumHeight` at or above
 * the park's highest minimum does not stretch the track — Europa-Park's 195 cm
 * ceiling would buy a stop whose only claim is that somebody is too tall for a
 * roller coaster; and one BELOW it does buy a stop, because otherwise a 132 cm rider
 * has no position that says "too tall for the teacups".
 */
import assert from 'node:assert/strict';
import {
  canRideAtHeight,
  riderHeightStops,
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
  assert.equal(riderHeightStops([]), null);
  assert.equal(riderHeightStops([{ minimumHeight: null }, { maximumHeight: 140 }]), null);
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

test('the stops are the park’s own limits plus one to slide from', () => {
  // Toverland. Nothing between 100 and 120 belongs on this track: there is no ride
  // in the park whose answer changes at 105, 110 or 115.
  const park = [80, 90, 100, 120, 125, 132, 140].map((minimumHeight) => ({ minimumHeight }));
  assert.deepEqual(riderHeightStops(park), [70, 80, 90, 100, 120, 125, 132, 140]);
});

test('a limit that is not a multiple of five is a stop as it stands', () => {
  // The old track rounded the ends onto a 5 cm grid because it counted in
  // centimetres. The stops are positions, so 132 is simply where the park put it.
  assert.deepEqual(
    riderHeightStops([{ minimumHeight: 92 }, { minimumHeight: 137 }]),
    [82, 92, 137]
  );
});

test('a kiddie ride’s ceiling buys the stop that is too tall for it', () => {
  // Europa-Park: minima 90-140, maxima 120, 130, 135, 140 and 195. 125 and 135 are
  // the first heights too tall for the 120 and 130 rides; 140 already exists; the
  // ceilings at 140 and 195 sit at or above the top minimum and stretch nothing.
  const park = [
    ...[90, 100, 120, 130, 140].map((minimumHeight) => ({ minimumHeight })),
    ...[120, 130, 135, 140, 195].map((maximumHeight) => ({ maximumHeight })),
  ];
  assert.deepEqual(riderHeightStops(park), [80, 90, 100, 120, 125, 130, 135, 140]);
});

test('a park with a single limit gets exactly two positions', () => {
  // Two is enough and is the whole truth: tall enough, or not.
  assert.deepEqual(riderHeightStops([{ minimumHeight: 100 }]), [90, 100]);
});

test('every stop changes the answer', () => {
  // The property the whole rewrite exists for. Two neighbouring stops must never
  // return the same set of rides.
  const park = [
    ...[90, 100, 120, 130, 140].map((minimumHeight) => ({ minimumHeight })),
    ...[120, 130, 135].map((maximumHeight) => ({ maximumHeight })),
    {},
  ];
  const stops = riderHeightStops(park);
  // The SET, not its size: 135 cm and 140 cm both clear six of these rides and they
  // are not the same six — one loses the 135 cm ceiling and gains the 140 cm floor.
  const rideable = (cm) => park.map((a) => (canRideAtHeight(a, cm) ? '1' : '0')).join('');
  for (let i = 1; i < stops.length; i++) {
    assert.notEqual(
      rideable(stops[i]),
      rideable(stops[i - 1]),
      `${stops[i - 1]} cm and ${stops[i]} cm answer alike`
    );
  }
});

test('the lowest stop clears nothing that has a limit', () => {
  const park = [80, 90, 140].map((minimumHeight) => ({ minimumHeight }));
  const stops = riderHeightStops(park);
  assert.equal(
    park.filter((a) => canRideAtHeight(a, stops[0])).length,
    0,
    'the lead-in stop has to be able to say "too small for everything"'
  );
});

console.log(`\n${passed} passed`);
