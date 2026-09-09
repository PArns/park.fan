/**
 * Unit tests for `lib/parks/day-comparison.ts`.
 *
 * What is worth pinning here is the same thing `test-calendar-month.mjs` pins: the REFUSALS. A
 * verdict that names a winner is a claim printed above two calendar days, and the ways it can be
 * wrong are all ways of reading noise or missing data as an answer —
 *
 *   - a closed day never wins, however good its numbers look
 *   - a day in the past never wins
 *   - two days a few minutes apart are a tie, not a slight winner
 *   - half a crowd bucket apart is `clear`, less is `slight`
 *   - a field missing on one side drops the row instead of making that side look better
 *   - a price row needs both prices AND one currency
 *
 * Run: pnpm test:day-comparison
 */

import { CLEAR_MARGIN, TIE_MARGIN, compareDays } from '../lib/parks/day-comparison.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

const TODAY = '2026-09-09';

/** One calendar day. Defaults describe an ordinary open day with a forecast. */
const day = (date, over = {}) => ({
  date,
  status: 'OPERATING',
  isToday: false,
  crowdLevel: 'moderate',
  isHoliday: false,
  isBridgeDay: false,
  isSchoolVacation: false,
  headlinerForecast: { avgWait: 30, rides: [] },
  hours: { openingTime: '10:00', closingTime: '18:00', type: 'OPERATING', isInferred: false },
  ...over,
});

const reason = (result, key) => result.reasons.find((r) => r.key === key) ?? null;

// --------------------------------------------------------------- clear winner

const clear = compareDays(
  day('2026-09-20', { crowdLevel: 'low', headlinerForecast: { avgWait: 20, rides: [] } }),
  day('2026-09-21', { crowdLevel: 'high', headlinerForecast: { avgWait: 70, rides: [] } }),
  TODAY
);
test('clear winner: the quieter day wins', () => clear.better, 'a');
test('clear winner: confidence is clear', () => clear.confidence, 'clear');
test('clear winner: the crowd row names the same side', () => reason(clear, 'crowd')?.better, 'a');
test(
  'clear winner: the wait row keeps both numbers',
  () => {
    const r = reason(clear, 'wait');
    return `${r.a}/${r.b}/${r.delta}`;
  },
  '20/70/50'
);
test('clear winner: reasons are sorted heaviest first', () => clear.reasons[0].key, 'crowd');
test('clear winner: nothing is blocked', () => clear.blockers.length, 0);

// -------------------------------------------------------------- slight winner
// One bucket apart would be a full 1.0 and therefore clear, so a slight win has to come out of
// the WAIT alone: 30 vs 55 minutes is 25/120 = 0.208 of a bucket — above TIE_MARGIN, below
// CLEAR_MARGIN.

const slight = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 30, rides: [] } }),
  day('2026-09-21', { headlinerForecast: { avgWait: 55, rides: [] } }),
  TODAY
);
test('slight winner: still names the quieter day', () => slight.better, 'a');
test('slight winner: confidence is slight', () => slight.confidence, 'slight');
test(
  'slight winner: the crowd row is a tie and carries no weight',
  () => `${reason(slight, 'crowd').better}/${reason(slight, 'crowd').weight}`,
  'tie/0'
);

// ---------------------------------------------------------------------- ties

const tie = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 30, rides: [] } }),
  day('2026-09-21', { headlinerForecast: { avgWait: 35, rides: [] } }),
  TODAY
);
test('tie: five minutes of queue is not a winner', () => tie.better, 'tie');
test('tie: confidence says so', () => tie.confidence, 'tie');
test('tie: the wait row still reports the difference', () => reason(tie, 'wait').delta, 5);

const identical = compareDays(day('2026-09-20'), day('2026-09-21'), TODAY);
test('tie: two identical days', () => identical.better, 'tie');
test(
  'tie: every row of two identical days is a tie',
  () => identical.reasons.every((r) => r.better === 'tie'),
  true
);

// The two margins are the boundaries they claim to be, checked from both sides. 30 and 90 minutes
// are 0.25 and 0.75 of a bucket — both exact in binary, so the gap is exactly CLEAR_MARGIN and
// the assertion is about the rule rather than about floating-point luck.
test('margin: CLEAR_MARGIN is half a crowd bucket', () => CLEAR_MARGIN, 0.5);
test('margin: TIE_MARGIN is a tenth of one', () => TIE_MARGIN, 0.1);
const atClear = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 30, rides: [] } }),
  day('2026-09-21', { headlinerForecast: { avgWait: 90, rides: [] } }),
  TODAY
);
test('margin: exactly CLEAR_MARGIN apart is clear', () => atClear.confidence, 'clear');
const underClear = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 30, rides: [] } }),
  day('2026-09-21', { headlinerForecast: { avgWait: 85, rides: [] } }),
  TODAY
);
test('margin: just under it is only slight', () => underClear.confidence, 'slight');
const underTie = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 30, rides: [] } }),
  day('2026-09-21', { headlinerForecast: { avgWait: 36, rides: [] } }),
  TODAY
);
test('margin: under TIE_MARGIN is a tie', () => underTie.better, 'tie');

