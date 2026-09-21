/**
 * Unit tests for `parkMapsLinks` (`lib/parks/maps-links.ts`) — the guard that
 * decides whether the park info card shows a route to the gate.
 *
 * It exists because `parseCoordinate` is not a validator: it hands on whatever
 * number the API sent, so a latitude of 900 and the `0,0` of an ungeocoded row
 * both reach the card as perfectly good numbers. Every refusal below is a link
 * that would have pointed somewhere the park is not.
 *
 * Run: `pnpm test:maps-links`
 */
import assert from 'node:assert/strict';
import { parkMapsLinks } from '../lib/parks/maps-links.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('builds both links for Phantasialand', () => {
  const links = parkMapsLinks(50.7984, 6.8794);
  assert.equal(links.google, 'https://www.google.com/maps?q=50.7984%2C6.8794');
  assert.equal(links.apple, 'https://maps.apple.com/?q=50.7984%2C6.8794');
});

test('keeps a negative coordinate, which is most of the western hemisphere', () => {
  const links = parkMapsLinks(28.3852, -81.5639);
  assert.equal(links.google, 'https://www.google.com/maps?q=28.3852%2C-81.5639');
  assert.equal(links.apple, 'https://maps.apple.com/?q=28.3852%2C-81.5639');
});

test('refuses a missing coordinate rather than linking half a pair', () => {
  assert.equal(parkMapsLinks(null, null), null);
  assert.equal(parkMapsLinks(50.7984, null), null);
  assert.equal(parkMapsLinks(null, 6.8794), null);
  assert.equal(parkMapsLinks(undefined, undefined), null);
});

test('refuses 0,0 — Null Island is what an ungeocoded row looks like', () => {
  assert.equal(parkMapsLinks(0, 0), null);
});

test('keeps a real coordinate that has one zero in it', () => {
  assert.notEqual(parkMapsLinks(0, 6.8794), null);
  assert.notEqual(parkMapsLinks(50.7984, 0), null);
});

test('refuses a latitude past the pole or a longitude past the date line', () => {
  assert.equal(parkMapsLinks(900, 6.8794), null);
  assert.equal(parkMapsLinks(-91, 6.8794), null);
  assert.equal(parkMapsLinks(50.7984, 181), null);
  assert.equal(parkMapsLinks(50.7984, -180.5), null);
});

test('keeps the poles and the date line themselves', () => {
  assert.notEqual(parkMapsLinks(90, 180), null);
  assert.notEqual(parkMapsLinks(-90, -180), null);
});

test('refuses NaN and Infinity, which Number() produces from a broken string', () => {
  assert.equal(parkMapsLinks(Number.NaN, 6.8794), null);
  assert.equal(parkMapsLinks(50.7984, Number.POSITIVE_INFINITY), null);
});

test('refuses a coordinate that is still a string, so a forgotten parse stays visible', () => {
  assert.equal(parkMapsLinks('50.7984', '6.8794'), null);
});

console.log(`\n${passed} assertions passed.`);
