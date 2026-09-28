// Tests for when the site may read a position without a tap (`lib/utils/geolocation-permission.ts`).
//
// What must hold: a stored grant is used, a stored denial is remembered, a `prompt` opens no native
// prompt on load (except on WebKit, where `prompt` is what the Permissions API says while a grant is
// live, and the site's own opt-in record decides instead), and a background refresh stops when a
// grant this page saw has run out.
// A closed banner stays closed for 30 days, not one browser session.
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

test('granted: read on load, whatever the engine and the opt-in record', () => {
  for (const optedIn of [true, false]) {
    for (const reliable of [true, false]) {
      assert.equal(initialLocationAction('granted', optedIn, reliable), 'request');
    }
  }
});

test('denied: remembered, never read, even with an old opt-in', () => {
  assert.equal(initialLocationAction('denied', true, true), 'denied');
  assert.equal(initialLocationAction('denied', false, false), 'denied');
});

test('Safari after a yes on an earlier visit: read on load instead of showing the banner again', () => {
  // The case this module exists for. Safari reads `prompt` here while the grant is still live, and
  // the old check only reused the opt-in for `null`, so every Safari visit showed the banner.
  assert.equal(initialLocationAction('prompt', true, promptStateIsReliable(SAFARI)), 'request');
});

test('Safari without an earlier yes: wait for the tap', () => {
  assert.equal(initialLocationAction('prompt', false, promptStateIsReliable(SAFARI)), 'wait');
});

test('Chrome/Firefox `prompt`: wait, even after an earlier yes (a one-time grant ran out)', () => {
  assert.equal(initialLocationAction('prompt', true, promptStateIsReliable(CHROME)), 'wait');
  assert.equal(initialLocationAction('prompt', true, promptStateIsReliable(FIREFOX)), 'wait');
  assert.equal(initialLocationAction('prompt', false, promptStateIsReliable(CHROME)), 'wait');
});

test('no Permissions API: the opt-in record decides', () => {
  assert.equal(initialLocationAction(null, true, true), 'request');
  assert.equal(initialLocationAction(null, false, true), 'wait');
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
