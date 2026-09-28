// Tests for when the site may read a position (`lib/utils/geolocation-permission.ts`).
//
// What must hold: `granted` is read on load, on every page. A stored denial is remembered and never
// asked again. An earlier yes the browser no longer reports is asked again, but only where a page
// uses location (homepage, park page), never on a blog or news page. Without any earlier answer
// nothing is read until a tap. A dismissed prompt is not a block. A background refresh stops when a
// grant this page saw has run out, and a closed banner stays closed for 30 days.
import assert from 'node:assert/strict';
import {
  LOCATION_BANNER_QUIET_MS,
  canRefreshSilently,
  initialLocationAction,
  locationBannerIsQuiet,
  locationHelpPlatform,
  promptStateIsReliable,
  wasOnlyDismissed,
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

test('granted: read on load, on every page, whatever else is stored', () => {
  assert.equal(initialLocationAction('granted', false), 'request');
  assert.equal(initialLocationAction('granted', true), 'request');
});

test('denied: remembered, never read, even with an earlier yes on record', () => {
  assert.equal(initialLocationAction('denied', false), 'denied');
  assert.equal(initialLocationAction('denied', true), 'denied');
});

test('an earlier yes the browser no longer reports: ask again where the page uses location', () => {
  // Safari on iOS reads `prompt` and prompts on every page load; Chrome's "Allow this time" is gone
  // with the page. The visitor said yes to exactly this, so the homepage and the park page ask the
  // browser directly. `request-where-needed`, not `request`: a blog post must not ask.
  assert.equal(initialLocationAction('prompt', true), 'request-where-needed');
  assert.equal(initialLocationAction(null, true), 'request-where-needed');
});

test("nobody answered yet: wait for a tap on the page's own button", () => {
  assert.equal(initialLocationAction('prompt', false), 'wait');
  assert.equal(initialLocationAction(null, false), 'wait');
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

test('a refusal while Chrome still reads `prompt` was a dismissed prompt: the button stays', () => {
  assert.equal(wasOnlyDismissed('prompt', true), true);
  assert.equal(wasOnlyDismissed('denied', true), false);
});

test('on WebKit a refusal is a block for the rest of the page, whatever the API reads', () => {
  // Safari reads `prompt` after "Don't Allow" too, and refuses every further request in the page.
  assert.equal(wasOnlyDismissed('prompt', false), false);
  assert.equal(wasOnlyDismissed(null, true), false);
});

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.101 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15';
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

test('help steps: Safari on iPhone and iPad (an iPad reports a Mac with touch points)', () => {
  assert.equal(locationHelpPlatform(IPHONE_SAFARI, SAFARI, 5), 'ios-safari');
  assert.equal(locationHelpPlatform(IPAD_AS_MAC, SAFARI, 5), 'ios-safari');
});

test('help steps: Safari on a Mac', () => {
  assert.equal(locationHelpPlatform(IPAD_AS_MAC, SAFARI, 0), 'mac-safari');
});

test('help steps: Chrome anywhere, including on iPhone, which has no "aA"', () => {
  assert.equal(locationHelpPlatform(IPHONE_CHROME, SAFARI, 5), 'default');
  assert.equal(locationHelpPlatform(MAC_CHROME, CHROME, 0), 'default');
  assert.equal(locationHelpPlatform(ANDROID_CHROME, CHROME, 5), 'default');
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
