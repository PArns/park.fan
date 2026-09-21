/**
 * Unit tests for the park aggregate's findings (`lib/parks/park-stats-derive.ts`).
 *
 * Run: `pnpm test:park-stats-derive`
 *
 * The weekday half of this moved out of `use-park-comparison-stats.ts` unchanged when the
 * wait-time record page needed the same answers on the server, and its four refusals were each
 * measured against a real park — so the first half of this file is a guard on the move: the same
 * inputs must still produce the same answers. The second half is the month mirror, which is new
 * and is what the page's lead sentence says out loud.
 *
 * Both halves exist because a refusal is invisible: a park whose quietest weekday is not named
 * looks exactly like a park the code forgot about, and no build goes red either way.
 */
import assert from 'node:assert/strict';
import { deriveParkStatsFindings } from '../lib/parks/park-stats-derive.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** A weekday row. `dayOfWeek` is 0 = Sunday, the API's own numbering. */
const dow = (dayOfWeek, avgWaitP50, sampleDays = 20) => ({
  dayOfWeek,
  avgCrowdScore: 3,
  avgCrowdLevel: 'moderate',
  avgWaitP50,
  avgWaitP90: avgWaitP50 + 10,
  sampleDays,
});

/** A month row. `month` is 1 = January. */
const month = (month, avgWaitP50, sampleDays = 20) => ({
  month,
  avgCrowdScore: 3,
  avgCrowdLevel: 'moderate',
  avgWaitP50,
  avgWaitP90: avgWaitP50 + 10,
  sampleDays,
});

const stats = ({ byMonth = [], byDayOfWeek = [], topAttractions = [], meta = {} }) => ({
  byMonth,
  byDayOfWeek,
  topAttractions,
  meta: { totalSampleDays: 150, windowYears: 2, displayable: true, ...meta },
});

/** Seven weekdays, Sunday first, from a list of medians in that order. */
const week = (medians, sampleDays = 20) => medians.map((m, i) => dow(i, m, sampleDays));

console.log('deriveParkStatsFindings — weekdays');

test('says nothing at all about a park the API will not display', () => {
  const out = deriveParkStatsFindings(
    stats({ byDayOfWeek: week([40, 20, 20, 30, 30, 30, 40]), meta: { displayable: false } })
  );
  assert.deepEqual(out.quietestDays, []);
  assert.equal(out.parkP50, null);
  assert.deepEqual(out.busiestMonths, []);
});

test('names the one weekday below the park median', () => {
  const out = deriveParkStatsFindings({
    ...stats({ byDayOfWeek: week([40, 20, 30, 30, 30, 35, 45]) }),
  });
  assert.deepEqual(out.quietestDays, [1]);
  assert.equal(out.quietestP50, 20);
});

test('names BOTH days of a tie rather than refusing the park', () => {
  // Disneyland Paris measures 32 on Sunday and Wednesday. Two quiet days is the finding.
  const out = deriveParkStatsFindings(stats({ byDayOfWeek: week([32, 40, 40, 32, 40, 45, 45]) }));
  assert.deepEqual(out.quietestDays, [0, 3]);
  assert.equal(out.quietestP50, 32);
});

test('refuses a week so flat that three days share its minimum', () => {
  // Disney Adventure World reads the same on four days: that is no quiet day, not four.
  const out = deriveParkStatsFindings(stats({ byDayOfWeek: week([39, 39, 45, 39, 45, 45, 45]) }));
  assert.deepEqual(out.quietestDays, []);
});

test('drops a raggedly-measured weekday instead of ending the vote', () => {
  // Movie Park carries 13 measured Mondays against 22 Sundays, and its Monday is the lowest
  // reading in the week. Comparing those two is a claim about two different parts of the year,
  // so Monday drops out — and the six days left still name Tuesday.
  const byDayOfWeek = week([40, 15, 25, 35, 35, 40, 45]);
  byDayOfWeek[1].sampleDays = 6;
  const out = deriveParkStatsFindings(stats({ byDayOfWeek }));
  assert.deepEqual(out.quietestDays, [2]);
  assert.equal(out.quietestP50, 25);
});

test('refuses when fewer than four evenly-measured weekdays are left', () => {
  // A park watched at weekends only would otherwise nominate "Sunday" as its quiet day.
  const byDayOfWeek = week([40, 20, 25, 30, 30, 35, 45]);
  for (const d of byDayOfWeek) if (d.dayOfWeek !== 0 && d.dayOfWeek !== 6) d.sampleDays = 4;
  const out = deriveParkStatsFindings(stats({ byDayOfWeek }));
  assert.deepEqual(out.quietestDays, []);
});

console.log('\nderiveParkStatsFindings — months');

test('names the busiest month, and both of a tie', () => {
  const byMonth = [4, 5, 6, 7, 8, 9].map((m) => month(m, m === 7 || m === 8 ? 40 : 25));
  const out = deriveParkStatsFindings(
    stats({ byMonth, byDayOfWeek: week([30, 30, 30, 30, 30, 30, 30]) })
  );
  assert.deepEqual(out.busiestMonths, [7, 8]);
  assert.equal(out.busiestP50, 40);
});

test('drops a thin winter fringe rather than comparing it with August', () => {
  // Phantasialand answers for nine months and two of them are its winter fringe: January on 4
  // measured days, December on 5, against 31 in August. Given a January that reads HIGHER than
  // the season, the ragged-window rule is what keeps it out of the answer.
  const byMonth = [
    month(1, 60, 4),
    ...[4, 5, 6, 7, 8, 9].map((m) => month(m, m === 8 ? 40 : 25, 30)),
  ];
  const out = deriveParkStatsFindings(
    stats({ byMonth, byDayOfWeek: week([30, 30, 30, 30, 30, 30, 30]) })
  );
  assert.deepEqual(out.busiestMonths, [8]);
});

test('refuses a season so flat that three months share its maximum', () => {
  const byMonth = [5, 6, 7, 8].map((m) => month(m, m === 5 ? 25 : 40));
  const out = deriveParkStatsFindings(
    stats({ byMonth, byDayOfWeek: week([30, 30, 30, 30, 30, 30, 30]) })
  );
  assert.deepEqual(out.busiestMonths, []);
});

test('refuses when fewer than four comparable months are left', () => {
  const byMonth = [7, 8, 9].map((m) => month(m, m === 8 ? 40 : 25));
  const out = deriveParkStatsFindings(
    stats({ byMonth, byDayOfWeek: week([30, 30, 30, 30, 30, 30, 30]) })
  );
  assert.deepEqual(out.busiestMonths, []);
});

console.log('\nderiveParkStatsFindings — the longest queue');

test('ignores a ride nobody has watched for long', () => {
  // Toverland's Maximus' Blitz Bahn tops its list on 61 measured days. A children's coaster on a
  // thin basis is not a figure for a whole park.
  const out = deriveParkStatsFindings(
    stats({
      byDayOfWeek: week([30, 30, 30, 30, 30, 30, 30]),
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
  assert.equal(out.longestSlug, 'solid');
  assert.equal(out.longestP50, 45);
});

console.log(`\n${passed} passed`);
