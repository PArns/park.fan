// Tests for when the site may read a position without a tap (`lib/utils/geolocation-permission.ts`).
//
// What must hold: on load only `granted` is read, on every page and in every browser, because it is
// the one answer that promises no prompt. A stored denial is remembered. An earlier yes the browser
// no longer reports is not reused: Safari on iOS prompts again on every page load. A background
// refresh stops when a grant this page saw has run out, and a closed banner stays closed for 30 days.
import assert from 'node:assert/strict';
import {
  LOCATION_BANNER_QUIET_MS,
  canRefreshSilently,
  initialLocationAction,
  locationBannerIsQuiet,
  promptStateIsReliable,
} from '../lib/utils/geolocation-permission.ts';

const SAFARI = 'Apple Computer, Inc.';
const CHROME = 'Google Inc.';
const FIREFOX = '';

let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log(`ok ${n} - ${name}`);
}

test('WebKit is the engine whose `prompt` cannot be trusted', () => {
  assert.equal(promptStateIsReliable(SAFARI), false);
  assert.equal(promptStateIsReliable(CHROME), true);
  assert.equal(promptStateIsReliable(FIREFOX), true);
  assert.equal(promptStateIsReliable(undefined), true);
});

test('granted: read on load, the one answer that promises no prompt', () => {
  assert.equal(initialLocationAction('granted'), 'request');
});

test('denied: remembered, never read', () => {
  assert.equal(initialLocationAction('denied'), 'denied');
});

test('prompt: wait for a tap, in every browser', () => {
  // Safari included. It reads `prompt` even while an earlier yes still holds, but on iOS with the
  // default "Ask" setting a read on load is a native prompt on every page load, blog and news entry
  // pages included. Reusing that yes was tried and taken out again.
  assert.equal(initialLocationAction('prompt'), 'wait');
});

test('no Permissions API, or it threw: wait for a tap', () => {
  assert.equal(initialLocationAction(null), 'wait');
});

test('background refresh: a grant that ran out stops it (Chrome "Allow this time")', () => {
  assert.equal(canRefreshSilently('granted', true, true), true);
  assert.equal(canRefreshSilently('prompt', true, true), false);
  assert.equal(canRefreshSilently('denied', true, true), false);
});

test('background refresh: a `prompt` that never was `granted` keeps it going (Firefox temporary grant)', () => {
  // Firefox leaves a temporary grant at `prompt` and fires no `change`; the refresh worked there
  // before and must go on working.
  assert.equal(canRefreshSilently('prompt', true, false), true);
});

test('background refresh on WebKit or without the API: `prompt` is the steady state, keep going', () => {
  assert.equal(canRefreshSilently('prompt', false, true), true);
  assert.equal(canRefreshSilently(null, true, false), true);
  assert.equal(canRefreshSilently('denied', false, false), false);
});

test('banner: open when never closed, or when the stored value is not a time', () => {
  assert.equal(locationBannerIsQuiet(null, Date.now()), false);
  assert.equal(locationBannerIsQuiet(Number('garbage'), Date.now()), false);
});

test('banner: closed for 30 days after a close, open again after that', () => {
  const closed = Date.UTC(2026, 8, 1);
  assert.equal(locationBannerIsQuiet(closed, closed + 1), true);
  assert.equal(locationBannerIsQuiet(closed, closed + 29 * 24 * 3600 * 1000), true);
  assert.equal(locationBannerIsQuiet(closed, closed + LOCATION_BANNER_QUIET_MS - 1), true);
  assert.equal(locationBannerIsQuiet(closed, closed + LOCATION_BANNER_QUIET_MS), false);
});

test('banner: a close stamped in the future does not keep it shut for good', () => {
  const now = Date.UTC(2026, 8, 1);
  assert.equal(locationBannerIsQuiet(now + 365 * 24 * 3600 * 1000, now), false);
});

console.log(`\n${n} passed`);
