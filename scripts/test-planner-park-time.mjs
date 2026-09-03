/**
 * Unit tests for the planner's clock (`lib/planner/park-time.ts`).
 *
 * The planner's clock is the PARK's clock, and the bug this guards is not a
 * mislabelled time — it is a misfiled entry. `add-to-planner-button` computed
 * "today" from the browser's offset and used it as the localStorage key, so a
 * Magic Kingdom ride added at 21:00 in Berlin landed on tomorrow's plan for a
 * park where it was mid-afternoon, and the only way to find it again was to
 * guess which day it went to.
 *
 * Run: pnpm test:planner-park-time
 */

import { addDays, formatGridTime, parkMinuteNow, parkToday,
  resolveTimeZone,
  todayInZone,
} from '../lib/planner/park-time.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

// ── The misfiling case, exactly ──────────────────────────────────────────────
// 2026-09-03T02:00:00Z is 04:00 in Berlin and still 22:00 on the 2nd in Orlando.
{
  const at = Date.parse('2026-09-03T02:00:00Z');
  test('Berlin has rolled over', parkToday('Europe/Berlin', at), '2026-09-03');
  test('Orlando has not', parkToday('America/New_York', at), '2026-09-02');
}

// ── The reader's own zone never enters ───────────────────────────────────────
test(
  'a park east of the reader gets its own date',
  parkToday('Asia/Tokyo', Date.parse('2026-09-02T16:00:00Z')),
  '2026-09-03'
);

// ── Minutes since park-local midnight ────────────────────────────────────────
test(
  'noon in Berlin is 720 minutes in',
  parkMinuteNow('Europe/Berlin', Date.parse('2026-09-02T10:00:00Z')),
  720
);
// `hour12: false` yields 24 for midnight in several runtimes, which would put
// the now line a whole day down the grid. `hourCycle: 'h23'` is why this is 0.
test(
  'midnight is zero, not 1440',
  parkMinuteNow('Europe/Berlin', Date.parse('2026-09-01T22:00:00Z')),
  0
);

// ── DST ──────────────────────────────────────────────────────────────────────
// Europe/Berlin springs forward at 02:00 local on 2027-03-28; 01:30 UTC is
// 03:30 local, i.e. the hour that does not exist is simply skipped.
test(
  'a spring-forward instant reads as the local wall clock',
  parkMinuteNow('Europe/Berlin', Date.parse('2027-03-28T01:30:00Z')),
  210
);
// The autumn repeat: 00:30 UTC is 02:30 CEST, the first pass through 02:30.
test(
  'an autumn repeat still reads as the wall clock',
  parkMinuteNow('Europe/Berlin', Date.parse('2026-10-25T00:30:00Z')),
  150
);

// ── Formatting takes minutes, never an instant ───────────────────────────────
test('minutes format as a wall clock', formatGridTime(630), '10:30');
test('a single-digit hour is padded', formatGridTime(540), '09:00');
test('midnight formats as 00:00', formatGridTime(0), '00:00');
// A park closing at 25:00 labels its last hour 01:00, not 25:00.
test('a past-midnight minute folds back', formatGridTime(1500), '01:00');
test('a negative minute folds forward', formatGridTime(-30), '23:30');

// ── Date arithmetic on park-local date strings ───────────────────────────────
test('a day later', addDays('2026-09-02', 1), '2026-09-03');
// Across a DST boundary, where a naive +86400000 ms lands on the wrong date.
test('across the autumn changeover', addDays('2026-10-24', 1), '2026-10-25');
test('across a month end', addDays('2026-09-30', 1), '2026-10-01');
test('backwards across a year end', addDays('2027-01-01', -1), '2026-12-31');

// ── The zone the planner reckons in ─────────────────────────────────────────
// The flyout resolved `?? 'UTC'` and no call site ever wrote the field, so the
// whole panel ran on UTC — the wrong DATE for a large part of every day on both
// sides of Greenwich. A known zone must win, and an unknown one must not become
// a constant.
const ACROSS_MIDNIGHT = Date.parse('2026-09-03T23:30:00Z');
test(
  'a known zone decides the date',
  todayInZone('Pacific/Auckland', ACROSS_MIDNIGHT),
  '2026-09-04'
);
test(
  'the same instant is still the 3rd in Los Angeles',
  todayInZone('America/Los_Angeles', ACROSS_MIDNIGHT),
  '2026-09-03'
);
test(
  'a known zone is exactly parkToday',
  todayInZone('Europe/Berlin', ACROSS_MIDNIGHT),
  parkToday('Europe/Berlin', ACROSS_MIDNIGHT)
);
test('a known zone survives resolution', resolveTimeZone('Europe/Berlin'), 'Europe/Berlin');
// Not UTC: an unresolved zone falls back to the READER's, which is right for the
// commonest case and merely imprecise for the rest.
test(
  'an unknown zone falls back to the reader, not to UTC',
  resolveTimeZone(undefined),
  Intl.DateTimeFormat().resolvedOptions().timeZone
);

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
