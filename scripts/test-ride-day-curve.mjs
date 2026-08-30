/**
 * Unit tests for the ride day curve's geometry (`lib/utils/ride-day-curve-geometry.ts`).
 *
 * Two of these pin bugs that actually shipped in the first draft of the chart:
 * an axis that ticked its last hour twice on a day whose length is a multiple of
 * three, and a band whose polygon could close across a gap. The rest guard the
 * cases the catalogue really contains — a park that opens at 11, a ride with a
 * hole in the middle of its day, a walk-on whose every reading is zero, and a
 * flat ride that must not report its whole day as two quiet windows.
 *
 * Run: pnpm test:ride-day-curve
 */

import {
  axisHours,
  bandPath,
  linePath,
  makeScales,
  niceMax,
  peakOf,
  quietWindows,
  PAD_L,
  PAD_R,
  VIEW_W,
} from '../lib/utils/ride-day-curve-geometry.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------------------
// niceMax
// ---------------------------------------------------------------------------
test('niceMax: small values get a 20-minute axis', niceMax(14), 20);
test('niceMax: a headliner rounds up to the next 50', niceMax(118), 150);
test('niceMax: an exact 100 stays 100', niceMax(100), 100);

// ---------------------------------------------------------------------------
// makeScales — a park that opens at 11 starts at 11
// ---------------------------------------------------------------------------
{
  const { x, firstHour, lastHour } = makeScales([11, 12, 13, 14], 100);
  test('makeScales: first hour sits on the left padding', round(x(11)), PAD_L);
  test('makeScales: last hour sits on the right padding', round(x(14)), VIEW_W - PAD_R);
  test(
    'makeScales: x is linear in the hour',
    round(x(12.5)),
    round((PAD_L + (VIEW_W - PAD_R)) / 2)
  );
  test('makeScales: reports the window it was given', [firstHour, lastHour], [11, 14]);
}
{
  // A ride that was a walk-on all day: every reading is 0. yMax must not divide.
  const { y } = makeScales([9, 10, 11], 0);
  test('makeScales: an all-zero ride produces a finite y', Number.isFinite(y(0)), true);
}