// ------------------------------------------------------------------- blockers

const closed = compareDays(
  day('2026-09-20', {
    status: 'CLOSED',
    crowdLevel: 'closed',
    // Deliberately the "better" numbers: a closed day must not win on them.
    headlinerForecast: { avgWait: 5, rides: [] },
  }),
  day('2026-09-21', { crowdLevel: 'very_high', headlinerForecast: { avgWait: 90, rides: [] } }),
  TODAY
);
test('closed: the shut day never wins', () => closed.better, 'b');
test('closed: the verdict is clear, not slight', () => closed.confidence, 'clear');
test(
  'closed: the reason is reported on the right side',
  () => closed.blockers.map((x) => `${x.key}:${x.side}`).join(','),
  'closed:a'
);

const past = compareDays(
  day('2026-09-01', { crowdLevel: 'very_low', headlinerForecast: { avgWait: 5, rides: [] } }),
  day('2026-09-21', { crowdLevel: 'high', headlinerForecast: { avgWait: 80, rides: [] } }),
  TODAY
);
test('past: a day already gone never wins', () => past.better, 'b');
test(
  'past: and says why',
  () => past.blockers.some((x) => x.key === 'past' && x.side === 'a'),
  true
);

const bothClosed = compareDays(
  day('2026-09-20', { status: 'CLOSED', crowdLevel: 'closed' }),
  day('2026-09-21', { status: 'CLOSED', crowdLevel: 'closed' }),
  TODAY
);
test('both closed: no winner', () => bothClosed.better, 'tie');
test(
  'both closed: one entry for the shared fault, not two',
  () =>
    bothClosed.blockers
      .filter((x) => x.key === 'closed')
      .map((x) => x.side)
      .join(','),
  'tie'
);

// Today itself is not in the past — the boundary the park-timezone `todayIso` exists for.
const todayVsLater = compareDays(
  day(TODAY, { crowdLevel: 'low', headlinerForecast: { avgWait: 20, rides: [] } }),
  day('2026-09-21', { crowdLevel: 'high', headlinerForecast: { avgWait: 70, rides: [] } }),
  TODAY
);
test('today is not past', () => todayVsLater.blockers.length, 0);
test('today can win', () => todayVsLater.better, 'a');

// ---------------------------------------------------------- missing forecasts

const noForecast = compareDays(
  day('2026-09-20', { crowdLevel: 'unknown', headlinerForecast: undefined }),
  day('2026-09-21', { crowdLevel: 'unknown', headlinerForecast: undefined }),
  TODAY
);
test('no forecast on either side: no winner', () => noForecast.better, 'tie');
test(
  'no forecast on either side: reported once, for both',
  () =>
    noForecast.blockers
      .filter((x) => x.key === 'no-forecast')
      .map((x) => x.side)
      .join(','),
  'tie'
);
test('no forecast: no wait row is invented', () => reason(noForecast, 'wait'), null);
test('no forecast: no crowd row either', () => reason(noForecast, 'crowd'), null);

const oneSided = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 30, rides: [] } }),
  day('2026-09-21', { headlinerForecast: undefined, avgWaitTime: undefined }),
  TODAY
);
test('one-sided wait: the row is dropped, not half-filled', () => reason(oneSided, 'wait'), null);
test(
  'one-sided wait: the crowd row survives, both days still have a bucket',
  () => reason(oneSided, 'crowd')?.better,
  'tie'
);

// The legacy field still counts where a payload does send it.
const legacyWait = compareDays(
  day('2026-09-20', { headlinerForecast: undefined, avgWaitTime: 20 }),
  day('2026-09-21', { headlinerForecast: undefined, avgWaitTime: 80 }),
  TODAY
);
test('avgWaitTime is the documented fallback', () => reason(legacyWait, 'wait')?.a, 20);

// ---------------------------------------------------------------------- price

const onePrice = compareDays(
  day('2026-09-20', { ticket: { price: { amount: 49, currency: 'EUR' } } }),
  day('2026-09-21'),
  TODAY
);
test('price: one side only means no price row', () => reason(onePrice, 'price'), null);
test('price: and no currency on the result', () => onePrice.currency, undefined);

