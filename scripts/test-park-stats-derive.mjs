/**
 * Unit tests for the park aggregate's findings (`lib/parks/park-stats-derive.ts`).
 *
 * Run: `pnpm test:park-stats-derive`
 *
 * The quietest weekday and the busiest month are the park header's quiet and busy ends
 * (`deriveParkBestDays`), read off `avgCrowdScore`. They used to be ranked by the P50 wait, and
 * since the API sends waits rounded to five minutes that rule tied on most weeks and named no day
 * at all: Europa-Park's Sunday, Monday, Wednesday, Thursday and Friday all read 20. The first
 * fixtures here are those two weeks as the API returned them on 2026-10-22, so the tie cannot come
 * back unnoticed. A refusal is invisible otherwise: a park whose quiet day is not named looks
 * exactly like a park the code forgot about, and no build goes red either way.
 */
import assert from 'node:assert/strict';
import { deriveParkBestDays, deriveParkStatsFindings } from '../lib/parks/park-stats-derive.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** A weekday row: `[dayOfWeek, avgCrowdScore, avgWaitP50, sampleDays]`, 0 = Sunday. */
const dow = ([dayOfWeek, avgCrowdScore, avgWaitP50, sampleDays = 34]) => ({
  dayOfWeek,
  avgCrowdScore,
  avgCrowdLevel: 'moderate',
  avgWaitP50,
  avgWaitP90: avgWaitP50 + 15,
  sampleDays,
});

/** A month row: `[month, avgCrowdScore, avgWaitP50, sampleDays]`, 1 = January. */
const month = ([month, avgCrowdScore, avgWaitP50, sampleDays = 20]) => ({
  month,
  avgCrowdScore,
  avgCrowdLevel: 'moderate',
  avgWaitP50,
  avgWaitP90: avgWaitP50 + 15,
  sampleDays,
});

const stats = ({ byMonth = [], byDayOfWeek = [], topAttractions = [], meta = {} }) => ({
  byMonth: byMonth.map(month),
  byDayOfWeek: byDayOfWeek.map(dow),
  topAttractions,
  meta: { totalSampleDays: 240, windowYears: 2, displayable: true, ...meta },
});

/** A week whose crowd score is flat, for the tests that are about something else. */
const flatWeek = [0, 1, 2, 3, 4, 5, 6].map((d) => [d, 3, 30]);

// `/v1/parks/europe/germany/rust/europa-park/stats?years=2`, 2026-10-22.
const europaParkWeek = [
  [0, 2, 20, 35],
  [1, 2.2, 20, 34],
  [2, 2.4, 25, 35],
  [3, 2.1, 20, 35],
  [4, 2, 20, 34],
  [5, 2, 20, 34],
  [6, 2.8, 30, 35],
];
// `/v1/parks/europe/germany/bruehl/phantasialand/stats?years=2`, 2026-10-22.
const phantasialandWeek = [
  [0, 3.4, 35, 34],
  [1, 2.7, 25, 34],
  [2, 2.7, 25, 33],
  [3, 2.8, 30, 32],
  [4, 2.7, 25, 32],
  [5, 2.7, 25, 34],
  [6, 3.9, 40, 35],
];

console.log('deriveParkStatsFindings — weekdays');

test('says nothing at all about a park the API will not display', () => {
  const out = deriveParkStatsFindings(
    stats({ byDayOfWeek: europaParkWeek, meta: { displayable: false } })
  );
  assert.deepEqual(out.quietestDays, []);
  assert.equal(out.parkP50, null);
  assert.deepEqual(out.busiestMonths, []);
});

test('names Europa-Park’s quiet days although five weekdays share the rounded P50', () => {
  const out = deriveParkStatsFindings(stats({ byDayOfWeek: europaParkWeek }));
  assert.deepEqual(out.quietestDays, [0, 4, 5]);
  assert.equal(out.quietestP50, 20);
});

test('names Phantasialand’s Monday to Friday, all five days of it', () => {
  const out = deriveParkStatsFindings(stats({ byDayOfWeek: phantasialandWeek }));
  assert.deepEqual(out.quietestDays, [1, 2, 3, 4, 5]);
  // Weighted by measured days: four days at 25 and Wednesday at 30.
  assert.ok(out.quietestP50 > 25 && out.quietestP50 < 27, String(out.quietestP50));
});

