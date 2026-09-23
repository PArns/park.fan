// Tests for the park page's "near you" row (`lib/utils/in-park-block.ts`, PAR-418).
//
// The row decides between five states from browser inputs the server cannot see. What must hold:
// no state asks for location by itself, the lists appear only when the nearby answer places the
// visitor in THIS park, a coarse fix hides distances, and distances are measured again from the
// current fix wherever the page knows a ride's point.
import assert from 'node:assert/strict';
import { resolveInParkBlock, withCurrentDistances } from '../lib/utils/in-park-block.ts';

const PARK_ID = 'park-phl';
const PARK = { lat: 50.8005, lng: 6.8793 };
const RIDE_POINT = { lat: 50.8001, lng: 6.8804 };

const rides = [
  {
    id: 'r1',
    name: 'Taron',
    slug: 'taron',
    distance: 900,
    waitTime: 30,
    status: 'OPERATING',
    url: '/x',
    isHeadliner: true,
  },
  {
    id: 'r2',
    name: 'Maus',
    slug: 'maus',
    distance: 400,
    waitTime: 10,
    status: 'OPERATING',
    url: '/y',
  },
];

const inParkAnswer = (parkId = PARK_ID) => ({
  type: 'in_park',
  userLocation: { latitude: PARK.lat, longitude: PARK.lng },
  data: { park: { id: parkId, name: 'Phantasialand', slug: 'phantasialand' }, rides },
});

const base = {
  parkId: PARK_ID,
  parkLatitude: PARK.lat,
  parkLongitude: PARK.lng,
  rideCoordinates: new Map([['r1', RIDE_POINT]]),
  nearby: undefined,
  nearbyPending: false,
  position: null,
  accuracy: null,
  permissionGranted: false,
  permissionDenied: false,
  initialCheckDone: true,
  loading: false,
  simulated: false,
};

let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log(`ok ${n} - ${name}`);
}

test('before the permission check nothing is known', () => {
  assert.deepEqual(resolveInParkBlock({ ...base, initialCheckDone: false }), { kind: 'pending' });
});

test('not granted: the row offers the button, whatever the nearby answer says', () => {
  // A GeoIP answer can never be `in_park` in practice, but even if it were, no location was granted.
  assert.deepEqual(resolveInParkBlock({ ...base, nearby: inParkAnswer() }), { kind: 'ask' });
});

test('denied: a hint, not a button that could do nothing', () => {
  assert.deepEqual(resolveInParkBlock({ ...base, permissionDenied: true }), { kind: 'blocked' });
});

test('granted, fix on its way: pending; fix failed: the button again', () => {
  assert.deepEqual(resolveInParkBlock({ ...base, permissionGranted: true, loading: true }), {
    kind: 'pending',
  });
  assert.deepEqual(resolveInParkBlock({ ...base, permissionGranted: true }), { kind: 'ask' });
});

test('granted and in THIS park: lists, distances measured from the current fix', () => {
  const s = resolveInParkBlock({
    ...base,
    permissionGranted: true,
    position: PARK,
    accuracy: 20,
    nearby: inParkAnswer(),
  });
  assert.equal(s.kind, 'inPark');
  assert.equal(s.showDistances, true);
  const taron = s.rides.find((r) => r.id === 'r1');
  // PARK → RIDE_POINT is ~88 m; the API's 900 m was from an older position.
  assert.ok(taron.distance > 70 && taron.distance < 110, `taron at ${taron.distance} m`);
  // A ride the page has no point for keeps the API's distance.
  assert.equal(s.rides.find((r) => r.id === 'r2').distance, 400);
});

test('a fix inside the park while the nearby answer is still pending: pending, never away', () => {
  const s = resolveInParkBlock({
    ...base,
    permissionGranted: true,
    position: PARK,
    nearbyPending: true,
  });
  assert.deepEqual(s, { kind: 'pending' });
});

test('in another park: away, with the distance to this one', () => {
  const s = resolveInParkBlock({
    ...base,
    permissionGranted: true,
    position: { lat: 51.6498, lng: 5.0489 },
    nearby: inParkAnswer('park-efteling'),
  });
  assert.equal(s.kind, 'away');
  assert.ok(s.distanceM > 100_000 && s.distanceM < 200_000, `${s.distanceM} m`);
});

test('a park without a point: away without a distance', () => {
  const s = resolveInParkBlock({
    ...base,
    parkLatitude: null,
    permissionGranted: true,
    position: PARK,
  });
  assert.deepEqual(s, { kind: 'away', distanceM: null });
});

test('a fix coarser than the in-park radius hides distances and keeps the API rows', () => {
  const s = resolveInParkBlock({
    ...base,
    permissionGranted: true,
    position: PARK,
    accuracy: 1500,
    nearby: inParkAnswer(),
  });
  assert.equal(s.kind, 'inPark');
  assert.equal(s.showDistances, false);
  assert.equal(s.rides, rides);
});

test('exactly the radius still counts as precise enough', () => {
  const s = resolveInParkBlock({
    ...base,
    permissionGranted: true,
    position: PARK,
    accuracy: 1000,
    nearby: inParkAnswer(),
  });
  assert.equal(s.showDistances, true);
});

test('?sim= in this park: lists without any fix, API distances untouched', () => {
  const s = resolveInParkBlock({
    ...base,
    simulated: true,
    position: { lat: 52.52, lng: 13.4 },
    permissionGranted: true,
    nearby: inParkAnswer(),
  });
  assert.equal(s.kind, 'inPark');
  assert.equal(s.rides, rides);
});

test('?sim= for another park falls through to the real inputs', () => {
  assert.deepEqual(
    resolveInParkBlock({ ...base, simulated: true, nearby: inParkAnswer('park-efteling') }),
    { kind: 'ask' }
  );
});

test('withCurrentDistances rounds to whole metres and does not mutate its input', () => {
  const out = withCurrentDistances(rides, PARK, new Map([['r1', RIDE_POINT]]));
  assert.equal(Number.isInteger(out[0].distance), true);
  assert.equal(rides[0].distance, 900);
});

console.log(`\n${n} passed`);
