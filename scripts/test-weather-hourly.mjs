/**
 * Unit tests for cutting one park-day out of the API's `/weather/hourly` (`hourlyDayPoints`,
 * `lib/api/weather-hourly.ts`), the shape the weather day chart and the planner's rail read.
 *
 * The named day is picked by its date and nothing else is; each hour keeps its wall-clock time
 * without the offset, also for a park on UTC (`Z`); a fall-back day keeps all 25 hours with the
 * repeated one twice and in order, a spring-forward day its 23; a missing daylight flag counts as
 * day; and a missing value is `null`, never `undefined`.
 *
 * Run: pnpm test:weather-hourly
 */

import { hourlyDayPoints } from '../lib/api/weather-hourly.ts';
import { hoursOf } from '../lib/utils/weather-chart-axis.ts';
import { runCases } from './lib/run-cases.mjs';

const hour = (time, extra = {}) => ({
  time,
  temperatureC: 10,
  apparentTemperatureC: 8,
  precipitationMm: 0,
  precipitationProbability: 5,
  weatherCode: 3,
  windSpeedKmh: 12,
  windGustsKmh: 30,
  windDirectionDeg: 250,
  isDay: true,
  ...extra,
});

/** A whole 24-hour day on one offset. */
const day = (date, offset) => ({
  date,
  sunrise: `${date}T08:00${offset}`,
  sunset: `${date}T16:30${offset}`,
  hours: [...Array(24).keys()].map((h) =>
    hour(`${date}T${String(h).padStart(2, '0')}:00${offset}`)
  ),
});

const answer = (timezone, days) => ({
  park: { id: 'p', name: 'Park', slug: 'park', timezone },
  generatedAt: '2026-11-28T00:46:11.469Z',
  nextUpdateAt: '2026-11-28T02:46:11.469Z',
  days,
  attribution: { url: 'https://open-meteo.com/', license: 'CC-BY-4.0', attribution: 'x' },
});

const berlin = answer('Europe/Berlin', [
  day('2026-11-28', '+01:00'),
  {
    ...day('2026-11-29', '+01:00'),
    hours: [
      hour('2026-11-29T00:00+01:00', {
        temperatureC: -1.5,
        precipitationMm: 0.4,
        precipitationProbability: 70,
        weatherCode: 61,
        isDay: false,
      }),
      hour('2026-11-29T01:00+01:00', { isDay: null, temperatureC: null }),
      hour('2026-11-29T02:00+01:00', { weatherCode: undefined }),
    ],
  },
]);

// 25 hours: 02:00 on summer time, then 02:00 again on winter time.
const fallBack = answer('Europe/Berlin', [
  {
    date: '2026-10-25',
    sunrise: null,
    sunset: null,
    hours: [
      ...[0, 1, 2].map((h) => hour(`2026-10-25T0${h}:00+02:00`)),
      ...[...Array(22).keys()]
        .map((i) => i + 2)
        .map((h) => hour(`2026-10-25T${String(h).padStart(2, '0')}:00+01:00`)),
    ],
  },
]);

// 23 hours: 01:00 on winter time, then 03:00 on summer time.
const springForward = answer('Europe/Berlin', [
  {
    date: '2026-03-29',
    sunrise: null,
    sunset: null,
    hours: [
      ...[0, 1].map((h) => hour(`2026-03-29T0${h}:00+01:00`)),
      ...[...Array(21).keys()]
        .map((i) => i + 3)
        .map((h) => hour(`2026-03-29T${String(h).padStart(2, '0')}:00+02:00`)),
    ],
  },
]);

const london = answer('Europe/London', [day('2026-11-28', 'Z')]);

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

test(
  'the zone is the park’s',
  () => hourlyDayPoints(berlin, '2026-11-28').timezone,
  'Europe/Berlin'
);
test(
  'today keeps its 24 hours, wall clock without the offset',
  () => {
    const points = hourlyDayPoints(berlin, '2026-11-28').points;
    return [points.length, points[0].time, points[23].time];
  },
  [24, '2026-11-28T00:00', '2026-11-28T23:00']
);
test('a later day is picked by its date', () => hourlyDayPoints(berlin, '2026-11-29').points[0], {
  time: '2026-11-29T00:00',
  temperatureC: -1.5,
  precipitationMm: 0.4,
  precipitationProbability: 70,
  weatherCode: 61,
  isDay: false,
});
test(
  'no daylight flag counts as day, a null value stays null',
  () => {
    const p = hourlyDayPoints(berlin, '2026-11-29').points[1];
    return [p.isDay, p.temperatureC];
  },
  [true, null]
);
test(
  'a value the answer leaves out is null',
  () => hourlyDayPoints(berlin, '2026-11-29').points[2].weatherCode,
  null
);
test(
  'only the chart’s fields go out',
  () => Object.keys(hourlyDayPoints(berlin, '2026-11-28').points[0]).sort(),
  ['isDay', 'precipitationMm', 'precipitationProbability', 'temperatureC', 'time', 'weatherCode']
);
test('a day before the answer’s first is null', () => hourlyDayPoints(berlin, '2026-11-27'), null);
test('a day after the answer’s last is null', () => hourlyDayPoints(berlin, '2026-12-14'), null);
test(
  'a day without hours is null',
  () =>
    hourlyDayPoints(
      answer('Europe/Berlin', [{ ...day('2026-11-28', '+01:00'), hours: [] }]),
      '2026-11-28'
    ),
  null
);
test(
  'a fall-back day keeps 25 hours, the repeated one twice and in order',
  () => hoursOf(hourlyDayPoints(fallBack, '2026-10-25').points),
  [0, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
);
test(
  'a spring-forward day keeps 23 hours, without 02:00',
  () => {
    const hours = hoursOf(hourlyDayPoints(springForward, '2026-03-29').points);
    return [hours.length, hours.includes(2)];
  },
  [23, false]
);
test(
  'a park on UTC drops the Z',
  () => hourlyDayPoints(london, '2026-11-28').points[14].time,
  '2026-11-28T14:00'
);

await runCases(testCases, { json: true, quiet: true });
