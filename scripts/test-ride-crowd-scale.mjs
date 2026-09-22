/**
 * Unit tests for the ride card's crowd-scale tooltip (`lib/utils/ride-crowd-scale.ts`).
 *
 * The tooltip lists the waits that put ONE ride in each tier, so the one thing it may never do is
 * disagree with the badge it explains. The last block therefore replays real (wait, baseline,
 * crowdLevel) triples from the API — Epcot, 2026-09-22 — and asks the table to land every wait in
 * the tier the API gave it.
 *
 * Run: pnpm test:ride-crowd-scale
 */

import { rideCrowdMinuteRanges, rideCrowdLevelForWait } from '../lib/utils/ride-crowd-scale.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

// Frozen Ever After's baseline. The boundaries sit on the percentages: 30 is 60 %, 75 is 150 %,
// 100 is 200 %, each still inside the lower tier as `<=` says. 55 is the exception, and on purpose:
// `55 / 50 * 100` is 110.00000000000001 in IEEE doubles, the backend computes it in the same
// doubles, and the API rates Remy at 55 against 50 as `high` — so the table has to as well.
test('baseline 50', rideCrowdMinuteRanges(50), {
  very_low: { min: 0, max: 30 },
  low: { min: 35, max: 40 },
  moderate: { min: 45, max: 50 },
  high: { min: 55, max: 75 },
  very_high: { min: 80, max: 100 },
  extreme: { min: 105 },
});

// Rounding `baseline × 0.9` and `× 1.1` would put „Normal" at 15–15 and „Niedrig" at 10–15.
test('baseline 15', rideCrowdMinuteRanges(15), {
  very_low: { min: 0, max: 5 },
  low: { min: 10, max: 10 },
  moderate: { min: 15, max: 15 },
  high: { min: 20, max: 20 },
  very_high: { min: 25, max: 30 },
  extreme: { min: 35 },
});

// No posted wait reads „Niedrig" or „Hoch" here, and the table says so rather than inventing one.
test('baseline 5 leaves two tiers empty', rideCrowdMinuteRanges(5), {
  very_low: { min: 0, max: 0 },
  low: null,
  moderate: { min: 5, max: 5 },
  high: null,
  very_high: { min: 10, max: 10 },
  extreme: { min: 15 },
});

// A baseline off the five-minute grid (a P90 fallback can be) still walks the posted waits.
test('baseline 42', rideCrowdMinuteRanges(42), {
  very_low: { min: 0, max: 25 },
  low: { min: 30, max: 35 },
  moderate: { min: 40, max: 45 },
  high: { min: 50, max: 60 },
  very_high: { min: 65, max: 80 },
  extreme: { min: 85 },
});

test('no baseline', rideCrowdMinuteRanges(undefined), null);
test('null baseline', rideCrowdMinuteRanges(null), null);
test('zero baseline', rideCrowdMinuteRanges(0), null);
test('negative baseline', rideCrowdMinuteRanges(-10), null);
test('NaN baseline', rideCrowdMinuteRanges(Number.NaN), null);

// Real triples from the API, Epcot 2026-09-22 (`/v1/parks/north-america/united-states/orlando/epcot`).
const observed = [
  ['Frozen Ever After', 70, 50, 'high'],
  ['Journey Into Imagination', 5, 15, 'very_low'],
  ['Canada Far and Wide', 15, 15, 'moderate'],
  ['Gran Fiesta Tour', 10, 15, 'low'],
  ['Living with the Land', 25, 20, 'high'],
  ['The Seas with Nemo & Friends', 15, 20, 'low'],
  ["Remy's Ratatouille Adventure", 55, 50, 'high'],
  ['Test Track', 95, 75, 'high'],
  ['Spaceship Earth', 20, 20, 'moderate'],
  ['Mission: SPACE', 20, 15, 'high'],
  ['Guardians of the Galaxy', 65, 75, 'low'],
  ["Soarin' Across America", 45, 40, 'high'],
  ['Turtle Talk With Crush', 15, 15, 'moderate'],
];

for (const [name, wait, baseline, apiLevel] of observed) {
  test(`${name}: level`, rideCrowdLevelForWait(wait, baseline), apiLevel);
  const range = rideCrowdMinuteRanges(baseline)[apiLevel];
  test(
    `${name}: ${wait} min sits in the ${apiLevel} row`,
    range !== null && wait >= range.min && (range.max === undefined || wait <= range.max),
    true
  );
}

let failed = 0;
for (const { name, actual, expected } of testCases) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed++;
    console.error(
      `✗ ${name}\n  expected ${JSON.stringify(expected)}\n  received ${JSON.stringify(actual)}`
    );
  }
}
console.log(`${testCases.length - failed}/${testCases.length} passed`);
if (failed) process.exit(1);
