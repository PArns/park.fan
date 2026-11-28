/**
 * Unit tests for the weather-closure line's decision (`lib/parks/weather-closure.ts`).
 *
 * An unknown cause or an unreadable temperature says nothing; snow gets its title (with the
 * temperature) and no second line; for cold the outlook picks the sentence, and an outlook that
 * promises a time without sending one falls back to naming the threshold only. The threshold rounds
 * up, and a current temperature that would round to it keeps a decimal, so the line never names the
 * same figure twice.
 *
 * Run: pnpm test:weather-closure
 */

import { weatherClosureLine, weatherClosureTemps } from '../lib/parks/weather-closure.ts';
import { runCases } from './lib/run-cases.mjs';

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

const temps = weatherClosureTemps;
test(
  'a whole degree below the threshold stays whole',
  () => temps(1.4, 3, 'C', 'de'),
  JSON.stringify({ temp: '1 °C', threshold: '3 °C' })
);
test(
  'a reading that would round to the threshold keeps a decimal',
  () => temps(3.6, 4, 'C', 'de'),
  JSON.stringify({ temp: '3,6 °C', threshold: '4 °C' })
);
test(
  'the decimal rounds down, so it never reaches the threshold',
  () => temps(3.96, 4, 'C', 'en'),
  JSON.stringify({ temp: '3.9 °C', threshold: '4 °C' })
);
test(
  'a negative threshold rounds up',
  () => temps(-4, -1.5, 'C', 'de'),
  JSON.stringify({ temp: '-4 °C', threshold: '-1 °C' })
);
test(
  'the threshold rounds up in °F too',
  () => temps(1.4, 3, 'F', 'en'),
  JSON.stringify({ temp: '35 °F', threshold: '38 °F' })
);
test(
  'snow has no threshold',
  () => temps(-1.2, null, 'C', 'de'),
  JSON.stringify({ temp: '-1 °C', threshold: null })
);

// A case expects the serialised reading, and `null` for none.
await runCases(testCases, {
  quiet: true,
  same: (result, expected) => (result === null ? null : JSON.stringify(result)) === expected,
});
