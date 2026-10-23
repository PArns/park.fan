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
import {
  buildYearlyOutlook,
  outlookBadgeLevel,
  OUTLOOK_MONTHS,
} from '../lib/utils/yearly-outlook.ts';

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
  assert.equal(october.days[0].level, 'low');
  assert.equal(october.days[30].level, 'high');
  assert.equal(
    october.days.slice(1, 30).every((d) => d === null),
    true
  );
  assert.equal(october.ratedDays, 2);
});

test('ignores a day that does not belong to the month it names', () => {
  // Nothing observed sends a 31st of November; the guard is what keeps a malformed date from
  // writing past the end of the strip.
  const months = buildYearlyOutlook([day('2026-11-31', 'high')], '2026-11-01');
  assert.equal(months[0].ratedDays, 0);
  assert.equal(months[0].days.length, 30);
});

test('drops days outside the twelve-month frame', () => {
  const months = buildYearlyOutlook(
    [day('2026-09-30', 'low'), day('2027-09-01', 'high')],
    '2026-09-30'
  );
  assert.equal(months[0].ratedDays, 1);
  assert.equal(
    months.reduce((sum, m) => sum + m.ratedDays, 0),
    1,
    'September 2027 is the thirteenth month and has nowhere to go'
  );
});

test('a forecast that starts in spring leaves the months before it unknown', () => {
  // Sesame Place San Diego, 2026-09-22: the response ran 2027-03 … 2027-09.
  const months = buildYearlyOutlook([day('2027-03-14', 'low')], '2026-09-22');
  assert.equal(months[0].ratedDays, 0);
  assert.equal(months[0].dominant, null);
  assert.equal(months.find((m) => m.key === '2027-03').ratedDays, 1);
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
  assert.equal(months[0].ratedDays, 6);
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

test('closed and unknown days are covered but not rated', () => {
  const months = buildYearlyOutlook(
    [day('2026-10-01', 'closed'), day('2026-10-02', 'unknown')],
    '2026-10-01'
  );
  assert.equal(months[0].coveredDays, 2);
  assert.equal(months[0].ratedDays, 0, 'neither is one of the six coloured tiers');
  assert.equal(months[0].dominant, null);
  assert.equal(months[0].days[0].level, 'closed');
  assert.equal(months[0].days[1].level, 'unknown');
  assert.equal(months[0].closedDays, 1);
  assert.equal(outlookBadgeLevel(months[0]), 'unknown', 'one closed day among unrated ones');
});

test('a month the park is shut for says closed, not „no forecast"', () => {
  // Legoland Billund, 2026-09-24: January to March 2027 came back `closed` on every day.
  const january = Array.from({ length: 31 }, (_, i) =>
    day(`2027-01-${String(i + 1).padStart(2, '0')}`, 'closed', 'closed')
  );
  const months = buildYearlyOutlook(january, '2026-12-15');
  assert.equal(months[1].closedDays, 31);
  assert.equal(months[1].ratedDays, 0);
  assert.equal(outlookBadgeLevel(months[1]), 'closed');
  assert.equal(outlookBadgeLevel(months[0]), 'unknown', 'December carries no entry at all');
  assert.equal(outlookBadgeLevel(months[2]), 'unknown', 'past the horizon');
});

test('a month with rated days names its tier, closed days or not', () => {
  const months = buildYearlyOutlook(
    [day('2026-10-01', 'closed', 'closed'), day('2026-10-02', 'low')],
    '2026-10-01'
  );
  assert.equal(outlookBadgeLevel(months[0]), 'low');
});

test('an unrateable park recommends nothing, however the endpoint labels it', () => {
  // Aquatica Orlando, 2026-09-22: 181 days, every one of them `unknown` AND `recommended`.
  // Counted off the entries, the row would have read „no forecast" and „30/30 recommended" at
  // once — the badge and the number contradicting each other on the same line.
  const october = Array.from({ length: 31 }, (_, i) =>
    day(`2026-10-${String(i + 1).padStart(2, '0')}`, 'unknown', 'recommended')
  );
  const months = buildYearlyOutlook(october, '2026-10-01');
  assert.equal(months[0].coveredDays, 31);
  assert.equal(months[0].ratedDays, 0);
  assert.equal(months[0].recommendedDays, 0);
  assert.equal(months[0].dominant, null);
});

test('a duplicate date is one day, not two', () => {
  // Not observed in production today. The counters are read off the filled calendar rather than
  // off the response precisely so that a repeat cannot produce „32/31 recommended".
  const months = buildYearlyOutlook(
    [
      day('2026-10-01', 'low', 'recommended'),
      day('2026-10-01', 'low', 'recommended'),
      day('2026-10-02', 'high', 'neutral'),
    ],
    '2026-10-01'
  );
  assert.equal(months[0].coveredDays, 2);
  assert.equal(months[0].ratedDays, 2);
  assert.equal(months[0].recommendedDays, 1);
});

console.log('buildYearlyOutlook — what a day says about itself');

test('a day keeps its wait and turns the recommendation into advice', () => {
  const months = buildYearlyOutlook(
    [
      { ...day('2026-10-01', 'low', 'highly_recommended'), avgWaitTime: 23 },
      day('2026-10-02', 'moderate', 'neutral'),
      day('2026-10-03', 'very_high', 'strongly_avoid'),
      day('2026-10-04', 'closed', 'closed'),
    ],
    '2026-10-01'
  );
  const [go, neutral, avoid, closed] = months[0].days;
  assert.deepEqual(go, { level: 'low', avgWait: 23, advice: 'go' });
  assert.deepEqual(neutral, { level: 'moderate' }, 'nothing unset is written');
  assert.equal(avoid.advice, 'avoid');
  assert.deepEqual(closed, { level: 'closed' });
});

test('an unrated day gets no advice, however the endpoint labels it', () => {
  const months = buildYearlyOutlook([day('2026-10-01', 'unknown', 'recommended')], '2026-10-01');
  assert.deepEqual(months[0].days[0], { level: 'unknown' });
});

console.log('buildYearlyOutlook — holidays');

const holiday = (date, flags) => ({
  date,
  isHoliday: false,
  isSchoolVacation: false,
  isBridgeDay: false,
  ...flags,
});

test('places holidays on days the forecast does not cover too', () => {
  // Phantasialand, 2026-10-23: no forecast entry for Christmas Day, but it is a holiday all the
  // same, and next summer's break is known long before the forecast reaches it.
  const months = buildYearlyOutlook(
    [day('2026-12-26', 'low')],
    '2026-10-23',
    [
      holiday('2026-12-25', { isHoliday: true, holidayName: 'Christmas Day' }),
      holiday('2027-07-12', { isSchoolVacation: true, schoolVacationName: 'Summer Holidays' }),
    ]
  );
  const december = months.find((m) => m.key === '2026-12');
  assert.equal(december.days[24], null, 'no forecast for the 25th');
  assert.deepEqual(december.holidays[24], { isHoliday: true, holidayName: 'Christmas Day' });
  assert.equal(december.holidays[25], null);
  assert.deepEqual(months.find((m) => m.key === '2027-07').holidays[11], {
    isSchoolVacation: true,
    schoolVacationName: 'Summer Holidays',
  });
});

test('a name never comes without its flag, and an entry that flags nothing is no holiday', () => {
  const months = buildYearlyOutlook([], '2026-11-01', [
    holiday('2026-11-01', {
      isHoliday: true,
      holidayName: "All Saints' Day",
      schoolVacationName: 'Autumn Holidays',
    }),
    holiday('2026-11-02', { isBridgeDay: true }),
    holiday('2026-11-03', {}),
  ]);
  assert.deepEqual(months[0].holidays[0], { isHoliday: true, holidayName: "All Saints' Day" });
  assert.deepEqual(months[0].holidays[1], { isBridgeDay: true });
  assert.equal(months[0].holidays[2], null);
});

test('a response without holidays draws no marks', () => {
  // Every response cached before PAR-1015, and the one the API sends when its holiday table is
  // unreadable.
  const months = buildYearlyOutlook([day('2026-10-01', 'low')], '2026-10-01');
  assert.equal(
    months.every((m) => m.holidays.length === m.daysInMonth && m.holidays.every((h) => h === null)),
    true
  );
});

console.log('buildYearlyOutlook — the strip');

test('counts the days of the first month that are already over', () => {
  const months = buildYearlyOutlook([], '2026-10-23');
  assert.equal(months[0].pastDays, 22);
  assert.equal(months[1].pastDays, 0);
  assert.equal(buildYearlyOutlook([], '2026-10-01')[0].pastDays, 0);
});

test('knows the weekday each month starts on', () => {
  const months = buildYearlyOutlook([], '2026-10-23');
  assert.equal(months[0].firstWeekday, 4, '2026-10-01 is a Thursday');
  assert.equal(months[1].firstWeekday, 0, '2026-11-01 is a Sunday');
});

console.log('buildYearlyOutlook — the empty frame the placeholder renders');

test('an empty response still produces twelve drawable months', () => {
  const months = buildYearlyOutlook([], '2026-09-22');
  assert.equal(months.length, 12);
  assert.equal(
    months.every((m) => m.days.length === m.daysInMonth && m.ratedDays === 0),
    true
  );
  assert.equal(
    months.every((m) => m.dominant === null),
    true
  );
});

test('refuses a nonsense date rather than drawing NaN months', () => {
  assert.deepEqual(buildYearlyOutlook([day('2026-10-01', 'low')], 'not-a-date'), []);
  assert.deepEqual(buildYearlyOutlook([], '2026-09-22', [], 0), []);
});

console.log(`\n${passed} tests passed`);