// ---------------------------------------------------------------------------
// axisHours — the duplicate-tick bug
// ---------------------------------------------------------------------------
test(
  'axisHours: a 09–20 day ticks the ends and every third hour',
  axisHours([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
  [9, 12, 15, 18, 20]
);
test(
  'axisHours: a day whose length is a multiple of three does not tick the end twice',
  axisHours([9, 10, 11, 12, 13, 14, 15]),
  [9, 12, 15]
);
test('axisHours: a two-hour day is just its ends', axisHours([11, 12]), [11, 12]);
test(
  'axisHours: no duplicates, ever',
  (() => {
    for (let len = 2; len <= 18; len++) {
      const hours = Array.from({ length: len }, (_, i) => 8 + i);
      const ticks = axisHours(hours);
      if (new Set(ticks).size !== ticks.length) return `duplicate at len=${len}`;
    }
    return 'ok';
  })(),
  'ok'
);

// ---------------------------------------------------------------------------
// linePath — gaps break the line
// ---------------------------------------------------------------------------
{
  const hours = [9, 10, 11, 12];
  const { x, y } = makeScales(hours, 100);
  const d = linePath(hours, [10, null, 30, 40], x, y);
  test('linePath: a gap starts a new subpath', (d.match(/M/g) || []).length, 2);
  test('linePath: no NaN in the path data', /NaN/.test(d), false);
  test(
    'linePath: an all-null series draws nothing',
    linePath(hours, [null, null, null, null], x, y),
    ''
  );
}

// ---------------------------------------------------------------------------
// bandPath — the polygon must not close across a hole
// ---------------------------------------------------------------------------
{
  const hours = [9, 10, 11, 12, 13];
  const { x, y } = makeScales(hours, 100);
  const withHole = bandPath(hours, [10, 12, null, 20, 22], [30, 34, null, 44, 46], x, y);
  test(
    'bandPath: a hole splits the fill into two subpaths',
    (withHole.match(/M/g) || []).length,
    2
  );
  test('bandPath: every subpath closes', (withHole.match(/Z/g) || []).length, 2);

  const island = bandPath(hours, [10, null, null, null, 22], [30, null, null, null, 46], x, y);
  test('bandPath: a one-point run draws nothing', island, '');

  const missingLower = bandPath(hours, [null, null, null, null, null], [30, 34, 38, 44, 46], x, y);
  test('bandPath: no lower edge means no band', missingLower, '');
  test('bandPath: no NaN in the path data', /NaN/.test(withHole), false);
}

// ---------------------------------------------------------------------------
// quietWindows
// ---------------------------------------------------------------------------
{
  // A headliner: quiet at opening, peak at 14, quiet again at the end.
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const p50 = [15, 20, 45, 60, 75, 90, 80, 65, 45, 25, 20];
  const w = quietWindows(hours, p50);
  test(
    'quietWindows: a headliner gets both windows',
    w.map((e) => e.which),
    ['opening', 'closing']
  );
  test('quietWindows: the morning window opens at the first hour', w[0].fromHour, 9);
  test(
    'quietWindows: windows never leave the measured day',
    w.every((e) => e.toHour <= 19),
    true
  );
  test('quietWindows: they do not overlap', w[0].toHour <= w[1].fromHour, true);
  // Floor 15, peak 90 -> threshold 41.25, so the morning run is 15/20 and 45 is not quiet.
  test('quietWindows: the average is the mean of the whole run', round(w[0].averageWait), 17.5);
  test('quietWindows: the morning window ends after its last quiet hour', w[0].toHour, 11);
}
{
  // Voltron Nevera's real shape, the day that exposed the share-of-peak bug: it
  // runs 28-46 minutes, so 55% of its peak was 25 and nothing qualified.
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const w = quietWindows(hours, [29, 44, 46, 45, 38, 39, 40, 33, 30, 30]);
  test(
    'quietWindows: a shallow day still gets both windows',
    w.map((e) => e.which),
    ['opening', 'closing']
  );
}
{
  // Nearly flat: the range is under 15% of the peak, so there is no quiet part.
  test(
    'quietWindows: a day that barely moves gets no windows',
    quietWindows([9, 10, 11, 12, 13], [40, 42, 44, 43, 41]),
    []
  );
}
{
  // Busy from the moment it opens: no morning window.
  const hours = [9, 10, 11, 12, 13, 14];
  const w = quietWindows(hours, [80, 85, 90, 88, 40, 20]);
  test(
    'quietWindows: a ride busy at opening gets no morning window',
    w.map((e) => e.which),
    ['closing']
  );
}
{
  // Flat all day — every hour is "quiet" against its own peak. Marking the whole
  // plot tells a reader nothing, so it must yield nothing.
  const hours = [9, 10, 11, 12, 13, 14];
  test(
    'quietWindows: a flat ride gets no windows',
    quietWindows(hours, [30, 30, 30, 30, 30, 30]),
    []
  );
}
{
  const hours = [9, 10];
  test('quietWindows: too few points yields nothing', quietWindows(hours, [10, 20]), []);
  test('quietWindows: an all-zero ride yields nothing', quietWindows([9, 10, 11], [0, 0, 0]), []);
  test(
    'quietWindows: gaps are skipped, not counted as quiet',
    quietWindows([9, 10, 11, 12], [null, 90, 88, 85]).length,
    0
  );
}

// ---------------------------------------------------------------------------
// peakOf
// ---------------------------------------------------------------------------
test('peakOf: finds the busiest measured hour', peakOf([9, 10, 11], [20, 60, 40]), {
  hour: 10,
  value: 60,
});
test('peakOf: ignores gaps', peakOf([9, 10, 11], [null, null, 40]), { hour: 11, value: 40 });
test('peakOf: an all-null series has no peak', peakOf([9, 10], [null, null]), null);

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
console.log('\nride day curve geometry\n' + '='.repeat(80) + '\n');
let passed = 0;
let failed = 0;
for (const testCase of testCases) {
  const result = testCase.actual;
  if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
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
process.exit(failed === 0 ? 0 : 1);
