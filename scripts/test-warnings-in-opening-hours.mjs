/**
 * Unit tests for `warningsInOpeningHours` (lib/utils/warnings-in-opening-hours.ts).
 *
 * Run: pnpm test:warnings-in-opening-hours
 */
import assert from 'node:assert/strict';
import { warningsInOpeningHours } from '../lib/utils/warnings-in-opening-hours.ts';

const day = (date) => ({
  scheduleType: 'OPERATING',
  openingTime: `${date}T08:00:00.000Z`,
  closingTime: `${date}T17:00:00.000Z`,
});
const hours = { schedule: [day('2026-11-06')], nextSchedule: day('2026-11-07') };
const ids = (list) => list.map((w) => w.alertId);

// The night frost from the screenshot: closes at 17:00 UTC, the warning ends as the park opens.
const night = { alertId: 'night', onset: '2026-11-06T21:00:00Z', expires: '2026-11-07T08:00:00Z' };
// Runs into the next morning's hours.
const morning = {
  alertId: 'morning',
  onset: '2026-11-06T21:00:00Z',
  expires: '2026-11-07T10:00:00Z',
};
// Inside today's hours.
const midday = {
  alertId: 'midday',
  onset: '2026-11-06T12:00:00Z',
  expires: '2026-11-06T14:00:00Z',
};
// No end given: counts as lasting.
const openEnded = { alertId: 'open', onset: '2026-11-06T21:00:00Z', expires: null };

assert.deepEqual(ids(warningsInOpeningHours([night, morning, midday, openEnded], hours)), [
  'morning',
  'midday',
  'open',
]);

// Unknown hours keep everything.
assert.deepEqual(ids(warningsInOpeningHours([night], {})), ['night']);
assert.deepEqual(
  ids(
    warningsInOpeningHours([night], {
      schedule: [{ scheduleType: 'OPERATING', openingTime: null, closingTime: null }],
    })
  ),
  ['night']
);

// A closed day is not a window: a warning on a closed day is hidden when other hours are known.
const closed = { scheduleType: 'CLOSED', openingTime: null, closingTime: null };
assert.deepEqual(
  ids(warningsInOpeningHours([midday], { schedule: [closed, day('2026-11-08')] })),
  []
);

console.log('warnings-in-opening-hours: all green');
