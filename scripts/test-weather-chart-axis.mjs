/**
 * Unit tests for the weather day chart's geometry (`lib/utils/weather-chart-axis.ts`).
 *
 * The two properties worth guarding are (a) the identity case really is the
 * identity — a park with no schedule for today must keep the chart it had — and
 * (b) the warp stays monotone and bounded for every window shape the catalogue
 * actually contains, including the DST days where there are 23 or 25 hours.
 *
 * Run: pnpm test:weather-chart-axis
 */

import {
  buildAxisTicks,
  buildDayScale,
  findRainRuns,
  hoursOf,
  indexForMinute,
  HOUR_LABEL_WEIGHT,
  TIME_LABEL_WEIGHT,
  makeXEdge,
  MAX_OPEN_SHARE,
  MIN_OPEN_HOURS,
  OPEN_HOUR_RATIO,
  pickExtraTemperatureLabels,
} from '../lib/utils/weather-chart-axis.ts';

const round = (n, digits = 4) => Math.round(n * 10 ** digits) / 10 ** digits;

/** A normal 24-hour day of naive park-local point times. */
const dayPoints = (hours = Array.from({ length: 24 }, (_, i) => i)) =>
  hours.map((h) => ({ time: `2026-08-19T${String(h).padStart(2, '0')}:00` }));

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

// ---------------------------------------------------------------------------
// hoursOf / indexForMinute
// ---------------------------------------------------------------------------

test(
  'hoursOf reads the park-local hour',
  () => hoursOf(dayPoints()).join(','),
  Array.from({ length: 24 }, (_, i) => i).join(',')
);

test(
  'indexForMinute is minute/60 on a normal day',
  () => {
    const hours = hoursOf(dayPoints());
    return [0, 30, 570, 1439, 1440].map((m) => round(indexForMinute(hours, m))).join(' ');
  },
  '0 0.5 9.5 23.9833 24'
);

test(
  'indexForMinute clamps out-of-range minutes',
  () => {
    const hours = hoursOf(dayPoints());
    return `${indexForMinute(hours, -120)} ${indexForMinute(hours, 99999)}`;
  },
  '0 24'
);

test('indexForMinute picks the later occurrence of a repeated DST hour', () => {
  // Autumn changeover: 02:00 happens twice, so the day has 25 points.
  const hours = hoursOf(dayPoints([0, 1, 2, 2, 3, 4, 5]));
  return round(indexForMinute(hours, 2 * 60 + 30));
}, 3.5);

test('indexForMinute maps a skipped DST hour onto the next one', () => {
  // Spring changeover: 02:00 does not exist.
  const hours = hoursOf(dayPoints([0, 1, 3, 4, 5]));
  return round(indexForMinute(hours, 2 * 60 + 30));
}, 2);

// ---------------------------------------------------------------------------
// buildDayScale
// ---------------------------------------------------------------------------

test('no schedule leaves the day linear', () => String(buildDayScale(24, null, null)), 'null');

test('a 24 h park stays linear', () => String(buildDayScale(24, 0, 24)), 'null');

test(
  `a window under ${MIN_OPEN_HOURS} h stays linear`,
  () => String(buildDayScale(24, 10, 12)),
  'null'
);

test('a window over 21 h stays linear', () => String(buildDayScale(24, 1, 23)), 'null');

test(
  'a median 10 h window gets the documented widths',
  () => {
    const scale = buildDayScale(24, 10, 20);
    return `${round(scale.openUnit, 2)} ${round(scale.closedUnit, 2)}`;
  },
  '7.41 1.85'
);

test(
  'open hours stay exactly OPEN_HOUR_RATIO× the closed ones until a cap bites',
  () => {
    const scale = buildDayScale(24, 10, 20);
    return round(scale.openUnit / scale.closedUnit, 3);
  },
  OPEN_HOUR_RATIO
);

test(
  'a long window is capped at MAX_OPEN_SHARE',
  () => {
    const scale = buildDayScale(24, 8, 22);
    return round((scale.openUnit * 14) / 100, 4);
  },
  round(MAX_OPEN_SHARE, 4)
);

test(
  'a short evening window expands the most',
  () => {
    const scale = buildDayScale(24, 17, 22.5);
    return `${round(scale.openUnit, 2)} ${round(scale.closedUnit, 2)}`;
  },
  '9.88 2.47'
);

test(
  'half-hour opening times are honoured',
  () => {
    const scale = buildDayScale(24, 9.5, 20);
    return `${round(scale.openUnit, 2)} ${round(scale.closedUnit, 2)}`;
  },
  '7.21 1.8'
);

