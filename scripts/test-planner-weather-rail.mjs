/**
 * Unit tests for the planner's weather rail (`lib/planner/weather-rail.ts`).
 *
 * Three properties, none of them visible in a screenshot.
 *
 * The first is that the band is CONTINUOUS over the hours the forecast covers
 * and stops where it does not: a gap in the band reads as a gap in the day, and
 * a band drawn past the model's reach would be an invention.
 *
 * The second is that a label appears only where the weather TURNS. Every hour
 * getting one is a table, and the point of a rail is that a glance answers it.
 *
 * The third is that the hour is read out of the naive local timestamp rather
 * than through `Date`, because `new Date("2026-09-03T14:00")` is 14:00 in the
 * READER's zone and the planner's clock is the park's.
 *
 * Run: pnpm test:planner-weather-rail
 */

import { buildDayGrid, yFor } from '../lib/planner/day-grid.ts';
import {
  WEATHER_RAIL_MAX_LEAD_DAYS,
  WET_MM_FLOOR,
  isWet,
  weatherRailGroup,
  weatherRailSegments,
  withinWeatherHorizon,
} from '../lib/planner/weather-rail.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

/** Phantasialand: 09:00–18:00, so the axis runs 08:30–19:30. */
const g = buildDayGrid(9, 18);

/** A full day of hourly points, `code`/`mm` per hour where given. */
function day(overrides = {}) {
  return Array.from({ length: 24 }, (_, hour) => ({
    time: `2026-09-03T${String(hour).padStart(2, '0')}:00`,
    temperatureC: 18,
    precipitationMm: overrides[hour]?.mm ?? 0,
    precipitationProbability: 10,
    weatherCode: overrides[hour]?.code ?? 3,
    isDay: hour >= 7 && hour < 20,
  }));
}

// ── 1. The band covers the axis and nothing else ─────────────────────────────
// 08:30–19:30, so hours 8 through 19 inclusive — twelve slices. Hour 8 is on the
// axis for its last half hour and must be drawn: the plan starts before the park
// opens, and the rain somebody walks through to the gate is falling then.
{
  const segments = weatherRailSegments(g, day());
  test('one slice per hour the axis touches', segments.length, 12);
  test('the first is the hour the axis opens in', segments[0].hour, 8);
  test('the last is the hour the axis closes in', segments.at(-1).hour, 19);
  test('the first slice is clipped to the canvas top', segments[0].y, 0);
  test(
    'the last slice is clipped to the canvas bottom',
    Math.round(segments.at(-1).y + segments.at(-1).height),
    Math.round(g.heightPx)
  );
  test(
    'a whole hour is one hour tall',
    Math.round(segments[1].height),
    Math.round(yFor(g, 600) - yFor(g, 540))
  );
  // Continuity: no gap and no overlap anywhere in between.
  const contiguous = segments.every(
    (segment, i) =>
      i === 0 || Math.abs(segment.y - (segments[i - 1].y + segments[i - 1].height)) < 0.001
  );
  test('the band has no seams', contiguous, true);
}

// ── 2. Hours the forecast does not carry are skipped, not filled ─────────────
// The fourteenth day comes back with the model running out mid-afternoon. What
// it has is drawn; what it does not is absent, never a dry hour.
{
  const partial = day().filter((point) => Number(point.time.slice(11, 13)) < 12);
  const segments = weatherRailSegments(g, partial);
  test('a truncated forecast draws what it has', segments.length, 4); // 8, 9, 10, 11
  test('and stops where it stops', segments.at(-1).hour, 11);
  test('no forecast at all draws nothing', weatherRailSegments(g, []).length, 0);
  test('a missing forecast draws nothing', weatherRailSegments(g, null).length, 0);
}

// ── 3. A label only where it turns ───────────────────────────────────────────
{
  // Overcast all day, then rain from 14:00, then a thunderstorm at 17:00.
  const segments = weatherRailSegments(
    g,
    day({
      14: { code: 61, mm: 0.4 },
      15: { code: 63, mm: 1.2 },
      16: { code: 65, mm: 2.1 },
      17: { code: 95, mm: 3.4 },
      18: { code: 95, mm: 1.1 },
      19: { code: 95, mm: 0.2 },
    })
  );
  const changes = segments.filter((segment) => segment.changes).map((segment) => segment.hour);
  test('three turns, and the axis opening', changes.join(','), '8,14,17');
  test(
    'a run of rain is ONE label, not three',
    segments.filter((s) => s.group === 'rain' && s.changes).length,
    1
  );
}

