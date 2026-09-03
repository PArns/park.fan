// Regression tests for the one distinction the stats fetchers have to make:
// "the API answered, and the answer is no" versus "we never got an answer".
//
// The bug this guards against: both used to return `null` for either, and the route
// handler turns `null` into a 404 cached for an hour plus six of stale-while-revalidate.
// So a backend blip was stored at the edge as a settled fact about the park. Measured on
// 2026-09-03 — Phantasialand's stats served as {"error":"Stats not available"} from the
// CDN in 158 ms (too fast to have retried at all) while the API answered every request
// with 200 and 3.3 KB.
//
// Note the case that is NOT a miss: a park with thin history gets a 200 with an aggregate
// to match, so `null` never meant "too little history", however the route read it.
import { getParkHistoricalStats, getParkHourlyProfile } from '../lib/api/stats.ts';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Swap global fetch for the duration of one case. */
async function withFetch(impl, run) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

/** Runs `fn`, returning 'threw' instead of propagating — the outcome IS the assertion. */
const outcome = async (fn) => {
  try {
    const value = await fn();
    return value === null ? 'null' : 'data';
  } catch {
    return 'threw';
  }
};

const park = ['europe', 'germany', 'bruehl', 'phantasialand'];

const testCases = [
  {
    name: 'stats: a 200 is returned as data',
    run: () =>
      withFetch(
        async () => json({ byMonth: [], topAttractions: [] }),
        () => outcome(() => getParkHistoricalStats(...park))
      ),
    expected: 'data',
  },
  {
    name: 'stats: a 404 is the settled miss — null, and no retrying',
    run: () =>
      withFetch(
        async () => json({ message: 'Park not found' }, 404),
        () => outcome(() => getParkHistoricalStats(...park))
      ),
    expected: 'null',
  },
  {
    name: 'stats: an unreachable backend THROWS rather than reporting a miss',
    run: () =>
      withFetch(
        async () => {
          throw new TypeError('fetch failed');
        },
        () => outcome(() => getParkHistoricalStats(...park))
      ),
    expected: 'threw',
  },
  {
    name: 'stats: a 502 through every attempt throws — this is the deploy-window case',
    run: () =>
      withFetch(
        async () => json({ error: 'bad gateway' }, 502),
        () => outcome(() => getParkHistoricalStats(...park))
      ),
    expected: 'threw',
  },
  {
    name: 'stats: a 503 that recovers still returns data',
    run: () => {
      let attempt = 0;
      return withFetch(
        async () => (++attempt === 1 ? json({}, 503) : json({ byMonth: [] })),
        () => outcome(() => getParkHistoricalStats(...park))
      );
    },
    expected: 'data',
  },
  {
    name: 'hourly profile: a 404 is the settled miss',
    run: () =>
      withFetch(
        async () => json({ message: 'not found' }, 404),
        () => outcome(() => getParkHourlyProfile(...park))
      ),
    expected: 'null',
  },
  {
    name: 'hourly profile: a 500 throws rather than reporting a miss',
    run: () =>
      withFetch(
        async () => json({ error: 'boom' }, 500),
        () => outcome(() => getParkHourlyProfile(...park))
      ),
    expected: 'threw',
  },
  {
    name: 'hourly profile: a network error throws',
    run: () =>
      withFetch(
        async () => {
          throw new TypeError('fetch failed');
        },
        () => outcome(() => getParkHourlyProfile(...park))
      ),
    expected: 'threw',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = await testCase.run();
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
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