const twoPrices = compareDays(
  day('2026-09-20', { ticket: { price: { amount: 49, currency: 'EUR' } } }),
  day('2026-09-21', { ticket: { price: { amount: 62, currency: 'EUR' } } }),
  TODAY
);
test('price: the cheaper day wins the row', () => reason(twoPrices, 'price')?.better, 'a');
test('price: the difference is kept', () => reason(twoPrices, 'price')?.delta, 13);
test('price: the currency travels with it', () => twoPrices.currency, 'EUR');
test('price: it never moves the verdict on its own', () => reason(twoPrices, 'price')?.weight, 0);

const mixedCurrency = compareDays(
  day('2026-09-20', { ticket: { price: { amount: 49, currency: 'EUR' } } }),
  day('2026-09-21', { ticket: { price: { amount: 62, currency: 'USD' } } }),
  TODAY
);
test('price: two currencies is not a comparison', () => reason(mixedCurrency, 'price'), null);

// ---------------------------------------------------------------------- hours

const hours = compareDays(
  day('2026-09-20', {
    hours: { openingTime: '09:00', closingTime: '20:00', type: 'OPERATING', isInferred: false },
  }),
  day('2026-09-21', {
    hours: { openingTime: '10:00', closingTime: '18:00', type: 'OPERATING', isInferred: false },
  }),
  TODAY
);
test('hours: the longer day wins the row', () => reason(hours, 'hours')?.better, 'a');
test(
  'hours: measured in minutes',
  () => `${reason(hours, 'hours').a}/${reason(hours, 'hours').b}`,
  '660/480'
);

const pastMidnight = compareDays(
  day('2026-09-20', {
    hours: { openingTime: '10:00', closingTime: '01:00', type: 'OPERATING', isInferred: false },
  }),
  day('2026-09-21', {
    hours: { openingTime: '10:00', closingTime: '18:00', type: 'OPERATING', isInferred: false },
  }),
  TODAY
);
test(
  'hours: a closing time after midnight is a long day, not a negative one',
  () => reason(pastMidnight, 'hours').a,
  900
);

const isoHours = compareDays(
  day('2026-09-20', {
    hours: {
      openingTime: '2026-09-20T09:00:00+02:00',
      closingTime: '2026-09-20T20:00:00+02:00',
      type: 'OPERATING',
      isInferred: false,
    },
  }),
  day('2026-09-21', {
    hours: { openingTime: '10:00', closingTime: '18:00', type: 'OPERATING', isInferred: false },
  }),
  TODAY
);
test('hours: a full ISO instant reads as its clock time', () => reason(isoHours, 'hours').a, 660);

const noHours = compareDays(day('2026-09-20', { hours: undefined }), day('2026-09-21'), TODAY);
test('hours: missing on one side drops the row', () => reason(noHours, 'hours'), null);

// -------------------------------------------------------------------- weather

const rain = compareDays(
  day('2026-09-20', {
    weather: { condition: 'rain', icon: 1, tempMin: 12, tempMax: 18, rainChance: 9 },
  }),
  day('2026-09-21', {
    weather: { condition: 'clear', icon: 2, tempMin: 14, tempMax: 24, rainChance: 0 },
  }),
  TODAY
);
test('weather: the drier day wins the row', () => reason(rain, 'weather')?.better, 'b');
test('weather: millimetres, not per cent', () => reason(rain, 'weather')?.unit, 'mm');
test('weather: it never moves the verdict — the two days still tie', () => rain.better, 'tie');

const precipitationWins = compareDays(
  day('2026-09-20', {
    weather: {
      condition: 'rain',
      icon: 1,
      tempMin: 12,
      tempMax: 18,
      rainChance: 9,
      precipitationMm: 4,
    },
  }),
  day('2026-09-21', {
    weather: { condition: 'clear', icon: 2, tempMin: 14, tempMax: 24, rainChance: 0 },
  }),
  TODAY
);
test(
  'weather: the explicit precipitationMm is preferred over the legacy name',
  () => reason(precipitationWins, 'weather').a,
  4
);

// -------------------------------------------------------------------- holiday

const holiday = compareDays(
  day('2026-09-20', { isPublicHoliday: true, isSchoolVacation: true, isBridgeDay: true }),
  day('2026-09-21'),
  TODAY
);
test('holiday: the unencumbered day wins the row', () => reason(holiday, 'holiday')?.better, 'b');
test('holiday: flags are counted, not scored', () => reason(holiday, 'holiday').a, 3);
test(
  'holiday: neighbouring regions count once, however many there are',
  () =>
    compareDays(
      day('2026-09-20', {
        neighborHolidays: [{ name: 'x' }, { name: 'y' }, { name: 'z' }],
      }),
      day('2026-09-21'),
      TODAY
    ).reasons.find((r) => r.key === 'holiday').a,
  1
);

// ------------------------------------------- regressions caught by /code-review

