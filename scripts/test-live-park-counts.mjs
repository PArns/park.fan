// Regression tests for the two "an absent value is not an unknown value" bugs.
//
// 1. findOpenParkCount: `/v1/analytics/geo-live` only carries regions that HAVE an open
//    park, so at 08:00 CEST all of Europe is the single entry `germany: 2`. Reading a
//    missing region as "not loaded yet" left every other country card on the continent
//    page pulsing its skeleton forever, and made the homepage panels keep their
//    server-rendered seed after the live count had fallen to 0.
//
// 2. noLiveWaitTimesReason: a park that publishes wait times only inside its own app
//    must be recognisable, but a response predating the API field — or from an older
//    cache — must keep behaving exactly as before rather than warning about a park
//    that is fine.
import { findOpenParkCount } from '../lib/hooks/use-geo-live-stats.ts';
import {
  noLiveWaitTimesReason,
  hasReadableWaitTimes,
  stripUnreadableWaitStats,
} from '../lib/utils/live-wait-times.ts';

/** What the endpoint actually answers at a quiet European hour. */
const GEO_LIVE = {
  continents: [
    { slug: 'asia', openParkCount: 64, countries: [{ slug: 'china', openParkCount: 64 }] },
    { slug: 'europe', openParkCount: 2, countries: [{ slug: 'germany', openParkCount: 2 }] },
  ],
};

const testCases = [
  // ---- findOpenParkCount ----
  {
    name: 'no data yet → undefined (the skeleton state)',
    actual: () => findOpenParkCount(undefined, 'europe', 'germany'),
    expected: undefined,
  },
  {
    name: 'a listed country returns its live count',
    actual: () => findOpenParkCount(GEO_LIVE, 'europe', 'germany'),
    expected: 2,
  },
  {
    name: 'a country absent from a loaded response has zero open parks, not "unknown"',
    actual: () => findOpenParkCount(GEO_LIVE, 'europe', 'france'),
    expected: 0,
  },
  {
    name: 'a continent absent from a loaded response is zero too',
    actual: () => findOpenParkCount(GEO_LIVE, 'north-america'),
    expected: 0,
  },
  {
    name: 'a country in an absent continent is zero, not undefined',
    actual: () => findOpenParkCount(GEO_LIVE, 'north-america', 'united-states'),
    expected: 0,
  },
  {
    name: 'a listed continent returns its own count',
    actual: () => findOpenParkCount(GEO_LIVE, 'asia'),
    expected: 64,
  },

  // ---- noLiveWaitTimesReason ----
  {
    name: 'an unreadable park reports its reason',
    actual: () =>
      noLiveWaitTimesReason({ liveWaitTimes: { available: false, reason: 'in_park_app_only' } }),
    expected: 'in_park_app_only',
  },
  {
    name: 'a readable park reports null',
    actual: () => noLiveWaitTimesReason({ liveWaitTimes: { available: true, reason: null } }),
    expected: null,
  },
  {
    name: 'a response predating the API field reads as readable',
    actual: () => noLiveWaitTimesReason({ name: 'Europa-Park' }),
    expected: null,
  },
  {
    name: 'unavailable with no reason falls back to not_published rather than null',
    actual: () => noLiveWaitTimesReason({ liveWaitTimes: { available: false, reason: null } }),
    expected: 'not_published',
  },
  {
    name: 'a missing park is readable (nothing to warn about)',
    actual: () => hasReadableWaitTimes(undefined),
    expected: true,
  },

  // ---- stripUnreadableWaitStats ----
  {
    name: 'an unreadable park loses its analytics and open-count',
    actual: () =>
      JSON.stringify(
        stripUnreadableWaitStats({
          slug: 'hansa-park',
          totalAttractions: 82,
          operatingAttractions: 0,
          analytics: { avgWaitTime: 0, crowdLevel: 'unknown' },
          liveWaitTimes: { available: false, reason: 'in_park_app_only' },
        })
      ),
    expected: JSON.stringify({
      slug: 'hansa-park',
      totalAttractions: 82,
      liveWaitTimes: { available: false, reason: 'in_park_app_only' },
    }),
  },
  {
    name: 'a readable park is returned untouched',
    actual: () => {
      const park = {
        slug: 'europa-park',
        operatingAttractions: 91,
        analytics: { avgWaitTime: 25 },
      };
      return stripUnreadableWaitStats(park) === park;
    },
    expected: true,
  },
];

console.log('🧪 Testing live park counts & wait-time availability\n');
console.log('='.repeat(80) + '\n');

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
