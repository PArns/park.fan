/**
 * Unit tests for the calendar month page's two pure modules:
 * `lib/parks/calendar-month-summary.ts` and `lib/parks/calendar-grid-geometry.ts`.
 *
 * Both exist because the month pages shipped 99.5 % identical server HTML and reserved 576 px for
 * a grid that is up to 1992 px tall. What is worth pinning is not the happy path — it is the
 * REFUSALS and the calendar arithmetic, because those are what a page cannot show wrongly on
 * 31.800 URLs at once:
 *
 *   - a month with too few rated days names no quiet day
 *   - a flat month names neither end (the median test, in both directions)
 *   - too many days tied at the minimum means "no quiet day", not a list of six
 *   - opening hours are grouped in the PARK's zone, so one local time that spans a DST change is
 *     one pattern and not two
 *   - week rows and list rows survive leap years, month lengths and Monday-first weeks
 *
 * Run: pnpm test:calendar-month
 */

import { summarizeCalendarMonth } from '../lib/parks/calendar-month-summary.ts';
import {
  calendarGridReservation,
  listRowsInMonth,
  weekRowsInMonth,
} from '../lib/parks/calendar-grid-geometry.ts';
import {
  CALENDAR_DATA_START,
  PARK_CALENDAR_MONTH_SPAN,
  isParkCalendarMonthInRange,
  parkCalendarMonthsBack,
} from '../lib/parks/calendar-segments.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

const TZ = 'Europe/Berlin';

/**
 * One calendar day. Defaults describe an ordinary open day so a case only has to state the field
 * it is actually about.
 */
const day = (date, over = {}) => ({
  date,
  status: 'OPERATING',
  isToday: false,
  crowdLevel: 'moderate',
  isHoliday: false,
  isBridgeDay: false,
  isSchoolVacation: false,
  ...over,
});

/** A month of `count` days starting at `2026-11-01`, all identical unless `shape` says otherwise. */
const month = (count, shape = () => ({})) =>
  Array.from({ length: count }, (_, i) =>
    day(`2026-11-${String(i + 1).padStart(2, '0')}`, shape(i))
  );

const hoursAt = (date, open, close) => ({
  hours: {
    openingTime: `${date}T${open}:00:00.000Z`,
    closingTime: `${date}T${close}:00:00.000Z`,
    type: 'OPERATING',
    isInferred: false,
  },
});

// ---------------------------------------------------------------------------
// summarizeCalendarMonth — the refusals
// ---------------------------------------------------------------------------

