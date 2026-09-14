import { formatInTimeZone } from 'date-fns-tz';
import {
  getWeatherEmoji,
  hourlyPredictionInstants,
  isServableHourlyDate,
  upcomingHourlyPredictions,
} from '../lib/utils/calendar-utils.ts';

const testCases = [
  // Numeric codes (WMO)
  { input: 0, expected: '☀️', name: 'Numeric: Clear sky' },
  { input: 1, expected: '⛅', name: 'Numeric: Mainly clear' },
  { input: 2, expected: '⛅', name: 'Numeric: Partly cloudy' },
  { input: 3, expected: '⛅', name: 'Numeric: Overcast' },
  { input: 45, expected: '🌫️', name: 'Numeric: Fog (45)' },
  { input: 48, expected: '🌫️', name: 'Numeric: Fog (48)' },
  { input: 51, expected: '🌦️', name: 'Numeric: Drizzle (51)' },
  { input: 57, expected: '🌦️', name: 'Numeric: Drizzle (57)' },
  { input: 61, expected: '🌧️', name: 'Numeric: Rain (61)' },
  { input: 67, expected: '🌧️', name: 'Numeric: Rain (67)' },
  { input: 71, expected: '🌨️', name: 'Numeric: Snow (71)' },
  { input: 77, expected: '🌨️', name: 'Numeric: Snow (77)' },
  { input: 80, expected: '🌧️', name: 'Numeric: Rain showers (80)' },
  { input: 82, expected: '🌧️', name: 'Numeric: Rain showers (82)' },
  { input: 85, expected: '❄️', name: 'Numeric: Snow showers (85)' },
  { input: 86, expected: '❄️', name: 'Numeric: Snow showers (86)' },
  { input: 95, expected: '⛈️', name: 'Numeric: Thunderstorm (95)' },
  { input: 99, expected: '⛈️', name: 'Numeric: Thunderstorm (99)' },
  { input: 100, expected: '☁️', name: 'Numeric: Unknown code' },

  // String codes
  { input: 'clear-day', expected: '☀️', name: 'String: clear-day' },
  { input: 'clear-night', expected: '🌙', name: 'String: clear-night' },
  { input: 'cloudy', expected: '☁️', name: 'String: cloudy' },
  { input: 'partly-cloudy-day', expected: '⛅', name: 'String: partly-cloudy-day' },
  { input: 'partly-cloudy-night', expected: '☁️', name: 'String: partly-cloudy-night' },
  { input: 'rain', expected: '🌧️', name: 'String: rain' },
  { input: 'drizzle', expected: '🌦️', name: 'String: drizzle' },
  { input: 'snow', expected: '❄️', name: 'String: snow' },
  { input: 'sleet', expected: '🌨️', name: 'String: sleet' },
  { input: 'wind', expected: '💨', name: 'String: wind' },
  { input: 'fog', expected: '🌫️', name: 'String: fog' },
  { input: 'thunderstorm', expected: '⛈️', name: 'String: thunderstorm' },
  { input: 'unknown-string', expected: '🌤️', name: 'String: Unknown icon' },
];

console.log('🧪 Testing getWeatherEmoji\n');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, _index) => {
  const result = getWeatherEmoji(testCase.input);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Input:    ${testCase.input}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
    failed++;
  }
});

let total = testCases.length;

// ---------------------------------------------------------------------------
// hourlyPredictionInstants
//
// `HourlyPrediction.hour` is a UTC hour, and the day-detail dialog draws it on a park-local
// calendar. The three series below are what api.park.fan actually answered on 2026-09-14 at
// 11:42 UTC for three parks at three offsets — printing `hour` raw would have put 11 12 13 14 15
// under a Phantasialand day that runs 13 to 18.
// ---------------------------------------------------------------------------

console.log('\n' + '='.repeat(80));
console.log('\n🧪 Testing hourlyPredictionInstants\n');

const check = (name, condition, detail) => {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (detail) console.log(`   ${detail}`);
    failed++;
  }
};

const labels = (date, hours, timezone) =>
  hourlyPredictionInstants(date, hours).map((instant) => formatInTimeZone(instant, timezone, 'HH'));

const labelCases = [
  {
    name: 'Phantasialand, today — UTC 11–15 reads 13–17 in Europe/Berlin',
    date: '2026-09-14',
    hours: [11, 12, 13, 14, 15],
    timezone: 'Europe/Berlin',
    expected: ['13', '14', '15', '16', '17'],
  },
  {
    name: "Phantasialand, tomorrow — the series starts at the park's 09:00, not at 07",
    date: '2026-09-15',
    hours: [7, 8, 9, 10, 11],
    timezone: 'Europe/Berlin',
    expected: ['09', '10', '11', '12', '13'],
  },
  {
    name: 'Alton Towers, tomorrow — one hour of offset, three bars',
    date: '2026-09-15',
    hours: [9, 10, 11],
    timezone: 'Europe/London',
    expected: ['10', '11', '12'],
  },
  {
    name: 'A park west of UTC — the same hours read as a morning, not an evening',
    date: '2026-09-14',
    hours: [15, 16, 17, 18],
    timezone: 'America/New_York',
    expected: ['11', '12', '13', '14'],
  },
  {
    name: 'A park east of UTC — and as an evening there',
    date: '2026-09-14',
    hours: [8, 9, 10, 11],
    timezone: 'Asia/Tokyo',
    expected: ['17', '18', '19', '20'],
  },
];

for (const c of labelCases) {
  const got = labels(c.date, c.hours, c.timezone);
  check(
    c.name,
    got.join(' ') === c.expected.join(' '),
    `Expected: ${c.expected.join(' ')}   Got: ${got.join(' ')}`
  );
}

