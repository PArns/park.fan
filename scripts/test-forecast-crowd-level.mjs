/**
 * Unit tests for `forecastCrowdLevel` and `isClosedCalendarDay` (`lib/utils/calendar-utils.ts`),
 * the level every forecast surface rates a `/best-days` day on: the header's „Prognose heute", the
 * weekday panel, the trip assistant and the MCP forecast tool.
 *
 * The closed days are the shape Movie Park Germany answered on 2026-11-14, in its winter break:
 * `status: 'CLOSED'`, `crowdLevel: 'closed'`, and a `predictedCrowdLevel` all the same.
 *
 * Run: pnpm test:forecast-crowd-level
 */
import assert from 'node:assert/strict';
import { forecastCrowdLevel, isClosedCalendarDay } from '../lib/utils/calendar-utils.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('forecastCrowdLevel');

test('a closed day is closed, whatever the model predicted for it', () => {
  assert.equal(
    forecastCrowdLevel({
      status: 'CLOSED',
      crowdLevel: 'closed',
      predictedCrowdLevel: 'very_high',
    }),
    'closed'
  );
  assert.equal(
    forecastCrowdLevel({ status: 'CLOSED', crowdLevel: 'closed', predictedCrowdLevel: 'very_low' }),
    'closed',
    'a quiet prediction on a shut day would make it the trip assistant’s best day'
  );
});

test('either field alone makes the day closed', () => {
  assert.equal(
    forecastCrowdLevel({ status: 'CLOSED', crowdLevel: 'low', predictedCrowdLevel: 'low' }),
    'closed'
  );
  assert.equal(
    forecastCrowdLevel({ status: 'UNKNOWN', crowdLevel: 'closed', predictedCrowdLevel: 'high' }),
    'closed'
  );
});

test('an open day is rated on the prediction', () => {
  assert.equal(
    forecastCrowdLevel({ status: 'OPERATING', crowdLevel: 'low', predictedCrowdLevel: 'high' }),
    'high'
  );
});

test('an open day without a prediction falls back to its crowd level', () => {
  assert.equal(forecastCrowdLevel({ status: 'OPERATING', crowdLevel: 'moderate' }), 'moderate');
  assert.equal(forecastCrowdLevel({ status: 'UNKNOWN', crowdLevel: 'unknown' }), 'unknown');
});

console.log('isClosedCalendarDay');

test('reads both the status and the crowd level', () => {
  assert.equal(isClosedCalendarDay({ status: 'CLOSED', crowdLevel: 'closed' }), true);
  assert.equal(isClosedCalendarDay({ status: 'CLOSED', crowdLevel: 'low' }), true);
  assert.equal(isClosedCalendarDay({ status: 'OPERATING', crowdLevel: 'closed' }), true);
  assert.equal(isClosedCalendarDay({ status: 'OPERATING', crowdLevel: 'low' }), false);
});

console.log(`\n${passed} passed`);
