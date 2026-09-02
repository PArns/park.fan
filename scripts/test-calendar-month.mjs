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

import { rankOf, summarizeCalendarMonth } from '../lib/parks/calendar-month-summary.ts';
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
  parkCalendarMonthsForward,
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
  'ties are broken on the headliner wait, the one continuous value that arrives',
  () => {
    // Twenty days at `low` is what a weekday/weekend park looks like, and on the enum alone that
    // is twenty tied winners → suppressed. `crowdScore` would break it and is never sent (0 of 30
    // days from /calendar, 0 of 91 from /best-days); the headliner average is.
    const days = month(30, (i) => ({
      crowdLevel: i < 20 ? 'low' : 'high',
      headlinerForecast: { avgWait: i === 3 ? 10 : i < 20 ? 25 : 60, rides: [] },
    }));
    return summarizeCalendarMonth(days, '2026-12-01', TZ)
      .quietest.map((d) => d.date)
      .join(',');
  },
  '2026-11-04'
);

test(
  'the bucket always outranks the wait — a busy day with short queues is not a quiet day',
  () => {
    // `moderate` + 0 min must still sort above `low` + 119 min, or one outlier promotes a day
    // out of its own crowd bucket.
    const low = rankOf({ headlinerForecast: { avgWait: 119, rides: [] } }, 1);
    const moderate = rankOf({ headlinerForecast: { avgWait: 0, rides: [] } }, 2);
    return low < moderate;
  },
  true
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
  'the hours floor counts the month, not the days that published hours',
  () => {
    // Three of thirty open days carry hours, all identical. Against the days-with-hours the
    // pattern scores 3/3 and „meist von 09:00 bis 18:00 Uhr" goes out on a tenth of the month.
    const days = month(30, (i) =>
      i < 3 ? hoursAt(`2026-11-0${i + 1}`, '08', '17') : { crowdLevel: 'moderate' }
    );
    return summarizeCalendarMonth(days, '2026-12-01', TZ).hours;
  },
  null
);

test(
  'a pattern that really does cover the month still prints',
  () => {
    const days = month(30, (i) =>
      i < 25 ? hoursAt(`2026-11-${String(i + 1).padStart(2, '0')}`, '08', '17') : {}
    );
    const h = summarizeCalendarMonth(days, '2026-12-01', TZ).hours;
    return `${h.openingTime}-${h.closingTime}`;
  },
  '09:00-18:00'
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
  'the current month ranks only days that are still ahead',
  () => {
    // Today is the 15th. The 3rd was the quietest day of the month and is over; the sentence is
    // in the future tense, so it must name the quietest day still to come. Ranking the whole
    // month is also what made the summary disagree with the entry tile above it.
    const days = month(30, (i) => ({
      crowdLevel: i === 2 ? 'very_low' : i === 20 ? 'low' : 'high',
      isToday: i === 14,
    }));
    return summarizeCalendarMonth(days, '2026-11-15', TZ)
      .quietest.map((d) => d.date)
      .join(',');
  },
  '2026-11-21'
);

test(
  'a finished month still ranks all of it',
  () => {
    const days = month(30, (i) => ({ crowdLevel: i === 2 ? 'very_low' : 'high' }));
    const s = summarizeCalendarMonth(days, '2026-12-01', TZ);
    return `${s.isPast}/${s.quietest.map((d) => d.date).join(',')}`;
  },
  'true/2026-11-03'
);

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
  // Has to be read close to the data start now that the span is three: from 2026-05 onwards the
  // SPAN is the binding constraint and this test would pass without proving anything about the
  // floor. In March 2026 the archive is still the shorter of the two.
  () => parkCalendarMonthsBack({ year: 2026, month: 3 }),
  2 // archive starts 2025-12-26 → first whole month is 2026-01 → two months back
);