test(
  'a 23 h DST day still warps',
  () => {
    const scale = buildDayScale(23, 9, 19);
    return scale == null ? 'null' : 'scaled';
  },
  'scaled'
);

// ---------------------------------------------------------------------------
// makeXEdge
// ---------------------------------------------------------------------------

test(
  'the linear axis reproduces the old formula exactly',
  () => {
    const x = makeXEdge(24, null);
    return [0, 1, 12, 23].map((i) => round(x(i + 0.5), 6)).join(' ');
  },
  [0, 1, 12, 23].map((i) => round(((i + 0.5) / 24) * 100, 6)).join(' ')
);

test(
  'the linear axis maps minutes like the old formula',
  () => {
    const hours = hoursOf(dayPoints());
    const x = makeXEdge(24, null);
    return [0, 495, 1200].map((m) => round(x(indexForMinute(hours, m) + 0.5), 6)).join(' ');
  },
  [0, 495, 1200].map((m) => round(((m / 60 + 0.5) / 24) * 100, 6)).join(' ')
);

test(
  'the warped axis spans the full box',
  () => {
    const x = makeXEdge(24, buildDayScale(24, 10, 20));
    return `${round(x(0), 6)} ${round(x(24), 6)}`;
  },
  '0 100'
);

test(
  'the warped axis is strictly monotone',
  () => {
    const x = makeXEdge(24, buildDayScale(24, 9.5, 20));
    let ok = true;
    for (let s = 0; s < 24; s += 0.25) if (!(x(s) < x(s + 0.25))) ok = false;
    return ok;
  },
  true
);

test(
  'the band edges land on the two kinks',
  () => {
    const scale = buildDayScale(24, 10, 20);
    const x = makeXEdge(24, scale);
    const openX = x(10);
    const closeX = x(20);
    // Slope left of the opening edge is the closed unit, right of it the open one.
    const before = (x(10) - x(9)) / 1;
    const after = (x(11) - x(10)) / 1;
    return `${round(closeX - openX, 2)} ${round(before, 2)} ${round(after, 2)}`;
  },
  '74.07 1.85 7.41'
);

test('after-midnight closing runs to the edge', () => {
  const x = makeXEdge(24, buildDayScale(24, 8, 24));
  return round(x(24), 4);
}, 100);

// ---------------------------------------------------------------------------
// buildAxisTicks
// ---------------------------------------------------------------------------

const linearTicks = () => {
  const hours = hoursOf(dayPoints());
  const x = makeXEdge(24, null);
  return buildAxisTicks({ hours, xForIndex: (i) => x(i + 0.5), scale: null, edges: [] });
};

test(
  'a linear day keeps the old every-third-hour axis',
  () =>
    linearTicks()
      .map((t) => t.index)
      .join(','),
  '0,3,6,9,12,15,18,21'
);

test(
  'a linear day adds no second tier and no edge ticks',
  () => {
    const ticks = linearTicks();
    return ticks.every((t) => t.tier === 0 && t.kind === 'hour');
  },
  true
);

const warpedTicks = () => {
  const hours = hoursOf(dayPoints());
  const scale = buildDayScale(24, 10, 20);
  const x = makeXEdge(24, scale);
  return buildAxisTicks({
    hours,
    xForIndex: (i) => x(i + 0.5),
    scale,
    edges: [
      { kind: 'open', x: x(10), index: 10, weight: HOUR_LABEL_WEIGHT },
      { kind: 'close', x: x(20), index: 20, weight: HOUR_LABEL_WEIGHT },
    ],
  });
};

test(
  'the warped axis marks opening and closing',
  () => {
    const ticks = warpedTicks();
    return ticks
      .filter((t) => t.kind !== 'hour')
      .map((t) => `${t.kind}@${t.index}`)
      .join(' ');
  },
  'open@10 close@20'
);

test(
  'a phone gets more in-window labels than the linear axis had',
  () => {
    // The linear axis put 12, 15 and 18 between opening and closing.
    const ticks = warpedTicks().filter((t) => t.tier === 0 && t.index > 10 && t.index < 20);
    return ticks.map((t) => t.index).join(',');
  },
  '12,14,16,18'
);

