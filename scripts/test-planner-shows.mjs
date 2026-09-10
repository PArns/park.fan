/**
 * Unit tests for the planner's show lines (`lib/planner/shows.ts`).
 *
 * The clip exists for one reason: a PROJECTION carries another day's programme,
 * and the other day is often the longer one — 22 of the 48 showtimes the API
 * returned for Phantasialand on 2026-09-03 sat past an 18:00 close. A LISTING is
 * never clipped, because an operator publishing a time for this date outranks an
 * opening hour we derived.
 *
 * What this guards is the window the clip is given. A park whose day crosses
 * midnight publishes `closeHour < openHour` — La Ronde is `11 → 1` — and the two
 * hours multiplied by 60 make a window that runs BACKWARDS (`660 → 60`). Every
 * showtime of the day then falls outside it and the whole projected programme
 * left the column without an error anywhere, on exactly the parks the clip was
 * never meant to touch.
 *
 * Run: pnpm test:planner-shows
 */

import { showDayHours, showLinesFor } from '../lib/planner/shows.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

const show = (slug, times, source, extra = {}) => ({
  showSlug: slug,
  showName: slug,
  times,
  source,
  ...extra,
});

// ── The window itself ────────────────────────────────────────────────────────
test(
  'an ordinary day is its two hours',
  JSON.stringify(showDayHours(9, 18)),
  '{"openMin":540,"closeMin":1080}'
);
test(
  'a day that crosses midnight unfolds the close',
  JSON.stringify(showDayHours(11, 1)),
  '{"openMin":660,"closeMin":1500}'
);
// Deliberately the AXIS's answer and not a cleverer one: `unfoldedCloseHour`
// unfolds on `closeHour < openHour`, so an equal pair stays folded and the lines
// sit in the same window `buildDayGrid` draws. Two rules for one day is how a
// show ends up beside an axis that has no room for it.
test(
  'an equal pair stays folded, like the axis',
  JSON.stringify(showDayHours(10, 10)),
  '{"openMin":600,"closeMin":600}'
);
test('unknown hours refuse to build a window', showDayHours(null, 18), null);
test('an unknown close refuses too', showDayHours(11, undefined), null);

// ── La Ronde, 11 → 1 ─────────────────────────────────────────────────────────
{
  const shows = [show('parade', ['19:00', '22:30'], 'projected')];
  const hours = showDayHours(11, 1);
  test('an evening projection survives a wrap day', showLinesFor(shows, hours).length, 2);
  // The raw pair is what used to be passed, and it drops both.
  test(
    'the raw pair is what dropped them',
    showLinesFor(shows, { openMin: 11 * 60, closeMin: 1 * 60 }).length,
    0
  );
}

// ── The clip still clips ─────────────────────────────────────────────────────
{
  // Phantasialand 09:00–18:00 with a late-summer projection behind it.
  const shows = [show('wintertraum', ['16:00', '18:15', '21:00'], 'projected')];
  const lines = showLinesFor(shows, showDayHours(9, 18));
  test('a projection past the close is dropped', lines.length, 1);
  test('and the one inside the day is kept', lines[0]?.minute, 960);
  test(
    'a projection before the gates is dropped too',
    showLinesFor([show('early', ['07:30'], 'projected')], showDayHours(9, 18)).length,
    0
  );
}

// ── A listing outranks a window we derived ───────────────────────────────────
test(
  'a scheduled time past the close is never clipped',
  showLinesFor([show('laser', ['21:00'], 'scheduled')], showDayHours(9, 18)).length,
  1
);
test(
  'no window means no clip at all',
  showLinesFor([show('parade', ['07:30', '23:45'], 'projected')], null).length,
  2
);

// ── Malformed times are dropped, never defaulted to midnight ─────────────────
{
  const lines = showLinesFor(
    [show('odd', ['', '9:00', '25:00', '12:60', 'noon'], 'scheduled')],
    null
  );
  test('only the well-formed time survives', lines.length, 1);
  test('and a one-digit hour parses', lines[0]?.minute, 540);
}

// ── Ascending, across shows ──────────────────────────────────────────────────
{
  const lines = showLinesFor(
    [show('b', ['17:00'], 'scheduled'), show('a', ['12:30', '09:15'], 'scheduled')],
    null
  );
  test('lines come back ascending', lines.map((l) => l.minute).join(','), '555,750,1020');
}

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
