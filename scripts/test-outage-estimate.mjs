// Regression tests for reading the running-outage estimate (`lib/utils/outage.ts`).
//
// Everything here is about a payload shape rather than about a layout, which is why it can be
// tested at all: the two components that draw an outage — the ride card's compact line and the
// ride page's full sentence — render whatever these three functions answer.
//
// The case that started this file is `remaining.p75`. The type documents it as `number | null`
// and the API drops the KEY instead, on exactly the long outages the open-range branch exists
// for. Measured against production on 2026-09-09: of the ten outages running at the time, three
// carried `{"p25":117,"median":460}` with no `p75` — Revenge of the Mummy (2648 elapsed
// operating minutes), Everland's Sky Cruise (1750) and Universal Studios Japan's Space Fantasy
// (361). The `=== null` test that used to live in the component fell through to the two-ended
// range and formatted `undefined`, so all three rendered „meist noch 1:55 Std. bis NaN:NaN Std."
// on the park page and again on the ride page.
import {
  outageElapsedMinutes,
  outageRecoveryPercent,
  outageRemainingWindow,
  roundOutageMinutes,
} from '../lib/utils/outage.ts';

/** The shape production actually sends for a long outage — no `p75` key at all. */
const LONG = {
  elapsedMinutes: 2648,
  recoveryWithin30: 0.098,
  recoveryWithin60: 0.168,
  remaining: { p25: 117, median: 460 },
  basis: 'pooled',
};

/** A fresh one, with all three quartiles. */
const FRESH = {
  elapsedMinutes: 46,
  recoveryWithin30: 0.331,
  recoveryWithin60: 0.55,
  remaining: { p25: 25, median: 55, p75: 150 },
  basis: 'pooled',
};

const OUTAGE = (estimate, extra = {}) => ({
  startedAt: '2026-09-09T05:20:12.443Z',
  startObserved: true,
  signal: 'down',
  ...(estimate ? { estimate } : {}),
  ...extra,
});

const testCases = [
  // ── the upper quartile, in both of its absent shapes ──
  {
    name: 'a missing p75 KEY is an open range, not a NaN',
    actual: () => JSON.stringify(outageRemainingWindow(LONG)),
    expected: JSON.stringify({ from: 115, to: null }),
  },
  {
    name: 'an explicit p75: null is the same open range',
    actual: () =>
      JSON.stringify(
        outageRemainingWindow({ ...LONG, remaining: { ...LONG.remaining, p75: null } })
      ),
    expected: JSON.stringify({ from: 115, to: null }),
  },
  {
    name: 'a resolved p75 keeps both ends',
    actual: () => JSON.stringify(outageRemainingWindow(FRESH)),
    expected: JSON.stringify({ from: 25, to: 150 }),
  },
  {
    name: 'no remaining block at all means no range, not an open one',
    actual: () => outageRemainingWindow({ ...FRESH, remaining: undefined }),
    expected: null,
  },
  {
    name: 'no estimate at all means no range',
    actual: () => outageRemainingWindow(undefined),
    expected: null,
  },
  {
    name: 'a non-numeric p25 refuses the whole window rather than rendering half of it',
    actual: () => outageRemainingWindow({ ...FRESH, remaining: { p25: null, median: 55 } }),
    expected: null,
  },
  {
    name: 'quartiles that collapse into each other open the range instead of inverting it',
    // Cannot happen while the API orders them, and if it ever stops, „über 2:00 Std." is true
    // where „2:00 Std. bis 1:55 Std." is a typo on screen.
    actual: () =>
      JSON.stringify(
        outageRemainingWindow({ ...FRESH, remaining: { p25: 120, median: 130, p75: 118 } })
      ),
    expected: JSON.stringify({ from: 120, to: null }),
  },

  // ── rounding ──
  {
    name: 'minutes round to five, the resolution everything here is displayed at',
    actual: () => roundOutageMinutes(117),
    expected: 115,
  },
  {
    name: 'a span that is happening never rounds down to zero',
    // `roundWaitTo5` floors under 2.5 to zero, which is right for a queue and reads as „over"
    // for an outage that is still running.
    actual: () => roundOutageMinutes(2),
    expected: 5,
  },

  // ── the probability ──
  {
    name: 'the recovery share rounds to five points, the calibration error being 2.55',
    actual: () => outageRecoveryPercent(FRESH),
    expected: 55,
  },
  {
    name: 'a share that rounds to zero is withheld rather than rendered as never',
    actual: () => outageRecoveryPercent({ ...FRESH, recoveryWithin60: 0.02 }),
    expected: null,
  },
  {
    name: 'the thinnest measured bucket still answers',
    actual: () => outageRecoveryPercent(LONG),
    expected: 15,
  },

  // ── elapsed ──
  {
    name: 'elapsed comes from the operating clock the API counted, rounded to five',
    actual: () => outageElapsedMinutes(OUTAGE(LONG)),
    expected: 2650,
  },
  {
    name: 'no estimate means no opening clock to count on, so no duration is invented',
    // A park that publishes no opening hours has no operating minute. `now - startedAt` would
    // answer anyway, and would be wrong by every hour the park was shut.
    actual: () => outageElapsedMinutes(OUTAGE(null)),
    expected: null,
  },
  {
    name: 'an unobserved start yields a lower bound, and a bound is not rendered as a measurement',
    actual: () => outageElapsedMinutes(OUTAGE(FRESH, { startObserved: false })),
    expected: null,
  },
  {
    name: 'no outage at all is not a zero-minute outage',
    actual: () => outageElapsedMinutes(undefined),
    expected: null,
  },
];

console.log('\n🔧 Running outage: reading the estimate\n' + '='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = testCase.actual();
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