test('an opening time with minutes claims room from the neighbouring hour', () => {
  const hours = hoursOf(dayPoints());
  const scale = buildDayScale(24, 10, 20);
  const x = makeXEdge(24, scale);
  const ticks = buildAxisTicks({
    hours,
    xForIndex: (i) => x(i + 0.5),
    scale,
    edges: [
      { kind: 'open', x: x(10), index: 10, weight: TIME_LABEL_WEIGHT },
      { kind: 'close', x: x(20), index: 20, weight: TIME_LABEL_WEIGHT },
    ],
  });
  return ticks.filter((t) => t.tier === 0 && t.kind === 'hour' && t.index > 10 && t.index < 20)
    .length;
}, 3);

test(
  'tier-0 ticks never crowd each other',
  () => {
    const xs = warpedTicks()
      .filter((t) => t.tier === 0)
      .map((t) => t.x)
      .sort((a, b) => a - b);
    let ok = true;
    for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] < 9.4) ok = false;
    return ok;
  },
  true
);

test(
  'a wide chart fills in the hours the phone had no room for',
  () => {
    const ticks = warpedTicks();
    const wide = ticks.filter((t) => t.tier === 1 && t.index > 10 && t.index < 20);
    return wide.map((t) => t.index).join(',');
  },
  '11,13,15,17'
);

test(
  'the compressed night keeps whatever labels fit',
  () => {
    const ticks = warpedTicks().filter((t) => t.index < 10 || t.index > 20);
    return ticks.map((t) => `${t.index}:${t.tier}`).join(' ');
  },
  '0:0 4:1'
);

test(
  'a wider compressed tail earns its own label',
  () => {
    // 09:00–18:00 (Europa-Park): six hours after closing is room for one tick.
    const hours = hoursOf(dayPoints());
    const scale = buildDayScale(24, 9.5, 18.5);
    const x = makeXEdge(24, scale);
    const ticks = buildAxisTicks({
      hours,
      xForIndex: (i) => x(i + 0.5),
      scale,
      edges: [
        { kind: 'open', x: x(9.5), index: 9, weight: HOUR_LABEL_WEIGHT },
        { kind: 'close', x: x(18.5), index: 18, weight: HOUR_LABEL_WEIGHT },
      ],
    });
    return ticks
      .filter((t) => t.index > 18)
      .map((t) => `${t.index}:${t.tier}`)
      .join(' ');
  },
  '22:1'
);

test(
  'the whole visit is labelled hour by hour on a wide chart',
  () => {
    const hours = hoursOf(dayPoints());
    const scale = buildDayScale(24, 9.5, 18.5);
    const x = makeXEdge(24, scale);
    const ticks = buildAxisTicks({
      hours,
      xForIndex: (i) => x(i + 0.5),
      scale,
      edges: [
        { kind: 'open', x: x(9.5), index: 9, weight: HOUR_LABEL_WEIGHT },
        { kind: 'close', x: x(18.5), index: 18, weight: HOUR_LABEL_WEIGHT },
      ],
    });
    return ticks
      .filter((t) => t.kind === 'hour' && t.index > 9 && t.index < 18)
      .map((t) => t.index)
      .join(',');
  },
  '10,11,12,13,14,15,16,17'
);

test(
  'the wide tier fills in between rather than repeating',
  () => {
    const ticks = warpedTicks();
    const base = new Set(ticks.filter((t) => t.tier === 0).map((t) => t.index));
    return ticks.filter((t) => t.tier === 1).every((t) => !base.has(t.index));
  },
  true
);

test('midnight still ticks on a warped day', () => warpedTicks().some((t) => t.index === 0), true);

test(
  'ticks come out sorted by position',
  () => {
    const xs = warpedTicks().map((t) => t.x);
    return xs.every((x, i) => i === 0 || xs[i - 1] <= x);
  },
  true
);

// ---------------------------------------------------------------------------
// pickExtraTemperatureLabels
// ---------------------------------------------------------------------------

const spread = Array.from({ length: 24 }, (_, i) => i * 4);

test(
  'a flat window only earns the two ends of the visit',
  () => {
    const temps = Array.from({ length: 24 }, () => 20);
    const picked = pickExtraTemperatureLabels({
      candidates: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      temps,
      xs: spread,
      placed: [],
    });
    return picked.map((p) => p.index).join(',');
  },
  '10,20'
);

test(
  'a peak in the middle of the visit earns a label',
  () => {
    const temps = Array.from({ length: 24 }, (_, i) => (i === 15 ? 30 : 18));
    const picked = pickExtraTemperatureLabels({
      candidates: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      temps,
      xs: spread,
      placed: [],
    });
    return picked.some((p) => p.index === 15);
  },
  true
);