// ── 4. Wet against dry ───────────────────────────────────────────────────────
{
  const segments = weatherRailSegments(
    g,
    day({ 12: { code: 61, mm: 0.4 }, 13: { code: 61, mm: 0.05 } })
  );
  const at = (hour) => segments.find((segment) => segment.hour === hour);
  test('0.4 mm prints a figure', isWet(at(12)), true);
  // 0.05 mm in an hour is a damp railing. Rounding it up to "0,1 mm" beside a
  // plan hands the reader a decision about something they cannot feel.
  test('0.05 mm does not', isWet(at(13)), false);
  test('exactly the floor counts as wet', isWet({ mm: WET_MM_FLOOR }), true);
  test('no reading at all is not wet', isWet({ mm: null }), false);
}

// ── 5. The code groups ───────────────────────────────────────────────────────
// The same ranges `getWeatherIcon` and `getWeatherTranslationKey` split on, one
// layer coarser. A code the map does not know is `cloud` rather than a hole,
// because the band is continuous by construction.
test('0 is clear', weatherRailGroup(0), 'clear');
test('3 is cloud', weatherRailGroup(3), 'cloud');
test('45 is fog', weatherRailGroup(45), 'fog');
test('61 is rain', weatherRailGroup(61), 'rain');
test('73 is snow', weatherRailGroup(73), 'snow');
test('81 is rain, not snow', weatherRailGroup(81), 'rain');
test('86 is snow, not rain', weatherRailGroup(86), 'snow');
test('95 is storm', weatherRailGroup(95), 'storm');
test('an unknown code is cloud', weatherRailGroup(4711), 'cloud');
test('no code is cloud', weatherRailGroup(null), 'cloud');

// ── 6. The hour comes out of the STRING ──────────────────────────────────────
// `new Date("2026-09-03T14:00")` is 14:00 wherever the reader is sitting, which
// is the one thing the planner never does. Proven by running the same points
// through a grid while the process claims to be in Tokyo — the segment for the
// park's 14:00 has to stay at the park's 14:00.
{
  const points = day({ 14: { code: 61, mm: 1.5 } });
  const before = weatherRailSegments(g, points).find((segment) => segment.hour === 14);
  const saved = process.env.TZ;
  process.env.TZ = 'Asia/Tokyo';
  const after = weatherRailSegments(g, points).find((segment) => segment.hour === 14);
  if (saved === undefined) delete process.env.TZ;
  else process.env.TZ = saved;
  test('the reader’s zone does not move an hour', after.y, before.y);
  test('and does not move its rain', after.mm, 1.5);
}

// ── 7. The horizon ───────────────────────────────────────────────────────────
// The planner offers sixty days and the model answers about fourteen. Past that
// the proxy returns an error, so the gate has to be here rather than in a catch.
test('today is inside', withinWeatherHorizon('2026-09-03', '2026-09-03'), true);
test('the last day is inside', withinWeatherHorizon('2026-09-03', '2026-09-17'), true);
test('one past it is out', withinWeatherHorizon('2026-09-03', '2026-09-18'), false);
test('a day in the past is out', withinWeatherHorizon('2026-09-03', '2026-09-02'), false);
test('across a month boundary', withinWeatherHorizon('2026-08-25', '2026-09-05'), true);
test('across a year boundary', withinWeatherHorizon('2026-12-28', '2027-01-05'), true);
test('a nonsense date is out', withinWeatherHorizon('2026-09-03', 'tomorrow'), false);
test('the horizon is fourteen days', WEATHER_RAIL_MAX_LEAD_DAYS, 14);

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = Object.is(actual, expected);
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — erwartet ${expected}, bekommen ${actual}`}`
  );
}
console.log(`\n${cases.length - failed}/${cases.length} bestanden`);
process.exit(failed === 0 ? 0 : 1);
