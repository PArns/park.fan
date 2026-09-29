/**
 * A park whose feed has been silent for 30 days gets `null` wait aggregates from the API.
 * `buildParkFaqItems` must not print them: the wait-times answer falls back to the no-data one.
 *
 * Run: `pnpm test:park-null-wait-stats`
 */
import assert from 'node:assert/strict';
import { buildParkFaqItems } from '../lib/faq/park-faq.ts';

const t = (key, args) => (key === 'waitTimesA' ? `avg=${args.avg} peak=${args.peak}` : key);
const tGeo = (key) => key;

const park = (statistics) => ({
  name: 'Test Park',
  slug: 'test-park',
  timezone: 'UTC',
  analytics: { statistics },
});
const waitAnswer = (statistics) =>
  buildParkFaqItems(park(statistics), 'en', t, tGeo, null).find((i) => i.question === 'waitTimesQ')
    ?.answer;

const base = { operatingAttractions: 12, totalAttractions: 40, peakWaitToday: 60 };

assert.equal(waitAnswer({ ...base, avgWaitToday: 25 }), 'avg=25 peak=60', 'readable feed');
assert.equal(
  waitAnswer({ ...base, avgWaitToday: null, peakWaitToday: null }),
  'waitTimesNoDataA',
  'silent feed falls back to the no-data answer'
);
console.log('✓ park-null-wait-stats');