// A late-closing park's series runs past midnight UTC, and the values drop (… 22 23 0 1). Each
// entry has to land one hour after the one before it, or the `0` is filed twenty-three hours
// earlier than its neighbour.
{
  const instants = hourlyPredictionInstants('2026-09-14', [22, 23, 0, 1]);
  const steps = instants.slice(1).map((v, i) => v - instants[i]);
  check(
    'a series crossing midnight UTC stays one hour apart',
    steps.every((s) => s === 3600_000),
    `Steps (ms): ${steps.join(', ')}`
  );
  check(
    'and starts where the day starts',
    instants[0] === Date.parse('2026-09-14T22:00:00Z'),
    `Got: ${new Date(instants[0]).toISOString()}`
  );
}

check('an empty series stays empty', hourlyPredictionInstants('2026-09-14', []).length === 0);
check('a date the API never sends yields nothing', hourlyPredictionInstants('', [11]).length === 0);

// ---------------------------------------------------------------------------
// upcomingHourlyPredictions
//
// The curve is a countdown of the remaining open hours, and api.park.fan caches it until
// park-local midnight — so the copy a reader gets in the afternoon can still start at this
// morning. The expired bars are cut at render; these cases are what says so.
// ---------------------------------------------------------------------------

console.log('\n🧪 Testing upcomingHourlyPredictions\n');

const series = [11, 12, 13, 14, 15].map((hour) => ({ hour, predictedWaitTime: 10 }));
const at = (iso) => Date.parse(iso);

{
  const kept = upcomingHourlyPredictions('2026-09-14', series, at('2026-09-14T11:41:00Z'));
  check(
    'a fresh curve loses nothing — the current hour has not ended',
    kept.length === 5 && kept[0].hour === 11,
    `kept ${kept.map((k) => k.hour).join(' ')}`
  );
  check(
    'and every entry carries the instant its bar covers',
    kept[0].instant === at('2026-09-14T11:00:00Z') &&
      kept[4].instant === at('2026-09-14T15:00:00Z'),
    `first ${new Date(kept[0].instant).toISOString()}`
  );
}

{
  // The measured case: a copy taken at 11:41 and served again at 14:20 out of the backend's cache.
  const kept = upcomingHourlyPredictions('2026-09-14', series, at('2026-09-14T14:20:00Z'));
  check(
    'a curve kept for three hours drops the three that are over',
    kept.map((k) => k.hour).join(' ') === '14 15',
    `kept ${kept.map((k) => k.hour).join(' ')}`
  );
}

{
  const kept = upcomingHourlyPredictions('2026-09-14', series, at('2026-09-14T16:00:00Z'));
  check(
    'past the last bar the section has nothing left to draw',
    kept.length === 0,
    `kept ${kept.map((k) => k.hour).join(' ')}`
  );
}

{
  // Exactly on the hour: the 11:00 bar covers 11:00–12:00, so at 12:00 it is over and 12 is not.
  const kept = upcomingHourlyPredictions('2026-09-14', series, at('2026-09-14T12:00:00Z'));
  check(
    'a bar ends when its hour does, not when it starts',
    kept.map((k) => k.hour).join(' ') === '12 13 14 15',
    `kept ${kept.map((k) => k.hour).join(' ')}`
  );
}

{
  // Tomorrow is entirely ahead whatever the clock says today.
  const kept = upcomingHourlyPredictions(
    '2026-09-15',
    [7, 8, 9, 10, 11].map((hour) => ({ hour, predictedWaitTime: 10 })),
    at('2026-09-14T14:20:00Z')
  );
  check(
    "tomorrow's curve survives today's afternoon in full",
    kept.length === 5,
    `kept ${kept.map((k) => k.hour).join(' ')}`
  );
}

// ---------------------------------------------------------------------------
// isServableHourlyDate
//
// The `/calendar/hourly` route's `date` lands in the CDN cache key, so it is bounded to the four
// dates that can ever answer anything: only today and tomorrow carry a curve, and park timezones
// run from UTC−12 to UTC+14.
// ---------------------------------------------------------------------------

console.log('\n🧪 Testing isServableHourlyDate\n');

{
  const now = at('2026-09-14T13:07:00Z');
  const cases = [
    ['2026-09-13', true, 'a park west of UTC is still on yesterday'],
    ['2026-09-14', true, 'the UTC date itself'],
    ['2026-09-15', true, "most parks' tomorrow"],
    ['2026-09-16', true, 'and the tomorrow of a park at UTC+14'],
    ['2026-09-17', false, 'one day further is a date nothing can answer'],
    ['2026-09-12', false, 'and so is one day back'],
    [
      '2026-02-30',
      false,
      'a day that does not exist, which Date rolls forward instead of refusing',
    ],
    ['2026-99-99', false, 'well-shaped nonsense'],
    ['2026-9-14', false, 'a single-digit month is not the format the API speaks'],
    ['', false, 'the empty string'],
    ['nonsense', false, 'anything else'],
  ];
  for (const [date, expected, name] of cases) {
    check(
      `${expected ? 'serves' : 'refuses'} ${date || '(empty)'} — ${name}`,
      isServableHourlyDate(date, now) === expected
    );
  }
  check(
    'the window moves with the clock, it is not pinned to a build',
    isServableHourlyDate('2027-01-02', at('2027-01-01T00:00:00Z')) &&
      !isServableHourlyDate('2026-09-14', at('2027-01-01T00:00:00Z'))
  );
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${total} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
