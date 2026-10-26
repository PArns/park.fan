/**
 * Unit tests for the admin model comparison helpers (`lib/admin/model-comparison.ts`) and the
 * sample payloads the page shows with `?beispiel=1`.
 *
 * Run: `pnpm test:model-comparison`
 */
import assert from 'node:assert/strict';
import {
  chartTop,
  dayMae,
  diffFavoursModel,
  formatDiff,
  formatError,
  groupQuestions,
  HOUR_LABEL_MIN_SPACING,
  hourTickIndexes,
  hourTicks,
  resolveDaySelection,
  suggestedOptionsDate,
  truthCoverage,
  matrixColumns,
  measuredDays,
  modelColors,
  splitSegments,
  whiskerGeometry,
} from '../lib/admin/model-comparison.ts';
import {
  FIXTURE_DAY_OPTIONS,
  FIXTURE_REPORT,
  fixtureDay,
} from '../lib/admin/model-comparison-fixture.ts';
import { matchesQuery } from '../lib/utils/text-fold.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('a model a cell names but the report does not list still gets a column', () => {
  const report = {
    ...FIXTURE_REPORT,
    questions: [
      {
        ...FIXTURE_REPORT.questions[0],
        cells: {
          ...FIXTURE_REPORT.questions[0].cells,
          moirai: FIXTURE_REPORT.questions[0].cells.fm,
        },
      },
    ],
  };
  const columns = matrixColumns(report);
  assert.equal(columns.at(-1).id, 'moirai');
  assert.equal(columns.at(-1).label, 'moirai');
  assert.equal(columns.length, FIXTURE_REPORT.models.length + 1);
});

test('questions are grouped in group order, and an unknown group is kept at the end', () => {
  const report = {
    ...FIXTURE_REPORT,
    questions: [
      ...FIXTURE_REPORT.questions,
      { ...FIXTURE_REPORT.questions[0], id: 'x', group: 'neu' },
    ],
  };
  const groups = groupQuestions(report);
  assert.deepEqual(
    groups.map((g) => g.id),
    ['live', 'today', 'planner', 'calendar', 'neu']
  );
  assert.equal(groups[0].questions.length, 2);
});

test('measured days count both ends and are zero without live data', () => {
  assert.equal(measuredDays({ days: 28, firstDate: '2026-10-10', lastDate: '2026-10-11' }), 2);
  assert.equal(measuredDays({ days: 28, firstDate: null, lastDate: null }), 0);
  assert.equal(measuredDays({ days: 28, firstDate: '2026-10-01', lastDate: '2026-10-14' }), 14);
});

test('differences carry their sign in German, a rate in percentage points', () => {
  assert.equal(formatDiff(-0.42, 'min'), '−0,42 min');
  assert.equal(formatDiff(0.26, 'min'), '+0,26 min');
  assert.equal(formatDiff(2.64, 'rate'), '+2,6 pp');
  assert.equal(formatDiff(-1.25, 'rate'), '−1,3 pp');
  assert.equal(formatDiff(0, 'min'), '0,00 min');
  assert.equal(formatError(31.24, 'rate'), '31,2 %');
  assert.equal(formatError(12.44, 'min'), '12,4');
});

test('which side of zero favours the model follows the metric direction', () => {
  assert.equal(diffFavoursModel(-0.3, true), true);
  assert.equal(diffFavoursModel(0.3, true), false);
  assert.equal(diffFavoursModel(0.026, false), true);
});

test('the whisker keeps zero centred and the interval inside the box', () => {
  const g = whiskerGeometry(-0.4, -1.1, 0.3, 280);
  assert.equal(g.zero, 140);
  assert.ok(g.low < g.point && g.point < g.zero && g.zero < g.high);
  assert.ok(g.low >= 0 && g.high <= 280);
  const swapped = whiskerGeometry(-0.4, 0.3, -1.1, 280);
  assert.equal(swapped.low, g.low);
});

test('a line breaks where the ride was down instead of bridging the outage', () => {
  assert.deepEqual(splitSegments([1, 2, null, null, 5, null, 7, 8]), [
    [
      [0, 1],
      [1, 2],
    ],
    [[4, 5]],
    [
      [6, 7],
      [7, 8],
    ],
  ]);
  assert.deepEqual(splitSegments([null, null]), []);
});

test('hour ticks fall on full hours and the axis top is a multiple of 20', () => {
  assert.deepEqual(hourTickIndexes(['09:00', '09:15', '09:30', '09:45', '10:00']), [0, 4]);
  assert.equal(chartTop([25, null, 81]), 100);
  assert.equal(chartTop([null, 10]), 60);
});