test(
  'labels that would sit on an existing one are dropped',
  () => {
    const temps = Array.from({ length: 24 }, (_, i) => (i === 15 ? 30 : 18));
    const picked = pickExtraTemperatureLabels({
      candidates: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      temps,
      xs: spread,
      // The day's max label already sits where hour 15 would go.
      placed: [{ x: spread[15], value: 30 }],
    });
    return picked.some((p) => p.index === 15);
  },
  false
);

test(
  'a window under three hours earns nothing',
  () =>
    pickExtraTemperatureLabels({ candidates: [10, 11], temps: spread, xs: spread, placed: [] })
      .length,
  0
);

/** A day that swings hard enough to earn several labels: period of six hours. */
const swingyTemps = Array.from({ length: 24 }, (_, i) => 18 + 9 * Math.sin((i * Math.PI) / 3));
const swingyCandidates = Array.from({ length: 16 }, (_, i) => i + 6);

test(
  'a swingy visit earns several labels',
  () => {
    const picked = pickExtraTemperatureLabels({
      candidates: swingyCandidates,
      temps: swingyTemps,
      xs: spread,
      placed: [],
    });
    return picked.length >= 3;
  },
  true
);

test(
  'at most five labels, at most three of them on a narrow chart',
  () => {
    const picked = pickExtraTemperatureLabels({
      candidates: swingyCandidates,
      temps: swingyTemps,
      xs: spread,
      placed: [],
    });
    return `${picked.length <= 5} ${picked.filter((p) => p.tier === 0).length <= 3}`;
  },
  'true true'
);

test(
  'a label that would repeat a nearby number is skipped',
  () => {
    // A plateau: hour 15 is one degree off the max at hour 13, six x-units away.
    const temps = Array.from({ length: 24 }, (_, i) => (i === 13 ? 30 : i === 15 ? 29 : 18));
    const picked = pickExtraTemperatureLabels({
      candidates: [10, 11, 12, 13, 14, 15, 16, 17, 18],
      temps,
      xs: spread,
      placed: [{ x: spread[13], value: 30 }],
    });
    return picked.some((p) => p.index === 15);
  },
  false
);

test(
  'extra labels come out in reading order',
  () => {
    const picked = pickExtraTemperatureLabels({
      candidates: swingyCandidates,
      temps: swingyTemps,
      xs: spread,
      placed: [],
    }).map((p) => p.index);
    return picked.every((v, i) => i === 0 || picked[i - 1] < v);
  },
  true
);

// ---------------------------------------------------------------------------
// findRainRuns
// ---------------------------------------------------------------------------

const dry = Array.from({ length: 24 }, () => 0);

test('a dry day has no runs', () => findRainRuns(dry, dry).length, 0);

test('a single wet hour is left to its bar', () => {
  const mm = [...dry];
  mm[12] = 1.4;
  return findRainRuns(mm, dry).length;
}, 0);

test(
  'consecutive wet hours become one run',
  () => {
    const mm = [...dry];
    mm[12] = 0.4;
    mm[13] = 0.9;
    mm[14] = 0.3;
    const [run] = findRainRuns(mm, dry);
    return `${run.from}-${run.to} ${round(run.totalMm, 2)}`;
  },
  '12-15 1.6'
);

test(
  'a confident drizzle counts, an unconfident one does not',
  () => {
    const mm = [...dry];
    mm[6] = 0.12;
    mm[7] = 0.12;
    const prob = [...dry];
    prob[6] = 80;
    prob[7] = 80;
    return `${findRainRuns(mm, prob).length}${findRainRuns(mm, dry).length}`;
  },
  '10'
);

test(
  'only the two wettest runs are drawn, in reading order',
  () => {
    const mm = [...dry];
    [2, 3].forEach((i) => (mm[i] = 0.3));
    [8, 9, 10].forEach((i) => (mm[i] = 2));
    [18, 19].forEach((i) => (mm[i] = 1));
    return findRainRuns(mm, dry)
      .map((r) => r.from)
      .join(',');
  },
  '8,18'
);

test(
  'a run running to the end of the day closes cleanly',
  () => {
    const mm = [...dry];
    mm[22] = 0.5;
    mm[23] = 0.5;
    const [run] = findRainRuns(mm, dry);
    return `${run.from}-${run.to}`;
  },
  '22-24'
);

// ---------------------------------------------------------------------------

console.log('🧪 Testing weather chart axis geometry\n');
console.log('='.repeat(80) + '\n');

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
