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
  smoothSegment,
  runsOf,
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
  // Two runs of two, split by a gap: two subpaths.
  const hours6 = [9, 10, 11, 12, 13, 14];
  const { x: x6, y: y6 } = makeScales(hours6, 100);
  const split = linePath(hours6, [10, 20, null, 30, 40, 45], x6, y6);
  test('linePath: a gap starts a new subpath', (split.match(/M/g) || []).length, 2);
  // A lone measured hour between two gaps is not a line and draws nothing — the
  // old polyline emitted a bare `moveto` for it, which painted nothing either.
  test(
    'linePath: an isolated point draws nothing',
    linePath(hours6, [null, 20, null, null, null, null], x6, y6),
    ''
  );
  const d = linePath(hours, [10, 15, 30, 40], x, y);
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
// smoothSegment / runsOf — rounding the corners must not invent values
// ---------------------------------------------------------------------------
{
  test(
    'runsOf: splits at every gap',
    runsOf([9, 10, 11, 12], [1, null, 3, 4]).map((r) => r.length),
    [1, 2]
  );
  test('runsOf: an all-null series has no runs', runsOf([9, 10], [null, null]), []);

  const d = smoothSegment([
    { x: 0, y: 100 },
    { x: 10, y: 50 },
    { x: 20, y: 40 },
  ]);
  test('smoothSegment: emits cubic segments', (d.match(/C/g) || []).length, 2);
  test('smoothSegment: starts at the first point', d.startsWith('M0.0,100.0'), true);
  test('smoothSegment: a single point draws nothing', smoothSegment([{ x: 0, y: 1 }]), '');

  /**
   * Sample a cubic path densely and report the extreme y. The point of the
   * monotone variant is that this never leaves the data's own range — a natural
   * spline through 29/44/46 bulges past 46 and would be drawing a wait time
   * nothing measured.
   */
  const extremesOf = (path) => {
    const nums = path.match(/-?[\d.]+/g).map(Number);
    // M x y, then repeating C c1x c1y c2x c2y x y
    let i = 0;
    const start = { x: nums[i++], y: nums[i++] };
    let lo = start.y;
    let hi = start.y;
    let p0 = start;
    while (i < nums.length) {
      const c1 = { x: nums[i++], y: nums[i++] };
      const c2 = { x: nums[i++], y: nums[i++] };
      const p3 = { x: nums[i++], y: nums[i++] };
      for (let t = 0; t <= 1; t += 0.02) {
        const u = 1 - t;
        const yv =
          u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y;
        lo = Math.min(lo, yv);
        hi = Math.max(hi, yv);
      }
      p0 = p3;
    }
    return { lo: round(lo, 3), hi: round(hi, 3) };
  };

  // Voltron's opening jump — the shape that makes a naive spline overshoot.
  const rising = smoothSegment([
    { x: 0, y: 29 },
    { x: 10, y: 44 },
    { x: 20, y: 46 },
  ]);
  const e = extremesOf(rising);
  test('smoothSegment: never rises above the highest point', e.hi <= 46.001, true);
  test('smoothSegment: never falls below the lowest point', e.lo >= 28.999, true);

  // A peak in the middle must not be exaggerated.
  const peaked = smoothSegment([
    { x: 0, y: 20 },
    { x: 10, y: 90 },
    { x: 20, y: 25 },
  ]);
  const p = extremesOf(peaked);
  test('smoothSegment: a peak is not overshot', p.hi <= 90.001, true);
  test('smoothSegment: a peak does not undershoot its neighbours', p.lo >= 19.999, true);
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
