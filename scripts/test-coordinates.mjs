/**
 * Unit tests for the coordinate parsing at the API fetch boundary
 * (`lib/api/coordinates.ts`).
 *
 * Run: `pnpm test:coordinates`
 *
 * What is worth pinning here is not the happy path — `Number("52.44")` was
 * never in doubt — but the three values that a naive parser gets wrong in a way
 * nothing downstream would report: the empty string (`Number('')` is 0, which
 * is a real place in the Gulf of Guinea), a genuine 0 (falsy, so any truthiness
 * guard drops it), and a string that isn't a number at all.
 */
import assert from 'node:assert/strict';
import {
  parseCoordinate,
  withParkCoordinates,
  withAttractionCoordinates,
} from '../lib/api/coordinates.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('parseCoordinate');

test('parses the decimal strings the park endpoints send', () => {
  assert.equal(parseCoordinate('52.4401400'), 52.44014);
  assert.equal(parseCoordinate('5.7674900'), 5.76749);
  assert.equal(parseCoordinate('-82.4131981'), -82.4131981);
});

test('passes numbers through unchanged', () => {
  assert.equal(parseCoordinate(52.44014), 52.44014);
  assert.equal(parseCoordinate(-0.09), -0.09);
});

test('keeps a real zero, which is a legal coordinate', () => {
  assert.equal(parseCoordinate(0), 0);
  assert.equal(parseCoordinate('0'), 0);
  assert.equal(parseCoordinate('0.0000000'), 0);
});

test('an empty or blank string is no coordinate, not the equator', () => {
  assert.equal(parseCoordinate(''), null);
  assert.equal(parseCoordinate('   '), null);
});

test('null, undefined and non-numeric input become null', () => {
  assert.equal(parseCoordinate(null), null);
  assert.equal(parseCoordinate(undefined), null);
  assert.equal(parseCoordinate('n/a'), null);
  assert.equal(parseCoordinate(NaN), null);
  assert.equal(parseCoordinate(Infinity), null);
  assert.equal(parseCoordinate({}), null);
});

test('does not range-check — an impossible latitude is still the API answer', () => {
  assert.equal(parseCoordinate('9999'), 9999);
});

console.log('withParkCoordinates');

test('parses the park and everything the map draws a marker for', () => {
  const park = withParkCoordinates({
    latitude: '52.4401400',
    longitude: '5.7674900',
    attractions: [{ id: 'a', latitude: '52.4403780', longitude: '5.7669280' }],
    shows: [{ id: 's', latitude: '52.4400000', longitude: '5.7600000' }],
    restaurants: [{ id: 'r', latitude: '52.4409040', longitude: '5.7646760' }],
  });
  assert.equal(park.latitude, 52.44014);
  assert.equal(park.longitude, 5.76749);
  assert.equal(park.attractions[0].latitude, 52.440378);
  assert.equal(park.shows[0].longitude, 5.76);
  assert.equal(park.restaurants[0].latitude, 52.440904);
});

test('leaves the rest of the payload alone', () => {
  const park = withParkCoordinates({
    id: 'p1',
    name: 'Walibi Holland',
    latitude: '52.4401400',
    longitude: '5.7674900',
    attractions: [{ id: 'a', name: 'Untamed', latitude: null, longitude: null }],
  });
  assert.equal(park.id, 'p1');
  assert.equal(park.name, 'Walibi Holland');
  assert.equal(park.attractions[0].name, 'Untamed');
  assert.equal(park.attractions[0].latitude, null);
});

test('a park without coordinates keeps its nulls', () => {
  const park = withParkCoordinates({ latitude: null, longitude: null, attractions: [] });
  assert.equal(park.latitude, null);
  assert.equal(park.longitude, null);
});

test('survives a payload with no shows or restaurants', () => {
  const park = withParkCoordinates({ latitude: '1.5', longitude: '2.5', attractions: [] });
  assert.equal(park.latitude, 1.5);
  assert.equal(park.shows, undefined);
  assert.equal(park.restaurants, undefined);
});

test('an already-numeric entity keeps its object identity', () => {
  // Costs nothing on the endpoints that send numbers, and on the day the backend
  // fixes its serialisation this whole pass becomes free rather than a copy.
  const attraction = { id: 'a', latitude: 52.44, longitude: 5.76 };
  const park = { latitude: 52.44, longitude: 5.76, attractions: [attraction] };
  const parsed = withParkCoordinates(park);
  assert.equal(parsed.attractions[0], attraction);
});

console.log('withAttractionCoordinates');

test('parses an attraction detail response', () => {
  const attraction = withAttractionCoordinates({
    id: 'a',
    latitude: '52.4426650',
    longitude: '5.7612060',
    park: { id: 'p', name: 'Walibi Holland', slug: 'walibi-holland' },
  });
  assert.equal(attraction.latitude, 52.442665);
  assert.equal(attraction.longitude, 5.761206);
  assert.equal(attraction.park.slug, 'walibi-holland');
});

console.log(`\n${passed} assertions passed.`);
