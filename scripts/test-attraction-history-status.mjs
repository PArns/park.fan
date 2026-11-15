/**
 * A ride's history calendar (`lib/parks/attraction-history-status.ts`): which day reads as running,
 * walk-on, closed or not yet open (PAR-1359).
 *
 * Run: `pnpm test:attraction-history-status`
 */
import assert from 'node:assert/strict';
import {
  attractionHistoryStatus,
  historyHasARunningDay,
} from '@/lib/parks/attraction-history-status.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const curve = {
  date: '2026-10-21',
  utilization: 'very_low',
  hourlyP90: [
    { hour: '10:00', value: 5 },
    { hour: '11:00', value: 5 },
  ],
};
const walkOn = { date: '2026-11-13', utilization: 'unknown', hourlyP90: [], withoutWait: true };
const open = { date: '2026-11-13', scheduleType: 'OPERATING' };
const shut = { date: '2026-11-13', scheduleType: 'CLOSED' };

test('a measured curve is a running day', () => {
  assert.equal(attractionHistoryStatus(curve, open, 'past'), 'OPEN');
});

test("a free-flow day without a wait is walk-on, never 'closed all day'", () => {
  assert.equal(attractionHistoryStatus(walkOn, open, 'past'), 'NO_WAIT');
  assert.equal(attractionHistoryStatus(walkOn, open, 'today'), 'NO_WAIT');
});

test('without a reading the schedule decides', () => {
  assert.equal(attractionHistoryStatus(undefined, open, 'past'), 'CLOSED_RIDE');
  assert.equal(attractionHistoryStatus(undefined, open, 'today'), 'NOT_YET_OPEN');
  assert.equal(attractionHistoryStatus(undefined, shut, 'past'), 'PARK_CLOSED');
  assert.equal(attractionHistoryStatus(undefined, undefined, 'past'), 'UNKNOWN');
  assert.equal(attractionHistoryStatus(undefined, open, 'future'), 'UNKNOWN');
});

test('a single point is no curve', () => {
  const point = { ...curve, hourlyP90: [{ hour: '10:00', value: 5 }] };
  assert.equal(attractionHistoryStatus(point, open, 'past'), 'CLOSED_RIDE');
});

test('a window with only walk-on days still draws the grid', () => {
  assert.equal(historyHasARunningDay([{ attractionStatus: 'NO_WAIT' }]), true);
  assert.equal(
    historyHasARunningDay([{ attractionStatus: 'CLOSED_RIDE' }, { attractionStatus: 'UNKNOWN' }]),
    false
  );
});

console.log(`\n${passed} passed`);
