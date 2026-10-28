/**
 * Unit tests for the window and step of the traffic dashboards (`lib/admin/traffic-range.ts`): the
 * presets against a fixed "today", a custom range's limits, which intervals suit a window, what an
 * address may name, and how a period reads on an axis and in a table.
 *
 * Run: pnpm test:admin-traffic-range
 */
import assert from 'node:assert/strict';
import {
  RANGE_PRESETS,
  addDays,
  customRangeError,
  daysBetween,
  defaultInterval,
  effectiveInterval,
  formatPeriodAxis,
  formatPeriodLong,
  formatRangeSpan,
  intervalsFor,
  isUtcDay,
  isoWeek,
  parseTrafficRange,
  presetOf,
  rangeLabel,
  rangeParams,
  rangeWindow,
  weekStart,
} from '../lib/admin/traffic-range.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// A Wednesday.
const TODAY = '2026-10-28';
const window = (id) => {
  const preset = RANGE_PRESETS.find((entry) => entry.id === id);
  const { from, to, days } = rangeWindow(preset.resolve(TODAY), TODAY);
  return `${from} ${to} ${days}`;
};

test('days are added and counted across month and year ends', () => {
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2028-03-01', -1), '2028-02-29');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(daysBetween('2026-10-28', '2026-10-28'), 1);
  assert.equal(daysBetween('2026-09-29', '2026-10-28'), 30);
  assert.equal(isUtcDay('2026-02-30'), false);
  assert.equal(isUtcDay('2026-2-3'), false);
  assert.equal(isUtcDay('2028-02-29'), true);
});

test('a week starts on its Monday', () => {
  assert.equal(weekStart('2026-10-28'), '2026-10-26');
  assert.equal(weekStart('2026-10-26'), '2026-10-26');
  assert.equal(weekStart('2026-11-01'), '2026-10-26');
  assert.equal(weekStart('2027-01-01'), '2026-12-28');
});

test('every preset resolves to the window it names', () => {
  assert.equal(window('today'), '2026-10-28 2026-10-28 1');
  assert.equal(window('yesterday'), '2026-10-27 2026-10-27 1');
  assert.equal(window('7d'), '2026-10-22 2026-10-28 7');
  assert.equal(window('28d'), '2026-10-01 2026-10-28 28');
  assert.equal(window('90d'), '2026-07-31 2026-10-28 90');
  assert.equal(window('this_week'), '2026-10-26 2026-10-28 3');
  assert.equal(window('last_week'), '2026-10-19 2026-10-25 7');
  assert.equal(window('this_month'), '2026-10-01 2026-10-28 28');
  assert.equal(window('last_month'), '2026-09-01 2026-09-30 30');
  assert.equal(window('12m'), '2025-10-29 2026-10-28 365');
  assert.deepEqual(
    RANGE_PRESETS.map((preset) => preset.label),
    [
      'Heute',
      'Gestern',
      '7 Tage',
      '28 Tage',
      '90 Tage',
      'Diese Woche',
      'Letzte Woche',
      'Dieser Monat',
      'Letzter Monat',
      '12 Monate',
    ]
  );
});

test('the calendar presets hold on the first of a month and on a Monday', () => {
  const on = (today, id) => {
    const preset = RANGE_PRESETS.find((entry) => entry.id === id);
    const { from, to } = rangeWindow(preset.resolve(today), today);
    return `${from} ${to}`;
  };
  assert.equal(on('2026-11-01', 'this_month'), '2026-11-01 2026-11-01');
  assert.equal(on('2026-11-01', 'last_month'), '2026-10-01 2026-10-31');
  assert.equal(on('2027-01-05', 'last_month'), '2026-12-01 2026-12-31');
  assert.equal(on('2026-03-02', 'last_month'), '2026-02-01 2026-02-28');
  assert.equal(on('2026-10-26', 'this_week'), '2026-10-26 2026-10-26');
  assert.equal(on('2026-10-26', 'last_week'), '2026-10-19 2026-10-25');
});

test('a range that equals a preset lights it up, a custom one does not', () => {
  assert.equal(presetOf({ kind: 'days', days: 28 }, TODAY).id, '28d');
  assert.equal(
    presetOf({ kind: 'dates', from: '2026-10-27', to: '2026-10-27' }, TODAY).id,
    'yesterday'
  );
  assert.equal(presetOf({ kind: 'dates', from: '2026-10-22', to: '2026-10-28' }, TODAY).id, '7d');
  assert.equal(presetOf({ kind: 'dates', from: '2026-10-02', to: '2026-10-15' }, TODAY), null);
  assert.equal(rangeLabel({ kind: 'days', days: 90 }, TODAY), '90 Tage');
  assert.equal(
    rangeLabel({ kind: 'dates', from: '2026-10-02', to: '2026-10-15' }, TODAY),
    '02.10.2026 bis 15.10.2026'
  );
  assert.equal(formatRangeSpan({ from: TODAY, to: TODAY }), '28.10.2026');
});