test(
  'a partial first month does not count',
  () => {
    // The archive starts on the 26th, so December 2025 is 6 of 31 days and has no honest heading.
    // `now` sits three months after the start so January is inside the span and the only thing
    // that can exclude December is the partial-month floor — which is what this asserts.
    const dec = isParkCalendarMonthInRange({ year: 2025, month: 12 }, { year: 2026, month: 3 });
    const jan = isParkCalendarMonthInRange({ year: 2026, month: 1 }, { year: 2026, month: 3 });
    return `${dec}/${jan}`;
  },
  'false/true'
);

test(
  'the window grows on its own and then stops at the span',
  // The growth is only visible in the months right after the data start now — with a span of
  // three it saturates at 2026-04 instead of 2027-01. Same property, read where it still shows.
  () =>
    [
      parkCalendarMonthsBack({ year: 2026, month: 2 }),
      parkCalendarMonthsBack({ year: 2026, month: 3 }),
      parkCalendarMonthsBack({ year: 2026, month: 4 }),
      parkCalendarMonthsBack({ year: 2028, month: 6 }),
    ].join(','),
  `1,2,${PARK_CALENDAR_MONTH_SPAN.back},${PARK_CALENDAR_MONTH_SPAN.back}`
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

// --- forward edge: what the park's published schedule can actually speak for ----------------
//
// The API does not fall silent past the end of a schedule, it answers — with `CLOSED` for every
// day at a seasonal park (Phantasialand, all of July 2027, mid-season) and with the constant
// `moderate` fallback and no hours at a year-round one (Disneyland Paris, same month). Both are
// pages that should not exist, so the forward edge follows coverage instead of a constant.
//
// The refusals matter more than the happy path here, exactly as above: narrowing on absent data
// would delete a year of pages the first time a cache came back without the field.

test(
  'coverage inside the span shortens the forward edge to the month the last row falls in',
  () => parkCalendarMonthsForward({ year: 2026, month: 8 }, '2027-01-24'),
  5
);

test(
  'a partially covered month still counts — coverage on the 1st reaches that month',
  () => parkCalendarMonthsForward({ year: 2026, month: 8 }, '2026-10-01'),
  2
);

test(
  'coverage beyond the span is capped by the span, not extended by it',
  () => parkCalendarMonthsForward({ year: 2026, month: 8 }, '2030-01-01'),
  PARK_CALENDAR_MONTH_SPAN.forward
);

test(
  'coverage already in the past yields zero forward months, never a negative',
  () => parkCalendarMonthsForward({ year: 2026, month: 8 }, '2026-03-15'),
  0
);

test(
  'null coverage (park publishes no schedule) keeps the old span',
  () => parkCalendarMonthsForward({ year: 2026, month: 8 }, null),
  PARK_CALENDAR_MONTH_SPAN.forward
);

test(
  'absent coverage (payload cached before the field shipped) keeps the old span',
  () => parkCalendarMonthsForward({ year: 2026, month: 8 }, undefined),
  PARK_CALENDAR_MONTH_SPAN.forward
);

test(
  'a malformed date is treated as no answer rather than as month zero',
  () => parkCalendarMonthsForward({ year: 2026, month: 8 }, 'soon'),
  PARK_CALENDAR_MONTH_SPAN.forward
);

test(
  'the range check follows coverage: Phantasialand serves January 2027 and refuses February',
  () => {
    const now = { year: 2026, month: 8 };
    const jan = isParkCalendarMonthInRange({ year: 2027, month: 1 }, now, '2027-01-24');
    const feb = isParkCalendarMonthInRange({ year: 2027, month: 2 }, now, '2027-01-24');
    return `${jan}/${feb}`;
  },
  'true/false'
);

test(
  'the range check without coverage behaves exactly as before',
  () => {
    const now = { year: 2026, month: 8 };
    return `${isParkCalendarMonthInRange({ year: 2027, month: 8 }, now)}/${isParkCalendarMonthInRange({ year: 2027, month: 9 }, now)}`;
  },
  'true/false'
);

test(
  'coverage never widens the BACK edge — the data floor still owns it',
  () => {
    const now = { year: 2026, month: 8 };
    // A park covered since 2024 does not get 2025 months: the archive floor is a separate limit.
    return isParkCalendarMonthInRange({ year: 2025, month: 6 }, now, '2027-01-24');
  },
  false
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
