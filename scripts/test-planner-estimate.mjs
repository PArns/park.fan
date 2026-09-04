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

// ── A park nobody can read is not a park with short queues ───────────────────
// The two land in the same branch and mean opposite things. `ASSUMED_WAIT_MIN`
// is for a ride with no HISTORY in a measured park — five minutes as a
// placeholder for a queue somebody could in principle count. A park with no
// SOURCE has no queue to count: Hansa-Park publishes its wait times only in its
// own app on the park WLAN, and /plan/day answers for it with `rides: []` and a
// drawn 11–21 axis, which is byte-for-byte what a measured park with no history
// looks like.
{
  const unknownRide = {
    id: 'c',
    attractionSlug: 'nichts',
    attractionName: 'Nichts',
    startMinute: 600,
  };

  const measured = dayWith();
  test(
    'eine Bahn ohne Kurve bekommt die Annahme',
    estimateFor(measured, unknownRide).missing,
    'assumed'
  );
  test('und damit eine Zahl', estimateFor(measured, unknownRide).wait, 5);

  const unreadable = dayWith({
    context: { liveWaitTimes: { available: false, reason: 'in_park_app_only' } },
  });
  test(
    'ohne lesbare Quelle wird nichts angenommen',
    estimateFor(unreadable, unknownRide).missing,
    'no-source'
  );
  test('und keine Zahl erfunden', estimateFor(unreadable, unknownRide).wait, null);
  // The day is still a day: the block's edge says which regime it stands in
  // even where there is no figure to draw inside it.
  test('der Tag wird trotzdem benannt', estimateFor(unreadable, unknownRide).tier, 'measured');

  // A ride the payload DOES carry still reports its figure. The flag is about
  // the source, and a park with an unreadable source that somehow answered for
  // a ride is answering about that ride.
  test(
    'eine Bahn mit Kurve bleibt eine Bahn mit Kurve',
    estimateFor(unreadable, ride(600)).wait,
    45
  );

  // The field ships in the API and this app deploys independently, so a payload
  // predating it has to behave exactly as it did — available, not refused.
  test(
    'ein fehlendes Feld heißt lesbar',
    estimateFor(dayWith({ context: {} }), unknownRide).missing,
    'assumed'
  );
  test(
    'available: true ebenso',
    estimateFor(
      dayWith({ context: { liveWaitTimes: { available: true, reason: null } } }),
      unknownRide
    ).missing,
    'assumed'
  );
}

