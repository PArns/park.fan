/**
 * The blog's inline park chip for a closed park (`isClosedForNow`): grey „Gerade zu" while the park
 * opens again within days, red „Geschlossen" for a park closed during its own hours, off season or
 * with no opening known. Phantasialand in Brühl (Europe/Berlin), Wintertraum hours 11:00 to 20:00.
 *
 * Run: pnpm test:blog-park-chip
 */
import { isClosedForNow } from '../lib/blog/live-display.ts';

let failed = 0;
function check(name, actual, expected) {
  if (actual !== expected) {
    failed++;
    console.log(
      `❌ FAIL: ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

const day = (date, open = '11:00', close = '20:00') => ({
  openingTime: `${date}T${open}:00+01:00`,
  closingTime: `${date}T${close}:00+01:00`,
  scheduleType: 'OPERATING',
});
const shut = (date) => ({ ...day(date), scheduleType: 'CLOSED' });
const park = (todaySchedule, nextSchedule, status = 'CLOSED') => ({
  status,
  timezone: 'Europe/Berlin',
  todaySchedule,
  nextSchedule,
});
const at = (iso) => Date.parse(iso);

check(
  'after closing time, open again tomorrow',
  isClosedForNow(park(day('2026-11-28'), day('2026-11-29')), at('2026-11-28T22:30:00+01:00')),
  true
);
check(
  'early in the morning, opening later today',
  isClosedForNow(park(day('2026-11-28'), day('2026-11-29')), at('2026-11-28T07:10:00+01:00')),
  true
);
check(
  'a day off in the season, open again in three days',
  isClosedForNow(park(shut('2026-11-25'), day('2026-11-28')), at('2026-11-25T14:00:00+01:00')),
  true
);
check(
  'closed inside its own hours: weather or an incident, a closure',
  isClosedForNow(park(day('2026-11-28'), day('2026-11-29')), at('2026-11-28T15:00:00+01:00')),
  false
);
check(
  'off season, next opening in March',
  isClosedForNow(park(shut('2026-01-12'), day('2026-03-28')), at('2026-01-12T12:00:00+01:00')),
  false
);
check(
  'no opening known',
  isClosedForNow(park(undefined, undefined), at('2026-11-28T22:30:00+01:00')),
  false
);
check(
  'an open park is not closed for now',
  isClosedForNow(
    park(day('2026-11-28'), day('2026-11-29'), 'OPERATING'),
    at('2026-11-28T22:30:00+01:00')
  ),
  false
);
check(
  'works stay works',
  isClosedForNow(
    park(day('2026-11-28'), day('2026-11-29'), 'REFURBISHMENT'),
    at('2026-11-28T22:30:00+01:00')
  ),
  false
);
check(
  'before the clock: hours today count as a night off',
  isClosedForNow(park(day('2026-11-28'), day('2026-11-29')), null),
  true
);
check(
  'before the clock: no hours today stay a closure',
  isClosedForNow(park(shut('2026-01-12'), day('2026-03-28')), null),
  false
);

if (failed) process.exit(1);
console.log('✅ blog-park-chip: all checks passed');
