/**
 * Unit tests for the twelve-month outlook frame (`lib/utils/yearly-outlook.ts`).
 *
 * Run: `pnpm test:yearly-outlook`
 *
 * Every case here is something the production endpoint actually does, measured against
 * api.park.fan on 2026-09-22 over fifteen parks: the list is sparse (Europa-Park answered with
 * 124 entries across the same 182-day span Efteling filled with 182), it starts in the middle of
 * the current month, it stops about six months out, and for Sesame Place San Diego it does not
 * start until March. A frame built by walking the response in order would draw a different number
 * of cells per park and close the gaps by sliding later days leftwards.
 */
import assert from 'node:assert/strict';
import { buildYearlyOutlook, OUTLOOK_MONTHS } from '../lib/utils/yearly-outlook.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const day = (date, crowdLevel, recommendation) => ({
  date,
  crowdLevel,
  confidencePercentage: 60,
  recommendation,
  source: 'ml',
});

console.log('buildYearlyOutlook — the frame');

test('draws twelve months starting with the park’s current month', () => {
  const months = buildYearlyOutlook([], '2026-09-22');
  assert.equal(months.length, OUTLOOK_MONTHS);
  assert.equal(months[0].key, '2026-09');
  assert.equal(months[11].key, '2027-08');
});

test('rolls the year over without ever adding to a Date', () => {
  // A park in a zone whose midnight jumps (America/Santiago) is exactly where `setMonth` on a
  // local Date loses or repeats a month. These are plain integers, so December → January is
  // arithmetic and nothing else.
  const months = buildYearlyOutlook([], '2026-12-01');
  assert.deepEqual(
    months.map((m) => m.key),
    [
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
      '2027-04',
      '2027-05',
      '2027-06',
      '2027-07',
      '2027-08',
      '2027-09',
      '2027-10',
      '2027-11',
    ]
  );
});

test('gives every month its real length, February included', () => {
  const months = buildYearlyOutlook([], '2027-12-01');
  const february = months.find((m) => m.key === '2028-02');
  assert.equal(february.daysInMonth, 29, '2028 is a leap year');
  assert.equal(february.days.length, 29);
  assert.equal(months.find((m) => m.key === '2027-12').daysInMonth, 31);
  assert.equal(months.find((m) => m.key === '2028-04').daysInMonth, 30);
});

console.log('buildYearlyOutlook — a sparse response');

test('leaves a skipped day empty instead of closing the gap', () => {
  const months = buildYearlyOutlook(
    [day('2026-10-01', 'low'), day('2026-10-31', 'high')],
    '2026-10-01'
  );
  const october = months[0];
  assert.equal(october.days[0], 'low');
  assert.equal(october.days[30], 'high');
  assert.equal(
    october.days.slice(1, 30).every((d) => d === null),
    true
  );
  assert.equal(october.forecastDays, 2);
});

test('ignores a day that does not belong to the month it names', () => {
  // Nothing observed sends a 31st of November; the guard is what keeps a malformed date from
  // writing past the end of the strip.
  const months = buildYearlyOutlook([day('2026-11-31', 'high')], '2026-11-01');
  assert.equal(months[0].forecastDays, 0);
  assert.equal(months[0].days.length, 30);
});

test('drops days outside the twelve-month frame', () => {
  const months = buildYearlyOutlook(
    [day('2026-09-30', 'low'), day('2027-09-01', 'high')],
    '2026-09-30'
  );
  assert.equal(months[0].forecastDays, 1);
  assert.equal(
    months.reduce((sum, m) => sum + m.forecastDays, 0),
    1,
    'September 2027 is the thirteenth month and has nowhere to go'
  );
});

test('a forecast that starts in spring leaves the months before it unknown', () => {
  // Sesame Place San Diego, 2026-09-22: the response ran 2027-03 … 2027-09.
  const months = buildYearlyOutlook([day('2027-03-14', 'low')], '2026-09-22');
  assert.equal(months[0].forecastDays, 0);
  assert.equal(months[0].dominant, null);
  assert.equal(months.find((m) => m.key === '2027-03').forecastDays, 1);
});

console.log('buildYearlyOutlook — what a month says about itself');

test('counts only the two recommending recommendations', () => {
  const months = buildYearlyOutlook(
    [
      day('2026-10-01', 'very_low', 'highly_recommended'),
      day('2026-10-02', 'low', 'recommended'),
      day('2026-10-03', 'moderate', 'neutral'),
      day('2026-10-04', 'high', 'avoid'),
      day('2026-10-05', 'very_high', 'strongly_avoid'),
      day('2026-10-06', 'extreme'),
    ],
    '2026-10-01'
  );
  assert.equal(months[0].recommendedDays, 2);
  assert.equal(months[0].forecastDays, 6);
});

test('the headline tier is the most frequent one', () => {
  const months = buildYearlyOutlook(
    [
      day('2026-10-01', 'low'),
      day('2026-10-02', 'low'),
      day('2026-10-03', 'low'),
      day('2026-10-04', 'high'),
    ],
    '2026-10-01'
  );
  assert.equal(months[0].dominant, 'low');
});

test('a tie goes to the busier tier', () => {
  // A month that is half quiet and half full is one to check day by day. Rounding it down to the
  // quiet half is the one direction of error a trip planner cannot recover from.
  const months = buildYearlyOutlook(
    [day('2026-10-01', 'low'), day('2026-10-02', 'very_high')],
    '2026-10-01'
  );
  assert.equal(months[0].dominant, 'very_high');
});

test('closed and unknown days count as covered but carry no tier', () => {
  const months = buildYearlyOutlook(
    [day('2026-10-01', 'closed'), day('2026-10-02', 'unknown')],
    '2026-10-01'
  );
  assert.equal(months[0].forecastDays, 2);
  assert.equal(months[0].dominant, null, 'neither is one of the six coloured tiers');
  assert.equal(months[0].days[0], 'closed');
  assert.equal(months[0].days[1], 'unknown');
});

console.log('buildYearlyOutlook — the empty frame the placeholder renders');

test('an empty response still produces twelve drawable months', () => {
  const months = buildYearlyOutlook([], '2026-09-22');
  assert.equal(months.length, 12);
  assert.equal(
    months.every((m) => m.days.length === m.daysInMonth && m.forecastDays === 0),
    true
  );
  assert.equal(
    months.every((m) => m.dominant === null),
    true
  );
});

test('refuses a nonsense date rather than drawing NaN months', () => {
  assert.deepEqual(buildYearlyOutlook([day('2026-10-01', 'low')], 'not-a-date'), []);
  assert.deepEqual(buildYearlyOutlook([], '2026-09-22', 0), []);
});

console.log(`\n${passed} tests passed`);
