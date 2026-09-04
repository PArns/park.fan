/**
 * Unit tests for what a planned entry is expected to cost
 * (`lib/planner/estimate.ts`).
 *
 * The property under test is which REGIME a figure came from. The block's lower
 * edge is drawn from it — a hard end for a measurement, a fade for a
 * composition — and `/plan/day` reports it in two places: `tier` for the day and
 * `hours[].source` for the hours that depart from it. Today is exactly that
 * case: 50 of Phantasialand's 254 hourly points on 2026-09-04 are `composed`
 * under a `measured` day, because the window the model measures does not cover
 * the whole operating day. Read the day's tier there and fifty composed hours
 * are drawn as if somebody had measured them.
 *
 * Run: pnpm test:planner-estimate
 */

import {
  ASSUMED_WAIT_MIN,
  estimateFor,
  occupiedMinutes,
  totalsFor,
} from '../lib/planner/estimate.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

/** A day shaped like the API's, with the fields these rules read. */
const dayWith = (overrides = {}) => ({
  parkSlug: 'phantasialand',
  timezone: 'Europe/Berlin',
  context: {
    date: '2026-09-04',
    status: 'OPERATING',
    openHour: 9,
    closeHour: 18,
    ...overrides.context,
  },
  tier: 'measured',
  leadDays: 0,
  rides: [
    {
      attractionSlug: 'taron',
      attractionName: 'Taron',
      hours: [
        { hour: 9, wait: 25 },
        { hour: 10, wait: 45 },
        // The exception the day's tier does not cover.
        { hour: 17, wait: 50, source: 'composed' },
      ],
      dayPeak: 50,
      sampleDays: 142,
      uncertaintyMinutes: 12,
      expectedError: 15.4,
    },
  ],
  shows: [],
  ...overrides,
});

const ride = (startMinute) => ({
  id: 'a',
  attractionSlug: 'taron',
  attractionName: 'Taron',
  startMinute,
});

// ── The hour's regime, not the day's ─────────────────────────────────────────
{
  const day = dayWith();
  test('eine Stunde ohne eigene Quelle erbt den Tag', estimateFor(day, ride(600)).tier, 'measured');
  test('eine Stunde mit eigener Quelle behält sie', estimateFor(day, ride(1020)).tier, 'composed');
  // The figures themselves are untouched by the regime: the exception says where
  // the number came from, never what it is.
  test('die Zahl bleibt die der Stunde', estimateFor(day, ride(1020)).wait, 50);
  test('und die der anderen auch', estimateFor(day, ride(600)).wait, 45);
}

// ── A day whose tier is not `measured` ───────────────────────────────────────
{
  const day = dayWith({ tier: 'composed' });
  test('ohne Ausnahme gilt der Tag', estimateFor(day, ride(600)).tier, 'composed');
  // An hour CAN also be better than its day — the 24-hour window covers the
  // start of tomorrow — and the exception is read the same way in both
  // directions.
  const better = dayWith({ tier: 'composed' });
  better.rides[0].hours = [{ hour: 10, wait: 45, source: 'measured' }];
  test('eine bessere Stunde zählt genauso', estimateFor(better, ride(600)).tier, 'measured');
}

// ── The states with no figure still name their day ───────────────────────────
{
  const day = dayWith();
  test(
    'ein eigener Block trägt den Tag',
    estimateFor(day, {
      id: 'b',
      custom: { label: 'Pause', icon: 'break', durationMinutes: 45 },
      startMinute: 720,
    }).tier,
    'measured'
  );
  test('außerhalb der Öffnungszeit auch', estimateFor(day, ride(1260)).tier, 'measured');
  test(
    'und eine Bahn ohne Kurve ebenso',
    estimateFor(day, {
      id: 'c',
      attractionSlug: 'nichts',
      attractionName: 'Nichts',
      startMinute: 600,
    }).tier,
    'measured'
  );
  test('ohne Tag gibt es keine', estimateFor(null, ride(600)).tier, null);
}

// ── The rest of the contract, which this file now owns ───────────────────────
{
  const day = dayWith();
  test(
    'eine Bahn ohne Kurve wird angenommen',
    estimateFor(day, {
      id: 'c',
      attractionSlug: 'nichts',
      attractionName: 'Nichts',
      startMinute: 600,
    }).missing,
    'assumed'
  );
  test(
    'und zwar mit fünf Minuten',
    estimateFor(day, {
      id: 'c',
      attractionSlug: 'nichts',
      attractionName: 'Nichts',
      startMinute: 600,
    }).wait,
    ASSUMED_WAIT_MIN
  );
  // An assumption has no model behind it, so it has neither a spread nor a
  // measured error. A zero there would be the most confident-looking mark on
  // the least certain row.
  test(
    'eine Annahme hat keine Streuung',
    estimateFor(day, {
      id: 'c',
      attractionSlug: 'nichts',
      attractionName: 'Nichts',
      startMinute: 600,
    }).uncertaintyMinutes,
    null
  );
  test(
    'und keinen gemessenen Fehler',
    estimateFor(day, {
      id: 'c',
      attractionSlug: 'nichts',
      attractionName: 'Nichts',
      startMinute: 600,
    }).expectedError,
    null
  );
  test(
    'ein eigener Block ist keine Prognose',
    estimateFor(day, {
      id: 'b',
      custom: { label: 'Pause', icon: 'break', durationMinutes: 45 },
      startMinute: 720,
    }).missing,
    'custom'
  );
  test('der Fehler der Bahn kommt durch', estimateFor(day, ride(600)).expectedError, 15.4);
  test('die Streuung der Bahn auch', estimateFor(day, ride(600)).uncertaintyMinutes, 12);
  // A day with no published hours has no honest axis and therefore no figure.
  const noHours = dayWith({ context: { openHour: null, closeHour: null } });
  test('ohne Öffnungszeiten keine Zahl', estimateFor(noHours, ride(600)).missing, 'no-day');
}

// ── Occupied minutes and the day's totals ────────────────────────────────────
{
  const day = dayWith();
  test('ein Block belegt Wartezeit plus Streuung', occupiedMinutes(day, ride(600)), 45 + 12);
  test(
    'ein eigener Block belegt seine Dauer',
    occupiedMinutes(day, {
      id: 'b',
      custom: { label: 'Pause', icon: 'break', durationMinutes: 45 },
      startMinute: 720,
    }),
    45
  );
  test(
    'ein abgehakter Block belegt, was war',
    occupiedMinutes(day, { ...ride(600), done: true, actualWait: 30 }),
    30
  );

  const totals = totalsFor(day, [
    ride(600),
    { ...ride(540), id: 'd', done: true, actualWait: 20 },
    { id: 'b', custom: { label: 'Pause', icon: 'break', durationMinutes: 45 }, startMinute: 720 },
  ]);
  test('erwartet zählt nur die offenen Bahnen', totals.expectedMinutes, 45);
  test('gemessen zählt nur die abgehakten', totals.actualMinutes, 20);
  test('ein eigener Block landet nicht bei unbekannt', totals.unknown, 0);
  test('sondern bei den eigenen Blöcken', totals.custom, 1);
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