// A day whose crowd level is not on the scale cannot be RANKED, even when a wait time did arrive.
// This came back as "the two days are equal" printed above a wait row with a 70-minute gap.
const noBucketButWait = compareDays(
  day('2026-09-20', { crowdLevel: 'unknown', headlinerForecast: { avgWait: 20, rides: [] } }),
  day('2026-09-21', { crowdLevel: 'high', headlinerForecast: { avgWait: 90, rides: [] } }),
  TODAY
);
test('unrated crowd level: the rated day wins', () => noBucketButWait.better, 'b');
test(
  'unrated crowd level: and it is reported rather than shrugged off',
  () =>
    noBucketButWait.blockers
      .filter((x) => x.key === 'no-forecast')
      .map((x) => x.side)
      .join(','),
  'a'
);
test(
  'unrated crowd level: the wait row still shows both numbers',
  () => `${reason(noBucketButWait, 'wait').a}/${reason(noBucketButWait, 'wait').b}`,
  '20/90'
);

// A closed day has no forecast by definition — one line, not two.
test(
  'closed: no second blocker for the forecast it cannot have',
  () => closed.blockers.map((x) => x.key).join(','),
  'closed'
);

// `rankOf` reads only `headlinerForecast.avgWait`; this module also reports `avgWaitTime`. A
// verdict computed without the fallback contradicted the row above it.
const legacyGap = compareDays(
  day('2026-09-20', { headlinerForecast: undefined, avgWaitTime: 15 }),
  day('2026-09-21', { headlinerForecast: undefined, avgWaitTime: 90 }),
  TODAY
);
test('legacy wait: the verdict follows the row', () => legacyGap.better, 'a');
test('legacy wait: and calls a 75-minute gap clear', () => legacyGap.confidence, 'clear');
test(
  'legacy wait: the row and the verdict agree on the side',
  () => reason(legacyGap, 'wait').better,
  'a'
);

// Mixed sources still rank on one scale: A on the headliner field, B on the legacy one.
const mixedSources = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 15, rides: [] } }),
  day('2026-09-21', { headlinerForecast: undefined, avgWaitTime: 90 }),
  TODAY
);
test('mixed wait sources: still a verdict', () => mixedSources.better, 'a');

// A day whose `status` and `crowdLevel` disagree: the park has closed since the forecast was
// made. Reading only the level built a crowd row and ticked the shut day.
const staleLevel = compareDays(
  day('2026-09-20', { status: 'CLOSED', crowdLevel: 'very_low' }),
  day('2026-09-21', { crowdLevel: 'high' }),
  TODAY
);
test('stale level on a closed day: no crowd row at all', () => reason(staleLevel, 'crowd'), null);
test('stale level on a closed day: the open day wins', () => staleLevel.better, 'b');
test(
  'stale level on a closed day: still exactly one blocker',
  () => staleLevel.blockers.map((x) => `${x.key}:${x.side}`).join(','),
  'closed:a'
);

// A headliner forecast of exactly 0 is not a wait: `waitOf` rejects it, so the verdict must not
// score it either. It used to, and the dialog then claimed a clear winner over four tied rows.
const zeroWait = compareDays(
  day('2026-09-20', { headlinerForecast: { avgWait: 0, rides: [] } }),
  day('2026-09-21', { headlinerForecast: { avgWait: 60, rides: [] } }),
  TODAY
);
test('a wait of 0 produces no row', () => reason(zeroWait, 'wait'), null);
test('a wait of 0 does not decide the verdict either', () => zeroWait.better, 'tie');

// A status the park has not published cannot be recommended, whatever crowd level survived on it.
const unknownStatus = compareDays(
  day('2026-09-20', { status: 'UNKNOWN', crowdLevel: 'very_low' }),
  day('2026-09-21', { crowdLevel: 'high' }),
  TODAY
);
test('unknown status: the day with a status wins', () => unknownStatus.better, 'b');
test(
  'unknown status: and it is on the record, so the missing plan button has a reason',
  () =>
    unknownStatus.blockers
      .filter((x) => x.key === 'no-forecast')
      .map((x) => x.side)
      .join(','),
  'a'
);

// „10:00-10:00" reads as a full day and as an empty one; neither may be asserted.
const sameClock = compareDays(
  day('2026-09-20', {
    hours: { openingTime: '10:00', closingTime: '10:00', type: 'OPERATING', isInferred: false },
  }),
  day('2026-09-21'),
  TODAY
);
test(
  'hours: open and close at the same time is not a 24-hour day',
  () => reason(sameClock, 'hours'),
  null
);

// ---------------------------------------------------------------------------

console.log('\nCalendar day comparison — verdict, rows and refusals\n' + '='.repeat(80) + '\n');

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
