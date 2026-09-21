/**
 * Unit tests for `isWorksPeriodActive` (`lib/utils/works-period.ts`) — the
 * predicate that decides whether the „Umbaupause" badge, the ride page's note
 * and the pre-mount overview's label say anything at all.
 *
 * It is the TypeScript twin of the backend's `isCuratedOutOfService()`, and the
 * cases below are the ones that make a twin worth having: inclusive bounds,
 * half-open windows, and a day that sits one step outside either end.
 *
 * Run: `pnpm test:works-period`
 */
import assert from 'node:assert/strict';
import { isWorksPeriodActive } from '../lib/utils/works-period.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const closed = (from, to) => ({ from, to, toUncertain: false });

test('a day inside a closed window is inside it', () => {
  assert.equal(isWorksPeriodActive(closed('2026-01-16', '2026-03-03'), '2026-02-01'), true);
});

test('both bounds are inclusive — the first and the last day still count', () => {
  const period = closed('2026-01-16', '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2026-01-16'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-03'), true);
});

test('the day before and the day after are outside', () => {
  const period = closed('2026-01-16', '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2026-01-15'), false);
  assert.equal(isWorksPeriodActive(period, '2026-03-04'), false);
});

test('a one-day window covers its one day and nothing else', () => {
  const period = closed('2026-03-03', '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2026-03-03'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-02'), false);
  assert.equal(isWorksPeriodActive(period, '2026-03-04'), false);
});

test('a window with no end runs on — the usual state while work is happening', () => {
  const period = closed('2026-01-16', null);
  assert.equal(isWorksPeriodActive(period, '2026-01-16'), true);
  assert.equal(isWorksPeriodActive(period, '2027-11-30'), true);
  assert.equal(isWorksPeriodActive(period, '2026-01-15'), false);
});

test('a window with no start was already running when somebody wrote it down', () => {
  const period = closed(null, '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2020-01-01'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-03'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-04'), false);
});

test('a window that ends before it begins covers nothing, rather than everything', () => {
  // The backend refuses to curate this pair, but it serves what is in the
  // columns — a row written before that guard existed still reaches a reader.
  const period = closed('2026-03-01', '2026-01-20');
  assert.equal(isWorksPeriodActive(period, '2026-02-01'), false);
  assert.equal(isWorksPeriodActive(period, '2026-03-01'), false);
  assert.equal(isWorksPeriodActive(period, '2026-01-20'), false);
});

test('a window with neither bound claims nothing', () => {
  assert.equal(isWorksPeriodActive(closed(null, null), '2026-02-01'), false);
});

test('no window at all is not a works period', () => {
  assert.equal(isWorksPeriodActive(null, '2026-02-01'), false);
  assert.equal(isWorksPeriodActive(undefined, '2026-02-01'), false);
});

test('without the park day nothing is claimed, whatever the window says', () => {
  // The cross-park listings — favorites, the blog, the homepage — pass no
  // `todayIso`, and guessing one off the reader's clock is the hydration bug
  // this prop exists to avoid.
  assert.equal(isWorksPeriodActive(closed('2026-01-16', '2026-03-03'), undefined), false);
});

test('year boundaries compare as calendar days, not as strings that happen to sort', () => {
  const period = closed('2026-12-20', '2027-01-10');
  assert.equal(isWorksPeriodActive(period, '2026-12-31'), true);
  assert.equal(isWorksPeriodActive(period, '2027-01-01'), true);
  assert.equal(isWorksPeriodActive(period, '2027-01-11'), false);
  assert.equal(isWorksPeriodActive(period, '2026-12-19'), false);
});

console.log(`\n${passed} assertions passed.`);
