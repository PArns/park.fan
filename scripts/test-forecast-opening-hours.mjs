// Regression tests for the opening hours on the weather forecast tiles. The Park payload carries
// several schedule rows per date: Europa-Park sends 17 `OPERATING` and 17 `EXTRA_HOURS` rows for
// the same 17 days, and the early-entry row must never replace the public opening.
import { forecastOpeningByDate } from '../lib/parks/forecast-opening-hours.ts';

const row = (date, scheduleType, openingTime = null, closingTime = null) => ({
  date,
  scheduleType,
  openingTime,
  closingTime,
});

const pick = (map, date) => map.get(date)?.scheduleType ?? null;

const testCases = [
  {
    name: 'EXTRA_HOURS after OPERATING leaves the public opening',
    actual: () =>
      pick(
        forecastOpeningByDate([row('2026-10-20', 'OPERATING'), row('2026-10-20', 'EXTRA_HOURS')]),
        '2026-10-20'
      ),
    expected: 'OPERATING',
  },
  {
    name: 'EXTRA_HOURS before OPERATING leaves the public opening',
    actual: () =>
      pick(
        forecastOpeningByDate([row('2026-10-20', 'EXTRA_HOURS'), row('2026-10-20', 'OPERATING')]),
        '2026-10-20'
      ),
    expected: 'OPERATING',
  },
  {
    name: 'a date with only EXTRA_HOURS has no entry',
    actual: () => forecastOpeningByDate([row('2026-10-20', 'EXTRA_HOURS')]).size,
    expected: 0,
  },
  {
    name: 'OPERATING beats CLOSED whatever the order',
    actual: () =>
      [
        pick(
          forecastOpeningByDate([row('2026-10-20', 'CLOSED'), row('2026-10-20', 'OPERATING')]),
          '2026-10-20'
        ),
        pick(
          forecastOpeningByDate([row('2026-10-20', 'OPERATING'), row('2026-10-20', 'CLOSED')]),
          '2026-10-20'
        ),
      ].join(),
    expected: 'OPERATING,OPERATING',
  },
  {
    name: 'the OPERATING row with both times beats one without, whatever the order',
    actual: () =>
      [
        [row('2026-10-20', 'OPERATING'), row('2026-10-20', 'OPERATING', 'a', 'b')],
        [row('2026-10-20', 'OPERATING', 'a', 'b'), row('2026-10-20', 'OPERATING')],
      ]
        .map((rows) => forecastOpeningByDate(rows).get('2026-10-20')?.closingTime)
        .join(),
    expected: 'b,b',
  },
  {
    name: 'a closed day is kept',
    actual: () => pick(forecastOpeningByDate([row('2026-11-02', 'CLOSED')]), '2026-11-02'),
    expected: 'CLOSED',
  },
  {
    name: 'a date with a time part is keyed by the day',
    actual: () =>
      pick(forecastOpeningByDate([row('2026-10-20T00:00:00.000Z', 'OPERATING')]), '2026-10-20'),
    expected: 'OPERATING',
  },
  {
    name: 'hasOperatingSchedule false hides every day',
    actual: () => forecastOpeningByDate([row('2026-10-20', 'OPERATING')], false).size,
    expected: 0,
  },
  {
    name: 'no schedule, null or undefined, hides every day',
    actual: () => forecastOpeningByDate(null).size + forecastOpeningByDate(undefined).size,
    expected: 0,
  },
];

let failed = 0;
for (const { name, actual, expected } of testCases) {
  const got = actual();
  if (got === expected) {
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.error(`❌ ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  }
}
if (failed) process.exit(1);
console.log(`\n${testCases.length} cases passed`);
