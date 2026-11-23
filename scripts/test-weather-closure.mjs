/**
 * Unit tests for the weather-closure line's decision (`lib/parks/weather-closure.ts`).
 *
 * An unknown cause or an unreadable temperature says nothing; snow gets its title alone; for cold
 * the outlook picks the sentence, and an outlook that promises a time without sending one falls
 * back to naming the threshold only.
 *
 * Run: pnpm test:weather-closure
 */

import { weatherClosureLine } from '../lib/parks/weather-closure.ts';

const base = {
  cause: 'cold',
  probability: 0.93,
  temperatureC: 1.4,
  thresholdC: 3,
  outlook: 'opens_when_warmer',
  expectedOpenAt: '2026-11-23T12:00:00.000Z',
};

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

test('absent field says nothing', () => weatherClosureLine(undefined), null);
test('null field says nothing', () => weatherClosureLine(null), null);
test('unknown cause says nothing', () => weatherClosureLine({ ...base, cause: 'wind' }), null);
test(
  'unreadable temperature says nothing',
  () => weatherClosureLine({ ...base, temperatureC: null }),
  null
);
test(
  'cold without a threshold says nothing',
  () => weatherClosureLine({ ...base, thresholdC: null }),
  null
);
test(
  'warmer later today names the time',
  () => weatherClosureLine(base),
  JSON.stringify({ title: 'cold', detail: 'opensAt', expectedOpenAt: base.expectedOpenAt })
);
test(
  'no warm hour today says so',
  () => weatherClosureLine({ ...base, outlook: 'likely_closed_today', expectedOpenAt: null }),
  JSON.stringify({ title: 'cold', detail: 'closedToday', expectedOpenAt: null })
);
test(
  'warmer without a time names only the threshold',
  () => weatherClosureLine({ ...base, expectedOpenAt: null }),
  JSON.stringify({ title: 'cold', detail: 'threshold', expectedOpenAt: null })
);
test(
  'an unknown outlook names only the threshold',
  () => weatherClosureLine({ ...base, outlook: 'something_new' }),
  JSON.stringify({ title: 'cold', detail: 'threshold', expectedOpenAt: null })
);
test(
  'snow has a title and no second line',
  () =>
    weatherClosureLine({
      ...base,
      cause: 'snow',
      thresholdC: null,
      outlook: null,
      expectedOpenAt: null,
    }),
  JSON.stringify({ title: 'snow', detail: null, expectedOpenAt: null })
);
test(
  'snow never promises a clock, even if one is sent',
  () => weatherClosureLine({ ...base, cause: 'snow' }),
  JSON.stringify({ title: 'snow', detail: null, expectedOpenAt: null })
);

let passed = 0;
let failed = 0;
for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
    if (result !== null) result = JSON.stringify(result);
  } catch (error) {
    result = `THREW: ${error.message}`;
  }
  if (result === testCase.expected) {
    passed++;
  } else {
    console.log(`FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log(`\nResults: ${passed}/${testCases.length} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
