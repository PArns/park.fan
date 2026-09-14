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
  OUTAGE_BAR_HORIZON_MIN,
  outageElapsedMinutes,
  outageRecoveryLine,
  outageRecoveryPercent,
  outageRemainingBar,
  outageRemainingWindow,
  roundOutageMinutes,
} from '../lib/utils/outage.ts';
import { formatSpanDuration, formatWholeHours } from '../lib/utils/duration.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];

/** The catalogs as they ship, read from disk — the keys below are strings on both sides. */
function readMessages(locale) {
  const path = fileURLToPath(new URL(`../messages/${locale}.json`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8'));
}

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
    name: 'a narrow pair keeps both ends instead of collapsing onto one number',
    // Rounding to nearest put 118 and 119 both on 120, and the „ends are equal" guard that
    // followed then printed „über 2:00 Std." — unbounded, about a window whose top is 119, and
    // with a floor above it. The ends round OUTWARD, so a window can only ever be printed wider
    // than it was measured.
    actual: () =>
      JSON.stringify(
        outageRemainingWindow({ ...FRESH, remaining: { p25: 118, median: 118.5, p75: 119 } })
      ),
    expected: JSON.stringify({ from: 115, to: 120 }),
  },
  {
    name: 'quartiles that land on the same number still print a range, not one number twice',
    // Both ends clamp to the one-step floor here. „5 Min. bis 5 Min." is not a range; one step
    // of width is, and it is never narrower than what was measured.
    actual: () =>
      JSON.stringify(outageRemainingWindow({ ...FRESH, remaining: { p25: 1, median: 3, p75: 4 } })),
    expected: JSON.stringify({ from: 5, to: 10 }),
  },
  {
    name: 'an inverted pair opens the range, judged on the raw quartiles and not the rounded ones',
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
  {
    name: 'a span past a day is whole hours, because h:mm reads as a clock time up there',
    actual: () => formatSpanDuration(2650, 'de'),
    expected: '44 Std.',
  },
  {
    name: 'a span under a day keeps the h:mm form it has everywhere else',
    actual: () => formatSpanDuration(150, 'de'),
    expected: '2:30 Std.',
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

  // ── the bar ──
  //
  // Same numbers as the sentence above it, placed on a scale that is the same on every card.
  // Everything here is the geometry the component would otherwise compute inline, where a
  // green build proves nothing about it.
  {
    name: 'a closed window sits between its two quartiles on the fixed scale',
    // 25 and 150 minutes of 240.
    actual: () => JSON.stringify(outageRemainingBar(outageRemainingWindow(FRESH))),
    expected: JSON.stringify({
      startPct: (25 / OUTAGE_BAR_HORIZON_MIN) * 100,
      endPct: (150 / OUTAGE_BAR_HORIZON_MIN) * 100,
      openEnd: false,
    }),
  },
  {
    name: 'an open window runs to the right edge and says so, rather than being drawn as a cap',
    actual: () => JSON.stringify(outageRemainingBar(outageRemainingWindow(LONG))),
    expected: JSON.stringify({
      startPct: (115 / OUTAGE_BAR_HORIZON_MIN) * 100,
      endPct: 100,
      openEnd: true,
    }),
  },
  {
    name: 'an open window still starts at its lower quartile, never at zero',
    // The whole point of AK 3: „über 1:55 Std." is not a full bar.
    actual: () => outageRemainingBar(outageRemainingWindow(LONG)).startPct > 0,
    expected: true,
  },
  {
    name: 'an upper quartile past the end of the scale is open-ended too',
    // The scale stops at four hours and the segment cannot say „5:00 Std." by reaching the same
    // right edge a bounded one would. The sentence above the bar keeps the number.
    actual: () => outageRemainingBar({ from: 60, to: OUTAGE_BAR_HORIZON_MIN + 60 }).openEnd,
    expected: true,
  },
  {
    name: 'an upper quartile exactly on the end of the scale is still bounded',
    actual: () => outageRemainingBar({ from: 60, to: OUTAGE_BAR_HORIZON_MIN }).openEnd,
    expected: false,
  },
  {
    name: 'a window that starts past the scale gets no bar rather than a sliver at the edge',
    // „noch 5 Std." and „noch 40 Std." would draw the same five pixels, which is a picture that
    // says nothing. The sentence stands alone there.
    actual: () => outageRemainingBar({ from: OUTAGE_BAR_HORIZON_MIN, to: null }),
    expected: null,
  },
  {
    name: 'a window starting just under the horizon is refused too, not drawn two percent wide',
    // The degenerate case one step below the threshold that was supposed to catch it: 235 is
    // inside the scale, so a `from >= horizon` test passes it — and then the widening floor
    // cannot help, because it only pushes the right edge and the right edge is already at 100.
    actual: () => outageRemainingBar({ from: 235, to: null }),
    expected: null,
  },
  {
    name: 'the last window that still fits a full segment is still drawn',
    // 228 minutes is exactly 95 % of the scale, which leaves the five the segment needs.
    actual: () => outageRemainingBar({ from: 228, to: null })?.openEnd,
    expected: true,
  },
  {
    name: 'a ten-minute window is widened to a visible segment instead of two pixels',
    // Widened to the RIGHT: a segment may never start earlier than it was measured.
    actual: () => {
      const bar = outageRemainingBar({ from: 30, to: 40 });
      return `${bar.startPct === 12.5} ${bar.endPct - bar.startPct >= 5}`;
    },
    expected: 'true true',
  },
  {
    name: 'no window at all means no bar',
    actual: () => outageRemainingBar(null),
    expected: null,
  },
  {
    name: 'the scale label is whole hours, not the h:mm form a measured span uses',
    actual: () => formatWholeHours(OUTAGE_BAR_HORIZON_MIN / 60, 'de'),
    expected: '4 Std.',
  },

  // ── which probability sentence, and whether there is one ──
  //
  // This branch lived in the component and was wrong on its first write: it read the range
  // instead of the variant and put the ride page's long sentence on a card. Lint, format and
  // every other case in this file were green through it, which is why it is a function now.
  {
    name: 'a card beside a range says nothing about the probability',
    // One statement per card: the badge row is shared with every other card in the grid row.
    actual: () => outageRecoveryLine(75, 'compact', true),
    expected: null,
  },
  {
    name: 'a card without a range gets the SHORT sentence',
    // The case a card really reaches — `remaining` is absent past about two hours elapsed.
    actual: () => outageRecoveryLine(15, 'compact', false)?.key,
    expected: 'recovery',
  },
  {
    name: 'the ride page without a range gets the long, conditioned one',
    actual: () => outageRecoveryLine(15, 'full', false)?.key,
    expected: 'recoveryOnly',
  },
  {
    name: 'the ride page beside a range gets the short one, the condition being in the range line',
    actual: () => outageRecoveryLine(75, 'full', true)?.key,
    expected: 'recovery',
  },
  {
    name: 'the figure travels with the sentence rather than being read a second time',
    actual: () => outageRecoveryLine(75, 'full', true)?.percent,
    expected: 75,
  },
  {
    name: 'a withheld percentage is no line at all, on either surface',
    // `outageRecoveryPercent` answers null for a rounded zero; „0 %" over a zero-width meter
    // would read as „never".
    actual: () =>
      `${outageRecoveryLine(null, 'compact', false)} ${outageRecoveryLine(null, 'full', false)}`,
    expected: 'null null',
  },
  {
    name: 'both keys this function can name resolve in all six locales',
    // The key literals moved out of the `t()` call and into this file, so a grep over the
    // component no longer finds them and a rename would go unnoticed on both sides. next-intl
    // does not throw on a missing namespace key — it logs MISSING_MESSAGE and renders the raw
    // key, so the failure would ship as the word „recoveryOnly" on a ride page.
    actual: () => {
      const keys = ['recovery', 'recoveryOnly', 'range', 'rangeOpen', 'barNow'];
      const missing = [];
      for (const locale of LOCALES) {
        const messages = readMessages(locale);
        const estimate = messages?.parks?.outage?.estimate ?? {};
        for (const key of keys) {
          if (typeof estimate[key] !== 'string') missing.push(`${locale}.${key}`);
        }
      }
      return missing.length === 0 ? 'all resolve' : missing.join(', ');
    },
    expected: 'all resolve',
  },
  {
    name: 'the percent placeholder is in both probability sentences, in all six locales',
    // A sentence that resolves but drops `{percent}` is a probability line with no probability
    // in it, which no type and no lint rule sees.
    actual: () => {
      const missing = [];
      for (const locale of LOCALES) {
        const estimate = readMessages(locale)?.parks?.outage?.estimate ?? {};
        for (const key of ['recovery', 'recoveryOnly']) {
          if (!String(estimate[key] ?? '').includes('{percent}')) missing.push(`${locale}.${key}`);
        }
      }
      return missing.length === 0 ? 'all carry it' : missing.join(', ');
    },
    expected: 'all carry it',
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
