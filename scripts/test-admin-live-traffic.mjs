/**
 * Unit tests for the pure half of `/admin/traffic/live` (`lib/admin/live-traffic.ts`) and of the
 * admin's world maps (`lib/admin/world-map.ts`): the chart's minutes, which countries ripple, how a
 * list lays out rows that dropped out, where a row leads, and where on the map a country sits.
 *
 * Run: pnpm test:admin-live-traffic
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatLiveClock,
  formatLiveMinute,
  isQuiet,
  LIVE_MINUTES,
  liveDrillHref,
  liveEventHref,
  minuteSeries,
  minuteTotal,
  pickRipples,
  placeLiveRows,
  RIPPLE_SPACING,
  risenKeys,
} from '../lib/admin/live-traffic.ts';
import { countryShadePercent, largestRing } from '../lib/admin/world-map.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const minute = (iso, pageviews = 0, events = 0, visitors = 0) => ({
  minute: iso,
  pageviews,
  events,
  visitors,
});

test('minuteSeries returns 31 minutes ending at the minute of `at`, gaps as zero', () => {
  const series = minuteSeries({
    at: '2026-10-28T12:34:56Z',
    perMinute: [minute('2026-10-28T12:34:00Z', 5, 2, 3), minute('2026-10-28T12:30:00Z', 9, 1, 4)],
  });
  assert.equal(series.length, LIVE_MINUTES);
  assert.equal(new Date(series.at(-1).at).toISOString(), '2026-10-28T12:34:00.000Z');
  assert.equal(new Date(series[0].at).toISOString(), '2026-10-28T12:04:00.000Z');
  assert.deepEqual(
    { pageviews: series.at(-1).pageviews, events: series.at(-1).events },
    { pageviews: 5, events: 2 }
  );
  assert.equal(series.at(-5).pageviews, 9);
  assert.equal(series.at(-2).pageviews, 0);
});

test('minuteSeries drops minutes outside the window and follows a newer minute than `at`', () => {
  const series = minuteSeries({
    at: '2026-10-28T12:34:59Z',
    perMinute: [minute('2026-10-28T11:00:00Z', 50), minute('2026-10-28T12:35:00Z', 1)],
  });
  assert.equal(new Date(series.at(-1).at).toISOString(), '2026-10-28T12:35:00.000Z');
  assert.equal(minuteTotal(series, 'pageviews'), 1);
});

test('minuteSeries of an answer without a readable time is empty', () => {
  assert.deepEqual(minuteSeries({ at: 'nonsense', perMinute: [] }), []);
});

test('minuteTotal sums one figure', () => {
  const series = minuteSeries({
    at: '2026-10-28T12:34:00Z',
    perMinute: [minute('2026-10-28T12:34:00Z', 2, 7), minute('2026-10-28T12:33:00Z', 3, 1)],
  });
  assert.equal(minuteTotal(series, 'pageviews'), 5);
  assert.equal(minuteTotal(series, 'events'), 8);
});

test('isQuiet only when no visitor and no minute counted anything', () => {
  const empty = {
    at: '2026-10-28T12:34:00Z',
    activeVisitors: 0,
    perMinute: [minute('2026-10-28T12:34:00Z')],
  };
  assert.equal(isQuiet(empty), true);
  assert.equal(isQuiet({ ...empty, activeVisitors: 1 }), false);
  assert.equal(isQuiet({ ...empty, perMinute: [minute('2026-10-28T12:20:00Z', 0, 1)] }), false);
});

test('risenKeys: nothing on the first answer', () => {
  assert.deepEqual(risenKeys(null, new Map([['DE', 4]])), []);
});

test('risenKeys: rises and new keys, biggest first, falls and equal counts left out', () => {
  const previous = new Map([
    ['DE', 10],
    ['AT', 3],
    ['NL', 5],
  ]);
  const next = new Map([
    ['DE', 12],
    ['AT', 3],
    ['NL', 2],
    ['US', 4],
    ['CH', 2],
  ]);
  assert.deepEqual(risenKeys(previous, next), ['US', 'CH', 'DE']);
});

test('risenKeys: ties are ordered by key, so the same answer ripples the same countries', () => {
  const next = new Map([
    ['FR', 1],
    ['BE', 1],
  ]);
  assert.deepEqual(risenKeys(new Map(), next), ['BE', 'FR']);
});

test('pickRipples: one ring per crowded region, unplaced countries skipped, at most max', () => {
  const anchors = {
    DE: { x: 1040, y: 160 },
    AT: { x: 1060, y: 175 },
    NL: { x: 1010, y: 150 },
    US: { x: 470, y: 250 },
    BR: { x: 700, y: 520 },
    JP: { x: 1720, y: 230 },
  };
  assert.deepEqual(pickRipples(['DE', 'AT', 'ZZ', 'US', 'NL', 'BR', 'JP'], anchors), [
    'DE',
    'US',
    'BR',
    'JP',
  ]);
  assert.deepEqual(pickRipples(['AT', 'DE'], anchors, 5, 0), ['AT', 'DE']);
  assert.deepEqual(pickRipples(['US', 'BR', 'JP'], anchors, 2), ['US', 'BR']);
  assert.ok(RIPPLE_SPACING > Math.hypot(1060 - 1040, 175 - 160));
});

const key = (row) => row.key;
const rows = (...keys) => keys.map((k) => ({ key: k }));
const shape = (placed) => placed.map((row) => `${row.key}${row.leaving ? '-' : ''}`).join(' ');

test('placeLiveRows: the first answer is the list as given', () => {
  assert.equal(shape(placeLiveRows([], rows('a', 'b', 'c'), key)), 'a b c');
});

test('placeLiveRows: a row that dropped out comes first, leaving', () => {
  const first = placeLiveRows([], rows('a', 'b', 'c', 'd'), key);
  const second = placeLiveRows(first, rows('a', 'c', 'd', 'e'), key);
  assert.equal(shape(second), 'b- a c d e');
});

test('placeLiveRows: a leaving row goes on the next answer', () => {
  const first = placeLiveRows([], rows('a', 'b', 'c'), key);
  const second = placeLiveRows(first, rows('a', 'c'), key);
  const third = placeLiveRows(second, rows('c', 'a'), key);
  assert.equal(shape(third), 'c a');
});

test('placeLiveRows: a leaving row that comes back is a row again, in the new order', () => {
  const first = placeLiveRows([], rows('a', 'b'), key);
  const second = placeLiveRows(first, rows('a'), key);
  const third = placeLiveRows(second, rows('b', 'a'), key);
  assert.equal(shape(third), 'b a');
});

test('placeLiveRows: several leaving rows keep their old order, an emptied list only leaves', () => {
  const first = placeLiveRows([], rows('a', 'b', 'c', 'd'), key);
  assert.equal(shape(placeLiveRows(first, rows('d'), key)), 'a- b- c- d');
  assert.equal(shape(placeLiveRows(first, [], key)), 'a- b- c- d-');
});

test('placeLiveRows: the leaving row keeps the item it was drawn with', () => {
  const first = placeLiveRows([], [{ key: 'a', value: 7 }], key);
  const second = placeLiveRows(first, [], key);
  assert.deepEqual(second, [{ key: 'a', item: { key: 'a', value: 7 }, leaving: true }]);
});

test('liveDrillHref opens today filtered to the value, with the language', () => {
  assert.equal(
    liveDrillHref('path', '/de/parks/europe/germany/bruehl/phantasialand', 'de'),
    '/admin/traffic?days=1&locale=de&filter=path%3A%2Fde%2Fparks%2Feurope%2Fgermany%2Fbruehl%2Fphantasialand'
  );
  assert.equal(liveDrillHref('country', 'de', null), '/admin/traffic?days=1&filter=country%3Ade');
  assert.equal(liveDrillHref(null, '', null), '/admin/traffic?days=1');
});

test('liveEventHref opens the event for today', () => {
  assert.equal(liveEventHref('search_opened', null), '/admin/traffic/events/search_opened?days=1');
  assert.equal(
    liveEventHref('search_opened', 'nl'),
    '/admin/traffic/events/search_opened?days=1&locale=nl'
  );
});

test('formatLiveClock and formatLiveMinute read the given zone', () => {
  assert.equal(formatLiveClock('2026-10-28T12:34:56Z', 'Europe/Berlin'), '13:34:56');
  assert.equal(formatLiveClock('not a time'), 'not a time');
  assert.equal(formatLiveMinute(Date.parse('2026-10-28T12:05:00Z'), 'UTC'), '12:05');
});

test('countryShadePercent: none, the biggest, a square root between or a straight line', () => {
  assert.equal(countryShadePercent(0, 10), 0);
  assert.equal(countryShadePercent(10, 10), 90);
  assert.equal(countryShadePercent(1, 4), 54);
  assert.equal(countryShadePercent(1, 4, 1), 36);
  assert.equal(countryShadePercent(5, 0), 0);
});

test('largestRing: the centroid of a square, absolute and relative', () => {
  assert.deepEqual(largestRing('M0 0L10 0L10 10L0 10Z'), { area: 100, x: 5, y: 5 });
  assert.deepEqual(largestRing('M0 0l10 0 0 10-10 0z'), { area: 100, x: 5, y: 5 });
  assert.deepEqual(largestRing('M0 0h4v4h-4z'), { area: 16, x: 2, y: 2 });
});

test('largestRing: the biggest of several outlines wins', () => {
  const ring = largestRing('M100 100l1 0 0 1-1 0z M0 0L20 0 20 20 0 20Z');
  assert.equal(ring.area, 400);
  assert.deepEqual([ring.x, ring.y], [10, 10]);
});

test('largestRing: a relative moveto after a close starts from the closed outline', () => {
  const ring = largestRing('M10 10l2 0 0 2-2 0z m20 0l10 0 0 10-10 0z');
  assert.equal(ring.area, 100);
  assert.deepEqual([ring.x, ring.y], [35, 15]);
});

test('largestRing: a path without an area falls back to its box, none to null', () => {
  assert.deepEqual(largestRing('M0 0L10 0'), { area: 0, x: 5, y: 0 });
  assert.equal(largestRing(''), null);
});

test('largestRing on world.svg puts the United States on the mainland', () => {
  const svg = readFileSync(new URL('../public/world.svg', import.meta.url), 'utf8');
  const parts = [...svg.matchAll(/<path\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => tag.includes('class="United States"'))
    .map((tag) => tag.match(/\sd="([^"]+)"/)[1]);
  assert.ok(parts.length > 1, 'the United States are drawn in several parts');
  const best = parts
    .map((d) => largestRing(d))
    .reduce((a, b) => (b && (!a || b.area > a.area) ? b : a), null);
  // The mainland outline spans x 336 to 646 and y 186 to 341 of the 2000 x 857 map.
  assert.ok(best.x > 300 && best.x < 600, `x ${best.x}`);
  assert.ok(best.y > 170 && best.y < 320, `y ${best.y}`);
});

console.log(`\n${passed} passed`);
