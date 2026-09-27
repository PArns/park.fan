/**
 * Unit tests for the in-park compass arithmetic (`lib/utils/compass.ts`): the bearing to a ride,
 * the phone's heading out of a DeviceOrientation event, the filter that keeps the ring from
 * shivering, and the radar layout that puts each marker at its bearing and distance.
 *
 * The points are Phantasialand's own: the in-park simulation's standing point and the coordinates
 * the park payload gives its rides.
 *
 * Run: pnpm test:compass
 */
import assert from 'node:assert/strict';
import {
  angleDelta,
  bearingBetween,
  dialLabel,
  headingFromOrientation,
  normalizeDegrees,
  niceRange,
  placeLabels,
  placeMarkers,
  relocate,
  smoothHeading,
} from '../lib/utils/compass.ts';
import { calculateDistance } from '../lib/utils/distance-utils.ts';
import { resolveCompassDemo, resolveSimLocation } from '../lib/nearby-simulation.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
const near = (actual, expected, tolerance, label) =>
  assert.ok(
    Math.abs(angleDelta(expected, actual)) <= tolerance,
    `${label}: expected ~${expected}, got ${actual}`
  );

// The in-park simulation's point (`lib/nearby-simulation.ts`, preset phantasialand).
const HERE = { lat: 50.7991, lng: 6.8782 };

test('the four cardinal directions', () => {
  near(bearingBetween(50, 7, 51, 7), 0, 0.01, 'north');
  near(bearingBetween(50, 7, 50, 7.01), 90, 0.05, 'east');
  near(bearingBetween(50, 7, 49, 7), 180, 0.01, 'south');
  near(bearingBetween(50, 7, 50, 6.99), 270, 0.05, 'west');
});

test('Crazy Bats lies north of the simulation point, Colorado Adventure east-south-east', () => {
  // 50.8005072, 6.8781136: 157 m north, a metre west.
  near(bearingBetween(HERE.lat, HERE.lng, 50.8005072, 6.8781136), 358, 2, 'Crazy Bats');
  // 50.7985636, 6.8820704: 60 m south, 272 m east.
  near(bearingBetween(HERE.lat, HERE.lng, 50.7985636, 6.8820704), 103, 3, 'Colorado Adventure');
});

test('a bearing is always in [0, 360)', () => {
  for (const [lat, lng] of [
    [HERE.lat + 0.001, HERE.lng - 0.0001],
    [HERE.lat - 0.001, HERE.lng - 0.001],
  ]) {
    const b = bearingBetween(HERE.lat, HERE.lng, lat, lng);
    assert.ok(b >= 0 && b < 360, String(b));
  }
  assert.equal(normalizeDegrees(-90), 270);
  assert.equal(normalizeDegrees(720), 0);
});

test('angleDelta takes the short way round and signs left and right', () => {
  assert.equal(angleDelta(350, 10), 20);
  assert.equal(angleDelta(10, 350), -20);
  assert.equal(angleDelta(0, 180), 180);
  assert.equal(angleDelta(90, 90), 0);
});

test("Safari's webkitCompassHeading is taken as it is", () => {
  assert.equal(headingFromOrientation({ alpha: 12, webkitCompassHeading: 250 }), 250);
});

test('an absolute alpha counts counter-clockwise, so the heading is 360 minus it', () => {
  assert.equal(headingFromOrientation({ alpha: 90, absolute: true }), 270);
  assert.equal(headingFromOrientation({ alpha: 0, absolute: true }), 0);
});

test('a relative alpha says nothing about north and is refused', () => {
  assert.equal(headingFromOrientation({ alpha: 90, absolute: false }), null);
  assert.equal(headingFromOrientation({ alpha: null, absolute: true }), null);
});

test('a screen turned to landscape adds its angle', () => {
  assert.equal(headingFromOrientation({ alpha: 0, absolute: true }, 90), 90);
  assert.equal(headingFromOrientation({ alpha: null, webkitCompassHeading: 300 }, 90), 30);
});

test('smoothing crosses north the short way', () => {
  const step = smoothHeading(359, 1, 0.5);
  assert.ok(step > 359 || step < 1, `stayed near north: ${step}`);
  assert.equal(smoothHeading(null, 42), 42);
});

test('the outer ring snaps to a round distance', () => {
  assert.equal(niceRange(402), 500);
  assert.equal(niceRange(90), 100);
  assert.equal(niceRange(500), 500);
  assert.equal(niceRange(6300), 7000);
});

const RADAR = { range: 500, inner: 8, outer: 34, minGap: 10 };
const length = (p) => Math.hypot(p.x, p.y);
const bearingOf = (p) => normalizeDegrees((Math.atan2(p.x, -p.y) * 180) / Math.PI);

test('a lone marker sits at its true bearing and a radius that grows with distance', () => {
  const [east] = placeMarkers([{ bearing: 90, distance: 250 }], RADAR);
  near(bearingOf(east), 90, 0.001, 'bearing');
  assert.ok(Math.abs(length(east) - 21) < 1e-9, `radius ${length(east)}`);
  const [far] = placeMarkers([{ bearing: 0, distance: 900 }], RADAR);
  assert.ok(Math.abs(length(far) - 34) < 1e-9, 'beyond the range stays on the outer ring');
});