test(
  'names no quiet day below the minimum sample',
  () => {
    // Seven rated open days: one is lowest, but seven days is not a month's worth of evidence.
    const days = month(7, (i) => ({ crowdLevel: i === 0 ? 'very_low' : 'high' }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ).quietest;
  },
  null
);

test(
  'names a quiet day once there are enough rated days',
  () => {
    const days = month(12, (i) => ({ crowdLevel: i === 0 ? 'very_low' : 'high' }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ)
      .quietest.map((d) => d.date)
      .join(',');
  },
  '2026-11-01'
);

test(
  'a flat month names neither end',
  () => {
    const days = month(30);
    const s = summarizeCalendarMonth(days, '2026-12-01', TZ);
    return `${s.quietest}/${s.busiest}`;
  },
  'null/null'
);

test(
  'a tie of two quiet days names both',
  () => {
    const days = month(30, (i) => ({ crowdLevel: i < 2 ? 'low' : 'high' }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ)
      .quietest.map((d) => d.date)
      .join(',');
  },
  '2026-11-01,2026-11-02'
);

test(
  'four days tied at the minimum is no quiet day at all',
  () => {
    const days = month(30, (i) => ({ crowdLevel: i < 4 ? 'low' : 'high' }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ).quietest;
  },
  null
);

test(
  'closed days never count as the quietest',
  () => {
    const days = month(30, (i) =>
      i < 10
        ? { status: 'CLOSED', crowdLevel: 'closed' }
        : { crowdLevel: i === 10 ? 'low' : 'high' }
    );
    const s = summarizeCalendarMonth(days, '2026-12-01', TZ);
    return `${s.openDays}/${s.closedDays}/${s.quietest.map((d) => d.date).join(',')}`;
  },
  '20/10/2026-11-11'
);

test(
  'today never competes: its crowdLevel is a live reading, not a day aggregate',
  () => {
    // The API overrides crowdLevel on TODAY with live occupancy. At 09:30 on a busy Saturday that
    // reads `very_low` because nobody has queued yet — and today would win a contest it is not
    // even entered in, on the same scale as thirty forecasts.
    const days = month(30, (i) =>
      i === 5 ? { isToday: true, crowdLevel: 'very_low' } : { crowdLevel: 'moderate' }
    );
    return summarizeCalendarMonth(days, '2026-11-06', TZ).quietest;
  },
  null
);

test(
  'ties are broken on crowdScore, not on the six-value bucket',
  () => {
    // Twenty days at `low` is what a weekday/weekend park looks like, and on the enum alone that
    // is twenty tied winners → suppressed. The continuous score separates them.
    const days = month(30, (i) => ({
      crowdLevel: i < 20 ? 'low' : 'high',
      crowdScore: i === 3 ? 0.1 : i < 20 ? 0.5 : 0.9,
    }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ)
      .quietest.map((d) => d.date)
      .join(',');
  },
  '2026-11-04'
);

test('a zero-minute headliner day counts toward the average', () => {
  const days = month(12, (i) => ({
    crowdLevel: 'moderate',
    headlinerForecast: { avgWait: i < 6 ? 0 : 20, rides: [] },
  }));
  // 0,0,0,0,0,0,20,20,20,20,20,20 → mean 10. Dropping the zeros would have reported 20.
  return summarizeCalendarMonth(days, '2026-12-01', TZ).avgHeadlinerWait;
}, 10);

test(
  'an unknown crowd level is not a rating',
  () => {
    // Twenty unknown days plus seven rated ones: still under the sample floor.
    const days = month(27, (i) => ({ crowdLevel: i < 20 ? 'unknown' : i === 20 ? 'low' : 'high' }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ).quietest;
  },
  null
);

// ---------------------------------------------------------------------------
// summarizeCalendarMonth — hours, in the park's zone
// ---------------------------------------------------------------------------

test(
  'opening hours are read in the park zone, not UTC',
  () => {
    // 08:00Z on a November day in Berlin is 09:00 local.
    const days = month(30, (i) => hoursAt(`2026-11-${String(i + 1).padStart(2, '0')}`, '08', '17'));
    const h = summarizeCalendarMonth(days, '2026-12-01', TZ).hours;
    return `${h.openingTime}-${h.closingTime}`;
  },
  '09:00-18:00'
);

test(
  'no single pattern below the 60 % floor',
  () => {
    const days = month(30, (i) => {
      const d = `2026-11-${String(i + 1).padStart(2, '0')}`;
      return i < 15 ? hoursAt(d, '08', '17') : hoursAt(d, '09', '19');
    });
    return summarizeCalendarMonth(days, '2026-12-01', TZ).hours;
  },
  null
);

test(
  'a park with no published hours gets no hours sentence',
  () => summarizeCalendarMonth(month(30), '2026-12-01', TZ).hours,
  null
);

// ---------------------------------------------------------------------------
// summarizeCalendarMonth — counts, waits and tense
// ---------------------------------------------------------------------------

test('the headliner average is rounded once, at the end', () => {
  // 31, 32, 33 → mean 32 → 30 on the five-minute grid. Rounding each first would give 30/30/35.
  const days = month(12, (i) => ({
    crowdLevel: 'moderate',
    headlinerForecast: { avgWait: [31, 32, 33][i % 3], rides: [] },
  }));
  return summarizeCalendarMonth(days, '2026-12-01', TZ).avgHeadlinerWait;
}, 30);

test(
  'a month wholly in the past reads as past',
  () => summarizeCalendarMonth(month(30), '2026-12-01', TZ).isPast,
  true
);

test(
  'a month containing today does not',
  () => summarizeCalendarMonth(month(30), '2026-11-15', TZ).isPast,
  false
);

test(
  'school vacation counts both flags without double counting',
  () =>
    summarizeCalendarMonth(
      month(30, (i) => ({ isSchoolVacation: i < 5, isSchoolHoliday: i < 3 })),
      '2026-12-01',
      TZ
    ).schoolVacationDays,
  5
);

test(
  'an empty month summarises to nothing',
  () => summarizeCalendarMonth([], '2026-12-01', TZ),
  null
);

test(
  'a month with no operating day summarises to nothing',
  () => {
    // Two very different realities produce this and the payload cannot tell them apart: a park
    // shut for the season (Europa-Park answers 0 of 28 for February 2026, correctly) and a month
    // too far back for the schedule to be retained (Phantasialand answers 0 of 30 for September
    // 2025, when it was open every day). „An 0 von 30 Tagen geöffnet" would be false in the
    // second case, on roughly half the past months of the catalogue at once.
    const days = month(30, () => ({ status: 'CLOSED', crowdLevel: 'closed' }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ);
  },
  null
);

test(
  'one open day is counted but names nothing',
  () => {
    const days = month(30, (i) =>
      i === 0 ? { crowdLevel: 'low' } : { status: 'CLOSED', crowdLevel: 'closed' }
    );
    const s = summarizeCalendarMonth(days, '2026-12-01', TZ);
    return `${s.openDays}/${s.closedDays}/${s.quietest}`;
  },
  '1/29/null'
);

// ---------------------------------------------------------------------------
// calendar-grid-geometry — the arithmetic the reservation rests on
// ---------------------------------------------------------------------------

test(
  'February 2027 starts on a Monday and needs exactly four rows',
  () => weekRowsInMonth({ year: 2027, month: 2 }),
  4
);

test(
  'November 2026 starts on a Sunday and needs six',
  () => weekRowsInMonth({ year: 2026, month: 11 }),
  6
);

test(
  'August 2026 starts on a Saturday and needs six',
  () => weekRowsInMonth({ year: 2026, month: 8 }),
  6
);

test('a leap February is 29 days, not 28', () => listRowsInMonth({ year: 2028, month: 2 }), 15);

test(
  'the two-column list is one row per two days',
  () =>
    [28, 30, 31].map((n) => Math.ceil(n / 2)).join(',') +
    '|' +
    [
      listRowsInMonth({ year: 2027, month: 2 }),
      listRowsInMonth({ year: 2026, month: 11 }),
      listRowsInMonth({ year: 2026, month: 8 }),
    ].join(','),
  '14,15,16|14,15,16'
);

test(
  'the reservation grows with the month and never collapses',
  () => {
    const short = calendarGridReservation({ year: 2027, month: 2 });
    const long = calendarGridReservation({ year: 2026, month: 8 });
    const ok =
      short.base > 0 &&
      short.md > 0 &&
      short.lg > 0 &&
      long.base > short.base &&
      long.md > short.md &&
      long.lg > short.lg;
    return ok;
  },
  true
);

test(
  'every month reserves more than the 576 px it used to',
  () => {
    const months = [];
    for (let y = 2026; y <= 2027; y++)
      for (let m = 1; m <= 12; m++) months.push({ year: y, month: m });
    return months.every((m) => {
      const r = calendarGridReservation(m);
      return r.base >= 576 && r.md >= 576 && r.lg >= 576;
    });
  },
  true
);

// ---------------------------------------------------------------------------
// calendar-segments — how far back the archive actually reaches
// ---------------------------------------------------------------------------

test(
  'the back window is the distance to the data start, not the full span',
  () => parkCalendarMonthsBack({ year: 2026, month: 8 }),
  7 // archive starts 2025-12-26 → first whole month is 2026-01 → seven months back
);

test(
  'a partial first month does not count',
  () => {
    // The archive starts on the 26th, so December 2025 is 6 of 31 days and has no honest heading.
    const dec = isParkCalendarMonthInRange({ year: 2025, month: 12 }, { year: 2026, month: 8 });
    const jan = isParkCalendarMonthInRange({ year: 2026, month: 1 }, { year: 2026, month: 8 });
    return `${dec}/${jan}`;
  },
  'false/true'
);

test(
  'the window grows on its own and then stops at the span',
  () =>
    [
      parkCalendarMonthsBack({ year: 2026, month: 12 }),
      parkCalendarMonthsBack({ year: 2027, month: 1 }),
      parkCalendarMonthsBack({ year: 2028, month: 6 }),
    ].join(','),
  `11,12,${PARK_CALENDAR_MONTH_SPAN.back}`
);

test(
  'it never goes negative before the archive exists',
  () => parkCalendarMonthsBack({ year: CALENDAR_DATA_START.year, month: 1 }),
  0
);

test(
  'the forward end is untouched by the data floor',
  () => {
    const now = { year: 2026, month: 8 };
    return `${isParkCalendarMonthInRange({ year: 2027, month: 8 }, now)}/${isParkCalendarMonthInRange({ year: 2027, month: 9 }, now)}`;
  },
  'true/false'
);

// ---------------------------------------------------------------------------

console.log(
  '\nCalendar month page — summary derivation and grid geometry\n' + '='.repeat(80) + '\n'
);

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `THREW: ${error.message}`;
  }
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