test('names the same days as the park header, for every fixture', () => {
  for (const byDayOfWeek of [europaParkWeek, phantasialandWeek]) {
    const s = stats({ byDayOfWeek });
    assert.deepEqual(deriveParkStatsFindings(s).quietestDays, deriveParkBestDays(s).quietDays);
  }
});

test('names no day in a week too flat to have a quiet end', () => {
  const out = deriveParkStatsFindings(stats({ byDayOfWeek: flatWeek }));
  assert.deepEqual(out.quietestDays, []);
  assert.equal(out.quietestP50, null);
});

test('drops a raggedly-measured weekday instead of ending the vote', () => {
  // Movie Park carries few measured Mondays against its Sundays, and its Monday is the lowest
  // reading in the week. Comparing those two is a claim about two different parts of the year,
  // so Monday drops out, and the six days left still name Tuesday.
  const week = [
    [0, 3.5, 40],
    [1, 1.5, 15, 6],
    [2, 2.4, 25],
    [3, 3.1, 35],
    [4, 3.1, 35],
    [5, 3.3, 40],
    [6, 3.8, 45],
  ];
  const out = deriveParkStatsFindings(stats({ byDayOfWeek: week }));
  assert.deepEqual(out.quietestDays, [2]);
  assert.equal(out.quietestP50, 25);
});

test('refuses when fewer than four evenly-measured weekdays are left', () => {
  // A park watched at weekends only would otherwise nominate "Sunday" as its quiet day.
  const week = europaParkWeek.map(([d, score, p50]) => [
    d,
    score,
    p50,
    d === 0 || d === 6 ? 34 : 4,
  ]);
  const out = deriveParkStatsFindings(stats({ byDayOfWeek: week }));
  assert.deepEqual(out.quietestDays, []);
});

console.log('\nderiveParkStatsFindings — months');

test('names the busiest month, and both of a tie', () => {
  const byMonth = [4, 5, 6, 7, 8, 9].map((m) => [
    m,
    m === 7 || m === 8 ? 3.8 : 2.4,
    m === 7 || m === 8 ? 40 : 25,
  ]);
  const out = deriveParkStatsFindings(stats({ byMonth, byDayOfWeek: flatWeek }));
  assert.deepEqual(out.busiestMonths, [7, 8]);
  assert.equal(out.busiestP50, 40);
});

test('drops a thin winter fringe rather than comparing it with August', () => {
  // Phantasialand answers for nine months and two of them are its winter fringe: January on 4
  // measured days against 31 in August. Given a January that reads HIGHER than the season, the
  // ragged-window rule is what keeps it out of the answer.
  const byMonth = [
    [1, 4.5, 60, 4],
    ...[4, 5, 6, 7, 8, 9].map((m) => [m, m === 8 ? 3.8 : 2.4, m === 8 ? 40 : 25, 30]),
  ];
  const out = deriveParkStatsFindings(stats({ byMonth, byDayOfWeek: flatWeek }));
  assert.deepEqual(out.busiestMonths, [8]);
});

test('names no month in a season too flat to have a busy end', () => {
  const byMonth = [5, 6, 7, 8].map((m) => [m, 3, 30]);
  const out = deriveParkStatsFindings(stats({ byMonth, byDayOfWeek: flatWeek }));
  assert.deepEqual(out.busiestMonths, []);
});

test('refuses when fewer than four comparable months are left', () => {
  const byMonth = [7, 8, 9].map((m) => [m, m === 8 ? 3.8 : 2.4, m === 8 ? 40 : 25]);
  const out = deriveParkStatsFindings(stats({ byMonth, byDayOfWeek: flatWeek }));
  assert.deepEqual(out.busiestMonths, []);
});

console.log('\nderiveParkStatsFindings — the longest queue');

test('ignores a ride nobody has watched for long', () => {
  // Toverland's Maximus' Blitz Bahn tops its list on 61 measured days. A children's coaster on a
  // thin basis is not a figure for a whole park.
  const out = deriveParkStatsFindings(
    stats({
      byDayOfWeek: flatWeek,
      topAttractions: [
        {
          attractionSlug: 'thin',
          attractionName: 'Thin',
          avgWaitP50: 60,
          avgWaitP90: 70,
          sampleDays: 61,
          rank: 1,
        },
        {
          attractionSlug: 'solid',
          attractionName: 'Solid',
          avgWaitP50: 45,
          avgWaitP90: 55,
          sampleDays: 140,
          rank: 2,
        },
      ],
    })
  );
  assert.equal(out.longestName, 'Solid');
  assert.equal(out.longestP50, 45);
});

console.log(`\n${passed} passed`);
