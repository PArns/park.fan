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
  groupQuestions,
  hourTickIndexes,
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

test('differences carry their sign in German, a rate with three decimals', () => {
  assert.equal(formatDiff(-0.42, 'min'), '−0,42 min');
  assert.equal(formatDiff(0.26, 'min'), '+0,26 min');
  assert.equal(formatDiff(0.026, 'rate'), '+0,026');
  assert.equal(formatDiff(0, 'min'), '0,00 min');
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

console.log(`\n${passed} assertions passed.`);