test('known models keep their colour, unknown ones get distinct fallbacks', () => {
  const colors = modelColors(['h5', 'neu-a', 'neu-b']);
  assert.match(colors.get('h5').stroke, /emerald/);
  assert.notEqual(colors.get('neu-a').stroke, colors.get('neu-b').stroke);
});

test('the day error skips quarters without a measured wait', () => {
  assert.deepEqual(dayMae([10, 20, 30], [12, null, 27]), { mae: 2.5, n: 2 });
  assert.equal(dayMae([10], [null]), null);
});

test('the sample summary matches its own cells', () => {
  const counts = { better: 0, pending: 0, unclear: 0, worse: 0 };
  for (const q of FIXTURE_REPORT.questions) {
    for (const cell of Object.values(q.cells)) if (cell.state !== 'today') counts[cell.state]++;
  }
  assert.deepEqual(FIXTURE_REPORT.summary, counts);
  assert.ok(FIXTURE_REPORT.questions.every((q) => q.leadLabel.length > 0));
});

test('the sample day has one value per slot and ranks the best model first', () => {
  const ride = FIXTURE_DAY_OPTIONS.parks[0].rides[0];
  const day = fixtureDay(ride.id, 'morning');
  assert.equal(day.slots.length, day.truth.length);
  for (const s of day.series) assert.equal(s.values.length, day.slots.length);
  const maes = day.scores.map((s) => s.mae);
  assert.deepEqual(
    maes,
    [...maes].sort((a, b) => a - b)
  );
  assert.equal(day.origin.localLabel, '10.10. um 06:05 Uhr');
  assert.deepEqual(day.openingHours, { open: '09:00', close: '18:00' });
});

test('an origin the sample did not archive comes back without series', () => {
  const day = fixtureDay('fixture-voltron', 'd3');
  assert.equal(day.series.length, 0);
  assert.equal(day.scores.length, 0);
});