test("Winja's Fear and Winja's Force, 3 m apart, are parted by the gap and stay close to true", () => {
  const [fear, force] = placeMarkers(
    [
      { bearing: 300, distance: 132 },
      { bearing: 301, distance: 130 },
    ],
    RADAR
  );
  assert.ok(Math.hypot(fear.x - force.x, fear.y - force.y) >= 9.99, 'parted');
  near(bearingOf(fear), 300, 20, 'fear');
  near(bearingOf(force), 301, 20, 'force');
});

test('two rides in one direction at different distances do not move at all', () => {
  const pts = placeMarkers(
    [
      { bearing: 80, distance: 150 },
      { bearing: 82, distance: 400 },
    ],
    RADAR
  );
  near(bearingOf(pts[0]), 80, 0.001, 'near one');
  near(bearingOf(pts[1]), 82, 0.001, 'far one');
});

test('two markers on exactly one point still get a direction to part in', () => {
  const [a, b] = placeMarkers(
    [
      { bearing: 45, distance: 200 },
      { bearing: 45, distance: 200 },
    ],
    RADAR
  );
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 9.99);
});

test('a relocated park keeps its distances and bearings, wherever it is put down', () => {
  const taron = { lat: 50.7996591, lng: 6.8829768 };
  // Phantasialand's simulation point, put down in Lisbon.
  const lisbon = { lat: 38.7223, lng: -9.1393 };
  const moved = relocate(taron, HERE, lisbon);
  const before = calculateDistance(HERE.lat, HERE.lng, taron.lat, taron.lng);
  const after = calculateDistance(lisbon.lat, lisbon.lng, moved.lat, moved.lng);
  assert.ok(Math.abs(before - after) < 0.5, `${before} m against ${after} m`);
  near(
    bearingBetween(lisbon.lat, lisbon.lng, moved.lat, moved.lng),
    bearingBetween(HERE.lat, HERE.lng, taron.lat, taron.lng),
    0.2,
    'bearing'
  );
});

test('the compass demo parses, and it is the only sim value the server does not act on', () => {
  assert.equal(resolveCompassDemo('compass')?.preset, 'phantasialand');
  assert.equal(resolveCompassDemo('compass:disneylandparis')?.preset, 'disneylandparis');
  assert.equal(resolveCompassDemo('compass-europa-park')?.preset, 'europapark');
  assert.equal(resolveCompassDemo('Compass')?.preset, 'phantasialand');
  assert.equal(resolveCompassDemo('compass:nowhere'), null);
  assert.equal(resolveCompassDemo('compasses'), null);
  assert.equal(resolveCompassDemo('in_park'), null);
  assert.equal(resolveCompassDemo(null), null);
  assert.equal(resolveSimLocation('compass'), null);
  assert.equal(resolveSimLocation('compass:disneylandparis'), null);
});

test('a ride name is cut to its title, at a word, never ending on a filler', () => {
  assert.equal(dialLabel('Taron'), 'Taron');
  assert.equal(dialLabel('Chiapas - DIE Wasserbahn'), 'Chiapas');
  assert.equal(dialLabel('Autopia, presented by Avis'), 'Autopia');
  assert.equal(dialLabel('Big Thunder Mountain'), 'Big Thunder…');
  assert.equal(dialLabel('Pirates of the Caribbean'), 'Pirates…');
  assert.equal(dialLabel('Dumbo the Flying Elephant'), 'Dumbo…');
  assert.equal(dialLabel('Indiana Jones™ and the Temple of Peril'), 'Indiana Jones…');
  assert.equal(dialLabel('Supercalifragilisticexpialidocious'), 'Supercalifrag…');
});

const LABELS = { markerRadius: 5, height: 5, gap: 0.6, reach: 4, face: 49, centre: 6 };
const boxesOverlap = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const coversMarker = (box, m, r) => {
  const nx = Math.max(box.x, Math.min(m.x, box.x + box.width));
  const ny = Math.max(box.y, Math.min(m.y, box.y + box.height));
  return Math.hypot(nx - m.x, ny - m.y) < r;
};

test("a lone marker's name goes on its outer side", () => {
  const [east] = placeLabels([{ x: 25, y: 0, width: 12 }], [0], { ...LABELS, face: 45 });
  assert.ok(east.x > 25, `label starts right of the marker: ${east.x}`);
  const [west] = placeLabels([{ x: -25, y: 0, width: 12 }], [0], { ...LABELS, face: 45 });
  assert.ok(west.x + west.width < -25, `label ends left of the marker: ${west.x}`);
});

test('in a crowd no label covers another or any marker, and the one in focus is placed', () => {
  // Phantasialand's east side: seven markers within a few units of each other.
  const markers = [
    [8, -10],
    [12, -2],
    [18, -6],
    [22, 2],
    [15, 8],
    [26, -8],
    [28, 6],
  ].map(([x, y]) => ({ x, y, width: 16 }));
  const order = [4, 0, 1, 2, 3, 5, 6];
  const boxes = placeLabels(markers, order, LABELS);
  assert.ok(boxes[4], 'the focus got a label');
  const placed = boxes.filter(Boolean);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      assert.ok(!boxesOverlap(placed[i], placed[j]), `labels ${i} and ${j} overlap`);
    }
    for (const m of markers) assert.ok(!coversMarker(placed[i], m, LABELS.markerRadius));
  }
});

console.log(`\n${passed} assertions passed.`);