// ── A day that ends after midnight ──────────────────────────────────────────
// `closeHour` is a wall-clock hour, so a park running 16:00–01:00 reports
// `closeHour: 1`, and `hour < openHour || hour > closeHour` is then true for
// EVERY hour of that day: 17:00 is not below 16 and is above 1. Every block
// came back `outside-hours`, the panel's foot totalled zero minutes and the
// optimizer ranked a whole night by walking distance while believing it was
// weighing queues. `buildDayGrid` had unfolded this since it was written — the
// two files simply held one rule in two copies, which is why the fix reads the
// grid's `unfoldedCloseHour` rather than restating it.
//
// Not hypothetical: on 2026-09-04 five of the API's 213 parks answered
// `/plan/day` with `closeHour < openHour` (La Ronde and Six Flags Mexico
// 10→0, Six Flags Qiddiya City 16→0), and on 2026-10-31 thirteen did, among
// them Gardaland, Cedar Point and Six Flags Magic Mountain at 10→1.
{
  const nightRide = (hours) => ({
    attractionSlug: 'taron',
    attractionName: 'Taron',
    hours,
    dayPeak: 60,
    sampleDays: 142,
    uncertaintyMinutes: 12,
    expectedError: 15.4,
  });
  // Where `hours[].hour` counts the clock, which is how `context.closeHour`
  // itself reports a midnight close.
  const clockNight = dayWith({
    context: { openHour: 16, closeHour: 1 },
    rides: [
      nightRide([
        { hour: 16, wait: 30 },
        { hour: 20, wait: 60 },
        { hour: 0, wait: 20 },
        { hour: 1, wait: 15 },
      ]),
    ],
  });

  test(
    'eine Stunde mitten am Abend trägt ihre Zahl',
    estimateFor(clockNight, ride(20 * 60)).wait,
    60
  );
  test(
    'und ist nicht außerhalb der Zeiten',
    estimateFor(clockNight, ride(20 * 60)).missing,
    'none'
  );
  // 00:30 sits at minute 1470 on the grid's axis, i.e. in hour 24.
  test('nach Mitternacht auch', estimateFor(clockNight, ride(1470)).wait, 20);
  test('und zwar als Zahl der Bahn', estimateFor(clockNight, ride(1470)).missing, 'none');
  // Before opening is still before opening.
  test(
    'vor der Öffnung bleibt draußen',
    estimateFor(clockNight, ride(15 * 60)).missing,
    'outside-hours'
  );

  // The two edges. `closeHour` is inclusive — the backend loops `h <= closeHour`
  // — so 01:00 (minute 1500) is the last hour that carries a figure and 02:00
  // (minute 1560) is the first that does not.
  test('die Öffnungsstunde selbst zählt', estimateFor(clockNight, ride(16 * 60)).wait, 30);
  test('die Schlussstunde selbst auch', estimateFor(clockNight, ride(1500)).wait, 15);
  test(
    'eine Stunde danach nicht mehr',
    estimateFor(clockNight, ride(1560)).missing,
    'outside-hours'
  );

  // Which of the two readings `hours[].hour` uses past midnight cannot be settled
  // from the API — on a wrapping day `/plan/day` ships no curve at all (Cedar
  // Point, 2026-09-12, 11:00–00:00: `rides: []`, against fourteen rides on
  // 2026-09-13 at 11:00–20:00, same tier, same lead) — so both are read.
  const axisNight = dayWith({
    context: { openHour: 16, closeHour: 1 },
    rides: [
      nightRide([
        { hour: 16, wait: 30 },
        { hour: 24, wait: 20 },
        { hour: 25, wait: 15 },
      ]),
    ],
  });
  test(
    'eine entfaltete Stundennummer wird auch gelesen',
    estimateFor(axisNight, ride(1470)).wait,
    20
  );
  test('und deren Schlussstunde ebenso', estimateFor(axisNight, ride(1500)).wait, 15);

  // The visible symptom, in the one number a visitor reads off the panel's foot.
  const totals = totalsFor(clockNight, [ride(20 * 60), { ...ride(1470), id: 'e' }]);
  test('der Abend summiert sich wieder', totals.expectedMinutes, 80);
  test('und nichts davon gilt als unbekannt', totals.unknown, 0);
}

// ── A park with ordinary hours may not move ─────────────────────────────────
// The regression this fix has to buy nothing at: with `closeHour > openHour`
// the unfolding is the identity, and `hour` never reaches 24, so the
// past-midnight lookup cannot fire either.
{
  const day = dayWith();
  test('die Öffnungsstunde trägt ihre Zahl', estimateFor(day, ride(9 * 60)).wait, 25);
  test('eine Minute davor nicht', estimateFor(day, ride(9 * 60 - 1)).missing, 'outside-hours');
  test('die Schlussstunde ist noch drin', estimateFor(day, ride(18 * 60)).missing, 'assumed');
  test('die Stunde danach nicht', estimateFor(day, ride(19 * 60)).missing, 'outside-hours');
  test(
    'und Mitternacht davor erst recht nicht',
    estimateFor(day, ride(0)).missing,
    'outside-hours'
  );

  // A stray `hour: 0` in a normal day's curve stays unreachable: it belongs to
  // an hour this park is shut, and the fallback is gated on the axis hour
  // rather than on the value in the payload.
  const strayMidnight = dayWith();
  strayMidnight.rides[0].hours = [...strayMidnight.rides[0].hours, { hour: 0, wait: 99 }];
  test(
    'eine Mitternachtszeile bleibt unerreichbar',
    estimateFor(strayMidnight, ride(0)).missing,
    'outside-hours'
  );
  test('und färbt keine andere Stunde', estimateFor(strayMidnight, ride(10 * 60)).wait, 45);
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