test('an address names a range, and junk falls back to 28 days', () => {
  const parse = (params) => parseTrafficRange(params, TODAY);
  assert.deepEqual(parse({}), { kind: 'days', days: 28 });
  assert.deepEqual(parse({ days: '7' }), { kind: 'days', days: 7 });
  assert.deepEqual(parse({ days: '365' }), { kind: 'days', days: 365 });
  assert.deepEqual(parse({ days: '45' }), { kind: 'days', days: 28 });
  assert.deepEqual(parse({ days: '30' }), { kind: 'days', days: 30 });
  assert.deepEqual(parse({ from: '2026-10-01', to: '2026-10-27' }), {
    kind: 'dates',
    from: '2026-10-01',
    to: '2026-10-27',
  });
  assert.deepEqual(parse({ days: '7', from: '2026-10-01', to: '2026-10-27' }).kind, 'dates');
  assert.deepEqual(parse({ from: '2026-10-27', to: '2026-10-01' }), { kind: 'days', days: 28 });
  assert.deepEqual(parse({ from: '2026-10-01', to: '2026-12-01' }), { kind: 'days', days: 28 });
  assert.deepEqual(parse({ from: '2026-10-01' }), { kind: 'days', days: 28 });
  assert.deepEqual(rangeParams({ kind: 'days', days: 7 }), { days: '7' });
  assert.deepEqual(rangeParams({ kind: 'dates', from: '2026-10-01', to: '2026-10-27' }), {
    from: '2026-10-01',
    to: '2026-10-27',
  });
});

test('a custom range is refused for the reasons the API refuses it', () => {
  assert.equal(customRangeError('2026-10-01', '2026-10-28', TODAY), null);
  assert.equal(customRangeError('2026-10-28', '2026-10-28', TODAY), null);
  assert.match(customRangeError('', '2026-10-28', TODAY), /beide Tage/);
  assert.match(customRangeError('2026-10-28', '2026-10-01', TODAY), /nach dem letzten/);
  assert.match(customRangeError('2026-10-01', '2026-10-29', TODAY), /Zukunft/);
  assert.equal(customRangeError('2025-10-28', '2026-10-28', TODAY), null, '366 days fit');
  assert.match(customRangeError('2025-10-27', '2026-10-28', TODAY), /366/);
});

test('the default step follows the API, and only suitable steps are offered', () => {
  assert.equal(defaultInterval(1), 'hour');
  assert.equal(defaultInterval(2), 'day');
  assert.equal(defaultInterval(92), 'day');
  assert.equal(defaultInterval(93), 'week');
  assert.equal(defaultInterval(183), 'week');
  assert.equal(defaultInterval(184), 'month');
  assert.deepEqual(intervalsFor(1), ['hour', 'day']);
  assert.deepEqual(intervalsFor(2), ['hour', 'day']);
  assert.deepEqual(intervalsFor(7), ['day']);
  assert.deepEqual(intervalsFor(30), ['day', 'week']);
  assert.deepEqual(intervalsFor(90), ['day', 'week', 'month']);
  assert.deepEqual(intervalsFor(365), ['day', 'week', 'month']);
  for (const days of [1, 2, 3, 7, 14, 30, 60, 92, 93, 183, 184, 366]) {
    assert.ok(intervalsFor(days).includes(defaultInterval(days)), `the default fits ${days} days`);
  }
});

test('an asked-for step holds only where it suits the window', () => {
  assert.equal(effectiveInterval('month', 365), 'month');
  assert.equal(effectiveInterval('month', 7), 'day');
  assert.equal(effectiveInterval('hour', 30), 'day');
  assert.equal(effectiveInterval('hour', 1), 'hour');
  assert.equal(effectiveInterval('fortnight', 90), 'day');
  assert.equal(effectiveInterval(null, 365), 'month');
});

test('ISO weeks follow the year of their Thursday', () => {
  assert.deepEqual(isoWeek('2026-10-28'), { year: 2026, week: 44 });
  assert.deepEqual(isoWeek('2026-01-01'), { year: 2026, week: 1 });
  assert.deepEqual(isoWeek('2027-01-01'), { year: 2026, week: 53 });
  assert.deepEqual(isoWeek('2024-12-30'), { year: 2025, week: 1 });
  assert.deepEqual(isoWeek('2026-12-28'), { year: 2026, week: 53 });
});

test('a period reads on an axis and in a table in its own step', () => {
  assert.equal(formatPeriodAxis('2026-10-28T07:00:00Z', 'hour'), '07:00');
  assert.equal(formatPeriodAxis('2026-10-28', 'day'), '28.10.');
  assert.equal(formatPeriodAxis('2026-10-26', 'week'), '26.10.');
  assert.match(formatPeriodAxis('2026-10-01', 'month'), /^Okt\.? 26$/);
  assert.equal(formatPeriodLong('2026-10-28T07:00:00Z', 'hour'), '28.10. 07:00 UTC');
  assert.match(formatPeriodLong('2026-10-28', 'day'), /28\.10\.2026/);
  assert.equal(formatPeriodLong('2026-10-26', 'week'), 'KW 44, ab 26.10.2026');
  assert.equal(formatPeriodLong('2026-10-01', 'month'), 'Oktober 2026');
});

console.log(`\n${passed} cases passed.`);