/** Quarter-hour slots from `start` for `hours` hours, wrapping past midnight like the backend. */
function quarterSlots(start, hours) {
  return Array.from({ length: hours * 4 + 1 }, (_, i) => {
    const minutes = start * 60 + i * 15;
    const h = Math.floor(minutes / 60) % 24;
    return `${String(h).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  });
}

function assertSpaced(slots, ticks, plotWidth) {
  const perSlot = plotWidth / (slots.length - 1);
  for (let k = 1; k < ticks.length; k++) {
    assert.ok(
      (ticks[k] - ticks[k - 1]) * perSlot >= HOUR_LABEL_MIN_SPACING,
      `${slots[ticks[k - 1]]} and ${slots[ticks[k]]} are closer than the label spacing`
    );
  }
}

test('hour labels thin out until no two are closer than the label spacing', () => {
  // The screenshot: 06:00 to 03:00 is 21 hours, 22 labels.
  const slots = quarterSlots(6, 21);
  for (const width of [260, 400, 582, 900, 1400]) {
    const ticks = hourTicks(slots, width);
    assert.ok(ticks.length >= 2, `at least two labels at ${width} px`);
    assertSpaced(slots, ticks, width);
  }
  assert.equal(hourTicks(slots, 260).length < hourTicks(slots, 1400).length, true);
  // A short day on a wide chart keeps every hour.
  const short = quarterSlots(9, 9);
  assert.equal(hourTicks(short, 900).length, 10);
});

test('the thinned labels keep a whole-clock step', () => {
  const slots = quarterSlots(6, 21);
  const labels = hourTicks(slots, 400).map((i) => Number(slots[i].slice(0, 2)));
  const step = labels.length > 1 ? (labels[1] - labels[0] + 24) % 24 : 1;
  assert.ok([2, 3, 4, 6].includes(step), `step ${step}`);
  assert.ok(labels.every((h) => h % step === 0));
});

test('a window past midnight is labelled in order, not sorted by clock', () => {
  const slots = quarterSlots(20, 7);
  const labels = hourTicks(slots, 1000).map((i) => slots[i]);
  assert.deepEqual(labels, [
    '20:00',
    '21:00',
    '22:00',
    '23:00',
    '00:00',
    '01:00',
    '02:00',
    '03:00',
  ]);
  const thin = hourTicks(slots, 200);
  for (let k = 1; k < thin.length; k++) assert.ok(thin[k] > thin[k - 1]);
  assertSpaced(slots, thin, 200);
});

test('truth coverage takes the backend figure and counts it for an older response', () => {
  assert.equal(truthCoverage({ truth: [1, null], truthCoverage: 0.25 }), 0.25);
  assert.equal(truthCoverage({ truth: [1, null, null, 4] }), 0.5);
  assert.equal(truthCoverage({ truth: [null, null] }), 0);
  assert.equal(truthCoverage({ truth: [] }), 0);
});

test('the sample ride without measurements reports no coverage', () => {
  const day = fixtureDay('fixture-no-measurements', 'morning');
  assert.equal(truthCoverage(day), 0);
  assert.ok(truthCoverage(fixtureDay('fixture-voltron', 'morning')) > 0.5);
});

const OPTIONS = {
  date: '2026-10-10',
  dates: ['2026-10-10', '2026-10-09'],
  parks: [
    {
      id: 'a',
      name: 'Adventureland',
      timezone: 'America/Chicago',
      rides: [{ id: 'a1', name: 'Draken Falls', isHeadliner: false }],
    },
    {
      id: 'e',
      name: 'Europa-Park',
      timezone: 'Europe/Berlin',
      rides: [
        { id: 'e1', name: 'Atlantis', isHeadliner: false },
        { id: 'e2', name: 'Silver Star', isHeadliner: true },
        { id: 'e3', name: 'Voltron Nevera', isHeadliner: true },
      ],
    },
  ],
  origins: [{ id: 'morning', label: 'Morgens' }],
};
const NONE = { date: null, parkId: null, rideId: null };

test('the first view opens on the suggested day, park and ride', () => {
  const pick = resolveDaySelection(
    { ...OPTIONS, suggested: { date: '2026-10-10', parkId: 'e', attractionId: 'e3' } },
    NONE
  );
  assert.equal(pick.date, '2026-10-10');
  assert.equal(pick.park.id, 'e');
  assert.equal(pick.ride.id, 'e3');
});

test('without a suggestion the first park and its first headliner are used', () => {
  for (const options of [OPTIONS, { ...OPTIONS, suggested: null }]) {
    const pick = resolveDaySelection(options, NONE);
    assert.equal(pick.park.id, 'a');
    assert.equal(pick.ride.id, 'a1');
  }
  const europa = resolveDaySelection(OPTIONS, { ...NONE, parkId: 'e' });
  assert.equal(europa.ride.id, 'e2');
});

test('a suggestion for another day refetches that day before it is used', () => {
  const options = {
    ...OPTIONS,
    suggested: { date: '2026-10-09', parkId: 'e', attractionId: 'e3' },
  };
  assert.equal(suggestedOptionsDate(options), '2026-10-09');
  // Until then the parks on offer are the answered day's, so the suggested park is not taken.
  assert.equal(resolveDaySelection(options, NONE).park.id, 'a');
  assert.equal(
    suggestedOptionsDate({ ...options, suggested: { ...options.suggested, date: '2026-10-10' } }),
    null
  );
  assert.equal(suggestedOptionsDate(OPTIONS), null);
  assert.equal(
    suggestedOptionsDate({ ...options, suggested: { ...options.suggested, date: '2020-01-01' } }),
    null
  );
});

test('a new day keeps the park and ride it still has, else the first of the first park', () => {
  const kept = resolveDaySelection(OPTIONS, { date: '2026-10-09', parkId: 'e', rideId: 'e1' });
  assert.equal(kept.date, '2026-10-09');
  assert.equal(kept.ride.id, 'e1');
  const gone = resolveDaySelection(
    { ...OPTIONS, parks: [OPTIONS.parks[0]] },
    { date: '2026-10-09', parkId: 'e', rideId: 'e1' }
  );
  assert.equal(gone.park.id, 'a');
  assert.equal(gone.ride.id, 'a1');
  // A picked ride beats the suggestion.
  const picked = resolveDaySelection(
    { ...OPTIONS, suggested: { date: '2026-10-10', parkId: 'e', attractionId: 'e3' } },
    { date: null, parkId: 'e', rideId: 'e1' }
  );
  assert.equal(picked.ride.id, 'e1');
});

test('the search matches parts of a name, ignoring case and accents', () => {
  assert.ok(matchesQuery(['Phantasialand'], 'phanta'));
  assert.ok(matchesQuery(['Taron'], 'TARON'));
  assert.ok(matchesQuery(['Fårup Sommerland'], 'farup'));
  assert.ok(matchesQuery(['Efteling'], 'tel'));
  assert.ok(matchesQuery(['Parc Astérix'], 'asterix'));
  assert.ok(!matchesQuery(['Phantasialand'], 'europa'));
});

test('the search reads town and country, and every word has to match', () => {
  assert.ok(matchesQuery(['Europa-Park', 'Rust', 'Deutschland'], 'rust'));
  assert.ok(matchesQuery(['Europa-Park', 'Rust', 'Deutschland'], 'europa deutsch'));
  assert.ok(!matchesQuery(['Europa-Park', 'Rust', 'Deutschland'], 'europa frankreich'));
  assert.ok(matchesQuery(['Europa-Park', null, undefined], '  '));
});

console.log(`\n${passed} assertions passed.`);
